/**
 * src/lib/miranda/auth.ts - Control de Seguridad y Permisos para Miranda Priestly
 * 
 * Regla de Permisos y Gobernanza:
 * 1. David y Luis (Directores): Acceso total (métricas financieras, ganancias, márgenes, costos, briefings ejecutivos y cambios en BD).
 * 2. Vendedoras y Equipo: Acceso operativo esencial (estado de pedidos, guías C807, tareas de tienda/bodega, datos de clientes para entregas, stock y precios de venta al público).
 * 3. Confidencialidad: Se protegen los márgenes de ganancia, costos de compra a proveedores, dinero total recaudado y cortes de caja.
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
 * Determina si el remitente es David o Luis (los dos únicos directores con acceso a finanzas globales).
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
 * Evalúa si una consulta involucra datos estrictamente confidenciales de los dueños (David y Luis):
 * - Finanzas globales, facturación total, ingresos, margen neto, utilidades, balances de caja.
 * - Costos de compra a proveedores (cuánto nos cuesta).
 * - Briefings ejecutivos de apertura y cierre de jornada.
 * - Alteraciones de base de datos estructurales o cambios de costos.
 */
export function isConfidentialQuery(query: string): boolean {
  const q = query.toLowerCase();

  const strictlyConfidentialPatterns = [
    "facturacion total",
    "facturación total",
    "cuanto vendimos",
    "cuánto vendimos",
    "cuanto se vendio",
    "cuánto se vendió",
    "total vendido",
    "ingresos totales",
    "margen neto",
    "margenes",
    "márgenes",
    "ganancia neta",
    "ganancias",
    "utilidad",
    "rentabilidad",
    "costo de compra",
    "costo proveedor",
    "cuanto nos cuesta",
    "cuánto nos cuesta",
    "corte de caja",
    "cierre del dia",
    "cierre de jornada",
    "balance del dia",
    "briefing matutino",
    "briefing de apertura",
    "briefing",
  ];

  return strictlyConfidentialPatterns.some((pattern) => q.includes(pattern));
}

/**
 * Mensaje de restricción para información puramente financiera o estratégica reservada a los dueños.
 */
export const CONFIDENTIAL_DENIED_MESSAGE =
  "Información financiera global, márgenes de ganancia y balances estratégicos reservados exclusivamente para la dirección (David y Luis). Si necesitas consultar el estado de un pedido, tareas del equipo, stock o clientes, con gusto te asisto.";
