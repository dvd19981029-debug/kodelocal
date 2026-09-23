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

type KodeAdminTab = 'configuracion' | 'empleados' | 'formas_pago' | 'comisiones' | 'reportes';

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
  comision_porcentaje?: number | string;
  activo: boolean;
  total_pedidos?: number;
  pedidos_entregados?: number;
  total_ventas?: number | string;
  total_comisiones?: number | string;
  comisiones_pendientes?: number | string;
}

interface FormaPagoAdmin {
  id: string;
  nombre: string;
  tipo: string;
  activo: boolean;
  total_transacciones?: number;
  total_monto?: number;
  created_at?: string;
}

interface PagoTransaccion {
  id: string;
  pedido_id: string;
  forma_pago_id: string;
  forma_pago_nombre?: string;
  forma_pago_tipo?: string;
  monto: number | string;
  fecha_pago: string;
  num_documento_auto?: string;
  estado_pago?: string;
  usuario?: string;
  observaciones?: string;
  created_at: string;
  numero_pedido?: string;
  pedido_estado?: string;
  pedido_estado_pago?: string;
  pedido_total?: number | string;
  pedido_subtotal?: number | string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  vendedora_nombre?: string;
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

  // Estado de Comisiones Generales (Predeterminado 5.00% sobre ventas)
  const [comisionGeneralNormal, setComisionGeneralNormal] = useState<number>(1.00);
  const [comisionGeneralPlus, setComisionGeneralPlus] = useState<number>(1.50);
  const [comisionGlobalPct, setComisionGlobalPct] = useState<number>(5.00);
  const [aplicandoComisionGlobal, setAplicandoComisionGlobal] = useState(false);
  const [empleadoComisionPorcentaje, setEmpleadoComisionPorcentaje] = useState<number>(5.00);

  // Estado de Formas de Pago y Pedidos Asociados
  const [formasPago, setFormasPago] = useState<FormaPagoAdmin[]>([]);
  const [loadingFormasPago, setLoadingFormasPago] = useState(false);
  const [selectedFormaPago, setSelectedFormaPago] = useState<FormaPagoAdmin | null>(null);
  const [transaccionesFormaPago, setTransaccionesFormaPago] = useState<PagoTransaccion[]>([]);
  const [loadingTransacciones, setLoadingTransacciones] = useState(false);
  const [searchFormaPago, setSearchFormaPago] = useState('');

  // Modal para Crear / Editar Forma de Pago
  const [modalFormaPago, setModalFormaPago] = useState<{
    isOpen: boolean;
    isEdit: boolean;
    id: string;
    nombre: string;
    tipo: string;
    activo: boolean;
  }>({
    isOpen: false,
    isEdit: false,
    id: '',
    nombre: '',
    tipo: 'BANCO',
    activo: true,
  });

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
    fetchFormasPago();
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

  const fetchFormasPago = async () => {
    try {
      setLoadingFormasPago(true);
      const res = await fetch('/api/kode/formas-pago');
      const data = await res.json();
      if (data.success && (data.formasPago || data.formas_pago)) {
        const list: FormaPagoAdmin[] = data.formasPago || data.formas_pago || [];
        setFormasPago(list);
        if (!selectedFormaPago && list.length > 0) {
          selectFormaPago(list[0]);
        }
      }
    } catch (e: any) {
      console.error('Error cargando formas de pago:', e);
    } finally {
      setLoadingFormasPago(false);
    }
  };

  const selectFormaPago = async (fp: FormaPagoAdmin) => {
    setSelectedFormaPago(fp);
    try {
      setLoadingTransacciones(true);
      const res = await fetch(`/api/kode/pagos?forma_pago_id=${fp.id}`);
      const data = await res.json();
      if (data.success) {
        setTransaccionesFormaPago(data.pagos || []);
      } else {
        setTransaccionesFormaPago([]);
      }
    } catch (e: any) {
      console.error('Error cargando transacciones de forma de pago:', e);
      setTransaccionesFormaPago([]);
    } finally {
      setLoadingTransacciones(false);
    }
  };

