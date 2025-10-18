// Run with: node scripts/check-prices.js
// Requires Node 18+ (global fetch)
const BASES = ["bitcoin", "ordinals", "ethereum"];
const VSS = ["USD", "EUR"];
const HOST = process.env.HOST || "http://localhost:3000";

async function fetchJson(path) {
  try {
    const res = await fetch(`${HOST}${path}`);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { error: "invalid-json", raw: text };
    }
  } catch (err) {
    return { error: "fetch-failed", message: String(err) };
  }
}

(async () => {
  console.log("Host:", HOST);
  for (const base of BASES) {
    for (const vs of VSS) {
      const p = `/api/prices?base=${encodeURIComponent(
        base
      )}&vs=${encodeURIComponent(vs)}`;
      const h = `/api/history?base=${encodeURIComponent(
        base
      )}&vs=${encodeURIComponent(vs)}&interval=1h&limit=24`;
      console.log("---");
      console.log("BASE/VS:", base, vs);
      const prices = await fetchJson(p);
      console.log(
        "/api/prices:",
        Array.isArray(prices) ? prices.length : Object.keys(prices).length,
        "keys"
      );
      console.log(JSON.stringify(prices, null, 2));
      const history = await fetchJson(h);
      console.log(
        "/api/history:",
        history && history.data
          ? `${history.data.length} points`
          : JSON.stringify(history)
      );
    }
  }
})();
