import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Package, CheckCircle, FileText, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useUi } from '../../contexts/UiContext';
import type { Material, Loan, Employee } from '../../types/database';

interface Stats {
  totalMaterials: number;
  availableMaterials: number;
  borrowedMaterials: number;
  brokenMaterials: number;
  totalEmployees: number;
  activeLoans: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalMaterials: 0,
    availableMaterials: 0,
    borrowedMaterials: 0,
    brokenMaterials: 0,
    totalEmployees: 0,
    activeLoans: 0,
  });
  const [recentLoans, setRecentLoans] = useState<(Loan & { materials?: Material; employees?: Employee })[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useUi();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch materials stats
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('status, quantity');

      if (materialsError) throw materialsError;

      const totalMaterials = materials?.reduce((sum, m) => sum + m.quantity, 0) || 0;
      const availableMaterials = materials?.filter(m => m.status === 'available').length || 0;
      const borrowedMaterials = materials?.filter(m => m.status === 'borrowed').length || 0;
      const brokenMaterials = materials?.filter(m => m.status === 'broken').length || 0;

      // Fetch employees count
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Fetch active loans
      const { count: activeLoans } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'approved']);

      // Fetch recent loans with details
      const { data: loans } = await supabase
        .from('loans')
        .select(`
          *,
          materials!inner(name, code),
          employees!inner(first_name, last_name, code)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalMaterials,
        availableMaterials,
        borrowedMaterials,
        brokenMaterials,
        totalEmployees: totalEmployees || 0,
        activeLoans: activeLoans || 0,
      });

      setRecentLoans(loans || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: t('availableMaterials'), value: stats.availableMaterials, color: '#10B981' },
    { name: t('borrowed'), value: stats.borrowedMaterials, color: '#F59E0B' },
    { name: t('breakdowns'), value: stats.brokenMaterials, color: '#EF4444' },
  ];

  const statCards = [
    {
      label: 'Total du matériel',
      value: stats.totalMaterials,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/30',
    },
    {
      label: 'Disponible',
      value: stats.availableMaterials,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/30',
    },
    {
      label: 'Emprunté',
      value: stats.borrowedMaterials,
      icon: FileText,
      gradient: 'from-amber-500 to-amber-600',
      shadowColor: 'shadow-amber-500/30',
    },
    {
      label: 'Défectueux',
      value: stats.brokenMaterials,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-red-600',
      shadowColor: 'shadow-red-500/30',
    },
  ];

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

  if (loading) {
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
          <h1 className="text-3xl font-bold text-white mb-2">{t('dashboard')}</h1>
          <p className="text-white/60">{t('welcomeBack')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} ${card.shadowColor} shadow-lg`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
                <div className="text-white/60 text-sm">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-white/60">{t('totalEmployees')}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalEmployees}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className="text-white/60">{t('activeLoans')}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.activeLoans}</div>
          </div>
        </div>

        {/* Chart and Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6">{t('materialDistribution')}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#fff' }}
                    formatter={(value) => <span className="text-white/80">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Loans Table */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{t('recentLoans')}</h2>
              <Link
                to="/admin/loans"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                {t('viewAll')}
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Matériel</th>
                    <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Employé</th>
                    <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLoans.map((loan) => (
                    <tr key={loan.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{(loan.materials as Material)?.name}</div>
                        <div className="text-white/40 text-sm">{(loan.materials as Material)?.code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white">
                          {(loan.employees as Employee)?.first_name} {(loan.employees as Employee)?.last_name}
                        </div>
                        <div className="text-white/40 text-sm">{(loan.employees as Employee)?.code}</div>
                      </td>
                      <td className="py-3 px-4 text-white/60">{loan.borrow_date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(loan.status)}`}>
                          {formatStatusLabel(loan.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
