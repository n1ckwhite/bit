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
import { SUPPORTED_CRYPTOS } from "./lib/crypto";
import type { FiatCurrency } from "./lib/currencies";
import { BitcoinUnit, fromBtc, parseUnit, toBtc } from "./lib/units";

// Lazy load heavy components with preload
const PriceChart = lazy(() => import("./components/PriceChart"));
const PriceAlerts = lazy(() => import("./components/PriceAlerts"));
const DataExport = lazy(() => import("./components/DataExport"));
const AdvancedChart = lazy(() => import("./components/AdvancedChart"));

// Preload components after initial render
const preloadComponents = () => {
  import("./components/PriceChart");
  import("./components/PriceAlerts");
  import("./components/DataExport");
  import("./components/AdvancedChart");
};

type Quote = {
  base: string;
  vs: string;
  price: number; // price of 1 BTC in vs
  updatedAt: string;
  sources: { source: string; price: number }[];
};

export default function Home() {
  const [vs, setVs] = useState("USD");
  const [unit, setUnit] = useState<BitcoinUnit>("BTC");
  const [baseCoin, setBaseCoin] = useState<string>("bitcoin");
  const [btcAmount, setBtcAmount] = useState<number>(1);
  const [fiatAmount, setFiatAmount] = useState<number>(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [historyData, setHistoryData] = useState<Array<{ timestamp: number; price: number }>>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [fiatsRemote, setFiatsRemote] = useState<FiatCurrency[] | null>(null);
  const [fiatsLoading, setFiatsLoading] = useState(false);
  const inputBtcRef = useRef<HTMLInputElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const fiatsLoadedRef = useRef(false);

  // Current crypto meta
  const currentCrypto = useMemo(() => SUPPORTED_CRYPTOS.find(c => c.id === baseCoin), [baseCoin]);
  const currentSymbol = currentCrypto?.symbol || "BTC";
  const COIN_GRADIENTS: Record<string, string> = {
    // Refined, warmer gradient for BTC
    bitcoin: "from-amber-400 via-orange-500 to-rose-500",
    ethereum: "from-indigo-500 via-purple-500 to-indigo-600",
    solana: "from-emerald-500 via-teal-500 to-emerald-600",
    litecoin: "from-slate-400 via-slate-500 to-slate-600",
    binancecoin: "from-amber-400 via-yellow-500 to-amber-600",
    cardano: "from-blue-500 via-cyan-500 to-blue-600",
    dogecoin: "from-yellow-400 via-amber-500 to-yellow-600",
    polygon: "from-fuchsia-500 via-purple-500 to-fuchsia-600",
    chainlink: "from-blue-600 via-indigo-600 to-blue-700",
    ordinals: "from-rose-500 via-pink-500 to-rose-600",
  };
  const priceCardGradient = useMemo(() => COIN_GRADIENTS[baseCoin] || "from-amber-400 via-orange-500 to-rose-500", [baseCoin]);

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
      // Method 1: Scroll main container if it exists and has scroll
      if (mainContainerRef.current && mainContainerRef.current.scrollTop > 0) {
        mainContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // Method 2: Try window scroll
      if (window.pageYOffset > 0 || document.documentElement.scrollTop > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // Method 3: Fallback methods
      setTimeout(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (mainContainerRef.current) {
          mainContainerRef.current.scrollTop = 0;
        }
      }, 100);
    } catch (error) {
      console.error('Scroll error:', error);
      // Fallback to instant scroll
      window.scrollTo(0, 0);
      if (mainContainerRef.current) {
        mainContainerRef.current.scrollTop = 0;
      }
    }
  }, []);

  // Close currency dropdown on outside click / ESC
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!currencyRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!currencyRef.current.contains(e.target)) setCurrencyOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCurrencyOpen(false);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const fetchQuote = useCallback(async (currentVs: string) => {
    setLoading(true);
    try {
      const [priceRes, historyRes] = await Promise.all([
        fetch(`/api/prices?vs=${encodeURIComponent(currentVs)}&base=${encodeURIComponent(baseCoin)}`, { cache: "no-store" }),
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
  }, [baseCoin]);

  // initial and vs change
  useEffect(() => {
    fetchQuote(vs);
  }, [vs, baseCoin, fetchQuote]);

  // Preload components after initial render
  useEffect(() => {
    const timer = setTimeout(preloadComponents, 1000);
    return () => clearTimeout(timer);
  }, []);

  // polling every 60s with optimized interval
  useEffect(() => {
    const id = setInterval(() => {
      // Only fetch if page is visible
      if (!document.hidden) {
        fetchQuote(vs);
      }
    }, 60000);
    return () => clearInterval(id);
  }, [vs, fetchQuote]);

  // recalc fiat when quote or amounts change
  useEffect(() => {
    if (!quote) return;
    const btc = toBtc(btcAmount, unit);
    setFiatAmount(btc * quote.price);
  }, [quote, btcAmount, unit]);

  // keyboard shortcuts: s,u,m,k with optimized handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT') return;
      
      switch (e.key) {
        case "s": setUnit("sats"); break;
        case "u": setUnit("µBTC"); break;
        case "m": setUnit("mBTC"); break;
        case "k": setUnit("BTC"); break;
      }
    };
    
    window.addEventListener("keydown", onKey, { passive: true });
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Track scroll position to show/hide scroll button
  useEffect(() => {
    const handleScroll = () => {
      // Check both window scroll and main container scroll
      const windowScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const containerScrollTop = mainContainerRef.current?.scrollTop || 0;
      const scrollTop = Math.max(windowScrollTop, containerScrollTop);
      
      const shouldShow = scrollTop > 100;
      setShowScrollButton(shouldShow);
      
      // Debug logging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Scroll position:', { windowScrollTop, containerScrollTop, scrollTop, shouldShow });
      }
    };

    // Add scroll listener to both window and main container
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    const mainContainer = mainContainerRef.current;
    if (mainContainer) {
      mainContainer.addEventListener("scroll", handleScroll, { passive: true });
    }

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (mainContainer) {
        mainContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const fetchFiats = useCallback(async () => {
    if (fiatsLoadedRef.current || fiatsLoading) return;
    setFiatsLoading(true);
    try {
      const res = await fetch("/api/fiats", { cache: "force-cache" });
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json?.data)) {
        setFiatsRemote(json.data as FiatCurrency[]);
        fiatsLoadedRef.current = true;
      }
    } finally {
      setFiatsLoading(false);
    }
  }, [fiatsLoading]);

  // Lazy prefetch after initial idle
  useEffect(() => {
    const t = setTimeout(() => {
      fetchFiats();
    }, 1500);
    return () => clearTimeout(t);
  }, [fetchFiats]);

  // Fetch when dropdown first opens
  useEffect(() => {
    if (currencyOpen) fetchFiats();
  }, [currencyOpen, fetchFiats]);

  const combinedFiats: FiatCurrency[] = useMemo(() => {
    const byCode = new Map<string, FiatCurrency>();
    // Remote first to prefer enriched payload from API
    for (const c of fiatsRemote || []) byCode.set(c.code, c);
    for (const c of DEFAULT_FIATS) if (!byCode.has(c.code)) byCode.set(c.code, c);
    return Array.from(byCode.values());
  }, [fiatsRemote]);

  const fiatOptions = useMemo(() => combinedFiats.map((c) => c.code), [combinedFiats]);
  const filteredFiats = useMemo(() => {
    const q = currencyQuery.trim().toLowerCase();
    if (!q) return combinedFiats;
    return combinedFiats.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.nameRu.toLowerCase().includes(q)
    );
  }, [currencyQuery, combinedFiats]);

  const currentPrice = useMemo(() => quote?.price || 0, [quote?.price]);
  
  const priceChange = useMemo(() => {
    if (historyData.length < 2) return 0;
    const firstPrice = historyData[0].price;
    const lastPrice = historyData[historyData.length - 1].price;
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }, [historyData]);
  
  const isPositive = useMemo(() => priceChange >= 0, [priceChange]);

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
    <div className="min-h-screen bg-white dark:bg-slate-900 overflow-x-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-40 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
      <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative z-10 flex flex-col">
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
                      Курс {currentSymbol}
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
                  className="group relative p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center"
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
        <main ref={mainContainerRef} className="px-3 sm:px-4 lg:px-6 xl:px-8 pb-3 sm:pb-4 lg:pb-6">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6 will-change-[height]">
            
            {/* Price Display Card */}
            <div className={`price-card relative overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl xl:rounded-3xl bg-gradient-to-r ${priceCardGradient} shadow-2xl`}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative p-2.5 sm:p-3 lg:p-4 xl:p-6">
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-sm sm:text-base lg:text-xl">{currentSymbol}</span>
                      </div>
                      <div>
                        {loading ? (
                          <div className="price-skeleton h-7 sm:h-9 lg:h-10 xl:h-12 w-32 sm:w-40 lg:w-48 xl:w-56 bg-white/30 rounded animate-pulse" aria-label="Загрузка цены" />
                        ) : (
                          <h2 className="price-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">
                            {currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </h2>
                        )}
                        <p className="text-lg sm:text-xl text-white/90 font-medium">{vs}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {loading ? (
                        <div className="h-5 sm:h-6 w-16 sm:w-20 bg-white/30 rounded-full animate-pulse" aria-hidden="true" />
                      ) : (
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
                      )}
                      <span className="text-white/90 text-xs sm:text-sm">за 24ч</span>
                    </div>
                  </div>
                  
                  <div className="update-info-container mt-4 sm:mt-0 text-left sm:text-right space-y-2 sm:space-y-3 min-h-[60px] sm:min-h-[80px]">
                    <div className="flex items-center space-x-2 text-white/80 min-h-[20px]">
                      <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      {loading ? (
                        <div className="h-3 sm:h-4 w-28 sm:w-32 bg-white/30 rounded animate-pulse" aria-hidden="true" />
                      ) : (
                        <span className="update-time text-xs sm:text-sm font-medium font-mono">Обновлено {lastUpdated}</span>
                      )}
                    </div>
                    
                    <div className="sources-container min-h-[24px] sm:min-h-[28px]">
                      {quote && (
                        <div className="flex flex-wrap gap-1 sm:gap-2 justify-start sm:justify-end">
                          {quote.sources.slice(0, 3).map((source) => (
                            <span
                              key={source.source}
                              className="source-tag px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/20 backdrop-blur-sm rounded text-xs text-white font-medium inline-block"
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
            </div>

            {/* Converter Card */}
            <div className="relative z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl xl:rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-2.5 sm:p-3 lg:p-4 xl:p-6" data-converter>
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2.5 sm:mb-3 lg:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md sm:rounded-lg lg:rounded-xl flex items-center justify-center">
                  <CurrencyDollarIcon className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-slate-900 dark:text-white">Конвертер</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 xl:gap-6">
                {/* Crypto Select */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Криптовалюта
                  </label>
                  <select
                    value={baseCoin}
                    onChange={(e) => setBaseCoin(e.target.value)}
                    className="w-full px-2.5 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md sm:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm"
                    aria-label="Выберите криптовалюту"
                  >
                    {SUPPORTED_CRYPTOS.map(c => (
                      <option key={c.id} value={c.id}>{c.symbol}</option>
                    ))}
                  </select>
                </div>
                {/* BTC Input */}
                <div className="space-y-2">
                  <label htmlFor="btcAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Биткоин
                  </label>
                  <div className="relative">
                    <input
                      ref={inputBtcRef}
                      type="number"
                      id="btcAmount"
                      name="btcAmount"
                      value={btcAmount}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (!isNaN(value)) setBtcAmount(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setBtcAmount(prev => prev + 0.1);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setBtcAmount(prev => Math.max(0, prev - 0.1));
                        }
                      }}
                      className="w-full px-2.5 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 pl-10 sm:pl-12 lg:pl-16 pr-14 sm:pr-16 lg:pr-20 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md sm:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm"
                      placeholder="1.0"
                      step="0.1"
                      min="0"
                    />
                    <div className="absolute left-2 sm:left-2.5 lg:left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {unit}
                    </div>
                    {/* Custom arrow buttons removed by request */}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Клавиши: k — BTC, m — mBTC, u — µBTC, s — сатоши
                  </p>
                </div>

                {/* Unit Select */}
                <div className="space-y-2">
                  <label htmlFor="unitSelect" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Единица
                  </label>
                  <select
                    id="unitSelect"
                    name="unit"
                    value={unit}
                    onChange={(e) => setUnit(parseUnit(e.target.value))}
                    className="w-full px-2.5 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md sm:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm"
                    aria-label="Выберите единицу измерения биткоина"
                  >
                    {(["BTC", "mBTC", "µBTC", "sats"] as BitcoinUnit[]).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
        </div>

                {/* Fiat Amount with inline currency picker */}
                <div className="space-y-2">
                  <label htmlFor="fiatAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Сумма, фиат
                  </label>
                  <div className="relative" ref={currencyRef}>
                    <input
                      type="number"
                      id="fiatAmount"
                      name="fiatAmount"
                      value={fiatAmount.toFixed(2)}
                      disabled={loading}
                      aria-busy={loading}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!isNaN(v) && quote) {
                          const btc = v / quote.price;
                          setBtcAmount(fromBtc(btc, unit));
                        }
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
                      className={`w-full px-2.5 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 pl-16 sm:pl-20 lg:pl-24 pr-14 sm:pr-16 lg:pr-20 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md sm:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm ${loading ? 'text-transparent caret-transparent' : ''}`}
                      placeholder="0.00"
                      step="100"
                      min="0"
                    />
                    {loading && (
                      <div className="absolute left-16 sm:left-20 lg:left-24 right-14 sm:right-16 lg:right-20 top-1/2 -translate-y-1/2 h-3.5 sm:h-4 bg-slate-300/60 dark:bg-slate-500/50 rounded animate-pulse" aria-hidden="true" />
                    )}
                    <button
                      type="button"
                      onClick={() => setCurrencyOpen(v => !v)}
                      className="absolute left-2 sm:left-2.5 lg:left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded-md"
                      aria-haspopup="listbox"
                      aria-expanded={currencyOpen}
                    >
                      {vs}
                    </button>
                    {currencyOpen && (
                      <div className="absolute z-50 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md sm:rounded-lg shadow-lg overflow-hidden">
                        <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                          <input
                            autoFocus
                            type="text"
                            value={currencyQuery}
                            onChange={(e) => setCurrencyQuery(e.target.value)}
                            placeholder="Поиск валюты..."
                            className="w-full px-2.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white text-sm"
                            aria-label="Поиск валюты"
                          />
                        </div>
                        <ul role="listbox" className="max-h-56 overflow-auto">
                          {fiatsLoading && (
                            <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Загрузка...</li>
                          )}
                          {filteredFiats.map((c) => (
                            <li key={c.code}>
                              <button
                                type="button"
                                onClick={() => { setVs(c.code); setCurrencyOpen(false); setCurrencyQuery(""); }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between text-sm"
                                role="option"
                                aria-selected={vs === c.code}
                              >
                                <span className="text-slate-900 dark:text-white font-medium">{c.nameRu}</span>
                                <span className="text-slate-600 dark:text-slate-300 font-mono">{c.code}</span>
                              </button>
                            </li>
                          ))}
                          {filteredFiats.length === 0 && (
                            <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Ничего не найдено</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {/* Custom arrow buttons removed by request */}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts - Hidden on mobile, shown on tablet+ with optimized rendering */}
            <div className="hidden sm:grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <Suspense fallback={
                <div className="loading-placeholder h-64 rounded-lg flex items-center justify-center">
                  <div className="text-slate-600 dark:text-slate-300">Загрузка графика...</div>
                </div>
              }>
                <PriceChart vs={vs} baseSymbol={(SUPPORTED_CRYPTOS.find(c => c.id === baseCoin)?.symbol) || 'BTC'} />
              </Suspense>
              <Suspense fallback={
                <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <div className="text-slate-600 dark:text-slate-300">Загрузка продвинутого графика...</div>
                </div>
              }>
                <AdvancedChart vs={vs} />
              </Suspense>
            </div>

            {/* Mobile Chart - Single chart on mobile with optimized rendering */}
            <div className="sm:hidden">
              <Suspense fallback={
                <div className="loading-placeholder h-64 rounded-lg flex items-center justify-center">
                  <div className="text-slate-600 dark:text-slate-300">Загрузка графика...</div>
                </div>
              }>
                <PriceChart vs={vs} baseSymbol={(SUPPORTED_CRYPTOS.find(c => c.id === baseCoin)?.symbol) || 'BTC'} />
              </Suspense>
            </div>

            {/* Additional Features with optimized rendering */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <Suspense fallback={
                <div className="loading-placeholder h-48 rounded-lg flex items-center justify-center">
                  <div className="text-slate-600 dark:text-slate-300">Загрузка уведомлений...</div>
                </div>
              }>
                <PriceAlerts 
                  currentPrice={currentPrice}
                  currency={vs}
                  onAlertTriggered={handleAlertTriggered}
                />
              </Suspense>
              <Suspense fallback={
                <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <div className="text-slate-600 dark:text-slate-300">Загрузка экспорта...</div>
                </div>
              }>
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
                        Просматривать текущий курс в реальном времени
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
        className={`fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 border border-blue-500/20 ${
          showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        title="Наверх"
        aria-label="Прокрутить наверх"
      >
        <ChevronUpIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
