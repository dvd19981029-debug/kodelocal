/**
 * POS Aromaniak - Capa de Almacenamiento Local Seguro (localStorage)
 */

import { ProductItem, SaleRecord } from '@/lib/store';
import { CustomerRecord, getStoredCustomers, saveStoredCustomers } from '@/lib/customers';

const STORAGE_KEYS = {
  PRODUCTS: 'kodelocal_products',
  SALES: 'kodelocal_sales',
  DATA_VERSION: 'kodelocal_data_version',
  CURRENT_VERSION: '2026_zero_stock_v3',
} as const;

export const posStorage = {
  /**
   * Obtiene los productos almacenados localmente
   */
  getProducts(): ProductItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Guarda los productos en localStorage y emite el evento de sincronización
   */
  saveProducts(products: ProductItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      window.dispatchEvent(new CustomEvent('kodelocal_products_updated'));
    } catch (e) {
      console.error('Error guardando productos en posStorage:', e);
    }
  },

  /**
   * Obtiene el historial de ventas del turno actual
   */
  getSales(): SaleRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const currentVer = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
      if (currentVer !== STORAGE_KEYS.CURRENT_VERSION) return [];
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Guarda las ventas en localStorage y emite el evento para bodega y caja
   */
  saveSales(sales: SaleRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      window.dispatchEvent(new CustomEvent('kodelocal_sales_updated'));
    } catch (e) {
      console.error('Error guardando ventas en posStorage:', e);
    }
  },

  /**
   * Clientes fiscales
   */
  getCustomers(): CustomerRecord[] {
    return getStoredCustomers();
  },

  saveCustomers(customers: CustomerRecord[]): void {
    saveStoredCustomers(customers);
  },
};
