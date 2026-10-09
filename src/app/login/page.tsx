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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // PIN
  const [pin, setPin] = useState('');
  
  const [error, setError] = useState('');

  
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginWithPin = async (pinValue: string) => {
    setError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/kode/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'cajero1@kodelocal.com', password: pinValue, isPin: true })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.user.rol === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/pos');
        }
      } else {
        setError(data.error || 'PIN incorrecto.');
      }
    } catch (e) {
      setError('Error de red.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  
  const handleLoginWithCredentialsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/kode/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password: password, isPin: false })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.user.rol === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/pos');
        }
      } else {
        setError(data.error || 'Credenciales inválidas.');
      }
    } catch (e) {
      setError('Error de red.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
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
          <>

          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 font-bold border border-slate-300 py-3.5 rounded-xl hover:bg-slate-50 hover:shadow-md transition-all shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Acceso Administradores (Google)
            </button>
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">O inicia sesión como empleado</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
          </div>
          <form onSubmit={handleLoginWithCredentialsForm} className="space-y-4">
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
          </>
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
        

      </div>

    </div>
  );
}
