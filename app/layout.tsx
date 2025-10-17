import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./contexts/I18nContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bitcoin-price-converter.com"),
  title: {
    default: "Prexo",
    template: "%s · Prexo",
  },
  description:
    "Prexo — multi‑language crypto converter and live charts. BTC ↔ fiat with minute updates.",
  keywords:
    "биткоин, курс, конвертер биткоин, BTC, криптовалюта, обменник, курс валют, сатоши, mBTC, µBTC",
  authors: [{ name: "Prexo" }],
  creator: "Prexo",
  publisher: "Prexo",
  robots: "index, follow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prexo",
  },
  openGraph: {
    title: "Prexo — fast crypto converter",
    description:
      "BTC ↔ fiat. Sources: Binance, Kraken, Bitstamp, CoinGecko. Updated every minute.",
    type: "website",
    locale: "en_US",
    siteName: "Prexo",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Курс - Конвертер",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prexo — fast crypto converter",
    description: "BTC ↔ fiat with live quotes.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://bitcoin-price-converter.com",
    languages: {
      en: "/?lang=en",
      ru: "/?lang=ru",
      de: "/?lang=de",
      fr: "/?lang=fr",
      es: "/?lang=es",
      tr: "/?lang=tr",
      zh: "/?lang=zh",
      it: "/?lang=it",
      pl: "/?lang=pl",
      cs: "/?lang=cs",
      nl: "/?lang=nl",
      pt: "/?lang=pt",
      ja: "/?lang=ja",
    },
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
    <html
      lang='ru'
      suppressHydrationWarning
      className='bg-white dark:bg-slate-900'
    >
      <head>
        {/* Preconnect hints for performance optimization - only for actually used resources */}
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />

        {/* DNS prefetch for local resources */}
        <link rel='dns-prefetch' href='//localhost' />

        {/* Preload critical fonts */}
        <link
          rel='preload'
          href='https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap'
          as='style'
        />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap'
        />

        {/* Critical CSS inlined for faster rendering */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* Critical CSS for above-the-fold content */
            body{margin:0;font-family:var(--font-geist-sans),system-ui,-apple-system,sans-serif;background:#fff}
            .dark body{background:#0f172a}
            .antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
            /* Prevent layout shift */
            .min-h-screen{min-height:100vh}
            .container{margin:0 auto;padding:0 1rem}
            @media (min-width:640px){.container{padding:0 1.5rem}}
            @media (min-width:1024px){.container{padding:0 2rem}}
            /* Optimize rendering */
            *{box-sizing:border-box}
            img{max-width:100%;height:auto}
            /* Reduce paint complexity */
            .backdrop-blur-sm{backdrop-filter:blur(4px)}
            .shadow-xl{box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04)}
          `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Prexo",
              description: "Prexo — BTC ↔ fiat converter with live quotes.",
              url: "https://bitcoin-price-converter.com",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "Prexo",
              },
              publisher: {
                "@type": "Organization",
                name: "Prexo",
              },
              datePublished: "2024-01-01",
              dateModified: new Date().toISOString().split("T")[0],
              inLanguage: "ru",
              isAccessibleForFree: true,
              keywords:
                "биткоин, курс, конвертер биткоин, BTC, криптовалюта, обменник, курс валют, сатоши, mBTC, µBTC",
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
        role='document'
      >
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
