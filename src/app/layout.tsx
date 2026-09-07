import type { Metadata, Viewport } from "next";
import "./globals.css";
import StorageInitializer from "@/components/StorageInitializer";
import NavigationWrapper from "@/components/NavigationWrapper";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Aromaniak SV - Perfumería Fina & Contratipos de Lujo",
  description: "Tienda online de fragancias y contratipos finos con esencias 100% puras. Envíos a todo El Salvador con C807.",
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
    <html lang="es" className="h-full touch-manipulation">
      <body className="min-h-full flex flex-col bg-[#f1f4f9] text-slate-800 antialiased touch-manipulation">
        <StorageInitializer />
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
      </body>
    </html>
  );
}
