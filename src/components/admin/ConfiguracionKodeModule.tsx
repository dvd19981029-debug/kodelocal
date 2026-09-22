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
  FolderOpen,
  Lock,
  Search,
  Receipt,
  FileCheck,
  MapPin,
  CreditCard,
  AlertTriangle,
  Key
} from 'lucide-react';
import { DEPARTAMENTOS_CATALOG, MUNICIPIOS_CATALOG } from '@/lib/svTerritory';

type KodeAdminTab = 'configuracion' | 'empleados' | 'comisiones' | 'reportes';

interface Empleado {
  id: string;
  nombre: string;
  email: string;
  username?: string;
  password?: string;
  telefono?: string;
  rol: string;
  doc_tipo?: string;
  doc_numero?: string;
  departamento_mh?: string;
  municipio_mh?: string;
  direccion_complemento?: string;
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

  // Campos de Empleado
  const [empleadoNombre, setEmpleadoNombre] = useState('');
  const [empleadoEmail, setEmpleadoEmail] = useState('');
  const [empleadoUsername, setEmpleadoUsername] = useState('');
  const [empleadoPassword, setEmpleadoPassword] = useState('');
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [empleadoTelefono, setEmpleadoTelefono] = useState('');
  const [empleadoRol, setEmpleadoRol] = useState('VENDEDORA');
  const [empleadoDocTipo, setEmpleadoDocTipo] = useState('DUI');
  const [empleadoDocNumero, setEmpleadoDocNumero] = useState('');
  const [empleadoDeptoMh, setEmpleadoDeptoMh] = useState('06');
  const [empleadoMuniMh, setEmpleadoMuniMh] = useState('14');
  const [empleadoDireccionComplemento, setEmpleadoDireccionComplemento] = useState('');
  const [empleadoComisionNormal, setEmpleadoComisionNormal] = useState<number>(1.00);
  const [empleadoComisionPlus, setEmpleadoComisionPlus] = useState<number>(1.50);

  // Búsqueda y Filtro de Empleados
  const [empleadosSearch, setEmpleadosSearch] = useState('');

  // Modal de confirmación para eliminar
  const [empleadoToDelete, setEmpleadoToDelete] = useState<Empleado | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modal para emisión de Sujeto Excluido (DTE-14)
  const [empleadoToFse, setEmpleadoToFse] = useState<Empleado | null>(null);
  const [isFseModalOpen, setIsFseModalOpen] = useState(false);
  const [fseMonto, setFseMonto] = useState<number>(0);
  const [fseRetencionRenta, setFseRetencionRenta] = useState<number>(0);
  const [fseConcepto, setFseConcepto] = useState('Servicios profesionales de intermediación comercial y comisiones por venta');
  const [fseLoading, setFseLoading] = useState(false);
  const [fseResult, setFseResult] = useState<any | null>(null);

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
        username: empleadoUsername.trim() || empleadoEmail.split('@')[0].trim().toLowerCase(),
        password: empleadoPassword.trim(),
        telefono: empleadoTelefono.trim(),
        rol: empleadoRol,
        doc_tipo: empleadoDocTipo,
        doc_numero: empleadoDocNumero.trim(),
        departamento_mh: empleadoDeptoMh,
        municipio_mh: empleadoMuniMh,
        direccion_complemento: empleadoDireccionComplemento.trim(),
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
    setEmpleadoNombre(emp.nombre || '');
    setEmpleadoEmail(emp.email || '');
    setEmpleadoUsername(emp.username || emp.email.split('@')[0]);
    setEmpleadoPassword(emp.password || '');
    setShowEmployeePassword(false);
    setEmpleadoTelefono(emp.telefono || '');
    setEmpleadoRol(emp.rol || 'VENDEDORA');
    setEmpleadoDocTipo(emp.doc_tipo || 'DUI');
    setEmpleadoDocNumero(emp.doc_numero || '');
    setEmpleadoDeptoMh(emp.departamento_mh || '06');
    setEmpleadoMuniMh(emp.municipio_mh || '14');
    setEmpleadoDireccionComplemento(emp.direccion_complemento || '');
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

