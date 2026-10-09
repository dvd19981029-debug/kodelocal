import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Check } from 'lucide-react';

export function StockWarningBanner() {
  const [days, setDays] = useState<number | null>(null);
  const [product, setProduct] = useState<string>('');

  useEffect(() => {
    fetch('/api/admin/abastecimiento/status')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.daysToOrder !== 999) {
          const snoozedAt = localStorage.getItem(`snooze_restock_${d.criticalProduct}`);
          if (snoozedAt) {
             const daysSinceSnooze = (Date.now() - Number(snoozedAt)) / (1000 * 60 * 60 * 24);
             if (daysSinceSnooze < 14) {
               return; // Silenciado temporalmente por 14 días porque ya se pidió
             }
          }

          setDays(d.daysToOrder);
          setProduct(d.criticalProduct);
        }
      })
      .catch(() => {});
  }, []);

  if (days === null || days > 5) return null;

  const handleDismiss = () => {
    localStorage.setItem(`snooze_restock_${product}`, Date.now().toString());
    setDays(null);
  }; // Solo avisa si faltan 5 días o menos

  const isLate = days <= 0;

  return (
    <div className={`w-full px-4 py-2 flex items-center justify-center gap-3 text-xs font-bold animate-in slide-in-from-top-2 duration-300 ${
      isLate 
        ? 'bg-red-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.4)]' 
        : 'bg-amber-400 text-amber-950 shadow-[0_4px_15px_rgba(251,191,36,0.3)]'
    }`}>
      {isLate ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Clock className="w-4 h-4" />}
      <p className="flex-1">
        {isLate 
          ? `¡URGENTE! Ruptura de stock inminente para ${product}. Tienes un retraso de ${Math.abs(days)} días para hacer el pedido a APAESA.`
          : `¡ATENCIÓN! Tienes ${days} días para ordenar ${product} antes de que su nivel caiga por debajo de los 14 días de tránsito.`}
      </p>
      <button 
        onClick={handleDismiss}
        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors flex items-center gap-1 shrink-0"
        title="Ocultar esta alerta por 14 días"
      >
        <span className="text-[10px] uppercase tracking-wider">Ya lo pedí</span>
      </button>
    </div>
  );
}
