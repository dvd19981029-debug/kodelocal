import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import StorageInitializer from "@/components/StorageInitializer";
import NavigationWrapper from "@/components/NavigationWrapper";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Aromaniak SV - Perfumería Fina & Contratipos de Lujo",
  description: "Tienda online de fragancias y contratipos finos con esencias 100% puras. Envíos a todo El Salvador con C807.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png?v=2026_v2", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=2026_v2", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico?v=2026_v2" },
    ],
    shortcut: "/favicon.ico?v=2026_v2",
    apple: [
      { url: "/apple-touch-icon.png?v=2026_v2", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    google: "NFHSyGtVLfg0Q_J3TbvRmNP4-S9l1zO00afYvcieTPw",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full touch-manipulation ${quicksand.variable}`}>
      <head>
        <meta name="google-site-verification" content="NFHSyGtVLfg0Q_J3TbvRmNP4-S9l1zO00afYvcieTPw" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2026_v2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2026_v2" />
        <link rel="shortcut icon" href="/favicon.ico?v=2026_v2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026_v2" />
      </head>
      <body className={`${quicksand.className} min-h-full flex flex-col bg-[#f1f4f9] text-slate-800 antialiased touch-manipulation font-sans`}>
        <StorageInitializer />
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
      </body>
    </html>
  );
}
