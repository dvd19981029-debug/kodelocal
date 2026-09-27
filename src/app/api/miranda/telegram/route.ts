/**
 * src/app/api/miranda/telegram/route.ts - Webhook Oficial de Telegram para Miranda Priestly
 * 
 * Regla de Permisos y Gobernanza:
 * 1. David y Luis (Directores): Acceso total a finanzas, utilidades, márgenes, costos y aprobación de cambios en BD.
 * 2. Vendedoras y Equipo: Acceso operativo a estado de pedidos, guías C807, tareas de tienda, clientes y stock.
 * 3. Confidencialidad: Se protege la facturación global, ganancias netas y costos de compra a proveedores.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendTelegramMessage,
  answerTelegramCallback,
  makeChangeConfirmationKeyboard,
} from "@/lib/miranda/telegram";
import { processMirandaInteraction } from "@/lib/miranda/assistant";
import {
  isAuthorizedAdmin,
  isConfidentialQuery,
  CONFIDENTIAL_DENIED_MESSAGE,
} from "@/lib/miranda/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. GESTIÓN DE BOTONES INTERACTIVOS (CALLBACK QUERY)
    if (body.callback_query) {
      const cb = body.callback_query;
      const cbId = cb.id;
      const cbData = cb.data || "";
      const chatId = String(cb.message?.chat?.id || process.env.TELEGRAM_CHAT_ID);
      const sender = cb.from;

      const auth = await isAuthorizedAdmin(sender);

      // Botones de Tareas: El personal y vendedoras SÍ pueden interactuar con sus tareas
      if (cbData.startsWith("task_done_")) {
        await answerTelegramCallback(cbId);
        const taskId = parseInt(cbData.replace("task_done_", ""), 10);
        await prisma.mirandaTask.update({
          where: { id: taskId },
          data: { status: "completed", completedAt: new Date() },
        });
        const completedBy = auth.authorized ? auth.adminName : (sender?.first_name || "Equipo");
        await sendTelegramMessage(
          `<b>[TAREA #${taskId} COMPLETADA POR ${completedBy.toUpperCase()}]</b>`,
          null,
          chatId
        );
        return NextResponse.json({ ok: true });
      } else if (cbData.startsWith("task_postpone_")) {
        await answerTelegramCallback(cbId);
        const taskId = parseInt(cbData.replace("task_postpone_", ""), 10);
        await prisma.mirandaTask.update({
          where: { id: taskId },
          data: { status: "postponed" },
        });
        await sendTelegramMessage(
          `<b>[TAREA #${taskId} POSPUESTA 30 MIN]</b>`,
          null,
          chatId
        );
        return NextResponse.json({ ok: true });
      } else if (cbData.startsWith("task_cancel_")) {
        // Cancelar tarea requiere rol directivo
        if (!auth.authorized) {
          await answerTelegramCallback(
            cbId,
            "Acceso denegado: Cancelación de tareas reservada para David y Luis.",
            true
          );
          return NextResponse.json({ ok: true });
        }
        await answerTelegramCallback(cbId);
        const taskId = parseInt(cbData.replace("task_cancel_", ""), 10);
        await prisma.mirandaTask.update({
          where: { id: taskId },
          data: { status: "cancelled" },
        });
        await sendTelegramMessage(
          `<b>[TAREA #${taskId} CANCELADA POR ${auth.adminName.toUpperCase()}]</b>`,
          null,
          chatId
        );
        return NextResponse.json({ ok: true });
      }

      // Botones de Modificación de Base de Datos: EXCLUSIVO para David y Luis
      if (cbData.startsWith("change_")) {
        if (!auth.authorized) {
          await answerTelegramCallback(
            cbId,
            "Acceso denegado: Aprobación de cambios en base de datos reservada exclusivamente para David y Luis.",
            true
          );
          return NextResponse.json({ ok: true });
        }

        await answerTelegramCallback(cbId);

        if (cbData.startsWith("change_approve_")) {
          const changeId = parseInt(cbData.replace("change_approve_", ""), 10);
          const change = await prisma.mirandaPendingChange.update({
            where: { id: changeId },
            data: { status: "pre_approved", approvedAt: new Date() },
          });

          const confirmKb = makeChangeConfirmationKeyboard(changeId);
          const msg =
            `<b>[CONFIRMACIÓN REQUERIDA - PASO 2/2]</b>\n` +
            `Cambio <b>#${changeId}</b> pre-aprobado por ${auth.adminName}.\n` +
            `<b>Destino:</b> ${change.targetDb}\n` +
            `<b>Acción:</b> ${change.description}\n` +
            `<b>Impacto:</b> ${change.impactAnalysis || "Sin impacto reportado"}\n\n` +
            `¿Confirmar aplicación definitiva?`;
          await sendTelegramMessage(msg, confirmKb, chatId);
        } else if (cbData.startsWith("change_confirm_")) {
          const changeId = parseInt(cbData.replace("change_confirm_", ""), 10);
          await prisma.mirandaPendingChange.update({
            where: { id: changeId },
            data: {
              status: "confirmed",
              confirmedAt: new Date(),
              executionResult: `Confirmado y autorizado por ${auth.adminName}.`,
            },
          });
          await sendTelegramMessage(
            `<b>[CAMBIO #${changeId} EJECUTADO EXITOSAMENTE]</b>`,
            null,
            chatId
          );
        } else if (cbData.startsWith("change_reject_")) {
          const changeId = parseInt(cbData.replace("change_reject_", ""), 10);
          await prisma.mirandaPendingChange.update({
            where: { id: changeId },
            data: { status: "rejected" },
          });
          await sendTelegramMessage(
            `<b>[CAMBIO #${changeId} DESCARTADO POR ${auth.adminName.toUpperCase()}]</b>`,
            null,
            chatId
          );
        }

        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    // 2. GESTIÓN DE MENSAJES DE TEXTO
    const message = body.message || body.channel_post;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    let text = (message.text || "").trim();
    text = text.replace(/@MirandaAromaniak_bot/gi, "").trim();
    const chatId = String(message.chat?.id || process.env.TELEGRAM_CHAT_ID);
    const sender = message.from;

    if (!text) {
      return NextResponse.json({ ok: true });
    }

    // Comando inicial de bienvenida
    if (text.startsWith("/start")) {
      await sendTelegramMessage(
        "Miranda Priestly activa y supervisando en tiempo real las operaciones de Aromaniak y KODE.",
        null,
        chatId
      );
      return NextResponse.json({ ok: true });
    }

    // Verificación de perfil (Directores vs Equipo/Vendedoras)
    const auth = await isAuthorizedAdmin(sender);

    if (auth.authorized) {
      // Directores (David y Luis): acceso completo y ejecutivo
      const result = await processMirandaInteraction(text, auth.adminName, true);
      await sendTelegramMessage(result.text, result.replyMarkup, chatId);
    } else {
      // Vendedoras / Equipo:
      // Si intentan consultar datos estrictamente financieros o balances de los dueños
      if (isConfidentialQuery(text)) {
        await sendTelegramMessage(CONFIDENTIAL_DENIED_MESSAGE, null, chatId);
        return NextResponse.json({ ok: true });
      }

      // Consultas operativas permitidas (pedidos, clientes, tareas, stock y precios oficiales)
      const staffName = sender?.first_name || "Equipo";
      const result = await processMirandaInteraction(text, staffName, false);
      await sendTelegramMessage(result.text, result.replyMarkup, chatId);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[Telegram Webhook Error]:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    bot: "Miranda Priestly (Aromaniak & KODE)",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    geminiKeyLength: (process.env.GEMINI_API_KEY || "").length,
    hasTelegramToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    hasTelegramChatId: Boolean(process.env.TELEGRAM_CHAT_ID),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    timestamp: new Date().toISOString(),
  });
}
