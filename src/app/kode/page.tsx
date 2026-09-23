'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  ListOrdered,
  PackageCheck,
  Truck,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Send,
  Check,
  User,
  UserPlus,
  Sparkles,
  CreditCard,
  Building,
  DollarSign,
  ReceiptText,
  MessageCircle,
  Copy,
  Users,
  FlaskConical,
  ArrowDown,
  Layers,
  Calendar,
  ChevronRight,
  TrendingUp,
  Package,
  Menu,
  X,
  Store,
  Box,
  FileText,
  Mail,
  PlusCircle,
  ArrowDownCircle,
  Pencil
} from 'lucide-react';
import { DEPARTAMENTOS_CATALOG, MUNICIPIOS_CATALOG, resolveC807DeptoCode, getMunicipiosByDepto } from '@/lib/svTerritory';

function formatearMarcaTemporal(fechaStr: string) {
  if (!fechaStr) return '';
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;
    const dia = d.getDate();
    const mes = d.getMonth() + 1;
    const anio = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const segs = String(d.getSeconds()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${horas}:${mins}:${segs}`;
  } catch {
    return fechaStr;
  }
}

function getClienteColorPorEstado(estado: string) {
  if (estado === 'Registrado' || estado === 'PENDIENTE_COMPRA') {
    return 'text-red-600 font-bold hover:text-red-700';
  }
  if (estado === 'Insumos comprados' || estado === 'PENDIENTE_PREPARAR') {
    return 'text-amber-600 font-bold hover:text-amber-700';
  }
  if (estado === 'Preparado' || estado === 'Enviado' || estado === 'GUIA_CREADA') {
    return 'text-blue-600 font-bold hover:text-blue-700';
  }
  if (estado === 'Entregado' || estado === 'ENTREGADO') {
    return 'text-emerald-600 font-bold hover:text-emerald-700';
  }
  if (estado === 'Cancelado' || estado === 'CANCELADO') {
    return 'text-slate-400 font-bold line-through';
  }
  return 'text-slate-900 font-bold';
}

interface CatalogoItem {
  id: string;
  codigo: string;
  contratipo: string;
  marca_inspirada: string;
  genero: string;
  precio_normal: string | number;
  precio_extra_shot: string | number;
  activo?: boolean;
  imagen_url?: string;
}

interface Vendedora {
  id: string;
  nombre: string;
  email: string;
}

interface PedidoItem {
  id?: string;
  catalogo_id: string;
  codigo: string;
  contratipo: string;
  marca?: string;
  version: 'Normal' | 'Plus' | 'NORMAL' | 'EXTRA_SHOT';
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  insumo_comprado?: boolean;
}

interface ClienteItem {
  id: string;
  nombre_completo: string;
  telefono_whatsapp: string;
  direccion_entrega: string;
  departamento: string;
  municipio: string;
  punto_referencia?: string;
  tipo_documento?: string;
  numero_documento?: string;
  email?: string;
  pedidos_count?: number;
  total_gastado?: number;
}

interface FormaPagoItem {
  id: string;
  nombre: string;
  tipo: string;
  activo: boolean;
}

interface PagoItem {
  id: string;
  pedido_id: string;
  cliente_id?: string;
  forma_pago_id: string;
  forma_pago_nombre?: string;
  forma_pago_tipo?: string;
  monto: number;
  fecha_pago: string;
  num_documento_auto?: string;
  estado_pago?: string;
  usuario?: string;
  observaciones?: string;
  created_at?: string;
}

interface PagoRegistroItem {
  id: string;
  forma_pago_id: string;
  forma_pago_nombre: string;
  forma_pago_tipo?: string;
  monto: number;
  num_documento_auto?: string;
  observaciones?: string;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  estado: 'Registrado' | 'Insumos comprados' | 'Preparado' | 'Enviado' | 'Entregado' | 'Cancelado' | string;
  tipo_pago: string;
  estado_pago: string;
  subtotal: string | number;
  costo_envio: string | number;
  total: string | number;
  monto_cobrar_cce?: number | string;
  total_pagado?: number;
  pagos?: PagoItem[];
  c807_guia_numero?: string;
  c807_link_rastreo?: string;
  c807_estado?: string;
  c807_fecha_guia?: string;
  notas?: string;
  created_at: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  cliente_departamento: string;
  cliente_municipio: string;
  cliente_referencia?: string;
  cliente_tipo_documento?: string;
  cliente_numero_documento?: string;
  cliente_email?: string;
  vendedora_id?: string;
  vendedora_nombre?: string;
  vendedora_email?: string;
  items: PedidoItem[];
}

interface InsumoItem {
  item_id: string;
  pedido_id: string;
  numero_pedido: string;
  pedido_estado?: string;
  cliente_nombre: string;
  fecha_registro: string;
  catalogo_id: string;
  codigo: string;
  contratipo: string;
  marca_inspirada?: string;
  genero?: string;
  version: 'Normal' | 'Plus' | string;
  cantidad: number;
}

interface CompraGasto {
  id: string;
  fecha_compra: string;
  concepto: string;
  monto_total: number;
  proveedor: string;
  categoria: 'ESENCIAS' | 'CAJAS' | 'FRASCOS' | 'PAPEL' | 'OTROS INSUMOS';
  estado_pago: string;
}

const COMPRAS_INICIALES: CompraGasto[] = [
  {
    id: 'GASTO-001',
    fecha_compra: '2026-09-20',
    concepto: '5 Litros Esencia Concentrada Sauvage & Aventus',
    monto_total: 280.00,
    proveedor: 'Aromas Creativos',
    categoria: 'ESENCIAS',
    estado_pago: 'PAGADO'
  },
  {
    id: 'GASTO-002',
    fecha_compra: '2026-09-21',
    concepto: '300 Frascos Vidrio 100ml con Atomizador Plata',
    monto_total: 195.00,
    proveedor: 'Inveromatic SV',
    categoria: 'FRASCOS',
    estado_pago: 'PAGADO'
  },
  {
    id: 'GASTO-003',
    fecha_compra: '2026-09-22',
    concepto: '500 Cajas de Presentación KÖDE con Realce UV',
    monto_total: 150.00,
    proveedor: 'Imprenta Central',
    categoria: 'CAJAS',
    estado_pago: 'PAGADO'
  }
];

export default function KodeSystemPage() {
  // Navegación Sidebar Principal
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState<'VENTAS' | 'INVENTARIO' | 'FABRICACION' | 'LOGISTICA' | 'INTELIGENCIA_NEGOCIOS'>('VENTAS');

  // Sub-vistas dentro de cada sección (similar al sistema anterior)
  // VENTAS: 'hub' | 'nuevo_pedido' | 'nuevo_cliente' | 'clientes' | 'pedidos' | 'catalogo'
  const [ventasView, setVentasView] = useState<'hub' | 'nuevo_pedido' | 'nuevo_cliente' | 'clientes' | 'pedidos' | 'catalogo'>('hub');
  // FABRICACION: 'hub' | 'compra_pendiente' | 'por_fabricar'
  const [fabView, setFabView] = useState<'hub' | 'compra_pendiente' | 'por_fabricar'>('hub');
  // INTELIGENCIA_NEGOCIOS: 'hub' | 'compras' | 'dashboard'
  const [biView, setBiView] = useState<'hub' | 'compras' | 'dashboard'>('hub');

  // Buscador global de la barra superior
  const [searchQuery, setSearchQuery] = useState('');

  // Datos maestros
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [insumos, setInsumos] = useState<InsumoItem[]>([]);
  const [compras, setCompras] = useState<CompraGasto[]>([]);

  // Filtros del catálogo
  const [filtroGeneroCatalogo, setFiltroGeneroCatalogo] = useState<'TODOS' | 'CABALLERO' | 'DAMA' | 'UNISEX'>('TODOS');
  const [filtroEstadoCatalogo, setFiltroEstadoCatalogo] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');

  // Edición y disponibilidad de fragancias
  const [perfumeEditando, setPerfumeEditando] = useState<CatalogoItem | null>(null);
  const [formEdicionPerfume, setFormEdicionPerfume] = useState({
    codigo: '',
    contratipo: '',
    marca_inspirada: '',
    genero: 'Caballero',
    precio_normal: '20.00',
    precio_extra_shot: '25.00',
    activo: true,
  });
  const [guardandoEdicionPerfume, setGuardandoEdicionPerfume] = useState(false);
  const [togglingActivoId, setTogglingActivoId] = useState<string | null>(null);

  // Añadir nueva fragancia al catálogo
  const [modalNuevaFragancia, setModalNuevaFragancia] = useState(false);
  const [formNuevaFragancia, setFormNuevaFragancia] = useState({
    codigo: '',
    contratipo: '',
    marca_inspirada: '',
    genero: 'Caballero',
    precio_normal: '20.00',
    precio_extra_shot: '25.00',
    activo: true,
  });
  const [guardandoNuevaFragancia, setGuardandoNuevaFragancia] = useState(false);

  // Loading & Toasts
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Formulario Nuevo Pedido / Cliente
  const [vendedoraSeleccionada, setVendedoraSeleccionada] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteTipoDoc, setClienteTipoDoc] = useState('DUI');
  const [clienteNumDoc, setClienteNumDoc] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteDepto, setClienteDepto] = useState('');
  const [clienteMuni, setClienteMuni] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteReferencia, setClienteReferencia] = useState('');
  const [contactoAdicional, setContactoAdicional] = useState('');
  const [mostrarSugerenciasCliente, setMostrarSugerenciasCliente] = useState(false);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string | null>(null);
  const [tipoPago, setTipoPago] = useState<'TRANSFERENCIA' | 'TARJETA' | 'CONTRAENTREGA'>('CONTRAENTREGA');
  const [estadoPago, setEstadoPago] = useState<'PENDIENTE' | 'PAGADO'>('PENDIENTE');
  const [costoEnvio, setCostoEnvio] = useState<number>(0);
  const [descuento, setDescuento] = useState<number>(0);
  const [montoPagado, setMontoPagado] = useState<number>(0);
  const [pagoContraEntrega, setPagoContraEntrega] = useState<boolean>(true);
  const [solicitudesEspeciales, setSolicitudesEspeciales] = useState('');

  // Catálogo de Formas de Pago y selección en nuevo pedido
  const [formasPago, setFormasPago] = useState<FormaPagoItem[]>([]);
  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState<string>('1003');
  const [numDocumentoAuto, setNumDocumentoAuto] = useState<string>('');

  // Formas de pago múltiples / mixtas para Nuevo Pedido
  const [pagosPedido, setPagosPedido] = useState<PagoRegistroItem[]>([]);
  const [pagoInputFormaId, setPagoInputFormaId] = useState<string>('1001');
  const [pagoInputMonto, setPagoInputMonto] = useState<string>('');
  const [pagoInputDoc, setPagoInputDoc] = useState<string>('');

  // Modal para Registrar Abono / Liquidación a Pedido Existente
  const [modalAbonoPedido, setModalAbonoPedido] = useState<Pedido | null>(null);
  const [abonoMonto, setAbonoMonto] = useState<string>('');
  const [abonoFormaPagoId, setAbonoFormaPagoId] = useState<string>('1001');
  const [abonoNumDoc, setAbonoNumDoc] = useState<string>('');
  const [abonoFecha, setAbonoFecha] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [abonoObservaciones, setAbonoObservaciones] = useState<string>('');
  const [abonoLoading, setAbonoLoading] = useState(false);

  // Directorio y formulario de Clientes
  const [clientesDb, setClientesDb] = useState<ClienteItem[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [ncNombre, setNcNombre] = useState('');
  const [ncTelefono, setNcTelefono] = useState('');
  const [ncTipoDoc, setNcTipoDoc] = useState('DUI');
  const [ncNumDoc, setNcNumDoc] = useState('');
  const [ncEmail, setNcEmail] = useState('');
  const [ncDepto, setNcDepto] = useState('San Salvador');
  const [ncMuni, setNcMuni] = useState('San Salvador Centro');
  const [ncDireccion, setNcDireccion] = useState('');
  const [ncReferencia, setNcReferencia] = useState('');
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  const resetNuevoClienteForm = () => {
    setNcNombre('');
    setNcTelefono('');
    setNcTipoDoc('DUI');
    setNcNumDoc('');
    setNcEmail('');
    setNcDepto('San Salvador');
    setNcMuni('San Salvador Centro');
    setNcDireccion('');
    setNcReferencia('');
  };

  // Selector de perfumes en el form
  const [busquedaPerfume, setBusquedaPerfume] = useState('');
  const [perfumeSeleccionado, setPerfumeSeleccionado] = useState<CatalogoItem | null>(null);
  const [versionSeleccionada, setVersionSeleccionada] = useState<'Normal' | 'Plus'>('Normal');
  const [cantidadPerfume, setCantidadPerfume] = useState<number>(1);
  const [itemsPedido, setItemsPedido] = useState<PedidoItem[]>([]);

  // Filtros de Listado
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [expandedPedidoId, setExpandedPedidoId] = useState<string | null>(null);

  // Fabricación Split-pane selección
  const [selectedPedidoIdFab, setSelectedPedidoIdFab] = useState<string | null>(null);

  // Modal Guía C807
  const [guiaModalPedido, setGuiaModalPedido] = useState<Pedido | null>(null);
  const [numGuiaInput, setNumGuiaInput] = useState('');
  const [linkGuiaInput, setLinkGuiaInput] = useState('');
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  // Formulario Compras
  const [nuevaCompraFecha, setNuevaCompraFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [nuevaCompraConcepto, setNuevaCompraConcepto] = useState('');
  const [nuevaCompraMonto, setNuevaCompraMonto] = useState<number>(0);
  const [nuevaCompraProveedor, setNuevaCompraProveedor] = useState('');
  const [nuevaCompraCategoria, setNuevaCompraCategoria] = useState<'ESENCIAS' | 'CAJAS' | 'FRASCOS' | 'PAPEL' | 'OTROS INSUMOS'>('ESENCIAS');
  const [filtroCategoriaCompra, setFiltroCategoriaCompra] = useState<string>('TODAS');

  const [generandoGuia, setGenerandoGuia] = useState(false);

  // Modal y estado Factura Llama (DTE)
  const [emitiendoDteId, setEmitiendoDteId] = useState<string | null>(null);
  const [dteResultModal, setDteResultModal] = useState<{
    pedido: Pedido;
    result: any;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchClientes = async () => {
    try {
      setLoadingClientes(true);
      const res = await fetch('/api/kode/clientes');
      const data = await res.json();
      if (data.success && Array.isArray(data.clientes)) {
        setClientesDb(data.clientes);
      }
    } catch (e) {
      console.error('Error cargando clientes:', e);
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    fetchCatalogo();
    fetchVendedoras();
    fetchPedidos();
    fetchInsumos();
    fetchFormasPago();
    fetchClientes();
    cargarComprasLocal();
  }, []);

  const cargarComprasLocal = () => {
    try {
      const saved = localStorage.getItem('kode_compras_db');
      if (saved) {
        setCompras(JSON.parse(saved));
      } else {
        setCompras(COMPRAS_INICIALES);
        localStorage.setItem('kode_compras_db', JSON.stringify(COMPRAS_INICIALES));
      }
    } catch {
      setCompras(COMPRAS_INICIALES);
    }
  };

  const guardarComprasLocal = (actualizadas: CompraGasto[]) => {
    setCompras(actualizadas);
    try {
      localStorage.setItem('kode_compras_db', JSON.stringify(actualizadas));
    } catch (e) {
      console.error('Error guardando en localStorage', e);
    }
  };

  const fetchCatalogo = async () => {
    try {
      const res = await fetch('/api/kode/catalogo?all=true');
      const data = await res.json();
      if (data.success) {
        setCatalogo(data.perfumes);
      }
    } catch (e) {
      console.error('Error cargando catalogo:', e);
    }
  };

  const fetchVendedoras = async () => {
    try {
      const res = await fetch('/api/kode/vendedoras');
      const data = await res.json();
      if (data.success && data.vendedoras.length > 0) {
        setVendedoras(data.vendedoras);
        setVendedoraSeleccionada(data.vendedoras[0].id);
      }
    } catch (e) {
      console.error('Error cargando vendedoras:', e);
    }
  };

  const fetchPedidos = async () => {
    try {
      const res = await fetch('/api/kode/pedidos');
      const data = await res.json();
      if (data.success) {
        setPedidos(data.pedidos);
      }
    } catch (e) {
      console.error('Error cargando pedidos:', e);
    }
  };

  const fetchInsumos = async () => {
    try {
      const res = await fetch('/api/kode/insumos');
      const data = await res.json();
      if (data.success) {
        setInsumos(data.insumos);
      }
    } catch (e) {
      console.error('Error cargando insumos:', e);
    }
  };

  const fetchFormasPago = async () => {
    try {
      const res = await fetch('/api/kode/formas-pago');
      const data = await res.json();
      if (data.success && Array.isArray(data.formasPago)) {
        setFormasPago(data.formasPago);
        if (data.formasPago.length > 0) {
          // Default: Si existe 1003 (Contra Entrega), seleccionarla
          const contraEntrega = data.formasPago.find((f: FormaPagoItem) => f.id === '1003');
          setFormaPagoSeleccionada(contraEntrega ? contraEntrega.id : data.formasPago[0].id);
          const primerBanco = data.formasPago.find((f: FormaPagoItem) => f.tipo === 'BANCO') || data.formasPago[0];
          setPagoInputFormaId(primerBanco.id);
        }
      }
    } catch (e) {
      console.error('Error cargando formas de pago:', e);
    }
  };

  const municipiosDisponibles = useMemo(() => {
    if (!clienteDepto) return [];
    return getMunicipiosByDepto(clienteDepto);
  }, [clienteDepto]);

  // Directorio consolidado de clientes (base de datos + pedidos históricos)
  const directorioClientes = useMemo(() => {
    const mapa = new Map<string, {
      id: string;
      nombre: string;
      telefono: string;
      direccion: string;
      departamento: string;
      municipio: string;
      referencia?: string;
      tipo_documento?: string;
      numero_documento?: string;
      email?: string;
      pedidosCount: number;
      totalGastado: number;
    }>();

    // 1. Clientes registrados en base de datos
    clientesDb.forEach((c) => {
      const cleanPhone = (c.telefono_whatsapp || '').toString().replace(/\D/g, '');
      const key = cleanPhone || (c.nombre_completo || '').trim().toLowerCase();
      if (!key) return;
      mapa.set(key, {
        id: c.id,
        nombre: c.nombre_completo,
        telefono: c.telefono_whatsapp,
        direccion: c.direccion_entrega,
        departamento: c.departamento,
        municipio: c.municipio,
        referencia: c.punto_referencia,
        tipo_documento: c.tipo_documento || 'DUI',
        numero_documento: c.numero_documento || '',
        email: c.email || '',
        pedidosCount: Number(c.pedidos_count || 0),
        totalGastado: Number(c.total_gastado || 0),
      });
    });

    // 2. Clientes históricos en pedidos
    pedidos.forEach((p) => {
      const cleanPhone = (p.cliente_telefono || '').toString().replace(/\D/g, '');
      const key = cleanPhone || (p.cliente_nombre || '').trim().toLowerCase();
      if (!key) return;
      const totalNum = parseFloat(p.total?.toString() || '0');
      if (!mapa.has(key)) {
        mapa.set(key, {
          id: p.cliente_id || `CLIENTE-${p.cliente_telefono || cleanPhone}`,
          nombre: p.cliente_nombre,
          telefono: p.cliente_telefono,
          direccion: p.cliente_direccion,
          departamento: p.cliente_departamento,
          municipio: p.cliente_municipio,
          referencia: p.cliente_referencia,
          tipo_documento: p.cliente_tipo_documento || 'DUI',
          numero_documento: p.cliente_numero_documento || '',
          email: p.cliente_email || '',
          pedidosCount: 1,
          totalGastado: totalNum,
        });
      } else {
        const c = mapa.get(key)!;
        if (!c.pedidosCount && !c.totalGastado) {
          c.pedidosCount += 1;
          c.totalGastado += totalNum;
        }
        if (!c.numero_documento && p.cliente_numero_documento) {
          c.numero_documento = p.cliente_numero_documento;
          c.tipo_documento = p.cliente_tipo_documento || 'DUI';
        }
        if (!c.email && p.cliente_email) {
          c.email = p.cliente_email;
        }
      }
    });

    return Array.from(mapa.values());
  }, [clientesDb, pedidos]);

  const ncMunicipiosDisponibles = useMemo(() => {
    if (!ncDepto) return [];
    return getMunicipiosByDepto(ncDepto);
  }, [ncDepto]);

  const handleGuardarNuevoCliente = async (crearPedidoDirecto = false) => {
    if (!ncNombre.trim()) {
      showToast('Ingresa el nombre completo del cliente', 'error');
      return;
    }
    if (!ncTelefono.trim()) {
      showToast('Ingresa el teléfono WhatsApp del cliente', 'error');
      return;
    }
    if (!ncDireccion.trim()) {
      showToast('Ingresa la dirección de entrega del cliente', 'error');
      return;
    }

    try {
      setGuardandoCliente(true);
      const res = await fetch('/api/kode/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: ncNombre.trim(),
          telefono_whatsapp: ncTelefono.trim(),
          tipo_documento: ncTipoDoc.trim() || 'DUI',
          numero_documento: ncNumDoc.trim() || null,
          email: ncEmail.trim() || null,
          departamento: ncDepto,
          municipio: ncMuni,
          direccion_entrega: ncDireccion.trim(),
          punto_referencia: ncReferencia.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Error al guardar cliente', 'error');
        return;
      }

      showToast(`Cliente "${ncNombre.trim()}" registrado con éxito`, 'success');
      await fetchClientes();

      if (crearPedidoDirecto) {
        handleSeleccionarCliente({
          nombre: ncNombre.trim(),
          telefono: ncTelefono.trim(),
          direccion: ncDireccion.trim(),
          departamento: ncDepto,
          municipio: ncMuni,
          referencia: ncReferencia.trim(),
          tipo_documento: ncTipoDoc.trim() || 'DUI',
          numero_documento: ncNumDoc.trim(),
          email: ncEmail.trim(),
        });
      } else {
        setVentasView('clientes');
      }

      resetNuevoClienteForm();
    } catch (e: any) {
      console.error('Error guardando cliente:', e);
      showToast(e.message || 'Error al conectar con el servidor', 'error');
    } finally {
      setGuardandoCliente(false);
    }
  };

  const clientesSugeridos = useMemo(() => {
    if (!clienteNombre.trim() || clienteNombre.trim().length < 1) return [];
    const q = clienteNombre.toLowerCase().trim();
    const cleanNum = clienteNombre.replace(/\D/g, '');
    return directorioClientes
      .filter((c) => {
        const matchName = c.nombre.toLowerCase().includes(q);
        const matchPhone = cleanNum.length >= 3 && c.telefono.includes(cleanNum);
        const matchDoc = c.numero_documento && c.numero_documento.toLowerCase().includes(q);
        const matchEmail = c.email && c.email.toLowerCase().includes(q);
        return matchName || matchPhone || matchDoc || matchEmail;
      })
      .slice(0, 8);
  }, [directorioClientes, clienteNombre]);

  const aplicarClienteSeleccionado = (c: {
    id?: string;
    nombre: string;
    telefono: string;
    direccion: string;
    departamento: string;
    municipio: string;
    referencia?: string;
    tipo_documento?: string;
    numero_documento?: string;
    email?: string;
  }) => {
    setClienteNombre(c.nombre);
    setClienteTelefono(c.telefono);
    setClienteDepto(c.departamento);
    setClienteMuni(c.municipio);
    setClienteDireccion(c.direccion);
    setClienteReferencia(c.referencia || '');
    setClienteTipoDoc(c.tipo_documento || 'DUI');
    setClienteNumDoc(c.numero_documento || '');
    setClienteEmail(c.email || '');
    setClienteSeleccionadoId(c.id || null);
    setMostrarSugerenciasCliente(false);
    showToast(`Cliente "${c.nombre}" seleccionado`, 'info');
  };

  const handleSeleccionarCliente = (c: {
    id?: string;
    nombre: string;
    telefono: string;
    direccion: string;
    departamento: string;
    municipio: string;
    referencia?: string;
    tipo_documento?: string;
    numero_documento?: string;
    email?: string;
  }) => {
    aplicarClienteSeleccionado(c);
    setActiveNav('VENTAS');
    setVentasView('nuevo_pedido');
  };

  const handleSeleccionarPerfume = (p: CatalogoItem) => {
    if (p.activo === false) {
      showToast(`La fragancia #${p.codigo} (${p.contratipo}) está inactiva/agotada y no se puede vender.`, 'error');
      return;
    }
    setPerfumeSeleccionado(p);
    setBusquedaPerfume(`${p.codigo} - ${p.contratipo}`);
    setActiveNav('VENTAS');
    setVentasView('nuevo_pedido');
    showToast(`Fragancia #${p.codigo} (${p.contratipo}) seleccionada para nuevo pedido`, 'info');
  };

  const perfumesSugeridos = useMemo(() => {
    if (!busquedaPerfume.trim()) return [];
    const q = busquedaPerfume.toLowerCase();
    return catalogo
      .filter((p) => p.activo !== false)
      .filter((p) => p.codigo.toLowerCase().includes(q) || p.contratipo.toLowerCase().includes(q) || p.marca_inspirada.toLowerCase().includes(q))
      .slice(0, 10);
  }, [catalogo, busquedaPerfume]);

  const handleAgregarItem = () => {
    if (!perfumeSeleccionado) return;
    if (perfumeSeleccionado.activo === false) {
      showToast('Esta fragancia está inactiva/agotada y no se puede vender.', 'error');
      return;
    }
    const precio = (versionSeleccionada === 'Plus' || (versionSeleccionada as any) === 'EXTRA_SHOT')
      ? parseFloat(perfumeSeleccionado.precio_extra_shot?.toString() || '25.00')
      : parseFloat(perfumeSeleccionado.precio_normal?.toString() || '20.00');

    const nuevoItem: PedidoItem = {
      catalogo_id: perfumeSeleccionado.id,
      codigo: perfumeSeleccionado.codigo,
      contratipo: perfumeSeleccionado.contratipo,
      marca: perfumeSeleccionado.marca_inspirada,
      version: versionSeleccionada,
      cantidad: cantidadPerfume,
      precio_unitario: precio,
      subtotal: precio * cantidadPerfume,
      insumo_comprado: false,
    };

    setItemsPedido((prev) => [...prev, nuevoItem]);
    setPerfumeSeleccionado(null);
    setBusquedaPerfume('');
    setCantidadPerfume(1);
    setVersionSeleccionada('Normal');
  };

  const handleEliminarItem = (index: number) => {
    setItemsPedido((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModificarCantidad = (index: number, delta: number) => {
    setItemsPedido((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const nuevaCantidad = Math.max(1, item.cantidad + delta);
        return {
          ...item,
          cantidad: nuevaCantidad,
          subtotal: item.precio_unitario * nuevaCantidad,
        };
      })
    );
  };

  const subtotalPedido = useMemo(() => {
    return itemsPedido.reduce((acc, it) => acc + it.subtotal, 0);
  }, [itemsPedido]);

  const totalPedido = useMemo(() => {
    const sub = subtotalPedido - (parseFloat(descuento.toString()) || 0);
    return Math.max(0, sub) + (parseFloat(costoEnvio.toString()) || 0);
  }, [subtotalPedido, descuento, costoEnvio]);

  const totalPagadoPedido = useMemo(() => {
    return pagosPedido.reduce((acc, p) => acc + (parseFloat(p.monto.toString()) || 0), 0);
  }, [pagosPedido]);

  const totalAnticipoBancos = useMemo(() => {
    return pagosPedido
      .filter((p) => p.forma_pago_id !== '1003')
      .reduce((acc, p) => acc + (parseFloat(p.monto.toString()) || 0), 0);
  }, [pagosPedido]);

  const montoCobroEntrega = useMemo(() => {
    return pagosPedido
      .filter((p) => p.forma_pago_id === '1003')
      .reduce((acc, p) => acc + (parseFloat(p.monto.toString()) || 0), 0);
  }, [pagosPedido]);

  const balancePendiente = useMemo(() => {
    return Math.max(0, totalPedido - totalPagadoPedido);
  }, [totalPedido, totalPagadoPedido]);

  const montoACobrar = useMemo(() => {
    return montoCobroEntrega > 0 ? montoCobroEntrega : (pagoContraEntrega ? balancePendiente : 0);
  }, [montoCobroEntrega, pagoContraEntrega, balancePendiente]);

  const handleAgregarPago = () => {
    const monto = parseFloat(pagoInputMonto);
    if (isNaN(monto) || monto <= 0) {
      showToast('Ingresa un monto válido para el pago ($)', 'error');
      return;
    }
    const forma = formasPago.find((f) => f.id === pagoInputFormaId);
    const nuevoPago: PagoRegistroItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      forma_pago_id: pagoInputFormaId,
      forma_pago_nombre: forma ? forma.nombre : 'Pago',
      forma_pago_tipo: forma?.tipo,
      monto: Math.round(monto * 100) / 100,
      num_documento_auto: pagoInputDoc.trim(),
    };
    setPagosPedido((prev) => [...prev, nuevoPago]);
    setPagoInputMonto('');
    setPagoInputDoc('');
    showToast(`Pago de $${nuevoPago.monto.toFixed(2)} (${nuevoPago.forma_pago_nombre}) agregado`, 'success');
  };

  const handleAgregarPagoDirecto = (
    formaId: string,
    formaNombre: string,
    formaTipo: string | undefined,
    monto: number,
    doc = '',
    obs = ''
  ) => {
    if (monto <= 0) return;
    const nuevoPago: PagoRegistroItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      forma_pago_id: formaId,
      forma_pago_nombre: formaNombre,
      forma_pago_tipo: formaTipo,
      monto: Math.round(monto * 100) / 100,
      num_documento_auto: doc.trim(),
      observaciones: obs,
    };
    setPagosPedido((prev) => [...prev, nuevoPago]);
    showToast(`Asignado $${nuevoPago.monto.toFixed(2)} a ${formaNombre}`, 'success');
  };

  const handleEliminarPago = (index: number) => {
    setPagosPedido((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardarPedido = async () => {
    if (!clienteNombre.trim() || !clienteTelefono.trim() || !clienteDepto || !clienteMuni || !clienteDireccion.trim()) {
      showToast('Por favor completa todos los datos obligatorios del cliente.', 'error');
      return;
    }

    if (itemsPedido.length === 0) {
      showToast('Debes agregar al menos un perfume al pedido.', 'error');
      return;
    }

    try {
      setLoading(true);

      // Resolver lista de pagos a enviar
      let pagosFinales = [...pagosPedido];
      const sumaActual = pagosFinales.reduce((acc, p) => acc + p.monto, 0);
      const saldoRestante = Math.max(0, totalPedido - sumaActual);

      if (pagosFinales.length === 0) {
        // Por defecto registrar el total en Contra Entrega si no se agregaron pagos explícitos
        const contraEntrega = formasPago.find((f) => f.id === '1003') || {
          id: '1003',
          nombre: 'Contra Entrega',
          tipo: 'CONTRA_ENTREGA',
        };
        pagosFinales.push({
          id: `${Date.now()}`,
          forma_pago_id: contraEntrega.id,
          forma_pago_nombre: contraEntrega.nombre,
          forma_pago_tipo: contraEntrega.tipo,
          monto: totalPedido,
          num_documento_auto: '',
          observaciones: 'Pago completo contra entrega',
        });
      } else if (saldoRestante > 0) {
        // Si hay saldo pendiente no asignado, registrarlo en Contra Entrega automáticamente
        const contraEntrega = formasPago.find((f) => f.id === '1003') || {
          id: '1003',
          nombre: 'Contra Entrega',
          tipo: 'CONTRA_ENTREGA',
        };
        pagosFinales.push({
          id: `${Date.now()}`,
          forma_pago_id: contraEntrega.id,
          forma_pago_nombre: contraEntrega.nombre,
          forma_pago_tipo: contraEntrega.tipo,
          monto: saldoRestante,
          num_documento_auto: '',
          observaciones: 'Saldo restante cobro contra entrega',
        });
      }

      const resumenPagosTxt = pagosFinales
        .map(
          (p) =>
            `${p.forma_pago_nombre}: $${p.monto.toFixed(2)}${
              p.num_documento_auto ? ` (Ref: ${p.num_documento_auto})` : ''
            }`
        )
        .join(', ');

      const totalCCE = pagosFinales
        .filter((p) => p.forma_pago_id === '1003')
        .reduce((acc, p) => acc + p.monto, 0);

      const notasConsolidadas = [
        solicitudesEspeciales.trim() ? `Solicitudes: ${solicitudesEspeciales.trim()}` : null,
        contactoAdicional.trim() ? `Contacto Adicional: ${contactoAdicional.trim()}` : null,
        descuento > 0 ? `Descuento: $${descuento}` : null,
        resumenPagosTxt ? `Pagos: [${resumenPagosTxt}]` : null,
        totalCCE > 0 ? `Cobro CCE: $${totalCCE.toFixed(2)}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      const res = await fetch('/api/kode/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            nombre_completo: clienteNombre.trim(),
            telefono_whatsapp: clienteTelefono.trim(),
            departamento: clienteDepto,
            municipio: clienteMuni,
            direccion_entrega: clienteDireccion.trim(),
            punto_referencia: clienteReferencia.trim() || undefined,
            tipo_documento: clienteTipoDoc.trim() || 'DUI',
            numero_documento: clienteNumDoc.trim() || undefined,
            email: clienteEmail.trim() || undefined,
          },
          items: itemsPedido,
          costo_envio: costoEnvio,
          descuento: descuento,
          vendedora_id: vendedoraSeleccionada,
          notas: notasConsolidadas,
          pagos: pagosFinales.map((p) => ({
            forma_pago_id: p.forma_pago_id,
            monto: p.monto,
            num_documento_auto: p.num_documento_auto || '',
            observaciones: p.observaciones || '',
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Pedido ${data.pedido.numero_pedido} registrado con éxito en estado Registrado`, 'success');
        setClienteNombre('');
        setClienteTelefono('');
        setClienteTipoDoc('DUI');
        setClienteNumDoc('');
        setClienteEmail('');
        setClienteDireccion('');
        setClienteReferencia('');
        setContactoAdicional('');
        setClienteSeleccionadoId(null);
        setMostrarSugerenciasCliente(false);
        setItemsPedido([]);
        setSolicitudesEspeciales('');
        setDescuento(0);
        setMontoPagado(0);
        setNumDocumentoAuto('');
        setPagosPedido([]);
        setPagoInputMonto('');
        setPagoInputDoc('');
        fetchPedidos();
        fetchInsumos();
        setActiveNav('VENTAS');
        setVentasView('pedidos');
      } else {
        showToast(data.error || 'Error al registrar pedido', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAbonoPedido) return;
    const monto = parseFloat(abonoMonto.toString());
    if (isNaN(monto) || monto <= 0) {
      showToast('Ingresa un monto válido para el abono ($)', 'error');
      return;
    }
    try {
      setAbonoLoading(true);
      const res = await fetch('/api/kode/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: modalAbonoPedido.id,
          cliente_id: modalAbonoPedido.cliente_id,
          forma_pago_id: abonoFormaPagoId,
          monto,
          fecha_pago: abonoFecha,
          num_documento_auto: abonoNumDoc.trim(),
          observaciones: abonoObservaciones.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Abono registrado con éxito', 'success');
        setModalAbonoPedido(null);
        setAbonoMonto('');
        setAbonoNumDoc('');
        setAbonoObservaciones('');
        await fetchPedidos();
      } else {
        showToast(data.error || 'Error al registrar abono', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAbonoLoading(false);
    }
  };

  const handleEliminarAbono = async (pagoId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este registro de abono bancario?')) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/kode/pagos?id=${pagoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Abono eliminado y saldo actualizado', 'success');
        await fetchPedidos();
      } else {
        showToast(data.error || 'Error al eliminar abono', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarInsumo = async (
    target: { item_id?: string; catalogo_id?: string; version?: string } | string,
    versionFallback?: string
  ) => {
    try {
      setLoading(true);
      const payload: any = {
        comprado_por: vendedoras.find((v) => v.id === vendedoraSeleccionada)?.nombre || 'Bodega KÖDE',
      };

      if (typeof target === 'string') {
        payload.catalogo_id = target;
        payload.version = versionFallback;
      } else {
        if (target.item_id) payload.item_id = target.item_id;
        if (target.catalogo_id) payload.catalogo_id = target.catalogo_id;
        if (target.version) payload.version = target.version;
      }

      const res = await fetch('/api/kode/insumos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Insumo marcado como comprado.', 'success');
        fetchInsumos();
        fetchPedidos();
      } else {
        showToast(data.error || 'Error al marcar insumo', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Asignar Guía C807 Manualmente
  const handleGuardarGuiaC807 = async () => {
    if (!guiaModalPedido || !numGuiaInput.trim()) {
      showToast('Ingrese el número de guía C807', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/kode/guia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: guiaModalPedido.id,
          modo: 'manual',
          c807_guia_numero: numGuiaInput.trim(),
          c807_link_rastreo: linkGuiaInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Guía ${numGuiaInput} asignada.`, 'success');
        setGuiaModalPedido(null);
        setNumGuiaInput('');
        setLinkGuiaInput('');
        fetchPedidos();
      } else {
        showToast(data.error || 'Error al asignar guía', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarMensajeC807 = (p: Pedido) => {
    const link = p.c807_link_rastreo || `https://app.c807.com/tracking?guide=${p.c807_guia_numero || ''}`;
    const mensaje = `Buenas tardes\nSu orden con el número de pedido ${p.numero_pedido} ya se encuentra en camino.\nLe comparto el número de rastreo: ${p.c807_guia_numero || 'Pendiente'}\nPuede rastrearlo en este link: ${link}`;
    navigator.clipboard.writeText(mensaje);
    setCopiedTrackingId(p.id);
    showToast('Mensaje de WhatsApp copiado', 'info');
    setTimeout(() => setCopiedTrackingId(null), 3000);
  };

  const handleAbrirWhatsAppC807 = (p: Pedido) => {
    const link = p.c807_link_rastreo || `https://app.c807.com/tracking?guide=${p.c807_guia_numero || ''}`;
    const mensaje = `Buenas tardes\nSu orden con el número de pedido ${p.numero_pedido} ya se encuentra en camino.\nLe comparto el número de rastreo: ${p.c807_guia_numero || ''}\nPuede rastrearlo en este link: ${link}`;
    const url = `https://wa.me/503${p.cliente_telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const handleRegistrarCompra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCompraConcepto.trim() || nuevaCompraMonto <= 0) {
      showToast('Ingrese un concepto y monto válido', 'error');
      return;
    }

    const nueva: CompraGasto = {
      id: `GASTO-${Date.now().toString().slice(-4)}`,
      fecha_compra: nuevaCompraFecha,
      concepto: nuevaCompraConcepto.trim(),
      monto_total: parseFloat(nuevaCompraMonto.toString()),
      proveedor: nuevaCompraProveedor.trim() || 'Proveedor Local',
      categoria: nuevaCompraCategoria,
      estado_pago: 'PAGADO'
    };

    const actualizadas = [nueva, ...compras];
    guardarComprasLocal(actualizadas);
    setNuevaCompraConcepto('');
    setNuevaCompraMonto(0);
    setNuevaCompraProveedor('');
    showToast('Compra registrada exitosamente', 'success');
  };

  const handleEliminarCompra = (id: string) => {
    const actualizadas = compras.filter((c) => c.id !== id);
    guardarComprasLocal(actualizadas);
    showToast('Compra eliminada', 'info');
  };

  // Generar Guía Directamente con la API de C807 Express
  const handleGenerarGuiaAutomaticaC807 = async () => {
    if (!guiaModalPedido) return;

    try {
      setGenerandoGuia(true);
      const res = await fetch('/api/kode/guia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: guiaModalPedido.id,
          modo: 'automatico',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`🚀 ¡Guía ${data.numero_guia} generada en C807! Pedido en estado Azul.`, 'success');
        setGuiaModalPedido(null);
        setNumGuiaInput('');
        setLinkGuiaInput('');
        fetchPedidos();
      } else {
        showToast(data.error || 'Error al generar guía con C807 Express', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setGenerandoGuia(false);
    }
  };

  // Emitir Factura Electrónica DTE mediante Factura Llama
  const handleEmitirDte = async (pedido: Pedido) => {
    try {
      setEmitiendoDteId(pedido.id);
      const res = await fetch('/api/kode/dte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido_id: pedido.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ DTE emitido: ${data.codigo_generacion.slice(0, 8)}...`, 'success');
        setDteResultModal({ pedido, result: data });
      } else {
        showToast(data.mensaje || data.error || 'Error al emitir DTE', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error de conexión con Factura Llama', 'error');
    } finally {
      setEmitiendoDteId(null);
    }
  };

  // Filtrado de pedidos
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      let matchEstado = filtroEstado === 'TODOS';
      if (!matchEstado) {
        if (filtroEstado === 'Registrado' || filtroEstado === 'PENDIENTE_COMPRA') {
          matchEstado = p.estado === 'Registrado' || p.estado === 'PENDIENTE_COMPRA';
        } else if (filtroEstado === 'Insumos comprados' || filtroEstado === 'PENDIENTE_PREPARAR') {
          matchEstado = p.estado === 'Insumos comprados' || p.estado === 'PENDIENTE_PREPARAR';
        } else if (filtroEstado === 'Preparado') {
          matchEstado = p.estado === 'Preparado';
        } else if (filtroEstado === 'Enviado' || filtroEstado === 'GUIA_CREADA') {
          matchEstado = p.estado === 'Enviado' || p.estado === 'GUIA_CREADA' || p.estado === 'Preparado';
        } else if (filtroEstado === 'Entregado') {
          matchEstado = p.estado === 'Entregado' || p.estado === 'ENTREGADO';
        } else if (filtroEstado === 'Cancelado') {
          matchEstado = p.estado === 'Cancelado' || p.estado === 'CANCELADO';
        } else {
          matchEstado = p.estado === filtroEstado;
        }
      }

      const matchQuery =
        !searchQuery.trim() ||
        p.numero_pedido.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.cliente_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.cliente_telefono.includes(searchQuery) ||
        (p.c807_guia_numero && p.c807_guia_numero.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchEstado && matchQuery;
    });
  }, [pedidos, filtroEstado, searchQuery]);

  const clientesFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return directorioClientes;
    const q = searchQuery.toLowerCase();
    return directorioClientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        (c.municipio && c.municipio.toLowerCase().includes(q)) ||
        (c.departamento && c.departamento.toLowerCase().includes(q)) ||
        (c.numero_documento && c.numero_documento.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [directorioClientes, searchQuery]);

  const catalogoFiltrado = useMemo(() => {
    let list = catalogo;
    if (filtroEstadoCatalogo === 'ACTIVOS') {
      list = list.filter((p) => p.activo !== false);
    } else if (filtroEstadoCatalogo === 'INACTIVOS') {
      list = list.filter((p) => p.activo === false);
    }

    if (filtroGeneroCatalogo !== 'TODOS') {
      list = list.filter((p) => {
        const g = (p.genero || '').toUpperCase();
        if (filtroGeneroCatalogo === 'CABALLERO') return g.includes('CABALLERO') || g.includes('HOMBRE') || g === 'H';
        if (filtroGeneroCatalogo === 'DAMA') return g.includes('DAMA') || g.includes('MUJER') || g === 'F';
        if (filtroGeneroCatalogo === 'UNISEX') return g.includes('UNISEX') || g.includes('MIXTO');
        return true;
      });
    }
    const q = (busquedaCatalogo || searchQuery).toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.contratipo.toLowerCase().includes(q) ||
        p.marca_inspirada.toLowerCase().includes(q) ||
        (p.genero && p.genero.toLowerCase().includes(q))
    );
  }, [catalogo, filtroEstadoCatalogo, filtroGeneroCatalogo, busquedaCatalogo, searchQuery]);

  const conteosCatalogo = useMemo(() => {
    let cab = 0;
    let dam = 0;
    let uni = 0;
    let act = 0;
    let inact = 0;
    catalogo.forEach((p) => {
      if (p.activo !== false) act++;
      else inact++;

      const g = (p.genero || '').toUpperCase();
      if (g.includes('CABALLERO') || g.includes('HOMBRE') || g === 'H') cab++;
      else if (g.includes('DAMA') || g.includes('MUJER') || g === 'F') dam++;
      else if (g.includes('UNISEX') || g.includes('MIXTO')) uni++;
    });
    return {
      todos: catalogo.length,
      caballero: cab,
      dama: dam,
      unisex: uni,
      activos: act,
      inactivos: inact,
    };
  }, [catalogo]);

  const renderGeneroBadge = (generoRaw: string | undefined | null) => {
    const g = (generoRaw || '').toUpperCase();
    if (g.includes('DAMA') || g.includes('MUJER') || g === 'F') {
      return (
        <span className="inline-flex items-center text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-full">
          Dama
        </span>
      );
    }
    if (g.includes('CABALLERO') || g.includes('HOMBRE') || g === 'H') {
      return (
        <span className="inline-flex items-center text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
          Caballero
        </span>
      );
    }
    if (g.includes('UNISEX') || g.includes('MIXTO')) {
      return (
        <span className="inline-flex items-center text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
          Unisex
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
        {generoRaw || '-'}
      </span>
    );
  };

  const handleToggleActivo = async (p: CatalogoItem) => {
    const nuevoEstado = !(p.activo !== false);
    setTogglingActivoId(p.id);
    try {
      const res = await fetch('/api/kode/catalogo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, activo: nuevoEstado }),
      });
      const data = await res.json();
      if (data.success) {
        setCatalogo((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, activo: nuevoEstado } : item))
        );
        showToast(
          `Fragancia #${p.codigo} (${p.contratipo}) marcada como ${nuevoEstado ? 'ACTIVA (Disponible)' : 'INACTIVA (Agotada)'}`,
          nuevoEstado ? 'success' : 'info'
        );
      } else {
        showToast(data.error || 'Error al actualizar estado', 'error');
      }
    } catch (err) {
      console.error('Error toggling activo:', err);
      showToast('Error de red al actualizar estado', 'error');
    } finally {
      setTogglingActivoId(null);
    }
  };

  const handleAbrirEdicionPerfume = (p: CatalogoItem) => {
    setPerfumeEditando(p);
    setFormEdicionPerfume({
      codigo: p.codigo || '',
      contratipo: p.contratipo || '',
      marca_inspirada: p.marca_inspirada || '',
      genero: p.genero || 'Caballero',
      precio_normal: String(p.precio_normal || '20.00'),
      precio_extra_shot: String(p.precio_extra_shot || '25.00'),
      activo: p.activo !== false,
    });
  };

  const handleGuardarEdicionPerfume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfumeEditando) return;
    if (!formEdicionPerfume.codigo.trim() || !formEdicionPerfume.contratipo.trim()) {
      showToast('Código y Contratipo son obligatorios', 'error');
      return;
    }
    setGuardandoEdicionPerfume(true);
    try {
      const res = await fetch('/api/kode/catalogo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: perfumeEditando.id,
          codigo: formEdicionPerfume.codigo,
          contratipo: formEdicionPerfume.contratipo,
          marca_inspirada: formEdicionPerfume.marca_inspirada,
          genero: formEdicionPerfume.genero,
          precio_normal: parseFloat(formEdicionPerfume.precio_normal) || 20.0,
          precio_extra_shot: parseFloat(formEdicionPerfume.precio_extra_shot) || 25.0,
          activo: formEdicionPerfume.activo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCatalogo((prev) =>
          prev.map((item) => (item.id === perfumeEditando.id ? { ...item, ...data.perfume } : item))
        );
        showToast(`Fragancia #${formEdicionPerfume.codigo} actualizada con éxito`, 'success');
        setPerfumeEditando(null);
      } else {
        showToast(data.error || 'Error al guardar cambios de la fragancia', 'error');
      }
    } catch (err) {
      console.error('Error guardando edicion:', err);
      showToast('Error de red al guardar fragancia', 'error');
    } finally {
      setGuardandoEdicionPerfume(false);
    }
  };

  const handleAbrirNuevaFragancia = () => {
    setFormNuevaFragancia({
      codigo: '',
      contratipo: '',
      marca_inspirada: '',
      genero: 'Caballero',
      precio_normal: '20.00',
      precio_extra_shot: '25.00',
      activo: true,
    });
    setModalNuevaFragancia(true);
  };

  const handleGuardarNuevaFragancia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNuevaFragancia.codigo.trim() || !formNuevaFragancia.contratipo.trim()) {
      showToast('Código y Contratipo (nombre) son obligatorios', 'error');
      return;
    }
    setGuardandoNuevaFragancia(true);
    try {
      const res = await fetch('/api/kode/catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: formNuevaFragancia.codigo.trim(),
          contratipo: formNuevaFragancia.contratipo.trim(),
          marca_inspirada: formNuevaFragancia.marca_inspirada.trim(),
          genero: formNuevaFragancia.genero,
          precio_normal: parseFloat(formNuevaFragancia.precio_normal) || 20.0,
          precio_extra_shot: parseFloat(formNuevaFragancia.precio_extra_shot) || 25.0,
          activo: formNuevaFragancia.activo,
        }),
      });
      const data = await res.json();
      if (data.success && data.perfume) {
        setCatalogo((prev) => [data.perfume, ...prev]);
        showToast(`Fragancia #${data.perfume.codigo} (${data.perfume.contratipo}) añadida con éxito`, 'success');
        setModalNuevaFragancia(false);
      } else {
        showToast(data.error || 'Error al añadir la nueva fragancia', 'error');
      }
    } catch (err) {
      console.error('Error guardando nueva fragancia:', err);
      showToast('Error de red al registrar la nueva fragancia', 'error');
    } finally {
      setGuardandoNuevaFragancia(false);
    }
  };

  const pedidosRojos = useMemo(() => {
    return pedidos.filter((p) => p.estado === 'Registrado' || p.estado === 'PENDIENTE_COMPRA');
  }, [pedidos]);

  const pedidosAmarillos = useMemo(() => {
    return pedidos.filter((p) => p.estado === 'Insumos comprados' || p.estado === 'PENDIENTE_PREPARAR');
  }, [pedidos]);

  const insumosSplitPane = useMemo(() => {
    if (!selectedPedidoIdFab) return insumos;
    return insumos.filter((item) => item.pedido_id === selectedPedidoIdFab);
  }, [insumos, selectedPedidoIdFab]);

  const selectedPedidoFab = useMemo(() => {
    if (!selectedPedidoIdFab) return null;
    return pedidosAmarillos.find((p) => p.id === selectedPedidoIdFab) || null;
  }, [pedidosAmarillos, selectedPedidoIdFab]);

  const fraganciasSplitPane = useMemo(() => {
    const list: Array<{
      item_id: string;
      pedido_id: string;
      numero_pedido: string;
      cliente_nombre: string;
      fecha_registro: string;
      codigo: string;
      contratipo: string;
      version: string;
      cantidad: number;
    }> = [];

    pedidosAmarillos.forEach((ped) => {
      if (selectedPedidoIdFab && ped.id !== selectedPedidoIdFab) return;
      (ped.items || []).forEach((it, idx) => {
        list.push({
          item_id: it.id || `${ped.id}-frag-${idx}`,
          pedido_id: ped.id,
          numero_pedido: ped.numero_pedido,
          cliente_nombre: ped.cliente_nombre,
          fecha_registro: ped.created_at,
          codigo: it.codigo,
          contratipo: it.contratipo,
          version: it.version,
          cantidad: it.cantidad,
        });
      });
    });

    return list;
  }, [pedidosAmarillos, selectedPedidoIdFab]);

  // Métricas
  const metricas = useMemo(() => {
    const rojos = pedidos.filter((p) => p.estado === 'Registrado' || p.estado === 'PENDIENTE_COMPRA').length;
    const amarillos = pedidos.filter((p) => p.estado === 'Insumos comprados' || p.estado === 'PENDIENTE_PREPARAR').length;
    const azules = pedidos.filter((p) => p.estado === 'Enviado' || p.estado === 'GUIA_CREADA').length;
    const totalVentas = pedidos.reduce((acc, p) => acc + parseFloat(p.total?.toString() || '0'), 0);
    const totalGastosCompras = compras.reduce((acc, c) => acc + c.monto_total, 0);
    return { rojos, amarillos, azules, total: pedidos.length, totalVentas, totalGastosCompras };
  }, [pedidos, compras]);

  return (
    <div className="min-h-screen bg-[#f1f4f9] text-slate-800 flex font-sans antialiased overflow-x-hidden">
      {/* Toast Notificación */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-indigo-50 border-indigo-300 text-indigo-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. BARRA LATERAL IZQUIERDA (SIDEBAR DE NAVEGACIÓN)             */}
      {/* ============================================================== */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 z-30 sticky top-0 h-screen shadow-sm`}
      >
        <div>
          {/* Logo y Encabezado del Sistema */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-xl shadow-md border border-white/40 shrink-0">
                K
              </div>
              {sidebarOpen && (
                <div className="animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg tracking-tight text-slate-900">KÖDE</span>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                      App
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">kode.aromaniaksv.com</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={sidebarOpen ? 'Colapsar barra lateral' : 'Expandir barra lateral'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Menú de Módulos (Exacto a AppSheet) */}
          <nav className="p-3 space-y-1.5">
            <button
              onClick={() => {
                setActiveNav('VENTAS');
                setVentasView('hub');
                setSearchQuery('');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all text-left ${
                activeNav === 'VENTAS'
                  ? 'clay-btn-primary shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between">
                  <span>VENTAS</span>
                  <span className="text-[10px] font-mono opacity-80">{metricas.total}</span>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveNav('INVENTARIO');
                setSearchQuery('');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all text-left ${
                activeNav === 'INVENTARIO'
                  ? 'clay-btn-primary shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between">
                  <span>INVENTARIO</span>
                  <span className="text-[10px] font-mono opacity-80">{catalogo.length}</span>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveNav('FABRICACION');
                setFabView('hub');
                setSearchQuery('');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all text-left ${
                activeNav === 'FABRICACION'
                  ? 'clay-btn-primary shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FlaskConical className="w-4 h-4 shrink-0" />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between">
                  <span>FABRICACION</span>
                  {(metricas.rojos > 0 || metricas.amarillos > 0) && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold">
                      {metricas.rojos + metricas.amarillos}
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveNav('LOGISTICA');
                setSearchQuery('');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all text-left ${
                activeNav === 'LOGISTICA'
                  ? 'clay-btn-primary shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between">
                  <span>LOGISTICA</span>
                  <span className="text-[10px] font-mono opacity-80">{metricas.azules}</span>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveNav('INTELIGENCIA_NEGOCIOS');
                setBiView('hub');
                setSearchQuery('');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all text-left ${
                activeNav === 'INTELIGENCIA_NEGOCIOS'
                  ? 'clay-btn-primary shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between">
                  <span>INTELIGENCIA DE NEGOCIOS</span>
                </div>
              )}
            </button>
          </nav>
        </div>

        {/* Vendedora / Perfil activo al pie */}
        {sidebarOpen && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 m-2 rounded-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-bold text-slate-500">Vendedora en Turno:</span>
            </div>
            <select
              value={vendedoraSeleccionada}
              onChange={(e) => setVendedoraSeleccionada(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer shadow-sm"
            >
              {vendedoras.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </aside>

      {/* ============================================================== */}
      {/* 2. ÁREA CENTRAL DE CONTENIDO                                   */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* BARRA SUPERIOR (TOPBAR CON BUSCADOR Y ACCIÓN RÁPIDA) */}
        <header className="sticky top-0 z-20 bg-[#f1f4f9]/95 backdrop-blur-md px-6 py-3 border-b border-slate-200/80 flex items-center justify-between gap-4">
          {/* Breadcrumb de navegación */}
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 min-w-max">
            <button
              onClick={() => {
                if (activeNav === 'VENTAS') setVentasView('hub');
                if (activeNav === 'FABRICACION') setFabView('hub');
                if (activeNav === 'INTELIGENCIA_NEGOCIOS') setBiView('hub');
              }}
              className="text-slate-900 hover:text-indigo-600 transition-colors uppercase"
            >
              {activeNav.replace('_', ' ')}
            </button>

            {activeNav === 'VENTAS' && ventasView !== 'hub' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-indigo-600 uppercase">
                  {ventasView === 'nuevo_pedido'
                    ? 'Nuevo Pedido'
                    : ventasView === 'nuevo_cliente'
                    ? 'Nuevo Cliente'
                    : ventasView === 'clientes'
                    ? 'Clientes'
                    : ventasView === 'pedidos'
                    ? 'Listado Pedidos'
                    : 'Catálogo'}
                </span>
              </>
            )}

            {activeNav === 'FABRICACION' && fabView !== 'hub' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-indigo-600 uppercase">
                  {fabView === 'compra_pendiente' ? 'Pedidos Compra Pendiente' : 'Pedidos a Fabricar'}
                </span>
              </>
            )}

            {activeNav === 'INTELIGENCIA_NEGOCIOS' && biView !== 'hub' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-indigo-600 uppercase">
                  {biView === 'compras' ? 'Compras de Insumos' : 'Dashboard'}
                </span>
              </>
            )}
          </div>

          {/* Buscador Centrado */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Buscar en ${activeNav.replace('_', ' ')}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {/* ============================================================== */}
          {/* MÓDULO: VENTAS                                                 */}
          {/* ============================================================== */}
          {activeNav === 'VENTAS' && (
            <div>
              {/* HUB DE TARJETAS HORIZONTALES (IDÉNTICO A APPSHEET) */}
              {ventasView === 'hub' && (
                <div className="space-y-6">
                  <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">VENTAS</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Tarjeta NUEVO CLIENTE */}
                    <div
                      onClick={() => {
                        resetNuevoClienteForm();
                        setVentasView('nuevo_cliente');
                      }}
                      className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">NUEVO CLIENTE</h3>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">VENTAS</span>
                      </div>
                    </div>

                    {/* Tarjeta NUEVO PEDIDO */}
                    <div
                      onClick={() => setVentasView('nuevo_pedido')}
                      className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">NUEVO PEDIDO</h3>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">VENTAS</span>
                      </div>
                    </div>

                    {/* Tarjeta CLIENTES */}
                    <div
                      onClick={() => setVentasView('clientes')}
                      className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">CLIENTES</h3>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">
                          {directorioClientes.length} REGISTRADOS
                        </span>
                      </div>
                    </div>

                    {/* Tarjeta PEDIDOS */}
                    <div
                      onClick={() => setVentasView('pedidos')}
                      className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-inner">
                        <ListOrdered className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">PEDIDOS</h3>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">
                          {metricas.total} PEDIDOS
                        </span>
                      </div>
                    </div>

                    {/* Tarjeta CATALOGO */}
                    <div
                      onClick={() => setVentasView('catalogo')}
                      className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0 shadow-inner">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">CATALOGO</h3>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">
                          {catalogo.length} FRAGANCIAS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA 1E: NUEVO CLIENTE (FORMULARIO PROFESIONAL) */}
              {ventasView === 'nuevo_cliente' && (
                <div className="space-y-4 max-w-3xl mx-auto animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setVentasView('hub')}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      ← Volver a Ventas
                    </button>
                    <span className="text-xs text-slate-500 font-medium">Formulario de Registro de Cliente</span>
                  </div>

                  <div className="clay-card p-6 space-y-6 bg-white border border-slate-200/80 shadow-md">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Registrar Nuevo Cliente</h3>
                        <p className="text-[11px] text-slate-500">
                          Ingresa los datos de contacto y entrega del cliente para despachos y WhatsApp.
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleGuardarNuevoCliente(false);
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Nombre Completo *
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Juan Pérez / Silvia Menjívar"
                            value={ncNombre}
                            onChange={(e) => setNcNombre(e.target.value)}
                            className="clay-input w-full text-xs font-bold"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                            <span>Teléfono WhatsApp *</span>
                            {ncTelefono.length >= 8 && (
                              <a
                                href={`https://wa.me/503${ncTelefono.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Probar chat</span>
                              </a>
                            )}
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. 78901234"
                            value={ncTelefono}
                            onChange={(e) => setNcTelefono(e.target.value)}
                            className="clay-input w-full text-xs font-mono font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span>Tipo de Doc. (Opcional)</span>
                          </label>
                          <select
                            value={ncTipoDoc}
                            onChange={(e) => setNcTipoDoc(e.target.value)}
                            className="clay-input w-full text-xs font-bold cursor-pointer"
                          >
                            <option value="DUI">DUI (El Salvador)</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="Carnet de Residente">Carnet de Residente</option>
                            <option value="Licencia">Licencia de Conducir</option>
                            <option value="NIT">NIT</option>
                            <option value="Otro">Otro Documento</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            N° de Documento (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder={
                              ncTipoDoc === 'DUI'
                                ? 'Ej. 01234567-8'
                                : ncTipoDoc === 'Pasaporte'
                                ? 'Ej. A12345678'
                                : ncTipoDoc === 'NIT' || ncTipoDoc === 'Licencia'
                                ? 'Ej. 0614-010190-001-1'
                                : 'Ej. N° de identificación'
                            }
                            value={ncNumDoc}
                            onChange={(e) => setNcNumDoc(e.target.value)}
                            className="clay-input w-full text-xs font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>Correo Electrónico (Opcional)</span>
                          </label>
                          <input
                            type="email"
                            placeholder="Ej. cliente@correo.com"
                            value={ncEmail}
                            onChange={(e) => setNcEmail(e.target.value)}
                            className="clay-input w-full text-xs font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Departamento *
                          </label>
                          <select
                            value={ncDepto}
                            onChange={(e) => {
                              const depto = e.target.value;
                              setNcDepto(depto);
                              const munis = getMunicipiosByDepto(depto);
                              if (munis.length > 0) setNcMuni(munis[0].nombre_municipio || munis[0].nombre_mh);
                            }}
                            className="clay-input w-full text-xs font-bold cursor-pointer"
                          >
                            <option value="">-- Seleccionar Departamento --</option>
                            {DEPARTAMENTOS_CATALOG.filter((d) => d.id !== '00').map((d) => (
                              <option key={d.id} value={d.nombre}>
                                {d.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Municipio *
                          </label>
                          <select
                            value={ncMuni}
                            onChange={(e) => setNcMuni(e.target.value)}
                            className="clay-input w-full text-xs font-bold cursor-pointer"
                          >
                            <option value="">-- Seleccionar Municipio --</option>
                            {ncMunicipiosDisponibles.map((m: any) => {
                              const nombreMuni = m.nombre_municipio || m.nombre_mh || m.nombre || String(m);
                              return (
                                <option key={m.id_municipio || nombreMuni} value={nombreMuni}>
                                  {nombreMuni}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Dirección Exacta de Entrega *
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Calle, número de casa, colonia, pasaje, residencial..."
                          value={ncDireccion}
                          onChange={(e) => setNcDireccion(e.target.value)}
                          className="clay-input w-full text-xs font-medium resize-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Punto de Referencia (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Frente a Farmacia San Nicolás, portón negro..."
                          value={ncReferencia}
                          onChange={(e) => setNcReferencia(e.target.value)}
                          className="clay-input w-full text-xs font-medium"
                        />
                      </div>

                      <div className="pt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            resetNuevoClienteForm();
                            setVentasView('hub');
                          }}
                          className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
                          disabled={guardandoCliente}
                        >
                          Cancelar
                        </button>

                        <button
                          type="submit"
                          disabled={guardandoCliente}
                          className="clay-btn bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 text-xs font-black shadow-sm"
                        >
                          {guardandoCliente ? 'Guardando...' : 'Guardar Cliente'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGuardarNuevoCliente(true)}
                          disabled={guardandoCliente}
                          className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Guardar y Crear Pedido</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* VISTA 1A: NUEVO PEDIDO / FORMULARIO */}
              {ventasView === 'nuevo_pedido' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setVentasView('hub')}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      ← Volver a Ventas
                    </button>
                    <span className="text-xs text-slate-500 font-medium">Formulario de Pedido WhatsApp</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Datos de Cliente & Perfumes */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="clay-card p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="text-sm font-extrabold text-slate-800">Datos del Cliente</h3>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                resetNuevoClienteForm();
                                setVentasView('nuevo_cliente');
                              }}
                              className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>+ Registrar Cliente</span>
                            </button>
                            {directorioClientes.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setVentasView('clientes')}
                                className="text-xs text-indigo-600 font-bold hover:underline"
                              >
                                Seleccionar ({directorioClientes.length})
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="relative">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Search className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Buscar Cliente / Nombre Completo *</span>
                              </span>
                              {clienteSeleccionadoId && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Cliente Seleccionado</span>
                                </span>
                              )}
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Escribe nombre, teléfono o DUI para buscar..."
                                value={clienteNombre}
                                onFocus={() => setMostrarSugerenciasCliente(true)}
                                onBlur={() => {
                                  setTimeout(() => setMostrarSugerenciasCliente(false), 200);
                                }}
                                onChange={(e) => {
                                  setClienteNombre(e.target.value);
                                  setClienteSeleccionadoId(null);
                                  setMostrarSugerenciasCliente(true);
                                }}
                                className="clay-input w-full text-xs font-bold pr-8"
                                required
                              />
                              {clienteNombre && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClienteNombre('');
                                    setClienteTelefono('');
                                    setClienteDireccion('');
                                    setClienteReferencia('');
                                    setClienteNumDoc('');
                                    setClienteEmail('');
                                    setClienteSeleccionadoId(null);
                                    setMostrarSugerenciasCliente(false);
                                  }}
                                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                                  title="Limpiar datos del cliente"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Dropdown flotante de sugerencias de clientes */}
                            {mostrarSugerenciasCliente && clientesSugeridos.length > 0 && (
                              <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
                                <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 flex items-center justify-between">
                                  <span>CLIENTES COINCIDENTES ({clientesSugeridos.length})</span>
                                  <span className="text-[9px] text-indigo-600 font-semibold">Clic para autocompletar</span>
                                </div>
                                {clientesSugeridos.map((c) => (
                                  <div
                                    key={c.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      aplicarClienteSeleccionado(c);
                                    }}
                                    className="p-2.5 hover:bg-indigo-50/80 cursor-pointer transition-colors space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black text-slate-900">{c.nombre}</span>
                                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                        <Phone className="w-2.5 h-2.5" />
                                        <span>{c.telefono}</span>
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                      {c.municipio && (
                                        <span className="flex items-center gap-0.5 text-slate-600">
                                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                          <span>{c.municipio}, {c.departamento}</span>
                                        </span>
                                      )}
                                      {c.numero_documento && (
                                        <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-bold">
                                          {c.tipo_documento || 'DOC'}: {c.numero_documento}
                                        </span>
                                      )}
                                      {c.email && (
                                        <span className="text-blue-600">
                                          {c.email}
                                        </span>
                                      )}
                                      {c.pedidosCount > 0 && (
                                        <span className="text-slate-400 font-medium">
                                          • {c.pedidosCount} pedido{c.pedidosCount > 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Teléfono WhatsApp *</label>
                            <input
                              type="text"
                              placeholder="Ej. 78901234"
                              value={clienteTelefono}
                              onChange={(e) => setClienteTelefono(e.target.value)}
                              className="clay-input w-full text-xs font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Departamento *</label>
                            <select
                              value={clienteDepto}
                              onChange={(e) => {
                                setClienteDepto(e.target.value);
                                setClienteMuni('');
                              }}
                              className="clay-input w-full text-xs font-bold cursor-pointer"
                            >
                              <option value="">-- Seleccionar --</option>
                              {DEPARTAMENTOS_CATALOG.filter((d) => d.id !== '00').map((d) => (
                                <option key={d.id} value={d.nombre}>
                                  {d.nombre}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Municipio / Distrito *</label>
                            <select
                              value={clienteMuni}
                              onChange={(e) => setClienteMuni(e.target.value)}
                              disabled={!clienteDepto}
                              className="clay-input w-full text-xs font-bold cursor-pointer disabled:opacity-50"
                            >
                              <option value="">-- Seleccionar Municipio --</option>
                              {municipiosDisponibles.map((m: any) => (
                                <option key={m.id_municipio || m.id} value={m.nombre_municipio || m.nombre}>
                                  {m.nombre_municipio || m.nombre}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Dirección Exacta de Entrega *</label>
                            <textarea
                              rows={2}
                              placeholder="Colonia, calle, pasaje, número de casa..."
                              value={clienteDireccion}
                              onChange={(e) => setClienteDireccion(e.target.value)}
                              className="clay-input w-full text-xs font-medium resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Punto de Referencia</label>
                            <input
                              type="text"
                              placeholder="Frente a parque, portón negro..."
                              value={clienteReferencia}
                              onChange={(e) => setClienteReferencia(e.target.value)}
                              className="clay-input w-full text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Contacto Adicional</label>
                            <input
                              type="text"
                              placeholder="Familiar, segundo teléfono..."
                              value={contactoAdicional}
                              onChange={(e) => setContactoAdicional(e.target.value)}
                              className="clay-input w-full text-xs font-medium"
                            />
                          </div>

                          <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                                  <CreditCard className="w-3 h-3 text-slate-400" />
                                  <span>Tipo Doc. (Opcional)</span>
                                </label>
                                <select
                                  value={clienteTipoDoc}
                                  onChange={(e) => setClienteTipoDoc(e.target.value)}
                                  className="clay-input w-full text-xs font-bold cursor-pointer"
                                >
                                  <option value="DUI">DUI (El Salvador)</option>
                                  <option value="Pasaporte">Pasaporte</option>
                                  <option value="Carnet de Residente">Carnet de Residente</option>
                                  <option value="Licencia">Licencia</option>
                                  <option value="NIT">NIT</option>
                                  <option value="Otro">Otro</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  N° Documento (Opcional)
                                </label>
                                <input
                                  type="text"
                                  placeholder={clienteTipoDoc === 'DUI' ? 'Ej. 01234567-8' : 'N° identificación'}
                                  value={clienteNumDoc}
                                  onChange={(e) => setClienteNumDoc(e.target.value)}
                                  className="clay-input w-full text-xs font-mono font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>Correo (Opcional)</span>
                                </label>
                                <input
                                  type="email"
                                  placeholder="Ej. cliente@correo.com"
                                  value={clienteEmail}
                                  onChange={(e) => setClienteEmail(e.target.value)}
                                  className="clay-input w-full text-xs font-medium"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Perfumes */}
                      <div className="clay-card p-6 space-y-4">
                        <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3">
                          Detalle Pedido (Fragancias)
                        </h3>

                        <div className="relative">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Buscar Fragancia por Código o Contratipo
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Ej. 100, Sauvage, Aventus, 1 Million..."
                              value={busquedaPerfume}
                              onChange={(e) => {
                                setBusquedaPerfume(e.target.value);
                                if (perfumeSeleccionado && e.target.value !== perfumeSeleccionado.contratipo) {
                                  setPerfumeSeleccionado(null);
                                }
                              }}
                              className="clay-input has-icon w-full text-xs font-bold"
                            />
                          </div>

                          {perfumesSugeridos.length > 0 && !perfumeSeleccionado && (
                            <div className="absolute z-20 w-full mt-1.5 clay-card p-2 max-h-56 overflow-y-auto divide-y divide-slate-100 shadow-2xl">
                              {perfumesSugeridos.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setPerfumeSeleccionado(p);
                                    setBusquedaPerfume(`${p.codigo} - ${p.contratipo}`);
                                  }}
                                  className="p-2.5 hover:bg-indigo-50/70 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                                >
                                  <div>
                                    <span className="clay-badge text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 mr-2">
                                      #{p.codigo}
                                    </span>
                                    <span className="text-xs font-extrabold text-slate-900">{p.contratipo}</span>
                                    <span className="text-[11px] text-slate-500 block">
                                      {p.marca_inspirada} ({p.genero})
                                    </span>
                                  </div>
                                  <span className="text-emerald-700 font-black font-mono text-xs">${p.precio_normal}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {perfumeSeleccionado && (
                          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="clay-badge text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                                  #{perfumeSeleccionado.codigo}
                                </span>
                                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                  {perfumeSeleccionado.contratipo}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 font-medium">
                                {perfumeSeleccionado.marca_inspirada}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex rounded-xl bg-slate-200/80 p-0.5 border border-slate-300/80">
                                <button
                                  type="button"
                                  onClick={() => setVersionSeleccionada('Normal')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    versionSeleccionada === 'Normal' || (versionSeleccionada as any) === 'NORMAL'
                                      ? 'bg-white text-indigo-700 shadow-sm'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Normal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVersionSeleccionada('Plus')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    versionSeleccionada === 'Plus' || (versionSeleccionada as any) === 'EXTRA_SHOT'
                                      ? 'bg-purple-600 text-white shadow-sm'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Plus
                                </button>
                              </div>

                              <input
                                type="number"
                                min="1"
                                max="50"
                                value={cantidadPerfume}
                                onChange={(e) => setCantidadPerfume(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-14 clay-input text-xs text-center font-mono font-bold py-1 px-1"
                              />

                              <button
                                type="button"
                                onClick={handleAgregarItem}
                                className="clay-btn clay-btn-primary px-4 py-2 text-xs font-extrabold"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Agregar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resumen de Pedido y Pagos */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="clay-card p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="text-sm font-extrabold text-slate-800">
                            Fragancias Agregadas ({itemsPedido.length})
                          </h3>
                          {itemsPedido.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setItemsPedido([])}
                              className="text-xs font-bold text-rose-500 hover:underline"
                            >
                              Vaciar
                            </button>
                          )}
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {itemsPedido.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs font-medium border-2 border-dashed border-slate-200 rounded-2xl">
                              No hay fragancias agregadas
                            </div>
                          ) : (
                            itemsPedido.map((it, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-sm text-xs"
                              >
                                <div>
                                  <span className="font-extrabold text-slate-900">{it.contratipo}</span>
                                  <div className="text-slate-500 text-[11px]">
                                    {(it.version === 'Plus' || (it.version as any) === 'EXTRA_SHOT') ? 'PLUS' : 'NORMAL'} • {it.cantidad} x ${it.precio_unitario}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-indigo-700">${it.subtotal.toFixed(2)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarItem(idx)}
                                    className="text-slate-400 hover:text-rose-500 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Pagos, Descuentos & Totales */}
                        <div className="border-t border-slate-100 pt-3 space-y-3">
                          {/* Totales y Descuentos */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Sub Total ($)</label>
                              <div className="clay-input w-full text-xs font-mono font-bold bg-slate-100">
                                ${subtotalPedido.toFixed(2)}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Descuento ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={descuento}
                                onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                                className="clay-input w-full text-xs font-mono font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Costo Envío ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={costoEnvio}
                                onChange={(e) => setCostoEnvio(parseFloat(e.target.value) || 0)}
                                className="clay-input w-full text-xs font-mono font-bold"
                              />
                            </div>
                          </div>

                          {/* MÓDULO DE FORMAS DE PAGO / ABONOS (SOPORTE MIXTO Y REGISTRO EN public.pagos) */}
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-extrabold text-slate-800">
                                  Formas de Pago / Abonos
                                </span>
                              </div>
                              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                                Pagos Mixtos
                              </span>
                            </div>

                            {/* Formulario para agregar una forma de pago */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2.5 shadow-sm">
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                {/* Selector de Forma de Pago */}
                                <div className="sm:col-span-5">
                                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                                    Forma de Pago / Cuenta *
                                  </label>
                                  <select
                                    value={pagoInputFormaId}
                                    onChange={(e) => setPagoInputFormaId(e.target.value)}
                                    className="clay-input w-full text-xs font-bold bg-white cursor-pointer"
                                  >
                                    {formasPago.map((fp) => (
                                      <option key={fp.id} value={fp.id}>
                                        {fp.nombre} ({fp.tipo})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Monto */}
                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                                    Monto ($) *
                                  </label>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder={balancePendiente > 0 ? balancePendiente.toFixed(2) : "0.00"}
                                    value={pagoInputMonto}
                                    onChange={(e) => setPagoInputMonto(e.target.value)}
                                    className="clay-input w-full text-xs font-mono font-bold"
                                  />
                                </div>

                                {/* No. Documento / Comprobante */}
                                <div className="sm:col-span-4">
                                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                                    No. Voucher / Ref
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Ej. TRF-12345"
                                    value={pagoInputDoc}
                                    onChange={(e) => setPagoInputDoc(e.target.value)}
                                    className="clay-input w-full text-xs font-mono font-medium"
                                  />
                                </div>
                              </div>

                              {/* Acciones y sugerencias */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {balancePendiente > 0 && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const contraEntrega = formasPago.find(f => f.id === '1003') || { id: '1003', nombre: 'Contra Entrega', tipo: 'CONTRA_ENTREGA' };
                                          handleAgregarPagoDirecto(contraEntrega.id, contraEntrega.nombre, contraEntrega.tipo, balancePendiente, '', 'Cobro contra entrega C807');
                                        }}
                                        className="text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                                        title="Asignar el saldo restante a cobrar en entrega"
                                      >
                                        ⚡ Saldar resto (${balancePendiente.toFixed(2)}) en Contra Entrega
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPagoInputMonto(balancePendiente.toFixed(2))}
                                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800 underline px-1"
                                      >
                                        Usar saldo (${balancePendiente.toFixed(2)})
                                      </button>
                                    </>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={handleAgregarPago}
                                  className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 ml-auto"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Agregar Pago
                                </button>
                              </div>
                            </div>

                            {/* Listado / Tabla de Pagos Agregados */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                                <span>Pagos registrados para este pedido ({pagosPedido.length}):</span>
                              </div>

                              {pagosPedido.length === 0 ? (
                                <div className="p-3 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-1.5">
                                  <p className="font-semibold text-slate-700">No has registrado formas de pago aún.</p>
                                  <p className="text-[11px] text-slate-500">
                                    Puedes registrar pagos mixtos (ej. $10 en transferencia Cuscatlán y $15 en contra entrega).
                                  </p>
                                  <div className="flex justify-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const contraEntrega = formasPago.find(f => f.id === '1003') || { id: '1003', nombre: 'Contra Entrega', tipo: 'CONTRA_ENTREGA' };
                                        handleAgregarPagoDirecto(contraEntrega.id, contraEntrega.nombre, contraEntrega.tipo, totalPedido, '', 'Cobro completo contra entrega');
                                      }}
                                      className="text-xs font-bold text-indigo-600 hover:underline"
                                    >
                                      📦 Registrar 100% Contra Entrega (${totalPedido.toFixed(2)})
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                      <tr>
                                        <th className="py-2 px-3">Forma de Pago</th>
                                        <th className="py-2 px-3">Monto</th>
                                        <th className="py-2 px-3">Comprobante / Ref</th>
                                        <th className="py-2 px-3 text-center">Quitar</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {pagosPedido.map((pago, idx) => (
                                        <tr key={pago.id || idx} className="hover:bg-slate-50/50">
                                          <td className="py-2 px-3 font-bold text-slate-800">
                                            <div className="flex items-center gap-1.5">
                                              {pago.forma_pago_id === '1003' ? (
                                                <span className="text-amber-600">📦</span>
                                              ) : (
                                                <span className="text-indigo-600">🏦</span>
                                              )}
                                              <span>{pago.forma_pago_nombre}</span>
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                            ${pago.monto.toFixed(2)}
                                          </td>
                                          <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                                            {pago.num_documento_auto || '-'}
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <button
                                              type="button"
                                              onClick={() => handleEliminarPago(idx)}
                                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                              title="Eliminar este pago"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                            {/* Resumen Financiero en vivo */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs shadow-sm">
                              <div className="flex justify-between font-bold text-slate-700">
                                <span>Total del Pedido:</span>
                                <span className="font-mono text-indigo-700 text-sm font-black">${totalPedido.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Total Pagos Asignados:</span>
                                <span className="font-mono font-bold text-emerald-600">${totalPagadoPedido.toFixed(2)}</span>
                              </div>
                              {totalAnticipoBancos > 0 && (
                                <div className="flex justify-between text-slate-500 text-[11px]">
                                  <span>↳ Anticipo Transferencia/Bancos/Efectivo:</span>
                                  <span className="font-mono font-semibold text-slate-700">${totalAnticipoBancos.toFixed(2)}</span>
                                </div>
                              )}
                              {montoCobroEntrega > 0 && (
                                <div className="flex justify-between text-amber-700 text-[11px] font-bold">
                                  <span>↳ Cobro Contra Entrega (C807):</span>
                                  <span className="font-mono font-bold">${montoCobroEntrega.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold pt-1.5 border-t border-slate-100">
                                <span>Saldo por asignar:</span>
                                <span className={`font-mono font-black ${balancePendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  ${balancePendiente.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones</label>
                            <input
                              type="text"
                              placeholder="Observaciones de entrega..."
                              value={solicitudesEspeciales}
                              onChange={(e) => setSolicitudesEspeciales(e.target.value)}
                              className="clay-input w-full text-xs font-medium"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleGuardarPedido}
                            disabled={loading || itemsPedido.length === 0}
                            className="clay-btn clay-btn-success w-full py-3 text-xs font-black shadow-lg"
                          >
                            <Send className="w-4 h-4" />
                            Guardar Pedido
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA 1B: LISTADO DE PEDIDOS (TABLA EXACTA A APPSHEET) */}
              {ventasView === 'pedidos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setVentasView('hub')}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      ← Volver a Ventas
                    </button>

                    <div className="flex gap-1.5 text-xs">
                      {['TODOS', 'PENDIENTE_COMPRA', 'PENDIENTE_PREPARAR', 'GUIA_CREADA'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setFiltroEstado(st)}
                          className={`px-3 py-1 rounded-xl font-bold transition-all ${
                            filtroEstado === st
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {st === 'TODOS'
                            ? 'Todos'
                            : st === 'PENDIENTE_COMPRA'
                            ? '🔴 Rojo'
                            : st === 'PENDIENTE_PREPARAR'
                            ? '🟡 Amarillo'
                            : '🔵 Azul'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-4">Estado envío</th>
                            <th className="py-2.5 px-4">Estado Pago</th>
                            <th className="py-2.5 px-4">Estado C807</th>
                            <th className="py-2.5 px-4">Numero de Pedido</th>
                            <th className="py-2.5 px-4">Cliente</th>
                            <th className="py-2.5 px-4">Teléfono</th>
                            <th className="py-2.5 px-4">Fecha Pedido</th>
                            <th className="py-2.5 px-4 text-right">Total</th>
                            <th className="py-2.5 px-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {pedidosFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                                No se encontraron pedidos
                              </td>
                            </tr>
                          ) : (
                            pedidosFiltrados.map((p) => {
                              const isExpanded = expandedPedidoId === p.id;
                              const totalNum = parseFloat(p.total?.toString() || '0');
                              const totalPagadoNum = parseFloat(p.total_pagado?.toString() || '0');
                              const saldoPendiente = Math.max(0, totalNum - totalPagadoNum);
                              return (
                                <React.Fragment key={p.id}>
                                  <tr className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-3 px-4">
                                      {(p.estado === 'Registrado' || p.estado === 'PENDIENTE_COMPRA') && (
                                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                          🔴 Pendiente Compra
                                        </span>
                                      )}
                                      {(p.estado === 'Insumos comprados' || p.estado === 'PENDIENTE_PREPARAR') && (
                                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                          🟡 Listo Fabricar
                                        </span>
                                      )}
                                      {(p.estado === 'Preparado' || p.estado === 'Enviado' || p.estado === 'GUIA_CREADA') && (
                                        <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full">
                                          🔵 {p.c807_guia_numero ? 'Guía C807' : 'Preparado'}
                                        </span>
                                      )}
                                      {(p.estado === 'Entregado' || p.estado === 'ENTREGADO') && (
                                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                          🟢 Entregado
                                        </span>
                                      )}
                                      {(p.estado === 'Cancelado' || p.estado === 'CANCELADO') && (
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300 px-2.5 py-0.5 rounded-full">
                                          ⚪ Cancelado
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4">
                                      {p.estado_pago === 'PAGADO' ? (
                                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                          ✓ Pagado
                                        </span>
                                      ) : p.estado_pago === 'PARCIAL' ? (
                                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full" title={`Abonado: $${totalPagadoNum.toFixed(2)}`}>
                                          ⏳ Parcial (${totalPagadoNum.toFixed(2)})
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                          ✕ Pendiente
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-slate-600 font-medium">
                                      {p.c807_estado || (p.c807_guia_numero ? 'En ruta C807' : 'Pendiente guía')}
                                    </td>
                                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                                      {p.numero_pedido}
                                    </td>
                                    <td className={`py-3 px-4 ${getClienteColorPorEstado(p.estado)}`}>
                                      {p.cliente_nombre}
                                    </td>
                                    <td className="py-3 px-4 font-mono">
                                      <a
                                        href={`https://wa.me/503${p.cliente_telefono}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-700 hover:underline font-bold"
                                      >
                                        {p.cliente_telefono}
                                      </a>
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 font-mono">
                                      {new Date(p.created_at).toLocaleDateString('es-SV')}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <div className="font-mono font-black text-slate-900">
                                        ${totalNum.toFixed(2)}
                                      </div>
                                      {totalPagadoNum > 0 && p.estado_pago !== 'PAGADO' && (
                                        <div className="text-[10px] font-mono font-bold text-amber-700">
                                          Resta: ${saldoPendiente.toFixed(2)}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <button
                                        onClick={() => setExpandedPedidoId(isExpanded ? null : p.id)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
                                      >
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      </button>
                                    </td>
                                  </tr>
                                  {isExpanded && (
                                    <tr className="bg-slate-50/50">
                                      <td colSpan={9} className="p-4 border-t border-slate-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                                            <span className="font-bold text-slate-700 block mb-1">Destino:</span>
                                            <p className="text-slate-900">{p.cliente_direccion}</p>
                                            <p className="text-slate-500">{p.cliente_municipio}, {p.cliente_departamento}</p>
                                            {p.cliente_referencia && <p className="text-indigo-600 font-bold mt-1">Ref: {p.cliente_referencia}</p>}
                                            {p.notas && <p className="text-slate-500 text-[11px] mt-2 pt-2 border-t border-slate-100 italic">Notas: {p.notas}</p>}
                                          </div>
                                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                                            <span className="font-bold text-slate-700 block mb-1">Fragancias ({p.items.length}):</span>
                                            {p.items.map((it, i) => (
                                              <div key={i} className="flex justify-between py-0.5 border-b border-slate-50 last:border-0">
                                                <span>#{it.codigo} - {it.contratipo} ({it.version === 'Plus' || (it.version as any) === 'EXTRA_SHOT' ? 'Plus' : 'Normal'})</span>
                                                <span className="font-mono font-bold">${it.subtotal}</span>
                                              </div>
                                            ))}
                                          </div>

                                          {/* MÓDULO DE CONTROL FINANCIERO Y ABONOS BANCARIOS */}
                                          <div className="bg-white p-4 rounded-xl border border-slate-200 col-span-1 md:col-span-2 space-y-3 shadow-sm">
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                              <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-indigo-600" />
                                                <span className="font-extrabold text-slate-800">
                                                  Control de Pagos & Abonos Bancarios
                                                </span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setModalAbonoPedido(p);
                                                  setAbonoMonto(saldoPendiente > 0 ? saldoPendiente.toFixed(2) : '');
                                                  setAbonoFormaPagoId(formasPago[0]?.id || '1001');
                                                  setAbonoNumDoc('');
                                                  setAbonoObservaciones('');
                                                }}
                                                className="clay-btn clay-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-sm"
                                              >
                                                <Plus className="w-3.5 h-3.5" />
                                                Registrar Abono / Pago
                                              </button>
                                            </div>

                                            {/* Métricas del pedido */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                                              <div>
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Pedido</span>
                                                <span className="font-mono font-black text-slate-800 text-sm">
                                                  ${totalNum.toFixed(2)}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Abonado</span>
                                                <span className="font-mono font-black text-emerald-600 text-sm">
                                                  ${totalPagadoNum.toFixed(2)}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Saldo Pendiente</span>
                                                <span className={`font-mono font-black text-sm ${saldoPendiente > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                                  ${saldoPendiente.toFixed(2)}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Cobro C807 (CCE)</span>
                                                <span className="font-mono font-black text-indigo-700 text-sm">
                                                  ${parseFloat(p.monto_cobrar_cce?.toString() || '0').toFixed(2)}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Historial de Abonos */}
                                            <div className="space-y-1.5">
                                              <span className="text-[11px] font-bold text-slate-600 block">
                                                Historial de Transacciones / Abonos:
                                              </span>
                                              {(!p.pagos || p.pagos.length === 0) ? (
                                                <div className="text-center py-3 text-slate-400 text-xs bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                                                  No hay abonos registrados para este pedido. Usa el botón "Registrar Abono / Pago" para agregar uno.
                                                </div>
                                              ) : (
                                                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                                                  {p.pagos.map((pg) => (
                                                    <div key={pg.id} className="p-2.5 bg-white flex flex-wrap items-center justify-between gap-2 text-xs hover:bg-slate-50/50 transition-colors">
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="clay-badge text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                                                          {pg.fecha_pago}
                                                        </span>
                                                        <span className="font-bold text-slate-800">
                                                          {pg.forma_pago_nombre || 'Pago'}
                                                        </span>
                                                        {pg.num_documento_auto && (
                                                          <span className="font-mono text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-bold">
                                                            Doc: {pg.num_documento_auto}
                                                          </span>
                                                        )}
                                                        {pg.usuario && (
                                                          <span className="text-slate-400 text-[10px]">por {pg.usuario}</span>
                                                        )}
                                                        {pg.observaciones && (
                                                          <span className="text-slate-500 text-[11px] italic">({pg.observaciones})</span>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center gap-3">
                                                        <span className="font-mono font-black text-emerald-700 text-sm">
                                                          +${parseFloat(pg.monto?.toString() || '0').toFixed(2)}
                                                        </span>
                                                        <button
                                                          type="button"
                                                          onClick={() => handleEliminarAbono(pg.id)}
                                                          title="Eliminar este abono"
                                                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                                                        >
                                                          <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA 1C: CLIENTES (TABLA EXACTA A APPSHEET CON 📞 Y 💬) */}
              {ventasView === 'clientes' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setVentasView('hub')}
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        ← Volver a Ventas
                      </button>
                      <span className="text-xs text-slate-400">|</span>
                      <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                        Directorio de Clientes ({directorioClientes.length})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        resetNuevoClienteForm();
                        setVentasView('nuevo_cliente');
                      }}
                      className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-200"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Nuevo Cliente</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-4">Nombre completo</th>
                            <th className="py-2.5 px-4">Direccion</th>
                            <th className="py-2.5 px-4">Punto de Referencia</th>
                            <th className="py-2.5 px-4">Contacto Adicional</th>
                            <th className="py-2.5 px-4 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {clientesFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                                No se encontraron clientes
                              </td>
                            </tr>
                          ) : (
                            clientesFiltrados.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                      <span className="font-extrabold text-slate-900">{c.nombre}</span>
                                      {/* Botones inline 📞 y 💬 exactos a AppSheet */}
                                      <div className="flex items-center gap-1">
                                        <a
                                          href={`tel:503${c.telefono}`}
                                          className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors"
                                          title={`Llamar a ${c.nombre}`}
                                        >
                                          <Phone className="w-3.5 h-3.5" />
                                        </a>
                                        <a
                                          href={`https://wa.me/503${c.telefono}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                          title={`Enviar WhatsApp a ${c.nombre}`}
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    </div>
                                    {(c.numero_documento || c.email) && (
                                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                        {c.numero_documento && (
                                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200/80">
                                            <CreditCard className="w-2.5 h-2.5 text-slate-400" />
                                            <span>{c.tipo_documento || 'DOC'}: {c.numero_documento}</span>
                                          </span>
                                        )}
                                        {c.email && (
                                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
                                            <Mail className="w-2.5 h-2.5 text-blue-500" />
                                            <span>{c.email}</span>
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                                  {c.direccion}, {c.municipio}
                                </td>
                                <td className="py-3 px-4 text-slate-500">{c.referencia || '-'}</td>
                                <td className="py-3 px-4 text-slate-500 font-mono">{c.telefono}</td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={() => handleSeleccionarCliente(c)}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                                  >
                                    + Pedido
                                  </button>
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

              {/* VISTA 1D: CATALOGO */}
              {ventasView === 'catalogo' && (
                <div className="space-y-4">
                  {/* Barra Superior de Navegación e Info */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setVentasView('hub')}
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        ← Volver a Ventas
                      </button>
                      <span className="text-xs text-slate-400">|</span>
                      <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">
                        Catálogo de Fragancias KÖDE
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-slate-500 font-semibold font-mono bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                        {catalogoFiltrado.length} {catalogoFiltrado.length === 1 ? 'fragancia' : 'fragancias'} {filtroGeneroCatalogo !== 'TODOS' ? `(${filtroGeneroCatalogo.toLowerCase()})` : ''} {filtroEstadoCatalogo !== 'TODOS' ? `• ${filtroEstadoCatalogo.toLowerCase()}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={handleAbrirNuevaFragancia}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Añadir Fragancia</span>
                      </button>
                    </div>
                  </div>

                  {/* Barra de Filtros de Género, Estado y Buscador Rápido */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    {/* Filtros de Género y Disponibilidad */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Géneros */}
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFiltroGeneroCatalogo('TODOS')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            filtroGeneroCatalogo === 'TODOS'
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                          }`}
                        >
                          Todos ({conteosCatalogo.todos})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroGeneroCatalogo('CABALLERO')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            filtroGeneroCatalogo === 'CABALLERO'
                              ? 'bg-sky-700 text-white shadow-xs'
                              : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/60'
                          }`}
                        >
                          Caballero ({conteosCatalogo.caballero})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroGeneroCatalogo('DAMA')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            filtroGeneroCatalogo === 'DAMA'
                              ? 'bg-pink-700 text-white shadow-xs'
                              : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200/60'
                          }`}
                        >
                          Dama ({conteosCatalogo.dama})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroGeneroCatalogo('UNISEX')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            filtroGeneroCatalogo === 'UNISEX'
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60'
                          }`}
                        >
                          Unisex ({conteosCatalogo.unisex})
                        </button>
                      </div>

                      <span className="hidden sm:inline-block text-slate-300">|</span>

                      {/* Disponibilidad / Estado */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFiltroEstadoCatalogo('TODOS')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            filtroEstadoCatalogo === 'TODOS'
                              ? 'bg-slate-800 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 bg-slate-100/80'
                          }`}
                        >
                          Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroEstadoCatalogo('ACTIVOS')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                            filtroEstadoCatalogo === 'ACTIVOS'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Activas ({conteosCatalogo.activos})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroEstadoCatalogo('INACTIVOS')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                            filtroEstadoCatalogo === 'INACTIVOS'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Agotadas ({conteosCatalogo.inactivos})
                        </button>
                      </div>
                    </div>

                    {/* Buscador Rápido Local */}
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={busquedaCatalogo}
                        onChange={(e) => setBusquedaCatalogo(e.target.value)}
                        placeholder="Buscar por código, contratipo, marca..."
                        className="w-full pl-9 pr-8 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                      {busquedaCatalogo && (
                        <button
                          type="button"
                          onClick={() => setBusquedaCatalogo('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          title="Limpiar búsqueda"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabla Administrativa Limpia */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto max-h-[720px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider z-10">
                          <tr>
                            <th className="py-3 px-4">Kodigo</th>
                            <th className="py-3 px-4">Contratipo</th>
                            <th className="py-3 px-4">Marca Inspirada</th>
                            <th className="py-3 px-4">Género</th>
                            <th className="py-3 px-4">Estado</th>
                            <th className="py-3 px-4 text-right">Precio Normal</th>
                            <th className="py-3 px-4 text-right">Precio Extra Shot</th>
                            <th className="py-3 px-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {catalogoFiltrado.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                No se encontraron fragancias con los criterios seleccionados.
                              </td>
                            </tr>
                          ) : (
                            catalogoFiltrado.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4">
                                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded text-[11px]">
                                    #{p.codigo}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-extrabold text-slate-900">{p.contratipo}</td>
                                <td className="py-3 px-4 text-slate-600 font-medium">{p.marca_inspirada}</td>
                                <td className="py-3 px-4">{renderGeneroBadge(p.genero)}</td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    disabled={togglingActivoId === p.id}
                                    onClick={() => handleToggleActivo(p)}
                                    title={p.activo !== false ? 'Clic para desactivar (marcar agotada)' : 'Clic para activar (disponible para venta)'}
                                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-2xs ${
                                      p.activo !== false
                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        p.activo !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                      }`}
                                    />
                                    <span>
                                      {togglingActivoId === p.id ? '...' : p.activo !== false ? 'Activa' : 'Inactiva'}
                                    </span>
                                  </button>
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                                  ${parseFloat(p.precio_normal?.toString() || '20').toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                                  ${parseFloat(p.precio_extra_shot?.toString() || '25').toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleAbrirEdicionPerfume(p)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200 shadow-2xs cursor-pointer inline-flex items-center gap-1"
                                      title={`Editar fragancia #${p.codigo} ${p.contratipo}`}
                                    >
                                      <Pencil className="w-3 h-3 text-slate-500" />
                                      <span>Editar</span>
                                    </button>

                                    {p.activo !== false ? (
                                      <button
                                        type="button"
                                        onClick={() => handleSeleccionarPerfume(p)}
                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                                        title={`Crear pedido con #${p.codigo} ${p.contratipo}`}
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Pedido</span>
                                      </button>
                                    ) : (
                                      <span
                                        className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold border border-slate-200 select-none cursor-not-allowed"
                                        title="Fragancia inactiva / agotada. Actívala para poder venderla."
                                      >
                                        Agotada
                                      </span>
                                    )}
                                  </div>
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
            </div>
          )}

          {/* ============================================================== */}
          {/* MÓDULO: INVENTARIO                                             */}
          {/* ============================================================== */}
          {activeNav === 'INVENTARIO' && (
            <div className="space-y-4">
              {/* Barra Superior de Título e Info */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">
                    INVENTARIO / CATÁLOGO GENERAL
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Listado completo de fragancias, tarifas y control de disponibilidad para venta
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-500 font-semibold font-mono bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                    {catalogoFiltrado.length} {catalogoFiltrado.length === 1 ? 'fragancia' : 'fragancias disponibles'} {filtroEstadoCatalogo !== 'TODOS' ? `• ${filtroEstadoCatalogo.toLowerCase()}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleAbrirNuevaFragancia}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir Fragancia</span>
                  </button>
                </div>
              </div>

              {/* Barra de Filtros de Género, Estado y Buscador Rápido */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                {/* Filtros de Género y Disponibilidad */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Géneros */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFiltroGeneroCatalogo('TODOS')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filtroGeneroCatalogo === 'TODOS'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      Todos ({conteosCatalogo.todos})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroGeneroCatalogo('CABALLERO')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filtroGeneroCatalogo === 'CABALLERO'
                          ? 'bg-sky-700 text-white shadow-xs'
                          : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/60'
                      }`}
                    >
                      Caballero ({conteosCatalogo.caballero})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroGeneroCatalogo('DAMA')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filtroGeneroCatalogo === 'DAMA'
                          ? 'bg-pink-700 text-white shadow-xs'
                          : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200/60'
                      }`}
                    >
                      Dama ({conteosCatalogo.dama})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroGeneroCatalogo('UNISEX')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filtroGeneroCatalogo === 'UNISEX'
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60'
                      }`}
                    >
                      Unisex ({conteosCatalogo.unisex})
                    </button>
                  </div>

                  <span className="hidden sm:inline-block text-slate-300">|</span>

                  {/* Disponibilidad / Estado */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFiltroEstadoCatalogo('TODOS')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        filtroEstadoCatalogo === 'TODOS'
                          ? 'bg-slate-800 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 bg-slate-100/80'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroEstadoCatalogo('ACTIVOS')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                        filtroEstadoCatalogo === 'ACTIVOS'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Activas ({conteosCatalogo.activos})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroEstadoCatalogo('INACTIVOS')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                        filtroEstadoCatalogo === 'INACTIVOS'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Agotadas ({conteosCatalogo.inactivos})
                    </button>
                  </div>
                </div>

                {/* Buscador Rápido Local */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busquedaCatalogo}
                    onChange={(e) => setBusquedaCatalogo(e.target.value)}
                    placeholder="Buscar por código, contratipo, marca..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                  {busquedaCatalogo && (
                    <button
                      type="button"
                      onClick={() => setBusquedaCatalogo('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tabla Administrativa Limpia */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-[720px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider z-10">
                      <tr>
                        <th className="py-3 px-4">Kodigo</th>
                        <th className="py-3 px-4">Contratipo</th>
                        <th className="py-3 px-4">Marca Inspirada</th>
                        <th className="py-3 px-4">Género</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Precio Normal</th>
                        <th className="py-3 px-4 text-right">Precio Extra Shot</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {catalogoFiltrado.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                            No se encontraron fragancias con los criterios seleccionados.
                          </td>
                        </tr>
                      ) : (
                        catalogoFiltrado.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded text-[11px]">
                                #{p.codigo}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-extrabold text-slate-900">{p.contratipo}</td>
                            <td className="py-3 px-4 text-slate-600 font-medium">{p.marca_inspirada}</td>
                            <td className="py-3 px-4">{renderGeneroBadge(p.genero)}</td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                disabled={togglingActivoId === p.id}
                                onClick={() => handleToggleActivo(p)}
                                title={p.activo !== false ? 'Clic para desactivar (marcar agotada)' : 'Clic para activar (disponible para venta)'}
                                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-2xs ${
                                  p.activo !== false
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    p.activo !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                  }`}
                                />
                                <span>
                                  {togglingActivoId === p.id ? '...' : p.activo !== false ? 'Activa' : 'Inactiva'}
                                </span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                              ${parseFloat(p.precio_normal?.toString() || '20').toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                              ${parseFloat(p.precio_extra_shot?.toString() || '25').toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAbrirEdicionPerfume(p)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200 shadow-2xs cursor-pointer inline-flex items-center gap-1"
                                  title={`Editar fragancia #${p.codigo} ${p.contratipo}`}
                                >
                                  <Pencil className="w-3 h-3 text-slate-500" />
                                  <span>Editar</span>
                                </button>

                                {p.activo !== false ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSeleccionarPerfume(p)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                                    title={`Crear pedido con #${p.codigo} ${p.contratipo}`}
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Pedido</span>
                                  </button>
                                ) : (
                                  <span
                                    className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold border border-slate-200 select-none cursor-not-allowed"
                                    title="Fragancia inactiva / agotada. Actívala para poder venderla."
                                  >
                                    Agotada
                                  </span>
                                )}
                              </div>
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
          {/* MÓDULO: FABRICACIÓN (SPLIT-PANE EXACTO A APPSHEET)             */}
          {/* ============================================================== */}
          {activeNav === 'FABRICACION' && (
            <div className="space-y-4">
              {fabView === 'hub' && (
                <div className="space-y-6">
                  <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">FABRICACION</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tarjeta PEDIDOS COMPRA PENDIENTE */}
                    <div
                      onClick={() => {
                        setSelectedPedidoIdFab(null);
                        setFabView('compra_pendiente');
                      }}
                      className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-rose-300"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-inner">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">PEDIDOS COMPRA PENDIENTE</h3>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">
                          {pedidosRojos.length} PEDIDOS EN ROJO
                        </span>
                      </div>
                    </div>

                    {/* Tarjeta PEDIDOS POR FABRICAR */}
                    <div
                      onClick={() => {
                        setSelectedPedidoIdFab(null);
                        setFabView('por_fabricar');
                      }}
                      className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-amber-300"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                        <FlaskConical className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">PEDIDOS POR FABRICAR</h3>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">
                          {pedidosAmarillos.length} PEDIDOS EN LABORATORIO
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FASE 1: VISTA EXACTA APPSHEET: ESTADO REGISTRADO E INSUMOS PARA COMPRA */}
              {fabView === 'compra_pendiente' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedPedidoIdFab(null);
                        setFabView('hub');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      ← Volver a Fabricación
                    </button>
                    <span className="text-xs text-rose-600 font-bold">Fase 1: Insumos por Comprar</span>
                  </div>

                  {/* Tabla Normal limpia (sin fondo negro, sin elementos graficos de tarjetas) */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                      
                      {/* ========================================================= */}
                      {/* TABLA IZQUIERDA: ESTADO REGISTRADO                        */}
                      {/* ========================================================= */}
                      <div className="lg:col-span-5 flex flex-col bg-white">
                        {/* Barra Superior Header */}
                        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                              Estado Registrado
                            </h2>
                            {selectedPedidoIdFab && (
                              <button
                                onClick={() => setSelectedPedidoIdFab(null)}
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                              >
                                Ver todos ({pedidosRojos.length})
                              </button>
                            )}
                          </div>

                          <span className="text-xs text-slate-500 font-bold font-mono">
                            {pedidosRojos.length} {pedidosRojos.length === 1 ? 'pedido' : 'pedidos'}
                          </span>
                        </div>

                        {/* Tabla Estado Registrado */}
                        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="py-2.5 px-3">Cliente</th>
                                <th className="py-2.5 px-3">Marca Temporal</th>
                                <th className="py-2.5 px-3">Usuario</th>
                                <th className="py-2.5 px-2 w-7 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {pedidosRojos.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                                    No hay pedidos en estado registrado
                                  </td>
                                </tr>
                              ) : (
                                pedidosRojos.map((p) => {
                                  const isSelected = selectedPedidoIdFab === p.id;
                                  const faltantes = p.items.filter((i) => !i.insumo_comprado).length;

                                  return (
                                    <tr
                                      key={p.id}
                                      onClick={() => setSelectedPedidoIdFab(isSelected ? null : p.id)}
                                      className={`cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600'
                                          : 'hover:bg-slate-50/80'
                                      }`}
                                    >
                                      <td className="py-3 px-3 font-bold text-red-600 hover:text-red-700">
                                        <span>{p.cliente_nombre}</span>
                                        {faltantes > 0 && (
                                          <span className="ml-1.5 text-[10px] font-mono text-slate-400 font-normal">
                                            ({faltantes} pend.)
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                                        {formatearMarcaTemporal(p.created_at)}
                                      </td>
                                      <td
                                        className="py-3 px-3 text-slate-700 font-medium text-xs truncate max-w-[180px]"
                                        title={p.vendedora_nombre || 'Erika Melgar'}
                                      >
                                        {p.vendedora_nombre || 'Erika Melgar'}
                                      </td>
                                      <td className="py-3 px-2 text-center text-slate-400">
                                        <ChevronRight className="w-4 h-4 inline opacity-60" />
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* ========================================================= */}
                      {/* TABLA DERECHA: INSUMOS PARA COMPRA                        */}
                      {/* ========================================================= */}
                      <div className="lg:col-span-7 flex flex-col bg-white">
                        {/* Header Insumos */}
                        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                              Insumos para compra
                            </h2>
                            {selectedPedidoIdFab && (
                              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                                Filtrado por pedido
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-bold font-mono">
                            {insumosSplitPane.length} {insumosSplitPane.length === 1 ? 'insumo' : 'insumos'}
                          </span>
                        </div>

                        {/* Tabla Insumos */}
                        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="py-2.5 px-3">Kodigo</th>
                                <th className="py-2.5 px-3">Cliente</th>
                                <th className="py-2.5 px-3">Fecha registro</th>
                                <th className="py-2.5 px-3 text-center">Version</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {insumosSplitPane.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                                    ¡Todos los insumos han sido comprados!
                                  </td>
                                </tr>
                              ) : (
                                insumosSplitPane.map((item) => {
                                  const isPlus = item.version === 'Plus' || item.version === 'EXTRA_SHOT';

                                  return (
                                    <tr key={item.item_id} className="hover:bg-slate-50/80 transition-colors">
                                      {/* 1. Kodigo: En AMARILLO para Normal, en AZUL para Plus */}
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                          {isPlus ? (
                                            <button
                                              type="button"
                                              onClick={() => handleMarcarInsumo({ item_id: item.item_id })}
                                              disabled={loading}
                                              title="Comprar insumo (Plus)"
                                              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] leading-none shrink-0 transition-transform active:scale-95 cursor-pointer shadow-2xs"
                                            >
                                              +
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handleMarcarInsumo({ item_id: item.item_id })}
                                              disabled={loading}
                                              title="Comprar insumo (Normal)"
                                              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-[11px] leading-none shrink-0 transition-transform active:scale-95 cursor-pointer shadow-2xs"
                                            >
                                              ↓
                                            </button>
                                          )}

                                          <span
                                            onClick={() => handleMarcarInsumo({ item_id: item.item_id })}
                                            title="Clic para marcar como comprado"
                                            className={`font-bold cursor-pointer hover:underline text-xs ${
                                              isPlus
                                                ? 'text-blue-600 hover:text-blue-700'
                                                : 'text-amber-600 hover:text-amber-700'
                                            }`}
                                          >
                                            {item.contratipo} - {item.codigo}
                                          </span>

                                          {item.cantidad > 1 && (
                                            <span className="text-[10px] font-mono font-bold text-slate-400">
                                              ({item.cantidad} uds)
                                            </span>
                                          )}
                                        </div>
                                      </td>

                                      {/* 2. Cliente: Nombre del cliente (en rojo si está pendiente como en Estado Registrado) */}
                                      <td className={`py-3 px-3 font-bold whitespace-nowrap ${
                                        item.pedido_estado === 'Insumos comprados' || item.pedido_estado === 'PENDIENTE_PREPARAR'
                                          ? 'text-amber-600'
                                          : item.pedido_estado === 'Preparado' || item.pedido_estado === 'GUIA_CREADA'
                                          ? 'text-sky-600'
                                          : item.pedido_estado === 'Entregado'
                                          ? 'text-emerald-600'
                                          : 'text-red-600 hover:text-red-700'
                                      }`}>
                                        {item.cliente_nombre}
                                      </td>

                                      {/* 3. Fecha registro: Fecha y hora en que se registró */}
                                      <td className="py-3 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                                        {formatearMarcaTemporal(item.fecha_registro)}
                                      </td>

                                      {/* 4. Version: Normal (amarillo) o Plus (azul) */}
                                      <td className="py-3 px-3 text-center whitespace-nowrap">
                                        {isPlus ? (
                                          <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                            Plus
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                            Normal
                                          </span>
                                        )}
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
                  </div>
                </div>
              )}

              {/* FASE 2: VISTA EXACTA APPSHEET: ESTADO LISTO FABRICAR Y FRAGANCIAS POR FABRICAR */}
              {fabView === 'por_fabricar' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedPedidoIdFab(null);
                        setFabView('hub');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      ← Volver a Fabricación
                    </button>
                    <span className="text-xs text-amber-700 font-bold">Fase 2: Pedidos por Fabricar</span>
                  </div>

                  {/* Tabla Normal limpia (sin fondo negro, sin elementos graficos de tarjetas) */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                      
                      {/* ========================================================= */}
                      {/* TABLA IZQUIERDA: ESTADO LISTO FABRICAR                    */}
                      {/* ========================================================= */}
                      <div className="lg:col-span-5 flex flex-col bg-white">
                        {/* Barra Superior Header */}
                        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                              Estado Listo Fabricar
                            </h2>
                            {selectedPedidoIdFab && (
                              <button
                                onClick={() => setSelectedPedidoIdFab(null)}
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                              >
                                Ver todos ({pedidosAmarillos.length})
                              </button>
                            )}
                          </div>

                          <span className="text-xs text-slate-500 font-bold font-mono">
                            {pedidosAmarillos.length} {pedidosAmarillos.length === 1 ? 'pedido' : 'pedidos'}
                          </span>
                        </div>

                        {/* Tabla Estado Listo Fabricar */}
                        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="py-2.5 px-3">Cliente</th>
                                <th className="py-2.5 px-3">Marca Temporal</th>
                                <th className="py-2.5 px-3">Usuario</th>
                                <th className="py-2.5 px-2 text-right"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {pedidosAmarillos.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                                    No hay pedidos listos para fabricar
                                  </td>
                                </tr>
                              ) : (
                                pedidosAmarillos.map((p) => {
                                  const isSelected = selectedPedidoIdFab === p.id;

                                  return (
                                    <tr
                                      key={p.id}
                                      onClick={() => setSelectedPedidoIdFab(isSelected ? null : p.id)}
                                      className={`cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-amber-50/80 border-l-4 border-l-amber-500'
                                          : 'hover:bg-slate-50/80'
                                      }`}
                                    >
                                      {/* Cliente en AMARILLO/ÁMBAR (determinado por el estado Listo Fabricar) */}
                                      <td className="py-3 px-3 font-bold text-amber-600 hover:text-amber-700">
                                        <span>{p.cliente_nombre}</span>
                                        <span className="ml-1.5 text-[10px] font-mono text-slate-400 font-normal">
                                          ({p.items.length} {p.items.length === 1 ? 'frag.' : 'frags.'})
                                        </span>
                                      </td>
                                      <td className="py-3 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                                        {formatearMarcaTemporal(p.created_at)}
                                      </td>
                                      <td
                                        className="py-3 px-3 text-slate-700 font-medium text-xs truncate max-w-[180px]"
                                        title={p.vendedora_nombre || 'Erika Melgar'}
                                      >
                                        {p.vendedora_nombre || 'Erika Melgar'}
                                      </td>
                                      <td className="py-3 px-2 text-right whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setGuiaModalPedido(p);
                                              setNumGuiaInput('');
                                              setLinkGuiaInput('');
                                            }}
                                            title="Asignar Guía C807"
                                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                                          >
                                            C807 →
                                          </button>
                                          <ChevronRight className="w-4 h-4 inline opacity-60 text-slate-400" />
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

                      {/* ========================================================= */}
                      {/* TABLA DERECHA: FRAGANCIAS POR FABRICAR                    */}
                      {/* ========================================================= */}
                      <div className="lg:col-span-7 flex flex-col bg-white">
                        {/* Header Fragancias */}
                        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                              Fragancias por fabricar
                            </h2>
                            {selectedPedidoIdFab && (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                                Filtrado por pedido
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedPedidoFab && (
                              <button
                                type="button"
                                onClick={() => {
                                  setGuiaModalPedido(selectedPedidoFab);
                                  setNumGuiaInput('');
                                  setLinkGuiaInput('');
                                }}
                                className="text-[11px] font-bold px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Asignar C807 ({selectedPedidoFab.numero_pedido})</span>
                              </button>
                            )}
                            <span className="text-xs text-slate-500 font-bold font-mono">
                              {fraganciasSplitPane.length} {fraganciasSplitPane.length === 1 ? 'fragancia' : 'fragancias'}
                            </span>
                          </div>
                        </div>

                        {/* Tabla Fragancias */}
                        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="py-2.5 px-3">Kodigo</th>
                                <th className="py-2.5 px-3">Cliente</th>
                                <th className="py-2.5 px-3">Fecha registro</th>
                                <th className="py-2.5 px-3 text-center">Version</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {fraganciasSplitPane.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                                    No hay fragancias pendientes de fabricar
                                  </td>
                                </tr>
                              ) : (
                                fraganciasSplitPane.map((item) => {
                                  const isPlus = item.version === 'Plus' || item.version === 'EXTRA_SHOT';

                                  return (
                                    <tr key={item.item_id} className="hover:bg-slate-50/80 transition-colors">
                                      {/* 1. Kodigo: En AMARILLO para Normal, en AZUL para Plus */}
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                          {isPlus ? (
                                            <span
                                              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white font-black text-[11px] leading-none shrink-0 shadow-2xs"
                                            >
                                              +
                                            </span>
                                          ) : (
                                            <span
                                              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-amber-950 font-black text-[11px] leading-none shrink-0 shadow-2xs"
                                            >
                                              ↓
                                            </span>
                                          )}

                                          <span
                                            className={`font-bold text-xs ${
                                              isPlus
                                                ? 'text-blue-600'
                                                : 'text-amber-600'
                                            }`}
                                          >
                                            {item.contratipo} - {item.codigo}
                                          </span>

                                          {item.cantidad > 1 && (
                                            <span className="text-[10px] font-mono font-bold text-slate-400">
                                              ({item.cantidad} uds)
                                            </span>
                                          )}
                                        </div>
                                      </td>

                                      {/* 2. Cliente: Nombre del cliente (en amarillo/ámbar por estar en Estado Listo Fabricar) */}
                                      <td className="py-3 px-3 font-bold text-amber-600 whitespace-nowrap">
                                        {item.cliente_nombre}
                                      </td>

                                      {/* 3. Fecha registro: Fecha y hora en que se registró */}
                                      <td className="py-3 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                                        {formatearMarcaTemporal(item.fecha_registro)}
                                      </td>

                                      {/* 4. Version: Normal (amarillo) o Plus (azul) */}
                                      <td className="py-3 px-3 text-center whitespace-nowrap">
                                        {isPlus ? (
                                          <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                            Plus
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                            Normal
                                          </span>
                                        )}
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
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* MÓDULO: LOGÍSTICA C807                                         */}
          {/* ============================================================== */}
          {activeNav === 'LOGISTICA' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">
                  LOGISTICA & ENVIOS C807
                </h2>
                <span className="text-xs text-slate-500">{metricas.azules} guías generadas</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Numero de Pedido</th>
                        <th className="py-2.5 px-4">Guía C807</th>
                        <th className="py-2.5 px-4">Cliente</th>
                        <th className="py-2.5 px-4">Destino</th>
                        <th className="py-2.5 px-4">Estado C807</th>
                        <th className="py-2.5 px-4 text-center">Acciones WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {pedidos
                        .filter((p) => p.c807_guia_numero || p.estado === 'GUIA_CREADA' || p.estado === 'PENDIENTE_PREPARAR')
                        .map((p) => {
                          const tieneGuia = !!p.c807_guia_numero;
                          const linkRastreo = p.c807_link_rastreo || `https://app.c807.com/tracking?guide=${p.c807_guia_numero || ''}`;

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-indigo-700">{p.numero_pedido}</td>
                              <td className="py-3 px-4 font-mono font-bold">
                                {tieneGuia ? (
                                  <a
                                    href={linkRastreo}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sky-700 hover:underline flex items-center gap-1"
                                  >
                                    <span>{p.c807_guia_numero}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setGuiaModalPedido(p);
                                      setNumGuiaInput('');
                                      setLinkGuiaInput('');
                                    }}
                                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                                  >
                                    Asignar Guía
                                  </button>
                                )}
                              </td>
                              <td className={`py-3 px-4 ${getClienteColorPorEstado(p.estado)}`}>{p.cliente_nombre}</td>
                              <td className="py-3 px-4 text-slate-600">{p.cliente_municipio}, {p.cliente_departamento}</td>
                              <td className="py-3 px-4">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                  {p.c807_estado || (tieneGuia ? 'Llegó a su destino' : 'Listo despacho')}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleCopiarMensajeC807(p)}
                                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Copiar mensaje WhatsApp"
                                  >
                                    {copiedTrackingId === p.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedTrackingId === p.id ? 'Copiado' : 'Copiar'}</span>
                                  </button>

                                  <button
                                    onClick={() => handleAbrirWhatsAppC807(p)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Abrir WhatsApp"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    <span>Enviar</span>
                                  </button>

                                  <button
                                    onClick={() => handleEmitirDte(p)}
                                    disabled={emitiendoDteId === p.id}
                                    className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                    title="Emitir Factura Electrónica (DTE) con Factura Llama"
                                  >
                                    <ReceiptText className={`w-3 h-3 ${emitiendoDteId === p.id ? 'animate-spin' : 'text-emerald-600'}`} />
                                    <span>{emitiendoDteId === p.id ? 'Emitiendo...' : 'Facturar DTE'}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MÓDULO: INTELIGENCIA DE NEGOCIOS & COMPRAS                     */}
          {/* ============================================================== */}
          {activeNav === 'INTELIGENCIA_NEGOCIOS' && (
            <div className="space-y-4">
              {biView === 'hub' && (
                <div className="space-y-6">
                  <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">INTELIGENCIA DE NEGOCIOS</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tarjeta DASHBOARD */}
                    <div
                      onClick={() => setBiView('dashboard')}
                      className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">DASHBOARD</h3>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">VENTAS & MÉTRICAS</span>
                      </div>
                    </div>

                    {/* Tarjeta COMPRAS */}
                    <div
                      onClick={() => setBiView('compras')}
                      className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-rose-300"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-inner">
                        <ReceiptText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Compras</h3>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">GASTOS DE INSUMOS</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DASHBOARD FINANCIERO */}
              {biView === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setBiView('hub')}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      ← Volver a Inteligencia de Negocios
                    </button>
                    <span className="text-xs text-slate-500 font-medium">Dashboard General</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="clay-card p-4">
                      <span className="text-xs font-bold text-slate-500 block mb-1">Ventas Totales</span>
                      <span className="text-2xl font-black text-emerald-700 font-mono">
                        ${metricas.totalVentas.toFixed(2)}
                      </span>
                    </div>

                    <div className="clay-card p-4">
                      <span className="text-xs font-bold text-slate-500 block mb-1">Gastos en Insumos</span>
                      <span className="text-2xl font-black text-rose-600 font-mono">
                        ${metricas.totalGastosCompras.toFixed(2)}
                      </span>
                    </div>

                    <div className="clay-card p-4">
                      <span className="text-xs font-bold text-slate-500 block mb-1">Margen Operativo Bruto</span>
                      <span className="text-2xl font-black text-indigo-700 font-mono">
                        ${(metricas.totalVentas - metricas.totalGastosCompras).toFixed(2)}
                      </span>
                    </div>

                    <div className="clay-card p-4">
                      <span className="text-xs font-bold text-slate-500 block mb-1">Total Pedidos</span>
                      <span className="text-2xl font-black text-slate-900 font-mono">{metricas.total}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* COMPRAS DE INSUMOS (TABLA EXACTA A APPSHEET) */}
              {biView === 'compras' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setBiView('hub')}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      ← Volver a Inteligencia de Negocios
                    </button>
                    <span className="text-xs text-slate-500 font-medium">Registro de Compras / Gastos</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Formulario */}
                    <div className="lg:col-span-4">
                      <div className="clay-card p-5 space-y-4">
                        <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                          Nueva Compra de Insumo
                        </h3>

                        <form onSubmit={handleRegistrarCompra} className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Compra</label>
                            <input
                              type="date"
                              value={nuevaCompraFecha}
                              onChange={(e) => setNuevaCompraFecha(e.target.value)}
                              className="clay-input w-full text-xs font-bold"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                            <select
                              value={nuevaCompraCategoria}
                              onChange={(e: any) => setNuevaCompraCategoria(e.target.value)}
                              className="clay-input w-full text-xs font-bold"
                            >
                              <option value="ESENCIAS">ESENCIAS</option>
                              <option value="FRASCOS">FRASCOS</option>
                              <option value="CAJAS">CAJAS</option>
                              <option value="PAPEL">PAPEL</option>
                              <option value="OTROS INSUMOS">OTROS INSUMOS</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Concepto *</label>
                            <input
                              type="text"
                              placeholder="Ej. 10 Litros Esencia Aventus..."
                              value={nuevaCompraConcepto}
                              onChange={(e) => setNuevaCompraConcepto(e.target.value)}
                              className="clay-input w-full text-xs font-medium"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Proveedor</label>
                            <input
                              type="text"
                              placeholder="Ej. Aromas Creativos, Inveromatic..."
                              value={nuevaCompraProveedor}
                              onChange={(e) => setNuevaCompraProveedor(e.target.value)}
                              className="clay-input w-full text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Monto Total ($) *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="0.00"
                              value={nuevaCompraMonto || ''}
                              onChange={(e) => setNuevaCompraMonto(parseFloat(e.target.value) || 0)}
                              className="clay-input w-full text-xs font-mono font-bold"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="clay-btn clay-btn-primary w-full py-2.5 text-xs font-black shadow-md mt-2"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Guardar Compra
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Tabla de Gastos estilo AppSheet */}
                    <div className="lg:col-span-8">
                      <div className="clay-card overflow-hidden border border-slate-200/80 shadow-md">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                              <tr>
                                <th className="py-3 px-4">ID Gasto</th>
                                <th className="py-3 px-4">Fecha Compra</th>
                                <th className="py-3 px-4">Concepto</th>
                                <th className="py-3 px-4">Proveedor</th>
                                <th className="py-3 px-4">Categoría</th>
                                <th className="py-3 px-4 text-right">Monto</th>
                                <th className="py-3 px-4 text-center">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {compras.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-500">{c.id}</td>
                                  <td className="py-3 px-4 font-mono">{c.fecha_compra}</td>
                                  <td className="py-3 px-4 font-bold text-slate-900">{c.concepto}</td>
                                  <td className="py-3 px-4 text-slate-600">{c.proveedor}</td>
                                  <td className="py-3 px-4">
                                    <span className="clay-badge text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                      {c.categoria}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                                    ${c.monto_total.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleEliminarCompra(c.id)}
                                      className="text-slate-400 hover:text-rose-500 p-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODAL: ASIGNAR GUÍA C807                                       */}
      {/* ============================================================== */}
      {guiaModalPedido && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clay-card max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Asignar Guía C807</h3>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Al guardar la guía de paquetería C807, el pedido <strong>{guiaModalPedido.numero_pedido}</strong> pasará a estado <strong>Azul (Guía creada / Enviado)</strong>.
            </p>

            {guiaModalPedido.cliente_departamento && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">
                    Destino: <strong className="text-slate-800">{guiaModalPedido.cliente_municipio}, {guiaModalPedido.cliente_departamento}</strong>
                  </span>
                  <span className="clay-badge bg-sky-100 text-sky-800 font-black">C807: {resolveC807DeptoCode(guiaModalPedido.cliente_departamento)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Modalidad: <strong className="text-slate-700">{guiaModalPedido.tipo_pago}</strong></span>
                  <span>{guiaModalPedido.tipo_pago === 'CONTRAENTREGA' ? `Cobro C807: $${Number(guiaModalPedido.total || 0).toFixed(2)}` : 'Servicio Pagado (SER)'}</span>
                </div>
              </div>
            )}

            {/* BOTÓN DE GENERACIÓN DIRECTA AUTOMÁTICA */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGenerarGuiaAutomaticaC807}
                disabled={generandoGuia || loading}
                className="w-full clay-btn bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:from-sky-600 hover:to-blue-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Truck className={`w-4 h-4 ${generandoGuia ? 'animate-spin' : ''}`} />
                <span>{generandoGuia ? 'Generando en C807 Express...' : '🚀 Generar Guía Automática con C807'}</span>
              </button>
            </div>

            <div className="relative my-1 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <span className="relative bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">o ingresar guía existente</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Número de Guía C807 *</label>
                <input
                  type="text"
                  placeholder="Ej. C807-SV-981245"
                  value={numGuiaInput}
                  onChange={(e) => setNumGuiaInput(e.target.value)}
                  className="clay-input w-full text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Enlace de Rastreo (Opcional)</label>
                <input
                  type="text"
                  placeholder="https://app.c807.com/tracking?guide=..."
                  value={linkGuiaInput}
                  onChange={(e) => setLinkGuiaInput(e.target.value)}
                  className="clay-input w-full text-xs font-mono font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGuiaModalPedido(null)}
                className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleGuardarGuiaC807}
                disabled={!numGuiaInput.trim() || loading || generandoGuia}
                className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Guardar Manualmente
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* MODAL: FACTURA ELECTRÓNICA DTE (FACTURA LLAMA)                */}
      {/* ============================================================== */}
      {dteResultModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clay-card max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Factura Electrónica Emitida (DTE)</h3>
                <p className="text-xs text-slate-500 font-medium">Pedido #{dteResultModal.pedido.numero_pedido} - {dteResultModal.pedido.cliente_nombre}</p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold">Estado Hacienda:</span>
                <span className="clay-badge bg-emerald-100 text-emerald-800 font-black">
                  ✓ {dteResultModal.result.estado || 'PROCESADO'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold">Código Generación:</span>
                <span className="font-mono text-slate-800 font-black truncate max-w-[220px]" title={dteResultModal.result.codigo_generacion}>
                  {dteResultModal.result.codigo_generacion}
                </span>
              </div>
              {dteResultModal.result.numero_control && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">Número Control:</span>
                  <span className="font-mono text-slate-800 font-black">{dteResultModal.result.numero_control}</span>
                </div>
              )}
              {dteResultModal.result.sello_recepcion && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">Sello Recepción MH:</span>
                  <span className="font-mono text-slate-800 font-bold truncate max-w-[220px]" title={dteResultModal.result.sello_recepcion}>
                    {dteResultModal.result.sello_recepcion}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {dteResultModal.result.pdf_url && (
                <a
                  href={dteResultModal.result.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 clay-btn clay-btn-primary py-2.5 px-4 text-xs font-black flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Descargar PDF Factura
                </a>
              )}
              {dteResultModal.result.json_url && (
                <a
                  href={dteResultModal.result.json_url}
                  target="_blank"
                  rel="noreferrer"
                  className="clay-btn clay-btn-light py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  Ver JSON DTE
                </a>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDteResultModal(null)}
                className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR ABONO / PAGO                                  */}
      {/* ============================================================== */}
      {modalAbonoPedido && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clay-card max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Registrar Abono / Pago</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Pedido #{modalAbonoPedido.numero_pedido} - {modalAbonoPedido.cliente_nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbonoPedido(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Total del Pedido:</span>
                <strong className="text-slate-900 font-mono text-sm">
                  ${parseFloat(modalAbonoPedido.total?.toString() || '0').toFixed(2)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Saldo Pendiente:</span>
                <strong className="text-rose-600 font-mono text-sm">
                  ${Math.max(
                    0,
                    parseFloat(modalAbonoPedido.total?.toString() || '0') -
                      parseFloat(modalAbonoPedido.total_pagado?.toString() || '0')
                  ).toFixed(2)}
                </strong>
              </div>
            </div>

            <form onSubmit={handleRegistrarAbono} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Monto del Abono ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={abonoMonto}
                  onChange={(e) => setAbonoMonto(e.target.value)}
                  className="clay-input w-full font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Forma de Pago / Cuenta Bancaria *</label>
                <select
                  value={abonoFormaPagoId}
                  onChange={(e) => setAbonoFormaPagoId(e.target.value)}
                  className="clay-input w-full font-bold cursor-pointer"
                  required
                >
                  {formasPago.map((fp) => (
                    <option key={fp.id} value={fp.id}>
                      {fp.nombre} ({fp.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Comprobante / Autorización Bancaria</label>
                <input
                  type="text"
                  placeholder="Ej. #Transf 491823, Ref #00129..."
                  value={abonoNumDoc}
                  onChange={(e) => setAbonoNumDoc(e.target.value)}
                  className="clay-input w-full font-mono font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha del Pago</label>
                <input
                  type="date"
                  value={abonoFecha}
                  onChange={(e) => setAbonoFecha(e.target.value)}
                  className="clay-input w-full font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones / Notas (Opcional)</label>
                <input
                  type="text"
                  placeholder="Liquidación final, abono del 50%, etc."
                  value={abonoObservaciones}
                  onChange={(e) => setAbonoObservaciones(e.target.value)}
                  className="clay-input w-full font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbonoPedido(null)}
                  className="clay-btn clay-btn-light px-4 py-2 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={abonoLoading}
                  className="clay-btn clay-btn-primary px-4 py-2 font-black flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {abonoLoading ? 'Guardando...' : 'Guardar Abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDITAR FRAGANCIA DE CATÁLOGO                            */}
      {/* ============================================================== */}
      {perfumeEditando && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Editar Fragancia #{perfumeEditando.codigo}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Actualiza información, precios y disponibilidad en inventario
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPerfumeEditando(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionPerfume} className="space-y-4 text-xs">
              {/* Tarjeta de Disponibilidad / Estado Activa vs Inactiva */}
              <div
                onClick={() => setFormEdicionPerfume((prev) => ({ ...prev, activo: !prev.activo }))}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  formEdicionPerfume.activo
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50/70 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      formEdicionPerfume.activo ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {formEdicionPerfume.activo ? '✓' : '✕'}
                  </div>
                  <div>
                    <span className="font-extrabold block text-xs">
                      {formEdicionPerfume.activo ? 'FRAGANCIA ACTIVA (Disponible)' : 'FRAGANCIA INACTIVA (Agotada)'}
                    </span>
                    <span className="text-[11px] opacity-80 block">
                      {formEdicionPerfume.activo
                        ? 'Se puede vender y aparecerá en el catálogo para pedidos.'
                        : 'No se podrá vender ni seleccionar en pedidos nuevos.'}
                    </span>
                  </div>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider shrink-0 ${
                    formEdicionPerfume.activo
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-rose-100 border-rose-300 text-rose-800'
                  }`}
                >
                  {formEdicionPerfume.activo ? 'Activa' : 'Inactiva'}
                </div>
              </div>

              {/* Grid Código y Género */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kodigo / Código *</label>
                  <input
                    type="text"
                    required
                    value={formEdicionPerfume.codigo}
                    onChange={(e) => setFormEdicionPerfume((prev) => ({ ...prev, codigo: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Ej. 100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Género *</label>
                  <select
                    value={formEdicionPerfume.genero}
                    onChange={(e) => setFormEdicionPerfume((prev) => ({ ...prev, genero: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Caballero">Caballero</option>
                    <option value="Dama">Dama</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>

              {/* Contratipo (Nombre) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contratipo (Nombre de la fragancia) *</label>
                <input
                  type="text"
                  required
                  value={formEdicionPerfume.contratipo}
                  onChange={(e) => setFormEdicionPerfume((prev) => ({ ...prev, contratipo: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Ej. 1 Million Elixir H"
                />
              </div>

              {/* Marca Inspirada */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Marca Inspirada / Diseñador</label>
                <input
                  type="text"
                  value={formEdicionPerfume.marca_inspirada}
                  onChange={(e) => setFormEdicionPerfume((prev) => ({ ...prev, marca_inspirada: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Ej. Paco Rabanne"
                />
              </div>

              {/* Precios Normal y Extra Shot */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio Normal ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formEdicionPerfume.precio_normal}
                      onChange={(e) => setFormEdicionPerfume((prev) => ({ ...prev, precio_normal: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-emerald-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio Extra Shot ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formEdicionPerfume.precio_extra_shot}
                      onChange={(e) =>
                        setFormEdicionPerfume((prev) => ({ ...prev, precio_extra_shot: e.target.value }))
                      }
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-purple-700"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPerfumeEditando(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicionPerfume}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{guardandoEdicionPerfume ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: AÑADIR NUEVA FRAGANCIA                                  */}
      {/* ============================================================== */}
      {modalNuevaFragancia && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Añadir Nueva Fragancia al Catálogo
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Ingresa los datos para registrar un nuevo perfume en inventario
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevaFragancia(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevaFragancia} className="space-y-4 text-xs">
              {/* Tarjeta de Disponibilidad Inicial */}
              <div
                onClick={() => setFormNuevaFragancia((prev) => ({ ...prev, activo: !prev.activo }))}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  formNuevaFragancia.activo
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50/70 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      formNuevaFragancia.activo ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {formNuevaFragancia.activo ? '✓' : '✕'}
                  </div>
                  <div>
                    <span className="font-extrabold block text-xs">
                      {formNuevaFragancia.activo ? 'FRAGANCIA ACTIVA (Disponible para venta)' : 'FRAGANCIA INACTIVA (Agotada)'}
                    </span>
                    <span className="text-[11px] opacity-80 block">
                      {formNuevaFragancia.activo
                        ? 'Se activará inmediatamente para crear pedidos y cotizar.'
                        : 'Se guardará como agotada en el catálogo sin opción a venderse.'}
                    </span>
                  </div>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider shrink-0 ${
                    formNuevaFragancia.activo
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-rose-100 border-rose-300 text-rose-800'
                  }`}
                >
                  {formNuevaFragancia.activo ? 'Activa' : 'Inactiva'}
                </div>
              </div>

              {/* Grid Código y Género */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kodigo / Código *</label>
                  <input
                    type="text"
                    required
                    value={formNuevaFragancia.codigo}
                    onChange={(e) => setFormNuevaFragancia((prev) => ({ ...prev, codigo: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Ej. 1007 o #250"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Género *</label>
                  <select
                    value={formNuevaFragancia.genero}
                    onChange={(e) => setFormNuevaFragancia((prev) => ({ ...prev, genero: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Caballero">Caballero</option>
                    <option value="Dama">Dama</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>

              {/* Contratipo (Nombre) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contratipo (Nombre de la fragancia) *</label>
                <input
                  type="text"
                  required
                  value={formNuevaFragancia.contratipo}
                  onChange={(e) => setFormNuevaFragancia((prev) => ({ ...prev, contratipo: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Ej. Sauvage Elixir H"
                />
              </div>

              {/* Marca Inspirada */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Marca Inspirada / Diseñador</label>
                <input
                  type="text"
                  value={formNuevaFragancia.marca_inspirada}
                  onChange={(e) => setFormNuevaFragancia((prev) => ({ ...prev, marca_inspirada: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Ej. Dior"
                />
              </div>

              {/* Precios Normal y Extra Shot */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio Normal ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formNuevaFragancia.precio_normal}
                      onChange={(e) => setFormNuevaFragancia((prev) => ({ ...prev, precio_normal: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-emerald-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio Extra Shot ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formNuevaFragancia.precio_extra_shot}
                      onChange={(e) =>
                        setFormNuevaFragancia((prev) => ({ ...prev, precio_extra_shot: e.target.value }))
                      }
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-purple-700"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevaFragancia(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoNuevaFragancia}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{guardandoNuevaFragancia ? 'Guardando...' : 'Añadir Fragancia'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
