import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, apiVersion = '1', baseUrl = 'https://api.facturallama.com' } = body;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Falta la API Key para probar' }, { status: 400 });
    }

    const cleanKey = apiKey.trim();
    const cleanVersion = (apiVersion || '1').trim();
    const cleanBaseUrl = (baseUrl || 'https://api.facturallama.com').trim();

    const res = await fetch(cleanBaseUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': cleanKey,
        'X-API-Version': cleanVersion,
      },
    });

    const data = await res.json().catch(() => null);

    if (res.ok) {
      return NextResponse.json({
        success: true,
        status: res.status,
        message: data?.message || 'Conexión exitosa y autorizada con Factura Llama',
      });
    } else if (res.status === 401) {
      return NextResponse.json({
        success: false,
        status: 401,
        error: 'API Key no autorizada por Factura Llama (Error 401: Unauthorized). Verifica que la clave corresponda al ambiente seleccionado.',
      });
    } else {
      return NextResponse.json({
        success: false,
        status: res.status,
        error: data?.message || `Factura Llama respondió con estado HTTP ${res.status}`,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Error de red al conectar con Factura Llama: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
