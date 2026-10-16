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
      include: { tier: true, bottleTier: true, suppliesTier: true },
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
        bottleTierId: c.bottleTierId || null,
        bottleCustomDiscountPct: c.bottleCustomDiscountPct || null,
        bottleTier: c.bottleTier || null,
        suppliesTierId: c.suppliesTierId || null,
        suppliesCustomDiscountPct: c.suppliesCustomDiscountPct || null,
        suppliesTier: c.suppliesTier || null,
        createdAt: c.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, customers: formatted });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function isGenericPlaceholderEmail(email?: string | null): boolean {
  if (!email) return true;
  const e = email.trim().toLowerCase();
  if (!e) return true;
  return (
    /^(cliente|clientes|sin|sincorreo|nocorreo|no|ninguno|na|test|correo|consumidor|final|anonimo|ventas|factura|facturacion)@/.test(e) ||
    e === 'cliente@gmail.com' ||
    e === 'sin@correo.com' ||
    e === 'no@tiene.com'
  );
}

function isGenericPlaceholderDocument(doc?: string | null): boolean {
  if (!doc) return true;
  const d = doc.trim().replace(/[-\s']/g, '');
  if (!d) return true;
  return /^(0+|9+|12345678\d?|123456789\d*|00000000\d?)$/.test(d);
}

function isGenericPlaceholderPhone(phone?: string | null): boolean {
  if (!phone) return true;
  const p = phone.trim().replace(/\D/g, '');
  if (!p) return true;
  return /^(0+|7+|9+|2+|12345678)$/.test(p);
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
      bottleTierId,
      bottleCustomDiscountPct,
      suppliesTierId,
      suppliesCustomDiscountPct,
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
      const cleanEmail = email?.trim()?.toLowerCase() || null;
      data.email = isGenericPlaceholderEmail(cleanEmail) ? null : cleanEmail;
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
    if (bottleTierId !== undefined) {
      data.bottleTierId = bottleTierId || null;
    }
    if (bottleCustomDiscountPct !== undefined) {
      data.bottleCustomDiscountPct = (bottleCustomDiscountPct !== null && bottleCustomDiscountPct !== '') ? Number(bottleCustomDiscountPct) : null;
    }
    if (suppliesTierId !== undefined) {
      data.suppliesTierId = suppliesTierId || null;
    }
    if (suppliesCustomDiscountPct !== undefined) {
      data.suppliesCustomDiscountPct = (suppliesCustomDiscountPct !== null && suppliesCustomDiscountPct !== '') ? Number(suppliesCustomDiscountPct) : null;
    }

    const tierInclude = { tier: true, bottleTier: true, suppliesTier: true };

    const namesReferToSameCustomer = (nameA?: string | null, nameB?: string | null): boolean => {
      const a = (nameA || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const b = (nameB || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!a || !b) return false;
      return a === b || a.includes(b) || b.includes(a);
    };

    let customer;
    if (id && !id.startsWith('cli-')) {
      if (data.email) {
        const conflict = await prisma.customer.findFirst({
          where: { email: { equals: data.email, mode: 'insensitive' }, NOT: { id } },
        });
        if (conflict) {
          // No sobrescribir otro cliente distinto; preservar el correo del titular original
          data.email = null;
        }
      }

      customer = await prisma.customer.update({
        where: { id },
        include: tierInclude,
        data,
      });
    } else {
      // Priorizar coincidencia por correo electrónico real (no genérico) solo si pertenece a la misma persona
      let existing = null;
      if (data.email && !isGenericPlaceholderEmail(data.email)) {
        const byEmail = await prisma.customer.findFirst({
          where: { email: { equals: data.email, mode: 'insensitive' } },
          include: tierInclude,
        });
        if (byEmail) {
          if (namesReferToSameCustomer(byEmail.name, data.name)) {
            existing = byEmail;
          } else {
            // El correo ya pertenece a otra persona distinta: no sobrescribir a esa persona
            data.email = null;
          }
        }
      }

      // Por documento o teléfono solo reutilizar si no son valores genéricos (123456789 / 00000000) y el nombre coincide
      if (!existing && data.documentNum && !isGenericPlaceholderDocument(data.documentNum)) {
        const byDoc = await prisma.customer.findFirst({
          where: { documentNum: data.documentNum },
          include: tierInclude,
        });
        if (byDoc && namesReferToSameCustomer(byDoc.name, data.name)) {
          existing = byDoc;
        }
      }

      if (!existing && data.phone && !isGenericPlaceholderPhone(data.phone)) {
        const byPhone = await prisma.customer.findFirst({
          where: { phone: data.phone },
          include: tierInclude,
        });
        if (byPhone && namesReferToSameCustomer(byPhone.name, data.name)) {
          existing = byPhone;
        }
      }

      if (existing) {
        customer = await prisma.customer.update({
          where: { id: existing.id },
          include: tierInclude,
          data,
        });
      } else {
        customer = await prisma.customer.create({
          data,
          include: tierInclude,
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
