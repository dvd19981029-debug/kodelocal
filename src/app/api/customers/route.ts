import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffRequest } from '@/lib/customerAuthToken';
import { resolveGiroMH, formatGiroOption } from '@/lib/svGirosCat019';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { authorized } = verifyStaffRequest(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere sesión activa de personal operativo.' },
        { status: 401 }
      );
    }

    const customers = await prisma.customer.findMany({
      include: { tier: true },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = customers.map((c) => {
      const resolvedGiro = resolveGiroMH(c.activityDesc, c.activityCode);
      return {
        id: c.id,
        tipoPersona: (c.nrc || c.documentType === 'NIT' || c.preferredDoc === '03') ? 'JURIDICA' : 'NATURAL',
        name: c.name,
        nombreComercial: c.tradeName || c.businessName || '',
        tipoDocumento: (c.documentType as any) || (c.nrc ? 'NIT' : 'DUI'),
        numDocumento: c.documentNum || '00000000-0',
        nrc: c.nrc || '',
        codActividad: resolvedGiro?.code || c.activityCode || '',
        actividadEconomica: resolvedGiro ? formatGiroOption(resolvedGiro) : (c.activityDesc || ''),
        categoriaContribuyente: (c.taxCategory as any) || 'OTRO',
        documentoPreferido: (c.preferredDoc as any) || (c.nrc ? '03' : '01'),
        email: c.email || '',
        phone: c.phone || '',
        departamento: c.department || 'San Salvador',
        municipio: c.municipality || 'San Salvador Centro',
        direccion: c.address || '',
        notas: c.notes || '',
        specialEssencePrice: c.specialEssencePrice ? Number(c.specialEssencePrice) : null,
        specialBottlePrice: c.specialBottlePrice ? Number(c.specialBottlePrice) : null,
        tierId: c.tierId || null,
        customDiscountPct: c.customDiscountPct || null,
        tier: c.tier || null,
        createdAt: c.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, customers: formatted });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { authorized } = verifyStaffRequest(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere sesión activa de personal operativo.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      name,
      nombreComercial,
      tipoPersona,
      tipoDocumento,
      numDocumento,
      nrc,
      codActividad,
      actividadEconomica,
      categoriaContribuyente,
      documentoPreferido,
      email,
      phone,
      departamento,
      municipio,
      direccion,
      notas,
      specialEssencePrice,
      specialBottlePrice,
      tierId,
      customDiscountPct,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const resolvedGiro = resolveGiroMH(actividadEconomica, codActividad);

    const data: any = {
      name: name.trim(),
      documentType: tipoDocumento || (tipoPersona === 'JURIDICA' ? 'NIT' : 'DUI'),
      documentNum: numDocumento?.trim() || '00000000-0',
      preferredDoc: documentoPreferido || (nrc ? '03' : '01'),
      department: departamento || 'San Salvador',
      municipality: municipio?.trim() || 'San Salvador Centro',
    };

    if (nombreComercial !== undefined) {
      data.tradeName = nombreComercial?.trim() || null;
    }
    if (tipoPersona === 'JURIDICA' || documentoPreferido === '03' || nrc?.trim() || nombreComercial !== undefined) {
      data.businessName = (tipoPersona === 'JURIDICA' || documentoPreferido === '03' || nrc?.trim())
        ? (nombreComercial?.trim() || name.trim())
        : (nombreComercial?.trim() || null);
    }
    if (nrc !== undefined) {
      data.nrc = nrc?.trim() || null;
    }
    if (actividadEconomica !== undefined || codActividad !== undefined) {
      data.activityCode = resolvedGiro?.code || codActividad?.trim() || null;
      data.activityDesc = resolvedGiro ? formatGiroOption(resolvedGiro) : (actividadEconomica?.trim() || null);
    }
    if (categoriaContribuyente !== undefined) {
      data.taxCategory = categoriaContribuyente || 'OTRO';
    }
    if (email !== undefined) {
      data.email = email?.trim()?.toLowerCase() || null;
    }
    if (phone !== undefined) {
      data.phone = phone?.trim() || null;
    }
    if (direccion !== undefined) {
      data.address = direccion?.trim() || null;
    }
    if (notas !== undefined) {
      data.notes = notas?.trim() || null;
    }
    if (specialEssencePrice !== undefined) {
      data.specialEssencePrice = (specialEssencePrice !== null && specialEssencePrice !== '') ? Number(specialEssencePrice) : null;
    }
    if (specialBottlePrice !== undefined) {
      data.specialBottlePrice = (specialBottlePrice !== null && specialBottlePrice !== '') ? Number(specialBottlePrice) : null;
    }
    if (tierId !== undefined) {
      data.tierId = tierId || null;
    }
    if (customDiscountPct !== undefined) {
      data.customDiscountPct = (customDiscountPct !== null && customDiscountPct !== '') ? Number(customDiscountPct) : null;
    }

    let customer;
    if (id && !id.startsWith('cli-')) {
      if (data.email) {
        const conflict = await prisma.customer.findFirst({
          where: { email: { equals: data.email, mode: 'insensitive' }, NOT: { id } },
        });
        if (conflict) {
          customer = await prisma.customer.update({
            where: { id: conflict.id },
            include: { tier: true },
            data,
          });
          return NextResponse.json({ success: true, customer });
        }
      }

      customer = await prisma.customer.update({
        where: { id },
        include: { tier: true },
        data,
      });
    } else {
      // Priorizar coincidencia por correo electrónico (case-insensitive) y como respaldo por documento o teléfono
      let existing = data.email
        ? await prisma.customer.findFirst({
            where: { email: { equals: data.email, mode: 'insensitive' } },
            include: { tier: true },
          })
        : null;

      if (!existing && data.documentNum && data.documentNum !== '00000000-0') {
        existing = await prisma.customer.findFirst({
          where: { documentNum: data.documentNum },
          include: { tier: true },
        });
      }

      if (!existing && data.phone) {
        existing = await prisma.customer.findFirst({
          where: { phone: data.phone },
          include: { tier: true },
        });
      }

      if (existing) {
        customer = await prisma.customer.update({
          where: { id: existing.id },
          include: { tier: true },
          data,
        });
      } else {
        customer = await prisma.customer.create({
          data,
          include: { tier: true },
        });
      }
    }

    // Vincular automáticamente compras previas (EcommerceOrder y Sale) por correo o documento
    if (customer?.id) {
      try {
        if (customer.email) {
          await prisma.ecommerceOrder.updateMany({
            where: {
              customerId: null,
              customerEmail: { equals: customer.email, mode: 'insensitive' },
            },
            data: { customerId: customer.id },
          });
          await prisma.sale.updateMany({
            where: {
              customerId: null,
              OR: [
                { notes: { contains: customer.email, mode: 'insensitive' } },
                { dteDocument: { requestJson: { contains: customer.email, mode: 'insensitive' } } },
              ],
            },
            data: { customerId: customer.id },
          });
        }
        if (customer.documentNum && customer.documentNum !== '00000000-0') {
          await prisma.sale.updateMany({
            where: {
              customerId: null,
              OR: [
                { notes: { contains: customer.documentNum } },
                { dteDocument: { requestJson: { contains: customer.documentNum } } },
              ],
            },
            data: { customerId: customer.id },
          });
        }
      } catch (linkErr) {
        console.error('Error linking customer history:', linkErr);
      }
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Error saving customer:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
