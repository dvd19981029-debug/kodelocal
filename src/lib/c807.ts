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
    this.basicAuth = process.env.C807_BASIC_AUTH || 'Basic YWRtaW5AbHVpc2VnbToyMDI2';
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
      const muniId = resolveC807MunicipioId(input.cliente_municipio, deptoId);

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
            telefono: cleanPhone || '78339470',
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

      if (numGuia && !linkRastreo) {
        linkRastreo = `https://app.c807.com/tracking?guide=${encodeURIComponent(numGuia)}`;
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
        link_rastreo: String(linkRastreo || `https://app.c807.com/tracking?guide=${encodeURIComponent(numGuia)}`),
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
