"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { ChartBarSquareIcon, ClockIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useTheme } from "../contexts/ThemeContext";

type CandleData = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type AdvancedChartProps = {
  vs: string;
  className?: string;
};

export default function AdvancedChart({ vs, className }: AdvancedChartProps) {
  const [chartType, setChartType] = useState<"area" | "line">("area");
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d">("1h");
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const fetchCandleData = async (currentVs: string, currentTimeframe: "1h" | "4h" | "1d") => {
    setLoading(true);
    try {
      // Map timeframes to Binance intervals
      const intervalMap = {
        "1h": "1h",
        "4h": "4h", 
        "1d": "1d",
      };

      const interval = intervalMap[currentTimeframe];
      const symbol = currentVs === "USD" ? "BTCUSDT" : `BTC${currentVs}`;
      const limit = currentTimeframe === "1d" ? "30" : "100";

      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      
      if (!res.ok) throw new Error("Failed to fetch data");
      
      const klines: any[] = await res.json();
      const candleData: CandleData[] = klines.map(([openTime, open, high, low, close, volume]) => ({
        timestamp: Math.floor(openTime / 1000),
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
      }));

      setData(candleData);
    } catch (error) {
      console.error("Failed to fetch candle data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandleData(vs, timeframe);
  }, [vs, timeframe]);

  // No useEffect needed for chart creation with recharts

  const priceChange = data.length >= 2 
    ? ((data[data.length - 1].close - data[0].open) / data[0].open) * 100
    : 0;

  const isPositive = priceChange >= 0;

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    if (timeframe === "1h") {
      return format(date, "HH:mm", { locale: ru });
    } else {
      return format(date, "dd.MM", { locale: ru });
    }
  };

  const formatTooltip = (value: number, name: string) => {
    if (name === "close") {
      return [`${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${vs}`, "Цена"];
    }
    return [value, name];
  };

  const chartData = data.map(point => ({
    timestamp: point.timestamp,
    close: point.close,
    time: formatXAxis(point.timestamp),
  }));

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <ChartBarSquareIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Продвинутый график</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartType("area")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                chartType === "area"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              Область
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                chartType === "line"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              Линия
            </button>
          </div>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as "1h" | "4h" | "1d")}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-xs sm:text-sm"
            aria-label="Выберите временной интервал для графика"
          >
            <option value="1h">1ч</option>
            <option value="4h">4ч</option>
            <option value="1d">1д</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-[300px] sm:h-[400px] bg-slate-100 dark:bg-slate-700 rounded-xl sm:rounded-2xl animate-pulse flex items-center justify-center">
          <div className="text-slate-600 dark:text-slate-300 text-sm">Загрузка продвинутого графика...</div>
        </div>
      ) : (
        <>
          {data.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div>
                  <h4 className={`text-2xl sm:text-3xl font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {data[data.length - 1].close.toLocaleString(undefined, { maximumFractionDigits: 2 })} {vs}
                  </h4>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      isPositive 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      <span>{isPositive ? "↗" : "↘"}</span>
                      <span>{Math.abs(priceChange).toFixed(2)}%</span>
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                      за {timeframe === "1h" ? "100 часов" : timeframe === "4h" ? "400 часов" : "30 дней"}
                    </span>
                  </div>
                </div>
                
                <div className="text-left sm:text-right">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                    <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Обновлено {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={chartData}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? "#475569" : "#94a3b8"} 
                    opacity={isDark ? 0.5 : 0.4} 
                  />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10, fill: isDark ? "#e2e8f0" : "#1e293b" }}
                    stroke={isDark ? "#64748b" : "#94a3b8"}
                    tickLine={{ stroke: isDark ? "#64748b" : "#94a3b8" }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: isDark ? "#e2e8f0" : "#1e293b" }}
                    stroke={isDark ? "#64748b" : "#94a3b8"}
                    tickLine={{ stroke: isDark ? "#64748b" : "#94a3b8" }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    formatter={formatTooltip}
                    labelFormatter={(label) => `Время: ${label}`}
                    contentStyle={{
                      backgroundColor: isDark ? "#1e293b" : "#ffffff",
                      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      fontSize: "12px",
                      color: isDark ? "#e2e8f0" : "#1e293b",
                    }}
                    labelStyle={{
                      color: isDark ? "#e2e8f0" : "#1e293b",
                      fontSize: "12px",
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="close" 
                    stroke={isPositive ? "#10b981" : "#ef4444"}
                    fill={isPositive ? "#10b981" : "#ef4444"}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? "#475569" : "#94a3b8"} 
                    opacity={isDark ? 0.5 : 0.4} 
                  />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10, fill: isDark ? "#e2e8f0" : "#1e293b" }}
                    stroke={isDark ? "#64748b" : "#94a3b8"}
                    tickLine={{ stroke: isDark ? "#64748b" : "#94a3b8" }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: isDark ? "#e2e8f0" : "#1e293b" }}
                    stroke={isDark ? "#64748b" : "#94a3b8"}
                    tickLine={{ stroke: isDark ? "#64748b" : "#94a3b8" }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    formatter={formatTooltip}
                    labelFormatter={(label) => `Время: ${label}`}
                    contentStyle={{
                      backgroundColor: isDark ? "#1e293b" : "#ffffff",
                      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      fontSize: "12px",
                      color: isDark ? "#e2e8f0" : "#1e293b",
                    }}
                    labelStyle={{
                      color: isDark ? "#e2e8f0" : "#1e293b",
                      fontSize: "12px",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke={isPositive ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ 
                      r: 4, 
                      stroke: "currentColor", 
                      strokeWidth: 2,
                      fill: "white",
                      filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
                    }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
