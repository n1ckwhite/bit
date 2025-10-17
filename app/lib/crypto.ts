export type Cryptocurrency = {
  id: string; // CoinGecko ID
  symbol: string; // e.g., BTC, ETH, ORDI
  name: string; // Full name
  nameRu: string; // Russian name (backwards compatibility)
  // Localized names per language code
  names?: Partial<Record<
    'en' | 'ru' | 'de' | 'fr' | 'es' | 'tr' | 'zh' | 'it' | 'pl' | 'cs' | 'nl' | 'pt' | 'ja',
    string
  >>;
  icon?: string; // Icon URL
  decimals: number; // Decimal places for display
};

export const SUPPORTED_CRYPTOS: Cryptocurrency[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    nameRu: "Биткоин",
    names: { en: "Bitcoin", ru: "Биткоин", de: "Bitcoin", fr: "Bitcoin", es: "Bitcoin", tr: "Bitcoin", zh: "比特币", it: "Bitcoin", pl: "Bitcoin", cs: "Bitcoin", nl: "Bitcoin", pt: "Bitcoin", ja: "ビットコイン" },
    decimals: 8,
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    nameRu: "Эфириум",
    names: { en: "Ethereum", ru: "Эфириум", de: "Ethereum", fr: "Ethereum", es: "Ethereum", tr: "Ethereum", zh: "以太坊", it: "Ethereum", pl: "Ethereum", cs: "Ethereum", nl: "Ethereum", pt: "Ethereum", ja: "イーサリアム" },
    decimals: 18,
  },
  {
    id: "ordinals",
    symbol: "ORDI",
    name: "Ordinals",
    nameRu: "Ординалы",
    names: { en: "Ordinals", ru: "Ординалы", de: "Ordinals", fr: "Ordinals", es: "Ordinals", tr: "Ordinals", zh: "序数", it: "Ordinals", pl: "Ordinals", cs: "Ordinals", nl: "Ordinals", pt: "Ordinals", ja: "オーディナル" },
    decimals: 18,
  },
  {
    id: "binancecoin",
    symbol: "BNB",
    name: "BNB",
    nameRu: "Бинанс Койн",
    names: { en: "BNB", ru: "Бинанс Койн", de: "BNB", fr: "BNB", es: "BNB", tr: "BNB", zh: "币安币", it: "BNB", pl: "BNB", cs: "BNB", nl: "BNB", pt: "BNB", ja: "ビーエヌビー" },
    decimals: 18,
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    nameRu: "Солана",
    names: { en: "Solana", ru: "Солана", de: "Solana", fr: "Solana", es: "Solana", tr: "Solana", zh: "索拉纳", it: "Solana", pl: "Solana", cs: "Solana", nl: "Solana", pt: "Solana", ja: "ソラナ" },
    decimals: 9,
  },
  {
    id: "cardano",
    symbol: "ADA",
    name: "Cardano",
    nameRu: "Кардано",
    names: { en: "Cardano", ru: "Кардано", de: "Cardano", fr: "Cardano", es: "Cardano", tr: "Cardano", zh: "卡尔达诺", it: "Cardano", pl: "Cardano", cs: "Cardano", nl: "Cardano", pt: "Cardano", ja: "カルダノ" },
    decimals: 6,
  },
  {
    id: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    nameRu: "Догикоин",
    names: { en: "Dogecoin", ru: "Догикоин", de: "Dogecoin", fr: "Dogecoin", es: "Dogecoin", tr: "Dogecoin", zh: "狗狗币", it: "Dogecoin", pl: "Dogecoin", cs: "Dogecoin", nl: "Dogecoin", pt: "Dogecoin", ja: "ドージコイン" },
    decimals: 8,
  },
  {
    id: "polygon",
    symbol: "MATIC",
    name: "Polygon",
    nameRu: "Полигон",
    names: { en: "Polygon", ru: "Полигон", de: "Polygon", fr: "Polygon", es: "Polygon", tr: "Polygon", zh: "多边形", it: "Polygon", pl: "Polygon", cs: "Polygon", nl: "Polygon", pt: "Polygon", ja: "ポリゴン" },
    decimals: 18,
  },
  {
    id: "chainlink",
    symbol: "LINK",
    name: "Chainlink",
    nameRu: "Чейнлинк",
    names: { en: "Chainlink", ru: "Чейнлинк", de: "Chainlink", fr: "Chainlink", es: "Chainlink", tr: "Chainlink", zh: "链环", it: "Chainlink", pl: "Chainlink", cs: "Chainlink", nl: "Chainlink", pt: "Chainlink", ja: "チェーンリンク" },
    decimals: 18,
  },
  {
    id: "litecoin",
    symbol: "LTC",
    name: "Litecoin",
    nameRu: "Лайткоин",
    names: { en: "Litecoin", ru: "Лайткоин", de: "Litecoin", fr: "Litecoin", es: "Litecoin", tr: "Litecoin", zh: "莱特币", it: "Litecoin", pl: "Litecoin", cs: "Litecoin", nl: "Litecoin", pt: "Litecoin", ja: "ライトコイン" },
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

export function getCryptoLocalizedName(crypto: Cryptocurrency, locale: string): string {
  return crypto.names?.[locale as keyof NonNullable<typeof crypto.names>] || crypto.nameRu;
}
