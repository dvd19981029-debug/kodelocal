const fs = require('fs');
const path = 'src/app/inventario/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<form onSubmit={handleSaveProduct} noValidate className="space-y-4">[\s\S]*?<div className="flex gap-3 pt-4">/;

const newForm = `<form onSubmit={handleSaveProduct} noValidate className="space-y-5">
              
              {/* SECCIÓN 1: IDENTIFICACIÓN VISUAL Y GENERAL */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Identificación y Visual</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-3 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center transition-all hover:shadow-md">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold text-center px-1">Sin Imagen</span>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-9 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre Oficial (Tu Marca) <span className="text-rose-500">*</span></label>
                      <input type="text" required value={formData.officialName || ''} onChange={(e) => setFormData({ ...formData, officialName: e.target.value })} placeholder="Ej. Hombre Salvaje" className="clay-input w-full text-sm font-black text-indigo-950 bg-indigo-50/30" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Inspiración (Contratipo) <span className="text-rose-500">*</span></label>
                        <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej. Sauvage H" className="clay-input w-full text-xs font-bold" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">URL Fotografía</label>
                        <input type="text" value={formData.imageUrl || ''} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="/images/..." className="clay-input w-full text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: CLASIFICACIÓN Y PROVEEDOR */}
              <div className="p-4 bg-white border border-slate-200/60 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Clasificación de Bodega</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Categoría</label>
                    <input type="text" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="clay-input w-full text-xs bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Marca / Casa</label>
                    <input type="text" value={formData.brand || ''} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="clay-input w-full text-xs bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">SKU (Código Interno)</label>
                    <input type="text" value={formData.sku || ''} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="clay-input w-full text-xs font-mono bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Proveedor / Lote</label>
                    <input type="text" value={formData.supplier || ''} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="clay-input w-full text-xs font-semibold text-emerald-900 bg-emerald-50/30" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: PRECIOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Precios y Finanzas</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Precio Venta ($) <span className="text-rose-500">*</span></label>
                      <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="clay-input w-full text-sm font-black text-blue-900 bg-white border-blue-200" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Costo Adquisición ($)</label>
                      <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })} className="clay-input w-full text-xs bg-white" />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 4: INVENTARIO FÍSICO */}
                <div className="p-4 bg-amber-50/30 border border-amber-200/60 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Existencias en Físico</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-black text-amber-900 block mb-1 text-center bg-amber-100 rounded p-0.5">Stock 1 Onza</label>
                      <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="clay-input w-full text-sm font-black text-center bg-white border-amber-300 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-indigo-900 block mb-1 text-center bg-indigo-100 rounded p-0.5">Stock ½ Onza</label>
                      <input type="number" value={formData.stockHalf} onChange={(e) => setFormData({ ...formData, stockHalf: parseInt(e.target.value) || 0 })} className="clay-input w-full text-sm font-black text-center bg-white border-indigo-200 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1 text-center bg-slate-100 rounded p-0.5">Alerta Mín.</label>
                      <input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })} className="clay-input w-full text-xs text-center bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 mt-2">
                <input type="checkbox" id="onlineCheck" checked={formData.isAvailableOnline} onChange={(e) => setFormData({ ...formData, isAvailableOnline: e.target.checked })} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                <label htmlFor="onlineCheck" className="text-xs font-bold text-indigo-900 cursor-pointer select-none">
                  Sincronizar y publicar este producto en el E-Commerce AromaniakSV en tiempo real
                </label>
              </div>

              <div className="flex gap-3 pt-4">`;

if (code.match(regex)) {
  code = code.replace(regex, newForm);
  fs.writeFileSync(path, code);
  console.log("Form updated successfully.");
} else {
  console.log("Regex didn't match.");
}
