import { NextRequest } from "next/server";

type HistoryPoint = {
  timestamp: number; // Unix timestamp in seconds
  price: number;
  volume?: number;
};

type HistoryResponse = {
  base: "BTC";
  vs: string;
  interval: "1m" | "5m" | "1h" | "1d";
  data: HistoryPoint[];
  updatedAt: string;
};

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { 
      signal: controller.signal, 
      next: { revalidate: 300 } // ISR: revalidate every 5 minutes for history
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function getCoinGeckoHistory(vs: string, days: number): Promise<HistoryPoint[]> {
  try {
    const res = await fetchWithTimeout(
      `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${encodeURIComponent(vs)}&days=${days}&interval=${days <= 1 ? "hourly" : "daily"}`,
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

async function getBinanceHistory(vs: string, interval: string, limit: number): Promise<HistoryPoint[]> {
  try {
    const symbol = vs === "USD" ? "BTCUSDT" : `BTC${vs}`;
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

function mergeHistoryData(sources: HistoryPoint[][]): HistoryPoint[] {
  if (sources.length === 0) return [];
  if (sources.length === 1) return sources[0];

  // Create a map of timestamp -> prices
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

  // Calculate median prices and average volumes
  const result: HistoryPoint[] = [];
  for (const [timestamp, prices] of priceMap.entries()) {
    if (prices.length === 0) continue;
    
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sortedPrices.length / 2);
    const medianPrice = sortedPrices.length % 2 === 0 
      ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2 
      : sortedPrices[mid];

    const volumes = volumeMap.get(timestamp) || [];
    const avgVolume = volumes.length > 0 
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

  // Map intervals to API parameters
  const intervalMap: Record<string, { binance: string; days: number }> = {
    "1m": { binance: "1m", days: 1 },
    "5m": { binance: "5m", days: 1 },
    "1h": { binance: "1h", days: 7 },
    "1d": { binance: "1d", days: 365 },
  };

  const config = intervalMap[interval];
  if (!config) {
    return new Response(
      JSON.stringify({ error: "Invalid interval" }),
      { status: 400, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }

  // Fetch from multiple sources
  const [coingeckoData, binanceData] = await Promise.all([
    getCoinGeckoHistory(vs, config.days),
    getBinanceHistory(vs, config.binance, limit),
  ]);

  const mergedData = mergeHistoryData([coingeckoData, binanceData]);

  if (mergedData.length === 0) {
    return new Response(
      JSON.stringify({ error: "No historical data available" }),
      { status: 502, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }

  const body: HistoryResponse = {
    base: "BTC",
    vs,
    interval,
    data: mergedData.slice(-limit), // Take last N points
    updatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
