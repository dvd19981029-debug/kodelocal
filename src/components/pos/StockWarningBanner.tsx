import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

export function StockWarningBanner() {
  const [days, setDays] = useState<number | null>(null);
  const [product, setProduct] = useState<string>('');

  useEffect(() => {
    fetch('/api/admin/abastecimiento/status')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.daysToOrder !== 999) {
          setDays(d.daysToOrder);
          setProduct(d.criticalProduct);
        }
      })
      .catch(() => {});
  }, []);

  if (days === null || days > 5) return null; // Solo avisa si faltan 5 días o menos

  const isLate = days <= 0;

  return (
    <div className={`w-full px-4 py-2 flex items-center justify-center gap-3 text-xs font-bold animate-in slide-in-from-top-2 duration-300 ${
      isLate 
        ? 'bg-red-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.4)]' 
        : 'bg-amber-400 text-amber-950 shadow-[0_4px_15px_rgba(251,191,36,0.3)]'
    }`}>
      {isLate ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Clock className="w-4 h-4" />}
      <p>
        {isLate 
          ? `¡URGENTE! Ruptura de stock inminente para ${product}. Tienes un retraso de ${Math.abs(days)} días para hacer el pedido a APAESA.`
          : `¡ATENCIÓN! Tienes ${days} días para ordenar ${product} antes de que su nivel caiga por debajo de los 14 días de tránsito.`}
      </p>
    </div>
  );
}
