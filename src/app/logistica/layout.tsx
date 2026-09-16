import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logística de Envíos',
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

export default function LogisticaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
