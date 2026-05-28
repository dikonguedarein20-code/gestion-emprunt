import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { UiProvider } from './contexts/UiContext';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeesPage from './pages/admin/EmployeesPage';
import MaterialsPage from './pages/admin/MaterialsPage';
import LoansPage from './pages/admin/LoansPage';
import BreakdownsPage from './pages/admin/BreakdownsPage';
import UserDashboard from './pages/user/UserDashboard';
import MakeRequestPage from './pages/user/MakeRequestPage';
import ReportBreakdownPage from './pages/user/ReportBreakdownPage';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/user" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute adminOnly>
      {children}
    </ProtectedRoute>
  );
}

function UserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={isAdmin ? "/admin" : "/user"} replace /> : <LandingPage />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/employees" element={<AdminRoute><EmployeesPage /></AdminRoute>} />
      <Route path="/admin/materials" element={<AdminRoute><MaterialsPage /></AdminRoute>} />
      <Route path="/admin/loans" element={<AdminRoute><LoansPage /></AdminRoute>} />
      <Route path="/admin/breakdowns" element={<AdminRoute><BreakdownsPage /></AdminRoute>} />
      <Route path="/user" element={<UserRoute><UserDashboard /></UserRoute>} />
      <Route path="/user/request" element={<UserRoute><MakeRequestPage /></UserRoute>} />
      <Route path="/user/report" element={<UserRoute><ReportBreakdownPage /></UserRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <UiProvider>
            <AppRoutes />
          </UiProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
