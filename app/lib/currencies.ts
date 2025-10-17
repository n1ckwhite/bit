export type FiatCurrency = {
  code: string; // e.g., USD, EUR, RUB
  symbol: string; // e.g., $, €, ₽
  nameRu: string; // Russian name for UI
};

// Сокращённый список — убрали редкие/проблемные валюты из интерфейса
export const DEFAULT_FIATS: FiatCurrency[] = [
  { code: "USD", symbol: "$", nameRu: "Доллар США" },
  { code: "EUR", symbol: "€", nameRu: "Евро" },
  { code: "GBP", symbol: "£", nameRu: "Фунт стерлингов" },
  { code: "CAD", symbol: "C$", nameRu: "Канадский доллар" },
  { code: "AUD", symbol: "A$", nameRu: "Австралийский доллар" },
  { code: "SEK", symbol: "kr", nameRu: "Шведская крона" },
];

export function getFiatByCode(code: string): FiatCurrency | undefined {
  return DEFAULT_FIATS.find((c) => c.code === code.toUpperCase());
}

// Справочник популярных фиатов для обогащения данных из внешних источников
const KNOWN_FIATS: Record<string, { symbol: string; nameRu: string }> = {
  USD: { symbol: "$", nameRu: "Доллар США" },
  EUR: { symbol: "€", nameRu: "Евро" },
  GBP: { symbol: "£", nameRu: "Фунт стерлингов" },
  CAD: { symbol: "C$", nameRu: "Канадский доллар" },
  AUD: { symbol: "A$", nameRu: "Австралийский доллар" },
  SEK: { symbol: "kr", nameRu: "Шведская крона" },
  CHF: { symbol: "Fr", nameRu: "Швейцарский франк" },
  JPY: { symbol: "¥", nameRu: "Японская иена" },
  CNY: { symbol: "¥", nameRu: "Китайский юань" },
  NOK: { symbol: "kr", nameRu: "Норвежская крона" },
  DKK: { symbol: "kr", nameRu: "Датская крона" },
  PLN: { symbol: "zł", nameRu: "Польский злотый" },
  TRY: { symbol: "₺", nameRu: "Турецкая лира" },
  INR: { symbol: "₹", nameRu: "Индийская рупия" },
  BRL: { symbol: "R$", nameRu: "Бразильский реал" },
  ZAR: { symbol: "R", nameRu: "Южноафриканский рэнд" },
  NZD: { symbol: "NZ$", nameRu: "Новозеландский доллар" },
  MXN: { symbol: "$", nameRu: "Мексиканское песо" },
  HKD: { symbol: "$", nameRu: "Гонконгский доллар" },
  SGD: { symbol: "$", nameRu: "Сингапурский доллар" },
};

export function enrichFiatCodes(codes: string[]): FiatCurrency[] {
  const uniqueCodes = Array.from(new Set(codes.map((c) => c.toUpperCase())));
  return uniqueCodes.map((code) => {
    const known = KNOWN_FIATS[code];
    if (known) return { code, symbol: known.symbol, nameRu: known.nameRu };
    return { code, symbol: code, nameRu: code };
  });
}


