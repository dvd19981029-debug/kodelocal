/**
 * src/app/api/miranda/telegram/route.ts - Webhook Oficial de Telegram para Miranda Priestly
 * 
 * Regla de Confidencialidad:
 * Información financiera, ventas, inventario estratégico, métricas, cambios en BD
 * y tareas SOLO se comparten con David y Luis.
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
      if (!auth.authorized) {
        await answerTelegramCallback(
          cbId,
          "Acceso denegado: Acción reservada exclusivamente para David y Luis.",
          true
        );
        return NextResponse.json({ ok: true });
      }

      await answerTelegramCallback(cbId);

      // Botones de Tareas
      if (cbData.startsWith("task_done_")) {
        const taskId = parseInt(cbData.replace("task_done_", ""), 10);
        await prisma.mirandaTask.update({
          where: { id: taskId },
          data: { status: "completed", completedAt: new Date() },
        });
        await sendTelegramMessage(
          `<b>[TAREA #${taskId} COMPLETADA POR ${auth.adminName.toUpperCase()}]</b>`,
          null,
          chatId
        );
      } else if (cbData.startsWith("task_postpone_")) {
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
      } else if (cbData.startsWith("task_cancel_")) {
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
      }

      // Botones de Modificación de Base de Datos (2 Pasos)
      else if (cbData.startsWith("change_approve_")) {
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

    // 2. GESTIÓN DE MENSAJES DE TEXTO
    const message = body.message || body.channel_post;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const text = (message.text || "").trim();
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

    // Verificación de autorización de seguridad (David y Luis)
    const auth = await isAuthorizedAdmin(sender);

    if (!auth.authorized) {
      // Si el usuario no es David ni Luis y solicita datos confidenciales o de negocio
      if (isConfidentialQuery(text)) {
        await sendTelegramMessage(CONFIDENTIAL_DENIED_MESSAGE, null, chatId);
        return NextResponse.json({ ok: true });
      }

      // Consulta pública general
      const publicResponse =
        "Hola. Soy Miranda Priestly, asistente de Aromaniak. Para consultas sobre fragancias o atención al cliente, indícame qué perfume buscas. Información administrativa o financiera reservada a la dirección.";
      await sendTelegramMessage(publicResponse, null, chatId);
      return NextResponse.json({ ok: true });
    }

    // Usuario autorizado (David o Luis): acceso completo y ejecutivo
    const result = await processMirandaInteraction(text, auth.adminName);
    await sendTelegramMessage(result.text, result.replyMarkup, chatId);

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
    authorizedAdmins: ["Luis", "David"],
    timestamp: new Date().toISOString(),
  });
}
