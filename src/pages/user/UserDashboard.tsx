import { useState, useEffect } from 'react';
import UserLayout from '../../components/UserLayout';
import { Package, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useUi } from '../../contexts/UiContext';
import type { Loan, Material } from '../../types/database';

export default function UserDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [notifications, setNotifications] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchMaterials();
    fetchNotifications();
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

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('employee_id', user.id)
        .in('status', ['approved', 'rejected'])
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const filteredMaterials = materials.filter(
    (mat) =>
      mat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const { t } = useUi();

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
          <h1 className="text-3xl font-bold text-white mb-2">{t('availableMaterials')}</h1>
          <p className="text-white/60">{t('browseAvailableMaterials')}</p>
        </div>

        {notifications.length > 0 && (
          <div className="mb-8 grid gap-4 lg:grid-cols-2">
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
                <p className="text-white font-semibold mb-2">{notification.status === 'approved' ? t('loanApprovedNotificationTitle') : t('loanRejectedNotificationTitle')}</p>
                <p className="text-white/60 text-sm mb-3">
                  {notification.notes || (notification.status === 'approved' ? t('loanApprovedNotificationText') : t('loanRejectedNotificationText'))}
                </p>
                <p className="text-white/40 text-xs">{notification.updated_at}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder={t('searchMaterials')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-emerald-400/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg mb-1 truncate">{material.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-mono">
                      {material.code}
                    </span>
                    <span className="text-white/40 text-sm">N° de série : {material.serial_number}</span>
                  </div>
                </div>
              </div>

              {material.description && (
                <p className="text-white/60 text-sm mb-4 line-clamp-2">{material.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  <p className="text-white/40 text-xs">Disponible</p>
                  <p className="text-emerald-400 text-xl font-bold">{material.available_quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs">Total</p>
                  <p className="text-white/80 text-xl font-bold">{material.quantity}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {paginatedMaterials.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">{t('noMaterialsFound')}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('previous')}
            </button>
            <span className="text-white/60 text-sm px-4">
              {t('pageOf').replace('{current}', String(currentPage)).replace('{total}', String(totalPages))}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
