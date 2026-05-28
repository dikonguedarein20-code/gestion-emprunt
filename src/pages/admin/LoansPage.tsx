import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Check, X, Search, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import type { Loan, Material, Employee } from '../../types/database';

interface LoanWithDetails extends Loan {
  materials?: Material;
  employees?: Employee;
}

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const { showToast } = useToast();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          materials!inner(name, code, available_quantity),
          employees!inner(first_name, last_name, code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loan: LoanWithDetails) => {
    try {
      const material = loan.materials as Material;

      if (loan.quantity > material.available_quantity) {
        showToast('Quantité disponible insuffisante', 'error');
        return;
      }

      const { error: loanError } = await supabase
        .from('loans')
        .update({ status: 'approved', notes: 'Votre demande a été approuvée.' })
        .eq('id', loan.id);

      if (loanError) throw loanError;

      const newAvailableQty = material.available_quantity - loan.quantity;
      const { error: materialError } = await supabase
        .from('materials')
        .update({
          available_quantity: newAvailableQty,
          status: newAvailableQty === 0 ? 'borrowed' : 'available',
        })
        .eq('id', loan.material_id);

      if (materialError) throw materialError;

      showToast('Prêt approuvé avec succès', 'success');
      fetchLoans();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleReject = async (loanId: string) => {
    try {
      const { error } = await supabase
        .from('loans')
        .update({ status: 'rejected', notes: 'Votre demande a été rejetée.' })
        .eq('id', loanId);

      if (error) throw error;
      showToast('Prêt rejeté', 'success');
      fetchLoans();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleReturn = async (loan: LoanWithDetails) => {
    try {
      const material = loan.materials as Material;

      const { error: loanError } = await supabase
        .from('loans')
        .update({ status: 'returned', return_date: new Date().toISOString().split('T')[0] })
        .eq('id', loan.id);

      if (loanError) throw loanError;

      const newAvailableQty = material.available_quantity + loan.quantity;
      const { error: materialError } = await supabase
        .from('materials')
        .update({
          available_quantity: newAvailableQty,
          status: 'available',
        })
        .eq('id', loan.material_id);

      if (materialError) throw materialError;

      showToast('Matériel retourné avec succès', 'success');
      fetchLoans();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const filteredLoans = loans.filter((loan) => {
    const employee = loan.employees as Employee;
    const material = loan.materials as Material;
    const matchesSearch =
      employee.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedLoans = filteredLoans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      returned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400';
  };

  const formatStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      returned: 'Retour',
    };
    return labels[status] || status;
  };

  if (loading && loans.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des prêts</h1>
          <p className="text-white/60">Consultez et gérez les prêts de matériel.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher des prêts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvé</option>
            <option value="rejected">Rejeté</option>
            <option value="returned">Retour</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50 border-b border-white/10">
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Matériel</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Employé</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Quantité</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Date de prêt</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Date de retour</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Statut</th>
                  <th className="text-right py-4 px-6 text-white/60 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLoans.map((loan) => {
                  const material = loan.materials as Material;
                  const employee = loan.employees as Employee;

                  return (
                    <tr key={loan.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-white font-medium">{material.name}</div>
                            <div className="text-white/40 text-sm">{material.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-white">
                          {employee.first_name} {employee.last_name}
                        </div>
                        <div className="text-white/40 text-sm">{employee.code}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-white font-medium">{loan.quantity}</span>
                      </td>
                      <td className="py-4 px-6 text-white/70">{loan.borrow_date}</td>
                      <td className="py-4 px-6 text-white/70">{loan.return_date || '-'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(loan.status)}`}>
                          {formatStatusLabel(loan.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {loan.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(loan)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm"
                              >
                                <Check className="w-4 h-4" />
                                Approuver
                              </button>
                              <button
                                onClick={() => handleReject(loan.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                              >
                                <X className="w-4 h-4" />
                                Rejeter
                              </button>
                            </>
                          )}
                          {loan.status === 'approved' && (
                            <button
                              onClick={() => handleReturn(loan)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                            >
                              <Check className="w-4 h-4" />
                              Retourner
                            </button>
                          )}
                          {loan.status !== 'pending' && loan.status !== 'approved' && (
                            <span className="text-white/40 text-sm">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <div className="text-white/60 text-sm">
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
                {Math.min(currentPage * itemsPerPage, filteredLoans.length)} sur{' '}
                {filteredLoans.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
