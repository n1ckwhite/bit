import { NextRequest } from "next/server";

type VsCurrency = string;

type SourceQuote = {
  source: string;
  price: number; // price of 1 BTC in vs currency
  volume?: number; // 24h volume for weighting
};

type PricesResponse = {
  base: "BTC";
  vs: VsCurrency;
  price: number; // consolidated price
  sources: SourceQuote[];
  updatedAt: string; // ISO string
};

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { 
      signal: controller.signal, 
      next: { revalidate: 30 } // ISR: revalidate every 30 seconds
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function getBinanceUSD(): Promise<SourceQuote | null> {
  try {
    const res = await fetchWithTimeout("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", 4000);
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = Number(data.lastPrice);
    const volume = Number(data.volume);
    if (!Number.isFinite(price) || !Number.isFinite(volume)) return null;
    return { source: "binance:USDT", price, volume };
  } catch {
    return null;
  }
}

async function getKrakenUSD(): Promise<SourceQuote | null> {
  try {
    const res = await fetchWithTimeout("https://api.kraken.com/0/public/Ticker?pair=XBTUSD", 4000);
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = Number(data?.result?.XXBTZUSD?.c?.[0]);
    if (!Number.isFinite(price)) return null;
    return { source: "kraken:USD", price };
  } catch {
    return null;
  }
}

async function getBitstampUSD(): Promise<SourceQuote | null> {
  try {
    const res = await fetchWithTimeout("https://www.bitstamp.net/api/v2/ticker/btcusd", 4000);
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = Number(data.last);
    if (!Number.isFinite(price)) return null;
    return { source: "bitstamp:USD", price };
  } catch {
    return null;
  }
}

async function getCoindeskUSD(): Promise<SourceQuote | null> {
  try {
    const res = await fetchWithTimeout("https://api.coindesk.com/v1/bpi/currentprice/USD.json", 4000);
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = Number(data?.bpi?.USD?.rate_float);
    if (!Number.isFinite(price)) return null;
    return { source: "coindesk:USD", price };
  } catch {
    return null;
  }
}

async function getCoinGecko(vs: VsCurrency): Promise<SourceQuote | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${encodeURIComponent(vs)}`,
      4000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const raw = data?.bitcoin?.[vs.toLowerCase()];
    const price = Number(raw);
    if (!Number.isFinite(price)) return null;
    return { source: `coingecko:${vs.toUpperCase()}`, price };
  } catch {
    return null;
  }
}

async function getFxRates(base: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`,
      5000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const rates = data?.rates;
    return rates && typeof rates === "object" ? (rates as Record<string, number>) : null;
  } catch {
    // Try Frankfurter as a backup FX provider
    try {
      const res2 = await fetchWithTimeout(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}`,
        5000
      );
      if (!res2.ok) return null;
      const data2: any = await res2.json();
      const rates2 = data2?.rates;
      return rates2 && typeof rates2 === 'object' ? (rates2 as Record<string, number>) : null;
    } catch {
      // Third fallback: open.er-api.com
      try {
        const res3 = await fetchWithTimeout(
          `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
          5000
        );
        if (!res3.ok) return null;
        const data3: any = await res3.json();
        const rates3 = data3?.rates;
        return rates3 && typeof rates3 === 'object' ? (rates3 as Record<string, number>) : null;
      } catch {
        return null;
      }
    }
  }
}

function weightedAverage(quotes: SourceQuote[]): number {
  if (quotes.length === 0) return NaN;
  
  // If no volumes available, fall back to median
  const hasVolumes = quotes.some(q => q.volume && q.volume > 0);
  if (!hasVolumes) {
    const prices = quotes.map(q => q.price);
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  // Weighted average by volume
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const quote of quotes) {
    const weight = quote.volume || 0;
    if (weight > 0) {
      totalWeight += weight;
      weightedSum += quote.price * weight;
    }
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : NaN;
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const vsParam = searchParams.get("vs") || "USD";
  const vs = vsParam.toUpperCase();

  // First, gather USD quotes from multiple exchanges (robust primary path)
  const [binance, kraken, bitstamp, coindesk] = await Promise.all([
    getBinanceUSD(),
    getKrakenUSD(),
    getBitstampUSD(),
    getCoindeskUSD(),
  ]);
  const usdSources = [binance, kraken, bitstamp, coindesk].filter(Boolean) as SourceQuote[];

  // If vs is not USD, we can try a direct quote via CoinGecko and also convert USD via FX
  const directVs = await getCoinGecko(vs);
  const fxRates = await getFxRates("USD");
  let fxRateToVs: number | null = null;
  if (vs !== "USD" && fxRates && fxRates[vs]) {
    fxRateToVs = fxRates[vs];
  }

  const consolidated: SourceQuote[] = [];
  // USD quotes converted to target vs via FX
  if (usdSources.length > 0) {
    for (const s of usdSources) {
      if (vs === "USD") {
        consolidated.push({ source: s.source, price: s.price });
      } else if (fxRateToVs) {
        consolidated.push({ source: `${s.source}->${vs}`, price: s.price * fxRateToVs });
      }
    }
  }
  // Direct vs quote
  if (directVs) consolidated.push(directVs);

  if (consolidated.length === 0) {
    // Fallback: try compute via USD and FX
    if (vs !== 'USD' && fxRates && fxRates[vs]) {
      const fx = fxRates[vs];
      if (usdSources.length > 0) {
        for (const s of usdSources) {
          consolidated.push({ source: `${s.source}->${vs}`, price: s.price * fx });
        }
      }
    }
  }

  let price = weightedAverage(consolidated);
  if (!Number.isFinite(price)) {
    // Robust fallback to ensure numeric result
    const altDirect = directVs?.price;
    const altFx = fxRateToVs && usdSources[0] ? usdSources[0].price * (fxRateToVs as number) : undefined;
    price = Number.isFinite(altDirect as number)
      ? (altDirect as number)
      : Number.isFinite(altFx as number)
      ? (altFx as number)
      : 0;
  }
  const body: PricesResponse = {
    base: "BTC",
    vs,
    price,
    sources: consolidated,
    updatedAt: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}


