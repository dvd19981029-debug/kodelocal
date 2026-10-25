// src/lib/c807.ts
// Cliente nativo para integración directa con C807 Express (Guías de Paquetería)

import { PDFDocument } from 'pdf-lib';
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

  /**
   * Obtiene el PDF oficial de la guía/viñeta directamente desde C807 Express (recortado a 1 sola página)
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
        const trimmed = await this.recortarPrimeraPaginaPdf(Buffer.from(arrBuf));
        return { success: true, pdfBuffer: trimmed };
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
      const trimmed = await this.recortarPrimeraPaginaPdf(rawBuffer);
      return { success: true, pdfBuffer: trimmed };
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
