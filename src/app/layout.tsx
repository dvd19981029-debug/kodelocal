import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import StorageInitializer from "@/components/StorageInitializer";
import NavigationWrapper from "@/components/NavigationWrapper";
import MarketingScripts from "@/components/analytics/MarketingScripts";
import { Analytics } from "@vercel/analytics/next";


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
  themeColor: "#f1f4f9",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://aromaniaksv.com"),
  title: {
    default: "Aromaniak SV | Esencias y Fragancias de Perfumería Fina en El Salvador",
    template: "%s | Aromaniak SV",
  },
  description: "Tienda y distribuidora líder de esencias puras y fragancias de perfumería fina en El Salvador. Más de 110 aromas AAA+ sin diluir, botes de vidrio y materias primas. Envíos a todo El Salvador o retiro en San Salvador.",
  keywords: [
    "esencias y fragancias",
    "esencias y fragancias el salvador",
    "esencias y fragancias san salvador",
    "venta de esencias y fragancias el salvador",
    "distribuidora de esencias y fragancias",
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
    "fijadores de perfumeria el salvador",
    "fijador para perfumes el salvador",
    "dipropilenglicol el salvador",
    "dipropilenglicol para perfumes",
    "dpg perfumeria el salvador",
    "galaxolide 50% dep el salvador",
    "galaxolide fijador de perfume",
    "almizcle fijador para perfumes",
    "solvente para perfumeria el salvador",
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
    siteName: "Aromaniak SV - Esencias y Fragancias en El Salvador",
    title: "Aromaniak SV | Esencias y Fragancias de Perfumería Fina en El Salvador",
    description: "Distribuidora líder de esencias puras y fragancias finas AAA+ en El Salvador. Más de 110 aromas, botes de vidrio y materias primas con envíos a todo el país.",
    images: [
      {
        url: "/images/og-default.jpg?v=normal2026",
        width: 1200,
        height: 630,
        alt: "Aromaniak SV - Esencias y Fragancias de Perfumería Fina en El Salvador",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aromaniak SV | Esencias y Fragancias de Perfumería Fina en El Salvador",
    description: "Distribuidora líder de esencias puras y fragancias finas AAA+ en El Salvador. Más de 110 aromas, botes de vidrio y materias primas con envíos a todo el país.",
    images: ["/images/og-default.jpg?v=normal2026"],
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
    "geo.placename": "Centro Comercial El Rosal, Calle El Progreso, San Salvador, El Salvador",
    "geo.position": "13.6967763;-89.2208348",
    "ICBM": "13.6967763, -89.2208348",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full w-full max-w-full overflow-x-clip touch-manipulation ${quicksand.variable}`}>
      <head>
        <meta name="theme-color" content="#f1f4f9" />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Store",
                  "@id": "https://aromaniaksv.com/#store",
                  "name": "Aromaniak SV — Esencias y Fragancias en El Salvador",
                  "alternateName": ["Aromaniak", "Aromaniak El Salvador", "Esencias y Fragancias Aromaniak"],
                  "url": "https://aromaniaksv.com",
                  "logo": "https://aromaniaksv.com/images/logo.png",
                  "image": "https://aromaniaksv.com/images/og-default.jpg?v=normal2026",
                  "description": "Distribuidora y tienda en línea de esencias puras y fragancias de perfumería fina AAA+, botes de vidrio y materias primas en El Salvador.",
                  "telephone": "+50360437496",
                  "priceRange": "$",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Centro Comercial El Rosal, Calle El Progreso",
                    "addressLocality": "San Salvador",
                    "addressRegion": "San Salvador",
                    "addressCountry": "SV"
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 13.6967763,
                    "longitude": -89.2208348
                  },
                  "areaServed": {
                    "@type": "Country",
                    "name": "El Salvador"
                  },
                  "openingHoursSpecification": [
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                      "opens": "09:00",
                      "closes": "18:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": "Saturday",
                      "opens": "09:00",
                      "closes": "13:00"
                    }
                  ],
                  "sameAs": [
                    "https://www.instagram.com/aromaniaksv/",
                    "https://www.facebook.com/aromaniaksv"
                  ]
                },
                {
                  "@type": "WebSite",
                  "@id": "https://aromaniaksv.com/#website",
                  "url": "https://aromaniaksv.com",
                  "name": "Aromaniak SV — Esencias y Fragancias en El Salvador",
                  "inLanguage": "es-SV",
                  "publisher": { "@id": "https://aromaniaksv.com/#store" }
                }
              ]
            }),
          }}
        />
      </head>
      <body className={`${quicksand.className} min-h-full flex flex-col bg-[#f1f4f9] text-slate-800 antialiased touch-manipulation font-sans w-full max-w-full overflow-x-clip`}>
        <MarketingScripts />
        <StorageInitializer />
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
        <Analytics />
      </body>

    </html>
  );
}
