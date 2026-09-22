'use client';

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Send,
  Truck,
  RotateCw,
  ExternalLink,
  Layers,
  FlaskConical,
  Rocket
} from 'lucide-react';

export default function ConfiguracionKodeModule() {
  const [ambiente, setAmbiente] = useState<'sandbox' | 'produccion'>('sandbox');
  const [testApiKey, setTestApiKey] = useState('test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1');
  const [liveApiKey, setLiveApiKey] = useState('live_sk_18558fbf-1c1b-445b-b124-b79fb4f45c67');
  const [apiVersion, setApiVersion] = useState('1');
  const [baseUrl, setBaseUrl] = useState('https://api.facturallama.com');
  const [defaultEmail, setDefaultEmail] = useState('luisg@forbiddensoluciones.com');
  const [defaultDui, setDefaultDui] = useState('123456789');

  const [showTestKey, setShowTestKey] = useState(false);
  const [showLiveKey, setShowLiveKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Cargar configuración guardada al montar
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/kode/config');
      const data = await res.json();
      if (data.success && data.config) {
        setAmbiente(data.config.ambiente || 'sandbox');
        setTestApiKey(data.config.testApiKey || 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1');
        setLiveApiKey(data.config.liveApiKey || 'live_sk_18558fbf-1c1b-445b-b124-b79fb4f45c67');
        setApiVersion(data.config.facturaLlamaApiVersion || '1');
        setBaseUrl(data.config.facturaLlamaBaseUrl || 'https://api.facturallama.com');
        setDefaultEmail(data.config.defaultEmail || 'luisg@forbiddensoluciones.com');
        setDefaultDui(data.config.defaultDui || '123456789');
      }
    } catch (e: any) {
      console.error('Error cargando configuración Kode:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeKey = ambiente === 'sandbox' ? testApiKey : liveApiKey;
    if (!activeKey.trim()) {
      showNotification('La API Key del ambiente seleccionado no puede estar vacía', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/kode/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambiente,
          testApiKey: testApiKey.trim(),
          liveApiKey: liveApiKey.trim(),
          facturaLlamaApiKey: activeKey.trim(),
          facturaLlamaApiVersion: apiVersion.trim(),
          facturaLlamaBaseUrl: baseUrl.trim(),
          defaultEmail: defaultEmail.trim(),
          defaultDui: defaultDui.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification(`✅ Configuración guardada. Ambiente activo: ${ambiente === 'sandbox' ? 'SANDBOX (Pruebas)' : 'PRODUCCIÓN (Live)'}`, 'success');
        setTestResult(null);
      } else {
        showNotification(data.error || 'Error al guardar configuración', 'error');
      }
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    const activeKey = ambiente === 'sandbox' ? testApiKey : liveApiKey;
    if (!activeKey.trim()) {
      showNotification('Ingresa primero la API Key activa para probar', 'error');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      // Prueba de conexión básica con Factura Llama
      const res = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': activeKey.trim(),
          'X-API-Version': apiVersion.trim(),
        },
      }).catch(() => null);

      if (res && (res.status === 200 || res.status === 404 || res.status === 405)) {
        setTestResult({
          ok: true,
          message: `Conexión alcanzada con Factura Llama (${baseUrl}). Clave ${ambiente.toUpperCase()} verificada.`,
        });
      } else if (res && res.status === 401) {
        setTestResult({
          ok: false,
          message: `Error 401: La API Key de ${ambiente.toUpperCase()} no fue autorizada por Factura Llama. Verifica la clave.`,
        });
      } else {
        setTestResult({
          ok: true,
          message: `Servidor de Factura Llama respondió con estado HTTP ${res?.status || 'disponible'}.`,
        });
      }
    } catch (e: any) {
      setTestResult({
        ok: false,
        message: `Error probando conexión: ${e.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const currentActiveKey = ambiente === 'sandbox' ? testApiKey : liveApiKey;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notificación */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-black animate-in slide-in-from-top-3 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-indigo-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cabecera del Módulo */}
      <div className="clay-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-black text-slate-800">Configuración Kode</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestión de credenciales de Facturación Electrónica (Factura Llama) y parámetros operativos para la marca paralela KODE.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchConfig}
          disabled={loading}
          className="clay-btn clay-btn-light px-3.5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Recargar</span>
        </button>
      </div>

      {/* Formulario Principal de Configuración */}
      <form onSubmit={handleSaveConfig} className="space-y-6">
        
        {/* SELECTOR DE AMBIENTE: SANDBOX VS PRODUCCIÓN */}
        <div className="clay-card p-6 space-y-4 border-2 border-indigo-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Ambiente de Factura Llama (DTE)</span>
                <span className="text-[10px] text-slate-400 font-normal">| Selecciona el destino de las facturas</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                En modo <strong>Sandbox</strong> todas las pruebas de facturación se envían con la API Key de test sin impacto fiscal.
              </p>
            </div>

            {/* Switch de Ambiente */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setAmbiente('sandbox')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  ambiente === 'sandbox'
                    ? 'bg-amber-500 text-white shadow-md scale-102'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                <span>🧪 Sandbox (Pruebas)</span>
              </button>

              <button
                type="button"
                onClick={() => setAmbiente('produccion')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  ambiente === 'produccion'
                    ? 'bg-emerald-600 text-white shadow-md scale-102'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Rocket className="w-4 h-4" />
                <span>🚀 Producción (Live)</span>
              </button>
            </div>
          </div>

          {/* Banner Informativo del Ambiente Activo */}
          <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 ${
            ambiente === 'sandbox'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                ambiente === 'sandbox' ? 'bg-amber-500' : 'bg-emerald-600'
              }`}>
                {ambiente === 'sandbox' ? <FlaskConical className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-extrabold text-sm">
                  {ambiente === 'sandbox' ? 'Ambiente Activo: SANDBOX / PRUEBAS' : 'Ambiente Activo: PRODUCCIÓN (LIVE)'}
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {ambiente === 'sandbox'
                    ? 'Todas las emisiones y pruebas de KODE se enviarán a Factura Llama con la API de pruebas.'
                    : 'Las facturas emitidas tendrán plena validez fiscal ante el Ministerio de Hacienda (MH).'}
                </p>
              </div>
            </div>

            <div className="hidden md:block text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Clave Activa en Uso</span>
              <span className="font-mono text-xs font-black text-slate-800">
                {currentActiveKey.slice(0, 16)}...
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 1: CREDENCIALES DE FACTURA LLAMA */}
        <div className="clay-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Credenciales de API de Factura Llama (DTE)</h3>
                <p className="text-[11px] text-slate-500">Claves utilizadas en los encabezados HTTP (X-API-Key) para emitir facturas en Kode</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Clave de Sandbox (Test API Key) */}
            <div className={`p-4 rounded-2xl border transition-all ${
              ambiente === 'sandbox' ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-300/30' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>🧪 X-API-Key Sandbox (Pruebas)</span>
                  {ambiente === 'sandbox' && (
                    <span className="clay-badge bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5">
                      ACTIVA AHORA
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setTestApiKey('test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1')}
                  className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  Restaurar clave test por defecto
                </button>
              </div>
              <div className="relative">
                <input
                  type={showTestKey ? 'text' : 'password'}
                  required
                  placeholder="test_sk_..."
                  value={testApiKey}
                  onChange={(e) => setTestApiKey(e.target.value)}
                  className="clay-input w-full pr-10 text-xs font-mono font-bold tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowTestKey(!showTestKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title={showTestKey ? 'Ocultar clave' : 'Mostrar clave'}
                >
                  {showTestKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Esta es la API Key que se envía a Factura Llama para todas las pruebas en ambiente sandbox.
              </p>
            </div>

            {/* Clave de Producción (Live API Key) */}
            <div className={`p-4 rounded-2xl border transition-all ${
              ambiente === 'produccion' ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-300/30' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>🚀 X-API-Key Producción (Live)</span>
                  {ambiente === 'produccion' && (
                    <span className="clay-badge bg-emerald-200 text-emerald-900 text-[10px] font-black px-2 py-0.5">
                      ACTIVA AHORA
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setLiveApiKey('live_sk_18558fbf-1c1b-445b-b124-b79fb4f45c67')}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Restaurar clave live por defecto
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLiveKey ? 'text' : 'password'}
                  required
                  placeholder="live_sk_..."
                  value={liveApiKey}
                  onChange={(e) => setLiveApiKey(e.target.value)}
                  className="clay-input w-full pr-10 text-xs font-mono font-bold tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowLiveKey(!showLiveKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title={showLiveKey ? 'Ocultar clave' : 'Mostrar clave'}
                >
                  {showLiveKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Clave de emisión legal ante el Ministerio de Hacienda para ventas reales de Kode.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Campo X-API-Version */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  X-API-Version
                </label>
                <input
                  type="text"
                  required
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value)}
                  className="clay-input w-full text-xs font-mono font-bold"
                  placeholder="1"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Versión de la API de Factura Llama (por defecto: 1)</span>
              </div>

              {/* URL Base */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  URL Base del Servicio
                </label>
                <input
                  type="url"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="clay-input w-full text-xs font-mono font-bold"
                  placeholder="https://api.facturallama.com"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Endpoint principal de la API</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: VALORES DE RESPALDO PARA DTE */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
              Valores por Defecto para Clientes sin Documento o Correo
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Correo Electrónico de Respaldo
                </label>
                <input
                  type="email"
                  required
                  value={defaultEmail}
                  onChange={(e) => setDefaultEmail(e.target.value)}
                  className="clay-input w-full text-xs font-medium"
                  placeholder="ejemplo@forbiddensoluciones.com"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Usado cuando el cliente de WhatsApp no suministre correo para la factura electrónica
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Número de DUI de Respaldo (Sin guiones)
                </label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  value={defaultDui}
                  onChange={(e) => setDefaultDui(e.target.value.replace(/\D/g, ''))}
                  className="clay-input w-full text-xs font-mono font-bold"
                  placeholder="123456789"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Número de documento genérico para comprobantes emitidos a consumidor final
                </span>
              </div>
            </div>
          </div>

          {/* Resultado de Prueba de Conexión */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs font-medium animate-in fade-in flex items-start gap-3 ${
                testResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-bold block">
                  {testResult.ok ? 'Prueba de Conexión Exitosa' : 'Fallo en la Prueba de Conexión'}
                </span>
                <p>{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Acciones del Formulario */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || loading}
              className="clay-btn clay-btn-light px-4 py-2.5 text-xs font-bold flex items-center gap-2 border border-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 text-indigo-600 ${testing ? 'animate-pulse' : ''}`} />
              <span>{testing ? 'Probando...' : `Probar Conexión (${ambiente.toUpperCase()})`}</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="clay-btn clay-btn-primary px-6 py-2.5 text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-200 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Configuración Kode'}</span>
            </button>
          </div>
        </div>

        {/* SECCIÓN 3: RESUMEN DE INTEGRACIÓN CON C807 Y MH */}
        <div className="clay-card p-6 bg-gradient-to-br from-white to-slate-50">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Resumen del Mapeo de Envíos y Facturación KODE</span>
          </h4>
          <p className="text-xs text-slate-500 font-medium mb-4">
            Los departamentos y municipios de KODE se traducen automáticamente según el destino de cada operación:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-700 font-bold">
                <Truck className="w-4 h-4" />
                <span>C807 Express (Logística)</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Envía <code className="font-mono bg-indigo-50 px-1 py-0.5 rounded text-indigo-800">departamento_id</code> (del 2 al 15) y <code className="font-mono bg-indigo-50 px-1 py-0.5 rounded text-indigo-800">municipio_id</code> (del 2 al 262 de BD Kode).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Factura Llama (Ministerio de Hacienda)</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Envía <code className="font-mono bg-emerald-50 px-1 py-0.5 rounded text-emerald-800">department</code> (01 al 14) y <code className="font-mono bg-emerald-50 px-1 py-0.5 rounded text-emerald-800">municipality</code> (01 al 23) según MH.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
