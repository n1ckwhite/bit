import { NextRequest } from "next/server";
import { DEFAULT_FIATS, enrichFiatCodes } from "../../lib/currencies";

const FALLBACK_VS_LOWERCASE = [
  "btc",
  "eth",
  "ltc",
  "bch",
  "bnb",
  "eos",
  "xrp",
  "xlm",
  "link",
  "dot",
  "yfi",
  "sol",
  "usd",
  "aed",
  "ars",
  "aud",
  "bdt",
  "bhd",
  "bmd",
  "brl",
  "cad",
  "chf",
  "clp",
  "cny",
  "czk",
  "dkk",
  "eur",
  "gbp",
  "gel",
  "hkd",
  "huf",
  "idr",
  "ils",
  "inr",
  "jpy",
  "krw",
  "kwd",
  "lkr",
  "mmk",
  "mxn",
  "myr",
  "ngn",
  "nok",
  "nzd",
  "php",
  "pkr",
  "pln",
  "rub",
  "sar",
  "sek",
  "sgd",
  "thb",
  "try",
  "twd",
  "uah",
  "vef",
  "vnd",
  "zar",
  "xdr",
  "xag",
  "xau",
  "bits",
  "sats",
];

const EXCLUDE_NON_FIAT = new Set([
  "BTC",
  "ETH",
  "LTC",
  "BCH",
  "BNB",
  "EOS",
  "XRP",
  "XLM",
  "LINK",
  "DOT",
  "YFI",
  "SOL",
  "BITS",
  "SATS",
]);

async function fetchCoinGeckoVs(): Promise<string[]> {
  const key = process.env.CG_API_KEY || process.env.COINGECKO_API_KEY;
  const urlPro =
    "https://pro-api.coingecko.com/api/v3/simple/supported_vs_currencies";
  const urlFree =
    "https://api.coingecko.com/api/v3/simple/supported_vs_currencies";
  try {
    const res = await fetch(key ? urlPro : urlFree, {
      headers: key ? { "x-cg-pro-api-key": key } : undefined,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    return Array.isArray(data) ? data.map((x) => String(x).toUpperCase()) : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const cg = await fetchCoinGeckoVs();
  const fallback = FALLBACK_VS_LOWERCASE.map((c) => c.toUpperCase());
  const defaultCodes = DEFAULT_FIATS.map((c) => c.code);
  const mergedAll = Array.from(new Set([...defaultCodes, ...fallback, ...cg]));
  const mergedFiats = mergedAll.filter((c) => !EXCLUDE_NON_FIAT.has(c));
  const enriched = enrichFiatCodes(mergedFiats);
  return new Response(
    JSON.stringify({ data: enriched, updatedAt: new Date().toISOString() }),
    {
      headers: { "content-type": "application/json; charset=utf-8" },
    }
  );
}
