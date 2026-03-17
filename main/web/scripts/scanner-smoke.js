import { detectUnusualOpportunities } from "../api/signals/scan-core.js";

const sample = [
  {
    symbol: "BTC",
    priceChangePercent24h: 6.7,
    volume24h: 98000000000,
    marketCap: 1700000000000,
    high24h: 72500,
    low24h: 68200,
  },
  {
    symbol: "ETH",
    priceChangePercent24h: 1.2,
    volume24h: 21000000000,
    marketCap: 410000000000,
    high24h: 3950,
    low24h: 3820,
  },
  {
    symbol: "DOGE",
    priceChangePercent24h: -9.4,
    volume24h: 6100000000,
    marketCap: 19000000000,
    high24h: 0.18,
    low24h: 0.148,
  },
];

const result = detectUnusualOpportunities(sample);

if (!result || !Array.isArray(result.opportunities)) {
  console.error("FAIL scanner output malformed");
  process.exit(1);
}

if (result.totalScanned !== sample.length) {
  console.error("FAIL scanner totalScanned mismatch");
  process.exit(1);
}

if (result.opportunities.length === 0) {
  console.error("FAIL expected at least one flagged opportunity");
  process.exit(1);
}

if (!result.regime || typeof result.regime.label !== "string") {
  console.error("FAIL missing regime metadata");
  process.exit(1);
}

const first = result.opportunities[0];
if (typeof first.reliability !== "number" || first.reliability <= 0) {
  console.error("FAIL missing reliability score");
  process.exit(1);
}

console.log("Scanner smoke passed.");
console.log(
  result.opportunities.slice(0, 2).map((item) => `${item.symbol}:${item.score}:R${item.reliability}`).join(" | ")
);

