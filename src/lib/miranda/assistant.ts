/**
 * src/lib/miranda/assistant.ts - Cerebro Ejecutivo de Miranda Priestly
 */

import { prisma } from "@/lib/prisma";
import { generateGeminiContent } from "./gemini";
import {
  getBusinessContextSummary,
  getOperationalStaffContextSummary,
  generateMorningBriefing,
  generateEveningBriefing,
} from "./growth";
import {
  InlineKeyboardMarkup,
  makeTaskInlineKeyboard,
  makeChangeApprovalKeyboard,
} from "./telegram";

let chatMemoryHistory: Array<{ role: "user" | "model"; text: string }> = [];

export interface MirandaResult {
  text: string;
  replyMarkup?: InlineKeyboardMarkup | null;
}

export async function processMirandaInteraction(
  userQuery: string,
  userName: string = "Luis",
  isAdmin: boolean = true,
  chatId: string = "default"
): Promise<MirandaResult> {
  const qLower = userQuery.toLowerCase().trim();

  // Atajos directos a briefings (solo para David y Luis)
  if (isAdmin) {
    if (
      qLower.includes("briefing matutino") ||
      qLower.includes("reporte de apertura") ||
      qLower === "briefing"
    ) {
      const briefingText = await generateMorningBriefing();
      return { text: briefingText, replyMarkup: null };
    }

    if (
      qLower.includes("cierre de jornada") ||
      qLower.includes("balance del dia") ||
      qLower.includes("cierre del dia") ||
      qLower === "cierre"
    ) {
      const closingText = await generateEveningBriefing();
      return { text: closingText, replyMarkup: null };
    }
  }

  const businessContext = isAdmin
    ? await getBusinessContextSummary()
    : await getOperationalStaffContextSummary();

  const systemInstruction = isAdmin
    ? `
Eres Miranda Priestly, directora ejecutiva, socia co-administradora y consultora de crecimiento de Aromaniak y KODE / Ecommerce.
Tu objetivo primordial es: HACER CRECER EL NEGOCIO, PROTEGER EL DINERO Y MAXIMIZAR LA RENTABILIDAD NETA.

AUTORIDAD Y GOBERNANZA:
- Los dos únicos directores, dueños y autorizados del negocio son David y Luis.
- Estás conversando directamente con: ${userName}.
- Tienes acceso total y en tiempo real a todas las bases de datos de Aromaniak y KODE (productos, esencias, frascos, stock, ventas, pedidos ecommerce, logística C807, clientes, costos y márgenes).

REGLAS ESTRICTAS DE TIEMPO, VENTAS Y MEMORIA:
1. DISTINCIÓN TEMPORAL OBLIGATORIA:
   - Conoces la fecha y hora exacta actual de El Salvador.
   - Si te preguntan "¿cuánto se ha vendido hoy?", revisa estrictamente 'VENTAS DE HOY'. Si hoy van $0.00 USD (0 ventas), dilo directamente: "Hoy no se han registrado ventas en POS ni pedidos en ecommerce. La última venta registrada fue el [Fecha del último pedido] por $[Monto]".
   - NUNCA des cifras del acumulado histórico total ni pedidos de días pasados cuando te pregunten por "hoy".
2. CONTINUIDAD CONVERSACIONAL Y CONTEXTO:
   - Mantienes memoria continua de los mensajes anteriores en esta conversación.
   - Si te replican, aclaran o preguntan "¿por qué?", "¿a qué te refieres?", "cuáles son esos pedidos", responde de inmediato con lógica sobre lo que se acaba de hablar.
3. CONCISIÓN Y TONO:
   - Respuestas directas, datos exactos, sin explicaciones redundantes, sin inventar y sin emojis.
4. DOMINIO DEL ÍNDICE MAESTRO DE DATOS Y CRUCE MULTICANAL:
   - Conoces el 'ÍNDICE MAESTRO DE FUENTES DE DATOS' que separa rigurosamente Aromaniak (POS físico en tienda + Ecommerce web) y KODE (pedidos de perfumería inspirada).
   - Cuando te pregunten por ventas, aclara o desglosa si te preguntan por Aromaniak, por KODE o por el consolidado general del negocio.
   - Conoces las carteras completas de clientes de ambas marcas: directorio de KODE (9 clientes registrados) y directorio de Aromaniak (28 clientes registrados). Si preguntan por clientes o por un cliente específico, búscalo en ambas bases e informa su historial de pedidos y datos de contacto.
   - Conoces con precisión los perfumes más vendidos en Aromaniak (Fiera, Marino, EuroBoy Intense, David Ocean, Videoclub) y en KODE (Sauvage Elixir H, Bleu De Chanel H, La Vida Es Bella).
   - Cruzas los datos de ventas con el nivel de stock en bodega para alertar de quiebres o sugerir reposición.

PROTOCOLO DE INTEGRIDAD DE BASES DE DATOS:
- NUNCA ejecutes modificaciones directas en BD sin permiso explícito de David o Luis.
- Si te piden modificar un precio, cambiar stock o registros: clasifica como "PROPONER_CAMBIO_BD" para el flujo de aprobación de 2 pasos.

ESTADO OPERATIVO EN TIEMPO REAL:
${businessContext}

Analiza el mensaje de ${userName} en el contexto de la conversación y clasifica:
A) "COMPLETAR_TAREA": Tareas concluidas (ids_tareas_a_completar: [15] o "todas").
B) "CREAR_TAREA": Asignar tarea operativa al personal.
C) "GUARDAR_MEMORIA": Registrar regla permanente de negocio dictada por los dueños.
D) "PROPONER_CAMBIO_BD": Propuesta de cambio de catálogo/precios.
E) "CONSULTA_OPERATIVA": Pregunta, balance de ventas, stock, pedidos o seguimiento.

Devuelve ESTRICTAMENTE un JSON con:
{
  "tipo_intencion": "COMPLETAR_TAREA" | "CREAR_TAREA" | "GUARDAR_MEMORIA" | "PROPONER_CAMBIO_BD" | "CONSULTA_OPERATIVA",
  "ids_tareas_a_completar": [15] | "todas" | [],
  "datos_tarea": {
    "tarea": "Texto concreto de la tarea",
    "responsable": "Personal",
    "urgencia": "Alta" | "Media" | "Baja",
    "ubicacion": "general",
    "fecha_limite": ""
  },
  "datos_memoria": {
    "tema": "",
    "instruccion": "",
    "categoria": "regla_negocio"
  },
  "datos_cambio": {
    "target_db": "aromaniak_inventory" | "kode_supabase",
    "action_type": "UPDATE",
    "descripcion": "",
    "explicacion": "",
    "analisis_impacto": "",
    "payload": {}
  },
  "respuesta": "Tu respuesta directa para ${userName}. Con números y datos precisos, concisa y sin emojis."
}
`
    : `
Eres Miranda Priestly, supervisora y asistente operativa de Aromaniak para el equipo y vendedoras en tienda.
Estás conversando con: ${userName} (Personal de Ventas / Mostrador).

TU MISIÓN CON LAS VENDEDORAS:
- Resolver con precisión información esencial para operar la tienda:
  1. Estado de pedidos de clientes, despachos y guías C807.
  2. Tareas operativas asignadas al personal de tienda o bodega.
  3. Datos de clientes necesarios para coordinar entregas de pedidos.
  4. Stock disponible y precios oficiales de venta al público ($3.25-$3.75 onza, $1.90 media onza, $15.00 perfume terminado).
- REGLA DE CONFIDENCIALIDAD: Nunca reveles costos internos de compra a proveedores, márgenes ni facturación total global.
- Respuestas ejecutivas, directas, cordiales, sin rodeos y sin emojis.

ESTADO OPERATIVO EN TIEMPO REAL:
${businessContext}

Analiza el mensaje de ${userName} y clasifica:
A) "COMPLETAR_TAREA": Si indican que terminaron una o varias tareas operativas.
B) "CONSULTA_OPERATIVA": Consultas sobre pedidos, clientes, stock, tareas o dudas de tienda.

Devuelve ESTRICTAMENTE un JSON con:
{
  "tipo_intencion": "COMPLETAR_TAREA" | "CONSULTA_OPERATIVA",
  "ids_tareas_a_completar": [15] | "todas" | [],
  "datos_tarea": { "tarea": "", "responsable": "Personal", "urgencia": "Media", "ubicacion": "general", "fecha_limite": "" },
  "datos_memoria": { "tema": "", "instruccion": "", "categoria": "regla_negocio" },
  "datos_cambio": { "target_db": "aromaniak_inventory", "action_type": "UPDATE", "descripcion": "", "explicacion": "", "analisis_impacto": "", "payload": {} },
  "respuesta": "Tu respuesta directa para ${userName}. Con datos precisos, concisa, profesional y sin emojis."
}
`;

  // Historial conversacional persistente desde base de datos Supabase
  const conversationTurns: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  try {
    const dbHistory = await prisma.mirandaBusinessMemory.findMany({
      where: { category: `chat_history_${chatId}` },
      orderBy: { id: "desc" },
      take: 10,
    });
    dbHistory.reverse();

    for (const h of dbHistory) {
      const isModel = h.topic === "Miranda";
      conversationTurns.push({
        role: isModel ? "model" : "user",
        parts: [{ text: isModel ? h.instruction : `[Mensaje de ${h.topic}]: ${h.instruction}` }],
      });
    }
  } catch (err) {
    console.warn("[Miranda Memory] Error leyendo historial:", err);
  }

  conversationTurns.push({
    role: "user",
    parts: [{ text: `[Mensaje de ${userName}]: ${userQuery}` }],
  });

  try {
    const rawResult = await generateGeminiContent(conversationTurns, {
      systemInstruction,
      responseJson: true,
    });

    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.split("\n").slice(1).join("\n");
      if (cleanJson.endsWith("```")) {
        cleanJson = cleanJson.slice(0, cleanJson.lastIndexOf("```"));
      }
      cleanJson = cleanJson.trim();
    }

    const parsed = JSON.parse(cleanJson);
    const tipo = parsed.tipo_intencion || "CONSULTA_OPERATIVA";
    let replyMarkup: InlineKeyboardMarkup | null = null;
    let replyText = parsed.respuesta || parsed.mensaje || rawResult;

    if (tipo === "COMPLETAR_TAREA") {
      const target = parsed.ids_tareas_a_completar;
      if (target === "todas" || (typeof target === "string" && target.includes("todas"))) {
        const updateResult = await prisma.mirandaTask.updateMany({
          where: { status: "pending" },
          data: { status: "completed", completedAt: new Date() },
        });
        replyText = `Confirmado. ${updateResult.count} tareas pendientes marcadas como completadas.`;
      } else if (Array.isArray(target) && target.length > 0) {
        const numericIds = target.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
        if (numericIds.length > 0) {
          await prisma.mirandaTask.updateMany({
            where: { id: { in: numericIds }, status: "pending" },
            data: { status: "completed", completedAt: new Date() },
          });
          replyText = `Tareas #${numericIds.join(", #")} marcadas como completadas.`;
        }
      }
    } else if (tipo === "CREAR_TAREA") {
      const dt = parsed.datos_tarea || {};
      if (dt.tarea) {
        const createdTask = await prisma.mirandaTask.create({
          data: {
            task: dt.tarea,
            assignee: dt.responsable || "Personal",
            urgency: dt.urgencia || "Media",
            location: dt.ubicacion || "general",
            dueDate: dt.fecha_limite || "",
            origin: "luis",
          },
        });
        replyMarkup = makeTaskInlineKeyboard(createdTask.id);
      }
    } else if (tipo === "GUARDAR_MEMORIA") {
      const dm = parsed.datos_memoria || {};
      if (dm.instruccion) {
        await prisma.mirandaBusinessMemory.create({
          data: {
            topic: dm.tema || "Directriz de Negocio",
            instruction: dm.instruccion,
            category: dm.categoria || "regla_negocio",
          },
        });
        replyText = `Directriz registrada y activa en memoria operativa: ${dm.instruccion}`;
      }
    } else if (tipo === "PROPONER_CAMBIO_BD") {
      const dc = parsed.datos_cambio || {};
      if (dc.descripcion) {
        const pendingChange = await prisma.mirandaPendingChange.create({
          data: {
            targetDb: dc.target_db || "kode_supabase",
            actionType: dc.action_type || "UPDATE",
            description: dc.descripcion,
            explanation: dc.explicacion || "",
            impactAnalysis: dc.analisis_impacto || "",
            payloadJson: JSON.stringify(dc.payload || {}),
          },
        });
        replyMarkup = makeChangeApprovalKeyboard(pendingChange.id);
      }
    }

    // Actualizar historial conversacional persistente en base de datos
    try {
      await prisma.mirandaBusinessMemory.createMany({
        data: [
          {
            category: `chat_history_${chatId}`,
            topic: userName,
            instruction: userQuery,
          },
          {
            category: `chat_history_${chatId}`,
            topic: "Miranda",
            instruction: replyText,
          },
        ],
      });
    } catch (dbErr) {
      console.warn("[Miranda Memory] Error persistiendo historial:", dbErr);
    }

    return { text: replyText, replyMarkup };
  } catch (err: any) {
    console.error("[Miranda Assistant Error]:", err);
    return {
      text: "Error temporal de comunicación con el servicio. Reintente en un momento.",
      replyMarkup: null,
    };
  }
}
