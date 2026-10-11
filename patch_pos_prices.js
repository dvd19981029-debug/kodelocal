const fs = require('fs');

const path = 'src/app/pos/page.tsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');

  // Replace activeEssencePrice and activeEssenceHalfPrice logic
  const originalEssencePriceStr = `  const activeEssencePrice = sampleEssence?.price ?? 3.25;
  const activeEssenceHalfPrice = sampleEssence?.priceHalfOunce != null 
    ? Number(sampleEssence.priceHalfOunce) 
    : Number((activeEssencePrice / 2).toFixed(2));`;

  const newEssencePriceStr = `  // Extraer el cliente activo (si existe y tiene precios especiales)
  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  const activeEssencePrice = activeCustomer?.specialEssencePrice 
    ? Number(activeCustomer.specialEssencePrice) 
    : (sampleEssence?.price ?? 3.25);
    
  const activeEssenceHalfPrice = activeCustomer?.specialEssencePrice
    ? Number((Number(activeCustomer.specialEssencePrice) / 2).toFixed(2))
    : (sampleEssence?.priceHalfOunce != null 
      ? Number(sampleEssence.priceHalfOunce) 
      : Number((activeEssencePrice / 2).toFixed(2)));`;

  code = code.replace(originalEssencePriceStr, newEssencePriceStr);

  // Replace getItemUnitPrice
  const originalGetItemUnitPrice = `  // Helper para obtener el precio unitario del item según su presentación
  const getItemUnitPrice = (item: CartItem): number => {
    if (item.presentation === 'MEDIA_ONZA') {
      return item.product.priceHalfOunce != null 
        ? Number(item.product.priceHalfOunce) 
        : Number((item.product.price / 2).toFixed(2));
    }
    return item.product.price;
  };`;

  const newGetItemUnitPrice = `  // Helper para obtener el precio unitario del item según su presentación
  const getItemUnitPrice = (item: CartItem): number => {
    const isEssence = item.product.category === 'Esencias para Perfume' || !item.product.category;
    if (isEssence && activeCustomer?.specialEssencePrice) {
      if (item.presentation === 'MEDIA_ONZA') {
         return Number((activeCustomer.specialEssencePrice / 2).toFixed(2));
      }
      return Number(activeCustomer.specialEssencePrice);
    }

    const isBottle = item.product.category === 'Botes' || item.product.category === 'Botes & Envases';
    if (isBottle && activeCustomer?.specialBottlePrice) {
      return Number(activeCustomer.specialBottlePrice);
    }

    if (item.presentation === 'MEDIA_ONZA') {
      return item.product.priceHalfOunce != null 
        ? Number(item.product.priceHalfOunce) 
        : Number((item.product.price / 2).toFixed(2));
    }
    return item.product.price;
  };`;

  code = code.replace(originalGetItemUnitPrice, newGetItemUnitPrice);

  fs.writeFileSync(path, code);
  console.log('Patched pos/page.tsx with special prices logic');
}
