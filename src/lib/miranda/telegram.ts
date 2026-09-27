/**
 * src/lib/miranda/telegram.ts - Cliente Telegram para Miranda Priestly
 */

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export async function sendTelegramMessage(
  text: string,
  replyMarkup?: InlineKeyboardMarkup | null,
  chatId?: string
): Promise<boolean> {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const targetChat = chatId || (process.env.TELEGRAM_CHAT_ID || "").trim();

  if (!token || !targetChat) {
    console.warn("[Miranda Telegram] Token o Chat ID no configurados.");
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload: Record<string, any> = {
    chat_id: targetChat,
    text,
    parse_mode: "HTML",
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (error) {
    console.error("[Miranda Telegram] Error enviando mensaje:", error);
    return false;
  }
}

export async function answerTelegramCallback(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
): Promise<boolean> {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token || !callbackQueryId) return false;

  try {
    const payload: Record<string, any> = { callback_query_id: callbackQueryId };
    if (text) {
      payload.text = text;
      payload.show_alert = showAlert;
    }
    const res = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function makeTaskInlineKeyboard(taskId: number): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Completada", callback_data: `task_done_${taskId}` },
        { text: "Posponer 30 min", callback_data: `task_postpone_${taskId}` },
        { text: "Cancelar", callback_data: `task_cancel_${taskId}` },
      ],
    ],
  };
}

export function makeChangeApprovalKeyboard(changeId: number): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Aprobar Cambio", callback_data: `change_approve_${changeId}` },
        { text: "Cancelar", callback_data: `change_reject_${changeId}` },
      ],
    ],
  };
}

export function makeChangeConfirmationKeyboard(changeId: number): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Confirmar Definitivamente", callback_data: `change_confirm_${changeId}` },
        { text: "Cancelar", callback_data: `change_reject_${changeId}` },
      ],
    ],
  };
}
