// src/lib/auth.ts

export type UserRole = 'ADMIN' | 'CASHIER' | 'LOGISTICS';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  pin?: string; // PIN de 4 dígitos para caja
  role: UserRole;
  cashRegister?: string; // Ej: "Caja 1 - Mostrador"
  isActive: boolean;
  createdAt: string;
}

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin',
    name: 'Luis (Gerente General)',
    email: 'gerente@kodelocal.com',
    password: 'admin123',
    pin: '9999',
    role: 'ADMIN',
    cashRegister: 'Todas',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-cajero-1',
    name: 'Ana Martínez (Cajera)',
    email: 'caja1@kodelocal.com',
    password: 'caja123',
    pin: '1234',
    role: 'CASHIER',
    cashRegister: 'Caja 1 - Mostrador Principal',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-cajero-2',
    name: 'Carlos Rivas (Ventas y Cotizaciones)',
    email: 'caja2@kodelocal.com',
    password: 'caja123',
    pin: '4321',
    role: 'CASHIER',
    cashRegister: 'Caja 2 - WhatsApp / Envíos',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-logistica',
    name: 'Marcos Soto (Despachos)',
    email: 'logistica@kodelocal.com',
    password: 'envios123',
    pin: '7777',
    role: 'LOGISTICS',
    cashRegister: 'Bodega Central',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export function getStoredUsers(): UserAccount[] {
  if (typeof window === 'undefined') return INITIAL_USERS;
  const saved = localStorage.getItem('kodelocal_users');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  localStorage.setItem('kodelocal_users', JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
}

export function getActiveUser(): UserAccount | null {
  if (typeof window === 'undefined') return INITIAL_USERS[0];
  const saved = localStorage.getItem('kodelocal_active_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  // Por defecto iniciamos con el Gerente para que el usuario pueda explorar de inmediato
  localStorage.setItem('kodelocal_active_user', JSON.stringify(INITIAL_USERS[0]));
  return INITIAL_USERS[0];
}

export function setActiveUser(user: UserAccount | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('kodelocal_active_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('kodelocal_active_user');
  }
}
