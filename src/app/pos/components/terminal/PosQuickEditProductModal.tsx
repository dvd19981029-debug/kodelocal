import React from 'react';
import { X, Edit3 } from 'lucide-react';
import { ProductItem } from '@/lib/store';
import { getProductImage } from '@/lib/perfumeImages';

export interface PosQuickEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: ProductItem | null;
  setEditingProduct: React.Dispatch<React.SetStateAction<ProductItem | null>>;
  onSave: (e: React.FormEvent) => Promise<void> | void;
  isSaving: boolean;
}

const POS_CATEGORY_OPTIONS = [
  { label: 'Esencias', value: 'Esencias para Perfume', defaultUnit: 'Onza' },
  { label: 'Insumos', value: 'Insumos y Materia Prima', defaultUnit: 'Unidad' },
  { label: 'Botes', value: 'Botes', defaultUnit: 'Unidad' },
  { label: 'Otro', value: 'Otro', defaultUnit: 'Unidad' },
] as const;

export const PosQuickEditProductModal: React.FC<PosQuickEditProductModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  setEditingProduct,
  onSave,
  isSaving,
}) => {
  if (!isOpen || !editingProduct) return null;

  const isNewProduct = editingProduct.id.startsWith('prod_');
  const currentCategory = editingProduct.category || 'Esencias para Perfume';
  const isEssence = currentCategory === 'Esencias para Perfume';

  const handleSelectCategory = (catValue: string, defaultUnit: string) => {
    const nextIsEssence = catValue === 'Esencias para Perfume';
    setEditingProduct({
      ...editingProduct,
      category: catValue,
      unit: nextIsEssence ? 'Onza' : (editingProduct.unit && editingProduct.unit !== 'Onza' ? editingProduct.unit : defaultUnit),
      priceHalfOunce: nextIsEssence
        ? (editingProduct.priceHalfOunce ?? Number((Number(editingProduct.price || 0) / 2).toFixed(2)))
        : undefined,
    });
  };

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

        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-14 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
            <img
              src={editingProduct.imageUrl || getProductImage(editingProduct)}
              alt={editingProduct.name || 'Producto'}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              {isNewProduct ? 'Agregar Producto en POS' : 'Editar Producto'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Elige la categoría y si deseas incluirlo o excluirlo del E-commerce.
            </p>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-3.5 mt-4">
          <div className="space-y-3">
            {/* Selector de Categoría: Esencias, Insumos, Botes u Otro */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Tipo de Producto <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {POS_CATEGORY_OPTIONS.map((opt) => {
                  const isSelected =
                    currentCategory === opt.value ||
                    (opt.value === 'Insumos y Materia Prima' && (currentCategory === 'Insumos' || currentCategory === 'Empaque')) ||
                    (opt.value === 'Botes' && currentCategory === 'Botes & Envases');
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectCategory(opt.value, opt.defaultUnit)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Incluir o Excluir del E-commerce */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Visibilidad en E-commerce
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {editingProduct.isAvailableOnline
                    ? 'Incluido en la tienda online y en el POS'
                    : 'Excluido del E-commerce (solo venta en POS)'}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingProduct({ ...editingProduct, isAvailableOnline: true })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    editingProduct.isAvailableOnline
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Incluir
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct({ ...editingProduct, isAvailableOnline: false })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    !editingProduct.isAvailableOnline
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Excluir
                </button>
              </div>
            </div>

            {isEssence ? (
              <>
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
                    Inspirado en (Perfil Olfativo) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Ej. Sauvage / Donna"
                    className="clay-input w-full text-xs font-bold"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre del Producto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                      officialName: editingProduct.officialName ? e.target.value : '',
                    })
                  }
                  placeholder="Ej. $1 Alcohol / Bote 100ml / Bolsita"
                  className="clay-input w-full text-xs font-bold"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Código / SKU</label>
                <input
                  type="text"
                  value={editingProduct.sku || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                  placeholder="Ej. 90"
                  className="clay-input w-full text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isEssence ? 'Marca / Diseñador' : 'Marca (Opcional)'}
                </label>
                <input
                  type="text"
                  value={editingProduct.brand || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                  placeholder={isEssence ? 'Ej. Dior' : 'Ej. Aromaniak'}
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

            {isEssence ? (
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stock 1 Oz</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="clay-input w-full text-xs font-bold font-mono text-emerald-700"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio de Venta ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="clay-input w-full text-xs font-bold font-mono"
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
            )}

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

              {isEssence ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stock ½ Oz</label>
                  <input
                    type="number"
                    value={editingProduct.stockHalf ?? 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockHalf: parseInt(e.target.value) || 0 })}
                    className="clay-input w-full text-xs font-bold font-mono text-indigo-700"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    value={editingProduct.unit || 'Unidad'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    placeholder="Unidad"
                    className="clay-input w-full text-xs"
                  />
                </div>
              )}
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
              {isSaving ? 'Guardando...' : (isNewProduct ? 'Agregar Producto' : 'Guardar y Sincronizar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
