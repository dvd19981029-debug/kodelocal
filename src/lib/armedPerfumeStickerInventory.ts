const inFlightStickerDeductions = new Set<string>();

export function extractNumericSkuFromEssenceRef(ref: string | null | undefined): string | null {
  const clean = String(ref || '').trim();
  if (!clean) return null;

  if (/^\d+$/.test(clean)) {
    return clean.replace(/^0+/, '') || '0';
  }

  const essenceMatch = clean.match(/esencia-apae-0*(\d+)/i);
  if (essenceMatch?.[1]) {
    return essenceMatch[1];
  }

  const stickerMatch = clean.match(/(?:^|-)((?:stk|sticker)-0*(\d+))$/i);
  if (stickerMatch?.[2]) {
    return stickerMatch[2];
  }

  return null;
}

export function isArmedPerfumeWithSticker(it: any): boolean {
  if (!it) return false;
  const rawName = String(it.productName || it.name || it.nombre || it.descripcion || '').trim();
  const rawPres = String(it.presentation || it.unit || '').trim();
  const rawId = String(it.productId || it.codigo || it.sku || it.id || '').trim();
  const combined = `${rawName} | ${rawPres}`;

  const isArmedKit =
    Boolean(it.kitDetails) ||
    /arma tu propio perfume|kit_preparado/i.test(combined) ||
    rawId.toLowerCase().startsWith('kit-');

  if (!isArmedKit) return false;

  const hasSticker =
    typeof it.kitDetails?.hasLabel === 'boolean'
      ? it.kitDetails.hasLabel
      : !/sin\s+etiqueta|-nolabel\b/i.test(`${combined} | ${rawId}`);

  return hasSticker;
}

