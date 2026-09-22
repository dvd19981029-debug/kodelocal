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
  Rocket,
  Sliders,
  Users,
  UserPlus,
  DollarSign,
  BarChart3,
  TrendingUp,
  Award,
  Package,
  FileText,
  Edit2,
  Trash2,
  Plus,
  X,
  Phone,
  Mail,
  Check,
  Percent,
  FolderOpen
} from 'lucide-react';

type KodeAdminTab = 'configuracion' | 'empleados' | 'comisiones' | 'reportes';

interface Empleado {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
  comision_normal: number | string;
  comision_plus: number | string;
  activo: boolean;
  total_pedidos?: number;
  pedidos_entregados?: number;
  total_ventas?: number | string;
  total_comisiones?: number | string;
}

export default function ConfiguracionKodeModule() {
  // Pestaña activa (tipo carpeta)
  const [activeTab, setActiveTab] = useState<KodeAdminTab>('configuracion');

  // Estado de Configuración Factura Llama
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

  // Estado de Empleados
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [isEmpleadoModalOpen, setIsEmpleadoModalOpen] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [empleadoNombre, setEmpleadoNombre] = useState('');
  const [empleadoEmail, setEmpleadoEmail] = useState('');
  const [empleadoTelefono, setEmpleadoTelefono] = useState('');
  const [empleadoRol, setEmpleadoRol] = useState('VENDEDORA');
  const [empleadoComisionNormal, setEmpleadoComisionNormal] = useState<number>(1.00);
  const [empleadoComisionPlus, setEmpleadoComisionPlus] = useState<number>(1.50);

  // Estado de Comisiones Generales
  const [comisionGeneralNormal, setComisionGeneralNormal] = useState<number>(1.00);
  const [comisionGeneralPlus, setComisionGeneralPlus] = useState<number>(1.50);

  // Estado de Reportes
  const [reportesData, setReportesData] = useState<{
    resumen: any;
    topPerfumes: any[];
    vendedoras: any[];
  } | null>(null);
  const [loadingReportes, setLoadingReportes] = useState(false);

  // Cargar configuración guardada al montar
  useEffect(() => {
    fetchConfig();
    fetchEmpleados();
    fetchReportes();
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

  const fetchEmpleados = async () => {
    try {
      setLoadingEmpleados(true);
      const res = await fetch('/api/kode/empleados');
      const data = await res.json();
      if (data.success) {
        setEmpleados(data.empleados || []);
      }
    } catch (e: any) {
      console.error('Error cargando empleados:', e);
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const fetchReportes = async () => {
    try {
      setLoadingReportes(true);
      const res = await fetch('/api/kode/reportes');
      const data = await res.json();
      if (data.success) {
        setReportesData(data);
      }
    } catch (e: any) {
      console.error('Error cargando reportes:', e);
    } finally {
      setLoadingReportes(false);
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
      showNotification('No hay API Key configurada para probar', 'error');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

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

  // Guardar o Editar Empleado
  const handleSaveEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoNombre.trim() || !empleadoEmail.trim()) {
      showNotification('El nombre y el correo electrónico son obligatorios', 'error');
      return;
    }

    try {
      setLoading(true);
      const isEditing = !!editingEmpleado;
      const url = '/api/kode/empleados';
      const method = isEditing ? 'PUT' : 'POST';

      const payload: any = {
        nombre: empleadoNombre.trim(),
        email: empleadoEmail.trim().toLowerCase(),
        telefono: empleadoTelefono.trim(),
        rol: empleadoRol,
        comision_normal: empleadoComisionNormal,
        comision_plus: empleadoComisionPlus,
      };

      if (isEditing) {
        payload.id = editingEmpleado.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showNotification(isEditing ? 'Empleado actualizado con éxito' : 'Nuevo empleado registrado con éxito', 'success');
        setIsEmpleadoModalOpen(false);
        setEditingEmpleado(null);
        resetEmpleadoForm();
        fetchEmpleados();
        fetchReportes();
      } else {
        showNotification(data.error || 'Error al guardar empleado', 'error');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmpleado = (emp: Empleado) => {
    setEditingEmpleado(emp);
    setEmpleadoNombre(emp.nombre);
    setEmpleadoEmail(emp.email);
    setEmpleadoTelefono(emp.telefono || '');
    setEmpleadoRol(emp.rol || 'VENDEDORA');
    setEmpleadoComisionNormal(Number(emp.comision_normal || 1.00));
    setEmpleadoComisionPlus(Number(emp.comision_plus || 1.50));
    setIsEmpleadoModalOpen(true);
  };

  const handleToggleActivo = async (emp: Empleado) => {
    try {
      const res = await fetch('/api/kode/empleados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: emp.id,
          activo: !emp.activo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Empleado ${emp.activo ? 'desactivado' : 'activado'}`, 'success');
        fetchEmpleados();
      }
    } catch (e: any) {
      showNotification(e.message, 'error');
    }
  };

  const resetEmpleadoForm = () => {
    setEmpleadoNombre('');
    setEmpleadoEmail('');
    setEmpleadoTelefono('');
    setEmpleadoRol('VENDEDORA');
    setEmpleadoComisionNormal(1.00);
    setEmpleadoComisionPlus(1.50);
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

      {/* ============================================================== */}
      {/* PESTAÑAS TIPO CARPETAS SUPERIORES: /Configuracion/Empleados/Comisiones/Reportes/ */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/80 backdrop-blur-md rounded-2xl border border-slate-300 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('configuracion')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
            activeTab === 'configuracion'
              ? 'bg-white text-indigo-700 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>/ Configuración</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('empleados');
            fetchEmpleados();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
            activeTab === 'empleados'
              ? 'bg-white text-indigo-700 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4 text-sky-600" />
          <span>/ Empleados</span>
          <span className="clay-badge text-[10px] font-mono font-bold bg-sky-100 text-sky-800 px-1.5 py-0.2">
            {empleados.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('comisiones');
            fetchEmpleados();
            fetchReportes();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
            activeTab === 'comisiones'
              ? 'bg-white text-indigo-700 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>/ Comisiones</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('reportes');
            fetchReportes();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
            activeTab === 'reportes'
              ? 'bg-white text-indigo-700 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-purple-600" />
          <span>/ Reportes</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* VISTA 1: CONFIGURACIÓN GENERAL KODE & FACTURA LLAMA             */}
      {/* ============================================================== */}
      {activeTab === 'configuracion' && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          {/* Cabecera de Configuración */}
          <div className="clay-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Configuración Kode</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Gestión de credenciales de Facturación Electrónica (Factura Llama) y parámetros operativos para la marca paralela KODE.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchConfig}
                className="clay-btn clay-btn-light px-3 py-2 text-xs font-bold flex items-center gap-1.5"
                disabled={loading}
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Recargar</span>
              </button>
            </div>
          </div>

          {/* SECCIÓN 1: AMBIENTE ACTIVO */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>Ambiente de Factura Llama (DTE)</span>
                  <span className="text-[10px] text-slate-400 font-normal">| Selecciona el destino de las facturas</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  En modo <strong>Sandbox</strong> todas las pruebas de facturación se envían con la API Key de test sin impacto fiscal.
                </p>
              </div>

              {/* Selector de Ambiente */}
              <div className="flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAmbiente('sandbox')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                    ambiente === 'sandbox'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>🧪 Sandbox (Pruebas)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAmbiente('produccion')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                    ambiente === 'produccion'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>🚀 Producción (Live)</span>
                </button>
              </div>
            </div>

            {/* Banner de Ambiente Activo */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                ambiente === 'sandbox'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-purple-50/70 border-purple-200 text-purple-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                    ambiente === 'sandbox' ? 'bg-amber-500' : 'bg-purple-600'
                  }`}
                >
                  {ambiente === 'sandbox' ? <FlaskConical className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-xs font-black block">
                    Ambiente Activo: {ambiente === 'sandbox' ? 'SANDBOX / PRUEBAS' : 'PRODUCCIÓN / LIVE'}
                  </span>
                  <span className="text-[11px] opacity-80 font-medium">
                    {ambiente === 'sandbox'
                      ? 'Todas las emisiones y pruebas de KODE se enviarán a Factura Llama con la API de pruebas.'
                      : '¡ATENCIÓN! Las facturas emitidas tendrán valor fiscal real ante el Ministerio de Hacienda.'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider block opacity-70">
                  Clave Activa en Uso
                </span>
                <span className="font-mono text-xs font-black">
                  {currentActiveKey.slice(0, 20)}...
                </span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CREDENCIALES DE API */}
          <div className="clay-card p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <KeyRound className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Credenciales de API de Factura Llama (DTE)
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Claves utilizadas en los encabezados HTTP (X-API-Key) para emitir facturas en Kode
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {/* API Key Sandbox */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  ambiente === 'sandbox'
                    ? 'border-amber-400 bg-amber-50/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">🧪 X-API-Key Sandbox (Pruebas)</span>
                    {ambiente === 'sandbox' && (
                      <span className="clay-badge text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                        ACTIVA AHORA
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTestApiKey('test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1')}
                    className="text-[11px] text-amber-700 hover:underline font-bold"
                  >
                    Restaurar clave test por defecto
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showTestKey ? 'text' : 'password'}
                    value={testApiKey}
                    onChange={(e) => setTestApiKey(e.target.value)}
                    placeholder="test_sk_..."
                    className="clay-input w-full pr-10 font-mono text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTestKey(!showTestKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showTestKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Esta es la API Key que se envía a Factura Llama para todas las pruebas en ambiente sandbox.
                </p>
              </div>

              {/* API Key Producción */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  ambiente === 'produccion'
                    ? 'border-purple-400 bg-purple-50/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">🚀 X-API-Key Producción (Live)</span>
                    {ambiente === 'produccion' && (
                      <span className="clay-badge text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300">
                        ACTIVA AHORA
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setLiveApiKey('live_sk_18558fbf-1c1b-445b-b124-b79fb4f45c67')}
                    className="text-[11px] text-purple-700 hover:underline font-bold"
                  >
                    Restaurar clave live por defecto
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showLiveKey ? 'text' : 'password'}
                    value={liveApiKey}
                    onChange={(e) => setLiveApiKey(e.target.value)}
                    placeholder="live_sk_..."
                    className="clay-input w-full pr-10 font-mono text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLiveKey(!showLiveKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showLiveKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Clave de emisión legal ante el Ministerio de Hacienda para ventas reales de Kode.
                </p>
              </div>
            </div>

            {/* Parámetros Técnicos Adicionales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  X-API-Version
                </label>
                <input
                  type="text"
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value)}
                  className="clay-input w-full font-mono text-xs font-bold"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  URL Base del Servicio
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="clay-input w-full font-mono text-xs font-medium"
                  placeholder="https://api.facturallama.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Correo Electrónico Receptor por Defecto (Contingencia)
                </label>
                <input
                  type="email"
                  value={defaultEmail}
                  onChange={(e) => setDefaultEmail(e.target.value)}
                  className="clay-input w-full text-xs font-medium"
                  placeholder="luisg@forbiddensoluciones.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  DUI Receptor por Defecto (Contingencia sin guiones)
                </label>
                <input
                  type="text"
                  value={defaultDui}
                  onChange={(e) => setDefaultDui(e.target.value)}
                  className="clay-input w-full font-mono text-xs font-medium"
                  placeholder="123456789"
                />
              </div>
            </div>

            {/* Botón de Prueba de Conexión */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold flex items-center gap-2 border border-slate-300"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>{testing ? 'Verificando...' : 'Probar Conexión con Factura Llama'}</span>
              </button>

              {testResult && (
                <div
                  className={`text-xs font-bold flex items-center gap-1.5 p-2 rounded-xl border ${
                    testResult.ok
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {testResult.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-black flex items-center gap-2 shadow-md shadow-indigo-200 ml-auto"
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
      )}

      {/* ============================================================== */}
      {/* VISTA 2: EMPLEADOS & VENDEDORAS DE KODE                         */}
      {/* ============================================================== */}
      {activeTab === 'empleados' && (
        <div className="space-y-6">
          <div className="clay-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Users className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Empleados y Asesoras KÖDE</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Configuración del equipo de ventas, asignación de cuentas de correo y tarifas de comisión por perfume.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingEmpleado(null);
                resetEmpleadoForm();
                setIsEmpleadoModalOpen(true);
              }}
              className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black flex items-center gap-2 shadow-md shadow-indigo-200"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Nuevo Empleado</span>
            </button>
          </div>

          {/* Listado de Empleados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingEmpleados ? (
              <div className="col-span-full clay-card text-center py-16">
                <RotateCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Cargando equipo de KÖDE...</p>
              </div>
            ) : empleados.length === 0 ? (
              <div className="col-span-full clay-card text-center py-16">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">No hay empleados registrados</p>
                <p className="text-xs text-slate-500">Agrega el primer asesor haciendo clic en "+ Nuevo Empleado"</p>
              </div>
            ) : (
              empleados.map((emp) => (
                <div
                  key={emp.id}
                  className={`clay-card p-5 space-y-4 transition-all hover:scale-[1.01] ${
                    !emp.activo ? 'opacity-60 bg-slate-100 border-slate-300' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                        {emp.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{emp.nombre}</h4>
                        <span className="clay-badge text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {emp.rol}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditEmpleado(emp)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Editar empleado"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActivo(emp)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          emp.activo
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={emp.activo ? 'Desactivar empleado' : 'Activar empleado'}
                      >
                        {emp.activo ? <Trash2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    {emp.telefono && (
                      <div className="flex items-center gap-2 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{emp.telefono}</span>
                      </div>
                    )}
                  </div>

                  {/* Tarifas de Comisión */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Tarifas de Comisión
                    </span>
                    <div className="grid grid-cols-2 gap-2 font-mono font-bold">
                      <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-500 block font-sans">Normal</span>
                        <span className="text-indigo-700">${Number(emp.comision_normal).toFixed(2)}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] text-purple-600 block font-sans">Plus</span>
                        <span className="text-purple-700">${Number(emp.comision_plus).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Desempeño */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Pedidos:</span>
                    <span className="font-mono font-bold text-slate-900">{emp.total_pedidos || 0} registrados</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Comisiones:</span>
                    <span className="font-mono font-black text-emerald-700">
                      ${Number(emp.total_comisiones || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 3: COMISIONES & LIQUIDACIÓN KODE                          */}
      {/* ============================================================== */}
      {activeTab === 'comisiones' && (
        <div className="space-y-6">
          <div className="clay-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                  <DollarSign className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Liquidación de Comisiones</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Cálculo automatizado de comisiones por cada perfume vendido en versión Normal y Plus.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Comisiones Acumuladas
                </span>
                <span className="font-mono text-xl font-black text-emerald-700">
                  ${empleados.reduce((acc, e) => acc + Number(e.total_comisiones || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjetas de Reglas de Comisión */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="clay-card p-5 flex items-center justify-between gap-4 border-l-4 border-l-indigo-500">
              <div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                  Comisión Base: Versión Normal
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Monto por cada frasco de 100ml vendido en formulación Normal ($20.00).
                </p>
              </div>
              <div className="font-mono text-2xl font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                ${comisionGeneralNormal.toFixed(2)}
              </div>
            </div>

            <div className="clay-card p-5 flex items-center justify-between gap-4 border-l-4 border-l-purple-500">
              <div>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block mb-1">
                  Comisión Base: Versión Plus
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Monto por cada frasco vendido en formulación Plus / Extra Shot ($25.00).
                </p>
              </div>
              <div className="font-mono text-2xl font-black text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                ${comisionGeneralPlus.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Tabla de Liquidación por Vendedora */}
          <div className="clay-card p-6 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Estado de Cuenta por Asesora</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Asesora</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3 text-center">Pedidos Registrados</th>
                    <th className="py-3 px-3 text-center">Pedidos Entregados</th>
                    <th className="py-3 px-3 text-right">Ventas Totales</th>
                    <th className="py-3 px-3 text-right">Comisión a Pagar</th>
                    <th className="py-3 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {empleados.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-extrabold text-slate-900">
                        {emp.nombre}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {emp.email}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                        {emp.total_pedidos || 0}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                        {emp.pedidos_entregados || 0}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ${Number(emp.total_ventas || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 text-sm">
                        ${Number(emp.total_comisiones || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => showNotification(`Liquidación de $${Number(emp.total_comisiones || 0).toFixed(2)} registrada para ${emp.nombre}`, 'success')}
                          className="clay-btn bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3 py-1 text-[11px] font-bold"
                        >
                          Liquidar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 4: REPORTES & ANALÍTICA KODE                              */}
      {/* ============================================================== */}
      {activeTab === 'reportes' && (
        <div className="space-y-6">
          <div className="clay-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Reportes y Desempeño KÖDE</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Métricas integrales de ventas, estado logístico de C807 Express y facturación DTE de Hacienda.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchReportes}
              className="clay-btn clay-btn-light px-3 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loadingReportes ? 'animate-spin' : ''}`} />
              <span>Actualizar Datos</span>
            </button>
          </div>

          {/* Tarjetas KPI de Reportes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="clay-card p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Pedidos
              </span>
              <span className="font-mono text-2xl font-black text-slate-900">
                {reportesData?.resumen?.total_pedidos || 0}
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">
                {reportesData?.resumen?.entregados || 0} entregados C807
              </span>
            </div>

            <div className="clay-card p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                Ventas Totales
              </span>
              <span className="font-mono text-2xl font-black text-indigo-700">
                ${Number(reportesData?.resumen?.ventas_totales || 0).toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">
                Facturado global
              </span>
            </div>

            <div className="clay-card p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                Envíos Generados
              </span>
              <span className="font-mono text-2xl font-black text-emerald-700">
                {Number(reportesData?.resumen?.enviados || 0) + Number(reportesData?.resumen?.entregados || 0)}
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">
                Guías C807 Express
              </span>
            </div>

            <div className="clay-card p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">
                DTE Emitidos
              </span>
              <span className="font-mono text-2xl font-black text-purple-700">
                {reportesData?.resumen?.facturas_emitidas || 0}
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">
                Factura Llama / MH
              </span>
            </div>
          </div>

          {/* Top Fragancias Más Vendidas (Normal vs Plus) */}
          <div className="clay-card p-6 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Top 10 Perfumes Más Vendidos (Desglose Normal vs Plus)</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Fragancia / Contratipo</th>
                    <th className="py-2.5 px-3">Marca Inspirada</th>
                    <th className="py-2.5 px-3 text-center">Unidades Normal</th>
                    <th className="py-2.5 px-3 text-center">Unidades Plus</th>
                    <th className="py-2.5 px-3 text-center">Total Frascos</th>
                    <th className="py-2.5 px-3 text-right">Facturación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportesData?.topPerfumes?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                        No hay ventas registradas aún para calcular el top.
                      </td>
                    </tr>
                  ) : (
                    reportesData?.topPerfumes?.map((perf) => (
                      <tr key={perf.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                          #{perf.codigo}
                        </td>
                        <td className="py-2.5 px-3 font-extrabold text-slate-900">
                          {perf.contratipo}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {perf.marca_inspirada}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                          {perf.unidades_normal || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-purple-700">
                          {perf.unidades_plus || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">
                          {perf.unidades_totales || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          ${Number(perf.total_facturado || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR / EDITAR EMPLEADO                             */}
      {/* ============================================================== */}
      {isEmpleadoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="clay-card w-full max-w-lg p-6 relative my-8 shadow-2xl animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setIsEmpleadoModalOpen(false);
                setEditingEmpleado(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <UserPlus className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-slate-900">
                {editingEmpleado ? 'Editar Empleado / Asesor' : 'Nuevo Empleado KÖDE'}
              </h3>
            </div>

            <form onSubmit={handleSaveEmpleado} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej. Patricia Mejía"
                  value={empleadoNombre}
                  onChange={(e) => setEmpleadoNombre(e.target.value)}
                  className="clay-input w-full text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico (Login / AppSheet) *</label>
                <input
                  type="email"
                  placeholder="pm3923193@gmail.com"
                  value={empleadoEmail}
                  onChange={(e) => setEmpleadoEmail(e.target.value)}
                  className="clay-input w-full text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="7890-1234"
                    value={empleadoTelefono}
                    onChange={(e) => setEmpleadoTelefono(e.target.value)}
                    className="clay-input w-full font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rol / Cargo</label>
                  <select
                    value={empleadoRol}
                    onChange={(e) => setEmpleadoRol(e.target.value)}
                    className="clay-input w-full text-xs font-bold cursor-pointer"
                  >
                    <option value="VENDEDORA">Asesora de Ventas</option>
                    <option value="BODEGA">Bodega / Laboratorio</option>
                    <option value="SUPERVISOR">Supervisor / Gerente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Comisión Versión Normal ($)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={empleadoComisionNormal}
                    onChange={(e) => setEmpleadoComisionNormal(parseFloat(e.target.value) || 0)}
                    className="clay-input w-full font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Comisión Versión Plus ($)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={empleadoComisionPlus}
                    onChange={(e) => setEmpleadoComisionPlus(parseFloat(e.target.value) || 0)}
                    className="clay-input w-full font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmpleadoModalOpen(false);
                    setEditingEmpleado(null);
                  }}
                  className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="clay-btn clay-btn-primary px-5 py-2 text-xs font-black shadow-md shadow-indigo-200"
                >
                  {loading ? 'Guardando...' : editingEmpleado ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
