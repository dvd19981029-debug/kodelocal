/**
 * POS Aromaniak - Cliente API Centralizado
 */

import { getStaffToken } from '@/lib/auth';
import { CustomerRecord, ProductItem, SaleRecord } from '@/lib/store';
import { DteEmissionPayload, DteEmissionResponse } from '../types';

export const posApi = {
  /**
   * Obtiene la lista oficial de productos desde Supabase
   */
  async getProducts(): Promise<ProductItem[]> {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        return data.products;
      }
      return [];
    } catch (err) {
      console.error('Error en posApi.getProducts:', err);
      return [];
    }
  },

  /**
   * Actualiza rápidamente un producto (stock, precio, puesto) desde el POS
   */
  async updateProduct(productPayload: Partial<ProductItem> & { id: string }): Promise<{ success: boolean; product?: ProductItem; error?: string }> {
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify(productPayload),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Error en posApi.updateProduct:', err);
      return { success: false, error: err?.message || 'Error de red' };
    }
  },

  /**
   * Obtiene el directorio de clientes fiscales
   */
  async getCustomers(): Promise<CustomerRecord[]> {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        return data.customers;
      }
      return [];
    } catch (err) {
      console.error('Error en posApi.getCustomers:', err);
      return [];
    }
  },

  /**
   * Registra o actualiza un cliente fiscal
   */
  async saveCustomer(customer: any): Promise<{ success: boolean; customer?: CustomerRecord; error?: string }> {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Error en posApi.saveCustomer:', err);
      return { success: false, error: err?.message || 'Error de red' };
    }
  },

  /**
   * Obtiene pedidos de la tienda online pendientes para ventanilla
   */
  async getEcommerceOrders(): Promise<any[]> {
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/ecommerce/orders', {
        headers: {
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        return data.orders;
      }
      return [];
    } catch (err) {
      console.error('Error en posApi.getEcommerceOrders:', err);
      return [];
    }
  },

  /**
   * Actualiza el estado de una orden ecommerce (ej. marcar despachada / lista)
   */
  async updateEcommerceOrder(orderId: string, payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/ecommerce/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({ id: orderId, ...payload }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Error en posApi.updateEcommerceOrder:', err);
      return { success: false, error: err?.message || 'Error de red' };
    }
  },

  /**
   * Obtiene las ventas históricas y DTEs registrados en base de datos
   */
  async getSalesHistory(limit = 100): Promise<SaleRecord[]> {
    try {
      const res = await fetch(`/api/sales?limit=${limit}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.sales)) {
        return data.sales;
      }
      return [];
    } catch (err) {
      console.error('Error en posApi.getSalesHistory:', err);
      return [];
    }
  },

  /**
   * Emite un DTE (Factura o Crédito Fiscal) con Factura Llama / Hacienda
   */
  async emitirDte(payload: DteEmissionPayload): Promise<DteEmissionResponse> {
    try {
      const res = await fetch('/api/dte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Error en posApi.emitirDte:', err);
      return { success: false, error: err?.message || 'Error de conexión con el servicio DTE' };
    }
  },
};
