import { ProductItem, INITIAL_PRODUCTS } from '@/lib/store';
import { formatPerfumeDisplayName, getInspiracionPerfumeName, isIncomingEssence } from '@/lib/perfumeNames';
import { getFragranceProfile } from '@/lib/fragranceProfiles';
import { getFragranceDescription } from '@/lib/fragranceDescriptions';
import { getProductUrl } from '@/lib/productUrl';
import {
  isHalloweenPromoProduct,
  HALLOWEEN_PROMO_PRICE_1OZ,
  HALLOWEEN_PROMO_PRICE_HALF_OZ,
} from '@/lib/halloweenPromo';

const SITE_URL = 'https://aromaniaksv.com';

const BEST_SELLER_SKUS = new Set([
  '1', '2', '3', '4', '5', '6', '7', '8', '10', '11',
  '12', '13', '16', '18', '20', '23', '28', '30', '32', '33',
  '40', '43', '49', '50', '52', '53', '58', '60', '61'
]);

const INITIAL_PRODUCT_MAP = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));

/**
 * Limpia referencias de casas comerciales registradas para cumplir al 100%
 * las políticas de Propiedad Intelectual de Meta Commerce Manager sin bloqueos.
 */
function sanitizeMetaInspiration(rawInsp: string): string {
  return rawInsp
    .replace(/\s+[HFMU]$/i, '')
    .replace(/\s+M\s+F$/i, '')
    .replace(/\bBoss\s+/gi, '')
    .replace(/\bBurberry\s+/gi, '')
    .replace(/\bPolo\s+/gi, '')
    .replace(/\bBharara\s+/gi, '')
    .replace(/\bVera\s+Wang\s+/gi, '')
    .replace(/\bd'Issey\b/gi, '')
    .replace(/\bCHNL°\s*5\b/gi, 'N° 5')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function sanitizeMetaText(text: string): string {
  return text
    .replace(/\b(Dior|Chanel|Giorgio\s+Armani|Armani|Creed|Versace|Tom\s+Ford|Carolina\s+Herrera|Paco\s+Rabanne|Jean\s+Paul\s+Gaultier|Le\s+Labo|Lattafa|Xerjoff|Givenchy|Thierry\s+Mugler|Mugler|Billie\s+Eilish|Prada|Tommy\s+Hilfiger|Herm[eè]s|Calvin\s+Klein|Davidoff|Guy\s+Laroche|Issey\s+Miyake|Montblanc|Valentino|Lanc[oô]me|Armaf|Hugo\s+Boss|Dolce\s*&\s*Gabbana|Afnan|DKNY|Louis\s+Vuitton|Victorinox|Lacoste|Ralph\s+Lauren|Viktor\s*&\s*Rolf|Yves\s+Saint\s+Laurent|YSL|Perry\s+Ellis|Elizabeth\s+Arden|Vera\s+Wang|Bvlgari|Moschino|Maison\s+Francis\s+Kurkdjian|MFK|Jes[uú]s\s+del\s+Pozo|Bharara)\b/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+[HFMU]\./g, '.')
    .replace(/\s+M\s+F\b/g, ' F')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function escapeCsvField(val: string | number | undefined | null): string {
  const s = String(val ?? '')
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (s.includes(',') || s.includes('"') || s.includes(';')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return `"${s}"`;
}

/**
 * Resuelve la URL de imagen 1000x1000 .jpg para Meta:
 * - Si es uno de los 110 productos pre-generados y no cambió su nombre/imagen en POS, usa el archivo estático /images/meta/{id}.jpg
 * - Si es un producto NUEVO creado desde el POS/Bodega o si se le editó el nombre/foto, usa el generador dinámico en tiempo real /api/feed/meta/image/{id}.jpg
 */
function resolveMetaImageUrl(p: ProductItem): string {
  if (INITIAL_PRODUCT_MAP.has(p.id)) {
    return `${SITE_URL}/images/meta/${p.id}.jpg?v=6`;
  }
  return `${SITE_URL}/api/feed/meta/image/${encodeURIComponent(p.id)}.jpg?v=6`;
}

export interface MetaCatalogProductInput extends ProductItem {
  isActive?: boolean;
}

export interface MetaCatalogRow {
  id: string;
  title: string;
  description: string;
  availability: 'in stock' | 'out of stock' | 'available for order' | 'discontinued';
  quantity_to_sell_on_facebook: number;
  condition: 'new';
  price: string;
  sale_price: string;
  sale_price_effective_date: string;
  link: string;
  image_link: string;
  brand: string;
  google_product_category: string;
  fb_product_category: string;
  gender: 'male' | 'female' | 'unisex';
  age_group: 'adult';
  custom_label_0: string;
  custom_label_1: string;
  custom_label_2: string;
  custom_label_3: string;
  custom_label_4: string;
}

export function buildMetaCatalogRows(
  products: MetaCatalogProductInput[] = INITIAL_PRODUCTS,
  options?: {
    strictStock?: boolean;
    kitStandardPrice?: number;
    kitPlusPrice?: number;
  }
): MetaCatalogRow[] {
  const strictStock = options?.strictStock === true;
  const kitStandardPrice = Number(options?.kitStandardPrice || 11.0);
  const kitPlusPrice = Number(options?.kitPlusPrice || 14.0);
  const rows: MetaCatalogRow[] = [];

  // Filtrar ítems internos de sistema ($1 Alcohol y Envío a Domicilio)
  const catalogProducts = products.filter(
    (p) =>
      p.id !== 'ENVIO-DOM' &&
      p.id !== 'cmvfrqz7v0003jp08y8bmrnpz' &&
      String(p.name || '').trim().toLowerCase() !== '$1 alcohol' &&
      p.category !== 'Logística'
  );

  // Ordenar: Esencias primero (por SKU numérico), luego Botes, luego Insumos
  catalogProducts.sort((a, b) => {
    const catOrder = (cat: string) => {
      if (cat === 'Esencias para Perfume') return 1;
      if (cat === 'Botes' || cat === 'Botes & Envases') return 2;
      return 3;
    };
    const ca = catOrder(a.category);
    const cb = catOrder(b.category);
    if (ca !== cb) return ca - cb;
    if (ca === 1) {
      const na = Number(a.sku);
      const nb = Number(b.sku);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a.sku || '').localeCompare(String(b.sku || ''));
    }
    return (b.stock || 0) - (a.stock || 0);
  });

  // 1. Producto Estrella Hero: Arma tu Perfume de 100ml Listo para Usar
  rows.push({
    id: 'arma-tu-perfume-100ml',
    title: 'Arma tu Perfume de 100ml Listo para Usar (Alta Fijación) | Aromaniak',
    description: `Personaliza tu propio perfume de 100ml en Aromaniak SV. Elige tu aroma favorito entre más de 80 fragancias de alta gama y selecciona tu frasco de cristal de 100ml con atomizador spray. Preparado con Esencia 100% Pura AAA+ y Alcohol Perfumero con Fijador para una duración superior en el clima de El Salvador. Fórmula Estándar $${kitStandardPrice.toFixed(2)} USD | Fórmula Plus $${kitPlusPrice.toFixed(2)} USD. Tienda física en C.C. El Rosal, San Salvador y envíos a todo El Salvador por $2.90.`,
    availability: 'in stock',
    quantity_to_sell_on_facebook: 100,
    condition: 'new',
    price: `${kitStandardPrice.toFixed(2)} USD`,
    sale_price: '',
    sale_price_effective_date: '',
    link: `${SITE_URL}/?categoria=Arma+tu+perfume#seccion-arma-tu-perfume`,
    image_link: `${SITE_URL}/images/meta/arma-tu-perfume-100ml.jpg?v=6`,
    brand: 'Aromaniak',
    google_product_category: 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne',
    fb_product_category: 'health & beauty > beauty > fragrance',
    gender: 'unisex',
    age_group: 'adult',
    custom_label_0: 'Perfume Preparado 100ml',
    custom_label_1: 'Unisex',
    custom_label_2: 'Disponible en Tienda',
    custom_label_3: 'Extracto de Perfume 100ml',
    custom_label_4: 'Best Seller',
  });

  for (const p of catalogProducts) {
    const isEssence = p.category === 'Esencias para Perfume';
    const isBottle = p.category === 'Botes' || p.category === 'Botes & Envases';
    const isDiscontinued = p.isActive === false || p.isAvailableOnline === false;

    const fullOzStock = Math.max(0, Math.floor(Number(p.stock || 0)));
    const halfOzStock = Math.max(0, Math.floor(Number(p.stockHalf || 0)));
    // En la web (ProductCard.tsx), un producto está en stock si y solo si p.stock > 0 (unidades de la presentación principal: 1 Onza / 1 Unidad)
    const unitStock = fullOzStock;

    // Un producto sin stock se considera "En Camino" en etiquetas internas si es un próximo ingreso o bote en reposición,
    // pero para Meta SIEMPRE debe reportarse 'out of stock' con 0 unidades mientras su stock real sea 0.
    const isIncoming = unitStock <= 0 && (isBottle || (isEssence && isIncomingEssence(p)));

    // Estado de disponibilidad 100% fiel a la base de datos en tiempo real:
    // - Si se desactiva o descontinúa en POS/Bodega -> 'discontinued' (0 unidades)
    // - Si tiene stock > 0 -> 'in stock' (unidades exactas en bodega)
    // - Si tiene stock <= 0 (incluyendo "En Camino") -> 'out of stock' (0 unidades)
    let availability: MetaCatalogRow['availability'] = 'out of stock';
    let fbQuantity = 0;
    let stockLabel = 'Agotado';

    if (isDiscontinued) {
      availability = 'discontinued';
      fbQuantity = 0;
      stockLabel = 'Descontinuado';
    } else if (unitStock > 0) {
      availability = 'in stock';
      fbQuantity = unitStock;
      stockLabel = 'Disponible en Tienda';
    } else {
      availability = 'out of stock';
      fbQuantity = 0;
      stockLabel = isIncoming ? 'En Camino (Sin Stock)' : 'Agotado';
    }

    const productUrl = `${SITE_URL}${getProductUrl(p)}`;
    const imageLink = resolveMetaImageUrl(p);

    if (isEssence) {
      const displayName = formatPerfumeDisplayName(p)
        .replace(/\s+M\s+F$/i, ' F')
        .trim();
      const rawInsp = getInspiracionPerfumeName(p);
      const cleanInsp = sanitizeMetaInspiration(rawInsp);
      const prof = getFragranceProfile(p);
      const rawDesc = getFragranceDescription(p, prof);
      const cleanDesc = sanitizeMetaText(rawDesc);

      const gLower = (p.gender || '').toLowerCase();
      const metaGender: 'male' | 'female' | 'unisex' =
        gLower.includes('caballero') || gLower.includes('hombre')
          ? 'male'
          : gLower.includes('dama') || gLower.includes('mujer')
          ? 'female'
          : 'unisex';

      const genderLabelEs =
        metaGender === 'male' ? 'Caballero' : metaGender === 'female' ? 'Dama' : 'Unisex';

      const familyClean = (prof?.family || 'Perfumería Fina')
        .replace(/CUERO/gi, 'Cuero')
        .replace(/AMADERADO/gi, 'Amaderado')
        .replace(/AMADERADA/gi, 'Amaderada')
        .replace(/CÍTRICO/gi, 'Cítrico')
        .replace(/CÍTRICA/gi, 'Cítrica')
        .replace(/FLORAL/gi, 'Floral')
        .replace(/ÁMBAR/gi, 'Ámbar')
        .replace(/CHIPRE/gi, 'Chipre')
        .replace(/AROMÁTICO/gi, 'Aromático')
        .replace(/AROMÁTICA/gi, 'Aromática');

      const topNotes = (prof?.topNotes || []).slice(0, 4).join(', ');
      const heartNotes = (prof?.heartNotes || []).slice(0, 4).join(', ');
      const baseNotes = (prof?.baseNotes || []).slice(0, 4).join(', ');

      const notesSummary = [
        topNotes ? `Salida: ${topNotes}` : '',
        heartNotes ? `Corazón: ${heartNotes}` : '',
        baseNotes ? `Fondo: ${baseNotes}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const isPromo = isHalloweenPromoProduct(p);
      const liveFullPrice = Number(p.price || 3.75);
      const liveHalfPrice =
        p.priceHalfOunce != null ? Number(p.priceHalfOunce) : Number((liveFullPrice / 2).toFixed(2));

      const basePrice = liveFullPrice;
      const salePrice = isPromo ? `${HALLOWEEN_PROMO_PRICE_1OZ.toFixed(2)} USD` : '';
      const saleDate = isPromo ? '2026-10-15T00:00:00-06:00/2026-10-31T23:59:59-06:00' : '';

      const effective1OzPrice = isPromo ? HALLOWEEN_PROMO_PRICE_1OZ : basePrice;
      const effectiveHalfPrice = isPromo ? HALLOWEEN_PROMO_PRICE_HALF_OZ : liveHalfPrice;

      const title = sanitizeMetaText(
        `${displayName} - Esencia Pura 1 Oz (Inspiración ${cleanInsp}) | Aromaniak`
      );

      const fullDescription = [
        `${displayName} (Código #${p.sku}) — Esencia 100% pura sin diluir calidad AAA+ de Aromaniak SV.`,
        `Inspirada en ${cleanInsp} (${genderLabelEs} • Familia ${familyClean}).`,
        notesSummary ? `Pirámide olfativa: ${notesSummary}.` : '',
        cleanDesc,
        `Presentaciones disponibles: 1 Onza ($${effective1OzPrice.toFixed(2)}), Media Onza ($${effectiveHalfPrice.toFixed(2)}) o en Perfume Preparado de 100ml listo para usar ($${kitStandardPrice.toFixed(2)}).`,
        isIncoming
          ? `Estado actual: Próximo ingreso a bodega (En camino).`
          : `Disponible en tienda física C.C. El Rosal (San Salvador) y envíos a todo El Salvador por $2.90.`,
      ]
        .filter(Boolean)
        .join(' ');

      const collectionLabel = isDiscontinued
        ? 'Descontinuado'
        : isPromo
        ? 'Promo Halloween $3.30'
        : isIncoming
        ? 'Nuevos Ingresos En Camino'
        : BEST_SELLER_SKUS.has(String(p.sku))
        ? 'Best Seller'
        : 'Catálogo Regular';

      rows.push({
        id: p.id,
        title,
        description: fullDescription,
        availability,
        quantity_to_sell_on_facebook: fbQuantity,
        condition: 'new',
        price: `${basePrice.toFixed(2)} USD`,
        sale_price: salePrice,
        sale_price_effective_date: saleDate,
        link: productUrl,
        image_link: imageLink,
        brand: 'Aromaniak',
        google_product_category: 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne',
        fb_product_category: 'health & beauty > beauty > fragrance',
        gender: metaGender,
        age_group: 'adult',
        custom_label_0: 'Esencias Puras',
        custom_label_1: genderLabelEs,
        custom_label_2: stockLabel,
        custom_label_3: familyClean,
        custom_label_4: collectionLabel,
      });
    } else if (isBottle) {
      const rawBottleName = (p.officialName || p.name || 'Frasco de Cristal 100ml')
        .replace(/\b100\s*m(l)?\b/gi, '')
        .replace(/\bRosca\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      const bottleName = rawBottleName.startsWith('Bote') ? rawBottleName : `Bote ${rawBottleName}`;
      const livePrice = Number(p.price || 1.45);
      const title = `${bottleName} 100ml en Vidrio con Atomizador (Unidad) | Aromaniak`;
      const desc = `${p.description || `${bottleName} de cristal grueso de 100ml con válvula atomizadora spray y cierre de rosca.`} Ideal para preparar tus perfumes con esencias puras Aromaniak o emprender tu propia marca de perfumería en El Salvador. Precio por unidad: $${livePrice.toFixed(2)} USD. Tienda en C.C. El Rosal, San Salvador y envíos a todo El Salvador por $2.90.`;

      rows.push({
        id: p.id,
        title,
        description: desc,
        availability,
        quantity_to_sell_on_facebook: fbQuantity,
        condition: 'new',
        price: `${livePrice.toFixed(2)} USD`,
        sale_price: '',
        sale_price_effective_date: '',
        link: productUrl,
        image_link: imageLink,
        brand: 'Aromaniak',
        google_product_category:
          'Health & Beauty > Personal Care > Cosmetics > Cosmetic & Toiletry Bags & Cases',
        fb_product_category: 'health & beauty > beauty > fragrance',
        gender: 'unisex',
        age_group: 'adult',
        custom_label_0: 'Botes de Cristal 100ml',
        custom_label_1: 'Envases e Insumos',
        custom_label_2: stockLabel,
        custom_label_3: 'Frasco 100ml Rosca',
        custom_label_4: unitStock > 0 ? 'Best Seller' : 'Agotado',
      });
    } else {
      const insumoName = (p.officialName || p.name).trim();
      const livePrice = Number(p.price || 1.0);
      const title = `${insumoName} - Insumo de Perfumería Fina | Aromaniak`;
      const desc = `${p.description || insumoName} Insumo de grado perfumería fina ideal para formular perfumes de alta fijación y larga duración con esencias puras Aromaniak. Precio: $${livePrice.toFixed(2)} USD. Disponible en tienda física C.C. El Rosal, San Salvador y envíos a todo El Salvador por $2.90.`;

      rows.push({
        id: p.id,
        title,
        description: desc,
        availability,
        quantity_to_sell_on_facebook: fbQuantity,
        condition: 'new',
        price: `${livePrice.toFixed(2)} USD`,
        sale_price: '',
        sale_price_effective_date: '',
        link: productUrl,
        image_link: imageLink,
        brand: 'Aromaniak',
        google_product_category: 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne',
        fb_product_category: 'health & beauty > beauty > fragrance',
        gender: 'unisex',
        age_group: 'adult',
        custom_label_0: 'Insumos de Perfumería',
        custom_label_1: 'Envases e Insumos',
        custom_label_2: stockLabel,
        custom_label_3: 'Insumos y Fijadores',
        custom_label_4: 'Best Seller',
      });
    }
  }

  return rows;
}

export function serializeMetaCatalogCsv(rows: MetaCatalogRow[]): string {
  const headers: (keyof MetaCatalogRow)[] = [
    'id',
    'title',
    'description',
    'availability',
    'quantity_to_sell_on_facebook',
    'condition',
    'price',
    'sale_price',
    'sale_price_effective_date',
    'link',
    'image_link',
    'brand',
    'google_product_category',
    'fb_product_category',
    'gender',
    'age_group',
    'custom_label_0',
    'custom_label_1',
    'custom_label_2',
    'custom_label_3',
    'custom_label_4',
  ];

  const headerLine = headers.join(',');
  const lines = rows.map((row) =>
    headers.map((h) => escapeCsvField(row[h])).join(',')
  );

  return [headerLine, ...lines].join('\r\n');
}
