import { useState, useEffect } from 'react';
import UserLayout from '../../components/UserLayout';
import { Wrench, Send, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useUi } from '../../contexts/UiContext';
import type { Employee, Material } from '../../types/database';

export default function ReportBreakdownPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasEligibleLoan, setHasEligibleLoan] = useState(false);
  const [loanChecking, setLoanChecking] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useUi();

  const [formData, setFormData] = useState({
    material_id: '',
    description: '',
    reported_by: '',
  });

  useEffect(() => {
    fetchMaterials();
    fetchEmployees();
    fetchUserLoanStatus();
  }, [user]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLoanStatus = async () => {
    try {
      if (!user) {
        setHasEligibleLoan(false);
        return;
      }

      const { data, error } = await supabase
        .from('loans')
        .select('id')
        .eq('employee_id', user.id)
        .eq('status', 'approved')
        .limit(1);

      if (error) throw error;
      setHasEligibleLoan((data?.length ?? 0) > 0);
    } catch (error) {
      console.error('Error fetching loan status:', error);
      setHasEligibleLoan(false);
    } finally {
      setLoanChecking(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      if (!user) {
        setEmployees([]);
        setSelectedEmployeeId('');
        return;
      }

      setEmployees([user]);
      setSelectedEmployeeId(user.id);
      setFormData((prev) => ({ ...prev, reported_by: user.id }));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!hasEligibleLoan) {
      showToast(t('reportWithoutLoanError'), 'error');
      return;
    }

    setSubmitting(true);

    try {
      const material = materials.find(m => m.id === formData.material_id);

      if (!material) {
        showToast(t('selectMaterialError'), 'error');
        setSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('breakdowns')
        .insert([{
          material_id: formData.material_id,
          description: formData.description,
          reported_by: formData.reported_by || selectedEmployeeId || user.id,
          status: 'reported',
        }]);

      if (error) throw error;

      await supabase
        .from('materials')
        .update({ status: 'broken' })
        .eq('id', formData.material_id);

      showToast(t('breakdownReportedSuccess'), 'success');
      setFormData({
        material_id: '',
        description: '',
        reported_by: user.id,
      });
      setSelectedEmployeeId(user.id);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loanChecking) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('reportBreakdown')}</h1>
          <p className="text-white/60">{t('reportBreakdownDescription')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{t('reportBreakdown')}</h2>
                  <p className="text-white/60 text-sm">{t('describeProblem')}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    {t('selectEmployee')}
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => {
                      setSelectedEmployeeId(e.target.value);
                      setFormData({ ...formData, reported_by: e.target.value });
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-400 transition-colors"
                    required
                  >
                    <option value="">{t('chooseEmployee')}</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id} className="bg-slate-800">
                        {employee.first_name} {employee.last_name} ({employee.code})
                      </option>
                    ))}
                  </select>
                  {employees.length === 0 && (
                    <p className="text-white/60 text-sm mt-2">{t('noRegisteredEmployees')}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    {t('selectMaterial')}
                  </label>
                  <select
                    value={formData.material_id}
                    onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-400 transition-colors"
                    required
                  >
                    <option value="">Choisissez le matériel...</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id} className="bg-slate-800">
                        {material.name} ({material.code}) - {material.serial_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    N° de série
                  </label>
                  <input
                    type="text"
                    value={materials.find(m => m.id === formData.material_id)?.serial_number || ''}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 focus:outline-none transition-colors"
                    readOnly
                    placeholder="Sera rempli automatiquement"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    {t('breakdownDescription')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-400 transition-colors resize-none"
                    placeholder={t('describeProblemPlaceholder')}
                    rows={6}
                    required
                  />
                </div>

                {!hasEligibleLoan && (
                  <div className="rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-yellow-100">
                    {t('loanRequiredToReport')}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !hasEligibleLoan}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/30 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('loggingIn')}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t('submitBreakdown')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-red-400 font-semibold">{t('important')}</h3>
              </div>
              <ul className="text-white/60 text-sm space-y-2">
                <li>{t('breakdownTipAccurate')}</li>
                <li>{t('breakdownTipErrors')}</li>
                <li>{t('breakdownTipNoRepair')}</li>
                <li>{t('breakdownTipStatusBroken')}</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-4">{t('yourInformation')}</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-white/40 text-sm">{t('reporter')}</p>
                  <p className="text-white font-medium">{user?.first_name} {user?.last_name}</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm">{t('employeeCode')}</p>
                  <p className="text-white font-medium">{user?.code}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-4">{t('whatHappensNext')}</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-white text-sm">{t('reportSubmitted')}</p>
                    <p className="text-white/40 text-xs">{t('adminsNotified')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-white text-sm">{t('underReview')}</p>
                    <p className="text-white/40 text-xs">{t('technicianAssigned')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-white text-sm">{t('issueResolved')}</p>
                    <p className="text-white/40 text-xs">{t('equipmentBackInService')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
