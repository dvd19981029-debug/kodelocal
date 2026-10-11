const fs = require('fs');

const path = 'src/app/admin/page.tsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');
  
  // Replace Label 1: "Precio 1 Onza ($ PVP)"
  const label1Old = `Precio 1 Onza ($ PVP) <span className="text-rose-500">*</span>`;
  const label1New = `{editingProduct.category === 'Esencias para Perfume' || !editingProduct.category ? 'Precio 1 Onza' : 'Precio Unitario'} ($ PVP) <span className="text-rose-500">*</span>`;
  code = code.replace(label1Old, label1New);

  // Replace Subtitle 1: "Precio por onza completa en mostrador"
  const sub1Old = `<span className="text-[10px] text-slate-400 mt-1 block">Precio por onza completa en mostrador</span>`;
  const sub1New = `<span className="text-[10px] text-slate-400 mt-1 block">{(editingProduct.category === 'Esencias para Perfume' || !editingProduct.category) ? 'Precio por onza completa en mostrador' : 'Precio de venta al público'}</span>`;
  code = code.replace(sub1Old, sub1New);

  // Replace Block 3: Hide Half Ounce for non-essences and remove Ecommerce
  const block3Regex = /<div>\s*<label className="text-xs font-bold text-purple-700 block mb-1">\s*Precio ½ Onza \(\$\)[\s\S]*?<\/div>\s*<\/div>/;
  const block3New = `{(editingProduct.category === 'Esencias para Perfume' || !editingProduct.category) && (
                  <div>
                    <label className="text-xs font-bold text-purple-700 block mb-1">
                      Precio ½ Onza ($)
                    </label>
                    <div className="clay-input flex items-center gap-2 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20">
                      <span className="font-bold text-purple-400 select-none text-base">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingProduct.priceHalfOunce != null ? editingProduct.priceHalfOunce : (editingProduct.price ? Number((editingProduct.price / 2).toFixed(2)) : '')}
                        onChange={(e) => setEditingProduct({ ...editingProduct, priceHalfOunce: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="bg-transparent border-none outline-none w-full text-base font-black text-purple-700 p-0"
                      />
                    </div>
                  </div>
                )}`;
  code = code.replace(block3Regex, block3New);

  fs.writeFileSync(path, code);
  console.log('Patched edit modal in admin page');
}
