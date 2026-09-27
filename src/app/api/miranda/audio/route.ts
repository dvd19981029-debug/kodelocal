/**
 * src/app/api/miranda/audio/route.ts - Receptor de Audio de Tienda / Oficina para Vercel
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateGeminiContent } from "@/lib/miranda/gemini";
import { sendTelegramMessage, makeTaskInlineKeyboard } from "@/lib/miranda/telegram";
import { processMirandaInteraction } from "@/lib/miranda/assistant";

export const maxDuration = 60; // Permitir hasta 60s en Vercel para análisis de audio

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const location = (formData.get("location") as string) || "recepcion";

    if (!audioFile) {
      return NextResponse.json({ error: "No se recibió archivo de audio" }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    // Contexto de catálogo dinámico desde Supabase
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { name: true, brand: true, stock: true },
      take: 45,
    });
    const catalogSummary = products
      .map((p) => `- ${p.name} (${p.brand || "Sin marca"}): Stock ${p.stock}`)
      .join("\n");

    const memories = await prisma.mirandaBusinessMemory.findMany({
      take: 10,
    });
    const businessRules = memories.map((m) => `- [${m.topic}]: ${m.instruction}`).join("\n");

    const prompt = `
Eres el Analizador Oficial de Audio de Mostrador para Aromaniak y KODE.
CATÁLOGO DE PRODUCTOS EN TIENDA:
${catalogSummary}

DIRECTRICES Y REGLAS PERMANENTES DICTADAS POR EL DUENO (LUIS):
${businessRules}

INSTRUCCIONES CLAVE:
1. Reconoce fragancias pedidas por los clientes y compáralas con nuestro catálogo.
2. Diarización acústica: [Vendedora] vs [Cliente].
3. REGLA ESTRICTA - MENCIONES A MIRANDA: No hay nadie más llamado Miranda. Cualquier orden que diga "Miranda..." es una orden directa a la IA Miranda. Captúrala en "instrucciones_a_miranda".
4. Si se concreta o menciona un total de venta, extrae el número en "monto_total_venta".
5. Si una venta supera los $40 o activa alguna regla de negocio, genera la alerta en "alertas_reglas_negocio".

Devuelve estrictamente un JSON con esta estructura:
{
  "transcripcion": "Dialogo rotulado",
  "puntuacion_servicio": 85,
  "sentimiento_cliente": "Positivo | Neutral | Insatisfecho",
  "intencion_compra": "Alta | Media | Baja",
  "resultado_interaccion": "Venta | No venta | Consulta",
  "monto_total_venta": 0.0,
  "alertas_reglas_negocio": [],
  "productos_consultados": [
    {
      "fragancia": "Nombre original",
      "marca": "Marca",
      "disponible": false,
      "detalles": "Motivo"
    }
  ],
  "tareas_detectadas": [
    {
      "tarea": "Descripcion",
      "responsable": "Personal",
      "urgencia": "Media"
    }
  ],
  "instrucciones_a_miranda": [],
  "resumen_interaccion": "Resumen conciso"
}
`;

    const rawJson = await generateGeminiContent(
      [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "audio/wav",
                data: base64Audio,
              },
            },
            { text: prompt },
          ],
        },
      ],
      { responseJson: true }
    );

    let cleanJson = rawJson.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.split("\n").slice(1).join("\n");
      if (cleanJson.endsWith("```")) {
        cleanJson = cleanJson.slice(0, cleanJson.lastIndexOf("```"));
      }
      cleanJson = cleanJson.trim();
    }

    const analysis = JSON.parse(cleanJson);

    // 1. Guardar interacción en Supabase
    const savedInteraction = await prisma.mirandaInteraction.create({
      data: {
        location,
        transcription: analysis.transcripcion || "",
        summary: analysis.resumen_interaccion || "",
        serviceScore: analysis.puntuacion_servicio || 85,
        customerSentiment: analysis.sentimiento_cliente || "Neutral",
        purchaseIntent: analysis.intencion_compra || "Media",
        interactionResult: analysis.resultado_interaccion || "Consulta",
        totalSaleAmount: analysis.monto_total_venta ? Number(analysis.monto_total_venta) : null,
        rawJson: cleanJson,
      },
    });

    // 2. Guardar demandas insatisfechas
    for (const p of analysis.productos_consultados || []) {
      if (!p.disponible) {
        await prisma.mirandaDemand.create({
          data: {
            fragrance: p.fragancia || "Desconocida",
            brand: p.marca || "",
            details: p.detalles || "Sin stock en mostrador",
            location,
          },
        });
      }
    }

    // 3. Guardar tareas detectadas y alertar
    for (const t of analysis.tareas_detectadas || []) {
      if (t.tarea) {
        const createdTask = await prisma.mirandaTask.create({
          data: {
            task: t.tarea,
            assignee: t.responsable || "Personal",
            urgency: t.urgencia || "Media",
            location,
            origin: "audio",
          },
        });
        const kb = makeTaskInlineKeyboard(createdTask.id);
        await sendTelegramMessage(
          `<b>[TAREA DETECTADA #${createdTask.id} - ${location.toUpperCase()}]</b>\n` +
            `<b>Tarea:</b> ${createdTask.task}\n` +
            `<b>Responsable:</b> ${createdTask.assignee} | <b>Urgencia:</b> ${createdTask.urgency}`,
          kb
        );
      }
    }

    // 4. Regla VIP de compra superior a $40
    const montoVenta = Number(analysis.monto_total_venta || 0);
    if (montoVenta >= 40.0) {
      await sendTelegramMessage(
        `<b>[ALERTA VIP - VENTA ALTA EN ${location.toUpperCase()}]</b>\n\n` +
          `<b>Monto detectado:</b> $${montoVenta.toFixed(2)}\n` +
          `<b>Resumen:</b> ${analysis.resumen_interaccion}\n\n` +
          `<b>Acción según regla de Luis:</b> Invitar al cliente a la oficina para atención VIP.`
      );
    }

    // 5. Procesar órdenes dirigidas a Miranda
    const mirandaInstructions: string[] = analysis.instrucciones_a_miranda || [];
    for (const inst of mirandaInstructions) {
      if (inst && inst.trim().length > 3) {
        const res = await processMirandaInteraction(inst);
        await sendTelegramMessage(
          `<b>[ORDEN DE VOZ EN TIENDA]:</b>\n<i>"${inst}"</i>\n\n<b>Miranda:</b>\n${res.text}`,
          res.replyMarkup
        );
      }
    }

    return NextResponse.json({
      success: true,
      interactionId: savedInteraction.id,
      analysis,
    });
  } catch (error: any) {
    console.error("[Miranda Audio Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
