'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  municipality?: string;
  address?: string;
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
  loginWithGoogle: (customData?: Partial<CustomerUser>) => Promise<{ success: boolean; error?: string }>;
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

  useEffect(() => {
    // Restaurar sesión de cliente desde localStorage
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
  }, []);

  const saveCustomerSession = (user: CustomerUser | null) => {
    setCustomer(user);
    if (user) {
      localStorage.setItem('aromaniak_customer_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('aromaniak_customer_session');
    }
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // 1. Iniciar Sesión / Registro con Google
  const loginWithGoogle = async (customData?: Partial<CustomerUser>) => {
    try {
      // Si se proveen datos o se usa flujo de Google
      const payload = {
        action: 'google',
        name: customData?.name || 'Usuario Google',
        email: customData?.email || `google.user.${Date.now()}@gmail.com`,
        avatarUrl: customData?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
        googleId: customData?.id || `g_${Date.now()}`,
      };

      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || 'Error al autenticar con Google' };
      }

      saveCustomerSession(data.customer);
      closeAuthModal();
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

  // 4. Cerrar Sesión
  const logout = () => {
    saveCustomerSession(null);
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
