'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Barcode, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Printer, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Sparkles, 
  AlertCircle,
  X,
  FileCheck,
  Building,
  Building2,
  User,
  Users,
  UserPlus,
  Sparkle,
  Droplets,
  Tag,
  ReceiptText,
  Truck,
  Store,
  DollarSign,
  TrendingUp,
  Eye,
  Clock,
  MapPin,
  Phone,
  Edit3,
  Check,
  FileText,
  Flame,
  Box,
  ExternalLink,
  Copy,
  Send,
  CheckCheck,
  RotateCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { INITIAL_PRODUCTS, ProductItem, CartItem, SaleRecord, PERFUME_CATEGORIES, getStoredProducts } from '@/lib/store';
import CotizacionModal from '@/components/pos/CotizacionModal';
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

export default function PosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>(() => getStoredProducts());
  
  // Pestaña activa en el menú lateral de Punto de Venta:
  // 'nueva_orden' (o 'pos'): Terminal de venta / Cotizador
  // 'caja_facturacion': Módulo de Caja (Órdenes listas en ventanilla y DTEs emitidos)
  // 'clientes': Directorio y registro fiscal para FC y CCF
  // 'ventas': Resumen de onzas vendidas en el turno
  // 'bodega_ordenes': Monitoreo de comandas en preparación
  const [posTab, setPosTab] = useState<'nueva_orden' | 'caja_facturacion' | 'clientes' | 'ventas' | 'bodega_ordenes' | 'pos'>('nueva_orden');

  // Subpestañas en Caja & Facturación (Estilo Mecanic OS)
  const [cajaSubTab, setCajaSubTab] = useState<'listas_facturar' | 'dtes_emitidos'>('listas_facturar');
  const [dteFilterType, setDteFilterType] = useState<'ALL' | '01' | '03' | 'TICKET'>('ALL');
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
  const [bodegaOrdenesFilter, setBodegaOrdenesFilter] = useState<'ALL' | 'PENDING' | 'READY' | 'COMPLETED'>('ALL');
  const [bodegaOrdenesSearch, setBodegaOrdenesSearch] = useState('');

  // Clientes
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => getStoredCustomers());
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilterType, setCustomerFilterType] = useState<'TODOS' | 'NATURAL' | 'JURIDICA'>('TODOS');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // Formulario de Cliente (Estilo Mecanic OS para FC y CCF)
  const [custTipoPersona, setCustTipoPersona] = useState<TipoPersona>('NATURAL');
  const [custName, setCustName] = useState('');
  const [custNombreComercial, setCustNombreComercial] = useState('');
  const [custTipoDocumento, setCustTipoDocumento] = useState<TipoDocumentoCliente>('DUI');
  const [custNumDocumento, setCustNumDocumento] = useState('');
  const [custNrc, setCustNrc] = useState('');
  const [custGiro, setCustGiro] = useState(GIROS_COMUNES_SV[0]);
  const [custCategoria, setCustCategoria] = useState<CategoriaContribuyente>('OTRO');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custDepartamento, setCustDepartamento] = useState(DEPARTAMENTOS_SV[0]);
  const [custMunicipio, setCustMunicipio] = useState('');
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
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'BITCOIN'>('CASH');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [tipoComprobante, setTipoComprobante] = useState<'TICKET' | '01' | '03'>('01');
  
  // Datos de cliente en venta activa
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [clienteDoc, setClienteDoc] = useState('');
  const [clienteNrc, setClienteNrc] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteGiro, setClienteGiro] = useState('');

  // Proceso de emisión
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);

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
        (product.brand && product.brand.toLowerCase().includes(q)) ||
        (product.puesto && product.puesto.toLowerCase().includes(q)) ||
        product.barcode.includes(q);

      return matchesCat && matchesGender && matchesQuery;
    });
  }, [products, selectedCategory, selectedGender, searchQuery]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, 60);
  }, [filteredProducts]);

  // Totales del carrito
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
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
  const addToCart = (product: ProductItem) => {
    if (product.stock <= 0) {
      alert('¡Producto sin existencias!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stock máximo alcanzado (${product.stock} disponibles).`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            alert(`Stock máximo alcanzado (${item.product.stock} disponibles).`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
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
      if (found.nrc || found.tipoPersona === 'JURIDICA') {
        setTipoComprobante('03');
      } else {
        setTipoComprobante('01');
      }
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
    setCustEmail('');
    setCustPhone('');
    setCustDepartamento(DEPARTAMENTOS_SV[0]);
    setCustMunicipio('');
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
    setCustEmail(cust.email);
    setCustPhone(cust.phone);
    setCustDepartamento(cust.departamento || DEPARTAMENTOS_SV[0]);
    setCustMunicipio(cust.municipio || '');
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

    if (editingCustomerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === editingCustomerId) {
          return {
            ...c,
            tipoPersona: custTipoPersona,
            name: custName.trim(),
            nombreComercial: custNombreComercial.trim() || undefined,
            tipoDocumento: custTipoDocumento,
            numDocumento: custNumDocumento.trim(),
            nrc: custNrc.trim() || undefined,
            actividadEconomica: custGiro.trim() || undefined,
            categoriaContribuyente: custCategoria,
            email: custEmail.trim(),
            phone: custPhone.trim(),
            departamento: custDepartamento,
            municipio: custMunicipio.trim() || undefined,
            direccion: custDireccion.trim() || undefined,
            notas: custNotas.trim() || undefined
          };
        }
        return c;
      }));
    } else {
      const newCust: CustomerRecord = {
        id: `cli-${Date.now()}`,
        tipoPersona: custTipoPersona,
        name: custName.trim(),
        nombreComercial: custNombreComercial.trim() || undefined,
        tipoDocumento: custTipoDocumento,
        numDocumento: custNumDocumento.trim(),
        nrc: custNrc.trim() || undefined,
        actividadEconomica: custGiro.trim() || undefined,
        categoriaContribuyente: custCategoria,
        email: custEmail.trim(),
        phone: custPhone.trim(),
        departamento: custDepartamento,
        municipio: custMunicipio.trim() || undefined,
        direccion: custDireccion.trim() || undefined,
        notas: custNotas.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      setCustomers(prev => [newCust, ...prev]);
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
      items: cart.map(i => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
        total: i.quantity * i.product.price,
        unit: i.product.unit,
        puesto: i.product.puesto
      }))
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
      items: cart.map(i => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
        total: i.quantity * i.product.price,
        unit: i.product.unit,
        puesto: i.product.puesto
      }))
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
    setClienteNombre(order.cliente.nombre);
    setClienteDoc(order.cliente.numDocumento || '');
    setClienteNrc(order.cliente.nrc || '');
    setClienteEmail(order.cliente.correo || '');
    setClienteGiro(order.cliente.actividadEconomica || '');
    setTipoComprobante(order.tipoComprobante || (order.cliente.nrc ? '03' : '01'));
    setPaymentMethod('CASH');
    setCashAmount('');
    setIsCheckoutOpen(true);
  };

  // Finalizar venta, emitir DTE oficial ante Hacienda y descontar stock
  const handleCompleteSale = async () => {
    const isOrderFromWindow = !!orderToInvoice;
    const itemsToBill = isOrderFromWindow ? orderToInvoice.items : cart.map(i => ({
      productId: i.product.id,
      name: i.product.name,
      quantity: i.quantity,
      price: i.product.price,
      total: i.quantity * i.product.price,
      unit: i.product.unit,
      puesto: i.product.puesto
    }));
    const totalToBill = isOrderFromWindow ? orderToInvoice.total : cartSubtotal;
    const subtotalToBill = isOrderFromWindow ? orderToInvoice.subtotal : subtotalNeto;
    const ivaToBill = isOrderFromWindow ? orderToInvoice.ivaTotal : ivaCalculado;

    if (itemsToBill.length === 0) return;

    if (paymentMethod === 'CASH') {
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
        const res = await fetch('/api/dte', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipoDte: tipoComprobante,
            saleId: isOrderFromWindow ? orderToInvoice.id : `sale-${Date.now()}`,
            cliente: {
              nombre: clienteNombre,
              numDocumento: clienteDoc,
              nrc: clienteNrc,
              email: clienteEmail,
              giro: clienteGiro
            },
            items: itemsToBill.map(i => ({
              nombre: i.name,
              cantidad: i.quantity,
              precioUnitario: i.price,
              total: i.total,
              unit: i.unit
            })),
            total: totalToBill,
            subtotal: subtotalToBill,
            iva: ivaToBill,
            metodoPago: paymentMethod
          })
        });
        const data = await res.json();
        if (data.success && data.dte) {
          dteResponseData = data.dte;
        }
      } catch (err) {
        console.error('Error al emitir DTE:', err);
      }
    }

    // Descontar inventario oficial
    setProducts(prev => {
      const updated = prev.map(prod => {
        const itemInBill = itemsToBill.find(ci => ci.productId === prod.id);
        if (itemInBill) {
          return { ...prod, stock: Math.max(0, prod.stock - itemInBill.quantity) };
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
      const updatedSales = savedSales.map(s => {
        if (s.id === orderToInvoice.id) {
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
              actividadEconomica: clienteGiro || undefined
            },
            dteInfo: dteResponseData ? {
              codigoGeneracion: dteResponseData.codigoGeneracion,
              numeroControl: dteResponseData.numeroControl,
              selloRecepcion: dteResponseData.selloRecepcion,
              estado: dteResponseData.estado,
              simulated: dteResponseData.simulated,
              mensaje: dteResponseData.mensaje
            } : undefined
          };
          completedRecord = updated;
          return updated;
        }
        return s;
      });

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
          correo: clienteEmail
        },
        dteInfo: dteResponseData ? {
          codigoGeneracion: dteResponseData.codigoGeneracion,
          numeroControl: dteResponseData.numeroControl,
          selloRecepcion: dteResponseData.selloRecepcion,
          estado: dteResponseData.estado,
          simulated: dteResponseData.simulated,
          mensaje: dteResponseData.mensaje
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
      {/* MENÚ LATERAL IZQUIERDO DE PUNTO DE VENTA                                  */}
      {/* ========================================================================= */}
      <aside className="w-full lg:w-64 shrink-0 space-y-4">
        
        <div className="clay-card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-xs text-slate-800 leading-tight">Punto de Venta</h2>
            <p className="text-[10px] text-slate-500 font-medium">Caja & Facturación DTE</p>
          </div>
        </div>

        <div className="clay-card p-2.5 space-y-1.5">
          <p className="px-2.5 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
            Módulos de Atención
          </p>

          {/* Botón 1: Nueva Orden / Cotizador */}
          <button
            type="button"
            onClick={() => setPosTab('nueva_orden')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
              posTab === 'nueva_orden' || posTab === 'pos'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              <span>Cotizador / Orden</span>
            </div>
            {totalItemsCount > 0 && (
              <span className={`clay-badge text-[10px] font-black px-2 py-0.5 ${
                posTab === 'nueva_orden' || posTab === 'pos' ? 'bg-white text-indigo-900' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* Botón 2: Caja & Facturación (Estilo Mecanic OS) */}
          <button
            type="button"
            onClick={() => setPosTab('caja_facturacion')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
              posTab === 'caja_facturacion'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-emerald-600" />
              <span>Caja & Facturación</span>
            </div>
            {readyInWindowCount > 0 ? (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500 text-white animate-pulse shadow-sm" title="Órdenes listas en ventanilla para facturar">
                {readyInWindowCount} listo{readyInWindowCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                {completedDteSales.length} DTE
              </span>
            )}
          </button>

          {/* Botón 3: Clientes (Módulo estilo Mecanic OS para FC y CCF) */}
          <button
            type="button"
            onClick={() => setPosTab('clientes')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
              posTab === 'clientes'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Clientes</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-bold">
              {customers.length}
            </span>
          </button>

          {/* Botón 4: Estado de Pedidos en Bodega */}
          <button
            type="button"
            onClick={() => setPosTab('bodega_ordenes')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
              posTab === 'bodega_ordenes'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-amber-500" />
              <span>Pedidos en Bodega</span>
            </div>
            <div className="flex items-center gap-1">
              {pendingPreparationCount > 0 ? (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  posTab === 'bodega_ordenes' ? 'bg-white text-indigo-900' : 'bg-amber-100 text-amber-900'
                }`} title="Pedidos en preparación en bodega">
                  {pendingPreparationCount} prep.
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">0</span>
              )}
            </div>
          </button>

          {/* Botón 5: Ventas (Resumen diario de onzas vendidas) */}
          <button
            type="button"
            onClick={() => setPosTab('ventas')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
              posTab === 'ventas'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Ventas & Onzas</span>
            </div>
            <span className={`clay-badge text-[10px] font-mono font-bold px-1.5 py-0.5 ${
              posTab === 'ventas' ? 'bg-white text-indigo-900' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {totalOnzasVendidas} Oz
            </span>
          </button>

          {/* Botón 6: Envíos & Domicilio */}
          <button
            type="button"
            onClick={() => router.push('/logistica')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Envíos & Domicilio</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Resumen del Día en Menú Lateral */}
        <div className="clay-card p-3.5 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-100/80 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-indigo-950 text-[11px] flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-indigo-600" />
              <span>Onzas Hoy:</span>
            </span>
            <span className="font-mono font-black text-xs text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
              {totalOnzasVendidas} Oz
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-indigo-100/60 text-slate-600 text-[11px]">
            <span>Total Cobrado:</span>
            <strong className="font-mono text-slate-800">${totalMontoVentas.toFixed(2)}</strong>
          </div>

          <div className="flex items-center justify-between text-slate-600 text-[11px]">
            <span>Listos Ventanilla:</span>
            <strong className={`font-mono ${readyInWindowCount > 0 ? 'text-emerald-700 font-black' : 'text-slate-800'}`}>
              {readyInWindowCount}
            </strong>
          </div>

          <div className="flex items-center justify-between text-slate-600 text-[11px]">
            <span>Comprobantes:</span>
            <strong className="font-mono text-slate-800">{sales.length}</strong>
          </div>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* ÁREA DE CONTENIDO A LA DERECHA                                            */}
      {/* ========================================================================= */}
      <div className="flex-1 w-full min-w-0">

        {/* ======================================================================= */}
        {/* PESTAÑA 1: NUEVA ORDEN / COTIZADOR Y TERMINAL DE VENTA                   */}
        {/* ======================================================================= */}
        {(posTab === 'nueva_orden' || posTab === 'pos') && (
          <div className="flex flex-col xl:flex-row gap-6">
            
            {/* Columna Izquierda del POS: Buscador y Catálogo */}
            <div className="flex-1 flex flex-col gap-5 min-w-0">
              
              {/* Barra superior de Búsqueda y Cotizador Rápido */}
              <div className="clay-card p-4 sm:p-5 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                  <input
                    type="search"
                    name="search-fragrance"
                    id="search-fragrance"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Buscar por código (100), contratipo (Sauvage), marca..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="clay-input has-icon w-full pr-4 py-2.5 text-sm font-bold"
                  />
                </div>

                <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-60" autoComplete="off">
                  <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 pointer-events-none z-10" />
                  <input
                    type="text"
                    name="quick-sku"
                    id="quick-sku"
                    autoComplete="off"
                    placeholder="Código o SKU..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="clay-input has-icon w-full pr-4 py-2.5 text-sm font-mono font-bold border-indigo-200"
                  />
                </form>
              </div>

              {/* Filtro de Categorías */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['Todos', ...PERFUME_CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`clay-btn px-4 py-2 text-xs rounded-full whitespace-nowrap transition-all font-bold ${
                      selectedCategory === cat ? 'clay-btn-primary' : 'clay-btn-light'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Filtro de Género (para esencias) */}
              {selectedCategory === 'Esencias para Perfume' && (
                <div className="clay-card p-2 px-4 flex items-center justify-between gap-4 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Género:
                  </span>
                  <div className="flex items-center gap-1">
                    {['Todos', 'Caballero', 'Dama', 'Unisex'].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => setSelectedGender(gender)}
                        className={`px-3 py-1 rounded-full text-xs transition-all font-bold ${
                          selectedGender === gender
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {gender === 'Caballero' ? '🧔 Caballero' : gender === 'Dama' ? '👩 Dama' : gender === 'Unisex' ? '⚧ Unisex' : 'Todos'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conteo de Resultados y Precio Base */}
              <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                <span>Mostrando <strong>{displayedProducts.length}</strong> de {filteredProducts.length} productos</span>
                <span className="font-bold text-indigo-600">Precio Esencia: $3.25 / Oz</span>
              </div>

              {/* Rejilla de Productos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {displayedProducts.map((product) => {
                  const itemInCart = cart.find(i => i.product.id === product.id);
                  const cartQty = itemInCart ? itemInCart.quantity : 0;
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= product.minStock;
                  const availableRemaining = product.stock - cartQty;

                  return (
                    <div 
                      key={product.id}
                      onClick={() => !isOutOfStock && availableRemaining > 0 && addToCart(product)}
                      className={`clay-card p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                        isOutOfStock 
                          ? 'opacity-50 cursor-not-allowed bg-slate-50' 
                          : 'hover:shadow-[4px_6px_14px_rgba(99,102,241,0.2)]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="clay-badge text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            #{product.sku}
                          </span>
                          {product.puesto && (
                            <span className="clay-badge text-[9px] font-mono font-black bg-amber-100 text-amber-900 px-1 py-0.5 border border-amber-200" title={`Puesto: ${product.puesto}`}>
                              📍{product.puesto}
                            </span>
                          )}
                          <span className={`clay-badge text-[10px] font-bold py-0.5 px-1.5 ${
                            isOutOfStock 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : isLowStock 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {isOutOfStock ? 'Agotado' : `${availableRemaining} ${product.unit === 'Onza' ? 'Oz' : 'Un.'}`}
                          </span>
                        </div>

                        {product.brand && (
                          <span className="text-[10.5px] font-bold text-indigo-500 block truncate">
                            {product.brand}
                          </span>
                        )}

                        <h3 className="font-extrabold text-xs text-slate-800 line-clamp-2 leading-snug mt-0.5">
                          {product.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[9.5px] text-slate-400 block font-semibold">
                            Por {product.unit === 'Onza' ? 'Oz' : product.unit}
                          </span>
                          <span className="text-base font-black text-indigo-600">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>

                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold transition-colors ${
                          isOutOfStock || availableRemaining <= 0
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                        }`}>
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Columna Derecha del POS: Carrito y Cobro */}
            <div className="w-full xl:w-96 flex flex-col gap-4 shrink-0">
              <div className="clay-card p-5 flex flex-col h-[calc(100vh-140px)] sticky top-24">
                
                {/* Header del Carrito */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner font-bold">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-base text-slate-800 leading-none">Orden Actual</h2>
                      <span className="text-[11px] text-slate-400 font-medium">{totalItemsCount} unidades</span>
                    </div>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Vaciar
                    </button>
                  )}
                </div>

                {/* Toast de Orden Enviada a Bodega */}
                {orderSentToast && (
                  <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg animate-in fade-in flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Box className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <p className="font-black text-xs">¡Orden #{orderSentToast.orderNumber} enviada!</p>
                        <p className="text-[10px] text-emerald-100">Bodega la preparará y la pondrá en ventanilla para cobro.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPosTab('caja_facturacion')}
                      className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-white text-emerald-800 shadow-sm hover:bg-emerald-50 whitespace-nowrap"
                    >
                      Ver en Caja
                    </button>
                  </div>
                )}

                {/* Lista de productos en el carrito */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                      <Droplets className="w-12 h-12 mb-2 opacity-30 stroke-[1.5] text-indigo-400" />
                      <p className="font-bold text-sm text-slate-600">Orden Vacía</p>
                      <p className="text-xs mt-1">Selecciona esencias, botes o empaque para cotizar y cobrar</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div 
                        key={item.product.id}
                        className="p-2.5 rounded-2xl bg-white/70 border border-white/80 shadow-[2px_3px_8px_rgba(164,177,198,0.2)] flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                              #{item.product.sku}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-800 truncate leading-tight">
                            {item.product.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            ${item.product.price.toFixed(2)} por {item.product.unit}
                          </p>
                        </div>

                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl shadow-inner border border-slate-100">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-5 h-5 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center active:scale-90"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black w-6 text-center text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-5 h-5 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center active:scale-90"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Subtotal del item */}
                        <div className="text-right min-w-[50px]">
                          <span className="font-black text-xs text-slate-800">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desglose de Totales e Impuestos */}
                {cart.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/80 flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Subtotal (Neto):</span>
                      <span>${subtotalNeto.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>IVA (13%):</span>
                      <span>${ivaCalculado.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                      <span>Total Estimado:</span>
                      <span className="text-indigo-600 text-xl font-extrabold">
                        ${cartSubtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Botón Principal: Mandar a Bodega */}
                    <button
                      type="button"
                      onClick={handleSendOrderToBodega}
                      className="clay-btn clay-btn-primary w-full py-3 text-sm mt-2 rounded-2xl shadow-[4px_6px_16px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 font-black !bg-gradient-to-r !from-indigo-600 !to-indigo-800 text-white hover:brightness-110"
                    >
                      <Box className="w-4 h-4 text-amber-300" />
                      <span>Mandar a Preparar (Enviar a Bodega)</span>
                    </button>

                    {/* Fila de Botones Secundarios: Cotización PDF y Cobro Directo */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={handleOpenQuoteModal}
                        className="clay-btn clay-btn-light py-2 px-2 text-xs rounded-xl flex items-center justify-center gap-1.5 font-bold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200"
                        title="Generar cotización o prefactura en PDF para compartir"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Cotización (PDF)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOrderToInvoice(null);
                          setIsCheckoutOpen(true);
                        }}
                        className="clay-btn clay-btn-success py-2 px-2 text-xs rounded-xl flex items-center justify-center gap-1.5 font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300"
                        title="Cobrar directamente sin enviar a bodega"
                      >
                        <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Cobro Directo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* PESTAÑA: CAJA & FACTURACIÓN (ESTILO MECANIC OS)                         */}
        {/* ======================================================================= */}
        {posTab === 'caja_facturacion' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Encabezado y Selector de Subpestañas (Estilo Mecanic OS) */}
            <div className="clay-card p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                <ReceiptText className="w-64 h-64" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
                      🏛️ Módulo de Caja & DTE
                    </span>
                    <span className="text-xs text-indigo-200">Facturación Electrónica El Salvador</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black">
                    Caja, Ventanilla & Facturación DTE
                  </h2>
                  <p className="text-xs text-indigo-100/90 mt-1 max-w-xl">
                    Flujo centralizado: Cobra las órdenes preparadas por Bodega y emite los documentos electrónicos tributarios (Facturas y Créditos Fiscales).
                  </p>
                </div>

                {/* Switcher de Subpestañas */}
                <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
                  <button
                    type="button"
                    onClick={() => setCajaSubTab('listas_facturar')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      cajaSubTab === 'listas_facturar'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Órdenes Listas ({readyInWindowOrders.length})</span>
                    {readyInWindowOrders.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCajaSubTab('dtes_emitidos')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      cajaSubTab === 'dtes_emitidos'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>DTEs Emitidos ({completedDteSales.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SUBPESTAÑA 1: ÓRDENES LISTAS PARA FACTURAR */}
            {cajaSubTab === 'listas_facturar' && (
              <div className="space-y-4">
                
                {/* Métricas rápidas de ventanilla */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className={`clay-card p-4 flex items-center justify-between border-l-4 border-emerald-500 ${readyInWindowOrders.length > 0 ? 'bg-emerald-50/40 ring-1 ring-emerald-300' : ''}`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Listas en Ventanilla</span>
                      <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                        {readyInWindowOrders.length}
                      </div>
                      <span className="text-[10px] text-emerald-800 font-medium">Listas para cobro inmediato</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="clay-card p-4 flex items-center justify-between border-l-4 border-amber-500">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Preparación (Bodega)</span>
                      <div className="text-2xl font-black text-amber-600 font-mono mt-0.5">
                        {pendingPreparationCount}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Siendo alistadas en estantería</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="clay-card p-4 flex items-center justify-between border-l-4 border-indigo-500">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturadas Hoy</span>
                      <div className="text-2xl font-black text-indigo-600 font-mono mt-0.5">
                        {completedDteSales.length}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Comprobantes DTE con sello</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <ReceiptText className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Listado de Órdenes Listas en Ventanilla */}
                {readyInWindowOrders.length === 0 ? (
                  <div className="clay-card p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-amber-100/70 text-amber-600 flex items-center justify-center shadow-inner">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800">
                        No hay órdenes en ventanilla en este momento
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mt-1">
                        Cuando las vendedoras creen órdenes desde el Cotizador y el equipo de Bodega termine de prepararlas y presione <strong>"Poner en Ventanilla"</strong>, aparecerán aquí para cobro y emisión oficial de DTE.
                      </p>
                    </div>
                    {pendingPreparationCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setPosTab('bodega_ordenes')}
                        className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 mt-2 flex items-center gap-1.5"
                      >
                        <Box className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ver {pendingPreparationCount} {pendingPreparationCount === 1 ? 'orden' : 'órdenes'} en preparación en Bodega</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPosTab('nueva_orden')}
                        className="clay-btn clay-btn-primary px-4 py-2 text-xs font-bold mt-2 flex items-center gap-1.5"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Crear Nueva Orden en Cotizador</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {readyInWindowOrders.map((order) => (
                      <div 
                        key={order.id} 
                        className="clay-card p-5 bg-white border-2 border-emerald-400 shadow-[0_8px_24px_rgba(16,185,129,0.15)] flex flex-col justify-between space-y-4"
                      >
                        <div>
                          {/* Encabezado de la Tarjeta */}
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                                  #{order.orderNumber || order.saleNumber}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  <span>Listo en Ventanilla</span>
                                </span>
                              </div>
                              <span className="text-[10.5px] text-slate-400 font-sans mt-1 block">
                                Creado: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Vendedor: {order.vendedor || 'Mostrador'}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total a Cobrar</span>
                              <span className="text-2xl font-black font-mono text-emerald-600">
                                ${order.total.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Datos del Cliente */}
                          <div className="my-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cliente</span>
                              <strong className="text-slate-800 text-sm">{order.cliente.nombre}</strong>
                              {order.cliente.numDocumento && (
                                <span className="text-[11px] text-slate-500 font-mono block">Doc: {order.cliente.numDocumento}</span>
                              )}
                            </div>

                            <div className="flex flex-col sm:items-end gap-1">
                              <span className={`clay-badge text-[10.5px] font-bold py-0.5 px-2 ${
                                order.tipoComprobante === '03' || order.cliente.nrc
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              }`}>
                                {order.tipoComprobante === '03' || order.cliente.nrc ? 'Crédito Fiscal (CCF-03)' : 'Factura (FC-01)'}
                              </span>
                              {order.cliente.nrc && (
                                <span className="text-[10px] font-mono text-purple-700 font-bold">NRC: {order.cliente.nrc}</span>
                              )}
                            </div>
                          </div>

                          {/* Desglose de Productos Preparados por Bodega */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Items Preparados ({order.items.length})
                            </span>
                            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl p-2.5 max-h-44 overflow-y-auto bg-slate-50/40">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="py-1.5 flex items-center justify-between text-xs gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-800 truncate block">{it.name}</span>
                                      {it.puesto && (
                                        <span className="clay-badge text-[9px] font-mono font-black bg-amber-100 text-amber-900 px-1 py-0.2 border border-amber-200">
                                          📍{it.puesto}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10.5px] text-slate-500">
                                      {it.quantity} {it.unit || 'Oz'} x ${it.price.toFixed(2)}
                                    </span>
                                  </div>
                                  <span className="font-mono font-black text-slate-800">
                                    ${it.total.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Pie de tarjeta con Botón de Cobro */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2.5">
                          <div className="text-xs text-slate-500 font-medium">
                            Subtotal: <strong className="font-mono text-slate-700">${order.subtotal.toFixed(2)}</strong> • IVA (13%): <strong className="font-mono text-slate-700">${order.ivaTotal.toFixed(2)}</strong>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveQuoteSale(order);
                                setIsQuoteModalOpen(true);
                              }}
                              className="clay-btn clay-btn-light px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-700 flex items-center justify-center gap-1"
                              title="Ver comanda / cotización en PDF"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="hidden sm:inline">Comanda</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartInvoiceOrder(order)}
                              className="clay-btn clay-btn-success flex-1 sm:flex-none px-4 py-2.5 text-xs font-black flex items-center justify-center gap-1.5 shadow-[2px_4px_12px_rgba(16,185,129,0.35)]"
                            >
                              <Banknote className="w-4 h-4" />
                              <span>Cobrar y Facturar DTE</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* SUBPESTAÑA 2: DTES EMITIDOS (HISTORIAL OFICIAL ANTE HACIENDA) */}
            {cajaSubTab === 'dtes_emitidos' && (
              <div className="space-y-4">
                
                {/* Barra de Búsqueda y Filtros de DTE */}
                <div className="clay-card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por N° de Control (DTE-01-...), Código de Generación, cliente u orden..."
                      value={dteSearchQuery}
                      onChange={(e) => setDteSearchQuery(e.target.value)}
                      className="clay-input w-full pl-9 pr-3 py-2 text-xs font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setDteFilterType('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        dteFilterType === 'ALL'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todos ({completedDteSales.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDteFilterType('01')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        dteFilterType === '01'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Factura (01)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDteFilterType('03')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        dteFilterType === '03'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Crédito Fiscal (03)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDteFilterType('TICKET')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        dteFilterType === 'TICKET'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tickets
                    </button>
                  </div>
                </div>

                {/* Tabla de Auditoría de DTEs Emitidos */}
                <div className="clay-card p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Registro Oficial de Documentos Tributarios Electrónicos</span>
                    </h3>
                    <span className="clay-badge text-[10px] bg-slate-100 text-slate-700 font-bold">
                      {filteredDteSales.length} documentos
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3">N° Control / Código Generación</th>
                          <th className="py-2.5 px-3">Fecha & Hora</th>
                          <th className="py-2.5 px-3">Tipo DTE</th>
                          <th className="py-2.5 px-3">Cliente</th>
                          <th className="py-2.5 px-3">Método</th>
                          <th className="py-2.5 px-3 text-right">Total ($)</th>
                          <th className="py-2.5 px-3 text-center">Estado Hacienda</th>
                          <th className="py-2.5 px-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDteSales.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-400">
                              <ReceiptText className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
                              <p className="font-bold text-sm text-slate-600">No se encontraron DTEs emitidos</p>
                              <p className="text-xs text-slate-400 mt-0.5">Los comprobantes facturados en ventanilla se registrarán aquí.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredDteSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-mono">
                                {sale.dteInfo?.numeroControl ? (
                                  <div className="font-bold text-emerald-700 text-xs truncate max-w-[170px]" title={sale.dteInfo.numeroControl}>
                                    {sale.dteInfo.numeroControl}
                                  </div>
                                ) : (
                                  <div className="font-bold text-slate-700 text-xs">
                                    #{sale.saleNumber}
                                  </div>
                                )}
                                {sale.dteInfo?.codigoGeneracion && (
                                  <span className="text-[9.5px] text-slate-400 truncate block max-w-[170px]" title={sale.dteInfo.codigoGeneracion}>
                                    UUID: {sale.dteInfo.codigoGeneracion.slice(0, 18)}...
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                <div>{new Date(sale.invoicedAt || sale.createdAt).toLocaleDateString('es-SV')}</div>
                                <span className="text-[10px] text-slate-400 font-sans">
                                  {new Date(sale.invoicedAt || sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`clay-badge text-[10px] font-bold py-0.5 px-2 ${
                                  sale.tipoComprobante === '03'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : sale.tipoComprobante === '01'
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {sale.tipoComprobante === '03' ? 'Crédito Fiscal (03)' : sale.tipoComprobante === '01' ? 'Factura (01)' : 'Ticket'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-extrabold text-slate-800 block text-xs truncate max-w-[160px]">
                                  {sale.cliente.nombre}
                                </span>
                                {sale.cliente.numDocumento && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    Doc: {sale.cliente.numDocumento}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-bold text-[11px]">
                                {sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'CARD' ? 'Tarjeta' : sale.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Bitcoin'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-indigo-700">
                                ${sale.total.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {sale.dteInfo ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>{sale.dteInfo.simulated ? 'Aprobado (Test)' : 'Sello Hacienda'}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium">Ticket Local</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSaleDetail(sale)}
                                    className="clay-btn clay-btn-light px-2.5 py-1 text-[11px] font-bold text-indigo-700 inline-flex items-center gap-1"
                                    title="Ver detalle del comprobante"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Ver</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCompletedSale(sale)}
                                    className="clay-btn clay-btn-light px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-indigo-700 inline-flex items-center gap-1"
                                    title="Reimprimir Ticket"
                                  >
                                    <Printer className="w-3 h-3" />
                                  </button>
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

        {/* ======================================================================= */}
        {/* PESTAÑA 2: CLIENTES (MÓDULO BASADO EN MECANIC OS PARA FC Y CCF)         */}
        {/* ======================================================================= */}
        {posTab === 'clientes' && (
          <div className="space-y-5 animate-in fade-in">
            
            <div className="clay-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <span>Directorio de Clientes</span>
                  <span className="clay-badge text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                    {customers.length} registrados
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Registro de datos fiscales para Facturas (FC - DTE 01) y Crédito Fiscal (CCF - DTE 03)
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenNewCustomerModal}
                className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Registrar Cliente</span>
              </button>
            </div>

            {/* Buscador y Filtros */}
            <div className="clay-card p-3.5 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente por Nombre, DUI, NIT, NRC o Teléfono..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="clay-input w-full pl-9 pr-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCustomerFilterType('TODOS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    customerFilterType === 'TODOS' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({customers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerFilterType('NATURAL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    customerFilterType === 'NATURAL' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Naturales (FC)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerFilterType('JURIDICA')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    customerFilterType === 'JURIDICA' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Empresas (CCF)
                </button>
              </div>
            </div>

            {/* Tabla de Clientes (Estilo Mecanic OS) */}
            <div className="clay-card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-xs font-bold text-slate-500">
                  Mostrando <strong>{filteredCustomers.length}</strong> de {customers.length} clientes registrados
                </span>
                <span className="clay-badge text-[10px] bg-slate-100 text-slate-700 font-bold">
                  {filteredCustomers.filter(c => c.tipoPersona === 'JURIDICA').length} CCF (Empresas) • {filteredCustomers.filter(c => c.tipoPersona === 'NATURAL').length} FC (Consumidor)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3.5">Cliente / Razón Social</th>
                      <th className="py-3 px-3">Tipo & Régimen</th>
                      <th className="py-3 px-3">Doc. Fiscal</th>
                      <th className="py-3 px-3">Contacto / WhatsApp</th>
                      <th className="py-3 px-3">Correo Facturación</th>
                      <th className="py-3 px-3">Giro Comercial</th>
                      <th className="py-3 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Users className="w-12 h-12 mx-auto mb-2 opacity-30 text-indigo-500" />
                          <p className="font-bold text-sm text-slate-600">No se encontraron clientes</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Prueba ajustando el filtro de búsqueda o registra un nuevo cliente.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="font-extrabold text-slate-800 text-xs">{cust.name}</div>
                            {cust.nombreComercial && (
                              <span className="text-[10px] text-slate-500 font-medium block">
                                Cial: {cust.nombreComercial}
                              </span>
                            )}
                            {cust.direccion && (
                              <span className="text-[9.5px] text-slate-400 truncate block max-w-[220px]" title={`${cust.direccion}, ${cust.municipio || ''} (${cust.departamento || ''})`}>
                                📍 {cust.direccion}{cust.municipio ? `, ${cust.municipio}` : ''}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`clay-badge text-[9.5px] font-bold py-0.5 px-2 ${
                                cust.tipoPersona === 'JURIDICA'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              }`}>
                                {cust.tipoPersona === 'JURIDICA' ? '🏢 CCF (Empresa)' : '👤 FC (Natural)'}
                              </span>
                              {cust.nrc && (
                                <span className="clay-badge text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  NRC: {cust.nrc}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <span className="text-[10px] text-slate-400 block">{cust.tipoDocumento}</span>
                            <span className="font-bold text-slate-800 text-xs">{cust.numDocumento || 'S/N'}</span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <div className="font-bold text-slate-700 text-xs flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{cust.phone || 'S/N'}</span>
                            </div>
                            {cust.departamento && (
                              <span className="text-[9.5px] text-slate-400 font-sans block mt-0.5">
                                {cust.departamento}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                            <span className="truncate block max-w-[180px]" title={cust.email}>
                              {cust.email || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-600">
                            <span className="truncate block max-w-[160px]" title={cust.actividadEconomica || 'Consumo final'}>
                              {cust.actividadEconomica || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCustomerModal(cust)}
                                className="clay-btn clay-btn-light p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg"
                                title="Editar datos del cliente"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartSaleForCustomer(cust)}
                                className="clay-btn clay-btn-primary px-2.5 py-1 text-[10.5px] font-black flex items-center gap-1 shadow-sm"
                                title="Crear orden para este cliente"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                <span>+ Orden</span>
                              </button>
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

        {/* ======================================================================= */}
        {/* PESTAÑA 3: VENTAS (RESUMEN DEL DÍA Y ONZAS VENDIDAS)                     */}
        {/* ======================================================================= */}
        {posTab === 'ventas' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* KPI PRINCIPAL: TOTAL DE ONZAS VENDIDAS EN EL DÍA */}
            <div className="clay-card p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white relative overflow-hidden shadow-xl">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                <Droplets className="w-64 h-64" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
                      💧 Métrica Clave del Día
                    </span>
                    <span className="text-xs text-indigo-200">Perfumería & Fragancias</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black">
                    Resumen de Fragancias Vendidas en el Turno
                  </h2>
                  <p className="text-xs text-indigo-100/90 mt-1 max-w-xl">
                    Monitoreo en tiempo real del consumo de esencias contratipo preparadas y despachadas en mostrador.
                  </p>
                </div>

                <div className="text-left md:text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                  <span className="text-[11px] uppercase font-bold text-indigo-200 block">Total Onzas Despachadas</span>
                  <div className="text-4xl md:text-5xl font-black font-mono tracking-tight text-amber-300">
                    {totalOnzasVendidas} <span className="text-2xl text-white">Oz</span>
                  </div>
                  <span className="text-[10px] text-indigo-200 block mt-0.5">
                    Equivalente a {(totalOnzasVendidas / 1.7).toFixed(0)} frascos de 50ml aprox.
                  </span>
                </div>
              </div>
            </div>

            {/* Métricas Secundarias de Caja */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="clay-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Ingresos en Caja</p>
                  <h3 className="text-xl font-black text-indigo-600 mt-0.5">
                    ${totalMontoVentas.toFixed(2)}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">Recaudado en el turno</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="clay-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Botes & Atomizadores</p>
                  <h3 className="text-xl font-black text-amber-600 mt-0.5">
                    {totalBotesVendidos} Un.
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">Envases de 30, 50 y 100ml</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner font-bold">
                  <Tag className="w-5 h-5" />
                </div>
              </div>

              <div className="clay-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comprobantes Emitidos</p>
                  <h3 className="text-xl font-black text-emerald-600 mt-0.5">
                    {sales.length}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">DTEs Hacienda & Tickets</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner font-bold">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Ranking de Fragancias por Onzas Vendidas */}
            <div className="clay-card p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>Ranking de Fragancias Más Vendidas (en Onzas)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Desglose de cada esencia solicitada por los clientes hoy
                  </p>
                </div>
                <span className="clay-badge text-[10px] bg-amber-100 text-amber-900 font-bold">
                  {rankingFragancias.length} esencias distintas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3" style={{ width: '10%' }}>SKU</th>
                      <th className="py-2.5 px-3" style={{ width: '50%' }}>Fragancia / Contratipo</th>
                      <th className="py-2.5 px-3 text-right" style={{ width: '20%' }}>Onzas Vendidas</th>
                      <th className="py-2.5 px-3 text-right" style={{ width: '20%' }}>Total Recaudado ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankingFragancias.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Aún no se han registrado ventas de fragancias en este turno.
                        </td>
                      </tr>
                    ) : (
                      rankingFragancias.map((frag, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                            #{frag.sku || 'S/N'}
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-800">
                            {frag.name}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="clay-badge text-xs font-mono font-black bg-indigo-100 text-indigo-800 px-2 py-0.5">
                              {frag.onzas} Oz
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-800">
                            ${frag.totalMonto.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Listado Completo de Comprobantes del Día */}
            <div className="clay-card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-sm font-black text-slate-800">
                  Historial de Comprobantes Emitidos en Caja
                </h3>
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar comanda (#CMD-1081) o cliente..."
                    value={ventasSearch}
                    onChange={(e) => setVentasSearch(e.target.value)}
                    className="clay-input w-full pl-8 pr-3 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Comanda / Hora</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Comprobante DTE</th>
                      <th className="py-2.5 px-3">Método</th>
                      <th className="py-2.5 px-3 text-right">Total ($)</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No hay ventas registradas.
                        </td>
                      </tr>
                    ) : (
                      sales
                        .filter(s => {
                          if (!ventasSearch.trim()) return true;
                          const q = ventasSearch.toLowerCase().trim();
                          return (
                            s.saleNumber.toLowerCase().includes(q) ||
                            s.cliente.nombre.toLowerCase().includes(q) ||
                            (s.dteInfo?.numeroControl && s.dteInfo.numeroControl.toLowerCase().includes(q))
                          );
                        })
                        .map((sale) => (
                          <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              <div>#{sale.saleNumber}</div>
                              <span className="text-[10px] text-slate-400 font-sans font-normal">
                                {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-extrabold text-slate-800 block text-xs">{sale.cliente.nombre}</span>
                              {sale.cliente.numDocumento && (
                                <span className="text-[10px] font-mono text-slate-400">Doc: {sale.cliente.numDocumento}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`clay-badge text-[10px] font-bold py-0.5 px-2 ${
                                sale.tipoComprobante === '03'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : sale.tipoComprobante === '01'
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {sale.tipoComprobante === '03' ? 'Crédito Fiscal (03)' : sale.tipoComprobante === '01' ? 'Factura (01)' : 'Ticket'}
                              </span>
                              {sale.dteInfo?.numeroControl && (
                                <span className="block text-[9.5px] font-mono text-emerald-700 font-bold mt-0.5 truncate max-w-[140px]">
                                  {sale.dteInfo.numeroControl}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-bold text-[11px]">
                              {sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'CARD' ? 'Tarjeta' : 'Transferencia'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-indigo-700">
                              ${sale.total.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedSaleDetail(sale)}
                                className="clay-btn clay-btn-light px-2.5 py-1 text-[11px] font-bold text-indigo-700 inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Ver</span>
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

        {/* ======================================================================= */}
        {/* PESTAÑA 4: ESTADO DE PEDIDOS EN BODEGA & VENTANILLA                     */}
        {/* ======================================================================= */}
        {posTab === 'bodega_ordenes' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Cabecera & Métricas de Órdenes */}
            <div className="clay-card p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 text-white relative overflow-hidden shadow-xl">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                <Box className="w-64 h-64" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
                      📦 Seguimiento Operativo
                    </span>
                    <span className="text-xs text-amber-100">Bodega & Preparación</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black">
                    Estado de Comandas y Pedidos en Bodega
                  </h2>
                  <p className="text-xs text-amber-100/90 mt-1 max-w-xl">
                    Supervisa en tiempo real qué órdenes están siendo preparadas en estantería (📍 puestos) y cuáles ya están listas en ventanilla para entrega al cliente.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`p-4 rounded-2xl border backdrop-blur-md text-center ${
                    readyInWindowCount > 0 
                      ? 'bg-emerald-500/90 border-emerald-300 text-white animate-bounce' 
                      : 'bg-white/10 border-white/20 text-white'
                  }`}>
                    <span className="text-[10.5px] uppercase font-black block tracking-wider">
                      Listos en Ventanilla
                    </span>
                    <div className="text-3xl md:text-4xl font-black font-mono mt-0.5">
                      {readyInWindowCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjetas de Resumen Rápido */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="clay-card p-4 flex items-center justify-between border-l-4 border-amber-500">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Preparación</p>
                  <h3 className="text-2xl font-black text-amber-600 font-mono mt-0.5">{pendingPreparationCount}</h3>
                </div>
                <span className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                  <Clock className="w-5 h-5" />
                </span>
              </div>

              <div className={`clay-card p-4 flex items-center justify-between border-l-4 border-emerald-500 ${readyInWindowCount > 0 ? 'bg-emerald-50/50 ring-2 ring-emerald-400' : ''}`}>
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Listos en Ventanilla</p>
                  <h3 className="text-2xl font-black text-emerald-700 font-mono mt-0.5">{readyInWindowCount}</h3>
                </div>
                <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              </div>

              <div className="clay-card p-4 flex items-center justify-between border-l-4 border-blue-500">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregados al Cliente</p>
                  <h3 className="text-2xl font-black text-blue-600 font-mono mt-0.5">{completedOrdersCount}</h3>
                </div>
                <span className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Truck className="w-5 h-5" />
                </span>
              </div>

              <div className="clay-card p-4 flex items-center justify-between border-l-4 border-indigo-500">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Comandas Hoy</p>
                  <h3 className="text-2xl font-black text-indigo-600 font-mono mt-0.5">{sales.length}</h3>
                </div>
                <span className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                  <ReceiptText className="w-5 h-5" />
                </span>
              </div>
            </div>

            {/* Barra de Filtros y Buscador */}
            <div className="clay-card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBodegaOrdenesFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    bodegaOrdenesFilter === 'ALL'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({sales.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBodegaOrdenesFilter('READY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    bodegaOrdenesFilter === 'READY'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Listos en Ventanilla ({readyInWindowCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBodegaOrdenesFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    bodegaOrdenesFilter === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>En Preparación ({pendingPreparationCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBodegaOrdenesFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    bodegaOrdenesFilter === 'COMPLETED'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Entregados ({completedOrdersCount})</span>
                </button>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar comanda, cliente o fragancia..."
                  value={bodegaOrdenesSearch}
                  onChange={(e) => setBodegaOrdenesSearch(e.target.value)}
                  className="clay-input w-full pl-9 pr-3 py-1.5 text-xs font-bold"
                />
              </div>
            </div>

            {/* Listado de Tarjetas de Órdenes */}
            {filteredBodegaOrders.length === 0 ? (
              <div className="clay-card p-12 text-center text-slate-400">
                <Box className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">No hay órdenes con este filtro</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Las ventas procesadas en el Punto de Venta se envían automáticamente a Bodega y su estado se sincroniza en vivo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBodegaOrders.map(order => {
                  const isPending = order.status === 'PENDING_PREPARATION' || !order.status;
                  const isReady = order.status === 'READY_AT_WINDOW';
                  const isCompleted = order.status === 'COMPLETED';

                  return (
                    <div 
                      key={order.id} 
                      className={`clay-card p-4 flex flex-col justify-between transition-all ${
                        isReady 
                          ? 'border-l-4 border-emerald-500 bg-emerald-50/20 shadow-md ring-1 ring-emerald-200' 
                          : isPending 
                          ? 'border-l-4 border-amber-500 bg-amber-50/10' 
                          : 'border-l-4 border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        {/* Fila Superior: Comanda & Estado */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-indigo-700">
                                #{order.saleNumber}
                              </span>
                              <span className={`clay-badge text-[10px] font-black py-0.5 px-2.5 ${
                                isReady 
                                  ? 'bg-emerald-500 text-white shadow-sm animate-pulse' 
                                  : isPending 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {isReady ? '✅ ¡LISTO EN VENTANILLA!' : isPending ? '⏳ En Preparación' : '📦 Entregado'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-1 font-medium">
                              <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>•</span>
                              <span>Cliente: <strong className="text-slate-700">{order.cliente?.nombre || 'Consumidor Final'}</strong></span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Total</span>
                            <span className="text-sm font-black text-slate-800 font-mono">
                              ${order.total.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Stepper Visual de Estado */}
                        <div className="my-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between text-[10px] font-black">
                            <div className="flex items-center gap-1 text-emerald-600">
                              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold">1</span>
                              <span>Caja</span>
                            </div>
                            <span className="text-slate-300">→</span>
                            <div className={`flex items-center gap-1 ${isPending ? 'text-amber-600 font-black animate-pulse' : 'text-emerald-600'}`}>
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                isPending ? 'bg-amber-500 text-white' : 'bg-emerald-100 text-emerald-700'
                              }`}>2</span>
                              <span>Bodega</span>
                            </div>
                            <span className="text-slate-300">→</span>
                            <div className={`flex items-center gap-1 ${isReady ? 'text-emerald-700 font-black' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                isReady ? 'bg-emerald-600 text-white animate-bounce' : isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                              }`}>3</span>
                              <span>Ventanilla</span>
                            </div>
                            <span className="text-slate-300">→</span>
                            <div className={`flex items-center gap-1 ${isCompleted ? 'text-blue-600 font-black' : 'text-slate-400'}`}>
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                isCompleted ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>4</span>
                              <span>Entregado</span>
                            </div>
                          </div>
                        </div>

                        {/* Lista de Ítems y Puesto en Estantería */}
                        <div className="space-y-1.5 mb-3">
                          <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                            Productos en Comanda ({order.items.length}):
                          </span>
                          {order.items.map((it, idx) => (
                            <div key={idx} className="p-2 rounded-xl bg-white border border-slate-200 text-xs flex justify-between items-center gap-2">
                              <div className="truncate">
                                <span className="font-bold text-slate-800 block truncate">{it.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono font-bold">
                                  Cant: <strong className="text-indigo-700">{it.quantity} {it.unit || 'Oz'}</strong>
                                </span>
                              </div>
                              <span className="clay-badge text-[9.5px] font-mono font-black text-amber-950 bg-amber-100 px-2 py-0.5 border border-amber-300 shrink-0">
                                📍 Puesto: {it.puesto || products.find(p => p.id === it.productId)?.puesto || 'A1'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Botones de Acción para la Cajera */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSaleDetail(order)}
                          className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-indigo-700 flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Ticket</span>
                        </button>

                        {isReady && (
                          <button
                            type="button"
                            onClick={() => handleMarkOrderDeliveredFromPos(order.id)}
                            className="clay-btn clay-btn-primary px-4 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-emerald-600 !shadow-[3px_4px_12px_rgba(16,185,129,0.4)] animate-pulse"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Entregar al Cliente</span>
                          </button>
                        )}

                        {isPending && (
                          <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>Bodega preparando...</span>
                          </span>
                        )}

                        {isCompleted && (
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Entregado</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FORMULARIO DE CLIENTE (ESTILO MECANIC OS PARA FC Y CCF)          */}
      {/* ========================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="clay-card w-full max-w-2xl p-6 relative bg-white animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>{editingCustomerId ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Formulario oficial para emisión de Facturas a Consumidor (FC) y Comprobantes de Crédito Fiscal (CCF).
              </p>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              
              {/* Tipo de Persona Toggle */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Tipo de Contribuyente / Persona *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCustTipoPersona('NATURAL');
                      setCustTipoDocumento('DUI');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                      custTipoPersona === 'NATURAL'
                        ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Persona Natural (Factura FC)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCustTipoPersona('JURIDICA');
                      setCustTipoDocumento('NIT');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                      custTipoPersona === 'JURIDICA'
                        ? 'bg-purple-600 text-white shadow-md border-purple-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Persona Jurídica (Crédito Fiscal CCF)</span>
                  </button>
                </div>
              </div>

              {/* Nombre / Razón Social */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {custTipoPersona === 'JURIDICA' ? 'Razón Social (según Tarjeta NRC) *' : 'Nombre Completo *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={custTipoPersona === 'JURIDICA' ? 'Ej. Distribuidora Las Fragancias S.A. de C.V.' : 'Ej. María Julia Hernández'}
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="clay-input w-full text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nombre Comercial (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Boutique Elegance"
                    value={custNombreComercial}
                    onChange={(e) => setCustNombreComercial(e.target.value)}
                    className="clay-input w-full text-xs"
                  />
                </div>
              </div>

              {/* Documentos de Identidad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    value={custTipoDocumento}
                    onChange={(e) => setCustTipoDocumento(e.target.value as TipoDocumentoCliente)}
                    className="clay-input w-full text-xs font-bold"
                  >
                    <option value="DUI">DUI (El Salvador)</option>
                    <option value="NIT">NIT (El Salvador)</option>
                    <option value="PASAPORTE">Pasaporte (Extranjero)</option>
                    <option value="CARNET_RESIDENCIA">Carnet de Residente</option>
                    <option value="OTRO">Otro Documento</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    N° de Documento ({custTipoDocumento}) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={custTipoDocumento === 'DUI' ? '00000000-0' : '0614-000000-000-0'}
                    value={custNumDocumento}
                    onChange={(e) => setCustNumDocumento(e.target.value)}
                    className="clay-input w-full text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    NRC {custTipoPersona === 'JURIDICA' ? '(Requerido CCF) *' : '(Si es Contribuyente)'}
                  </label>
                  <input
                    type="text"
                    required={custTipoPersona === 'JURIDICA'}
                    placeholder="Ej. 123456-7"
                    value={custNrc}
                    onChange={(e) => setCustNrc(e.target.value)}
                    className="clay-input w-full text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Giro / Actividad Económica para CCF */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Actividad Económica / Giro (para Hacienda CCF)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Venta al por menor de cosméticos y perfumes"
                    value={custGiro}
                    onChange={(e) => setCustGiro(e.target.value)}
                    className="clay-input w-full text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Categoría Contribuyente
                  </label>
                  <select
                    value={custCategoria}
                    onChange={(e) => setCustCategoria(e.target.value as CategoriaContribuyente)}
                    className="clay-input w-full text-xs font-bold"
                  >
                    <option value="OTRO">Otro / General</option>
                    <option value="MEDIANO">Mediano Contribuyente</option>
                    <option value="GRANDE">Gran Contribuyente</option>
                  </select>
                </div>
              </div>

              {/* Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Correo Electrónico (Recepción DTE PDF/JSON) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="facturacion@cliente.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="clay-input w-full text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="7700-0000"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="clay-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Departamento
                  </label>
                  <select
                    value={custDepartamento}
                    onChange={(e) => setCustDepartamento(e.target.value)}
                    className="clay-input w-full text-xs font-bold"
                  >
                    {DEPARTAMENTOS_SV.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Municipio / Distrito
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. San Salvador Centro o Santa Tecla"
                    value={custMunicipio}
                    onChange={(e) => setCustMunicipio(e.target.value)}
                    className="clay-input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Dirección Detallada (Calle, Colonia, N° Local o Casa)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Colonia Escalón, Calle El Mirador #42"
                  value={custDireccion}
                  onChange={(e) => setCustDireccion(e.target.value)}
                  className="clay-input w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary px-5 py-2 text-xs font-black flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cliente</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MODAL DE COBRO Y EMISIÓN DTE                                     */}
      {/* ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150 bg-white">
            
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-xl font-black text-slate-800 mb-0.5">
                {orderToInvoice ? `Facturar Orden #${orderToInvoice.orderNumber || orderToInvoice.saleNumber}` : 'Finalizar Venta de Perfumería'}
              </h3>
              <p className="text-xs text-slate-500">
                {orderToInvoice ? 'Orden preparada en ventanilla lista para emisión oficial de DTE' : 'Selecciona el cliente y comprobante legal a emitir.'}
              </p>
            </div>

            {/* Resumen de items si se factura orden de ventanilla */}
            {orderToInvoice && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Items preparados en comanda ({orderToInvoice.items.length})</span>
                  </span>
                  <span className="font-mono font-black text-emerald-800">
                    Total: ${orderToInvoice.total.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto divide-y divide-emerald-100/80 text-[11px]">
                  {orderToInvoice.items.map((it, idx) => (
                    <div key={idx} className="pt-1 first:pt-0 flex justify-between items-center text-slate-700">
                      <span className="truncate max-w-[260px] font-medium">{it.name} ({it.quantity} {it.unit || 'Oz'})</span>
                      <span className="font-mono font-bold text-slate-900">${it.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selector Rápido de Clientes Registrados */}
            <div className="mb-4 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cliente para Facturación:</span>
                </label>
                <button
                  type="button"
                  onClick={handleOpenNewCustomerModal}
                  className="text-[10.5px] font-bold text-indigo-600 hover:underline"
                >
                  + Nuevo Cliente
                </button>
              </div>

              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="clay-input w-full text-xs py-2 font-bold bg-white"
              >
                <option value="">Consumidor Final (Venta Genérica)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.nrc ? `(CCF: ${c.nrc})` : `(DUI: ${c.numDocumento})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Comprobante */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Tipo de Comprobante
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoComprobante('TICKET')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                    tipoComprobante === 'TICKET' ? 'clay-btn-primary' : 'clay-btn-light'
                  }`}
                >
                  Ticket Local
                </button>
                <button
                  type="button"
                  onClick={() => setTipoComprobante('01')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                    tipoComprobante === '01' ? 'clay-btn-primary' : 'clay-btn-light'
                  }`}
                >
                  Factura (01)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoComprobante('03')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                    tipoComprobante === '03' ? 'clay-btn-primary' : 'clay-btn-light'
                  }`}
                >
                  Crédito Fiscal (03)
                </button>
              </div>
            </div>

            {/* Datos del Cliente para DTE */}
            {(tipoComprobante === '01' || tipoComprobante === '03') && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Datos Fiscales para Hacienda (DTE {tipoComprobante === '03' ? 'CCF-03' : 'FC-01'})</span>
                </div>
                
                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                    {tipoComprobante === '03' ? 'Razón Social *' : 'Nombre del Cliente'}
                  </label>
                  <input
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Nombre o Empresa"
                    className="clay-input w-full text-xs py-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      {tipoComprobante === '03' ? 'NIT *' : 'DUI o NIT'}
                    </label>
                    <input
                      type="text"
                      value={clienteDoc}
                      onChange={(e) => setClienteDoc(e.target.value)}
                      placeholder="00000000-0"
                      className="clay-input w-full text-xs py-1.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      {tipoComprobante === '03' ? 'NRC *' : 'NRC (Opcional)'}
                    </label>
                    <input
                      type="text"
                      value={clienteNrc}
                      onChange={(e) => setClienteNrc(e.target.value)}
                      placeholder="123456-7"
                      className="clay-input w-full text-xs py-1.5 font-mono"
                    />
                  </div>
                </div>

                {tipoComprobante === '03' && (
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                      Giro / Actividad Económica *
                    </label>
                    <input
                      type="text"
                      value={clienteGiro}
                      onChange={(e) => setClienteGiro(e.target.value)}
                      placeholder="Ej. Venta al por menor de cosméticos"
                      className="clay-input w-full text-xs py-1.5"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                    Correo para envío de DTE
                  </label>
                  <input
                    type="email"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    placeholder="correo@cliente.com"
                    className="clay-input w-full text-xs py-1.5 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Método de Pago */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Método de Pago
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'CASH', label: 'Efectivo', icon: Banknote },
                  { id: 'CARD', label: 'Tarjeta', icon: CreditCard },
                  { id: 'TRANSFER', label: 'Transf.', icon: Building },
                  { id: 'BITCOIN', label: 'Bitcoin', icon: QrCode },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === method.id ? 'clay-btn-primary' : 'clay-btn-light'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Efectivo recibido */}
            {paymentMethod === 'CASH' && (
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 mb-4 space-y-1.5">
                <label className="text-xs font-bold text-amber-900 block">
                  Efectivo Recibido ($)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="clay-input w-full pl-7 pr-3 py-2 text-sm font-mono font-bold bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCashAmount(currentBillingTotal.toFixed(2))}
                    className="clay-btn clay-btn-light px-3 text-xs font-bold whitespace-nowrap"
                  >
                    Exacto (${currentBillingTotal.toFixed(2)})
                  </button>
                </div>
                {parseFloat(cashAmount) >= currentBillingTotal && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-800 pt-1">
                    <span>Cambio a devolver:</span>
                    <span className="font-mono text-base font-black">
                      ${(parseFloat(cashAmount) - currentBillingTotal).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Resumen Final y Botón Confirmar */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center mb-4">
              <div>
                <span className="text-xs text-slate-500 block">Total a Pagar:</span>
                <span className="text-2xl font-black text-indigo-600 font-mono">
                  ${currentBillingTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setOrderToInvoice(null);
                  }}
                  className="clay-btn clay-btn-light px-4 py-2.5 text-xs font-bold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCompleteSale}
                  className="clay-btn clay-btn-success px-5 py-2.5 text-xs font-black flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Emitiendo DTE...' : orderToInvoice ? 'Cobrar y Emitir DTE' : 'Completar Venta'}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TICKET DE VENTA COMPLETADA                                       */}
      {/* ========================================================================= */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="clay-card w-full max-w-sm p-6 relative bg-white text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-slate-800">¡Venta Completada con Éxito!</h3>
            <p className="text-xs text-slate-500 mt-1">Comprobante #{completedSale.saleNumber}</p>

            <div className="my-4 p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <strong className="text-slate-800">{completedSale.cliente.nombre}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Comprobante:</span>
                <span className="font-bold text-indigo-700">
                  {completedSale.tipoComprobante === '03' ? 'Crédito Fiscal (03)' : completedSale.tipoComprobante === '01' ? 'Factura (01)' : 'Ticket'}
                </span>
              </div>
              <div className="flex justify-between font-black text-slate-800 pt-1 border-t border-indigo-200">
                <span>Total Cobrado:</span>
                <span className="font-mono text-indigo-600">${completedSale.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="clay-btn clay-btn-light flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="clay-btn clay-btn-primary flex-1 py-2 text-xs font-bold"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DETALLE DE VENTA PARA CONSULTA                                   */}
      {/* ========================================================================= */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="clay-card w-full max-w-md p-5 relative bg-white">
            <button
              type="button"
              onClick={() => setSelectedSaleDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-sm font-black text-slate-800">Detalle de Comprobante</h4>
              <p className="font-mono text-xs text-indigo-700 font-bold">#{selectedSaleDetail.saleNumber}</p>
            </div>

            <div className="space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <strong className="text-slate-800">{selectedSaleDetail.cliente.nombre}</strong>
              </div>
              {selectedSaleDetail.cliente.numDocumento && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Documento:</span>
                  <span className="font-mono">{selectedSaleDetail.cliente.numDocumento}</span>
                </div>
              )}
              {selectedSaleDetail.dteInfo?.numeroControl && (
                <div className="flex justify-between">
                  <span className="text-slate-500">N° Control Hacienda:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedSaleDetail.dteInfo.numeroControl}</span>
                </div>
              )}

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 max-h-48 overflow-y-auto">
                {selectedSaleDetail.items.map((it, idx) => (
                  <div key={idx} className="py-1 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{it.name}</span>
                      <span className="text-[10px] text-slate-400">{it.quantity} {it.unit || 'Oz'} x ${it.price.toFixed(2)}</span>
                    </div>
                    <span className="font-mono font-black text-slate-800">${it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal Neto:</span>
                  <span className="font-mono font-bold">${selectedSaleDetail.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (13%):</span>
                  <span className="font-mono font-bold">${selectedSaleDetail.ivaTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-indigo-900 pt-1 border-t border-indigo-200">
                  <span>Total:</span>
                  <span className="font-mono text-indigo-600">${selectedSaleDetail.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="clay-btn clay-btn-light flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSaleDetail(null)}
                className="clay-btn clay-btn-primary flex-1 py-2 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: COTIZACIÓN / PREFACTURA (EXPORTAR PDF Y WHATSAPP)                 */}
      {/* ========================================================================= */}
      <CotizacionModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        sale={activeQuoteSale}
      />

    </div>
  );
}
