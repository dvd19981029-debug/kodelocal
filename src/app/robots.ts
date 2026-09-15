import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/pos',
          '/pos/',
          '/admin',
          '/admin/',
          '/bodega',
          '/bodega/',
          '/ventas',
          '/ventas/',
          '/inventario',
          '/inventario/',
          '/logistica',
          '/logistica/',
          '/login',
          '/api/',
          '/checkout',
          '/checkout/',
        ],
      },
    ],
    sitemap: 'https://aromaniaksv.com/sitemap.xml',
  };
}
