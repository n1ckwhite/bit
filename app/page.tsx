"use client";

import { useEffect, useMemo, useRef, useState, lazy, Suspense, memo, useCallback } from "react";
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ArrowPathIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChevronUpIcon
} from "@heroicons/react/24/outline";
import ThemeToggle from "./components/ThemeToggle";
import { DEFAULT_FIATS } from "./lib/currencies";
import { BitcoinUnit, fromBtc, parseUnit, toBtc } from "./lib/units";

// Lazy load heavy components
const PriceChart = lazy(() => import("./components/PriceChart"));
const PriceAlerts = lazy(() => import("./components/PriceAlerts"));
const DataExport = lazy(() => import("./components/DataExport"));
const AdvancedChart = lazy(() => import("./components/AdvancedChart"));

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
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Functions for converter links - memoized
  const scrollToConverter = useCallback(() => {
    const converterElement = document.querySelector('[data-converter]');
    if (converterElement) {
      converterElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const setConverterToBTC = useCallback(() => {
    setUnit("BTC");
    setBtcAmount(1);
    scrollToConverter();
  }, [scrollToConverter]);

  const setConverterToSats = useCallback(() => {
    setUnit("sats");
    setBtcAmount(100000);
    scrollToConverter();
  }, [scrollToConverter]);

  const setConverterToMBTC = useCallback(() => {
    setUnit("mBTC");
    setBtcAmount(1000);
    scrollToConverter();
  }, [scrollToConverter]);

  // Scroll to top function - memoized
  const scrollToTop = useCallback(() => {
    try {
      // Method 1: Scroll main container if it exists
      if (mainContainerRef.current) {
        mainContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // Method 2: Try window scroll
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Method 3: Fallback methods
      setTimeout(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
    } catch (error) {
      console.error('Scroll error:', error);
      // Fallback to instant scroll
      window.scrollTo(0, 0);
    }
  }, []);

  const fetchQuote = useCallback(async (currentVs: string) => {
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
  }, []);

  // initial and vs change
  useEffect(() => {
    fetchQuote(vs);
  }, [vs, fetchQuote]);

  // polling every 60s
  useEffect(() => {
    const id = setInterval(() => fetchQuote(vs), 60000);
    return () => clearInterval(id);
  }, [vs, fetchQuote]);

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

  const handleAlertTriggered = useCallback((alert: any) => {
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
  }, []);

  return (
    <div className="h-screen bg-white dark:bg-slate-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <header className="px-3 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xs sm:text-sm lg:text-lg">₿</span>
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900 dark:text-white">
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
                  className="group relative p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  title="Обновить данные"
                  aria-label="Обновить данные"
                >
                  <ArrowPathIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} />
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main ref={mainContainerRef} className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 xl:px-8 pb-3 sm:pb-4 lg:pb-6">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
            
            {/* Price Display Card */}
            <div className="relative overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl xl:rounded-3xl bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 shadow-2xl">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative p-2.5 sm:p-3 lg:p-4 xl:p-6">
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
                      <div className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full ${isPositive ? 'bg-green-600 text-white' : 'bg-red-700 text-white'}`}>
                        {isPositive ? (
                          <ArrowTrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                        <span className="text-xs sm:text-sm font-medium">
                          {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
                        </span>
                      </div>
                      <span className="text-white/90 text-xs sm:text-sm">за 24ч</span>
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
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl xl:rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-2.5 sm:p-3 lg:p-4 xl:p-6" data-converter>
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2.5 sm:mb-3 lg:mb-4">
                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md sm:rounded-lg lg:rounded-xl flex items-center justify-center">
                  <CurrencyDollarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-white" />
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-slate-900 dark:text-white">Конвертер</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 xl:gap-6">
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
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setBtcAmount(prev => prev + 0.1);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setBtcAmount(prev => Math.max(0, prev - 0.1));
                        }
                      }}
                      className="w-full px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 pl-10 sm:pl-12 lg:pl-16 pr-2.5 sm:pr-3 lg:pr-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md sm:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm"
                      placeholder="1.0"
                      step="0.1"
                      min="0"
                    />
                    <div className="absolute left-2 sm:left-2.5 lg:left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {unit}
                    </div>
                    {/* Custom arrow buttons */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setBtcAmount(prev => prev + 0.1)}
                        className="custom-arrow-button w-8 h-8 flex items-center justify-center rounded-t-sm"
                        style={{ cursor: 'pointer' }}
                        title="Увеличить на 0.1"
                        aria-label="Увеличить на 0.1"
                      >
                        <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="18,15 12,9 6,15"></polyline>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBtcAmount(prev => Math.max(0, prev - 0.1))}
                        className="custom-arrow-button w-8 h-8 flex items-center justify-center rounded-b-sm"
                        style={{ cursor: 'pointer' }}
                        title="Уменьшить на 0.1"
                        aria-label="Уменьшить на 0.1"
                      >
                        <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
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
                    className="w-full px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md sm:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm"
                    aria-label="Выберите единицу измерения биткоина"
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
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          if (!quote) return;
                          const newFiat = fiatAmount + 100;
                          const btc = newFiat / quote.price;
                          setBtcAmount(fromBtc(btc, unit));
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          if (!quote) return;
                          const newFiat = Math.max(0, fiatAmount - 100);
                          const btc = newFiat / quote.price;
                          setBtcAmount(fromBtc(btc, unit));
                        }
                      }}
                      className="w-full px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 pl-10 sm:pl-12 lg:pl-16 pr-2.5 sm:pr-3 lg:pr-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md sm:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm"
                      placeholder="0.00"
                      step="100"
                      min="0"
                    />
                    <div className="absolute left-2 sm:left-2.5 lg:left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {vs}
                    </div>
                    {/* Custom arrow buttons */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!quote) return;
                          const newFiat = fiatAmount + 100;
                          const btc = newFiat / quote.price;
                          setBtcAmount(fromBtc(btc, unit));
                        }}
                        className="custom-arrow-button w-8 h-8 flex items-center justify-center rounded-t-sm"
                        style={{ cursor: 'pointer' }}
                        title="Увеличить на 100"
                        aria-label="Увеличить на 100"
                      >
                        <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="18,15 12,9 6,15"></polyline>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!quote) return;
                          const newFiat = Math.max(0, fiatAmount - 100);
                          const btc = newFiat / quote.price;
                          setBtcAmount(fromBtc(btc, unit));
                        }}
                        className="custom-arrow-button w-8 h-8 flex items-center justify-center rounded-b-sm"
                        style={{ cursor: 'pointer' }}
                        title="Уменьшить на 100"
                        aria-label="Уменьшить на 100"
                      >
                        <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                      </button>
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
                    className="w-full px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md sm:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm"
                    aria-label="Выберите валюту для конвертации"
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

            {/* Charts - Hidden on mobile, shown on tablet+ */}
            <div className="hidden sm:grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <Suspense fallback={<div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center"><div className="text-slate-600 dark:text-slate-300">Загрузка графика...</div></div>}>
                <PriceChart vs={vs} />
              </Suspense>
              <Suspense fallback={<div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center"><div className="text-slate-600 dark:text-slate-300">Загрузка продвинутого графика...</div></div>}>
                <AdvancedChart vs={vs} />
              </Suspense>
            </div>

            {/* Mobile Chart - Single chart on mobile */}
            <div className="sm:hidden">
              <Suspense fallback={<div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center"><div className="text-slate-600 dark:text-slate-300">Загрузка графика...</div></div>}>
                <PriceChart vs={vs} />
              </Suspense>
            </div>

            {/* Additional Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <Suspense fallback={<div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center"><div className="text-slate-600 dark:text-slate-300">Загрузка уведомлений...</div></div>}>
                <PriceAlerts 
                  currentPrice={currentPrice}
                  currency={vs}
                  onAlertTriggered={handleAlertTriggered}
                />
              </Suspense>
              <Suspense fallback={<div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center"><div className="text-slate-600 dark:text-slate-300">Загрузка экспорта...</div></div>}>
                <DataExport 
                  currentPrice={currentPrice}
                  currency={vs}
                  history={historyData}
                />
              </Suspense>
            </div>

            {/* Information Section */}
            <article className="mt-8 sm:mt-12 lg:mt-16">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 sm:p-8 lg:p-10">
                <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
                  
                  {/* Main Description */}
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
                      Этот сайт позволяет вам:
                    </h2>
                    <ul className="space-y-2 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Просматривать текущий курс биткоина в реальном времени
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Конвертировать любую сумму в предпочитаемую валюту и обратно
                      </li>
                    </ul>
                    <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                      Биткоин — это цифровая валюта, которая позволяет отправлять деньги онлайн без посредников. 
                      Подробнее о технологии блокчейн можно узнать <a href="https://bitcoin.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline">здесь</a>.
                    </p>
                  </section>

                  {/* Usage Section */}
                  <section>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">
                      Использование
                    </h3>
                    <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                      <p>
                        <strong>Отслеживание цены биткоина:</strong> Оставьте сайт открытым во вкладке браузера для мониторинга цены.
                      </p>
                      <p>
                        <strong>Покупка биткоина:</strong> Используйте поля ввода для просмотра эквивалентных сумм в биткоинах.
                      </p>
                      <p>
                        <strong>Проверка стоимости биткоина:</strong> Введите количество имеющихся биткоинов для наблюдения за изменением стоимости.
                      </p>
                      <p>
                        <strong>Мобильные устройства:</strong> Сайт оптимизирован для мобильных устройств. Добавьте его на главный экран для быстрого доступа.
                      </p>
                      <p>
                        <strong>Конвертация в меньшие единицы:</strong> Используйте единицы <button onClick={setConverterToSats} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline">сатоши (s)</button>, <button onClick={setConverterToMBTC} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline">микробиткоины (μ)</button>, <button onClick={setConverterToBTC} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline">миллибиткоины (m)</button> и горячие клавиши (S, u, m, k) для переключения.
                      </p>
                    </div>
                  </section>

                  {/* Data Sources */}
                  <section>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">
                      Данные
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                      Данные о ценах собираются с множественных рынков и обновляются каждую минуту. 
                      По умолчанию отображается средневзвешенная цена по объему торгов, 
                      но вы можете выбрать конкретные источники в настройках.
                    </p>
                  </section>

                  {/* Contact */}
                  <section>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">
                      Контакт
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                      Свяжитесь с нами через <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline">Twitter/X</a> для предложений, 
                      сообщений об ошибках или рекламных запросов.
                    </p>
                  </section>

                  {/* Disclaimer */}
                  <section>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">
                      Отказ от ответственности
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                      Курсы валют предоставляются исключительно в информационных целях. 
                      Их точность не гарантируется и может изменяться без предварительного уведомления.
                    </p>
                  </section>


                </div>
              </div>
            </article>
          </div>
        </main>
      </div>

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
        title="Наверх"
      >
        <ChevronUpIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
