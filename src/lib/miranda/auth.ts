/**
 * src/lib/miranda/auth.ts - Control de Seguridad y Confidencialidad para Miranda Priestly
 * 
 * Regla: La información confidencial, financiera, estratégica y de base de datos
 * SOLAMENTE se comparte con David y Luis.
 */

import { prisma } from "@/lib/prisma";

export interface TelegramSender {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

// IDs conocidos y autorizados
const LUIS_KNOWN_ID = 8888491350;

/**
 * Determina si el remitente es David o Luis (los dos únicos autorizados para datos confidenciales).
 */
export async function isAuthorizedAdmin(sender?: TelegramSender): Promise<{ authorized: boolean; adminName: string }> {
  if (!sender) {
    return { authorized: false, adminName: "" };
  }

  // 1. Verificación directa por ID conocido de Luis
  if (sender.id === LUIS_KNOWN_ID) {
    return { authorized: true, adminName: "Luis" };
  }

  const firstName = (sender.first_name || "").toLowerCase().trim();
  const lastName = (sender.last_name || "").toLowerCase().trim();
  const username = (sender.username || "").toLowerCase().trim();

  const isLuis =
    firstName.includes("luis") ||
    lastName.includes("luis") ||
    username.includes("luis");

  const isDavid =
    firstName.includes("david") ||
    lastName.includes("david") ||
    username.includes("david") ||
    username.includes("dvd");

  if (isLuis) {
    return { authorized: true, adminName: "Luis" };
  }

  if (isDavid) {
    // Si David escribe, persistimos su ID de Telegram para vincularlo permanentemente
    try {
      const existing = await prisma.mirandaBusinessMemory.findFirst({
        where: {
          category: "seguridad_autorizacion",
          topic: `telegram_admin_david_${sender.id}`,
        },
      });
      if (!existing) {
        await prisma.mirandaBusinessMemory.create({
          data: {
            category: "seguridad_autorizacion",
            topic: `telegram_admin_david_${sender.id}`,
            instruction: `ID de Telegram verificado para David: ${sender.id} (${sender.first_name || ""} @${sender.username || ""})`,
          },
        });
      }
    } catch {
      // Ignorar error de guardado en memoria
    }
    return { authorized: true, adminName: "David" };
  }

  // 2. Comprobar si su ID fue registrado previamente en la memoria de Supabase
  try {
    const memory = await prisma.mirandaBusinessMemory.findFirst({
      where: {
        category: "seguridad_autorizacion",
        instruction: { contains: String(sender.id) },
      },
    });
    if (memory) {
      const name = memory.topic.includes("david") ? "David" : "Luis";
      return { authorized: true, adminName: name };
    }
  } catch {
    // Continuar
  }

  return { authorized: false, adminName: "" };
}

/**
 * Evalúa si una consulta involucra datos confidenciales o restringidos:
 * - Finanzas, ventas, facturación, márgenes, costos, dinero.
 * - Cambios o escrituras en bases de datos.
 * - Tareas operativas internas y memorias de negocio.
 * - Datos sensibles de clientes.
 */
export function isConfidentialQuery(query: string): boolean {
  const q = query.toLowerCase();

  const confidentialKeywords = [
    "venta",
    "ventas",
    "factura",
    "facturación",
    "facturacion",
    "ingreso",
    "ingresos",
    "dinero",
    "cuanto",
    "cuánto",
    "margen",
    "márgenes",
    "margenes",
    "costo",
    "costos",
    "ganancia",
    "ganancias",
    "rentabilidad",
    "corte",
    "caja",
    "cierre",
    "briefing",
    "balance",
    "pedido",
    "pedidos",
    "cliente",
    "clientes",
    "tarea",
    "tareas",
    "memoria",
    "regla",
    "reglas",
    "cambio",
    "modificar",
    "cambiar",
    "actualizar",
    "precio",
    "cost",
    "stock",
    "inventario",
    "agotado",
    "dte",
    "guia",
    "guía",
    "c807",
    "wompi",
  ];

  return confidentialKeywords.some((keyword) => q.includes(keyword));
}

/**
 * Mensaje estándar de restricción confidencial para personal o usuarios no autorizados.
 */
export const CONFIDENTIAL_DENIED_MESSAGE =
  "Acceso confidencial restringido. Por protocolos de gobernanza y seguridad de Aromaniak, la información financiera, métricas de ventas, inventario estratégico y administración del sistema solo están disponibles para David y Luis.";
