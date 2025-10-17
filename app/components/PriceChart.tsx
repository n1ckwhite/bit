"use client";

import { useEffect, useState, memo, useMemo, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartBarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { useTheme } from "../contexts/ThemeContext";
import { useI18n } from "../contexts/I18nContext";

type HistoryPoint = {
  timestamp: number;
  price: number;
  volume?: number;
};

type HistoryData = {
  base: "BTC";
  vs: string;
  interval: "1m" | "5m" | "1h" | "1d";
  data: HistoryPoint[];
  updatedAt: string;
};

interface PriceChartProps {
  vs: string;
  baseSymbol: string;
  className?: string;
}

const PriceChart = memo(function PriceChart({ vs, baseSymbol, className }: PriceChartProps) {
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [interval, setInterval] = useState<"1h" | "1d">("1h");
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useI18n();

  const fetchHistory = useCallback(async (currentVs: string, currentInterval: "1h" | "1d") => {
    setLoading(true);
    try {
      const limit = currentInterval === "1h" ? "24" : "30";
      const res = await fetch(`/api/history?vs=${encodeURIComponent(currentVs)}&interval=${currentInterval}&limit=${limit}`);
      const json: any = await res.json();
      if (!res.ok || !json || !Array.isArray(json.data)) {
        setHistory({ base: "BTC", vs: currentVs, interval: currentInterval, data: [], updatedAt: new Date().toISOString() });
      } else {
        setHistory(json as HistoryData);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setHistory({ base: "BTC", vs: currentVs, interval: currentInterval, data: [], updatedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(vs, interval);
  }, [vs, interval, fetchHistory]);

  const formatXAxis = useCallback((timestamp: number) => {
    const date = new Date(timestamp * 1000);
    if (interval === "1h") {
      return format(date, "HH:mm");
    } else {
      return format(date, "dd.MM");
    }
  }, [interval]);

  const formatTooltip = useCallback((value: number, name: string) => {
    if (name === "price") {
      return [`${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${vs}`, t('price')];
    }
    return [value, name];
  }, [vs]);

  const chartData = useMemo(() => {
    if (!history?.data) return [];
    // Optimize data processing with reduced precision for better performance
    return history.data.map(point => ({
      timestamp: point.timestamp,
      price: Math.round(point.price * 100) / 100, // Round to 2 decimal places
      time: formatXAxis(point.timestamp),
    }));
  }, [history?.data, formatXAxis]);

  const priceChange = useMemo(() => {
    if (chartData.length < 2) return 0;
    return ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price) * 100;
  }, [chartData]);

  const isPositive = priceChange >= 0;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 lg:p-8 min-h-80">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{t('priceChart', { sym: baseSymbol })}</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setInterval("1h")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              interval === "1h"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {t('hours24')}
          </button>
          <button
            onClick={() => setInterval("1d")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              interval === "1d"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {t('days30')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[250px] sm:h-[300px] bg-slate-100 dark:bg-slate-700 rounded-xl sm:rounded-2xl animate-pulse flex items-center justify-center" role="status" aria-live="polite" aria-busy="true">
          <div className="text-slate-600 dark:text-slate-300 text-sm">{t('loadingChart')}</div>
        </div>
      ) : (
        <>
          {Array.isArray(history?.data) && history!.data.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div>
                  <h4 className={`text-2xl sm:text-3xl font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {history.data[history.data.length - 1].price.toLocaleString(undefined, { maximumFractionDigits: 2 })} {vs}
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
                      {interval === "1h" ? t('for24h') : t('for30d')}
                    </span>
                  </div>
                </div>
                
                <div className="text-left sm:text-right">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                    <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{t('updated')} {new Date(history.updatedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="chart-container h-[150px] sm:h-[200px] lg:h-[250px] xl:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 20, left: 6, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? "#475569" : "#94a3b8"} 
                  opacity={isDark ? 0.5 : 0.4} 
                />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 9, fill: isDark ? "#e2e8f0" : "#1e293b" }}
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  opacity={0.7}
                  tickLine={{ stroke: isDark ? "#64748b" : "#94a3b8" }}
                  padding={{ right: 14 }}
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: isDark ? "#e2e8f0" : "#1e293b" }}
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  opacity={0.7}
                  tickLine={{ stroke: isDark ? "#64748b" : "#94a3b8" }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  labelFormatter={(label) => `${t('time')}: ${label}`}
                  contentStyle={{
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    fontSize: "11px",
                    color: isDark ? "#e2e8f0" : "#0f172a",
                  }}
                  labelStyle={{
                    color: isDark ? "#e2e8f0" : "#0f172a",
                    fontSize: "11px",
                    fontWeight: "500",
                  }}
                  itemStyle={{
                    color: isDark ? "#e2e8f0" : "#0f172a",
                    fontSize: "11px",
                    fontWeight: "500",
                  }}
                  cursor={{ stroke: isDark ? "#64748b" : "#94a3b8", strokeWidth: 1 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ 
                    r: 3, 
                    stroke: "currentColor", 
                    strokeWidth: 2,
                    fill: "white",
                    filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
                  }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
});

export default PriceChart;
