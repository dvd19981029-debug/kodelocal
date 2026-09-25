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
  Pencil,
  Upload
} from 'lucide-react';
import { DEPARTAMENTOS_CATALOG, MUNICIPIOS_CATALOG, resolveC807DeptoCode, getMunicipiosByDepto } from '@/lib/svTerritory';

function ImageIcon({ className = "w-3 h-3 text-violet-600" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

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

import {
  getClienteColorPorEstado,
  getC807TrackingUrl,
  renderBadgeEstadoC807,
} from './utils/c807Helpers';
import { compressAndUploadImage } from './utils/imageUpload';
import {
  KodeSidebar,
  KodeHeader,
} from './components/layout';
import {
  AsignarGuiaModal,
  DteResultModal,
  ComprobanteLightboxModal,
  AbonoPedidoModal,
} from './components/modals';
import {
  PedidosTabla,
  ClientesTabla,
  ClienteFichaView,
} from './components/ventas';
import {
  FabricacionHub,
  CompraPendienteTabla,
  PorFabricarTabla,
} from './components/fabricacion';
import {
  LogisticaView,
} from './components/logistica';
import {
  BiHub,
  DashboardMetricas,
  ComprasGastosTabla,
} from './components/bi';
import {
  CatalogoItem,
  Vendedora,
  PedidoItem,
  ClienteItem,
  ClienteDirectorioItem,
  FormaPagoItem,
  FormaPago,
  PagoItem,
  PagoRegistroItem,
  Pedido,
  InsumoItem,
  CompraGasto,
  NavSection,
  VentasView,
  FabView,
  BiView,
} from './types';


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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [pagoInputComprobante, setPagoInputComprobante] = useState<string>('');
  const [subiendoComprobante, setSubiendoComprobante] = useState<boolean>(false);

  // Modal para Registrar Abono / Liquidación a Pedido Existente
  const [modalAbonoPedido, setModalAbonoPedido] = useState<Pedido | null>(null);
  const [abonoMonto, setAbonoMonto] = useState<string>('');
  const [abonoFormaPagoId, setAbonoFormaPagoId] = useState<string>('1001');
  const [abonoNumDoc, setAbonoNumDoc] = useState<string>('');
  const [abonoFecha, setAbonoFecha] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [abonoComprobante, setAbonoComprobante] = useState<string>('');
  const [abonoSubiendoComprobante, setAbonoSubiendoComprobante] = useState<boolean>(false);
  const [abonoObservaciones, setAbonoObservaciones] = useState<string>('');
  const [abonoLoading, setAbonoLoading] = useState(false);

  // Modal Lightbox para previsualizar comprobante a pantalla completa
  const [modalComprobanteUrl, setModalComprobanteUrl] = useState<string | null>(null);

  // Directorio y formulario de Clientes
  const [clientesDb, setClientesDb] = useState<ClienteItem[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteFichaModal, setClienteFichaModal] = useState<ClienteDirectorioItem | null>(null);
  const [clienteDuplicadoModal, setClienteDuplicadoModal] = useState<{ cliente: ClienteDirectorioItem; crearPedidoDirecto: boolean } | null>(null);
  const [ncNombre, setNcNombre] = useState('');
  const [ncTelefono, setNcTelefono] = useState('');
  const [ncTipoDoc, setNcTipoDoc] = useState('DUI');
  const [ncNumDoc, setNcNumDoc] = useState('');
  const [ncEmail, setNcEmail] = useState('');
  const [ncDepto, setNcDepto] = useState('');
  const [ncMuni, setNcMuni] = useState('');
  const [ncDireccion, setNcDireccion] = useState('');
  const [ncReferencia, setNcReferencia] = useState('');
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  const resetNuevoClienteForm = () => {
    setNcNombre('');
    setNcTelefono('');
    setNcTipoDoc('DUI');
    setNcNumDoc('');
    setNcEmail('');
    setNcDepto('');
    setNcMuni('');
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
  const [generandoGuiaPedidoId, setGenerandoGuiaPedidoId] = useState<string | null>(null);

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

    const interval = setInterval(() => {
      fetchPedidos();
    }, 6000);

    return () => clearInterval(interval);
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
      const res = await fetch('/api/kode/formas-pago?activas_only=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.formasPago)) {
        const activas = data.formasPago.filter((f: FormaPagoItem) => f.activo !== false);
        setFormasPago(activas);
        if (activas.length > 0) {
          // Default: Si existe 1003 (Contra Entrega), seleccionarla
          const contraEntrega = activas.find((f: FormaPagoItem) => f.id === '1003');
          setFormaPagoSeleccionada(contraEntrega ? contraEntrega.id : activas[0].id);
          const primerBanco = activas.find((f: FormaPagoItem) => f.tipo === 'BANCO') || activas[0];
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

  const handleGuardarNuevoCliente = async (crearPedidoDirecto = false, forzarSobreescritura = false) => {
    if (!ncNombre.trim()) {
      showToast('Ingresa el nombre completo del cliente', 'error');
      return;
    }
    if (!ncTelefono.trim()) {
      showToast('Ingresa el teléfono WhatsApp del cliente', 'error');
      return;
    }
    if (!ncDepto.trim()) {
      showToast('Debes seleccionar el departamento del cliente', 'error');
      return;
    }
    if (!ncMuni.trim()) {
      showToast('Debes seleccionar el municipio del cliente', 'error');
      return;
    }
    if (!ncDireccion.trim()) {
      showToast('Ingresa la dirección exacta de entrega del cliente', 'error');
      return;
    }

    if (!forzarSobreescritura) {
      const cleanTel = ncTelefono.trim().replace(/\D/g, '');
      const existente = directorioClientes.find(
        (c) => c.telefono.replace(/\D/g, '') === cleanTel
      );
      if (existente) {
        setClienteDuplicadoModal({ cliente: existente, crearPedidoDirecto });
        return;
      }
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
      comprobante_url: pagoInputComprobante ? pagoInputComprobante.trim() : undefined,
    };
    setPagosPedido((prev) => [...prev, nuevoPago]);
    setPagoInputMonto('');
    setPagoInputDoc('');
    setPagoInputComprobante('');
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
            comprobante_url: p.comprobante_url || '',
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
          comprobante_url: abonoComprobante.trim(),
          observaciones: abonoObservaciones.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Abono registrado con éxito', 'success');
        setModalAbonoPedido(null);
        setAbonoMonto('');
        setAbonoNumDoc('');
        setAbonoComprobante('');
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


  const handleEliminarCompra = (id: string) => {
    const actualizadas = compras.filter((c) => c.id !== id);
    guardarComprasLocal(actualizadas);
    showToast('Compra eliminada', 'info');
  };

  // Generar Guía y DTE Directamente desde el botón inline de la tabla
  const handleGenerarGuiaDirecta = async (pedido: Pedido) => {
    try {
      setGenerandoGuiaPedidoId(pedido.id);
      const res = await fetch('/api/kode/guia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: pedido.id,
          modo: 'automatico',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          data.dte?.success
            ? `🚀 ¡Guía ${data.numero_guia} y Factura DTE generadas con éxito!`
            : `🚀 ¡Guía ${data.numero_guia} generada en C807! Pedido en estado Enviado.`,
          'success'
        );
        fetchPedidos();
      } else {
        showToast(data.error || 'Error al generar guía con C807 Express', 'error');
        // Abrir modal como fallback si se requiere intervención manual
        setGuiaModalPedido(pedido);
        setNumGuiaInput('');
        setLinkGuiaInput('');
      }
    } catch (e: any) {
      showToast(e.message || 'Error de conexión', 'error');
    } finally {
      setGenerandoGuiaPedidoId(null);
    }
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
        fetchPedidos();
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

  // Historial de pedidos asociados al cliente seleccionado en ficha
  const pedidosClienteFicha = useMemo(() => {
    if (!clienteFichaModal) return [];
    const cleanPhone = (clienteFichaModal.telefono || '').toString().replace(/\D/g, '');
    const nombreLower = (clienteFichaModal.nombre || '').trim().toLowerCase();
    return pedidos
      .filter((p) => {
        const pCleanPhone = (p.cliente_telefono || '').toString().replace(/\D/g, '');
        const pNombreLower = (p.cliente_nombre || '').trim().toLowerCase();
        const matchId = clienteFichaModal.id && p.cliente_id === clienteFichaModal.id;
        const matchPhone =
          cleanPhone &&
          pCleanPhone &&
          (cleanPhone === pCleanPhone || pCleanPhone.endsWith(cleanPhone) || cleanPhone.endsWith(pCleanPhone));
        const matchNombre =
          nombreLower &&
          pNombreLower &&
          (nombreLower === pNombreLower || pNombreLower.includes(nombreLower) || nombreLower.includes(pNombreLower));
        return matchId || matchPhone || matchNombre;
      })
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  }, [clienteFichaModal, pedidos]);

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

      {/* Backdrop para Drawer Móvil */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ============================================================== */}
      {/* 1. BARRA LATERAL IZQUIERDA (SIDEBAR DE NAVEGACIÓN)             */}
      {/* ============================================================== */}
      <KodeSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        setVentasView={setVentasView}
        setFabView={setFabView}
        setBiView={setBiView}
        setSearchQuery={setSearchQuery}
        metricas={metricas}
        catalogoCount={catalogo.length}
        vendedoraSeleccionada={vendedoraSeleccionada}
        setVendedoraSeleccionada={setVendedoraSeleccionada}
        vendedoras={vendedoras}
      />

      {/* ============================================================== */}
      {/* 2. ÁREA CENTRAL DE CONTENIDO                                   */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* BARRA SUPERIOR (TOPBAR CON BUSCADOR Y ACCIÓN RÁPIDA) */}
        <KodeHeader
          setMobileMenuOpen={setMobileMenuOpen}
          activeNav={activeNav}
          ventasView={ventasView}
          setVentasView={setVentasView}
          fabView={fabView}
          setFabView={setFabView}
          biView={biView}
          setBiView={setBiView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefreshAll={() => {
            fetchPedidos();
            fetchInsumos();
            fetchCatalogo();
            fetchClientes();
            showToast('Datos sincronizados', 'info');
          }}
        />

        {/* CONTENIDO PRINCIPAL */}
        <main className="p-3.5 sm:p-5 lg:p-6 flex-1 w-full mx-auto space-y-4 sm:space-y-6">
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
                          {(() => {
                            const clean = ncTelefono.trim().replace(/\D/g, '');
                            if (clean.length < 8) return null;
                            const match = directorioClientes.find((c) => c.telefono.replace(/\D/g, '') === clean);
                            if (!match) return null;
                            return (
                              <p className="mt-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5 animate-in fade-in">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Teléfono ya asignado a: <strong>{match.nombre}</strong></span>
                              </p>
                            );
                          })()}
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
                              setNcMuni('');
                            }}
                            className="clay-input w-full text-xs font-bold cursor-pointer"
                            required
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
                            disabled={!ncDepto}
                            className="clay-input w-full text-xs font-bold cursor-pointer disabled:opacity-50"
                            required
                          >
                            <option value="">
                              {ncDepto ? '-- Seleccionar Municipio --' : '-- Primero selecciona departamento --'}
                            </option>
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
                                    {formasPago.filter((fp) => fp.activo !== false).map((fp) => (
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

                              {/* Adjuntar comprobante / captura de pantalla */}
                              {(() => {
                                const formaActual = formasPago.find((f) => f.id === pagoInputFormaId);
                                const esBanco = formaActual?.tipo === 'BANCO';
                                return (
                                  <div
                                    onPaste={async (e) => {
                                      const items = e.clipboardData?.items;
                                      if (!items) return;
                                      for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf('image') !== -1) {
                                          const file = items[i].getAsFile();
                                          if (file) {
                                            e.preventDefault();
                                            try {
                                              setSubiendoComprobante(true);
                                              const url = await compressAndUploadImage(file);
                                              setPagoInputComprobante(url);
                                              showToast('¡Comprobante adjuntado desde el portapapeles!', 'success');
                                            } catch (err: any) {
                                              showToast(err.message || 'Error al procesar captura', 'error');
                                            } finally {
                                              setSubiendoComprobante(false);
                                            }
                                            break;
                                          }
                                        }
                                      }
                                    }}
                                    className={`p-2.5 rounded-xl border transition-all ${
                                      esBanco
                                        ? 'bg-amber-50/70 border-amber-200'
                                        : 'bg-slate-50/80 border-slate-200/70'
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                                          esBanco ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                          📸
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-xs font-bold text-slate-800">
                                              Comprobante o Captura de Transferencia
                                            </span>
                                            {esBanco && (
                                              <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                                                Requerido para Banco
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[11px] text-slate-500 block">
                                            Sube la captura que mandó el cliente o pégala con <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Ctrl+V</kbd>
                                          </span>
                                        </div>
                                      </div>

                                      {pagoInputComprobante ? (
                                        <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-emerald-300 shadow-2xs">
                                          <img
                                            src={pagoInputComprobante}
                                            alt="Captura comprobante"
                                            className="w-8 h-8 rounded object-cover border border-slate-200 cursor-pointer hover:opacity-85"
                                            onClick={() => setModalComprobanteUrl(pagoInputComprobante)}
                                            title="Clic para ver en tamaño completo"
                                          />
                                          <div className="text-[11px]">
                                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                              Captura lista
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => setModalComprobanteUrl(pagoInputComprobante)}
                                              className="text-indigo-600 hover:underline font-semibold block text-[10px]"
                                            >
                                              Ver comprobante
                                            </button>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setPagoInputComprobante('')}
                                            className="text-slate-400 hover:text-rose-600 p-1 ml-1 rounded hover:bg-rose-50"
                                            title="Eliminar captura"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <label className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-2xs ${
                                          subiendoComprobante
                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                            : esBanco
                                              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                        }`}>
                                          {subiendoComprobante ? (
                                            <>
                                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                              <span>Subiendo captura...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="w-3.5 h-3.5" />
                                              <span>Adjuntar Captura / Voucher</span>
                                            </>
                                          )}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            disabled={subiendoComprobante}
                                            className="hidden"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              try {
                                                setSubiendoComprobante(true);
                                                const url = await compressAndUploadImage(file);
                                                setPagoInputComprobante(url);
                                                showToast('Comprobante adjuntado con éxito', 'success');
                                              } catch (err: any) {
                                                showToast(err.message || 'Error al subir imagen', 'error');
                                              } finally {
                                                setSubiendoComprobante(false);
                                                e.target.value = '';
                                              }
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

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
                                          <td className="py-2 px-3 text-xs">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              {pago.num_documento_auto && (
                                                <span className="font-mono text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                                  #{pago.num_documento_auto}
                                                </span>
                                              )}
                                              {pago.comprobante_url ? (
                                                <button
                                                  type="button"
                                                  onClick={() => setModalComprobanteUrl(pago.comprobante_url || null)}
                                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2 py-0.5 rounded transition-colors shadow-2xs"
                                                  title="Ver comprobante adjunto"
                                                >
                                                  <ImageIcon className="w-3 h-3 text-violet-600" />
                                                  <span>Ver Captura</span>
                                                </button>
                                              ) : (
                                                !pago.num_documento_auto && <span className="text-slate-400 font-mono text-[11px]">-</span>
                                              )}
                                            </div>
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
                <PedidosTabla
                  pedidos={pedidosFiltrados}
                  filtroEstado={filtroEstado}
                  setFiltroEstado={setFiltroEstado}
                  onVolver={() => setVentasView('hub')}
                  onRefresh={() => {
                    fetchPedidos();
                    showToast('Actualizando pedidos...', 'info');
                  }}
                  onGenerarGuia={handleGenerarGuiaDirecta}
                  generandoGuiaPedidoId={generandoGuiaPedidoId}
                  onOpenAbonoModal={(p) => {
                    setModalAbonoPedido(p);
                    const totalNum = parseFloat(p.total?.toString() || '0');
                    const totalPagadoNum = parseFloat(p.total_pagado?.toString() || '0');
                    const saldoPendiente = Math.max(0, totalNum - totalPagadoNum);
                    setAbonoMonto(saldoPendiente > 0 ? saldoPendiente.toFixed(2) : '');
                    const primerBanco = formasPago.find((f) => f.tipo === 'BANCO') || formasPago[0];
                    setAbonoFormaPagoId(primerBanco?.id || formasPago[0]?.id || '');
                    setAbonoNumDoc('');
                    setAbonoObservaciones('');
                  }}
                  onViewComprobante={(url) => setModalComprobanteUrl(url)}
                  onEliminarAbono={handleEliminarAbono}
                />
              )}

              {/* VISTA 1C: CLIENTES (TABLA EXACTA A APPSHEET CON 📞 Y 💬) */}
              {ventasView === 'clientes' && (
                <ClientesTabla
                  clientes={clientesFiltrados}
                  totalClientes={directorioClientes.length}
                  onVolver={() => setVentasView('hub')}
                  onNuevoCliente={() => {
                    resetNuevoClienteForm();
                    setVentasView('nuevo_cliente');
                  }}
                  onVerFicha={(c) => setClienteFichaModal(c)}
                  onSeleccionarCliente={handleSeleccionarCliente}
                />
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
          {/* MODULO: FABRICACION                                           */}
          {/* ============================================================== */}
          {activeNav === 'FABRICACION' && (
            <div className="space-y-4">
              {fabView === 'hub' && (
                <FabricacionHub
                  pedidosRojosCount={pedidosRojos.length}
                  pedidosAmarillosCount={pedidosAmarillos.length}
                  onSelectView={(view) => {
                    setSelectedPedidoIdFab(null);
                    setFabView(view);
                  }}
                />
              )}

              {fabView === 'compra_pendiente' && (
                <CompraPendienteTabla
                  pedidosRojos={pedidosRojos}
                  insumos={insumos}
                  selectedPedidoId={selectedPedidoIdFab}
                  onSelectPedidoId={setSelectedPedidoIdFab}
                  onBack={() => {
                    setSelectedPedidoIdFab(null);
                    setFabView('hub');
                  }}
                  onMarcarInsumo={handleMarcarInsumo}
                  loading={loading}
                />
              )}

              {fabView === 'por_fabricar' && (
                <PorFabricarTabla
                  pedidosAmarillos={pedidosAmarillos}
                  selectedPedidoId={selectedPedidoIdFab}
                  onSelectPedidoId={setSelectedPedidoIdFab}
                  onBack={() => {
                    setSelectedPedidoIdFab(null);
                    setFabView('hub');
                  }}
                  onAsignarGuia={(pedido) => {
                    setGuiaModalPedido(pedido);
                    setNumGuiaInput('');
                    setLinkGuiaInput('');
                  }}
                />
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULO: LOGISTICA C807                                        */}
          {/* ============================================================== */}
          {activeNav === 'LOGISTICA' && (
            <LogisticaView
              pedidos={pedidos}
              searchQuery={searchQuery}
              onGenerarGuiaDirecta={handleGenerarGuiaDirecta}
              generandoGuiaPedidoId={generandoGuiaPedidoId}
              onAsignarGuiaManual={(pedido) => {
                setGuiaModalPedido(pedido);
                setNumGuiaInput('');
                setLinkGuiaInput('');
              }}
              onEmitirDte={handleEmitirDte}
              emitiendoDteId={emitiendoDteId}
              showToast={showToast}
            />
          )}

          {/* ============================================================== */}
          {/* MODULO: INTELIGENCIA DE NEGOCIOS & COMPRAS                    */}
          {/* ============================================================== */}
          {activeNav === 'INTELIGENCIA_NEGOCIOS' && (
            <div className="space-y-4">
              {biView === 'hub' && (
                <BiHub onSelectView={(view) => setBiView(view)} />
              )}

              {biView === 'dashboard' && (
                <DashboardMetricas
                  metricas={metricas}
                  onBack={() => setBiView('hub')}
                />
              )}

              {biView === 'compras' && (
                <ComprasGastosTabla
                  compras={compras}
                  onRegistrarCompra={(compra) => {
                    const nueva: CompraGasto = {
                      id: `GASTO-${Date.now().toString().slice(-4)}`,
                      fecha_compra: compra.fecha_compra,
                      concepto: compra.concepto,
                      monto_total: compra.monto_total,
                      proveedor: compra.proveedor,
                      categoria: compra.categoria,
                      estado_pago: 'PAGADO',
                    };
                    const actualizadas = [nueva, ...compras];
                    guardarComprasLocal(actualizadas);
                    showToast('Compra registrada exitosamente', 'success');
                  }}
                  onEliminarCompra={handleEliminarCompra}
                  onBack={() => setBiView('hub')}
                  showToast={showToast}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODAL: ASIGNAR GUÍA C807                                       */}
      {/* ============================================================== */}
      <AsignarGuiaModal
        pedido={guiaModalPedido}
        onClose={() => setGuiaModalPedido(null)}
        onGuardarManual={async (num, link) => {
          if (!guiaModalPedido) return;
          try {
            setLoading(true);
            const res = await fetch('/api/kode/guia', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pedido_id: guiaModalPedido.id,
                modo: 'manual',
                c807_guia_numero: num,
                c807_link_rastreo: link || undefined,
              }),
            });
            const data = await res.json();
            if (data.success) {
              showToast(`Guía ${num} asignada.`, 'success');
              setGuiaModalPedido(null);
              fetchPedidos();
            } else {
              showToast(data.error || 'Error al asignar guía', 'error');
            }
          } catch (e: any) {
            showToast(e.message, 'error');
          } finally {
            setLoading(false);
          }
        }}
        onGenerarAutomatica={handleGenerarGuiaAutomaticaC807}
        generandoGuia={generandoGuia}
      />

      {/* ============================================================== */}
      {/* MODAL: FACTURA ELECTRÓNICA DTE (FACTURA LLAMA)                */}
      {/* ============================================================== */}
      <DteResultModal
        data={dteResultModal}
        onClose={() => setDteResultModal(null)}
      />

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR ABONO / PAGO                                  */}
      {/* ============================================================== */}
      <AbonoPedidoModal
        pedido={modalAbonoPedido}
        formasPago={formasPago}
        onClose={() => setModalAbonoPedido(null)}
        onSuccess={fetchPedidos}
        onViewComprobante={(url) => setModalComprobanteUrl(url)}
        showToast={showToast}
      />

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

      {/* ============================================================== */}
      {/* MODAL: FICHA DE CLIENTE E HISTORIAL DE PEDIDOS                 */}
      {/* ============================================================== */}
      <ClienteFichaView
        cliente={clienteFichaModal}
        pedidos={pedidosClienteFicha}
        onClose={() => setClienteFichaModal(null)}
        onNuevoPedido={(c) => {
          setClienteFichaModal(null);
          handleSeleccionarCliente(c);
        }}
        onGenerarGuia={handleGenerarGuiaDirecta}
        generandoGuiaPedidoId={generandoGuiaPedidoId}
      />

      {/* MODAL: ALERTA DE CLIENTE DUPLICADO POR TELÉFONO */}
      {clienteDuplicadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-2xl shrink-0 mt-0.5">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black leading-tight">Teléfono ya registrado</h3>
                <p className="text-xs text-amber-100 font-medium mt-0.5">
                  Ya existe un cliente con este número de WhatsApp.
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Cliente existente:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{clienteDuplicadoModal.cliente.nombre}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Teléfono:</span>
                  <span className="font-mono font-bold text-slate-800">{clienteDuplicadoModal.cliente.telefono}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Ubicación actual:</span>
                  <span className="font-medium text-slate-700">{clienteDuplicadoModal.cliente.municipio || ''}, {clienteDuplicadoModal.cliente.departamento || ''}</span>
                </div>
                {clienteDuplicadoModal.cliente.direccion && (
                  <div className="pt-1 text-[11px] text-slate-600 truncate">
                    <span className="font-semibold text-slate-500">Dirección: </span>
                    {clienteDuplicadoModal.cliente.direccion}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                ¿Deseas <strong>sobreescribir</strong> los datos de este cliente con la información que acabas de ingresar o prefieres <strong>cancelar</strong> para corregir el número?
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setClienteDuplicadoModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors border border-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const params = clienteDuplicadoModal;
                  setClienteDuplicadoModal(null);
                  handleGuardarNuevoCliente(params.crearPedidoDirecto, true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200 transition-colors cursor-pointer"
              >
                Sobreescribir datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lightbox para Visualizar Comprobante / Captura */}
      <ComprobanteLightboxModal
        url={modalComprobanteUrl}
        onClose={() => setModalComprobanteUrl(null)}
      />
    </div>
  );
}
