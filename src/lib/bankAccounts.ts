// src/lib/bankAccounts.ts

export interface BankAccountInfo {
  id: 'agricola' | 'bac';
  bankName: string;
  shortName: string;
  logoUrl: string;
  accountType: string;
  accountNumber: string;
  holderName: string;
  personType: string;
  email: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentColor: string;
}

export const OFFICIAL_BANK_ACCOUNTS: BankAccountInfo[] = [
  {
    id: 'agricola',
    bankName: 'Bancoagrícola',
    shortName: 'Bancoagrícola',
    logoUrl: '/images/banks/bancoagricola.svg?v=2026',
    accountType: 'Cuenta Corriente',
    accountNumber: '5520052467',
    holderName: 'Grupo Kode SaS De Cv',
    personType: 'Persona jurídica',
    email: 'ventas@forbiddensoluciones.com',
    badgeBg: 'bg-slate-100 border-slate-200 text-slate-900',
    badgeText: 'text-slate-800',
    borderColor: 'border-slate-200',
    accentColor: 'text-slate-900',
  },
  {
    id: 'bac',
    bankName: 'BAC Credomatic',
    shortName: 'BAC',
    logoUrl: '/images/banks/bac.svg',
    accountType: 'Cuenta Corriente',
    accountNumber: '201670668',
    holderName: 'Grupo Kode SaS De Cv',
    personType: 'Persona jurídica',
    email: 'ventas@forbiddensoluciones.com',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-900',
    badgeText: 'text-rose-800',
    borderColor: 'border-slate-200',
    accentColor: 'text-slate-900',
  },
];

export const TRANSFER_WHATSAPP_NUMBER = '50360437496';
export const TRANSFER_WHATSAPP_DISPLAY = '6043-7496';

const RECEIPT_TAG_REGEX = /\[COMPROBANTE_URL:([^\]]+)\]/i;

export function extractTransferReceiptUrl(orderOrNotes?: any): string | null {
  if (!orderOrNotes) return null;
  if (typeof orderOrNotes === 'string') {
    const match = orderOrNotes.match(RECEIPT_TAG_REGEX);
    return match ? match[1].trim() : null;
  }
  if (orderOrNotes.transferReceiptUrl && typeof orderOrNotes.transferReceiptUrl === 'string') {
    const direct = orderOrNotes.transferReceiptUrl.trim();
    if (direct) return direct;
  }
  const notes = String(orderOrNotes.notes || orderOrNotes.deliveryNotes || '');
  const match = notes.match(RECEIPT_TAG_REGEX);
  return match ? match[1].trim() : null;
}

export function stripTransferReceiptTag(notes?: string | null): string {
  if (!notes) return '';
  return String(notes).replace(/\[COMPROBANTE_URL:[^\]]+\]/gi, '').trim();
}

export function upsertTransferReceiptInNotes(
  existingNotes: string | null | undefined,
  receiptUrl: string
): string {
  const clean = stripTransferReceiptTag(existingNotes);
  const tag = `[COMPROBANTE_URL:${receiptUrl.trim()}]`;
  return clean ? `${clean} ${tag}` : tag;
}

/**
 * Sube un archivo de comprobante (imagen o PDF) al endpoint público de ecommerce.
 * Si es imagen grande, la optimiza antes de subir para máxima rapidez en móvil.
 */
export async function uploadEcommerceTransferReceipt(file: File): Promise<string> {
  // Si es PDF o archivo que no es imagen comprimible en canvas, enviar por FormData directamente
  if (file.type === 'application/pdf' || !file.type.startsWith('image/')) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/ecommerce/orders/upload-comprobante', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.url) {
      throw new Error(data.error || 'No se pudo subir el comprobante.');
    }
    return data.url;
  }

  // Optimizar imagen en cliente (máx 1400px) para subida rápida
  const dataUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return reject(new Error('No se pudo leer la imagen'));
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 1400;
          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(result);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.84));
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });

  const res = await fetch('/api/ecommerce/orders/upload-comprobante', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUri }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !data.url) {
    throw new Error(data.error || 'No se pudo subir el comprobante.');
  }
  return data.url;
}
