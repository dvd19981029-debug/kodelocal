/**
 * POS Aromaniak - Utilidades y Helpers de Cálculo
 */

import { CartItem, ProductItem } from '@/lib/store';

export const posHelpers = {
  /**
   * Calcula el stock a descontar considerando presentaciones de media onza
   */
  calculateStockDeduct(items: { productId?: string; presentation?: string; unit?: string; name?: string; quantity: number }[], productId: string): number {
    const matching = items.filter(i => i.productId === productId);
    return matching.reduce((sum, ci) => {
      const isHalf =
        (ci as any).presentation === 'MEDIA_ONZA' ||
        ci.unit === '½ Onza' ||
        String(ci.name).includes('½');
      return sum + (isHalf ? Math.ceil(ci.quantity * 0.5) : ci.quantity);
    }, 0);
  },

  /**
   * Aplica deducción de stock sobre una lista de productos
   */
  deductStock(products: ProductItem[], itemsToDeduct: any[]): ProductItem[] {
    return products.map(prod => {
      const deduct = posHelpers.calculateStockDeduct(itemsToDeduct, prod.id);
      if (deduct > 0) {
        return { ...prod, stock: Math.max(0, prod.stock - deduct) };
      }
      return prod;
    });
  },

  /**
   * Calcula subtotal, IVA y total de un carrito o comanda
   */
  calculateCartFinancials(items: CartItem[], shippingCost = 0, tipoDoc: '01' | '03' | 'TICKET' = '01') {
    const subtotal = items.reduce((acc, it) => acc + (it.total || it.price * it.quantity), 0);
    const totalWithoutTax = subtotal + shippingCost;
    
    // Para Crédito Fiscal (03) en El Salvador el IVA se desglosa (13%)
    const iva = tipoDoc === '03' ? Math.round(totalWithoutTax * 0.13 * 100) / 100 : 0;
    const total = tipoDoc === '03' ? totalWithoutTax + iva : totalWithoutTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shippingCost,
      iva,
      total: Math.round(total * 100) / 100,
      totalItems: items.reduce((acc, it) => acc + it.quantity, 0),
    };
  },

  /**
   * Formateador de moneda en dólares ($)
   */
  formatMoney(val: number | string | undefined | null): string {
    const num = typeof val === 'string' ? parseFloat(val) : Number(val || 0);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  },
};