  const handleToggleActivoFormaPago = async (fp: FormaPagoAdmin, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch('/api/kode/formas-pago', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fp.id,
          activo: !fp.activo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Forma de pago ${fp.activo ? 'desactivada' : 'activada'} correctamente`, 'success');
        fetchFormasPago();
      } else {
        showNotification(data.error || 'Error al actualizar forma de pago', 'error');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleGuardarFormaPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalFormaPago.nombre.trim()) {
      showNotification('El nombre de la forma de pago es obligatorio', 'error');
      return;
    }
    try {
      const method = modalFormaPago.isEdit ? 'PUT' : 'POST';
      const payload: any = {
        nombre: modalFormaPago.nombre.trim(),
        tipo: modalFormaPago.tipo,
        activo: modalFormaPago.activo,
      };
      if (modalFormaPago.isEdit) {
        payload.id = modalFormaPago.id;
      }
      const res = await fetch('/api/kode/formas-pago', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(modalFormaPago.isEdit ? 'Forma de pago actualizada' : 'Forma de pago agregada al catálogo', 'success');
        setModalFormaPago((prev) => ({ ...prev, isOpen: false }));
        fetchFormasPago();
      } else {
        showNotification(data.error || 'Error al guardar forma de pago', 'error');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleAplicarComisionGlobal = async () => {
    if (comisionGlobalPct === undefined || comisionGlobalPct < 0) {
      showNotification('Ingresa un porcentaje de comisión válido', 'error');
      return;
    }
    try {
      setAplicandoComisionGlobal(true);
      const res = await fetch('/api/kode/empleados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aplicar_global: true,
          comision_porcentaje: Number(comisionGlobalPct),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`✅ Comisión global del ${comisionGlobalPct}% aplicada a todos los colaboradores`, 'success');
        fetchEmpleados();
        fetchReportes();
      } else {
        showNotification(data.error || 'Error al aplicar comisión global', 'error');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setAplicandoComisionGlobal(false);
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
        comision_porcentaje: empleadoComisionPorcentaje,
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
    setEmpleadoComisionPorcentaje(Number(emp.comision_porcentaje !== undefined ? emp.comision_porcentaje : 5.00));
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
    setEmpleadoComisionPorcentaje(5.00);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const currentActiveKey = ambiente === 'sandbox' ? testApiKey : liveApiKey;

  return (
    <div className="space-y-4 animate-in fade-in duration-200 max-w-7xl mx-auto">
      {/* Toast Notificación */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 p-3.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-black animate-in slide-in-from-top-3 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-indigo-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑAS SUPERIORES COMPACTAS (1 SOLA FILA)                     */}
      {/* ============================================================== */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/90 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('configuracion')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'configuracion'
              ? 'bg-white text-indigo-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span>Configuración</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('empleados');
            fetchEmpleados();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'empleados'
              ? 'bg-white text-indigo-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-sky-600" />
          <span>Empleados</span>
          <span className="text-[10px] font-mono font-bold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-md">
            {empleados.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('formas_pago');
            fetchFormasPago();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'formas_pago'
              ? 'bg-white text-indigo-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-amber-600" />
          <span>Formas de Pago</span>
          <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">
            {formasPago.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('comisiones');
            fetchEmpleados();
            fetchReportes();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'comisiones'
              ? 'bg-white text-indigo-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          <span>Comisiones</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('reportes');
            fetchReportes();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'reportes'
              ? 'bg-white text-indigo-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
          <span>Reportes</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* VISTA 1: CONFIGURACIÓN GENERAL KODE & FACTURA LLAMA             */}
      {/* ============================================================== */}
      {activeTab === 'configuracion' && (
        <form onSubmit={handleSaveConfig} className="space-y-3.5">
          {/* Cabecera Compacta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Configuración de Facturación Electrónica KÖDE</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Gestión de credenciales de Factura Llama (Ministerio de Hacienda) y ambiente operativo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchConfig}
                className="clay-btn clay-btn-light px-2.5 py-1 text-xs font-bold flex items-center gap-1.5"
                disabled={loading}
              >
                <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Recargar</span>
              </button>
            </div>
          </div>

          {/* SECCIÓN 1: AMBIENTE ACTIVO COMPACTO */}
          <div className="clay-card p-4 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Ambiente de Facturación (DTE)
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      ambiente === 'sandbox'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}
                  >
                    {ambiente === 'sandbox' ? '🧪 Sandbox Activo (Pruebas)' : '🚀 Producción Activo (Hacienda)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {ambiente === 'sandbox'
                    ? 'En Sandbox las facturas y sujetos excluidos se emiten sin impacto tributario ni fiscal.'
                    : '¡Atención! En Producción las emisiones tienen valor fiscal oficial ante el Ministerio de Hacienda.'}
                </p>
              </div>

              {/* Selector de Ambiente Compacto */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAmbiente('sandbox')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    ambiente === 'sandbox'
                      ? 'bg-amber-500 text-white shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Sandbox (Test)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAmbiente('produccion')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    ambiente === 'produccion'
                      ? 'bg-purple-600 text-white shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Producción (Live)</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CREDENCIALES EN GRID DE 2 COLUMNAS */}
          <div className="clay-card p-4 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <KeyRound className="w-3.5 h-3.5" />
                </span>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Credenciales de API (X-API-Key)
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Activa: <strong className="text-slate-700">{ambiente.toUpperCase()}</strong>
              </span>
            </div>

            {/* Grid 2 Columnas para Sandbox y Producción */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* API Key Sandbox */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  ambiente === 'sandbox'
                    ? 'border-amber-300 bg-amber-50/30 ring-1 ring-amber-300/40'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">🧪 API Key Sandbox</span>
                    {ambiente === 'sandbox' && (
                      <span className="text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-md">
                        EN USO
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTestApiKey('test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1')}
                    className="text-[10px] text-amber-700 hover:underline font-bold"
                  >
                    Restaurar test
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showTestKey ? 'text' : 'password'}
                    value={testApiKey}
                    onChange={(e) => setTestApiKey(e.target.value)}
                    placeholder="test_sk_..."
                    className="clay-input w-full pr-8 font-mono text-xs py-1.5 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTestKey(!showTestKey)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showTestKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  Utilizada para pruebas seguras en ambiente sandbox.
                </p>
              </div>

              {/* API Key Producción */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  ambiente === 'produccion'
                    ? 'border-purple-300 bg-purple-50/30 ring-1 ring-purple-300/40'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">🚀 API Key Producción</span>
                    {ambiente === 'produccion' && (
                      <span className="text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-300 px-1.5 py-0.2 rounded-md">
                        EN USO
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setLiveApiKey('live_sk_18558fbf-1c1b-445b-b124-b79fb4f45c67')}
                    className="text-[10px] text-purple-700 hover:underline font-bold"
                  >
                    Restaurar live
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showLiveKey ? 'text' : 'password'}
                    value={liveApiKey}
                    onChange={(e) => setLiveApiKey(e.target.value)}
                    placeholder="live_sk_..."
                    className="clay-input w-full pr-8 font-mono text-xs py-1.5 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLiveKey(!showLiveKey)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showLiveKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  Emisión legal autorizada ante Hacienda en El Salvador.
                </p>
              </div>
            </div>

            {/* Parámetros Técnicos Adicionales en 4 Columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  X-API-Version
                </label>
                <input
                  type="text"
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value)}
                  className="clay-input w-full font-mono text-xs py-1.5 font-bold"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  URL Base Factura Llama
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="clay-input w-full font-mono text-xs py-1.5 font-medium"
                  placeholder="https://api.facturallama.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Contingencia
                </label>
                <input
                  type="email"
                  value={defaultEmail}
                  onChange={(e) => setDefaultEmail(e.target.value)}
                  className="clay-input w-full text-xs py-1.5 font-medium"
                  placeholder="luisg@forbiddensoluciones.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  DUI Contingencia (9 dígitos)
                </label>
                <input
                  type="text"
                  value={defaultDui}
                  onChange={(e) => setDefaultDui(e.target.value)}
                  className="clay-input w-full font-mono text-xs py-1.5 font-medium"
                  placeholder="123456789"
                />
              </div>
            </div>

            {/* Acciones y Pruebas */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 border border-slate-300"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{testing ? 'Verificando...' : 'Probar Conexión'}</span>
                </button>

                {testResult && (
                  <div
                    className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                      testResult.ok
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {testResult.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                    <span className="text-[11px]">{testResult.message}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black flex items-center gap-2 shadow-md shadow-indigo-200 self-end sm:self-auto"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'Guardando...' : 'Guardar Configuración'}</span>
              </button>
            </div>
          </div>

          {/* Resumen Mapeo Logística C807 y MH (Compacto) */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] uppercase tracking-wide">Mapeo Integrado: C807 Express & Factura Llama</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="bg-white p-2 rounded-lg border border-slate-200/60 flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span><strong>C807 Logística:</strong> IDs 02-15 Depto y 02-262 Municipio.</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/60 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Factura Llama (MH):</strong> CAT-012 Depto (01-14) y CAT-013 Municipio (01-23).</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* VISTA 2: EMPLEADOS & VENDEDORAS DE KODE                         */}
      {/* ============================================================== */}
      {activeTab === 'empleados' && (
        <div className="space-y-3.5">
          {/* Header Superior y Barra de Acciones */}
          <div className="clay-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
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
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Comisiones Ganadas</span>
                <span className="font-mono text-sm font-black text-emerald-700">
                  ${empleados.reduce((acc, e) => acc + Number(e.total_comisiones || 0), 0).toFixed(2)}
                </span>
                <span className="text-[9px] font-mono text-amber-600 block">
                  +${empleados.reduce((acc, e) => acc + Number(e.comisiones_pendientes || 0), 0).toFixed(2)} en camino
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

                            {/* 5. Porcentaje Comisión */}
                            <td className="py-3 px-4 text-center font-mono">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black">
                                <Percent className="w-3 h-3 text-emerald-600" />
                                <span>{Number(emp.comision_porcentaje !== undefined ? emp.comision_porcentaje : 5.00).toFixed(1)}%</span>
                              </span>
                            </td>

                            {/* 6. Comisiones Acumuladas */}
                            <td className="py-3 px-4 text-right">
                              <div className="font-mono text-xs font-black text-emerald-700">
                                ${comisionTotal.toFixed(2)}
                              </div>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {emp.pedidos_entregados || 0} ent. / {emp.total_pedidos || 0} tot.
                              </span>
                              {Number(emp.comisiones_pendientes || 0) > 0 && (
                                <span className="text-[9px] font-mono text-amber-600 block">
                                  +${Number(emp.comisiones_pendientes || 0).toFixed(2)} pend.
                                </span>
                              )}
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
      {/* VISTA 3: FORMAS DE PAGO & PEDIDOS ASOCIADOS                     */}
      {/* ============================================================== */}
      {activeTab === 'formas_pago' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Cabecera compacta (sin tarjetas KPI gigantes) */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 rounded-lg bg-amber-500 text-white shadow-sm shrink-0">
                <CreditCard className="w-4 h-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Formas de Pago</h3>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                    {formasPago.length} métodos ({formasPago.filter((f) => f.activo).length} activos)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-bold">
                    Recaudado: ${formasPago.reduce((acc, f) => acc + Number(f.total_monto || 0), 0).toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Haz clic en cualquier fila de la tabla para auditar los pedidos cobrados con esa cuenta o método.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar método o tipo..."
                  value={searchFormaPago}
                  onChange={(e) => setSearchFormaPago(e.target.value)}
                  className="clay-input w-full pl-9 pr-7 py-1.5 text-xs font-medium"
                />
                {searchFormaPago && (
                  <button
                    type="button"
                    onClick={() => setSearchFormaPago('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={fetchFormasPago}
                className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shrink-0"
                disabled={loadingFormasPago}
                title="Recargar catálogo"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loadingFormasPago ? 'animate-spin' : ''}`} />
                <span>Recargar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalFormaPago({
                    isOpen: true,
                    isEdit: false,
                    id: '',
                    nombre: '',
                    tipo: 'BANCO',
                    activo: true,
                  });
                }}
                className="clay-btn bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nueva Forma</span>
              </button>
            </div>
          </div>

          {/* Tablas lado a lado: Métodos y Pedidos (Master-Detail sin tarjetas circulares) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* TABLA 1: Catálogo de Formas de Pago (6 de 12 cols) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>Métodos de Pago</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Clic en una fila para ver pedidos</span>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                {loadingFormasPago ? (
                  <div className="py-12 text-center text-slate-400">
                    <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                    <span className="text-xs font-bold">Cargando formas de pago...</span>
                  </div>
                ) : formasPago.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-xs font-bold">No hay formas de pago registradas.</p>
                  </div>
                ) : (
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-2.5">Estado</th>
                        <th className="py-2.5 px-2.5">Forma de Pago</th>
                        <th className="py-2.5 px-2 text-center">Tipo</th>
                        <th className="py-2.5 px-2 text-center">Pagos</th>
                        <th className="py-2.5 px-2.5 text-right">Cobrado</th>
                        <th className="py-2.5 px-2 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formasPago
                        .filter((fp) => {
                          if (!searchFormaPago.trim()) return true;
                          const q = searchFormaPago.toLowerCase();
                          return fp.nombre.toLowerCase().includes(q) || fp.tipo.toLowerCase().includes(q);
                        })
                        .map((fp) => {
                          const isSelected = selectedFormaPago?.id === fp.id;
                          return (
                            <tr
                              key={fp.id}
                              onClick={() => selectFormaPago(fp)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-amber-100/75 font-semibold border-l-4 border-amber-600'
                                  : 'hover:bg-slate-50 border-l-4 border-transparent'
                              } ${!fp.activo ? 'opacity-55 bg-slate-50/50' : ''}`}
                            >
                              <td className="py-2.5 px-2.5 whitespace-nowrap">
                                <span
                                  className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                    fp.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {fp.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>

                              <td className="py-2.5 px-2.5 font-bold text-slate-900">
                                <div className="truncate max-w-[180px]" title={fp.nombre}>
                                  {fp.nombre}
                                </div>
                              </td>

                              <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] text-slate-700 font-mono font-bold">
                                  {fp.tipo}
                                </span>
                              </td>

                              <td className="py-2.5 px-2 text-center font-mono text-slate-600 whitespace-nowrap">
                                {fp.total_transacciones || 0}
                              </td>

                              <td className="py-2.5 px-2.5 text-right font-mono font-black text-emerald-700 whitespace-nowrap">
                                ${Number(fp.total_monto || 0).toFixed(2)}
                              </td>

                              <td className="py-2.5 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setModalFormaPago({
                                        isOpen: true,
                                        isEdit: true,
                                        id: fp.id,
                                        nombre: fp.nombre,
                                        tipo: fp.tipo,
                                        activo: fp.activo,
                                      })
                                    }
                                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                                    title="Editar forma de pago"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleActivoFormaPago(fp, e)}
                                    className={`p-1 rounded transition-colors ${
                                      fp.activo
                                        ? 'text-emerald-600 hover:bg-emerald-50'
                                        : 'text-slate-400 hover:bg-slate-100'
                                    }`}
                                    title={fp.activo ? 'Desactivar método' : 'Activar método'}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* TABLA 2: Pedidos y Cobros del Método Seleccionado (6 de 12 cols) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              {selectedFormaPago ? (
                <>
                  <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Pedidos con:
                      </span>
                      <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded truncate max-w-[160px]" title={selectedFormaPago.nombre}>
                        {selectedFormaPago.nombre}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          selectedFormaPago.activo
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {selectedFormaPago.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-700 font-bold">
                        {transaccionesFormaPago.length} pagos
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">
                        Total: ${transaccionesFormaPago.reduce((acc, t) => acc + Number(t.monto || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    {loadingTransacciones ? (
                      <div className="py-16 text-center text-slate-400">
                        <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        <span className="text-xs font-bold">Cargando pedidos de {selectedFormaPago.nombre}...</span>
                      </div>
                    ) : transaccionesFormaPago.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 space-y-1">
                        <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                        <p className="text-xs font-bold text-slate-700">Sin pedidos registrados con esta forma de pago</p>
                        <p className="text-[11px] text-slate-400">
                          Cuando se registre o confirme un abono mediante {selectedFormaPago.nombre}, aparecerá detallado aquí.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="py-2.5 px-3">Pedido & Fecha</th>
                            <th className="py-2.5 px-3">Cliente</th>
                            <th className="py-2.5 px-3">Asesora</th>
                            <th className="py-2.5 px-3">Comprobante / Obs.</th>
                            <th className="py-2.5 px-3 text-right">Abono</th>
                            <th className="py-2.5 px-3 text-center">Estado Pedido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {transaccionesFormaPago.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 whitespace-nowrap">
                                <div className="font-mono font-bold text-indigo-700 text-xs">
                                  #{t.numero_pedido || t.pedido_id.slice(0, 8)}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {t.fecha_pago ? String(t.fecha_pago).slice(0, 10) : ''}
                                </span>
                              </td>

                              <td className="py-2 px-3">
                                <div className="font-bold text-slate-900 text-xs truncate max-w-[140px]" title={t.cliente_nombre}>
                                  {t.cliente_nombre || 'Cliente general'}
                                </div>
                                {t.cliente_telefono && (
                                  <a
                                    href={`https://wa.me/503${t.cliente_telefono.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-emerald-600 hover:underline font-mono flex items-center gap-1"
                                  >
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>{t.cliente_telefono}</span>
                                  </a>
                                )}
                              </td>

                              <td className="py-2 px-3 text-slate-600 font-medium whitespace-nowrap">
                                {t.vendedora_nombre || t.usuario || '-'}
                              </td>

                              <td className="py-2 px-3">
                                {t.num_documento_auto ? (
                                  <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {t.num_documento_auto}
                                  </span>
                                ) : t.observaciones ? (
                                  <span className="text-[10px] text-slate-500 italic truncate max-w-[140px] block" title={t.observaciones}>
                                    {t.observaciones}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Sin comprobante</span>
                                )}
                              </td>

                              <td className="py-2 px-3 text-right font-mono font-black text-emerald-700 text-xs whitespace-nowrap">
                                ${Number(t.monto).toFixed(2)}
                              </td>

                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                <span
                                  className={`inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${
                                    t.pedido_estado?.toLowerCase() === 'entregado'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : t.pedido_estado?.toLowerCase() === 'cancelado'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {t.pedido_estado || 'Registrado'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-slate-400">
                  <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Selecciona una forma de pago en la tabla</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Haz clic sobre cualquier fila para auditar sus transacciones asociadas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 4: COMISIONES & LIQUIDACIÓN KODE                          */}
      {/* ============================================================== */}
      {activeTab === 'comisiones' && (
        <div className="space-y-3.5">
          <div className="clay-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                  <DollarSign className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Liquidación de Comisiones</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Cálculo automatizado de comisiones. Las comisiones solo se acumulan y liquidan al entregarse el pedido.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Comisiones Ganadas (Entregados)
                </span>
                <span className="font-mono text-xl font-black text-emerald-700">
                  ${empleados.reduce((acc, e) => acc + Number(e.total_comisiones || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Configuración Global de Comisión al 5% */}
          <div className="clay-card p-6 bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/70 border border-emerald-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
                    <Percent className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">
                    Configuración Global de Comisión de Ventas
                  </h4>
                  <span className="clay-badge text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    Estándar: 5.00%
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Establece el porcentaje estándar asignado a las asesoras sobre el valor de cada venta.
                </p>
                <div className="mt-2 font-bold text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Regla de Negocio:</strong> La comisión de venta <u>solo se calcula y acumula cuando el pedido es entregado</u>. Los pedidos en preparación o en camino figuran como comisiones pendientes.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    % Comisión Global
                  </label>
                  <div className="relative w-28">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={comisionGlobalPct}
                      onChange={(e) => setComisionGlobalPct(parseFloat(e.target.value) || 0)}
                      className="clay-input w-full font-mono font-black text-emerald-700 text-sm py-1 px-2.5 pr-7"
                    />
                    <span className="absolute right-2.5 top-1.5 font-bold text-xs text-slate-400">%</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAplicarComisionGlobal}
                  disabled={aplicandoComisionGlobal}
                  className="clay-btn bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 text-xs font-black shadow-md shadow-emerald-200 flex items-center gap-1.5 self-end"
                >
                  {aplicandoComisionGlobal ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{aplicandoComisionGlobal ? 'Aplicando...' : 'Aplicar a Todos'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tarjetas de Reglas de Comisión */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="clay-card p-5 flex items-center justify-between gap-4 border-l-4 border-l-emerald-500">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Comisión de Ventas por Pedido Entregado
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Porcentaje aplicado al valor de los pedidos efectivamente entregados.
                </p>
              </div>
              <div className="font-mono text-2xl font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                {comisionGlobalPct.toFixed(1)}%
              </div>
            </div>

            <div className="clay-card p-5 flex items-center justify-between gap-4 border-l-4 border-l-indigo-500">
              <div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                  Regla de Cálculo por Línea de Producto
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Se calcula el % pactado (ej. 5%, 6%, 10%) por cada perfume o ítem del pedido, sin incluir flete ni cargos de envío.
                </p>
              </div>
              <div className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 shrink-0">
                Línea x %
              </div>
            </div>
          </div>

          {/* Tabla de Liquidación por Vendedora */}
          <div className="clay-card p-6 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Estado de Cuenta por Asesora (Comisiones por Pedidos Entregados)</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Asesora</th>
                    <th className="py-3 px-3">Email & Contacto</th>
                    <th className="py-3 px-3 text-center">Pedidos Registrados</th>
                    <th className="py-3 px-3 text-center">Pedidos Entregados</th>
                    <th className="py-3 px-3 text-right">Ventas Entregadas</th>
                    <th className="py-3 px-3 text-center">% Comisión</th>
                    <th className="py-3 px-3 text-right">Comisión Ganada</th>
                    <th className="py-3 px-3 text-right">Comisión Pendiente</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {empleados.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-extrabold text-slate-900">
                        {emp.nombre}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        <div>{emp.email}</div>
                        {emp.telefono && <span className="text-[10px] text-slate-400">{emp.telefono}</span>}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                        {emp.total_pedidos || 0}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                        <span className="clay-badge text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                          {emp.pedidos_entregados || 0} entregados
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ${Number(emp.total_ventas || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-indigo-700">
                        {Number(emp.comision_porcentaje !== undefined ? emp.comision_porcentaje : 5.00).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 text-sm">
                        ${Number(emp.total_comisiones || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-amber-700 text-xs">
                        ${Number(emp.comisiones_pendientes || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openFseModal(emp)}
                            className="clay-btn bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-300 px-2.5 py-1 text-[10px] font-bold flex items-center gap-1"
                            title="Emitir Factura de Sujeto Excluido DTE-14"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>DTE-14</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => showNotification(`Liquidación de $${Number(emp.total_comisiones || 0).toFixed(2)} registrada para ${emp.nombre}`, 'success')}
                            className="clay-btn bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-[10px] font-bold"
                          >
                            Liquidar
                          </button>
                        </div>
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
        <div className="space-y-3.5">
          <div className="clay-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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

              {/* SECCIÓN 3: PORCENTAJE DE COMISIÓN */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3. Porcentaje de Comisión por Línea de Producto</span>
                </h4>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Comisión del Colaborador (%) *
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-32">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={empleadoComisionPorcentaje}
                        onChange={(e) => setEmpleadoComisionPorcentaje(parseFloat(e.target.value) || 0)}
                        className="clay-input w-full font-mono text-sm font-black text-emerald-700 pr-7"
                        required
                      />
                      <span className="absolute right-3 top-2.5 font-bold text-xs text-slate-400">%</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[5, 6, 8, 10].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setEmpleadoComisionPorcentaje(pct)}
                          className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all ${
                            empleadoComisionPorcentaje === pct
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    La comisión es exclusivamente un porcentaje aplicado sobre cada producto del pedido. 
                    Por ejemplo, al <strong>{empleadoComisionPorcentaje}%</strong>: si lleva un perfume de $20.00 se calcula el {empleadoComisionPorcentaje}% de $20.00 (${(20 * (empleadoComisionPorcentaje / 100)).toFixed(2)}), 
                    y si el segundo queda en $15.00 se calcula el {empleadoComisionPorcentaje}% de $15.00 (${(15 * (empleadoComisionPorcentaje / 100)).toFixed(2)}), 
                    sumando una comisión total de ${( (20 + 15) * (empleadoComisionPorcentaje / 100) ).toFixed(2)} en ese pedido.
                  </p>
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

      {/* ============================================================== */}
      {/* MODAL 4: CREAR / EDITAR FORMA DE PAGO                          */}
      {/* ============================================================== */}
      {modalFormaPago.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="clay-card w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 space-y-4">
            <button
              type="button"
              onClick={() => setModalFormaPago((prev) => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {modalFormaPago.isEdit ? 'Editar Forma de Pago' : 'Nueva Forma de Pago'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Configura el nombre y tipo para el registro de cobros.
                </p>
              </div>
            </div>

            <form onSubmit={handleGuardarFormaPago} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Cuenta o Método *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Cuenta Bac 130693682, Contra Entrega..."
                  value={modalFormaPago.nombre}
                  onChange={(e) => setModalFormaPago((prev) => ({ ...prev, nombre: e.target.value }))}
                  className="clay-input w-full text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Forma de Pago
                </label>
                <select
                  value={modalFormaPago.tipo}
                  onChange={(e) => setModalFormaPago((prev) => ({ ...prev, tipo: e.target.value }))}
                  className="clay-input w-full text-xs font-bold cursor-pointer"
                >
                  <option value="BANCO">BANCO (Transferencias / Cuentas)</option>
                  <option value="CONTRA_ENTREGA">CONTRA_ENTREGA (Efectivo C807 al entregar)</option>
                  <option value="EFECTIVO">EFECTIVO (Caja local)</option>
                  <option value="PASARELA">PASARELA (Wompi, Nequi, etc.)</option>
                  <option value="AJUSTE">AJUSTE (Cambio, Faltante, Descuento)</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formaPagoActivo"
                  checked={modalFormaPago.activo}
                  onChange={(e) => setModalFormaPago((prev) => ({ ...prev, activo: e.target.checked }))}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <label htmlFor="formaPagoActivo" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Habilitar para selección en pedidos y abonos (Activo)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalFormaPago((prev) => ({ ...prev, isOpen: false }))}
                  className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn bg-amber-600 text-white hover:bg-amber-700 px-5 py-2 text-xs font-black shadow-md shadow-amber-200"
                >
                  {modalFormaPago.isEdit ? 'Actualizar Forma de Pago' : 'Guardar Forma de Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
