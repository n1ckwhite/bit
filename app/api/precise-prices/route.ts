import { NextRequest } from "next/server";
import { getCryptoById } from "../../lib/crypto";

type PrecisePriceQuote = {
  source: string;
  price: number;
  volume?: number;
  confidence: number;
  latency: number;
  lastUpdate: string;
};

type PrecisePricesResponse = {
  base: string;
  vs: string;
  price: number;
  confidence: number;
  sources: PrecisePriceQuote[];
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
  volatility: number;
  updatedAt: string;
};

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<{ response: Response; latency: number }> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoPriceBot/1.0)',
        'Accept': 'application/json',
      },
    });
    
    const latency = Date.now() - start;
    clearTimeout(timeout);
    return { response, latency };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function getPreciseBinancePrice(
  baseId: string,
  vs: string = "USD"
): Promise<PrecisePriceQuote | null> {
  try {
    const baseSym = getCryptoById(baseId)?.symbol || baseId.toUpperCase();
    const symbol = vs === "USD" ? `${baseSym}USDT` : `${baseSym}${vs}`;
    
    const { response, latency } = await fetchWithTimeout(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`,
      2000
    );
    
    if (!response.ok) return null;
    
    const data: any = await response.json();
    const price = Number(data.lastPrice);
    const volume = Number(data.volume);
    const high24h = Number(data.highPrice);
    const low24h = Number(data.lowPrice);
    
    if (!Number.isFinite(price) || price <= 0) return null;
    
    // Вычисляем уверенность на основе объема и волатильности
    const volatility = high24h > 0 && low24h > 0 ? (high24h - low24h) / low24h : 0;
    const volumeConfidence = Math.min(1, Math.log(1 + volume) / 20); // Логарифмическая шкала объема
    const volatilityConfidence = Math.max(0, 1 - volatility); // Меньше волатильности = больше уверенности
    const latencyConfidence = Math.max(0, 1 - latency / 2000); // Меньше задержки = больше уверенности
    
    const confidence = (volumeConfidence + volatilityConfidence + latencyConfidence) / 3;
    
    return {
      source: `binance:${symbol}`,
      price,
      volume: Number.isFinite(volume) && volume > 0 ? volume : undefined,
      confidence: Math.round(confidence * 100) / 100,
      latency,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`Binance precise price error for ${baseId}/${vs}:`, error);
    return null;
  }
}

async function getPreciseKrakenPrice(): Promise<PrecisePriceQuote | null> {
  try {
    const { response, latency } = await fetchWithTimeout(
      "https://api.kraken.com/0/public/Ticker?pair=XBTUSD",
      2000
    );
    
    if (!response.ok) return null;
    
    const data: any = await response.json();
    const price = Number(data?.result?.XXBTZUSD?.c?.[0]);
    const volume = Number(data?.result?.XXBTZUSD?.v?.[1]);
    const high24h = Number(data?.result?.XXBTZUSD?.h?.[1]);
    const low24h = Number(data?.result?.XXBTZUSD?.l?.[1]);
    
    if (!Number.isFinite(price) || price <= 0) return null;
    
    const volatility = high24h > 0 && low24h > 0 ? (high24h - low24h) / low24h : 0;
    const volumeConfidence = Math.min(1, Math.log(1 + volume) / 20);
    const volatilityConfidence = Math.max(0, 1 - volatility);
    const latencyConfidence = Math.max(0, 1 - latency / 2000);
    
    const confidence = (volumeConfidence + volatilityConfidence + latencyConfidence) / 3;
    
    return {
      source: "kraken:USD",
      price,
      volume: Number.isFinite(volume) && volume > 0 ? volume : undefined,
      confidence: Math.round(confidence * 100) / 100,
      latency,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Kraken precise price error:', error);
    return null;
  }
}

function calculatePrecisePrice(quotes: PrecisePriceQuote[]): {
  price: number;
  confidence: number;
  priceRange: { min: number; max: number; median: number };
  volatility: number;
} {
  if (quotes.length === 0) {
    return {
      price: 0,
      confidence: 0,
      priceRange: { min: 0, max: 0, median: 0 },
      volatility: 0,
    };
  }

  // Сортируем по уверенности
  const sortedQuotes = [...quotes].sort((a, b) => b.confidence - a.confidence);
  
  // Взвешенное среднее с учетом уверенности
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const quote of sortedQuotes) {
    const weight = quote.confidence;
    totalWeight += weight;
    weightedSum += quote.price * weight;
  }
  
  const price = totalWeight > 0 ? weightedSum / totalWeight : sortedQuotes[0].price;
  
  // Вычисляем диапазон цен
  const prices = sortedQuotes.map(q => q.price).sort((a, b) => a - b);
  const min = prices[0];
  const max = prices[prices.length - 1];
  const median = prices.length % 2 === 0
    ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
    : prices[Math.floor(prices.length / 2)];
  
  // Вычисляем волатильность
  const volatility = max > 0 ? (max - min) / min : 0;
  
  // Общая уверенность
  const avgConfidence = sortedQuotes.reduce((sum, q) => sum + q.confidence, 0) / sortedQuotes.length;
  
  return {
    price: Math.round(price * 100) / 100,
    confidence: Math.round(avgConfidence * 100) / 100,
    priceRange: {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      median: Math.round(median * 100) / 100,
    },
    volatility: Math.round(volatility * 10000) / 100, // В процентах
  };
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const vsParam = searchParams.get("vs") || "USD";
  const baseParam = (searchParams.get("base") || "bitcoin").toLowerCase();
  const vs = vsParam.toUpperCase();

  try {
    // Получаем точные данные из всех источников
    const [binanceQuote, krakenQuote] = await Promise.all([
      getPreciseBinancePrice(baseParam, vs),
      getPreciseKrakenPrice(),
    ]);

    const quotes = [binanceQuote, krakenQuote].filter((quote): quote is PrecisePriceQuote => quote !== null);

    if (quotes.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No precise price data available",
        base: baseParam.toUpperCase(),
        vs,
        updatedAt: new Date().toISOString()
      }), {
        status: 502,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const preciseData = calculatePrecisePrice(quotes);

    const body: PrecisePricesResponse = {
      base: baseParam.toUpperCase(),
      vs,
      price: preciseData.price,
      confidence: preciseData.confidence,
      sources: quotes,
      priceRange: preciseData.priceRange,
      volatility: preciseData.volatility,
      updatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(body), {
      headers: { 
        "content-type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=10, s-maxage=10", // Очень короткое кэширование для точности
      },
    });
  } catch (error) {
    console.error('Precise prices API error:', error);
    
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      base: baseParam.toUpperCase(),
      vs,
      updatedAt: new Date().toISOString()
    }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
