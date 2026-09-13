'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  documentType?: string;
  documentNum?: string;
  department?: string;
  municipality?: string;
  address?: string;
  nrc?: string;
  businessName?: string;
  activityDesc?: string;
  avatarUrl?: string;
  authProvider?: 'google' | 'credentials';
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  municipality?: string;
  address?: string;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isDrawerOpen: boolean;
  drawerTab: 'orders' | 'profile';
  openDrawer: (tab?: 'orders' | 'profile') => void;
  closeDrawer: () => void;
  setDrawerTab: (tab: 'orders' | 'profile') => void;
  updateCustomerProfile: (data: Partial<CustomerUser>) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerCustomer: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'orders' | 'profile'>('orders');

  const openDrawer = (tab: 'orders' | 'profile' = 'orders') => {
    setDrawerTab(tab);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const saveCustomerSession = (user: CustomerUser | null) => {
    setCustomer(user);
    if (user) {
      localStorage.setItem('aromaniak_customer_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('aromaniak_customer_session');
    }
  };

  useEffect(() => {
    // 1. Restaurar sesión de cliente desde localStorage
    try {
      const saved = localStorage.getItem('aromaniak_customer_session');
      if (saved) {
        setCustomer(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error restaurando sesión de cliente:', e);
    } finally {
      setIsLoading(false);
    }

    // 2. Escuchar cambios de autenticación de Supabase (OAuth con Google)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        const googleName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Cliente';
        const googleAvatar = u.user_metadata?.avatar_url || u.user_metadata?.picture || '';

        try {
          const res = await fetch('/api/customer/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'google',
              name: googleName,
              email: u.email,
              avatarUrl: googleAvatar,
              googleId: u.id,
            }),
          });
          const data = await res.json();
          if (data.success && data.customer) {
            saveCustomerSession(data.customer);
          }
        } catch (err) {
          console.error('Error sincronizando usuario de Google con BD:', err);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // 1. Iniciar Sesión / Registro con Google (Real OAuth)
  const loginWithGoogle = async () => {
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con Google' };
    }
  };

  // 2. Iniciar Sesión Tradicional
  const loginWithCredentials = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          password: pass,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || 'Credenciales inválidas' };
      }

      saveCustomerSession(data.customer);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al iniciar sesión' };
    }
  };

  // 3. Registro Tradicional con Formulario
  const registerCustomer = async (formData: RegisterData) => {
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          ...formData,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || 'Error al crear la cuenta' };
      }

      saveCustomerSession(data.customer);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al registrar cliente' };
    }
  };

  // 4. Actualizar Perfil / Datos de Facturación
  const updateCustomerProfile = async (data: Partial<CustomerUser>) => {
    if (!customer?.id) return { success: false, error: 'No hay sesión activa' };

    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          customerId: customer.id,
          ...data,
        }),
      });

      const resData = await res.json();
      if (!resData.success) {
        return { success: false, error: resData.error || 'Error al actualizar perfil' };
      }

      saveCustomerSession(resData.customer);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión' };
    }
  };

  // 5. Cerrar Sesión
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error cerrando sesión en Supabase:', e);
    }
    saveCustomerSession(null);
    closeDrawer();
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoggedIn: !!customer,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isDrawerOpen,
        drawerTab,
        openDrawer,
        closeDrawer,
        setDrawerTab,
        updateCustomerProfile,
        loginWithGoogle,
        loginWithCredentials,
        registerCustomer,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
