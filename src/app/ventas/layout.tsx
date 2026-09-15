import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control de Ventas y DTE | Aromaniak',
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

export default function VentasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
