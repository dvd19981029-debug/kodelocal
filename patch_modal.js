const fs = require('fs');
const path = 'src/app/pos/components/modals/PosCustomerFormModal.tsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');

  // Add props to interface
  code = code.replace(
    /custNotas: string;\n  setCustNotas: \(val: string\) => void;/g,
    "custNotas: string;\n  setCustNotas: (val: string) => void;\n  custSpecialEssencePrice?: string;\n  setCustSpecialEssencePrice?: (val: string) => void;\n  custSpecialBottlePrice?: string;\n  setCustSpecialBottlePrice?: (val: string) => void;"
  );

  // Add props to destructured object
  code = code.replace(
    /custNotas,\n  setCustNotas\n}\)/g,
    "custNotas,\n  setCustNotas,\n  custSpecialEssencePrice,\n  setCustSpecialEssencePrice,\n  custSpecialBottlePrice,\n  setCustSpecialBottlePrice\n})"
  );

  // Add fields to form UI
  const targetHTML = `<div className="col-span-2 mt-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notas / Observaciones del Cliente
                </label>
                <textarea`;
  
  const fieldsHTML = `
              <div className="col-span-2 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-3">Precios Especiales</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Precio Fijo Esencias ($/Oz)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={custSpecialEssencePrice || ''}
                      onChange={(e) => setCustSpecialEssencePrice && setCustSpecialEssencePrice(e.target.value)}
                      placeholder="Ej. 3.25"
                      className="clay-input w-full font-bold text-indigo-700"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Deja vacío para usar precio normal</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Precio Fijo Botes ($/Un)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={custSpecialBottlePrice || ''}
                      onChange={(e) => setCustSpecialBottlePrice && setCustSpecialBottlePrice(e.target.value)}
                      placeholder="Ej. 1.25"
                      className="clay-input w-full font-bold text-purple-700"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Deja vacío para usar precio normal</span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 mt-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notas / Observaciones del Cliente
                </label>
                <textarea`;

  code = code.replace(targetHTML, fieldsHTML);

  fs.writeFileSync(path, code);
  console.log('Patched modal UI');
}
