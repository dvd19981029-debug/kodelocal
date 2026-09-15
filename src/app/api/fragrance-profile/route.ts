import { NextResponse } from 'next/server';
import fragranceDatabaseRaw from '@/lib/fragranceDatabase.json';

export const dynamic = 'force-dynamic';

interface FragranceDbEntry {
  kodigo?: string;
  contratipo: string;
  marca: string;
  genero?: string;
  officialName: string;
  brand: string;
  family: string;
  accords: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  source?: string;
  description?: string;
}

const fragranceDatabase = fragranceDatabaseRaw as unknown as Record<string, FragranceDbEntry>;

function normalize(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || '';
    const inspiracion = searchParams.get('inspiracion') || '';

    const normName = normalize(name);
    const normInspiracion = normalize(inspiracion);

    if (!normName && !normInspiracion) {
      return NextResponse.json({ success: false, entry: null });
    }

    const values = Object.values(fragranceDatabase);
    let entry = values.find(p => {
      const dbOfficial = normalize(p.officialName);
      const dbContratipo = normalize(p.contratipo);
      return (normInspiracion && (dbOfficial === normInspiracion || dbContratipo === normInspiracion)) ||
             (normName && (dbOfficial === normName || dbContratipo === normName));
    });

    if (!entry && normInspiracion) {
      entry = values.find(p => {
        const dbOfficial = normalize(p.officialName);
        return dbOfficial.includes(normInspiracion) || normInspiracion.includes(dbOfficial);
      });
    }

    return NextResponse.json({
      success: !!entry,
      entry: entry || null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
