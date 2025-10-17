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
    time: "Time",
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
    crypto: "Cryptocurrency",
    searchCurrency: "Search currency...",
    keyboardHint: "Keys: k — BTC, m — mBTC, u — µBTC, s — sats",
    // fiat names
    fiat_USD: "US Dollar",
    fiat_EUR: "Euro",
    fiat_GBP: "British Pound",
    fiat_CAD: "Canadian Dollar",
    fiat_AUD: "Australian Dollar",
    fiat_SEK: "Swedish Krona",
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
    // Additional keys for page.tsx
    priceAlert: "Price Alert",
    priceReached: "BTC price reached {price} {currency}",
    refreshData: "Refresh data",
    loadingPrice: "Loading price",
    selectCrypto: "Select cryptocurrency",
    selectUnit: "Select Bitcoin unit",
    loadingAdvancedChart: "Loading advanced chart...",
    loadingAlerts: "Loading alerts...",
    loadingExport: "Loading export...",
    conversionUnits: "Conversion to smaller units: Use units",
    conversionUnitsDesc: "sats (s), microbitcoins (μ), millibitcoins (m) and hotkeys (S, u, m, k) for switching.",
    sats: "sats",
    microbtc: "microbitcoins",
    millibtc: "millibitcoins",
    andHotkeys: "and hotkeys",
    forSwitching: "for switching",
    scrollToTop: "Scroll to top",
    noResults: "No results found",
    loading: "Loading...",
    // PriceAlerts keys
    priceAlerts: "Price alerts",
    addAlert: "Add",
    noAlertsYet: "No alerts yet. Add your first price alert.",
    active: "Active",
    triggered: "Triggered",
    above: "Above",
    below: "Below",
    addPriceAlert: "Add alert",
    closeModal: "Close modal",
    targetPrice: "Target price",
    triggerCondition: "Trigger condition",
    abovePrice: "Above price",
    belowPrice: "Below price",
    cancel: "Cancel",
    add: "Add",
    enterValidPrice: "Enter a valid price",
    alertAdded: "Alert added",
    alertDeleted: "Alert deleted",
    deleteAlert: "Delete alert",
    closeNotification: "Close notification",
    dark: "Dark",
    light: "Light",
    themeTooltip: "{current} theme. Click to switch to {next}",
    ma7: "MA7",
    days7: "7d",
    days14: "14d",
    movingAverage7: "7-hour moving average",
    for7days: "for 7 days",
    for14days: "for 14 days",
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
    time: "Время",
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
    crypto: "Криптовалюта",
    searchCurrency: "Поиск валюты...",
    keyboardHint: "Клавиши: k — BTC, m — mBTC, u — µBTC, s — сатоши",
    fiat_USD: "Доллар США",
    fiat_EUR: "Евро",
    fiat_GBP: "Фунт стерлингов",
    fiat_CAD: "Канадский доллар",
    fiat_AUD: "Австралийский доллар",
    fiat_SEK: "Шведская крона",
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
    // Additional keys for page.tsx
    priceAlert: "Уведомление о цене",
    priceReached: "Цена BTC достигла {price} {currency}",
    refreshData: "Обновить данные",
    loadingPrice: "Загрузка цены",
    selectCrypto: "Выберите криптовалюту",
    selectUnit: "Выберите единицу измерения биткоина",
    loadingAdvancedChart: "Загрузка продвинутого графика...",
    loadingAlerts: "Загрузка уведомлений...",
    loadingExport: "Загрузка экспорта...",
    conversionUnits: "Конвертация в меньшие единицы: Используйте единицы",
    conversionUnitsDesc: "сатоши (s), микробиткоины (μ), миллибиткоины (m) и горячие клавиши (S, u, m, k) для переключения.",
    sats: "сатоши",
    microbtc: "микробиткоины",
    millibtc: "миллибиткоины",
    andHotkeys: "и горячие клавиши",
    forSwitching: "для переключения",
    scrollToTop: "Наверх",
    noResults: "Ничего не найдено",
    loading: "Загрузка...",
    // PriceAlerts keys
    priceAlerts: "Уведомления о цене",
    addAlert: "Добавить",
    noAlertsYet: "Нет уведомлений. Добавьте первое уведомление о достижении цены.",
    active: "Активно",
    triggered: "Сработало",
    above: "Выше",
    below: "Ниже",
    addPriceAlert: "Добавить уведомление",
    closeModal: "Закрыть модальное окно",
    targetPrice: "Целевая цена",
    triggerCondition: "Условие срабатывания",
    abovePrice: "Выше цены",
    belowPrice: "Ниже цены",
    cancel: "Отмена",
    add: "Добавить",
    enterValidPrice: "Введите корректную цену",
    alertAdded: "Уведомление добавлено",
    alertDeleted: "Уведомление удалено",
    deleteAlert: "Удалить уведомление",
    closeNotification: "Закрыть уведомление",
    dark: "Тёмная",
    light: "Светлая",
    themeTooltip: "{current} тема. Клик — переключить на {next}",
    ma7: "MA7",
    days7: "7д",
    days14: "14д",
    movingAverage7: "Скользящая средняя 7 часов",
    for7days: "за 7 дней",
    for14days: "за 14 дней",
  },
  de: { title: "Kurs {sym}", converter: "Konverter", bitcoin: "Bitcoin", unit: "Einheit", fiatAmount: "Fiat-Betrag", currency: "Währung", updated: "Aktualisiert", hours24: "24h", days30: "30T", priceChart: "{sym}-Kursdiagramm", loadingChart: "Diagramm wird geladen...", time: "Zeit", for24h: "in 24 Stunden", for30d: "in 30 Tagen", dark: "Dunkel", light: "Hell", themeTooltip: "{current} Thema. Klick zum Wechseln zu {next}", ma7: "MA7", days7: "7T", days14: "14T", movingAverage7: "7-Stunden gleitender Durchschnitt", for7days: "für 7 Tage", for14days: "für 14 Tage", exportData: "Daten exportieren", export: "Export", sharePrice: "Aktuellen Preis teilen", currentPrice: "Aktueller Preis", history: "Historie", historyPoints: "Historische Daten ({n} Punkte)", json: "JSON", csv: "CSV", noHistory: "Keine historischen Daten", copied: "In die Zwischenablage kopiert", copyFailed: "Kopieren fehlgeschlagen", crypto: "Kryptowährung", searchCurrency: "Währung suchen...", keyboardHint: "Tasten: k — BTC, m — mBTC, u — µBTC, s — sats", fiat_USD: "US-Dollar", fiat_EUR: "Euro", fiat_GBP: "Britisches Pfund", fiat_CAD: "Kanadischer Dollar", fiat_AUD: "Australischer Dollar", fiat_SEK: "Schwedische Krone", heroSubtitle: "Konverter und Echtzeitdiagramm", infoMainTitle: "Diese Seite ermöglicht:", bulletView: "Live-Kurse ansehen", bulletConvert: "Beliebige Beträge umrechnen", desc_p1: "Bitcoin ist digitales Geld ohne Zwischenhändler.", learnMore: "Mehr erfahren", usageTitle: "Verwendung", usage_p1: "Seite geöffnet lassen, um Preise zu beobachten.", usage_p2: "Eingaben nutzen, um Gegenwerte zu sehen.", usage_p3: "Einheiten wechseln (BTC, mBTC, µBTC, sats) und Shortcuts.", usage_p4: "Für Mobilgeräte optimiert — zum Startbildschirm hinzufügen.", dataTitle: "Daten", data_p: "Kurse von mehreren Märkten, Aktualisierung minütlich. Standard: volumen­gewichteter Durchschnitt.", contactTitle: "Kontakt", contact_p: "Schreiben Sie uns auf Twitter/X.", disclaimerTitle: "Haftungsausschluss", disclaimer_p: "Wechselkurse sind nur zu Informationszwecken.", priceAlert: "Preisalarm", priceReached: "BTC-Preis erreichte {price} {currency}", refreshData: "Daten aktualisieren", loadingPrice: "Preis wird geladen", selectCrypto: "Kryptowährung auswählen", selectUnit: "Bitcoin-Einheit auswählen", loadingAdvancedChart: "Erweitertes Diagramm wird geladen...", loadingAlerts: "Alarme werden geladen...", loadingExport: "Export wird geladen...", conversionUnits: "Umrechnung in kleinere Einheiten: Verwenden Sie Einheiten", conversionUnitsDesc: "Sats (s), Mikrobitcoins (μ), Millibitcoins (m) und Tastenkürzel (S, u, m, k) zum Wechseln.", sats: "Sats", microbtc: "Mikrobitcoins", millibtc: "Millibitcoins", andHotkeys: "und Tastenkürzel", forSwitching: "zum Wechseln", scrollToTop: "Nach oben", noResults: "Keine Ergebnisse gefunden", loading: "Wird geladen...", priceAlerts: "Preisalarme", addAlert: "Hinzufügen", noAlertsYet: "Noch keine Alarme. Fügen Sie Ihren ersten Preisalarm hinzu.", active: "Aktiv", triggered: "Ausgelöst", above: "Über", below: "Unter", addPriceAlert: "Alarm hinzufügen", closeModal: "Modal schließen", targetPrice: "Zielpreis", triggerCondition: "Auslösebedingung", abovePrice: "Über Preis", belowPrice: "Unter Preis", cancel: "Abbrechen", add: "Hinzufügen", enterValidPrice: "Geben Sie einen gültigen Preis ein", alertAdded: "Alarm hinzugefügt", alertDeleted: "Alarm gelöscht", deleteAlert: "Alarm löschen", closeNotification: "Benachrichtigung schließen" },
  fr: { title: "Cours {sym}", converter: "Convertisseur", bitcoin: "Bitcoin", unit: "Unité", fiatAmount: "Montant fiat", currency: "Devise", updated: "Mis à jour", hours24: "24h", days30: "30j", priceChart: "Graphique du prix {sym}", loadingChart: "Chargement du graphique...", time: "Temps", for24h: "en 24 h", for30d: "en 30 j", dark: "Sombre", light: "Clair", themeTooltip: "Thème {current}. Cliquez pour passer à {next}", ma7: "MA7", days7: "7j", days14: "14j", movingAverage7: "Moyenne mobile 7 heures", for7days: "pour 7 jours", for14days: "pour 14 jours", exportData: "Exporter les données", export: "Exporter", sharePrice: "Partager le prix actuel", currentPrice: "Prix actuel", history: "Historique", historyPoints: "Données historiques ({n} points)", json: "JSON", csv: "CSV", noHistory: "Pas de données historiques", copied: "Copié", copyFailed: "Échec de la copie", crypto: "Cryptomonnaie", searchCurrency: "Rechercher une devise...", keyboardHint: "Raccourcis: k — BTC, m — mBTC, u — µBTC, s — sats", fiat_USD: "Dollar américain", fiat_EUR: "Euro", fiat_GBP: "Livre sterling", fiat_CAD: "Dollar canadien", fiat_AUD: "Dollar australien", fiat_SEK: "Couronne suédoise", heroSubtitle: "Convertisseur et graphique en temps réel", infoMainTitle: "Ce site vous permet :", bulletView: "Voir les prix en direct", bulletConvert: "Convertir tout montant dans votre devise", desc_p1: "Le Bitcoin est une monnaie numérique sans intermédiaires.", learnMore: "En savoir plus", usageTitle: "Utilisation", usage_p1: "Gardez l'onglet ouvert pour suivre le prix.", usage_p2: "Utilisez les champs pour voir les équivalents.", usage_p3: "Changez d'unité et utilisez les raccourcis.", usage_p4: "Optimisé mobile — ajoutez à l'écran d'accueil.", dataTitle: "Données", data_p: "Données agrégées et mises à jour chaque minute.", contactTitle: "Contact", contact_p: "Contactez-nous sur Twitter/X.", disclaimerTitle: "Avertissement", disclaimer_p: "Taux fournis à titre indicatif.", priceAlert: "Alerte de prix", priceReached: "Le prix BTC a atteint {price} {currency}", refreshData: "Actualiser les données", loadingPrice: "Chargement du prix", selectCrypto: "Sélectionner la cryptomonnaie", selectUnit: "Sélectionner l'unité Bitcoin", loadingAdvancedChart: "Chargement du graphique avancé...", loadingAlerts: "Chargement des alertes...", loadingExport: "Chargement de l'export...", conversionUnits: "Conversion en unités plus petites: Utilisez les unités", conversionUnitsDesc: "sats (s), microbitcoins (μ), millibitcoins (m) et raccourcis (S, u, m, k) pour changer.", sats: "sats", microbtc: "microbitcoins", millibtc: "millibitcoins", andHotkeys: "et raccourcis", forSwitching: "pour changer", scrollToTop: "Haut de page", noResults: "Aucun résultat trouvé", loading: "Chargement...", priceAlerts: "Alertes de prix", addAlert: "Ajouter", noAlertsYet: "Aucune alerte pour le moment. Ajoutez votre première alerte de prix.", active: "Actif", triggered: "Déclenché", above: "Au-dessus", below: "En dessous", addPriceAlert: "Ajouter une alerte", closeModal: "Fermer la fenêtre", targetPrice: "Prix cible", triggerCondition: "Condition de déclenchement", abovePrice: "Au-dessus du prix", belowPrice: "En dessous du prix", cancel: "Annuler", add: "Ajouter", enterValidPrice: "Entrez un prix valide", alertAdded: "Alerte ajoutée", alertDeleted: "Alerte supprimée", deleteAlert: "Supprimer l'alerte", closeNotification: "Fermer la notification" },
  es: { title: "Precio {sym}", converter: "Convertidor", bitcoin: "Bitcoin", unit: "Unidad", fiatAmount: "Monto fiat", currency: "Moneda", updated: "Actualizado", hours24: "24h", days30: "30d", priceChart: "Gráfico de {sym}", loadingChart: "Cargando gráfico...", time: "Tiempo", for24h: "en 24 horas", for30d: "en 30 días", dark: "Oscuro", light: "Claro", themeTooltip: "Tema {current}. Click para cambiar a {next}", ma7: "MA7", days7: "7d", days14: "14d", movingAverage7: "Media móvil 7 horas", for7days: "por 7 días", for14days: "por 14 días", exportData: "Exportar datos", export: "Exportar", sharePrice: "Compartir precio actual", currentPrice: "Precio actual", history: "Historial", historyPoints: "Datos históricos ({n} puntos)", json: "JSON", csv: "CSV", noHistory: "No hay datos históricos", copied: "Copiado", copyFailed: "Error al copiar", crypto: "Criptomoneda", searchCurrency: "Buscar moneda...", keyboardHint: "Teclas: k — BTC, m — mBTC, u — µBTC, s — sats", fiat_USD: "Dólar estadounidense", fiat_EUR: "Euro", fiat_GBP: "Libra esterlina", fiat_CAD: "Dólar canadiense", fiat_AUD: "Dólar australiano", fiat_SEK: "Corona sueca", heroSubtitle: "Convertidor y gráfico en tiempo real", infoMainTitle: "Este sitio te permite:", bulletView: "Ver precios en vivo", bulletConvert: "Convertir cualquier monto a tu moneda", desc_p1: "Bitcoin es dinero digital sin intermediarios.", learnMore: "Más información", usageTitle: "Uso", usage_p1: "Deja el sitio abierto para monitorear.", usage_p2: "Usa los campos para ver equivalencias.", usage_p3: "Cambia unidades y atajos.", usage_p4: "Optimizado para móvil — añade al inicio.", dataTitle: "Datos", data_p: "Precios agregados y actualizados cada minuto.", contactTitle: "Contacto", contact_p: "Escríbenos en Twitter/X.", disclaimerTitle: "Aviso", disclaimer_p: "Tipos de cambio solo informativos.", priceAlerts: "Alertas de precio", addAlert: "Agregar", noAlertsYet: "Sin alertas aún. Agrega tu primera alerta de precio.", active: "Activo", triggered: "Activado", above: "Arriba", below: "Abajo", addPriceAlert: "Agregar alerta", closeModal: "Cerrar ventana", targetPrice: "Precio objetivo", triggerCondition: "Condición de activación", abovePrice: "Arriba del precio", belowPrice: "Abajo del precio", cancel: "Cancelar", add: "Agregar", enterValidPrice: "Ingresa un precio válido", alertAdded: "Alerta agregada", alertDeleted: "Alerta eliminada", deleteAlert: "Eliminar alerta", closeNotification: "Cerrar notificación" },
  tr: { title: "{sym} kuru", converter: "Dönüştürücü", bitcoin: "Bitcoin", unit: "Birim", fiatAmount: "Fiat tutarı", currency: "Para birimi", updated: "Güncellendi", hours24: "24s", days30: "30g", priceChart: "{sym} fiyat grafiği", loadingChart: "Grafik yükleniyor...", time: "Zaman", for24h: "24 saatte", for30d: "30 günde", dark: "Koyu", light: "Açık", themeTooltip: "{current} tema. {next} için tıklayın", ma7: "MA7", days7: "7g", days14: "14g", movingAverage7: "7 saatlik hareketli ortalama", for7days: "7 gün için", for14days: "14 gün için", exportData: "Veri dışa aktar", export: "Dışa aktar", sharePrice: "Güncel fiyatı paylaş", currentPrice: "Güncel fiyat", history: "Geçmiş", historyPoints: "Geçmiş veriler ({n})", json: "JSON", csv: "CSV", noHistory: "Geçmiş yok", copied: "Kopyalandı", copyFailed: "Kopyalama başarısız", crypto: "Kripto para", searchCurrency: "Para birimi ara...", keyboardHint: "Kısayollar: k — BTC, m — mBTC, u — µBTC, s — sats", fiat_USD: "ABD Doları", fiat_EUR: "Euro", fiat_GBP: "İngiliz Sterlini", fiat_CAD: "Kanada Doları", fiat_AUD: "Avustralya Doları", fiat_SEK: "İsveç Kronu", heroSubtitle: "Dönüştürücü ve canlı grafik", infoMainTitle: "Bu site şunları sağlar:", bulletView: "Canlı fiyatları görüntüle", bulletConvert: "Herhangi bir tutarı dönüştür", desc_p1: "Bitcoin aracı olmadan dijital paradır.", learnMore: "Daha fazla bilgi", usageTitle: "Kullanım", usage_p1: "Fiyatı izlemek için sekmeyi açık bırakın.", usage_p2: "Eşdeğerleri görmek için alanları kullanın.", usage_p3: "Birimleri ve kısayolları değiştirin.", usage_p4: "Mobil için optimize edilmiştir.", dataTitle: "Veriler", data_p: "Veriler dakikada bir güncellenir.", contactTitle: "İletişim", contact_p: "Twitter/X üzerinden ulaşın.", disclaimerTitle: "Sorumluluk reddi", disclaimer_p: "Kurlar bilgilendirme amaçlıdır.", priceAlerts: "Fiyat uyarıları", addAlert: "Ekle", noAlertsYet: "Henüz uyarı yok. İlk fiyat uyarınızı ekleyin.", active: "Aktif", triggered: "Tetiklendi", above: "Üstünde", below: "Altında", addPriceAlert: "Uyarı ekle", closeModal: "Pencereyi kapat", targetPrice: "Hedef fiyat", triggerCondition: "Tetikleme koşulu", abovePrice: "Fiyatın üstünde", belowPrice: "Fiyatın altında", cancel: "İptal", add: "Ekle", enterValidPrice: "Geçerli bir fiyat girin", alertAdded: "Uyarı eklendi", alertDeleted: "Uyarı silindi", deleteAlert: "Uyarıyı sil", closeNotification: "Bildirimi kapat" },
  zh: { title: "{sym} 汇率", converter: "转换器", bitcoin: "比特币", unit: "单位", fiatAmount: "法币金额", currency: "货币", updated: "已更新", hours24: "24小时", days30: "30天", priceChart: "{sym} 价格图", loadingChart: "加载图表...", time: "时间", for24h: "24小时内", for30d: "30天内", dark: "深色", light: "浅色", themeTooltip: "{current} 主题。点击切换到 {next}", ma7: "MA7", days7: "7天", days14: "14天", movingAverage7: "7小时移动平均", for7days: "7天内", for14days: "14天内", exportData: "导出数据", export: "导出", sharePrice: "分享当前价格", currentPrice: "当前价格", history: "历史", historyPoints: "历史数据（{n} 条）", json: "JSON", csv: "CSV", noHistory: "无历史数据", copied: "已复制", copyFailed: "复制失败", crypto: "加密货币", searchCurrency: "搜索货币...", keyboardHint: "快捷键: k — BTC, m — mBTC, u — µBTC, s — sats", fiat_USD: "美元", fiat_EUR: "欧元", fiat_GBP: "英镑", fiat_CAD: "加元", fiat_AUD: "澳元", fiat_SEK: "瑞典克朗", heroSubtitle: "转换器与实时图表", infoMainTitle: "本网站可：", bulletView: "查看实时价格", bulletConvert: "转换任意金额", desc_p1: "比特币是无需中介的数字货币。", learnMore: "了解更多", usageTitle: "用法", usage_p1: "保持页面打开以监控价格。", usage_p2: "使用输入查看等值。", usage_p3: "切换单位与快捷键。", usage_p4: "针对移动端优化。", dataTitle: "数据", data_p: "价格来自多个市场并每分钟更新。", contactTitle: "联系", contact_p: "通过 Twitter/X 联系我们。", disclaimerTitle: "免责声明", disclaimer_p: "汇率仅供参考。", priceAlerts: "价格提醒", addAlert: "添加", noAlertsYet: "暂无提醒。添加您的第一个价格提醒。", active: "活跃", triggered: "已触发", above: "高于", below: "低于", addPriceAlert: "添加提醒", closeModal: "关闭窗口", targetPrice: "目标价格", triggerCondition: "触发条件", abovePrice: "高于价格", belowPrice: "低于价格", cancel: "取消", add: "添加", enterValidPrice: "请输入有效价格", alertAdded: "提醒已添加", alertDeleted: "提醒已删除", deleteAlert: "删除提醒", closeNotification: "关闭通知" },
  it: { title: "Tasso {sym}", converter: "Convertitore", bitcoin: "Bitcoin", unit: "Unità", fiatAmount: "Importo fiat", currency: "Valuta", updated: "Aggiornato", hours24: "24h", days30: "30g", priceChart: "Grafico prezzo {sym}", loadingChart: "Caricamento grafico...", time: "Tempo", for24h: "in 24 ore", for30d: "in 30 giorni", dark: "Scuro", light: "Chiaro", themeTooltip: "Tema {current}. Clicca per passare a {next}", ma7: "MA7", days7: "7g", days14: "14g", movingAverage7: "Media mobile 7 ore", for7days: "per 7 giorni", for14days: "per 14 giorni", exportData: "Esporta dati", export: "Esporta", sharePrice: "Condividi prezzo", currentPrice: "Prezzo attuale", history: "Storico", historyPoints: "Dati storici ({n} punti)", json: "JSON", csv: "CSV", noHistory: "Nessun dato storico", copied: "Copiato", copyFailed: "Copia fallita", crypto: "Criptovaluta", searchCurrency: "Cerca valuta...", keyboardHint: "Tasti: k — BTC, m — mBTC, u — µBTC, s — sats", fiat_USD: "Dollaro USA", fiat_EUR: "Euro", fiat_GBP: "Sterlina", fiat_CAD: "Dollaro canadese", fiat_AUD: "Dollaro australiano", fiat_SEK: "Corona svedese", heroSubtitle: "Convertitore e grafico in tempo reale", infoMainTitle: "Questo sito consente:", bulletView: "Vedere prezzi live", bulletConvert: "Convertire qualsiasi importo", desc_p1: "Bitcoin è denaro digitale senza intermediari.", learnMore: "Scopri di più", usageTitle: "Uso", usage_p1: "Lascia la scheda aperta.", usage_p2: "Usa i campi per i valori equivalenti.", usage_p3: "Cambia unità e scorciatoie.", usage_p4: "Ottimizzato per mobile.", dataTitle: "Dati", data_p: "Dati aggregati e aggiornati ogni minuto.", contactTitle: "Contatto", contact_p: "Scrivici su Twitter/X.", disclaimerTitle: "Disclaimer", disclaimer_p: "Tassi solo informativi.", priceAlerts: "Avvisi prezzo", addAlert: "Aggiungi", noAlertsYet: "Nessun avviso ancora. Aggiungi il tuo primo avviso prezzo.", active: "Attivo", triggered: "Attivato", above: "Sopra", below: "Sotto", addPriceAlert: "Aggiungi avviso", closeModal: "Chiudi finestra", targetPrice: "Prezzo target", triggerCondition: "Condizione attivazione", abovePrice: "Sopra prezzo", belowPrice: "Sotto prezzo", cancel: "Annulla", add: "Aggiungi", enterValidPrice: "Inserisci prezzo valido", alertAdded: "Avviso aggiunto", alertDeleted: "Avviso eliminato", deleteAlert: "Elimina avviso", closeNotification: "Chiudi notifica" },
  pl: { title: "Kurs {sym}", converter: "Przelicznik", bitcoin: "Bitcoin", unit: "Jednostka", fiatAmount: "Kwota fiat", currency: "Waluta", updated: "Zaktualizowano", hours24: "24h", days30: "30d", priceChart: "Wykres ceny {sym}", loadingChart: "Ładowanie wykresu...", time: "Czas", for24h: "w 24 godziny", for30d: "w 30 dni", dark: "Ciemny", light: "Jasny", themeTooltip: "Motyw {current}. Kliknij, aby przełączyć na {next}", ma7: "MA7", days7: "7d", days14: "14d", movingAverage7: "Średnia krocząca 7 godzin", for7days: "przez 7 dni", for14days: "przez 14 dni", exportData: "Eksport danych", export: "Eksport", sharePrice: "Udostępnij cenę", currentPrice: "Bieżąca cena", history: "Historia", historyPoints: "Dane historyczne ({n})", json: "JSON", csv: "CSV", noHistory: "Brak danych historycznych", copied: "Skopiowano", copyFailed: "Nie udało się skopiować", crypto: "Kryptowaluta", searchCurrency: "Szukaj waluty...", keyboardHint: "Klawisze: k — BTC, m — mBTC, u — µBTC, s — sats", fiat_USD: "Dolar amerykański", fiat_EUR: "Euro", fiat_GBP: "Funt szterling", fiat_CAD: "Dolar kanadyjski", fiat_AUD: "Dolar australijski", fiat_SEK: "Korona szwedzka", heroSubtitle: "Przelicznik i wykres na żywo", infoMainTitle: "Ta strona pozwala:", bulletView: "Oglądać ceny na żywo", bulletConvert: "Przeliczać dowolne kwoty", desc_p1: "Bitcoin to cyfrowa waluta bez pośredników.", learnMore: "Dowiedz się więcej", usageTitle: "Użycie", usage_p1: "Pozostaw kartę otwartą.", usage_p2: "Użyj pól, aby zobaczyć równowartości.", usage_p3: "Zmieniaj jednostki i skróty.", usage_p4: "Zoptymalizowany pod mobile.", dataTitle: "Dane", data_p: "Dane z wielu giełd, aktualizowane co minutę.", contactTitle: "Kontakt", contact_p: "Napisz na Twitter/X.", disclaimerTitle: "Zastrzeżenie", disclaimer_p: "Kursy tylko informacyjne.", priceAlerts: "Alerty cenowe", addAlert: "Dodaj", noAlertsYet: "Brak alertów. Dodaj pierwszy alert cenowy.", active: "Aktywny", triggered: "Uruchomiony", above: "Powyżej", below: "Poniżej", addPriceAlert: "Dodaj alert", closeModal: "Zamknij okno", targetPrice: "Cena docelowa", triggerCondition: "Warunek uruchomienia", abovePrice: "Powyżej ceny", belowPrice: "Poniżej ceny", cancel: "Anuluj", add: "Dodaj", enterValidPrice: "Wprowadź prawidłową cenę", alertAdded: "Alert dodany", alertDeleted: "Alert usunięty", deleteAlert: "Usuń alert", closeNotification: "Zamknij powiadomienie" },
  cs: { title: "Kurz {sym}", converter: "Převodník", bitcoin: "Bitcoin", unit: "Jednotka", fiatAmount: "Fiat částka", currency: "Měna", updated: "Aktualizováno", hours24: "24h", days30: "30d", priceChart: "Graf ceny {sym}", loadingChart: "Načítání grafu...", time: "Čas", for24h: "za 24 hodin", for30d: "za 30 dní", dark: "Tmavý", light: "Světlý", themeTooltip: "Motiv {current}. Klikněte pro přepnutí na {next}", ma7: "MA7", days7: "7d", days14: "14d", movingAverage7: "Klouzavý průměr 7 hodin", for7days: "za 7 dní", for14days: "za 14 dní", exportData: "Export dat", export: "Export", sharePrice: "Sdílet cenu", currentPrice: "Aktuální cena", history: "Historie", historyPoints: "Historická data ({n})", json: "JSON", csv: "CSV", noHistory: "Žádná historická data", copied: "Zkopírováno", copyFailed: "Kopírování selhalo", crypto: "Kryptoměna", searchCurrency: "Hledat měnu...", keyboardHint: "Zkratky: k — BTC, m — mBTC, u — µBTC, s — sats", fiat_USD: "Americký dolar", fiat_EUR: "Euro", fiat_GBP: "Libra", fiat_CAD: "Kanadský dolar", fiat_AUD: "Australský dolar", fiat_SEK: "Švédská koruna", heroSubtitle: "Převodník a graf v reálném čase", infoMainTitle: "Tento web umožňuje:", bulletView: "Sledovat živé ceny", bulletConvert: "Převádět libovolné částky", desc_p1: "Bitcoin je digitální měna bez prostředníků.", learnMore: "Více info", usageTitle: "Použití", usage_p1: "Nechte kartu otevřenou.", usage_p2: "Použijte pole pro ekvivalenty.", usage_p3: "Přepínejte jednotky a zkratky.", usage_p4: "Optimalizováno pro mobil.", dataTitle: "Data", data_p: "Agregovaná data, aktualizace každou minutu.", contactTitle: "Kontakt", contact_p: "Twitter/X.", disclaimerTitle: "Prohlášení", disclaimer_p: "Kurzy jsou pouze informativní.", priceAlerts: "Cenové upozornění", addAlert: "Přidat", noAlertsYet: "Zatím žádná upozornění. Přidejte první cenové upozornění.", active: "Aktivní", triggered: "Spuštěno", above: "Nad", below: "Pod", addPriceAlert: "Přidat upozornění", closeModal: "Zavřít okno", targetPrice: "Cílové cena", triggerCondition: "Podmínka spuštění", abovePrice: "Nad cenou", belowPrice: "Pod cenou", cancel: "Zrušit", add: "Přidat", enterValidPrice: "Zadejte platnou cenu", alertAdded: "Upozornění přidáno", alertDeleted: "Upozornění smazáno", deleteAlert: "Smazat upozornění", closeNotification: "Zavřít oznámení" },
  nl: { title: "Koers {sym}", converter: "Converter", bitcoin: "Bitcoin", unit: "Eenheid", fiatAmount: "Fiatbedrag", currency: "Valuta", updated: "Bijgewerkt", hours24: "24u", days30: "30d", priceChart: "{sym}-grafiek", loadingChart: "Grafiek laden...", time: "Tijd", for24h: "in 24 uur", for30d: "in 30 dagen", dark: "Donker", light: "Licht", themeTooltip: "Thema {current}. Klik om te wisselen naar {next}", ma7: "MA7", days7: "7d", days14: "14d", movingAverage7: "7-uur voortschrijdend gemiddelde", for7days: "voor 7 dagen", for14days: "voor 14 dagen", exportData: "Gegevens exporteren", export: "Exporteren", sharePrice: "Huidige prijs delen", currentPrice: "Huidige prijs", history: "Historie", historyPoints: "Historische data ({n})", json: "JSON", csv: "CSV", noHistory: "Geen historische data", copied: "Gekopieerd", copyFailed: "Kopiëren mislukt", crypto: "Cryptovaluta", searchCurrency: "Valuta zoeken...", keyboardHint: "Sneltoetsen: k — BTC, m — mBTC, u — µBTC, s — sats", fiat_USD: "Amerikaanse dollar", fiat_EUR: "Euro", fiat_GBP: "Pond sterling", fiat_CAD: "Canadese dollar", fiat_AUD: "Australische dollar", fiat_SEK: "Zweedse kroon", heroSubtitle: "Converter en grafiek in realtime", infoMainTitle: "Deze site laat je:", bulletView: "Live prijzen zien", bulletConvert: "Bedragen omrekenen", desc_p1: "Bitcoin is digitaal geld zonder tussenpersonen.", learnMore: "Meer info", usageTitle: "Gebruik", usage_p1: "Laat de tab open.", usage_p2: "Gebruik velden voor equivalenten.", usage_p3: "Schakel eenheden en sneltoetsen.", usage_p4: "Geoptimaliseerd voor mobiel.", dataTitle: "Data", data_p: "Data van meerdere markten, elke minuut.", contactTitle: "Contact", contact_p: "Contacteer ons op Twitter/X.", disclaimerTitle: "Disclaimer", disclaimer_p: "Wisselkoersen zijn informatief.", priceAlerts: "Prijsmeldingen", addAlert: "Toevoegen", noAlertsYet: "Nog geen meldingen. Voeg je eerste prijsmelding toe.", active: "Actief", triggered: "Geactiveerd", above: "Boven", below: "Onder", addPriceAlert: "Melding toevoegen", closeModal: "Venster sluiten", targetPrice: "Doelprijs", triggerCondition: "Activeringsvoorwaarde", abovePrice: "Boven prijs", belowPrice: "Onder prijs", cancel: "Annuleren", add: "Toevoegen", enterValidPrice: "Voer een geldige prijs in", alertAdded: "Melding toegevoegd", alertDeleted: "Melding verwijderd", deleteAlert: "Melding verwijderen", closeNotification: "Melding sluiten" },
  pt: { title: "Cotação {sym}", converter: "Conversor", bitcoin: "Bitcoin", unit: "Unidade", fiatAmount: "Valor fiat", currency: "Moeda", updated: "Atualizado", hours24: "24h", days30: "30d", priceChart: "Gráfico de preço {sym}", loadingChart: "Carregando gráfico...", time: "Tempo", for24h: "em 24 horas", for30d: "em 30 dias", dark: "Escuro", light: "Claro", themeTooltip: "Tema {current}. Clique para mudar para {next}", ma7: "MA7", days7: "7d", days14: "14d", movingAverage7: "Média móvel 7 horas", for7days: "por 7 dias", for14days: "por 14 dias", exportData: "Exportar dados", export: "Exportar", sharePrice: "Compartilhar preço", currentPrice: "Preço atual", history: "Histórico", historyPoints: "Dados históricos ({n})", json: "JSON", csv: "CSV", noHistory: "Sem dados históricos", copied: "Copiado", copyFailed: "Falha ao copiar", crypto: "Criptomoeda", searchCurrency: "Buscar moeda...", keyboardHint: "Atalhos: k — BTC, m — mBTC, u — µBTC, s — sats", fiat_USD: "Dólar americano", fiat_EUR: "Euro", fiat_GBP: "Libra esterlina", fiat_CAD: "Dólar canadense", fiat_AUD: "Dólar australiano", fiat_SEK: "Coroa sueca", heroSubtitle: "Conversor e gráfico em tempo real", infoMainTitle: "Este site permite:", bulletView: "Ver preços ao vivo", bulletConvert: "Converter qualquer valor", desc_p1: "Bitcoin é dinheiro digital sem intermediários.", learnMore: "Saiba mais", usageTitle: "Uso", usage_p1: "Deixe a aba aberta.", usage_p2: "Use os campos para equivalentes.", usage_p3: "Altere unidades e atalhos.", usage_p4: "Otimizado para mobile.", dataTitle: "Dados", data_p: "Preços agregados, atualização a cada minuto.", contactTitle: "Contato", contact_p: "Fale no Twitter/X.", disclaimerTitle: "Aviso", disclaimer_p: "Taxas apenas informativas.", priceAlerts: "Alertas de preço", addAlert: "Adicionar", noAlertsYet: "Nenhum alerta ainda. Adicione seu primeiro alerta de preço.", active: "Ativo", triggered: "Ativado", above: "Acima", below: "Abaixo", addPriceAlert: "Adicionar alerta", closeModal: "Fechar janela", targetPrice: "Preço alvo", triggerCondition: "Condição de ativação", abovePrice: "Acima do preço", belowPrice: "Abaixo do preço", cancel: "Cancelar", add: "Adicionar", enterValidPrice: "Digite um preço válido", alertAdded: "Alerta adicionado", alertDeleted: "Alerta removido", deleteAlert: "Remover alerta", closeNotification: "Fechar notificação" },
  ja: { title: "{sym} レート", converter: "コンバーター", bitcoin: "ビットコイン", unit: "単位", fiatAmount: "法定通貨額", currency: "通貨", updated: "更新", hours24: "24時間", days30: "30日", priceChart: "{sym} 価格チャート", loadingChart: "グラフを読み込み中...", time: "時間", for24h: "24時間で", for30d: "30日で", dark: "ダーク", light: "ライト", themeTooltip: "{current} テーマ。クリックして {next} に切り替え", ma7: "MA7", days7: "7日", days14: "14日", movingAverage7: "7時間移動平均", for7days: "7日間", for14days: "14日間", exportData: "データをエクスポート", export: "エクスポート", sharePrice: "現在価格を共有", currentPrice: "現在価格", history: "履歴", historyPoints: "履歴データ（{n} 件）", json: "JSON", csv: "CSV", noHistory: "履歴データなし", copied: "コピーしました", copyFailed: "コピーに失敗", crypto: "暗号通貨", searchCurrency: "通貨を検索...", keyboardHint: "ショートカット: k — BTC, m — mBTC, u — µBTC, s — sats", fiat_USD: "米ドル", fiat_EUR: "ユーロ", fiat_GBP: "英ポンド", fiat_CAD: "カナダドル", fiat_AUD: "豪ドル", fiat_SEK: "スウェーデンクローナ", heroSubtitle: "コンバーターとリアルタイムチャート", infoMainTitle: "このサイトでは:", bulletView: "ライブ価格を表示", bulletConvert: "任意の金額を変換", desc_p1: "ビットコインは仲介者のいないデジタル通貨です。", learnMore: "詳しく", usageTitle: "使い方", usage_p1: "タブを開いたままにする。", usage_p2: "入力で等価を確認。", usage_p3: "単位とショートカットを切替。", usage_p4: "モバイルに最適化。", dataTitle: "データ", data_p: "複数市場から集約、毎分更新。", contactTitle: "連絡先", contact_p: "Twitter/X にて。", disclaimerTitle: "免責事項", disclaimer_p: "為替レートは参考情報です。", priceAlerts: "価格アラート", addAlert: "追加", noAlertsYet: "アラートはまだありません。最初の価格アラートを追加してください。", active: "アクティブ", triggered: "トリガー", above: "上", below: "下", addPriceAlert: "アラート追加", closeModal: "ウィンドウを閉じる", targetPrice: "目標価格", triggerCondition: "トリガー条件", abovePrice: "価格以上", belowPrice: "価格以下", cancel: "キャンセル", add: "追加", enterValidPrice: "有効な価格を入力", alertAdded: "アラート追加済み", alertDeleted: "アラート削除済み", deleteAlert: "アラート削除", closeNotification: "通知を閉じる" },
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


