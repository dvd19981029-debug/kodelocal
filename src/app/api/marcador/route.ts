import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PLANILLA_CATEGORY = 'system_config';
const PLANILLA_TOPIC = 'payroll_planilla_sv_v1';
const KIOSK_TOPIC = 'marcador_kiosk_state_v1';
const QR_TTL_MS = 15000; // 15 segundos exactos

interface EnrolledDevice {
  empId: string;
  empName: string;
  deviceTokenHash: string;
  deviceLabel: string;
  userAgent: string;
  screen: string;
  enrolledAt: string;
}

interface ScanEventRecord {
  id: string;
  empId: string;
  empCode: string;
  empName: string;
  firstName: string;
  position: string;
  department: string;
  punchType: 'entrada' | 'salida_almuerzo' | 'entrada_almuerzo' | 'salida_turno';
  punchLabel: string;
  greetingTitle: string;
  timeStr: string; // HH:mm
  timeFullStr: string; // HH:mm:ss
  dateStr: string; // YYYY-MM-DD
  timestamp: number;
  deviceLabel: string;
}

interface KioskStateData {
  currentToken: string;
  tokenIssuedAt: number;
  tokenExpiresAt: number;
  previousToken?: string;
  previousTokenExpiresAt?: number;
  usedTokens: string[];
  enrollments: Record<string, EnrolledDevice>;
  lastScanEvent: ScanEventRecord | null;
  todayLogs: ScanEventRecord[];
}

const FALLBACK_EMPLOYEES = [
  {
    id: 'emp-1',
    code: '001',
    firstName: 'JORGE',
    fullName: 'Jorge Luis Fuentes Vasquez',
    position: 'Gerente',
    department: 'ADMINISTRACIÓN',
    docNumber: '05593529-2',
  },
  {
    id: 'emp-2',
    code: '002',
    firstName: 'ERIKA',
    fullName: 'Erika Maria Melgar Garcia',
    position: 'Recepción',
    department: 'VENTA',
    docNumber: '06616646-6',
  },
  {
    id: 'emp-3',
    code: '003',
    firstName: 'RODOLFO',
    fullName: 'Rodolfo Hector Guala',
    position: 'Bodega',
    department: 'BODEGA',
    docNumber: 'AAK778492',
  },
  {
    id: 'emp-4',
    code: '004',
    firstName: 'DAVID',
    fullName: 'David Antonio Mejia Ramirez',
    position: 'Marketing',
    department: 'MARKETING',
    docNumber: '05785262-8',
  },
  {
    id: 'emp-5',
    code: '005',
    firstName: 'LUIS',
    fullName: 'Luis Ernesto Gonzalez Martinez',
    position: 'Marketing',
    department: 'MARKETING',
    docNumber: '06694167-0',
  },
];

function getElSalvadorNow() {
  const now = new Date();
  const svFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = svFormatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  const hour = map.hour === '24' ? '00' : map.hour;
  const dateStr = `${map.year}-${map.month}-${map.day}`;
  const timeStr = `${hour}:${map.minute}`;
  const timeFullStr = `${hour}:${map.minute}:${map.second}`;
  return { dateStr, timeStr, timeFullStr, timestamp: now.getTime() };
}

function generateFreshToken(): string {
  return `KQR-${crypto.randomBytes(9).toString('base64url')}`;
}

function hashDeviceToken(rawToken: string): string {
  return crypto.createHash('sha256').update(String(rawToken || '')).digest('hex');
}

