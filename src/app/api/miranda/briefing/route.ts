/**
 * src/app/api/miranda/briefing/route.ts - Generador de Briefings de Crecimiento (Vercel Cron / On Demand)
 */

import { NextRequest, NextResponse } from "next/server";
import { generateMorningBriefing, generateEveningBriefing } from "@/lib/miranda/growth";
import { sendTelegramMessage } from "@/lib/miranda/telegram";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "morning";

  try {
    let briefingText = "";
    if (type === "evening" || type === "cierre") {
      briefingText = await generateEveningBriefing();
    } else {
      briefingText = await generateMorningBriefing();
    }

    const sent = await sendTelegramMessage(briefingText);

    return NextResponse.json({
      success: true,
      type,
      sentToTelegram: sent,
      briefing: briefingText,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
