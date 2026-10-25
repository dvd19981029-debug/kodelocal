// src/lib/c807.ts
// Cliente nativo para integración directa con C807 Express (Guías de Paquetería)

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFRawStream,
  PDFOperator,
  PDFNumber,
  StandardFonts,
  rgb,
  PDFFont,
} from 'pdf-lib';
import { DEPTO_TO_ID, resolveC807MunicipioId } from './svTerritory';

/**
 * Límites oficiales de caracteres según la documentación API de C807 Xpress
 * (POST https://app.c807.com/guia.php/api/set_registro)
 */
export const C807_LIMITS = {
  ORDEN: 25,          // string(25)
  NOMBRE: 75,         // string(75)
  IDENTIFICACION: 75, // string(75)
  DIRECCION: 250,     // string(250)
  TELEFONO: 25,       // string(25)
  CORREO: 75,         // string(75)
  CONTACTO: 75,       // string(75)
  REFERENCIA: 500,    // string(500)
  INDICACIONES: 500,  // string(500)
  CONTENIDO: 500,     // string(500)
} as const;

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

export interface C807TrackingEvaluation {
  pregunta: string;
  respuesta: string;
}

export interface C807TrackingPhoto {
  nombre: string;
  url: string;
  esFirma: boolean;
}

export interface C807TrackingStep {
  codigo: string;
  descripcion: string;
  completado: boolean;
  esIncidencia: boolean;
  ocultar: boolean;
}

export interface C807TrackingEvent {
  codigo: string;
  fecha: string;
  titulo: string;
  estatusOriginal: string;
  observaciones: string;
  esIncidencia: boolean;
  esEntregado: boolean;
  esDevolucion: boolean;
  etdMin?: string | null;
  etdMax?: string | null;
  fechaProgramada?: string | null;
  destinatario?: string | null;
  evaluacion: C807TrackingEvaluation[];
  fotos: C807TrackingPhoto[];
  firmas: C807TrackingPhoto[];
}

export interface C807DetailedTracking {
  found: boolean;
  guia: string;
  estatusActual: string;
  codigoActual: string;
  esEntregado: boolean;
  esDevolucion: boolean;
  tieneIncidencia: boolean;
  destinatario: string | null;
  direccion: string | null;
  fechaEntrega: string | null;
  etdMin: string | null;
  etdMax: string | null;
  indicaciones: string | null;
  flujo: C807TrackingStep[];
  bitacora: C807TrackingEvent[];
  todasLasFotos: C807TrackingPhoto[];
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

      // 4. Limpieza de teléfono y dirección respetando límites oficiales C807
      const cleanPhone = (input.cliente_telefono || '').toString().replace(/\D/g, '').slice(0, C807_LIMITS.TELEFONO);
      const rawDir = (input.cliente_direccion || '').trim();
      const rawRef = (input.cliente_referencia || '').trim();
      const direccionCompleta = rawRef
        ? `${rawDir} (Ref: ${rawRef})`
        : rawDir;

