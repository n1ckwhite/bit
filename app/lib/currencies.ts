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
  CHF: { symbol: "Fr", nameRu: "Швейцарский франк", names: { en: "Swiss Franc", ru: "Швейцарский франк", de: "Schweizer Franken", fr: "Franc suisse", es: "Franco suizo", tr: "İsviçre Frangı", zh: "瑞士法郎", it: "Franco svizzero", pl: "Frank szwajcarski", cs: "Švýcarský frank", nl: "Zwitserse frank", pt: "Franco suíço", ja: "スイスフラン" } },
  JPY: { symbol: "¥", nameRu: "Японская иена", names: { en: "Japanese Yen", ru: "Японская иена", de: "Japanischer Yen", fr: "Yen japonais", es: "Yen japonés", tr: "Japon Yeni", zh: "日元", it: "Yen giapponese", pl: "Jen japoński", cs: "Japonský jen", nl: "Japanse yen", pt: "Iene japonês", ja: "日本円" } },
  CNY: { symbol: "¥", nameRu: "Китайский юань", names: { en: "Chinese Yuan", ru: "Китайский юань", de: "Chinesischer Yuan", fr: "Yuan chinois", es: "Yuan chino", tr: "Çin Yuanı", zh: "人民币", it: "Yuan cinese", pl: "Yuan chiński", cs: "Čínský jüan", nl: "Chinese yuan", pt: "Yuan chinês", ja: "人民元" } },
  NOK: { symbol: "kr", nameRu: "Норвежская крона", names: { en: "Norwegian Krone", ru: "Норвежская крона", de: "Norwegische Krone", fr: "Couronne norvégienne", es: "Corona noruega", tr: "Norveç Kronu", zh: "挪威克朗", it: "Corona norvegese", pl: "Korona norweska", cs: "Norská koruna", nl: "Noorse kroon", pt: "Coroa norueguesa", ja: "ノルウェークローネ" } },
  DKK: { symbol: "kr", nameRu: "Датская крона", names: { en: "Danish Krone", ru: "Датская крона", de: "Dänische Krone", fr: "Couronne danoise", es: "Corona danesa", tr: "Danimarka Kronu", zh: "丹麦克朗", it: "Corona danese", pl: "Korona duńska", cs: "Dánská koruna", nl: "Deense kroon", pt: "Coroa dinamarquesa", ja: "デンマーククローネ" } },
  PLN: { symbol: "zł", nameRu: "Польский злотый", names: { en: "Polish Zloty", ru: "Польский злотый", de: "Polnischer Zloty", fr: "Zloty polonais", es: "Zloty polaco", tr: "Polonya Zlotisi", zh: "波兰兹罗提", it: "Zloty polacco", pl: "Polski złoty", cs: "Polský zlotý", nl: "Poolse zloty", pt: "Zloty polonês", ja: "ポーランドズロティ" } },
  TRY: { symbol: "₺", nameRu: "Турецкая лира", names: { en: "Turkish Lira", ru: "Турецкая лира", de: "Türkische Lira", fr: "Livre turque", es: "Lira turca", tr: "Türk Lirası", zh: "土耳其里拉", it: "Lira turca", pl: "Lira turecka", cs: "Turecká lira", nl: "Turkse lira", pt: "Lira turca", ja: "トルコリラ" } },
  INR: { symbol: "₹", nameRu: "Индийская рупия", names: { en: "Indian Rupee", ru: "Индийская рупия", de: "Indische Rupie", fr: "Roupie indienne", es: "Rupia india", tr: "Hindistan Rupisi", zh: "印度卢比", it: "Rupia indiana", pl: "Rupia indyjska", cs: "Indická rupie", nl: "Indiase roepie", pt: "Rupia indiana", ja: "インドルピー" } },
  BRL: { symbol: "R$", nameRu: "Бразильский реал", names: { en: "Brazilian Real", ru: "Бразильский реал", de: "Brasilianischer Real", fr: "Real brésilien", es: "Real brasileño", tr: "Brezilya Reali", zh: "巴西雷亚尔", it: "Real brasiliano", pl: "Real brazylijski", cs: "Brazilský real", nl: "Braziliaanse real", pt: "Real brasileiro", ja: "ブラジルレアル" } },
  ZAR: { symbol: "R", nameRu: "Южноафриканский рэнд", names: { en: "South African Rand", ru: "Южноафриканский рэнд", de: "Südafrikanischer Rand", fr: "Rand sud-africain", es: "Rand sudafricano", tr: "Güney Afrika Randı", zh: "南非兰特", it: "Rand sudafricano", pl: "Rand południowoafrykański", cs: "Jihoafrický rand", nl: "Zuid-Afrikaanse rand", pt: "Rand sul-africano", ja: "南アフリカランド" } },
  NZD: { symbol: "NZ$", nameRu: "Новозеландский доллар", names: { en: "New Zealand Dollar", ru: "Новозеландский доллар", de: "Neuseeland-Dollar", fr: "Dollar néo-zélandais", es: "Dólar neozelandés", tr: "Yeni Zelanda Doları", zh: "新西兰元", it: "Dollaro neozelandese", pl: "Dolar nowozelandzki", cs: "Novozélandský dolar", nl: "Nieuw-Zeelandse dollar", pt: "Dólar neozelandês", ja: "ニュージーランドドル" } },
  MXN: { symbol: "$", nameRu: "Мексиканское песо", names: { en: "Mexican Peso", ru: "Мексиканское песо", de: "Mexikanischer Peso", fr: "Peso mexicain", es: "Peso mexicano", tr: "Meksika Pesosu", zh: "墨西哥比索", it: "Peso messicano", pl: "Peso meksykańskie", cs: "Mexické peso", nl: "Mexicaanse peso", pt: "Peso mexicano", ja: "メキシコペソ" } },
  HKD: { symbol: "$", nameRu: "Гонконгский доллар", names: { en: "Hong Kong Dollar", ru: "Гонконгский доллар", de: "Hongkong-Dollar", fr: "Dollar de Hong Kong", es: "Dólar de Hong Kong", tr: "Hong Kong Doları", zh: "港元", it: "Dollaro di Hong Kong", pl: "Dolar hongkoński", cs: "Hongkongský dolar", nl: "Hongkongse dollar", pt: "Dólar de Hong Kong", ja: "香港ドル" } },
  SGD: { symbol: "$", nameRu: "Сингапурский доллар", names: { en: "Singapore Dollar", ru: "Сингапурский доллар", de: "Singapur-Dollar", fr: "Dollar de Singapour", es: "Dólar de Singapur", tr: "Singapur Doları", zh: "新加坡元", it: "Dollaro di Singapore", pl: "Dolar singapurski", cs: "Singapurský dolar", nl: "Singaporese dollar", pt: "Dólar de Singapura", ja: "シンガポールドル" } },
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


