"use client";
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export const MarketTicker = () => {
  const container = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const hideTickerForGame = pathname === '/game' || pathname?.startsWith('/game/') || false;

  useEffect(() => {
    if (hideTickerForGame) {
      return;
    }

    if (container.current && !container.current.querySelector('script')) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
      script.type = "text/javascript";
      script.async = true;
      script.textContent = JSON.stringify({
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
  }, [hideTickerForGame]);

  if (hideTickerForGame) {
    return null;
  }

  return (
    <div
      className="relative z-0 w-full h-[46px] overflow-hidden border-y border-white/5 bg-black/80 backdrop-blur-md pointer-events-none select-none"
      ref={container}
      aria-hidden="true"
    >
      <div className="tradingview-widget-container pointer-events-none h-full">
        <div className="tradingview-widget-container__widget pointer-events-none h-full"></div>
      </div>
    </div>
  );
};
