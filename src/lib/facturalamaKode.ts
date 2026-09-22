// src/lib/facturalamaKode.ts
// Emisor oficial de DTE para KODE a través de Factura Llama según el payload exacto de la empresa

import { randomUUID } from 'crypto';
import { getKodeConfig, getActiveFacturaLlamaApiKey } from './kodeConfig';
import { resolveMhDeptoCode, resolveMhMunicipioCodeFromKode } from './svTerritory';

export interface KodeDteItem {
  kodigo: string;
  nombre_mh: string;
  cantidad?: number;
  precio_sin_iva: number;
}

export interface EmitirDteKodeInput {
  id_pedido: string;
  usuario?: string;
  cliente_nombre: string;
  cliente_correo?: string;
  cliente_tipo_doc?: string; // 'DUI' | 'NIT' | etc.
  cliente_num_doc?: string;
  cliente_direccion: string;
  cliente_departamento?: string; // Nombre o código MH (ej. "San Salvador" o "06")
  cliente_municipio?: string;    // Nombre o código MH (ej. "SAN SALVADOR" o "23")
  items: KodeDteItem[];
  comentarios?: string;
}

export interface KodeDteResult {
  success: boolean;
  codigo_generacion: string;
  numero_control?: string;
  sello_recepcion?: string;
  fh_procesamiento?: string;
  estado: string;
  mensaje: string;
  pdf_url?: string;
  json_url?: string;
  rawResponse?: any;
  sentPayload?: any;
}

/**
 * Construye el payload exacto requerido por Factura Llama para KODE
 */
export function buildKodeDtePayload(input: EmitirDteKodeInput) {
  const config = getKodeConfig();
  const dteId = randomUUID();

  // Limpieza de documento
  const cleanDoc = (input.cliente_num_doc || config.defaultDui).replace(/\D/g, '');

  // Resolución de códigos MH de departamento y municipio
  const deptoMh = resolveMhDeptoCode(input.cliente_departamento || '06');
  const muniMh = resolveMhMunicipioCodeFromKode(input.cliente_municipio || 'SAN SALVADOR');

  const payload = {
    id: dteId,
    recipient: {
      name: input.cliente_nombre.trim(),
      email: input.cliente_correo?.trim() || config.defaultEmail,
      identificationDocument: {
        type: input.cliente_tipo_doc?.trim() || 'DUI',
        number: cleanDoc || '123456789',
      },
      address: {
        department: deptoMh || '06',
        municipality: muniMh || '23',
        complement: (input.cliente_direccion || 'San Salvador, El Salvador').slice(0, 100),
      },
    },
    items: input.items.map((it) => ({
      type: 'BIENES',
      internalCode: String(it.kodigo).slice(0, 25),
      description: String(it.nombre_mh).slice(0, 200),
      quantity: Math.max(1, Number(it.cantidad || 1)),
      unitPrice: Number(it.precio_sin_iva || 0),
      saleType: 'GRAVADA',
    })),
    apendice: [
      {
        campo: 'ID-Pedido',
        etiqueta: 'Pedido',
        valor: String(input.id_pedido),
      },
    ],
    retentionRenta: 0,
    retentionIva: 0,
    comments: input.comentarios || `Pedido ID: ${input.id_pedido} | Usuario: ${input.usuario || 'Kode Sales'}`,
  };

  return { dteId, payload };
}

/**
 * Emite el DTE llamando directamente a la API de Factura Llama con la API Key configurada
 */
export async function emitirDteKode(input: EmitirDteKodeInput): Promise<KodeDteResult> {
  const config = getKodeConfig();
  const activeApiKey = getActiveFacturaLlamaApiKey(config);
  const { dteId, payload } = buildKodeDtePayload(input);
  const endpoint = `${config.facturaLlamaBaseUrl}/dte/fc`;

  console.log(`[FacturaLlama KODE] [${config.ambiente.toUpperCase()}] Transmitiendo DTE para pedido ${input.id_pedido} a ${endpoint} con API Key ${activeApiKey.slice(0, 10)}...`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': activeApiKey,
        'X-API-Version': config.facturaLlamaApiVersion,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = Array.isArray(data.message)
        ? data.message.join('; ')
        : (data.message || data.error || `HTTP ${response.status} en Factura Llama`);

      console.error('[FacturaLlama KODE RECHAZO]', response.status, data);

      return {
        success: false,
        codigo_generacion: dteId,
        estado: 'RECHAZADO',
        mensaje: errorMsg,
        rawResponse: data,
        sentPayload: payload,
      };
    }

    const mhData = data.mhResponse?.data;
    const dteData = data.dte?.identificacion;
    const codGen = data.id || dteData?.codigoGeneracion || dteId;
    const numCtrl = data.controlNumber || dteData?.numeroControl || '';
    const sello = mhData?.selloRecibido || data.selloRecibido || data.dte?.selloRecibido;

    return {
      success: true,
      codigo_generacion: codGen,
      numero_control: numCtrl,
      sello_recepcion: sello,
      fh_procesamiento: mhData?.fhProcesamiento || data.generatedAt || new Date().toISOString(),
      estado: 'PROCESADO',
      mensaje: mhData?.descripcionMsg || 'DTE de Kode emitido con éxito.',
      pdf_url: `${config.facturaLlamaBaseUrl}/dte/${codGen}/download/pdf`,
      json_url: `${config.facturaLlamaBaseUrl}/dte/${codGen}/download/json`,
      rawResponse: data,
      sentPayload: payload,
    };
  } catch (error: any) {
    console.error('[FacturaLlama KODE Network Error]', error);
    return {
      success: false,
      codigo_generacion: dteId,
      estado: 'ERROR',
      mensaje: error.message || 'Error de conexión con Factura Llama',
      sentPayload: payload,
    };
  }
}
