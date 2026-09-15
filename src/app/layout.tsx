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
  metadataBase: new URL("https://aromaniaksv.com"),
  title: {
    default: "Aromaniak SV | Esencias de Perfumería Fina & Contratipos en El Salvador",
    template: "%s | Aromaniak SV",
  },
  description: "Proveedor líder en El Salvador de esencias 100% puras para perfumería fina, contratipos de lujo y materias primas. Venta por onza y al mayoreo con envíos a todo el país con C807 Express.",
  keywords: [
    "esencias de perfumeria fina el salvador",
    "esencias para perfume san salvador",
    "contratipos de perfumes el salvador",
    "venta de esencias por onza",
    "proveedores de esencias de perfume el salvador",
    "perfumeria fina el salvador",
    "aromas creativos alternativa",
    "ic del caribe fragancias alternativa",
    "insumos para perfumes el salvador",
    "envases y atomizadores para perfume el salvador",
    "alcohol de perfumeria el salvador",
    "fijador de perfume el salvador",
    "arma tu perfume el salvador",
  ],
  authors: [{ name: "Aromaniak SV", url: "https://aromaniaksv.com" }],
  creator: "Aromaniak SV",
  publisher: "Aromaniak SV",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://aromaniaksv.com",
  },
  openGraph: {
    type: "website",
    locale: "es_SV",
    url: "https://aromaniaksv.com",
    siteName: "Aromaniak SV - Perfumería Fina",
    title: "Aromaniak SV | Esencias de Perfumería Fina & Contratipos en El Salvador",
    description: "Proveedor líder en El Salvador de esencias 100% puras para perfumería fina, contratipos de lujo y materia prima. Venta por onza y al mayoreo. Envíos a los 14 departamentos.",
    images: [
      {
        url: "/images/logo.png",
        width: 800,
        height: 800,
        alt: "Aromaniak SV - Esencias de Perfumería Fina El Salvador",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aromaniak SV | Esencias de Perfumería Fina & Contratipos en El Salvador",
    description: "Esencias 100% puras, contratipos de lujo y materia prima para perfumería en El Salvador.",
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
