'use client';

import React, { useState, useRef } from 'react';
import {
  Building2,
  Copy,
  Check,
  Upload,
  Loader2,
  CheckCircle2,
  Eye,
  MessageCircle,
  FileText,
} from 'lucide-react';
import {
  OFFICIAL_BANK_ACCOUNTS,
  TRANSFER_WHATSAPP_NUMBER,
  TRANSFER_WHATSAPP_DISPLAY,
  uploadEcommerceTransferReceipt,
  extractTransferReceiptUrl,
} from '@/lib/bankAccounts';
import { broadcastOrderSync } from '@/lib/supabaseClient';
import { TransferReceiptButton } from '@/components/common/TransferReceiptModal';

interface BankAccountsCardsListProps {
  compact?: boolean;
}

export function BankAccountsCardsList({ compact = false }: BankAccountsCardsListProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (value: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className={`grid grid-cols-1 ${compact ? 'gap-2.5' : 'sm:grid-cols-2 gap-3'} text-left`}>
      {OFFICIAL_BANK_ACCOUNTS.map((acc) => (
        <div
          key={acc.id}
          className={`bg-white rounded-2xl border ${acc.borderColor} ${
            compact ? 'p-3 space-y-2' : 'p-4 space-y-2.5'
          } shadow-xs`}
        >
          {/* Encabezado del Banco con Logo Oficial sin duplicar texto */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={acc.logoUrl}
                alt={acc.bankName}
                className={
                  acc.id === 'agricola'
                    ? 'h-5 sm:h-[22px] w-auto object-contain shrink-0'
                    : 'h-4 sm:h-[18px] w-auto object-contain shrink-0'
                }
              />
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10.5px] font-extrabold text-slate-800 block leading-tight">
                {acc.accountType}
              </span>
              <span className="text-[9.5px] font-bold text-slate-500 block">
                {acc.personType}
              </span>
            </div>
          </div>

          {/* Número de Cuenta Destacado con Botón Copiar */}
          <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-200/80 flex items-center justify-between gap-2">
            <div>
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
                Número de cuenta
              </span>
              <span className={`font-mono font-black ${compact ? 'text-sm' : 'text-base'} ${acc.accentColor} tracking-wide`}>
                {acc.accountNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(acc.accountNumber, `${acc.id}-num`)}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 text-[10.5px] font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              {copiedKey === `${acc.id}-num` ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Datos del Titular y Correo */}
          <div className="space-y-1.5 text-[11px] pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium shrink-0">Titular:</span>
              <button
                type="button"
                onClick={() => handleCopy(acc.holderName, `${acc.id}-holder`)}
                className="font-extrabold text-slate-800 hover:text-indigo-700 text-right inline-flex items-center gap-1.5 px-2 py-0.5 -mr-1 rounded-md hover:bg-indigo-50/80 transition-colors cursor-pointer"
                title="Copiar nombre del titular"
              >
                <span>{acc.holderName}</span>
                {copiedKey === `${acc.id}-holder` ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600 shrink-0">
                    <Check className="w-3 h-3" />
                    Copiado
                  </span>
                ) : (
                  <Copy className="w-3 h-3 text-slate-400 hover:text-indigo-600 shrink-0" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium">Tipo:</span>
              <span className="font-bold text-slate-700 text-right">{acc.personType}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium shrink-0">Correo:</span>
              <button
                type="button"
                onClick={() => handleCopy(acc.email, `${acc.id}-email`)}
                className="font-mono font-bold text-indigo-600 hover:text-indigo-800 truncate inline-flex items-center gap-1 cursor-pointer"
                title="Copiar correo"
              >
                <span className="truncate">{acc.email}</span>
                {copiedKey === `${acc.id}-email` ? (
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : (
                  <Copy className="w-2.5 h-2.5 opacity-60 shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface OrderTransferReceiptSectionProps {
  orderId?: string;
  orderNumber: string;
  total?: number;
  customerName?: string;
  initialReceiptUrl?: string | null;
  orderNotes?: string | null;
  customerToken?: string | null;
  compact?: boolean;
  onReceiptSaved?: (url: string) => void;
}

export function OrderTransferReceiptSection({
  orderId,
  orderNumber,
  total,
  customerName,
  initialReceiptUrl,
  orderNotes,
  customerToken,
  compact = false,
  onReceiptSaved,
}: OrderTransferReceiptSectionProps) {
  const resolvedInitial =
    initialReceiptUrl || extractTransferReceiptUrl({ transferReceiptUrl: initialReceiptUrl, notes: orderNotes });

  const [receiptUrl, setReceiptUrl] = useState<string | null>(resolvedInitial);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    setJustUploaded(false);

    try {
      const uploadedUrl = await uploadEcommerceTransferReceipt(file);

      const res = await fetch('/api/ecommerce/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
        },
        body: JSON.stringify({
          orderId,
          orderNumber,
          transferReceiptUrl: uploadedUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo adjuntar el comprobante a la orden.');
      }

      setReceiptUrl(uploadedUrl);
      setJustUploaded(true);
      onReceiptSaved?.(uploadedUrl);

      broadcastOrderSync({
        action: 'transfer_receipt_uploaded',
        saleNumber: orderNumber,
      });
    } catch (err: any) {
      setUploadError(err?.message || 'Error al subir el comprobante. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const whatsappText = `Hola Aromaniak, adjunto comprobante de transferencia para mi pedido #${orderNumber}${
    typeof total === 'number' && total > 0 ? ` por $${total.toFixed(2)}` : ''
  }`;
  const whatsappHref = `https://wa.me/${TRANSFER_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="space-y-3 text-left">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Instrucción clara: WhatsApp o subir archivo aquí */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
        <p className="font-bold text-slate-800">
          📲 ¿Cómo enviar tu comprobante?
        </p>
        <p className="text-[11.5px] text-slate-600 mt-0.5">
          Envía tu comprobante de transferencia por <strong>WhatsApp ({TRANSFER_WHATSAPP_DISPLAY})</strong> o, si prefieres, también puedes <strong>subir aquí mismo el archivo del comprobante</strong> (foto o PDF).
        </p>
      </div>

      {/* Estado de comprobante subido */}
      {receiptUrl && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-emerald-900">
                {justUploaded ? '¡Comprobante subido correctamente!' : 'Comprobante adjuntado'}
              </p>
              <p className="text-[10.5px] text-emerald-700 font-medium">
                Nuestro equipo verificará y aprobará tu transferencia manualmente.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <TransferReceiptButton
              receiptUrl={receiptUrl}
              orderNumber={orderNumber}
              customerName={customerName}
              total={total}
              size="xs"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10.5px] font-bold cursor-pointer transition-colors"
            >
              Cambiar archivo
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
          {uploadError}
        </div>
      )}

      {/* Botones de Acción: WhatsApp y Subir Comprobante */}
      <div className={`grid grid-cols-1 ${compact ? 'gap-2' : 'sm:grid-cols-2 gap-2.5'}`}>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span>Enviar Comprobante por WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Subiendo comprobante...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 shrink-0" />
              <span>{receiptUrl ? 'Subir otro Comprobante' : 'Subir Archivo de Comprobante'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
