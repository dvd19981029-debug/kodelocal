'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { INITIAL_PRODUCTS, ProductItem, CartItem, SaleRecord, PERFUME_CATEGORIES, getStoredProducts } from '@/lib/store';
import { isHalloweenPromoProduct, HALLOWEEN_PROMO_PRICE_1OZ, HALLOWEEN_PROMO_PRICE_HALF_OZ } from '@/lib/halloweenPromo';
import CotizacionModal, { type CotizacionNotices } from '@/components/pos/CotizacionModal';
import CotizacionesHistoryModal from '@/components/pos/CotizacionesHistoryModal';
import ThermalTicket from '@/components/pos/ThermalTicket';
import { printThermalTicketPdf, downloadThermalTicketPdf } from '@/lib/thermalTicketPdf';
import { StockWarningBanner } from '@/components/pos/StockWarningBanner';
import { PosCustomerModule } from '@/components/pos/PosCustomerModule';
import { PosSalesModule } from '@/components/pos/PosSalesModule';
import { PosCajaModule } from '@/components/pos/PosCajaModule';
import { PosBodegaModule } from '@/components/pos/PosBodegaModule';
import PosDomicilioPanel from '@/components/pos/PosDomicilioPanel';
import PosPrefacturasModule, { type SavedQuote } from '@/components/pos/PosPrefacturasModule';
import { 
  CustomerRecord, 
  TipoPersona, 
  TipoDocumentoCliente, 
  CategoriaContribuyente,
  getStoredCustomers, 
  saveStoredCustomers,
  DEPARTAMENTOS_SV,
  GIROS_COMUNES_SV
} from '@/lib/customers';
import { 
  DEPARTAMENTOS_CATALOG, 
  getMunicipiosByDepartamento 
} from '@/lib/svTerritory';
import { getStaffToken, getActiveSessionUI } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { 
  syncSaleOnlineOrQueue, 
  initOfflineSync, 
  getOfflineQueueCount, 
  getOfflineSalesQueue, 
  flushOfflineQueue 
} from '@/lib/offlineSync';
import {
  PosTab,
  CajaSubTab,
  DteFilterType,
  PaymentMethod,
  TipoComprobante,
  BodegaOrdenesFilter,
  CustomerFilterType,
} from './types';
import { posApi, posStorage } from './services';
import { posHelpers } from './utils';
import { 
  PosProductGrid, 
  PosCartPanel, 
  PosQuickEditProductModal,
  PosCustomerFormModal,
  PosCustomerDetailModal,
  PosCheckoutModal,
  PosCompletedSaleModal,
  PosSaleDetailModal,
  PosSidebar
} from './components';
import { Store, ShoppingCart, X } from 'lucide-react';

