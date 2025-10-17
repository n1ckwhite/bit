export type FiatCurrency = {
  code: string; // e.g., USD, EUR, RUB
  symbol: string; // e.g., $, €, ₽
  nameRu: string; // Russian name for UI
};

// Сокращённый список — убрали редкие/проблемные валюты из интерфейса
export const DEFAULT_FIATS: FiatCurrency[] = [
  { code: "USD", symbol: "$", nameRu: "Доллар США" },
];

export function getFiatByCode(code: string): FiatCurrency | undefined {
  return DEFAULT_FIATS.find((c) => c.code === code.toUpperCase());
}


