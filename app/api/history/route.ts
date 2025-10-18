import { NextRequest } from "next/server";

type HistoryPoint = {
  timestamp: number;
  price: number;
  volume?: number;
};

type HistoryResponse = {
  base: string;
  vs: string;
  interval: "1m" | "5m" | "1h" | "1d";
  data: HistoryPoint[];
  updatedAt: string;
};

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function getCoinGeckoHistory(
  vs: string,
  days: number,
  baseId: string = "bitcoin"
): Promise<HistoryPoint[]> {
  try {
    const res = await fetchWithTimeout(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
        baseId
      )}/market_chart?vs_currency=${encodeURIComponent(
        vs.toLowerCase()
      )}&days=${days}&interval=${days <= 1 ? "hourly" : "daily"}`,
      8000
    );
    if (!res.ok) return [];
    const data: any = await res.json();
    const prices = data?.prices || [];
    return prices.map(([timestamp, price]: [number, number]) => ({
      timestamp: Math.floor(timestamp / 1000),
      price: Number(price),
    }));
  } catch {
    return [];
  }
}

async function getCoindeskUsdHistory(days: number): Promise<HistoryPoint[]> {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const url = `https://api.coindesk.com/v1/bpi/historical/close.json?currency=USD&start=${fmt(
      start
    )}&end=${fmt(end)}`;
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) return [];
    const data: any = await res.json();
    const bpi = data?.bpi || {};
    return Object.entries(bpi).map(([date, price]: any) => ({
      timestamp: Math.floor(new Date(date).getTime() / 1000),
      price: Number(price),
    }));
  } catch {
    return [];
  }
}

async function getBinanceHistory(
  baseId: string,
  vs: string,
  interval: string,
  limit: number
): Promise<HistoryPoint[]> {
  try {
    // symbol: if baseId is bitcoin use BTCUSDT/BTC{vs} else try {BASE}{vs} where BASE is uppercase symbol
    const baseSymbolMap: Record<string, string> = {
      bitcoin: "BTC",
      ethereum: "ETH",
      binancecoin: "BNB",
      solana: "SOL",
      litecoin: "LTC",
      cardano: "ADA",
      dogecoin: "DOGE",
      polygon: "MATIC",
      chainlink: "LINK",
      ordinals: "ORDI",
    };
    const baseSym = baseSymbolMap[baseId] || baseId.toUpperCase();
    const symbol = vs === "USD" ? `${baseSym}USDT` : `${baseSym}${vs}`;
    const res = await fetchWithTimeout(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      6000
    );
    if (!res.ok) return [];
    const data: any = await res.json();
    return data.map(([openTime, open, high, low, close, volume]: any[]) => ({
      timestamp: Math.floor(openTime / 1000),
      price: Number(close),
      volume: Number(volume),
    }));
  } catch {
    return [];
  }
}

async function getBinanceUsdHistory(
  interval: string,
  limit: number
): Promise<HistoryPoint[]> {
  try {
    const res = await fetchWithTimeout(
      `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`,
      6000
    );
    if (!res.ok) return [];
    const data: any = await res.json();
    return data.map(([openTime, open, high, low, close, volume]: any[]) => ({
      timestamp: Math.floor(openTime / 1000),
      price: Number(close),
      volume: Number(volume),
    }));
  } catch {
    return [];
  }
}

async function getFxRate(base: string, target: string): Promise<number | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`,
      5000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const rate = data?.rates?.[target];
    return typeof rate === "number" && Number.isFinite(rate) ? rate : null;
  } catch {
    return null;
  }
}

