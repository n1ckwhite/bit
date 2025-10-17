"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import { 
  DocumentArrowDownIcon, 
  ShareIcon, 
  ChevronDownIcon,
  DocumentTextIcon,
  TableCellsIcon
} from "@heroicons/react/24/outline";

interface DataExportProps {
  currentPrice: number;
  currency: string;
  history?: Array<{ timestamp: number; price: number }>;
  className?: string;
}

const DataExport = memo(function DataExport({ currentPrice, currency, history, className }: DataExportProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    setOpen(!open);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const exportCurrentPrice = useCallback((format: "json" | "csv") => {
    const data = {
      timestamp: new Date().toISOString(),
      price: currentPrice,
      currency,
      source: "Bitcoin Price Converter",
    };

    if (format === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `btc-price-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csv = `Timestamp,Price,Currency,Source\n${data.timestamp},${data.price},${data.currency},${data.source}`;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `btc-price-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [currentPrice, currency]);

  const exportHistory = useCallback((format: "json" | "csv") => {
    if (!history || history.length === 0) {
      alert("Нет исторических данных для экспорта");
      return;
    }

    if (format === "json") {
      const data = {
        currency,
        data: history.map(point => ({
          timestamp: new Date(point.timestamp * 1000).toISOString(),
          price: point.price,
        })),
        exportedAt: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `btc-history-${currency.toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csv = [
        "Timestamp,Price,Currency",
        ...history.map(point => 
          `${new Date(point.timestamp * 1000).toISOString()},${point.price},${currency}`
        ),
      ].join("\n");
      
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `btc-history-${currency.toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [history, currency]);

  const shareCurrentPrice = useCallback(async () => {
    const text = `₿ Bitcoin: ${currentPrice.toLocaleString()} ${currency}\n\nКурс обновлён в реальном времени на Bitcoin Price Converter`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Курс",
          text,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        alert("Цена скопирована в буфер обмена");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  }, [currentPrice, currency]);

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl xl:rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-2.5 sm:p-3 lg:p-4 xl:p-6 stable-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
            <DocumentArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Экспорт данных</h3>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={shareCurrentPrice}
            className="group relative p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 flex items-center justify-center"
            title="Поделиться текущей ценой"
            aria-label="Поделиться текущей ценой"
          >
            <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleClick}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Экспорт</span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            
            {open && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 py-2 z-10">
                <button
                  onClick={() => { exportCurrentPrice("json"); handleClose(); }}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <DocumentTextIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Текущая цена (JSON)</span>
                </button>
                <button
                  onClick={() => { exportCurrentPrice("csv"); handleClose(); }}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <TableCellsIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Текущая цена (CSV)</span>
                </button>
                {history && history.length > 0 && (
                  <>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                    <button
                      onClick={() => { exportHistory("json"); handleClose(); }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <DocumentTextIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">История (JSON)</span>
                    </button>
                    <button
                      onClick={() => { exportHistory("csv"); handleClose(); }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <TableCellsIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">История (CSV)</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Текущая цена</h4>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => exportCurrentPrice("json")}
              className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all duration-200"
            >
              <DocumentTextIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">JSON</span>
            </button>
            <button
              onClick={() => exportCurrentPrice("csv")}
              className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all duration-200"
            >
              <TableCellsIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">CSV</span>
            </button>
          </div>
        </div>

        {history && history.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Исторические данные ({history.length} точек)
            </h4>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => exportHistory("json")}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all duration-200"
              >
                <DocumentTextIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">JSON</span>
              </button>
              <button
                onClick={() => exportHistory("csv")}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all duration-200"
              >
                <TableCellsIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">CSV</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Данные экспортируются в формате UTC. JSON содержит метаданные, CSV — только цены.
          </p>
        </div>
      </div>
    </div>
  );
});

export default DataExport;
