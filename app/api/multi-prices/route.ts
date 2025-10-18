import { NextRequest } from "next/server";
import { SUPPORTED_CRYPTOS } from "../../lib/crypto";

type MultiPriceQuote = {
  id: string;
  symbol: string;
  name: string;
  names: Record<string, string>;
  price: number;
  change24h: number;
  volume24h?: number;
  marketCap?: number;
};

type MultiPricesResponse = {
  data: MultiPriceQuote[];
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
        next: { revalidate: 60 }, // Более частое обновление
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

async function getCoinGeckoMultiPrices(vs: string): Promise<MultiPriceQuote[]> {
  try {
    const ids = SUPPORTED_CRYPTOS.map((crypto) => crypto.id).join(",");
    const res = await fetchWithTimeout(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${encodeURIComponent(
        vs
      )}&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
      5000
    );

    if (!res.ok) {
      console.warn(`CoinGecko API returned ${res.status}: ${res.statusText}`);
      return [];
    }

    const data: any = await res.json();
    
    if (!data || typeof data !== 'object') {
      console.warn('Invalid CoinGecko response format');
      return [];
    }

    const quotes: MultiPriceQuote[] = [];

    for (const crypto of SUPPORTED_CRYPTOS) {
      const cryptoData = data[crypto.id];
      if (cryptoData && cryptoData[vs.toLowerCase()]) {
        const price = Number(cryptoData[vs.toLowerCase()]);
        const change24h = Number(cryptoData[`${vs.toLowerCase()}_24h_change`]) || 0;
        const volume24h = Number(cryptoData[`${vs.toLowerCase()}_24h_vol`]) || 0;
        const marketCap = Number(cryptoData[`${vs.toLowerCase()}_market_cap`]) || 0;
        
        // Валидация данных
        if (Number.isFinite(price) && price > 0) {
          // Проверка на экстремальные изменения
          const isExtremeChange = Math.abs(change24h) > 50;
          if (isExtremeChange) {
            console.warn(`Extreme 24h change for ${crypto.symbol}: ${change24h}%`);
          }
          
          quotes.push({
            id: crypto.id,
            symbol: crypto.symbol,
            name: crypto.name,
            names: crypto.names,
            price,
            change24h,
            volume24h: Number.isFinite(volume24h) && volume24h > 0 ? volume24h : undefined,
            marketCap: Number.isFinite(marketCap) && marketCap > 0 ? marketCap : undefined,
          });
        } else {
          console.warn(`Invalid price data for ${crypto.symbol}: ${price}`);
        }
      }
    }

    return quotes;
  } catch (error) {
    console.error("CoinGecko multi-price fetch failed:", error);
    return [];
  }
}

// Добавляем fallback источник для multi-prices
async function getBinanceMultiPrices(vs: string): Promise<MultiPriceQuote[]> {
  try {
    const quotes: MultiPriceQuote[] = [];
    
    // Получаем данные для основных криптовалют из Binance
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'MATICUSDT', 'LINKUSDT', 'LTCUSDT'];
    
    const promises = symbols.map(async (symbol) => {
      try {
        const res = await fetchWithTimeout(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
          3000
        );
        
        if (!res.ok) return null;
        
        const data: any = await res.json();
        const price = Number(data.lastPrice);
        const change24h = Number(data.priceChangePercent);
        const volume24h = Number(data.volume);
        
        if (Number.isFinite(price) && price > 0) {
          // Маппинг символов на криптовалюты
          const cryptoMap: Record<string, { id: string; symbol: string; name: string }> = {
            'BTCUSDT': { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
            'ETHUSDT': { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
            'BNBUSDT': { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
            'ADAUSDT': { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
            'SOLUSDT': { id: 'solana', symbol: 'SOL', name: 'Solana' },
            'DOGEUSDT': { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
            'MATICUSDT': { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
            'LINKUSDT': { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
            'LTCUSDT': { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
          };
          
          const crypto = cryptoMap[symbol];
          if (crypto) {
            return {
              id: crypto.id,
              symbol: crypto.symbol,
              name: crypto.name,
              names: { en: crypto.name },
              price,
              change24h,
              volume24h: Number.isFinite(volume24h) && volume24h > 0 ? volume24h : undefined,
            };
          }
        }
        return null;
      } catch (error) {
        console.warn(`Binance fetch failed for ${symbol}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    return results.filter((quote): quote is MultiPriceQuote => quote !== null);
  } catch (error) {
    console.error('Binance multi-price fetch failed:', error);
    return [];
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const vsParam = searchParams.get("vs") || "USD";
  const vs = vsParam.toUpperCase();

  // Пробуем получить данные из CoinGecko, если не получается - используем Binance
  let quotes = await getCoinGeckoMultiPrices(vs);
  
  if (quotes.length === 0 && vs === "USD") {
    console.warn('CoinGecko failed, trying Binance fallback');
    quotes = await getBinanceMultiPrices(vs);
  }

  if (quotes.length === 0) {
    return new Response(JSON.stringify({ 
      error: "No price data available",
      sources: ["coingecko", "binance"],
      updatedAt: new Date().toISOString()
    }), {
      status: 502,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const body: MultiPricesResponse = {
    data: quotes.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)),
    updatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    headers: { 
      "content-type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60", // Кэширование на 1 минуту
    },
  });
}
