export type Cryptocurrency = {
  id: string; // CoinGecko ID
  symbol: string; // e.g., BTC, ETH, ORDI
  name: string; // Full name
  nameRu: string; // Russian name
  icon?: string; // Icon URL
  decimals: number; // Decimal places for display
};

export const SUPPORTED_CRYPTOS: Cryptocurrency[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    nameRu: "Биткоин",
    decimals: 8,
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    nameRu: "Эфириум",
    decimals: 18,
  },
  {
    id: "ordinals",
    symbol: "ORDI",
    name: "Ordinals",
    nameRu: "Ординалы",
    decimals: 18,
  },
  {
    id: "binancecoin",
    symbol: "BNB",
    name: "BNB",
    nameRu: "Бинанс Койн",
    decimals: 18,
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    nameRu: "Солана",
    decimals: 9,
  },
  {
    id: "cardano",
    symbol: "ADA",
    name: "Cardano",
    nameRu: "Кардано",
    decimals: 6,
  },
  {
    id: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    nameRu: "Догикоин",
    decimals: 8,
  },
  {
    id: "polygon",
    symbol: "MATIC",
    name: "Polygon",
    nameRu: "Полигон",
    decimals: 18,
  },
  {
    id: "chainlink",
    symbol: "LINK",
    name: "Chainlink",
    nameRu: "Чейнлинк",
    decimals: 18,
  },
  {
    id: "litecoin",
    symbol: "LTC",
    name: "Litecoin",
    nameRu: "Лайткоин",
    decimals: 8,
  },
];

export function getCryptoById(id: string): Cryptocurrency | undefined {
  return SUPPORTED_CRYPTOS.find(crypto => crypto.id === id);
}

export function getCryptoBySymbol(symbol: string): Cryptocurrency | undefined {
  return SUPPORTED_CRYPTOS.find(crypto => crypto.symbol.toLowerCase() === symbol.toLowerCase());
}

export function formatCryptoAmount(amount: number, crypto: Cryptocurrency): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: crypto.decimals > 8 ? 8 : crypto.decimals,
  });
}
