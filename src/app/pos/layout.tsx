import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Punto de Venta',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
