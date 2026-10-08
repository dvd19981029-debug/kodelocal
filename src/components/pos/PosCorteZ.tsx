import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Lock, Unlock, TrendingDown, RefreshCw } from 'lucide-react';

export const PosCorteZ: React.FC = () => {
  const [activeShift, setActiveShift] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forms
  const [cashierName, setCashierName] = useState('Caja 1');
  const [initialAmount, setInitialAmount] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [movementAmount, setMovementAmount] = useState<number>(0);
  const [movementReason, setMovementReason] = useState('');

  const fetchShift = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shifts');
      const data = await res.json();
      if (data.success) {
        setActiveShift(data.shift);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShift();
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', cashierName, initialAmount }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveShift(data.shift);
        alert('Caja abierta exitosamente.');
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('¿Estás seguro de hacer el Corte Z y cerrar el turno?')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', shiftId: activeShift.id, finalAmount }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Corte Z Realizado.\\nDiferencia: $${data.cuadre.diferencia.toFixed(2)} (${data.cuadre.estadoCuadre})`);
        setActiveShift(null);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (movementAmount <= 0 || !movementReason.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'movement', shiftId: activeShift.id, type: 'EGRESO', amount: movementAmount, reason: movementReason, performedBy: activeShift.cashierName }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Egreso registrado');
        setMovementAmount(0);
        setMovementReason('');
        fetchShift(); // Refrescar totales
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !activeShift) {
    return <div className="p-8 text-center text-slate-500">Cargando datos del turno...</div>;
  }

  if (!activeShift) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-center">
        <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-800 mb-2">Caja Cerrada</h2>
        <p className="text-xs text-slate-500 mb-6">Debes abrir el turno de caja para comenzar a auditar el efectivo.</p>
        <form onSubmit={handleOpenShift} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Cajero</label>
            <input type="text" required value={cashierName} onChange={e => setCashierName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Fondo Inicial de Caja ($)</label>
            <input type="number" step="0.01" min="0" required value={initialAmount} onChange={e => setInitialAmount(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold font-mono" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold rounded-lg p-2.5 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
            <Unlock className="w-4 h-4" /> Abrir Caja
          </button>
        </form>
      </div>
    );
  }

  // Cálculos en vivo
  const totalesVentas = (activeShift.sales || []).reduce((acc: any, s: any) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + Number(s.total);
    acc.total += Number(s.total);
    return acc;
  }, { CASH: 0, CARD: 0, TRANSFER: 0, BITCOIN: 0, total: 0 });

  const egresosCaja = (activeShift.movements || []).filter((m: any) => m.type === 'EGRESO').reduce((sum: number, m: any) => sum + Number(m.amount), 0);
  const esperadoEnCaja = Number(activeShift.initialAmount) + totalesVentas.CASH - egresosCaja;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-in fade-in">
      
      {/* Resumen del Turno */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
          <div>
            <h3 className="font-black text-lg">Turno Abierto</h3>
            <p className="text-xs text-slate-300">Cajero: {activeShift.cashierName} | Abierto: {new Date(activeShift.openedAt).toLocaleTimeString()}</p>
          </div>
          <button onClick={fetchShift} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Fondo Inicial</span>
              <span className="text-lg font-black text-slate-800">${Number(activeShift.initialAmount).toFixed(2)}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="block text-[10px] text-emerald-600 font-bold uppercase">Efectivo Físico Esperado</span>
              <span className="text-lg font-black text-emerald-700">${esperadoEnCaja.toFixed(2)}</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-slate-600 mb-2 border-b pb-1">Ventas del Turno</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Efectivo</span><span className="font-mono font-bold">${totalesVentas.CASH.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tarjeta</span><span className="font-mono font-bold">${totalesVentas.CARD.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Transf. / Link</span><span className="font-mono font-bold">${totalesVentas.TRANSFER.toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span className="font-bold">Total Vendido</span><span className="font-mono font-black text-indigo-700">${totalesVentas.total.toFixed(2)}</span></div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-600 mb-2 border-b pb-1">Retiros / Caja Chica</h4>
            {activeShift.movements && activeShift.movements.length > 0 ? (
              <ul className="space-y-1 text-xs">
                {activeShift.movements.map((m: any) => (
                  <li key={m.id} className="flex justify-between text-rose-600">
                    <span>{m.reason}</span><span className="font-mono font-bold">-${Number(m.amount).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Sin retiros registrados</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Formulario Caja Chica */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-rose-500"/> Vale de Caja Chica (Egreso)</h3>
          <form onSubmit={handleMovement} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Monto a retirar ($)</label>
                <input type="number" step="0.01" min="0.01" required value={movementAmount === 0 ? '' : movementAmount} onChange={e => setMovementAmount(parseFloat(e.target.value)||0)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-mono font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Concepto</label>
                <input type="text" required value={movementReason} onChange={e => setMovementReason(e.target.value)} placeholder="Ej. Pago agua" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-lg transition-colors border border-slate-300">
              Registrar Retiro
            </button>
          </form>
        </div>

        {/* Formulario Corte Z */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl shadow-sm p-5">
          <h3 className="font-black text-rose-800 mb-3 flex items-center gap-2"><Calculator className="w-4 h-4"/> Corte Z (Cierre de Caja)</h3>
          <form onSubmit={handleCloseShift} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-rose-700 block mb-1">Efectivo Real Contado Físicamente en Cajón ($)</label>
              <input type="number" step="0.01" min="0" required value={finalAmount} onChange={e => setFinalAmount(parseFloat(e.target.value)||0)} className="w-full bg-white border border-rose-200 focus:ring-2 focus:ring-rose-500 rounded-lg p-3 text-lg font-black font-mono text-rose-900" />
            </div>
            <p className="text-[10px] text-rose-600">Al cerrar la caja, se comparará el efectivo real con el esperado (${esperadoEnCaja.toFixed(2)}) para generar el reporte de faltantes/sobrantes.</p>
            <button type="submit" disabled={isLoading} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md">
              <Lock className="w-4 h-4" /> Ejecutar Corte Z y Cerrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
