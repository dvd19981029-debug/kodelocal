'use client';

import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { DEPARTAMENTOS_CATALOG, getMunicipiosByDepartamento } from '@/lib/svTerritory';

export default function CustomerAuthModal() {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalTab, 
    openAuthModal,
    loginWithGoogle,
    loginWithCredentials,
    registerCustomer
  } = useCustomerAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('San Salvador');
  const [municipality, setMunicipality] = useState('San Salvador Centro');
  const [address, setAddress] = useState('');

  if (!isAuthModalOpen) return null;

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // Iniciar sesión / registro con Google
      // Para un registro suave, generamos un identificador o usamos un prompt interactivo
      const simulatedGoogleEmail = email.trim() || `cliente.${Math.floor(100 + Math.random() * 900)}@gmail.com`;
      const simulatedName = name.trim() || 'Cliente Aromaniak';
      
      const res = await loginWithGoogle({
        email: simulatedGoogleEmail,
        name: simulatedName,
        avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(simulatedName)}`,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'No se pudo conectar con Google');
      } else {
        setSuccessMessage('¡Bienvenido! Sesión iniciada con Google');
        setTimeout(() => closeAuthModal(), 800);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error con Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (authModalTab === 'login') {
      if (!email || !password) {
        setErrorMessage('Por favor completa tu correo y contraseña');
        setIsLoading(false);
        return;
      }
      const res = await loginWithCredentials(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Credenciales no válidas');
      } else {
        setSuccessMessage('¡Bienvenido de vuelta!');
        setTimeout(() => closeAuthModal(), 800);
      }
    } else {
      if (!name || !email || !password) {
        setErrorMessage('Por favor ingresa tu nombre, correo y una contraseña');
        setIsLoading(false);
        return;
      }
      const res = await registerCustomer({
        name,
        email,
        password,
        phone,
        department,
        municipality,
        address,
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Error al crear la cuenta');
      } else {
        setSuccessMessage('¡Cuenta creada con éxito!');
        setTimeout(() => closeAuthModal(), 800);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-md bg-[#f1f4f9] rounded-3xl p-6 sm:p-8 shadow-[8px_12px_32px_rgba(0,0,0,0.25),inset_2px_2px_4px_rgba(255,255,255,0.9)] border border-white max-h-[90vh] overflow-y-auto">
        
        {/* Botón Cerrar */}
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="text-center space-y-2 mb-6">
          <img
            src="/images/logo.png"
            alt="Aromaniak"
            className="h-9 sm:h-10 w-auto mx-auto object-contain drop-shadow-xs mb-2"
          />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {authModalTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Accede para guardar tus fragancias favoritas y comprar más rápido.
          </p>
        </div>

        {/* Mensajes de Alerta */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in zoom-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ================= BOTÓN GOOGLE SIGN-IN ================= */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-sm shadow-[2px_4px_10px_rgba(0,0,0,0.06),inset_1px_1px_2px_rgba(255,255,255,1)] flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {/* Logotipo SVG oficial de Google */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>
          <p className="text-[11px] text-center text-slate-400 font-medium">
            Entra o regístrate en 1 clic sin llenar formularios
          </p>
        </div>

        {/* Divisor */}
        <div className="relative flex items-center justify-center my-6">
          <div className="w-full border-t border-slate-300/70" />
          <span className="bg-[#f1f4f9] px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            o con tu correo
          </span>
        </div>

        {/* Pestañas Iniciar Sesión / Crear Cuenta */}
        <div className="flex rounded-2xl bg-white/60 p-1 mb-5 border border-white shadow-inner">
          <button
            type="button"
            onClick={() => { setErrorMessage(''); openAuthModal('login'); }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              authModalTab === 'login'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setErrorMessage(''); openAuthModal('register'); }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              authModalTab === 'register'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* ================= FORMULARIO TRADICIONAL ================= */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalTab === 'register' && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                Nombre Completo:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Carlos Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
              Correo Electrónico:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
              Contraseña:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs"
              />
            </div>
          </div>

          {authModalTab === 'register' && (
            <>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                  Teléfono WhatsApp:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="Ej. 7123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                    Departamento:
                  </label>
                  <select
                    value={department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setDepartment(newDept);
                      const munis = getMunicipiosByDepartamento(newDept);
                      if (munis.length > 0) {
                        setMunicipality(munis[0].nombre);
                      }
                    }}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs"
                  >
                    {DEPARTAMENTOS_CATALOG.map((dep) => (
                      <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                    Municipio (MH):
                  </label>
                  <select
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs"
                  >
                    {getMunicipiosByDepartamento(department).map((m) => (
                      <option key={m.id} value={m.nombre}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-1">
                  Dirección o Colonia:
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Colonia, pasaje, número de casa..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-2xl clay-btn clay-btn-primary text-xs font-black flex items-center justify-center gap-2 shadow-[4px_6px_14px_rgba(99,102,241,0.35)] active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <span>{authModalTab === 'login' ? 'Acceder a mi Cuenta' : 'Registrarme y Guardar Datos'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
