import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUi } from '../contexts/UiContext';
import { type TranslationKey } from '../i18n';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Wrench,
  LogOut,
  HardDrive,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const menuItems: Array<{ path: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; labelKey: TranslationKey }> = [
  { path: '/admin', icon: LayoutDashboard, labelKey: 'dashboard' },
  { path: '/admin/employees', icon: Users, labelKey: 'employees' },
  { path: '/admin/materials', icon: Package, labelKey: 'materials' },
  { path: '/admin/loans', icon: FileText, labelKey: 'loans' },
  { path: '/admin/breakdowns', icon: Wrench, labelKey: 'breakdowns' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { language, setLanguage, theme, toggleTheme, t } = useUi();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-900/50 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:block`}>
        <div className="p-6">
          <div className="flex items-center justify-between md:hidden mb-4">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                GESTMAT
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              GESTMAT
            </span>
          </Link>
        </div>

        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border border-blue-400/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : ''}`}
                />
                <span className="font-medium">{t(item.labelKey)}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.first_name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-white/50 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between gap-2 text-white/70 text-xs">
              <span>{t('language')}</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}
                className="w-24 px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none"
              >
                <option value="en">{t('english')}</option>
                <option value="fr">{t('french')}</option>
              </select>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full px-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm hover:bg-slate-900 transition-colors"
            >
              {theme === 'dark' ? t('lightTheme') : t('darkTheme')}
            </button>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen md:ml-64 px-4 md:px-8">
        <div className="md:hidden sticky top-0 z-10 flex items-center justify-between gap-4 bg-slate-900/90 border-b border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 text-white hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <span className="text-base font-bold text-white">GESTMAT</span>
          </div>
          <div className="w-10 h-10" />
        </div>
        {children}
      </main>
    </div>
  );
}
