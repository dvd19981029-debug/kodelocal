const fs = require('fs');
const file = 'src/app/pos/components/modals/PosCheckoutModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace {customers.map((c) => ( with {filteredCustomers.map((c) => ( globally
content = content.replace(/\{customers\.map\(\(c\) => \(/g, '{filteredCustomers.map((c) => (');

// Find the specific select
const selectTarget = `<select
            value={selectedCustomerId}`;

const inputToInsert = `<input
            type="text"
            placeholder="Buscar por nombre, correo, DUI o NRC..."
            value={customerSearchQuery}
            onChange={(e) => setCustomerSearchQuery(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-full mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
          />

          <select
            value={selectedCustomerId}`;

content = content.replace(selectTarget, inputToInsert);

fs.writeFileSync(file, content, 'utf8');
