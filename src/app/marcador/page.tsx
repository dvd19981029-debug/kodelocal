'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  Monitor,
  Sparkles,
  Lock,
} from 'lucide-react';
import { generateQrMatrix } from '@/lib/qrSvg';

const DEVICE_STORAGE_KEY = 'kode_marcador_device_token_v1';
const DEVICE_COOKIE_NAME = 'kode_marcador_device';

type PunchType = 'entrada' | 'salida_almuerzo' | 'entrada_almuerzo' | 'salida_turno';

interface EmployeeSummary {
  id: string;
  code: string;
  firstName: string;
  fullName: string;
  position: string;
  department: string;
  docLast4Hint: string;
  isEnrolled: boolean;
  enrolledDeviceLabel: string | null;
  enrolledAt: string | null;
  todayPunch: {
    marcacionEntrada: string;
    marcacionSalidaAlmuerzo: string;
    marcacionEntradaAlmuerzo: string;
    marcacionSalidaTurno: string;
  };
}

interface ScanEventRecord {
  id: string;
  empId: string;
  empCode: string;
  empName: string;
  firstName: string;
  position: string;
  department: string;
  punchType: PunchType;
  punchLabel: string;
  greetingTitle: string;
  timeStr: string;
  timeFullStr: string;
  dateStr: string;
  timestamp: number;
  deviceLabel: string;
}

function getOrCreateDeviceToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    let token = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!token) {
      const cookieMatch = document.cookie.match(
        new RegExp(`(?:^|; )${DEVICE_COOKIE_NAME}=([^;]*)`)
      );
      if (cookieMatch && cookieMatch[1]) {
        token = decodeURIComponent(cookieMatch[1]);
      }
    }
    if (!token) {
      const rand =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      token = `DEV-${rand}`;
    }
    localStorage.setItem(DEVICE_STORAGE_KEY, token);
    document.cookie = `${DEVICE_COOKIE_NAME}=${encodeURIComponent(
      token
    )}; path=/; max-age=315360000; SameSite=Lax`;
    return token;
  } catch {
    return '';
  }
}

function detectPhoneLabel(): { label: string; userAgent: string; screen: string } {
  if (typeof window === 'undefined') {
    return { label: 'Dispositivo Móvil', userAgent: '', screen: '' };
  }
  const ua = navigator.userAgent || '';
  const scr = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
  let os = 'Móvil';
  if (/iPhone/i.test(ua)) os = 'iPhone (iOS)';
  else if (/iPad/i.test(ua)) os = 'iPad (iPadOS)';
  else if (/Samsung|SM-/i.test(ua)) os = 'Samsung (Android)';
  else if (/Xiaomi|Redmi|POCO/i.test(ua)) os = 'Xiaomi (Android)';
  else if (/Huawei|HUAWEI/i.test(ua)) os = 'Huawei';
  else if (/Motorola|Moto/i.test(ua)) os = 'Motorola (Android)';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Macintosh/i.test(ua)) os = 'Mac';
  else if (/Windows/i.test(ua)) os = 'Windows';

  return {
    label: `${os} • ${scr}`,
    userAgent: ua,
    screen: scr,
  };
}

function playSuccessBeep() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.12); // A5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);
  } catch {}
}

