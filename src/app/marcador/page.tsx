'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  UserCheck,
  AlertTriangle,
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
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.setValueAtTime(880, now + 0.12);
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
  const [secondsLeft, setSecondsLeft] = useState<number>(15);
  const [svTimeStr, setSvTimeStr] = useState<string>('');
  const [svDateStr, setSvDateStr] = useState<string>('');
  const [activeCelebration, setActiveCelebration] = useState<ScanEventRecord | null>(null);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const lastCelebratedIdRef = useRef<string | null>(null);
  const lastTokenRef = useRef<string>('');
  const localExpiresAtRef = useRef<number>(Date.now() + 15000);
  const isRotatingRef = useRef<boolean>(false);

  // Estado del Celular (Enrolamiento y Escaneo)
  const [deviceToken, setDeviceToken] = useState<string>('');
  const [myEmployee, setMyEmployee] = useState<EmployeeSummary | null>(null);
  const [isLoadingPhone, setIsLoadingPhone] = useState<boolean>(true);
  const [selectedEnrollEmpId, setSelectedEnrollEmpId] = useState<string>('');
  const [verifyCodeInput, setVerifyCodeInput] = useState<string>('');
  const [phoneScanStatus, setPhoneScanStatus] = useState<
    'idle' | 'scanning' | 'success' | 'enroll_needed' | 'error'
  >('idle');
  const [phoneScanResult, setPhoneScanResult] = useState<ScanEventRecord | null>(null);
  const [phoneErrorMsg, setPhoneErrorMsg] = useState<string>('');
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState<boolean>(false);
  const autoScannedRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setOriginUrl(window.location.origin);
    } else {
      setOriginUrl('https://pos.aromaniaksv.com');
    }

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

  const fetchMarcadorState = useCallback(
    async (forceRotate = false) => {
      try {
        const devTok = deviceToken || getOrCreateDeviceToken();
        const rotateParam = forceRotate ? '&rotate=1' : '';
        const res = await fetch(
          `/api/marcador?deviceToken=${encodeURIComponent(devTok)}${rotateParam}&_=${Date.now()}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (!data.success) return;

        if (data.kiosk) {
          if (data.kiosk.token && data.kiosk.token !== lastTokenRef.current) {
            lastTokenRef.current = data.kiosk.token;
            setKioskToken(data.kiosk.token);
            const rem =
              typeof data.kiosk.remainingMs === 'number' && data.kiosk.remainingMs > 1000
                ? data.kiosk.remainingMs
                : 15000;
            localExpiresAtRef.current = Date.now() + rem;
            setSecondsLeft(Math.ceil(rem / 1000));
            isRotatingRef.current = false;
          }

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
    },
    [deviceToken, selectedEnrollEmpId]
  );

  // Reloj en vivo de El Salvador cada segundo + cuenta regresiva exacta de 15s a 0s
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

      const remMs = Math.max(0, localExpiresAtRef.current - Date.now());
      const secs = Math.ceil(remMs / 1000);
      setSecondsLeft(secs);

      if (remMs <= 0 && viewMode === 'kiosk' && !isRotatingRef.current) {
        isRotatingRef.current = true;
        localExpiresAtRef.current = Date.now() + 15000;
        fetchMarcadorState(true);
      }
    };

    updateClock();
    const timer = setInterval(updateClock, 250);
    return () => clearInterval(timer);
  }, [viewMode, fetchMarcadorState]);

  const executePhoneScan = useCallback(async (qrTok: string, devTok: string) => {
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
  }, []);

  useEffect(() => {
    fetchMarcadorState(false);
    const interval = setInterval(
      () => fetchMarcadorState(false),
      viewMode === 'kiosk' ? 1500 : 5000
    );
    return () => clearInterval(interval);
  }, [fetchMarcadorState, viewMode]);

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
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setPhoneErrorMsg(data.error || 'No se pudo enrolar el dispositivo.');
        setIsSubmittingEnroll(false);
        return;
      }

      await fetchMarcadorState(false);

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
  // VISTA CELULAR DEL COLABORADOR (AL ESCANEAR EL QR) — ESTÉTICA BLANCA POS
  // ============================================================================
  if (viewMode === 'phone') {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
              Reloj Marcador
            </span>
            <div className="text-3xl font-mono font-black text-slate-900">{svTimeStr}</div>
          </div>

          {isLoadingPhone || phoneScanStatus === 'scanning' ? (
            <div className="clay-card bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
              <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
              <h2 className="text-base font-black text-slate-900">Registrando marcación...</h2>
            </div>
          ) : phoneScanStatus === 'success' && phoneScanResult ? (
            <div className="clay-card bg-white p-7 rounded-3xl border-2 border-emerald-500 text-center space-y-4 shadow-md">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block">
                  QR Escaneado
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  {phoneScanResult.greetingTitle}
                </h2>
                <p className="text-xs font-bold text-slate-500">{phoneScanResult.empName}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                <div className="text-xs font-black text-emerald-700">
                  {phoneScanResult.punchLabel}
                </div>
                <div className="text-2xl font-mono font-black text-slate-900">
                  {phoneScanResult.timeFullStr}
                </div>
                <div className="text-[11px] text-slate-400 font-semibold">
                  Registro exitoso
                </div>
              </div>
            </div>
          ) : !myEmployee || phoneScanStatus === 'enroll_needed' ? (
            <form
              onSubmit={handleEnrollSubmit}
              className="clay-card bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                    Primera vez
                  </span>
                  <h2 className="text-base font-black text-slate-900">Enrolar mi Celular</h2>
                </div>
              </div>

              {phoneErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{phoneErrorMsg}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Colaborador:
                </label>
                <select
                  value={selectedEnrollEmpId}
                  onChange={(e) => setSelectedEnrollEmpId(e.target.value)}
                  className="clay-input w-full px-3 py-2.5 text-sm font-bold text-slate-900"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Últimos 4 dígitos de Documento o Código:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={verifyCodeInput}
                    onChange={(e) => setVerifyCodeInput(e.target.value)}
                    placeholder="Ej. últimos 4 de DUI o 001"
                    className="clay-input w-full pl-9 pr-3 py-2.5 font-mono text-sm font-black text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingEnroll}
                className="clay-btn clay-btn-primary w-full py-3 rounded-2xl font-black text-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmittingEnroll ? 'Registrando...' : 'Confirmar y Marcar'}
              </button>
            </form>
          ) : (
            <div className="clay-card bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
              {phoneErrorMsg ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {phoneErrorMsg}
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-black text-slate-900">
                    Hola, {myEmployee.firstName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Apunta la cámara de tu celular al código QR del monitor para registrar tu marcación.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // VISTA MONITOR KIOSCO: BLANCO TOTALMENTE LIMPIO, RELOJ ARRIBA Y QR AL CENTRO
  // ============================================================================
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-6">
        {/* Arriba: Reloj Marcador con la hora actual */}
        <div className="space-y-1">
          <h1 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Reloj Marcador
          </h1>
          <div className="text-5xl sm:text-6xl font-mono font-black text-slate-900 tracking-tight">
            {svTimeStr || '--:--:--'}
          </div>
          <p className="text-xs font-semibold text-slate-400 capitalize">{svDateStr}</p>
        </div>

        {/* Centro: QR en grande o Mensaje de Registro Exitoso */}
        {activeCelebration ? (
          <div className="w-full clay-card bg-white border-2 border-emerald-500 rounded-[2rem] p-8 text-center space-y-4 shadow-lg animate-in fade-in duration-150">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                Registro Exitoso
              </span>
              <h2 className="text-3xl font-black text-slate-900 pt-1">
                {activeCelebration.greetingTitle}
              </h2>
              <p className="text-sm font-bold text-slate-500">{activeCelebration.empName}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-sm">
              <span className="font-black text-emerald-700">{activeCelebration.punchLabel}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono font-black text-slate-900 text-lg">
                {activeCelebration.timeFullStr}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full clay-card bg-white border border-slate-200/90 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center space-y-5 shadow-md">
            <div className="bg-white p-2 rounded-2xl">
              {qrMatrix ? (
                <svg
                  viewBox={`0 0 ${qrMatrix.length + 6} ${qrMatrix.length + 6}`}
                  className="w-72 h-72 sm:w-80 sm:h-80 block"
                  shapeRendering="crispEdges"
                >
                  <rect
                    x="0"
                    y="0"
                    width={qrMatrix.length + 6}
                    height={qrMatrix.length + 6}
                    fill="#ffffff"
                  />
                  {qrMatrix.map((row, rIdx) =>
                    row.map((cell, cIdx) =>
                      cell ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx + 3}
                          y={rIdx + 3}
                          width={1}
                          height={1}
                          fill="#0f172a"
                        />
                      ) : null
                    )
                  )}
                </svg>
              ) : (
                <div className="w-72 h-72 flex items-center justify-center text-slate-300">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              )}
            </div>

            {/* Barra limpia de 15 segundos */}
            <div className="w-full space-y-1.5">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-900 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-[11px] font-mono font-bold text-slate-400">
                {secondsLeft}s
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
