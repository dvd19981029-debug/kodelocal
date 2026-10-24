// src/lib/c807.ts
// Cliente nativo para integración directa con C807 Express (Guías de Paquetería)

import { DEPTO_TO_ID, resolveC807MunicipioId } from './svTerritory';

export interface C807GuideInput {
  numero_pedido: string;
  cliente_nombre: string;
  cliente_direccion: string;
  cliente_telefono: string;
  cliente_correo?: string;
  cliente_departamento: string;
  cliente_municipio: string;
  cliente_referencia?: string;
  tipo_pago: string; // 'CONTRAENTREGA' | 'TRANSFERENCIA' | 'TARJETA'
  total: number;
  observaciones?: string;
  peso_libras?: number;
}

export interface C807GuideResult {
  success: boolean;
  numero_guia: string;
  link_rastreo: string;
  rawResponse?: any;
  sentPayload?: any;
  error?: string;
}

export class C807Client {
  private authUrl: string;
  private createGuideUrl: string;
  private basicAuth: string;
  private telegramToken: string;
  private telegramChatId: string;

  constructor() {
    this.authUrl = process.env.C807_AUTH_URL || 'https://app.c807.com/admin.php/sesion/get_token';
    this.createGuideUrl = process.env.C807_CREATE_GUIDE_URL || 'https://app.c807.com/guia.php/api/set_registro';
    const envBasic = process.env.C807_AROMANIAK_BASIC_AUTH || process.env.C807_BASIC_AUTH;
    this.basicAuth =
      envBasic && !envBasic.includes('YWRtaW5AbHVpc2VnbToyMDI2')
        ? (envBasic.startsWith('Basic ') ? envBasic : `Basic ${envBasic}`)
        : 'Basic QURNSU5Aa29kZToyMDI2'; // ADMIN@kode:2026
    this.telegramToken = process.env.TELEGRAM_TOKEN || '8865534990:AAHD-hl9hCzo9IUs4DL0n8TFiQ6BR0hCJow';
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID || '-5596828280';
  }

