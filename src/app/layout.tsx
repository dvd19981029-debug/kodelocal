import type { Metadata } from "next";
import "./globals.css";
import StorageInitializer from "@/components/StorageInitializer";
import NavigationWrapper from "@/components/NavigationWrapper";

export const metadata: Metadata = {
  title: "Aromaniak SV - Perfumería Fina & Contratipos de Lujo",
  description: "Tienda online de fragancias y contratipos finos con esencias 100% puras y fijación de 8 a 12 horas. Envíos a todo El Salvador con C807.",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
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
