"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ArrowPathIcon,
  BellIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  CurrencyDollarIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import ThemeToggle from "./components/ThemeToggle";
import PriceChart from "./components/PriceChart";
import PriceAlerts from "./components/PriceAlerts";
import DataExport from "./components/DataExport";
import AdvancedChart from "./components/AdvancedChart";
import { DEFAULT_FIATS } from "./lib/currencies";
import { BitcoinUnit, fromBtc, parseUnit, toBtc } from "./lib/units";

type Quote = {
  base: "BTC";
  vs: string;
  price: number; // price of 1 BTC in vs
  updatedAt: string;
  sources: { source: string; price: number }[];
};

export default function Home() {
  const [vs, setVs] = useState("USD");
  const [unit, setUnit] = useState<BitcoinUnit>("BTC");
  const [btcAmount, setBtcAmount] = useState<number>(1);
  const [fiatAmount, setFiatAmount] = useState<number>(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [historyData, setHistoryData] = useState<Array<{ timestamp: number; price: number }>>([]);
  const inputBtcRef = useRef<HTMLInputElement>(null);

  const fetchQuote = async (currentVs: string) => {
    setLoading(true);
    try {
      const [priceRes, historyRes] = await Promise.all([
        fetch(`/api/prices?vs=${encodeURIComponent(currentVs)}`, { cache: "no-store" }),
        fetch(`/api/history?vs=${encodeURIComponent(currentVs)}&interval=1h&limit=24`, { cache: "no-store" })
      ]);
      
      const priceData: Quote = await priceRes.json();
      const historyData: any = await historyRes.json();
      
      setQuote(priceData);
      setHistoryData(historyData.data || []);
      setLastUpdated(new Date(priceData.updatedAt).toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  // initial and vs change
  useEffect(() => {
    fetchQuote(vs);
  }, [vs]);

  // polling every 60s
  useEffect(() => {
    const id = setInterval(() => fetchQuote(vs), 60000);
    return () => clearInterval(id);
  }, [vs]);

  // recalc fiat when quote or amounts change
  useEffect(() => {
    if (!quote) return;
    const btc = toBtc(btcAmount, unit);
    setFiatAmount(btc * quote.price);
  }, [quote, btcAmount, unit]);

  // keyboard shortcuts: s,u,m,k
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "s") setUnit("sats");
      if (e.key === "u") setUnit("µBTC");
      if (e.key === "m") setUnit("mBTC");
      if (e.key === "k") setUnit("BTC");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fiatOptions = useMemo(() => DEFAULT_FIATS.map((c) => c.code), []);

  const currentPrice = quote?.price || 0;
  const priceChange = historyData.length >= 2 
    ? ((historyData[historyData.length - 1].price - historyData[0].price) / historyData[0].price) * 100
    : 0;
  const isPositive = priceChange >= 0;

  const handleAlertTriggered = (alert: any) => {
    if (navigator.serviceWorker && 'showNotification' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Уведомление о цене', {
          body: `Цена BTC достигла ${alert.targetPrice} ${alert.currency}`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'price-alert',
        });
      });
    } else {
      alert(`🚨 Цена BTC достигла ${alert.targetPrice} ${alert.currency}!`);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm sm:text-lg">₿</span>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      Курс Биткоина
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
                      Конвертер и график в реальном времени
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
                <button
                  onClick={() => fetchQuote(vs)}
                  disabled={loading}
                  className="group relative p-2 sm:p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  title="Обновить данные"
                >
                  <ArrowPathIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} />
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-3 sm:px-4 lg:px-6 xl:px-8 pb-8 sm:pb-12">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            
            {/* Price Display Card */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 shadow-2xl">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative p-4 sm:p-6 lg:p-8 xl:p-12">
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                        <CurrencyDollarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">
                          {currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </h2>
                        <p className="text-lg sm:text-xl text-white/90 font-medium">{vs}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full ${isPositive ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'}`}>
                        {isPositive ? (
                          <ArrowTrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                        <span className="text-xs sm:text-sm font-medium">
                          {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
                        </span>
                      </div>
                      <span className="text-white/70 text-xs sm:text-sm">за 24ч</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 text-left sm:text-right space-y-2 sm:space-y-3">
                    <div className="flex items-center space-x-2 text-white/80">
                      <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Обновлено {lastUpdated}</span>
                    </div>
                    
                    {quote && (
                      <div className="flex flex-wrap gap-1 sm:gap-2 justify-start sm:justify-end">
                        {quote.sources.slice(0, 3).map((source) => (
                          <span
                            key={source.source}
                            className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/20 backdrop-blur-sm rounded text-xs text-white font-medium"
                          >
                            {source.source.split(":")[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Converter Card */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <CurrencyDollarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Конвертер</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* BTC Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Биткоин
                  </label>
                  <div className="relative">
                    <input
                      ref={inputBtcRef}
                      type="number"
                      value={btcAmount}
                      onChange={(e) => setBtcAmount(Number(e.target.value))}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-12 sm:pl-16 pr-3 sm:pr-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm sm:text-base"
                      placeholder="1.0"
                    />
                    <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                      {unit}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Клавиши: k — BTC, m — mBTC, u — µBTC, s — сатоши
                  </p>
                </div>

                {/* Unit Select */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Единица
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(parseUnit(e.target.value))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm sm:text-base"
                  >
                    {(["BTC", "mBTC", "µBTC", "sats"] as BitcoinUnit[]).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
        </div>

                {/* Fiat Amount */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Сумма, фиат
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={fiatAmount.toFixed(2)}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!quote) return;
                        const btc = v / quote.price;
                        setBtcAmount(fromBtc(btc, unit));
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-12 sm:pl-16 pr-3 sm:pr-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm sm:text-base"
                      placeholder="0.00"
                    />
                    <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                      {vs}
                    </div>
                  </div>
                </div>

                {/* Currency Select */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Валюта
                  </label>
                  <select
                    value={vs}
                    onChange={(e) => setVs(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm sm:text-base"
                  >
                    {fiatOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <PriceChart vs={vs} />
              <AdvancedChart vs={vs} />
            </div>

            {/* Additional Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <PriceAlerts 
                currentPrice={currentPrice}
                currency={vs}
                onAlertTriggered={handleAlertTriggered}
              />
              <DataExport 
                currentPrice={currentPrice}
                currency={vs}
                history={historyData}
              />
            </div>

            {/* Footer */}
            <div className="text-center py-6 sm:py-8">
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                Данные обновляются каждую минуту из множественных источников
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-xs mt-2">
                PWA готово к установке • Уведомления • Экспорт данных • Продвинутые графики
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
