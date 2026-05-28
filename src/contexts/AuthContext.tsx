import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Employee } from '../types/database';

interface AuthContextType {
  user: Employee | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Credentials for simple authentication
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '12345';
const USER_USERNAME = 'user';
const USER_PASSWORD = '123456';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Employee | null>(() => {
    // Admin session stored separately so we can restore it quickly
    const storedAdmin = localStorage.getItem('gestmat_admin');
    if (storedAdmin === 'true') {
      return {
        id: 'admin-session',
        code: 'ADMIN',
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@gestmat.com',
        phone: '+1 234 567 890',
        user_id: null,
        is_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Prefer a real employee session when available
    const storedEmployee = localStorage.getItem('gestmat_employee');
    if (storedEmployee) {
      try {
        return JSON.parse(storedEmployee);
      } catch {
        return null;
      }
    }

    // Legacy demo session key; ignore invalid placeholder IDs
    const storedUser = localStorage.getItem('gestmat_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id && parsed.id !== 'user-session') {
          return parsed;
        }
      } catch {
        // fallback to null
      }
    }

    return null;
  });
  const [loading] = useState(false);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      // Check for admin login
      if (username.toLowerCase() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const adminUser: Employee = {
          id: 'admin-session',
          code: 'ADMIN',
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@gestmat.com',
          phone: '+1 234 567 890',
          user_id: null,
          is_admin: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(adminUser);
        localStorage.setItem('gestmat_admin', 'true');
        return { error: null };
      }

      // Check for demo user login and map it to a real seeded employee with a valid UUID
      if (username.toLowerCase() === USER_USERNAME && password === USER_PASSWORD) {
        const { data: employee, error: fetchError } = await supabase
          .from('employees')
          .select('*')
          .eq('code', 'EMP001')
          .maybeSingle();

        if (fetchError || !employee) {
          return { error: new Error('Impossible de charger le compte de démonstration') };
        }

        setUser(employee);
        localStorage.setItem('gestmat_employee', JSON.stringify(employee));
        return { error: null };
      }

      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .or(`code.eq.${username},email.eq.${username}`)
        .eq('is_admin', false)
        .maybeSingle();

      if (fetchError || !employee) {
        return { error: new Error('Identifiants invalides') };
      }

      if (!employee.user_id) {
        return { error: new Error('Ce compte n’est pas encore lié à une connexion') };
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: employee.email,
        password,
      });

      if (authError) {
        return { error: new Error('Mot de passe incorrect') };
      }

      setUser(employee);
      localStorage.setItem('gestmat_employee', JSON.stringify(employee));
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('gestmat_admin');
    localStorage.removeItem('gestmat_user');
    localStorage.removeItem('gestmat_employee');
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin: user?.is_admin ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
