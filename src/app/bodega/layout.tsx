import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bodega y Despacho | Aromaniak',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function BodegaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