function mergeHistoryData(sources: HistoryPoint[][]): HistoryPoint[] {
  if (sources.length === 0) return [];
  if (sources.length === 1) return sources[0];

  const priceMap = new Map<number, number[]>();
  const volumeMap = new Map<number, number[]>();

  for (const source of sources) {
    for (const point of source) {
      if (!priceMap.has(point.timestamp)) {
        priceMap.set(point.timestamp, []);
        volumeMap.set(point.timestamp, []);
      }
      priceMap.get(point.timestamp)!.push(point.price);
      if (point.volume !== undefined) {
        volumeMap.get(point.timestamp)!.push(point.volume);
      }
    }
  }

  const result: HistoryPoint[] = [];
  for (const [timestamp, prices] of priceMap.entries()) {
    if (prices.length === 0) continue;

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sortedPrices.length / 2);
    const medianPrice =
      sortedPrices.length % 2 === 0
        ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2
        : sortedPrices[mid];

    const volumes = volumeMap.get(timestamp) || [];
    const avgVolume =
      volumes.length > 0
        ? volumes.reduce((sum, v) => sum + v, 0) / volumes.length
        : undefined;

    result.push({
      timestamp,
      price: medianPrice,
      volume: avgVolume,
    });
  }

  return result.sort((a, b) => a.timestamp - b.timestamp);
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const vsParam = searchParams.get("vs") || "USD";
  const intervalParam = searchParams.get("interval") || "1h";
  const limitParam = searchParams.get("limit") || "24";

  const vs = vsParam.toUpperCase();
  const interval = intervalParam as "1m" | "5m" | "1h" | "1d";
  const limit = Math.min(Number(limitParam) || 24, 1000);

  const intervalMap: Record<string, { binance: string; days: number }> = {
    "1m": { binance: "1m", days: 1 },
    "5m": { binance: "5m", days: 1 },
    "1h": { binance: "1h", days: 7 },
    "1d": { binance: "1d", days: 365 },
  };

  const config = intervalMap[interval];
  if (!config) {
    return new Response(JSON.stringify({ error: "Invalid interval" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const baseParam = (searchParams.get("base") || "bitcoin").toLowerCase();

  let [coingeckoData, binanceData] = await Promise.all([
    getCoinGeckoHistory(vs, config.days, baseParam),
    getBinanceHistory(baseParam, vs, config.binance, limit),
  ]);

  if (coingeckoData.length === 0 && vs !== "USD") {
    const [usdHistory, fx] = await Promise.all([
      getCoinGeckoHistory("USD", config.days, baseParam),
      getFxRate("USD", vs),
    ]);
    if (usdHistory.length > 0 && fx) {
      coingeckoData = usdHistory.map((p) => ({
        timestamp: p.timestamp,
        price: p.price * fx,
        volume: p.volume,
      }));
    }
  }

  if (coingeckoData.length === 0 && binanceData.length === 0 && vs !== "USD") {
    const [usdCandles, altFxRates] = await Promise.all([
      config.days > 1
        ? getCoindeskUsdHistory(config.days)
        : getBinanceUsdHistory(config.binance, limit),
      getFxRate("USD", vs),
    ]);
    if (usdCandles.length > 0 && altFxRates) {
      coingeckoData = usdCandles.map((p) => ({
        timestamp: p.timestamp,
        price: p.price * altFxRates,
        volume: p.volume,
      }));
    }
  }

  let mergedData = mergeHistoryData([coingeckoData, binanceData]);

  if (mergedData.length === 0) {
    if (coingeckoData.length > 0) {
      mergedData = coingeckoData;
    } else if (binanceData.length > 0) {
      mergedData = binanceData;
    } else if (vs !== "USD") {
      const [usdCandles, fx] = await Promise.all([
        config.days > 1
          ? getCoindeskUsdHistory(config.days)
          : getBinanceUsdHistory(config.binance, limit),
        getFxRate("USD", vs),
      ]);
      if (usdCandles.length > 0 && fx) {
        mergedData = usdCandles.map((p) => ({
          timestamp: p.timestamp,
          price: p.price * fx,
          volume: p.volume,
        }));
      }
    }
  }

  if (mergedData.length === 0) {
    const empty: HistoryResponse = {
      base: baseParam.toUpperCase(),
      vs,
      interval,
      data: [],
      updatedAt: new Date().toISOString(),
    };
    return new Response(JSON.stringify(empty), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const body: HistoryResponse = {
    base: baseParam.toUpperCase(),
    vs,
    interval,
    data: mergedData.slice(-limit),
    updatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
