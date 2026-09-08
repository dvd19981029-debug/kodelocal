// src/app/api/dte/[id]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Falta ID de DTE' }, { status: 400 });
  }

  // Redirigir directamente al endpoint del PDF
  const url = new URL(request.url);
  url.pathname = `/api/dte/${id}/pdf`;
  return NextResponse.redirect(url);
}