async function resolveStickerQuantitiesFromItems(
  db: any,
  items: any[]
): Promise<Map<string, number>> {
  const stickerQtyByNumSku = new Map<string, number>();
  if (!Array.isArray(items) || items.length === 0) return stickerQtyByNumSku;

  for (const it of items) {
    if (!isArmedPerfumeWithSticker(it)) continue;

    const qty = Math.max(1, Math.round(Number(it.quantity ?? it.cantidad ?? 1)));
    const rawRef = String(
      it.kitDetails?.essenceId || it.productId || it.codigo || it.sku || it.id || ''
    ).trim();

    let numSku = extractNumericSkuFromEssenceRef(rawRef);

    if (!numSku && rawRef && rawRef !== 'GEN-01') {
      const prod = await db.product.findFirst({
        where: {
          OR: [{ id: rawRef }, { sku: rawRef }],
        },
        select: { id: true, sku: true },
      });
      if (prod) {
        numSku =
          extractNumericSkuFromEssenceRef(prod.sku) ||
          extractNumericSkuFromEssenceRef(prod.id);
      }
    }

    if (!numSku) {
      const rawName = String(it.productName || it.name || it.nombre || it.descripcion || '').trim();
      const nameMatch = rawName.match(/arma tu propio perfume:\s*([^|(]+)/i);
      const fragName = nameMatch?.[1]?.trim();
      if (fragName) {
        const prod = await db.product.findFirst({
          where: {
            OR: [
              { name: { equals: fragName, mode: 'insensitive' } },
              { officialName: { equals: fragName, mode: 'insensitive' } },
            ],
            NOT: { id: { startsWith: 'sticker-' } },
          },
          select: { id: true, sku: true },
        });
        if (prod) {
          numSku =
            extractNumericSkuFromEssenceRef(prod.sku) ||
            extractNumericSkuFromEssenceRef(prod.id);
        }
      }
    }

    if (numSku) {
      stickerQtyByNumSku.set(numSku, (stickerQtyByNumSku.get(numSku) || 0) + qty);
    }
  }

  return stickerQtyByNumSku;
}

/**
 * Descuenta del inventario los stickers de perfumes ya armados ("Arma tu propio perfume" con etiqueta)
 * una vez que el pedido/venta es facturado, únicamente si el sticker estaba en inventario (stock > 0).
 * Operación idempotente por número de venta/orden.
 */
export async function deductArmedPerfumeStickersOnInvoice(
  db: any,
  params: {
    saleNumber?: string | null;
    items?: any[];
    userName?: string | null;
  }
): Promise<{ deducted: number; alreadyProcessed?: boolean }> {
  const cleanRef = String(params.saleNumber || '').trim();
  if (!cleanRef) return { deducted: 0 };

  if (inFlightStickerDeductions.has(cleanRef)) {
    return { deducted: 0, alreadyProcessed: true };
  }

  inFlightStickerDeductions.add(cleanRef);
  try {
    const refTag = `Sticker Armado #${cleanRef}`;

    const existingMovement = await db.stockMovement.findFirst({
      where: {
        reference: refTag,
        type: 'OUT_SALE',
      },
      select: { id: true },
    });
    if (existingMovement) {
      return { deducted: 0, alreadyProcessed: true };
    }

    let stickerQtyByNumSku = await resolveStickerQuantitiesFromItems(db, params.items || []);

    // Si es un pedido web y los ítems recibidos no traían el detalle completo, consultar EcommerceOrder.items
    if (stickerQtyByNumSku.size === 0 && cleanRef.toUpperCase().startsWith('WEB-')) {
      const webOrder = await db.ecommerceOrder.findUnique({
        where: { orderNumber: cleanRef },
        include: { items: true },
      });
      if (webOrder?.items?.length) {
        stickerQtyByNumSku = await resolveStickerQuantitiesFromItems(db, webOrder.items);
      }
    }

    if (stickerQtyByNumSku.size === 0) {
      return { deducted: 0 };
    }

    const numSkus = Array.from(stickerQtyByNumSku.keys());
    const candidateIds = numSkus.map((n) => `sticker-${n}`);
    const candidateSkus = numSkus.map((n) => `STK-${n}`);

    const stickerProducts = await db.product.findMany({
      where: {
        OR: [
          { id: { in: candidateIds } },
          { sku: { in: candidateSkus } },
        ],
      },
      select: { id: true, sku: true, stock: true },
    });

    let totalDeducted = 0;

    for (const [numSku, requestedQty] of stickerQtyByNumSku.entries()) {
      const targetId = `sticker-${numSku}`;
      const targetSku = `STK-${numSku}`.toUpperCase();
      const stickerProd = stickerProducts.find(
        (p: any) => p.id === targetId || String(p.sku || '').trim().toUpperCase() === targetSku
      );

      const currentStock = Number(stickerProd?.stock || 0);
      if (!stickerProd || currentStock <= 0) {
        // Solo descontar si el sticker estaba en inventario
        continue;
      }

      const deductQty = Math.min(currentStock, requestedQty);
      if (deductQty <= 0) continue;

      const updatedRows: Array<{ stock: number }> = await db.$queryRaw`
        UPDATE "Product"
        SET "stock" = GREATEST(0, "stock" - ${deductQty}),
            "updatedAt" = NOW()
        WHERE "id" = ${stickerProd.id} AND "stock" > 0
        RETURNING "stock"
      `;

      if (updatedRows && updatedRows.length > 0) {
        const newStock = Number(updatedRows[0].stock || 0);
        await db.stockMovement.create({
          data: {
            productId: stickerProd.id,
            type: 'OUT_SALE',
            quantity: deductQty,
            previousStock: newStock + deductQty,
            newStock,
            reference: refTag,
            notes: `Descuento de sticker por perfume armado facturado (#${cleanRef})`,
            userName: params.userName || 'Sistema (Facturación)',
          },
        });
        totalDeducted += deductQty;
      }
    }

    return { deducted: totalDeducted };
  } catch (err) {
    console.warn(`Error al descontar sticker de perfume armado (${cleanRef}):`, err);
    return { deducted: 0 };
  } finally {
    inFlightStickerDeductions.delete(cleanRef);
  }
}

/**
 * Restaura al inventario los stickers que hayan sido efectivamente descontados al facturar
 * si la venta/orden se anula o cancela posteriormente.
 */
export async function restoreArmedPerfumeStickersOnCancel(
  db: any,
  params: {
    saleNumber?: string | null;
    userName?: string | null;
  }
): Promise<{ restored: number }> {
  const cleanRef = String(params.saleNumber || '').trim();
  if (!cleanRef) return { restored: 0 };

  try {
    const outRefTag = `Sticker Armado #${cleanRef}`;
    const returnRefTag = `Anulación Sticker Armado #${cleanRef}`;

    const deductedMovements = await db.stockMovement.findMany({
      where: {
        reference: outRefTag,
        type: 'OUT_SALE',
      },
    });
    if (!deductedMovements || deductedMovements.length === 0) {
      return { restored: 0 };
    }

    const existingRestore = await db.stockMovement.findFirst({
      where: {
        reference: returnRefTag,
      },
      select: { id: true },
    });
    if (existingRestore) {
      return { restored: 0 };
    }

    let totalRestored = 0;
    for (const mov of deductedMovements) {
      const qty = Math.max(1, Number(mov.quantity || 1));
      const updatedRows: Array<{ stock: number }> = await db.$queryRaw`
        UPDATE "Product"
        SET "stock" = COALESCE("stock", 0) + ${qty},
            "updatedAt" = NOW()
        WHERE "id" = ${mov.productId}
        RETURNING "stock"
      `;
      if (updatedRows && updatedRows.length > 0) {
        const currentStock = Number(updatedRows[0].stock || 0);
        await db.stockMovement.create({
          data: {
            productId: mov.productId,
            type: 'ADJUSTMENT',
            quantity: qty,
            previousStock: Math.max(0, currentStock - qty),
            newStock: currentStock,
            reference: returnRefTag,
            notes: `Restauración de sticker por anulación de orden facturada (#${cleanRef})`,
            userName: params.userName || 'Sistema (Anulación)',
          },
        });
        totalRestored += qty;
      }
    }

    return { restored: totalRestored };
  } catch (err) {
    console.warn(`Error al restaurar sticker de perfume armado (${cleanRef}):`, err);
    return { restored: 0 };
  }
}
