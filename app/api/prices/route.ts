import { NextRequest } from "next/server";

type VsCurrency = string;
type BaseCoinId = string; 

type SourceQuote = {
  source: string;
  price: number; 
  volume?: number; 
};

type PricesResponse = {
  base: string; 
  vs: VsCurrency;
  price: number; 
  sources: SourceQuote[];
  updatedAt: string; 
};

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { 
      signal: controller.signal, 
      next: { revalidate: 30 } 
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

async function getKrakenDirect(vs: VsCurrency): Promise<SourceQuote | null> {
  try {
    const supported = new Set(["GBP", "EUR", "CAD", "AUD"]);
    if (!supported.has(vs)) return null;
    const pair = `XBT${vs}`; 
    const res = await fetchWithTimeout(`https://api.kraken.com/0/public/Ticker?pair=${pair}`, 4000);
    if (!res.ok) return null;
    const data: any = await res.json();
    const result = data?.result;
    const key = result ? Object.keys(result)[0] : undefined;
    const obj = key ? result[key] : undefined;
    const price = Number(obj?.c?.[0]);
    const volume = Number(obj?.v?.[1]); 
    if (!Number.isFinite(price)) return null;
    return { source: `kraken:${vs}`, price, volume: Number.isFinite(volume) ? volume : undefined };
  } catch {
    return null;
  }
}

async function getBitstampDirect(vs: VsCurrency): Promise<SourceQuote | null> {
  try {
    const supported = new Set(["GBP", "EUR", "CAD", "AUD"]);
    if (!supported.has(vs)) return null;
    const symbol = `btc${vs.toLowerCase()}`;
    const res = await fetchWithTimeout(`https://www.bitstamp.net/api/v2/ticker/${symbol}`, 4000);
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = Number(data?.last);
    const volume = Number(data?.volume); 
    if (!Number.isFinite(price)) return null;
    return { source: `bitstamp:${vs}`, price, volume: Number.isFinite(volume) ? volume : undefined };
  } catch {
    return null;
  }
}

async function getCoinbaseDirect(vs: VsCurrency): Promise<SourceQuote | null> {
  try {
    const supported = new Set(["GBP", "EUR", "CAD", "AUD"]);
    if (!supported.has(vs)) return null;
    const product = `BTC-${vs}`;
    const res = await fetchWithTimeout(`https://api.exchange.coinbase.com/products/${product}/ticker`, 4000);
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = Number(data?.price);
    const volume = Number(data?.volume);
    if (!Number.isFinite(price)) return null;
    return { source: `coinbase:${vs}`, price, volume: Number.isFinite(volume) ? volume : undefined };
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

async function getCoinGeckoFor(vs: VsCurrency, base: BaseCoinId): Promise<SourceQuote | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(base)}&vs_currencies=${encodeURIComponent(vs.toLowerCase())}`,
      4000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const raw = data?.[base]?.[vs.toLowerCase()];
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

async function getFxRateAggregated(base: string, target: string): Promise<number | null> {
  if (base === target) return 1;
  target = target.toUpperCase();
  base = base.toUpperCase();

  const providers = await Promise.allSettled([
    (async () => {
      const res = await fetchWithTimeout(
        `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(target)}`,
        4000
      );
      if (!res.ok) return null;
      const data: any = await res.json();
      return Number(data?.rates?.[target]) || null;
    })(),
    (async () => {
      const res = await fetchWithTimeout(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`,
        4000
      );
      if (!res.ok) return null;
      const data: any = await res.json();
      return Number(data?.rates?.[target]) || null;
    })(),
    (async () => {
      const res = await fetchWithTimeout(
        `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
        4000
      );
      if (!res.ok) return null;
      const data: any = await res.json();
      return Number(data?.rates?.[target]) || null;
    })(),
  ]);

  const values: number[] = providers
    .map(p => (p.status === 'fulfilled' ? p.value : null))
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  if (values.length > 0) {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  const STATIC_USD_RATES: Record<string, number> = {
    EUR: 0.92,
    GBP: 0.78,
    CAD: 1.36,
    AUD: 1.54,
    SEK: 10.9,
  };
  if (base === 'USD' && STATIC_USD_RATES[target]) {
    return STATIC_USD_RATES[target];
  }
  return null;
}

function weightedAverage(quotes: SourceQuote[]): number {
  if (quotes.length === 0) return NaN;
  
  const hasVolumes = quotes.some(q => q.volume && q.volume > 0);
  if (!hasVolumes) {
    const prices = quotes.map(q => q.price);
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

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
  const baseParam = (searchParams.get("base") || "bitcoin").toLowerCase();
  const vs = vsParam.toUpperCase();
  const isBitcoin = baseParam === "bitcoin";

  const [binance, kraken, bitstamp, coindesk] = await Promise.all([
    getBinanceUSD(),
    getKrakenUSD(),
    getBitstampUSD(),
    getCoindeskUSD(),
  ]);
  const usdSources = [binance, kraken, bitstamp, coindesk].filter(Boolean) as SourceQuote[];

  const [krakenDirect, bitstampDirect, coinbaseDirect, directVsCoingecko, coingeckoUsd] = await Promise.all([
    isBitcoin ? getKrakenDirect(vs) : Promise.resolve(null),
    isBitcoin ? getBitstampDirect(vs) : Promise.resolve(null),
    isBitcoin ? getCoinbaseDirect(vs) : Promise.resolve(null),
    getCoinGeckoFor(vs, baseParam),
    getCoinGeckoFor("USD", baseParam),
  ]);
  const fxRateToVs = vs === 'USD' ? 1 : await getFxRateAggregated('USD', vs);

  const consolidated: SourceQuote[] = [];
  for (const q of [krakenDirect, bitstampDirect, coinbaseDirect, directVsCoingecko]) {
    if (q) consolidated.push(q);
  }
  if (usdSources.length > 0) {
    for (const s of usdSources) {
      if (vs === "USD") {
        consolidated.push({ source: s.source, price: s.price });
      } else if (fxRateToVs) {
        consolidated.push({ source: `${s.source}->${vs}`, price: s.price * fxRateToVs });
      }
    }
  }
  if (coingeckoUsd && fxRateToVs && vs !== "USD") {
    consolidated.push({ source: `coingecko:USD->${vs}`, price: coingeckoUsd.price * (fxRateToVs as number) });
  }

  if (consolidated.length === 0) {
    if (vs !== 'USD' && fxRateToVs) {
      const fx = fxRateToVs;
      if (usdSources.length > 0) {
        for (const s of usdSources) {
          consolidated.push({ source: `${s.source}->${vs}`, price: s.price * fx });
        }
      }
    }
  }

  let price = weightedAverage(consolidated);
  if (!Number.isFinite(price)) {
    const altDirect = directVsCoingecko?.price || krakenDirect?.price || bitstampDirect?.price || coinbaseDirect?.price;
    const altFx = fxRateToVs
      ? (usdSources[0]?.price ?? coingeckoUsd?.price ?? undefined) * (fxRateToVs as number)
      : undefined;
    price = Number.isFinite(altDirect as number)
      ? (altDirect as number)
      : Number.isFinite(altFx as number)
      ? (altFx as number)
      : 0;
  }
  const body: PricesResponse = {
    base: isBitcoin ? "BTC" : baseParam.toUpperCase(),
    vs,
    price,
    sources: consolidated,
    updatedAt: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}


