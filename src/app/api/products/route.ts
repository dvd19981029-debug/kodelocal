import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_PRODUCTS } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inStockOnly = searchParams.get('inStock') === 'true';

    // Consultar productos en la base de datos de Supabase
    const dbProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        isAvailableOnline: true,
        ...(inStockOnly ? { stock: { gt: 0 } } : {}),
      },
      include: {
        category: true,
      },
      orderBy: [
        { stock: 'desc' },
        { sku: 'asc' },
      ],
    });

    if (dbProducts.length === 0) {
      // Si la base de datos no tiene productos aún, devolver fallback
      return NextResponse.json({
        success: true,
        source: 'fallback',
        products: INITIAL_PRODUCTS,
        counts: {
          total: INITIAL_PRODUCTS.length,
          inStock: INITIAL_PRODUCTS.filter(p => p.stock > 0).length,
          outOfStock: INITIAL_PRODUCTS.filter(p => p.stock <= 0).length,
        }
      });
    }

    const formatted = dbProducts.map((p) => ({
      id: p.id,
      sku: p.sku || '',
      barcode: p.barcode || '',
      name: p.name,
      officialName: (p as any).officialName || '',
      brand: p.brand || '',
      gender: p.gender || 'Unisex',
      category: p.category?.name || 'Esencias para Perfume',
      unit: p.unit || 'Onza',
      price: Number(p.price),
      cost: Number(p.cost || 0),
      stock: p.stock,
      minStock: p.minStock,
      imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80',
      isAvailableOnline: p.isAvailableOnline,
      puesto: (p as any).puesto || '',
      supplier: (p as any).supplier || 'APAESA GUATEMALA',
    }));

    const total = formatted.length;
    const inStock = formatted.filter(p => p.stock > 0).length;
    const outOfStock = formatted.filter(p => p.stock <= 0).length;

    return NextResponse.json({
      success: true,
      source: 'database',
      products: formatted,
      counts: {
        total,
        inStock,
        outOfStock,
      }
    });
  } catch (error: any) {
    console.error('Error fetching products from DB:', error);
    // Fallback seguro en caso de error de conexión transitoria
    return NextResponse.json({
      success: true,
      source: 'fallback_error',
      products: INITIAL_PRODUCTS,
      counts: {
        total: INITIAL_PRODUCTS.length,
        inStock: INITIAL_PRODUCTS.filter(p => p.stock > 0).length,
        outOfStock: INITIAL_PRODUCTS.filter(p => p.stock <= 0).length,
      }
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, stock, isAvailableOnline, price, puesto, officialName, imageUrl } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(typeof stock === 'number' ? { stock } : {}),
        ...(typeof isAvailableOnline === 'boolean' ? { isAvailableOnline } : {}),
        ...(typeof price === 'number' ? { price } : {}),
        ...(typeof puesto === 'string' ? { puesto } : {}),
        ...(typeof officialName === 'string' ? { officialName } : {}),
        ...(typeof imageUrl === 'string' ? { imageUrl } : {}),
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
