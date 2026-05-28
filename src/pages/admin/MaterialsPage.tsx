import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Plus, Edit2, Trash2, Search, X, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import type { Material } from '../../types/database';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    serial_number: '',
    name: '',
    description: '',
    quantity: 1,
    available_quantity: 1,
    acquisition_date: new Date().toISOString().split('T')[0],
    status: 'available' as 'available' | 'borrowed' | 'broken',
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      serial_number: '',
      name: '',
      description: '',
      quantity: 1,
      available_quantity: 1,
      acquisition_date: new Date().toISOString().split('T')[0],
      status: 'available',
    });
    setEditingMaterial(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingMaterial) {
        const { error } = await supabase
          .from('materials')
          .update(formData)
          .eq('id', editingMaterial.id);

        if (error) throw error;
        showToast('Matériel mis à jour avec succès', 'success');
      } else {
        const { error } = await supabase
          .from('materials')
          .insert([formData]);

        if (error) throw error;
        showToast('Matériel ajouté avec succès', 'success');
      }

      setShowModal(false);
      resetForm();
      fetchMaterials();
    } catch (error: any) {
      showToast(error.message, 'error');
      setLoading(false);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      code: material.code,
      serial_number: material.serial_number,
      name: material.name,
      description: material.description || '',
      quantity: material.quantity,
      available_quantity: material.available_quantity,
      acquisition_date: material.acquisition_date,
      status: material.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Matériel supprimé avec succès', 'success');
      setShowDeleteConfirm(null);
      fetchMaterials();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const filteredMaterials = materials.filter(
    (mat) =>
      mat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.serial_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      borrowed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      broken: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400';
  };

  const formatStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Disponible',
      borrowed: 'Emprunté',
      broken: 'Défectueux',
    };
    return labels[status] || status;
  };

  if (loading && materials.length === 0) {
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Matériels</h1>
            <p className="text-white/60">Gérez votre inventaire et vos équipements.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Ajouter du matériel
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher du matériel..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50 border-b border-white/10">
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Code</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Nom</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">N° de série</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Quantité</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Disponible</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Statut</th>
                  <th className="text-right py-4 px-6 text-white/60 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMaterials.map((material) => (
                  <tr key={material.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-mono">
                        {material.code}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{material.name}</div>
                          {material.description && (
                            <div className="text-white/40 text-sm truncate max-w-xs">{material.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-white/70 font-mono text-sm">{material.serial_number}</td>
                    <td className="py-4 px-6">
                      <span className="text-white font-medium">{material.quantity}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white font-medium">{material.available_quantity}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(material.status)}`}>
                        {formatStatusLabel(material.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(material.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <div className="text-white/60 text-sm">
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
                {Math.min(currentPage * itemsPerPage, filteredMaterials.length)} sur{' '}
                {filteredMaterials.length}
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

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {editingMaterial ? 'Modifier le matériel' : 'Ajouter du matériel'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Code du matériel</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="MAT001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">N° de série</label>
                    <input
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="SN-12345"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Nom</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="Dell Laptop"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                    placeholder="Détails supplémentaires..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Quantité totale</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData((prev) => ({
                          ...prev,
                          quantity: value,
                          available_quantity: editingMaterial ? prev.available_quantity : value,
                        }));
                      }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Quantité disponible</label>
                    <input
                      type="number"
                      value={formData.available_quantity}
                      onChange={(e) => setFormData({ ...formData, available_quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                      min="0"
                      max={formData.quantity}
                      required
                      disabled={!editingMaterial}
                    />
                    {!editingMaterial && (
                      <p className="text-white/40 text-xs mt-2">La quantité disponible sera égale à la quantité totale pour un nouvel ajout.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Date d’acquisition</label>
                    <input
                      type="date"
                      value={formData.acquisition_date}
                      onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Statut</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-colors"
                      disabled={!editingMaterial}
                    >
                      <option value="available">Disponible</option>
                      <option value="borrowed">Emprunté</option>
                      <option value="broken">Cassé</option>
                    </select>
                    {!editingMaterial && (
                      <p className="text-white/40 text-xs mt-2">Le statut est fixé à Disponible lors de l’ajout.</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transform hover:scale-[1.02] transition-all duration-300"
                >
                  {editingMaterial ? 'Mettre à jour le matériel' : 'Ajouter du matériel'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
            <div className="relative w-full max-w-sm bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8 animate-scale-in text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Supprimer le matériel ?</h3>
              <p className="text-white/60 mb-6">Cette action est irréversible. Voulez-vous vraiment supprimer ce matériel ?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
