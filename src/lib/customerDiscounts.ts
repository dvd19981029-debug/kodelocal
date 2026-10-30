export interface CustomerLookupInput {
  id?: string | null;
  extraIds?: Array<string | null | undefined>;
  email?: string | null;
  phone?: string | null;
  documentNum?: string | null;
  nrc?: string | null;
  name?: string | null;
}

export function isGenericEmail(email?: string | null): boolean {
  if (!email) return true;
  const e = email.trim().toLowerCase();
  if (!e) return true;
  return (
    /^(cliente|clientes|sin|sincorreo|nocorreo|no|ninguno|na|test|correo|consumidor|final|anonimo|ventas|factura|facturacion)@/.test(e) ||
    e === 'cliente@gmail.com' ||
    e === 'sin@correo.com' ||
    e === 'no@tiene.com'
  );
}

export function isGenericDocument(doc?: string | null): boolean {
  if (!doc) return true;
  const d = doc.trim().replace(/[-\s']/g, '');
  if (!d) return true;
  return /^(0+|9+|12345678\d?|123456789\d*|00000000\d?)$/.test(d);
}

export function isGenericPhone(phone?: string | null): boolean {
  if (!phone) return true;
  const p = phone.trim().replace(/\D/g, '');
  if (!p) return true;
  return /^(0+|7+|9+|2+|12345678)$/.test(p);
}

export function hasCustomerDiscountFields(c: any): boolean {
  if (!c) return false;
  return Boolean(
    c.tierId ||
      c.customDiscountPct != null ||
      c.specialEssencePrice != null ||
      c.specialHalfEssencePrice != null ||
      c.specialBottlePrice != null ||
      c.bottleTierId ||
      c.bottleCustomDiscountPct != null ||
      c.suppliesTierId ||
      c.suppliesCustomDiscountPct != null
  );
}

export function buildCustomerLookupOrConditions(input: CustomerLookupInput): any[] {
  const conditions: any[] = [];
  const seenIds = new Set<string>();

  const addId = (rawId?: string | null) => {
    const clean = typeof rawId === 'string' ? rawId.trim() : '';
    if (clean && !clean.startsWith('cli-') && !seenIds.has(clean)) {
      seenIds.add(clean);
      conditions.push({ id: clean });
    }
  };

  addId(input.id);
  if (Array.isArray(input.extraIds)) {
    for (const extId of input.extraIds) addId(extId);
  }

  const cleanEmail = String(input.email || '').trim().toLowerCase();
  if (cleanEmail && !isGenericEmail(cleanEmail)) {
    conditions.push({ email: { equals: cleanEmail, mode: 'insensitive' } });
  }

  const phoneDigits8 = String(input.phone || '').replace(/\D/g, '').slice(-8);
  if (phoneDigits8.length === 8 && !isGenericPhone(phoneDigits8)) {
    conditions.push(
      { phone: { endsWith: phoneDigits8 } },
      { phone: { endsWith: `${phoneDigits8.slice(0, 4)}-${phoneDigits8.slice(4)}` } }
    );
  }

  const cleanDoc = String(input.documentNum || '').trim();
  if (cleanDoc && !isGenericDocument(cleanDoc)) {
    conditions.push({ documentNum: cleanDoc });
    const dDigits = cleanDoc.replace(/\D/g, '');
    if (dDigits.length === 9) {
      conditions.push(
        { documentNum: dDigits },
        { documentNum: `${dDigits.slice(0, 8)}-${dDigits.slice(8)}` }
      );
    }
  }

  const cleanNrc = String(input.nrc || '').trim();
  if (cleanNrc) {
    conditions.push({ nrc: cleanNrc });
  }

  const cleanName = String(input.name || '').trim();
  if (cleanName && cleanName.toLowerCase() !== 'consumidor final' && cleanName.toLowerCase() !== 'cliente online') {
    conditions.push({ name: { equals: cleanName, mode: 'insensitive' } });
  }

  return conditions;
}

export function consolidateCustomerDiscounts<T extends Record<string, any>>(
  primary: T | null | undefined,
  candidates: T[]
): T | null {
  const base = primary || candidates[0] || null;
  if (!base) return null;
  if (candidates.length <= 1 && candidates[0]?.id === base.id) return base;

  return {
    ...base,
    tier: base.tier || candidates.find((c) => c.tier)?.tier || null,
    tierId: base.tierId || candidates.find((c) => c.tierId)?.tierId || null,
    customDiscountPct:
      base.customDiscountPct ??
      candidates.find((c) => c.customDiscountPct != null)?.customDiscountPct ??
      null,
    bottleTier: base.bottleTier || candidates.find((c) => c.bottleTier)?.bottleTier || null,
    bottleTierId: base.bottleTierId || candidates.find((c) => c.bottleTierId)?.bottleTierId || null,
    bottleCustomDiscountPct:
      base.bottleCustomDiscountPct ??
      candidates.find((c) => c.bottleCustomDiscountPct != null)?.bottleCustomDiscountPct ??
      null,
    suppliesTier: base.suppliesTier || candidates.find((c) => c.suppliesTier)?.suppliesTier || null,
    suppliesTierId: base.suppliesTierId || candidates.find((c) => c.suppliesTierId)?.suppliesTierId || null,
    suppliesCustomDiscountPct:
      base.suppliesCustomDiscountPct ??
      candidates.find((c) => c.suppliesCustomDiscountPct != null)?.suppliesCustomDiscountPct ??
      null,
    specialEssencePrice:
      base.specialEssencePrice ??
      candidates.find((c) => c.specialEssencePrice != null)?.specialEssencePrice ??
      null,
    specialHalfEssencePrice:
      base.specialHalfEssencePrice ??
      candidates.find((c) => c.specialHalfEssencePrice != null)?.specialHalfEssencePrice ??
      null,
    specialBottlePrice:
      base.specialBottlePrice ??
      candidates.find((c) => c.specialBottlePrice != null)?.specialBottlePrice ??
      null,
  };
}
