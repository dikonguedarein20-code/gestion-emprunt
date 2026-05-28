import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Wrench, Search, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import type { Breakdown, Material, Employee } from '../../types/database';

interface BreakdownWithDetails extends Breakdown {
  materials?: Material;
  employees?: Employee;
}

export default function BreakdownsPage() {
  const [breakdowns, setBreakdowns] = useState<BreakdownWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const { showToast } = useToast();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchBreakdowns();
  }, []);

  const fetchBreakdowns = async () => {
    try {
      const { data, error } = await supabase
        .from('breakdowns')
        .select(`
          *,
          materials!inner(name, code, serial_number),
          employees!inner(first_name, last_name, code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBreakdowns(data || []);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (breakdownId: string, newStatus: 'in_progress' | 'resolved') => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('breakdowns')
        .update(updateData)
        .eq('id', breakdownId);

      if (error) throw error;

      if (newStatus === 'resolved') {
        const breakdown = breakdowns.find(b => b.id === breakdownId);
        if (breakdown) {
          await supabase
            .from('materials')
            .update({ status: 'available' })
            .eq('id', breakdown.material_id);
        }
      }

      showToast(`Panne marquée comme ${newStatus === 'in_progress' ? 'en cours' : 'résolue'}`, 'success');
      fetchBreakdowns();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const filteredBreakdowns = breakdowns.filter((breakdown) => {
    const employee = breakdown.employees as Employee;
    const material = breakdown.materials as Material;
    const matchesSearch =
      employee.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      breakdown.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || breakdown.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedBreakdowns = filteredBreakdowns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredBreakdowns.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      reported: 'bg-red-500/20 text-red-400 border-red-500/30',
      in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400';
  };

  const formatStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      reported: 'Signalé',
      in_progress: 'En cours',
      resolved: 'Résolu',
    };
    return labels[status] || status;
  };

  if (loading && breakdowns.length === 0) {
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
          <h1 className="text-3xl font-bold text-white mb-2">Signalements de pannes</h1>
          <p className="text-white/60">Gérez les problèmes matériels et le statut des réparations.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher des pannes..."
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
            <option value="reported">Signalé</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Résolu</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50 border-b border-white/10">
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Matériel</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Signalé par</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Description</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Date</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Statut</th>
                  <th className="text-right py-4 px-6 text-white/60 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBreakdowns.map((breakdown) => {
                  const material = breakdown.materials as Material;
                  const employee = breakdown.employees as Employee;

                  return (
                    <tr key={breakdown.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <div className="text-white font-medium">{material.name}</div>
                            <div className="text-white/40 text-sm">{material.code} | {material.serial_number}</div>
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
                        <div className="text-white/70 max-w-xs truncate">{breakdown.description}</div>
                      </td>
                      <td className="py-4 px-6 text-white/70">
                        {new Date(breakdown.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(breakdown.status)}`}>
                          {formatStatusLabel(breakdown.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {breakdown.status === 'reported' && (
                            <button
                              onClick={() => handleStatusUpdate(breakdown.id, 'in_progress')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm"
                            >
                              <Wrench className="w-4 h-4" />
                              Démarrer la réparation
                            </button>
                          )}
                          {breakdown.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusUpdate(breakdown.id, 'resolved')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Marquer comme résolu
                            </button>
                          )}
                          {breakdown.status === 'resolved' && (
                            <span className="text-white/40 text-sm">Terminé</span>
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
                {Math.min(currentPage * itemsPerPage, filteredBreakdowns.length)} sur{' '}
                {filteredBreakdowns.length}
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
