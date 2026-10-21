// src/components/analytics/MarketingScripts.tsx
'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || '2210958782798088';

/**
 * Eventos estándar oficiales de Meta Pixel.
 * Si eventName coincide con un evento estándar de Meta, usa fbq('track', ...);
 * de lo contrario usa fbq('trackCustom', ...).
 */
const META_STANDARD_EVENTS = new Set([
  'PageView',
  'ViewContent',
  'Search',
  'AddToCart',
  'AddToWishlist',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'Lead',
  'CompleteRegistration',
  'Contact',
  'FindLocation',
]);

export function trackMarketingEvent(
  eventName: string,
  params: Record<string, any> = {}
) {
  if (typeof window === 'undefined') return;

  // 1. Google Tag Manager / dataLayer
  if ((window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: eventName,
      ...params,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Meta Pixel (Facebook / Instagram)
  const fbq = (window as any).fbq;
  if (typeof fbq === 'function') {
    if (META_STANDARD_EVENTS.has(eventName)) {
      fbq('track', eventName, params);
    } else {
      fbq('trackCustom', eventName, params);
    }
  }
}

/**
 * Normaliza un ítem del carrito o producto al ID exacto del catálogo de Meta (https://aromaniaksv.com/api/feed/meta).
 */
export function resolveMetaCatalogId(itemOrProduct: {
  id?: string;
  product?: { id?: string };
  kitDetails?: { essenceId?: string };
}): string {
  if (!itemOrProduct) return 'arma-tu-perfume-100ml';
  if (itemOrProduct.kitDetails?.essenceId) {
    return itemOrProduct.kitDetails.essenceId;
  }
  const rawId = itemOrProduct.product?.id || itemOrProduct.id || '';
  if (rawId.startsWith('kit-')) {
    return 'arma-tu-perfume-100ml';
  }
  return rawId;
}

/**
 * Dispara el evento estándar AddToCart en Meta Pixel con formato de catálogo oficial.
 */
export function trackMetaAddToCart(payload: {
  productId: string;
  productName: string;
  category?: string;
  unitPrice: number;
  quantity: number;
}) {
  const qty = Math.max(1, Number(payload.quantity || 1));
  const price = Number(Number(payload.unitPrice || 0).toFixed(2));
  const value = Number((price * qty).toFixed(2));
  const id = payload.productId.startsWith('kit-')
    ? 'arma-tu-perfume-100ml'
    : payload.productId;

  trackMarketingEvent('AddToCart', {
    content_ids: [id],
    contents: [{ id, quantity: qty, item_price: price }],
    content_name: payload.productName,
    content_category: payload.category || 'Perfumería',
    content_type: 'product',
    value,
    currency: 'USD',
    num_items: qty,
  });
}

/**
 * Dispara el evento estándar InitiateCheckout en Meta Pixel cuando el usuario abre o inicia el Checkout.
 */
export function trackMetaInitiateCheckout(
  cartItems: Array<{
    product?: { id: string; name?: string };
    kitDetails?: { essenceId: string };
    quantity: number;
    unitPrice: number;
  }>,
  totalValue: number
) {
  if (typeof window === 'undefined' || !cartItems || cartItems.length === 0) return;

  const contents = cartItems.map((it) => {
    const id = resolveMetaCatalogId(it);
    return {
      id,
      quantity: Math.max(1, Number(it.quantity || 1)),
      item_price: Number(Number(it.unitPrice || 0).toFixed(2)),
    };
  });

  const contentIds = Array.from(new Set(contents.map((c) => c.id)));
  const numItems = contents.reduce((acc, c) => acc + c.quantity, 0);
  const value = Number(Number(totalValue || 0).toFixed(2));

  // Evitar disparo duplicado en los mismos 3 segundos al navegar de CartDrawer a /checkout
  const now = Date.now();
  const lastInitTs = Number((window as any).__lastMetaInitCheckoutTs || 0);
  if (now - lastInitTs < 3000) return;
  (window as any).__lastMetaInitCheckoutTs = now;

  trackMarketingEvent('InitiateCheckout', {
    content_ids: contentIds,
    contents,
    content_type: 'product',
    value,
    currency: 'USD',
    num_items: numItems,
  });
}

/**
 * Dispara el evento estándar AddPaymentInfo en Meta Pixel cuando el cliente selecciona o confirma su método de pago en Checkout.
 */
export function trackMetaAddPaymentInfo(
  cartItems: Array<{
    product?: { id: string };
    kitDetails?: { essenceId: string };
    quantity: number;
    unitPrice: number;
  }>,
  totalValue: number,
  paymentMethod: string
) {
  if (typeof window === 'undefined' || !cartItems || cartItems.length === 0) return;

  const contents = cartItems.map((it) => {
    const id = resolveMetaCatalogId(it);
    return {
      id,
      quantity: Math.max(1, Number(it.quantity || 1)),
      item_price: Number(Number(it.unitPrice || 0).toFixed(2)),
    };
  });

  const contentIds = Array.from(new Set(contents.map((c) => c.id)));
  const numItems = contents.reduce((acc, c) => acc + c.quantity, 0);
  const value = Number(Number(totalValue || 0).toFixed(2));

  trackMarketingEvent('AddPaymentInfo', {
    content_ids: contentIds,
    contents,
    content_type: 'product',
    value,
    currency: 'USD',
    num_items: numItems,
    payment_method: paymentMethod,
  });
}

/**
 * Dispara el evento estándar Purchase en Meta Pixel (con deduplicación por orderNumber).
 */
export function trackMetaPurchase(payload: {
  orderNumber: string;
  totalValue: number;
  items?: Array<{
    productId?: string;
    quantity: number;
    price: number;
  }>;
}) {
  if (typeof window === 'undefined' || !payload.orderNumber) return;

  try {
    const trackedKey = `aromaniak_meta_purchase_${payload.orderNumber}`;
    if (localStorage.getItem(trackedKey)) {
      return;
    }
    localStorage.setItem(trackedKey, '1');
  } catch (_) {}

  let items = payload.items || [];
  if (items.length === 0) {
    try {
      const savedPending = sessionStorage.getItem(
        `aromaniak_pending_meta_order_${payload.orderNumber}`
      );
      if (savedPending) {
        const parsed = JSON.parse(savedPending);
        if (Array.isArray(parsed.items)) items = parsed.items;
      }
    } catch (_) {}
  }

  const contents =
    items.length > 0
      ? items.map((it) => {
          const rawId = it.productId || 'arma-tu-perfume-100ml';
          const id = rawId.startsWith('kit-') ? 'arma-tu-perfume-100ml' : rawId;
          return {
            id,
            quantity: Math.max(1, Number(it.quantity || 1)),
            item_price: Number(Number(it.price || 0).toFixed(2)),
          };
        })
      : [
          {
            id: 'arma-tu-perfume-100ml',
            quantity: 1,
            item_price: Number(Number(payload.totalValue || 0).toFixed(2)),
          },
        ];

  const contentIds = Array.from(new Set(contents.map((c) => c.id)));
  const numItems = contents.reduce((acc, c) => acc + c.quantity, 0);
  const value = Number(Number(payload.totalValue || 0).toFixed(2));

  trackMarketingEvent('Purchase', {
    content_ids: contentIds,
    contents,
    content_type: 'product',
    value,
    currency: 'USD',
    num_items: numItems,
    order_id: payload.orderNumber,
  });
}

export default function MarketingScripts() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const metaPixelId = META_PIXEL_ID;

  useEffect(() => {
    try {
      const sessionKey = 'aromaniak_session_tracked';
      const lastPingKey = 'aromaniak_last_ping_ts';
      const hasSession = sessionStorage.getItem(sessionKey);
      const isNewSession = !hasSession;
      const lastPing = Number(sessionStorage.getItem(lastPingKey) || 0);
      const now = Date.now();

      if (isNewSession || now - lastPing > 5 * 60 * 1000) {
        sessionStorage.setItem(sessionKey, '1');
        sessionStorage.setItem(lastPingKey, String(now));

        const isMobile = /iPhone|Android|Mobile/i.test(navigator.userAgent);
        const isTablet = /iPad|Tablet/i.test(navigator.userAgent);
        const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
        const referrer = document.referrer || '';
        const payload = JSON.stringify({ isNewSession, referrer, device });

        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            '/api/analytics/visit',
            new Blob([payload], { type: 'application/json' })
          );
        } else {
          fetch('/api/analytics/visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      }
    } catch {
      // Ignore if sessionStorage disabled
    }
  }, []);

  return (
    <>
      {/* ================= GOOGLE TAG (gtag.js) ================= */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-F6C37J8FFS"
        strategy="afterInteractive"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-F6C37J8FFS');
          `,
        }}
      />

      {/* ================= GOOGLE TAG MANAGER ================= */}
      {gtmId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* ================= META PIXEL (FACEBOOK / INSTAGRAM ADS) ================= */}
      {metaPixelId && (
        <>
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                var _cm=null;
                try{
                  Object.defineProperty(n,'callMethod',{
                    configurable:true,
                    get:function(){return _cm;},
                    set:function(fn){
                      if(typeof fn!=='function'){_cm=fn;return;}
                      _cm=function(){
                        var a=Array.prototype.slice.call(arguments);
                        var ev=String(a[1]||a[2]||'').toLowerCase();
                        if(ev==='subscribe'||ev==='subscribed'||ev==='subscribedbuttonclick'){return;}
                        return fn.apply(this,a);
                      };
                    }
                  });
                }catch(_){}
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('set', 'autoConfig', false, '${metaPixelId}');
                fbq('init', '${metaPixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
    </>
  );
}
