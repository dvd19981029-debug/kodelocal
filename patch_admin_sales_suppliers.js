const fs = require('fs');

// 1. Patch admin/page.tsx
const adminFile = 'src/app/admin/page.tsx';
let adminCode = fs.readFileSync(adminFile, 'utf8');

const salesFetch = `
    fetch('/api/sales?limit=500')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.sales)) {
          setSales(data.sales);
        }
      })
      .catch(err => console.error('Error fetching sales:', err));

    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.suppliers)) {
          setSuppliers(data.suppliers);
        }
      })
      .catch(err => console.error('Error fetching suppliers:', err));
`;

adminCode = adminCode.replace(
  /fetch\('\/api\/purchases'\)/,
  salesFetch + "\n    fetch('/api/purchases')"
);

fs.writeFileSync(adminFile, adminCode);


// 2. Patch ComprasModule.tsx to POST and DELETE suppliers to Postgres
const comprasFile = 'src/components/admin/ComprasModule.tsx';
let comprasCode = fs.readFileSync(comprasFile, 'utf8');

// Replace handleSaveSupplier
const newHandleSaveSupplier = `  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editingSupplier.name.trim()) return;

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSupplier)
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local state with DB record
        const exists = suppliers.some(s => s.id === editingSupplier.id);
        if (exists) {
           onUpdateSuppliers(suppliers.map(s => s.id === editingSupplier.id ? data.supplier : s));
        } else {
           onUpdateSuppliers([...suppliers, data.supplier]);
        }
        setIsSupplierModalOpen(false);
        setEditingSupplier(null);
        showToast(\`✅ Proveedor "\${editingSupplier.name}" guardado.\`);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error guardando proveedor.');
    }
  };`;
comprasCode = comprasCode.replace(
  /const handleSaveSupplier = \(e: React\.FormEvent\) => \{[\s\S]*?showToast\(`✅ Proveedor "\$\{editingSupplier\.name\}" guardado\.`\);\n\s*\};/,
  newHandleSaveSupplier
);

fs.writeFileSync(comprasFile, comprasCode);
console.log('Patched Admin Sales & Suppliers');
