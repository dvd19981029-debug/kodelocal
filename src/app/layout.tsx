import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import StorageInitializer from "@/components/StorageInitializer";
import NavigationWrapper from "@/components/NavigationWrapper";
import MarketingScripts from "@/components/analytics/MarketingScripts";


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
  themeColor: "#4338ca",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://aromaniaksv.com"),
  title: {
    default: "Aromaniak SV | Distribuidora de Esencias Perfumería Fina en El Salvador",
    template: "%s | Aromaniak SV",
  },
  description: "Distribuidora de esencias de perfumería fina, aromas químicos, aromas de esencias, botes de vidrio y materias primas en El Salvador. Entregas a domicilio a todo El Salvador o retiro en local.",
  keywords: [
    "distribuidora de esencias perfumeria fina",
    "esencias de perfumeria fina el salvador",
    "venta de esencias el salvador",
    "contratipos de perfumes el salvador",
    "esencias por mayoreo el salvador",
    "perfumes por mayoreo el salvador",
    "aromas quimicos el salvador",
    "aromas de esencias el salvador",
    "esencias para perfume san salvador",
    "botes de vidrio para perfume el salvador",
    "frascos de vidrio con atomizador",
    "envases para perfume el salvador",
    "atomizadores de perfume el salvador",
    "insumos para elaboracion de perfumeria",
    "materias primas para perfumes el salvador",
    "alcohol de perfumeria el salvador",
    "fijador de perfume el salvador",
    "venta de esencias por onza",
    "distribuidora de esencias el salvador",
    "proveedores de esencias de perfume el salvador",
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
    siteName: "Aromaniak SV - Distribuidora de Esencias",
    title: "Aromaniak SV | Distribuidora de Esencias Perfumería Fina en El Salvador",
    description: "Distribuidora de esencias de perfumería fina, aromas químicos, botes de vidrio y materias primas en El Salvador. Entregas a domicilio a todo El Salvador o retiro en local.",
    images: [
      {
        url: "/images/logo.png",
        width: 800,
        height: 800,
        alt: "Aromaniak SV - Distribuidora de Esencias Perfumería Fina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aromaniak SV | Distribuidora de Esencias Perfumería Fina en El Salvador",
    description: "Distribuidora de esencias de perfumería fina, aromas químicos, botes de vidrio y materias primas en El Salvador. Entregas a domicilio a todo El Salvador o retiro en local.",
    images: ["/images/logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aromaniak SV",
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
      { url: "/favicon-48x48.png?v=4", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png?v=4", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192x192.png?v=4", sizes: "192x192", type: "image/png" },
      { url: "/favicon-32x32.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=4", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico?v=4" },
    ],
    shortcut: "/favicon.ico?v=4",
    apple: [
      { url: "/apple-touch-icon.png?v=4", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    google: "NFHSyGtVLfg0Q_J3TbvRmNP4-S9l1zO00afYvcieTPw",
  },
  other: {
    "geo.region": "SV-SS",
    "geo.placename": "San Salvador, El Salvador",
    "geo.position": "13.6929;-89.2182",
    "ICBM": "13.6929, -89.2182",
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
        <meta name="theme-color" content="#4338ca" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#4338ca" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#4338ca" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-navbutton-color" content="#4338ca" />
        <meta name="google-site-verification" content="NFHSyGtVLfg0Q_J3TbvRmNP4-S9l1zO00afYvcieTPw" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png?v=4" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png?v=4" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png?v=4" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=4" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=4" />
        <link rel="shortcut icon" href="/favicon.ico?v=4" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=4" />
        <link rel="https://api.w.org/" href="https://aromaniaksv.com/wp-json/" />
        <link rel="alternate" type="application/json" href="https://aromaniaksv.com/wp-json/" />
      </head>
      <body className={`${quicksand.className} min-h-full flex flex-col bg-[#f1f4f9] text-slate-800 antialiased touch-manipulation font-sans`}>
        <MarketingScripts />
        <StorageInitializer />
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
      </body>

    </html>
  );
}