export default function PosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  // Pestaña activa en el menú lateral de Punto de Venta:
  // 'nueva_orden' (o 'pos'): Terminal de venta / Cotizador
  // 'caja_facturacion': Módulo de Caja (Órdenes listas en ventanilla y DTEs emitidos)
  // 'clientes': Directorio y registro fiscal para FC y CCF
  // 'ventas': Resumen de onzas vendidas en el turno
  // 'bodega_ordenes': Monitoreo de comandas en preparación
  const [posTab, setPosTab] = useState<PosTab>('nueva_orden');

  // Menú lateral dinámico: colapsado por defecto para dar más espacio a las tarjetas, expandible al pasar el mouse
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const isSidebarExpanded = isSidebarPinned || isSidebarHovered;

  // Subpestañas en Caja & Facturación (Estilo Mecanic OS)
  const [cajaSubTab, setCajaSubTab] = useState<CajaSubTab>('listas_facturar');
  const [dteFilterType, setDteFilterType] = useState<DteFilterType>('ALL');
  const [dteSearchQuery, setDteSearchQuery] = useState('');
  const [dteSortBy, setDteSortBy] = useState<'FACTURACION' | 'CREACION'>('FACTURACION');

  // Cotización / Prefactura Modal
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [activeQuoteSale, setActiveQuoteSale] = useState<SaleRecord | null>(null);
  const [activeQuoteNotices, setActiveQuoteNotices] = useState<CotizacionNotices | null>(null);
  const [isQuoteHistoryOpen, setIsQuoteHistoryOpen] = useState(false);

  // Prefacturas: la que se está editando en el Cotizador, contador de pendientes y clave de recarga del módulo
  const [editingQuote, setEditingQuote] = useState<{ id: string; quoteNumber: string } | null>(null);
  const [prefacturasPending, setPrefacturasPending] = useState(0);
  const [prefacturasRefreshKey, setPrefacturasRefreshKey] = useState(0);

  // Orden activa que se está cobrando/facturando en Caja
  const [orderToInvoice, setOrderToInvoice] = useState<SaleRecord | null>(null);

  // Toast de retroalimentación de orden enviada
  const [orderSentToast, setOrderSentToast] = useState<{ orderNumber: string; itemCount: number } | null>(null);

  // Historial de ventas
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const currentVersion = localStorage.getItem('kodelocal_data_version');
      if (currentVersion !== '2026_zero_stock_v3') return [];
      const saved = localStorage.getItem('kodelocal_sales');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });
  const [ventasSearch, setVentasSearch] = useState('');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<SaleRecord | null>(null);

  // Filtros para la vista de Órdenes en Bodega
  const [bodegaOrdenesFilter, setBodegaOrdenesFilter] = useState<BodegaOrdenesFilter>('ALL');
  const [bodegaOrdenesSearch, setBodegaOrdenesSearch] = useState('');

  // Clientes
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilterType, setCustomerFilterType] = useState<CustomerFilterType>('TODOS');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [isSyncingCustomers, setIsSyncingCustomers] = useState(false);

  // Formulario de Cliente (Estilo Mecanic OS para FC y CCF)
  const [custTipoPersona, setCustTipoPersona] = useState<TipoPersona>('NATURAL');
  const [custName, setCustName] = useState('');
  const [custNombreComercial, setCustNombreComercial] = useState('');
  const [custTipoDocumento, setCustTipoDocumento] = useState<TipoDocumentoCliente>('DUI');
  const [custNumDocumento, setCustNumDocumento] = useState('');
  const [custNrc, setCustNrc] = useState('');
  const [custGiro, setCustGiro] = useState(GIROS_COMUNES_SV[0]);
  const [custCategoria, setCustCategoria] = useState<CategoriaContribuyente>('OTRO');
  const [custDocumentoPreferido, setCustDocumentoPreferido] = useState<'01' | '03' | 'TICKET'>('01');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custDepartamento, setCustDepartamento] = useState('San Salvador');
  const [custMunicipio, setCustMunicipio] = useState('San Salvador Centro');
  const [custDireccion, setCustDireccion] = useState('');
  const [custNotas, setCustNotas] = useState('');
  const [custSpecialEssencePrice, setCustSpecialEssencePrice] = useState('');
  const [custSpecialHalfEssencePrice, setCustSpecialHalfEssencePrice] = useState('');
  const [custSpecialBottlePrice, setCustSpecialBottlePrice] = useState('');
  const [custTierId, setCustTierId] = useState("");
  const [custCustomDiscountPct, setCustCustomDiscountPct] = useState<string>("");
  const [custBottleTierId, setCustBottleTierId] = useState("");
  const [custBottleCustomDiscountPct, setCustBottleCustomDiscountPct] = useState<string>("");
  const [custSuppliesTierId, setCustSuppliesTierId] = useState("");
  const [custSuppliesCustomDiscountPct, setCustSuppliesCustomDiscountPct] = useState<string>("");

  const [customerTiers, setCustomerTiers] = useState<any[]>([]);

  // Modal de Ficha e Historial Unificado de Cliente
  const [isCustomerDetailModalOpen, setIsCustomerDetailModalOpen] = useState(false);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<CustomerRecord | null>(null);

  const handleOpenCustomerDetailModal = (cust: CustomerRecord) => {
    setSelectedCustomerForDetail(cust);
    setIsCustomerDetailModalOpen(true);
  };
  // Carrito de ventas
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Esencias para Perfume');
  const [selectedGender, setSelectedGender] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  
  // Modal de Cobro
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('01');
  
  // Datos de cliente en venta activa
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [clienteDoc, setClienteDoc] = useState('');
  const [clienteNrc, setClienteNrc] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteGiro, setClienteGiro] = useState('');
  const [clienteDepartamento, setClienteDepartamento] = useState('San Salvador');
  const [clienteMunicipio, setClienteMunicipio] = useState('San Salvador Centro');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [isTransmittingDteId, setIsTransmittingDteId] = useState<string | null>(null);

  // Estado de Envío a Domicilio en Orden Actual POS
  const [isOrderDomicilio, setIsOrderDomicilio] = useState(false);
  const [domicilioPhone, setDomicilioPhone] = useState('');
  const [domicilioDepartment, setDomicilioDepartment] = useState('San Salvador');
  const [domicilioMunicipality, setDomicilioMunicipality] = useState('San Salvador');
  const [domicilioAddress, setDomicilioAddress] = useState('');
  const [domicilioReference, setDomicilioReference] = useState('');

  // Buscador interactivo de clientes en Carrito (Combobox)
  const [cartCustomerQuery, setCartCustomerQuery] = useState('');
  const [isCartCustomerDropdownOpen, setIsCartCustomerDropdownOpen] = useState(false);

  const selectedCustomerObj = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const filteredCartCustomers = useMemo(() => {
    if (!cartCustomerQuery.trim()) {
      return customers.slice(0, 10);
    }
    const q = cartCustomerQuery.toLowerCase().trim();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      (c.nombreComercial && c.nombreComercial.toLowerCase().includes(q)) ||
      (c.numDocumento && c.numDocumento.toLowerCase().includes(q)) ||
      (c.nrc && c.nrc.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, cartCustomerQuery]);

  // Proceso de emisión
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);

  // Edición rápida de producto desde POS
  const [isEditingProductOpen, setIsEditingProductOpen] = useState(false);
  const [editingProductInPos, setEditingProductInPos] = useState<ProductItem | null>(null);
  const [isSavingProductInPos, setIsSavingProductInPos] = useState(false);

  // Monitoreo y auto-sincronización de cola offline
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  const handleFlushOfflineQueue = async () => {
    if (isSyncingOffline) return;
    setIsSyncingOffline(true);
    try {
      const res = await flushOfflineQueue((freshProds) => {
        setProducts(freshProds);
      });
      if (res.synced > 0) {
        alert(`✅ Sincronización exitosa: ${res.synced} venta${res.synced > 1 ? 's' : ''} enviada${res.synced > 1 ? 's' : ''} a la base de datos.`);
      } else if (res.failed > 0) {
        alert(`⚠️ No se pudo sincronizar la venta offline: ${res.lastError || 'Fallo de conexión o validación'}. Se mantendrá en cola para reintentar.`);
      }
    } catch (err: any) {
      alert(`Error al sincronizar: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsSyncingOffline(false);
    }
  };

  
  // NUEVO: Sincronización obligatoria al abrir el POS si hay internet
    useEffect(() => {
    if (typeof navigator !== 'undefined') {
      if (navigator.onLine) {
        fetch('/api/products')
          .then(res => res.json())
          .then(data => {
            if (data.success && Array.isArray(data.products)) {
              setProducts(data.products);
              localStorage.setItem('kodelocal_products', JSON.stringify(data.products));
            } else {
              setProducts(getStoredProducts());
            }
            return getStaffToken().then(staffToken =>
              fetch('/api/customers', {
                headers: {
                  ...(staffToken ? { 'x-staff-token': staffToken } : {}),
                },
              })
            );
          })
          .then(res => res?.json())
          .then(data => {
            if (data && data.success && Array.isArray(data.customers)) {
              setCustomers(data.customers);
              localStorage.setItem('kodelocal_customers', JSON.stringify(data.customers));
            } else {
              const savedCust = localStorage.getItem('kodelocal_customers');
              if (savedCust) setCustomers(JSON.parse(savedCust));
            }
          })
          .catch(err => {
            console.error('Error sincronizando iniciales:', err);
            setProducts(getStoredProducts());
            const savedCust = localStorage.getItem('kodelocal_customers');
            if (savedCust) setCustomers(JSON.parse(savedCust));
          })
          .finally(() => setIsInitializing(false));
      } else {
        setProducts(getStoredProducts());
        const savedCust = localStorage.getItem('kodelocal_customers');
        if (savedCust) {
          try { setCustomers(JSON.parse(savedCust)); } catch(e) {}
        }
        setIsInitializing(false);
      }
    }
  }, []);


  // Auto-Sincronización Silenciosa cada 3 minutos (Evita ceguera ante Ecommerce)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        fetch('/api/products')
          .then(res => res.json())
          .then(data => {
            if (data.success && Array.isArray(data.products)) {
              setProducts(data.products);
              localStorage.setItem('kodelocal_products', JSON.stringify(data.products));
            }
          })
          .catch(() => {});
      }
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    setOfflineQueueCount(getOfflineQueueCount());
    const handleQueueChange = (e: any) => {
      setOfflineQueueCount(e.detail?.count ?? getOfflineQueueCount());
    };
    window.addEventListener('kodelocal_offline_queue_updated', handleQueueChange);
    const cleanup = initOfflineSync((freshProds) => {
      setProducts(freshProds);
    });
    return () => {
      window.removeEventListener('kodelocal_offline_queue_updated', handleQueueChange);
      cleanup();
    };
  }, []);

  // Guardar productos en localStorage
  useEffect(() => {
    localStorage.setItem('kodelocal_products', JSON.stringify(products));
  }, [products]);

  // Guardar clientes en localStorage
  

  // Sincronizar en tiempo real los cambios de pedidos realizados en bodega o caja
  useEffect(() => {
    const handleSalesUpdate = () => {
      const saved = localStorage.getItem('kodelocal_sales');
      if (saved) {
        try { setSales(JSON.parse(saved)); } catch (e) {}
      }
    };
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'kodelocal_sales' && e.newValue) {
        try { setSales(JSON.parse(e.newValue)); } catch (e) {}
      }
    };
    window.addEventListener('kodelocal_sales_updated', handleSalesUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('kodelocal_sales_updated', handleSalesUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const refreshCustomerTiers = async () => {
    try {
      const res = await fetch("/api/customers/tiers");
      const data = await res.json();
      if (data.success && Array.isArray(data.tiers)) {
        setCustomerTiers(data.tiers);
      }
    } catch (e) { console.error("Error fetching tiers", e); }
  };

  const refreshCustomers = async () => {
    setIsSyncingCustomers(true);
    try {
      const staffToken = await getStaffToken().catch(() => null);
      const res = await fetch('/api/customers', {
        headers: {
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.customers) && data.customers.length > 0) {
        setCustomers(data.customers);
        saveStoredCustomers(data.customers);
      }
    } catch (err) {
      console.error('Error sincronizando clientes con Supabase:', err);
    } finally {
      setIsSyncingCustomers(false);
    }
  };

  useEffect(() => {
    refreshCustomers();
    refreshCustomerTiers();

  }, []);

  useEffect(() => {
    if (posTab === 'clientes') {
      refreshCustomers();
    refreshCustomerTiers();

    }
  }, [posTab]);

  // Contador de prefacturas pendientes (insignia del menú lateral)
  useEffect(() => {
    refreshPrefacturasCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posTab]);

  useEffect(() => {
    fetch('/api/products?fresh=true', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          localStorage.setItem('kodelocal_products', JSON.stringify(data.products));
        }
      })
      .catch(err => console.error('Error sincronizando productos con Supabase:', err));

    const handleProductsUpdate = () => {
      setProducts(getStoredProducts());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'kodelocal_products') {
        setProducts(getStoredProducts());
      }
    };

    window.addEventListener('kodelocal_products_updated', handleProductsUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('kodelocal_products_updated', handleProductsUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const syncSalesFromServer = React.useCallback(() => {
    getStaffToken().then(staffToken => {
      fetch('/api/ecommerce/orders', {
        headers: {
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
      })
        .then(res => res.json())
        .then(data => {
        if (data.success && Array.isArray(data.orders)) {
          // Solo cargar en la cola pedidos con pago confirmado (autorización de Wompi) o transferencias válidas
          const validOrders = data.orders.filter((o: any) => {
            if (o.orderStatus === 'CANCELADO') return false;
            if (o.paymentMethod === 'CARD' && o.paymentStatus !== 'COMPLETED') return false;
            return true;
          });

          const webSales: SaleRecord[] = validOrders.map((o: any) => {
            const noteDocMatch = o.notes?.match(/Doc:\s*(01|03|TICKET)/i);
            const explicitDoc = noteDocMatch ? (noteDocMatch[1].toUpperCase() as '01' | '03' | 'TICKET') : null;
            const resolvedDoc: '01' | '03' | 'TICKET' = explicitDoc === '03' || o.customer?.nrc ? '03' : '01';

            const dteDoc = o.sale?.dteDocument;
            const dteInfo = dteDoc ? {
              codigoGeneracion: dteDoc.codigoGeneracion,
              numeroControl: dteDoc.numeroControl,
              selloRecepcion: dteDoc.selloRecepcion,
              estado: dteDoc.estado,
              simulated: dteDoc.estado === 'SIMULADO',
              mensaje: dteDoc.mensajeRespuesta,
              mhDteUrl: dteDoc.mhDteUrl,
              pdfUrl: `/api/dte/${dteDoc.codigoGeneracion}/pdf`,
              jsonUrl: `/api/dte/${dteDoc.codigoGeneracion}/json`,
              fhProcesamiento: dteDoc.fhProcesamiento,
            } : undefined;

            return {
              id: o.id,
              saleNumber: o.orderNumber,
              orderNumber: o.orderNumber,
              createdAt: o.createdAt,
              invoicedAt: dteDoc?.fhProcesamiento || dteDoc?.createdAt || o.sale?.createdAt || undefined,
              channel: 'ONLINE',
              total: Number(o.total || 0),
              subtotal: Number(o.subtotal || 0),
              ivaTotal: 0,
              shippingCost: Number(o.shippingCost || 0),
              paymentMethod: o.paymentMethod || 'CARD',
              paymentStatus: o.paymentStatus || 'COMPLETED',
              notes: o.notes || undefined,
              deliveryNotes: o.deliveryReference ? `Entrega: ${o.shippingAddress} (Ref: ${o.deliveryReference})` : `Entrega: ${o.shippingAddress}`,
              status: o.orderStatus === 'NUEVO' || o.orderStatus === 'EN_PREPARACION'
                ? 'PENDING_PREPARATION'
                : o.orderStatus === 'EN_RUTA'
                ? 'READY_AT_WINDOW'
                : 'COMPLETED',
              vendedor: 'Tienda Online (aromaniaksv.com)',
              tipoComprobante: resolvedDoc,
              cliente: {
                id: o.customerId || o.customer?.id || undefined,
                nombre: (resolvedDoc === '03' && o.customer?.businessName) ? o.customer.businessName : o.customerName,
                telefono: o.customerPhone || o.customer?.phone,
                correo: o.customerEmail || o.customer?.email || undefined,
                direccion: o.customer?.address || `${o.shippingAddress}, ${o.municipality}, ${o.department}`,
                numDocumento: o.customer?.documentNum || undefined,
                nrc: o.customer?.nrc || undefined,
                actividadEconomica: o.customer?.activityDesc || undefined,
                departamento: o.customer?.department || o.department,
                municipio: o.customer?.municipality || o.municipality,
              } as any,
              items: [
                ...o.items.map((it: any) => ({
                  productId: it.productId,
                  name: `${it.productName} (${it.presentation})`,
                  quantity: it.quantity,
                  price: Number(it.unitPrice || 0),
                  total: Number(it.total || 0),
                  unit: it.presentation,
                  puesto: it.product?.puesto || 'A1',
                })),
                ...(Number(o.shippingCost || 0) > 0 ? [{
                  productId: 'ENVIO-DOM',
                  name: 'Servicio de Envío a Domicilio',
                  quantity: 1,
                  price: Number(o.shippingCost),
                  total: Number(o.shippingCost),
                  unit: 'Servicio',
                  tipoItem: 2,
                  puesto: 'LOG'
                }] : [])
              ],
              dteInfo,
            };
          });

          setSales(prev => {
            const updatedWebSales = webSales.map(ws => {
              const prevMatch = prev.find(p => p.saleNumber === ws.saleNumber || p.id === ws.id);
              if (prevMatch) {
                return {
                  ...ws,
                  dteInfo: ws.dteInfo || prevMatch.dteInfo,
                  invoicedAt: ws.invoicedAt || prevMatch.invoicedAt || prevMatch.dteInfo?.fhProcesamiento,
                  status: prevMatch.status || ws.status,
                };
              }
              return ws;
            });

            const localNonWeb = prev.filter(s => s.channel !== 'ONLINE' && !updatedWebSales.some(w => w.saleNumber === s.saleNumber));
            const merged = [...updatedWebSales, ...localNonWeb];
            if (typeof window !== 'undefined') {
              localStorage.setItem('kodelocal_sales', JSON.stringify(merged));
            }
            return merged;
          });
        }
      })
      .catch(err => console.error('Error sincronizando pedidos ecommerce en POS:', err));
    });

    // Cargar historial de ventas y DTEs oficiales registrados en la base de datos Supabase
    getStaffToken().then(staffToken => {
      fetch('/api/sales?limit=100', {
        headers: {
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.sales)) {
            const dbSales: SaleRecord[] = data.sales.map((s: any) => {
              let parsedClient: any = null;
              let parsedTipo: any = s.tipoComprobante;
              let parsedIsDomicilio = false;
              let parsedDomicilio: any = undefined;
              if (s.notes && s.notes.startsWith('{')) {
                try {
                  const lastBrace = s.notes.lastIndexOf('}');
                  const jsonPart = lastBrace !== -1 ? s.notes.slice(0, lastBrace + 1) : s.notes;
                  const pNotes = JSON.parse(jsonPart);
                  if (pNotes?.cliente) parsedClient = pNotes.cliente;
                  if (!parsedTipo && pNotes?.tipoComprobante) parsedTipo = pNotes.tipoComprobante;
                  if (pNotes?.isDomicilio || pNotes?.domicilio?.isDomicilio) {
                    parsedIsDomicilio = true;
                  }
                  if (pNotes?.domicilio) {
                    parsedDomicilio = pNotes.domicilio;
                  }
                } catch (_) {}
              }
              const hasEnvioDomItem = Array.isArray(s.items) && s.items.some((it: any) =>
                it.productId === 'ENVIO-DOM' ||
                String(it.productName || '').toLowerCase().includes('servicio de envío')
              );
              const firstShipment = Array.isArray(s.shipments) && s.shipments.length > 0 ? s.shipments[0] : null;
              if (hasEnvioDomItem || firstShipment) {
                parsedIsDomicilio = true;
              }
              const resolvedTipo: '01' | '03' | 'TICKET' =
                parsedTipo === '03'
                  ? '03'
                  : (s.customer?.nrc || parsedClient?.nrc ? '03' : '01');

              const isCancelledSale = ['CANCELLED', 'CANCELADO', 'ANULADA'].includes(String(s.orderStatus || '').toUpperCase());
              const hasProcessedDte = s.dteDocument?.estado === 'PROCESADO' && !isCancelledSale;

              return {
                id: s.id,
                saleNumber: s.saleNumber,
                orderNumber: s.saleNumber,
                createdAt: s.createdAt,
                invoicedAt: s.dteDocument?.fhProcesamiento || s.dteDocument?.createdAt || ((s.orderStatus === 'COMPLETED' || s.paymentStatus === 'COMPLETED') && !isCancelledSale ? (s.updatedAt || s.createdAt) : undefined),
                channel: s.channel || 'POS',
                total: Number(s.total || 0),
                subtotal: Number(s.subtotal || 0),
                ivaTotal: Number(s.ivaTotal || 0),
                shippingCost: Number(s.shippingCost || 0),
                paymentMethod: s.paymentMethod || 'CASH',
                paymentStatus: hasProcessedDte ? 'COMPLETED' : (s.paymentStatus || 'COMPLETED'),
                status: hasProcessedDte ? 'COMPLETED' : (s.orderStatus || 'COMPLETED'),
                tipoComprobante: resolvedTipo,
                cajero: s.cashierName || getActiveSessionUI().name,
                vendedor: s.sellerName || 'Mostrador',
                isDomicilio: parsedIsDomicilio,
                domicilio: parsedIsDomicilio ? {
                  isDomicilio: true,
                  customerName: parsedDomicilio?.customerName || parsedClient?.nombre || s.customer?.name || 'Consumidor Final',
                  customerPhone: parsedDomicilio?.customerPhone || parsedClient?.telefono || s.customer?.phone || firstShipment?.phone || undefined,
                  customerEmail: parsedDomicilio?.customerEmail || parsedClient?.correo || s.customer?.email || undefined,
                  department: parsedDomicilio?.department || parsedClient?.departamento || s.customer?.department || firstShipment?.department || 'San Salvador',
                  municipality: parsedDomicilio?.municipality || parsedClient?.municipio || s.customer?.municipality || firstShipment?.municipality || 'San Salvador',
                  shippingAddress: parsedDomicilio?.shippingAddress || parsedClient?.direccion || s.customer?.address || firstShipment?.address || undefined,
                  deliveryReference: parsedDomicilio?.deliveryReference || parsedClient?.referencia || undefined,
                  trackingNumber: parsedDomicilio?.trackingNumber || firstShipment?.trackingNumber || undefined,
                  courierName: parsedDomicilio?.courierName || firstShipment?.carrier || undefined,
                  domicilioStatus: parsedDomicilio?.domicilioStatus || (firstShipment?.trackingNumber ? 'EN_RUTA' : 'PENDIENTE'),
                } : undefined,
                cliente: {
                  id: s.customerId || s.customer?.id || parsedClient?.id,
                  nombre:
                    parsedClient?.nombre && parsedClient.nombre !== 'Consumidor Final'
                      ? parsedClient.nombre
                      : s.customer?.name || 'Consumidor Final',
                  numDocumento: parsedClient?.numDocumento || s.customer?.documentNum || undefined,
                  nrc: s.customer?.nrc || parsedClient?.nrc || undefined,
                  correo: s.customer?.email || parsedClient?.correo || undefined,
                  telefono: parsedClient?.telefono || s.customer?.phone || undefined,
                  direccion: parsedClient?.direccion || s.customer?.address || undefined,
                  departamento: parsedClient?.departamento || s.customer?.department || undefined,
                  municipio: parsedClient?.municipio || s.customer?.municipality || undefined,
                  actividadEconomica: s.customer?.activityDesc || parsedClient?.actividadEconomica || undefined,
                },
                items: (s.items || []).map((it: any) => ({
                  productId: it.productId,
                  name: it.productName,
                  quantity: it.quantity,
                  price: Number(it.unitPrice || 0),
                  total: Number(it.total || 0),
                  unit: it.unit || 'Unidad',
                })),
                dteInfo: s.dteDocument ? {
                  codigoGeneracion: s.dteDocument.codigoGeneracion,
                  numeroControl: s.dteDocument.numeroControl,
                  selloRecepcion: s.dteDocument.selloRecepcion,
                  estado: s.dteDocument.estado,
                  simulated: s.dteDocument.estado === 'SIMULADO',
                  mensaje: s.dteDocument.mensajeRespuesta,
                  mhDteUrl: s.dteDocument.mhDteUrl,
                  pdfUrl: `/api/dte/${s.dteDocument.codigoGeneracion}/pdf`,
                  jsonUrl: `/api/dte/${s.dteDocument.codigoGeneracion}/json`,
                  fhProcesamiento: s.dteDocument.fhProcesamiento,
                } : undefined,
              };
            });

            setSales(prev => {
              const mergedMap = new Map<string, SaleRecord>();
              dbSales.forEach(s => mergedMap.set(s.saleNumber, s));
              const queuedNumbers = new Set(getOfflineSalesQueue().map(q => q.saleNumber));
              prev.forEach(p => {
                if (!mergedMap.has(p.saleNumber)) {
                  const isFresh = Date.now() - new Date(p.createdAt).getTime() < 2 * 60 * 1000;
                  if (p.channel === 'ONLINE' || isFresh || queuedNumbers.has(p.saleNumber)) {
                    mergedMap.set(p.saleNumber, p);
                  }
                } else {
                  const existing = mergedMap.get(p.saleNumber)!;
                  if (!existing.dteInfo && p.dteInfo) {
                    existing.dteInfo = p.dteInfo;
                  }
                  if (p.channel === 'ONLINE') {
                    existing.channel = 'ONLINE';
                    if (p.createdAt) {
                      existing.invoicedAt = existing.invoicedAt || existing.createdAt;
                      existing.createdAt = p.createdAt;
                    }
                  }
                  if (!existing.deliveryNotes && p.deliveryNotes) {
                    existing.deliveryNotes = p.deliveryNotes;
                  }
                  if (p.cliente) {
                    existing.cliente = {
                      ...p.cliente,
                      ...existing.cliente,
                      nombre:
                        existing.cliente?.nombre && existing.cliente.nombre !== 'Consumidor Final'
                          ? existing.cliente.nombre
                          : p.cliente.nombre || 'Consumidor Final',
                      telefono: existing.cliente?.telefono || p.cliente.telefono,
                      correo: existing.cliente?.correo || p.cliente.correo,
                      direccion: existing.cliente?.direccion || p.cliente.direccion,
                      departamento: (existing.cliente as any)?.departamento || (p.cliente as any)?.departamento,
                      municipio: (existing.cliente as any)?.municipio || (p.cliente as any)?.municipio,
                    } as any;
                  }
                }
              });
              const merged = Array.from(mergedMap.values());
              if (typeof window !== 'undefined') {
                localStorage.setItem('kodelocal_sales', JSON.stringify(merged));
              }
              return merged;
            });
          }
        })
        .catch(err => console.error('Error cargando ventas desde DB:', err));
    });
  }, []);

  // Carga inicial de ventas/pedidos desde el servidor
  useEffect(() => {
    syncSalesFromServer();
  }, [syncSalesFromServer]);

  // Sincronización entre dispositivos: Supabase Realtime + polling de respaldo
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let productsTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshProductsFromServer = () => {
      fetch('/api/products?fresh=true', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
            localStorage.setItem('kodelocal_products', JSON.stringify(data.products));
          }
        })
        .catch(() => {});
    };

    // Agrupa ráfagas de eventos (una venta toca varias filas) en una sola recarga
    const scheduleSalesSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        syncSalesFromServer();
        refreshCustomers();
      }, 600);
    };
    const scheduleProductsSync = () => {
      if (productsTimer) clearTimeout(productsTimer);
      productsTimer = setTimeout(() => refreshProductsFromServer(), 600);
    };

    const channel = supabase
      .channel('pos-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Sale' }, scheduleSalesSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'EcommerceOrder' }, scheduleSalesSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Customer' }, () => refreshCustomers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Product' }, scheduleProductsSync)
      .subscribe();

    // Respaldo cada 30 s por si Realtime se desconecta o la tabla no está publicada
    const intervalId = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine && document.visibilityState === 'visible') {
        syncSalesFromServer();
      }
    }, 30 * 1000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncSalesFromServer();
        refreshProductsFromServer();
        refreshCustomers();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (productsTimer) clearTimeout(productsTimer);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      supabase.removeChannel(channel);
    };
  }, [syncSalesFromServer]);

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(product => {
      const matchesCat =
        selectedCategory === 'Todos' ||
        product.category === selectedCategory ||
        ((selectedCategory === 'Empaque' || selectedCategory === 'Insumos y Materia Prima') &&
          product.id === 'caja-carton-generica');
      const matchesGender = 
        selectedGender === 'Todos' || 
        (product.gender && product.gender.toLowerCase() === selectedGender.toLowerCase());
      const matchesQuery = 
        !q ||
        product.sku.toLowerCase() === q ||
        product.name.toLowerCase().includes(q) ||
        (product.officialName && product.officialName.toLowerCase().includes(q)) ||
        (product.brand && product.brand.toLowerCase().includes(q)) ||
        (product.puesto && product.puesto.toLowerCase().includes(q)) ||
        product.barcode.includes(q);

      return matchesCat && matchesGender && matchesQuery;
    });
  }, [products, selectedCategory, selectedGender, searchQuery]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, 60);
  }, [filteredProducts]);

  // Precios dinámicos de esencias en POS
  const sampleEssence = useMemo(() => {
    return products.find(p => p.category === 'Esencias para Perfume');
  }, [products]);

  // Extraer el cliente activo (si existe y tiene precios especiales)
  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  const activeEssencePrice = activeCustomer?.specialEssencePrice 
    ? Number(activeCustomer.specialEssencePrice) 
    : (sampleEssence?.price ?? 3.75);
    
  const activeEssenceHalfPrice = activeCustomer?.specialHalfEssencePrice
    ? Number(activeCustomer.specialHalfEssencePrice)
    : (sampleEssence?.priceHalfOunce != null 
      ? Number(sampleEssence.priceHalfOunce) 
      : 1.90); 
  const activeBottlePrice = activeCustomer?.specialBottlePrice ? Number(activeCustomer.specialBottlePrice) : null;


  // Helper para formatear items de venta/comanda con presentación
  const getItemPriceDetails = (item: CartItem) => {
    let listPrice = item.product.price;
    const cat = item.product.category || '';
    const isEssence = cat === "Esencias para Perfume" || cat === "Esencias & Fragancias" || (!cat && item.product.unit === 'Onza');
    const isBottle = !isEssence && (cat === "Botes" || cat === "Botes & Envases" || cat === "Envases & Botes" || item.product.name.toLowerCase().startsWith('bote') || item.product.name.toLowerCase().includes('frasco'));
    const isLogistics = cat === "Logística" || cat === "Logistica" || item.product.id === "ENVIO-DOM" || item.product.unit === "Servicio";

    if (isEssence && isHalloweenPromoProduct(item.product)) {
      if (item.presentation === "MEDIA_ONZA") {
        const regularHalf = item.product.priceHalfOunce != null
          ? Number(item.product.priceHalfOunce)
          : Number((item.product.price / 2).toFixed(2));
        const finalPrice = HALLOWEEN_PROMO_PRICE_HALF_OZ;
        const discountAmt = Number(Math.max(0, regularHalf - finalPrice).toFixed(4));
        return { listPrice: regularHalf, finalPrice, discountAmt };
      } else {
        const regularFull = Number(item.product.price);
        const finalPrice = HALLOWEEN_PROMO_PRICE_1OZ;
        const discountAmt = Number(Math.max(0, regularFull - finalPrice).toFixed(4));
        return { listPrice: regularFull, finalPrice, discountAmt };
      }
    }

    if (item.presentation === "MEDIA_ONZA") {
      if (isEssence && activeCustomer?.specialHalfEssencePrice != null && Number(activeCustomer.specialHalfEssencePrice) > 0) {
        listPrice = Number(activeCustomer.specialHalfEssencePrice);
      } else if (item.product.priceHalfOunce != null) {
        listPrice = Number(item.product.priceHalfOunce);
      } else {
        listPrice = Number((listPrice / 2).toFixed(2));
      }
    } else {
      if (isEssence && activeCustomer?.specialEssencePrice != null && Number(activeCustomer.specialEssencePrice) > 0) {
        listPrice = Number(activeCustomer.specialEssencePrice);
      } else if (isBottle && activeCustomer?.specialBottlePrice != null && Number(activeCustomer.specialBottlePrice) > 0) {
        listPrice = Number(activeCustomer.specialBottlePrice);
      }
    }

    let finalPrice = listPrice;
    let discountAmt = 0;

    const activeCategoryTier = isLogistics
      ? null
      : isEssence
      ? activeCustomer?.tier
      : isBottle
      ? activeCustomer?.bottleTier
      : activeCustomer?.suppliesTier;
    const activeCategoryCustomPct = isLogistics
      ? null
      : isEssence
      ? activeCustomer?.customDiscountPct
      : isBottle
      ? activeCustomer?.bottleCustomDiscountPct
      : activeCustomer?.suppliesCustomDiscountPct;

    let appliedPct = 0;
    if (activeCategoryTier) {
      if (activeCategoryTier.name === 'Personalizado' && activeCategoryCustomPct) {
        appliedPct = Number(activeCategoryCustomPct);
      } else if (activeCategoryTier.discountPct) {
        appliedPct = Number(activeCategoryTier.discountPct);
      }
    } else if (activeCategoryCustomPct && Number(activeCategoryCustomPct) > 0) {
      appliedPct = Number(activeCategoryCustomPct);
    }

    if (appliedPct > 0) {
      discountAmt = Number((listPrice * (appliedPct / 100)).toFixed(4));
      finalPrice = Number((listPrice - discountAmt).toFixed(2));
    }
    return { listPrice, finalPrice, discountAmt };
  };

  const getItemUnitPrice = (item: CartItem): number => getItemPriceDetails(item).finalPrice;

  const formatCartItem = (i: CartItem) => {
    const isHalfOz = i.presentation === 'MEDIA_ONZA';
    const details = getItemPriceDetails(i);
    const displayName = i.product.officialName && i.product.officialName !== i.product.name
      ? `${i.product.officialName} (${i.product.name})`
      : i.product.name;
    return {
      productId: i.product.id,
      name: isHalfOz ? `${displayName} (½ Oz)` : displayName,
      quantity: i.quantity,
      price: details.finalPrice,
      listPrice: details.listPrice,
      discountAmt: details.discountAmt,
      total: Number((i.quantity * details.finalPrice).toFixed(2)),
      unit: isHalfOz ? '½ Onza' : (i.product.unit || 'Unidad'),
      presentation: i.presentation || 'ONZA_COMPLETA',
      puesto: i.product.puesto
    };
  };

  // Totales del carrito
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (getItemUnitPrice(item) * item.quantity), 0);
  }, [cart, selectedCustomerId, customers]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const ivaCalculado = useMemo(() => {
    return (cartSubtotal - (cartSubtotal / 1.13));
  }, [cartSubtotal]);

  const subtotalNeto = useMemo(() => {
    return cartSubtotal / 1.13;
  }, [cartSubtotal]);

  // --- CÁLCULOS DE VENTAS Y ONZAS VENDIDAS EN EL DÍA ---
  const totalOnzasVendidas = useMemo(() => {
    return sales.reduce((sum, sale) => {
      const ozInSale = sale.items
        .filter(it => it.unit === 'Onza' || it.name.includes('Esencia') || it.name.includes('Elixir') || it.unit === 'Oz')
        .reduce((s, it) => s + it.quantity, 0);
      return sum + ozInSale;
    }, 0);
  }, [sales]);

  const totalBotesVendidos = useMemo(() => {
    return sales.reduce((sum, sale) => {
      const botesInSale = sale.items
        .filter(it => it.name.toLowerCase().includes('bote') || it.name.toLowerCase().includes('frasco') || it.name.toLowerCase().includes('atomizador'))
        .reduce((s, it) => s + it.quantity, 0);
      return sum + botesInSale;
    }, 0);
  }, [sales]);

  const totalMontoVentas = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  // Ranking de fragancias en onzas vendidas
  const rankingFragancias = useMemo(() => {
    const map: Record<string, { name: string; onzas: number; totalMonto: number; sku?: string }> = {};
    sales.forEach(sale => {
      sale.items.forEach(it => {
        const isOz = it.unit === 'Onza' || it.name.includes('Esencia') || it.name.includes('Elixir') || it.unit === 'Oz';
        if (isOz) {
          const key = it.productId || it.name;
          if (!map[key]) {
            const prod = products.find(p => p.id === it.productId);
            map[key] = { name: it.name, onzas: 0, totalMonto: 0, sku: prod?.sku };
          }
          map[key].onzas += it.quantity;
          map[key].totalMonto += it.total;
        }
      });
    });
    return Object.values(map).sort((a, b) => b.onzas - a.onzas);
  }, [sales, products]);

  // Métricas de órdenes procesadas en Bodega
  const pendingPreparationCount = useMemo(() => {
    return sales.filter(s => s.status === 'PENDING_PREPARATION' || !s.status).length;
  }, [sales]);

  const readyInWindowCount = useMemo(() => {
    return sales.filter(s => s.status === 'READY_AT_WINDOW').length;
  }, [sales]);

  const completedOrdersCount = useMemo(() => {
    return sales.filter(s => s.status === 'COMPLETED').length;
  }, [sales]);

  // Filtrado de órdenes en bodega para la vista de POS
  const filteredBodegaOrders = useMemo(() => {
    return sales.filter(s => {
      const isPending = s.status === 'PENDING_PREPARATION' || !s.status;
      const isReady = s.status === 'READY_AT_WINDOW';
      const isCompleted = s.status === 'COMPLETED';

      // "Todos" muestra solo pedidos activos; los entregados se ven en la pestaña "Entregados"
      if (bodegaOrdenesFilter === 'ALL' && isCompleted) return false;
      if (bodegaOrdenesFilter === 'PENDING' && !isPending) return false;
      if (bodegaOrdenesFilter === 'READY' && !isReady) return false;
      if (bodegaOrdenesFilter === 'COMPLETED' && !isCompleted) return false;

      if (!bodegaOrdenesSearch.trim()) return true;
      const q = bodegaOrdenesSearch.toLowerCase().trim();
      return (
        s.saleNumber.toLowerCase().includes(q) ||
        (s.cliente?.nombre && s.cliente.nombre.toLowerCase().includes(q)) ||
        (s.vendedor && s.vendedor.toLowerCase().includes(q)) ||
        s.items.some(it => it.name.toLowerCase().includes(q))
      );
    });
  }, [sales, bodegaOrdenesFilter, bodegaOrdenesSearch]);

  const handleMarkOrderReadyFromPos = async (orderId: string) => {
    const targetSale = sales.find(s => s.id === orderId || s.saleNumber === orderId);
    try {
      const staffToken = await getStaffToken();
      if (!targetSale || targetSale.channel === "ONLINE") {
        fetch("/api/ecommerce/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(staffToken ? { "x-staff-token": staffToken } : {}),
          },
          body: JSON.stringify({ orderId, orderNumber: targetSale?.orderNumber || targetSale?.saleNumber, orderStatus: "EN_RUTA" }),
        }).catch(err => console.error(err));
      }
      if (!targetSale || targetSale.channel !== "ONLINE") {
        fetch("/api/sales", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(staffToken ? { "x-staff-token": staffToken } : {}),
          },
          body: JSON.stringify({ id: orderId, saleNumber: targetSale?.saleNumber, orderStatus: "READY_AT_WINDOW" }),
        }).catch(() => {});
      }
    } catch (e) {}
    setSales(prev => {
      const updated = prev.map(s => (s.id === orderId || s.saleNumber === orderId) ? { ...s, status: "READY_AT_WINDOW" as const } : s);
      if (typeof window !== 'undefined') {
        localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
      }
      return updated;
    });
    window.dispatchEvent(new Event('kodelocal_sales_updated'));
  };

  const handleCancelReadyOrder = async (order: SaleRecord) => {
    const ordNum = order.orderNumber || order.saleNumber;
    if (!confirm(`¿Estás seguro de anular la orden #${ordNum}?`)) {
      return;
    }

    try {
      const staffToken = await getStaffToken();
      if (order.channel === 'ONLINE') {
        fetch('/api/ecommerce/orders', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(staffToken ? { 'x-staff-token': staffToken } : {}),
          },
          body: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber || order.saleNumber, orderStatus: 'CANCELADO', restock: true }),
        }).catch(err => console.error('Error anulando pedido web:', err));
      } else {
        fetch('/api/sales', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(staffToken ? { 'x-staff-token': staffToken } : {}),
          },
          body: JSON.stringify({
            id: order.id,
            saleNumber: order.saleNumber || order.orderNumber,
            orderStatus: 'CANCELADO',
            restock: false,
          }),
        }).catch(err => console.error('Error anulando comanda en POS:', err));
      }
    } catch (e) {
      console.error('Error al anular orden:', e);
    }

    // Actualizar estado local de la orden a CANCELLED
    setSales(prev => {
      const updated = prev.map(s => {
        if (s.id === order.id || (order.saleNumber && s.saleNumber === order.saleNumber) || (order.orderNumber && s.orderNumber === order.orderNumber)) {
          return { ...s, status: 'CANCELLED' as const };
        }
        return s;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
      }
      return updated;
    });
    window.dispatchEvent(new Event('kodelocal_sales_updated'));
  };

  const handleEditOrderInPos = async (order: SaleRecord) => {
    const ordNum = order.orderNumber || order.saleNumber;
    if (!confirm(`¿Devolver la comanda #${ordNum} al Cotizador para modificarla?\nSe cargarán sus productos y cliente en el carrito y se anulará la comanda anterior.`)) {
      return;
    }

    // 1. Reconstruir ítems en el carrito del Cotizador
    const restoredCart: CartItem[] = [];
    for (const it of order.items || []) {
      if (it.productId === 'ENVIO-DOM' && order.channel === 'ONLINE') continue;
      const cleanName = String(it.name || '')
        .replace(/\s*\(½\s*Oz\)/gi, '')
        .replace(/\s*\(1\s*Onza\)/gi, '')
        .replace(/\s*\(Media\s*Onza\)/gi, '')
        .trim()
        .toLowerCase();

      const matchedProd = products.find(
        p =>
          p.id === it.productId ||
          (p.sku && p.sku === it.productId) ||
          p.name.toLowerCase().trim() === cleanName ||
          (p.officialName && p.officialName.toLowerCase().trim() === cleanName)
      );
      if (!matchedProd) continue;

      const unitLower = String(it.unit || '').toLowerCase();
      const nameLower = String(it.name || '').toLowerCase();
      const isHalf =
        (it as any).presentation === 'MEDIA_ONZA' ||
        unitLower.includes('media') ||
        unitLower.includes('½') ||
        nameLower.includes('media onza') ||
        nameLower.includes('½');
      const isEssence =
        matchedProd.category === 'Esencias para Perfume' ||
        matchedProd.category === 'Esencias & Fragancias' ||
        matchedProd.unit === 'Onza' ||
        unitLower.includes('onza') ||
        unitLower.includes('oz');

      const presentation: 'ONZA_COMPLETA' | 'MEDIA_ONZA' | 'UNIDAD' = isHalf
        ? 'MEDIA_ONZA'
        : isEssence
        ? 'ONZA_COMPLETA'
        : 'UNIDAD';

      restoredCart.push({
        product: matchedProd,
        quantity: Math.max(1, Number(it.quantity || 1)),
        presentation,
      });
    }

    if (restoredCart.length === 0) {
      alert('No se pudieron cargar los productos de esta comanda en el catálogo.');
      return;
    }

    setCart(restoredCart);

    // 2. Restaurar datos del cliente en el Cotizador
    const directId = (order.cliente as any)?.id || (order as any).customerId;
    let matchedCust = directId ? customers.find(c => c.id === directId) : undefined;
    if (!matchedCust) {
      const orderDoc = order.cliente?.numDocumento?.replace(/\D/g, '');
      const orderNrc = order.cliente?.nrc?.replace(/\D/g, '');
      const cleanPhone = order.cliente?.telefono?.replace(/\D/g, '');
      const normName = order.cliente?.nombre?.toLowerCase().trim();
      matchedCust = customers.find(c => {
        if (orderNrc && c.nrc && c.nrc.replace(/\D/g, '') === orderNrc) return true;
        if (orderDoc && orderDoc !== '000000000' && c.numDocumento && c.numDocumento.replace(/\D/g, '') === orderDoc) return true;
        if (cleanPhone && c.phone && c.phone.replace(/\D/g, '') === cleanPhone) return true;
        if (normName && normName !== 'consumidor final' && c.name && c.name.toLowerCase().trim() === normName) return true;
        return false;
      });
    }

    if (matchedCust) {
      handleSelectCustomer(matchedCust.id);
    } else {
      setSelectedCustomerId('');
      setClienteNombre(order.cliente?.nombre || 'Consumidor Final');
      setClienteDoc(order.cliente?.numDocumento || '');
      setClienteNrc(order.cliente?.nrc || '');
      setClienteEmail(order.cliente?.correo || '');
      setClienteGiro(order.cliente?.actividadEconomica || '');
      setClienteDireccion(order.cliente?.direccion || '');
      setClienteDepartamento(order.cliente?.departamento || 'San Salvador');
      setClienteMunicipio(order.cliente?.municipio || 'San Salvador Centro');
    }

    const isDom = Boolean(order.isDomicilio || order.domicilio?.isDomicilio);
    setIsOrderDomicilio(isDom);
    if (isDom) {
      setDomicilioPhone(order.domicilio?.customerPhone || order.cliente?.telefono || matchedCust?.phone || '');
      setDomicilioDepartment(order.domicilio?.department || order.cliente?.departamento || matchedCust?.departamento || 'San Salvador');
      setDomicilioMunicipality(order.domicilio?.municipality || order.cliente?.municipio || matchedCust?.municipio || 'San Salvador');
      setDomicilioAddress(order.domicilio?.shippingAddress || order.cliente?.direccion || matchedCust?.direccion || '');
      setDomicilioReference(order.domicilio?.deliveryReference || '');
    }

    const tipo: TipoComprobante =
      order.tipoComprobante === '03' || order.cliente?.nrc || matchedCust?.nrc ? '03' : '01';
    setTipoComprobante(tipo);

    // 3. Anular la comanda anterior en el servidor y localmente (sin tocar inventario ya que no fue cobrada)
    try {
      const staffToken = await getStaffToken();
      fetch('/api/sales', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          id: order.id,
          saleNumber: order.saleNumber || order.orderNumber,
          orderStatus: 'CANCELADO',
          restock: false,
        }),
      }).catch(err => console.error('Error anulando comanda previa al editar:', err));
    } catch (_) {}

    setSales(prev => {
      const updated = prev.map(s => {
        if (
          s.id === order.id ||
          (order.saleNumber && s.saleNumber === order.saleNumber) ||
          (order.orderNumber && s.orderNumber === order.orderNumber)
        ) {
          return { ...s, status: 'CANCELLED' as const };
        }
        return s;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
      }
      return updated;
    });
    window.dispatchEvent(new Event('kodelocal_sales_updated'));

    // 4. Ir directamente al Cotizador para editar y volver a enviar
    setPosTab('nueva_orden');
  };

  const handleMarkOrderDeliveredFromPos = async (orderId: string) => {
    const targetSale = sales.find(s => s.id === orderId || s.saleNumber === orderId);

    // 1. Sincronizar en la base de datos Supabase para que Bodega en cualquier dispositivo lo vea al instante
    try {
      const staffToken = await getStaffToken();
      if (!targetSale || targetSale.channel === 'ONLINE') {
        fetch('/api/ecommerce/orders', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(staffToken ? { 'x-staff-token': staffToken } : {}),
          },
          body: JSON.stringify({ orderId, orderNumber: targetSale?.orderNumber || targetSale?.saleNumber, orderStatus: 'ENTREGADO' }),
        }).catch(err => console.error('Error sincronizando despacho web desde POS:', err));
      }

      if (!targetSale || targetSale.channel !== 'ONLINE') {
        fetch('/api/sales', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(staffToken ? { 'x-staff-token': staffToken } : {}),
          },
          body: JSON.stringify({ id: orderId, saleNumber: targetSale?.saleNumber, orderStatus: 'COMPLETED' }),
        }).catch(() => {});
      }
    } catch (e) {}

    // 2. Actualizar estado local inmediatamente
    setSales(prev => {
      const updated = prev.map(s => {
        if (s.id === orderId || s.saleNumber === orderId) {
          return { ...s, status: 'COMPLETED' as const };
        }
        return s;
      });
      localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
      window.dispatchEvent(new Event('kodelocal_sales_updated'));
      return updated;
    });
  };

  // Manejo del carrito
  const addToCart = (
    product: ProductItem, 
    presentation: 'ONZA_COMPLETA' | 'MEDIA_ONZA' | 'UNIDAD' = 'ONZA_COMPLETA'
  ) => {
    const isHalfPres = presentation === 'MEDIA_ONZA';
    const availableForPres = isHalfPres ? (product.stockHalf || 0) : product.stock;
    if (availableForPres <= 0) {
      alert(isHalfPres ? '¡Sin frascos de ½ onza!' : '¡Producto sin existencias!');
      return;
    }
    if (product.id === 'ENVIO-DOM' || product.name.toLowerCase().includes('envío a domicilio')) {
      setIsOrderDomicilio(true);
    }
    setCart(prev => {
      const existing = prev.find(item => 
        item.product.id === product.id && 
        (item.presentation || 'ONZA_COMPLETA') === presentation
      );
      // Frascos de esta misma presentación ya en el carrito
      const currentBottles = prev
        .filter(it => it.product.id === product.id && ((it.presentation === 'MEDIA_ONZA') === isHalfPres))
        .reduce((sum, it) => sum + it.quantity, 0);

      if (currentBottles + 1 > availableForPres) {
        alert(`Stock máximo alcanzado (${availableForPres} frascos disponibles).`);
        return prev;
      }

      if (existing) {
        return prev.map(item =>
          (item.product.id === product.id && (item.presentation || 'ONZA_COMPLETA') === presentation)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, presentation }];
    });
  };

  const updateQuantity = (
    productId: string, 
    delta: number, 
    presentation: 'ONZA_COMPLETA' | 'MEDIA_ONZA' | 'UNIDAD' = 'ONZA_COMPLETA'
  ) => {
    setCart(prev => {
      const targetItem = prev.find(item => 
        item.product.id === productId && 
        (item.presentation || 'ONZA_COMPLETA') === presentation
      );
      if (!targetItem) return prev;

      if (delta > 0) {
        const isHalfPres = presentation === 'MEDIA_ONZA';
        const limit = isHalfPres ? (targetItem.product.stockHalf || 0) : targetItem.product.stock;
        const currentBottles = prev
          .filter(it => it.product.id === productId && ((it.presentation === 'MEDIA_ONZA') === isHalfPres))
          .reduce((sum, it) => sum + it.quantity, 0);
        if (currentBottles + delta > limit) {
          alert(`Stock máximo alcanzado (${limit} frascos disponibles).`);
          return prev;
        }
      }

      return prev.map(item => {
        if (item.product.id === productId && (item.presentation || 'ONZA_COMPLETA') === presentation) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (
    productId: string, 
    presentation?: 'ONZA_COMPLETA' | 'MEDIA_ONZA' | 'UNIDAD'
  ) => {
    setCart(prev => prev.filter(item => {
      if (presentation) {
        return !(item.product.id === productId && (item.presentation || 'ONZA_COMPLETA') === presentation);
      }
      return item.product.id !== productId;
    }));
  };

  const setItemPresentation = (
    productId: string, 
    currentPres: 'ONZA_COMPLETA' | 'MEDIA_ONZA', 
    newPres: 'ONZA_COMPLETA' | 'MEDIA_ONZA'
  ) => {
    if (currentPres === newPres) return;
    setCart(prev => {
      const currentItem = prev.find(it => it.product.id === productId && (it.presentation || 'ONZA_COMPLETA') === currentPres);
      if (!currentItem) return prev;
      const existingTarget = prev.find(it => it.product.id === productId && (it.presentation || 'ONZA_COMPLETA') === newPres);

      // Validar que el cambio de presentación no exceda las existencias
      const isHalfPres = newPres === 'MEDIA_ONZA';
      const availableForPres = isHalfPres ? (currentItem.product.stockHalf || 0) : currentItem.product.stock;
      const combinedQty = currentItem.quantity + (existingTarget ? existingTarget.quantity : 0);

      if (combinedQty > availableForPres) {
        alert(`Stock insuficiente para cambiar a ${isHalfPres ? '½ Onza' : '1 Onza'} (${availableForPres} disponibles).`);
        return prev;
      }

      if (existingTarget) {
        return prev
          .map(it => {
            if (it === existingTarget) {
              return { ...it, quantity: it.quantity + currentItem.quantity };
            }
            return it;
          })
          .filter(it => it !== currentItem);
      } else {
        return prev.map(it => {
          if (it === currentItem) {
            return { ...it, presentation: newPres };
          }
          return it;
        });
      }
    });
  };

  const clearCart = () => {
    setCart([]);
    setEditingQuote(null);
    setIsOrderDomicilio(false);
    setDomicilioReference('');
  };

  const handleOpenNewProductInPos = () => {
    const numericSkus = products
      .map(p => parseInt(String(p.sku || ''), 10))
      .filter(n => !isNaN(n) && n > 0 && n < 10000);
    const nextSku = numericSkus.length > 0 ? String(Math.max(...numericSkus) + 1) : String(products.length + 1);
    const defaultCat =
      selectedCategory &&
      ['Esencias para Perfume', 'Insumos y Materia Prima', 'Botes', 'Otro'].includes(selectedCategory)
        ? selectedCategory
        : 'Esencias para Perfume';
    const isEssenceDefault = defaultCat === 'Esencias para Perfume';

    setEditingProductInPos({
      id: `prod_${Date.now()}`,
      sku: nextSku,
      barcode: '',
      name: '',
      officialName: '',
      brand: '',
      gender: 'Unisex',
      category: defaultCat,
      unit: isEssenceDefault ? 'Onza' : 'Unidad',
      price: isEssenceDefault ? 3.75 : 1.00,
      priceHalfOunce: isEssenceDefault ? 1.90 : undefined,
      finishedPerfumePrice: isEssenceDefault ? 15.00 : undefined,
      cost: 0,
      stock: 10,
      stockHalf: 0,
      minStock: 5,
      imageUrl: '',
      isAvailableOnline: true,
      puesto: '',
    });
    setIsEditingProductOpen(true);
  };

  const handleOpenEditProduct = (e: React.MouseEvent, product: ProductItem) => {
    e.stopPropagation();
    setEditingProductInPos({ ...product });
    setIsEditingProductOpen(true);
  };

  const handleSaveProductFromPos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductInPos || !editingProductInPos.name.trim()) {
      alert('El nombre del producto es requerido.');
      return;
    }

    setIsSavingProductInPos(true);
    const isNewProduct = editingProductInPos.id.startsWith('prod_');
    const isEssenceProd = (editingProductInPos.category || 'Esencias para Perfume') === 'Esencias para Perfume';
    const prodToSave: ProductItem = {
      ...editingProductInPos,
      category: editingProductInPos.category || 'Esencias para Perfume',
      unit: isEssenceProd
        ? 'Onza'
        : (editingProductInPos.unit && editingProductInPos.unit !== 'Onza' ? editingProductInPos.unit : 'Unidad'),
      priceHalfOunce: isEssenceProd ? editingProductInPos.priceHalfOunce : undefined,
      finishedPerfumePrice: isEssenceProd ? editingProductInPos.finishedPerfumePrice : undefined,
    };

    // 1. Actualización optimista inmediata en estado local
    setProducts(prev => {
      const updated = isNewProduct
        ? [prodToSave, ...prev]
        : prev.map(p => (p.id === prodToSave.id || (p.sku && p.sku === prodToSave.sku)) ? { ...p, ...prodToSave } : p);
      localStorage.setItem('kodelocal_products', JSON.stringify(updated));
      window.dispatchEvent(new Event('kodelocal_products_updated'));
      return updated;
    });

    // También actualizar en carrito si el producto estaba agregado
    if (!isNewProduct) {
      setCart(prev => prev.map(it => {
        if (it.product.id === prodToSave.id || (it.product.sku && it.product.sku === prodToSave.sku)) {
          return { ...it, product: { ...it.product, ...prodToSave } };
        }
        return it;
      }));
    }

    setIsEditingProductOpen(false);

    // 2. Persistir en la base de datos de Supabase
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/products', {
        method: isNewProduct ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          ...(isNewProduct ? {} : { id: prodToSave.id }),
          sku: prodToSave.sku,
          brand: prodToSave.brand,
          name: prodToSave.name,
          officialName: prodToSave.officialName,
          category: prodToSave.category,
          unit: prodToSave.unit,
          gender: prodToSave.gender,
          price: Number(prodToSave.price),
          priceHalfOunce: isEssenceProd && prodToSave.priceHalfOunce != null ? Number(prodToSave.priceHalfOunce) : null,
          finishedPerfumePrice: isEssenceProd && prodToSave.finishedPerfumePrice != null ? Number(prodToSave.finishedPerfumePrice) : null,
          cost: Number(prodToSave.cost || 0),
          stock: Number(prodToSave.stock || 0),
          stockHalf: Number(prodToSave.stockHalf || 0),
          puesto: prodToSave.puesto || '',
          imageUrl: prodToSave.imageUrl || '',
          isAvailableOnline: prodToSave.isAvailableOnline,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.product) {
          setProducts(prev => {
            const updated = prev.map(p => (p.id === prodToSave.id || (p.sku && p.sku === data.product.sku)) ? { ...p, ...data.product } : p);
            localStorage.setItem('kodelocal_products', JSON.stringify(updated));
            window.dispatchEvent(new Event('kodelocal_products_updated'));
            return updated;
          });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Error al guardar producto desde POS:', errData);
        alert(`Aviso: No se pudo guardar en el servidor: ${errData.error || 'Error de permisos'}`);
      }
    } catch (err) {
      console.error('Error de conexión al guardar producto desde POS:', err);
      alert('Error de conexión al sincronizar con la base de datos.');
    } finally {
      setIsSavingProductInPos(false);
      setEditingProductInPos(null);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const cleanInput = barcodeInput.trim();
    const product = products.find(p => 
      p.barcode === cleanInput || 
      p.sku.toLowerCase() === cleanInput.toLowerCase()
    );
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      alert(`No se encontró producto con código: ${cleanInput}`);
    }
  };

  const resolveTraditionalMunicipio = (dept: string, rawMuni?: string): string => {
    const munis = getMunicipiosByDepartamento(dept);
    const norm = (s?: string) =>
      (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const target = norm(rawMuni);
    if (target) {
      const exact = munis.find(m => norm(m.nombre) === target);
      if (exact) return exact.nombre;
    }
    return munis[0]?.nombre || 'San Salvador';
  };

  const applyCustomerToOrder = (found: CustomerRecord | null | undefined) => {
    if (found) {
      setClienteNombre(found.name);
      setClienteDoc(found.numDocumento);
      setClienteNrc(found.nrc || '');
      setClienteEmail(found.email || '');
      setClienteGiro(found.actividadEconomica || '');
      const dept = found.departamento || 'San Salvador';
      const resolvedMuni = resolveTraditionalMunicipio(dept, found.municipio);
      setClienteDepartamento(dept);
      setClienteMunicipio(resolvedMuni);
      setClienteDireccion(found.direccion || '');
      setDomicilioPhone(found.phone || '');
      setDomicilioDepartment(dept);
      setDomicilioMunicipality(resolvedMuni);
      setDomicilioAddress(found.direccion || '');
      if (found.notas) {
        setDomicilioReference(found.notas);
      }
      if (found.nrc || found.tipoPersona === 'JURIDICA' || found.documentoPreferido === '03') {
        setTipoComprobante('03');
      } else {
        setTipoComprobante('01');
      }
    } else {
      setClienteNombre('Consumidor Final');
      setClienteDoc('');
      setClienteNrc('');
      setClienteEmail('');
      setClienteGiro('');
      setClienteDepartamento('San Salvador');
      setClienteMunicipio('San Salvador');
      setClienteDireccion('');
      setDomicilioPhone('');
      setDomicilioDepartment('San Salvador');
      setDomicilioMunicipality('San Salvador');
      setDomicilioAddress('');
      setDomicilioReference('');
      setTipoComprobante('01');
    }
  };

  // Autocompletar datos de cliente al seleccionarlo
  const handleSelectCustomer = (customerId: string, explicitCustomer?: CustomerRecord) => {
    setSelectedCustomerId(customerId);
    if (!customerId) {
      applyCustomerToOrder(null);
      return;
    }
    const found = explicitCustomer || customers.find(c => c.id === customerId);
    if (found) {
      applyCustomerToOrder(found);
    }
  };

  // Mantener precargados los datos de Domicilio desde el cliente seleccionado en el sistema
  useEffect(() => {
    if (selectedCustomerObj) {
      const dept = selectedCustomerObj.departamento || 'San Salvador';
      const resolvedMuni = resolveTraditionalMunicipio(dept, selectedCustomerObj.municipio);
      setClienteNombre(selectedCustomerObj.name);
      setClienteDoc(selectedCustomerObj.numDocumento);
      setClienteNrc(selectedCustomerObj.nrc || '');
      setClienteEmail(selectedCustomerObj.email || '');
      setClienteGiro(selectedCustomerObj.actividadEconomica || '');
      setClienteDepartamento(dept);
      setClienteMunicipio(resolvedMuni);
      setClienteDireccion(selectedCustomerObj.direccion || '');
      setDomicilioPhone(selectedCustomerObj.phone || '');
      setDomicilioDepartment(dept);
      setDomicilioMunicipality(resolvedMuni);
      setDomicilioAddress(selectedCustomerObj.direccion || '');
      if (selectedCustomerObj.notas) {
        setDomicilioReference(prev => prev || selectedCustomerObj.notas || '');
      }
    }
  }, [selectedCustomerObj, isOrderDomicilio]);

  // Iniciar venta directa desde el módulo de clientes
  const handleStartSaleForCustomer = (cust: CustomerRecord) => {
    handleSelectCustomer(cust.id, cust);
    setPosTab('nueva_orden');
  };

  // Abrir modal de nuevo cliente
  const handleOpenNewCustomerModal = () => {
    setEditingCustomerId(null);
    setCustTipoPersona('NATURAL');
    setCustName('');
    setCustNombreComercial('');
    setCustTipoDocumento('DUI');
    setCustNumDocumento('');
    setCustNrc('');
    setCustGiro(GIROS_COMUNES_SV[0]);
    setCustCategoria('OTRO');
    setCustDocumentoPreferido('01');
    setCustEmail('');
    setCustPhone('');
    setCustDepartamento('San Salvador');
    const munis = getMunicipiosByDepartamento('San Salvador');
    setCustMunicipio(munis[0]?.nombre || 'San Salvador');
    setCustDireccion('');
    setCustNotas('');
    setCustSpecialEssencePrice('');
    setCustSpecialHalfEssencePrice('');
    setCustSpecialBottlePrice('');
    setCustTierId('');
    setCustCustomDiscountPct('');
    setCustBottleTierId('');
    setCustBottleCustomDiscountPct('');
    setCustSuppliesTierId('');
    setCustSuppliesCustomDiscountPct('');
    setIsCustomerModalOpen(true);
  };

  // Abrir modal para editar cliente
  const handleOpenEditCustomerModal = (cust: CustomerRecord) => {
    setEditingCustomerId(cust.id);
    setCustTipoPersona(cust.tipoPersona);
    setCustName(cust.name);
    setCustNombreComercial(cust.nombreComercial || '');
    setCustTipoDocumento(cust.tipoDocumento);
    setCustNumDocumento(cust.numDocumento);
    setCustNrc(cust.nrc || '');
    setCustGiro(cust.actividadEconomica || GIROS_COMUNES_SV[0]);
    setCustCategoria(cust.categoriaContribuyente || 'OTRO');
    setCustDocumentoPreferido(cust.documentoPreferido || (cust.nrc || cust.tipoPersona === 'JURIDICA' ? '03' : '01'));
    setCustEmail(cust.email);
    setCustPhone(cust.phone);
    const dept = cust.departamento || 'San Salvador';
    setCustDepartamento(dept);
    setCustMunicipio(resolveTraditionalMunicipio(dept, cust.municipio));
    setCustDireccion(cust.direccion || '');
    setCustNotas(cust.notas || '');
    setCustSpecialEssencePrice(cust.specialEssencePrice != null ? String(cust.specialEssencePrice) : '');
    setCustSpecialHalfEssencePrice(cust.specialHalfEssencePrice != null ? String(cust.specialHalfEssencePrice) : '');
    setCustSpecialBottlePrice(cust.specialBottlePrice != null ? String(cust.specialBottlePrice) : '');
    setCustTierId(cust.tierId || '');
    setCustCustomDiscountPct(cust.customDiscountPct != null ? String(cust.customDiscountPct) : '');
    setCustBottleTierId(cust.bottleTierId || '');
    setCustBottleCustomDiscountPct(cust.bottleCustomDiscountPct != null ? String(cust.bottleCustomDiscountPct) : '');
    setCustSuppliesTierId(cust.suppliesTierId || '');
    setCustSuppliesCustomDiscountPct(cust.suppliesCustomDiscountPct != null ? String(cust.suppliesCustomDiscountPct) : '');
    setIsCustomerModalOpen(true);
  };

  // Guardar cliente
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      alert('Por favor ingresa el nombre o razón social del cliente.');
      return;
    }

    if (custTipoPersona === 'JURIDICA' && !custNrc.trim()) {
      alert('El NRC es obligatorio para empresas y Crédito Fiscal.');
      return;
    }

    const matchedTier = customerTiers.find(t => t.id === custTierId) || null;
    const matchedBottleTier = customerTiers.find(t => t.id === custBottleTierId) || null;
    const matchedSuppliesTier = customerTiers.find(t => t.id === custSuppliesTierId) || null;

    const customerPayload = {
      tipoPersona: custTipoPersona,
      name: custName.trim(),
      nombreComercial: custNombreComercial.trim() || undefined,
      tipoDocumento: custTipoDocumento,
      numDocumento: custNumDocumento.trim() || '00000000-0',
      nrc: custNrc.trim() || undefined,
      actividadEconomica: custGiro.trim() || undefined,
      categoriaContribuyente: custCategoria,
      documentoPreferido: custDocumentoPreferido,
      email: custEmail.trim(),
      phone: custPhone.trim(),
      departamento: custDepartamento,
      municipio: custMunicipio.trim() || undefined,
      direccion: custDireccion.trim() || undefined,
      notas: custNotas.trim() || undefined,
      specialEssencePrice: custSpecialEssencePrice ? parseFloat(custSpecialEssencePrice) : null,
      specialHalfEssencePrice: custSpecialHalfEssencePrice ? parseFloat(custSpecialHalfEssencePrice) : null,
      specialBottlePrice: custSpecialBottlePrice ? parseFloat(custSpecialBottlePrice) : null,
      tierId: custTierId || null,
      tier: matchedTier ? {
        id: matchedTier.id,
        name: matchedTier.name,
        discountPct: Number(matchedTier.discountPct || 0),
        badgeColor: matchedTier.badgeColor || '#6366f1',
      } : null,
      customDiscountPct: custCustomDiscountPct ? Number(custCustomDiscountPct) : null,
      bottleTierId: custBottleTierId || null,
      bottleTier: matchedBottleTier ? {
        id: matchedBottleTier.id,
        name: matchedBottleTier.name,
        discountPct: Number(matchedBottleTier.discountPct || 0),
        badgeColor: matchedBottleTier.badgeColor || '#6366f1',
      } : null,
      bottleCustomDiscountPct: custBottleCustomDiscountPct ? Number(custBottleCustomDiscountPct) : null,
      suppliesTierId: custSuppliesTierId || null,
      suppliesTier: matchedSuppliesTier ? {
        id: matchedSuppliesTier.id,
        name: matchedSuppliesTier.name,
        discountPct: Number(matchedSuppliesTier.discountPct || 0),
        badgeColor: matchedSuppliesTier.badgeColor || '#6366f1',
      } : null,
      suppliesCustomDiscountPct: custSuppliesCustomDiscountPct ? Number(custSuppliesCustomDiscountPct) : null,
    };

    const tempOrEditId = editingCustomerId || `cli-${Date.now()}`;
    const optimisticCustomer: CustomerRecord = {
      id: tempOrEditId,
      ...customerPayload,
      createdAt: new Date().toISOString(),
    };

    // Guardar en Supabase PostgreSQL
    getStaffToken()
      .catch(() => null)
      .then((staffToken) =>
        fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(staffToken ? { 'x-staff-token': staffToken } : {}),
          },
          body: JSON.stringify({
            id: editingCustomerId || undefined,
            ...customerPayload,
          }),
        })
      )
      .then(res => res.json())
      .then(data => {
        if (data?.success && data?.customer) {
          const serverId = data.customer.id || tempOrEditId;
          const mergedCust: CustomerRecord = {
            ...optimisticCustomer,
            id: serverId,
          };
          setCustomers(prev => {
            const withoutTemp = prev.filter(c => c.id !== tempOrEditId && c.id !== serverId);
            const updated = [mergedCust, ...withoutTemp];
            saveStoredCustomers(updated);
            return updated;
          });
          setSelectedCustomerId(prev => (prev === tempOrEditId || prev === editingCustomerId ? serverId : prev));
          applyCustomerToOrder(mergedCust);
          refreshCustomers();
        }
      })
      .catch(err => console.error('Error guardando cliente en Supabase:', err));

    if (editingCustomerId) {
      setCustomers(prev => {
        const updated = prev.map(c => {
          if (c.id === editingCustomerId) {
            return {
              ...c,
              ...customerPayload,
              id: c.id,
            };
          }
          return c;
        });
        saveStoredCustomers(updated);
        return updated;
      });
      if (selectedCustomerId === editingCustomerId) {
        handleSelectCustomer(editingCustomerId, optimisticCustomer);
      }
    } else {
      setCustomers(prev => {
        const updated = [optimisticCustomer, ...prev];
        saveStoredCustomers(updated);
        return updated;
      });
      handleSelectCustomer(optimisticCustomer.id, optimisticCustomer);
    }

    setIsCustomerModalOpen(false);
  };

  // Iniciar cotización en PDF / Prefactura
  const handleOpenQuoteModal = async () => {
    if (cart.length === 0) {
      alert('Agrega al menos una fragancia o producto al pedido para generar la cotización.');
      return;
    }
    const clientObj = customers.find(c => c.id === selectedCustomerId);
    const ordNum = `COT-${Math.floor(1000 + Math.random() * 9000)}`;

    const quoteSale: SaleRecord = {
      id: `quote-${Date.now()}`,
      orderNumber: ordNum,
      saleNumber: ordNum,
      createdAt: new Date().toISOString(),
      cotizacionDate: new Date().toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      total: cartSubtotal,
      subtotal: subtotalNeto,
      ivaTotal: ivaCalculado,
      tipoComprobante,
      cliente: {
        nombre: clienteNombre || 'Consumidor Final',
        numDocumento: clienteDoc || undefined,
        nrc: clienteNrc || undefined,
        correo: clienteEmail || undefined,
        telefono: clientObj?.phone || undefined,
        direccion: clientObj?.direccion || undefined,
        actividadEconomica: clienteGiro || undefined,
        categoriaContribuyente: clientObj?.categoriaContribuyente || undefined
      },
      status: 'PREFACTURA',
      vendedor: 'Vendedora Mostrador',
      items: cart.map(formatCartItem)
    };

    // Guardar la prefactura (cotización) en la base de datos
    let saved = false;
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          customerName: quoteSale.cliente.nombre,
          customerDoc: quoteSale.cliente.numDocumento,
          customerNrc: quoteSale.cliente.nrc,
          customerEmail: quoteSale.cliente.correo,
          customerPhone: quoteSale.cliente.telefono,
          customerAddress: quoteSale.cliente.direccion,
          tipoComprobante: quoteSale.tipoComprobante,
          subtotal: quoteSale.subtotal,
          ivaTotal: quoteSale.ivaTotal,
          total: quoteSale.total,
          sellerName: quoteSale.vendedor,
          items: quoteSale.items,
        }),
      });
      const data = await res.json();
      if (data.success && data.quote) {
        quoteSale.orderNumber = data.quote.quoteNumber;
        quoteSale.saleNumber = data.quote.quoteNumber;
        quoteSale.createdAt = data.quote.createdAt;
        saved = true;
      }
    } catch (err) {
      console.error('No se pudo guardar la prefactura:', err);
    }

    if (saved) {
      // Si se estaba editando una prefactura, la anterior queda reemplazada
      if (editingQuote) {
        await patchQuote(editingQuote.id, 'cancel', { reason: `Reemplazada por ${quoteSale.saleNumber}` });
      }
      clearCart();
      bumpPrefacturas();
    } else {
      alert(
        'No se pudo guardar la prefactura en el sistema (sin conexión o sesión vencida).\n' +
        'Se muestra el PDF para compartirlo, pero NO quedará en "Prefacturas". Tu carrito sigue intacto.'
      );
    }

    setActiveQuoteNotices(null);
    setActiveQuoteSale(quoteSale);
    setIsQuoteModalOpen(true);
  };

  // Enviar comanda a Bodega para preparación física
  const handleSendOrderToBodega = () => {
    if (cart.length === 0) {
      alert('Agrega al menos una fragancia o producto al pedido para enviar a Bodega.');
      return;
    }
    const ordNum = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const cmdNum = `CMD-${Math.floor(1000 + Math.random() * 9000)}`;
    const clientObj = customers.find(c => c.id === selectedCustomerId);

    const resolvedClientName = clientObj?.name || (clienteNombre && clienteNombre !== 'Consumidor Final' ? clienteNombre : (cartCustomerQuery.trim() || 'Consumidor Final'));
    const resolvedClientDoc = clientObj?.numDocumento || clienteDoc || undefined;
    const resolvedClientNrc = clientObj?.nrc || clienteNrc || undefined;
    const resolvedClientEmail = clientObj?.email || clienteEmail || undefined;
    const resolvedClientPhone = (isOrderDomicilio && domicilioPhone.trim()) ? domicilioPhone.trim() : (clientObj?.phone || undefined);
    const resolvedClientAddress = (isOrderDomicilio && domicilioAddress.trim()) ? domicilioAddress.trim() : (clientObj?.direccion || clienteDireccion || undefined);
    const resolvedClientDept = (isOrderDomicilio && domicilioDepartment) ? domicilioDepartment : (clientObj?.departamento || clienteDepartamento || 'San Salvador');
    const resolvedClientMuni = (isOrderDomicilio && domicilioMunicipality) ? domicilioMunicipality : (clientObj?.municipio || clienteMunicipio || 'San Salvador');
    const resolvedClientGiro = clientObj?.actividadEconomica || clienteGiro || undefined;

    const effectiveIsDomicilio =
      isOrderDomicilio ||
      cart.some(i => i.product.id === 'ENVIO-DOM' || i.product.name.toLowerCase().includes('envío a domicilio'));

    const domicilioPayload = effectiveIsDomicilio
      ? {
          isDomicilio: true,
          customerName: resolvedClientName,
          customerPhone: resolvedClientPhone || '',
          customerEmail: resolvedClientEmail || '',
          department: resolvedClientDept,
          municipality: resolvedClientMuni,
          shippingAddress: resolvedClientAddress || '',
          deliveryReference: domicilioReference.trim() || undefined,
          domicilioStatus: 'PENDIENTE' as const,
        }
      : undefined;

    const newOrder: SaleRecord = {
      id: `ord-${Date.now()}`,
      orderNumber: ordNum,
      saleNumber: cmdNum,
      createdAt: new Date().toISOString(),
      total: cartSubtotal,
      subtotal: subtotalNeto,
      ivaTotal: ivaCalculado,
      tipoComprobante,
      isDomicilio: effectiveIsDomicilio,
      domicilio: domicilioPayload,
      cliente: {
        id: clientObj?.id || selectedCustomerId || undefined,
        nombre: resolvedClientName,
        numDocumento: resolvedClientDoc,
        nrc: resolvedClientNrc,
        correo: resolvedClientEmail,
        telefono: resolvedClientPhone,
        direccion: resolvedClientAddress,
        departamento: resolvedClientDept,
        municipio: resolvedClientMuni,
        actividadEconomica: resolvedClientGiro,
        categoriaContribuyente: clientObj?.categoriaContribuyente || undefined
      } as any,
      status: 'PENDING_PREPARATION',
      vendedor: 'Vendedora Mostrador',
      items: cart.map(formatCartItem)
    };

    const savedSales = JSON.parse(localStorage.getItem('kodelocal_sales') || '[]');
    const updatedSales = [newOrder, ...savedSales];
    localStorage.setItem('kodelocal_sales', JSON.stringify(updatedSales));
    window.dispatchEvent(new Event('kodelocal_sales_updated'));
    setSales(updatedSales);

    // Si el carrito venía de editar una prefactura, queda confirmada y enviada a bodega
    if (editingQuote) {
      patchQuote(editingQuote.id, 'send', { saleNumber: cmdNum }).then(result => {
        if (!result.ok) console.warn('No se pudo marcar la prefactura como enviada:', result.error);
        bumpPrefacturas();
      });
    }

    // Persistir comanda en Supabase para que Bodega en cualquier dispositivo la reciba al instante
    getStaffToken().then(staffToken => {
      fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          saleNumber: cmdNum,
          channel: 'POS',
          subtotal: subtotalNeto,
          ivaTotal: ivaCalculado,
          total: cartSubtotal,
          tipoComprobante,
          paymentMethod: 'CASH',
          paymentStatus: 'PENDING',
          orderStatus: 'PENDING_PREPARATION',
          notes: JSON.stringify({
            desc: effectiveIsDomicilio ? 'Comanda Domicilio POS para Bodega' : 'Comanda mostrador para Bodega',
            cliente: newOrder.cliente,
            tipoComprobante,
            isDomicilio: effectiveIsDomicilio,
            domicilio: domicilioPayload,
          }),
          cashierName: 'Vendedora Mostrador',
          customerId: clientObj?.id || (selectedCustomerId || null),
          items: cart.map(formatCartItem),
        }),
      }).catch(err => console.error('Error sincronizando comanda con Supabase:', err));
    });

    const totalQty = cart.reduce((acc, i) => acc + i.quantity, 0);
    clearCart();
    setOrderSentToast({ orderNumber: ordNum, itemCount: totalQty });
    setTimeout(() => {
      setOrderSentToast(null);
    }, 7000);
  };

  // =========================================================================
  // PREFACTURAS (cotizaciones pendientes de confirmar con el cliente)
  // =========================================================================
  const patchQuote = async (
    id: string,
    action: 'send' | 'cancel' | 'release',
    extra: { saleNumber?: string; reason?: string } = {}
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/quotes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      return data.success
        ? { ok: true }
        : { ok: false, error: data.error || 'No se pudo actualizar la prefactura' };
    } catch {
      return { ok: false, error: 'Error de conexión al actualizar la prefactura' };
    }
  };

  const refreshPrefacturasCount = async () => {
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/quotes?countOnly=1', {
        cache: 'no-store',
        headers: { ...(staffToken ? { 'x-staff-token': staffToken } : {}) },
      });
      const data = await res.json();
      if (data.success) setPrefacturasPending(Number(data.pending || 0));
    } catch {
      // el contador es informativo; si falla no se bloquea nada
    }
  };

  const bumpPrefacturas = () => {
    setPrefacturasRefreshKey(k => k + 1);
    refreshPrefacturasCount();
  };

  // Busca el cliente registrado que corresponde a los datos de una prefactura / comanda
  const findCustomerForPerson = (p: {
    id?: string;
    correo?: string;
    numDocumento?: string;
    nrc?: string;
    telefono?: string;
    nombre?: string;
  }): CustomerRecord | undefined => {
    const normEmail = p.correo?.toLowerCase().trim();
    let matched = normEmail
      ? customers.find(c => c.email && c.email.toLowerCase().trim() === normEmail)
      : undefined;
    if (!matched && p.id) matched = customers.find(c => c.id === p.id);
    if (matched) return matched;

    const doc = p.numDocumento?.replace(/\D/g, '');
    const nrc = p.nrc?.replace(/\D/g, '');
    const phone = p.telefono?.replace(/\D/g, '');
    const name = p.nombre?.toLowerCase().trim();
    return customers.find(c => {
      if (nrc && c.nrc && c.nrc.replace(/\D/g, '') === nrc) return true;
      if (doc && doc !== '000000000' && c.numDocumento && c.numDocumento.replace(/\D/g, '') === doc) return true;
      if (phone && c.phone && c.phone.replace(/\D/g, '') === phone) return true;
      if (name && name !== 'consumidor final' && c.name && c.name.toLowerCase().trim() === name) return true;
      return false;
    });
  };

  // Cargar una prefactura en el Cotizador para modificarla
  const handleEditQuoteInPos = (quote: SavedQuote) => {
    if (cart.length > 0 && !confirm('El carrito actual tiene productos. ¿Reemplazarlo con los de la prefactura?')) {
      return;
    }

    const restoredCart: CartItem[] = [];
    for (const it of quote.items || []) {
      const cleanName = String(it.name || '')
        .replace(/\s*\(½\s*Oz\)/gi, '')
        .replace(/\s*\(1\s*Onza\)/gi, '')
        .replace(/\s*\(Media\s*Onza\)/gi, '')
        .trim()
        .toLowerCase();

      const matchedProd = products.find(
        p =>
          p.id === it.productId ||
          (p.sku && p.sku === it.productId) ||
          p.name.toLowerCase().trim() === cleanName ||
          (p.officialName && p.officialName.toLowerCase().trim() === cleanName)
      );
      if (!matchedProd) continue;

      const unitLower = String(it.unit || '').toLowerCase();
      const nameLower = String(it.name || '').toLowerCase();
      const isHalf =
        it.presentation === 'MEDIA_ONZA' ||
        unitLower.includes('media') ||
        unitLower.includes('½') ||
        nameLower.includes('media onza') ||
        nameLower.includes('½');
      const isEssence =
        matchedProd.category === 'Esencias para Perfume' ||
        matchedProd.category === 'Esencias & Fragancias' ||
        matchedProd.unit === 'Onza' ||
        unitLower.includes('onza') ||
        unitLower.includes('oz');

      const presentation: 'ONZA_COMPLETA' | 'MEDIA_ONZA' | 'UNIDAD' = isHalf
        ? 'MEDIA_ONZA'
        : isEssence
        ? 'ONZA_COMPLETA'
        : 'UNIDAD';

      restoredCart.push({
        product: matchedProd,
        quantity: Math.max(1, Number(it.quantity || 1)),
        presentation,
      });
    }

    if (restoredCart.length === 0) {
      alert('No se pudieron cargar los productos de esta prefactura en el catálogo.');
      return;
    }

    setCart(restoredCart);

    const matchedCust = findCustomerForPerson({
      correo: quote.customerEmail || undefined,
      numDocumento: quote.customerDoc || undefined,
      nrc: quote.customerNrc || undefined,
      telefono: quote.customerPhone || undefined,
      nombre: quote.customerName,
    });

    if (matchedCust) {
      handleSelectCustomer(matchedCust.id);
    } else {
      setSelectedCustomerId('');
      setClienteNombre(quote.customerName || 'Consumidor Final');
      setClienteDoc(quote.customerDoc || '');
      setClienteNrc(quote.customerNrc || '');
      setClienteEmail(quote.customerEmail || '');
      setClienteDireccion(quote.customerAddress || '');
    }

    setTipoComprobante(quote.tipoComprobante === '03' || quote.customerNrc || matchedCust?.nrc ? '03' : '01');
    setEditingQuote({ id: quote.id, quoteNumber: quote.quoteNumber });
    setPosTab('nueva_orden');
  };

  // Enviar una prefactura confirmada directamente a Bodega (con los precios cotizados)
  const handleSendQuoteToBodega = async (quote: SavedQuote): Promise<boolean> => {
    const ordNum = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const cmdNum = `CMD-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Reclamar la prefactura (evita que otro cajero la envíe al mismo tiempo)
    const claim = await patchQuote(quote.id, 'send', { saleNumber: cmdNum });
    if (!claim.ok) {
      alert(claim.error || 'No se pudo enviar la prefactura a Bodega.');
      bumpPrefacturas();
      return false;
    }

    const clientObj = findCustomerForPerson({
      correo: quote.customerEmail || undefined,
      numDocumento: quote.customerDoc || undefined,
      nrc: quote.customerNrc || undefined,
      telefono: quote.customerPhone || undefined,
      nombre: quote.customerName,
    });
    const tipo: TipoComprobante = quote.tipoComprobante === '03' ? '03' : '01';
    const items = (quote.items || []).map(it => ({
      productId: it.productId || '',
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      total: it.total,
      unit: it.unit || undefined,
      presentation: it.presentation || undefined,
      puesto: it.puesto || undefined,
    }));
    const cliente = {
      id: clientObj?.id || undefined,
      nombre: clientObj?.name || quote.customerName,
      numDocumento: clientObj?.numDocumento || quote.customerDoc || undefined,
      nrc: clientObj?.nrc || quote.customerNrc || undefined,
      correo: clientObj?.email || quote.customerEmail || undefined,
      telefono: clientObj?.phone || quote.customerPhone || undefined,
      direccion: clientObj?.direccion || quote.customerAddress || undefined,
      actividadEconomica: clientObj?.actividadEconomica || undefined,
      categoriaContribuyente: clientObj?.categoriaContribuyente || undefined,
    };

    // 2. Crear la comanda en el servidor; si falla, se libera la prefactura
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          saleNumber: cmdNum,
          channel: 'POS',
          subtotal: quote.subtotal,
          ivaTotal: quote.ivaTotal,
          total: quote.total,
          tipoComprobante: tipo,
          paymentMethod: 'CASH',
          paymentStatus: 'PENDING',
          orderStatus: 'PENDING_PREPARATION',
          notes: JSON.stringify({
            desc: `Comanda mostrador para Bodega (prefactura ${quote.quoteNumber})`,
            cliente,
            tipoComprobante: tipo,
            quoteNumber: quote.quoteNumber,
          }),
          cashierName: 'Vendedora Mostrador',
          customerId: clientObj?.id || null,
          items,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || `Error ${res.status}`);
      }
    } catch (err: any) {
      await patchQuote(quote.id, 'release');
      alert(`No se pudo enviar a Bodega: ${err?.message || 'error de conexión'}.\nLa prefactura sigue pendiente.`);
      bumpPrefacturas();
      return false;
    }

    // 3. Reflejar la comanda en el POS local (igual que "Enviar a Preparar")
    const newOrder: SaleRecord = {
      id: `ord-${Date.now()}`,
      orderNumber: ordNum,
      saleNumber: cmdNum,
      createdAt: new Date().toISOString(),
      total: quote.total,
      subtotal: quote.subtotal,
      ivaTotal: quote.ivaTotal,
      tipoComprobante: tipo,
      cliente: cliente as any,
      status: 'PENDING_PREPARATION',
      vendedor: 'Vendedora Mostrador',
      items: items as any,
    };
    const savedSales = JSON.parse(localStorage.getItem('kodelocal_sales') || '[]');
    const updatedSales = [newOrder, ...savedSales];
    localStorage.setItem('kodelocal_sales', JSON.stringify(updatedSales));
    window.dispatchEvent(new Event('kodelocal_sales_updated'));
    setSales(updatedSales);
    return true;
  };

  const handleCancelQuote = async (quote: SavedQuote, reason: string): Promise<boolean> => {
    const result = await patchQuote(quote.id, 'cancel', { reason });
    if (!result.ok) {
      alert(result.error || 'No se pudo anular la prefactura.');
      bumpPrefacturas();
      return false;
    }
    return true;
  };

  // Iniciar cobro de orden lista en ventanilla (desde Caja)
  const handleStartInvoiceOrder = (order: SaleRecord) => {
    setOrderToInvoice(order);

    // 1. Buscar por Correo (prioridad para relacionar con Ecommerce) o ID directo
    const normEmail = order.cliente?.correo?.toLowerCase().trim();
    const directId = (order.cliente as any)?.id || (order as any).customerId;
    let matchedCust = normEmail
      ? customers.find(c => c.email && c.email.toLowerCase().trim() === normEmail)
      : undefined;
    if (!matchedCust && directId) {
      matchedCust = customers.find(c => c.id === directId);
    }

    // 2. Si no, buscar por NRC, Documento válido (DUI/NIT), Teléfono o Nombre exacto
    if (!matchedCust) {
      const orderDoc = order.cliente?.numDocumento?.replace(/\D/g, '');
      const orderNrc = order.cliente?.nrc?.replace(/\D/g, '');
      const cleanPhone = order.cliente?.telefono?.replace(/\D/g, '');
      const normName = order.cliente?.nombre?.toLowerCase().trim();

      matchedCust = customers.find(c => {
        if (orderNrc && c.nrc && c.nrc.replace(/\D/g, '') === orderNrc) return true;
        if (orderDoc && orderDoc !== '000000000' && c.numDocumento && c.numDocumento.replace(/\D/g, '') === orderDoc) return true;
        if (cleanPhone && c.phone && c.phone.replace(/\D/g, '') === cleanPhone) return true;
        if (normName && normName !== 'consumidor final' && c.name && c.name.toLowerCase().trim() === normName) return true;
        return false;
      });
    }

    if (matchedCust) {
      handleSelectCustomer(matchedCust.id);
      if (order.cliente?.nombre && order.cliente.nombre !== 'Consumidor Final') {
        setClienteNombre(order.cliente.nombre);
      }
      if (order.cliente?.numDocumento && order.cliente.numDocumento !== '00000000-0') {
        setClienteDoc(order.cliente.numDocumento);
      }
      if (order.cliente?.nrc) setClienteNrc(order.cliente.nrc);
      if (order.cliente?.correo) setClienteEmail(order.cliente.correo);
      if (order.cliente?.actividadEconomica) setClienteGiro(order.cliente.actividadEconomica);
      if (order.cliente?.direccion) setClienteDireccion(order.cliente.direccion);
      if (order.cliente?.departamento) setClienteDepartamento(order.cliente.departamento);
      if (order.cliente?.municipio) setClienteMunicipio(order.cliente.municipio);
    } else {
      setSelectedCustomerId('');
      setClienteNombre(order.cliente?.nombre || 'Consumidor Final');
      setClienteDoc(order.cliente?.numDocumento || '');
      setClienteNrc(order.cliente?.nrc || '');
      setClienteEmail(order.cliente?.correo || '');
      setClienteGiro(order.cliente?.actividadEconomica || '');
      setClienteDireccion(order.cliente?.direccion || '');
      setClienteDepartamento(order.cliente?.departamento || 'San Salvador');
      setClienteMunicipio(order.cliente?.municipio || 'San Salvador Centro');
    }

    const tipo: TipoComprobante =
      order.tipoComprobante === '03' || order.cliente?.nrc || matchedCust?.nrc ? '03' : '01';
    setTipoComprobante(tipo);

    const ordMethod = order.paymentMethod || 'CASH';
    setPaymentMethod(ordMethod as any);

    const isAlreadyPaid = order.paymentStatus === 'COMPLETED' && ordMethod !== 'CASH';
    if (isAlreadyPaid) {
      setCashAmount('');
    } else if (ordMethod === 'CASH') {
      setCashAmount(order.cashReceived ? String(order.cashReceived) : String(order.total));
    } else {
      setCashAmount('');
    }
    setIsCheckoutOpen(true);
  };

  // Cambiar tipo de comprobante directamente desde la tarjeta de orden en Caja
  const handleChangeOrderDteType = (order: SaleRecord, newTipo: '01' | '03' | 'TICKET') => {
    setSales(prev => {
      const updated = prev.map(s =>
        (s.id === order.id || s.saleNumber === order.saleNumber)
          ? { ...s, tipoComprobante: newTipo }
          : s
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
      }
      return updated;
    });

    if (orderToInvoice && (orderToInvoice.id === order.id || orderToInvoice.saleNumber === order.saleNumber)) {
      setOrderToInvoice({ ...orderToInvoice, tipoComprobante: newTipo });
      setTipoComprobante(newTipo);
    }

    getStaffToken().then(staffToken => {
      fetch('/api/sales', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          id: order.id,
          saleNumber: order.saleNumber,
          tipoComprobante: newTipo,
        }),
      }).catch(err => console.error('Error actualizando tipoComprobante en orden:', err));
    });
  };

  // Finalizar venta, emitir DTE oficial ante Hacienda y descontar stock
  const handleCompleteSale = async () => {
    const isOrderFromWindow = !!orderToInvoice;
    const isOrderAlreadyPaid = isOrderFromWindow && orderToInvoice.paymentStatus === 'COMPLETED' && paymentMethod !== 'CASH';
    const itemsToBill = isOrderFromWindow ? orderToInvoice.items : cart.map(formatCartItem);
    const totalToBill = isOrderFromWindow ? orderToInvoice.total : cartSubtotal;
    const subtotalToBill = isOrderFromWindow ? orderToInvoice.subtotal : subtotalNeto;
    const ivaToBill = isOrderFromWindow ? orderToInvoice.ivaTotal : ivaCalculado;

    if (itemsToBill.length === 0) return;

    if (paymentMethod === 'CASH' && !isOrderAlreadyPaid) {
      const parsed = parseFloat(cashAmount);
      if (isNaN(parsed) || parsed < totalToBill) {
        alert('El monto en efectivo ingresado es insuficiente para cubrir el total.');
        return;
      }
    }

    setIsProcessing(true);

    const parsedCash = paymentMethod === 'CASH' ? parseFloat(cashAmount) : undefined;
    const changeAmount = parsedCash ? parsedCash - totalToBill : undefined;
    const staffToken = await getStaffToken().catch(() => null);

    let resolvedCheckoutCustomerId = selectedCustomerId || (isOrderFromWindow ? (orderToInvoice.cliente as any)?.id : undefined) || undefined;

    // Asociar y guardar los datos fiscales/contacto del cliente por su correo o ID
    if (clienteEmail.trim() || selectedCustomerId || (tipoComprobante === '03' && clienteNrc.trim()) || (clienteDoc.trim() && clienteDoc.trim() !== '00000000-0')) {
      try {
        const custRes = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(staffToken ? { 'x-staff-token': staffToken } : {}),
          },
          body: JSON.stringify({
            id: selectedCustomerId || undefined,
            tipoPersona: tipoComprobante === '03' || clienteNrc.trim() ? 'JURIDICA' : 'NATURAL',
            name: clienteNombre.trim() || 'Consumidor Final',
            tipoDocumento: tipoComprobante === '03' ? 'NIT' : 'DUI',
            numDocumento: clienteDoc.trim() || '00000000-0',
            nrc: clienteNrc.trim() || undefined,
            actividadEconomica: clienteGiro.trim() || undefined,
            documentoPreferido: tipoComprobante === '03' ? '03' : '01',
            email: clienteEmail.trim() || undefined,
            phone: selectedCustomerObj?.phone || (isOrderFromWindow ? orderToInvoice.cliente?.telefono : undefined),
            departamento: clienteDepartamento || 'San Salvador',
            municipio: clienteMunicipio || 'San Salvador Centro',
            direccion: clienteDireccion.trim() || undefined,
          }),
        });
        const custData = await custRes.json();
        if (custData?.success && custData?.customer?.id) {
          resolvedCheckoutCustomerId = custData.customer.id;
        }
        refreshCustomers();
      } catch (_) {}
    }

    const counterSaleNumber = !isOrderFromWindow ? `CMD-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
    let dteResponseData = null;
    if (tipoComprobante === '01' || tipoComprobante === '03') {
      try {
        const saleRefId = isOrderFromWindow
          ? (orderToInvoice.orderNumber || orderToInvoice.saleNumber || orderToInvoice.id)
          : counterSaleNumber!;

        const res = await fetch('/api/dte', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(staffToken ? { 'x-staff-token': staffToken } : {}),
          },
          body: JSON.stringify({
            tipoDte: tipoComprobante,
            saleId: saleRefId,
            cliente: {
              nombre: clienteNombre,
              numDocumento: clienteDoc,
              nrc: clienteNrc,
              email: clienteEmail,
              giro: clienteGiro,
              telefono: selectedCustomerObj?.phone || (isOrderFromWindow ? orderToInvoice.cliente?.telefono : undefined),
              direccion: clienteDireccion || selectedCustomerObj?.direccion || (isOrderFromWindow ? orderToInvoice.cliente?.direccion : undefined),
              departamento: clienteDepartamento || selectedCustomerObj?.departamento || (isOrderFromWindow ? orderToInvoice.cliente?.departamento : 'San Salvador'),
              municipio: clienteMunicipio || selectedCustomerObj?.municipio || (isOrderFromWindow ? orderToInvoice.cliente?.municipio : 'San Salvador Centro'),
            },
            items: itemsToBill.map(i => ({
              codigo: (i as any).productId || 'GEN-01',
              nombre: i.name,
              cantidad: i.quantity,
              precioUnitario: i.price,
              total: i.total,
              unit: i.unit,
              tipoItem: (i as any).tipoItem || ((i as any).productId === 'ENVIO-DOM' ? 2 : 1),
            })),
            total: totalToBill,
            subtotal: subtotalToBill,
            iva: ivaToBill,
            metodoPago: paymentMethod
          })
        });
        const data = await res.json();
        if (data.dte) {
          dteResponseData = data.dte;
          if (data.dte.estado === 'RECHAZADO') {
            alert(`Aviso DTE Factura Llama: ${data.dte.mensaje || 'Rechazado por Hacienda'}`);
          }
        } else if (!data.success) {
          alert(`Error al emitir DTE: ${data.error || 'No se pudo emitir en Factura Llama'}`);
        }
      } catch (err: any) {
        console.error('Error al emitir DTE:', err);
        alert(`Error al conectar con el servicio DTE: ${err?.message || 'Fallo de conexión'}`);
      }
    }

    // Descontar inventario oficial localmente solo si NO es un pedido web (los pedidos web ya descuentan stock al crearse en el checkout)
    const isWebOrderBeingInvoiced = isOrderFromWindow && orderToInvoice.channel === 'ONLINE';
    if (!isWebOrderBeingInvoiced) {
      setProducts(prev => {
        const updated = prev.map(prod => {
          const matchingItems = itemsToBill.filter(
            ci => ci.productId && ci.productId !== 'ENVIO-DOM' && (ci.productId === prod.id || ci.productId === prod.sku)
          );
          if (matchingItems.length > 0) {
            let fullDeduct = 0;
            let halfDeduct = 0;
            matchingItems.forEach(ci => {
              const unitLower = String(ci.unit || '').toLowerCase();
              const nameLower = String(ci.name || '').toLowerCase();
              const isHalf =
                (ci as any).presentation === 'MEDIA_ONZA' ||
                unitLower.includes('media') ||
                unitLower.includes('½') ||
                nameLower.includes('media onza') ||
                nameLower.includes('½');
              if (isHalf) halfDeduct += ci.quantity; else fullDeduct += ci.quantity;
            });
            return {
              ...prod,
              stock: Math.max(0, prod.stock - fullDeduct),
              stockHalf: Math.max(0, (prod.stockHalf || 0) - halfDeduct),
            };
          }
          return prod;
        });
        localStorage.setItem('kodelocal_products', JSON.stringify(updated));
        window.dispatchEvent(new Event('kodelocal_products_updated'));
        return updated;
      });
    }

    let completedRecord: SaleRecord;

    if (isOrderFromWindow) {
      // Actualizar la orden existente a COMPLETED
      const savedSales: SaleRecord[] = JSON.parse(localStorage.getItem('kodelocal_sales') || '[]');
      let foundInSaved = false;
      const updatedSales = savedSales.map(s => {
        if (s.id === orderToInvoice.id || (orderToInvoice.saleNumber && s.saleNumber === orderToInvoice.saleNumber)) {
          foundInSaved = true;
          const updated: SaleRecord = {
            ...s,
            status: 'COMPLETED',
            invoicedAt: new Date().toISOString(),
            cajero: getActiveSessionUI().name,
            paymentMethod,
            cashReceived: parsedCash,
            cashChange: changeAmount,
            tipoComprobante,
            cliente: {
              ...s.cliente,
              nombre: clienteNombre,
              numDocumento: clienteDoc || undefined,
              nrc: clienteNrc || undefined,
              correo: clienteEmail || undefined,
              actividadEconomica: clienteGiro || undefined,
              direccion: clienteDireccion || s.cliente?.direccion || undefined,
              departamento: clienteDepartamento || s.cliente?.departamento || undefined,
              municipio: clienteMunicipio || s.cliente?.municipio || undefined,
            },
            dteInfo: dteResponseData ? {
              codigoGeneracion: dteResponseData.codigoGeneracion,
              numeroControl: dteResponseData.numeroControl,
              selloRecepcion: dteResponseData.selloRecepcion,
              estado: dteResponseData.estado,
              simulated: dteResponseData.simulated,
              mensaje: dteResponseData.mensaje,
              mhDteUrl: dteResponseData.mhDteUrl,
              pdfUrl: dteResponseData.pdfUrl,
              jsonUrl: dteResponseData.jsonUrl,
              fhProcesamiento: dteResponseData.fhProcesamiento,
            } : undefined
          };
          completedRecord = updated;
          return updated;
        }
        return s;
      });

      if (!foundInSaved) {
        const updated: SaleRecord = {
          ...orderToInvoice,
          status: 'COMPLETED',
          invoicedAt: new Date().toISOString(),
          cajero: getActiveSessionUI().name,
          paymentMethod,
          cashReceived: parsedCash,
          cashChange: changeAmount,
          tipoComprobante,
          cliente: {
            ...orderToInvoice.cliente,
            nombre: clienteNombre,
            numDocumento: clienteDoc || undefined,
            nrc: clienteNrc || undefined,
            correo: clienteEmail || undefined,
            actividadEconomica: clienteGiro || undefined,
            direccion: clienteDireccion || orderToInvoice.cliente?.direccion || undefined,
            departamento: clienteDepartamento || orderToInvoice.cliente?.departamento || undefined,
            municipio: clienteMunicipio || orderToInvoice.cliente?.municipio || undefined,
          },
          dteInfo: dteResponseData ? {
            codigoGeneracion: dteResponseData.codigoGeneracion,
            numeroControl: dteResponseData.numeroControl,
            selloRecepcion: dteResponseData.selloRecepcion,
            estado: dteResponseData.estado,
            simulated: dteResponseData.simulated,
            mensaje: dteResponseData.mensaje,
            mhDteUrl: dteResponseData.mhDteUrl,
            pdfUrl: dteResponseData.pdfUrl,
            jsonUrl: dteResponseData.jsonUrl,
            fhProcesamiento: dteResponseData.fhProcesamiento,
          } : undefined
        };
        completedRecord = updated;
        updatedSales.unshift(updated);
      }

      localStorage.setItem('kodelocal_sales', JSON.stringify(updatedSales));
      window.dispatchEvent(new Event('kodelocal_sales_updated'));
      setSales(updatedSales);

      // Sincronizar estado ENTREGADO / COMPLETED con Supabase para que Bodega en cualquier dispositivo lo vea al instante
      if (orderToInvoice) {
        if (orderToInvoice.channel === 'ONLINE') {
          fetch('/api/ecommerce/orders', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(staffToken ? { 'x-staff-token': staffToken } : {}),
            },
            body: JSON.stringify({
              orderId: orderToInvoice.id,
              orderNumber: orderToInvoice.orderNumber || orderToInvoice.saleNumber,
              orderStatus: 'ENTREGADO',
              paymentStatus: 'COMPLETED',
              notes: `[Cobrado en Caja POS - ${tipoComprobante}${dteResponseData?.codigoGeneracion ? ` - DTE: ${dteResponseData.codigoGeneracion}` : ''}]`
            }),
          }).catch(e => console.error('Error sincronizando orden cobrada con Supabase:', e));
        } else {
          fetch('/api/sales', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(staffToken ? { 'x-staff-token': staffToken } : {}),
            },
            body: JSON.stringify({
              id: orderToInvoice.id,
              saleNumber: orderToInvoice.saleNumber,
              orderStatus: 'COMPLETED',
              paymentStatus: 'COMPLETED',
              customerId: resolvedCheckoutCustomerId || selectedCustomerId || (orderToInvoice.cliente as any)?.id || null,
              cliente: {
                nombre: clienteNombre,
                numDocumento: clienteDoc,
                email: clienteEmail,
                nrc: clienteNrc,
              },
              tipoComprobante,
              codigoGeneracion: dteResponseData?.codigoGeneracion,
              dteInfo: completedRecord!.dteInfo,
              notes: `[Cobrado en Caja POS - ${tipoComprobante}]`
            })
          }).catch(() => {});
        }
      }
    } else {
      // Venta directa desde el mostrador
      const saleNumber = counterSaleNumber!;
      const effectiveDirectDomicilio =
        isOrderDomicilio ||
        itemsToBill.some(it => it.productId === 'ENVIO-DOM' || String(it.name || '').toLowerCase().includes('envío a domicilio'));
      const directDomicilioPayload = effectiveDirectDomicilio
        ? {
            isDomicilio: true,
            customerName: clienteNombre || 'Consumidor Final',
            customerPhone: domicilioPhone.trim() || selectedCustomerObj?.phone || '',
            customerEmail: clienteEmail || selectedCustomerObj?.email || '',
            department: domicilioDepartment || clienteDepartamento || 'San Salvador',
            municipality: domicilioMunicipality || clienteMunicipio || 'San Salvador',
            shippingAddress: domicilioAddress.trim() || clienteDireccion || '',
            deliveryReference: domicilioReference.trim() || undefined,
            domicilioStatus: 'PENDIENTE' as const,
          }
        : undefined;

      const newSale: SaleRecord = {
        id: `sale-${Date.now()}`,
        saleNumber,
        createdAt: new Date().toISOString(),
        invoicedAt: new Date().toISOString(),
        total: cartSubtotal,
        subtotal: subtotalNeto,
        ivaTotal: ivaCalculado,
        paymentMethod,
        cashReceived: parsedCash,
        cashChange: changeAmount,
        tipoComprobante,
        isDomicilio: effectiveDirectDomicilio,
        domicilio: directDomicilioPayload,
        cliente: {
          nombre: clienteNombre,
          numDocumento: clienteDoc,
          nrc: clienteNrc,
          correo: clienteEmail,
          telefono: directDomicilioPayload?.customerPhone || selectedCustomerObj?.phone || undefined,
          actividadEconomica: clienteGiro || undefined,
          direccion: directDomicilioPayload?.shippingAddress || clienteDireccion || undefined,
          departamento: directDomicilioPayload?.department || clienteDepartamento || undefined,
          municipio: directDomicilioPayload?.municipality || clienteMunicipio || undefined,
        },
        dteInfo: dteResponseData ? {
          codigoGeneracion: dteResponseData.codigoGeneracion,
          numeroControl: dteResponseData.numeroControl,
          selloRecepcion: dteResponseData.selloRecepcion,
          estado: dteResponseData.estado,
          simulated: dteResponseData.simulated,
          mensaje: dteResponseData.mensaje,
          mhDteUrl: dteResponseData.mhDteUrl,
          pdfUrl: dteResponseData.pdfUrl,
          jsonUrl: dteResponseData.jsonUrl,
          fhProcesamiento: dteResponseData.fhProcesamiento,
        } : undefined,
        status: 'COMPLETED',
        cajero: getActiveSessionUI().name,
        items: itemsToBill
      };

      const savedSales = JSON.parse(localStorage.getItem('kodelocal_sales') || '[]');
      const updatedSales = [newSale, ...savedSales];
      localStorage.setItem('kodelocal_sales', JSON.stringify(updatedSales));
      window.dispatchEvent(new Event('kodelocal_sales_updated'));
      setSales(updatedSales);
      completedRecord = newSale;
      clearCart();
    }

    setIsProcessing(false);
    setIsCheckoutOpen(false);
    setOrderToInvoice(null);
    setCompletedSale(completedRecord!);

    // Sincronizar venta y descuento de existencias con Supabase en tiempo real o encolar offline (REQ-POS-02)
    if (completedRecord!) {
      const syncNotes = completedRecord.isDomicilio
        ? JSON.stringify({
            desc: 'Venta Domicilio POS cobrada en Caja',
            tipoComprobante: completedRecord.tipoComprobante,
            cliente: completedRecord.cliente,
            isDomicilio: true,
            domicilio: completedRecord.domicilio,
          })
        : completedRecord.tipoComprobante;

      syncSaleOnlineOrQueue({
        saleNumber: completedRecord.saleNumber,
        channel: isWebOrderBeingInvoiced ? 'ONLINE' : 'POS',
        subtotal: completedRecord.subtotal,
        ivaTotal: completedRecord.ivaTotal,
        total: completedRecord.total,
        paymentMethod: completedRecord.paymentMethod || 'CASH',
        cashReceived: completedRecord.cashReceived,
        cashChange: completedRecord.cashChange,
        notes: syncNotes,
        tipoComprobante: completedRecord.tipoComprobante,
        codigoGeneracion: completedRecord.dteInfo?.codigoGeneracion,
        dteInfo: completedRecord.dteInfo,
        cashierName: completedRecord.cajero || getActiveSessionUI().name,
        customerId: resolvedCheckoutCustomerId || selectedCustomerId || (completedRecord.cliente as any)?.id || undefined,
        cliente: {
          nombre: clienteNombre || completedRecord.cliente?.nombre || 'Consumidor Final',
          numDocumento: clienteDoc || completedRecord.cliente?.numDocumento,
          nrc: clienteNrc || completedRecord.cliente?.nrc,
          email: clienteEmail || completedRecord.cliente?.correo,
          giro: clienteGiro || completedRecord.cliente?.actividadEconomica,
          telefono: completedRecord.domicilio?.customerPhone || selectedCustomerObj?.phone,
          direccion: completedRecord.domicilio?.shippingAddress || clienteDireccion || selectedCustomerObj?.direccion,
          departamento: completedRecord.domicilio?.department || clienteDepartamento || selectedCustomerObj?.departamento || 'San Salvador',
          municipio: completedRecord.domicilio?.municipality || clienteMunicipio || selectedCustomerObj?.municipio || 'San Salvador Centro',
        },
        requiresDte: (completedRecord.tipoComprobante === '01' || completedRecord.tipoComprobante === '03') && !completedRecord.dteInfo?.codigoGeneracion,
        items: completedRecord.items.map(it => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          total: it.total,
          unit: it.unit,
          presentation: (it as any).presentation,
          puesto: (it as any).puesto,
          tipoItem: (it as any).tipoItem || (it.productId === 'ENVIO-DOM' ? 2 : 1),
        })),
      }, (freshProds) => {
        setProducts(freshProds);
      }).then(syncRes => {
        if (syncRes.offline) {
          console.warn('📦 Venta resguardada en cola offline:', syncRes.error);
        }
      });
    }
  };

  // Transmitir un DTE pendiente desde la tabla de Caja a Factura Llama / MH
  const handleTransmitDte = async (sale: SaleRecord) => {
    setIsTransmittingDteId(sale.id || sale.saleNumber);
    try {
      const staffToken = await getStaffToken().catch(() => null);
      const res = await fetch('/api/dte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          tipoDte: sale.tipoComprobante === '03' ? '03' : '01',
          saleId: sale.saleNumber || sale.id,
          cliente: {
            nombre: sale.cliente?.nombre || 'Consumidor Final',
            numDocumento: sale.cliente?.numDocumento,
            nrc: sale.cliente?.nrc,
            email: sale.cliente?.correo,
            giro: sale.cliente?.actividadEconomica,
            telefono: sale.cliente?.telefono,
            direccion: sale.cliente?.direccion,
            departamento: sale.cliente?.departamento || 'San Salvador',
            municipio: sale.cliente?.municipio || 'San Salvador Centro',
          },
          items: sale.items.map((it: any) => ({
            codigo: it.productId || 'GEN-01',
            nombre: it.name,
            cantidad: it.quantity,
            precioUnitario: it.price,
            total: it.total,
            unit: it.unit,
            tipoItem: it.tipoItem || (it.productId === 'ENVIO-DOM' ? 2 : 1),
          })),
          total: sale.total,
          subtotal: sale.subtotal,
          iva: sale.ivaTotal,
          metodoPago: sale.paymentMethod || 'CASH',
        }),
      });
      const data = await res.json();
      if (data && data.dte && data.dte.codigoGeneracion) {
        const newDteInfo = {
          codigoGeneracion: data.dte.codigoGeneracion,
          numeroControl: data.dte.numeroControl,
          selloRecepcion: data.dte.selloRecepcion,
          estado: data.dte.estado,
          simulated: data.dte.simulated,
          mensaje: data.dte.mensaje,
          mhDteUrl: data.dte.mhDteUrl,
          pdfUrl: data.dte.pdfUrl,
          jsonUrl: data.dte.jsonUrl,
          fhProcesamiento: data.dte.fhProcesamiento,
        };

        setSales(prev => {
          const updated = prev.map(s => {
            if (s.id === sale.id || s.saleNumber === sale.saleNumber) {
              return { ...s, dteInfo: newDteInfo };
            }
            return s;
          });
          localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
          window.dispatchEvent(new Event('kodelocal_sales_updated'));
          return updated;
        });

        fetch('/api/sales', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(staffToken ? { 'x-staff-token': staffToken } : {}),
          },
          body: JSON.stringify({
            id: sale.id,
            saleNumber: sale.saleNumber,
            tipoComprobante: sale.tipoComprobante === '03' ? '03' : '01',
            codigoGeneracion: data.dte.codigoGeneracion,
            dteInfo: newDteInfo,
          }),
        }).catch(() => {});

        alert(`✅ DTE emitido exitosamente.\nCódigo: ${data.dte.codigoGeneracion}\nSello: ${data.dte.selloRecepcion || 'Recibido por MH'}`);
      } else {
        alert(`No se pudo emitir DTE: ${data?.error || data?.dte?.mensaje || 'Error en Factura Llama / MH'}`);
      }
    } catch (err: any) {
      alert(`Error al transmitir DTE: ${err?.message || 'Fallo de conexión'}`);
    } finally {
      setIsTransmittingDteId(null);
    }
  };

  // Filtrado de clientes
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    return customers.filter(c => {
      if (customerFilterType === 'NATURAL' && c.tipoPersona !== 'NATURAL') return false;
      if (customerFilterType === 'JURIDICA' && c.tipoPersona !== 'JURIDICA') return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.nombreComercial && c.nombreComercial.toLowerCase().includes(q)) ||
        c.numDocumento.includes(q) ||
        (c.nrc && c.nrc.includes(q)) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });
  }, [customers, customerSearch, customerFilterType]);

  // Órdenes listas en ventanilla preparadas por Bodega
  const readyInWindowOrders = useMemo(() => {
    return sales.filter(s => s.status === 'READY_AT_WINDOW');
  }, [sales]);

  // Listado de DTEs y comprobantes emitidos en Caja
  const completedDteSales = useMemo(() => {
    return sales.filter(s => s.status === 'COMPLETED' || !!s.dteInfo || !!s.invoicedAt);
  }, [sales]);

  // Filtro para la pestaña de DTEs emitidos
  const filteredDteSales = useMemo(() => {
    const parseTs = (val?: string | Date | null) => {
      if (!val) return 0;
      if (val instanceof Date) return isNaN(val.getTime()) ? 0 : val.getTime();
      const str = String(val).trim();
      const svMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?/);
      if (svMatch) {
        const [, dd, mm, yyyy, t] = svMatch;
        const parsed = new Date(`${yyyy}-${mm}-${dd}T${t || '00:00:00'}-06:00`).getTime();
        if (!isNaN(parsed)) return parsed;
      }
      const ts = new Date(str).getTime();
      return isNaN(ts) ? 0 : ts;
    };

    return completedDteSales
      .filter(sale => {
        if (dteFilterType === '01' && sale.tipoComprobante !== '01') return false;
        if (dteFilterType === '03' && sale.tipoComprobante !== '03') return false;
        if (dteFilterType === 'TICKET' && sale.tipoComprobante !== 'TICKET') return false;
        if (!dteSearchQuery.trim()) return true;
        const q = dteSearchQuery.toLowerCase().trim();
        return (
          sale.saleNumber.toLowerCase().includes(q) ||
          (sale.orderNumber && sale.orderNumber.toLowerCase().includes(q)) ||
          (sale.cliente?.nombre && sale.cliente.nombre.toLowerCase().includes(q)) ||
          (sale.dteInfo?.numeroControl && sale.dteInfo.numeroControl.toLowerCase().includes(q)) ||
          (sale.dteInfo?.codigoGeneracion && sale.dteInfo.codigoGeneracion.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (dteSortBy === 'CREACION') {
          const tsA = parseTs(a.createdAt) || parseTs(a.invoicedAt);
          const tsB = parseTs(b.createdAt) || parseTs(b.invoicedAt);
          return tsB - tsA;
        }
        const tsA = parseTs(a.dteInfo?.fhProcesamiento) || parseTs(a.invoicedAt) || parseTs(a.createdAt);
        const tsB = parseTs(b.dteInfo?.fhProcesamiento) || parseTs(b.invoicedAt) || parseTs(b.createdAt);
        return tsB - tsA;
      });
  }, [completedDteSales, dteFilterType, dteSearchQuery, dteSortBy]);

  // Monto total a cobrar (depende de si se factura comanda de ventanilla o carrito directo)
  const currentBillingTotal = useMemo(() => {
    return orderToInvoice ? orderToInvoice.total : cartSubtotal;
  }, [orderToInvoice, cartSubtotal]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 pb-20 lg:pb-16 max-w-[1650px] mx-auto items-start w-full max-w-full overflow-x-clip">
      
      {/* ========================================================================= */}
      {/* MENÚ LATERAL IZQUIERDO DE PUNTO DE VENTA (DINÁMICO / EXPANDIBLE AL HOVER) */}
      {/* ========================================================================= */}
      <PosSidebar
        posTab={posTab}
        prefacturasCount={prefacturasPending}
        setPosTab={setPosTab}
        isSidebarExpanded={isSidebarExpanded}
        isSidebarPinned={isSidebarPinned}
        setIsSidebarPinned={setIsSidebarPinned}
        setIsSidebarHovered={setIsSidebarHovered}
        totalItemsCount={totalItemsCount}
        readyInWindowCount={readyInWindowCount}
        completedDteCount={completedDteSales.length}
        customersCount={customers.length}
        pendingPreparationCount={pendingPreparationCount}
        totalOnzasVendidas={totalOnzasVendidas}
        totalMontoVentas={totalMontoVentas}
        salesCount={sales.length}
        offlineQueueCount={offlineQueueCount}
        isSyncingOffline={isSyncingOffline}
        onFlushOfflineQueue={handleFlushOfflineQueue}
        onNavigateLogistica={() => router.push('/logistica')}
      />

      {/* ========================================================================= */}
      {/* ÁREA DE CONTENIDO A LA DERECHA                                            */}
      {/* ========================================================================= */}
      <div className="flex-1 w-full min-w-0">

        {/* Botón Móvil para Volver al Terminal de Ventas si está en otro módulo */}
        {posTab !== 'nueva_orden' && posTab !== 'pos' && (
          <button
            type="button"
            onClick={() => setPosTab('nueva_orden')}
            className="lg:hidden w-full mb-3 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99] transition-all"
          >
            <Store className="w-3.5 h-3.5" />
            <span>← Volver a Terminal de Venta / Catálogo</span>
          </button>
        )}

        {/* ======================================================================= */}
        {/* PESTAÑA 1: NUEVA ORDEN / COTIZADOR Y TERMINAL DE VENTA                   */}
        {/* ======================================================================= */}
        {(posTab === 'nueva_orden' || posTab === 'pos') && (
          <>
            <div className="flex flex-col xl:flex-row gap-6">
              <PosProductGrid
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                barcodeInput={barcodeInput}
                setBarcodeInput={setBarcodeInput}
                handleBarcodeSubmit={handleBarcodeSubmit}
                categories={PERFUME_CATEGORIES}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedGender={selectedGender}
                setSelectedGender={setSelectedGender}
                displayedProducts={displayedProducts}
                filteredProductsCount={filteredProducts.length}
                activeEssencePrice={activeEssencePrice}
                activeEssenceHalfPrice={activeEssenceHalfPrice}
                customEssencePrice={activeCustomer?.specialEssencePrice != null && Number(activeCustomer.specialEssencePrice) > 0 ? Number(activeCustomer.specialEssencePrice) : null}
                customEssenceHalfPrice={activeCustomer?.specialHalfEssencePrice != null && Number(activeCustomer.specialHalfEssencePrice) > 0 ? Number(activeCustomer.specialHalfEssencePrice) : null}
                activeBottlePrice={activeBottlePrice}
                cart={cart}
                onAddToCart={addToCart}
                onOpenEditProduct={handleOpenEditProduct}
                onOpenNewProduct={handleOpenNewProductInPos}
              />

              {/* Panel de Carrito en Pantallas de Escritorio (xl+) */}
              <div className="hidden xl:block">
                <PosCartPanel
                  cart={cart}
                  totalItemsCount={totalItemsCount}
                  clearCart={clearCart}
                  selectedCustomerObj={selectedCustomerObj || null}
                  tipoComprobante={tipoComprobante}
                  cartCustomerQuery={cartCustomerQuery}
                  setCartCustomerQuery={setCartCustomerQuery}
                  isCartCustomerDropdownOpen={isCartCustomerDropdownOpen}
                  setIsCartCustomerDropdownOpen={setIsCartCustomerDropdownOpen}
                  filteredCartCustomers={filteredCartCustomers}
                  handleSelectCustomer={handleSelectCustomer}
                  handleOpenNewCustomerModal={handleOpenNewCustomerModal}
                  setCustName={setCustName}
                  orderSentToast={orderSentToast}
                  setPosTab={setPosTab}
                  getItemUnitPrice={getItemUnitPrice}
                  removeFromCart={removeFromCart}
                  setItemPresentation={setItemPresentation}
                  updateQuantity={updateQuantity}
                  subtotalNeto={subtotalNeto}
                  ivaCalculado={ivaCalculado}
                  cartSubtotal={cartSubtotal}
                  handleSendOrderToBodega={handleSendOrderToBodega}
                  handleOpenQuoteModal={handleOpenQuoteModal}
                  editingQuoteNumber={editingQuote?.quoteNumber || null}
                  onOpenQuoteHistory={() => setPosTab('prefacturas')}
                  onOpenCheckout={() => {
                    setOrderToInvoice(null);
                    setIsCheckoutOpen(true);
                  }}
                  isOrderDomicilio={isOrderDomicilio}
                  setIsOrderDomicilio={setIsOrderDomicilio}
                  domicilioPhone={domicilioPhone}
                  setDomicilioPhone={setDomicilioPhone}
                  domicilioDepartment={domicilioDepartment}
                  setDomicilioDepartment={setDomicilioDepartment}
                  domicilioMunicipality={domicilioMunicipality}
                  setDomicilioMunicipality={setDomicilioMunicipality}
                  domicilioAddress={domicilioAddress}
                  setDomicilioAddress={setDomicilioAddress}
                  domicilioReference={domicilioReference}
                  setDomicilioReference={setDomicilioReference}
                />
              </div>
            </div>

            {/* Barra Flotante Inferior de Carrito en Dispositivos Móviles (< xl) - Solo cuando hay productos */}
            {totalItemsCount > 0 && (
              <div className="xl:hidden fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white/95 backdrop-blur-md border border-indigo-100 p-2.5 px-3 rounded-2xl shadow-[0_8px_30px_rgba(99,102,241,0.25)] animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMobileCartOpen(true)}
                    className="flex items-center gap-2.5 text-left min-w-0"
                  >
                    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 bg-rose-500 text-white rounded-full text-[9.5px] font-black flex items-center justify-center shadow-xs">
                        {totalItemsCount}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-black text-slate-800 leading-tight">Orden Actual</span>
                        <span className="text-[10px] text-slate-400 font-medium">({totalItemsCount})</span>
                      </div>
                      <span className="text-sm font-black font-mono text-indigo-600 leading-tight">
                        ${cartSubtotal.toFixed(2)}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderToInvoice(null);
                        setIsCheckoutOpen(true);
                      }}
                      className="clay-btn clay-btn-success py-1.5 px-2.5 text-xs font-bold rounded-xl shadow-xs"
                      title="Cobrar directamente"
                    >
                      <span>Cobrar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMobileCartOpen(true)}
                      className="clay-btn clay-btn-primary py-1.5 px-3 text-xs font-bold rounded-xl shadow-md flex items-center gap-1"
                    >
                      <span>Ver Orden</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal / Drawer Desplegable del Carrito en Móvil (< xl) */}
            {isMobileCartOpen && (
              <div className="xl:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                <div 
                  className="absolute inset-0" 
                  onClick={() => setIsMobileCartOpen(false)} 
                />
                <div className="relative w-full max-h-[90vh] flex flex-col bg-[#f1f4f9] rounded-t-3xl shadow-2xl border-t border-white/80 overflow-hidden animate-in slide-in-from-bottom duration-300 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
                  <div className="p-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-800 leading-tight">Orden Actual</h3>
                        <span className="text-[10px] text-slate-500 font-medium">{totalItemsCount} unidades</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMobileCartOpen(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors font-bold"
                      title="Cerrar orden"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3">
                    <PosCartPanel
                      cart={cart}
                      totalItemsCount={totalItemsCount}
                      clearCart={clearCart}
                      selectedCustomerObj={selectedCustomerObj || null}
                      tipoComprobante={tipoComprobante}
                      cartCustomerQuery={cartCustomerQuery}
                      setCartCustomerQuery={setCartCustomerQuery}
                      isCartCustomerDropdownOpen={isCartCustomerDropdownOpen}
                      setIsCartCustomerDropdownOpen={setIsCartCustomerDropdownOpen}
                      filteredCartCustomers={filteredCartCustomers}
                      handleSelectCustomer={handleSelectCustomer}
                      handleOpenNewCustomerModal={handleOpenNewCustomerModal}
                      setCustName={setCustName}
                      orderSentToast={orderSentToast}
                      setPosTab={(tab) => {
                        setIsMobileCartOpen(false);
                        setPosTab(tab);
                      }}
                      getItemUnitPrice={getItemUnitPrice}
                      removeFromCart={removeFromCart}
                      setItemPresentation={setItemPresentation}
                      updateQuantity={updateQuantity}
                      subtotalNeto={subtotalNeto}
                      ivaCalculado={ivaCalculado}
                      cartSubtotal={cartSubtotal}
                      handleSendOrderToBodega={() => {
                        handleSendOrderToBodega();
                        setIsMobileCartOpen(false);
                      }}
                      handleOpenQuoteModal={() => {
                        setIsMobileCartOpen(false);
                        handleOpenQuoteModal();
                      }}
                      editingQuoteNumber={editingQuote?.quoteNumber || null}
                      onOpenQuoteHistory={() => {
                        setIsMobileCartOpen(false);
                        setPosTab('prefacturas');
                      }}
                      onOpenCheckout={() => {
                        setIsMobileCartOpen(false);
                        setOrderToInvoice(null);
                        setIsCheckoutOpen(true);
                      }}
                      isOrderDomicilio={isOrderDomicilio}
                      setIsOrderDomicilio={setIsOrderDomicilio}
                      domicilioPhone={domicilioPhone}
                      setDomicilioPhone={setDomicilioPhone}
                      domicilioDepartment={domicilioDepartment}
                      setDomicilioDepartment={setDomicilioDepartment}
                      domicilioMunicipality={domicilioMunicipality}
                      setDomicilioMunicipality={setDomicilioMunicipality}
                      domicilioAddress={domicilioAddress}
                      setDomicilioAddress={setDomicilioAddress}
                      domicilioReference={domicilioReference}
                      setDomicilioReference={setDomicilioReference}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ======================================================================= */}
        {/* PESTAÑA: CAJA & FACTURACIÓN (ESTILO MECANIC OS)                         */}
        {/* ======================================================================= */}
        {posTab === 'caja_facturacion' && (
          <PosCajaModule
            cajaSubTab={cajaSubTab}
            setCajaSubTab={setCajaSubTab}
            readyInWindowOrders={readyInWindowOrders}
            completedDteSales={completedDteSales}
            pendingPreparationCount={pendingPreparationCount}
            setPosTab={setPosTab}
            setActiveQuoteSale={setActiveQuoteSale}
            setIsQuoteModalOpen={setIsQuoteModalOpen}
            handleStartInvoiceOrder={handleStartInvoiceOrder}
            handleCancelReadyOrder={handleCancelReadyOrder}
            handleEditOrderInPos={handleEditOrderInPos}
            handleChangeOrderDteType={handleChangeOrderDteType}
            dteSearchQuery={dteSearchQuery}
            setDteSearchQuery={setDteSearchQuery}
            dteFilterType={dteFilterType}
            setDteFilterType={setDteFilterType}
            dteSortBy={dteSortBy}
            setDteSortBy={setDteSortBy}
            filteredDteSales={filteredDteSales}
            setSelectedSaleDetail={setSelectedSaleDetail}
            setCompletedSale={setCompletedSale}
            handleTransmitDte={handleTransmitDte}
            isTransmittingDteId={isTransmittingDteId}
            customers={customers}
            onOrderChanged={syncSalesFromServer}
          />
        )}

        {/* ======================================================================= */}
        {/* PESTAÑA 2: CLIENTES (MÓDULO BASADO EN MECANIC OS PARA FC Y CCF)         */}
        {/* ======================================================================= */}
        {posTab === 'clientes' && (
          <PosCustomerModule
            customers={customers}
            filteredCustomers={filteredCustomers}
            customerSearch={customerSearch}
            setCustomerSearch={setCustomerSearch}
            customerFilterType={customerFilterType}
            setCustomerFilterType={setCustomerFilterType}
            refreshCustomers={refreshCustomers}
            isSyncingCustomers={isSyncingCustomers}
            handleOpenNewCustomerModal={handleOpenNewCustomerModal}
            handleOpenEditCustomerModal={handleOpenEditCustomerModal}
            handleOpenCustomerDetailModal={handleOpenCustomerDetailModal}
            handleStartSaleForCustomer={handleStartSaleForCustomer}
          />
        )}

        {/* ======================================================================= */}
        {/* PESTAÑA 3: VENTAS (RESUMEN DEL DÍA Y ONZAS VENDIDAS)                     */}
        {/* ======================================================================= */}
        {posTab === 'ventas' && (
          <PosSalesModule
            sales={sales}
            totalOnzasVendidas={totalOnzasVendidas}
            totalMontoVentas={totalMontoVentas}
            totalBotesVendidos={totalBotesVendidos}
            rankingFragancias={rankingFragancias}
            ventasSearch={ventasSearch}
            setVentasSearch={setVentasSearch}
            setSelectedSaleDetail={setSelectedSaleDetail}
          />
        )}

        {/* ======================================================================= */}
        {/* PESTAÑA 4: ESTADO DE PEDIDOS EN BODEGA & VENTANILLA                     */}
        {/* ======================================================================= */}
        {posTab === 'bodega_ordenes' && (
          <PosBodegaModule
            sales={sales}
            products={products}
            readyInWindowCount={readyInWindowCount}
            pendingPreparationCount={pendingPreparationCount}
            completedOrdersCount={completedOrdersCount}
            bodegaOrdenesFilter={bodegaOrdenesFilter}
            setBodegaOrdenesFilter={setBodegaOrdenesFilter}
            bodegaOrdenesSearch={bodegaOrdenesSearch}
            setBodegaOrdenesSearch={setBodegaOrdenesSearch}
            filteredBodegaOrders={filteredBodegaOrders}
            setSelectedSaleDetail={setSelectedSaleDetail}
            handleMarkOrderReadyFromPos={handleMarkOrderReadyFromPos}
            handleCancelReadyOrder={handleCancelReadyOrder}
            handleEditOrderInPos={handleEditOrderInPos}
            handleMarkOrderDeliveredFromPos={handleMarkOrderDeliveredFromPos}
            customers={customers}
          />
        )}

        {/* ======================================================================= */}
        {/* PESTAÑA: DOMICILIO POS (DESPACHO Y GENERACIÓN DE GUÍA C807)             */}
        {/* ======================================================================= */}
        {posTab === 'domicilio' && (
          <PosDomicilioPanel onOrderChanged={syncSalesFromServer} />
        )}

        {/* ======================================================================= */}
        {/* PESTAÑA: PREFACTURAS (COTIZACIONES PENDIENTES DE CONFIRMAR)              */}
        {/* ======================================================================= */}
        {posTab === 'prefacturas' && (
          <PosPrefacturasModule
            refreshKey={prefacturasRefreshKey}
            onOpenQuote={(sale, notices) => {
              setActiveQuoteSale(sale);
              setActiveQuoteNotices(notices);
              setIsQuoteModalOpen(true);
            }}
            onEdit={handleEditQuoteInPos}
            onSendToBodega={handleSendQuoteToBodega}
            onCancel={handleCancelQuote}
            onChanged={refreshPrefacturasCount}
            onGoToCotizador={() => setPosTab('nueva_orden')}
          />
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FORMULARIO DE CLIENTE (ESTILO MECANIC OS PARA FC Y CCF)          */}
      {/* ========================================================================= */}
      <PosCustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        editingCustomerId={editingCustomerId}
        custTipoPersona={custTipoPersona}
        setCustTipoPersona={setCustTipoPersona}
        custTipoDocumento={custTipoDocumento}
        setCustTipoDocumento={setCustTipoDocumento}
        custDocumentoPreferido={custDocumentoPreferido}
        setCustDocumentoPreferido={setCustDocumentoPreferido}
        custName={custName}
        setCustName={setCustName}
        custNombreComercial={custNombreComercial}
        setCustNombreComercial={setCustNombreComercial}
        custNumDocumento={custNumDocumento}
        setCustNumDocumento={setCustNumDocumento}
        custNrc={custNrc}
        setCustNrc={setCustNrc}
        custGiro={custGiro}
        setCustGiro={setCustGiro}
        custCategoria={custCategoria}
        setCustCategoria={setCustCategoria}
        custEmail={custEmail}
        setCustEmail={setCustEmail}
        custPhone={custPhone}
        setCustPhone={setCustPhone}
        custDepartamento={custDepartamento}
        setCustDepartamento={setCustDepartamento}
        custMunicipio={custMunicipio}
        setCustMunicipio={setCustMunicipio}
        custDireccion={custDireccion}
        custTierId={custTierId}
        setCustTierId={setCustTierId}
        custCustomDiscountPct={custCustomDiscountPct}
        setCustCustomDiscountPct={setCustCustomDiscountPct}
        custBottleTierId={custBottleTierId}
        setCustBottleTierId={setCustBottleTierId}
        custBottleCustomDiscountPct={custBottleCustomDiscountPct}
        setCustBottleCustomDiscountPct={setCustBottleCustomDiscountPct}
        custSuppliesTierId={custSuppliesTierId}
        setCustSuppliesTierId={setCustSuppliesTierId}
        custSuppliesCustomDiscountPct={custSuppliesCustomDiscountPct}
        setCustSuppliesCustomDiscountPct={setCustSuppliesCustomDiscountPct}
        custSpecialEssencePrice={custSpecialEssencePrice}
        setCustSpecialEssencePrice={setCustSpecialEssencePrice}
        custSpecialHalfEssencePrice={custSpecialHalfEssencePrice}
        setCustSpecialHalfEssencePrice={setCustSpecialHalfEssencePrice}
        custSpecialBottlePrice={custSpecialBottlePrice}
        setCustSpecialBottlePrice={setCustSpecialBottlePrice}

        customerTiers={customerTiers}

        setCustDireccion={setCustDireccion}
        onSaveCustomer={handleSaveCustomer}
      />

      {/* ========================================================================= */}
      {/* MODAL 1.5: FICHA E HISTORIAL UNIFICADO DEL CLIENTE                         */}
      {/* ========================================================================= */}
      <PosCustomerDetailModal
        isOpen={isCustomerDetailModalOpen}
        onClose={() => {
          setIsCustomerDetailModalOpen(false);
          setSelectedCustomerForDetail(null);
        }}
        customer={selectedCustomerForDetail}
        onEditCustomer={handleOpenEditCustomerModal}
        onStartSale={handleStartSaleForCustomer}
      />

      {/* ========================================================================= */}
      {/* MODAL 2: MODAL DE COBRO Y EMISIÓN DTE                                     */}
      {/* ========================================================================= */}
      <PosCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setOrderToInvoice(null);
        }}
        orderToInvoice={orderToInvoice}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        handleSelectCustomer={handleSelectCustomer}
        handleOpenNewCustomerModal={handleOpenNewCustomerModal}
        tipoComprobante={tipoComprobante}
        setTipoComprobante={setTipoComprobante}
        clienteNombre={clienteNombre}
        setClienteNombre={setClienteNombre}
        clienteDoc={clienteDoc}
        setClienteDoc={setClienteDoc}
        clienteNrc={clienteNrc}
        setClienteNrc={setClienteNrc}
        clienteGiro={clienteGiro}
        setClienteGiro={setClienteGiro}
        clienteEmail={clienteEmail}
        setClienteEmail={setClienteEmail}
        clienteDepartamento={clienteDepartamento}
        setClienteDepartamento={setClienteDepartamento}
        clienteMunicipio={clienteMunicipio}
        setClienteMunicipio={setClienteMunicipio}
        clienteDireccion={clienteDireccion}
        setClienteDireccion={setClienteDireccion}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        cashAmount={cashAmount}
        setCashAmount={setCashAmount}
        currentBillingTotal={currentBillingTotal}
        isProcessing={isProcessing}
        handleCompleteSale={handleCompleteSale}
      />

      {/* ========================================================================= */}
      {/* MODAL 3: TICKET DE VENTA COMPLETADA                                       */}
      {/* ========================================================================= */}
      <PosCompletedSaleModal
        sale={completedSale}
        onClose={() => setCompletedSale(null)}
        onPrint={() => completedSale && printThermalTicketPdf(completedSale)}
        onDownloadPdf={() => completedSale && downloadThermalTicketPdf(completedSale)}
      />

      {/* ========================================================================= */}
      {/* MODAL 4: DETALLE DE VENTA PARA CONSULTA                                   */}
      {/* ========================================================================= */}
      <PosSaleDetailModal
        sale={selectedSaleDetail}
        onClose={() => setSelectedSaleDetail(null)}
        onPrint={() => selectedSaleDetail && printThermalTicketPdf(selectedSaleDetail)}
        onDownloadPdf={() => selectedSaleDetail && downloadThermalTicketPdf(selectedSaleDetail)}
      />

      {/* ========================================================================= */}
      {/* MODAL 5: COTIZACIÓN / PREFACTURA (EXPORTAR PDF Y WHATSAPP)                 */}
      {/* ========================================================================= */}
      <CotizacionModal
        isOpen={isQuoteModalOpen}
        onClose={() => {
          setIsQuoteModalOpen(false);
          setActiveQuoteNotices(null);
        }}
        sale={activeQuoteSale}
        notices={activeQuoteNotices}
      />

      <CotizacionesHistoryModal
        isOpen={isQuoteHistoryOpen}
        onClose={() => setIsQuoteHistoryOpen(false)}
        onOpenQuote={(sale, notices) => {
          setActiveQuoteSale(sale);
          setActiveQuoteNotices(notices);
          setIsQuoteModalOpen(true);
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 6: EDICIÓN RÁPIDA DE PRODUCTO DIRECTAMENTE DESDE POS                */}
      {/* ========================================================================= */}
      <PosQuickEditProductModal
        isOpen={isEditingProductOpen}
        onClose={() => {
          setIsEditingProductOpen(false);
          setEditingProductInPos(null);
        }}
        editingProduct={editingProductInPos}
        setEditingProduct={setEditingProductInPos}
        onSave={handleSaveProductFromPos}
        isSaving={isSavingProductInPos}
      />

      {/* ========================================================================= */}
      {/* TICKET TÉRMICO 70MM FORMATEADO PARA IMPRESIÓN (WINDOW.PRINT)              */}
      {/* ========================================================================= */}
      {(completedSale || selectedSaleDetail) && (
        <ThermalTicket ticket={(completedSale || selectedSaleDetail)!} />
      )}

    </div>
  );
}
