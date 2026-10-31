'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calculator,
  FileSpreadsheet,
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Printer,
  Download,
  Save,
  Building2,
  Sliders,
  AlertCircle,
  History,
  FileCheck,
  DollarSign,
  RotateCcw,
  X,
} from 'lucide-react';
import { getStaffToken } from '@/lib/auth';

export type PayrollFrequency = 'QUINCENAL' | 'MENSUAL';
export type TardinessMode = 'REDUCE_BASE' | 'OTHER_DEDUCTION';

export interface IsrBracket {
  tramo: string;
  desde: number;
  hasta: number | null;
  porcentaje: number; // ej. 0.10
  sobreExcesoDe: number;
  cuotaFija: number;
}

export interface PayrollParameters {
  isssLaboralRate: number; // 0.03
  isssPatronalRate: number; // 0.075
  isssMaxSalaryMonthly: number; // 1000.00
  afpLaboralRate: number; // 0.0725
  afpPatronalRate: number; // 0.0875
  incafRate: number; // 0.01 (solo >= 10 empleados)
  incafMinEmployees: number; // 10
  forceIncaf: boolean;
  tardinessGraceMinutes: number; // ej. 5 min de tolerancia
  tardinessMode: TardinessMode;
  employerNitDui: string;
  employerName: string;
  isssPatronalNumber: string;
  workplaceCorrelative: string;
  quincenalBrackets: IsrBracket[];
  mensualBrackets: IsrBracket[];
}

export interface JornadaDaySchedule {
  dayOfWeek: number; // 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes, 6 = Sábado, 0 = Domingo
  dayName: string;
  isWorkDay: boolean;
  entradaTurno: string; // HH:mm
  hasLunch: boolean;
  salidaAlmuerzo: string; // HH:mm
  entradaAlmuerzo: string; // HH:mm
  salidaTurno: string; // HH:mm
}

export type LunchEvaluationMode = 'DURATION' | 'FIXED_TIME';

export interface WorkJornada {
  id: string;
  code: string;
  name: string;
  description: string;
  graceMinutesEntrada: number;
  graceMinutesAlmuerzo: number;
  lunchEvaluationMode?: LunchEvaluationMode; // 'DURATION' (por defecto: mide minutos tomados) | 'FIXED_TIME' (hora fija)
  days: JornadaDaySchedule[];
}

export interface DailyPunchRecord {
  marcacionEntrada: string; // HH:mm
  marcacionSalidaAlmuerzo: string; // HH:mm
  marcacionEntradaAlmuerzo: string; // HH:mm
  marcacionSalidaTurno: string; // HH:mm
  observacion?: string;
}

export interface BonusItem {
  id: string;
  concept: string;
  amount: number;
  taxable: boolean; // true = sujeto a ISSS/AFP/ISR, false = directo al neto
}

export interface PayrollEmployee {
  id: string;
  code: string;
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  marriedLastName: string;
  fullName: string;
  gender: 'MASCULINO' | 'FEMENINO';
  hireDate: string;
  position: string;
  department: string;
  jornadaId?: string;
  docType: string; // '01 DUI' | '02 PASAPORTE' | '03 CARNÉ DE MINORIDAD' | '04 CARNÉ DE RESIDENTE'
  docNumber: string;
  isssNumber: string;
  afpInstitution: string; // 'COF - AFP CONFÍA' | 'MAX - AFP CRECER' | 'ISP - INSTITUTO SALVADOREÑO DE PENSIONES' | 'ISS - UNIDAD DE PENSIONES DEL ISSS'
  baseSalaryMonthly: number;
  hoursPerDay: number;
  workplaceCenter: string;
  obsCode1: string;
  obsCode2: string;
  // Variables del período actual
  daysOverride: number | null; // null = usa días comerciales del período (15 o 30)
  absenceDays: number; // Días de ausencia sin goce o incapacidad
  subsidyDays: number; // Días de incapacidad ISSS (>3 días genera fila SUBSIDIO en SPU)
  subsidyAmount: number;
  tardyMinutes: number; // Minutos acumulados de llegada tardía en el corte
  otherIncome: number; // Horas extras / comisiones / bonificaciones
  otherIncomeNote?: string; // Concepto del bono o ingreso adicional
  otherIncomeTaxable?: boolean; // true (default) = sujeto a ISSS/AFP/ISR, false = directo al neto
  bonusItems?: BonusItem[]; // Lista detallada de bonos/ingresos adicionales con concepto
  vacationAmount: number; // Monto de vacación
  vacationDays: number; // Días de vacación
  otherDeductions: number; // Anticipos / préstamos / descuentos directos al líquido
}

export interface SavedPayrollSnapshot {
  id: string;
  title: string;
  frequency: PayrollFrequency;
  periodStart: string;
  periodEnd: string;
  cutoffStart: string;
  cutoffEnd: string;
  spuPeriod: string;
  savedAt: string;
  totals: {
    baseMonthly: number;
    totalDevengado: number;
    isssLab: number;
    afpLab: number;
    isr: number;
    totalDeducciones: number;
    liquidoPagar: number;
    isssPat: number;
    afpPat: number;
    incafPat: number;
    totalPatronal: number;
    costoTotalEmpresa: number;
  };
  employees: PayrollEmployee[];
}

const DEFAULT_PARAMETERS: PayrollParameters = {
  isssLaboralRate: 0.03,
  isssPatronalRate: 0.075,
  isssMaxSalaryMonthly: 1000.0,
  afpLaboralRate: 0.0725,
  afpPatronalRate: 0.0875,
  incafRate: 0.01,
  incafMinEmployees: 10,
  forceIncaf: false,
  tardinessGraceMinutes: 0,
  tardinessMode: 'REDUCE_BASE',
  employerNitDui: '0614-010190-101-1',
  employerName: 'Grupo KODE S.A.S. de C.V.',
  isssPatronalNumber: 'NP0000123',
  workplaceCorrelative: '001 SUCURSAL PRINCIPAL',
  quincenalBrackets: [
    { tramo: 'I', desde: 0.01, hasta: 275.0, porcentaje: 0, sobreExcesoDe: 0, cuotaFija: 0 },
    { tramo: 'II', desde: 275.01, hasta: 447.62, porcentaje: 0.1, sobreExcesoDe: 341.665, cuotaFija: 8.83 },
    { tramo: 'III', desde: 447.63, hasta: 1019.05, porcentaje: 0.2, sobreExcesoDe: 447.62, cuotaFija: 30.0 },
    { tramo: 'IV', desde: 1019.06, hasta: null, porcentaje: 0.3, sobreExcesoDe: 1019.05, cuotaFija: 144.28 },
  ],
  mensualBrackets: [
    { tramo: 'I', desde: 0.01, hasta: 550.0, porcentaje: 0, sobreExcesoDe: 0, cuotaFija: 0 },
    { tramo: 'II', desde: 550.01, hasta: 895.24, porcentaje: 0.1, sobreExcesoDe: 683.33, cuotaFija: 17.67 },
    { tramo: 'III', desde: 895.25, hasta: 2038.1, porcentaje: 0.2, sobreExcesoDe: 895.24, cuotaFija: 60.0 },
    { tramo: 'IV', desde: 2038.11, hasta: null, porcentaje: 0.3, sobreExcesoDe: 2038.1, cuotaFija: 288.57 },
  ],
};

export function buildStandardWeekDays(
  entrada = '08:00',
  salidaAlm = '12:00',
  entradaAlm = '13:00',
  salida = '17:00',
  sabEntrada = '08:00',
  sabSalida = '12:00'
): JornadaDaySchedule[] {
  return [
    { dayOfWeek: 1, dayName: 'Lunes', isWorkDay: true, entradaTurno: entrada, hasLunch: true, salidaAlmuerzo: salidaAlm, entradaAlmuerzo: entradaAlm, salidaTurno: salida },
    { dayOfWeek: 2, dayName: 'Martes', isWorkDay: true, entradaTurno: entrada, hasLunch: true, salidaAlmuerzo: salidaAlm, entradaAlmuerzo: entradaAlm, salidaTurno: salida },
    { dayOfWeek: 3, dayName: 'Miércoles', isWorkDay: true, entradaTurno: entrada, hasLunch: true, salidaAlmuerzo: salidaAlm, entradaAlmuerzo: entradaAlm, salidaTurno: salida },
    { dayOfWeek: 4, dayName: 'Jueves', isWorkDay: true, entradaTurno: entrada, hasLunch: true, salidaAlmuerzo: salidaAlm, entradaAlmuerzo: entradaAlm, salidaTurno: salida },
    { dayOfWeek: 5, dayName: 'Viernes', isWorkDay: true, entradaTurno: entrada, hasLunch: true, salidaAlmuerzo: salidaAlm, entradaAlmuerzo: entradaAlm, salidaTurno: salida },
    { dayOfWeek: 6, dayName: 'Sábado', isWorkDay: true, entradaTurno: sabEntrada, hasLunch: false, salidaAlmuerzo: '12:00', entradaAlmuerzo: '12:00', salidaTurno: sabSalida },
    { dayOfWeek: 0, dayName: 'Domingo', isWorkDay: false, entradaTurno: '08:00', hasLunch: false, salidaAlmuerzo: '12:00', entradaAlmuerzo: '13:00', salidaTurno: '17:00' },
  ];
}

const DEFAULT_JORNADAS: WorkJornada[] = [
  {
    id: 'jor-gerencia',
    code: 'JOR-GER',
    name: 'Gerencia',
    description: 'Jornada de Gerencia y Administración General (Lun–Vie 08:00–17:00, Sáb 08:00–12:00)',
    graceMinutesEntrada: 0,
    graceMinutesAlmuerzo: 0,
    days: buildStandardWeekDays('08:00', '12:00', '13:00', '17:00', '08:00', '12:00'),
  },
  {
    id: 'jor-ventas',
    code: 'JOR-VEN',
    name: 'Ventas / Recepción',
    description: 'Jornada de Atención en Sala de Ventas y Recepción',
    graceMinutesEntrada: 0,
    graceMinutesAlmuerzo: 0,
    days: buildStandardWeekDays('08:00', '12:00', '13:00', '17:00', '08:00', '12:00'),
  },
  {
    id: 'jor-bodega',
    code: 'JOR-BOD',
    name: 'Bodega',
    description: 'Jornada Operativa de Bodega y Despacho',
    graceMinutesEntrada: 0,
    graceMinutesAlmuerzo: 0,
    days: buildStandardWeekDays('08:00', '12:00', '13:00', '17:00', '08:00', '12:00'),
  },
  {
    id: 'jor-marketing',
    code: 'JOR-MKT',
    name: 'Marketing',
    description: 'Jornada de Equipo Creativo y Marketing Digital',
    graceMinutesEntrada: 0,
    graceMinutesAlmuerzo: 0,
    days: buildStandardWeekDays('08:00', '12:00', '13:00', '17:00', '08:00', '12:00'),
  },
];

const INITIAL_EMPLOYEES: PayrollEmployee[] = [
  {
    id: 'emp-1',
    code: '001',
    firstName: 'JORGE',
    secondName: 'LUIS',
    firstLastName: 'FUENTES',
    secondLastName: 'VASQUEZ',
    marriedLastName: '',
    fullName: 'Jorge Luis fuentes Vasquez',
    gender: 'MASCULINO',
    hireDate: '2026-10-14',
    position: 'Gerente',
    department: 'ADMINISTRACIÓN',
    jornadaId: 'jor-gerencia',
    docType: '01 DUI',
    docNumber: '05593529-2',
    isssNumber: 'ISSS00001',
    afpInstitution: 'COF - AFP CONFÍA',
    baseSalaryMonthly: 700.0,
    hoursPerDay: 8,
    workplaceCenter: '001 SUCURSAL PRINCIPAL',
    obsCode1: '08 Ingreso o Reingreso del Trabajador',
    obsCode2: '00 Sin Cambios',
    daysOverride: null,
    absenceDays: 0,
    subsidyDays: 0,
    subsidyAmount: 0,
    tardyMinutes: 0,
    otherIncome: 0,
    vacationAmount: 0,
    vacationDays: 0,
    otherDeductions: 0,
  },
  {
    id: 'emp-2',
    code: '002',
    firstName: 'ERIKA',
    secondName: 'MARIA',
    firstLastName: 'MELGAR',
    secondLastName: 'GARCIA',
    marriedLastName: '',
    fullName: 'Erika Maria Melgar Garcia',
    gender: 'FEMENINO',
    hireDate: '2026-10-14',
    position: 'Recepción',
    department: 'VENTA',
    jornadaId: 'jor-ventas',
    docType: '01 DUI',
    docNumber: '06616646-6',
    isssNumber: 'ISSS00002',
    afpInstitution: 'MAX - AFP CRECER',
    baseSalaryMonthly: 450.0,
    hoursPerDay: 8,
    workplaceCenter: '001 SUCURSAL PRINCIPAL',
    obsCode1: '08 Ingreso o Reingreso del Trabajador',
    obsCode2: '00 Sin Cambios',
    daysOverride: null,
    absenceDays: 0,
    subsidyDays: 0,
    subsidyAmount: 0,
    tardyMinutes: 0,
    otherIncome: 0,
    vacationAmount: 0,
    vacationDays: 0,
    otherDeductions: 0,
  },
  {
    id: 'emp-3',
    code: '003',
    firstName: 'RODOLFO',
    secondName: 'HECTOR',
    firstLastName: 'GUALA',
    secondLastName: '',
    marriedLastName: '',
    fullName: 'Rodolfo Hector Guala',
    gender: 'MASCULINO',
    hireDate: '2026-10-14',
    position: 'Bodega',
    department: 'BODEGA',
    jornadaId: 'jor-bodega',
    docType: '02 PASAPORTE',
    docNumber: 'AAK778492',
    isssNumber: 'ISSS00003',
    afpInstitution: 'MAX - AFP CRECER',
    baseSalaryMonthly: 425.0,
    hoursPerDay: 8,
    workplaceCenter: '001 SUCURSAL PRINCIPAL',
    obsCode1: '08 Ingreso o Reingreso del Trabajador',
    obsCode2: '00 Sin Cambios',
    daysOverride: null,
    absenceDays: 0,
    subsidyDays: 0,
    subsidyAmount: 0,
    tardyMinutes: 0,
    otherIncome: 0,
    vacationAmount: 0,
    vacationDays: 0,
    otherDeductions: 0,
  },
  {
    id: 'emp-4',
    code: '004',
    firstName: 'DAVID',
    secondName: 'ANTONIO',
    firstLastName: 'MEJIA',
    secondLastName: 'RAMIREZ',
    marriedLastName: '',
    fullName: 'David Antonio Mejia Ramirez',
    gender: 'MASCULINO',
    hireDate: '2026-10-14',
    position: 'Marketing',
    department: 'MARKETING',
    jornadaId: 'jor-marketing',
    docType: '01 DUI',
    docNumber: '05785262-8',
    isssNumber: 'ISSS00004',
    afpInstitution: 'COF - AFP CONFÍA',
    baseSalaryMonthly: 425.0,
    hoursPerDay: 8,
    workplaceCenter: '001 SUCURSAL PRINCIPAL',
    obsCode1: '08 Ingreso o Reingreso del Trabajador',
    obsCode2: '00 Sin Cambios',
    daysOverride: null,
    absenceDays: 0,
    subsidyDays: 0,
    subsidyAmount: 0,
    tardyMinutes: 0,
    otherIncome: 0,
    vacationAmount: 0,
    vacationDays: 0,
    otherDeductions: 0,
  },
  {
    id: 'emp-5',
    code: '005',
    firstName: 'LUIS',
    secondName: 'ERNESTO',
    firstLastName: 'GONZALEZ',
    secondLastName: 'MARTINEZ',
    marriedLastName: '',
    fullName: 'Luis Ernesto Gonzalez Martinez',
    gender: 'MASCULINO',
    hireDate: '2026-10-14',
    position: 'Marketing',
    department: 'MARKETING',
    jornadaId: 'jor-marketing',
    docType: '01 DUI',
    docNumber: '06694167-0',
    isssNumber: 'ISSS00005',
    afpInstitution: 'COF - AFP CONFÍA',
    baseSalaryMonthly: 425.0,
    hoursPerDay: 8,
    workplaceCenter: '001 SUCURSAL PRINCIPAL',
    obsCode1: '08 Ingreso o Reingreso del Trabajador',
    obsCode2: '00 Sin Cambios',
    daysOverride: null,
    absenceDays: 0,
    subsidyDays: 0,
    subsidyAmount: 0,
    tardyMinutes: 0,
    otherIncome: 0,
    vacationAmount: 0,
    vacationDays: 0,
    otherDeductions: 0,
  },
];

const SPU_OBS_CODES = [
  '00 Sin Cambios',
  '01 Sin cambios con respecto al mes anterior',
  '02 Pagos adicionales',
  '03 Aprendices',
  '04 Pensionado',
  '05 Licencia',
  '06 Incapacidad',
  '07 Retiro del Trabajador de la empresa',
  '08 Ingreso o Reingreso del Trabajador',
  '09 Vacaciones',
  '10 Vacaciones más pagos adicionales',
  '12 Cotizaciones patronales por subsidios del ISSS',
];

const AFP_INSTITUTIONS = [
  'COF - AFP CONFÍA',
  'MAX - AFP CRECER',
  'ISP - INSTITUTO SALVADOREÑO DE PENSIONES',
  'ISS - UNIDAD DE PENSIONES DEL ISSS',
];

const DOC_TYPES = [
  '01 DUI',
  '02 PASAPORTE',
  '03 CARNÉ DE MINORIDAD',
  '04 CARNÉ DE RESIDENTE',
];

export function round2(val: number): number {
  return Math.round((Number(val || 0) + Number.EPSILON) * 100) / 100;
}

/**
 * Fórmula de mes comercial salvadoreño (base 30 días):
 * =IF(G4=EOMONTH(G4,0), 30, DAY(G4)) - DAY(F4) + 1
 */
