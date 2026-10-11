const fs = require('fs');
const path = 'src/app/admin/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Añadir salesToday memo
const newCalculations = `
  // Cálculos de Ventas del Día
  const salesToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sales.filter(s => new Date(s.createdAt) >= today);
  }, [sales]);

  const totalVentasMonto = useMemo(() => salesToday.reduce((acc, s) => acc + Number(s.total || 0), 0), [salesToday]);
  const totalIvaFiscal = useMemo(() => salesToday.reduce((acc, s) => acc + Number(s.ivaTotal || 0), 0), [salesToday]);
  const totalDteCount = useMemo(() => salesToday.filter(s => s.tipoComprobante === '01' || s.tipoComprobante === '03').length, [salesToday]);
`;

code = code.replace(
`  // Cálculos de Ventas
  const totalVentasMonto = useMemo(() => sales.reduce((acc, s) => acc + Number(s.total || 0), 0), [sales]);
  const totalIvaFiscal = useMemo(() => sales.reduce((acc, s) => acc + Number(s.ivaTotal || 0), 0), [sales]);
  const totalDteCount = useMemo(() => sales.filter(s => s.tipoComprobante === '01' || s.tipoComprobante === '03').length, [sales]);`,
  newCalculations
);

// 2. Reemplazar `sales` por `salesToday` en el renderizado del Tab 'ventas-dia'
// Usaremos expresiones regulares para atrapar las ocurrencias específicas en esa sección.

// Reemplazar {sales.length}
code = code.replace(/<h3 className="text-2xl font-black text-slate-800 mt-1">\{sales\.length\}<\/h3>/g, '<h3 className="text-2xl font-black text-slate-800 mt-1">{salesToday.length}</h3>');

// Reemplazar sales.length === 0
code = code.replace(/\{sales\.length === 0 \? \(/g, '{salesToday.length === 0 ? (');

// Reemplazar sales.map
code = code.replace(/\{sales\.map\(s => \(/g, '{salesToday.map(s => (');

fs.writeFileSync(path, code);
console.log('Patched admin page');
