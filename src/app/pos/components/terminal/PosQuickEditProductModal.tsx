import React from 'react';
import { X, Edit3 } from 'lucide-react';
import { ProductItem } from '@/lib/store';

export interface PosQuickEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: ProductItem | null;
  setEditingProduct: React.Dispatch<React.SetStateAction<ProductItem | null>>;
  onSave: (e: React.FormEvent) => Promise<void> | void;
  isSaving: boolean;
}

export const PosQuickEditProductModal: React.FC<PosQuickEditProductModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  setEditingProduct,
  onSave,
  isSaving,
}) => {
  if (!isOpen || !editingProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="clay-card w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Editar Producto / Fragancia</h3>
            <p className="text-[11px] text-slate-500">
              Actualiza el nombre comercial, inspiración y precios sincronizados con Supabase y E-commerce.
            </p>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-3.5 mt-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nombre Oficial de la Fragancia
              </label>
              <input
                type="text"
                value={editingProduct.officialName || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, officialName: e.target.value })}
                placeholder="Ej. Hombre Salvaje / Euro Girl"
                className="clay-input w-full text-xs font-black text-indigo-950 bg-indigo-50/40"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Nombre comercial de tu marca o tienda</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Inspirado en (Contratipo) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingProduct.name || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                placeholder="Ej. Sauvage / Donna"
                className="clay-input w-full text-xs font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Nombre de la esencia o fragancia de inspiración</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Marca / Diseñador</label>
                <input
                  type="text"
                  value={editingProduct.brand || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                  placeholder="Ej. Dior / Valentino"
                  className="clay-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Puesto / Estante</label>
                <input
                  type="text"
                  value={editingProduct.puesto || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, puesto: e.target.value })}
                  placeholder="Ej. A1, B2"
                  className="clay-input w-full text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Precio 1 Oz ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingProduct.price}
                  onChange={(e) => {
                    const newPrice = parseFloat(e.target.value) || 0;
                    setEditingProduct({
                      ...editingProduct,
                      price: newPrice,
                      priceHalfOunce: Number((newPrice / 2).toFixed(2))
                    });
                  }}
                  className="clay-input w-full text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Precio ½ Oz ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.priceHalfOunce != null ? editingProduct.priceHalfOunce : ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, priceHalfOunce: parseFloat(e.target.value) || 0 })}
                  className="clay-input w-full text-xs font-bold font-mono text-violet-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Stock Disponible</label>
                <input
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                  className="clay-input w-full text-xs font-bold font-mono text-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Costo Unitario ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.cost || 0}
                  onChange={(e) => setEditingProduct({ ...editingProduct, cost: parseFloat(e.target.value) || 0 })}
                  className="clay-input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Perfume 100ml ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.finishedPerfumePrice || 15}
                  onChange={(e) => setEditingProduct({ ...editingProduct, finishedPerfumePrice: parseFloat(e.target.value) || 0 })}
                  className="clay-input w-full text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editingProduct.isAvailableOnline}
                  onChange={(e) => setEditingProduct({ ...editingProduct, isAvailableOnline: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700">Disponible en Tienda Online (E-commerce)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="clay-btn clay-btn-light flex-1 py-2 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="clay-btn clay-btn-primary flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              {isSaving ? 'Guardando...' : 'Guardar y Sincronizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
