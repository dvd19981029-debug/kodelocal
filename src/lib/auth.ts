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
    id: 'user-bodega-1',
    name: 'Kevin Ramos (Bodega / Preparador)',
    email: 'bodega@kodelocal.com',
    password: 'bodega123',
    pin: '5555',
    role: 'BODEGA',
    cashRegister: 'Estantería Central - Ventanilla',
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
    name: 'Marcos Soto (Despachador)',
    email: 'despacho@kodelocal.com',
    password: 'despacho123',
    pin: '7777',
    role: 'DESPACHO',
    cashRegister: 'Ventanilla y Mensajería',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

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
