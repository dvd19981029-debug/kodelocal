// src/app/kode/store/useKodeStore.ts
// Store reactivo de alto rendimiento para KÖDE usando useSyncExternalStore nativo de React 19.
// Permite suscripciones atómicas por selector (cero re-renderizados innecesarios).

import { useSyncExternalStore } from 'react';
import {
  Pedido,
  ClienteItem,
  CatalogoItem,
  FormaPagoItem,
  Vendedora,
  InsumoItem,
  CompraGasto,
  NavSection,
  VentasView,
  FabView,
  BiView,
  ToastMessage
} from '../types';
import { kodeApi } from '../services/kodeApi';

interface KodeState {
  // Navegación
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  activeNav: NavSection;
  ventasView: VentasView;
  fabView: FabView;
  biView: BiView;
  searchQuery: string;

  // Datos Maestros
  catalogo: CatalogoItem[];
  vendedoras: Vendedora[];
  pedidos: Pedido[];
  insumos: InsumoItem[];
  formasPago: FormaPagoItem[];
  clientes: ClienteItem[];
  compras: CompraGasto[];

  // Estados de carga y feedback
  loading: boolean;
  toast: ToastMessage | null;
}

const INITIAL_STATE: KodeState = {
  sidebarOpen: true,
  mobileMenuOpen: false,
  activeNav: 'VENTAS',
  ventasView: 'hub',
  fabView: 'hub',
  biView: 'hub',
  searchQuery: '',

  catalogo: [],
  vendedoras: [],
  pedidos: [],
  insumos: [],
  formasPago: [],
  clientes: [],
  compras: [],

  loading: false,
  toast: null,
};

let state: KodeState = { ...INITIAL_STATE };
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const kodeStoreActions = {
  getState(): KodeState {
    return state;
  },

  setState(partial: Partial<KodeState> | ((prev: KodeState) => Partial<KodeState>)) {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
    emitChange();
  },

  // Acciones de Navegación
  setSidebarOpen(open: boolean) {
    kodeStoreActions.setState({ sidebarOpen: open });
  },
  setMobileMenuOpen(open: boolean) {
    kodeStoreActions.setState({ mobileMenuOpen: open });
  },
  setActiveNav(nav: NavSection) {
    kodeStoreActions.setState({ activeNav: nav });
  },
  setVentasView(view: VentasView) {
    kodeStoreActions.setState({ ventasView: view });
  },
  setFabView(view: FabView) {
    kodeStoreActions.setState({ fabView: view });
  },
  setBiView(view: BiView) {
    kodeStoreActions.setState({ biView: view });
  },
  setSearchQuery(query: string) {
    kodeStoreActions.setState({ searchQuery: query });
  },

  // Feedback Toasts
  showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    kodeStoreActions.setState({ toast: { message, type } });
    setTimeout(() => {
      if (state.toast?.message === message) {
        kodeStoreActions.setState({ toast: null });
      }
    }, 4000);
  },
  clearToast() {
    kodeStoreActions.setState({ toast: null });
  },

  // Carga Centralizada de Datos Maestros
  async fetchMasterData() {
    kodeStoreActions.setState({ loading: true });
    try {
      const [cat, ven, ped, ins, fp] = await Promise.all([
        kodeApi.getCatalogo().catch(() => []),
        kodeApi.getVendedoras().catch(() => []),
        kodeApi.getPedidos().catch(() => []),
        kodeApi.getInsumos().catch(() => []),
        kodeApi.getFormasPago().catch(() => []),
      ]);

      kodeStoreActions.setState({
        catalogo: cat,
        vendedoras: ven,
        pedidos: ped,
        insumos: ins,
        formasPago: fp,
        loading: false,
      });
    } catch (err) {
      console.error('Error cargando datos maestros de KÖDE:', err);
      kodeStoreActions.setState({ loading: false });
    }
  },

  async reloadPedidos() {
    try {
      const ped = await kodeApi.getPedidos();
      kodeStoreActions.setState({ pedidos: ped });
    } catch (err) {
      console.error('Error recargando pedidos:', err);
    }
  },

  async reloadClientes() {
    try {
      const cli = await kodeApi.getClientes();
      kodeStoreActions.setState({ clientes: cli });
    } catch (err) {
      console.error('Error recargando clientes:', err);
    }
  }
};

/**
 * Hook personalizado para suscribirse a partes específicas del estado global de KÖDE.
 * Ejemplo: const pedidos = useKodeStore(s => s.pedidos);
 */
export function useKodeStore<T>(selector: (state: KodeState) => T): T {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    () => selector(state),
    () => selector(INITIAL_STATE)
  );
}
