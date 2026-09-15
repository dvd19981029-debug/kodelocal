import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inventario y Kardex | Aromaniak',
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

export default function InventarioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
