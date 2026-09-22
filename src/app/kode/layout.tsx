import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KÖDE - Sistema de Ventas y Gestión de Pedidos',
  description: 'Panel de ventas por WhatsApp y gestión logística de KÖDE',
};

export default function KodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
