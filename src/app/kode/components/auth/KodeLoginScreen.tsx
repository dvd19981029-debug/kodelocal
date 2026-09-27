'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { Vendedora } from '../../types';

interface KodeLoginScreenProps {
  vendedoras: Vendedora[];
  onLoginSuccess: (user: any) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const KodeLoginScreen: React.FC<KodeLoginScreenProps> = ({
  vendedoras,
  onLoginSuccess,
  showToast,
}) => {
  const [mode, setMode] = useState<'SELECT' | 'MANUAL'>('SELECT');
  const [selectedVendedoraId, setSelectedVendedoraId] = useState<string>('');
  const [manualUser, setManualUser] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Lista unificada incluyendo al Gerente General
  const teamList = [
    ...vendedoras.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      rol: 'VENDEDORA',
      email: v.email,
    })),
    {
      id: 'user-admin',
      nombre: '👑 Luis (Gerente General)',
      rol: 'ADMIN',
      email: 'gerente@kodelocal.com',
    },
  ];

  // Preseleccionar primera asesora si existe
  useEffect(() => {
    if (vendedoras.length > 0 && !selectedVendedoraId) {
      setSelectedVendedoraId(vendedoras[0].id);
    }
  }, [vendedoras, selectedVendedoraId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const identifier = mode === 'SELECT' ? selectedVendedoraId : manualUser.trim();
    if (!identifier) {
      setError('Por favor selecciona tu usuario o ingresa tu correo');
      return;
    }

    if (!password.trim()) {
      setError('Por favor ingresa tu contraseña o PIN');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/kode/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        // Guardar sesión en localStorage
        localStorage.setItem('kode_auth_user', JSON.stringify(data.user));
        showToast(data.message || `¡Bienvenida, ${data.user.nombre}!`, 'success');
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Credenciales inválidas. Verifica tu contraseña.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f4f9] flex flex-col items-center justify-center p-4">
      {/* Tarjeta de Inicio de Sesión Claymorphic */}
      <div className="clay-card w-full max-w-md p-6 sm:p-9 relative animate-in fade-in zoom-in-95 duration-200 border border-slate-200/90 shadow-xl bg-white/95">
        {/* Encabezado y Logo de KÖDE */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-3xl shadow-[5px_8px_18px_rgba(99,102,241,0.35),inset_2px_2px_4px_rgba(255,255,255,0.7),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] mx-auto mb-3">
            K
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">KÖDE</h1>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 uppercase">
              Operaciones
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Módulo de Ventas, Perfumería & Enlaces de Pago
          </p>
        </div>

        {/* Pestañas de Modo: Selección de Asesora vs Correo/Manual */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('SELECT');
              setError('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'SELECT'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Seleccionar Asesora</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('MANUAL');
              setError('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'MANUAL'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Correo / Usuario</span>
          </button>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SELECT' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Selecciona tu Nombre *
              </label>
              <div className="relative">
                <select
                  value={selectedVendedoraId}
                  onChange={(e) => setSelectedVendedoraId(e.target.value)}
                  className="clay-input w-full text-xs font-bold py-2.5 bg-white cursor-pointer"
                  required
                >
                  {teamList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Correo o Nombre de Usuario *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={manualUser}
                  onChange={(e) => setManualUser(e.target.value)}
                  placeholder="ej. patricia@kodelocal.com o admin"
                  className="clay-input w-full pl-9 py-2.5 text-xs font-medium bg-white"
                />
              </div>
            </div>
          )}

          {/* Campo de Contraseña / PIN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Contraseña / PIN *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                Inicial: Kode2026*
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="clay-input w-full pl-9 pr-10 py-2.5 text-xs font-mono font-bold bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={loading}
            className="clay-btn clay-btn-primary w-full py-3 text-xs font-black rounded-xl mt-2 flex items-center justify-center gap-2 shadow-md shadow-indigo-200 cursor-pointer transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <span>Iniciar Sesión en KÖDE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Acceso rápido de demostración */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            Acceso Rápido por Asesora:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const patricia = vendedoras.find((v) =>
                  v.nombre.toLowerCase().includes('patricia')
                );
                if (patricia) setSelectedVendedoraId(patricia.id);
                setMode('SELECT');
                setPassword('Kode2026*');
              }}
              className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left cursor-pointer transition-colors"
            >
              <span className="text-[11px] font-extrabold text-slate-800 block truncate">
                🌸 Patricia Mejía
              </span>
              <span className="text-[9px] text-slate-400 block font-mono">Autocompletar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedVendedoraId('user-admin');
                setMode('SELECT');
                setPassword('admin123');
              }}
              className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-left cursor-pointer transition-colors"
            >
              <span className="text-[11px] font-extrabold text-purple-700 block truncate">
                👑 Gerente General
              </span>
              <span className="text-[9px] text-slate-400 block font-mono">Autocompletar</span>
            </button>
          </div>
        </div>

        {/* Pie de seguridad */}
        <div className="mt-5 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Acceso seguro y encriptado pos.aromaniaksv.com</span>
        </div>
      </div>
    </div>
  );
};
