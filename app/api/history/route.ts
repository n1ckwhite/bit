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
  timeoutMs: number,
  retries: number = 2
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        next: { revalidate: 180 }, // Более частое обновление для графиков
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoPriceBot/1.0)',
          'Accept': 'application/json',
        },
      });
      
      if (res.ok) {
        clearTimeout(timeout);
        return res;
      }
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      
      clearTimeout(timeout);
      return res;
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  
  throw new Error('Max retries exceeded');
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
      5000
    );
    
    if (!res.ok) {
      console.warn(`CoinGecko history API returned ${res.status}: ${res.statusText}`);
      return [];
    }
    
    const data: any = await res.json();
    
    if (!data?.prices || !Array.isArray(data.prices)) {
      console.warn('Invalid CoinGecko history response format');
      return [];
    }
    
    const prices = data.prices;
    const volumes = data.total_volumes || [];
    
    return prices.map(([timestamp, price]: [number, number], index: number) => {
      const volume = volumes[index] ? volumes[index][1] : undefined;
      
      return {
        timestamp: Math.floor(timestamp / 1000),
        price: Number(price),
        volume: volume ? Number(volume) : undefined,
      };
    }).filter((point: HistoryPoint) => 
      Number.isFinite(point.price) && 
      point.price > 0 && 
      point.timestamp > 0
    );
  } catch (error) {
    console.warn(`CoinGecko history API error for ${baseId}/${vs}:`, error);
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
  const sourceCount = new Map<number, number>();

  for (const source of sources) {
    for (const point of source) {
      if (!priceMap.has(point.timestamp)) {
        priceMap.set(point.timestamp, []);
        volumeMap.set(point.timestamp, []);
        sourceCount.set(point.timestamp, 0);
      }
      priceMap.get(point.timestamp)!.push(point.price);
      sourceCount.set(point.timestamp, sourceCount.get(point.timestamp)! + 1);
      
      if (point.volume !== undefined && point.volume > 0) {
        volumeMap.get(point.timestamp)!.push(point.volume);
      }
    }
  }

  const result: HistoryPoint[] = [];
  for (const [timestamp, prices] of priceMap.entries()) {
    if (prices.length === 0) continue;

    // Улучшенный алгоритм агрегации цен
    const sortedPrices = [...prices].sort((a, b) => a - b);
    
    // Удаляем выбросы (цены, которые сильно отличаются от медианы)
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const filteredPrices = sortedPrices.filter(price => {
      const deviation = Math.abs(price - median) / median;
      return deviation < 0.5; // Убираем цены, которые отличаются более чем на 50%
    });
    
    // Если после фильтрации осталось мало данных, используем исходные
    const finalPrices = filteredPrices.length >= Math.max(1, prices.length / 2) 
      ? filteredPrices 
      : sortedPrices;
    
    const mid = Math.floor(finalPrices.length / 2);
    const medianPrice = finalPrices.length % 2 === 0
      ? (finalPrices[mid - 1] + finalPrices[mid]) / 2
      : finalPrices[mid];

    const volumes = volumeMap.get(timestamp) || [];
    const avgVolume = volumes.length > 0
      ? volumes.reduce((sum, v) => sum + v, 0) / volumes.length
      : undefined;

    // Дополнительная валидация перед добавлением
    if (Number.isFinite(medianPrice) && medianPrice > 0 && timestamp > 0) {
      result.push({
        timestamp,
        price: medianPrice,
        volume: avgVolume,
      });
    }
  }

  // Финальная фильтрация - убираем дубликаты и некорректные данные
  const finalResult = result
    .filter((point, index, arr) => {
      // Убираем дубликаты по timestamp
      return arr.findIndex(p => p.timestamp === point.timestamp) === index;
    })
    .filter(point => 
      Number.isFinite(point.price) && 
      point.price > 0 && 
      point.timestamp > 0
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  return finalResult;
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
    console.warn(`No historical data available for ${baseParam}/${vs} with interval ${interval}`);
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

  // Фильтруем и валидируем финальные данные
  const filteredData = mergedData.filter(point => 
    Number.isFinite(point.price) && 
    point.price > 0 && 
    point.timestamp > 0
  );

  if (filteredData.length === 0) {
    console.error(`All historical data filtered out for ${baseParam}/${vs}`);
    return new Response(JSON.stringify({ 
      error: "No valid historical data available",
      base: baseParam.toUpperCase(),
      vs,
      interval,
      updatedAt: new Date().toISOString()
    }), {
      status: 502,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  console.log(`Historical data fetched for ${baseParam}/${vs}: ${filteredData.length} points`);

  const body: HistoryResponse = {
    base: baseParam.toUpperCase(),
    vs,
    interval,
    data: filteredData.slice(-limit),
    updatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    headers: { 
      "content-type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=180, s-maxage=180", // Кэширование на 3 минуты
    },
  });
}
