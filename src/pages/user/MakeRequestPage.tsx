import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { FileText, Send, Package, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useUi } from '../../contexts/UiContext';
import type { Employee, Material } from '../../types/database';

export default function MakeRequestPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useUi();

  const [formData, setFormData] = useState({
    material_id: '',
    employee_id: '',
    quantity: 1,
    borrow_date: new Date().toISOString().split('T')[0],
    return_date: '',
  });

  useEffect(() => {
    fetchMaterials();
    fetchEmployees();
  }, [user]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'available')
        .gt('available_quantity', 0)
        .order('name', { ascending: true });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      if (!user) {
        setEmployees([]);
        setSelectedEmployeeId('');
        return;
      }

      const currentEmployee = user;
      setEmployees([currentEmployee]);
      setSelectedEmployeeId(currentEmployee.id);
      setFormData((prev) => ({ ...prev, employee_id: currentEmployee.id }));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const material = materials.find(m => m.id === formData.material_id);

      if (!material) {
        showToast('Veuillez sélectionner un matériel', 'error');
        setSubmitting(false);
        return;
      }

      if (formData.quantity > material.available_quantity) {
        showToast(`Seulement ${material.available_quantity} articles disponibles`, 'error');
        setSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('loans')
        .insert([{
          material_id: formData.material_id,
          employee_id: formData.employee_id || selectedEmployeeId || user.id,
          quantity: formData.quantity,
          borrow_date: formData.borrow_date,
          return_date: formData.return_date || null,
          status: 'pending',
        }]);

      if (error) throw error;

      showToast('Demande de prêt envoyée avec succès', 'success');
      setFormData({
        material_id: '',
        employee_id: user.id,
        quantity: 1,
        borrow_date: new Date().toISOString().split('T')[0],
        return_date: '',
      });
      setSelectedEmployeeId(user.id);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMaterial = materials.find(m => m.id === formData.material_id);

  if (loading) {
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
          <h1 className="text-3xl font-bold text-white mb-2">{t('makeRequest')}</h1>
          <p className="text-white/60">{t('fillDetails')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{t('loanRequestForm')}</h2>
                  <p className="text-white/60 text-sm">{t('fillDetails')}</p>
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
                      setFormData({ ...formData, employee_id: e.target.value });
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-400 transition-colors"
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
                    <p className="text-white/40 text-sm mt-2">{t('noRegisteredEmployees')}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    {t('selectMaterial')}
                  </label>
                  <select
                    value={formData.material_id}
                    onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-400 transition-colors"
                    required
                  >
                    <option value="">{t('chooseMaterial')}</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id} className="bg-slate-800">
                        {material.name} ({material.available_quantity} disponibles)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    {t('quantity')}
                  </label>
                  <input
                    type="number"
                    value={formData.quantity === 0 ? '' : formData.quantity}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setFormData({ ...formData, quantity: 0 });
                        return;
                      }
                      const value = parseInt(raw, 10);
                      if (Number.isNaN(value)) return;
                      setFormData({ ...formData, quantity: value });
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition-colors"
                    min="1"
                    max={selectedMaterial ? selectedMaterial.available_quantity : undefined}
                    disabled={!selectedMaterial}
                    required
                  />
                  {selectedMaterial && (
                    <p className="text-white/40 text-sm mt-2">
                      Quantité maximale disponible : {selectedMaterial.available_quantity}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-white/80 text-sm font-medium mb-2">
                      <Calendar className="w-4 h-4" />
                      {t('borrowDate')}
                    </label>
                    <input
                      type="date"
                      value={formData.borrow_date}
                      onChange={(e) => setFormData({ ...formData, borrow_date: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-400 transition-colors"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-white/80 text-sm font-medium mb-2">
                      <Calendar className="w-4 h-4" />
                      {t('expectedReturnDate')}
                    </label>
                    <input
                      type="date"
                      value={formData.return_date}
                      onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-400 transition-colors"
                      min={formData.borrow_date}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || materials.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('loggingIn')}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t('submitRequest')}
                    </>
                  )}
                </button>

                {materials.length === 0 && (
                  <p className="text-amber-400 text-sm text-center">
                    Aucun matériel disponible à l’emprunt pour le moment.
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-4">{t('registeredEmployees')}</h3>
              {employees.length > 0 ? (
                <ul className="space-y-3">
                  {employees.map((employee) => (
                    <li key={employee.id} className="bg-slate-900/60 rounded-xl p-4">
                      <p className="text-white font-medium">{employee.first_name} {employee.last_name}</p>
                      <p className="text-white/40 text-sm">{employee.code} · {employee.email}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/60 text-sm">{t('noRegisteredEmployees')}</p>
              )}
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-4">Votre profil</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-white/40 text-sm">Code employé</p>
                  <p className="text-white font-medium">{user?.code}</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm">Nom</p>
                  <p className="text-white font-medium">{user?.first_name} {user?.last_name}</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm">Email</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
              <h3 className="text-amber-400 font-semibold mb-2">Important</h3>
              <ul className="text-white/60 text-sm space-y-2">
                <li>Les demandes nécessitent l’approbation de l’administrateur</li>
                <li>Retournez les matériels à temps pour éviter les pénalités</li>
                <li>Signalez immédiatement tout dommage</li>
              </ul>
            </div>

            <Link
              to="/user"
              className="block bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-emerald-400/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-white font-medium">Voir les matériels disponibles</p>
                  <p className="text-white/40 text-sm">Parcourez tout l’équipement</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
