import { NextRequest } from "next/server";
import { SUPPORTED_CRYPTOS, getCryptoLocalizedName } from "../../lib/crypto";

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

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { 
      signal: controller.signal, 
      next: { revalidate: 120 } 
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function getCoinGeckoMultiPrices(vs: string): Promise<MultiPriceQuote[]> {
  try {
    const ids = SUPPORTED_CRYPTOS.map(crypto => crypto.id).join(",");
    const res = await fetchWithTimeout(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${encodeURIComponent(vs)}&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
      8000
    );
    
    if (!res.ok) return [];
    
    const data: any = await res.json();
    const quotes: MultiPriceQuote[] = [];
    
    for (const crypto of SUPPORTED_CRYPTOS) {
      const cryptoData = data[crypto.id];
      if (cryptoData && cryptoData[vs.toLowerCase()]) {
        quotes.push({
          id: crypto.id,
          symbol: crypto.symbol,
          name: crypto.name,
          names: crypto.names,
          price: Number(cryptoData[vs.toLowerCase()]),
          change24h: Number(cryptoData[`${vs.toLowerCase()}_24h_change`]) || 0,
          volume24h: Number(cryptoData[`${vs.toLowerCase()}_24h_vol`]) || undefined,
          marketCap: Number(cryptoData[`${vs.toLowerCase()}_market_cap`]) || undefined,
        });
      }
    }
    
    return quotes;
  } catch (error) {
    console.error("CoinGecko multi-price fetch failed:", error);
    return [];
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const vsParam = searchParams.get("vs") || "USD";
  const vs = vsParam.toUpperCase();

  const quotes = await getCoinGeckoMultiPrices(vs);

  if (quotes.length === 0) {
    return new Response(
      JSON.stringify({ error: "No price data available" }),
      { status: 502, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }

  const body: MultiPricesResponse = {
    data: quotes.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)), 
    updatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
