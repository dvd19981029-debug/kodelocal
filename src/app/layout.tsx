import type { Metadata } from "next";
import "./globals.css";
import StorageInitializer from "@/components/StorageInitializer";
import NavigationWrapper from "@/components/NavigationWrapper";

export const metadata: Metadata = {
  title: "Aromaniak SV - Perfumería Fina & Contratipos de Lujo",
  description: "Tienda online de fragancias y contratipos finos con fijación de 8 a 12 horas en El Salvador. Envíos a todo el país y pago contra entrega.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-[#f1f4f9] text-slate-800 antialiased">
        <StorageInitializer />
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
      </body>
    </html>
  );
}
