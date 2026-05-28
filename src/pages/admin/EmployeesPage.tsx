import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Plus, Edit2, Trash2, Search, X, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Employee } from '../../types/database';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    is_admin: false,
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      is_admin: false,
    });
    setEditingEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingEmployee) {
        const updatePayload: Partial<typeof formData> = {
          code: formData.code,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          is_admin: formData.is_admin,
        };

        const { error } = await supabase
          .from('employees')
          .update(updatePayload)
          .eq('id', editingEmployee.id);

        if (error) throw error;
        showToast('Employé mis à jour avec succès', 'success');
      } else {
        let authUserId: string | null = null;

        if (formData.password) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
          });

          if (authError) {
            throw authError;
          }

          authUserId = authData.user?.id ?? null;
        }

        const { error } = await supabase
          .from('employees')
          .insert([{
            code: formData.code,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            is_admin: formData.is_admin,
            user_id: authUserId,
          }]);

        if (error) throw error;
        showToast('Employé ajouté avec succès', 'success');
      }

      setShowModal(false);
      resetForm();
      fetchEmployees();
    } catch (error: any) {
      showToast(error.message, 'error');
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      code: employee.code,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      password: '',
      is_admin: employee.is_admin,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Employé supprimé avec succès', 'success');
      setShowDeleteConfirm(null);
      fetchEmployees();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  if (loading && employees.length === 0) {
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
            <h1 className="text-3xl font-bold text-white mb-2">Employés</h1>
            <p className="text-white/60">Gérez les membres de votre équipe et leurs permissions.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Ajouter un employé
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher des employés..."
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
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Email</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Téléphone</th>
                  <th className="text-left py-4 px-6 text-white/60 text-sm font-medium">Rôle</th>
                  <th className="text-right py-4 px-6 text-white/60 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-mono">
                        {employee.code}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                          {employee.first_name[0]}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {employee.first_name} {employee.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-white/70">{employee.email}</td>
                    <td className="py-4 px-6 text-white/70">{employee.phone}</td>
                    <td className="py-4 px-6">
                      {employee.is_admin ? (
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium">
                          Admin
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-lg text-sm font-medium">
                          Employee
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(employee.id)}
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
                {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} sur{' '}
                {filteredEmployees.length}
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
            <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8 animate-scale-in">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {editingEmployee ? 'Modifier l’employé' : 'Ajouter un employé'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Code employé</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="EMP001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Prénom</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="John"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Nom de famille</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Mot de passe</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder={editingEmployee ? 'Laisser vide pour ne pas modifier' : 'password123'}
                    required={!editingEmployee}
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="+1 234 567 890"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    id="is_admin"
                    checked={formData.is_admin}
                    onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <label htmlFor="is_admin" className="text-white/80">
                    Privilèges administrateur
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transform hover:scale-[1.02] transition-all duration-300"
                >
                  {editingEmployee ? 'Modifier l’employé' : 'Ajouter un employé'}
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
              <h3 className="text-xl font-bold text-white mb-2">Supprimer l’employé ?</h3>
              <p className="text-white/60 mb-6">Cette action est irréversible. Voulez-vous vraiment supprimer cet employé ?</p>
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