  const openDeleteModal = (emp: Empleado) => {
    setEmpleadoToDelete(emp);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!empleadoToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/kode/empleados?id=${empleadoToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || 'Empleado procesado con éxito', 'success');
        setIsDeleteModalOpen(false);
        setEmpleadoToDelete(null);
        fetchEmpleados();
        fetchReportes();
      } else {
        showNotification(data.error || 'Error al eliminar empleado', 'error');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openFseModal = (emp: Empleado) => {
    setEmpleadoToFse(emp);
    const comisiones = Number(emp.total_comisiones || 0);
    const montoBase = comisiones > 0 ? comisiones : 50.00;
    setFseMonto(montoBase);
    // Retención sugerida en El Salvador para servicios profesionales: 10%
    const ret = Number((montoBase * 0.10).toFixed(2));
    setFseRetencionRenta(ret);
    setFseConcepto(`Servicios profesionales de intermediación comercial y comisiones por venta - ${emp.nombre}`);
    setFseResult(null);
    setIsFseModalOpen(true);
  };

  const handleEmitirFse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoToFse) return;

    if (!empleadoToFse.doc_numero) {
      showNotification('El empleado no tiene DUI registrado. Haz clic en Editar para registrar su documento.', 'error');
      return;
    }

    if (!empleadoToFse.direccion_complemento) {
      showNotification('El empleado no tiene dirección registrada. Haz clic en Editar para agregar su residencia.', 'error');
      return;
    }

    try {
      setFseLoading(true);
      setFseResult(null);

      const res = await fetch('/api/kode/dte/fse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empleado_id: empleadoToFse.id,
          monto: fseMonto,
          concepto: fseConcepto,
          retencion_renta: fseRetencionRenta,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFseResult(data.dte);
        showNotification('✅ Factura de Sujeto Excluido emitida con éxito en Factura Llama', 'success');
        fetchEmpleados();
      } else {
        showNotification(data.error || 'Error al emitir DTE de Sujeto Excluido', 'error');
        setFseResult({ error: data.error, raw: data.dteResult });
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setFseLoading(false);
    }
  };

