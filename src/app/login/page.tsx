'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  KeyRound, 
  Mail, 
  Lock, 
  User, 
  Store, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getStoredUsers, setActiveUser, UserAccount } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'CREDENTIALS' | 'PIN'>('CREDENTIALS');
  
  // Credentials
  const [email, setEmail] = useState('gerente@kodelocal.com');
  const [password, setPassword] = useState('admin123');
  
  // PIN
  const [pin, setPin] = useState('');
  
  const [error, setError] = useState('');

  const handleLoginWithCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.isActive);

    if (found) {
      setActiveUser(found);
      if (found.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/pos');
      }
    } else {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
    }
  };

  const handleLoginWithPin = (pinValue: string) => {
    setError('');
    const users = getStoredUsers();
    const found = users.find(u => u.pin === pinValue && u.isActive);

    if (found) {
      setActiveUser(found);
      if (found.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/pos');
      }
    } else {
      setError('PIN incorrecto. Ingresa un PIN registrado.');
    }
  };

  const handleQuickLogin = (targetEmail: string) => {
    const users = getStoredUsers();
    const found = users.find(u => u.email === targetEmail);
    if (found) {
      setActiveUser(found);
      if (found.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/pos');
      }
    }
  };

  const handleNumpadClick = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        handleLoginWithPin(nextPin);
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      
      {/* Tarjeta Claymorphic Central */}
      <div className="clay-card w-full max-w-md p-8 sm:p-10 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Logo y Encabezado */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl shadow-[5px_8px_18px_rgba(99,102,241,0.4),inset_2px_2px_4px_rgba(255,255,255,0.7),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] mx-auto mb-3">
            K
          </div>
          <h2 className="text-2xl font-black text-slate-800">KodeLocal</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Control de Acceso y Gestión de Tienda</p>
        </div>

        {/* Selector de Modo: Correo vs PIN de Caja */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => { setMode('CREDENTIALS'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'CREDENTIALS' ? 'clay-btn-primary' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gerencia / Email</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('PIN'); setError(''); setPin(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'PIN' ? 'clay-btn-primary' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>PIN de Caja</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modo 1: Correo y Contraseña */}
        {mode === 'CREDENTIALS' ? (
          <form onSubmit={handleLoginWithCredentials} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@kodelocal.com"
                  className="clay-input has-icon w-full text-xs font-medium py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="clay-input has-icon w-full text-xs font-medium py-2.5"
                />
              </div>
            </div>

            <button
              type="submit"
              className="clay-btn clay-btn-primary w-full py-3 text-sm rounded-xl mt-2 flex items-center justify-center gap-2 shadow-[4px_6px_14px_rgba(79,70,229,0.35)]"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Modo 2: PIN Numérico para Cajeros */
          <div className="flex flex-col items-center">
            <p className="text-xs text-slate-500 mb-3 text-center">Ingresa tu PIN de 4 dígitos asignado</p>
            
            {/* Visualizador de PIN con burbujas */}
            <div className="flex gap-3 mb-5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all ${
                    pin.length > i 
                      ? 'bg-indigo-600 scale-110 shadow-[0_0_8px_rgba(99,102,241,0.6)]' 
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Teclado Táctil */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleNumpadClick(n)}
                  className="clay-btn clay-btn-light h-12 text-lg font-black rounded-xl"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="clay-btn clay-btn-light h-12 text-xs font-bold text-slate-400 rounded-xl"
              >
                Borrar
              </button>
              <button
                type="button"
                onClick={() => handleNumpadClick('0')}
                className="clay-btn clay-btn-light h-12 text-lg font-black rounded-xl"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPin(prev => prev.slice(0, -1))}
                className="clay-btn clay-btn-light h-12 text-xs font-bold text-rose-500 rounded-xl"
              >
                ⌫
              </button>
            </div>
          </div>
        )}

        {/* Acceso Rápido de Prueba (Demo) */}
        <div className="mt-8 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
            Usuarios de Prueba (1 Clic)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('gerente@kodelocal.com')}
              className="clay-btn clay-btn-light text-left p-2.5 rounded-xl border border-indigo-100 text-xs hover:border-indigo-300"
            >
              <span className="font-extrabold text-indigo-700 block">👑 Gerente General</span>
              <span className="text-[10px] text-slate-400">Acceso total y configuración</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('caja1@kodelocal.com')}
              className="clay-btn clay-btn-light text-left p-2.5 rounded-xl border border-emerald-100 text-xs hover:border-emerald-300"
            >
              <span className="font-extrabold text-emerald-700 block">🛒 Cajera (Ana)</span>
              <span className="text-[10px] text-slate-400">Solo POS (Costos ocultos)</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