function formatNameCase(str: string): string {
  return String(str || '')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

async function loadPlanillaData(): Promise<{ recordId: string | null; data: any }> {
  const rec = await prisma.mirandaBusinessMemory.findFirst({
    where: {
      category: PLANILLA_CATEGORY,
      topic: PLANILLA_TOPIC,
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (rec?.instruction) {
    try {
      const parsed = JSON.parse(rec.instruction);
      if (parsed && typeof parsed === 'object') {
        return { recordId: rec.id, data: parsed };
      }
    } catch {}
  }

  return {
    recordId: rec?.id || null,
    data: {
      employees: FALLBACK_EMPLOYEES,
      punchRecords: {},
    },
  };
}

async function savePlanillaData(recordId: string | null, data: any) {
  const serialized = JSON.stringify(data);
  if (recordId) {
    await prisma.mirandaBusinessMemory.update({
      where: { id: recordId },
      data: { instruction: serialized },
    });
  } else {
    await prisma.mirandaBusinessMemory.create({
      data: {
        category: PLANILLA_CATEGORY,
        topic: PLANILLA_TOPIC,
        instruction: serialized,
      },
    });
  }
}

async function loadKioskState(): Promise<{
  recordId: string | null;
  isNewRecord: boolean;
  state: KioskStateData;
}> {
  const rec = await prisma.mirandaBusinessMemory.findFirst({
    where: {
      category: PLANILLA_CATEGORY,
      topic: KIOSK_TOPIC,
    },
    orderBy: { updatedAt: 'desc' },
  });

  const now = Date.now();
  const defaultState: KioskStateData = {
    currentToken: generateFreshToken(),
    tokenIssuedAt: now,
    tokenExpiresAt: now + QR_TTL_MS,
    usedTokens: [],
    enrollments: {},
    lastScanEvent: null,
    todayLogs: [],
  };

  if (rec?.instruction) {
    try {
      const parsed = JSON.parse(rec.instruction);
      if (parsed && typeof parsed === 'object' && parsed.currentToken) {
        return {
          recordId: rec.id,
          isNewRecord: false,
          state: {
            ...defaultState,
            ...parsed,
            usedTokens: Array.isArray(parsed.usedTokens) ? parsed.usedTokens.slice(-60) : [],
            enrollments: parsed.enrollments && typeof parsed.enrollments === 'object' ? parsed.enrollments : {},
            todayLogs: Array.isArray(parsed.todayLogs) ? parsed.todayLogs : [],
          },
        };
      }
    } catch {}
  }

  return { recordId: rec?.id || null, isNewRecord: true, state: defaultState };
}

async function saveKioskState(recordId: string | null, state: KioskStateData) {
  const serialized = JSON.stringify(state);
  if (recordId) {
    await prisma.mirandaBusinessMemory.update({
      where: { id: recordId },
      data: { instruction: serialized },
    });
  } else {
    await prisma.mirandaBusinessMemory.create({
      data: {
        category: PLANILLA_CATEGORY,
        topic: KIOSK_TOPIC,
        instruction: serialized,
      },
    });
  }
}

function rotateTokenIfNeeded(state: KioskStateData, forceRotate = false): boolean {
  const now = Date.now();
  if (
    forceRotate ||
    !state.currentToken ||
    now >= state.tokenExpiresAt ||
    state.usedTokens.includes(state.currentToken)
  ) {
    state.previousToken = state.currentToken;
    state.previousTokenExpiresAt = now + 4000; // 4s de tolerancia mientras viaja el request por red móvil
    state.currentToken = generateFreshToken();
    state.tokenIssuedAt = now;
    state.tokenExpiresAt = now + QR_TTL_MS;
    return true;
  }
  return false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceToken = searchParams.get('deviceToken') || '';
    const forceRotate = searchParams.get('rotate') === '1';

    const [{ recordId: kioskRecId, isNewRecord, state }, { data: planilla }] = await Promise.all([
      loadKioskState(),
      loadPlanillaData(),
    ]);

    const svNow = getElSalvadorNow();
    let dirty = isNewRecord || rotateTokenIfNeeded(state, forceRotate);

    // Filtrar logs solo del día actual en El Salvador
    const filteredLogs = (state.todayLogs || []).filter((l) => l.dateStr === svNow.dateStr);
    if (filteredLogs.length !== (state.todayLogs || []).length) {
      state.todayLogs = filteredLogs;
      dirty = true;
    }

    if (dirty) {
      await saveKioskState(kioskRecId, state);
    }

    const rawEmployees: any[] =
      Array.isArray(planilla.employees) && planilla.employees.length > 0
        ? planilla.employees
        : FALLBACK_EMPLOYEES;
    const punchRecords: Record<string, any> = planilla.punchRecords || {};

    const employeesSummary = rawEmployees.map((e) => {
      const enrollment = state.enrollments[e.id];
      const todayKey = `${e.id}_${svNow.dateStr}`;
      const todayPunch = punchRecords[todayKey] || {
        marcacionEntrada: '',
        marcacionSalidaAlmuerzo: '',
        marcacionEntradaAlmuerzo: '',
        marcacionSalidaTurno: '',
      };
      const cleanDoc = String(e.docNumber || '').replace(/[^a-zA-Z0-9]/g, '');
      return {
        id: e.id,
        code: e.code || '',
        firstName: formatNameCase(e.firstName || String(e.fullName || '').split(' ')[0]),
        fullName: e.fullName,
        position: e.position || '',
        department: e.department || '',
        docLast4Hint: cleanDoc.length >= 4 ? `***${cleanDoc.slice(-2)}` : '',
        isEnrolled: Boolean(enrollment),
        enrolledDeviceLabel: enrollment?.deviceLabel || null,
        enrolledAt: enrollment?.enrolledAt || null,
        todayPunch,
      };
    });

    // Verificar si el celular que consulta ya está enrolado
    let myEnrolledEmployee = null;
    if (deviceToken) {
      const hashed = hashDeviceToken(deviceToken);
      const matchEntry = Object.values(state.enrollments).find(
        (enr) => enr.deviceTokenHash === hashed
      );
      if (matchEntry) {
        myEnrolledEmployee =
          employeesSummary.find((emp) => emp.id === matchEntry.empId) || null;
      }
    }

    // Mostrar celebración en el monitor si ocurrió hace menos de 6.5 segundos
    const activeCelebration =
      state.lastScanEvent && Date.now() - state.lastScanEvent.timestamp < 6500
        ? state.lastScanEvent
        : null;

    return NextResponse.json({
      success: true,
      kiosk: {
        token: state.currentToken,
        tokenIssuedAt: state.tokenIssuedAt,
        tokenExpiresAt: state.tokenExpiresAt,
        ttlMs: QR_TTL_MS,
        remainingMs: Math.max(0, state.tokenExpiresAt - Date.now()),
        elSalvadorDate: svNow.dateStr,
        elSalvadorTime: svNow.timeFullStr,
        activeCelebration,
        todayLogs: state.todayLogs.slice(0, 20),
      },
      employees: employeesSummary,
      myEnrolledEmployee,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error cargando marcador' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action;

    const [{ recordId: kioskRecId, state }, { recordId: planillaRecId, data: planilla }] =
      await Promise.all([loadKioskState(), loadPlanillaData()]);

    const rawEmployees: any[] =
      Array.isArray(planilla.employees) && planilla.employees.length > 0
        ? planilla.employees
        : FALLBACK_EMPLOYEES;

    if (!planilla.punchRecords || typeof planilla.punchRecords !== 'object') {
      planilla.punchRecords = {};
    }

    const svNow = getElSalvadorNow();

    // 1. LIBERAR / RESETEAR DISPOSITIVO ENROLADO
    if (action === 'reset_device') {
      const { empId } = body;
      if (!empId || !state.enrollments[empId]) {
        return NextResponse.json(
          { success: false, error: 'El colaborador no tiene un dispositivo vinculado.' },
          { status: 400 }
        );
      }
      delete state.enrollments[empId];
      await saveKioskState(kioskRecId, state);
      return NextResponse.json({
        success: true,
        message: 'Dispositivo desvinculado correctamente. El colaborador ya puede enrolar su nuevo celular.',
      });
    }

    // 2. ENROLAR CELULAR DE UN COLABORADOR
    if (action === 'enroll') {
      const { empId, verifyCode, deviceToken, deviceLabel, userAgent, screen, qrToken, punchType } = body;
      if (!empId || !deviceToken) {
        return NextResponse.json(
          { success: false, error: 'Selecciona tu nombre para enrolar este teléfono.' },
          { status: 400 }
        );
      }

      const emp = rawEmployees.find((e) => e.id === empId);
      if (!emp) {
        return NextResponse.json(
          { success: false, error: 'Colaborador no encontrado en planilla.' },
          { status: 404 }
        );
      }

      // Verificar código de empleado o últimos 4 caracteres de su DUI/Pasaporte
      const cleanInput = String(verifyCode || '')
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      const cleanDoc = String(emp.docNumber || '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      const cleanCode = String(emp.code || '')
        .trim()
        .toUpperCase();

      const last4Doc = cleanDoc.slice(-4);
      const isValidVerify =
        cleanInput.length > 0 &&
        (cleanInput === last4Doc ||
          cleanInput === cleanDoc ||
          cleanInput === cleanCode ||
          cleanInput.padStart(3, '0') === cleanCode);

      if (!isValidVerify) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Verificación incorrecta. Ingresa los últimos 4 dígitos de tu DUI/Documento o tu código de empleado (ej. 001).',
          },
          { status: 403 }
        );
      }

      const hashedDevice = hashDeviceToken(deviceToken);
      const existingEnrollment = state.enrollments[emp.id];
      if (existingEnrollment && existingEnrollment.deviceTokenHash !== hashedDevice) {
        return NextResponse.json(
          {
            success: false,
            error: `${emp.fullName} ya tiene otro teléfono registrado (${existingEnrollment.deviceLabel}). Si cambiaste de celular, pide en Administración liberar tu dispositivo anterior.`,
          },
          { status: 409 }
        );
      }

      // Asegurar que un mismo teléfono no se enrole para dos empleados distintos
      for (const [otherEmpId, enr] of Object.entries(state.enrollments)) {
        if (enr.deviceTokenHash === hashedDevice && otherEmpId !== emp.id) {
          return NextResponse.json(
            {
              success: false,
              error: `Este teléfono ya está vinculado a ${enr.empName}. Cada colaborador debe escanear desde su propio celular.`,
            },
            { status: 409 }
          );
        }
      }

      state.enrollments[emp.id] = {
        empId: emp.id,
        empName: emp.fullName,
        deviceTokenHash: hashedDevice,
        deviceLabel: String(deviceLabel || 'Teléfono Móvil').slice(0, 80),
        userAgent: String(userAgent || '').slice(0, 180),
        screen: String(screen || '').slice(0, 30),
        enrolledAt: `${svNow.dateStr} ${svNow.timeStr}`,
      };

      // Si durante el enrolamiento venía escaneando un QR activo, registrar su marcación de inmediato
      if (qrToken) {
        const scanResult = await processQrAttendanceScan({
          emp,
          qrToken,
          punchTypeOverride: punchType,
          deviceLabel: state.enrollments[emp.id].deviceLabel,
          state,
          planilla,
          svNow,
          kioskRecId,
          planillaRecId,
        });
        if (scanResult.success) {
          return NextResponse.json({
            ...scanResult,
            enrolled: true,
          });
        }
      }

      await saveKioskState(kioskRecId, state);

      return NextResponse.json({
        success: true,
        enrolled: true,
        employee: {
          id: emp.id,
          code: emp.code,
          firstName: formatNameCase(emp.firstName || String(emp.fullName || '').split(' ')[0]),
          fullName: emp.fullName,
          position: emp.position,
        },
      });
    }

    // 3. ESCANEAR QR Y REGISTRAR MARCACIÓN EN LA BASE DE DATOS
    if (action === 'scan') {
      const { qrToken, deviceToken, punchType, deviceLabel } = body;
      if (!deviceToken) {
        return NextResponse.json(
          {
            success: false,
            code: 'NOT_ENROLLED',
            error: 'Este teléfono aún no está enrolado. Vincula tu perfil primero.',
          },
          { status: 401 }
        );
      }

      const hashedDevice = hashDeviceToken(deviceToken);
      const enrollment = Object.values(state.enrollments).find(
        (enr) => enr.deviceTokenHash === hashedDevice
      );

      if (!enrollment) {
        return NextResponse.json(
          {
            success: false,
            code: 'NOT_ENROLLED',
            error: 'Este teléfono no está enrolado en el sistema.',
          },
          { status: 401 }
        );
      }

      const emp = rawEmployees.find((e) => e.id === enrollment.empId);
      if (!emp) {
        return NextResponse.json(
          { success: false, error: 'Colaborador no encontrado en planilla.' },
          { status: 404 }
        );
      }

      const scanResult = await processQrAttendanceScan({
        emp,
        qrToken,
        punchTypeOverride: punchType,
        deviceLabel: enrollment.deviceLabel || deviceLabel || 'Celular Enrolado',
        state,
        planilla,
        svNow,
        kioskRecId,
        planillaRecId,
      });

      return NextResponse.json(scanResult, { status: scanResult.success ? 200 : 400 });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error procesando marcación' },
      { status: 500 }
    );
  }
}

async function processQrAttendanceScan({
  emp,
  qrToken,
  punchTypeOverride,
  deviceLabel,
  state,
  planilla,
  svNow,
  kioskRecId,
  planillaRecId,
}: {
  emp: any;
  qrToken: string;
  punchTypeOverride?: string;
  deviceLabel: string;
  state: KioskStateData;
  planilla: any;
  svNow: { dateStr: string; timeStr: string; timeFullStr: string; timestamp: number };
  kioskRecId: string | null;
  planillaRecId: string | null;
}) {
  const cleanToken = String(qrToken || '').trim();
  if (!cleanToken) {
    return {
      success: false,
      code: 'MISSING_TOKEN',
      error: 'Escanea el código QR en vivo desde el monitor.',
    };
  }

  // Verificar si el QR ya fue utilizado (protección contra captura de pantalla / reenvío por WhatsApp)
  if (state.usedTokens.includes(cleanToken)) {
    return {
      success: false,
      code: 'TOKEN_ALREADY_USED',
      error: 'Este código QR ya fue utilizado y se invalidó automáticamente. Escanea el nuevo QR en el monitor.',
    };
  }

  const now = Date.now();
  const isCurrentValid =
    cleanToken === state.currentToken && now <= state.tokenExpiresAt + 4000;
  const isPreviousValid =
    cleanToken === state.previousToken &&
    state.previousTokenExpiresAt &&
    now <= state.previousTokenExpiresAt;

  if (!isCurrentValid && !isPreviousValid) {
    rotateTokenIfNeeded(state, true);
    await saveKioskState(kioskRecId, state);
    return {
      success: false,
      code: 'TOKEN_EXPIRED',
      error: 'El código QR expiró (cambia cada 15 segundos por seguridad). Escanea el nuevo QR en pantalla.',
    };
  }

  // Invalidar el token inmediatamente y generar uno nuevo para el monitor
  state.usedTokens.push(cleanToken);
  if (state.usedTokens.length > 60) {
    state.usedTokens = state.usedTokens.slice(-60);
  }
  rotateTokenIfNeeded(state, true);

  // Determinar la marcación correspondiente del día en Planilla
  const dayKey = `${emp.id}_${svNow.dateStr}`;
  const currentPunch = planilla.punchRecords[dayKey] || {
    marcacionEntrada: '',
    marcacionSalidaAlmuerzo: '',
    marcacionEntradaAlmuerzo: '',
    marcacionSalidaTurno: '',
  };

  let resolvedType: 'entrada' | 'salida_almuerzo' | 'entrada_almuerzo' | 'salida_turno' = 'entrada';
  if (
    punchTypeOverride === 'entrada' ||
    punchTypeOverride === 'salida_almuerzo' ||
    punchTypeOverride === 'entrada_almuerzo' ||
    punchTypeOverride === 'salida_turno'
  ) {
    resolvedType = punchTypeOverride;
  } else {
    if (!currentPunch.marcacionEntrada) {
      resolvedType = 'entrada';
    } else if (!currentPunch.marcacionSalidaAlmuerzo) {
      resolvedType = 'salida_almuerzo';
    } else if (!currentPunch.marcacionEntradaAlmuerzo) {
      resolvedType = 'entrada_almuerzo';
    } else {
      resolvedType = 'salida_turno';
    }
  }

  const labelsMap: Record<
    'entrada' | 'salida_almuerzo' | 'entrada_almuerzo' | 'salida_turno',
    { label: string; greeting: string; field: string }
  > = {
    entrada: {
      label: '1. Entrada de Turno',
      greeting: '¡Bienvenido',
      field: 'marcacionEntrada',
    },
    salida_almuerzo: {
      label: '2. Salida a Almuerzo',
      greeting: '¡Buen provecho',
      field: 'marcacionSalidaAlmuerzo',
    },
    entrada_almuerzo: {
      label: '3. Regreso de Almuerzo',
      greeting: '¡Bienvenido de regreso',
      field: 'marcacionEntradaAlmuerzo',
    },
    salida_turno: {
      label: '4. Salida de Turno',
      greeting: '¡Hasta mañana',
      field: 'marcacionSalidaTurno',
    },
  };

  const info = labelsMap[resolvedType];
  const updatedPunch = {
    ...currentPunch,
    [info.field]: svNow.timeStr,
  };
  planilla.punchRecords[dayKey] = updatedPunch;

  const firstNameFormatted = formatNameCase(
    emp.firstName || String(emp.fullName || '').split(' ')[0]
  );

  const scanEvent: ScanEventRecord = {
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    empId: emp.id,
    empCode: emp.code || '',
    empName: emp.fullName,
    firstName: firstNameFormatted,
    position: emp.position || '',
    department: emp.department || '',
    punchType: resolvedType,
    punchLabel: info.label,
    greetingTitle: `${info.greeting}, ${firstNameFormatted}!`,
    timeStr: svNow.timeStr,
    timeFullStr: svNow.timeFullStr,
    dateStr: svNow.dateStr,
    timestamp: Date.now(),
    deviceLabel,
  };

  state.lastScanEvent = scanEvent;
  state.todayLogs = [
    scanEvent,
    ...(state.todayLogs || []).filter((l) => l.dateStr === svNow.dateStr),
  ].slice(0, 50);

  await Promise.all([
    savePlanillaData(planillaRecId, planilla),
    saveKioskState(kioskRecId, state),
  ]);

  return {
    success: true,
    scanEvent,
    todayPunch: updatedPunch,
    newKioskToken: state.currentToken,
    newKioskExpiresAt: state.tokenExpiresAt,
  };
}
