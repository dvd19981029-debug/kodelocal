'use client';

import React, { useState } from 'react';
import { 
  X, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

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
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isAuthModalOpen) return null;

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
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
        setTimeout(() => closeAuthModal(), 700);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error al conectar con Google');
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
        setSuccessMessage('¡Bienvenido de nuevo!');
        setTimeout(() => closeAuthModal(), 700);
      }
    } else {
      if (!name || !email || !password) {
        setErrorMessage('Por favor ingresa tu nombre, correo y contraseña');
        setIsLoading(false);
        return;
      }
      const res = await registerCustomer({
        name,
        email,
        password,
        phone,
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Error al crear la cuenta');
      } else {
        setSuccessMessage('¡Cuenta creada con éxito!');
        setTimeout(() => closeAuthModal(), 700);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Tarjeta Modal Principal con bordes redondeados y sombra suave */}
      <div className="relative w-full max-w-sm sm:max-w-[400px] bg-white rounded-[2.5rem] p-7 sm:p-9 shadow-[0_25px_60px_rgba(0,0,0,0.18),inset_1px_1px_2px_rgba(255,255,255,0.9)] border border-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Botón Cerrar (X) */}
        <button 
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado con Ícono y Saludo */}
        <div className="text-center space-y-1 mb-6">
          <span className="text-4xl select-none inline-block">
            {authModalTab === 'login' ? '👋' : '✨'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {authModalTab === 'login' ? '¡Hola de nuevo!' : '¡Crea tu cuenta!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {authModalTab === 'login' 
              ? 'Entra para acceder a tus cupones' 
              : 'Regístrate para acceder a tus cupones'}
          </p>
        </div>

        {/* Mensajes de Alerta / Error */}
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

        {/* Botón Continuar con Google */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-slate-50/80 border border-slate-200/90 text-slate-800 font-bold text-sm sm:text-[15px] shadow-[0_3px_10px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {/* Logo Oficial de Google */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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

        {/* Divisor con la letra 'o' */}
        <div className="relative flex items-center justify-center my-5">
          <div className="w-full border-t border-slate-200/80" />
          <span className="absolute px-3 bg-white text-xs font-bold text-slate-400">
            o
          </span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {authModalTab === 'register' && (
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                placeholder="Tu nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-2xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#52b747] focus:ring-2 focus:ring-[#52b747]/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] font-medium transition-all"
              />
            </div>
          )}

          <div>
            <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#52b747] focus:ring-2 focus:ring-[#52b747]/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] font-medium transition-all"
            />
          </div>

          {authModalTab === 'register' && (
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                placeholder="7000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-2xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#52b747] focus:ring-2 focus:ring-[#52b747]/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] font-medium transition-all"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800">
                Contraseña
              </label>
              {authModalTab === 'login' && (
                <a
                  href="https://wa.me/50378339470?text=Hola%2C%20olvid%C3%A9%20la%20contrase%C3%B1a%20de%20mi%20cuenta%20de%20Aromaniak%20y%20necesito%20recuperarla"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#52b747] hover:text-[#439c39] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 text-sm rounded-2xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#52b747] focus:ring-2 focus:ring-[#52b747]/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] font-medium transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón Verde de Acción */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#52b747] hover:bg-[#47a63c] text-white font-black text-sm sm:text-base shadow-[0_4px_14px_rgba(82,183,71,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>{authModalTab === 'login' ? 'Entrar' : 'Registrarme'}</span>
            )}
          </button>
        </form>

        {/* Enlace Inferior para Alternar entre Login y Registro */}
        <div className="text-center mt-6">
          {authModalTab === 'login' ? (
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => { setErrorMessage(''); openAuthModal('register'); }}
                className="text-[#52b747] font-bold hover:underline cursor-pointer"
              >
                Regístrate gratis
              </button>
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => { setErrorMessage(''); openAuthModal('login'); }}
                className="text-[#52b747] font-bold hover:underline cursor-pointer"
              >
                Inicia sesión
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