export function computeCommercialDays(startDateStr: string, endDateStr: string): number {
  const startMatch = String(startDateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const endMatch = String(endDateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!startMatch || !endMatch) return 15;
  const startDay = parseInt(startMatch[3], 10);
  const endYear = parseInt(endMatch[1], 10);
  const endMonth = parseInt(endMatch[2], 10);
  const endDay = parseInt(endMatch[3], 10);
  const lastDayOfEndMonth = new Date(endYear, endMonth, 0).getDate();
  if (startDay === 1 && endDay === lastDayOfEndMonth) return 30;
  if (startDay === 16 && endDay === lastDayOfEndMonth) return 15;
  const days = endDay - startDay + 1;
  return Math.max(0, Math.min(31, days));
}

export function calculateIsrFromBracketsExact(gravable: number, brackets: IsrBracket[]): number {
  if (gravable <= 0) return 0;
  for (const b of brackets) {
    if (b.hasta === null || gravable <= b.hasta) {
      if (b.porcentaje === 0) return 0;
      return (gravable - b.sobreExcesoDe) * b.porcentaje + b.cuotaFija;
    }
  }
  return 0;
}

export function calculateIsrFromBrackets(gravable: number, brackets: IsrBracket[]): number {
  return round2(calculateIsrFromBracketsExact(gravable, brackets));
}

export function parseTimeMinutes(hhmm: string): number | null {
  const m = String(hhmm || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function calcDayScheduledHours(d: JornadaDaySchedule): number {
  if (!d.isWorkDay) return 0;
  const inMin = parseTimeMinutes(d.entradaTurno);
  const outMin = parseTimeMinutes(d.salidaTurno);
  if (inMin === null || outMin === null || outMin <= inMin) return 0;
  let totalMin = outMin - inMin;
  if (d.hasLunch) {
    const lOut = parseTimeMinutes(d.salidaAlmuerzo);
    const lIn = parseTimeMinutes(d.entradaAlmuerzo);
    if (lOut !== null && lIn !== null && lIn > lOut) {
      totalMin -= lIn - lOut;
    }
  }
  return round2(Math.max(0, totalMin / 60));
}

export function getDatesInRange(startStr: string, endStr: string): string[] {
  const s = new Date(`${startStr}T00:00:00`);
  const e = new Date(`${endStr}T00:00:00`);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return [];
  const dates: string[] = [];
  const cur = new Date(s);
  let guard = 0;
  while (cur <= e && guard < 45) {
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return dates;
}

export function crossDayPunch(
  daySchedule: JornadaDaySchedule | undefined,
  punch: DailyPunchRecord | undefined,
  graceEntrada = 0,
  graceAlmuerzo = 0,
  lunchMode: LunchEvaluationMode = 'DURATION'
) {
  if (!daySchedule || !daySchedule.isWorkDay || !punch) {
    return {
      minTardeEntrada: 0,
      minSalidaAntesAlmuerzo: 0,
      minTardeEntradaAlmuerzo: 0,
      minSalidaAntesTurno: 0,
      allowedLunchMinutes: 0,
      takenLunchMinutes: null as number | null,
      totalMinutosDescuento: 0,
    };
  }

  let minTardeEntrada = 0;
  let minSalidaAntesAlmuerzo = 0;
  let minTardeEntradaAlmuerzo = 0;
  let minSalidaAntesTurno = 0;
  let allowedLunchMinutes = 0;
  let takenLunchMinutes: number | null = null;

  // 1. Entrada de Turno vs Marcación de Entrada
  const schedIn = parseTimeMinutes(daySchedule.entradaTurno);
  const punchIn = parseTimeMinutes(punch.marcacionEntrada);
  if (schedIn !== null && punchIn !== null && punchIn > schedIn) {
    const diff = punchIn - schedIn;
    if (diff > graceEntrada) {
      minTardeEntrada = diff;
    }
  }

  // 2. Evaluación de Almuerzo: Por Duración Flexible ('DURATION') o Por Hora Fija ('FIXED_TIME')
  if (daySchedule.hasLunch) {
    const schedLunchOut = parseTimeMinutes(daySchedule.salidaAlmuerzo);
    const schedLunchIn = parseTimeMinutes(daySchedule.entradaAlmuerzo);
    if (schedLunchOut !== null && schedLunchIn !== null && schedLunchIn > schedLunchOut) {
      allowedLunchMinutes = schedLunchIn - schedLunchOut;
    }

    const punchLunchOut = parseTimeMinutes(punch.marcacionSalidaAlmuerzo);
    const punchLunchIn = parseTimeMinutes(punch.marcacionEntradaAlmuerzo);

    if (punchLunchOut !== null && punchLunchIn !== null && punchLunchIn >= punchLunchOut) {
      takenLunchMinutes = punchLunchIn - punchLunchOut;
    }

    if (lunchMode === 'DURATION') {
      // MODO FLEXIBLE POR DURACIÓN: No importa si salió a las 11:45, 12:15 o 13:00;
      // solo evalúa cuántos minutos duró su almuerzo respecto a los minutos permitidos (ej. 60 min).
      if (takenLunchMinutes !== null && allowedLunchMinutes > 0) {
        const excess = takenLunchMinutes - allowedLunchMinutes;
        if (excess > graceAlmuerzo) {
          minTardeEntradaAlmuerzo = excess;
        }
      }
    } else {
      // MODO RÍGIDO POR HORA FIJA: Evalúa contra la hora exacta programada
      if (schedLunchOut !== null && punchLunchOut !== null && punchLunchOut < schedLunchOut) {
        minSalidaAntesAlmuerzo = schedLunchOut - punchLunchOut;
      }
      if (schedLunchIn !== null && punchLunchIn !== null && punchLunchIn > schedLunchIn) {
        const diffAlm = punchLunchIn - schedLunchIn;
        if (diffAlm > graceAlmuerzo) {
          minTardeEntradaAlmuerzo = diffAlm;
        }
      }
    }
  }

  // 3. Salida de Turno vs Marcación de Salida
  const schedOut = parseTimeMinutes(daySchedule.salidaTurno);
  const punchOut = parseTimeMinutes(punch.marcacionSalidaTurno);
  if (schedOut !== null && punchOut !== null && punchOut < schedOut) {
    minSalidaAntesTurno = schedOut - punchOut;
  }

  const totalMinutosDescuento =
    minTardeEntrada + minSalidaAntesAlmuerzo + minTardeEntradaAlmuerzo + minSalidaAntesTurno;

  return {
    minTardeEntrada,
    minSalidaAntesAlmuerzo,
    minTardeEntradaAlmuerzo,
    minSalidaAntesTurno,
    allowedLunchMinutes,
    takenLunchMinutes,
    totalMinutosDescuento,
  };
}

const STORAGE_KEY = 'kodelocal_planilla_sv_v3';

export default function PlanillaModule() {
  const [subTab, setSubTab] = useState<'quincenal' | 'jornadas' | 'spu' | 'resumen' | 'parametros'>('quincenal');
  const [frequency, setFrequency] = useState<PayrollFrequency>('MENSUAL');
  const [selectedWorkEmpId, setSelectedWorkEmpId] = useState<string>('emp-1');
  const [showFullEmployerCols, setShowFullEmployerCols] = useState<boolean>(false);

  // Estado temporal para registrar múltiples bonos con conceptos diferentes por colaborador
  const [draftBonusAmount, setDraftBonusAmount] = useState<string>('');
  const [draftBonusConcept, setDraftBonusConcept] = useState<string>('');
  const [draftBonusTaxable, setDraftBonusTaxable] = useState<boolean>(true);

  // Doble Calendario (Período de Salario Ordinario vs. Período de Corte de Novedades/Reloj)
  const [periodStart, setPeriodStart] = useState('2026-10-14');
  const [periodEnd, setPeriodEnd] = useState('2026-10-31');
  const [cutoffStart, setCutoffStart] = useState('2026-10-14');
  const [cutoffEnd, setCutoffEnd] = useState('2026-10-31');
  const [paymentDate, setPaymentDate] = useState('2026-10-31');

  const [parameters, setParameters] = useState<PayrollParameters>(DEFAULT_PARAMETERS);
  const [employees, setEmployees] = useState<PayrollEmployee[]>(INITIAL_EMPLOYEES);
  const [jornadas, setJornadas] = useState<WorkJornada[]>(DEFAULT_JORNADAS);
  const [selectedJornadaId, setSelectedJornadaId] = useState<string>('jor-gerencia');
  const [selectedPunchEmpId, setSelectedPunchEmpId] = useState<string>('emp-1');
  // Mapa de marcaciones por `${empId}_${YYYY-MM-DD}`
  const [punchRecords, setPunchRecords] = useState<Record<string, DailyPunchRecord>>({});
  const [bulkPunchCsvText, setBulkPunchCsvText] = useState<string>('');
  const [showBulkPunchModal, setShowBulkPunchModal] = useState<boolean>(false);

  const [history, setHistory] = useState<SavedPayrollSnapshot[]>([]);
  const [isSavingServer, setIsSavingServer] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal de crear / editar empleado
  const [editingEmp, setEditingEmp] = useState<PayrollEmployee | null>(null);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Cargar datos de localStorage y Supabase al iniciar
  useEffect(() => {
    const defaultJornadaForDept = (dept: string) => {
      const u = String(dept || '').toUpperCase();
      if (u.includes('ADMIN') || u.includes('GEREN')) return 'jor-gerencia';
      if (u.includes('VENT') || u.includes('RECEP')) return 'jor-ventas';
      if (u.includes('BODEG')) return 'jor-bodega';
      if (u.includes('MARKET')) return 'jor-marketing';
      return 'jor-gerencia';
    };

    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.employees) && parsed.employees.length > 0) {
            setEmployees(
              parsed.employees.map((e: PayrollEmployee) => ({
                ...e,
                jornadaId: e.jornadaId || defaultJornadaForDept(e.department),
              }))
            );
          }
          if (Array.isArray(parsed.jornadas) && parsed.jornadas.length > 0) {
            setJornadas(parsed.jornadas);
          }
          if (parsed.punchRecords && typeof parsed.punchRecords === 'object') {
            setPunchRecords(parsed.punchRecords);
          }
          if (parsed.parameters) {
            setParameters({ ...DEFAULT_PARAMETERS, ...parsed.parameters });
          }
          if (Array.isArray(parsed.history)) {
            setHistory(parsed.history);
          }
          if (parsed.periodStart) setPeriodStart(parsed.periodStart);
          if (parsed.periodEnd) setPeriodEnd(parsed.periodEnd);
          if (parsed.cutoffStart) setCutoffStart(parsed.cutoffStart);
          if (parsed.cutoffEnd) setCutoffEnd(parsed.cutoffEnd);
          if (parsed.paymentDate) setPaymentDate(parsed.paymentDate);
          if (parsed.frequency) setFrequency(parsed.frequency);
        } catch {}
      }
    }

    fetch('/api/admin/planilla')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          if (Array.isArray(d.employees) && d.employees.length > 0) {
            setEmployees(
              d.employees.map((e: PayrollEmployee) => ({
                ...e,
                jornadaId: e.jornadaId || defaultJornadaForDept(e.department),
              }))
            );
          }
          if (Array.isArray(d.jornadas) && d.jornadas.length > 0) {
            setJornadas(d.jornadas);
          }
          if (d.punchRecords && typeof d.punchRecords === 'object') {
            setPunchRecords(d.punchRecords);
          }
          if (d.parameters) setParameters({ ...DEFAULT_PARAMETERS, ...d.parameters });
          if (Array.isArray(d.history)) setHistory(d.history);
          if (d.periodStart) setPeriodStart(d.periodStart);
          if (d.periodEnd) setPeriodEnd(d.periodEnd);
          if (d.cutoffStart) setCutoffStart(d.cutoffStart);
          if (d.cutoffEnd) setCutoffEnd(d.cutoffEnd);
          if (d.paymentDate) setPaymentDate(d.paymentDate);
          if (d.frequency) setFrequency(d.frequency);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
          }
        }
      })
      .catch(() => {});
  }, []);

  const persistState = async (
    nextEmployees = employees,
    nextParams = parameters,
    nextHistory = history,
    nextPeriod = { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency },
    nextJornadas = jornadas,
    nextPunchRecords = punchRecords
  ) => {
    const payload = {
      employees: nextEmployees,
      parameters: nextParams,
      history: nextHistory,
      jornadas: nextJornadas,
      punchRecords: nextPunchRecords,
      ...nextPeriod,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
    setIsSavingServer(true);
    try {
      const staffToken = await getStaffToken();
      await fetch('/api/admin/planilla', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('Error guardando planilla en servidor:', e);
    } finally {
      setIsSavingServer(false);
    }
  };

  // Atajos para configurar Período Inicial 18 días (14 al 31 Oct), Mes Completo (30 días), 1.ª o 2.ª Quincena
  const applyPresetPeriod = (type: 'Q1' | 'Q2' | 'MONTH' | 'OCT_18') => {
    const baseMatch = periodStart.match(/^(\d{4})-(\d{2})/);
    const year = baseMatch ? parseInt(baseMatch[1], 10) : new Date().getFullYear();
    const month = baseMatch ? parseInt(baseMatch[2], 10) : new Date().getMonth() + 1;
    const mm = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();

    const prevDate = new Date(year, month - 1, 0);
    const prevYear = prevDate.getFullYear();
    const prevMm = String(prevDate.getMonth() + 1).padStart(2, '0');

    let nextFreq: PayrollFrequency = 'QUINCENAL';
    let pStart = `${year}-${mm}-01`;
    let pEnd = `${year}-${mm}-15`;
    let cStart = `${prevYear}-${prevMm}-29`;
    let cEnd = `${year}-${mm}-14`;
    let payDate = `${year}-${mm}-15`;

    if (type === 'Q2') {
      nextFreq = 'QUINCENAL';
      pStart = `${year}-${mm}-16`;
      pEnd = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
      cStart = `${year}-${mm}-15`;
      cEnd = `${year}-${mm}-28`;
      payDate = `${year}-${mm}-${lastDay >= 29 ? '29' : String(lastDay).padStart(2, '0')}`;
    } else if (type === 'MONTH') {
      nextFreq = 'MENSUAL';
      pStart = `${year}-${mm}-01`;
      pEnd = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
      cStart = `${prevYear}-${prevMm}-29`;
      cEnd = `${year}-${mm}-28`;
      payDate = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
    } else if (type === 'OCT_18') {
      nextFreq = 'MENSUAL';
      pStart = `${year}-${mm}-14`;
      pEnd = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
      cStart = `${year}-${mm}-14`;
      cEnd = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
      payDate = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
    }

    const resetDaysEmployees = employees.map((e) => ({ ...e, daysOverride: null }));
    setEmployees(resetDaysEmployees);
    setFrequency(nextFreq);
    setPeriodStart(pStart);
    setPeriodEnd(pEnd);
    setCutoffStart(cStart);
    setCutoffEnd(cEnd);
    setPaymentDate(payDate);
    persistState(resetDaysEmployees, parameters, history, {
      periodStart: pStart,
      periodEnd: pEnd,
      cutoffStart: cStart,
      cutoffEnd: cEnd,
      paymentDate: payDate,
      frequency: nextFreq,
    });
  };

  // Días comerciales automáticos según Fecha Inicio y Fecha Fin (fórmula base 30 días)
  const defaultCommercialDays = useMemo(() => {
    return computeCommercialDays(periodStart, periodEnd);
  }, [periodStart, periodEnd]);

  // Período SPU en formato oficial de 6 dígitos MMYYYY (sin depender del formato regional de PC/Mac)
  const spuPeriodCode = useMemo(() => {
    const m = periodEnd.match(/^(\d{4})-(\d{2})/);
    if (!m) return '102026';
    return `${m[2]}${m[1]}`;
  }, [periodEnd]);

  // ¿Aplica INCAF (ex-INSAFORP) 1%? Solo si hay >= 10 empleados o si se fuerza manualmente
  const appliesIncaf = useMemo(() => {
    return parameters.forceIncaf || employees.length >= parameters.incafMinEmployees;
  }, [employees.length, parameters.forceIncaf, parameters.incafMinEmployees]);

  // Cálculo fila por fila siguiendo exactamente la fórmula del archivo planillero de Grupo KODE S.A.S. de C.V.
  const computedRows = useMemo(() => {
    const isQuincenal = frequency === 'QUINCENAL';
    const isssCapSalary = isQuincenal
      ? parameters.isssMaxSalaryMonthly / 2
      : parameters.isssMaxSalaryMonthly;
    const isssLabMax = round2(isssCapSalary * parameters.isssLaboralRate); // $15.00 quincenal / $30.00 mensual
    const isssPatMax = round2(isssCapSalary * parameters.isssPatronalRate); // $37.50 quincenal / $75.00 mensual
    const incafPatMax = round2(isssCapSalary * parameters.incafRate); // $5.00 quincenal / $10.00 mensual
    const brackets = isQuincenal ? parameters.quincenalBrackets : parameters.mensualBrackets;

    const endMatch = String(periodEnd || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const daysInCalendarMonth = endMatch
      ? new Date(parseInt(endMatch[1], 10), parseInt(endMatch[2], 10), 0).getDate()
      : 30;

    return employees.map((emp, idx) => {
      const baseMonthly = Number(emp.baseSalaryMonthly || 0);
      const basePeriodDays = emp.daysOverride !== null ? emp.daysOverride : defaultCommercialDays;
      const workedDays = Math.max(
        0,
        basePeriodDays - Number(emp.absenceDays || 0) - Number(emp.subsidyDays || 0)
      );

      const divisorDays =
        workedDays === 15 || workedDays === 30 ? 30 : daysInCalendarMonth;
      const dailySalaryExact = baseMonthly / divisorDays;
      const dailySalaryDisplay = round2(dailySalaryExact);
      const minuteRate = baseMonthly / 14400; // Sueldo / 30 / 8 / 60

      // Salario del período devengado (ej. 18 días sobre 31 en octubre: 700/31*18 = 406.45)
      const ordinarySalary = round2(dailySalaryExact * workedDays);

      // Llegadas tardías: descuento legal exacto por minuto no laborado
      const rawTardy = Math.max(0, Number(emp.tardyMinutes || 0));
      const effectiveTardyMinutes =
        rawTardy > parameters.tardinessGraceMinutes ? rawTardy : 0;
      const tardyDiscount = round2(minuteRate * effectiveTardyMinutes);

      const bonusItems: BonusItem[] =
        Array.isArray(emp.bonusItems) && emp.bonusItems.length > 0
          ? emp.bonusItems
          : Number(emp.otherIncome || 0) > 0
          ? [
              {
                id: 'legacy-bonus',
                concept: emp.otherIncomeNote || 'Bono / Ingreso Adicional',
                amount: round2(Number(emp.otherIncome || 0)),
                taxable: emp.otherIncomeTaxable !== false,
              },
            ]
          : [];

      const taxableBonus = round2(
        bonusItems
          .filter((b) => b.taxable !== false)
          .reduce((sum, b) => sum + Number(b.amount || 0), 0)
      );
      const nonTaxableBonus = round2(
        bonusItems
          .filter((b) => b.taxable === false)
          .reduce((sum, b) => sum + Number(b.amount || 0), 0)
      );
      const otherIncome = round2(taxableBonus + nonTaxableBonus);
      const isBonusTaxable = nonTaxableBonus === 0;
      const bonusSummaryText = bonusItems
        .map((b) => `${b.concept} ($${Number(b.amount).toFixed(2)})`)
        .join(', ');
      const vacationAmount = round2(Number(emp.vacationAmount || 0));

      // Columna G: INGRESO SUJETO COTIZACIONES (=E+F)
      const totalDevengado = round2(
        Math.max(
          0,
          ordinarySalary +
            taxableBonus +
            vacationAmount -
            (parameters.tardinessMode === 'REDUCE_BASE' ? tardyDiscount : 0)
        )
      );

      // Columnas H, I, J, K, L, M exactas según el archivo Excel del contador
      const isssLabExact = Math.min(totalDevengado * parameters.isssLaboralRate, isssLabMax);
      const afpLabExact = totalDevengado * parameters.afpLaboralRate;
      const baseGravableIsrExact = Math.max(0, totalDevengado - isssLabExact - afpLabExact);
      const isrExact = calculateIsrFromBracketsExact(baseGravableIsrExact, brackets);

      const otherDeductions = round2(
        Number(emp.otherDeductions || 0) +
          (parameters.tardinessMode === 'OTHER_DEDUCTION' ? tardyDiscount : 0)
      );
      const totalDeduccionesExact = isssLabExact + afpLabExact + isrExact + otherDeductions;
      const liquidoPagarExact = totalDevengado + nonTaxableBonus - totalDeduccionesExact;

      const isssLab = round2(isssLabExact);
      const afpLab = round2(afpLabExact);
      const baseGravableIsr = round2(baseGravableIsrExact);
      const isr = round2(isrExact);
      const totalDeducciones = round2(totalDeduccionesExact);
      const liquidoPagar = round2(liquidoPagarExact);

      const isssPatExact = Math.min(totalDevengado * parameters.isssPatronalRate, isssPatMax);
      const afpPatExact = totalDevengado * parameters.afpPatronalRate;
      const incafPatExact = appliesIncaf
        ? Math.min(totalDevengado * parameters.incafRate, incafPatMax)
        : 0;
      const totalPatronalExact = isssPatExact + afpPatExact + incafPatExact;
      const costoTotalEmpresaExact = totalDevengado + nonTaxableBonus + totalPatronalExact;

      const isssPat = round2(isssPatExact);
      const afpPat = round2(afpPatExact);
      const incafPat = round2(incafPatExact);
      const totalPatronal = round2(totalPatronalExact);
      const costoTotalEmpresa = round2(costoTotalEmpresaExact);

      return {
        index: idx + 1,
        emp,
        baseMonthly,
        dailySalaryDisplay,
        workedDays,
        ordinarySalary,
        effectiveTardyMinutes,
        tardyDiscount,
        otherIncome,
        bonusItems,
        bonusSummaryText,
        isBonusTaxable,
        taxableBonus,
        nonTaxableBonus,
        vacationAmount,
        totalDevengado,
        isssLabExact,
        afpLabExact,
        baseGravableIsrExact,
        isrExact,
        totalDeduccionesExact,
        liquidoPagarExact,
        isssPatExact,
        afpPatExact,
        incafPatExact,
        totalPatronalExact,
        costoTotalEmpresaExact,
        isssLab,
        afpLab,
        baseGravableIsr,
        isr,
        otherDeductions,
        totalDeducciones,
        liquidoPagar,
        isssPat,
        afpPat,
        incafPat,
        totalPatronal,
        costoTotalEmpresa,
      };
    });
  }, [employees, frequency, parameters, defaultCommercialDays, appliesIncaf, periodEnd]);

  // Sumatorias generales de la planilla (suma exacta de celdas como en Excel y redondeo a 2 decimales)
  const totals = useMemo(() => {
    const raw = computedRows.reduce(
      (acc, r) => ({
        baseMonthly: acc.baseMonthly + r.baseMonthly,
        ordinarySalary: acc.ordinarySalary + r.ordinarySalary,
        tardyDiscount: acc.tardyDiscount + r.tardyDiscount,
        otherIncome: acc.otherIncome + r.otherIncome,
        vacationAmount: acc.vacationAmount + r.vacationAmount,
        totalDevengado: acc.totalDevengado + r.totalDevengado,
        isssLab: acc.isssLab + r.isssLabExact,
        afpLab: acc.afpLab + r.afpLabExact,
        baseGravableIsr: acc.baseGravableIsr + r.baseGravableIsrExact,
        isr: acc.isr + r.isrExact,
        otherDeductions: acc.otherDeductions + r.otherDeductions,
        totalDeducciones: acc.totalDeducciones + r.totalDeduccionesExact,
        liquidoPagar: acc.liquidoPagar + r.liquidoPagarExact,
        isssPat: acc.isssPat + r.isssPatExact,
        afpPat: acc.afpPat + r.afpPatExact,
        incafPat: acc.incafPat + r.incafPatExact,
        totalPatronal: acc.totalPatronal + r.totalPatronalExact,
        costoTotalEmpresa: acc.costoTotalEmpresa + r.costoTotalEmpresaExact,
      }),
      {
        baseMonthly: 0,
        ordinarySalary: 0,
        tardyDiscount: 0,
        otherIncome: 0,
        vacationAmount: 0,
        totalDevengado: 0,
        isssLab: 0,
        afpLab: 0,
        baseGravableIsr: 0,
        isr: 0,
        otherDeductions: 0,
        totalDeducciones: 0,
        liquidoPagar: 0,
        isssPat: 0,
        afpPat: 0,
        incafPat: 0,
        totalPatronal: 0,
        costoTotalEmpresa: 0,
      }
    );
    return {
      baseMonthly: round2(raw.baseMonthly),
      ordinarySalary: round2(raw.ordinarySalary),
      tardyDiscount: round2(raw.tardyDiscount),
      otherIncome: round2(raw.otherIncome),
      vacationAmount: round2(raw.vacationAmount),
      totalDevengado: round2(raw.totalDevengado),
      isssLab: round2(raw.isssLab),
      afpLab: round2(raw.afpLab),
      baseGravableIsr: round2(raw.baseGravableIsr),
      isr: round2(raw.isr),
      otherDeductions: round2(raw.otherDeductions),
      totalDeducciones: round2(raw.totalDeducciones),
      liquidoPagar: round2(raw.liquidoPagar),
      isssPat: round2(raw.isssPat),
      afpPat: round2(raw.afpPat),
      incafPat: round2(raw.incafPat),
      totalPatronal: round2(raw.totalPatronal),
      costoTotalEmpresa: round2(raw.costoTotalEmpresa),
    };
  }, [computedRows]);

  // Filas generadas para el Sistema de Planilla Única (SPU - ISSS/AFP)
  const spuRows = useMemo(() => {
    const list: Array<{
      rowNum: number;
      referencia: string;
      nitEmpleador: string;
      numPatronalIsss: string;
      periodo: string;
      centroTrabajo: string;
      numDocumento: string;
      tipoDocumento: string;
      numAfiliacion: string;
      institucionPrevisional: string;
      primerNombre: string;
      segundoNombre: string;
      primerApellido: string;
      segundoApellido: string;
      apellidoCasada: string;
      salario: number;
      pagoAdicional: number;
      montoVacacion: number;
      dias: number;
      horas: number;
      diasVacacion: number;
      codObs1: string;
      codObs2: string;
      departamento: string;
      cargo: string;
    }> = [];

    let seq = 1;
    for (const r of computedRows) {
      const e = r.emp;
      // En SPU mensual la base es 30 días (o los días efectivos si hubo ausencia/incapacidad/vacación)
      const factor = frequency === 'QUINCENAL' ? 2 : 1;
      const spuBaseDays = Math.max(
        0,
        30 - Number(e.absenceDays || 0) - Number(e.subsidyDays || 0) - Number(e.vacationDays || 0)
      );
      const spuSalary = round2(
        frequency === 'QUINCENAL'
          ? (e.baseSalaryMonthly / 30) * spuBaseDays -
              (parameters.tardinessMode === 'REDUCE_BASE' ? r.tardyDiscount : 0)
          : r.ordinarySalary - (parameters.tardinessMode === 'REDUCE_BASE' ? r.tardyDiscount : 0)
      );

      let autoObs1 = e.obsCode1;
      if (e.subsidyDays > 0) {
        autoObs1 = '06 Incapacidad';
      } else if (e.vacationDays > 0 && r.otherIncome > 0) {
        autoObs1 = '10 Vacaciones más pagos adicionales';
      } else if (e.vacationDays > 0) {
        autoObs1 = '09 Vacaciones';
      } else if (r.otherIncome > 0) {
        autoObs1 = '02 Pagos adicionales';
      }

      list.push({
        rowNum: seq++,
        referencia: e.code,
        nitEmpleador: parameters.employerNitDui.replace(/-/g, ''),
        numPatronalIsss: parameters.isssPatronalNumber,
        periodo: spuPeriodCode,
        centroTrabajo: e.workplaceCenter || parameters.workplaceCorrelative,
        numDocumento: e.docNumber.replace(/-/g, ''),
        tipoDocumento: e.docType.slice(0, 2),
        numAfiliacion: e.isssNumber,
        institucionPrevisional: e.afpInstitution.slice(0, 3),
        primerNombre: e.firstName,
        segundoNombre: e.secondName,
        primerApellido: e.firstLastName,
        segundoApellido: e.secondLastName,
        apellidoCasada: e.marriedLastName,
        salario: Math.max(0, spuSalary),
        pagoAdicional: r.otherIncome,
        montoVacacion: r.vacationAmount,
        dias: spuBaseDays,
        horas: e.hoursPerDay || 8,
        diasVacacion: Number(e.vacationDays || 0),
        codObs1: autoObs1.slice(0, 2),
        codObs2: e.obsCode2.slice(0, 2),
        departamento: e.department,
        cargo: e.position,
      });

      // Si tiene días de incapacidad/subsidio ISSS, genera automáticamente la fila adicional de SUBSIDIO (Código 12)
      if (Number(e.subsidyDays || 0) > 0) {
        const subAmt =
          Number(e.subsidyAmount || 0) > 0
            ? round2(Number(e.subsidyAmount))
            : round2((e.baseSalaryMonthly / 30) * Number(e.subsidyDays) * 0.75);
        list.push({
          rowNum: seq++,
          referencia: 'SUBSIDIO',
          nitEmpleador: parameters.employerNitDui.replace(/-/g, ''),
          numPatronalIsss: parameters.isssPatronalNumber,
          periodo: spuPeriodCode,
          centroTrabajo: e.workplaceCenter || parameters.workplaceCorrelative,
          numDocumento: e.docNumber.replace(/-/g, ''),
          tipoDocumento: e.docType.slice(0, 2),
          numAfiliacion: e.isssNumber,
          institucionPrevisional: e.afpInstitution.slice(0, 3),
          primerNombre: e.firstName,
          segundoNombre: e.secondName,
          primerApellido: e.firstLastName,
          segundoApellido: e.secondLastName,
          apellidoCasada: e.marriedLastName,
          salario: subAmt,
          pagoAdicional: 0,
          montoVacacion: 0,
          dias: Number(e.subsidyDays),
          horas: e.hoursPerDay || 8,
          diasVacacion: 0,
          codObs1: '12',
          codObs2: '01',
          departamento: e.department,
          cargo: e.position,
        });
      }
      void factor;
    }
    return list;
  }, [computedRows, frequency, parameters, spuPeriodCode]);

  // Resumen agrupado por Departamento con Subtotales y Total General
  const departmentSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        department: string;
        rows: typeof computedRows;
        subtotalDevengado: number;
        subtotalDeducciones: number;
        subtotalLiquido: number;
        subtotalPatronal: number;
        subtotalCostoEmpresa: number;
      }
    >();

    for (const r of computedRows) {
      const dept = r.emp.department || 'GENERAL';
      if (!map.has(dept)) {
        map.set(dept, {
          department: dept,
          rows: [],
          subtotalDevengado: 0,
          subtotalDeducciones: 0,
          subtotalLiquido: 0,
          subtotalPatronal: 0,
          subtotalCostoEmpresa: 0,
        });
      }
      const g = map.get(dept)!;
      g.rows.push(r);
      g.subtotalDevengado = round2(g.subtotalDevengado + r.totalDevengado);
      g.subtotalDeducciones = round2(g.subtotalDeducciones + r.totalDeducciones);
      g.subtotalLiquido = round2(g.subtotalLiquido + r.liquidoPagar);
      g.subtotalPatronal = round2(g.subtotalPatronal + r.totalPatronal);
      g.subtotalCostoEmpresa = round2(g.subtotalCostoEmpresa + r.costoTotalEmpresa);
    }

    return Array.from(map.values());
  }, [computedRows]);

  const updateEmployeeField = (empId: string, field: keyof PayrollEmployee, value: any) => {
    const next = employees.map((e) => (e.id === empId ? { ...e, [field]: value } : e));
    setEmployees(next);
    persistState(next, parameters, history);
  };

  const handleAddBonusItem = (empId: string) => {
    const amt = round2(parseFloat(draftBonusAmount) || 0);
    if (amt <= 0) {
      showToast('⚠️ Ingresa un monto mayor a $0.00 para guardar el bono.');
      return;
    }
    const concept = draftBonusConcept.trim() || 'Bono / Ingreso Adicional';
    const next = employees.map((e) => {
      if (e.id !== empId) return e;
      const existing: BonusItem[] =
        Array.isArray(e.bonusItems) && e.bonusItems.length > 0
          ? e.bonusItems
          : Number(e.otherIncome || 0) > 0
          ? [
              {
                id: `bon-legacy-${Date.now()}`,
                concept: e.otherIncomeNote || 'Bono / Ingreso Adicional',
                amount: round2(Number(e.otherIncome || 0)),
                taxable: e.otherIncomeTaxable !== false,
              },
            ]
          : [];
      const updatedItems: BonusItem[] = [
        ...existing,
        {
          id: `bon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          concept,
          amount: amt,
          taxable: draftBonusTaxable,
        },
      ];
      const totalBonus = round2(updatedItems.reduce((s, b) => s + Number(b.amount || 0), 0));
      const notes = updatedItems.map((b) => `${b.concept} ($${b.amount.toFixed(2)})`).join(', ');
      return {
        ...e,
        bonusItems: updatedItems,
        otherIncome: totalBonus,
        otherIncomeNote: notes,
        otherIncomeTaxable: draftBonusTaxable,
      };
    });
    setEmployees(next);
    setDraftBonusAmount('');
    setDraftBonusConcept('');
    persistState(next, parameters, history);
    showToast(`✅ Bono "${concept}" ($${amt.toFixed(2)}) guardado y detallado en la planilla.`);
  };

  const handleRemoveBonusItem = (empId: string, bonusId: string) => {
    const next = employees.map((e) => {
      if (e.id !== empId) return e;
      const current: BonusItem[] =
        Array.isArray(e.bonusItems) && e.bonusItems.length > 0
          ? e.bonusItems
          : Number(e.otherIncome || 0) > 0
          ? [
              {
                id: 'legacy-bonus',
                concept: e.otherIncomeNote || 'Bono / Ingreso Adicional',
                amount: round2(Number(e.otherIncome || 0)),
                taxable: e.otherIncomeTaxable !== false,
              },
            ]
          : [];
      const updatedItems = current.filter((b) => b.id !== bonusId);
      const totalBonus = round2(updatedItems.reduce((s, b) => s + Number(b.amount || 0), 0));
      const notes = updatedItems.map((b) => `${b.concept} ($${b.amount.toFixed(2)})`).join(', ');
      return {
        ...e,
        bonusItems: updatedItems,
        otherIncome: totalBonus,
        otherIncomeNote: notes,
      };
    });
    setEmployees(next);
    persistState(next, parameters, history);
    showToast('🗑️ Bono eliminado de la planilla.');
  };

  const handleClearEmployeeBonuses = (empId: string) => {
    const next = employees.map((e) =>
      e.id === empId
        ? { ...e, bonusItems: [], otherIncome: 0, otherIncomeNote: '' }
        : e
    );
    setEmployees(next);
    persistState(next, parameters, history);
    showToast('🧹 Bonos limpiados para este colaborador.');
  };

  const resetPeriodNovelties = () => {
    if (!confirm('¿Limpiar minutos tarde, ausencias, bonos y anticipos del período actual?')) return;
    const cleaned = employees.map((e) => ({
      ...e,
      daysOverride: null,
      absenceDays: 0,
      subsidyDays: 0,
      subsidyAmount: 0,
      tardyMinutes: 0,
      otherIncome: 0,
      otherIncomeNote: '',
      bonusItems: [],
      vacationAmount: 0,
      vacationDays: 0,
      otherDeductions: 0,
    }));
    setEmployees(cleaned);
    persistState(cleaned, parameters, history);
    showToast('✅ Novedades del período reiniciadas.');
  };

  // Exportar CSV Oficial SPU (21 columnas separadas por ;)
  const handleExportSpuCsv = () => {
    const lines = spuRows.map((r) =>
      [
        r.nitEmpleador,
        r.numPatronalIsss,
        r.periodo,
        r.centroTrabajo.slice(0, 3),
        r.numDocumento,
        r.tipoDocumento,
        r.numAfiliacion,
        r.institucionPrevisional,
        r.primerNombre,
        r.segundoNombre,
        r.primerApellido,
        r.segundoApellido,
        r.apellidoCasada,
        r.salario.toFixed(2),
        r.pagoAdicional.toFixed(2),
        r.montoVacacion.toFixed(2),
        r.dias,
        r.horas,
        r.diasVacacion,
        r.codObs1,
        r.codObs2,
      ].join(';')
    );
    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Planilla_Unica_SPU_${spuPeriodCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`📄 Archivo CSV para SPU (${spuPeriodCode}) descargado.`);
  };

  // Exportar CSV de Planilla Contable Quincenal/Mensual
  const handleExportAccountingCsv = () => {
    const headers = [
      'No.',
      'Empleado',
      'Cargo',
      'Departamento',
      'Base Mensual ($)',
      'Salario Diario ($)',
      'Fecha Inicio',
      'Fecha Fin',
      'Días Laborados',
      'Salario Ordinario ($)',
      'Minutos Tarde',
      'Desc. Tardías ($)',
      'Otros Ingresos ($)',
      'Vacaciones ($)',
      'Total Devengado ($)',
      'ISSS Laboral 3% ($)',
      'AFP Laboral 7.25% ($)',
      'Base Gravable ISR ($)',
      'Retención ISR ($)',
      'Otras Deducciones ($)',
      'Total Deducciones ($)',
      'Líquido a Pagar ($)',
      'ISSS Patronal 7.5% ($)',
      'AFP Patronal 8.75% ($)',
      'INCAF 1% ($)',
      'Total Aporte Patronal ($)',
      'Costo Total Empresa ($)',
    ];
    const rowsCsv = computedRows.map((r) =>
      [
        r.index,
        `"${r.emp.fullName}"`,
        `"${r.emp.position}"`,
        `"${r.emp.department}"`,
        r.baseMonthly.toFixed(2),
        r.dailySalaryDisplay.toFixed(2),
        periodStart,
        periodEnd,
        r.workedDays,
        r.ordinarySalary.toFixed(2),
        r.effectiveTardyMinutes,
        r.tardyDiscount.toFixed(2),
        r.otherIncome.toFixed(2),
        r.vacationAmount.toFixed(2),
        r.totalDevengado.toFixed(2),
        r.isssLab.toFixed(2),
        r.afpLab.toFixed(2),
        r.baseGravableIsr.toFixed(2),
        r.isr.toFixed(2),
        r.otherDeductions.toFixed(2),
        r.totalDeducciones.toFixed(2),
        r.liquidoPagar.toFixed(2),
        r.isssPat.toFixed(2),
        r.afpPat.toFixed(2),
        r.incafPat.toFixed(2),
        r.totalPatronal.toFixed(2),
        r.costoTotalEmpresa.toFixed(2),
      ].join(',')
    );
    rowsCsv.push(
      [
        'TOTALES',
        '""',
        '""',
        '""',
        totals.baseMonthly.toFixed(2),
        '',
        periodStart,
        periodEnd,
        '',
        totals.ordinarySalary.toFixed(2),
        '',
        totals.tardyDiscount.toFixed(2),
        totals.otherIncome.toFixed(2),
        totals.vacationAmount.toFixed(2),
        totals.totalDevengado.toFixed(2),
        totals.isssLab.toFixed(2),
        totals.afpLab.toFixed(2),
        totals.baseGravableIsr.toFixed(2),
        totals.isr.toFixed(2),
        totals.otherDeductions.toFixed(2),
        totals.totalDeducciones.toFixed(2),
        totals.liquidoPagar.toFixed(2),
        totals.isssPat.toFixed(2),
        totals.afpPat.toFixed(2),
        totals.incafPat.toFixed(2),
        totals.totalPatronal.toFixed(2),
        totals.costoTotalEmpresa.toFixed(2),
      ].join(',')
    );

    const content = '\uFEFF' + [headers.join(','), ...rowsCsv].join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Planilla_${frequency}_${periodStart}_al_${periodEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFormattedPeriodLabel = () => {
    const monthsEs = [
      'ENERO',
      'FEBRERO',
      'MARZO',
      'ABRIL',
      'MAYO',
      'JUNIO',
      'JULIO',
      'AGOSTO',
      'SEPTIEMBRE',
      'OCTUBRE',
      'NOVIEMBRE',
      'DICIEMBRE',
    ];
    const sMatch = periodStart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const eMatch = periodEnd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return sMatch && eMatch
      ? `PERIODO: DEL ${parseInt(sMatch[3], 10)} AL ${parseInt(eMatch[3], 10)} DE ${
          monthsEs[parseInt(eMatch[2], 10) - 1] || ''
        } ${eMatch[1]}`
      : `PERIODO: ${periodStart} AL ${periodEnd}`;
  };

  // Descargar Boletas de Pago en PDF listas para firmar
  const handlePrintPayslips = async (singleRow?: (typeof computedRows)[0]) => {
    const targetRows = singleRow ? [singleRow] : computedRows;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const periodLabel = getFormattedPeriodLabel();

    targetRows.forEach((r, idx) => {
      const slot = idx % 2;
      if (idx > 0 && slot === 0) {
        doc.addPage();
      }
      const startY = slot === 0 ? 14 : 146;

      // Marco de la boleta
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.roundedRect(14, startY, 188, 118, 3, 3);

      // Encabezado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(parameters.employerName, 20, startY + 9);

      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`BOLETA DE PAGO DE SUELDO • ${periodLabel}`, 20, startY + 14.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 27, 75);
      doc.text(`No. ${r.index}`, 196, startY + 9, { align: 'right' });

      // Línea divisoria encabezado
      doc.setDrawColor(226, 232, 240);
      doc.line(20, startY + 17.5, 196, startY + 17.5);

      // Datos del Empleado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`EMPLEADO: ${r.emp.fullName}`, 20, startY + 24);
      doc.text(`DOCUMENTO: ${r.emp.docNumber}`, 196, startY + 24, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Cargo / Depto.: ${r.emp.position} (${r.emp.department})   •   Sueldo Base Mensual: $${r.baseMonthly.toFixed(2)}`,
        20,
        startY + 29.5
      );
      doc.text(`Días Laborados: ${r.workedDays}`, 196, startY + 29.5, { align: 'right' });

      // Caja Izquierda: Ingresos Devengados
      const boxY = startY + 34;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(20, boxY, 85, 44, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('INGRESOS Y SUJETO A COTIZACIÓN', 24, boxY + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Salario del Período (${r.workedDays} días):`, 24, boxY + 14);
      doc.text(`$${r.ordinarySalary.toFixed(2)}`, 101, boxY + 14, { align: 'right' });

      doc.text('Vacación:', 24, boxY + 20.5);
      doc.text(`$${r.vacationAmount.toFixed(2)}`, 101, boxY + 20.5, { align: 'right' });

      doc.text('Bonos / Ingresos Adic.:', 24, boxY + 27);
      doc.text(`$${r.otherIncome.toFixed(2)}`, 101, boxY + 27, { align: 'right' });

      doc.setDrawColor(148, 163, 184);
      doc.line(24, boxY + 32, 101, boxY + 32);

      doc.setFont('helvetica', 'bold');
      doc.text('INGRESO SUJETO COTIZ.:', 24, boxY + 38.5);
      doc.text(`$${r.totalDevengado.toFixed(2)}`, 101, boxY + 38.5, { align: 'right' });

      // Detalle de conceptos de bonos debajo de las cajas si tiene bonos registrados
      if (r.bonusItems && r.bonusItems.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(6, 95, 70);
        const detailStr = `Detalle de Bonos / Adicionales: ${r.bonusItems
          .map((b) => `${b.concept}: $${Number(b.amount).toFixed(2)}${b.taxable === false ? ' (Neto)' : ''}`)
          .join('  •  ')}`;
        doc.text(detailStr.slice(0, 115), 20, startY + 80.8);
      }

      // Caja Derecha: Retenciones Legales y Descuentos
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(111, boxY, 85, 44, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('RETENCIONES LEGALES Y DESCUENTOS', 115, boxY + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.text('ISSS Laboral (3.00%):', 115, boxY + 13.5);
      doc.text(`$${r.isssLab.toFixed(2)}`, 192, boxY + 13.5, { align: 'right' });

      doc.text('AFP Laboral (7.25%):', 115, boxY + 19.5);
      doc.text(`$${r.afpLab.toFixed(2)}`, 192, boxY + 19.5, { align: 'right' });

      doc.text('Ing. Sujeto a Ret. Renta:', 115, boxY + 25.5);
      doc.text(`$${r.baseGravableIsr.toFixed(2)}`, 192, boxY + 25.5, { align: 'right' });

      doc.text('Retención Renta (ISR):', 115, boxY + 31.5);
      doc.text(`$${r.isr.toFixed(2)}`, 192, boxY + 31.5, { align: 'right' });

      doc.setDrawColor(148, 163, 184);
      doc.line(115, boxY + 34, 192, boxY + 34);

      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL RETENC. Y DESC.:', 115, boxY + 39.5);
      doc.text(`$${r.totalDeducciones.toFixed(2)}`, 192, boxY + 39.5, { align: 'right' });

      // Franja de Valor Neto Cancelado
      const netY = startY + 82;
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(110, 231, 183);
      doc.roundedRect(20, netY, 176, 11, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(6, 95, 70);
      doc.text('VALOR NETO CANCELADO / LÍQUIDO A RECIBIR:', 25, netY + 7.2);
      doc.text(`$${r.liquidoPagar.toFixed(2)}`, 191, netY + 7.2, { align: 'right' });

      // Líneas de Firma
      const sigY = startY + 108;
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.3);
      doc.line(25, sigY, 95, sigY);
      doc.line(115, sigY, 190, sigY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`AUTORIZÓ / ${parameters.employerName}`, 60, sigY + 4.5, { align: 'center' });
      doc.text(
        `RECIBÍ CONFORME: ${r.emp.fullName} (${r.emp.docNumber})`,
        152.5,
        sigY + 4.5,
        { align: 'center' }
      );

      // Línea punteada de corte entre las 2 boletas de la página
      if (slot === 0 && idx < targetRows.length - 1) {
        doc.setDrawColor(203, 213, 225);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(10, 139, 206, 139);
        doc.setLineDashPattern([], 0);
      }
    });

    const filename = singleRow
      ? `Boleta_${singleRow.emp.fullName.replace(/\s+/g, '_')}_${periodStart}_al_${periodEnd}.pdf`
      : `Boletas_de_Pago_Grupo_KODE_${periodStart}_al_${periodEnd}.pdf`;
    doc.save(filename);
    showToast(`📄 ${filename} descargado.`);
  };

  // Descargar Tabla Consolidada de Planilla en PDF con columna de FIRMA
  const handlePrintOfficialPayrollSheet = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const periodLabel = getFormattedPeriodLabel();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(parameters.employerName, 139.7, 16, { align: 'center' });

    doc.setFontSize(11.5);
    doc.text('PLANILLA DE SUELDO', 139.7, 22, { align: 'center' });

    doc.setFontSize(10);
    doc.text(periodLabel, 139.7, 27.5, { align: 'center' });

    autoTable(doc, {
      startY: 33,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        valign: 'middle',
        lineColor: [51, 65, 85],
        lineWidth: 0.25,
      },
      bodyStyles: {
        textColor: [15, 23, 42],
        fontSize: 8.5,
        valign: 'middle',
        minCellHeight: 14,
        lineColor: [51, 65, 85],
        lineWidth: 0.25,
      },
      footStyles: {
        fillColor: [248, 250, 252],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 8.5,
        valign: 'middle',
        minCellHeight: 10,
        lineColor: [51, 65, 85],
        lineWidth: 0.25,
      },
      head: [
        [
          { content: 'No.', rowSpan: 2 },
          { content: 'NOMBRE DE EMPLEADO', rowSpan: 2 },
          { content: 'No. de\nDocumento', rowSpan: 2 },
          { content: 'No.\nDIAS', rowSpan: 2 },
          { content: 'SALARIO DEL\nPERIODO', rowSpan: 2 },
          { content: totals.otherIncome > 0 ? 'VACACION /\nBONOS' : 'VACACION', rowSpan: 2 },
          { content: 'INGRESO SUJETO\nCOTIZACIONES', rowSpan: 2 },
          { content: 'RETENCIONES LEGALES Y DESCUENTOS', colSpan: 4 },
          { content: 'TOTAL RETENC.\nY DESC.', rowSpan: 2 },
          { content: 'VALOR NETO\nCANCELADO', rowSpan: 2 },
          { content: 'FIRMA', rowSpan: 2 },
        ],
        ['ISSS', 'AFP', 'ING. SUJETO A\nRET. RENTA', 'RENTA'],
      ],
      body: computedRows.map((r) => [
        r.index.toString(),
        r.bonusItems && r.bonusItems.length > 0
          ? `${r.emp.fullName}\nBonos: ${r.bonusItems
              .map((b) => `${b.concept} ($${Number(b.amount).toFixed(2)})`)
              .join(', ')}`
          : r.emp.fullName,
        r.emp.docNumber,
        r.workedDays.toString(),
        `$${r.ordinarySalary.toFixed(2)}`,
        `$${round2(r.vacationAmount + r.otherIncome).toFixed(2)}`,
        `$${r.totalDevengado.toFixed(2)}`,
        `$${r.isssLab.toFixed(2)}`,
        `$${r.afpLab.toFixed(2)}`,
        `$${r.baseGravableIsr.toFixed(2)}`,
        `$${r.isr.toFixed(2)}`,
        `$${r.totalDeducciones.toFixed(2)}`,
        `$${r.liquidoPagar.toFixed(2)}`,
        '',
      ]),
      foot: [
        [
          '',
          { content: 'TOTALES……………………………………', colSpan: 3, styles: { halign: 'left' } },
          `$${totals.ordinarySalary.toFixed(2)}`,
          `$${round2(totals.vacationAmount + totals.otherIncome).toFixed(2)}`,
          `$${totals.totalDevengado.toFixed(2)}`,
          `$${totals.isssLab.toFixed(2)}`,
          `$${totals.afpLab.toFixed(2)}`,
          `$${totals.baseGravableIsr.toFixed(2)}`,
          `$${totals.isr.toFixed(2)}`,
          `$${totals.totalDeducciones.toFixed(2)}`,
          `$${totals.liquidoPagar.toFixed(2)}`,
          '',
        ],
      ],
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'left', cellWidth: 44, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 10 },
        4: { halign: 'right', cellWidth: 17 },
        5: { halign: 'right', cellWidth: 13 },
        6: { halign: 'right', cellWidth: 19 },
        7: { halign: 'right', cellWidth: 14 },
        8: { halign: 'right', cellWidth: 14 },
        9: { halign: 'right', cellWidth: 18 },
        10: { halign: 'right', cellWidth: 13 },
        11: { halign: 'right', cellWidth: 17 },
        12: { halign: 'right', cellWidth: 19, fontStyle: 'bold' },
        13: { halign: 'center', cellWidth: 33 },
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 140;
    const sigY = Math.min(195, finalY + 26);

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.35);
    doc.line(45, sigY, 115, sigY);
    doc.line(165, sigY, 235, sigY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('ELABORÓ', 80, sigY + 5, { align: 'center' });
    doc.text('AUTORIZÓ', 200, sigY + 5, { align: 'center' });

    const filename = `Planilla_Consolidada_Firmas_Grupo_KODE_${periodStart}_al_${periodEnd}.pdf`;
    doc.save(filename);
    showToast(`📄 ${filename} descargado.`);
  };

  // Guardar Planilla actual en el Historial
  const handleSaveSnapshot = () => {
    const snap: SavedPayrollSnapshot = {
      id: `planilla-${Date.now()}`,
      title: `Planilla ${frequency === 'QUINCENAL' ? 'Quincenal' : 'Mensual'} (${periodStart} al ${periodEnd})`,
      frequency,
      periodStart,
      periodEnd,
      cutoffStart,
      cutoffEnd,
      spuPeriod: spuPeriodCode,
      savedAt: new Date().toISOString(),
      totals: {
        baseMonthly: totals.baseMonthly,
        totalDevengado: totals.totalDevengado,
        isssLab: totals.isssLab,
        afpLab: totals.afpLab,
        isr: totals.isr,
        totalDeducciones: totals.totalDeducciones,
        liquidoPagar: totals.liquidoPagar,
        isssPat: totals.isssPat,
        afpPat: totals.afpPat,
        incafPat: totals.incafPat,
        totalPatronal: totals.totalPatronal,
        costoTotalEmpresa: totals.costoTotalEmpresa,
      },
      employees: JSON.parse(JSON.stringify(employees)),
    };
    const nextHistory = [snap, ...history];
    setHistory(nextHistory);
    persistState(employees, parameters, nextHistory);
    showToast('✅ Planilla guardada en el historial.');
  };

  const handleOpenNewEmployee = () => {
    const nextNum = String(employees.length + 1).padStart(3, '0');
    setEditingEmp({
      id: `emp-${Date.now()}`,
      code: nextNum,
      firstName: '',
      secondName: '',
      firstLastName: '',
      secondLastName: '',
      marriedLastName: '',
      fullName: '',
      gender: 'MASCULINO',
      hireDate: new Date().toISOString().slice(0, 10),
      position: 'Vendedor',
      department: 'VENTA',
      jornadaId: jornadas[0]?.id || 'jor-gerencia',
      docType: '01 DUI',
      docNumber: '00000000-0',
      isssNumber: 'ISSS00000',
      afpInstitution: 'COF - AFP CONFÍA',
      baseSalaryMonthly: 425.0,
      hoursPerDay: 8,
      workplaceCenter: parameters.workplaceCorrelative,
      obsCode1: '01 Sin cambios con respecto al mes anterior',
      obsCode2: '00 Sin Cambios',
      daysOverride: null,
      absenceDays: 0,
      subsidyDays: 0,
      subsidyAmount: 0,
      tardyMinutes: 0,
      otherIncome: 0,
      vacationAmount: 0,
      vacationDays: 0,
      otherDeductions: 0,
    });
    setIsEmpModalOpen(true);
  };

  // ================= LÓGICA DE JORNADAS Y CRUCE DE MARCACIONES (ESTILO ASEINFO EVOLUTION) =================
  const selectedJornada = useMemo(() => {
    return jornadas.find((j) => j.id === selectedJornadaId) || jornadas[0] || DEFAULT_JORNADAS[0];
  }, [jornadas, selectedJornadaId]);

  const handleCreateJornada = () => {
    const nextNum = jornadas.length + 1;
    const newJor: WorkJornada = {
      id: `jor-${Date.now()}`,
      code: `JOR-0${nextNum}`,
      name: `Nueva Jornada ${nextNum}`,
      description: 'Horario semanal personalizado para cruce de marcaciones',
      graceMinutesEntrada: 0,
      graceMinutesAlmuerzo: 0,
      days: buildStandardWeekDays('08:00', '12:00', '13:00', '17:00', '08:00', '12:00'),
    };
    const next = [...jornadas, newJor];
    setJornadas(next);
    setSelectedJornadaId(newJor.id);
    persistState(employees, parameters, history, { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency }, next, punchRecords);
    showToast(`✅ Jornada "${newJor.name}" creada.`);
  };

  const handleDuplicateJornada = () => {
    if (!selectedJornada) return;
    const copy: WorkJornada = {
      ...JSON.parse(JSON.stringify(selectedJornada)),
      id: `jor-${Date.now()}`,
      code: `${selectedJornada.code}-COPIA`,
      name: `${selectedJornada.name} (Copia)`,
    };
    const next = [...jornadas, copy];
    setJornadas(next);
    setSelectedJornadaId(copy.id);
    persistState(employees, parameters, history, { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency }, next, punchRecords);
    showToast(`✅ Jornada duplicada como "${copy.name}".`);
  };

  const handleDeleteJornada = (jorId: string) => {
    if (jornadas.length <= 1) {
      showToast('⚠️ Debe existir al menos una jornada configurada.');
      return;
    }
    const target = jornadas.find((j) => j.id === jorId);
    if (!target) return;
    if (!confirm(`¿Eliminar la jornada "${target.name}"?`)) return;
    const next = jornadas.filter((j) => j.id !== jorId);
    setJornadas(next);
    setSelectedJornadaId(next[0].id);
    persistState(employees, parameters, history, { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency }, next, punchRecords);
    showToast(`🗑️ Jornada "${target.name}" eliminada.`);
  };

  const updateSelectedJornadaField = <K extends keyof WorkJornada>(field: K, value: WorkJornada[K]) => {
    const next = jornadas.map((j) => (j.id === selectedJornada.id ? { ...j, [field]: value } : j));
    setJornadas(next);
  };

  const updateSelectedJornadaDay = (
    dayOfWeek: number,
    field: keyof JornadaDaySchedule,
    value: string | boolean
  ) => {
    const next = jornadas.map((j) => {
      if (j.id !== selectedJornada.id) return j;
      return {
        ...j,
        days: j.days.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)),
      };
    });
    setJornadas(next);
  };

  const copyMondayToWeekdays = () => {
    const monday = selectedJornada.days.find((d) => d.dayOfWeek === 1);
    if (!monday) return;
    const next = jornadas.map((j) => {
      if (j.id !== selectedJornada.id) return j;
      return {
        ...j,
        days: j.days.map((d) =>
          d.dayOfWeek >= 2 && d.dayOfWeek <= 5
            ? {
                ...d,
                isWorkDay: monday.isWorkDay,
                entradaTurno: monday.entradaTurno,
                hasLunch: monday.hasLunch,
                salidaAlmuerzo: monday.salidaAlmuerzo,
                entradaAlmuerzo: monday.entradaAlmuerzo,
                salidaTurno: monday.salidaTurno,
              }
            : d
        ),
      };
    });
    setJornadas(next);
    persistState(employees, parameters, history, { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency }, next, punchRecords);
    showToast('✅ Horario del Lunes aplicado de Martes a Viernes.');
  };

  const handleAssignEmployeeJornada = (empId: string, jorId: string) => {
    const next = employees.map((emp) => (emp.id === empId ? { ...emp, jornadaId: jorId } : emp));
    setEmployees(next);
    persistState(next, parameters, history, { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency }, jornadas, punchRecords);
  };

  // Fechas del período de corte activo para el cruce de marcaciones
  const cutoffDates = useMemo(() => {
    return getDatesInRange(cutoffStart, cutoffEnd);
  }, [cutoffStart, cutoffEnd]);

  const selectedPunchEmp = useMemo(() => {
    return employees.find((e) => e.id === selectedPunchEmpId) || employees[0];
  }, [employees, selectedPunchEmpId]);

  const updatePunchField = (
    empId: string,
    dateStr: string,
    field: keyof DailyPunchRecord,
    value: string
  ) => {
    const key = `${empId}_${dateStr}`;
    const existing = punchRecords[key] || {
      marcacionEntrada: '',
      marcacionSalidaAlmuerzo: '',
      marcacionEntradaAlmuerzo: '',
      marcacionSalidaTurno: '',
    };
    const nextPunches = {
      ...punchRecords,
      [key]: {
        ...existing,
        [field]: value,
      },
    };
    setPunchRecords(nextPunches);
  };

  const fillOnTimePunchesForEmployee = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const jor = jornadas.find((j) => j.id === emp.jornadaId) || jornadas[0] || DEFAULT_JORNADAS[0];
    const nextPunches = { ...punchRecords };
    for (const dateStr of cutoffDates) {
      const dow = new Date(`${dateStr}T00:00:00`).getDay();
      const daySched = jor.days.find((d) => d.dayOfWeek === dow);
      if (daySched && daySched.isWorkDay) {
        nextPunches[`${empId}_${dateStr}`] = {
          marcacionEntrada: daySched.entradaTurno,
          marcacionSalidaAlmuerzo: daySched.hasLunch ? daySched.salidaAlmuerzo : '',
          marcacionEntradaAlmuerzo: daySched.hasLunch ? daySched.entradaAlmuerzo : '',
          marcacionSalidaTurno: daySched.salidaTurno,
        };
      }
    }
    setPunchRecords(nextPunches);
    persistState(employees, parameters, history, { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency }, jornadas, nextPunches);
    showToast(`✅ Horario puntual precargado para ${emp.fullName}. Edita solo las marcaciones con retraso.`);
  };

  const clearPunchesForEmployee = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const nextPunches = { ...punchRecords };
    for (const dateStr of cutoffDates) {
      delete nextPunches[`${empId}_${dateStr}`];
    }
    setPunchRecords(nextPunches);
    persistState(employees, parameters, history, { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency }, jornadas, nextPunches);
    showToast(`🧹 Marcaciones del corte limpiadas para ${emp.fullName}.`);
  };

  // Resumen de cruce de marcaciones por empleado en el corte actual
  const crossedSummaryByEmp = useMemo(() => {
    const map: Record<
      string,
      {
        totalMinTardeEntrada: number;
        totalMinSalidaAntesAlmuerzo: number;
        totalMinTardeEntradaAlmuerzo: number;
        totalMinSalidaAntesTurno: number;
        totalMinutosDescuento: number;
        totalMontoDescuento: number;
        daysWithPunches: number;
      }
    > = {};

    for (const emp of employees) {
      const jor = jornadas.find((j) => j.id === emp.jornadaId) || jornadas[0] || DEFAULT_JORNADAS[0];
      let totalMinTardeEntrada = 0;
      let totalMinSalidaAntesAlmuerzo = 0;
      let totalMinTardeEntradaAlmuerzo = 0;
      let totalMinSalidaAntesTurno = 0;
      let totalMinutosDescuento = 0;
      let daysWithPunches = 0;

      for (const dateStr of cutoffDates) {
        const dow = new Date(`${dateStr}T00:00:00`).getDay();
        const daySched = jor.days.find((d) => d.dayOfWeek === dow);
        const punch = punchRecords[`${emp.id}_${dateStr}`];
        if (
          punch &&
          (punch.marcacionEntrada ||
            punch.marcacionSalidaAlmuerzo ||
            punch.marcacionEntradaAlmuerzo ||
            punch.marcacionSalidaTurno)
        ) {
          daysWithPunches++;
        }
        const cross = crossDayPunch(
          daySched,
          punch,
          jor.graceMinutesEntrada,
          jor.graceMinutesAlmuerzo,
          jor.lunchEvaluationMode || 'DURATION'
        );
        totalMinTardeEntrada += cross.minTardeEntrada;
        totalMinSalidaAntesAlmuerzo += cross.minSalidaAntesAlmuerzo;
        totalMinTardeEntradaAlmuerzo += cross.minTardeEntradaAlmuerzo;
        totalMinSalidaAntesTurno += cross.minSalidaAntesTurno;
        totalMinutosDescuento += cross.totalMinutosDescuento;
      }

      const totalMontoDescuento = round2((emp.baseSalaryMonthly / 14400) * totalMinutosDescuento);
      map[emp.id] = {
        totalMinTardeEntrada,
        totalMinSalidaAntesAlmuerzo,
        totalMinTardeEntradaAlmuerzo,
        totalMinSalidaAntesTurno,
        totalMinutosDescuento,
        totalMontoDescuento,
        daysWithPunches,
      };
    }

    return map;
  }, [employees, jornadas, cutoffDates, punchRecords]);

  const applySingleEmpCrossToPayroll = (empId: string) => {
    const summary = crossedSummaryByEmp[empId];
    const emp = employees.find((e) => e.id === empId);
    if (!summary || !emp) return;
    const nextEmployees = employees.map((e) =>
      e.id === empId ? { ...e, tardyMinutes: summary.totalMinutosDescuento } : e
    );
    setEmployees(nextEmployees);
    persistState(nextEmployees, parameters, history, { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency }, jornadas, punchRecords);
    showToast(
      `✅ ${emp.fullName}: ${summary.totalMinutosDescuento} min ($${summary.totalMontoDescuento.toFixed(2)}) enviados a la Planilla Quincenal.`
    );
  };

  const applyAllCrossedToPayroll = () => {
    const nextEmployees = employees.map((e) => {
      const s = crossedSummaryByEmp[e.id];
      if (!s || s.daysWithPunches === 0) return e;
      return { ...e, tardyMinutes: s.totalMinutosDescuento };
    });
    setEmployees(nextEmployees);
    persistState(nextEmployees, parameters, history, { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency }, jornadas, punchRecords);
    showToast('✅ Todos los cruces de marcaciones fueron aplicados a la Planilla Quincenal.');
  };

  const handleImportBulkCsvPunches = () => {
    if (!bulkPunchCsvText.trim()) return;
    const lines = bulkPunchCsvText.trim().split(/\r?\n/);
    const nextPunches = { ...punchRecords };
    let count = 0;
    for (const rawLine of lines) {
      const cols = rawLine.split(/[;,\t]/).map((c) => c.trim());
      if (cols.length < 3) continue;
      // Formato esperado: CodigoONombre, YYYY-MM-DD, Entrada, SalidaAlmuerzo, EntradaAlmuerzo, SalidaTurno
      const empRef = cols[0].toLowerCase();
      const dateStr = cols[1];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
      const emp =
        employees.find(
          (e) =>
            e.code.toLowerCase() === empRef ||
            e.fullName.toLowerCase().includes(empRef) ||
            e.id.toLowerCase() === empRef
        ) || selectedPunchEmp;
      if (!emp) continue;
      nextPunches[`${emp.id}_${dateStr}`] = {
        marcacionEntrada: cols[2] || '',
        marcacionSalidaAlmuerzo: cols[3] || '',
        marcacionEntradaAlmuerzo: cols[4] || '',
        marcacionSalidaTurno: cols[5] || '',
      };
      count++;
    }
    setPunchRecords(nextPunches);
    setShowBulkPunchModal(false);
    setBulkPunchCsvText('');
    persistState(employees, parameters, history, { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency }, jornadas, nextPunches);
    showToast(`✅ ${count} registros de marcación importados y cruzados contra sus jornadas.`);
  };

  const handleSaveEmployeeModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    const composedName =
      editingEmp.fullName.trim() ||
      [editingEmp.firstName, editingEmp.secondName, editingEmp.firstLastName, editingEmp.secondLastName]
        .filter(Boolean)
        .join(' ');
    const normalized: PayrollEmployee = {
      ...editingEmp,
      fullName: composedName || 'Empleado',
      firstName: editingEmp.firstName || composedName.split(' ')[0]?.toUpperCase() || '',
    };
    const exists = employees.some((emp) => emp.id === normalized.id);
    const next = exists
      ? employees.map((emp) => (emp.id === normalized.id ? normalized : emp))
      : [...employees, normalized];
    setEmployees(next);
    setIsEmpModalOpen(false);
    setEditingEmp(null);
    persistState(next, parameters, history);
    showToast(exists ? '✅ Empleado actualizado.' : '✅ Empleado agregado a la planilla.');
  };

  const handleDeleteEmployee = (empId: string) => {
    const target = employees.find((e) => e.id === empId);
    if (!target) return;
    if (!confirm(`¿Eliminar a "${target.fullName}" de la planilla?`)) return;
    const next = employees.filter((e) => e.id !== empId);
    setEmployees(next);
    persistState(next, parameters, history);
    showToast('🗑️ Empleado eliminado.');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-black flex items-center gap-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Encabezado Principal Estilo Mecanic OS */}
      <div
        className="clay-card-dark p-5 text-white relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0f172a 100%)' }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-black uppercase tracking-wider">
                🇸🇻 Legislación Laboral & Tributaria Vigente (D.L. N.° 10)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-[10.5px] font-bold">
                Mes Comercial 30 Días • SPU ISSS/AFP
              </span>
              {isSavingServer && (
                <span className="text-[10px] text-amber-300 font-bold animate-pulse">
                  Guardando cambios...
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Planilla Salarial Automatizada & Planilla Única (SPU)
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Cálculo exacto al centavo (`ROUND 2`) de ISSS (3% / 7.5%), AFP (7.25% / 8.75%), ISR vigente (exento hasta $275 quincenal / $550 mensual), llegadas tardías y generador CSV oficial SPU.
            </p>
          </div>

          {/* Selector de Subpestañas */}
          <div className="flex flex-wrap bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 gap-1">
            <button
              type="button"
              onClick={() => setSubTab('quincenal')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subTab === 'quincenal'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Planilla {frequency === 'QUINCENAL' ? 'Quincenal' : 'Mensual'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('jornadas')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subTab === 'jornadas'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Jornadas & Marcaciones</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('spu')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subTab === 'spu'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Planilla Única (SPU CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('resumen')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subTab === 'resumen'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Depto. & Historial ({history.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('parametros')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subTab === 'parametros'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Tablas y Parámetros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Ejecutivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="clay-card p-3.5 border-l-4 border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Base Mensual ({employees.length} emp.)</span>
          <span className="text-lg font-black font-mono text-slate-800 mt-0.5 block">
            ${totals.baseMonthly.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            INCAF 1%: {appliesIncaf ? 'Activo (≥10 emp)' : 'Exento (<10 emp)'}
          </span>
        </div>

        <div className="clay-card p-3.5 border-l-4 border-indigo-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Devengado</span>
          <span className="text-lg font-black font-mono text-indigo-700 mt-0.5 block">
            ${totals.totalDevengado.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            {defaultCommercialDays} días comerciales (base 30)
          </span>
        </div>

        <div className="clay-card p-3.5 border-l-4 border-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">ISSS + AFP Laboral</span>
          <span className="text-lg font-black font-mono text-amber-700 mt-0.5 block">
            ${round2(totals.isssLab + totals.afpLab).toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            ISSS: ${totals.isssLab.toFixed(2)} • AFP: ${totals.afpLab.toFixed(2)}
          </span>
        </div>

        <div className="clay-card p-3.5 border-l-4 border-rose-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Retención Renta (ISR)</span>
          <span className="text-lg font-black font-mono text-rose-700 mt-0.5 block">
            ${totals.isr.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Total Deduc.: ${totals.totalDeducciones.toFixed(2)}
          </span>
        </div>

        <div className="clay-card p-3.5 border-l-4 border-emerald-500 bg-emerald-50/40">
          <span className="text-[10px] font-black text-emerald-800 uppercase block">Líquido a Depositar</span>
          <span className="text-xl font-black font-mono text-emerald-700 mt-0.5 block">
            ${totals.liquidoPagar.toFixed(2)}
          </span>
          <span className="text-[10px] text-emerald-800 font-bold">
            Pago neto a empleados
          </span>
        </div>

        <div className="clay-card p-3.5 border-l-4 border-purple-600">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Costo Total Empresa</span>
          <span className="text-lg font-black font-mono text-purple-700 mt-0.5 block">
            ${totals.costoTotalEmpresa.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Patronal: ${totals.totalPatronal.toFixed(2)} (ISSS ${totals.isssPat.toFixed(2)} / AFP ${totals.afpPat.toFixed(2)})
          </span>
        </div>
      </div>

      {/* ================= SUBPESTAÑA 1: PLANILLA QUINCENAL / MENSUAL ================= */}
      {subTab === 'quincenal' && (() => {
        const activeIdx = Math.max(
          0,
          computedRows.findIndex((r) => r.emp.id === selectedWorkEmpId)
        );
        const activeRow = computedRows[activeIdx] || computedRows[0];

        return (
          <div className="space-y-4">
            {/* Barra de Período y Botones Principales de Generación de Documentos */}
            <div className="clay-card p-4 space-y-3 bg-white">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Período de Planilla:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPresetPeriod('OCT_18')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      frequency === 'MENSUAL' && periodStart.endsWith('-14')
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    Planilla 14 al 31 Oct (18 días • Tabla Base)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetPeriod('MONTH')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      frequency === 'MENSUAL' && periodStart.endsWith('-01')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Planilla Mensual (30 días)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetPeriod('Q1')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      frequency === 'QUINCENAL' && periodStart.endsWith('-01')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    1.ª Quincena (01 al 15)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetPeriod('Q2')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      frequency === 'QUINCENAL' && periodStart.endsWith('-16')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    2.ª Quincena (16 a Fin de Mes)
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintOfficialPayrollSheet}
                    className="clay-btn clay-btn-primary px-3.5 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    title="Descargar PDF de Tabla Consolidada de Planilla con columna de FIRMA (formato Grupo KODE S.A.S. de C.V.)"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>PDF Planilla Consolidada (Firmas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintPayslips()}
                    className="clay-btn clay-btn-success px-3.5 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    title="Descargar PDF de todas las Boletas de Pago listas para firmar"
                  >
                    <Printer className="w-4 h-4" />
                    <span>PDF Boletas de Pago ({computedRows.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenNewEmployee}
                    className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Empleado</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetPeriodNovelties}
                    className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    title="Reiniciar bonos, tardías y anticipos a cero"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Limpiar Adicionales</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSnapshot}
                    className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-indigo-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar en Historial</span>
                  </button>
                </div>
              </div>

              {/* Fechas del Período */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Inicio Período Salario (F)
                  </label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => {
                      setPeriodStart(e.target.value);
                      persistState(employees, parameters, history, {
                        periodStart: e.target.value,
                        periodEnd,
                        cutoffStart,
                        cutoffEnd,
                        paymentDate,
                        frequency,
                      });
                    }}
                    className="clay-input w-full py-1 px-2 text-xs font-mono font-bold"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Fin Período Salario (G)
                  </label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => {
                      setPeriodEnd(e.target.value);
                      persistState(employees, parameters, history, {
                        periodStart,
                        periodEnd: e.target.value,
                        cutoffStart,
                        cutoffEnd,
                        paymentDate,
                        frequency,
                      });
                    }}
                    className="clay-input w-full py-1 px-2 text-xs font-mono font-bold"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
                  <label className="text-[10px] font-black text-amber-800 uppercase block mb-1">
                    Inicio Corte Novedades/Tardías
                  </label>
                  <input
                    type="date"
                    value={cutoffStart}
                    onChange={(e) => setCutoffStart(e.target.value)}
                    className="clay-input w-full py-1 px-2 text-xs font-mono font-bold"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
                  <label className="text-[10px] font-black text-amber-800 uppercase block mb-1">
                    Fin Corte Novedades
                  </label>
                  <input
                    type="date"
                    value={cutoffEnd}
                    onChange={(e) => setCutoffEnd(e.target.value)}
                    className="clay-input w-full py-1 px-2 text-xs font-mono font-bold"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-indigo-800 uppercase block">
                    Días del Período
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-black font-mono text-indigo-700">
                      {defaultCommercialDays} días
                    </span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-900 font-bold">
                      SPU: {spuPeriodCode}
                    </span>
                  </div>
                  <span className="text-[9.5px] text-indigo-700 font-medium">
                    {getFormattedPeriodLabel()}
                  </span>
                </div>
              </div>
            </div>

            {/* ================= PASO 1: TRABAJAR COLABORADOR UNO POR UNO ================= */}
            {activeRow && (
              <div className="clay-card p-5 bg-white border-2 border-indigo-100 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
                      Paso 1 • Trabajar Planilla Individual ({activeIdx + 1} de {computedRows.length})
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">
                      Selecciona cada colaborador para ajustar días, bonos o ingresos adicionales
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prevIdx =
                          (activeIdx - 1 + computedRows.length) % computedRows.length;
                        setSelectedWorkEmpId(computedRows[prevIdx].emp.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer"
                    >
                      ◀ Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextIdx = (activeIdx + 1) % computedRows.length;
                        setSelectedWorkEmpId(computedRows[nextIdx].emp.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
                    >
                      Siguiente Colaborador ▶
                    </button>
                  </div>
                </div>

                {/* Pestañas / Tarjetas de los 5 Colaboradores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {computedRows.map((r) => {
                    const isSelected = r.emp.id === activeRow.emp.id;
                    return (
                      <button
                        key={r.emp.id}
                        type="button"
                        onClick={() => setSelectedWorkEmpId(r.emp.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-950 text-white border-indigo-900 shadow-md ring-2 ring-indigo-500/40'
                            : 'bg-slate-50/90 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-indigo-800 text-indigo-200'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              #{r.index} • {r.workedDays}d
                            </span>
                            {r.otherIncome > 0 && (
                              <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                                +${r.otherIncome.toFixed(2)} Bono
                              </span>
                            )}
                          </div>
                          <div className="font-black text-xs mt-1.5 truncate">{r.emp.fullName}</div>
                          <div
                            className={`text-[10px] font-semibold ${
                              isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {r.emp.position} • Base ${r.baseMonthly.toFixed(0)}
                          </div>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-200/30 flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold ${
                              isSelected ? 'text-emerald-300' : 'text-slate-500'
                            }`}
                          >
                            Neto a Pagar:
                          </span>
                          <span
                            className={`text-sm font-mono font-black ${
                              isSelected ? 'text-emerald-300' : 'text-emerald-700'
                            }`}
                          >
                            ${r.liquidoPagar.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Panel de Edición del Colaborador Seleccionado + Vista Previa de su Boleta */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                  {/* Columna Izquierda (7 cols): Formulario Intuitivo de Ingresos Adicionales, Días y Descuentos */}
                  <div className="lg:col-span-7 space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] font-black uppercase text-indigo-600 block">
                          Editando Colaborador #{activeRow.index}
                        </span>
                        <h4 className="text-lg font-black text-slate-900">
                          {activeRow.emp.fullName}
                        </h4>
                        <span className="text-xs text-slate-500 font-semibold">
                          Documento: <strong className="font-mono">{activeRow.emp.docNumber}</strong> • Cargo:{' '}
                          <strong>{activeRow.emp.position}</strong> ({activeRow.emp.department})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmp({ ...activeRow.emp });
                          setIsEmpModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Datos Personales / DUI</span>
                      </button>
                    </div>

                    {/* Bloque 1: Sueldo Base y Días Trabajados */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                          Sueldo Base Mensual ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={activeRow.emp.baseSalaryMonthly || ''}
                          placeholder="0.00"
                          onChange={(e) =>
                            updateEmployeeField(
                              activeRow.emp.id,
                              'baseSalaryMonthly',
                              e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            )
                          }
                          className="clay-input w-full py-1.5 px-2.5 text-sm font-mono font-black text-slate-900 placeholder:text-slate-300"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                          Diario: ${activeRow.dailySalaryDisplay.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                          No. Días Trabajados
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="31"
                          step="1"
                          value={activeRow.emp.daysOverride === 0 ? '' : activeRow.workedDays}
                          placeholder={String(defaultCommercialDays)}
                          onChange={(e) => {
                            if (e.target.value === '') {
                              updateEmployeeField(activeRow.emp.id, 'daysOverride', 0);
                              return;
                            }
                            const val = parseInt(e.target.value, 10);
                            updateEmployeeField(
                              activeRow.emp.id,
                              'daysOverride',
                              isNaN(val) ? null : Math.max(0, Math.min(31, val))
                            );
                          }}
                          className="clay-input w-full py-1.5 px-2.5 text-sm font-mono font-black text-indigo-700 placeholder:text-slate-300"
                        />
                        <div className="flex items-center gap-1 mt-1.5">
                          <button
                            type="button"
                            onClick={() => updateEmployeeField(activeRow.emp.id, 'daysOverride', 18)}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-[10px] font-bold text-slate-700 cursor-pointer"
                          >
                            18d (Oct)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEmployeeField(activeRow.emp.id, 'daysOverride', 15)}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-[10px] font-bold text-slate-700 cursor-pointer"
                          >
                            15d
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEmployeeField(activeRow.emp.id, 'daysOverride', 30)}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-[10px] font-bold text-slate-700 cursor-pointer"
                          >
                            30d
                          </button>
                        </div>
                      </div>

                      <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 flex flex-col justify-between">
                        <span className="text-[10px] font-black text-indigo-800 uppercase block">
                          Salario del Período
                        </span>
                        <span className="text-xl font-black font-mono text-indigo-900">
                          ${activeRow.ordinarySalary.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-indigo-700 font-semibold">
                          Por {activeRow.workedDays} días laborados
                        </span>
                      </div>
                    </div>

                    {/* Bloque 2: Ingresos Adicionales / Bonos (Múltiples bonos detallados por concepto) */}
                    <div className="bg-emerald-50/80 p-4 rounded-2xl border-2 border-emerald-300/80 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase text-emerald-800 block">
                            ✨ Registrar Ingresos Adicionales / Bonos / Comisiones
                          </span>
                          <p className="text-xs text-emerald-900 font-semibold">
                            Puedes agregar uno o varios bonos con conceptos diferentes para{' '}
                            <strong>{activeRow.emp.firstName}</strong>:
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[15, 25, 50, 100].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() =>
                                setDraftBonusAmount(
                                  String(round2((parseFloat(draftBonusAmount) || 0) + amt))
                                )
                              }
                              className="px-2 py-1 rounded-lg bg-white hover:bg-emerald-600 hover:text-white text-emerald-900 border border-emerald-300 text-xs font-mono font-black transition-colors cursor-pointer"
                            >
                              +${amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-black text-emerald-900 uppercase block mb-1">
                            Monto del Bono ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="w-4 h-4 text-emerald-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={draftBonusAmount}
                              onChange={(e) => setDraftBonusAmount(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddBonusItem(activeRow.emp.id);
                                }
                              }}
                              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border-2 border-emerald-400 text-base font-mono font-black text-emerald-950 placeholder:text-slate-300 focus:outline-none focus:border-emerald-600"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-5">
                          <label className="text-[10px] font-black text-emerald-900 uppercase block mb-1">
                            Concepto / Motivo del Bono
                          </label>
                          <input
                            type="text"
                            value={draftBonusConcept}
                            onChange={(e) => setDraftBonusConcept(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddBonusItem(activeRow.emp.id);
                              }
                            }}
                            placeholder="Ej. Bono Transporte, Comisión..."
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <button
                            type="button"
                            onClick={() => handleAddBonusItem(activeRow.emp.id)}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Guardar Bono</span>
                          </button>
                        </div>
                      </div>

                      {/* Selector de si el Bono a registrar suma a cotizaciones ISSS/AFP o va directo al Neto */}
                      <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-emerald-950 text-[11px]">
                          Tipo de bono a guardar:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDraftBonusTaxable(true)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${
                              draftBonusTaxable
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            Sujeto a ISSS / AFP / Renta (Columna Planilla)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftBonusTaxable(false)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${
                              !draftBonusTaxable
                                ? 'bg-indigo-700 text-white border-indigo-700'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            Bono Neto Directo (No altera ISSS/AFP de la tabla)
                          </button>
                        </div>
                      </div>

                      {/* Lista de Bonos Guardados para este colaborador */}
                      {activeRow.bonusItems.length > 0 && (
                        <div className="pt-2.5 border-t border-emerald-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-emerald-900">
                              Bonos Registrados en Planilla ({activeRow.bonusItems.length}) — Total: $
                              {activeRow.otherIncome.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleClearEmployeeBonuses(activeRow.emp.id)}
                              className="text-[10px] font-bold text-rose-700 hover:underline cursor-pointer"
                            >
                              Borrar todos
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {activeRow.bonusItems.map((b, bIdx) => (
                              <div
                                key={b.id}
                                className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-200 text-xs shadow-2xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                    #{bIdx + 1}
                                  </span>
                                  <span className="font-black text-slate-800">{b.concept}</span>
                                  <span
                                    className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                                      b.taxable !== false
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    }`}
                                  >
                                    {b.taxable !== false ? 'Sujeto ISSS/AFP' : 'Neto Directo'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono font-black text-emerald-800 text-sm">
                                    +${Number(b.amount).toFixed(2)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBonusItem(activeRow.emp.id, b.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    title="Quitar este bono"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bloque 3: Vacaciones y Otras Deducciones */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                          Vacación ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={activeRow.emp.vacationAmount ? activeRow.emp.vacationAmount : ''}
                          placeholder="0.00"
                          onChange={(e) =>
                            updateEmployeeField(
                              activeRow.emp.id,
                              'vacationAmount',
                              e.target.value === ''
                                ? 0
                                : Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          }
                          className="clay-input w-full py-1 px-2 text-xs font-mono font-bold placeholder:text-slate-300"
                        />
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                          Anticipos / Otros Desc. ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={activeRow.emp.otherDeductions ? activeRow.emp.otherDeductions : ''}
                          placeholder="0.00"
                          onChange={(e) =>
                            updateEmployeeField(
                              activeRow.emp.id,
                              'otherDeductions',
                              e.target.value === ''
                                ? 0
                                : Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          }
                          className="clay-input w-full py-1 px-2 text-xs font-mono font-bold placeholder:text-slate-300"
                        />
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                          Minutos Tarde en el Corte
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={activeRow.emp.tardyMinutes ? activeRow.emp.tardyMinutes : ''}
                          placeholder="0"
                          onChange={(e) =>
                            updateEmployeeField(
                              activeRow.emp.id,
                              'tardyMinutes',
                              e.target.value === ''
                                ? 0
                                : Math.max(0, parseInt(e.target.value, 10) || 0)
                            )
                          }
                          className="clay-input w-full py-1 px-2 text-xs font-mono font-bold placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha (5 cols): Vista Previa en Vivo de la Boleta de Pago Individual */}
                  <div className="lg:col-span-5 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div>
                          <div className="text-xs font-black text-slate-900 uppercase">
                            {parameters.employerName}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500">
                            VISTA PREVIA DE BOLETA • {getFormattedPeriodLabel()}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-black text-slate-800">
                          No. {activeRow.index}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Empleado:</span>
                          <span className="font-black text-slate-900">{activeRow.emp.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Documento:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {activeRow.emp.docNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Días Laborados:</span>
                          <span className="font-mono font-bold text-indigo-700">
                            {activeRow.workedDays} días
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <div className="text-[10px] font-black text-slate-700 uppercase border-b border-slate-200 pb-1">
                            Ingresos
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Salario Período:</span>
                            <span className="font-mono font-bold">
                              ${activeRow.ordinarySalary.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-emerald-700 font-semibold">
                              Bonos / Adic.:
                            </span>
                            <span className="font-mono font-bold text-emerald-700">
                              ${activeRow.otherIncome.toFixed(2)}
                            </span>
                          </div>
                          {activeRow.bonusItems.length > 0 && (
                            <div className="pl-2 space-y-0.5 border-l-2 border-emerald-300">
                              {activeRow.bonusItems.map((b) => (
                                <div
                                  key={b.id}
                                  className="flex justify-between text-[10px] text-emerald-800"
                                >
                                  <span className="truncate max-w-[115px]">• {b.concept}:</span>
                                  <span className="font-mono font-bold">
                                    ${Number(b.amount).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-600">Vacación:</span>
                            <span className="font-mono font-bold">
                              ${activeRow.vacationAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-indigo-900">
                            <span>Sujeto Cotiz.:</span>
                            <span className="font-mono">${activeRow.totalDevengado.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <div className="text-[10px] font-black text-slate-700 uppercase border-b border-slate-200 pb-1">
                            Retenciones
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">ISSS (3%):</span>
                            <span className="font-mono font-bold">
                              ${activeRow.isssLab.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">AFP (7.25%):</span>
                            <span className="font-mono font-bold">
                              ${activeRow.afpLab.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Renta (ISR):</span>
                            <span className="font-mono font-bold text-rose-700">
                              ${activeRow.isr.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-rose-900">
                            <span>Total Retenc.:</span>
                            <span className="font-mono">
                              ${activeRow.totalDeducciones.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black text-emerald-800 uppercase block">
                            Valor Neto Cancelado / A Recibir
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            Listo para firma en boleta y planilla
                          </span>
                        </div>
                        <span className="text-2xl font-mono font-black text-emerald-800">
                          ${activeRow.liquidoPagar.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePrintPayslips(activeRow)}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Descargar Boleta PDF de {activeRow.emp.firstName}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= PASO 2: TABLA CONSOLIDADA OFICIAL (IDÉNTICA AL EXCEL PARA FIRMAS) ================= */}
            <div className="clay-card p-0 overflow-hidden bg-white border border-slate-200">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    Paso 2 • Tabla Consolidada de Planilla de Sueldo
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-1">
                    {parameters.employerName} — {getFormattedPeriodLabel()}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFullEmployerCols(!showFullEmployerCols)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                  >
                    {showFullEmployerCols
                      ? 'Ocultar Aportes Patronales'
                      : 'Ver Aportes Patronales (ISSS/AFP Patronal)'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintOfficialPayrollSheet}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Descargar PDF Planilla Consolidada (Firmas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintPayslips()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Descargar Todas las Boletas PDF ({computedRows.length})</span>
                  </button>
                </div>
              </div>

              <div
                tabIndex={0}
                role="region"
                aria-label="Tabla Consolidada de Planilla Salarial"
                className="overflow-auto max-w-full"
              >
                <table className="w-full text-left border-separate border-spacing-0 text-xs">
                  <thead className="sticky top-0 z-20 bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-center">No.</th>
                      <th className="py-3 px-3 border-b border-slate-700 min-w-[180px]">
                        Nombre de Empleado
                      </th>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-center">
                        No. Documento
                      </th>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-center">
                        No. Días
                      </th>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-right">
                        Salario del Período
                      </th>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-right bg-emerald-950/70">
                        Bonos / Adicionales
                      </th>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-right">
                        Vacación
                      </th>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-right bg-indigo-950">
                        Ingreso Sujeto Cotizaciones
                      </th>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-right">
                        ISSS (3%)
                      </th>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-right">
                        AFP (7.25%)
                      </th>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-right">
                        Ing. Sujeto a Ret. Renta
                      </th>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-right bg-rose-950/80">
                        Renta
                      </th>
                      <th className="py-3 px-2.5 border-b border-slate-700 text-right">
                        Total Retenc. y Desc.
                      </th>
                      <th className="py-3 px-3 border-b border-slate-700 text-right bg-emerald-900">
                        Valor Neto Cancelado
                      </th>
                      {showFullEmployerCols && (
                        <>
                          <th className="py-3 px-2.5 border-b border-slate-700 text-right bg-slate-800">
                            ISSS Pat (7.5%)
                          </th>
                          <th className="py-3 px-2.5 border-b border-slate-700 text-right bg-slate-800">
                            AFP Pat (8.75%)
                          </th>
                          <th className="py-3 px-2.5 border-b border-slate-700 text-right bg-purple-950">
                            Costo Empresa
                          </th>
                        </>
                      )}
                      <th className="py-3 px-2.5 border-b border-slate-700 text-center">
                        Boleta / Editar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {computedRows.map((r) => {
                      const isSelected = activeRow && r.emp.id === activeRow.emp.id;
                      return (
                        <tr
                          key={r.emp.id}
                          onClick={() => setSelectedWorkEmpId(r.emp.id)}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50/90'
                          }`}
                        >
                          <td className="py-3 px-2.5 text-center font-mono font-bold text-slate-500">
                            {r.index}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{r.emp.fullName}</span>
                              {isSelected && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-black uppercase">
                                  Seleccionado
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold">
                              Base: ${r.baseMonthly.toFixed(2)} • {r.emp.position}
                            </div>
                          </td>
                          <td className="py-3 px-2.5 text-center font-mono font-semibold text-slate-700">
                            {r.emp.docNumber}
                          </td>
                          <td className="py-3 px-2.5 text-center font-mono font-black text-slate-900">
                            {r.workedDays}
                          </td>
                          <td className="py-3 px-2.5 text-right font-mono font-bold text-slate-900">
                            ${r.ordinarySalary.toFixed(2)}
                          </td>
                          <td className="py-3 px-2.5 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">
                            <div>${r.otherIncome.toFixed(2)}</div>
                            {r.bonusItems.length > 0 && (
                              <div className="mt-1 space-y-0.5 text-right">
                                {r.bonusItems.map((b) => (
                                  <div
                                    key={b.id}
                                    className="text-[9.5px] font-sans font-bold text-emerald-900 bg-emerald-100/80 px-1.5 py-0.5 rounded inline-block ml-1"
                                  >
                                    {b.concept}: ${Number(b.amount).toFixed(2)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2.5 text-right font-mono text-slate-700">
                            ${r.vacationAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-2.5 text-right font-mono font-black text-indigo-900 bg-indigo-50/40">
                            ${r.totalDevengado.toFixed(2)}
                          </td>
                          <td className="py-3 px-2.5 text-right font-mono text-slate-800">
                            ${r.isssLab.toFixed(2)}
                          </td>
                          <td className="py-3 px-2.5 text-right font-mono text-slate-800">
                            ${r.afpLab.toFixed(2)}
                          </td>
                          <td className="py-3 px-2.5 text-right font-mono text-slate-700">
                            ${r.baseGravableIsr.toFixed(2)}
                          </td>
                          <td className="py-3 px-2.5 text-right font-mono font-black text-rose-700 bg-rose-50/40">
                            ${r.isr.toFixed(2)}
                          </td>
                          <td className="py-3 px-2.5 text-right font-mono font-bold text-slate-900">
                            ${r.totalDeducciones.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-sm text-emerald-800 bg-emerald-50/70">
                            ${r.liquidoPagar.toFixed(2)}
                          </td>
                          {showFullEmployerCols && (
                            <>
                              <td className="py-3 px-2.5 text-right font-mono text-slate-600">
                                ${r.isssPat.toFixed(2)}
                              </td>
                              <td className="py-3 px-2.5 text-right font-mono text-slate-600">
                                ${r.afpPat.toFixed(2)}
                              </td>
                              <td className="py-3 px-2.5 text-right font-mono font-black text-purple-800">
                                ${r.costoTotalEmpresa.toFixed(2)}
                              </td>
                            </>
                          )}
                          <td
                            className="py-3 px-2.5 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handlePrintPayslips(r)}
                                className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                title="Descargar Boleta PDF de este colaborador"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Boleta</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-mono font-black text-xs sticky bottom-0 z-20">
                    <tr>
                      <td className="py-3.5 px-2.5 text-center">—</td>
                      <th scope="row" className="py-3.5 px-3 text-left" colSpan={3}>
                        TOTALES ({computedRows.length} Colaboradores)
                      </th>
                      <td className="py-3.5 px-2.5 text-right">
                        ${totals.ordinarySalary.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2.5 text-right text-emerald-300">
                        ${totals.otherIncome.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2.5 text-right">
                        ${totals.vacationAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2.5 text-right text-indigo-200">
                        ${totals.totalDevengado.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2.5 text-right">${totals.isssLab.toFixed(2)}</td>
                      <td className="py-3.5 px-2.5 text-right">${totals.afpLab.toFixed(2)}</td>
                      <td className="py-3.5 px-2.5 text-right">
                        ${totals.baseGravableIsr.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2.5 text-right text-rose-300">
                        ${totals.isr.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2.5 text-right">
                        ${totals.totalDeducciones.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-emerald-300 text-sm">
                        ${totals.liquidoPagar.toFixed(2)}
                      </td>
                      {showFullEmployerCols && (
                        <>
                          <td className="py-3.5 px-2.5 text-right">
                            ${totals.isssPat.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-2.5 text-right">
                            ${totals.afpPat.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-2.5 text-right text-purple-300">
                            ${totals.costoTotalEmpresa.toFixed(2)}
                          </td>
                        </>
                      )}
                      <td className="py-3.5 px-2.5"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= SUBPESTAÑA 1.5: JORNADAS & CRUCE DE MARCACIONES (ESTILO ASEINFO EVOLUTION) ================= */}
      {subTab === 'jornadas' && (
        <div className="space-y-5">
          {/* SECCIÓN A: CONFIGURADOR DE JORNADAS POR DÍA DE LA SEMANA */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Columna Izquierda: Lista de Jornadas + Asignación de Jornada por Empleado */}
            <div className="xl:col-span-4 space-y-4">
              <div className="clay-card p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-600" />
                      <span>Catálogo de Jornadas (Evolution)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Selecciona una jornada para editar sus horarios de Lunes a Domingo o crea una nueva.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateJornada}
                    className="clay-btn clay-btn-primary px-2.5 py-1.5 text-[11px] font-black flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Jornada</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {jornadas.map((jor) => {
                    const isSelected = jor.id === selectedJornada.id;
                    const assignedCount = employees.filter((e) => (e.jornadaId || 'jor-gerencia') === jor.id).length;
                    const weeklyHours = round2(
                      jor.days.reduce((acc, d) => acc + calcDayScheduledHours(d), 0)
                    );
                    return (
                      <div
                        key={jor.id}
                        onClick={() => setSelectedJornadaId(jor.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-50/90 border-cyan-500 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800">{jor.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600 font-bold">
                              {jor.code}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-semibold mt-0.5">
                            {weeklyHours} hrs/sem • {assignedCount} colaborador(es)
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {jornadas.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteJornada(jor.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Eliminar jornada"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Asignación de Jornada a cada Colaborador */}
              <div className="clay-card p-4 bg-white space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Asignación de Jornada por Colaborador</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Define qué jornada rige el cruce de marcaciones de cada empleado.
                  </p>
                </div>

                <div className="space-y-2">
                  {employees.map((emp) => {
                    const summary = crossedSummaryByEmp[emp.id];
                    const isEmpSelected = selectedPunchEmp?.id === emp.id;
                    return (
                      <div
                        key={emp.id}
                        className={`p-2.5 rounded-xl border text-xs transition-all ${
                          isEmpSelected
                            ? 'bg-indigo-50/70 border-indigo-400'
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div>
                            <span className="font-black text-slate-800">{emp.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-semibold ml-1.5">
                              ({emp.position})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedPunchEmpId(emp.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                              isEmpSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50'
                            }`}
                          >
                            {isEmpSelected ? 'Viendo Marcaciones' : 'Cruzar Reloj'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <label htmlFor={`jor-select-${emp.id}`} className="sr-only">
                            Jornada de {emp.fullName}
                          </label>
                          <select
                            id={`jor-select-${emp.id}`}
                            name={`jornada_${emp.id}`}
                            value={emp.jornadaId || jornadas[0]?.id || 'jor-gerencia'}
                            onChange={(e) => handleAssignEmployeeJornada(emp.id, e.target.value)}
                            className="clay-input py-1 px-2 text-xs font-bold w-full"
                          >
                            {jornadas.map((j) => (
                              <option key={j.id} value={j.id}>
                                Jornada: {j.name} ({j.code})
                              </option>
                            ))}
                          </select>
                          {summary && summary.totalMinutosDescuento > 0 && (
                            <span className="shrink-0 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-black text-[10px]">
                              {summary.totalMinutosDescuento}m (-${summary.totalMontoDescuento.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Matriz de Horario por Día de la Semana (Lunes a Domingo) */}
            <div className="xl:col-span-8">
              <div className="clay-card p-5 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                      Configuración de Horario Semanal • Estilo Aseinfo Evolution
                    </span>
                    <h3 className="text-base font-black text-slate-800 mt-1">
                      Jornada: {selectedJornada.name} ({selectedJornada.code})
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={copyMondayToWeekdays}
                      className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-cyan-800 flex items-center gap-1.5 cursor-pointer"
                      title="Copia las horas del Lunes a Martes, Miércoles, Jueves y Viernes"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Copiar Lunes a Mar–Vie</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDuplicateJornada}
                      className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        persistState(
                          employees,
                          parameters,
                          history,
                          { periodStart, periodEnd, cutoffStart, cutoffEnd, paymentDate, frequency },
                          jornadas,
                          punchRecords
                        );
                        showToast(`✅ Jornada "${selectedJornada.name}" guardada correctamente.`);
                      }}
                      className="clay-btn clay-btn-success px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Jornada</span>
                    </button>
                  </div>
                </div>

                {/* Datos Generales de la Jornada */}
                <fieldset className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
                  <legend className="sr-only">Datos generales de la jornada</legend>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="jornada-name-input"
                      className="text-[10.5px] font-black text-slate-600 uppercase block mb-1"
                    >
                      Nombre de la Jornada (Ej. Gerencia, Bodega, Ventas)
                    </label>
                    <input
                      id="jornada-name-input"
                      name="jornada_name"
                      type="text"
                      value={selectedJornada.name}
                      onChange={(e) => updateSelectedJornadaField('name', e.target.value)}
                      placeholder="Ej. Gerencia"
                      className="clay-input w-full font-black text-slate-800"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="jornada-code-input"
                      className="text-[10.5px] font-black text-slate-600 uppercase block mb-1"
                    >
                      Código Jornada
                    </label>
                    <input
                      id="jornada-code-input"
                      name="jornada_code"
                      type="text"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={selectedJornada.code}
                      onChange={(e) => updateSelectedJornadaField('code', e.target.value.toUpperCase())}
                      className="clay-input w-full font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="jornada-lunch-mode"
                      className="text-[10.5px] font-black text-amber-800 uppercase block mb-1"
                    >
                      Regla de Almuerzo (Duración vs. Hora Fija)
                    </label>
                    <select
                      id="jornada-lunch-mode"
                      name="lunch_evaluation_mode"
                      value={selectedJornada.lunchEvaluationMode || 'DURATION'}
                      onChange={(e) =>
                        updateSelectedJornadaField(
                          'lunchEvaluationMode',
                          e.target.value as LunchEvaluationMode
                        )
                      }
                      className="clay-input w-full font-bold text-amber-900"
                    >
                      <option value="DURATION">
                        Por Duración (Flexible: solo mide ej. 60 min tomados)
                      </option>
                      <option value="FIXED_TIME">
                        Por Hora Fija (Rígido: exige salir 12:00 y entrar 13:00)
                      </option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="jornada-grace-in"
                        className="text-[10px] font-black text-slate-600 uppercase block mb-1"
                        title="Minutos de gracia en entrada de turno"
                      >
                        Tol. Ent. (m)
                      </label>
                      <input
                        id="jornada-grace-in"
                        name="grace_entrada"
                        type="number"
                        min="0"
                        max="60"
                        value={selectedJornada.graceMinutesEntrada}
                        onChange={(e) =>
                          updateSelectedJornadaField(
                            'graceMinutesEntrada',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="clay-input w-full font-mono text-center font-bold"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="jornada-grace-lunch"
                        className="text-[10px] font-black text-slate-600 uppercase block mb-1"
                        title="Minutos de gracia en exceso de almuerzo"
                      >
                        Tol. Alm. (m)
                      </label>
                      <input
                        id="jornada-grace-lunch"
                        name="grace_almuerzo"
                        type="number"
                        min="0"
                        max="60"
                        value={selectedJornada.graceMinutesAlmuerzo}
                        onChange={(e) =>
                          updateSelectedJornadaField(
                            'graceMinutesAlmuerzo',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="clay-input w-full font-mono text-center font-bold"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Tabla de Días de la Semana (Lunes a Domingo) y los 4 Tiempos a la derecha */}
                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Horario semanal por día de la jornada"
                  className="overflow-auto max-w-full border border-slate-200 rounded-2xl"
                >
                  <table className="w-full text-left border-separate border-spacing-0 text-xs">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3.5 border-b border-slate-700 sticky left-0 z-10 bg-slate-900">
                          Día de la Semana
                        </th>
                        <th className="py-3 px-2.5 border-b border-slate-700 text-center">
                          Tipo de Día
                        </th>
                        <th className="py-3 px-3 border-b border-slate-700 text-center bg-emerald-950/80">
                          1. Entrada de Turno
                        </th>
                        <th className="py-3 px-2.5 border-b border-slate-700 text-center">
                          Receso Almuerzo
                        </th>
                        <th className="py-3 px-3 border-b border-slate-700 text-center bg-amber-950/70">
                          2. Salida de Almuerzo
                        </th>
                        <th className="py-3 px-3 border-b border-slate-700 text-center bg-amber-950/70">
                          3. Entrada de Almuerzo
                        </th>
                        <th className="py-3 px-3 border-b border-slate-700 text-center bg-indigo-950/90">
                          4. Salida de Turno
                        </th>
                        <th className="py-3 px-3 border-b border-slate-700 text-right">
                          Horas Ord.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedJornada.days.map((d) => {
                        const hrs = calcDayScheduledHours(d);
                        return (
                          <tr
                            key={d.dayOfWeek}
                            className={
                              d.isWorkDay ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/70 text-slate-400'
                            }
                          >
                            <th
                              scope="row"
                              className="py-2.5 px-3.5 font-black text-slate-800 sticky left-0 z-10 bg-inherit border-r border-slate-100"
                            >
                              {d.dayName}
                            </th>
                            <td className="py-2.5 px-2.5 text-center">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold">
                                <input
                                  type="checkbox"
                                  checked={d.isWorkDay}
                                  onChange={(e) =>
                                    updateSelectedJornadaDay(d.dayOfWeek, 'isWorkDay', e.target.checked)
                                  }
                                  className="rounded text-cyan-600 focus:ring-cyan-500"
                                />
                                <span
                                  className={
                                    d.isWorkDay
                                      ? 'text-emerald-700 font-black'
                                      : 'text-slate-400 font-semibold'
                                  }
                                >
                                  {d.isWorkDay ? 'Laboral' : 'Descanso'}
                                </span>
                              </label>
                            </td>
                            <td className="py-2.5 px-3 text-center bg-emerald-50/30">
                              <input
                                type="time"
                                aria-label={`Entrada de turno ${d.dayName}`}
                                disabled={!d.isWorkDay}
                                value={d.entradaTurno}
                                onChange={(e) =>
                                  updateSelectedJornadaDay(d.dayOfWeek, 'entradaTurno', e.target.value)
                                }
                                className="clay-input py-1 px-2 text-xs font-mono font-black text-emerald-900 disabled:opacity-40"
                              />
                            </td>
                            <td className="py-2.5 px-2.5 text-center">
                              <label className="inline-flex items-center gap-1 cursor-pointer text-[10.5px] font-semibold">
                                <input
                                  type="checkbox"
                                  disabled={!d.isWorkDay}
                                  checked={d.hasLunch}
                                  onChange={(e) =>
                                    updateSelectedJornadaDay(d.dayOfWeek, 'hasLunch', e.target.checked)
                                  }
                                  className="rounded text-amber-600"
                                />
                                <span>{d.hasLunch ? 'Con Almuerzo' : 'Continuo'}</span>
                              </label>
                            </td>
                            <td className="py-2.5 px-3 text-center bg-amber-50/30">
                              <input
                                type="time"
                                aria-label={`Salida de almuerzo ${d.dayName}`}
                                disabled={!d.isWorkDay || !d.hasLunch}
                                value={d.salidaAlmuerzo}
                                onChange={(e) =>
                                  updateSelectedJornadaDay(d.dayOfWeek, 'salidaAlmuerzo', e.target.value)
                                }
                                className="clay-input py-1 px-2 text-xs font-mono font-bold text-amber-900 disabled:opacity-35"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center bg-amber-50/30">
                              <input
                                type="time"
                                aria-label={`Entrada de almuerzo ${d.dayName}`}
                                disabled={!d.isWorkDay || !d.hasLunch}
                                value={d.entradaAlmuerzo}
                                onChange={(e) =>
                                  updateSelectedJornadaDay(d.dayOfWeek, 'entradaAlmuerzo', e.target.value)
                                }
                                className="clay-input py-1 px-2 text-xs font-mono font-bold text-amber-900 disabled:opacity-35"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center bg-indigo-50/30">
                              <input
                                type="time"
                                aria-label={`Salida de turno ${d.dayName}`}
                                disabled={!d.isWorkDay}
                                value={d.salidaTurno}
                                onChange={(e) =>
                                  updateSelectedJornadaDay(d.dayOfWeek, 'salidaTurno', e.target.value)
                                }
                                className="clay-input py-1 px-2 text-xs font-mono font-black text-indigo-900 disabled:opacity-40"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-700">
                              {d.isWorkDay ? `${hrs.toFixed(2)} h` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white font-mono text-xs font-black">
                      <tr>
                        <th scope="row" colSpan={7} className="py-2.5 px-3.5 text-right uppercase">
                          Total Horas Ordinarias de la Jornada por Semana (Art. 161 Código de Trabajo máx. 44h):
                        </th>
                        <td className="py-2.5 px-3 text-right text-cyan-300">
                          {round2(
                            selectedJornada.days.reduce((acc, d) => acc + calcDayScheduledHours(d), 0)
                          ).toFixed(2)}{' '}
                          h
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN B: CRUCE DE MARCACIONES CONTRA LA JORNADA ASIGNADA */}
          {selectedPunchEmp && (
            <div className="clay-card p-5 bg-white space-y-4 border-t-4 border-cyan-600">
              {(() => {
                const empJor =
                  jornadas.find((j) => j.id === selectedPunchEmp.jornadaId) ||
                  jornadas[0] ||
                  DEFAULT_JORNADAS[0];
                const empSummary = crossedSummaryByEmp[selectedPunchEmp.id] || {
                  totalMinTardeEntrada: 0,
                  totalMinSalidaAntesAlmuerzo: 0,
                  totalMinTardeEntradaAlmuerzo: 0,
                  totalMinSalidaAntesTurno: 0,
                  totalMinutosDescuento: 0,
                  totalMontoDescuento: 0,
                  daysWithPunches: 0,
                };

                return (
                  <>
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10.5px] font-black uppercase">
                            Cruce de Marcaciones vs. Horario de Jornada
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            Corte de Reloj: {cutoffStart} al {cutoffEnd} ({cutoffDates.length} días)
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-800 mt-1">
                          Colaborador: <span className="text-indigo-700">{selectedPunchEmp.fullName}</span> •
                          Jornada Asignada: <span className="text-cyan-700">{empJor.name}</span> (Sueldo: $
                          {selectedPunchEmp.baseSalaryMonthly.toFixed(2)}/mes)
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          aria-label="Cambiar colaborador en cruce de marcaciones"
                          value={selectedPunchEmp.id}
                          onChange={(e) => setSelectedPunchEmpId(e.target.value)}
                          className="clay-input py-1.5 px-3 text-xs font-black text-slate-800"
                        >
                          {employees.map((e) => (
                            <option key={e.id} value={e.id}>
                              👤 {e.fullName} ({e.position})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => fillOnTimePunchesForEmployee(selectedPunchEmp.id)}
                          className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                          title="Rellena todos los días laborales con la hora exacta de su jornada para que solo modifiques los días que llegó tarde"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Precargar Horario Puntual</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowBulkPunchModal(true)}
                          className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-indigo-800 flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Pegar / Importar Reloj (CSV)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => clearPunchesForEmployee(selectedPunchEmp.id)}
                          className="clay-btn clay-btn-light px-2.5 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"
                        >
                          Limpiar
                        </button>

                        <button
                          type="button"
                          onClick={() => applySingleEmpCrossToPayroll(selectedPunchEmp.id)}
                          className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>
                            Aplicar a Planilla ({empSummary.totalMinutosDescuento} min = -$
                            {empSummary.totalMontoDescuento.toFixed(2)})
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={applyAllCrossedToPayroll}
                          className="clay-btn clay-btn-success px-3 py-1.5 text-xs font-black cursor-pointer"
                          title="Sincroniza los minutos cruzados de todos los empleados hacia la Planilla Quincenal"
                        >
                          Sincronizar Todos
                        </button>
                      </div>
                    </div>

                    {/* Resumen de Desfase de Tiempos del Colaborador */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Tardía 1. Entrada Turno
                        </span>
                        <span className="text-base font-black font-mono text-slate-800">
                          {empSummary.totalMinTardeEntrada} min
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Anticipo 2. Salida Almuerzo
                        </span>
                        <span className="text-base font-black font-mono text-slate-800">
                          {empSummary.totalMinSalidaAntesAlmuerzo} min
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Tardía 3. Entrada Almuerzo
                        </span>
                        <span className="text-base font-black font-mono text-slate-800">
                          {empSummary.totalMinTardeEntradaAlmuerzo} min
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Anticipo 4. Salida Turno
                        </span>
                        <span className="text-base font-black font-mono text-slate-800">
                          {empSummary.totalMinSalidaAntesTurno} min
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-300">
                        <span className="text-[10px] font-black text-amber-900 uppercase block">
                          Total Minutos / Descuento Corte
                        </span>
                        <span className="text-base font-black font-mono text-amber-900">
                          {empSummary.totalMinutosDescuento} min (-$
                          {empSummary.totalMontoDescuento.toFixed(2)})
                        </span>
                      </div>
                    </div>

                    {/* Sabana Diaria de Cruce: Horario Jornada vs. Marcaciones */}
                    <div
                      tabIndex={0}
                      role="region"
                      aria-label="Tabla de cruce de marcaciones diarias contra la jornada"
                      className="overflow-auto max-w-full max-h-[60vh] border border-slate-200 rounded-2xl"
                    >
                      <table className="w-full text-left border-separate border-spacing-0 text-xs">
                        <thead className="sticky top-0 z-20 bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3 border-b border-slate-700 sticky left-0 z-30 bg-slate-900">
                              Fecha / Día
                            </th>
                            <th className="py-2.5 px-2.5 border-b border-slate-700 text-center bg-slate-800">
                              Horario Oficial ({empJor.name})
                            </th>
                            <th className="py-2.5 px-2.5 border-b border-slate-700 text-center bg-emerald-950">
                              Marcación Entrada
                            </th>
                            <th className="py-2.5 px-2.5 border-b border-slate-700 text-center bg-amber-950/80">
                              Marcación Sal. Almuerzo
                            </th>
                            <th className="py-2.5 px-2.5 border-b border-slate-700 text-center bg-amber-950/80">
                              Marcación Ent. Almuerzo
                            </th>
                            <th className="py-2.5 px-2.5 border-b border-slate-700 text-center bg-indigo-950">
                              Marcación Sal. Turno
                            </th>
                            <th className="py-2.5 px-2 border-b border-slate-700 text-center">
                              Tardía Ent.
                            </th>
                            <th className="py-2.5 px-2 border-b border-slate-700 text-center">
                              Duración / Exceso Alm.
                            </th>
                            <th className="py-2.5 px-2 border-b border-slate-700 text-center">
                              Sal. Antes
                            </th>
                            <th className="py-2.5 px-2.5 border-b border-slate-700 text-right bg-rose-950">
                              Min. / Desc. ($)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cutoffDates.map((dateStr) => {
                            const dt = new Date(`${dateStr}T00:00:00`);
                            const dow = dt.getDay();
                            const daySched = empJor.days.find((d) => d.dayOfWeek === dow);
                            const isWork = Boolean(daySched?.isWorkDay);
                            const key = `${selectedPunchEmp.id}_${dateStr}`;
                            const punch = punchRecords[key] || {
                              marcacionEntrada: '',
                              marcacionSalidaAlmuerzo: '',
                              marcacionEntradaAlmuerzo: '',
                              marcacionSalidaTurno: '',
                            };
                            const cross = crossDayPunch(
                              daySched,
                              punch,
                              empJor.graceMinutesEntrada,
                              empJor.graceMinutesAlmuerzo,
                              empJor.lunchEvaluationMode || 'DURATION'
                            );
                            const dayDiscount = round2(
                              (selectedPunchEmp.baseSalaryMonthly / 14400) *
                                cross.totalMinutosDescuento
                            );

                            return (
                              <tr
                                key={dateStr}
                                className={
                                  isWork
                                    ? cross.totalMinutosDescuento > 0
                                      ? 'bg-amber-50/40 hover:bg-amber-50/70'
                                      : 'bg-white hover:bg-slate-50'
                                    : 'bg-slate-50/80 text-slate-400'
                                }
                              >
                                <th
                                  scope="row"
                                  className="py-2 px-3 sticky left-0 z-10 bg-inherit border-r border-slate-100 font-bold text-slate-800 whitespace-nowrap"
                                >
                                  <span className="font-mono">{dateStr}</span> •{' '}
                                  <span className={isWork ? 'text-indigo-700 font-black' : 'text-slate-400'}>
                                    {daySched?.dayName || ''}
                                  </span>
                                </th>
                                <td className="py-2 px-2.5 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                                  {isWork && daySched ? (
                                    daySched.hasLunch ? (
                                      <span>
                                        {daySched.entradaTurno} | Alm. {cross.allowedLunchMinutes}m (
                                        {daySched.salidaAlmuerzo}–{daySched.entradaAlmuerzo}) |{' '}
                                        {daySched.salidaTurno}
                                      </span>
                                    ) : (
                                      <span>
                                        {daySched.entradaTurno} — {daySched.salidaTurno} (Continuo)
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-slate-400 italic">Día de Descanso</span>
                                  )}
                                </td>
                                <td className="py-2 px-2.5 text-center">
                                  <input
                                    type="time"
                                    aria-label={`Marcación entrada ${dateStr}`}
                                    disabled={!isWork}
                                    value={punch.marcacionEntrada}
                                    onChange={(e) =>
                                      updatePunchField(
                                        selectedPunchEmp.id,
                                        dateStr,
                                        'marcacionEntrada',
                                        e.target.value
                                      )
                                    }
                                    className={`clay-input py-1 px-2 text-xs font-mono font-bold disabled:opacity-30 ${
                                      cross.minTardeEntrada > 0
                                        ? 'border-rose-400 bg-rose-50 text-rose-900 font-black'
                                        : ''
                                    }`}
                                  />
                                </td>
                                <td className="py-2 px-2.5 text-center">
                                  <input
                                    type="time"
                                    aria-label={`Marcación salida almuerzo ${dateStr}`}
                                    disabled={!isWork || !daySched?.hasLunch}
                                    value={punch.marcacionSalidaAlmuerzo}
                                    onChange={(e) =>
                                      updatePunchField(
                                        selectedPunchEmp.id,
                                        dateStr,
                                        'marcacionSalidaAlmuerzo',
                                        e.target.value
                                      )
                                    }
                                    className={`clay-input py-1 px-2 text-xs font-mono font-bold disabled:opacity-30 ${
                                      cross.minSalidaAntesAlmuerzo > 0
                                        ? 'border-amber-400 bg-amber-50 text-amber-900 font-black'
                                        : ''
                                    }`}
                                  />
                                </td>
                                <td className="py-2 px-2.5 text-center">
                                  <input
                                    type="time"
                                    aria-label={`Marcación entrada almuerzo ${dateStr}`}
                                    disabled={!isWork || !daySched?.hasLunch}
                                    value={punch.marcacionEntradaAlmuerzo}
                                    onChange={(e) =>
                                      updatePunchField(
                                        selectedPunchEmp.id,
                                        dateStr,
                                        'marcacionEntradaAlmuerzo',
                                        e.target.value
                                      )
                                    }
                                    className={`clay-input py-1 px-2 text-xs font-mono font-bold disabled:opacity-30 ${
                                      cross.minTardeEntradaAlmuerzo > 0
                                        ? 'border-rose-400 bg-rose-50 text-rose-900 font-black'
                                        : ''
                                    }`}
                                  />
                                </td>
                                <td className="py-2 px-2.5 text-center">
                                  <input
                                    type="time"
                                    aria-label={`Marcación salida turno ${dateStr}`}
                                    disabled={!isWork}
                                    value={punch.marcacionSalidaTurno}
                                    onChange={(e) =>
                                      updatePunchField(
                                        selectedPunchEmp.id,
                                        dateStr,
                                        'marcacionSalidaTurno',
                                        e.target.value
                                      )
                                    }
                                    className={`clay-input py-1 px-2 text-xs font-mono font-bold disabled:opacity-30 ${
                                      cross.minSalidaAntesTurno > 0
                                        ? 'border-rose-400 bg-rose-50 text-rose-900 font-black'
                                        : ''
                                    }`}
                                  />
                                </td>
                                <td className="py-2 px-2 text-center font-mono font-bold">
                                  {cross.minTardeEntrada > 0 ? (
                                    <span className="text-rose-600">+{cross.minTardeEntrada}m</span>
                                  ) : (
                                    <span className="text-slate-300">0</span>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-center font-mono font-bold whitespace-nowrap">
                                  {cross.takenLunchMinutes !== null ? (
                                    cross.minSalidaAntesAlmuerzo + cross.minTardeEntradaAlmuerzo > 0 ? (
                                      <span className="text-amber-700 font-black">
                                        {cross.takenLunchMinutes}m / {cross.allowedLunchMinutes}m (+
                                        {cross.minSalidaAntesAlmuerzo + cross.minTardeEntradaAlmuerzo}m)
                                      </span>
                                    ) : (
                                      <span className="text-emerald-700 text-[11px]">
                                        {cross.takenLunchMinutes}m / {cross.allowedLunchMinutes}m
                                      </span>
                                    )
                                  ) : cross.minSalidaAntesAlmuerzo + cross.minTardeEntradaAlmuerzo > 0 ? (
                                    <span className="text-amber-700">
                                      +{cross.minSalidaAntesAlmuerzo + cross.minTardeEntradaAlmuerzo}m
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">0</span>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-center font-mono font-bold">
                                  {cross.minSalidaAntesTurno > 0 ? (
                                    <span className="text-rose-600">+{cross.minSalidaAntesTurno}m</span>
                                  ) : (
                                    <span className="text-slate-300">0</span>
                                  )}
                                </td>
                                <td className="py-2 px-2.5 text-right font-mono font-black whitespace-nowrap">
                                  {cross.totalMinutosDescuento > 0 ? (
                                    <span className="text-rose-700">
                                      {cross.totalMinutosDescuento}m (-${dayDiscount.toFixed(2)})
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 text-[11px]">OK</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Modal para pegar/importar marcaciones desde Excel o Reloj Biométrico */}
          {showBulkPunchModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="clay-card bg-white w-full max-w-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      Pegar / Importar Marcaciones del Reloj Biométrico (CSV / Excel)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Formato por línea: <code>Empleado, YYYY-MM-DD, Entrada, SalidaAlmuerzo, EntradaAlmuerzo, SalidaTurno</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBulkPunchModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label htmlFor="bulk-punch-textarea" className="text-xs font-bold text-slate-700 block mb-1">
                    Pega aquí las filas de marcaciones:
                  </label>
                  <textarea
                    id="bulk-punch-textarea"
                    rows={7}
                    value={bulkPunchCsvText}
                    onChange={(e) => setBulkPunchCsvText(e.target.value)}
                    placeholder={`Jorge Luis, 2026-10-01, 08:12, 12:00, 13:05, 17:00\nErika Maria, 2026-10-01, 08:00, 12:00, 13:10, 17:00`}
                    className="clay-input w-full font-mono text-xs p-3"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkPunchModal(false)}
                    className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleImportBulkCsvPunches}
                    className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black"
                  >
                    Cruzar Marcaciones contra Jornadas
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SUBPESTAÑA 2: PLANILLA ÚNICA SPU (ISSS / AFP CSV) ================= */}
      {subTab === 'spu' && (
        <div className="space-y-4">
          <div className="clay-card p-4 bg-white space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>Generador Oficial de Planilla Única SPU (ISSS / AFP - OVISSS / SEPP)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exporta las 21 columnas oficiales separadas por punto y coma (`;`), con período fijo `MMYYYY` ({spuPeriodCode}), base comercial de 30 días y descuento proporcional automático en incapacidades/vacaciones.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportSpuCsv}
                className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Descargar CSV Oficial SPU ({spuPeriodCode})</span>
              </button>
            </div>

            {/* Datos Patronales SPU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">DUI / NIT Empleador</label>
                <input
                  type="text"
                  value={parameters.employerNitDui}
                  onChange={(e) => {
                    const next = { ...parameters, employerNitDui: e.target.value };
                    setParameters(next);
                    persistState(employees, next, history);
                  }}
                  className="clay-input w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Número Patronal ISSS</label>
                <input
                  type="text"
                  value={parameters.isssPatronalNumber}
                  onChange={(e) => {
                    const next = { ...parameters, isssPatronalNumber: e.target.value };
                    setParameters(next);
                    persistState(employees, next, history);
                  }}
                  className="clay-input w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Correlativo Centro de Trabajo</label>
                <input
                  type="text"
                  value={parameters.workplaceCorrelative}
                  onChange={(e) => {
                    const next = { ...parameters, workplaceCorrelative: e.target.value };
                    setParameters(next);
                    persistState(employees, next, history);
                  }}
                  className="clay-input w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Período SPU (MMYYYY)</label>
                <input
                  type="text"
                  readOnly
                  value={spuPeriodCode}
                  className="clay-input w-full font-mono text-xs bg-slate-100 font-black text-indigo-700"
                />
              </div>
            </div>
          </div>

          {/* Tabla de las 21 columnas del SPU */}
          <div className="clay-card p-0 overflow-hidden bg-white border border-slate-200">
            <div
              tabIndex={0}
              role="region"
              aria-label="Vista previa de Planilla Única SPU"
              className="overflow-auto max-w-full max-h-[65vh]"
            >
              <table className="w-full text-left border-separate border-spacing-0 text-xs">
                <thead className="sticky top-0 z-20 bg-slate-900 text-white text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-2 border-b border-slate-700">Ref</th>
                    <th className="py-2.5 px-2.5 border-b border-slate-700 sticky left-0 z-30 bg-slate-900">
                      Nombre Completo (Cols 9-13)
                    </th>
                    <th className="py-2.5 px-2 border-b border-slate-700">1. NIT Patrono</th>
                    <th className="py-2.5 px-2 border-b border-slate-700">2. Patronal ISSS</th>
                    <th className="py-2.5 px-2 border-b border-slate-700">3. Período</th>
                    <th className="py-2.5 px-2 border-b border-slate-700">4. Centro</th>
                    <th className="py-2.5 px-2 border-b border-slate-700">5. Doc</th>
                    <th className="py-2.5 px-2 border-b border-slate-700">6. Tipo</th>
                    <th className="py-2.5 px-2 border-b border-slate-700">7. N° ISSS</th>
                    <th className="py-2.5 px-2 border-b border-slate-700">8. AFP</th>
                    <th className="py-2.5 px-2 border-b border-slate-700 text-right">14. Salario</th>
                    <th className="py-2.5 px-2 border-b border-slate-700 text-right">15. Pago Adic.</th>
                    <th className="py-2.5 px-2 border-b border-slate-700 text-right">16. Vacación</th>
                    <th className="py-2.5 px-2 border-b border-slate-700 text-center">17. Días</th>
                    <th className="py-2.5 px-2 border-b border-slate-700 text-center">18. Horas</th>
                    <th className="py-2.5 px-2 border-b border-slate-700 text-center">19. Días Vac.</th>
                    <th className="py-2.5 px-2 border-b border-slate-700 text-center">20. Obs 1</th>
                    <th className="py-2.5 px-2 border-b border-slate-700 text-center">21. Obs 2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {spuRows.map((row) => (
                    <tr
                      key={`${row.rowNum}-${row.referencia}`}
                      className={row.referencia === 'SUBSIDIO' ? 'bg-amber-50/70' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2 px-2 font-bold text-indigo-700">{row.referencia}</td>
                      <th
                        scope="row"
                        className="py-2 px-2.5 sticky left-0 z-10 bg-white font-sans font-bold text-slate-800 border-r border-slate-100 text-left"
                      >
                        {[
                          row.primerNombre,
                          row.segundoNombre,
                          row.primerApellido,
                          row.segundoApellido,
                          row.apellidoCasada,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </th>
                      <td className="py-2 px-2">{row.nitEmpleador}</td>
                      <td className="py-2 px-2">{row.numPatronalIsss}</td>
                      <td className="py-2 px-2 font-bold">{row.periodo}</td>
                      <td className="py-2 px-2">{row.centroTrabajo.slice(0, 3)}</td>
                      <td className="py-2 px-2">{row.numDocumento}</td>
                      <td className="py-2 px-2">{row.tipoDocumento}</td>
                      <td className="py-2 px-2">{row.numAfiliacion}</td>
                      <td className="py-2 px-2 font-bold text-purple-700">{row.institucionPrevisional}</td>
                      <td className="py-2 px-2 text-right font-bold">${row.salario.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right">${row.pagoAdicional.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right">${row.montoVacacion.toFixed(2)}</td>
                      <td className="py-2 px-2 text-center font-bold">{row.dias}</td>
                      <td className="py-2 px-2 text-center">{row.horas}</td>
                      <td className="py-2 px-2 text-center">{row.diasVacacion}</td>
                      <td className="py-2 px-2 text-center font-bold text-emerald-700">{row.codObs1}</td>
                      <td className="py-2 px-2 text-center">{row.codObs2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUBPESTAÑA 3: RESUMEN POR DEPARTAMENTO & HISTORIAL ================= */}
      {subTab === 'resumen' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {departmentSummary.map((dept) => (
              <div key={dept.department} className="clay-card p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">
                      Departamento
                    </span>
                    <h4 className="text-sm font-black text-slate-800">
                      {dept.department} ({dept.rows.length} {dept.rows.length === 1 ? 'empleado' : 'empleados'})
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Costo Total Depto.</span>
                    <span className="text-base font-black font-mono text-purple-700">
                      ${dept.subtotalCostoEmpresa.toFixed(2)}
                    </span>
                  </div>
                </div>

                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                      <th className="py-1 text-left">Empleado</th>
                      <th className="py-1 text-right">Devengado</th>
                      <th className="py-1 text-right">Deducciones</th>
                      <th className="py-1 text-right">Líquido</th>
                      <th className="py-1 text-right">Patronal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-mono">
                    {dept.rows.map((r) => (
                      <tr key={r.emp.id}>
                        <td className="py-1.5 font-sans font-bold text-slate-700">
                          {r.emp.fullName} <span className="text-[10px] text-slate-400">({r.emp.position})</span>
                        </td>
                        <td className="py-1.5 text-right">${r.totalDevengado.toFixed(2)}</td>
                        <td className="py-1.5 text-right text-rose-600">-${r.totalDeducciones.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-bold text-emerald-700">${r.liquidoPagar.toFixed(2)}</td>
                        <td className="py-1.5 text-right text-slate-500">${r.totalPatronal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 font-mono font-black text-slate-900">
                    <tr>
                      <td className="pt-2 font-sans">SUBTOTAL {dept.department}</td>
                      <td className="pt-2 text-right">${dept.subtotalDevengado.toFixed(2)}</td>
                      <td className="pt-2 text-right text-rose-700">-${dept.subtotalDeducciones.toFixed(2)}</td>
                      <td className="pt-2 text-right text-emerald-700">${dept.subtotalLiquido.toFixed(2)}</td>
                      <td className="pt-2 text-right">${dept.subtotalPatronal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>

          {/* Historial de Planillas Guardadas */}
          <div className="clay-card p-4 bg-white space-y-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Historial de Quincenas Guardadas ({history.length})</span>
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Aún no has guardado cortes de planilla en el historial. Usa el botón &ldquo;Guardar Quincena&rdquo; en la pestaña principal.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                  >
                    <div>
                      <strong className="font-black text-slate-800 block">{h.title}</strong>
                      <span className="text-[11px] text-slate-500">
                        Guardado: {new Date(h.savedAt).toLocaleString()} • Corte Novedades: {h.cutoffStart} al {h.cutoffEnd}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-bold text-slate-700">
                        Devengado: ${h.totals.totalDevengado.toFixed(2)}
                      </span>
                      <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Líquido: ${h.totals.liquidoPagar.toFixed(2)}
                      </span>
                      <span className="font-mono font-bold text-purple-700">
                        Costo Empresa: ${h.totals.costoTotalEmpresa.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFrequency(h.frequency);
                          setPeriodStart(h.periodStart);
                          setPeriodEnd(h.periodEnd);
                          setCutoffStart(h.cutoffStart);
                          setCutoffEnd(h.cutoffEnd);
                          setEmployees(h.employees);
                          setSubTab('quincenal');
                          showToast('📂 Planilla cargada desde el historial.');
                        }}
                        className="clay-btn clay-btn-light px-2.5 py-1 text-[11px] font-bold text-indigo-700 cursor-pointer"
                      >
                        Cargar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = history.filter((item) => item.id !== h.id);
                          setHistory(next);
                          persistState(employees, parameters, next);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Eliminar del historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUBPESTAÑA 4: TABLAS Y PARÁMETROS LEGALES (EL SALVADOR) ================= */}
      {subTab === 'parametros' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tasas ISSS, AFP, INCAF y Regla de Tardías */}
            <div className="clay-card p-5 bg-white space-y-4">
              <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2">
                Parámetros de Cotización Legal y Reglas Evolution (El Salvador)
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">ISSS Laboral (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={round2(parameters.isssLaboralRate * 100)}
                    onChange={(e) => {
                      const next = { ...parameters, isssLaboralRate: (parseFloat(e.target.value) || 0) / 100 };
                      setParameters(next);
                      persistState(employees, next, history);
                    }}
                    className="clay-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">ISSS Patronal (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={round2(parameters.isssPatronalRate * 100)}
                    onChange={(e) => {
                      const next = { ...parameters, isssPatronalRate: (parseFloat(e.target.value) || 0) / 100 };
                      setParameters(next);
                      persistState(employees, next, history);
                    }}
                    className="clay-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Techo Mensual ISSS ($)</label>
                  <input
                    type="number"
                    step="1"
                    value={parameters.isssMaxSalaryMonthly}
                    onChange={(e) => {
                      const next = { ...parameters, isssMaxSalaryMonthly: parseFloat(e.target.value) || 1000 };
                      setParameters(next);
                      persistState(employees, next, history);
                    }}
                    className="clay-input w-full font-mono"
                  />
                  <span className="text-[10px] text-slate-400">
                    Tope Quincenal: ${(parameters.isssMaxSalaryMonthly / 2).toFixed(2)} (Máx $15.00 Lab / $37.50 Pat)
                  </span>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Tolerancia Llegadas Tardías (min)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={parameters.tardinessGraceMinutes}
                    onChange={(e) => {
                      const next = { ...parameters, tardinessGraceMinutes: parseInt(e.target.value, 10) || 0 };
                      setParameters(next);
                      persistState(employees, next, history);
                    }}
                    className="clay-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">AFP Laboral (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={round2(parameters.afpLaboralRate * 100)}
                    onChange={(e) => {
                      const next = { ...parameters, afpLaboralRate: (parseFloat(e.target.value) || 0) / 100 };
                      setParameters(next);
                      persistState(employees, next, history);
                    }}
                    className="clay-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">AFP Patronal (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={round2(parameters.afpPatronalRate * 100)}
                    onChange={(e) => {
                      const next = { ...parameters, afpPatronalRate: (parseFloat(e.target.value) || 0) / 100 };
                      setParameters(next);
                      persistState(employees, next, history);
                    }}
                    className="clay-input w-full font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <label className="font-bold text-slate-700 block">
                  Modo de Afectación de Llegadas Tardías (Regla MTPS / Evolution)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...parameters, tardinessMode: 'REDUCE_BASE' as const };
                      setParameters(next);
                      persistState(employees, next, history);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      parameters.tardinessMode === 'REDUCE_BASE'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-black text-xs">Modo Evolution (Reduce Base Devengada)</div>
                    <div className="text-[10.5px] opacity-80 mt-0.5">
                      Resta `Sueldo/14,400 × min` del Total Devengado antes de ISSS/AFP/Renta sin restar los 15/30 días en SPU.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...parameters, tardinessMode: 'OTHER_DEDUCTION' as const };
                      setParameters(next);
                      persistState(employees, next, history);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      parameters.tardinessMode === 'OTHER_DEDUCTION'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-black text-xs">Descuento en Líquido (Otras Deducciones)</div>
                    <div className="text-[10.5px] opacity-80 mt-0.5">
                      Cotiza ISSS/AFP/Renta sobre el sueldo completo y rebaja la llegada tardía del Líquido a Pagar.
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Tablas Oficiales de Retención de ISR (D.L. N.° 10 Vigente) */}
            <div className="clay-card p-5 bg-white space-y-4">
              <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2">
                Tablas Oficiales de Retención de Renta (ISR — Reforma D.L. N.° 10 Vigente)
              </h3>

              <div>
                <h4 className="text-xs font-black text-indigo-700 uppercase mb-1.5">
                  Tabla Quincenal (15 Días Comerciales)
                </h4>
                <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-[10px] uppercase text-slate-600">
                    <tr>
                      <th className="py-1.5 px-2 text-left">Tramo</th>
                      <th className="py-1.5 px-2 text-right">Desde</th>
                      <th className="py-1.5 px-2 text-right">Hasta</th>
                      <th className="py-1.5 px-2 text-right">%</th>
                      <th className="py-1.5 px-2 text-right">Sobre Exceso De</th>
                      <th className="py-1.5 px-2 text-right">Cuota Fija</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {parameters.quincenalBrackets.map((b) => (
                      <tr key={b.tramo}>
                        <td className="py-1.5 px-2 font-bold">{b.tramo}</td>
                        <td className="py-1.5 px-2 text-right">${b.desde.toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-right">{b.hasta ? `$${b.hasta.toFixed(2)}` : 'En adelante'}</td>
                        <td className="py-1.5 px-2 text-right">{(b.porcentaje * 100).toFixed(0)}%</td>
                        <td className="py-1.5 px-2 text-right">${b.sobreExcesoDe.toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-right font-bold">${b.cuotaFija.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-xs font-black text-purple-700 uppercase mb-1.5">
                  Tabla Mensual (30 Días Comerciales)
                </h4>
                <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-[10px] uppercase text-slate-600">
                    <tr>
                      <th className="py-1.5 px-2 text-left">Tramo</th>
                      <th className="py-1.5 px-2 text-right">Desde</th>
                      <th className="py-1.5 px-2 text-right">Hasta</th>
                      <th className="py-1.5 px-2 text-right">%</th>
                      <th className="py-1.5 px-2 text-right">Sobre Exceso De</th>
                      <th className="py-1.5 px-2 text-right">Cuota Fija</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {parameters.mensualBrackets.map((b) => (
                      <tr key={b.tramo}>
                        <td className="py-1.5 px-2 font-bold">{b.tramo}</td>
                        <td className="py-1.5 px-2 text-right">${b.desde.toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-right">{b.hasta ? `$${b.hasta.toFixed(2)}` : 'En adelante'}</td>
                        <td className="py-1.5 px-2 text-right">{(b.porcentaje * 100).toFixed(0)}%</td>
                        <td className="py-1.5 px-2 text-right">${b.sobreExcesoDe.toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-right font-bold">${b.cuotaFija.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREAR / EDITAR EMPLEADO Y FICHA SPU ================= */}
      {isEmpModalOpen && editingEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="clay-card bg-white w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Ficha de Empleado & Datos SPU (ISSS / AFP)
                </h3>
                <p className="text-xs text-slate-500">
                  Configura el sueldo mensual, cargo, departamento, afiliación ISSS/AFP y novedades de incapacidad o vacación.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEmpModalOpen(false);
                  setEditingEmp(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código / Referencia</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.code}
                    onChange={(e) => setEditingEmp({ ...editingEmp, code: e.target.value })}
                    className="clay-input w-full font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Nombre Mostrar en Planilla</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.fullName}
                    onChange={(e) => setEditingEmp({ ...editingEmp, fullName: e.target.value })}
                    placeholder="Ej. Jorge Luis"
                    className="clay-input w-full font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Primer Nombre (SPU)</label>
                  <input
                    type="text"
                    value={editingEmp.firstName}
                    onChange={(e) => setEditingEmp({ ...editingEmp, firstName: e.target.value.toUpperCase() })}
                    className="clay-input w-full"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Segundo Nombre (SPU)</label>
                  <input
                    type="text"
                    value={editingEmp.secondName}
                    onChange={(e) => setEditingEmp({ ...editingEmp, secondName: e.target.value.toUpperCase() })}
                    className="clay-input w-full"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Primer Apellido (SPU)</label>
                  <input
                    type="text"
                    value={editingEmp.firstLastName}
                    onChange={(e) => setEditingEmp({ ...editingEmp, firstLastName: e.target.value.toUpperCase() })}
                    className="clay-input w-full"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Segundo Apellido (SPU)</label>
                  <input
                    type="text"
                    value={editingEmp.secondLastName}
                    onChange={(e) => setEditingEmp({ ...editingEmp, secondLastName: e.target.value.toUpperCase() })}
                    className="clay-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cargo</label>
                  <input
                    type="text"
                    value={editingEmp.position}
                    onChange={(e) => setEditingEmp({ ...editingEmp, position: e.target.value })}
                    className="clay-input w-full"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Departamento</label>
                  <input
                    type="text"
                    value={editingEmp.department}
                    onChange={(e) => setEditingEmp({ ...editingEmp, department: e.target.value.toUpperCase() })}
                    className="clay-input w-full"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jornada (Evolution)</label>
                  <select
                    value={editingEmp.jornadaId || jornadas[0]?.id || 'jor-gerencia'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, jornadaId: e.target.value })}
                    className="clay-input w-full font-bold text-cyan-800"
                  >
                    {jornadas.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name} ({j.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Salario Base Mensual ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingEmp.baseSalaryMonthly}
                    onChange={(e) =>
                      setEditingEmp({ ...editingEmp, baseSalaryMonthly: parseFloat(e.target.value) || 0 })
                    }
                    className="clay-input w-full font-mono font-black text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Tipo Documento</label>
                  <select
                    value={editingEmp.docType}
                    onChange={(e) => setEditingEmp({ ...editingEmp, docType: e.target.value })}
                    className="clay-input w-full"
                  >
                    {DOC_TYPES.map((dt) => (
                      <option key={dt} value={dt}>
                        {dt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">N° Documento (DUI)</label>
                  <input
                    type="text"
                    value={editingEmp.docNumber}
                    onChange={(e) => setEditingEmp({ ...editingEmp, docNumber: e.target.value })}
                    className="clay-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">N° Afiliación ISSS</label>
                  <input
                    type="text"
                    value={editingEmp.isssNumber}
                    onChange={(e) => setEditingEmp({ ...editingEmp, isssNumber: e.target.value })}
                    className="clay-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Institución AFP</label>
                  <select
                    value={editingEmp.afpInstitution}
                    onChange={(e) => setEditingEmp({ ...editingEmp, afpInstitution: e.target.value })}
                    className="clay-input w-full"
                  >
                    {AFP_INSTITUTIONS.map((inst) => (
                      <option key={inst} value={inst}>
                        {inst}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Novedades Especiales SPU (Vacaciones / Subsidio por Incapacidad) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <span className="text-[10.5px] font-black uppercase text-indigo-700 block">
                  Novedades Especiales del Período (Vacaciones / Incapacidad ISSS)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Días Vacación</label>
                    <input
                      type="number"
                      min="0"
                      value={editingEmp.vacationDays}
                      onChange={(e) =>
                        setEditingEmp({ ...editingEmp, vacationDays: parseInt(e.target.value, 10) || 0 })
                      }
                      className="clay-input w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Monto Vacación ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingEmp.vacationAmount}
                      onChange={(e) =>
                        setEditingEmp({ ...editingEmp, vacationAmount: parseFloat(e.target.value) || 0 })
                      }
                      className="clay-input w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Días Subsidio ISSS</label>
                    <input
                      type="number"
                      min="0"
                      value={editingEmp.subsidyDays}
                      onChange={(e) =>
                        setEditingEmp({ ...editingEmp, subsidyDays: parseInt(e.target.value, 10) || 0 })
                      }
                      className="clay-input w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Código Observación 1</label>
                    <select
                      value={editingEmp.obsCode1}
                      onChange={(e) => setEditingEmp({ ...editingEmp, obsCode1: e.target.value })}
                      className="clay-input w-full"
                    >
                      {SPU_OBS_CODES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmpModalOpen(false);
                    setEditingEmp(null);
                  }}
                  className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="clay-btn clay-btn-primary px-5 py-2 text-xs font-black">
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
