import React from 'react';

/**
 * Retorna el estilo de color de texto para un cliente según el estado de su pedido
 */
export function getClienteColorPorEstado(estado: string): string {
  if (estado === 'Registrado' || estado === 'PENDIENTE_COMPRA') {
    return 'text-red-600 font-bold hover:text-red-700';
  }
  if (estado === 'Insumos comprados' || estado === 'PENDIENTE_PREPARAR') {
    return 'text-amber-600 font-bold hover:text-amber-700';
  }
  if (estado === 'Preparado' || estado === 'Enviado' || estado === 'GUIA_CREADA') {
    return 'text-blue-600 font-bold hover:text-blue-700';
  }
  if (estado === 'Entregado' || estado === 'ENTREGADO') {
    return 'text-emerald-600 font-bold hover:text-emerald-700';
  }
  if (estado === 'Cancelado' || estado === 'CANCELADO') {
    return 'text-slate-400 font-bold line-through';
  }
  return 'text-slate-900 font-bold';
}

/**
 * Normaliza y genera el enlace oficial de rastreo C807 Express
 */
export function getC807TrackingUrl(guiaNumero?: string, existingLink?: string): string {
  if (guiaNumero && guiaNumero.trim()) {
    return `https://c807xpress.com/tracking/?guia=${encodeURIComponent(guiaNumero.trim())}`;
  }
  if (existingLink && existingLink.trim()) {
    if (existingLink.includes('app.c807.com') && existingLink.includes('guide=')) {
      const match = existingLink.match(/guide=([^&]+)/);
      if (match && match[1]) {
        return `https://c807xpress.com/tracking/?guia=${encodeURIComponent(match[1])}`;
      }
    }
    return existingLink.trim();
  }
  return '';
}

/**
 * Renderiza el badge visual con icono y color según el estado en C807 Express
 */
export function renderBadgeEstadoC807(estado?: string, tieneGuia?: boolean) {
  if (!estado && !tieneGuia) {
    return <span className="text-slate-400 text-[11px] italic">Pendiente guía</span>;
  }
  const est = (estado || (tieneGuia ? 'En ruta C807' : 'Pendiente guía')).trim();
  const lower = est.toLowerCase();

  if (lower.includes('llegó') || lower.includes('llego') || lower.includes('entregad')) {
    return (
      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap">
        <span>✅</span> {est}
      </span>
    );
  }
  if (lower.includes('problema') || lower.includes('fallid') || lower.includes('rechaz') || lower.includes('no responde')) {
    return (
      <span className="text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap shadow-xs animate-pulse">
        <span>⚠️</span> {est}
      </span>
    );
  }
  if (lower.includes('recogid') || lower.includes('origen')) {
    return (
      <span className="text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap">
        <span>📦</span> {est}
      </span>
    );
  }
  if (lower.includes('ruta') || lower.includes('transito') || lower.includes('tránsito')) {
    return (
      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap">
        <span>🚚</span> {est}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap">
      <span>📄</span> {est}
    </span>
  );
}
