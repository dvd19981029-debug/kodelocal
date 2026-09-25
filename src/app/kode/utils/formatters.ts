// src/app/kode/utils/formatters.ts

/**
 * Formatea una fecha ISO o timestamp a formato legible: DD/MM/YYYY HH:MM:SS
 */
export function formatearMarcaTemporal(fechaStr?: string): string {
  if (!fechaStr) return '';
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;
    const dia = d.getDate();
    const mes = d.getMonth() + 1;
    const anio = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const segs = String(d.getSeconds()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${horas}:${mins}:${segs}`;
  } catch {
    return fechaStr;
  }
}
