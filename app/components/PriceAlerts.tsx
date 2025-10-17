"use client";

import { useState, useEffect } from "react";
import { 
  BellIcon, 
  PlusIcon, 
  TrashIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { BitcoinUnit } from "../lib/units";

type PriceAlert = {
  id: string;
  targetPrice: number;
  currency: string;
  unit: BitcoinUnit;
  isAbove: boolean; // true = alert when price goes above, false = below
  isActive: boolean;
  createdAt: string;
};

interface PriceAlertsProps {
  currentPrice: number;
  currency: string;
  onAlertTriggered: (alert: PriceAlert) => void;
}

export default function PriceAlerts({ currentPrice, currency, onAlertTriggered }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [open, setOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    targetPrice: "",
    isAbove: true,
    unit: "BTC" as BitcoinUnit,
  });
  const [notification, setNotification] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  // Load alerts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("priceAlerts");
    if (saved) {
      try {
        setAlerts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load alerts:", e);
      }
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem("priceAlerts", JSON.stringify(alerts));
  }, [alerts]);

  // Check for triggered alerts
  useEffect(() => {
    const triggered = alerts.filter(alert => 
      alert.isActive && 
      alert.currency === currency &&
      ((alert.isAbove && currentPrice >= alert.targetPrice) || 
       (!alert.isAbove && currentPrice <= alert.targetPrice))
    );

    triggered.forEach(alert => {
      onAlertTriggered(alert);
      // Deactivate triggered alert
      setAlerts(prev => prev.map(a => 
        a.id === alert.id ? { ...a, isActive: false } : a
      ));
    });
  }, [currentPrice, currency, alerts, onAlertTriggered]);

  const handleAddAlert = () => {
    if (!newAlert.targetPrice || Number(newAlert.targetPrice) <= 0) {
      setNotification({ message: "Введите корректную цену", severity: "error" });
      return;
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      targetPrice: Number(newAlert.targetPrice),
      currency,
      unit: newAlert.unit,
      isAbove: newAlert.isAbove,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setAlerts(prev => [...prev, alert]);
    setNewAlert({ targetPrice: "", isAbove: true, unit: "BTC" });
    setOpen(false);
    setNotification({ message: "Уведомление добавлено", severity: "success" });
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    setNotification({ message: "Уведомление удалено", severity: "success" });
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const activeAlerts = alerts.filter(alert => alert.currency === currency && alert.isActive);
  const triggeredAlerts = alerts.filter(alert => alert.currency === currency && !alert.isActive);

  return (
    <>
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl xl:rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-2.5 sm:p-3 lg:p-4 xl:p-6 min-h-80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <BellIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Уведомления о цене</h3>
          </div>
          
          <button
            onClick={() => setOpen(true)}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Добавить</span>
          </button>
        </div>

        {activeAlerts.length === 0 && triggeredAlerts.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <BellIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Нет уведомлений. Добавьте первое уведомление о достижении цены.
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {activeAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Активные ({activeAlerts.length})
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  {activeAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl border border-blue-200/50 dark:border-blue-800/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {alert.isAbove ? "Выше" : "Ниже"} {alert.targetPrice.toLocaleString()} {alert.currency}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium whitespace-nowrap">
                          Активно
                        </span>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                          aria-label="Удалить уведомление"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {triggeredAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Сработавшие ({triggeredAlerts.length})
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  {triggeredAlerts.slice(0, 3).map(alert => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl border border-green-200/50 dark:border-green-800/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {alert.isAbove ? "Выше" : "Ниже"} {alert.targetPrice.toLocaleString()} {alert.currency}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full text-xs font-medium whitespace-nowrap">
                          Сработало
                        </span>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                          aria-label="Удалить уведомление"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Alert Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Добавить уведомление</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                aria-label="Закрыть модальное окно"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Целевая цена
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newAlert.targetPrice}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, targetPrice: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 sm:pr-16 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white text-sm sm:text-base"
                    placeholder="0.00"
                  />
                  <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                    {currency}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Текущая цена: {currentPrice.toLocaleString()} {currency}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Условие срабатывания
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setNewAlert(prev => ({ ...prev, isAbove: true }))}
                    className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      newAlert.isAbove
                        ? "bg-amber-700 text-white shadow-lg"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    Выше цены
                  </button>
                  <button
                    onClick={() => setNewAlert(prev => ({ ...prev, isAbove: false }))}
                    className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      !newAlert.isAbove
                        ? "bg-amber-700 text-white shadow-lg"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    Ниже цены
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-all duration-200"
              >
                Отмена
              </button>
              <button
                onClick={handleAddAlert}
                className="flex-1 px-3 sm:px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm ${
            notification.severity === "success" 
              ? "bg-green-600 text-white" 
              : "bg-red-700 text-white"
          }`}>
            {notification.severity === "success" ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors duration-200"
              aria-label="Закрыть уведомление"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
