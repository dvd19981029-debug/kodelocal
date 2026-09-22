import { NextResponse } from 'next/server';
import { getKodeConfig, saveKodeConfig } from '@/lib/kodeConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = getKodeConfig();
    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error('Error al obtener configuración de Kode:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ambiente,
      testApiKey,
      liveApiKey,
      facturaLlamaApiKey,
      facturaLlamaApiVersion,
      facturaLlamaBaseUrl,
      defaultEmail,
      defaultDui,
    } = body;

    const updated = saveKodeConfig({
      ...(ambiente ? { ambiente } : {}),
      ...(testApiKey !== undefined ? { testApiKey: testApiKey.trim() } : {}),
      ...(liveApiKey !== undefined ? { liveApiKey: liveApiKey.trim() } : {}),
      ...(facturaLlamaApiKey ? { facturaLlamaApiKey: facturaLlamaApiKey.trim() } : {}),
      ...(facturaLlamaApiVersion ? { facturaLlamaApiVersion: facturaLlamaApiVersion.trim() } : {}),
      ...(facturaLlamaBaseUrl ? { facturaLlamaBaseUrl: facturaLlamaBaseUrl.trim() } : {}),
      ...(defaultEmail ? { defaultEmail: defaultEmail.trim() } : {}),
      ...(defaultDui ? { defaultDui: defaultDui.trim() } : {}),
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración de Kode actualizada exitosamente',
      config: updated,
    });
  } catch (error: any) {
    console.error('Error al guardar configuración de Kode:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
