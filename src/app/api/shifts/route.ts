import { NextResponse } from 'next/server';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');
    const cookieHeader = request.headers.get('cookie') || '';
    const staffCookieMatch = cookieHeader.match(/kodelocal_staff_token=([^;]+)/);
    const staffCookieToken = staffCookieMatch ? staffCookieMatch[1] : null;

    let isStaff = verifyStaffInternalToken(staffHeaderToken) || 
                  verifyStaffInternalToken(bearerToken) || 
                  verifyStaffInternalToken(staffCookieToken);

    if (!isStaff) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Se requiere autenticacion de administrador.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const history = searchParams.get('history') === 'true';

    if (history) {
      const pastShifts = await prisma.cashShift.findMany({
        include: {
          sales: true,
          movements: true,
        },
        orderBy: { openedAt: 'desc' },
        take: 30,
      });
      return NextResponse.json({ success: true, shifts: pastShifts });
    }

    // Buscar turno activo actual
    const activeShift = await prisma.cashShift.findFirst({
      where: { status: 'OPEN' },
      include: {
        sales: {
          include: {
            payments: true,
          },
        },
        movements: true,
      },
      orderBy: { openedAt: 'desc' },
    });

    // Obtener todos los movimientos de caja registrados hoy en horario de El Salvador (UTC-6)
    const nowSv = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const svDateStr = nowSv.toISOString().split('T')[0];
    const startOfTodaySv = new Date(`${svDateStr}T00:00:00-06:00`);
    const allTodayRecords = await prisma.cashMovement.findMany({
      where: {
        createdAt: { gte: startOfTodaySv },
      },
      orderBy: { createdAt: 'desc' },
    });

    const todayMovements = allTodayRecords.filter((m) => m.type !== 'CONTEO');
    const todayCashCountRecord = allTodayRecords.find((m) => m.type === 'CONTEO') || null;
    let todayCashCount = null;
    if (todayCashCountRecord) {
      let counts: Record<string, string> = {};
      try {
        counts = JSON.parse(todayCashCountRecord.reason || '{}');
      } catch {}
      todayCashCount = {
        id: todayCashCountRecord.id,
        total: Number(todayCashCountRecord.amount || 0),
        counts,
        performedBy: todayCashCountRecord.performedBy,
        updatedAt: todayCashCountRecord.createdAt,
      };
    }

    return NextResponse.json({ success: true, shift: activeShift, todayMovements, todayCashCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');
    const cookieHeader = request.headers.get('cookie') || '';
    const staffCookieMatch = cookieHeader.match(/kodelocal_staff_token=([^;]+)/);
    const staffCookieToken = staffCookieMatch ? staffCookieMatch[1] : null;

    let isStaff = verifyStaffInternalToken(staffHeaderToken) || 
                  verifyStaffInternalToken(bearerToken) || 
                  verifyStaffInternalToken(staffCookieToken);

    if (!isStaff) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Se requiere autenticacion de administrador.' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // ================= 1. APERTURA DE CAJA =================
    if (action === 'open') {
      const { cashierName, initialAmount } = body;

      // Verificar si ya hay un turno abierto
      const existing = await prisma.cashShift.findFirst({
        where: { status: 'OPEN' },
      });

      if (existing) {
        return NextResponse.json({
          success: false,
          error: `Ya existe un turno de caja abierto por ${existing.cashierName}. Debes cerrarlo antes de abrir uno nuevo.`,
          activeShift: existing,
        }, { status: 400 });
      }

      const newShift = await prisma.cashShift.create({
        data: {
          cashierName: cashierName || 'Cajero Principal',
          initialAmount: Number(initialAmount || 0),
          status: 'OPEN',
        },
      });

      return NextResponse.json({ success: true, shift: newShift });
    }

    // ================= 2. CIERRE Y CUADRE DE CAJA (CORTE Z) =================
    if (action === 'close') {
      const { shiftId, finalAmount, notes } = body;

      const shift = await prisma.cashShift.findUnique({
        where: { id: shiftId },
        include: {
          sales: {
            include: {
              payments: true,
            },
          },
          movements: true,
        },
      });

      if (!shift) {
        return NextResponse.json({ success: false, error: 'Turno no encontrado' }, { status: 404 });
      }

      // Calcular totales por método de pago a partir de las ventas del turno
      let totalSales = 0;
      let totalCash = 0;
      let totalCard = 0;
      let totalTransfer = 0;
      let totalBitcoin = 0;

      shift.sales.forEach((s) => {
        const val = Number(s.total || 0);
        totalSales += val;

        if (s.paymentMethod === 'CASH') totalCash += val;
        else if (s.paymentMethod === 'CARD') totalCard += val;
        else if (s.paymentMethod === 'TRANSFER') totalTransfer += val;
        else if (s.paymentMethod === 'BITCOIN') totalBitcoin += val;
      });

      // Movimientos de caja chica (ingresos / egresos menores)
      let totalIngresosCaja = 0;
      let totalEgresosCaja = 0;
      shift.movements.forEach((m) => {
        const amt = Number(m.amount || 0);
        if (m.type === 'INGRESO') totalIngresosCaja += amt;
        if (m.type === 'EGRESO') totalEgresosCaja += amt;
      });

      const initial = Number(shift.initialAmount || 0);
      // Dinero en efectivo que DEBE haber físicamente en el cajón
      const expectedCashInDrawer = initial + totalCash + totalIngresosCaja - totalEgresosCaja;
      const physicalCashCounted = Number(finalAmount || 0);
      // Diferencia: Positivo = Sobrante, Negativo = Faltante
      const difference = physicalCashCounted - expectedCashInDrawer;

      const closedShift = await prisma.cashShift.update({
        where: { id: shift.id },
        data: {
          closedAt: new Date(),
          status: 'CLOSED',
          finalAmount: physicalCashCounted,
          expectedAmount: expectedCashInDrawer,
          difference,
          totalSales,
          totalCash,
          totalCard,
          totalTransfer,
          totalBitcoin,
          notes: notes || null,
        },
      });

      return NextResponse.json({
        success: true,
        shift: closedShift,
        cuadre: {
          fondoInicial: initial,
          ventasEfectivo: totalCash,
          ventasTarjeta: totalCard,
          ventasTransferencia: totalTransfer,
          ventasBitcoin: totalBitcoin,
          ingresosCajaChica: totalIngresosCaja,
          egresosCajaChica: totalEgresosCaja,
          efectivoEsperado: expectedCashInDrawer,
          efectivoContado: physicalCashCounted,
          diferencia: difference,
          estadoCuadre: difference === 0 ? 'EXACTO' : difference > 0 ? 'SOBRANTE' : 'FALTANTE',
        },
      });
    }

    // ================= 3. REGISTRO DE MOVIMIENTO DE CAJA CHICA =================
    if (action === 'movement') {
      const { shiftId, type, amount, reason, performedBy, authorizedBy } = body;

      if (!amount || Number(amount) <= 0) {
        return NextResponse.json({ success: false, error: 'Ingresa un monto válido mayor a 0' }, { status: 400 });
      }

      let resolvedShiftId = shiftId;
      if (!resolvedShiftId) {
        let activeShift = await prisma.cashShift.findFirst({
          where: { status: 'OPEN' },
          orderBy: { openedAt: 'desc' },
        });
        if (!activeShift) {
          activeShift = await prisma.cashShift.create({
            data: {
              cashierName: performedBy || 'Caja Principal',
              initialAmount: 0,
              status: 'OPEN',
            },
          });
        }
        resolvedShiftId = activeShift.id;
      }

      const finalReason = reason
        ? authorizedBy
          ? `${reason} (Autoriza: ${authorizedBy})`
          : reason
        : authorizedBy
        ? `Autoriza: ${authorizedBy}`
        : type === 'INGRESO'
        ? 'Abono a caja'
        : 'Retiro de caja';

      const movement = await prisma.cashMovement.create({
        data: {
          shiftId: resolvedShiftId,
          type: type || 'RETIRO',
          amount: Number(amount),
          reason: finalReason,
          performedBy: performedBy || 'Cajero',
        },
      });

      return NextResponse.json({ success: true, movement });
    }

    // ================= 4. GUARDAR CONTEO DE EFECTIVO EN CAJA =================
    if (action === 'cash_count') {
      const { counts, total, performedBy } = body;

      let activeShift = await prisma.cashShift.findFirst({
        where: { status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
      });
      if (!activeShift) {
        activeShift = await prisma.cashShift.create({
          data: {
            cashierName: performedBy || 'Caja Principal',
            initialAmount: 0,
            status: 'OPEN',
          },
        });
      }

      const nowSv = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const svDateStr = nowSv.toISOString().split('T')[0];
      const startOfTodaySv = new Date(`${svDateStr}T00:00:00-06:00`);

      const existingCount = await prisma.cashMovement.findFirst({
        where: {
          type: 'CONTEO',
          createdAt: { gte: startOfTodaySv },
        },
        orderBy: { createdAt: 'desc' },
      });

      const serializedCounts = JSON.stringify(counts || {});
      const numericTotal = Number(total || 0);

      const savedRecord = existingCount
        ? await prisma.cashMovement.update({
            where: { id: existingCount.id },
            data: {
              amount: numericTotal,
              reason: serializedCounts,
              performedBy: performedBy || 'Caja Principal',
              createdAt: new Date(),
            },
          })
        : await prisma.cashMovement.create({
            data: {
              shiftId: activeShift.id,
              type: 'CONTEO',
              amount: numericTotal,
              reason: serializedCounts,
              performedBy: performedBy || 'Caja Principal',
            },
          });

      return NextResponse.json({
        success: true,
        todayCashCount: {
          id: savedRecord.id,
          total: Number(savedRecord.amount || 0),
          counts: counts || {},
          performedBy: savedRecord.performedBy,
          updatedAt: savedRecord.createdAt,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error procesando turno de caja:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
