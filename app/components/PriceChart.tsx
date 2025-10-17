"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartBarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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
  className?: string;
}

export default function PriceChart({ vs, className }: PriceChartProps) {
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [interval, setInterval] = useState<"1h" | "1d">("1h");
  const [loading, setLoading] = useState(false);

  const fetchHistory = async (currentVs: string, currentInterval: "1h" | "1d") => {
    setLoading(true);
    try {
      const limit = currentInterval === "1h" ? "24" : "30";
      const res = await fetch(`/api/history?vs=${encodeURIComponent(currentVs)}&interval=${currentInterval}&limit=${limit}`);
      const data: HistoryData = await res.json();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(vs, interval);
  }, [vs, interval]);

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    if (interval === "1h") {
      return format(date, "HH:mm", { locale: ru });
    } else {
      return format(date, "dd.MM", { locale: ru });
    }
  };

  const formatTooltip = (value: number, name: string) => {
    if (name === "price") {
      return [`${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${vs}`, "Цена"];
    }
    return [value, name];
  };

  const chartData = history?.data.map(point => ({
    timestamp: point.timestamp,
    price: point.price,
    time: formatXAxis(point.timestamp),
  })) || [];

  const priceChange = chartData.length >= 2 
    ? ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price) * 100
    : 0;

  const isPositive = priceChange >= 0;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">График цены BTC</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setInterval("1h")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              interval === "1h"
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            24ч
          </button>
          <button
            onClick={() => setInterval("1d")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              interval === "1d"
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            30д
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[250px] sm:h-[300px] bg-slate-100 dark:bg-slate-700 rounded-xl sm:rounded-2xl animate-pulse flex items-center justify-center">
          <div className="text-slate-500 dark:text-slate-400 text-sm">Загрузка графика...</div>
        </div>
      ) : (
        <>
          {history && history.data.length > 0 && (
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
                    <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                      за {interval === "1h" ? "24 часа" : "30 дней"}
                    </span>
                  </div>
                </div>
                
                <div className="text-left sm:text-right">
                  <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                    <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Обновлено {new Date(history.updatedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="h-[150px] sm:h-[200px] lg:h-[250px] xl:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 9, fill: "currentColor" }}
                  stroke="currentColor"
                  opacity={0.7}
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: "currentColor" }}
                  stroke="currentColor"
                  opacity={0.7}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  labelFormatter={(label) => `Время: ${label}`}
                  contentStyle={{
                    backgroundColor: "var(--tw-bg-opacity)",
                    border: "1px solid var(--tw-border-opacity)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    fontSize: "11px",
                  }}
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
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
