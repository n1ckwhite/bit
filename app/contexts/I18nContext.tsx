"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Locale = "en" | "ru" | "de" | "fr" | "es" | "tr" | "zh" | "it" | "pl" | "cs" | "nl" | "pt" | "ja";

type Dict = Record<string, string>;

const DICTS: Record<Locale, Dict> = {
  en: {
    title: "Rate {sym}",
    converter: "Converter",
    bitcoin: "Bitcoin",
    unit: "Unit",
    fiatAmount: "Fiat amount",
    currency: "Currency",
    updated: "Updated",
    hours24: "24h",
    days30: "30d",
    priceChart: "{sym} price chart",
    loadingChart: "Loading chart...",
    for24h: "in 24 hours",
    for30d: "in 30 days",
    exportData: "Export data",
    export: "Export",
    sharePrice: "Share current price",
    currentPrice: "Current price",
    history: "History",
    historyPoints: "Historical data ({n} points)",
    json: "JSON",
    csv: "CSV",
    noHistory: "No historical data to export",
    copied: "Copied to clipboard",
    copyFailed: "Copy failed",
    heroSubtitle: "Converter and real‑time chart",
    infoMainTitle: "This site lets you:",
    bulletView: "View live crypto prices",
    bulletConvert: "Convert any amount to your preferred currency and back",
    desc_p1: "Bitcoin is a digital currency that allows sending money online without intermediaries.",
    learnMore: "Learn more",
    usageTitle: "Usage",
    usage_p1: "Keep the site open in a tab to monitor price.",
    usage_p2: "Use inputs to see equivalent amounts in crypto and fiat.",
    usage_p3: "Switch units (BTC, mBTC, µBTC, sats) and keyboard shortcuts.",
    usage_p4: "The site is optimized for mobile — add to home screen.",
    dataTitle: "Data",
    data_p: "Prices are aggregated from multiple markets and updated every minute. Default shows volume‑weighted average.",
    contactTitle: "Contact",
    contact_p: "Reach us on Twitter/X for suggestions, bug reports or ads.",
    disclaimerTitle: "Disclaimer",
    disclaimer_p: "Exchange rates are for informational purposes only and may change without notice.",
  },
  ru: {
    title: "Курс {sym}",
    converter: "Конвертер",
    bitcoin: "Биткоин",
    unit: "Единица",
    fiatAmount: "Сумма, фиат",
    currency: "Валюта",
    updated: "Обновлено",
    hours24: "24ч",
    days30: "30д",
    priceChart: "График цены {sym}",
    loadingChart: "Загрузка графика...",
    for24h: "за 24 часа",
    for30d: "за 30 дней",
    exportData: "Экспорт данных",
    export: "Экспорт",
    sharePrice: "Поделиться текущей ценой",
    currentPrice: "Текущая цена",
    history: "История",
    historyPoints: "Исторические данные ({n} точек)",
    json: "JSON",
    csv: "CSV",
    noHistory: "Нет исторических данных для экспорта",
    copied: "Скопировано в буфер",
    copyFailed: "Не удалось скопировать",
    heroSubtitle: "Конвертер и график в реальном времени",
    infoMainTitle: "Этот сайт позволяет вам:",
    bulletView: "Просматривать текущие цены криптовалют в реальном времени",
    bulletConvert: "Конвертировать любую сумму в предпочитаемую валюту и обратно",
    desc_p1: "Биткоин — это цифровая валюта, которая позволяет отправлять деньги онлайн без посредников.",
    learnMore: "Подробнее",
    usageTitle: "Использование",
    usage_p1: "Оставьте сайт открытым во вкладке для мониторинга цены.",
    usage_p2: "Используйте поля ввода для просмотра эквивалентных сумм в криптовалюте и фиате.",
    usage_p3: "Переключайте единицы (BTC, mBTC, µBTC, сатоши) и используйте горячие клавиши.",
    usage_p4: "Сайт оптимизирован для мобильных устройств. Добавьте его на главный экран.",
    dataTitle: "Данные",
    data_p: "Данные о ценах собираются с множественных рынков и обновляются каждую минуту. По умолчанию показывается средневзвешенная по объёму цена.",
    contactTitle: "Контакт",
    contact_p: "Свяжитесь с нами в Twitter/X для предложений, сообщений об ошибках или рекламы.",
    disclaimerTitle: "Отказ от ответственности",
    disclaimer_p: "Курсы валют предоставляются исключительно в информационных целях и могут изменяться без предварительного уведомления.",
  },
  de: { title: "Kurs {sym}", converter: "Konverter", bitcoin: "Bitcoin", unit: "Einheit", fiatAmount: "Fiat-Betrag", currency: "Währung", updated: "Aktualisiert", hours24: "24h", days30: "30T", priceChart: "Preisdiagramm {sym}" },
  fr: { title: "Cours {sym}", converter: "Convertisseur", bitcoin: "Bitcoin", unit: "Unité", fiatAmount: "Montant fiat", currency: "Devise", updated: "Mis à jour", hours24: "24h", days30: "30j", priceChart: "Graphique du prix {sym}" },
  es: { title: "Precio {sym}", converter: "Convertidor", bitcoin: "Bitcoin", unit: "Unidad", fiatAmount: "Monto fiat", currency: "Moneda", updated: "Actualizado", hours24: "24h", days30: "30d", priceChart: "Gráfico de {sym}" },
  tr: { title: "{sym} kuru", converter: "Dönüştürücü", bitcoin: "Bitcoin", unit: "Birim", fiatAmount: "Fiat tutarı", currency: "Para birimi", updated: "Güncellendi", hours24: "24s", days30: "30g", priceChart: "{sym} fiyat grafiği" },
  zh: { title: "{sym} 汇率", converter: "转换器", bitcoin: "比特币", unit: "单位", fiatAmount: "法币金额", currency: "货币", updated: "已更新", hours24: "24小时", days30: "30天", priceChart: "{sym} 价格图" },
  it: { title: "Tasso {sym}", converter: "Convertitore", bitcoin: "Bitcoin", unit: "Unità", fiatAmount: "Importo fiat", currency: "Valuta", updated: "Aggiornato", hours24: "24h", days30: "30g", priceChart: "Grafico prezzo {sym}" },
  pl: { title: "Kurs {sym}", converter: "Przelicznik", bitcoin: "Bitcoin", unit: "Jednostka", fiatAmount: "Kwota fiat", currency: "Waluta", updated: "Zaktualizowano", hours24: "24h", days30: "30d", priceChart: "Wykres ceny {sym}" },
  cs: { title: "Kurz {sym}", converter: "Převodník", bitcoin: "Bitcoin", unit: "Jednotka", fiatAmount: "Fiat částka", currency: "Měna", updated: "Aktualizováno", hours24: "24h", days30: "30d", priceChart: "Graf ceny {sym}" },
  nl: { title: "Koers {sym}", converter: "Converter", bitcoin: "Bitcoin", unit: "Eenheid", fiatAmount: "Fiatbedrag", currency: "Valuta", updated: "Bijgewerkt", hours24: "24u", days30: "30d", priceChart: "{sym} koersgrafiek" },
  pt: { title: "Cotação {sym}", converter: "Conversor", bitcoin: "Bitcoin", unit: "Unidade", fiatAmount: "Valor fiat", currency: "Moeda", updated: "Atualizado", hours24: "24h", days30: "30d", priceChart: "Gráfico de preço {sym}" },
  ja: { title: "{sym} レート", converter: "コンバーター", bitcoin: "ビットコイン", unit: "単位", fiatAmount: "法定通貨額", currency: "通貨", updated: "更新", hours24: "24時間", days30: "30日", priceChart: "{sym} 価格チャート" },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: keyof typeof DICTS["en"], vars?: Record<string, string>) => string;
  supported: Locale[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>((typeof navigator !== "undefined" && (navigator.language?.slice(0,2) as Locale)) || "en");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("locale") as Locale | null) : null;
    if (saved && DICTS[saved]) setLocaleState(saved);
    if (typeof document !== "undefined") document.documentElement.lang = (saved || locale);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem("locale", l);
    if (typeof document !== "undefined") document.documentElement.lang = l;
    try {
      document.cookie = `locale=${l}; path=/; max-age=${60*60*24*365}`;
    } catch {}
  }, []);

  const t = useCallback((key: keyof typeof DICTS["en"], vars?: Record<string, string>) => {
    const dict = DICTS[locale] || DICTS.en;
    let str = dict[key] || DICTS.en[key] || String(key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, v);
    }
    return str;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t, supported: Object.keys(DICTS) as Locale[] }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("I18nContext not found");
  return ctx;
}