  /**
   * Solicita el access_token al endpoint de autenticación de C807 mediante Basic Auth
   */
  async obtenerToken(): Promise<string> {
    const response = await fetch(this.authUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.basicAuth,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error de autenticación con C807 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const token =
      data.access_token ||
      data.token ||
      data.data?.access_token ||
      this.buscarValorPorClaves(data, ['access_token', 'token']);

    if (!token) {
      throw new Error(`No se pudo obtener el 'access_token' de C807: ${JSON.stringify(data)}`);
    }

    return token;
  }

  /**
   * Genera la guía de envío directamente en C807 Express
   */
  async generarGuia(input: C807GuideInput): Promise<C807GuideResult> {
    try {
      // 1. Resolver identificadores territoriales oficiales requeridos por C807
      const deptoId = DEPTO_TO_ID[input.cliente_departamento?.trim()] || 11; // Default San Salvador (11)
      const muniId = resolveC807MunicipioId(input.cliente_municipio, deptoId, input.cliente_direccion);

      // 2. Determinar tipo de servicio y monto contra entrega
      const esContraEntrega = input.tipo_pago === 'CONTRAENTREGA';
      const tipoServicio = esContraEntrega ? 'CCE' : 'SER';
      const montoCce = esContraEntrega ? Number(input.total || 0) : 0;

      // 3. Formatear fecha de recolección (+24 horas)
      const fechaRecolecta = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const fechaStr = fechaRecolecta.toISOString().replace('T', ' ').substring(0, 16);

      // 4. Limpieza de teléfono y dirección
      const cleanPhone = (input.cliente_telefono || '').toString().replace(/\D/g, '');
      const direccionCompleta = input.cliente_referencia
        ? `${input.cliente_direccion} (Ref: ${input.cliente_referencia})`
        : input.cliente_direccion;

      // 5. Construir payload reglamentario de C807
      const payload = {
        recolecta_fecha: fechaStr,
        recolecta_comentario: 'Recolección solicitada desde App Kode',
        tipo_entrega: 'NRML',
        guias: [
          {
            orden: input.numero_pedido,
            nombre: input.cliente_nombre.trim(),
            direccion: direccionCompleta.trim(),
            telefono: cleanPhone || '60437496',
            correo: input.cliente_correo?.trim() || 'luisundae@gmail.com',
            tipo_servicio: tipoServicio,
            monto_cce: montoCce,
            departamento_id: deptoId,
            municipio_id: muniId,
            liquidacion_documentos: false,
            seguro: false,
            detalle: [
              {
                peso: input.peso_libras || 5,
                contenido: input.observaciones?.trim() || 'Fragancias y esencias de perfumería',
                unidad_medida: 'LB',
              },
            ],
          },
        ],
      };

      console.log(`[C807] Transmitiendo guía para pedido ${input.numero_pedido} a ${this.createGuideUrl}...`);

      // 6. Obtener token y enviar petición
      const token = await this.obtenerToken();

      const response = await fetch(this.createGuideUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg =
          responseData.message ||
          responseData.error ||
          `HTTP ${response.status} en C807 Express`;
        console.error('[C807 RECHAZO]', response.status, responseData);
        return {
          success: false,
          numero_guia: '',
          link_rastreo: '',
          error: errorMsg,
          rawResponse: responseData,
          sentPayload: payload,
        };
      }

      // 7. Búsqueda recursiva del número de guía y enlace en la respuesta anidada
      const numGuia = this.buscarValorPorClaves(responseData, [
        'num_guia',
        'numero_guia',
        'guia',
        'tracking',
        'tracking_number',
        'numero',
        'codigo_rastreo',
      ]);

      let linkRastreo = this.buscarValorPorClaves(responseData, [
        'link',
        'url',
        'link_rastreo',
        'tracking_url',
        'url_rastreo',
        'pdf',
        'etiqueta',
        'pdf_guia',
        'seguimiento',
      ]);

      if (numGuia && (!linkRastreo || linkRastreo.includes('app.c807.com'))) {
        linkRastreo = `https://c807xpress.com/tracking/?guia=${encodeURIComponent(numGuia)}`;
      }

      if (!numGuia) {
        console.warn('[C807] No se detectó número de guía directo en la respuesta:', responseData);
        return {
          success: false,
          numero_guia: '',
          link_rastreo: '',
          error: 'C807 respondió exitosamente pero no devolvió un número de guía reconocible',
          rawResponse: responseData,
          sentPayload: payload,
        };
      }

      console.log(`[C807 ÉXITO] Guía generada: ${numGuia} para pedido ${input.numero_pedido}`);

      return {
        success: true,
        numero_guia: String(numGuia),
        link_rastreo: String(linkRastreo || `https://c807xpress.com/tracking/?guia=${encodeURIComponent(numGuia)}`),
        rawResponse: responseData,
        sentPayload: payload,
      };
    } catch (error: any) {
      console.error('[C807 Network Error]', error);
      return {
        success: false,
        numero_guia: '',
        link_rastreo: '',
        error: error.message || 'Error de conexión con el servicio C807 Express',
      };
    }
  }

  /**
   * Consulta en tiempo real el estado actual de una guía directamente en C807 Xpress
   */
  async consultarEstadoGuia(numeroGuia: string): Promise<{
    found: boolean;
    guia: string;
    estatus: string;
    codigo: string;
    esEntregado: boolean;
    esEnRuta: boolean;
    fechaEntrega: string | null;
    destinatario?: string | null;
  }> {
    const cleanGuia = String(numeroGuia || '').trim();
    if (!cleanGuia) {
      return {
        found: false,
        guia: '',
        estatus: 'Pendiente de guía',
        codigo: '',
        esEntregado: false,
        esEnRuta: false,
        fechaEntrega: null,
      };
    }

    try {
      const formBody = new URLSearchParams({ guia_xpress: cleanGuia }).toString();
      const res = await fetch('https://c807xpress.com/api-xpress-gacela/guia.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: formBody,
        cache: 'no-store',
      });

      if (!res.ok) {
        return {
          found: false,
          guia: cleanGuia,
          estatus: 'Guía registrada',
          codigo: '',
          esEntregado: false,
          esEnRuta: true,
          fechaEntrega: null,
        };
      }

      const data = await res.json();
      const guiaInfo = data?.status?.guia;
      const bitacora = Array.isArray(data?.status?.bitacora) ? data.status.bitacora : [];
      const latestEvent = bitacora[0] || null;

      if (!guiaInfo || (!guiaInfo.guia && bitacora.length === 0)) {
        return {
          found: false,
          guia: cleanGuia,
          estatus: 'Guía registrada',
          codigo: '',
          esEntregado: false,
          esEnRuta: true,
          fechaEntrega: null,
        };
      }

      const codigo = String(guiaInfo.estatus_codigo || latestEvent?.codigo || '').trim();
      const estatus = String(
        guiaInfo.estatus ||
          latestEvent?.estatus ||
          (codigo === '15' ? 'Llegó a su destino' : codigo === '13' ? 'Recogido en origen' : 'Creado en sistema')
      ).trim();
      const estatusLower = estatus.toLowerCase();

      const esEntregado =
        codigo === '15' ||
        estatusLower.includes('llegó a su destino') ||
        estatusLower.includes('llego a su destino') ||
        estatusLower.includes('entregad') ||
        Boolean(guiaInfo.entrega);

      const esEnRuta = !esEntregado;

      return {
        found: true,
        guia: String(guiaInfo.guia || cleanGuia),
        estatus,
        codigo,
        esEntregado,
        esEnRuta,
        fechaEntrega: guiaInfo.entrega || (esEntregado ? latestEvent?.fecha || null : null),
        destinatario: guiaInfo.destinatario || null,
      };
    } catch (err) {
      console.warn(`[C807 Live Status Check] No se pudo consultar guía ${cleanGuia}:`, err);
      return {
        found: false,
        guia: cleanGuia,
        estatus: 'Guía registrada',
        codigo: '',
        esEntregado: false,
        esEnRuta: true,
        fechaEntrega: null,
      };
    }
  }

