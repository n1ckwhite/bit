export type FiatCurrency = {
  code: string; // e.g., USD, EUR
  symbol: string; // e.g., $, €
  // Backwards-compat for older UI pieces
  nameRu: string; 
  // Localized names per language code
  names?: Partial<Record<
    'en' | 'ru' | 'de' | 'fr' | 'es' | 'tr' | 'zh' | 'it' | 'pl' | 'cs' | 'nl' | 'pt' | 'ja',
    string
  >>;
};

// Сокращённый список — убрали редкие/проблемные валюты из интерфейса
export const DEFAULT_FIATS: FiatCurrency[] = [
  { code: "USD", symbol: "$", nameRu: "Доллар США", names: { en: "US Dollar", ru: "Доллар США", de: "US-Dollar", fr: "Dollar américain", es: "Dólar estadounidense", tr: "ABD Doları", zh: "美元", it: "Dollaro USA", pl: "Dolar amerykański", cs: "Americký dolar", nl: "Amerikaanse dollar", pt: "Dólar americano", ja: "米ドル" } },
  { code: "EUR", symbol: "€", nameRu: "Евро", names: { en: "Euro", ru: "Евро", de: "Euro", fr: "Euro", es: "Euro", tr: "Euro", zh: "欧元", it: "Euro", pl: "Euro", cs: "Euro", nl: "Euro", pt: "Euro", ja: "ユーロ" } },
  { code: "GBP", symbol: "£", nameRu: "Фунт стерлингов", names: { en: "British Pound", ru: "Фунт стерлингов", de: "Britisches Pfund", fr: "Livre sterling", es: "Libra esterlina", tr: "İngiliz Sterlini", zh: "英镑", it: "Sterlina", pl: "Funt szterling", cs: "Libra", nl: "Pond sterling", pt: "Libra esterlina", ja: "英ポンド" } },
  { code: "CAD", symbol: "C$", nameRu: "Канадский доллар", names: { en: "Canadian Dollar", ru: "Канадский доллар", de: "Kanadischer Dollar", fr: "Dollar canadien", es: "Dólar canadiense", tr: "Kanada Doları", zh: "加元", it: "Dollaro canadese", pl: "Dolar kanadyjski", cs: "Kanadský dolar", nl: "Canadese dollar", pt: "Dólar canadense", ja: "カナダドル" } },
  { code: "AUD", symbol: "A$", nameRu: "Австралийский доллар", names: { en: "Australian Dollar", ru: "Австралийский доллар", de: "Australischer Dollar", fr: "Dollar australien", es: "Dólar australiano", tr: "Avustralya Doları", zh: "澳元", it: "Dollaro australiano", pl: "Dolar australijski", cs: "Australský dolar", nl: "Australische dollar", pt: "Dólar australiano", ja: "豪ドル" } },
  { code: "SEK", symbol: "kr", nameRu: "Шведская крона", names: { en: "Swedish Krona", ru: "Шведская крона", de: "Schwedische Krone", fr: "Couronne suédoise", es: "Corona sueca", tr: "İsveç Kronu", zh: "瑞典克朗", it: "Corona svedese", pl: "Korona szwedzka", cs: "Švédská koruna", nl: "Zweedse kroon", pt: "Coroa sueca", ja: "スウェーデンクローナ" } },
];

export function getFiatByCode(code: string): FiatCurrency | undefined {
  return DEFAULT_FIATS.find((c) => c.code === code.toUpperCase());
}

// Справочник популярных фиатов для обогащения данных из внешних источников
const KNOWN_FIATS: Record<string, { symbol: string; names: FiatCurrency['names']; nameRu: string }> = {
  USD: { symbol: "$", nameRu: "Доллар США", names: DEFAULT_FIATS.find(f=>f.code==='USD')?.names },
  EUR: { symbol: "€", nameRu: "Евро", names: DEFAULT_FIATS.find(f=>f.code==='EUR')?.names },
  GBP: { symbol: "£", nameRu: "Фунт стерлингов", names: DEFAULT_FIATS.find(f=>f.code==='GBP')?.names },
  CAD: { symbol: "C$", nameRu: "Канадский доллар", names: DEFAULT_FIATS.find(f=>f.code==='CAD')?.names },
  AUD: { symbol: "A$", nameRu: "Австралийский доллар", names: DEFAULT_FIATS.find(f=>f.code==='AUD')?.names },
  SEK: { symbol: "kr", nameRu: "Шведская крона", names: DEFAULT_FIATS.find(f=>f.code==='SEK')?.names },
  CHF: { symbol: "Fr", nameRu: "Швейцарский франк", names: { en: "Swiss Franc", ru: "Швейцарский франк" } },
  JPY: { symbol: "¥", nameRu: "Японская иена", names: { en: "Japanese Yen", ru: "Японская иена", ja: "日本円" } },
  CNY: { symbol: "¥", nameRu: "Китайский юань", names: { en: "Chinese Yuan", ru: "Китайский юань", zh: "人民币" } },
  NOK: { symbol: "kr", nameRu: "Норвежская крона", names: { en: "Norwegian Krone", ru: "Норвежская крона" } },
  DKK: { symbol: "kr", nameRu: "Датская крона", names: { en: "Danish Krone", ru: "Датская крона" } },
  PLN: { symbol: "zł", nameRu: "Польский злотый", names: { en: "Polish Zloty", ru: "Польский злотый", pl: "Polski złoty" } },
  TRY: { symbol: "₺", nameRu: "Турецкая лира", names: { en: "Turkish Lira", ru: "Турецкая лира", tr: "Türk Lirası" } },
  INR: { symbol: "₹", nameRu: "Индийская рупия", names: { en: "Indian Rupee", ru: "Индийская рупия" } },
  BRL: { symbol: "R$", nameRu: "Бразильский реал", names: { en: "Brazilian Real", ru: "Бразильский реал", pt: "Real brasileiro" } },
  ZAR: { symbol: "R", nameRu: "Южноафриканский рэнд", names: { en: "South African Rand", ru: "Южноафриканский рэнд" } },
  NZD: { symbol: "NZ$", nameRu: "Новозеландский доллар", names: { en: "New Zealand Dollar", ru: "Новозеландский доллар" } },
  MXN: { symbol: "$", nameRu: "Мексиканское песо", names: { en: "Mexican Peso", ru: "Мексиканское песо", es: "Peso mexicano" } },
  HKD: { symbol: "$", nameRu: "Гонконгский доллар", names: { en: "Hong Kong Dollar", ru: "Гонконгский доллар", zh: "港元" } },
  SGD: { symbol: "$", nameRu: "Сингапурский доллар", names: { en: "Singapore Dollar", ru: "Сингапурский доллар" } },
};

export function enrichFiatCodes(codes: string[]): FiatCurrency[] {
  const uniqueCodes = Array.from(new Set(codes.map((c) => c.toUpperCase())));
  return uniqueCodes.map((code) => {
    const known = KNOWN_FIATS[code];
    if (known) return { code, symbol: known.symbol, nameRu: known.nameRu, names: known.names };
    // Fallback: show code in all locales if unknown
    const fallbackNames: FiatCurrency['names'] = { en: code, ru: code };
    return { code, symbol: code, nameRu: code, names: fallbackNames };
  });
}


