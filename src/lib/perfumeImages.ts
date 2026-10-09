import { Product } from '@/types/kode';

export const getProductImage = (product: Product | undefined | null): string => {
  if (!product) return '/images/essence_bottle_blank.webp';
  
  if (product.category === 'Botes' || product.name.toLowerCase().includes('bote')) {
    return product.imageUrl || '/images/botes/bote_100ml_degrade_azul_noche.jpg';
  }

  // Esencias -> Devolvemos el envase en blanco estático (muy ligero, webp)
  // El frontend (ProductCard, etc) debe sobreponer el nombre usando CSS si lo desea.
  return '/images/essence_bottle_blank.webp';
};
