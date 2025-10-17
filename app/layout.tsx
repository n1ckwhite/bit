import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Курс Биткоина · Конвертер",
  description: "Онлайн‑конвертер BTC ↔ фиат. Котировки c бирж, обновление каждые 60 секунд.",
  keywords: "биткоин, курс биткоина, конвертер биткоин, BTC, криптовалюта, обменник, курс валют, сатоши, mBTC, µBTC",
  authors: [{ name: "Bitcoin Price Converter" }],
  creator: "Bitcoin Price Converter",
  publisher: "Bitcoin Price Converter",
  robots: "index, follow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BTC Конвертер",
  },
  openGraph: {
    title: "Курс Биткоина — быстрый конвертер",
    description: "BTC ↔ фиат. Источники: Binance, Kraken, Bitstamp, CoinGecko. Обновление раз в минуту.",
    type: "website",
    locale: "ru_RU",
    siteName: "Курс Биткоина",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Курс Биткоина - Конвертер",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Курс Биткоина — быстрый конвертер",
    description: "BTC ↔ фиат. Источники: Binance, Kraken, Bitstamp, CoinGecko. Обновление раз в минуту.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://bitcoin-price-converter.com",
  },
};

export const viewport = {
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning className="bg-white dark:bg-slate-900">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'light';
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Курс Биткоина - Конвертер",
              "description": "Онлайн‑конвертер BTC ↔ фиат. Котировки c бирж, обновление каждые 60 секунд.",
              "url": "https://bitcoin-price-converter.com",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "Bitcoin Price Converter"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Bitcoin Price Converter"
              },
              "datePublished": "2024-01-01",
              "dateModified": new Date().toISOString().split('T')[0],
              "inLanguage": "ru",
              "isAccessibleForFree": true,
              "keywords": "биткоин, курс биткоина, конвертер биткоин, BTC, криптовалюта, обменник, курс валют, сатоши, mBTC, µBTC"
            })
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}