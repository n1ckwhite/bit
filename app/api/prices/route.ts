import { NextRequest } from "next/server";
import { getCryptoById } from "../../lib/crypto";

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
        next: { revalidate: 15 }, // Более частое обновление для точности
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoPriceBot/1.0)',
          'Accept': 'application/json',
        },
      });
      
      if (res.ok) {
        clearTimeout(timeout);
        return res;
      }
      
      // Если статус не OK, попробуем еще раз
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
      // Экспоненциальная задержка между попытками
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  
  throw new Error('Max retries exceeded');
}

async function getBinanceUSD(
  baseId: string,
  vs: string = "USD"
): Promise<SourceQuote | null> {
  try {
    const baseSym = getCryptoById(baseId)?.symbol || baseId.toUpperCase();
    const symbol = vs === "USD" ? `${baseSym}USDT` : `${baseSym}${vs}`;
    const res = await fetchWithTimeout(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(
        symbol
      )}`,
      3000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    
    // Валидация данных
    if (!data || typeof data !== 'object') return null;
    
    const price = Number(data.lastPrice);
    const volume = Number(data.volume);
    const high24h = Number(data.highPrice);
    const low24h = Number(data.lowPrice);
    
    // Проверка на разумность цены
    if (!Number.isFinite(price) || price <= 0) return null;
    if (Number.isFinite(high24h) && Number.isFinite(low24h) && high24h < low24h) return null;
    if (Number.isFinite(high24h) && price > high24h * 1.1) return null; // Цена не может быть сильно выше максимума
    if (Number.isFinite(low24h) && price < low24h * 0.9) return null; // Цена не может быть сильно ниже минимума
    
    return {
      source: `binance:${symbol}`,
      price,
      volume: Number.isFinite(volume) && volume > 0 ? volume : undefined,
    };
  } catch (error) {
    console.warn(`Binance API error for ${baseId}/${vs}:`, error);
    return null;
  }
}

async function getKrakenUSD(): Promise<SourceQuote | null> {
  try {
    const res = await fetchWithTimeout(
      "https://api.kraken.com/0/public/Ticker?pair=XBTUSD",
      3000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    
    // Валидация структуры данных Kraken
    if (!data?.result?.XXBTZUSD?.c?.[0]) return null;
    
    const price = Number(data.result.XXBTZUSD.c[0]);
    const volume = Number(data.result.XXBTZUSD.v[1]); // 24h volume
    const high24h = Number(data.result.XXBTZUSD.h[1]); // 24h high
    const low24h = Number(data.result.XXBTZUSD.l[1]); // 24h low
    
    // Проверка на разумность цены
    if (!Number.isFinite(price) || price <= 0) return null;
    if (Number.isFinite(high24h) && Number.isFinite(low24h) && high24h < low24h) return null;
    if (Number.isFinite(high24h) && price > high24h * 1.1) return null;
    if (Number.isFinite(low24h) && price < low24h * 0.9) return null;
    
    return { 
      source: "kraken:USD", 
      price,
      volume: Number.isFinite(volume) && volume > 0 ? volume : undefined
    };
  } catch (error) {
    console.warn('Kraken API error:', error);
    return null;
  }
}

async function getKrakenDirect(vs: VsCurrency): Promise<SourceQuote | null> {
  try {
    const supported = new Set(["GBP", "EUR", "CAD", "AUD"]);
    if (!supported.has(vs)) return null;
    const pair = `XBT${vs}`;
    const res = await fetchWithTimeout(
      `https://api.kraken.com/0/public/Ticker?pair=${pair}`,
      4000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const result = data?.result;
    const key = result ? Object.keys(result)[0] : undefined;
    const obj = key ? result[key] : undefined;
    const price = Number(obj?.c?.[0]);
    const volume = Number(obj?.v?.[1]);
    if (!Number.isFinite(price)) return null;
    return {
      source: `kraken:${vs}`,
      price,
      volume: Number.isFinite(volume) ? volume : undefined,
    };
  } catch {
    return null;
  }
}

