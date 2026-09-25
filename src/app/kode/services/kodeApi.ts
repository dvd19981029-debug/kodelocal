// src/app/kode/services/kodeApi.ts
// Cliente de API centralizado para KÖDE

import {
  Pedido,
  ClienteItem,
  CatalogoItem,
  FormaPagoItem,
  Vendedora,
  InsumoItem,
  PagoItem
} from '../types';

export const kodeApi = {
  // --- PEDIDOS ---
  async getPedidos(): Promise<Pedido[]> {
    const res = await fetch('/api/kode/pedidos');
    const data = await res.json();
    return data.pedidos || [];
  },

  async crearPedido(payload: any): Promise<{ success: boolean; pedido?: Pedido; error?: string }> {
    const res = await fetch('/api/kode/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // --- CLIENTES ---
  async getClientes(): Promise<ClienteItem[]> {
    const res = await fetch('/api/kode/clientes');
    const data = await res.json();
    return data.clientes || [];
  },

  async guardarCliente(payload: any): Promise<{ success: boolean; cliente?: any; error?: string }> {
    const res = await fetch('/api/kode/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // --- CATALOGO ---
  async getCatalogo(): Promise<CatalogoItem[]> {
    const res = await fetch('/api/kode/catalogo');
    const data = await res.json();
    return data.catalogo || [];
  },

  async guardarFragancia(payload: any): Promise<{ success: boolean; fragancia?: any; error?: string }> {
    const res = await fetch('/api/kode/catalogo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async toggleActivoFragancia(id: string, activo: boolean): Promise<any> {
    const res = await fetch(`/api/kode/catalogo?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    });
    return res.json();
  },

  // --- FORMAS DE PAGO ---
  async getFormasPago(): Promise<FormaPagoItem[]> {
    const res = await fetch('/api/kode/formas-pago');
    const data = await res.json();
    return data.formas_pago || [];
  },

  // --- VENDEDORAS ---
  async getVendedoras(): Promise<Vendedora[]> {
    const res = await fetch('/api/kode/vendedoras');
    const data = await res.json();
    return data.vendedoras || [];
  },

  // --- INSUMOS (FABRICACIÓN) ---
  async getInsumos(): Promise<InsumoItem[]> {
    const res = await fetch('/api/kode/insumos');
    const data = await res.json();
    return data.insumos || [];
  },

  // --- PAGOS & COMPROBANTES ---
  async registrarAbono(payload: {
    pedido_id: string;
    cliente_id?: string;
    forma_pago_id: string;
    monto: number;
    fecha_pago: string;
    num_documento_auto?: string;
    comprobante_url?: string;
    usuario?: string;
    observaciones?: string;
  }): Promise<{ success: boolean; pago?: PagoItem; error?: string }> {
    const res = await fetch('/api/kode/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async uploadComprobante(file: Blob | File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file, 'comprobante.jpg');
    const res = await fetch('/api/kode/pagos/upload-comprobante', {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (!data.success || !data.url) {
      throw new Error(data.error || 'No se pudo subir la imagen del comprobante');
    }
    return data.url;
  },

  // --- GUÍAS C807 ---
  async generarGuia(pedidoId: string): Promise<any> {
    const res = await fetch('/api/kode/guia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido_id: pedidoId }),
    });
    return res.json();
  },

  // --- DTE FACTURA LLAMA ---
  async emitirDte(pedidoId: string): Promise<any> {
    const res = await fetch('/api/kode/dte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido_id: pedidoId }),
    });
    return res.json();
  }
};
