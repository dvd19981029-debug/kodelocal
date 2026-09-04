// src/lib/facturalama.ts
import { randomUUID } from 'crypto';

export interface DteItemInput {
  codigo?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  tipoItem?: number; // 1 = Bienes (default), 2 = Servicios
}

export interface DteCustomerInput {
  nombre: string;
  tipoDocumento?: string; // "13" = DUI, "36" = NIT
  numDocumento?: string;
  nrc?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  codActividad?: string;
  descActividad?: string;
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
  rawResponse?: any;
}

export class FacturaLlamaClient {
  private apiKey: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.FACTURALLAMA_API_KEY || 'simulado_kodelocal_dev';
    this.apiVersion = process.env.FACTURALLAMA_API_VERSION || '1';
    this.baseUrl = process.env.FACTURALLAMA_BASE_URL || 'https://api.facturallama.com';
  }

  isSimulated(): boolean {
    return !this.apiKey || this.apiKey.startsWith('simulado_') || this.apiKey.trim() === '';
  }

  /**
   * Genera el número de control reglamentario de El Salvador:
   * DTE-01-M001P001-000000000000001
   */
  generateNumeroControl(tipoDte: '01' | '03' | '14', correlativo: number = 1): string {
    const establecimiento = 'M001';
    const puntoVenta = 'P001';
    const corrStr = String(correlativo).padStart(15, '0');
    return `DTE-${tipoDte}-${establecimiento}${puntoVenta}-${corrStr}`;
  }

  /**
   * Emitir Factura de Consumidor Final (DTE-01) o Crédito Fiscal (DTE-03)
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
    const codigoGeneracion = randomUUID().toUpperCase();
    const numeroControl = this.generateNumeroControl(tipoDte, correlativo);
    const now = new Date();

    // Si estamos en modo simulado, respondemos con datos realistas
    if (this.isSimulated()) {
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

    // Modo Producción con Factura Llama
    try {
      const payload = this.buildDtePayload({
        tipoDte,
        codigoGeneracion,
        numeroControl,
        items,
        cliente,
        fechaHora: now
      });

      const response = await fetch(`${this.baseUrl}/dte/firmar-y-transmitir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-API-Version': this.apiVersion
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          simulated: false,
          tipoDte,
          codigoGeneracion,
          numeroControl,
          fhProcesamiento: now.toISOString(),
          estado: 'RECHAZADO',
          mensaje: data.message || `Error en FacturaLlama HTTP ${response.status}`,
          rawResponse: data
        };
      }

      return {
        success: true,
        simulated: false,
        tipoDte,
        codigoGeneracion,
        numeroControl,
        selloRecepcion: data.selloRecepcion || data.sello,
        fhProcesamiento: data.fhProcesamiento || now.toISOString(),
        estado: data.estado === 'RECHAZADO' ? 'RECHAZADO' : 'PROCESADO',
        mensaje: data.mensaje || 'DTE transmitido a Ministerio de Hacienda con éxito.',
        rawResponse: data
      };
    } catch (error: any) {
      return {
        success: false,
        simulated: false,
        tipoDte,
        codigoGeneracion,
        numeroControl,
        fhProcesamiento: now.toISOString(),
        estado: 'ERROR',
        mensaje: error.message || 'Error de conexión con FacturaLlama',
      };
    }
  }

  /**
   * Construye el JSON oficial reglamentario para el MH de El Salvador
   */
  private buildDtePayload(params: {
    tipoDte: '01' | '03';
    codigoGeneracion: string;
    numeroControl: string;
    items: DteItemInput[];
    cliente?: DteCustomerInput;
    fechaHora: Date;
  }) {
    const { tipoDte, codigoGeneracion, numeroControl, items, cliente, fechaHora } = params;
    const fecEmi = fechaHora.toISOString().split('T')[0];
    const horEmi = fechaHora.toTimeString().split(' ')[0];

    const cuerpoDocumento = items.map((it, idx) => {
      const precioUni = Number(it.precioUnitario.toFixed(2));
      const subtotal = Number((precioUni * it.cantidad).toFixed(2));
      return {
        numItem: idx + 1,
        tipoItem: it.tipoItem || 1, // 1: Bienes
        cantidad: it.cantidad,
        codigo: it.codigo || `PROD-${idx + 1}`,
        descripcion: it.descripcion,
        precioUni,
        montoDescu: 0.0,
        ventaNoSuj: 0.0,
        ventaExenta: 0.0,
        ventaGravada: subtotal,
        tributos: tipoDte === '03' ? ['20'] : null // 20: IVA 13% en crédito fiscal
      };
    });

    const totalGravada = cuerpoDocumento.reduce((acc, it) => acc + it.ventaGravada, 0);
    const iva13 = tipoDte === '03' ? Number((totalGravada * 0.13).toFixed(2)) : 0;
    const totalPagar = Number((totalGravada + iva13).toFixed(2));

    return {
      identificacion: {
        version: 1,
        ambiente: '00',
        tipoDte,
        numeroControl,
        codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        fecEmi,
        horEmi,
        tipoMoneda: 'USD'
      },
      emisor: {
        nit: process.env.NEXT_PUBLIC_BUSINESS_NIT?.replace(/-/g, '') || '06140101901011',
        nrc: process.env.NEXT_PUBLIC_BUSINESS_NRC || '1234567',
        nombre: process.env.NEXT_PUBLIC_BUSINESS_NAME || 'KodeLocal Store',
        codActividad: '47411',
        descActividad: process.env.NEXT_PUBLIC_BUSINESS_GIRO || 'Venta de productos de tecnología',
        nombreComercial: process.env.NEXT_PUBLIC_BUSINESS_NAME || 'KodeLocal',
        tipoEstablecimiento: '01',
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: 'San Salvador, El Salvador'
        },
        telefono: '22000000',
        correo: 'facturacion@kodelocal.com'
      },
      receptor: {
        tipoDocumento: cliente?.tipoDocumento || '13',
        numDocumento: cliente?.numDocumento || '00000000-0',
        nombre: cliente?.nombre || 'Cliente General',
        nrc: cliente?.nrc || null,
        correo: cliente?.correo || null,
        telefono: cliente?.telefono || null,
        direccion: {
          departamento: '06',
          municipio: '14',
          complemento: cliente?.direccion || 'San Salvador'
        }
      },
      cuerpoDocumento,
      resumen: {
        totalGravada,
        subTotalVentas: totalGravada,
        montoTotalOperacion: totalGravada,
        subTotal: totalGravada,
        tributos: tipoDte === '03' ? [{ codigo: '20', descripcion: 'IVA 13%', valor: iva13 }] : null,
        totalPagar,
        condicionOperacion: 1
      }
    };
  }
}

export const facturaLlama = new FacturaLlamaClient();
