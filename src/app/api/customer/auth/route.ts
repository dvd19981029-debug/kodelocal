import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  const salt = 'aromaniak_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

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

      return NextResponse.json({
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          department: customer.department || 'San Salvador',
          municipality: customer.municipality || 'San Salvador Centro',
          address: customer.address || '',
          avatarUrl: customer.avatarUrl || '',
          authProvider: 'google',
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

      const normalizedEmail = email.toLowerCase().trim();

      // Verificar si ya existe
      const existing = await prisma.customer.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una cuenta con este correo electrónico. Por favor inicia sesión.' },
          { status: 409 }
        );
      }

      const passwordHash = hashPassword(password);
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

      const customer = await prisma.customer.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          avatarUrl,
          phone: phone?.trim() || '',
          department: department?.trim() || 'San Salvador',
          municipality: municipality?.trim() || 'San Salvador Centro',
          address: address?.trim() || '',
          documentType: 'DUI',
        },
      });

      return NextResponse.json({
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          department: customer.department || 'San Salvador',
          municipality: customer.municipality || 'San Salvador',
          address: customer.address || '',
          avatarUrl: customer.avatarUrl,
          authProvider: 'credentials',
        },
      });
    }

    // ================= 3. INICIO DE SESIÓN CON CORREO Y CONTRASEÑA =================
    if (action === 'login') {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Ingresa tu correo y contraseña' },
          { status: 400 }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();
      const customer = await prisma.customer.findUnique({
        where: { email: normalizedEmail },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'No encontramos ninguna cuenta con este correo electrónico.' },
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

      return NextResponse.json({
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          department: customer.department || 'San Salvador',
          municipality: customer.municipality || 'San Salvador',
          address: customer.address || '',
          avatarUrl: customer.avatarUrl || '',
          authProvider: 'credentials',
        },
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