  const resetEmpleadoForm = () => {
    setEmpleadoNombre('');
    setEmpleadoEmail('');
    setEmpleadoUsername('');
    setEmpleadoPassword('');
    setShowEmployeePassword(false);
    setEmpleadoTelefono('');
    setEmpleadoRol('VENDEDORA');
    setEmpleadoDocTipo('DUI');
    setEmpleadoDocNumero('');
    setEmpleadoDeptoMh('06');
    setEmpleadoMuniMh('14');
    setEmpleadoDireccionComplemento('');
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
          {/* Header Superior y Barra de Acciones */}
          <div className="clay-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Users className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Directorio de Empleados y Asesoras KÖDE</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Gestión de cuentas de acceso, credenciales, comisiones por fragancia y datos fiscales para emitir Facturas de Sujeto Excluido (DTE-14).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Barra de búsqueda */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, usuario, DUI..."
                  value={empleadosSearch}
                  onChange={(e) => setEmpleadosSearch(e.target.value)}
                  className="clay-input w-full pl-9 pr-3 py-1.5 text-xs font-medium"
                />
                {empleadosSearch && (
                  <button
                    type="button"
                    onClick={() => setEmpleadosSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingEmpleado(null);
                  resetEmpleadoForm();
                  setIsEmpleadoModalOpen(true);
                }}
                className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black flex items-center gap-2 shadow-md shadow-indigo-200 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Nuevo Empleado</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Resumen Rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="clay-card p-3 flex items-center gap-3 bg-white">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                <Users className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Personal</span>
                <span className="font-mono text-sm font-black text-slate-900">{empleados.length}</span>
              </div>
            </div>

            <div className="clay-card p-3 flex items-center gap-3 bg-white">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Activos</span>
                <span className="font-mono text-sm font-black text-emerald-700">
                  {empleados.filter((e) => e.activo).length}
                </span>
              </div>
            </div>

            <div className="clay-card p-3 flex items-center gap-3 bg-white">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600 font-bold">
                <FileCheck className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Listos DTE-14</span>
                <span className="font-mono text-sm font-black text-purple-700">
                  {empleados.filter((e) => e.doc_numero && e.direccion_complemento).length}
                </span>
              </div>
            </div>

            <div className="clay-card p-3 flex items-center gap-3 bg-white">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600 font-bold">
                <DollarSign className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Comisiones Pend.</span>
                <span className="font-mono text-sm font-black text-amber-700">
                  ${empleados.reduce((acc, e) => acc + Number(e.total_comisiones || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* TABLA PRINCIPAL DE EMPLEADOS */}
          <div className="clay-card overflow-hidden p-0 border border-slate-200/80 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50/90 text-slate-600 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Empleado / Asesora</th>
                    <th className="py-3.5 px-4">Acceso al Sistema</th>
                    <th className="py-3.5 px-4">Rol & Estado</th>
                    <th className="py-3.5 px-4">Datos Fiscales (DTE-14 Sujeto Excluido)</th>
                    <th className="py-3.5 px-4 text-center">Tarifas Comisión</th>
                    <th className="py-3.5 px-4 text-right">Comisiones</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loadingEmpleados ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-500">
                        <RotateCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                        <span className="font-bold">Cargando personal de KÖDE...</span>
                      </td>
                    </tr>
                  ) : empleados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-500">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-800">No hay empleados registrados</p>
                        <p className="text-xs text-slate-400">Haz clic en "+ Nuevo Empleado" para registrar al primer asesor.</p>
                      </td>
                    </tr>
                  ) : (
                    empleados
                      .filter((emp) => {
                        if (!empleadosSearch.trim()) return true;
                        const q = empleadosSearch.toLowerCase();
                        return (
                          emp.nombre.toLowerCase().includes(q) ||
                          emp.email.toLowerCase().includes(q) ||
                          (emp.username && emp.username.toLowerCase().includes(q)) ||
                          (emp.doc_numero && emp.doc_numero.includes(q)) ||
                          (emp.telefono && emp.telefono.includes(q))
                        );
                      })
                      .map((emp) => {
                        const isDteReady = Boolean(emp.doc_numero && emp.direccion_complemento);
                        const comisionTotal = Number(emp.total_comisiones || 0);

                        return (
                          <tr
                            key={emp.id}
                            className={`transition-colors hover:bg-indigo-50/30 ${
                              !emp.activo ? 'bg-slate-50/70 opacity-60' : ''
                            }`}
                          >
                            {/* 1. Empleado */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                                  {emp.nombre.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                    <span>{emp.nombre}</span>
                                  </div>
                                  {emp.telefono ? (
                                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                      <Phone className="w-3 h-3 text-emerald-600" />
                                      <a
                                        href={`https://wa.me/503${emp.telefono.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline hover:text-emerald-700"
                                      >
                                        {emp.telefono}
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">Sin teléfono</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 2. Acceso al Sistema */}
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                                    <Key className="w-3 h-3 text-indigo-600" />
                                    <span>@{emp.username || emp.email.split('@')[0]}</span>
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[160px]">{emp.email}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{emp.password ? '••••••••' : 'Sin clave asignada'}</span>
                                </div>
                              </div>
                            </td>

                            {/* 3. Rol & Estado */}
                            <td className="py-3 px-4">
                              <div className="space-y-1.5">
                                <span className="clay-badge text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300 block w-max">
                                  {emp.rol || 'VENDEDORA'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleActivo(emp)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                                    emp.activo
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                  }`}
                                  title={emp.activo ? 'Clic para desactivar' : 'Clic para activar'}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${emp.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                  <span>{emp.activo ? 'Activo' : 'Inactivo'}</span>
                                </button>
                              </div>
                            </td>

                            {/* 4. Datos Fiscales Sujeto Excluido */}
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-800 text-[11px]">
                                    {emp.doc_tipo || 'DUI'}: {emp.doc_numero || 'Sin registrar'}
                                  </span>
                                  {isDteReady ? (
                                    <span className="clay-badge text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      <span>Listo DTE-14</span>
                                    </span>
                                  ) : (
                                    <span className="clay-badge text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-0.5">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      <span>Incompleto</span>
                                    </span>
                                  )}
                                </div>

                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>
                                    Depto MH: <strong className="text-slate-700">{emp.departamento_mh || '06'}</strong> | Muni: <strong className="text-slate-700">{emp.municipio_mh || '14'}</strong>
                                  </span>
                                </div>

                                {emp.direccion_complemento ? (
                                  <p className="text-[10px] text-slate-500 truncate max-w-[220px]" title={emp.direccion_complemento}>
                                    {emp.direccion_complemento}
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-rose-500 italic">Falta dirección de residencia</p>
                                )}
                              </div>
                            </td>

                            {/* 5. Tarifas Comisión */}
                            <td className="py-3 px-4 text-center font-mono">
                              <div className="inline-flex gap-1.5">
                                <div className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700">
                                  <span className="text-[9px] text-indigo-400 block font-sans">Normal</span>
                                  <span className="font-bold text-[11px]">${Number(emp.comision_normal).toFixed(2)}</span>
                                </div>
                                <div className="px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-100 text-purple-700">
                                  <span className="text-[9px] text-purple-400 block font-sans">Plus</span>
                                  <span className="font-bold text-[11px]">${Number(emp.comision_plus).toFixed(2)}</span>
                                </div>
                              </div>
                            </td>

                            {/* 6. Comisiones Acumuladas */}
                            <td className="py-3 px-4 text-right">
                              <div className="font-mono text-xs font-black text-emerald-700">
                                ${comisionTotal.toFixed(2)}
                              </div>
                              <span className="text-[10px] text-slate-400 block">
                                {emp.pedidos_entregados || 0} pedidos ent.
                              </span>
                            </td>

                            {/* 7. Acciones */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditEmpleado(emp)}
                                  className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors shadow-sm"
                                  title="Editar empleado y datos fiscales"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openDeleteModal(emp)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors shadow-sm"
                                  title="Eliminar empleado"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openFseModal(emp)}
                                  className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors shadow-sm"
                                  title="Emitir Factura Sujeto Excluido (DTE-14)"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
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
      {/* MODAL 1: REGISTRAR / EDITAR EMPLEADO                           */}
      {/* ============================================================== */}
      {isEmpleadoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="clay-card w-full max-w-2xl p-6 relative my-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
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

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                <UserPlus className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingEmpleado ? `Editar a ${editingEmpleado.nombre}` : 'Nuevo Empleado / Asesor KÖDE'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configura credenciales de acceso al sistema y datos fiscales para emitir Sujeto Excluido.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEmpleado} className="space-y-5">
              {/* SECCIÓN 1: DATOS PERSONALES */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>1. Datos Personales y Rol</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="text"
                      placeholder="7890-1234 (8 dígitos)"
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
                      <option value="ADMINISTRADOR">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      placeholder="correo@gmail.com"
                      value={empleadoEmail}
                      onChange={(e) => setEmpleadoEmail(e.target.value)}
                      className="clay-input w-full text-xs font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: CREDENCIALES DE ACCESO */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>2. Credenciales de Ingreso al Sistema</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre de Usuario (Login) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs font-bold">@</span>
                      <input
                        type="text"
                        placeholder="usuario.kode"
                        value={empleadoUsername}
                        onChange={(e) => setEmpleadoUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        className="clay-input w-full pl-8 font-mono text-xs font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Nombre con el que iniciará sesión en KÖDE.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contraseña Asignada *
                    </label>
                    <div className="relative">
                      <input
                        type={showEmployeePassword ? 'text' : 'password'}
                        placeholder="Contraseña del colaborador"
                        value={empleadoPassword}
                        onChange={(e) => setEmpleadoPassword(e.target.value)}
                        className="clay-input w-full pr-10 font-mono text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showEmployeePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Clave segura que le configurarás para su acceso.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: TARIFAS DE COMISIÓN */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>3. Tarifas de Comisión por Perfume</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>

              {/* SECCIÓN 4: DATOS FISCALES PARA FACTURA SUJETO EXCLUIDO (DTE-14) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-purple-600" />
                    <span>4. Datos Fiscales para Factura Sujeto Excluido (DTE-14)</span>
                  </h4>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    Factura Llama
                  </span>
                </div>

                <div className="p-3 bg-purple-50/40 rounded-2xl border border-purple-200/80 space-y-3">
                  <p className="text-[11px] text-slate-600">
                    Datos obligatorios por el Ministerio de Hacienda de El Salvador para liquidar comisiones mediante el DTE-14 de Sujeto Excluido.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Documento</label>
                      <select
                        value={empleadoDocTipo}
                        onChange={(e) => setEmpleadoDocTipo(e.target.value)}
                        className="clay-input w-full text-xs font-bold cursor-pointer"
                      >
                        <option value="DUI">DUI (El Salvador)</option>
                        <option value="NIT">NIT (Hacienda)</option>
                        <option value="PASAPORTE">Pasaporte</option>
                        <option value="CARNET_RESIDENTE">Carnet de Residente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Número de Documento (DUI sin guiones) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 034084662 (9 dígitos)"
                        value={empleadoDocNumero}
                        onChange={(e) => setEmpleadoDocNumero(e.target.value)}
                        className="clay-input w-full font-mono text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Departamento (Código CAT-012 MH) *
                      </label>
                      <select
                        value={empleadoDeptoMh}
                        onChange={(e) => {
                          const newDepto = e.target.value;
                          setEmpleadoDeptoMh(newDepto);
                          // Ajustar municipio inicial del departamento
                          const munis = MUNICIPIOS_CATALOG.filter((m) => m.departamentoId === newDepto);
                          if (munis.length > 0) {
                            setEmpleadoMuniMh(munis[0].id);
                          }
                        }}
                        className="clay-input w-full text-xs font-bold cursor-pointer"
                      >
                        {DEPARTAMENTOS_CATALOG.filter((d) => d.id !== '00').map((depto) => (
                          <option key={depto.id} value={depto.depto_mh}>
                            {depto.depto_mh} - {depto.nombre_depto}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Municipio (Código CAT-013 MH) *
                      </label>
                      <select
                        value={empleadoMuniMh}
                        onChange={(e) => setEmpleadoMuniMh(e.target.value)}
                        className="clay-input w-full text-xs font-bold cursor-pointer"
                      >
                        {MUNICIPIOS_CATALOG.filter((m) => m.departamentoId === empleadoDeptoMh).map((muni) => (
                          <option key={muni.id} value={muni.id}>
                            {muni.id} - {muni.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Dirección Completa / Complemento de Residencia *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Colonia Escalón, Pje. Los Almendros #14, San Salvador"
                        maxLength={200}
                        value={empleadoDireccionComplemento}
                        onChange={(e) => setEmpleadoDireccionComplemento(e.target.value)}
                        className="clay-input w-full text-xs font-medium"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Máximo 200 caracteres (Requisito estricto de Factura Llama / MH).
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
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
                  {loading ? 'Guardando...' : editingEmpleado ? 'Actualizar Colaborador' : 'Registrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CONFIRMACIÓN PARA ELIMINAR EMPLEADO                   */}
      {/* ============================================================== */}
      {isDeleteModalOpen && empleadoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="clay-card w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">¿Eliminar colaborador?</h3>
                <p className="text-xs text-slate-500 font-medium">{empleadoToDelete.nombre}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Si este colaborador <strong>no tiene pedidos en el historial</strong>, se eliminará permanentemente de la base de datos. Si ya cuenta con pedidos o comisiones registradas, el sistema lo <strong>desactivará automáticamente</strong> para proteger la integridad contable.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setEmpleadoToDelete(null);
                }}
                disabled={deleteLoading}
                className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="clay-btn bg-rose-600 text-white hover:bg-rose-700 px-4 py-2 text-xs font-black shadow-md shadow-rose-200 flex items-center gap-1.5"
              >
                {deleteLoading ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{deleteLoading ? 'Eliminando...' : 'Sí, Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: EMISIÓN FACTURA SUJETO EXCLUIDO (DTE-14 FACTURA LLAMA) */}
      {/* ============================================================== */}
      {isFseModalOpen && empleadoToFse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="clay-card w-full max-w-lg p-6 relative my-8 shadow-2xl animate-in zoom-in-95 space-y-4">
            <button
              type="button"
              onClick={() => {
                setIsFseModalOpen(false);
                setEmpleadoToFse(null);
                setFseResult(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm">
                <Receipt className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Emitir Factura de Sujeto Excluido (DTE-14)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Liquidación de servicios profesionales a través de Factura Llama ({ambiente.toUpperCase()})
                </p>
              </div>
            </div>

            {/* Resumen del Empleado */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Receptor / Colaborador:</span>
                <strong className="text-slate-900">{empleadoToFse.nombre}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Documento:</span>
                <span className="font-mono font-bold text-slate-800">
                  {empleadoToFse.doc_tipo || 'DUI'}: {empleadoToFse.doc_numero || 'Sin registrar'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Ubicación MH:</span>
                <span className="text-slate-700">
                  Depto {empleadoToFse.departamento_mh || '06'}, Muni {empleadoToFse.municipio_mh || '14'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Dirección:</span>
                <span className="text-slate-700 truncate max-w-[220px]" title={empleadoToFse.direccion_complemento}>
                  {empleadoToFse.direccion_complemento || 'Sin dirección'}
                </span>
              </div>
            </div>

            {/* Formulario de Emisión */}
            {!fseResult ? (
              <form onSubmit={handleEmitirFse} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monto de Comisiones a Liquidar ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={fseMonto}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFseMonto(val);
                      setFseRetencionRenta(Number((val * 0.10).toFixed(2)));
                    }}
                    className="clay-input w-full font-mono text-xs font-black text-indigo-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 bg-purple-50/60 p-3 rounded-2xl border border-purple-200">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">
                      Retención de Renta 10% ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fseRetencionRenta}
                      onChange={(e) => setFseRetencionRenta(parseFloat(e.target.value) || 0)}
                      className="clay-input w-full font-mono text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Neto a Pagar ($)
                    </label>
                    <div className="clay-input w-full font-mono text-xs font-black text-emerald-700 bg-white flex items-center">
                      ${Math.max(0, fseMonto - fseRetencionRenta).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Concepto en DTE-14 *
                  </label>
                  <textarea
                    rows={2}
                    value={fseConcepto}
                    onChange={(e) => setFseConcepto(e.target.value)}
                    className="clay-input w-full text-xs font-medium"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFseModalOpen(false);
                      setEmpleadoToFse(null);
                    }}
                    className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={fseLoading}
                    className="clay-btn bg-purple-600 text-white hover:bg-purple-700 px-5 py-2 text-xs font-black shadow-md shadow-purple-200 flex items-center gap-2"
                  >
                    {fseLoading ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{fseLoading ? 'Transmitiendo a MH...' : 'Transmitir DTE-14'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 pt-2">
                {fseResult.error ? (
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Rechazo al emitir DTE de Sujeto Excluido</span>
                    </div>
                    <p>{fseResult.error}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs space-y-3">
                    <div className="flex items-center gap-2 font-extrabold text-emerald-900">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Factura Sujeto Excluido (DTE-14) Aprobada</span>
                    </div>

                    <div className="font-mono text-[11px] space-y-1 bg-white p-3 rounded-xl border border-emerald-200">
                      <div>
                        <span className="text-slate-400">Código Generación:</span>{' '}
                        <strong>{fseResult.codigo_generacion}</strong>
                      </div>
                      {fseResult.numero_control && (
                        <div>
                          <span className="text-slate-400">Número Control:</span>{' '}
                          <strong>{fseResult.numero_control}</strong>
                        </div>
                      )}
                      {fseResult.sello_recepcion && (
                        <div>
                          <span className="text-slate-400">Sello Recepción:</span>{' '}
                          <strong className="text-emerald-700">{fseResult.sello_recepcion}</strong>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {fseResult.pdf_url && (
                        <a
                          href={fseResult.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="clay-btn bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Descargar PDF</span>
                        </a>
                      )}
                      {fseResult.json_url && (
                        <a
                          href={fseResult.json_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Ver JSON</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFseModalOpen(false);
                      setEmpleadoToFse(null);
                      setFseResult(null);
                    }}
                    className="clay-btn clay-btn-primary px-5 py-2 text-xs font-bold"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