      // 5. Construir payload reglamentario de C807
      const payload = {
        recolecta_fecha: fechaStr,
        recolecta_comentario: 'Recolección solicitada desde App Kode',
        tipo_entrega: 'NRML',
        guias: [
          {
            orden: String(input.numero_pedido || '').trim().slice(0, C807_LIMITS.ORDEN),
            nombre: (input.cliente_nombre || '').trim().slice(0, C807_LIMITS.NOMBRE),
            direccion: direccionCompleta.trim().slice(0, C807_LIMITS.DIRECCION),
            telefono: cleanPhone || '60437496',
            correo: (input.cliente_correo?.trim() || 'luisundae@gmail.com').slice(0, C807_LIMITS.CORREO),
            tipo_servicio: tipoServicio,
            monto_cce: montoCce,
            departamento_id: deptoId,
            municipio_id: muniId,
            liquidacion_documentos: false,
            seguro: false,
            detalle: [
              {
                peso: input.peso_libras || 5,
                contenido: (input.observaciones?.trim() || 'Fragancias y esencias de perfumería').slice(0, C807_LIMITS.CONTENIDO),
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
   * Garantiza que un PDF de guía ocupe estrictamente 1 sola página (descarta desbordamientos en pág. 2+)
   */
  private async recortarPrimeraPaginaPdf(rawBuffer: Buffer): Promise<Buffer> {
    try {
      const srcDoc = await PDFDocument.load(rawBuffer, { ignoreEncryption: true });
      if (srcDoc.getPageCount() <= 1) {
        return rawBuffer;
      }
      const singlePageDoc = await PDFDocument.create();
      const [firstPage] = await singlePageDoc.copyPages(srcDoc, [0]);
      singlePageDoc.addPage(firstPage);
      const savedBytes = await singlePageDoc.save();
      return Buffer.from(savedBytes);
    } catch {
      return rawBuffer;
    }
  }

  private sanitizeWinAnsi(str: string): string {
    return (str || '')
      .normalize('NFC')
      .replace(/\uFB00/g, 'ff')
      .replace(/\uFB01/g, 'fi')
      .replace(/\uFB02/g, 'fl')
      .replace(/\uFB03/g, 'ffi')
      .replace(/\uFB04/g, 'ffl')
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u00A0/g, ' ')
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private unescapePdfLiteralBytes(raw: string): Buffer {
    const bytes: number[] = [];
    let i = 0;
    while (i < raw.length) {
      const ch = raw.charCodeAt(i);
      if (ch === 0x5c /* '\\' */ && i + 1 < raw.length) {
        i++;
        const next = raw.charCodeAt(i);
        if (next === 0x6e /* 'n' */) bytes.push(0x0a);
        else if (next === 0x72 /* 'r' */) bytes.push(0x0d);
        else if (next === 0x74 /* 't' */) bytes.push(0x09);
        else if (next === 0x62 /* 'b' */) bytes.push(0x08);
        else if (next === 0x66 /* 'f' */) bytes.push(0x0c);
        else if (next === 0x28 /* '(' */) bytes.push(0x28);
        else if (next === 0x29 /* ')' */) bytes.push(0x29);
        else if (next === 0x5c /* '\\' */) bytes.push(0x5c);
        else if (next === 0x0d /* CR */) {
          if (i + 1 < raw.length && raw.charCodeAt(i + 1) === 0x0a) i++;
        } else if (next === 0x0a /* LF */) {
          // Salto de línea escapado en literal PDF (continuación)
        } else if (next >= 0x30 && next <= 0x37) {
          let oct = raw[i];
          if (i + 1 < raw.length && raw.charCodeAt(i + 1) >= 0x30 && raw.charCodeAt(i + 1) <= 0x37) {
            oct += raw[++i];
            if (i + 1 < raw.length && raw.charCodeAt(i + 1) >= 0x30 && raw.charCodeAt(i + 1) <= 0x37) {
              oct += raw[++i];
            }
          }
          bytes.push(parseInt(oct, 8) & 0xff);
        } else {
          bytes.push(next & 0xff);
        }
      } else {
        bytes.push(ch & 0xff);
      }
      i++;
    }
    return Buffer.from(bytes);
  }

  private decodePdfTextTokens(contentLatin1: string): Array<{ x: number; y: number; text: string }> {
    const items: Array<{ x: number; y: number; text: string }> = [];
    const headerRegex = /BT\s+([\d.]+)\s+([\d.]+)\s+Td\s+\(/g;
    let match;
    while ((match = headerRegex.exec(contentLatin1)) !== null) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      let cursor = headerRegex.lastIndex;
      let depth = 1;
      while (cursor < contentLatin1.length && depth > 0) {
        const c = contentLatin1.charCodeAt(cursor);
        if (c === 0x5c /* '\\' */) {
          cursor += 2;
          continue;
        }
        if (c === 0x28 /* '(' */) depth++;
        else if (c === 0x29 /* ')' */) depth--;
        cursor++;
      }
      const rawLiteral = contentLatin1.slice(headerRegex.lastIndex, Math.max(headerRegex.lastIndex, cursor - 1));
      headerRegex.lastIndex = cursor;

      const buf = this.unescapePdfLiteralBytes(rawLiteral);
      let str = '';
      if (buf.length >= 2 && buf.length % 2 === 0 && (buf[0] === 0 || buf[1] === 0 || buf.some((b) => b === 0))) {
        for (let i = 0; i + 1 < buf.length; i += 2) {
          str += String.fromCharCode((buf[i] << 8) | buf[i + 1]);
        }
      } else {
        str = buf.toString('latin1');
      }
      items.push({ x, y, text: this.sanitizeWinAnsi(str) });
    }
    return items;
  }

  private wrapTextToLines(
    text: string,
    font: PDFFont,
    fontSize: number,
    maxWidth: number,
    firstLineMaxWidth?: number
  ): string[] {
    const clean = this.sanitizeWinAnsi(text);
    if (!clean) return [''];
    const words = clean.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const limit = lines.length === 0 && firstLineMaxWidth !== undefined ? firstLineMaxWidth : maxWidth;
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= limit) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          let chunk = '';
          for (const ch of word) {
            const nextLimit = lines.length === 0 && firstLineMaxWidth !== undefined ? firstLineMaxWidth : maxWidth;
            if (font.widthOfTextAtSize(chunk + ch, fontSize) <= nextLimit) {
              chunk += ch;
            } else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          currentLine = chunk;
        }
      }
    }
    if (currentLine || lines.length === 0) {
      lines.push(currentLine);
    }
    return lines;
  }

  private static cachedAromaniakLogoBytes: Buffer | null = null;
  private static cachedC807LogoBytes: Buffer | null = null;

  /**
   * Transforma el PDF oficial de C807 en la guía personalizada 4x4 pulgadas (288x288 pt) en Blanco y Negro
   * de Aromaniak × C807, conservando el mismo QR exacto (/I3) en ambas esquinas y todos los datos íntegros.
   */
  private async personalizarPdfGuiaC807(rawBuffer: Buffer, fallbackGuia = ''): Promise<Buffer> {
    try {
      const srcDoc = await PDFDocument.load(rawBuffer, { ignoreEncryption: true });
      if (srcDoc.getPageCount() === 0) {
        return rawBuffer;
      }
      const srcPage = srcDoc.getPages()[0];

      // 1. Extraer todos los tokens de texto de la primera página del PDF original de C807
      const tokens: Array<{ x: number; y: number; text: string }> = [];
      const pageContents = srcPage.node.Contents();
      if (pageContents) {
        const resolved = srcDoc.context.lookup(pageContents);
        if (resolved instanceof PDFRawStream) {
          try {
            const inflated = zlib.inflateSync(Buffer.from(resolved.contents)).toString('latin1');
            tokens.push(...this.decodePdfTextTokens(inflated));
          } catch {
            // Stream no comprimido con FlateDecode
          }
        }
      }
      if (tokens.length === 0) {
        for (const [, obj] of srcDoc.context.enumerateIndirectObjects()) {
          if (obj instanceof PDFRawStream && !obj.dict.get(PDFName.of('Subtype'))) {
            try {
              const inflated = zlib.inflateSync(Buffer.from(obj.contents)).toString('latin1');
              tokens.push(...this.decodePdfTextTokens(inflated));
            } catch {
              // Ignorar streams que no sean FlateDecode de texto
            }
          }
        }
      }

      const data = {
        hub: '',
        zonaBox2: '',
        deptoCode: '',
        municipio: '',
        tipoServicio: 'SER',
        diasFrecuencia: 'L M X J V S',
        remitenteNombre: 'Aromaniak SV',
        remitenteTelefono: '72304650 60437496',
        destinoNombre: '',
        destinoTelefono: '',
        destinoContacto: '',
        destinoDireccion: '',
        destinoReferencia: '',
        contenido: '',
        solicitud: '',
        noOrden: '',
        numeroGuia: fallbackGuia,
        piezas: '1 de 1',
        pago: 'Prepago',
        peso: '5.00 LB',
        pesoMaximo: '50.00 LB',
        tipoEntrega: 'NRML',
        especiales: '',
        tieneContraentrega: false,
        cobrarDestinatario: '0.00',
        c807Web: 'www.c807xpress.com/sv',
        c807Whatsapp: '72087895',
      };

      const leftTokens = tokens.filter((t) => t.x < 120 && t.text.length > 0);
      const muniParts: string[] = [];
      for (const lt of leftTokens) {
        if (/L\s*M\s*X\s*J\s*V\s*S/i.test(lt.text)) {
          data.diasFrecuencia = lt.text;
        } else if (lt.y >= 218) {
          data.hub = lt.text;
        } else if (lt.y >= 188 && lt.y < 218) {
          data.zonaBox2 = lt.text;
        } else if (lt.y >= 158 && lt.y < 188) {
          data.deptoCode = lt.text;
        } else if (lt.y >= 120 && lt.y < 158) {
          muniParts.push(lt.text);
        } else if (lt.y >= 90 && lt.y < 120) {
          data.tipoServicio = lt.text;
        }
      }
      if (muniParts.length > 0) {
        data.municipio = muniParts.join(' ');
      }

      const rightTokens = tokens.filter((t) => t.x >= 120 && t.text.length > 0);
      const labels = new Set([
        'Destino:',
        'Nombre:',
        'Teléfono:',
        'Contacto:',
        'Dirección:',
        'Referencia:',
        'Contenido:',
        'Solicitud:',
        'No. Orden:',
        'PAGO:',
        'Peso:',
        'Peso Máximo:',
        'Tipo de entrega:',
        'Especiales:',
        'Cobrar a destinatario:',
      ]);

      let seenDestinoHeader = false;
      let currentField: string | null = null;
      const accum: Record<string, string[]> = {};

      for (let i = 0; i < rightTokens.length; i++) {
        const tk = rightTokens[i];
        const txt = tk.text;

        if (!seenDestinoHeader) {
          if (txt === 'Destino:') {
            seenDestinoHeader = true;
            currentField = null;
            continue;
          }
          if (txt === 'Teléfono:') {
            currentField = 'remitenteTelefono';
            continue;
          }
          if (currentField === 'remitenteTelefono') {
            currentField = null;
            continue;
          }
          if (tk.y > 365) {
            data.remitenteNombre = txt;
          }
          continue;
        }

        // Banda central de Número de Guía y Contador de Bultos (185 <= y < 215 en PDF original C807)
        if (/^\d+\s+de\s+\d+$/i.test(txt)) {
          data.piezas = txt;
          currentField = null;
          continue;
        }
        if (tk.y >= 185 && tk.y < 215 && !labels.has(txt)) {
          data.numeroGuia = txt;
          currentField = null;
          continue;
        }
        if (/^(KODE-|C807)/i.test(txt) && tk.y < 225) {
          data.numeroGuia = txt;
          currentField = null;
          continue;
        }

        // Banda inferior de pie de página original de C807 (y < 95)
        if (txt.includes('c807xpress.com')) {
          data.c807Web = txt;
          currentField = null;
          continue;
        }
        if (txt === '72087895' || (tk.y < 95 && /^\d{8}$/.test(txt))) {
          data.c807Whatsapp = txt;
          currentField = null;
          continue;
        }

        if (labels.has(txt)) {
          currentField = txt;
          if (!accum[currentField]) accum[currentField] = [];
          continue;
        }

        if (currentField) {
          accum[currentField].push(txt);
        }
      }

      if (accum['Nombre:']?.length) data.destinoNombre = accum['Nombre:'].join(' ');
      if (accum['Teléfono:']?.length) data.destinoTelefono = accum['Teléfono:'].join(' ');
      if (accum['Contacto:']?.length) data.destinoContacto = accum['Contacto:'].join(' ');
      if (accum['Dirección:']?.length) data.destinoDireccion = accum['Dirección:'].join(' ');
      if (accum['Referencia:']?.length) data.destinoReferencia = accum['Referencia:'].join(' ');
      if (accum['Contenido:']?.length) data.contenido = accum['Contenido:'].join(' ');
      if (accum['Solicitud:']?.length) data.solicitud = accum['Solicitud:'].join(' ');
      if (accum['No. Orden:']?.length) data.noOrden = accum['No. Orden:'].join(' ');
      if (accum['PAGO:']?.length) data.pago = accum['PAGO:'].join(' ');
      if (accum['Peso:']?.length) data.peso = accum['Peso:'].join(' ');
      if (accum['Peso Máximo:']?.length) data.pesoMaximo = accum['Peso Máximo:'].join(' ');
      if (accum['Tipo de entrega:']?.length) data.tipoEntrega = accum['Tipo de entrega:'].join(' ');
      if (accum['Especiales:']?.length) data.especiales = accum['Especiales:'].join(' ');
      if (accum['Cobrar a destinatario:']?.length) {
        data.cobrarDestinatario = accum['Cobrar a destinatario:'].join(' ');
        data.tieneContraentrega = true;
      }

      if (data.tipoServicio.toUpperCase() === 'CCE' || parseFloat(data.cobrarDestinatario) > 0) {
        data.tieneContraentrega = true;
      }

      // 2. Localizar el XObject exacto del QR (/I3, 320x320) del PDF original de C807
      const srcResources = srcPage.node.Resources();
      const srcXObjects = srcResources?.lookup(PDFName.of('XObject')) as PDFDict | undefined;
      let qrStream: PDFRawStream | null = null;
      if (srcXObjects instanceof PDFDict) {
        for (const key of srcXObjects.keys()) {
          const obj = srcXObjects.lookup(key);
          if (obj instanceof PDFRawStream) {
            const w = obj.dict.get(PDFName.of('Width'))?.toString();
            const h = obj.dict.get(PDFName.of('Height'))?.toString();
            if (w && h && w === h && parseInt(w, 10) >= 120) {
              qrStream = obj;
              break;
            }
          }
        }
      }

      if (!qrStream) {
        return this.recortarPrimeraPaginaPdf(rawBuffer);
      }

      // 3. Construir la nueva guía personalizada de 4x4 pulgadas (288 x 288 pt) en Blanco y Negro
      const outDoc = await PDFDocument.create();
      const page = outDoc.addPage([288, 288]); // Exacto 4.00 x 4.00 pulgadas
      const fontRegular = await outDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await outDoc.embedFont(StandardFonts.HelveticaBold);

      const black = rgb(0, 0, 0);
      const white = rgb(1, 1, 1);

      if (!C807Client.cachedAromaniakLogoBytes) {
        const aromaniakLogoPath = path.join(process.cwd(), 'public', 'images', 'logo-aromaniak-bw.png');
        if (fs.existsSync(aromaniakLogoPath)) {
          C807Client.cachedAromaniakLogoBytes = fs.readFileSync(aromaniakLogoPath);
        }
      }
      if (!C807Client.cachedC807LogoBytes) {
        const c807LogoPath = path.join(process.cwd(), 'public', 'images', 'logo-c807-bw.png');
        if (fs.existsSync(c807LogoPath)) {
          C807Client.cachedC807LogoBytes = fs.readFileSync(c807LogoPath);
        }
      }

      const aromaniakLogo = C807Client.cachedAromaniakLogoBytes
        ? await outDoc.embedPng(C807Client.cachedAromaniakLogoBytes)
        : null;
      const c807Logo = C807Client.cachedC807LogoBytes
        ? await outDoc.embedPng(C807Client.cachedC807LogoBytes)
        : null;

      // Clonar el stream binario exacto del QR original de C807 en el nuevo documento con clave única por guía
      const clonedQrDict = qrStream.dict.clone(outDoc.context);
      clonedQrDict.delete(PDFName.of('SMask'));
      const clonedQrStream = PDFRawStream.of(clonedQrDict, Uint8Array.from(qrStream.contents));
      const qrRef = outDoc.context.register(clonedQrStream);
      const uniqueQrName = `Qr_${(data.numeroGuia || fallbackGuia || 'Orig').replace(/[^A-Za-z0-9]/g, '')}`;
      const qrPdfName = PDFName.of(uniqueQrName);
      page.node.setXObject(qrPdfName, qrRef);

      const L = 5;
      const R = 283;
      const B = 5;
      const T = 283;
      const W = R - L; // 278
      const H = T - B; // 278
      const SPLIT_X = 81; // Columna izquierda = 76pt, Columna derecha = 202pt

      page.drawRectangle({
        x: L,
        y: B,
        width: W,
        height: H,
        borderColor: black,
        borderWidth: 1.5,
        color: white,
      });

      page.drawLine({
        start: { x: SPLIT_X, y: 22 },
        end: { x: SPLIT_X, y: T },
        thickness: 1.3,
        color: black,
      });

      // ==================== COLUMNA IZQUIERDA (ENRUTAMIENTO C807) ====================
      if (c807Logo) {
        const c807W = 34;
        const c807H = 11.5;
        page.drawImage(c807Logo, {
          x: L + (SPLIT_X - L - c807W) / 2,
          y: 268.5,
          width: c807W,
          height: c807H,
          opacity: 0.72,
        });
      }
      const c807TelTxt = `Tel: ${data.c807Whatsapp || '72087895'}`;
      page.drawText(c807TelTxt, {
        x: L + (SPLIT_X - L - fontRegular.widthOfTextAtSize(c807TelTxt, 5.2)) / 2,
        y: 261.5,
        size: 5.2,
        font: fontRegular,
        color: black,
      });

      // QR Superior Izquierdo (idéntico al original)
      page.pushOperators(
        PDFOperator.of('q' as any),
        PDFOperator.of('cm' as any, [
          PDFNumber.of(70),
          PDFNumber.of(0),
          PDFNumber.of(0),
          PDFNumber.of(70),
          PDFNumber.of(L + 3),
          PDFNumber.of(188),
        ]),
        PDFOperator.of('Do' as any, [qrPdfName]),
        PDFOperator.of('Q' as any)
      );

      const leftDividers = [184, 156, 134, 106, 74, 45, 22];
      for (const yDiv of leftDividers) {
        page.drawLine({
          start: { x: L, y: yDiv },
          end: { x: SPLIT_X, y: yDiv },
          thickness: 1.1,
          color: black,
        });
      }

      const drawCenteredLeftText = (
        txt: string,
        boxBottom: number,
        boxTop: number,
        maxFontSize: number,
        minFontSize = 6.5
      ) => {
        const clean = this.sanitizeWinAnsi(txt);
        if (!clean) return;
        const boxW = SPLIT_X - L;
        const boxH = boxTop - boxBottom;

        const availW = boxW - 6;
        let fs = maxFontSize;
        while (fs > minFontSize && fontBold.widthOfTextAtSize(clean, fs) > availW) {
          fs -= 0.5;
        }

        if (fontBold.widthOfTextAtSize(clean, fs) <= availW) {
          const tw = fontBold.widthOfTextAtSize(clean, fs);
          const tx = L + (boxW - tw) / 2;
          const ty = boxBottom + (boxH - fs) / 2 + 1;
          page.drawText(clean, {
            x: tx,
            y: ty,
            size: fs,
            font: fontBold,
            color: black,
          });
        } else {
          const lines = this.wrapTextToLines(clean, fontBold, fs, availW).slice(0, 2);
          const lineGap = fs + 1.5;
          const totalH = lines.length * lineGap;
          let startY = boxBottom + (boxH + totalH) / 2 - fs;
          for (const ln of lines) {
            const tw = fontBold.widthOfTextAtSize(ln, fs);
            page.drawText(ln, {
              x: L + (boxW - tw) / 2,
              y: startY,
              size: fs,
              font: fontBold,
              color: black,
            });
            startY -= lineGap;
          }
        }
      };

      drawCenteredLeftText(data.hub, 156, 184, 14);
      drawCenteredLeftText(data.zonaBox2, 134, 156, 11);
      drawCenteredLeftText(data.deptoCode, 106, 134, 14);
      drawCenteredLeftText(data.municipio, 74, 106, 10, 6.5);
      drawCenteredLeftText(data.tipoServicio, 45, 74, 14, 8);
      drawCenteredLeftText(data.diasFrecuencia, 22, 45, 9.5, 7);

      // ==================== COLUMNA DERECHA PRINCIPAL ====================
      const RX = SPLIT_X + 5; // 86
      const RW = R - RX - 4; // 193

      // 1) ENCABEZADO: Logo Principal de Aromaniak + sv.com + Remitente
      if (aromaniakLogo) {
        page.drawImage(aromaniakLogo, {
          x: RX,
          y: 257.5,
          width: 126,
          height: 22,
        });
        page.drawText('sv.com', {
          x: RX + 127.5,
          y: 258.8,
          size: 15.8,
          font: fontBold,
          color: black,
        });
      } else {
        page.drawText('Aromaniak sv.com', {
          x: RX,
          y: 260,
          size: 19,
          font: fontBold,
          color: black,
        });
      }

      page.drawText(`${data.remitenteNombre}   |   Teléfono: ${data.remitenteTelefono}`, {
        x: RX,
        y: 247,
        size: 7.0,
        font: fontBold,
        color: black,
      });

      page.drawLine({
        start: { x: SPLIT_X, y: 243.5 },
        end: { x: R, y: 243.5 },
        thickness: 1.1,
        color: black,
      });

      // 2) TÍTULO DE DESTINO (sin cuadro negro, texto limpio en negrita)
      page.drawText('Destino:', {
        x: RX,
        y: 234,
        size: 8.2,
        font: fontBold,
        color: black,
      });

      // 3) CAMPOS DE DESTINO (Nombre, Teléfono y Dirección en negrita + auto-ajuste)
      const destinoTopY = 231;
      const destinoBottomY = 123;
      const availDestinoH = destinoTopY - destinoBottomY; // 111.5pt

      const rowsSpec: Array<{ label: string; value: string; boldValue?: boolean }> = [
        { label: 'Nombre:', value: data.destinoNombre, boldValue: true },
        { label: 'Teléfono:', value: data.destinoTelefono, boldValue: true },
        { label: 'Contacto:', value: data.destinoContacto },
        { label: 'Dirección:', value: data.destinoDireccion, boldValue: true },
        { label: 'Referencia:', value: data.destinoReferencia },
        { label: 'Contenido:', value: data.contenido },
        { label: 'Solicitud:', value: data.solicitud },
        { label: 'No. Orden:', value: data.noOrden, boldValue: true },
      ];

      let chosenFontSize = 7.2;
      let chosenLineHeight = 8.2;
      let chosenRowGap = 0.9;

      for (const candidateFs of [7.2, 6.8, 6.4, 6.0, 5.6, 5.2, 4.8, 4.4, 4.0, 3.6]) {
        const lh = candidateFs * 1.14;
        const gap = candidateFs >= 6.0 ? 0.8 : 0.4;
        let totalH = 0;
        for (const r of rowsSpec) {
          const labelW = fontBold.widthOfTextAtSize(r.label, candidateFs) + 3.5;
          const lines = this.wrapTextToLines(
            r.value,
            r.boldValue ? fontBold : fontRegular,
            candidateFs,
            RW,
            RW - labelW
          );
          totalH += lines.length * lh + gap;
        }
        chosenFontSize = candidateFs;
        chosenLineHeight = lh;
        chosenRowGap = gap;
        if (totalH <= availDestinoH) break;
      }

      let curY = destinoTopY - chosenFontSize;
      for (const r of rowsSpec) {
        const valFont = r.boldValue ? fontBold : fontRegular;
        const labelW = fontBold.widthOfTextAtSize(r.label, chosenFontSize) + 3.5;
        const lines = this.wrapTextToLines(r.value, valFont, chosenFontSize, RW, RW - labelW);
        page.drawText(r.label, { x: RX, y: curY, size: chosenFontSize, font: fontBold, color: black });
        lines.forEach((ln, idx) => {
          if (ln) {
            page.drawText(ln, {
              x: idx === 0 ? RX + labelW : RX,
              y: curY,
              size: chosenFontSize,
              font: valFont,
              color: black,
            });
          }
          curY -= chosenLineHeight;
        });
        curY -= chosenRowGap;
      }

      // 4) BANDA DE NÚMERO DE GUÍA Y BULTOS (y: 104..122, sin recuadro negro)
      page.drawLine({
        start: { x: SPLIT_X, y: 122 },
        end: { x: R, y: 122 },
        thickness: 1.1,
        color: black,
      });
      page.drawLine({
        start: { x: SPLIT_X, y: 104 },
        end: { x: R, y: 104 },
        thickness: 1.1,
        color: black,
      });

      let guiaFs = 10.5;
      while (guiaFs > 7.5 && fontBold.widthOfTextAtSize(data.numeroGuia, guiaFs) > 150) {
        guiaFs -= 0.5;
      }
      page.drawText(data.numeroGuia, {
        x: RX,
        y: 109.5,
        size: guiaFs,
        font: fontBold,
        color: black,
      });

      const piezasTw = fontBold.widthOfTextAtSize(data.piezas, 9.5);
      page.drawText(data.piezas, {
        x: R - piezasTw - 6,
        y: 109.5,
        size: 9.5,
        font: fontBold,
        color: black,
      });

      // 5) SECCIÓN OPERATIVA, CONTRAENTREGA Y QR INFERIOR DERECHO (y: 22..104)
      page.pushOperators(
        PDFOperator.of('q' as any),
        PDFOperator.of('cm' as any, [
          PDFNumber.of(72),
          PDFNumber.of(0),
          PDFNumber.of(0),
          PDFNumber.of(72),
          PDFNumber.of(R - 75),
          PDFNumber.of(27),
        ]),
        PDFOperator.of('Do' as any, [qrPdfName]),
        PDFOperator.of('Q' as any)
      );

      const isCce = data.tieneContraentrega;
      const montoStr = data.cobrarDestinatario || '0.00';

      const specRows: Array<{ label: string; value: string; boldValue?: boolean }> = [
        { label: 'PAGO:', value: data.pago },
        { label: 'Peso:', value: data.peso },
        { label: 'Peso Máximo:', value: data.pesoMaximo },
        { label: 'Tipo de entrega:', value: data.tipoEntrega, boldValue: true },
        { label: 'Especiales:', value: data.especiales },
        { label: 'Contraentrega:', value: isCce ? 'SI (CCE)' : 'NO (SER)', boldValue: true },
        { label: 'Cobrar a destinatario:', value: montoStr, boldValue: true },
      ];

      let specY = 94.5;
      for (const row of specRows) {
        page.drawText(row.label, { x: RX, y: specY, size: 6.8, font: fontBold, color: black });
        if (row.value) {
          const labelW = Math.max(60, fontBold.widthOfTextAtSize(row.label + ' ', 6.8));
          const availValW = Math.max(30, 120 - labelW);
          const valFont = row.boldValue ? fontBold : fontRegular;
          const valLines = this.wrapTextToLines(row.value, valFont, 6.8, availValW).slice(0, 1);
          page.drawText(valLines[0] || '', {
            x: RX + labelW,
            y: specY,
            size: 6.8,
            font: valFont,
            color: black,
          });
        }
        specY -= 10.2;
      }

      // ==================== 6) PIE DE GUÍA AROMANIAK (sin recuadro negro, sin link C807) ====================
      page.drawLine({
        start: { x: L, y: 22 },
        end: { x: R, y: 22 },
        thickness: 1.2,
        color: black,
      });

      const aromaFooterTxt =
        'Compra seguro en aromaniaksv.com  •  WhatsApp: 60437496  •  Fijo: 2245 3890';
      page.drawText(aromaFooterTxt, {
        x: L + (W - fontBold.widthOfTextAtSize(aromaFooterTxt, 6.8)) / 2,
        y: 11,
        size: 6.8,
        font: fontBold,
        color: black,
      });

      const saved = await outDoc.save();
      return Buffer.from(saved);
    } catch (err) {
      console.warn('[C807 Custom PDF] Fallback a primera página original:', err);
      return this.recortarPrimeraPaginaPdf(rawBuffer);
    }
  }

  /**
   * Obtiene el PDF oficial de la guía/viñeta desde C807 Express y lo transforma al diseño 4x4 B&W de Aromaniak
   */
  async obtenerPdfGuia(
    numeroGuia: string,
    preFetchedToken?: string
  ): Promise<{
    success: boolean;
    pdfBuffer?: Buffer;
    error?: string;
  }> {
    const cleanGuia = String(numeroGuia || '').trim();
    if (!cleanGuia) {
      return { success: false, error: 'Número de guía requerido' };
    }

    try {
      const token = preFetchedToken || (await this.obtenerToken());
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
        const customized = await this.personalizarPdfGuiaC807(Buffer.from(arrBuf), cleanGuia);
        return { success: true, pdfBuffer: customized };
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
      const rawBuffer = Buffer.from(cleanB64, 'base64');
      const customized = await this.personalizarPdfGuiaC807(rawBuffer, cleanGuia);
      return { success: true, pdfBuffer: customized };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Error de conexión al descargar PDF desde C807',
      };
    }
  }

  /**
   * Obtiene múltiples guías de C807 y las une en un único documento PDF,
   * garantizando que cada guía ocupe únicamente 1 página (descartando cualquier 2da página de desborde).
   */
  async obtenerPdfGuiasUnificadas(numerosGuia: string[]): Promise<{
    success: boolean;
    pdfBuffer?: Buffer;
    includedGuides?: string[];
    error?: string;
  }> {
    const cleanList = Array.from(
      new Set(
        (numerosGuia || [])
          .map((g) => String(g || '').trim())
          .filter(Boolean)
      )
    );

    if (cleanList.length === 0) {
      return { success: false, error: 'Selecciona al menos una guía para descargar.' };
    }

    if (cleanList.length === 1) {
      const single = await this.obtenerPdfGuia(cleanList[0]);
      return {
        success: single.success,
        pdfBuffer: single.pdfBuffer,
        includedGuides: single.success ? [cleanList[0]] : [],
        error: single.error,
      };
    }

    try {
      const token = await this.obtenerToken();
      const results = await Promise.all(
        cleanList.map(async (guia) => ({
          guia,
          res: await this.obtenerPdfGuia(guia, token),
        }))
      );

      const mergedDoc = await PDFDocument.create();
      const includedGuides: string[] = [];

      for (const item of results) {
        if (!item.res.success || !item.res.pdfBuffer) continue;
        try {
          const srcDoc = await PDFDocument.load(item.res.pdfBuffer, {
            ignoreEncryption: true,
          });
          if (srcDoc.getPageCount() > 0) {
            // Copiar exclusivamente la primera página [0] de cada guía
            const [firstPage] = await mergedDoc.copyPages(srcDoc, [0]);
            mergedDoc.addPage(firstPage);
            includedGuides.push(item.guia);
          }
        } catch (pdfErr) {
          console.warn(`[C807 Merge PDF] No se pudo procesar guía ${item.guia}:`, pdfErr);
        }
      }

      if (includedGuides.length === 0) {
        return {
          success: false,
          error: 'No se pudo obtener el PDF de ninguna de las guías seleccionadas en C807.',
        };
      }

      const mergedBytes = await mergedDoc.save();
      return {
        success: true,
        pdfBuffer: Buffer.from(mergedBytes),
        includedGuides,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Error al unificar los PDFs de las guías seleccionadas.',
      };
    }
  }

  private extraerComentarioNoRecogido(textoSucio?: string | null, fechaBitacora?: string | null): string {
    if (!textoSucio || !fechaBitacora) return '';
    try {
      const fechaObjeto = new Date(fechaBitacora);
      if (isNaN(fechaObjeto.getTime())) return '';

      const dia = fechaObjeto.getDate().toString().padStart(2, '0');
      const mes = (fechaObjeto.getMonth() + 1).toString().padStart(2, '0');
      const anio = fechaObjeto.getFullYear();
      const hora = fechaObjeto.getHours().toString().padStart(2, '0');
      const minutos = fechaObjeto.getMinutes().toString().padStart(2, '0');

      const fechaBusqueda = `${dia}/${mes}/${anio} ${hora}:${minutos}`;
      const fechaPos = textoSucio.indexOf(fechaBusqueda);
      if (fechaPos === -1) return '';

      const textoAntes = textoSucio.substring(0, fechaPos).trim();
      const posDosPuntos = textoAntes.lastIndexOf(':');
      const posSaltoLinea = textoAntes.lastIndexOf('\n');

      let encabezado = '';
      if (posDosPuntos !== -1 && posDosPuntos > posSaltoLinea) {
        let inicioEncabezado = textoAntes.lastIndexOf('\n', posDosPuntos);
        if (inicioEncabezado === -1) inicioEncabezado = 0;
        encabezado = textoAntes.substring(inicioEncabezado, posDosPuntos).replace(/:/g, '').trim();
      }

      const textoDespues = textoSucio.substring(fechaPos + fechaBusqueda.length).trim();
      const proximaFechaPos = textoDespues.search(/\d{2}\/\d{2}\/\d{4}/);
      let comentario =
        proximaFechaPos !== -1
          ? textoDespues.substring(0, proximaFechaPos).trim()
          : textoDespues.trim();

      if (comentario.includes('No tiene paquetes:')) {
        comentario = comentario.replace('No tiene paquetes:', '').trim();
      }
      comentario = comentario
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .join(' ');

      if (encabezado.length > 0) {
        return `${encabezado} ${comentario}`.replace(/:/g, '').trim();
      }
      return comentario.trim();
    } catch {
      return '';
    }
  }

  /**
   * Obtiene el rastreo detallado completo (flujo, bitácora, incidencias, evaluaciones, fotos POD y firma)
   * compatible 100% con el portal de rastreo de C807 Xpress.
   */
  async consultarRastreoDetallado(numeroGuia: string): Promise<C807DetailedTracking> {
    const cleanGuia = String(numeroGuia || '').trim();
    const emptyResult: C807DetailedTracking = {
      found: false,
      guia: cleanGuia,
      estatusActual: 'Pendiente de guía',
      codigoActual: '',
      esEntregado: false,
      esDevolucion: false,
      tieneIncidencia: false,
      destinatario: null,
      direccion: null,
      fechaEntrega: null,
      etdMin: null,
      etdMax: null,
      indicaciones: null,
      flujo: [],
      bitacora: [],
      todasLasFotos: [],
    };

    if (!cleanGuia) return emptyResult;

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

      if (!res.ok) return emptyResult;

      const data = await res.json().catch(() => null);
      const rawBitacora: any[] = Array.isArray(data?.status?.bitacora) ? data.status.bitacora : [];
      const rawFlujo: any[] = Array.isArray(data?.flujo) ? [...data.flujo] : [];
      const guiaInfo = data?.status?.guia || {};

      if (rawBitacora.length === 0 && !guiaInfo?.guia) {
        return emptyResult;
      }

      const codFlujoNums: number[] = rawBitacora
        .map((ev) => parseInt(String(ev?.codigo || ''), 10))
        .filter((n) => !isNaN(n));

      // Ordenamiento idéntico al portal de C807 Xpress
      const flujoDesor = rawFlujo.map((f) => ({
        codigo: String(f?.codigo || '').trim(),
        descripcion: String(f?.descripcion || '').trim(),
      }));

      if (cleanGuia.toUpperCase().includes('RECOLECTA') && codFlujoNums.includes(18)) {
        if (!flujoDesor.some((f) => f.codigo === '18')) {
          flujoDesor.unshift({ codigo: '18', descripcion: 'No Recogido' });
        }
      }

      const flujoOrdenado = flujoDesor.sort((a, b) => {
        if (a.codigo === '18') return 1;
        if (b.codigo === '18') return -1;
        if (a.codigo === '15') return 1;
        if (b.codigo === '15') return -1;
        return parseInt(a.codigo, 10) - parseInt(b.codigo, 10);
      });

      const idx12 = flujoOrdenado.findIndex((f) => parseInt(f.codigo, 10) === 12);
      const idx13 = flujoOrdenado.findIndex((f) => parseInt(f.codigo, 10) === 13);
      if (idx12 !== -1 && idx13 !== -1) {
        const [item12] = flujoOrdenado.splice(idx12, 1);
        const nuevaPos13 = flujoOrdenado.findIndex((f) => parseInt(f.codigo, 10) === 13);
        flujoOrdenado.splice(nuevaPos13 + 1, 0, item12);
      }

      const existe14 = codFlujoNums.includes(14);
      const existe16 = codFlujoNums.includes(16);

      const flujoSteps: C807TrackingStep[] = flujoOrdenado.map((f) => {
        const numCod = parseInt(f.codigo, 10);
        const completado =
          codFlujoNums.includes(numCod) || (numCod === 12 && existe14);
        const esIncidencia = f.codigo === '16' || f.codigo === '18';
        const ocultar =
          f.codigo === '14' || (f.codigo === '16' && !existe16);
        return {
          codigo: f.codigo,
          descripcion: f.descripcion,
          completado,
          esIncidencia,
          ocultar,
        };
      });

      const fallbackEval: any[] = Array.isArray(rawBitacora[0]?.evaluacion)
        ? rawBitacora[0].evaluacion
        : [];

      const todasLasFotos: C807TrackingPhoto[] = [];

      const bitacora: C807TrackingEvent[] = rawBitacora.map((ev) => {
        const codigo = String(ev?.codigo || '').trim();
        const fecha = String(ev?.fecha || '').trim();
        const estatusOriginal = String(ev?.estatus || '').trim();
        let rawObs = String(ev?.observaciones || '').replace(/,?\s*Truck.*/i, '').trim();

        if (codigo === '18' && !rawObs) {
          rawObs = this.extraerComentarioNoRecogido(guiaInfo?.indicaciones, fecha);
        }

        const esDevolucion = ev?.devolucion == 1 || ev?.devolucion === '1';
        const esEntregado = codigo === '15';
        const esIncidencia = codigo === '16' || codigo === '18';

        let titulo = estatusOriginal || 'Actualización de estado';
        if (codigo === '15') {
          titulo = esDevolucion ? 'RETORNO A ORIGEN' : 'LLEGÓ A SU DESTINO';
        } else if (codigo === '16') {
          titulo = 'Problemas en la gestión';
        } else if (codigo === '18' && cleanGuia.toUpperCase().includes('RECOLECTA')) {
          titulo = 'NO RECOGIDO';
        }

        // Procesar preguntas y respuestas de evaluación
        const rawEvals: any[] =
          codigo === '15'
            ? Array.isArray(ev?.evaluacion) && ev.evaluacion.length > 0
              ? ev.evaluacion
              : fallbackEval
            : Array.isArray(ev?.evaluacion)
            ? ev.evaluacion
            : [];

        const evaluacion: C807TrackingEvaluation[] = [];
        let injectedDevolucion = false;

        for (const item of rawEvals) {
          const preg = String(item?.pregunta || '').trim();
          const resp = String(item?.respuesta || '').trim();
          if (!preg && !resp) continue;

          if (codigo === '16' && !preg.toLowerCase().includes('rechazo') && rawEvals.length > 1) {
            // En código 16 prioriza el motivo de rechazo pero conserva si es el único dato
          }

          if (codigo === '15' && preg.toLowerCase().includes('incluye devolución')) {
            continue;
          }

          evaluacion.push({ pregunta: preg, respuesta: resp });

          if (codigo === '15' && !injectedDevolucion && preg.toLowerCase().includes('quien recibe')) {
            evaluacion.push({
              pregunta: '¿INCLUYE DEVOLUCIÓN?',
              respuesta: esDevolucion ? 'SÍ' : 'NO',
            });
            injectedDevolucion = true;
          }
        }

        // Procesar imágenes POD y Firmas
        const rawPod: any[] = Array.isArray(ev?.pod) ? ev.pod : [];
        const fotos: C807TrackingPhoto[] = [];
        const firmas: C807TrackingPhoto[] = [];

        for (const p of rawPod) {
          const url = String(p?.url || '').trim();
          if (!url) continue;
          const nombre = String(p?.nombre || 'Evidencia fotográfica').trim();
          const esFirma = nombre.toLowerCase() === 'firma';
          const photoObj: C807TrackingPhoto = { nombre, url, esFirma };
          if (esFirma) {
            firmas.push(photoObj);
          } else {
            fotos.push(photoObj);
          }
          if (!todasLasFotos.some((existing) => existing.url === url)) {
            todasLasFotos.push(photoObj);
          }
        }

        const fechaProg = fecha ? fecha.split(' ')[0] : null;

        return {
          codigo,
          fecha,
          titulo,
          estatusOriginal,
          observaciones: rawObs,
          esIncidencia,
          esEntregado,
          esDevolucion,
          etdMin: ev?.etd_min || null,
          etdMax: ev?.etd_max || null,
          fechaProgramada: codigo === '14' ? fechaProg : null,
          destinatario: guiaInfo?.destinatario || null,
          evaluacion,
          fotos,
          firmas,
        };
      });

      const latestEvent = bitacora[0] || null;
      const codigoActual = String(guiaInfo?.estatus_codigo || latestEvent?.codigo || '').trim();
      const estatusActual = String(
        guiaInfo?.estatus ||
          latestEvent?.titulo ||
          (codigoActual === '15'
            ? 'Llegó a su destino'
            : codigoActual === '13'
            ? 'Recogido en origen'
            : 'Creado en sistema')
      ).trim();

      const esEntregado =
        codigoActual === '15' ||
        bitacora.some((b) => b.codigo === '15') ||
        estatusActual.toLowerCase().includes('llegó a su destino') ||
        estatusActual.toLowerCase().includes('entregad') ||
        Boolean(guiaInfo?.entrega);

      const esDevolucion = bitacora.some((b) => b.esDevolucion);
      const tieneIncidencia = bitacora.some((b) => b.esIncidencia);

      return {
        found: true,
        guia: String(guiaInfo?.guia || cleanGuia),
        estatusActual,
        codigoActual,
        esEntregado,
        esDevolucion,
        tieneIncidencia,
        destinatario: guiaInfo?.destinatario || null,
        direccion: guiaInfo?.direccion || null,
        fechaEntrega:
          guiaInfo?.entrega ||
          bitacora.find((b) => b.codigo === '15')?.fecha ||
          null,
        etdMin: guiaInfo?.etd_min || null,
        etdMax: guiaInfo?.etd_max || null,
        indicaciones: guiaInfo?.indicaciones || null,
        flujo: flujoSteps.filter((s) => !s.ocultar),
        bitacora,
        todasLasFotos,
      };
    } catch (err) {
      console.warn(`[C807 Detailed Tracking] Error consultando guía ${cleanGuia}:`, err);
      return emptyResult;
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
