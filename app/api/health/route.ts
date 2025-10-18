import { NextRequest } from "next/server";

type HealthStatus = {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    coingecko: boolean;
    binance: boolean;
    kraken: boolean;
    coinbase: boolean;
    bitstamp: boolean;
    kucoin: boolean;
  };
  responseTime: number;
  lastUpdate: string;
};

async function checkService(url: string, timeout: number = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const start = Date.now();
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoPriceBot/1.0)',
        'Accept': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - start;
    
    return response.ok && responseTime < timeout;
  } catch (error) {
    console.warn(`Health check failed for ${url}:`, error);
    return false;
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const startTime = Date.now();
  
  // Проверяем доступность основных сервисов
  const [coingecko, binance, kraken, coinbase, bitstamp, kucoin] = await Promise.all([
    checkService("https://api.coingecko.com/api/v3/ping"),
    checkService("https://api.binance.com/api/v3/ping"),
    checkService("https://api.kraken.com/0/public/SystemStatus"),
    checkService("https://api.exchange.coinbase.com/products"),
    checkService("https://www.bitstamp.net/api/v2/ticker/btcusd"),
    checkService("https://api.kucoin.com/api/v1/status"),
  ]);

  const services = {
    coingecko,
    binance,
    kraken,
    coinbase,
    bitstamp,
    kucoin,
  };

  const healthyServices = Object.values(services).filter(Boolean).length;
  const totalServices = Object.keys(services).length;
  
  let status: "healthy" | "degraded" | "unhealthy";
  if (healthyServices === totalServices) {
    status = "healthy";
  } else if (healthyServices >= totalServices / 2) {
    status = "degraded";
  } else {
    status = "unhealthy";
  }

  const responseTime = Date.now() - startTime;

  const healthStatus: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    services,
    responseTime,
    lastUpdate: new Date().toISOString(),
  };

  const statusCode = status === "healthy" ? 200 : status === "degraded" ? 200 : 503;

  return new Response(JSON.stringify(healthStatus), {
    status: statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
