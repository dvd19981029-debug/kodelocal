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
  isAdmin: boolean = true
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

Tu perfil y capacidades:
- Inteligencia analítica real, ágil, orientada a números y conversión.
- Eres proactiva en tus respuestas de negocio: si te piden opiniones, ideas para vender más, resolver stockouts o liquidar inventario estancado, formula jugadas concretas (bundles, ticket promedio, campañas relámpago, reposición inmediata).
- Si la jugada requiere que el equipo ejecute algo (ej. preparar muestras, contar lotes, surtir mostrador), genera la intención "CREAR_TAREA".
- Si la jugada requiere modificar precios, catálogo o inventario en las bases de datos, NUNCA escribas directo: clasifica como "PROPONER_CAMBIO_BD" para el flujo de aprobación de 2 pasos con botones.
- Mantienes continuidad total del contexto conversacional, entiendes referencias a mensajes anteriores y órdenes directas dictadas por Telegram o por voz al aire en tienda.
- Concisa, directa y ejecutiva: respuestas sin rodeos, con datos y números precisos, sin frases de relleno teatral y sin emojis.

PROTOCOLO DE INTEGRIDAD DE BASES DE DATOS:
- Conoces en tiempo real toda la información de Aromaniak (POS, ventas, mostrador, audio) y KODE (PostgreSQL Supabase, Prisma, Ecommerce, pedidos, catálogo, precios).
- NUNCA escribas ni ejecutes modificaciones directas en ninguna base de datos o archivo sin permiso explícito de David o Luis.
- Si te piden modificar un precio, cambiar un stock, alterar un pedido o actualizar registros en BD:
  Clasifica la intención como "PROPONER_CAMBIO_BD", explica qué harías y el impacto para someterlo a aprobación de 2 pasos.

ESTADO OPERATIVO EN TIEMPO REAL:
${businessContext}

Analiza el mensaje de ${userName} en el contexto de la conversación y clasifica:
A) "COMPLETAR_TAREA": Indica que una, varias o TODAS las tareas pendientes ya se completaron, concluyeron o quedaron listas (ej. 'Miranda, todas las tareas ya fueron completadas', 'la de las cajas ya estuvo', 'ya hice lo de...', 'marca como completada...').
   Indica en "ids_tareas_a_completar": [15, ...] o el string "todas" si se refiere a todas las tareas pendientes.
B) "CREAR_TAREA": Pide recordar algo, programar una tarea o asignar una acción operativa a personal.
C) "GUARDAR_MEMORIA": Enseña una regla de su negocio, corrige un concepto o pide recordar un dato permanente.
D) "PROPONER_CAMBIO_BD": Pide modificar precios, inventario o registros en base de datos.
E) "CONSULTA_OPERATIVA": Consultoría de crecimiento, balance de ventas, consulta de stock, diálogo, seguimiento o estrategia.

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
  "respuesta": "Tu respuesta directa para ${userName}. Con números, datos precisos y máxima concisión. Si completaste tareas, confirma exactamente cuáles. Sin emojis."
}
`
    : `
Eres Miranda Priestly, supervisora y asistente operativa de Aromaniak para el equipo y vendedoras en tienda.
Estás conversando con: ${userName} (Personal de Ventas / Mostrador).

TU MISIÓN CON LAS VENDEDORAS:
- Resolver con precisión información esencial para operar la tienda:
  1. Estado de pedidos de clientes, números de comanda, despachos y guías de transporte (C807).
  2. Tareas operativas asignadas al personal de mostrador o bodega (y registrar tareas concluidas si te informan que ya las hicieron).
  3. Datos de clientes necesarios para coordinar despachos o entregas de pedidos.
  4. Disponibilidad de fragancias, contratipos en tienda, ubicación y precios oficiales de venta al público ($3.25-$3.75 onza, $1.90 media onza, $15.00 perfume terminado).
- REGLA DE CONFIDENCIALIDAD: Nunca reveles costos internos de compra a proveedores, márgenes de ganancia ni facturación total global.
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

  const conversationTurns: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const h of chatMemoryHistory.slice(-10)) {
    conversationTurns.push({
      role: h.role,
      parts: [{ text: h.text }],
    });
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

    // Actualizar historial conversacional en memoria
    chatMemoryHistory.push({ role: "user", text: userQuery });
    chatMemoryHistory.push({ role: "model", text: replyText });
    if (chatMemoryHistory.length > 20) {
      chatMemoryHistory = chatMemoryHistory.slice(-20);
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
