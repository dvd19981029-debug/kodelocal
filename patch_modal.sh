sed -i '' -e '/custDireccion: string;/a\
  custTierId: string;\
  setCustTierId: (val: string) => void;\
  customerTiers: any[];\
' src/app/pos/components/modals/PosCustomerFormModal.tsx

sed -i '' -e '/setCustDireccion,/a\
  custTierId,\
  setCustTierId,\
  customerTiers,\
' src/app/pos/components/modals/PosCustomerFormModal.tsx

sed -i '' -e '/{tipoPersona === '"'NATURAL'"' && (/i\
          {/* Nivel VIP */}\
          <div>\
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Nivel VIP / Descuento Base</label>\
            <select\
              value={custTierId}\
              onChange={(e) => setCustTierId(e.target.value)}\
              className="w-full pl-3 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"\
            >\
              <option value="">Ninguno (Sin descuento)</option>\
              {customerTiers.map((t) => (\
                <option key={t.id} value={t.id}>{t.name} - {Number(t.discountPct)}% dto.</option>\
              ))}\
            </select>\
          </div>\
' src/app/pos/components/modals/PosCustomerFormModal.tsx
