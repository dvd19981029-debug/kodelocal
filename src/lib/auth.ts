// src/lib/auth.ts

export type UserRole = string;

export interface SystemView {
  id: string;
  name: string;
  path: string;
  tag: string;
  description: string;
}

export const SYSTEM_VIEWS: SystemView[] = [
  { id: 'pos', name: 'Punto de Venta', path: '/pos', tag: 'Ventas', description: 'Cotizador rápido y ventas de mostrador' },
  { id: 'bodega', name: 'Bodega & Comandas', path: '/bodega', tag: 'Bodega', description: 'Preparación de fragancias por puesto (A1) sin ver dinero' },
  { id: 'inventario', name: 'Inventario & Stock', path: '/inventario', tag: 'Stock', description: 'Existencias de esencias, botes y empaques' },
  { id: 'ventas', name: 'Caja & Facturación DTE', path: '/ventas', tag: 'Facturación', description: 'Revisión de comandas, cobro y emisión de DTE' },
  { id: 'logistica', name: 'Envíos & Logística', path: '/logistica', tag: 'Envíos', description: 'Mensajería local y despachos a domicilio' },
  { id: 'admin', name: 'Gerencia General', path: '/admin', tag: 'Gerencia', description: 'Costos ($1.95), márgenes, precios masivos y personal' },
];

export interface CustomRole {
  id: string;
  code: string; // e.g., 'ADMIN', 'CASHIER', 'BODEGA', 'DESPACHO'
  name: string;
  description: string;
  color: string; // 'purple' | 'indigo' | 'amber' | 'blue' | 'emerald'
  allowedViews: string[]; // ids de SYSTEM_VIEWS
  canSeeCosts: boolean;
  canEditPrices: boolean;
  isSystem?: boolean;
}

export const INITIAL_ROLES: CustomRole[] = [
  {
    id: 'role-admin',
    code: 'ADMIN',
    name: 'Gerente / Administrador',
    description: 'Acceso total a todas las áreas, costos de adquisición, márgenes de utilidad y configuración fiscal.',
    color: 'purple',
    allowedViews: ['pos', 'bodega', 'inventario', 'ventas', 'logistica', 'admin'],
    canSeeCosts: true,
    canEditPrices: true,
    isSystem: true,
  },
  {
    id: 'role-cashier',
    code: 'CASHIER',
    name: 'Cajero / Vendedor',
    description: 'Ventas en mostrador, emisión de prefacturas y cobro. Información de costos estrictamente oculta.',
    color: 'indigo',
    allowedViews: ['pos', 'ventas'],
    canSeeCosts: false,
    canEditPrices: false,
    isSystem: true,
  },
  {
    id: 'role-bodega',
    code: 'BODEGA',
    name: 'Bodega / Preparador de Pedidos',
    description: 'Recibe comandas en tiempo real, ubica fragancias por puesto de estante (ej: A1) y entrega en ventanilla. Cero precios ni dinero.',
    color: 'amber',
    allowedViews: ['bodega', 'inventario'],
    canSeeCosts: false,
    canEditPrices: false,
    isSystem: false,
  },
  {
    id: 'role-despacho',
    code: 'DESPACHO',
    name: 'Despachador / Ventanilla',
    description: 'Atención en ventanilla de entrega de pedidos preparados, empaque y coordinación de mensajería.',
    color: 'blue',
    allowedViews: ['bodega', 'ventas', 'logistica'],
    canSeeCosts: false,
    canEditPrices: false,
    isSystem: false,
  },
];

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

export const INITIAL_USERS: UserAccount[] = [];

export function getStoredRoles(): CustomRole[] {
  if (typeof window === 'undefined') return INITIAL_ROLES;
  const saved = localStorage.getItem('kodelocal_roles');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  localStorage.setItem('kodelocal_roles', JSON.stringify(INITIAL_ROLES));
  return INITIAL_ROLES;
}

export function saveStoredRoles(roles: CustomRole[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kodelocal_roles', JSON.stringify(roles));
}

export function getStoredUsers(): UserAccount[] {
  if (typeof window === 'undefined') return INITIAL_USERS;
  const saved = localStorage.getItem('kodelocal_users');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  localStorage.setItem('kodelocal_users', JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
}


export function getActiveUser(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  
  // 1. Try to read from real session cookie
  const match = document.cookie.match(new RegExp('(^| )kode_session_ui=([^;]+)'));
  if (match) {
    try {
      const session = JSON.parse(decodeURIComponent(match[2]));
      return {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
        isActive: true,
        createdAt: new Date().toISOString()
      };
    } catch(e) {}
  }
  
  // 2. Fallback to old localStorage
  const saved = localStorage.getItem('kodelocal_active_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  
  return null;
}


export function setActiveUser(user: UserAccount | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('kodelocal_active_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('kodelocal_active_user');
  }
  sessionStorage.removeItem('kodelocal_staff_token');
}

export async function getStaffToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const cached = sessionStorage.getItem('kodelocal_staff_token');
  if (cached) return cached;

  const activeUser = getActiveUser();
  try {
    const res = await fetch('/api/staff/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: activeUser?.email, role: activeUser?.role || 'STAFF' }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      sessionStorage.setItem('kodelocal_staff_token', data.token);
      return data.token;
    }
  } catch (err) {
    console.error('Error al obtener token de staff:', err);
  }
  return null;
}

export function getActiveSessionUI() {
  if (typeof document === 'undefined') return { name: 'Caja 1', role: 'CASHIER' };
  const match = document.cookie.match(new RegExp('(^| )kode_session_ui=([^;]+)'));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2]));
    } catch(e) {}
  }
  // Fallback to old local storage if cookie is missing (shouldn't happen with new APIs)
  const saved = localStorage.getItem('kodelocal_active_user');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return { name: 'Caja 1', role: 'CASHIER' };
}