export default function MarcadorPage() {
  const [viewMode, setViewMode] = useState<'kiosk' | 'phone'>('kiosk');
  const [scannedToken, setScannedToken] = useState<string>('');
  const [originUrl, setOriginUrl] = useState<string>('https://pos.aromaniaksv.com');

  // Estado del Monitor Kiosco
  const [kioskToken, setKioskToken] = useState<string>('');
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number>(Date.now() + 15000);
  const [secondsLeft, setSecondsLeft] = useState<number>(15);
  const [svTimeStr, setSvTimeStr] = useState<string>('');
  const [svDateStr, setSvDateStr] = useState<string>('');
  const [activeCelebration, setActiveCelebration] = useState<ScanEventRecord | null>(null);
  const [todayLogs, setTodayLogs] = useState<ScanEventRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const lastCelebratedIdRef = useRef<string | null>(null);

  // Estado del Celular (Enrolamiento y Escaneo)
  const [deviceToken, setDeviceToken] = useState<string>('');
  const [myEmployee, setMyEmployee] = useState<EmployeeSummary | null>(null);
  const [isLoadingPhone, setIsLoadingPhone] = useState<boolean>(true);
  const [selectedEnrollEmpId, setSelectedEnrollEmpId] = useState<string>('');
  const [verifyCodeInput, setVerifyCodeInput] = useState<string>('');
  const [selectedPunchType, setSelectedPunchType] = useState<PunchType | ''>('');
  const [phoneScanStatus, setPhoneScanStatus] = useState<
    'idle' | 'scanning' | 'success' | 'enroll_needed' | 'error'
  >('idle');
  const [phoneScanResult, setPhoneScanResult] = useState<ScanEventRecord | null>(null);
  const [phoneErrorMsg, setPhoneErrorMsg] = useState<string>('');
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState<boolean>(false);
  const autoScannedRef = useRef<boolean>(false);

  // Inicializar modo según parámetros de URL (?t=... o ?mode=celular)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOriginUrl(window.location.origin);
    const devTok = getOrCreateDeviceToken();
    setDeviceToken(devTok);

    const params = new URLSearchParams(window.location.search);
    const t = params.get('t') || '';
    const mode = params.get('mode') || '';

    if (t) {
      setScannedToken(t);
      setViewMode('phone');
    } else if (mode === 'celular' || mode === 'phone') {
      setViewMode('phone');
    }
  }, []);

  // Reloj en vivo de El Salvador cada segundo + cuenta regresiva de 15s del QR
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeFmt = new Intl.DateTimeFormat('es-SV', {
        timeZone: 'America/El_Salvador',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateFmt = new Intl.DateTimeFormat('es-SV', {
        timeZone: 'America/El_Salvador',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      setSvTimeStr(timeFmt.format(now));
      setSvDateStr(dateFmt.format(now));

      const remMs = Math.max(0, tokenExpiresAt - Date.now());
      setSecondsLeft(Math.ceil(remMs / 1000));
    };

    updateClock();
    const timer = setInterval(updateClock, 250);
    return () => clearInterval(timer);
  }, [tokenExpiresAt]);

  // Ejecutar marcación desde el celular
  const executePhoneScan = useCallback(
    async (qrTok: string, devTok: string, overrideType?: PunchType) => {
      if (!qrTok) return;
      setPhoneScanStatus('scanning');
      setPhoneErrorMsg('');
      const phoneMeta = detectPhoneLabel();

      try {
        const res = await fetch('/api/marcador', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'scan',
            qrToken: qrTok,
            deviceToken: devTok,
            punchType: overrideType || undefined,
            deviceLabel: phoneMeta.label,
          }),
        });
        const data = await res.json();
        if (data.success && data.scanEvent) {
          setPhoneScanResult(data.scanEvent);
          setPhoneScanStatus('success');
          playSuccessBeep();
        } else if (data.code === 'NOT_ENROLLED') {
          setPhoneScanStatus('enroll_needed');
        } else {
          setPhoneErrorMsg(data.error || 'No se pudo registrar la marcación.');
          setPhoneScanStatus('error');
        }
      } catch {
        setPhoneErrorMsg('Error de conexión al registrar la marcación.');
        setPhoneScanStatus('error');
      }
    },
    []
  );

  // Cargar estado inicial y polling en modo Kiosco
  const fetchMarcadorState = useCallback(async () => {
    try {
      const devTok = deviceToken || getOrCreateDeviceToken();
      const res = await fetch(
        `/api/marcador?deviceToken=${encodeURIComponent(devTok)}&_=${Date.now()}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (!data.success) return;

      if (data.kiosk) {
        setKioskToken(data.kiosk.token);
        setTokenExpiresAt(data.kiosk.tokenExpiresAt);
        setTodayLogs(data.kiosk.todayLogs || []);

        const celeb = data.kiosk.activeCelebration as ScanEventRecord | null;
        setActiveCelebration(celeb);
        if (celeb && celeb.id !== lastCelebratedIdRef.current) {
          lastCelebratedIdRef.current = celeb.id;
          playSuccessBeep();
        }
      }

      if (Array.isArray(data.employees)) {
        setEmployees(data.employees);
        if (!selectedEnrollEmpId && data.employees.length > 0) {
          const firstUnenrolled =
            data.employees.find((e: EmployeeSummary) => !e.isEnrolled) || data.employees[0];
          setSelectedEnrollEmpId(firstUnenrolled.id);
        }
      }

      if (data.myEnrolledEmployee) {
        setMyEmployee(data.myEnrolledEmployee);
      }
    } catch {
    } finally {
      setIsLoadingPhone(false);
    }
  }, [deviceToken, selectedEnrollEmpId]);

  useEffect(() => {
    fetchMarcadorState();
    const interval = setInterval(
      fetchMarcadorState,
      viewMode === 'kiosk' ? 1500 : 5000
    );
    return () => clearInterval(interval);
  }, [fetchMarcadorState, viewMode]);

  // Si el celular abre el link con ?t=TOKEN, verificar enrolamiento y registrar automáticamente
  useEffect(() => {
    if (viewMode !== 'phone' || isLoadingPhone || autoScannedRef.current) return;
    if (!scannedToken) return;

    autoScannedRef.current = true;
    const devTok = deviceToken || getOrCreateDeviceToken();
    if (myEmployee) {
      executePhoneScan(scannedToken, devTok);
    } else {
      setPhoneScanStatus('enroll_needed');
    }
  }, [viewMode, isLoadingPhone, scannedToken, myEmployee, deviceToken, executePhoneScan]);

  // Enrolar dispositivo del colaborador
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollEmpId) return;
    setIsSubmittingEnroll(true);
    setPhoneErrorMsg('');

    const devTok = deviceToken || getOrCreateDeviceToken();
    const phoneMeta = detectPhoneLabel();

    try {
      const res = await fetch('/api/marcador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enroll',
          empId: selectedEnrollEmpId,
          verifyCode: verifyCodeInput,
          deviceToken: devTok,
          deviceLabel: phoneMeta.label,
          userAgent: phoneMeta.userAgent,
          screen: phoneMeta.screen,
          qrToken: scannedToken || undefined,
          punchType: selectedPunchType || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setPhoneErrorMsg(data.error || 'No se pudo enrolar el dispositivo.');
        setIsSubmittingEnroll(false);
        return;
      }

      await fetchMarcadorState();

      if (data.scanEvent) {
        setPhoneScanResult(data.scanEvent);
        setPhoneScanStatus('success');
        playSuccessBeep();
      } else {
        setPhoneScanStatus('idle');
      }
    } catch {
      setPhoneErrorMsg('Error de red al enrolar el dispositivo.');
    } finally {
      setIsSubmittingEnroll(false);
    }
  };

  // URL codificada dentro del QR dinámico (cambia cada 15s y al usarse)
  const qrTargetUrl = useMemo(() => {
    if (!kioskToken) return '';
    return `${originUrl}/Marcador?t=${encodeURIComponent(kioskToken)}`;
  }, [originUrl, kioskToken]);

  const qrMatrix = useMemo(() => {
    if (!qrTargetUrl) return null;
    try {
      return generateQrMatrix(qrTargetUrl);
    } catch {
      return null;
    }
  }, [qrTargetUrl]);

  const progressPct = Math.max(0, Math.min(100, (secondsLeft / 15) * 100));

  // ============================================================================
  // VISTA 1: CELULAR DEL COLABORADOR (AL ESCANEAR EL QR O ENROLARSE)
  // ============================================================================
  if (viewMode === 'phone') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6">
        {/* Barra Superior */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white">
                Marcador QR • Grupo KODE
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">{svTimeStr}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setViewMode('kiosk')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Ver Monitor QR</span>
          </button>
        </div>

        {/* Contenido Central del Celular */}
        <div className="max-w-md w-full mx-auto my-auto py-6 space-y-5">
          {isLoadingPhone || phoneScanStatus === 'scanning' ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
              <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
              <h2 className="text-lg font-black text-white">
                Validando código QR y dispositivo...
              </h2>
              <p className="text-xs text-slate-400">
                Registrando tu marcación en la base de datos en tiempo real.
              </p>
            </div>
          ) : phoneScanStatus === 'success' && phoneScanResult ? (
            /* PANTALLA DE ÉXITO EN EL CELULAR: "QR Escaneado, ¡Bienvenido Rodolfo!" */
            <div className="bg-gradient-to-b from-emerald-950/90 to-slate-900 border-2 border-emerald-500 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  QR Escaneado Correctamente
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white pt-2">
                  {phoneScanResult.greetingTitle}
                </h2>
                <p className="text-sm font-bold text-emerald-300">
                  {phoneScanResult.empName}
                </p>
                <p className="text-xs text-slate-400">
                  {phoneScanResult.position} • {phoneScanResult.department}
                </p>
              </div>

              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase">
                  Marcación Guardada en Planilla
                </div>
                <div className="text-lg font-black text-emerald-400">
                  {phoneScanResult.punchLabel}
                </div>
                <div className="text-3xl font-mono font-black text-white">
                  {phoneScanResult.timeFullStr}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Fecha: {phoneScanResult.dateStr} • Dispositivo verificado
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Tu registro ya aparece en el monitor y en la Planilla Salarial. Ya puedes cerrar esta ventana.
              </p>
            </div>
          ) : !myEmployee || phoneScanStatus === 'enroll_needed' ? (
            /* PANTALLA DE ENROLAMIENTO DE TELÉFONO POR PRIMERA VEZ */
            <form
              onSubmit={handleEnrollSubmit}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                    Enrolamiento Único de Dispositivo
                  </span>
                  <h2 className="text-lg font-black text-white">
                    Vincula tu Celular
                  </h2>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Selecciona tu nombre por única vez. Este teléfono quedará registrado a tu perfil para que cuando escanees el QR el sistema te reconozca automáticamente.
              </p>

              {phoneErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{phoneErrorMsg}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  1. Selecciona tu Nombre:
                </label>
                <select
                  value={selectedEnrollEmpId}
                  onChange={(e) => setSelectedEnrollEmpId(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-black focus:outline-none focus:border-indigo-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.position}) {emp.isEnrolled ? '• Ya enrolado' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  2. Últimos 4 dígitos de tu DUI/Pasaporte o tu Código (ej. 001):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={verifyCodeInput}
                    onChange={(e) => setVerifyCodeInput(e.target.value)}
                    placeholder="Ej. últimos 4 de DUI o 003"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm font-black placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {scannedToken && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    3. Tipo de Marcación (Automático o elige uno):
                  </label>
                  <select
                    value={selectedPunchType}
                    onChange={(e) => setSelectedPunchType(e.target.value as PunchType | '')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold"
                  >
                    <option value="">Automático según orden del día</option>
                    <option value="entrada">1. Entrada de Turno</option>
                    <option value="salida_almuerzo">2. Salida a Almuerzo</option>
                    <option value="entrada_almuerzo">3. Regreso de Almuerzo</option>
                    <option value="salida_turno">4. Salida de Turno</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingEnroll}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingEnroll
                  ? 'Vinculando teléfono...'
                  : scannedToken
                  ? 'Enrolar mi Celular y Marcar Ahora'
                  : 'Guardar y Enrolar mi Celular'}
              </button>
            </form>
          ) : (
            /* TELÉFONO YA ENROLADO (CUANDO ABRE SIN ESCANEAR O SI EL QR EXPIRÓ) */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Teléfono Enrolado y Verificado
                  </span>
                  <h2 className="text-xl font-black text-white mt-0.5">
                    Hola, {myEmployee.firstName}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {myEmployee.fullName} • {myEmployee.position}
                  </p>
                </div>
              </div>

              {phoneErrorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{phoneErrorMsg}</span>
                  </div>
                </div>
              )}

              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Tus Marcaciones de Hoy ({svDateStr})
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">1. Entrada Turno</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {myEmployee.todayPunch.marcacionEntrada || '— : —'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">2. Salida Almuerzo</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {myEmployee.todayPunch.marcacionSalidaAlmuerzo || '— : —'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">3. Regreso Almuerzo</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {myEmployee.todayPunch.marcacionEntradaAlmuerzo || '— : —'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">4. Salida Turno</span>
                    <span className="font-mono font-black text-indigo-400 text-sm">
                      {myEmployee.todayPunch.marcacionSalidaTurno || '— : —'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-1">
                <QrCode className="w-7 h-7 text-indigo-400 mx-auto" />
                <div className="text-xs font-black text-white">
                  Abre la cámara de tu celular y apunta al QR del monitor
                </div>
                <p className="text-[11px] text-slate-400">
                  El código del monitor cambia cada 15 segundos y al escanearlo registrará tu asistencia de inmediato.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pie de página */}
        <div className="text-center text-[11px] text-slate-600">
          Sistema de Asistencia Biométrica Digital • Grupo KODE S.A.S. de C.V.
        </div>
      </div>
    );
  }

  // ============================================================================
  // VISTA 2: MONITOR KIOSCO EN GRANDE (aromaniaksv.com/Marcador)
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-5 lg:p-8 select-none overflow-hidden">
      {/* Encabezado del Monitor */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white">
              Marcador de Asistencia QR • Grupo KODE
            </h1>
            <p className="text-xs text-slate-400 capitalize">{svDateStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span className="text-2xl lg:text-3xl font-mono font-black text-white tracking-wider">
              {svTimeStr || '--:--:--'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setViewMode('phone')}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Enrolar mi Celular</span>
          </button>
        </div>
      </div>

      {/* Cuerpo Principal del Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 items-center">
        {/* Columna Izquierda / Centro (7 cols): QR Gigante o Pantalla de Bienvenida al Registrar */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          {activeCelebration ? (
            /* PANTALLA GIGANTE EN EL MONITOR CUANDO UN EMPLEADO ESCANEA */
            <div className="w-full max-w-xl bg-gradient-to-b from-emerald-950 via-emerald-900/60 to-slate-900 border-4 border-emerald-400 rounded-[2rem] p-8 lg:p-10 text-center space-y-6 shadow-2xl shadow-emerald-500/20 animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-emerald-400/20 border-4 border-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-14 h-14 text-emerald-300" />
              </div>

              <div className="space-y-2">
                <span className="px-4 py-1 rounded-full bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-widest">
                  ¡Bienvenido • Registro Exitoso!
                </span>
                <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight pt-2">
                  {activeCelebration.greetingTitle}
                </h2>
                <p className="text-lg font-bold text-emerald-200">
                  {activeCelebration.empName}
                </p>
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {activeCelebration.position} • {activeCelebration.department}
                </p>
              </div>

              <div className="bg-slate-950/80 border border-emerald-400/40 rounded-2xl p-5 flex items-center justify-around">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    Evento Registrado
                  </span>
                  <span className="text-lg lg:text-xl font-black text-emerald-400">
                    {activeCelebration.punchLabel}
                  </span>
                </div>
                <div className="h-10 w-px bg-slate-800" />
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    Hora Oficial BD
                  </span>
                  <span className="text-2xl lg:text-3xl font-mono font-black text-white">
                    {activeCelebration.timeFullStr}
                  </span>
                </div>
              </div>

              <p className="text-xs text-emerald-300 font-bold">
                Generando nuevo código QR dinámico para el siguiente colaborador...
              </p>
            </div>
          ) : (
            /* TARJETA DEL CÓDIGO QR EN GRANDE (SE RENUEVA CADA 15 SEGUNDOS Y AL USARSE) */
            <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-[2rem] p-6 lg:p-8 flex flex-col items-center text-center space-y-5 shadow-2xl">
              <div className="flex items-center justify-between w-full text-xs">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-black uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  QR Anti-Foto • Un Solo Uso
                </span>
                <span className="font-mono font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full">
                  Nuevo QR en {secondsLeft}s
                </span>
              </div>

              {/* Lienzo Blanco del QR en Grande */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-2xl border-4 border-emerald-500/80 relative">
                {qrMatrix ? (
                  <svg
                    viewBox={`0 0 ${qrMatrix.length + 8} ${qrMatrix.length + 8}`}
                    className="w-64 h-64 sm:w-80 sm:h-80 lg:w-88 lg:h-88 block"
                    shapeRendering="crispEdges"
                  >
                    <rect
                      x="0"
                      y="0"
                      width={qrMatrix.length + 8}
                      height={qrMatrix.length + 8}
                      fill="#ffffff"
                    />
                    {qrMatrix.map((row, rIdx) =>
                      row.map((cell, cIdx) =>
                        cell ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx + 4}
                            y={rIdx + 4}
                            width={1}
                            height={1}
                            fill="#0f172a"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                ) : (
                  <div className="w-72 h-72 flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-10 h-10 animate-spin" />
                  </div>
                )}
              </div>

              {/* Barra de progreso de 15 segundos */}
              <div className="w-full space-y-1.5">
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 font-semibold">
                  Escanea con la cámara de tu celular para registrar tu entrada, almuerzo o salida
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha (5 cols): Estado de Hoy y Últimas Marcaciones en Vivo */}
        <div className="lg:col-span-5 space-y-4">
          {/* Panel de Colaboradores Hoy */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Asistencia del Personal Hoy
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {employees.filter((e) => e.isEnrolled).length}/{employees.length} celulares enrolados
              </span>
            </div>

            <div className="space-y-2">
              {employees.map((emp) => {
                const p = emp.todayPunch;
                return (
                  <div
                    key={emp.id}
                    className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/90 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{emp.fullName}</span>
                        {emp.isEnrolled ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9.5px] font-bold">
                            📱 Enrolado
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[9.5px] font-bold">
                            Sin enrolar
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-400">{emp.position}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span
                        className={`px-2 py-1 rounded-lg border ${
                          p.marcacionEntrada
                            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 font-black'
                            : 'bg-slate-900 border-slate-800 text-slate-600'
                        }`}
                        title="1. Entrada de Turno"
                      >
                        E: {p.marcacionEntrada || '--:--'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-lg border ${
                          p.marcacionSalidaAlmuerzo
                            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-600'
                        }`}
                        title="2. Salida Almuerzo / 3. Regreso Almuerzo"
                      >
                        A: {p.marcacionSalidaAlmuerzo || '--:--'} / {p.marcacionEntradaAlmuerzo || '--:--'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-lg border ${
                          p.marcacionSalidaTurno
                            ? 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300 font-black'
                            : 'bg-slate-900 border-slate-800 text-slate-600'
                        }`}
                        title="4. Salida de Turno"
                      >
                        S: {p.marcacionSalidaTurno || '--:--'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historial de Escaneos Recientes de Hoy */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2.5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Últimos Escaneos Registrados
            </h3>
            {todayLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Esperando el primer escaneo QR del día...
              </p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {todayLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-black text-emerald-400">{log.firstName}</span>{' '}
                      <span className="text-slate-300 font-semibold">— {log.punchLabel}</span>
                    </div>
                    <span className="font-mono font-black text-white">{log.timeFullStr}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pie del Monitor */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-900 pt-3">
        <span>pos.aromaniaksv.com/Marcador • Sincronizado en vivo con Planilla Salarial</span>
        <span>Cada código QR caduca en 15 segundos o al primer escaneo</span>
      </div>
    </div>
  );
}
