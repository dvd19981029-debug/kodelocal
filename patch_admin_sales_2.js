const fs = require('fs');
const path = 'src/app/admin/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Reemplazar los useMemo actuales por la lógica segregada
const oldCalcRegex = /\/\/ Cálculos de Ventas del Día[\s\S]*?const totalDteCount = [^\n]+/m;

const newCalculations = `// Cálculos de Ventas (Tab: Ventas del Día)
  const salesToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sales.filter(s => new Date(s.createdAt) >= today);
  }, [sales]);

  const totalVentasMontoHoy = useMemo(() => salesToday.reduce((acc, s) => acc + Number(s.total || 0), 0), [salesToday]);
  const totalIvaFiscalHoy = useMemo(() => salesToday.reduce((acc, s) => acc + Number(s.ivaTotal || 0), 0), [salesToday]);
  const totalDteCountHoy = useMemo(() => salesToday.filter(s => s.tipoComprobante === '01' || s.tipoComprobante === '03').length, [salesToday]);

  // Cálculos de Ventas (Tab: Reportes por Período)
  const salesByPeriod = useMemo(() => {
    if (periodFilter === 'HOY') return salesToday;
    
    const now = new Date();
    return sales.filter(s => {
      const d = new Date(s.createdAt);
      if (periodFilter === 'MES') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (periodFilter === 'ANIO') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, salesToday, periodFilter]);

  const totalVentasMontoPeriod = useMemo(() => salesByPeriod.reduce((acc, s) => acc + Number(s.total || 0), 0), [salesByPeriod]);
  const totalIvaFiscalPeriod = useMemo(() => salesByPeriod.reduce((acc, s) => acc + Number(s.ivaTotal || 0), 0), [salesByPeriod]);
  const totalDteCountPeriod = useMemo(() => salesByPeriod.filter(s => s.tipoComprobante === '01' || s.tipoComprobante === '03').length, [salesByPeriod]);`;

code = code.replace(oldCalcRegex, newCalculations);

// 2. Reemplazar usos en Ventas del Día
code = code.replace(/<h3 className="text-2xl font-black text-emerald-600 mt-1">\$\{totalVentasMonto\.toFixed\(2\)\}<\/h3>/, '<h3 className="text-2xl font-black text-emerald-600 mt-1">${totalVentasMontoHoy.toFixed(2)}</h3>');
code = code.replace(/<h3 className="text-2xl font-black text-indigo-600 mt-1">\$\{totalIvaFiscal\.toFixed\(2\)\}<\/h3>/, '<h3 className="text-2xl font-black text-indigo-600 mt-1">${totalIvaFiscalHoy.toFixed(2)}</h3>');

// 3. Reemplazar usos en Reportes por Período
code = code.replace(/\(totalVentasMonto \/ 1\.13\)/g, '(totalVentasMontoPeriod / 1.13)');
code = code.replace(/totalIvaFiscal\.toFixed\(2\)/g, 'totalIvaFiscalPeriod.toFixed(2)');
code = code.replace(/\$\{totalVentasMonto\.toFixed\(2\)\}/g, '${totalVentasMontoPeriod.toFixed(2)}');
code = code.replace(/totalDteCount/g, 'totalDteCountPeriod'); // as it was only used in reportes-periodo

fs.writeFileSync(path, code);
console.log('Patched admin page 2');
