import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formatted = customers.map((c) => ({
      id: c.id,
      tipoPersona: (c.nrc || c.documentType === 'NIT') ? 'JURIDICA' : 'NATURAL',
      name: c.name,
      nombreComercial: c.tradeName || c.businessName || '',
      tipoDocumento: (c.documentType as any) || 'DUI',
      numDocumento: c.documentNum || '00000000-0',
      nrc: c.nrc || '',
      actividadEconomica: c.activityDesc || '',
      categoriaContribuyente: (c.taxCategory as any) || 'OTRO',
      documentoPreferido: (c.preferredDoc as any) || (c.nrc ? '03' : '01'),
      email: c.email || '',
      phone: c.phone || '',
      departamento: c.department || 'San Salvador',
      municipio: c.municipality || 'San Salvador',
      direccion: c.address || '',
      notas: c.notes || '',
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, customers: formatted });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      nombreComercial,
      tipoPersona,
      tipoDocumento,
      numDocumento,
      nrc,
      actividadEconomica,
      categoriaContribuyente,
      documentoPreferido,
      email,
      phone,
      departamento,
      municipio,
      direccion,
      notas,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const data: any = {
      name: name.trim(),
      tradeName: nombreComercial?.trim() || null,
      documentType: tipoDocumento || (tipoPersona === 'JURIDICA' ? 'NIT' : 'DUI'),
      documentNum: numDocumento?.trim() || '00000000-0',
      nrc: nrc?.trim() || null,
      activityDesc: actividadEconomica?.trim() || null,
      taxCategory: categoriaContribuyente || 'OTRO',
      preferredDoc: documentoPreferido || (nrc ? '03' : '01'),
      email: email?.trim()?.toLowerCase() || null,
      phone: phone?.trim() || null,
      department: departamento || 'San Salvador',
      municipality: municipio?.trim() || 'San Salvador',
      address: direccion?.trim() || null,
      notes: notas?.trim() || null,
    };

    let customer;
    if (id && !id.startsWith('cli-')) {
      customer = await prisma.customer.update({
        where: { id },
        data,
      });
    } else {
      const existing = await prisma.customer.findFirst({
        where: {
          OR: [
            ...(data.email ? [{ email: data.email }] : []),
            ...(data.phone ? [{ phone: data.phone }] : []),
          ],
        },
      });

      if (existing) {
        customer = await prisma.customer.update({
          where: { id: existing.id },
          data,
        });
      } else {
        customer = await prisma.customer.create({
          data,
        });
      }
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Error saving customer:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