  /**
   * Obtiene el PDF oficial de la guía/viñeta directamente desde C807 Express
   */
  async obtenerPdfGuia(numeroGuia: string): Promise<{
    success: boolean;
    pdfBuffer?: Buffer;
    error?: string;
  }> {
    const cleanGuia = String(numeroGuia || '').trim();
    if (!cleanGuia) {
      return { success: false, error: 'Número de guía requerido' };
    }

    try {
      const token = await this.obtenerToken();
      const pdfUrl = process.env.C807_GET_PDF_URL || 'https://app.c807.com/guia.php/api/get_pdf';

      const response = await fetch(pdfUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guias: [cleanGuia] }),
        cache: 'no-store',
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const arrBuf = await response.arrayBuffer();
        return { success: true, pdfBuffer: Buffer.from(arrBuf) };
      }

      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        const errMsg =
          data?.errores?.[0]?.mensaje ||
          data?.message ||
          data?.error ||
          `No se pudo obtener el PDF de la guía ${cleanGuia} en C807 (${response.status})`;
        return { success: false, error: errMsg };
      }

      const base64Pdf =
        data.pdf ||
        data.data?.pdf ||
        this.buscarValorPorClaves(data, ['pdf', 'archivo', 'documento', 'base64']);

      if (!base64Pdf || typeof base64Pdf !== 'string') {
        const errMsg =
          data?.errores?.[0]?.mensaje ||
          'C807 no devolvió el PDF para este número de guía';
        return { success: false, error: errMsg };
      }

      const cleanB64 = base64Pdf.replace(/^data:application\/pdf;base64,/i, '').trim();
      const pdfBuffer = Buffer.from(cleanB64, 'base64');
      return { success: true, pdfBuffer };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Error de conexión al descargar PDF desde C807',
      };
    }
  }

  /**
   * Envía un mensaje de alerta a Telegram
   */
  async enviarNotificacionTelegram(mensaje: string): Promise<boolean> {
    if (!this.telegramToken || !this.telegramChatId) return false;
    try {
      const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text: mensaje,
          parse_mode: 'Markdown',
        }),
      });
      return res.ok;
    } catch (e) {
      console.error('Error enviando alerta a Telegram:', e);
      return false;
    }
  }

  /**
   * Utilidad recursiva para encontrar un valor dada una lista de claves (Case-Insensitive)
   * Maneja cualquier estructura JSON anidada de respuestas de APIs externas.
   */
  buscarValorPorClaves(obj: any, claves: string[]): any {
    if (!obj || typeof obj !== 'object') return null;

    const lowerKeys = claves.map((k) => k.toLowerCase());

    // 1. Buscar en nivel actual
    for (const key of Object.keys(obj)) {
      if (lowerKeys.includes(key.toLowerCase())) {
        const val = obj[key];
        if (val !== null && val !== undefined && val !== '') {
          return val;
        }
      }
    }

    // 2. Buscar recursivamente en subniveles
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'object' && val !== null) {
        const res = this.buscarValorPorClaves(val, claves);
        if (res !== null && res !== undefined && res !== '') {
          return res;
        }
      }
    }

    return null;
  }
}

export const c807Client = new C807Client();