async function getBitstampDirect(vs: VsCurrency): Promise<SourceQuote | null> {
  try {
    const supported = new Set(["GBP", "EUR", "CAD", "AUD"]);
    if (!supported.has(vs)) return null;
    const symbol = `btc${vs.toLowerCase()}`;
    const res = await fetchWithTimeout(
      `https://www.bitstamp.net/api/v2/ticker/${symbol}`,
      4000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = Number(data?.last);
    const volume = Number(data?.volume);
    if (!Number.isFinite(price)) return null;
    return {
      source: `bitstamp:${vs}`,
      price,
      volume: Number.isFinite(volume) ? volume : undefined,
    };
  } catch {
    return null;
  }
}

async function getCoinbaseDirect(vs: VsCurrency): Promise<SourceQuote | null> {
  try {
    const supported = new Set(["GBP", "EUR", "CAD", "AUD"]);
    if (!supported.has(vs)) return null;
    const product = `BTC-${vs}`;
    const res = await fetchWithTimeout(
      `https://api.exchange.coinbase.com/products/${product}/ticker`,
      4000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = Number(data?.price);
    const volume = Number(data?.volume);
    if (!Number.isFinite(price)) return null;
    return {
      source: `coinbase:${vs}`,
      price,
      volume: Number.isFinite(volume) ? volume : undefined,
    };
  } catch {
    return null;
  }
}

async function getBitstampUSD(
  baseId: string,
  vs: string = "USD"
): Promise<SourceQuote | null> {
  try {
    const baseSym = getCryptoById(baseId)?.symbol || baseId.toUpperCase();
    const pair = `${baseSym.toUpperCase()}${vs.toUpperCase()}`;
    const symbolPath = `${baseSym.toLowerCase()}${vs.toLowerCase()}`;
    const res = await fetchWithTimeout(
      `https://www.bitstamp.net/api/v2/ticker/${encodeURIComponent(
        symbolPath
      )}`,
      4000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = Number(data.last);
    if (!Number.isFinite(price)) return null;
    return { source: `bitstamp:${pair}`, price };
  } catch {
    return null;
  }
}

async function getCoindeskUSD(): Promise<SourceQuote | null> {
  try {
    const res = await fetchWithTimeout(
      "https://api.coindesk.com/v1/bpi/currentprice/USD.json",
      3000
    );
    if (!res.ok) {
      console.warn(`CoinDesk API returned ${res.status}: ${res.statusText}`);
      return null;
    }
    const data: any = await res.json();
    
    if (!data?.bpi?.USD?.rate_float) return null;
    
    const price = Number(data.bpi.USD.rate_float);
    if (!Number.isFinite(price) || price <= 0) return null;
    
    return { source: "coindesk:USD", price };
  } catch (error) {
    console.warn('CoinDesk API error (likely network issue):', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Добавляем новые источники для максимальной точности
async function getCoinbaseUSD(): Promise<SourceQuote | null> {
  try {
    const res = await fetchWithTimeout(
      "https://api.exchange.coinbase.com/products/BTC-USD/ticker",
      3000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    
    if (!data?.price) return null;
    
    const price = Number(data.price);
    const volume = Number(data.volume);
    
    if (!Number.isFinite(price) || price <= 0) return null;
    
    return { 
      source: "coinbase:USD", 
      price,
      volume: Number.isFinite(volume) && volume > 0 ? volume : undefined
    };
  } catch (error) {
    console.warn('Coinbase API error:', error);
    return null;
  }
}

async function getKuCoinUSD(baseId: string): Promise<SourceQuote | null> {
  try {
    const baseSym = getCryptoById(baseId)?.symbol || baseId.toUpperCase();
    const symbol = `${baseSym}-USDT`;
    const res = await fetchWithTimeout(
      `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}`,
      3000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    
    if (!data?.data?.price) return null;
    
    const price = Number(data.data.price);
    if (!Number.isFinite(price) || price <= 0) return null;
    
    return { source: `kucoin:${symbol}`, price };
  } catch (error) {
    console.warn(`KuCoin API error for ${baseId}:`, error);
    return null;
  }
}

async function getCoinGeckoFor(
  vs: VsCurrency,
  base: BaseCoinId
): Promise<SourceQuote | null> {
  try {
    // Добавляем небольшую задержку для избежания rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const res = await fetchWithTimeout(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
        base
      )}&vs_currencies=${encodeURIComponent(vs.toLowerCase())}&include_24hr_change=true&include_24hr_vol=true`,
      5000 // Увеличиваем таймаут
    );
    
    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`CoinGecko rate limit hit for ${base}/${vs}, skipping...`);
        return null;
      }
      return null;
    }
    
    const data: any = await res.json();
    
    if (!data?.[base]?.[vs.toLowerCase()]) return null;
    
    const price = Number(data[base][vs.toLowerCase()]);
    const change24h = Number(data[base][`${vs.toLowerCase()}_24h_change`]) || 0;
    const volume24h = Number(data[base][`${vs.toLowerCase()}_24h_vol`]) || 0;
    
    // Проверка на разумность цены
    if (!Number.isFinite(price) || price <= 0) return null;
    
    // Проверка на экстремальные изменения (более 50% за 24ч подозрительно)
    if (Math.abs(change24h) > 50) {
      console.warn(`Suspicious 24h change for ${base}/${vs}: ${change24h}%`);
    }
    
    return { 
      source: `coingecko:${base}:${vs.toUpperCase()}`, 
      price,
      volume: Number.isFinite(volume24h) && volume24h > 0 ? volume24h : undefined
    };
  } catch (error) {
    console.warn(`CoinGecko API error for ${base}/${vs}:`, error);
    return null;
  }
}

function dedupeQuotes(quotes: Array<SourceQuote | null>): SourceQuote[] {
  const map = new Map<string, SourceQuote>();
  for (const q of quotes) {
    if (!q) continue;
    // prefer entries with volume defined
    const existing = map.get(q.source);
    if (!existing) map.set(q.source, q);
    else if ((q.volume || 0) > (existing.volume || 0)) map.set(q.source, q);
  }
  return Array.from(map.values());
}

async function getFxRates(
  base: string
): Promise<Record<string, number> | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`,
      5000
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const rates = data?.rates;
    return rates && typeof rates === "object"
      ? (rates as Record<string, number>)
      : null;
  } catch {
    try {
      const res2 = await fetchWithTimeout(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}`,
        5000
      );
      if (!res2.ok) return null;
      const data2: any = await res2.json();
      const rates2 = data2?.rates;
      return rates2 && typeof rates2 === "object"
        ? (rates2 as Record<string, number>)
        : null;
    } catch {
      try {
        const res3 = await fetchWithTimeout(
          `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
          5000
        );
        if (!res3.ok) return null;
        const data3: any = await res3.json();
        const rates3 = data3?.rates;
        return rates3 && typeof rates3 === "object"
          ? (rates3 as Record<string, number>)
          : null;
      } catch {
        return null;
      }
    }
  }
}

async function getFxRateAggregated(
  base: string,
  target: string
): Promise<number | null> {
  if (base === target) return 1;
  target = target.toUpperCase();
  base = base.toUpperCase();

  const providers = await Promise.allSettled([
    (async () => {
      const res = await fetchWithTimeout(
        `https://api.exchangerate.host/latest?base=${encodeURIComponent(
          base
        )}&symbols=${encodeURIComponent(target)}`,
        4000
      );
      if (!res.ok) return null;
      const data: any = await res.json();
      return Number(data?.rates?.[target]) || null;
    })(),
    (async () => {
      const res = await fetchWithTimeout(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(
          base
        )}&to=${encodeURIComponent(target)}`,
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
    .map((p) => (p.status === "fulfilled" ? p.value : null))
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  if (values.length > 0) {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  const STATIC_USD_RATES: Record<string, number> = {
    EUR: 0.92,
    GBP: 0.78,
    CAD: 1.36,
    AUD: 1.54,
    SEK: 10.9,
  };
  if (base === "USD" && STATIC_USD_RATES[target]) {
    return STATIC_USD_RATES[target];
  }
  return null;
}

function weightedAverage(quotes: SourceQuote[]): number {
  if (quotes.length === 0) return NaN;

  // Улучшенный алгоритм агрегации с учетом надежности источников
  const sourceWeights: Record<string, number> = {
    'binance': 1.0,
    'kraken': 0.95,
    'coinbase': 0.9,
    'coingecko': 0.85,
    'bitstamp': 0.8,
    'coindesk': 0.75,
    'kucoin': 0.7,
  };

  const hasVolumes = quotes.some((q) => q.volume && q.volume > 0);
  
  if (!hasVolumes) {
    // Если нет данных об объеме, используем медиану с весами источников
    const weightedPrices: number[] = [];
    
    for (const quote of quotes) {
      const sourceName = quote.source.split(':')[0].toLowerCase();
      const weight = sourceWeights[sourceName] || 0.5;
      
      // Добавляем цену несколько раз в зависимости от веса источника
      const repetitions = Math.max(1, Math.round(weight * 10));
      for (let i = 0; i < repetitions; i++) {
        weightedPrices.push(quote.price);
      }
    }
    
    const sorted = [...weightedPrices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  // Если есть данные об объеме, используем взвешенное среднее
  let totalWeight = 0;
  let weightedSum = 0;

  for (const quote of quotes) {
    const sourceName = quote.source.split(':')[0].toLowerCase();
    const sourceWeight = sourceWeights[sourceName] || 0.5;
    const volumeWeight = quote.volume || 0;
    
    // Комбинируем вес источника и объем
    const combinedWeight = sourceWeight * Math.log(1 + volumeWeight);
    
    if (combinedWeight > 0) {
      totalWeight += combinedWeight;
      weightedSum += quote.price * combinedWeight;
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

  // Получаем данные из всех доступных источников параллельно
  const [binance, kraken, bitstamp, coindesk, coinbase, kucoin] = await Promise.all([
    getBinanceUSD(baseParam, vs),
    isBitcoin ? getKrakenUSD() : Promise.resolve(null),
    getBitstampUSD(baseParam, vs),
    getCoindeskUSD(),
    isBitcoin ? getCoinbaseUSD() : Promise.resolve(null),
    getKuCoinUSD(baseParam),
  ]);
  const usdSources = dedupeQuotes([binance, kraken, bitstamp, coindesk, coinbase, kucoin]);

  const [
    krakenDirect,
    bitstampDirect,
    coinbaseDirect,
    directVsCoingecko,
    coingeckoUsd,
  ]: Array<SourceQuote | null> = await Promise.all([
    isBitcoin ? getKrakenDirect(vs) : Promise.resolve(null),
    isBitcoin ? getBitstampDirect(vs) : Promise.resolve(null),
    isBitcoin ? getCoinbaseDirect(vs) : Promise.resolve(null),
    getCoinGeckoFor(vs, baseParam),
    getCoinGeckoFor("USD", baseParam),
  ]);
  // Include CoinGecko direct quote (if any) in consolidation along with other sources
  const fxRateToVs = vs === "USD" ? 1 : await getFxRateAggregated("USD", vs);
  // Some targets like XAG/XAU are not supported by standard FX providers.
  // In that case, derive USD->VS using CoinGecko quotes for the same base asset.
  const derivedFxFromCoingecko =
    vs !== "USD" && coingeckoUsd && directVsCoingecko && coingeckoUsd.price > 0
      ? directVsCoingecko.price / coingeckoUsd.price
      : null;
  const effectiveFxToVs = fxRateToVs ?? derivedFxFromCoingecko;

  const consolidated: SourceQuote[] = dedupeQuotes([
    krakenDirect,
    bitstampDirect,
    coinbaseDirect,
    directVsCoingecko,
  ]);
  if (usdSources.length > 0) {
    for (const s of usdSources) {
      const srcTag = (s.source || "").toUpperCase();
      const isUsdDenominated =
        srcTag.includes("USDT") ||
        srcTag.includes(":USD") ||
        srcTag.includes("->USD");

      if (vs === "USD") {
        // target is USD, use source value directly (no FX)
        consolidated.push({
          source: s.source,
          price: s.price,
          volume: s.volume,
        });
      } else if (isUsdDenominated && effectiveFxToVs) {
        // source is USD-denominated (or USDT); convert to target currency
        consolidated.push({
          source: `${s.source}->${vs}`,
          price: s.price * (effectiveFxToVs as number),
          volume: s.volume,
        });
      } else if (!isUsdDenominated) {
        // source already in target currency (e.g. binance:BTCRUB) - use as-is
        consolidated.push({
          source: s.source,
          price: s.price,
          volume: s.volume,
        });
      } else {
        // USD-denominated source but no FX available → skip to avoid mixing units
        continue;
      }
    }
  }
  if (coingeckoUsd && effectiveFxToVs && vs !== "USD") {
    consolidated.push({
      source: `coingecko:USD->${vs}`,
      price: coingeckoUsd.price * (effectiveFxToVs as number),
    });
  }

  if (consolidated.length === 0) {
    if (vs !== "USD" && effectiveFxToVs) {
      const fx = fxRateToVs;
      if (usdSources.length > 0) {
        for (const s of usdSources) {
          consolidated.push({
            source: `${s.source}->${vs}`,
            price: s.price * (effectiveFxToVs as number),
          });
        }
      }
    }
  }

  // ensure all consolidated quotes have numeric prices
  const cleaned = consolidated.filter((q) => Number.isFinite(q.price));

  // Улучшенная фильтрация выбросов с более строгими правилами
  function median(values: number[]) {
    if (values.length === 0) return NaN;
    const s = [...values].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
  }

  let filtered = cleaned;
  try {
    const prices = cleaned.map((q) => q.price);
    const med = median(prices);
    if (Number.isFinite(med)) {
      // Более строгие правила для фильтрации выбросов
      const MIN_FACTOR = 0.5;  // Не более чем в 2 раза меньше медианы
      const MAX_FACTOR = 2;     // Не более чем в 2 раза больше медианы
      
      // Дополнительная проверка: если цена больше 100,000 USD для криптовалют, это подозрительно
      const isSuspiciousPrice = (price: number) => {
        if (baseParam === "bitcoin" && price > 200000) return true;
        if (baseParam === "ethereum" && price > 10000) return true;
        if (baseParam === "binancecoin" && price > 1000) return true;
        if (baseParam === "solana" && price > 1000) return true;
        if (baseParam === "cardano" && price > 10) return true;
        if (baseParam === "dogecoin" && price > 1) return true;
        if (baseParam === "polygon" && price > 10) return true;
        if (baseParam === "chainlink" && price > 100) return true;
        if (baseParam === "litecoin" && price > 1000) return true;
        return false;
      };
      
      filtered = cleaned.filter((q) => {
        const withinRange = q.price >= med * MIN_FACTOR && q.price <= med * MAX_FACTOR;
        const notSuspicious = !isSuspiciousPrice(q.price);
        return withinRange && notSuspicious;
      });
      
      // If we filtered everything out (too strict), fallback to cleaned
      if (filtered.length === 0) {
        console.warn("All prices filtered out, using original data");
        filtered = cleaned;
      }
      
      // Dev log when outliers were removed
      if (filtered.length < cleaned.length) {
        console.warn("prices: removed outliers", {
          base: baseParam,
          vs,
          before: prices,
          median: med,
          after: filtered.map((q) => q.price),
          removedCount: cleaned.length - filtered.length,
        });
      }
    }
  } catch (e) {
    console.error("Error filtering outliers:", e);
    filtered = cleaned;
  }

  let price = weightedAverage(filtered);
  if (!Number.isFinite(price)) {
    let altDirect: number | undefined = undefined;
    if (
      directVsCoingecko &&
      typeof (directVsCoingecko as SourceQuote).price === "number"
    ) {
      altDirect = (directVsCoingecko as SourceQuote).price;
    } else if (
      krakenDirect &&
      typeof (krakenDirect as SourceQuote).price === "number"
    ) {
      altDirect = (krakenDirect as SourceQuote).price;
    } else if (
      bitstampDirect &&
      typeof (bitstampDirect as SourceQuote).price === "number"
    ) {
      altDirect = (bitstampDirect as SourceQuote).price;
    } else if (
      coinbaseDirect &&
      typeof (coinbaseDirect as SourceQuote).price === "number"
    ) {
      altDirect = (coinbaseDirect as SourceQuote).price;
    }
    const altFx = fxRateToVs
      ? (usdSources[0]?.price ?? coingeckoUsd?.price ?? undefined) *
        (fxRateToVs as number)
      : undefined;
    price = Number.isFinite(altDirect as number)
      ? (altDirect as number)
      : Number.isFinite(altFx as number)
      ? (altFx as number)
      : 0;
  }
  // Финальная валидация цены
  if (!Number.isFinite(price) || price <= 0) {
    console.error(`Invalid final price for ${baseParam}/${vs}:`, price);
    return new Response(JSON.stringify({ 
      error: "Unable to determine accurate price",
      base: baseParam.toUpperCase(),
      vs,
      sources: consolidated,
      updatedAt: new Date().toISOString()
    }), {
      status: 502,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  // Логируем успешное получение данных для мониторинга
  console.log(`Price fetched for ${baseParam}/${vs}: ${price} from ${consolidated.length} sources`);

  const body: PricesResponse = {
    base: baseParam.toUpperCase(),
    vs,
    price,
    sources: consolidated,
    updatedAt: new Date().toISOString(),
  };
  
  return new Response(JSON.stringify(body), {
    headers: { 
      "content-type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=15, s-maxage=15", // Кэширование на 15 секунд
    },
  });
}
