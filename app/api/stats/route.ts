import { NextRequest } from "next/server";

type PriceAccuracy = {
  source: string;
  accuracy: number;
  reliability: number;
  lastUpdate: string;
  totalRequests: number;
  successRate: number;
};

type StatsResponse = {
  accuracy: PriceAccuracy[];
  overallAccuracy: number;
  totalSources: number;
  activeSources: number;
  lastCalculated: string;
};

// В реальном приложении эти данные должны храниться в базе данных
// Здесь мы используем статические данные для демонстрации
const sourceStats: Record<string, PriceAccuracy> = {
  'binance': {
    source: 'binance',
    accuracy: 99.2,
    reliability: 98.5,
    lastUpdate: new Date().toISOString(),
    totalRequests: 15420,
    successRate: 99.1,
  },
  'kraken': {
    source: 'kraken',
    accuracy: 98.8,
    reliability: 97.2,
    lastUpdate: new Date().toISOString(),
    totalRequests: 12850,
    successRate: 98.3,
  },
  'coinbase': {
    source: 'coinbase',
    accuracy: 99.0,
    reliability: 98.8,
    lastUpdate: new Date().toISOString(),
    totalRequests: 11200,
    successRate: 98.9,
  },
  'coingecko': {
    source: 'coingecko',
    accuracy: 97.5,
    reliability: 96.8,
    lastUpdate: new Date().toISOString(),
    totalRequests: 18900,
    successRate: 97.2,
  },
  'bitstamp': {
    source: 'bitstamp',
    accuracy: 98.1,
    reliability: 97.5,
    lastUpdate: new Date().toISOString(),
    totalRequests: 8750,
    successRate: 97.8,
  },
  'kucoin': {
    source: 'kucoin',
    accuracy: 97.8,
    reliability: 96.9,
    lastUpdate: new Date().toISOString(),
    totalRequests: 9200,
    successRate: 97.1,
  },
};

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const accuracyData = Object.values(sourceStats);
    
    // Вычисляем общую точность
    const totalAccuracy = accuracyData.reduce((sum, source) => sum + source.accuracy, 0);
    const overallAccuracy = totalAccuracy / accuracyData.length;
    
    // Подсчитываем активные источники (с успешностью > 95%)
    const activeSources = accuracyData.filter(source => source.successRate > 95).length;
    
    const statsResponse: StatsResponse = {
      accuracy: accuracyData.sort((a, b) => b.accuracy - a.accuracy),
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      totalSources: accuracyData.length,
      activeSources,
      lastCalculated: new Date().toISOString(),
    };

    return new Response(JSON.stringify(statsResponse), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300", // Кэширование на 5 минут
      },
    });
  } catch (error) {
    console.error('Stats API error:', error);
    
    return new Response(JSON.stringify({ 
      error: "Unable to fetch statistics",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
