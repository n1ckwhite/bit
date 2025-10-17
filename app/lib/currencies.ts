export type FiatCurrency = {
  code: string; // e.g., USD, EUR, RUB
  symbol: string; // e.g., $, €, ₽
  nameRu: string; // Russian name for UI
};

export const DEFAULT_FIATS: FiatCurrency[] = [
  { code: "USD", symbol: "$", nameRu: "Доллар США" },
  { code: "EUR", symbol: "€", nameRu: "Евро" },
  { code: "RUB", symbol: "₽", nameRu: "Российский рубль" },
  { code: "GBP", symbol: "£", nameRu: "Британский фунт" },
  { code: "JPY", symbol: "¥", nameRu: "Японская иена" },
  { code: "CNY", symbol: "¥", nameRu: "Китайский юань" },
  { code: "UAH", symbol: "₴", nameRu: "Украинская гривна" },
  { code: "KZT", symbol: "₸", nameRu: "Казахстанский тенге" },
  { code: "TRY", symbol: "₺", nameRu: "Турецкая лира" },
  { code: "BRL", symbol: "R$", nameRu: "Бразильский реал" },
  { code: "INR", symbol: "₹", nameRu: "Индийская рупия" },
  { code: "KRW", symbol: "₩", nameRu: "Южнокорейская вона" },
  { code: "CAD", symbol: "C$", nameRu: "Канадский доллар" },
  { code: "AUD", symbol: "A$", nameRu: "Австралийский доллар" },
  { code: "CHF", symbol: "Fr", nameRu: "Швейцарский франк" },
  { code: "SEK", symbol: "kr", nameRu: "Шведская крона" },
  { code: "NOK", symbol: "kr", nameRu: "Норвежская крона" },
  { code: "DKK", symbol: "kr", nameRu: "Датская крона" },
  { code: "PLN", symbol: "zł", nameRu: "Польский злотый" },
  { code: "CZK", symbol: "Kč", nameRu: "Чешская крона" },
];

export function getFiatByCode(code: string): FiatCurrency | undefined {
  return DEFAULT_FIATS.find((c) => c.code === code.toUpperCase());
}


