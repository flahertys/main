import React, { useEffect, useRef } from 'react';

export const MarketTicker = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current && !container.current.querySelector('script')) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "proName": "BITSTAMP:BTCUSD", "title": "BTC" },
          { "proName": "BITSTAMP:ETHUSD", "title": "ETH" },
          { "proName": "PYTH:SOLUSD", "title": "SOL" },
          { "description": "AVAX", "proName": "BINANCE:AVAXUSD" },
          { "description": "S&P 500", "proName": "FOREXCOM:SPXUSD" },
          { "description": "GOLD", "proName": "TVC:GOLD" }
        ],
        "showSymbolLogo": true,
        "isTransparent": true,
        "displayMode": "adaptive",
        "colorTheme": "dark",
        "locale": "en"
      });
      container.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full bg-black/80 backdrop-blur-md border-y border-white/5 overflow-hidden h-[46px]" ref={container}>
      <div className="tradingview-widget-container">
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
};
