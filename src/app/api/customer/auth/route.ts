import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCustomerToken, verifyCustomerToken, hashPasswordSecure, verifyPasswordSecure } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeDocument } from '@/lib/sanitize';
import { supabase } from '@/lib/supabaseClient';
import { resolveGiroMH, formatGiroOption } from '@/lib/svGirosCat019';

export const dynamic = 'force-dynamic';

function formatAuthCustomerResponse(customer: any, authProvider: 'google' | 'credentials', sessionToken: string) {
  const resolvedGiro = resolveGiroMH(customer.activityDesc, customer.activityCode);
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone || '',
    documentType: customer.documentType || (customer.nrc ? 'NIT' : 'DUI'),
    documentNum: customer.documentNum || '',
    department: customer.department || 'San Salvador',
    municipality: customer.municipality || 'San Salvador Centro',
    address: customer.address || '',
    nrc: customer.nrc || '',
    businessName: customer.businessName || customer.tradeName || '',
    activityCode: resolvedGiro?.code || customer.activityCode || '',
    activityDesc: resolvedGiro ? formatGiroOption(resolvedGiro) : (customer.activityDesc || ''),
    avatarUrl: customer.avatarUrl || '',
    authProvider,
    tierId: customer.tierId || null,
    tier: customer.tier || null,
    customDiscountPct: customer.customDiscountPct || null,
    specialEssencePrice: customer.specialEssencePrice ? Number(customer.specialEssencePrice) : null,
    specialBottlePrice: customer.specialBottlePrice ? Number(customer.specialBottlePrice) : null,
    tradeName: customer.tradeName || customer.businessName || '',
    taxCategory: customer.taxCategory || 'OTRO',
    preferredDoc: customer.preferredDoc || (customer.nrc ? '03' : '01'),
    sessionToken,
  };
}

