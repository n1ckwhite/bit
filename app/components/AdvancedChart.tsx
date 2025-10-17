"use client";

import { useEffect, useState, memo, useMemo, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { ChartBarSquareIcon, ClockIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
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

const AdvancedChart = memo(function AdvancedChart({ vs, className }: AdvancedChartProps) {
  // Тип графика фиксирован как область; используем почасовые данные и переключаем диапазон часов
  const [timeframe] = useState<"1h">("1h");
  const [hours, setHours] = useState<168 | 336>(168);
  const [showMA7, setShowMA7] = useState<boolean>(true);
  // Оставляем один индикатор для наглядности
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const fetchCandleData = useCallback(async (currentVs: string, currentTimeframe: "1h", limitHours: 168 | 336) => {
    setLoading(true);
    try {
      // Map timeframes to Binance intervals
      const intervalMap = {
        "1h": "1h",
      } as const;

      const interval = intervalMap[currentTimeframe];
      const limit = String(limitHours);

      const res = await fetch(
        `/api/history?vs=${encodeURIComponent(currentVs)}&interval=${interval}&limit=${limit}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        // Graceful fallback: don't throw, just keep previous data
        console.warn("History request failed:", res.status);
        setData([]);
        return;
      }
      const json: any = await res.json();
      const points: Array<{ timestamp: number; price: number; volume?: number }> = json?.data || [];
      const candleData: CandleData[] = points.map((p) => ({
        timestamp: p.timestamp,
        open: p.price,
        high: p.price,
        low: p.price,
        close: p.price,
        volume: p.volume ?? 0,
      }));
      setData(candleData);
    } catch (error) {
      console.error("Failed to fetch candle data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandleData(vs, timeframe, hours);
  }, [vs, timeframe, hours, fetchCandleData]);

  const priceChange = useMemo(() => {
    if (data.length < 2) return 0;
    return ((data[data.length - 1].close - data[0].open) / data[0].open) * 100;
  }, [data]);

  const isPositive = priceChange >= 0;

  const formatXAxis = useCallback((timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return hours > 48 ? format(date, "dd.MM") : format(date, "HH:mm");
  }, [hours]);

  const formatTooltip = useCallback((value: number, name: string) => {
    if (name === "close") {
      return [`${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${vs}`, "Цена"];
    }
    return [value, name];
  }, [vs]);

  const chartData = useMemo(() => {
    // Prepare base points
    const points = data.map(point => ({
      timestamp: point.timestamp,
      close: Math.round(point.close * 100) / 100,
      time: formatXAxis(point.timestamp),
    }));

    // Helper to compute simple moving average
    const computeMA = (windowSize: number) => {
      const result: Array<number | undefined> = new Array(points.length).fill(undefined);
      let sum = 0;
      for (let i = 0; i < points.length; i++) {
        sum += points[i].close;
        if (i >= windowSize) sum -= points[i - windowSize].close;
        if (i >= windowSize - 1) result[i] = Math.round((sum / windowSize) * 100) / 100;
      }
      return result;
    };

    const ma7 = computeMA(7);
    const ma30 = computeMA(30);

    return points.map((p, i) => ({ ...p, ma7: ma7[i], ma30: ma30[i] }));
  }, [data, formatXAxis]);

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
              onClick={() => setShowMA7(v => !v)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                showMA7
                  ? "bg-emerald-700 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
              title="Скользящая средняя 7 часов"
            >
              MA7
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setHours(168)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                hours === 168
                  ? "bg-purple-700 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              7д
            </button>
            <button
              onClick={() => setHours(336)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                hours === 336
                  ? "bg-purple-700 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              14д
            </button>
          </div>
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
                      за {hours === 168 ? '1 неделю' : '2 недели'}
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

          <div className="chart-container h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {true ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? "#475569" : "#94a3b8"} 
                    opacity={isDark ? 0.5 : 0.4} 
                  />
                  <XAxis 
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tick={{ fontSize: 10, fill: isDark ? "#e2e8f0" : "#1e293b" }}
                    stroke={isDark ? "#64748b" : "#94a3b8"}
                    tickLine={{ stroke: isDark ? "#64748b" : "#94a3b8" }}
                    minTickGap={18}
                    tickCount={hours > 48 ? 8 : 10}
                    tickFormatter={(ts) => format(new Date(ts * 1000), hours > 48 ? "dd.MM" : "HH:mm")}
                    padding={{ right: 16 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: isDark ? "#e2e8f0" : "#1e293b" }}
                    stroke={isDark ? "#64748b" : "#94a3b8"}
                    tickLine={{ stroke: isDark ? "#64748b" : "#94a3b8" }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    formatter={formatTooltip}
                    labelFormatter={(label, payload) => {
                      const ts = payload && payload[0] && payload[0].payload ? payload[0].payload.timestamp : undefined;
                      if (!ts) return "";
                      return `Время: ${format(new Date(ts * 1000), hours > 48 ? "dd.MM HH:mm" : "HH:mm")}`;
                    }}
                    contentStyle={{
                      backgroundColor: isDark ? "#1e293b" : "#ffffff",
                      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      fontSize: "12px",
                      color: isDark ? "#e2e8f0" : "#0f172a",
                    }}
                    labelStyle={{
                      color: isDark ? "#e2e8f0" : "#0f172a",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                    itemStyle={{
                      color: isDark ? "#e2e8f0" : "#0f172a",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                    cursor={{ stroke: isDark ? "#64748b" : "#94a3b8", strokeWidth: 1 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="close" 
                    stroke={isPositive ? "#10b981" : "#ef4444"}
                    fill={isPositive ? "#10b981" : "#ef4444"}
                    fillOpacity={0.1}
                    strokeWidth={2}
                    isAnimationActive={false}
                    activeDot={{ 
                      r: 4, 
                      stroke: "currentColor", 
                      strokeWidth: 2,
                      fill: "white",
                      filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
                    }}
                  />
                  {showMA7 && (
                    <Line
                      type="monotone"
                      dataKey="ma7"
                      stroke="#10b981"
                      strokeDasharray="5 4"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                </AreaChart>
              ) : null}
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
});

export default AdvancedChart;
