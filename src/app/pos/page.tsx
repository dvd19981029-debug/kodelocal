'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { INITIAL_PRODUCTS, ProductItem, CartItem, SaleRecord, PERFUME_CATEGORIES, getStoredProducts } from '@/lib/store';
import CotizacionModal from '@/components/pos/CotizacionModal';
import ThermalTicket from '@/components/pos/ThermalTicket';
import { PosCustomerModule } from '@/components/pos/PosCustomerModule';
import { PosSalesModule } from '@/components/pos/PosSalesModule';
import { PosCajaModule } from '@/components/pos/PosCajaModule';
import { PosBodegaModule } from '@/components/pos/PosBodegaModule';
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
import { getStaffToken } from '@/lib/auth';
import { 
  syncSaleOnlineOrQueue, 
  initOfflineSync, 
  getOfflineQueueCount, 
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
  PosCheckoutModal,
  PosCompletedSaleModal,
  PosSaleDetailModal,
  PosSidebar
} from './components';

export default function PosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>(() => getStoredProducts());
  
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

  // Cotización / Prefactura Modal
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [activeQuoteSale, setActiveQuoteSale] = useState<SaleRecord | null>(null);

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
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => getStoredCustomers());
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
      (c.phone && c.phone.toLowerCase().includes(q))
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
  useEffect(() => {
    saveStoredCustomers(customers);
  }, [customers]);

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

  const refreshCustomers = async () => {
    setIsSyncingCustomers(true);
    try {
      const res = await fetch('/api/customers');
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
  }, []);

  useEffect(() => {
    if (posTab === 'clientes') {
      refreshCustomers();
    }
  }, [posTab]);

  useEffect(() => {
    fetch('/api/products')
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

  useEffect(() => {
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
                nombre: o.customerName,
                telefono: o.customerPhone,
                correo: o.customerEmail || o.customer?.email || undefined,
                direccion: `${o.shippingAddress}, ${o.municipality}, ${o.department}`,
                numDocumento: o.customer?.documentNum || undefined,
                nrc: o.customer?.nrc || undefined,
                actividadEconomica: o.customer?.activityDesc || undefined,
                departamento: o.department,
                municipio: o.municipality,
              },
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
              if (prevMatch?.dteInfo && !ws.dteInfo) {
                return { ...ws, dteInfo: prevMatch.dteInfo, status: prevMatch.status || ws.status };
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
    fetch('/api/sales?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.sales)) {
          const dbSales: SaleRecord[] = data.sales.map((s: any) => ({
            id: s.id,
            saleNumber: s.saleNumber,
            orderNumber: s.saleNumber,
            createdAt: s.createdAt,
            invoicedAt: s.createdAt,
            channel: s.channel || 'POS',
            total: Number(s.total || 0),
            subtotal: Number(s.subtotal || 0),
            ivaTotal: Number(s.ivaTotal || 0),
            shippingCost: Number(s.shippingCost || 0),
            paymentMethod: s.paymentMethod || 'CASH',
            paymentStatus: s.paymentStatus || 'COMPLETED',
            status: s.orderStatus || 'COMPLETED',
            tipoComprobante: s.tipoComprobante || '01',
            cajero: s.cashierName || 'Caja 1',
            vendedor: s.sellerName || 'Mostrador',
            cliente: {
              nombre: s.customer?.name || 'Consumidor Final',
              numDocumento: s.customer?.documentNum || undefined,
              nrc: s.customer?.nrc || undefined,
              correo: s.customer?.email || undefined,
              telefono: s.customer?.phone || undefined,
              direccion: s.customer?.address || undefined,
              actividadEconomica: s.customer?.activityDesc || undefined,
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
          }));

          setSales(prev => {
            const mergedMap = new Map<string, SaleRecord>();
            dbSales.forEach(s => mergedMap.set(s.saleNumber, s));
            prev.forEach(p => {
              if (!mergedMap.has(p.saleNumber)) {
                mergedMap.set(p.saleNumber, p);
              } else {
                const existing = mergedMap.get(p.saleNumber)!;
                if (!existing.dteInfo && p.dteInfo) {
                  existing.dteInfo = p.dteInfo;
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
  }, []);

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(product => {
      const matchesCat = selectedCategory === 'Todos' || product.category === selectedCategory;
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

  const activeEssencePrice = sampleEssence?.price ?? 3.25;
  const activeEssenceHalfPrice = sampleEssence?.priceHalfOunce != null 
    ? Number(sampleEssence.priceHalfOunce) 
    : Number((activeEssencePrice / 2).toFixed(2));

  // Helper para obtener el precio unitario del item según su presentación
  const getItemUnitPrice = (item: CartItem): number => {
    if (item.presentation === 'MEDIA_ONZA') {
      return item.product.priceHalfOunce != null 
        ? Number(item.product.priceHalfOunce) 
        : Number((item.product.price / 2).toFixed(2));
    }
    return item.product.price;
  };

  // Helper para formatear items de venta/comanda con presentación
  const formatCartItem = (i: CartItem) => {
    const isHalfOz = i.presentation === 'MEDIA_ONZA';
    const unitPrice = getItemUnitPrice(i);
    const displayName = i.product.officialName && i.product.officialName !== i.product.name
      ? `${i.product.officialName} (${i.product.name})`
      : i.product.name;
    return {
      productId: i.product.id,
      name: isHalfOz ? `${displayName} (½ Oz)` : displayName,
      quantity: i.quantity,
      price: unitPrice,
      total: Number((i.quantity * unitPrice).toFixed(2)),
      unit: isHalfOz ? '½ Onza' : (i.product.unit || 'Unidad'),
      presentation: i.presentation || 'ONZA_COMPLETA',
      puesto: i.product.puesto
    };
  };

  // Totales del carrito
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (getItemUnitPrice(item) * item.quantity), 0);
  }, [cart]);

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

  const handleMarkOrderDeliveredFromPos = (orderId: string) => {
    setSales(prev => {
      const updated = prev.map(s => {
        if (s.id === orderId) {
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
    if (product.stock <= 0) {
      alert('¡Producto sin existencias!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => 
        item.product.id === product.id && 
        (item.presentation || 'ONZA_COMPLETA') === presentation
      );
      // Calcular onzas consumidas en el carrito para este producto
      const currentOz = prev
        .filter(it => it.product.id === product.id)
        .reduce((sum, it) => sum + (it.presentation === 'MEDIA_ONZA' ? it.quantity * 0.5 : it.quantity), 0);
      const addOz = presentation === 'MEDIA_ONZA' ? 0.5 : 1;

      if (currentOz + addOz > product.stock) {
        alert(`Stock máximo alcanzado (${product.stock} disponibles).`);
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
        const currentOz = prev
          .filter(it => it.product.id === productId)
          .reduce((sum, it) => sum + (it.presentation === 'MEDIA_ONZA' ? it.quantity * 0.5 : it.quantity), 0);
        const addOz = presentation === 'MEDIA_ONZA' ? 0.5 : 1;
        if (currentOz + addOz > targetItem.product.stock) {
          alert(`Stock máximo alcanzado (${targetItem.product.stock} disponibles).`);
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
      const otherOz = prev
        .filter(it => it.product.id === productId && it !== currentItem && it !== existingTarget)
        .reduce((sum, it) => sum + (it.presentation === 'MEDIA_ONZA' ? it.quantity * 0.5 : it.quantity), 0);
      const combinedQty = currentItem.quantity + (existingTarget ? existingTarget.quantity : 0);
      const neededOz = newPres === 'MEDIA_ONZA' ? combinedQty * 0.5 : combinedQty;

      if (otherOz + neededOz > currentItem.product.stock) {
        alert(`Stock insuficiente para cambiar a ${newPres === 'MEDIA_ONZA' ? '½ Onza' : '1 Onza'} (${currentItem.product.stock} disponibles).`);
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
  };

  const handleOpenEditProduct = (e: React.MouseEvent, product: ProductItem) => {
    e.stopPropagation();
    setEditingProductInPos({ ...product });
    setIsEditingProductOpen(true);
  };

  const handleSaveProductFromPos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductInPos || !editingProductInPos.name.trim()) {
      alert('El nombre o inspiración es requerido.');
      return;
    }

    setIsSavingProductInPos(true);
    const prodToSave = { ...editingProductInPos };

    // 1. Actualización optimista inmediata en estado local
    setProducts(prev => {
      const updated = prev.map(p => (p.id === prodToSave.id || (p.sku && p.sku === prodToSave.sku)) ? { ...p, ...prodToSave } : p);
      localStorage.setItem('kodelocal_products', JSON.stringify(updated));
      window.dispatchEvent(new Event('kodelocal_products_updated'));
      return updated;
    });

    // También actualizar en carrito si el producto estaba agregado
    setCart(prev => prev.map(it => {
      if (it.product.id === prodToSave.id || (it.product.sku && it.product.sku === prodToSave.sku)) {
        return { ...it, product: { ...it.product, ...prodToSave } };
      }
      return it;
    }));

    setIsEditingProductOpen(false);

    // 2. Persistir en la base de datos de Supabase
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          id: prodToSave.id,
          sku: prodToSave.sku,
          brand: prodToSave.brand,
          name: prodToSave.name,
          officialName: prodToSave.officialName,
          price: Number(prodToSave.price),
          priceHalfOunce: prodToSave.priceHalfOunce != null ? Number(prodToSave.priceHalfOunce) : undefined,
          finishedPerfumePrice: prodToSave.finishedPerfumePrice != null ? Number(prodToSave.finishedPerfumePrice) : undefined,
          cost: Number(prodToSave.cost || 0),
          stock: Number(prodToSave.stock || 0),
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

  // Autocompletar datos de cliente al seleccionarlo
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const found = customers.find(c => c.id === customerId);
    if (found) {
      setClienteNombre(found.name);
      setClienteDoc(found.numDocumento);
      setClienteNrc(found.nrc || '');
      setClienteEmail(found.email || '');
      setClienteGiro(found.actividadEconomica || '');
      const dept = found.departamento || 'San Salvador';
      setClienteDepartamento(dept);
      const munis = getMunicipiosByDepartamento(dept);
      const muniMatch = munis.find(m => m.nombre.toLowerCase() === (found.municipio || '').toLowerCase());
      setClienteMunicipio(muniMatch ? muniMatch.nombre : (munis[0]?.nombre || 'San Salvador Centro'));
      setClienteDireccion(found.direccion || '');
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
      setClienteMunicipio('San Salvador Centro');
      setClienteDireccion('');
      setTipoComprobante('01');
    }
  };

  // Iniciar venta directa desde el módulo de clientes
  const handleStartSaleForCustomer = (cust: CustomerRecord) => {
    handleSelectCustomer(cust.id);
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
    setCustMunicipio(munis[0]?.nombre || 'San Salvador Centro');
    setCustDireccion('');
    setCustNotas('');
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
    const munis = getMunicipiosByDepartamento(dept);
    const muniMatch = munis.find(m => m.nombre.toLowerCase() === (cust.municipio || '').toLowerCase());
    setCustMunicipio(muniMatch ? muniMatch.nombre : (munis[0]?.nombre || 'San Salvador Centro'));
    setCustDireccion(cust.direccion || '');
    setCustNotas(cust.notas || '');
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
    };

    // Guardar en Supabase PostgreSQL
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingCustomerId || undefined,
        ...customerPayload,
      }),
    }).catch(err => console.error('Error guardando cliente en Supabase:', err));

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
        handleSelectCustomer(editingCustomerId);
      }
    } else {
      const newCust: CustomerRecord = {
        id: `cli-${Date.now()}`,
        ...customerPayload,
        createdAt: new Date().toISOString()
      };
      setCustomers(prev => {
        const updated = [newCust, ...prev];
        saveStoredCustomers(updated);
        return updated;
      });
      handleSelectCustomer(newCust.id);
    }

    setIsCustomerModalOpen(false);
  };

  // Iniciar cotización en PDF / Prefactura
  const handleOpenQuoteModal = () => {
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

    const newOrder: SaleRecord = {
      id: `ord-${Date.now()}`,
      orderNumber: ordNum,
      saleNumber: cmdNum,
      createdAt: new Date().toISOString(),
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
      status: 'PENDING_PREPARATION',
      vendedor: 'Vendedora Mostrador',
      items: cart.map(formatCartItem)
    };

    const savedSales = JSON.parse(localStorage.getItem('kodelocal_sales') || '[]');
    const updatedSales = [newOrder, ...savedSales];
    localStorage.setItem('kodelocal_sales', JSON.stringify(updatedSales));
    window.dispatchEvent(new Event('kodelocal_sales_updated'));
    setSales(updatedSales);

    const totalQty = cart.reduce((acc, i) => acc + i.quantity, 0);
    clearCart();
    setOrderSentToast({ orderNumber: ordNum, itemCount: totalQty });
    setTimeout(() => {
      setOrderSentToast(null);
    }, 7000);
  };

  // Iniciar cobro de orden lista en ventanilla (desde Caja)
  const handleStartInvoiceOrder = (order: SaleRecord) => {
    setOrderToInvoice(order);

    // Buscar si el cliente ya está registrado en la base de datos de clientes
    const normName = order.cliente?.nombre?.toLowerCase().trim();
    const normEmail = order.cliente?.correo?.toLowerCase().trim();
    const cleanPhone = order.cliente?.telefono?.replace(/\D/g, '');

    const matchedCust = customers.find(c => {
      if (normEmail && c.email && c.email.toLowerCase().trim() === normEmail) return true;
      if (cleanPhone && c.phone && c.phone.replace(/\D/g, '') === cleanPhone) return true;
      if (normName && c.name && c.name.toLowerCase().trim() === normName) return true;
      return false;
    });

    const nombre = order.cliente?.nombre || matchedCust?.name || 'Consumidor Final';
    const doc = order.cliente?.numDocumento || matchedCust?.numDocumento || '';
    const nrc = order.cliente?.nrc || matchedCust?.nrc || '';
    const email = order.cliente?.correo || matchedCust?.email || '';
    const giro = order.cliente?.actividadEconomica || matchedCust?.actividadEconomica || '';
    const direccion = order.cliente?.direccion || matchedCust?.direccion || '';
    const departamento = order.cliente?.departamento || matchedCust?.departamento || 'San Salvador';
    const municipio = order.cliente?.municipio || matchedCust?.municipio || 'San Salvador Centro';

    const tipo: '01' | '03' = (order.tipoComprobante === '03' || matchedCust?.documentoPreferido === '03' || nrc) ? '03' : '01';

    setClienteNombre(nombre);
    setClienteDoc(doc);
    setClienteNrc(nrc);
    setClienteEmail(email);
    setClienteGiro(giro);
    setClienteDireccion(direccion);
    setClienteDepartamento(departamento);
    setClienteMunicipio(municipio);
    setTipoComprobante(tipo);
    // Sincronizar método de pago de la orden web
    const ordMethod = order.paymentMethod || 'CARD';
    setPaymentMethod(ordMethod);

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

    let dteResponseData = null;
    if (tipoComprobante === '01' || tipoComprobante === '03') {
      try {
        const saleRefId = isOrderFromWindow
          ? (orderToInvoice.orderNumber || orderToInvoice.saleNumber || orderToInvoice.id)
          : `POS-${Date.now()}`;

        const res = await fetch('/api/dte', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

    // Descontar inventario oficial
    setProducts(prev => {
      const updated = prev.map(prod => {
        const matchingItems = itemsToBill.filter(ci => ci.productId === prod.id);
        if (matchingItems.length > 0) {
          const totalStockDeduct = matchingItems.reduce((sum, ci) => {
            const isHalf = (ci as any).presentation === 'MEDIA_ONZA' || ci.unit === '½ Onza' || String(ci.name).includes('½');
            return sum + (isHalf ? Math.ceil(ci.quantity * 0.5) : ci.quantity);
          }, 0);
          return { ...prod, stock: Math.max(0, prod.stock - totalStockDeduct) };
        }
        return prod;
      });
      localStorage.setItem('kodelocal_products', JSON.stringify(updated));
      window.dispatchEvent(new Event('kodelocal_products_updated'));
      return updated;
    });

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
            cajero: 'Caja 1',
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
          cajero: 'Caja 1',
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
    } else {
      // Venta directa desde el mostrador
      const saleNumber = `CMD-${Math.floor(1000 + Math.random() * 9000)}`;
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
        cliente: {
          nombre: clienteNombre,
          numDocumento: clienteDoc,
          nrc: clienteNrc,
          correo: clienteEmail,
          actividadEconomica: clienteGiro || undefined,
          direccion: clienteDireccion || undefined,
          departamento: clienteDepartamento || undefined,
          municipio: clienteMunicipio || undefined,
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
        cajero: 'Caja 1',
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
      syncSaleOnlineOrQueue({
        saleNumber: completedRecord.saleNumber,
        channel: 'POS',
        subtotal: completedRecord.subtotal,
        ivaTotal: completedRecord.ivaTotal,
        total: completedRecord.total,
        paymentMethod: completedRecord.paymentMethod || 'CASH',
        cashReceived: completedRecord.cashReceived,
        cashChange: completedRecord.cashChange,
        notes: completedRecord.tipoComprobante,
        tipoComprobante: completedRecord.tipoComprobante,
        codigoGeneracion: completedRecord.dteInfo?.codigoGeneracion,
        cashierName: completedRecord.cajero || 'Caja 1',
        cliente: {
          nombre: clienteNombre || completedRecord.cliente?.nombre || 'Consumidor Final',
          numDocumento: clienteDoc || completedRecord.cliente?.numDocumento,
          nrc: clienteNrc || completedRecord.cliente?.nrc,
          email: clienteEmail || completedRecord.cliente?.correo,
          giro: clienteGiro || completedRecord.cliente?.actividadEconomica,
          telefono: selectedCustomerObj?.phone,
          direccion: clienteDireccion || selectedCustomerObj?.direccion,
          departamento: clienteDepartamento || selectedCustomerObj?.departamento || 'San Salvador',
          municipio: clienteMunicipio || selectedCustomerObj?.municipio || 'San Salvador Centro',
        },
        requiresDte: (completedRecord.tipoComprobante === '01' || completedRecord.tipoComprobante === '03') && !completedRecord.dteInfo?.codigoGeneracion,
        items: completedRecord.items.map(it => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          total: it.total,
          unit: it.unit,
        })),
      }, (freshProds) => {
        setProducts(freshProds);
      }).then(syncRes => {
        if (syncRes.offline) {
          console.warn('📦 Venta resguardada en cola offline:', syncRes.error);
        }
      });

      // Si era una orden web de ventanilla, sincronizar estado ENTREGADO en base de datos
      if (isOrderFromWindow && orderToInvoice.orderNumber) {
        getStaffToken().then(staffToken => {
          fetch('/api/ecommerce/orders', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(staffToken ? { 'x-staff-token': staffToken } : {}),
            },
            body: JSON.stringify({
              orderNumber: orderToInvoice.orderNumber,
              orderStatus: 'ENTREGADO',
              notes: `[Entregado y Facturado en Caja ${dteResponseData?.codigoGeneracion ? `- DTE: ${dteResponseData.codigoGeneracion}` : ''}]`,
            }),
          }).catch(err => console.error('Error actualizando pedido ecommerce a ENTREGADO:', err));
        });
      }
    }
  };

  // Transmitir un DTE pendiente desde la tabla de Caja a Factura Llama / MH
  const handleTransmitDte = async (sale: SaleRecord) => {
    setIsTransmittingDteId(sale.id || sale.saleNumber);
    try {
      const res = await fetch('/api/dte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    return completedDteSales.filter(sale => {
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
    });
  }, [completedDteSales, dteFilterType, dteSearchQuery]);

  // Monto total a cobrar (depende de si se factura comanda de ventanilla o carrito directo)
  const currentBillingTotal = useMemo(() => {
    return orderToInvoice ? orderToInvoice.total : cartSubtotal;
  }, [orderToInvoice, cartSubtotal]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-16 max-w-[1650px] mx-auto items-start">
      
      {/* ========================================================================= */}
      {/* MENÚ LATERAL IZQUIERDO DE PUNTO DE VENTA (DINÁMICO / EXPANDIBLE AL HOVER) */}
      {/* ========================================================================= */}
      <PosSidebar
        posTab={posTab}
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
        onFlushOfflineQueue={() => flushOfflineQueue((p) => setProducts(p))}
        onNavigateLogistica={() => router.push('/logistica')}
      />

      {/* ========================================================================= */}
      {/* ÁREA DE CONTENIDO A LA DERECHA                                            */}
      {/* ========================================================================= */}
      <div className="flex-1 w-full min-w-0">

        {/* ======================================================================= */}
        {/* PESTAÑA 1: NUEVA ORDEN / COTIZADOR Y TERMINAL DE VENTA                   */}
        {/* ======================================================================= */}
        {(posTab === 'nueva_orden' || posTab === 'pos') && (
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
              cart={cart}
              onAddToCart={addToCart}
              onOpenEditProduct={handleOpenEditProduct}
            />

            <PosCartPanel
              cart={cart}
              totalItemsCount={totalItemsCount}
              clearCart={clearCart}
              selectedCustomerObj={selectedCustomerObj}
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
              onOpenCheckout={() => {
                setOrderToInvoice(null);
                setIsCheckoutOpen(true);
              }}
            />
          </div>
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
            dteSearchQuery={dteSearchQuery}
            setDteSearchQuery={setDteSearchQuery}
            dteFilterType={dteFilterType}
            setDteFilterType={setDteFilterType}
            filteredDteSales={filteredDteSales}
            setSelectedSaleDetail={setSelectedSaleDetail}
            setCompletedSale={setCompletedSale}
            handleTransmitDte={handleTransmitDte}
            isTransmittingDteId={isTransmittingDteId}
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
            handleMarkOrderDeliveredFromPos={handleMarkOrderDeliveredFromPos}
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
        setCustDireccion={setCustDireccion}
        onSaveCustomer={handleSaveCustomer}
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
        onPrint={() => window.print()}
      />

      {/* ========================================================================= */}
      {/* MODAL 4: DETALLE DE VENTA PARA CONSULTA                                   */}
      {/* ========================================================================= */}
      <PosSaleDetailModal
        sale={selectedSaleDetail}
        onClose={() => setSelectedSaleDetail(null)}
        onPrint={() => window.print()}
      />

      {/* ========================================================================= */}
      {/* MODAL 5: COTIZACIÓN / PREFACTURA (EXPORTAR PDF Y WHATSAPP)                 */}
      {/* ========================================================================= */}
      <CotizacionModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        sale={activeQuoteSale}
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
