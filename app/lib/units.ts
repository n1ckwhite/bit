export type BitcoinUnit = "BTC" | "mBTC" | "µBTC" | "sats";

export function parseUnit(u: string): BitcoinUnit {
  const v = u.toLowerCase();
  if (v === "btc") return "BTC";
  if (v === "mbtc") return "mBTC";
  if (v === "µbtc" || v === "ubtc" || v === "microbtc") return "µBTC";
  if (v === "s" || v === "sat" || v === "sats" || v === "satoshi") return "sats";
  return "BTC";
}

export function toBtc(amount: number, unit: BitcoinUnit): number {
  switch (unit) {
    case "BTC":
      return amount;
    case "mBTC":
      return amount / 1_000;
    case "µBTC":
      return amount / 1_000_000;
    case "sats":
      return amount / 100_000_000;
  }
}

export function fromBtc(btc: number, unit: BitcoinUnit): number {
  switch (unit) {
    case "BTC":
      return btc;
    case "mBTC":
      return btc * 1_000;
    case "µBTC":
      return btc * 1_000_000;
    case "sats":
      return Math.round(btc * 100_000_000);
  }
}


