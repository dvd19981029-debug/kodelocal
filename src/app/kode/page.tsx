'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import {
  KodeSidebar,
  KodeHeader,
} from './components/layout';
import {
  AsignarGuiaModal,
  DteResultModal,
  ComprobanteLightboxModal,
  AbonoPedidoModal,
  EditarFraganciaModal,
  NuevaFraganciaModal,
  ClienteDuplicadoModal,
} from './components/modals';
import {
  VentasHub,
  NuevoClienteForm,
  NuevoPedidoForm,
  PedidosTabla,
  ClientesTabla,
  ClienteFichaView,
} from './components/ventas';
import {
  CatalogoGrid,
} from './components/catalogo';
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
  ClienteItem,
  ClienteDirectorioItem,
  FormaPagoItem,
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
  const [activeNav, setActiveNav] = useState<NavSection>('VENTAS');

  // Sub-vistas dentro de cada sección
  const [ventasView, setVentasView] = useState<VentasView>('hub');
  const [fabView, setFabView] = useState<FabView>('hub');
  const [biView, setBiView] = useState<BiView>('hub');

  // Buscador global de la barra superior
  const [searchQuery, setSearchQuery] = useState('');

  // Datos maestros
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [insumos, setInsumos] = useState<InsumoItem[]>([]);
  const [compras, setCompras] = useState<CompraGasto[]>([]);
  const [formasPago, setFormasPago] = useState<FormaPagoItem[]>([]);
  const [clientesDb, setClientesDb] = useState<ClienteItem[]>([]);
  const [vendedoraSeleccionada, setVendedoraSeleccionada] = useState<string>('');

  // Loading & Toasts
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filtros de Pedidos
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  // Fabricación Split-pane selección
  const [selectedPedidoIdFab, setSelectedPedidoIdFab] = useState<string | null>(null);

  // Estados de Fragancias (modales y toggling)
  const [perfumeEditando, setPerfumeEditando] = useState<CatalogoItem | null>(null);
  const [modalNuevaFragancia, setModalNuevaFragancia] = useState(false);
  const [togglingActivoId, setTogglingActivoId] = useState<string | null>(null);

  // Selección previa para Nuevo Pedido (desde Catálogo o Clientes)
  const [pedidoInitialCliente, setPedidoInitialCliente] = useState<ClienteDirectorioItem | null>(null);
  const [pedidoInitialPerfume, setPedidoInitialPerfume] = useState<CatalogoItem | null>(null);

  // Modales
  const [modalAbonoPedido, setModalAbonoPedido] = useState<Pedido | null>(null);
  const [modalComprobanteUrl, setModalComprobanteUrl] = useState<string | null>(null);
  const [clienteFichaModal, setClienteFichaModal] = useState<ClienteDirectorioItem | null>(null);
  const [clienteDuplicadoModal, setClienteDuplicadoModal] = useState<{
    cliente: ClienteItem;
    crearPedidoDirecto: boolean;
    pendienteData?: any;
  } | null>(null);

  // Modal Guía C807
  const [guiaModalPedido, setGuiaModalPedido] = useState<Pedido | null>(null);
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
      }
    } catch (e) {
      console.error('Error cargando formas de pago:', e);
    }
  };

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

  // Directorio consolidado de clientes (base de datos + pedidos históricos)
  const directorioClientes = useMemo(() => {
    const mapa = new Map<string, ClienteDirectorioItem>();

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

  const handleGuardarNuevoCliente = async (
    clienteData: any,
    crearPedidoDirecto = false,
    forzarSobreescritura = false
  ) => {
    if (!forzarSobreescritura) {
      const cleanTel = (clienteData.telefono_whatsapp || '').trim().replace(/\D/g, '');
      const existente = directorioClientes.find(
        (c) => c.telefono.replace(/\D/g, '') === cleanTel
      );
      if (existente) {
        setClienteDuplicadoModal({
          cliente: {
            id: existente.id,
            nombre_completo: existente.nombre,
            telefono_whatsapp: existente.telefono,
            departamento: existente.departamento,
            municipio: existente.municipio,
            direccion_entrega: existente.direccion,
            punto_referencia: existente.referencia,
            tipo_documento: existente.tipo_documento,
            numero_documento: existente.numero_documento,
            email: existente.email,
          },
          crearPedidoDirecto,
          pendienteData: clienteData,
        });
        return;
      }
    }

    try {
      setGuardandoCliente(true);
      const res = await fetch('/api/kode/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData),
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Error al guardar cliente', 'error');
        return;
      }

      showToast(`Cliente "${clienteData.nombre_completo}" registrado con éxito`, 'success');
      await fetchClientes();

      if (crearPedidoDirecto) {
        handleSeleccionarCliente({
          id: data.cliente?.id || '',
          nombre: clienteData.nombre_completo,
          telefono: clienteData.telefono_whatsapp,
          direccion: clienteData.direccion_entrega,
          departamento: clienteData.departamento,
          municipio: clienteData.municipio,
          referencia: clienteData.punto_referencia,
          tipo_documento: clienteData.tipo_documento || 'DUI',
          numero_documento: clienteData.numero_documento,
          email: clienteData.email,
        });
      } else {
        setVentasView('clientes');
      }
    } catch (e: any) {
      console.error('Error guardando cliente:', e);
      showToast(e.message || 'Error al conectar con el servidor', 'error');
    } finally {
      setGuardandoCliente(false);
    }
  };

  const handleSeleccionarCliente = (c: any) => {
    setPedidoInitialCliente({
      id: c.id || '',
      nombre: c.nombre_completo || c.nombre || '',
      telefono: c.telefono_whatsapp || c.telefono || '',
      direccion: c.direccion_entrega || c.direccion || '',
      departamento: c.departamento || '',
      municipio: c.municipio || '',
      referencia: c.punto_referencia || c.referencia || '',
      tipo_documento: c.tipo_documento || 'DUI',
      numero_documento: c.numero_documento || '',
      email: c.email || '',
      pedidosCount: c.pedidosCount || 0,
      totalGastado: c.totalGastado || 0,
    });
    setActiveNav('VENTAS');
    setVentasView('nuevo_pedido');
  };

  const handleSeleccionarPerfume = (p: CatalogoItem) => {
    if (p.activo === false) {
      showToast(`La fragancia #${p.codigo} (${p.contratipo}) está inactiva/agotada y no se puede vender.`, 'error');
      return;
    }
    setPedidoInitialPerfume(p);
    setActiveNav('VENTAS');
    setVentasView('nuevo_pedido');
    showToast(`Fragancia #${p.codigo} (${p.contratipo}) seleccionada para nuevo pedido`, 'info');
  };

  const handleGuardarPedido = async (payload: any) => {
    try {
      setLoading(true);
      const res = await fetch('/api/kode/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Pedido ${data.pedido?.numero_pedido || ''} registrado con éxito en estado Registrado`, 'success');
        setPedidoInitialCliente(null);
        setPedidoInitialPerfume(null);
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
        setGuiaModalPedido(pedido);
      }
    } catch (e: any) {
      showToast(e.message || 'Error de conexión', 'error');
    } finally {
      setGenerandoGuiaPedidoId(null);
    }
  };

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

  const handleEliminarCompra = (id: string) => {
    const actualizadas = compras.filter((c) => c.id !== id);
    guardarComprasLocal(actualizadas);
    showToast('Compra eliminada', 'info');
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

  // Filtrado de clientes en directorio
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
              {/* HUB DE TARJETAS HORIZONTALES */}
              {ventasView === 'hub' && (
                <VentasHub
                  onSelectView={(v) => {
                    if (v === 'nuevo_pedido') {
                      setPedidoInitialCliente(null);
                      setPedidoInitialPerfume(null);
                    }
                    setVentasView(v);
                  }}
                  totalClientes={directorioClientes.length}
                  totalPedidos={metricas.total}
                  totalFragancias={catalogo.length}
                />
              )}

              {/* FORMULARIO: NUEVO CLIENTE */}
              {ventasView === 'nuevo_cliente' && (
                <NuevoClienteForm
                  directorioClientes={directorioClientes}
                  onGuardar={handleGuardarNuevoCliente}
                  guardando={guardandoCliente}
                  onCancel={() => setVentasView('hub')}
                  showToast={showToast}
                />
              )}

              {/* FORMULARIO: NUEVO PEDIDO */}
              {ventasView === 'nuevo_pedido' && (
                <NuevoPedidoForm
                  catalogo={catalogo}
                  directorioClientes={directorioClientes}
                  formasPago={formasPago}
                  vendedoras={vendedoras}
                  vendedoraSeleccionada={vendedoraSeleccionada}
                  onVendedoraSeleccionadaChange={setVendedoraSeleccionada}
                  onGuardarPedido={handleGuardarPedido}
                  loading={loading}
                  onBack={() => setVentasView('hub')}
                  onRegistrarNuevoCliente={() => setVentasView('nuevo_cliente')}
                  onVerDirectorioClientes={() => setVentasView('clientes')}
                  onViewComprobante={(url) => setModalComprobanteUrl(url)}
                  showToast={showToast}
                  initialCliente={pedidoInitialCliente}
                  initialPerfume={pedidoInitialPerfume}
                />
              )}

              {/* TABLA DE PEDIDOS */}
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
                  onOpenAbonoModal={(p) => setModalAbonoPedido(p)}
                  onViewComprobante={(url) => setModalComprobanteUrl(url)}
                  onEliminarAbono={handleEliminarAbono}
                />
              )}

              {/* TABLA DE CLIENTES */}
              {ventasView === 'clientes' && (
                <ClientesTabla
                  clientes={clientesFiltrados}
                  totalClientes={directorioClientes.length}
                  onVolver={() => setVentasView('hub')}
                  onNuevoCliente={() => setVentasView('nuevo_cliente')}
                  onVerFicha={(c) => setClienteFichaModal(c)}
                  onSeleccionarCliente={handleSeleccionarCliente}
                />
              )}

              {/* CATÁLOGO DE FRAGANCIAS */}
              {ventasView === 'catalogo' && (
                <CatalogoGrid
                  catalogo={catalogo}
                  onAbrirEdicion={(p) => setPerfumeEditando(p)}
                  onAbrirNuevaFragancia={() => setModalNuevaFragancia(true)}
                  onSeleccionarPerfume={handleSeleccionarPerfume}
                  onToggleActivo={handleToggleActivo}
                  togglingActivoId={togglingActivoId}
                  onBack={() => setVentasView('hub')}
                  titulo="Catálogo de Fragancias KÖDE"
                />
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* MÓDULO: INVENTARIO                                             */}
          {/* ============================================================== */}
          {activeNav === 'INVENTARIO' && (
            <CatalogoGrid
              catalogo={catalogo}
              onAbrirEdicion={(p) => setPerfumeEditando(p)}
              onAbrirNuevaFragancia={() => setModalNuevaFragancia(true)}
              onSeleccionarPerfume={handleSeleccionarPerfume}
              onToggleActivo={handleToggleActivo}
              togglingActivoId={togglingActivoId}
              titulo="INVENTARIO / CATÁLOGO GENERAL"
              subtitulo="Listado completo de fragancias, tarifas y control de disponibilidad para venta"
            />
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
                  onAsignarGuia={(pedido) => setGuiaModalPedido(pedido)}
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
              onAsignarGuiaManual={(pedido) => setGuiaModalPedido(pedido)}
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
      {/* MODALES DEL SISTEMA                                            */}
      {/* ============================================================== */}

      {/* MODAL: ASIGNAR GUÍA C807 */}
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

      {/* MODAL: FACTURA ELECTRÓNICA DTE (FACTURA LLAMA) */}
      <DteResultModal
        data={dteResultModal}
        onClose={() => setDteResultModal(null)}
      />

      {/* MODAL: REGISTRAR ABONO / PAGO */}
      <AbonoPedidoModal
        pedido={modalAbonoPedido}
        formasPago={formasPago}
        onClose={() => setModalAbonoPedido(null)}
        onSuccess={fetchPedidos}
        onViewComprobante={(url) => setModalComprobanteUrl(url)}
        showToast={showToast}
      />

      {/* MODAL: EDITAR FRAGANCIA DE CATÁLOGO */}
      <EditarFraganciaModal
        perfume={perfumeEditando}
        onClose={() => setPerfumeEditando(null)}
        onSuccess={fetchCatalogo}
        showToast={showToast}
      />

      {/* MODAL: AÑADIR NUEVA FRAGANCIA */}
      <NuevaFraganciaModal
        isOpen={modalNuevaFragancia}
        onClose={() => setModalNuevaFragancia(false)}
        onSuccess={fetchCatalogo}
        showToast={showToast}
      />

      {/* MODAL: FICHA DE CLIENTE E HISTORIAL DE PEDIDOS */}
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
      <ClienteDuplicadoModal
        modalData={clienteDuplicadoModal}
        onClose={() => setClienteDuplicadoModal(null)}
        onSobreescribir={(crearPedidoDirecto) => {
          if (!clienteDuplicadoModal?.pendienteData) return;
          const { pendienteData } = clienteDuplicadoModal;
          setClienteDuplicadoModal(null);
          handleGuardarNuevoCliente(pendienteData, crearPedidoDirecto, true);
        }}
      />

      {/* MODAL: LIGHTBOX PARA VISUALIZAR COMPROBANTE / CAPTURA */}
      <ComprobanteLightboxModal
        url={modalComprobanteUrl}
        onClose={() => setModalComprobanteUrl(null)}
      />
    </div>
  );
}
