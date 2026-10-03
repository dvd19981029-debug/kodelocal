'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function OpeningNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Verificar si el usuario ya aceptó el aviso en esta sesión
    const hasAccepted = sessionStorage.getItem('opening_notice_accepted');
    if (!hasAccepted) {
      setIsOpen(true);
    }

    // Fecha objetivo: 15 de octubre de 2026 00:00:00 (Hora El Salvador UTC-6)
    const targetDate = new Date('2026-10-15T00:00:00-06:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAccept = () => {
    sessionStorage.setItem('opening_notice_accepted', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="opening-modal-title"
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200"
      >
        {/* Ícono de Alerta / Apertura */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-xs">
          <Calendar className="w-7 h-7" />
        </div>

        {/* Título */}
        <h2 
          id="opening-modal-title"
          className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
        >
          ¡Gran Apertura el 15 de Octubre!
        </h2>

        {/* Mensaje Informativo */}
        <div className="mt-3.5 mb-6 space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed text-balance">
          <p>
            Te informamos que abriremos oficialmente nuestra tienda en línea el <strong className="text-slate-900 font-bold">15 de octubre</strong>.
          </p>
          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-amber-900 text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-medium">
              Las transacciones realizadas actualmente no se procesarán y Wompi aún no realiza cobros en esta etapa.
            </p>
          </div>
          <p className="text-slate-500 font-medium pt-1">
            Te invitamos a esperar con nosotros la apertura oficial:
          </p>
        </div>

        {/* Temporizador / Countdown */}
        <div className="mb-6 grid grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 shadow-2xs">
            <span className="block text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Días
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 shadow-2xs">
            <span className="block text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Horas
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 shadow-2xs">
            <span className="block text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Minutos
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 shadow-2xs">
            <span className="block text-2xl sm:text-3xl font-black text-indigo-600 font-mono tracking-tight">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5">
              Segundos
            </span>
          </div>
        </div>

        {/* Botón Aceptar y Continuar al Sitio */}
        <button
          type="button"
          onClick={handleAccept}
          className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Aceptar y continuar al sitio</span>
        </button>
      </div>
    </div>
  );
}
