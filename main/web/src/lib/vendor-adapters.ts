import { VendorAdapter, DataSourceResult, DataPoint } from "./data-provider-router";

// IEX Cloud Adapter (REST)
export const IEXAdapter: VendorAdapter = {
  name: "IEX",
  async fetchQuote(symbol: string): Promise<DataSourceResult> {
    try {
      // Replace with your IEX Cloud API key
      const apiKey = process.env.IEX_API_KEY;
      const url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("IEX API error");
      const json = await res.json();
      const data: DataPoint = {
        symbol,
        price: json.latestPrice,
        timestamp: Date.now(),
        source: "iex" as any,
        freshness: "realtime",
        confidence: 0.95,
      };
      return { success: true, data, latency: 0 };
    } catch (error) {
      return { success: false, error: String(error), latency: 0 };
    }
  },
};

// Alpha Vantage Adapter (REST)
export const AlphaVantageAdapter: VendorAdapter = {
  name: "AlphaVantage",
  async fetchQuote(symbol: string): Promise<DataSourceResult> {
    try {
      // Replace with your Alpha Vantage API key
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Alpha Vantage API error");
      const json = await res.json();
      const price = parseFloat(json["Global Quote"]["05. price"]);
      const data: DataPoint = {
        symbol,
        price,
        timestamp: Date.now(),
        source: "alphavantage" as any,
        freshness: "realtime",
        confidence: 0.9,
      };
      return { success: true, data, latency: 0 };
    } catch (error) {
      return { success: false, error: String(error), latency: 0 };
    }
  },
};

// Template for Custom Institutional Feed (WebSocket/REST)
export const CustomInstitutionalAdapter: VendorAdapter = {
  name: "CustomInstitutional",
  async fetchQuote(symbol: string): Promise<DataSourceResult> {
    // Implement your custom institutional logic here
    return { success: false, error: "Not implemented", latency: 0 };
  },
  supportsStreaming: true,
  startStream(symbol, onData) {
    // Implement WebSocket or streaming logic here
  },
};