async function linkCustomerPurchases(customer: any) {
  if (!customer?.id) return;
  try {
    const cleanEmail = customer.email?.trim()?.toLowerCase();
    const cleanDoc = customer.documentNum?.trim();

    if (cleanEmail) {
      await prisma.ecommerceOrder.updateMany({
        where: {
          customerId: null,
          customerEmail: { equals: cleanEmail, mode: 'insensitive' },
        },
        data: { customerId: customer.id },
      });

      await prisma.sale.updateMany({
        where: {
          customerId: null,
          OR: [
            { notes: { contains: cleanEmail, mode: 'insensitive' } },
            { dteDocument: { requestJson: { contains: cleanEmail, mode: 'insensitive' } } },
          ],
        },
        data: { customerId: customer.id },
      });
    }

    if (cleanDoc && cleanDoc !== '00000000-0') {
      await prisma.sale.updateMany({
        where: {
          customerId: null,
          OR: [
            { notes: { contains: cleanDoc } },
            { dteDocument: { requestJson: { contains: cleanDoc } } },
          ],
        },
        data: { customerId: customer.id },
      });
    }
  } catch (err) {
    console.error('Error linking customer purchases:', err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // ================= RATE LIMITING (SEC-05 / REQ-SEC-01) =================
    if (action === 'login' || action === 'register' || action === 'google' || action === 'get_token') {
      const rl = await checkRateLimit(request, {
        keyPrefix: 'customer_auth',
        maxRequests: action === 'get_token' ? 20 : 8,
        windowMs: 60 * 1000,
      });
      if (!rl.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Demasiados intentos. Por favor espera ${rl.resetSeconds} segundos antes de reintentar.`,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(rl.resetSeconds) },
          }
        );
      }
    }

    // ================= 1. REGISTRO / LOGIN CON GOOGLE =================
    if (action === 'google') {
      const { name, avatarUrl, accessToken } = body;
      const authHeader = request.headers.get('authorization');
      const tokenToVerify = accessToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null);

      if (!tokenToVerify) {
        return NextResponse.json(
          { success: false, error: 'Token de autenticación de Google requerido' },
          { status: 401 }
        );
      }

      // Verificar criptográficamente el access_token contra Supabase Auth
      const { data: userData, error: authErr } = await supabase.auth.getUser(tokenToVerify);
      if (authErr || !userData?.user?.email) {
        return NextResponse.json(
          { success: false, error: 'Sesión de Google inválida o expirada' },
          { status: 401 }
        );
      }

      const normalizedEmail = userData.user.email.toLowerCase().trim();
      const verifiedGoogleId = userData.user.id;
      const verifiedName =
        userData.user.user_metadata?.full_name ||
        userData.user.user_metadata?.name ||
        name ||
        'Cliente Aromaniak';
      const verifiedAvatar =
        userData.user.user_metadata?.avatar_url ||
        userData.user.user_metadata?.picture ||
        avatarUrl ||
        '';

      // Buscar si el cliente ya existe por email (case-insensitive) o googleId
      let customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: { equals: normalizedEmail, mode: 'insensitive' } },
            ...(verifiedGoogleId ? [{ googleId: verifiedGoogleId }] : []),
          ],
        },
        include: { tier: true },
      });

      if (customer) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          include: { tier: true },
          data: {
            email: customer.email || normalizedEmail,
            googleId: verifiedGoogleId || customer.googleId,
            avatarUrl: verifiedAvatar || customer.avatarUrl,
            name: customer.name || verifiedName,
          },
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            name: verifiedName,
            email: normalizedEmail,
            googleId: verifiedGoogleId || `google_${Date.now()}`,
            avatarUrl: verifiedAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(verifiedName)}`,
            department: 'San Salvador',
            municipality: 'San Salvador Centro',
            documentType: 'DUI',
          },
          include: { tier: true },
        });
      }

      await linkCustomerPurchases(customer);

      const sessionToken = createCustomerToken(customer.id, customer.email || '');

      return NextResponse.json({
        success: true,
        sessionToken,
        customer: formatAuthCustomerResponse(customer, 'google', sessionToken),
      });
    }

    // ================= 2. REGISTRO TRADICIONAL CON FORMULARIO =================
    if (action === 'register') {
      const {
        name,
        email,
        password,
        phone,
        department,
        municipality,
        address,
        documentType,
        documentNum,
        nrc,
        businessName,
        activityCode,
        activityDesc,
        preferredDoc,
        isCreditFiscal,
      } = body;

      if (!name || !email || !password) {
        return NextResponse.json(
          { success: false, error: 'Nombre, correo y contraseña son obligatorios' },
          { status: 400 }
        );
      }

      const cleanEmail = sanitizeEmail(email);
      if (!cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'Formato de correo electrónico no válido' },
          { status: 400 }
        );
      }
      const cleanName = sanitizeText(name, 100);
      if (!cleanName) {
        return NextResponse.json(
          { success: false, error: 'Nombre es requerido' },
          { status: 400 }
        );
      }

      const cleanNrc = sanitizeDocument(nrc, 30) || null;
      const cleanDocNum = sanitizeDocument(documentNum, 30) || null;
      const cleanBusinessName = sanitizeText(businessName, 120) || null;
      const resolvedGiro = resolveGiroMH(activityDesc, activityCode);
      const cleanActCode = resolvedGiro?.code || sanitizeText(activityCode, 20) || null;
      const cleanActDesc = resolvedGiro
        ? formatGiroOption(resolvedGiro)
        : (sanitizeText(activityDesc, 200) || null);
      const wantsCCF = Boolean(isCreditFiscal || cleanNrc || preferredDoc === '03');
      const resolvedDocType = wantsCCF ? 'NIT' : (sanitizeText(documentType, 20) || 'DUI');
      const resolvedPrefDoc = wantsCCF ? '03' : (sanitizeText(preferredDoc, 10) || '01');

      // Verificar si ya existe por correo (case-insensitive) o por DUI/NIT si fue creado en tienda sin correo
      let existing = await prisma.customer.findFirst({
        where: { email: { equals: cleanEmail, mode: 'insensitive' } },
        include: { tier: true },
      });

      if (!existing && cleanDocNum && cleanDocNum !== '00000000-0') {
        const byDoc = await prisma.customer.findFirst({
          where: {
            documentNum: cleanDocNum,
            email: null,
            passwordHash: null,
            googleId: null,
          },
          include: { tier: true },
        });
        if (byDoc) existing = byDoc;
      }

      const passwordHash = hashPasswordSecure(String(password));
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`;

      if (existing) {
        if (existing.passwordHash || existing.googleId) {
          return NextResponse.json(
            { success: false, error: 'Ya existe una cuenta con este correo electrónico. Por favor inicia sesión.' },
            { status: 409 }
          );
        } else {
          // El cliente fue creado desde el POS o en pedido previo (sin contraseña). Asociamos su contraseña y datos fiscales a su mismo registro.
          const updatedCustomer = await prisma.customer.update({
            where: { id: existing.id },
            include: { tier: true },
            data: {
              email: cleanEmail,
              name: cleanName || existing.name,
              passwordHash,
              avatarUrl: existing.avatarUrl || avatarUrl,
              phone: sanitizePhone(phone) || existing.phone || '',
              department: sanitizeText(department, 50) || existing.department || 'San Salvador',
              municipality: sanitizeText(municipality, 60) || existing.municipality || 'San Salvador Centro',
              address: sanitizeText(address, 255) || existing.address || '',
              documentType: cleanDocNum ? resolvedDocType : (existing.documentType || resolvedDocType),
              documentNum: cleanDocNum || existing.documentNum || '',
              nrc: cleanNrc || existing.nrc || null,
              businessName: cleanBusinessName || existing.businessName || (wantsCCF ? cleanName : null),
              tradeName: cleanBusinessName || existing.tradeName || null,
              activityCode: cleanActCode || existing.activityCode || null,
              activityDesc: cleanActDesc || existing.activityDesc || null,
              preferredDoc: wantsCCF ? '03' : (existing.preferredDoc || resolvedPrefDoc),
            }
          });

          await linkCustomerPurchases(updatedCustomer);
          
          const sessionToken = createCustomerToken(updatedCustomer.id, updatedCustomer.email || '');
          
          return NextResponse.json({
            success: true,
            sessionToken,
            customer: formatAuthCustomerResponse(updatedCustomer, 'credentials', sessionToken),
          });
        }
      }

      const customer = await prisma.customer.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          passwordHash,
          avatarUrl,
          phone: sanitizePhone(phone) || '',
          department: sanitizeText(department, 50) || 'San Salvador',
          municipality: sanitizeText(municipality, 60) || 'San Salvador Centro',
          address: sanitizeText(address, 255) || '',
          documentType: resolvedDocType,
          documentNum: cleanDocNum || '',
          nrc: cleanNrc,
          businessName: cleanBusinessName || (wantsCCF ? cleanName : null),
          tradeName: cleanBusinessName,
          activityCode: cleanActCode,
          activityDesc: cleanActDesc,
          preferredDoc: resolvedPrefDoc,
        },
        include: { tier: true },
      });

      await linkCustomerPurchases(customer);

      const sessionToken = createCustomerToken(customer.id, customer.email || '');

      return NextResponse.json({
        success: true,
        sessionToken,
        customer: formatAuthCustomerResponse(customer, 'credentials', sessionToken),
      });
    }

    // ================= 3. INICIO DE SESIÓN CON CORREO Y CONTRASEÑA =================
    if (action === 'login') {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Correo y contraseña requeridos' },
          { status: 400 }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();

      const customer = await prisma.customer.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        include: { tier: true },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'No existe una cuenta registrada con este correo' },
          { status: 404 }
        );
      }

      if (customer.passwordHash) {
        const check = verifyPasswordSecure(String(password), customer.passwordHash);
        if (!check.valid) {
          return NextResponse.json(
            { success: false, error: 'Contraseña incorrecta. Verifica tus datos.' },
            { status: 401 }
          );
        }
        if (check.needsRehash) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { passwordHash: hashPasswordSecure(String(password)) },
          }).catch(() => {});
        }
      } else if (customer.googleId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Esta cuenta fue creada con Google. Por favor haz clic en "Continuar con Google".' 
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Tu cuenta fue registrada en tienda física. Crea tu contraseña en la pestaña "Crear Cuenta" usando este mismo correo.',
          },
          { status: 400 }
        );
      }

      await linkCustomerPurchases(customer);

      const sessionToken = createCustomerToken(customer.id, customer.email || '');

      return NextResponse.json({
        success: true,
        sessionToken,
        customer: formatAuthCustomerResponse(customer, 'credentials', sessionToken),
      });
    }

    // ================= 4. ACTUALIZAR PERFIL / FACTURACIÓN =================
    if (action === 'update_profile') {
      const { 
        customerId, 
        name, 
        phone, 
        documentType, 
        documentNum, 
        department, 
        municipality, 
        address,
        nrc,
        businessName,
        activityCode,
        activityDesc,
        preferredDoc,
      } = body;

      if (!customerId) {
        return NextResponse.json(
          { success: false, error: 'ID de cliente requerido' },
          { status: 400 }
        );
      }

      // Proteger contra IDOR: validar que quien edita sea el titular del token
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (body.sessionToken || null);
      const verified = verifyCustomerToken(token);

      if (!verified || verified.customerId !== customerId) {
        return NextResponse.json(
          { success: false, error: 'No autorizado: se requiere sesión activa del titular de la cuenta.' },
          { status: 403 }
        );
      }

      const resolvedGiro = (activityDesc !== undefined || activityCode !== undefined)
        ? resolveGiroMH(activityDesc, activityCode)
        : null;
      const cleanNrcVal = nrc !== undefined ? (sanitizeDocument(nrc, 30) || '') : undefined;
      const cleanBizVal = businessName !== undefined ? sanitizeText(businessName, 120) : undefined;

      const updated = await prisma.customer.update({
        where: { id: customerId },
        include: { tier: true },
        data: {
          ...(name !== undefined ? { name: sanitizeText(name, 100) } : {}),
          ...(phone !== undefined ? { phone: sanitizePhone(phone) || '' } : {}),
          ...(documentType !== undefined ? { documentType: sanitizeText(documentType, 20) } : {}),
          ...(documentNum !== undefined ? { documentNum: sanitizeDocument(documentNum, 30) || '' } : {}),
          ...(department !== undefined ? { department: sanitizeText(department, 50) } : {}),
          ...(municipality !== undefined ? { municipality: sanitizeText(municipality, 60) } : {}),
          ...(address !== undefined ? { address: sanitizeText(address, 255) } : {}),
          ...(cleanNrcVal !== undefined ? { nrc: cleanNrcVal || null } : {}),
          ...(cleanBizVal !== undefined ? { businessName: cleanBizVal || null, tradeName: cleanBizVal || null } : {}),
          ...(activityDesc !== undefined || activityCode !== undefined
            ? {
                activityCode: resolvedGiro?.code || (activityCode ? sanitizeText(activityCode, 20) : null),
                activityDesc: resolvedGiro ? formatGiroOption(resolvedGiro) : (activityDesc ? sanitizeText(activityDesc, 200) : null),
              }
            : {}),
          ...(preferredDoc !== undefined
            ? { preferredDoc: sanitizeText(preferredDoc, 10) }
            : cleanNrcVal !== undefined
            ? { preferredDoc: cleanNrcVal ? '03' : '01' }
            : {}),
        },
      });

      await linkCustomerPurchases(updated);

      const sessionToken = createCustomerToken(updated.id, updated.email || '');

      return NextResponse.json({
        success: true,
        sessionToken,
        customer: formatAuthCustomerResponse(updated, updated.googleId ? 'google' : 'credentials', sessionToken),
      });
    }

    // ================= 5. REFRESCAR / OBTENER TOKEN DE SESIÓN =================
    if (action === 'get_token') {
      const { customerId, email } = body;
      if (!customerId || !email) {
        return NextResponse.json({ success: false, error: 'Datos insuficientes' }, { status: 400 });
      }

      // SEC-CRITICAL: Exigir un sessionToken válido perteneciente al propio cliente para refrescar su sesión
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : (body.sessionToken || null);
      const verified = verifyCustomerToken(token);

      if (!verified || verified.customerId !== customerId) {
        return NextResponse.json(
          { success: false, error: 'Sesión inválida o expirada. Por favor inicia sesión nuevamente.' },
          { status: 401 }
        );
      }

      const existing = await prisma.customer.findFirst({
        where: { id: customerId },
        include: { tier: true },
      });

      if (!existing) {
        return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
      }

      await linkCustomerPurchases(existing);

      const sessionToken = createCustomerToken(existing.id, existing.email || '');
      return NextResponse.json({
        success: true,
        sessionToken,
        customer: formatAuthCustomerResponse(existing, existing.googleId ? 'google' : 'credentials', sessionToken),
      });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Customer Auth Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error en el servidor de autenticación' },
      { status: 500 }
    );
  }
}
