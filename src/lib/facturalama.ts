// src/lib/facturalama.ts
import { randomUUID } from 'crypto';
import { resolveDepartamentoCode, resolveMunicipioCode } from './svTerritory';

export interface DteItemInput {
  codigo?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  tipoItem?: number; // 1 = Bienes (default), 2 = Servicios
}

export interface DteCustomerInput {
  nombre: string;
  tipoDocumento?: string; // "DUI" | "NIT" | "13" | "36"
  numDocumento?: string;
  nrc?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  codActividad?: string;
  descActividad?: string;
  departamento?: string;
  municipio?: string;
}

export interface DteEmissionResult {
  success: boolean;
  simulated: boolean;
  tipoDte: string;
  codigoGeneracion: string;
  numeroControl: string;
  selloRecepcion?: string;
  fhProcesamiento: string;
  estado: 'PROCESADO' | 'RECHAZADO' | 'SIMULADO' | 'ERROR';
  mensaje: string;
  mhDteUrl?: string;
  pdfUrl?: string;
  jsonUrl?: string;
  rawResponse?: any;
}

export class FacturaLlamaClient {
  private apiKey: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.FACTURALLAMA_API_KEY || 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1';
    this.apiVersion = process.env.FACTURALLAMA_API_VERSION || '1';
    this.baseUrl = process.env.FACTURALLAMA_BASE_URL || 'https://api.facturallama.com';
  }

  getApiKey(): string {
    return process.env.FACTURALLAMA_API_KEY || this.apiKey || 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1';
  }

  isSimulated(): boolean {
    if (process.env.FACTURALLAMA_SIMULATED === 'true') return true;
    const key = this.getApiKey();
    return !key || key.startsWith('simulado_') || key.startsWith('dummy_');
  }

  /**
   * Genera el número de control reglamentario de El Salvador (fallback de simulación)
   */
  generateNumeroControl(tipoDte: '01' | '03' | '14', correlativo: number = 1): string {
    const establecimiento = 'M001';
    const puntoVenta = 'P001';
    const corrStr = String(correlativo).padStart(15, '0');
    return `DTE-${tipoDte}-${establecimiento}${puntoVenta}-${corrStr}`;
  }

  /**
   * Emitir Factura de Consumidor Final (DTE-01 /dte/fc) o Crédito Fiscal (DTE-03 /dte/ccf)
   */
  async emitirDte(params: {
    tipoDte: '01' | '03';
    saleId: string;
    items: DteItemInput[];
    cliente?: DteCustomerInput;
    metodoPago?: string;
    correlativo?: number;
  }): Promise<DteEmissionResult> {
    const { tipoDte, items, cliente, correlativo = Math.floor(Math.random() * 100000) } = params;
    const codigoGeneracion = randomUUID();
    const now = new Date();

    // 1. Modo Simulación Explícito
    if (this.isSimulated()) {
      const numeroControl = this.generateNumeroControl(tipoDte, correlativo);
      return {
        success: true,
        simulated: true,
        tipoDte,
        codigoGeneracion,
        numeroControl,
        selloRecepcion: `2026${tipoDte}${Date.now().toString(16).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        fhProcesamiento: now.toISOString(),
        estado: 'PROCESADO',
        mensaje: `DTE-${tipoDte} emitido exitosamente (Modo Simulación Activo).`,
        rawResponse: {
          simulated: true,
          ambiente: '00 - PRUEBAS',
          mh_status: 'RECIBIDO_Y_VALIDADO'
        }
      };
    }

    // 2. Transmisión Real a la API de Factura Llama
    try {
      const endpoint = tipoDte === '03' ? `${this.baseUrl}/dte/ccf` : `${this.baseUrl}/dte/fc`;
      const payload = this.buildFacturaLlamaPayload({
        tipoDte,
        codigoGeneracion,
        items,
        cliente,
        metodoPago: params.metodoPago,
      });

      console.log(`[FacturaLlama] Transmitiendo DTE-${tipoDte} a ${endpoint}...`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.getApiKey(),
          'X-API-Version': this.apiVersion,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetail = Array.isArray(data.message)
          ? data.message.join('; ')
          : (data.message || data.error || `HTTP ${response.status} en FacturaLlama`);

        console.error('[FacturaLlama RECHAZO]', response.status, data);

        return {
          success: false,
          simulated: false,
          tipoDte,
          codigoGeneracion,
          numeroControl: '',
          fhProcesamiento: now.toISOString(),
          estado: 'RECHAZADO',
          mensaje: errorDetail,
          rawResponse: data,
        };
      }

      // Éxito: mapear respuesta oficial
      const mhData = data.mhResponse?.data;
      const dteData = data.dte?.identificacion;
      const codGen = data.id || dteData?.codigoGeneracion || codigoGeneracion;
      const numCtrl = data.controlNumber || dteData?.numeroControl || '';
      const sello = mhData?.selloRecibido || data.selloRecibido || data.dte?.selloRecibido;
      const mhUrl = data.mhDteUrl || (codGen ? `https://admin.factura.gob.sv/consultaPublica?ambiente=00&codGen=${codGen}&fechaEmi=${now.toISOString().split('T')[0]}` : undefined);
      const pdfUrl = `${this.baseUrl}/dte/${codGen}/download/pdf`;
      const jsonUrl = `${this.baseUrl}/dte/${codGen}/download/json`;

      console.log('[FacturaLlama ÉXITO]', {
        tipoDte,
        codigoGeneracion: codGen,
        numeroControl: numCtrl,
        sello,
        status: data.status,
      });

      return {
        success: true,
        simulated: false,
        tipoDte,
        codigoGeneracion: codGen,
        numeroControl: numCtrl,
        selloRecepcion: sello,
        fhProcesamiento: mhData?.fhProcesamiento || data.generatedAt || now.toISOString(),
        estado: (data.status === 'APPROVED' || mhData?.estado === 'PROCESADO' || data.status === 'CREATED') ? 'PROCESADO' : 'RECHAZADO',
        mensaje: mhData?.descripcionMsg || 'DTE transmitido a Ministerio de Hacienda y Factura Llama con éxito.',
        mhDteUrl: mhUrl,
        pdfUrl,
        jsonUrl,
        rawResponse: data,
      };
    } catch (error: any) {
      console.error('[FacturaLlama Network Error]', error);
      return {
        success: false,
        simulated: false,
        tipoDte,
        codigoGeneracion,
        numeroControl: '',
        fhProcesamiento: now.toISOString(),
        estado: 'ERROR',
        mensaje: error.message || 'Error de conexión con el servicio FacturaLlama',
      };
    }
  }

  /**
   * Construye el DTO que espera la API oficial de Factura Llama (/dte/fc y /dte/ccf)
   */
  private buildFacturaLlamaPayload(params: {
    tipoDte: '01' | '03';
    codigoGeneracion: string;
    items: DteItemInput[];
    cliente?: DteCustomerInput;
    metodoPago?: string;
  }) {
    const { tipoDte, codigoGeneracion, items, cliente, metodoPago } = params;

    // 1. Mapeo de Items:
    // Los precios en el POS incluyen el 13% de IVA. Factura Llama requiere el unitPrice antes de IVA
    // y calcula automáticamente el impuesto gravado al 13%.
    const formattedItems = items.map((it, idx) => {
      const precioConIva = Number(it.precioUnitario) || 0;
      const precioNeto = Number((precioConIva / 1.13).toFixed(4));
      return {
        type: it.tipoItem === 2 ? 'SERVICIOS' : 'BIENES',
        internalCode: (it.codigo || `PROD-${idx + 1}`).slice(0, 25),
        description: (it.descripcion || 'Producto').slice(0, 200),
        quantity: Math.max(1, Math.round(it.cantidad || 1)),
        unitPrice: precioNeto > 0 ? precioNeto : 0.01,
        saleType: 'GRAVADA',
      };
    });

    const paymentType = metodoPago === 'CREDITO' ? 'CREDITO' : 'CONTADO';

    // 2. Factura de Consumidor Final (DTE-01)
    if (tipoDte === '01') {
      const recipient: any = {
        name: cliente?.nombre?.trim() || 'Consumidor Final',
      };

      const rawDoc = (cliente?.numDocumento || '').replace(/\D/g, '');
      if (rawDoc) {
        if (rawDoc.length === 9) {
          recipient.identificationDocument = {
            type: 'DUI',
            number: rawDoc,
          };
        } else if (rawDoc.length === 14) {
          recipient.identificationDocument = {
            type: 'NIT',
            number: rawDoc,
          };
        }
      }

      if (cliente?.direccion?.trim() || cliente?.departamento || cliente?.municipio) {
        const deptCode = resolveDepartamentoCode(cliente?.departamento);
        const muniCode = resolveMunicipioCode(deptCode, cliente?.municipio);
        recipient.address = {
          department: deptCode,
          municipality: muniCode,
          complement: cliente?.direccion?.trim() || 'San Salvador, El Salvador',
        };
      }

      const email = cliente?.correo?.trim();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        recipient.email = email;
      }

      const phoneDigits = (cliente?.telefono || '').replace(/\D/g, '').slice(-8);
      if (phoneDigits.length === 8) {
        recipient.phone = phoneDigits;
      }

      return {
        id: codigoGeneracion,
        paymentType,
        recipient,
        items: formattedItems,
      };
    }

    // 3. Comprobante de Crédito Fiscal (DTE-03)
    const rawDoc = (cliente?.numDocumento || '').replace(/\D/g, '');
    const cleanNrc = (cliente?.nrc || '').replace(/\D/g, '') || '1234567';

    const deptCodeCCF = resolveDepartamentoCode(cliente?.departamento);
    const muniCodeCCF = resolveMunicipioCode(deptCodeCCF, cliente?.municipio);

    const recipientCCF: any = {
      name: cliente?.nombre?.trim() || 'Empresa Cliente S.A. de C.V.',
      nrc: cleanNrc.slice(0, 8),
      economicActivity: cliente?.codActividad || '47411',
      contributorType: 'JURIDICA',
      email: (cliente?.correo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.correo.trim()))
        ? cliente.correo.trim()
        : 'facturacion@kodelocal.com',
      identificationDocument: {
        type: rawDoc.length === 9 ? 'DUI' : 'NIT',
        number: rawDoc.length === 9 ? rawDoc : (rawDoc.length === 14 ? rawDoc : '06140101901011'),
      },
      address: {
        department: deptCodeCCF,
        municipality: muniCodeCCF,
        complement: cliente?.direccion?.trim() || 'San Salvador, El Salvador',
      },
    };

    const phoneDigits = (cliente?.telefono || '').replace(/\D/g, '').slice(-8);
    if (phoneDigits.length === 8) {
      recipientCCF.phone = phoneDigits;
    }

    return {
      id: codigoGeneracion,
      paymentType,
      recipient: recipientCCF,
      items: formattedItems,
    };
  }

  /**
   * Obtiene un DTE por su ID (UUID)
   */
  async getDte(id: string) {
    const response = await fetch(`${this.baseUrl}/dte/${id}`, {
      headers: {
        'X-API-Key': this.getApiKey(),
      },
    });
    return response.json();
  }

  /**
   * Descarga la representación gráfica en PDF
   */
  async getPdfStream(id: string) {
    return fetch(`${this.baseUrl}/dte/${id}/download/pdf`, {
      headers: {
        'X-API-Key': this.getApiKey(),
      },
    });
  }

  /**
   * Descarga el JSON oficial del DTE
   */
  async getJsonStream(id: string) {
    return fetch(`${this.baseUrl}/dte/${id}/download/json`, {
      headers: {
        'X-API-Key': this.getApiKey(),
      },
    });
  }
}

export const facturaLlama = new FacturaLlamaClient();
