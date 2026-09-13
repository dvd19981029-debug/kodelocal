import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { createCustomerToken, verifyCustomerToken } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeDocument } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  const salt = 'aromaniak_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // ================= RATE LIMITING (SEC-05) =================
    if (action === 'login' || action === 'register' || action === 'google') {
      const rl = checkRateLimit(request, {
        keyPrefix: 'customer_auth',
        maxRequests: 10,
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
      const { email, name, avatarUrl, googleId } = body;

      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Correo de Google no proporcionado' },
          { status: 400 }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Buscar si el cliente ya existe por email o googleId
      let customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            ...(googleId ? [{ googleId }] : []),
          ],
        },
      });

      if (customer) {
        // Actualizar información de Google si hiciera falta
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            googleId: googleId || customer.googleId,
            avatarUrl: avatarUrl || customer.avatarUrl,
            name: customer.name || name || 'Cliente Aromaniak',
          },
        });
      } else {
        // Crear nuevo cliente registrado con Google
        customer = await prisma.customer.create({
          data: {
            name: name || 'Cliente Aromaniak',
            email: normalizedEmail,
            googleId: googleId || `google_${Date.now()}`,
            avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Cliente')}`,
            department: 'San Salvador',
            municipality: 'San Salvador',
            documentType: 'DUI',
          },
        });
      }

      const sessionToken = createCustomerToken(customer.id, customer.email || '');

      return NextResponse.json({
        success: true,
        sessionToken,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          documentType: customer.documentType || 'DUI',
          documentNum: customer.documentNum || '',
          department: customer.department || 'San Salvador',
          municipality: customer.municipality || 'San Salvador Centro',
          address: customer.address || '',
          nrc: customer.nrc || '',
          businessName: customer.businessName || '',
          activityDesc: customer.activityDesc || '',
          avatarUrl: customer.avatarUrl || '',
          authProvider: 'google',
          sessionToken,
        },
      });
    }

    // ================= 2. REGISTRO TRADICIONAL CON FORMULARIO =================
    if (action === 'register') {
      const { name, email, password, phone, department, municipality, address } = body;

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

      // Verificar si ya existe
      const existing = await prisma.customer.findUnique({
        where: { email: cleanEmail },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una cuenta con este correo electrónico. Por favor inicia sesión.' },
          { status: 409 }
        );
      }

      const passwordHash = hashPassword(password);
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`;

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
          documentType: 'DUI',
        },
      });

      const sessionToken = createCustomerToken(customer.id, customer.email || '');

      return NextResponse.json({
        success: true,
        sessionToken,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          documentType: customer.documentType || 'DUI',
          documentNum: customer.documentNum || '',
          department: customer.department || 'San Salvador',
          municipality: customer.municipality || 'San Salvador',
          address: customer.address || '',
          nrc: customer.nrc || '',
          businessName: customer.businessName || '',
          activityDesc: customer.activityDesc || '',
          avatarUrl: customer.avatarUrl,
          authProvider: 'credentials',
          sessionToken,
        },
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

      const customer = await prisma.customer.findUnique({
        where: { email: normalizedEmail },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'No existe una cuenta registrada con este correo' },
          { status: 404 }
        );
      }

      if (customer.passwordHash) {
        const hash = hashPassword(password);
        if (hash !== customer.passwordHash) {
          return NextResponse.json(
            { success: false, error: 'Contraseña incorrecta. Verifica tus datos.' },
            { status: 401 }
          );
        }
      } else if (customer.googleId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Esta cuenta fue creada con Google. Por favor haz clic en "Continuar con Google".' 
          },
          { status: 400 }
        );
      }

      const sessionToken = createCustomerToken(customer.id, customer.email || '');

      return NextResponse.json({
        success: true,
        sessionToken,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          documentType: customer.documentType || 'DUI',
          documentNum: customer.documentNum || '',
          department: customer.department || 'San Salvador',
          municipality: customer.municipality || 'San Salvador',
          address: customer.address || '',
          nrc: customer.nrc || '',
          businessName: customer.businessName || '',
          activityDesc: customer.activityDesc || '',
          avatarUrl: customer.avatarUrl || '',
          authProvider: 'credentials',
          sessionToken,
        },
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
        activityDesc 
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

      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: {
          ...(name !== undefined ? { name: sanitizeText(name, 100) } : {}),
          ...(phone !== undefined ? { phone: sanitizePhone(phone) || '' } : {}),
          ...(documentType !== undefined ? { documentType: sanitizeText(documentType, 20) } : {}),
          ...(documentNum !== undefined ? { documentNum: sanitizeDocument(documentNum, 30) || '' } : {}),
          ...(department !== undefined ? { department: sanitizeText(department, 50) } : {}),
          ...(municipality !== undefined ? { municipality: sanitizeText(municipality, 60) } : {}),
          ...(address !== undefined ? { address: sanitizeText(address, 255) } : {}),
          ...(nrc !== undefined ? { nrc: sanitizeDocument(nrc, 30) || '' } : {}),
          ...(businessName !== undefined ? { businessName: sanitizeText(businessName, 120) } : {}),
          ...(activityDesc !== undefined ? { activityDesc: sanitizeText(activityDesc, 200) } : {}),
        },
      });

      const sessionToken = createCustomerToken(updated.id, updated.email || '');

      return NextResponse.json({
        success: true,
        sessionToken,
        customer: {
          id: updated.id,
          name: updated.name,
          email: updated.email || '',
          phone: updated.phone || '',
          documentType: updated.documentType || 'DUI',
          documentNum: updated.documentNum || '',
          department: updated.department || 'San Salvador',
          municipality: updated.municipality || 'San Salvador Centro',
          address: updated.address || '',
          nrc: updated.nrc || '',
          businessName: updated.businessName || '',
          activityDesc: updated.activityDesc || '',
          avatarUrl: updated.avatarUrl || '',
          authProvider: updated.googleId ? 'google' : 'credentials',
          sessionToken,
        },
      });
    }

    // ================= 5. REFRESCAR / OBTENER TOKEN DE SESIÓN =================
    if (action === 'get_token') {
      const { customerId, email } = body;
      if (!customerId || !email) {
        return NextResponse.json({ success: false, error: 'Datos insuficientes' }, { status: 400 });
      }

      const existing = await prisma.customer.findFirst({
        where: { id: customerId, email: email.toLowerCase().trim() },
      });

      if (!existing) {
        return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
      }

      const sessionToken = createCustomerToken(existing.id, existing.email || '');
      return NextResponse.json({ success: true, sessionToken });
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
