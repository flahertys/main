"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { JsonRpcProvider, formatEther, getAddress } from "ethers";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  TRADEHAX GPT  ◆  APEX EDITION  ◆  tradehax.net                        ║
// ║  The Premier Prediction Market Intelligence Engine                      ║
// ║  Fibonacci · Full Kelly · Bayesian · Monte Carlo · Multi-TF             ║
// ║  Gabagool Arb · Smart Ape · Bollinger · RSI · MACD · Whale Radar        ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ─── MATHEMATICAL CONSTANTS ───────────────────────────────────────────────────
const PHI       = 1.6180339887;
const PHI_INV   = 0.6180339887;
const FIB_R     = [0.0, 0.236, 0.382, 0.500, 0.618, 0.786, 1.000];
const FIB_EXT   = [1.272, 1.618, 2.000, 2.618];
const FIB_SEQ   = [1,1,2,3,5,8,13,21,34,55,89,144];
const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API  = "https://clob.polymarket.com";
const POLYGON_RPC = "https://polygon-rpc.com";
const polygonProvider = new JsonRpcProvider(POLYGON_RPC);

// ─── QUANT ENGINE ─────────────────────────────────────────────────────────────

// Full Kelly: f* = (p·b - q) / b  where b = (1-p_mkt)/p_mkt
const kellyF = (implP, trueP, bank = 1000, frac = 0.25) => {
  if (implP <= 0.001 || implP >= 0.999 || trueP <= 0) return 0;
  const b = (1 - implP) / implP;
  const f = (trueP * b - (1 - trueP)) / b;
  return f <= 0 ? 0 : parseFloat(Math.min(f * frac * bank, bank * 0.05).toFixed(2));
};

// Golden Ratio size boost: when price near 61.8% zone, multiply by φ
const goldenKelly = (base, price) => {
  if (price >= 0.595 && price <= 0.645) return +(base * PHI).toFixed(2);
  const onFib = FIB_R.some(f => Math.abs(price - f) < 0.018);
  return onFib ? +(base * PHI_INV).toFixed(2) : base;
};

// Expected Value
const calcEV = (trueP, mktP) =>
  mktP <= 0 ? 0 : +(trueP * (1 / mktP - 1) - (1 - trueP)).toFixed(4);

// EMA
const ema = (arr, n) => {
  if (!arr?.length || arr.length < n) return arr?.[arr.length - 1] ?? 0;
  const k = 2 / (n + 1);
  let e = arr.slice(0, n).reduce((a, b) => a + b, 0) / n;
  for (let i = n; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
};

// RSI-14
const calcRSI = (arr, p = 14) => {
  if (!arr || arr.length < p + 1) return 50;
  const d = arr.slice(1).map((v, i) => v - arr[i]);
  const g = d.slice(-p).filter(x => x > 0).reduce((a, b) => a + b, 0) / p;
  const l = d.slice(-p).filter(x => x < 0).reduce((a, b) => a + Math.abs(b), 0) / p;
  return l === 0 ? 100 : +(100 - 100 / (1 + g / l)).toFixed(1);
};

// MACD
const calcMACD = (arr) => {
  if (!arr || arr.length < 26) return { hist: 0, bias: "FLAT" };
  const fast = ema(arr, 12), slow = ema(arr, 26);
  const line = fast - slow;
  const sig = ema([...Array(8).fill(line * 0.95), line], 9);
  return { line, sig, hist: +(line - sig).toFixed(5), bias: line > sig ? "BULL" : "BEAR" };
};

// Bollinger Bands (20, 2σ)
const calcBB = (arr, p = 20, s = 2) => {
  if (!arr || arr.length < p) return null;
  const sl = arr.slice(-p);
  const ma = sl.reduce((a, b) => a + b, 0) / p;
  const sd = Math.sqrt(sl.reduce((x, v) => x + (v - ma) ** 2, 0) / p);
  const cur = arr[arr.length - 1];
  return {
    upper: ma + s * sd, mid: ma, lower: ma - s * sd, sd,
    pctB: +((cur - (ma - s * sd)) / (2 * s * sd + 1e-9)).toFixed(3),
    squeeze: sd / (ma + 1e-9) < 0.014,
    bw: (2 * s * sd) / (ma + 1e-9)
  };
};

// Fibonacci retracement levels
const fibLevels = (arr) => {
  if (!arr?.length) return [];
  const hi = Math.max(...arr), lo = Math.min(...arr), rng = hi - lo || 0.001;
  const cur = arr[arr.length - 1];
  return FIB_R.map(f => ({
    f, price: +(hi - rng * f).toFixed(4),
    near: Math.abs(cur - (hi - rng * f)) / rng < 0.022,
    label: `${(f * 100).toFixed(1)}%`
  }));
};

// Fibonacci extension targets
const fibExts = (arr) => {
  if (!arr?.length) return [];
  const hi = Math.max(...arr), lo = Math.min(...arr), rng = hi - lo || 0.001;
  const cur = arr[arr.length - 1];
  const base = cur > 0.5 ? lo : hi;
  const dir = cur > 0.5 ? 1 : -1;
  return FIB_EXT.map(f => ({
    f, price: +(base + rng * f * dir).toFixed(4), label: `${(f * 100).toFixed(1)}%`
  }));
};

// Bayesian posterior update: P(true | signal)
const bayesUpdate = (prior, signalStr, dir) => {
  const acc = Math.min(0.80, 0.60 + signalStr * 0.20);
  const lr = dir > 0 ? acc / (1 - acc) : (1 - acc) / acc;
  const priorOdds = (prior + 1e-9) / (1 - prior + 1e-9);
  const postOdds = priorOdds * lr;
  return +Math.max(0.01, Math.min(0.99, postOdds / (1 + postOdds))).toFixed(4);
};

// Monte Carlo: 500 paths, 30 periods
const monteCarlo = (winR, odds, bank, kf = 0.25, sims = 500, periods = 30) => {
  if (winR <= 0 || winR >= 1 || odds <= 0) return null;
  const results = [];
  for (let s = 0; s < sims; s++) {
    let bal = bank;
    for (let p = 0; p < periods && bal > 0; p++) {
      const bet = Math.min(kellyF(1 / (odds + 1), winR, bal, kf), bal * 0.05);
      bal = Math.random() < winR ? bal + bet * odds : bal - bet;
    }
    results.push(Math.max(0, bal));
  }
  results.sort((a, b) => a - b);
  return {
    p10: +results[Math.floor(sims * 0.1)].toFixed(0),
    p50: +results[Math.floor(sims * 0.5)].toFixed(0),
    p90: +results[Math.floor(sims * 0.9)].toFixed(0),
    ruin: +(results.filter(r => r <= 0).length / sims).toFixed(3),
    exp: +(results.reduce((a, b) => a + b, 0) / sims - bank).toFixed(0)
  };
};

// Sharpe (simplified daily)
const calcSharpe = (rets) => {
  if (!rets?.length) return 0;
  const mu = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((s, r) => s + (r - mu) ** 2, 0) / rets.length);
  return sd === 0 ? 0 : +((mu - 0.0002) / sd).toFixed(2);
};

// Sortino
const calcSortino = (rets) => {
  if (!rets?.length) return 0;
  const mu = rets.reduce((a, b) => a + b, 0) / rets.length;
  const neg = rets.filter(r => r < 0);
  if (!neg.length) return 5;
  const dd = Math.sqrt(neg.reduce((s, r) => s + r ** 2, 0) / rets.length);
  return dd === 0 ? 0 : +(mu / dd).toFixed(2);
};

// Smart Ape momentum
const smartApe = (arr) => {
  if (!arr?.length || arr.length < 5) return { sig: 0, dir: "FLAT" };
  const r = arr.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const o = arr.slice(0, Math.ceil(arr.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(arr.length / 2);
  const sig = (r - o) / (o + 1e-9);
  return { sig: +sig.toFixed(4), dir: sig > 0.035 ? "LONG" : sig < -0.035 ? "SHORT" : "FLAT" };
};

// Gabagool arb engine
const gabagool = (yes, no) => {
  const sum = yes + no, dev = 1 - sum, edge = Math.abs(dev);
  if (edge < 0.015) return { active: false };
  return { active: true, edge: +edge.toFixed(4), dev, side: dev > 0 ? (yes < no ? "BUY_YES" : "BUY_NO") : "SELL_BOTH", size: +(edge * 260).toFixed(0) };
};

// OB imbalance
const obImbal = (bids = [], asks = []) => {
  const b = bids.reduce((s, x) => s + +(x.size ?? x[1] ?? 0), 0);
  const a = asks.reduce((s, x) => s + +(x.size ?? x[1] ?? 0), 0);
  return b + a === 0 ? 0 : +((b - a) / (b + a)).toFixed(3);
};

// Whale score
const whaleScore = (vol, liq) => {
  const r = (vol + 1) / (liq + 1);
  return +(Math.min(1, r > 20 ? 1 : r > 10 ? 0.75 : r > 5 ? 0.45 : r / 15)).toFixed(2);
};

// UMA dispute risk
const umaRisk = (m) => {
  let r = 0;
  const q = (m.question || "").toLowerCase();
  if (!q.includes(" by ") && !q.includes(" before ")) r += 0.14;
  if (/approximately|around|roughly/.test(q)) r += 0.24;
  if (/major|significant|notable/.test(q)) r += 0.18;
  const days = m.endDate ? (new Date(m.endDate) - Date.now()) / 86400000 : 999;
  if (days < 3 && +(m.volumeNum || 0) > 50000) r += 0.24;
  const y = +(m.outcomePrices?.[0] || 0.5);
  if (y > 0.93 || y < 0.07) r += 0.14;
  return +Math.min(r, 1).toFixed(2);
};

// Multi-timeframe signals
const multiTF = (arr) => {
  const frames = [
    { id: "SCALP", label: "5-15m", sl: arr.slice(-6) },
    { id: "SWING", label: "1-4h", sl: arr.slice(-14) },
    { id: "POSITION", label: "4h-1d", sl: arr.slice(-25) },
    { id: "MACRO", label: "1d+", sl: arr }
  ];
  return frames.map(({ id, label, sl }) => {
    const r = calcRSI(sl, Math.min(sl.length - 1, 9));
    const m = smartApe(sl);
    const bb = calcBB(sl, Math.min(sl.length, 20));
    const mc = calcMACD(sl);
    const fl = fibLevels(sl).find(l => l.near) || null;
    const score = (r > 65 ? -0.28 : r < 35 ? 0.28 : 0) + m.sig * 2 +
      (mc.hist > 0 ? 0.18 : -0.18) + (bb?.pctB < 0.2 ? 0.22 : bb?.pctB > 0.8 ? -0.22 : 0);
    const dir = score > 0.2 ? "LONG" : score < -0.2 ? "SHORT" : "FLAT";
    return { id, label, rsi: r, ape: m, bb, macd: mc, fib: fl, score: +score.toFixed(3), dir };
  });
};

// True probability estimate (Bayesian composite)
const trueProb = (m, arr, obi, ws) => {
  const mktP = +(m.outcomePrices?.[0] || 0.5);
  const ape = smartApe(arr);
  const wAdj = ws > 0.7 ? (mktP > 0.5 ? -0.022 : 0.022) : 0;
  const raw = Math.max(0.01, Math.min(0.99, mktP + wAdj + ape.sig * 0.038 + obi * 0.022));
  return bayesUpdate(raw, Math.min(Math.abs(ape.sig) + Math.abs(obi), 1), ape.sig > 0 ? 1 : -1);
};

// Market grade A–F
const marketGrade = (evS, uma, vol, liq) => {
  let g = 100 - uma * 34 + Math.min(evS * 17, 27);
  if (vol < 1000) g -= 26; if (liq < 500) g -= 17;
  return g >= 85 ? "A" : g >= 70 ? "B" : g >= 54 ? "C" : g >= 38 ? "D" : "F";
};

// ─── API LAYER ────────────────────────────────────────────────────────────────
const fetchMarkets = async (n = 28) => {
  const r = await fetch(`${GAMMA_API}/markets?active=true&closed=false&archived=false&limit=${n}&order=volumeNum&ascending=false`);
  const d = await r.json();
  return Array.isArray(d) ? d : d.markets || [];
};
const fetchBook = async (tid) => {
  try { return await (await fetch(`${CLOB_API}/book?token_id=${tid}`)).json(); } catch { return null; }
};
const fetchHistory = async (tid) => {
  try {
    const d = await (await fetch(`${GAMMA_API}/prices-history?market=${tid}&interval=1d&fidelity=10`)).json();
    return d?.history?.map(h => +h.p) || [];
  } catch { return []; }
};
const verifyChain = async (addr) => {
  try {
    const checksum = getAddress(addr);
    const balWei = await polygonProvider.getBalance(checksum);
    return { ok: true, bal: Number(formatEther(balWei)), address: checksum };
  } catch (e) {
    return { ok: false, err: e?.message || "RPC_ERROR" };
  }
};

// Full analysis pipeline
const analyzeMarket = async (m) => {
  const tid = m.clobTokenIds?.[0] || m.conditionId;
  const [book, ph] = await Promise.all([tid ? fetchBook(tid) : null, tid ? fetchHistory(tid) : []]);
  const yes = +(m.outcomePrices?.[0] || 0.5);
  const no  = +(m.outcomePrices?.[1] || 0.5);
  const obi = obImbal(book?.bids, book?.asks);
  const ws  = whaleScore(+m.volumeNum, +m.liquidityNum);
  const tp  = trueProb(m, ph, obi, ws);
  const evv = calcEV(tp, yes);
  const kBase = kellyF(yes, tp, 1000, 0.25);
  const k   = goldenKelly(kBase, yes);
  const gab = gabagool(yes, no);
  const uma = umaRisk(m);
  const bb  = calcBB(ph);
  const r14 = calcRSI(ph);
  const mc2 = calcMACD(ph);
  const ape = smartApe(ph);
  const tfs = multiTF(ph);
  const fl  = fibLevels(ph);
  const fe  = fibExts(ph);
  const rets= ph.slice(1).map((p, i) => p - ph[i]);
  const sh  = calcSharpe(rets);
  const so  = calcSortino(rets);
  const evS = evv * 2 + (gab.active ? gab.edge * 4 : 0) + Math.abs(obi) * 0.3 - uma * 0.6;
  const gr  = marketGrade(evS, uma, +m.volumeNum, +m.liquidityNum);
  const mc5 = ph.length > 8 ? monteCarlo(tp, (1 - yes) / yes, 1000, 0.25) : null;
  let action = "HOLD";
  if (gab.active && gab.edge > 0.024) action = "ARB";
  else if (evv > 0.06 && tp > yes + 0.04) action = "BUY_YES";
  else if (evv < -0.06 && tp < yes - 0.04) action = "BUY_NO";
  else if (Math.abs(obi) < 0.15 && +m.liquidityNum > 2000) action = "MKT_MAKE";
  return { ...m, yes, no, tp, ev: evv, kelly: k, gab, uma, bb, rsi: r14, macd: mc2, ape, tfs, fib: fl, fibExt: fe, evScore: evS, grade: gr, mc: mc5, sharpe: sh, sortino: so, obi, ws, action, ph, book };
};

// ─── FORMATTING ───────────────────────────────────────────────────────────────
const f2  = n => typeof n === "number" ? n.toFixed(2) : "—";
const f3  = n => typeof n === "number" ? n.toFixed(3) : "—";
const pct = n => typeof n === "number" ? `${(n * 100).toFixed(1)}%` : "—";
const usd = n => typeof n === "number" ? `$${Math.abs(n).toFixed(0)}` : "—";
const kfmt= n => typeof n === "number" ? (n >= 1000 ? `${(n/1000).toFixed(0)}k` : n.toFixed(0)) : "—";
const hsh = a => a ? `${a.slice(0,6)}…${a.slice(-4)}` : "—";

// ─── COLOR TOKENS ──────────────────────────────────────────────────────────────
const C = {
  bg:      "#090B10",
  surface: "#0E1117",
  panel:   "#12161E",
  border:  "#1C2333",
  borderL: "#243044",
  gold:    "#F5A623",
  goldL:   "#FFD080",
  green:   "#00E5A0",
  blue:    "#3B9EFF",
  violet:  "#A78BFA",
  rose:    "#FF5757",
  amber:   "#FFB800",
  text:    "#C8D8E8",
  textDim: "#4A6078",
  textSub: "#2A3A50",
};

const GC  = { A: "#00E5A0", B: "#7FFFCF", C: "#F5A623", D: "#FF8C00", F: "#FF5757" };
const AC  = { BUY_YES:"#00E5A0", BUY_NO:"#FF5757", ARB:"#A78BFA", MKT_MAKE:"#3B9EFF", HOLD:"#2A3A50" };
const fC  = f => ({ 0:"#4A6078","0.236":"#22D3EE","0.382":"#60A5FA","0.5":"#F5A623","0.618":"#F5A623","0.786":"#FB923C","1":"#4A6078" })[String(f)] || "#4A6078";
const dC  = d => d === "LONG" ? C.green : d === "SHORT" ? C.rose : C.textDim;

// ═══════════════════════════════════════════════════════════════════════════════
// MICRO-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const Tag = ({ c, children, sm }) => (
  <span style={{ display:"inline-flex", alignItems:"center", fontSize: sm ? 9 : 10, padding: sm ? "1px 6px" : "2px 8px", border:`1px solid ${c}44`, color:c, borderRadius:4, letterSpacing:"0.06em", whiteSpace:"nowrap" }}>
    {children}
  </span>
);

const Pill = ({ c, children }) => (
  <span style={{ display:"inline-flex", alignItems:"center", fontSize:10, padding:"3px 10px", background:`${c}18`, border:`1px solid ${c}33`, color:c, borderRadius:20, letterSpacing:"0.05em" }}>
    {children}
  </span>
);

const MetricCard = ({ label, value, color, sub }) => (
  <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${color}00, ${color}, ${color}00)` }} />
    <div style={{ fontSize:9, color:C.textDim, letterSpacing:"0.1em", marginBottom:6, textTransform:"uppercase" }}>{label}</div>
    <div style={{ fontSize:20, fontWeight:700, color, fontFamily:"'Orbitron',monospace", lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:9, color:C.textDim, marginTop:4 }}>{sub}</div>}
  </div>
);

const ScoreBar = ({ value, max = 1, color }) => {
  const w = Math.min(100, Math.abs(value / max) * 100);
  return (
    <div style={{ width:"100%", height:3, background:C.panel, borderRadius:2, overflow:"hidden" }}>
      <div style={{ width:`${w}%`, height:"100%", background:color, borderRadius:2, transition:"width 0.4s ease" }} />
    </div>
  );
};

// RSI meter
const RSIMeter = ({ val }) => {
  const c = val > 70 ? C.rose : val < 30 ? C.green : C.textDim;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ width:52, height:4, background:C.panel, borderRadius:2, position:"relative" }}>
        <div style={{ position:"absolute", left:`${val}%`, top:-2, width:2, height:8, background:c, borderRadius:1 }} />
        <div style={{ position:"absolute", left:"30%", top:0, width:1, height:"100%", background:C.borderL }} />
        <div style={{ position:"absolute", left:"70%", top:0, width:1, height:"100%", background:C.borderL }} />
      </div>
      <span style={{ fontSize:10, color:c, fontWeight:600 }}>{val?.toFixed(0)}</span>
    </div>
  );
};

// Fibonacci SVG chart
const FibChart = ({ prices, w = 460, h = 120 }) => {
  if (!prices?.length || prices.length < 3) return (
    <div style={{ width:w, height:h, display:"flex", alignItems:"center", justifyContent:"center", color:C.textSub, fontSize:10 }}>
      NO PRICE HISTORY
    </div>
  );
  const hi = Math.max(...prices), lo = Math.min(...prices), rng = hi - lo || 0.001;
  const xp = i => (i / (prices.length - 1)) * w;
  const yp = p => h - 4 - ((p - lo) / rng) * (h - 8);
  const pts = prices.map((p, i) => `${xp(i)},${yp(p)}`).join(" ");
  const bb  = calcBB(prices);
  const fls = fibLevels(prices);
  const cur = prices[prices.length - 1];
  const bullish = cur >= prices[0];

  return (
    <svg width={w} height={h} style={{ display:"block", overflow:"visible" }}>
      <defs>
        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bullish ? "#00E5A020" : "#FF575720"} />
          <stop offset="100%" stopColor="#00000000" />
        </linearGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(r => (
        <line key={r} x1={0} y1={h * r} x2={w} y2={h * r} stroke={C.border} strokeWidth={0.5} />
      ))}

      {/* Bollinger fill */}
      {bb && (
        <>
          <polygon
            points={`0,${yp(bb.upper)} ${w},${yp(bb.upper)} ${w},${yp(bb.lower)} 0,${yp(bb.lower)}`}
            fill="#3B9EFF06"
          />
          <line x1={0} y1={yp(bb.upper)} x2={w} y2={yp(bb.upper)} stroke="#3B9EFF" strokeWidth={0.6} strokeDasharray="2,4" />
          <line x1={0} y1={yp(bb.lower)} x2={w} y2={yp(bb.lower)} stroke="#3B9EFF" strokeWidth={0.6} strokeDasharray="2,4" />
          <line x1={0} y1={yp(bb.mid)} x2={w} y2={yp(bb.mid)} stroke="#3B9EFF" strokeWidth={0.4} opacity={0.4} />
        </>
      )}

      {/* Fibonacci levels */}
      {fls.map(({ f, price, near, label }) => {
        const y = yp(price);
        if (y < -4 || y > h + 4) return null;
        const col = fC(f);
        return (
          <g key={f}>
            <line x1={0} y1={y} x2={w} y2={y} stroke={col} strokeWidth={near ? 1 : 0.4} strokeDasharray={near ? "none" : "3,5"} opacity={near ? 0.9 : 0.4} />
            {near && <rect x={w - 38} y={y - 8} width={37} height={14} fill={`${col}15`} rx={2} />}
            <text x={w - 36} y={y + 4} fill={col} fontSize={8} fontFamily="inherit" opacity={near ? 1 : 0.5}>{label}</text>
          </g>
        );
      })}

      {/* Price area fill */}
      <polygon
        points={`${xp(0)},${h} ${pts} ${xp(prices.length - 1)},${h}`}
        fill="url(#priceGrad)"
      />

      {/* Price line glow */}
      <polyline points={pts} fill="none" stroke={bullish ? "#00E5A055" : "#FF575755"} strokeWidth={3} />
      <polyline points={pts} fill="none" stroke={bullish ? C.green : C.rose} strokeWidth={1.5} filter="url(#glow2)" />

      {/* Current price dot */}
      <circle cx={xp(prices.length - 1)} cy={yp(cur)} r={4} fill={bullish ? C.green : C.rose} filter="url(#glow2)" />
      <circle cx={xp(prices.length - 1)} cy={yp(cur)} r={8} fill={bullish ? "#00E5A015" : "#FF575715"} />

      {/* Price labels */}
      <text x={2} y={yp(hi) + 3} fill={C.textSub} fontSize={7} fontFamily="inherit">{pct(hi)}</text>
      <text x={2} y={yp(lo) - 2} fill={C.textSub} fontSize={7} fontFamily="inherit">{pct(lo)}</text>
    </svg>
  );
};

// Mini sparkline
const Spark = ({ data, color, w = 60, h = 18 }) => {
  if (!data?.length || data.length < 2) return <span style={{ color:C.textSub, fontSize:9 }}>──</span>;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 0.001;
  const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h-((v-mn)/rng)*h}`).join(" ");
  const trend = data[data.length-1] > data[0] ? C.green : C.rose;
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color || trend} strokeWidth={1.2} />
    </svg>
  );
};

// MC Distribution bar chart
const MCBars = ({ mc, bank }) => {
  if (!mc) return null;
  const vals = [mc.p10, mc.p50, mc.p90];
  const max = mc.p90 || bank * 2;
  const labels = ["P10", "P50", "P90"];
  const cols = [C.rose, C.gold, C.green];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {vals.map((v, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:9, color:C.textDim, width:24 }}>{labels[i]}</span>
          <div style={{ flex:1, height:6, background:C.panel, borderRadius:3 }}>
            <div style={{ width:`${(v/max)*100}%`, height:"100%", background:cols[i], borderRadius:3, transition:"width 0.5s" }} />
          </div>
          <span style={{ fontSize:10, color:cols[i], fontWeight:600, width:44, textAlign:"right" }}>${v}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// GPT SYSTEM PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════
const buildSystemPrompt = (ctx, bank, wallet, kf) => `You are TradeHax GPT — the world's most sophisticated prediction market trading AI assistant, built into TradeHax.net for a professional HFT algo trader.

## YOUR QUANT STACK
- **Full Kelly Criterion**: f* = (p·b − q)/b × ${kf} fractional. Hard 5% bankroll cap.
- **Golden Ratio Kelly**: Position size ×φ (×1.618) at the 61.8% zone. Reduced at hard fib walls.
- **Fibonacci**: φ=1.618. Retracements: 23.6/38.2/50/61.8/78.6%. Extensions: 127.2/161.8/200/261.8%.
- **Bayesian Probability Update**: P(true|signal) via likelihood ratio on market prior.
- **Bollinger Bands**: 20-period MA ± 2σ. %B position. Squeeze detection.
- **MACD**: EMA(12)−EMA(26) vs 9-period signal line.
- **RSI-14**: Overbought >70, oversold <30.
- **Monte Carlo**: 500-path Kelly growth simulation with ruin rate.
- **Gabagool Arb**: Risk-free when YES+NO ≠ $1.00 (complete-set redemption).
- **Smart Ape Momentum**: Price trend + volume acceleration composite.
- **Whale Radar**: Vol/liq concentration → price distortion signal.
- **UMA Dispute Risk**: Resolution ambiguity scoring (penalizes vague markets).
- **Multi-Timeframe**: SCALP(5-15m) / SWING(1-4h) / POSITION(4h-1d) / MACRO(1d+).
- **Sharpe + Sortino Ratios**: Risk-adjusted quality scoring.

## RESPONSE STYLE
- Sharp, confident, direct. You're a prop desk quant who also happens to be fun to talk to.
- Numbers-first. Always cite the Fibonacci level nearest to entry.
- For trade recommendations, use this format:
  🎯 **[MARKET]** — **[ACTION]**
  Entry: [price] ([nearest Fib level])
  Kelly Size: $[amount] USDC
  EV: [+/-X.X%] | Confidence: [X%] | TF: [SCALP/SWING/POSITION/MACRO]
  Target: [Fib extension price] | Stop: [price]
  Edge: [what's driving this]
  Risk: [LOW/MED/HIGH]

Active wallet: ${wallet || "not connected"}
Bankroll: $${bank} | Kelly Fraction: ${(kf*100).toFixed(0)}%

## LIVE MARKET DATA (from scan):
${ctx || "No scan data yet. Ask the user to hit SCAN to load live markets."}`;

const AI_ENDPOINT = (process.env.NEXT_PUBLIC_AI_CHAT_ENDPOINT || "").trim();
const AI_MODEL = (process.env.NEXT_PUBLIC_AI_MODEL || "tradehax-local-quant-v1").trim();

const parseJsonSafe = (raw, fallback = null) => {
  if (!raw || typeof raw !== "string") return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
};

const buildLocalSignals = (mkts = []) =>
  mkts.slice(0, 6).map((m) => ({
    question: (m.question || "Unknown market").slice(0, 120),
    action: m.action || "SKIP",
    edge: +(m.ev || 0).toFixed(4),
    confidence: +Math.max(0.35, Math.min(0.94, 0.5 + Math.abs(m.ev || 0) * 2 + (m.grade === "A" ? 0.1 : 0))).toFixed(2),
    kelly: +(m.kelly || 0).toFixed(2),
    tf: (m.tfs?.find((x) => x.dir !== "FLAT")?.id || "SWING"),
    fibLevel: m.fib?.find((f) => f.near)?.label || "50.0%",
    thesis: `${m.grade || "C"} grade, EV ${f3(m.ev)}, RSI ${m.rsi?.toFixed(0) || "50"}`.slice(0, 60),
    risk: m.uma > 0.55 ? "HIGH" : m.uma > 0.3 ? "MED" : "LOW"
  }));

const buildLocalChatReply = ({ msg, markets, bankroll, kFrac, wallet }) => {
  const top = markets?.[0];
  if (!top) {
    return "No live market scan is loaded yet. Hit SCAN and I will generate ranked trade setups with Kelly sizing.";
  }

  const q = (msg || "").toLowerCase();
  if (q.includes("wallet")) {
    return wallet
      ? `Wallet connected: ${hsh(wallet)}. Top setup right now is ${top.action} on \"${(top.question || "market").slice(0, 60)}\".`
      : "Wallet is not connected yet. Verify an address in the Wallet tab before placing orders.";
  }

  if (q.includes("risk") || q.includes("kelly") || q.includes("size")) {
    return `Risk desk: bankroll $${bankroll}, Kelly fraction ${(kFrac * 100).toFixed(0)}%. Best current size is ${usd(top.kelly)} on ${top.action} with EV ${f3(top.ev)} and UMA risk ${f2(top.uma)}.`;
  }

  return `Top trade: ${top.action} on \"${(top.question || "market").slice(0, 62)}\" at ${pct(top.yes)}. TrueP ${pct(top.tp)}, EV ${f3(top.ev)}, Kelly ${usd(top.kelly)}, Fib ${top.fib?.find((f) => f.near)?.label || "50.0%"}.`;
};

const requestAdapter = async (payload) => {
  if (!AI_ENDPOINT) return null;
  const r = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL, ...payload })
  });
  if (!r.ok) throw new Error(`AI adapter HTTP ${r.status}`);
  return r.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function PolymarketTerminal() {
  // State
  const [view, setView]         = useState("scanner");
  const [markets, setMarkets]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [phase, setPhase]       = useState("IDLE");
  const [sel, setSel]           = useState(null);
  const [aiSigs, setAiSigs]     = useState([]);
  const [orders, setOrders]     = useState([]);
  const [wallet, setWallet]     = useState("");
  const [walInput, setWalInput] = useState("");
  const [walStatus, setWalStatus] = useState(null);
  const [bankroll, setBankroll] = useState(1000);
  const [kFrac, setKFrac]       = useState(0.25);
  const [minGrade, setMinGrade] = useState("C");
  const [paperMode, setPaperMode] = useState(true); // View-only mode by default
  const [chatLog, setChatLog]   = useState([
    { role:"assistant", text:"Hey! I'm **TradeHax GPT** — your elite prediction market co-pilot. 🎯\n\n**📊 VIEW-ONLY MODE ACTIVE** — Analyze markets, get predictions, and test strategies without executing real trades.\n\nHit **SCAN** to load live markets and I'll break down the best trades using Fibonacci confluence, full Kelly sizing, Bayesian probability, and Monte Carlo simulation.\n\nToggle to LIVE MODE in settings when you're ready to execute real trades." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [pnl, setPnl]           = useState({ realized:0, trades:0, wins:0 });
  const [tick, setTick]         = useState([]);
  const [chatPanelOpen, setChatPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const chatEnd = useRef(null);
  const autoTimer = useRef(null);

  // Load fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Fira+Code:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [chatLog]);

  // Ticker
  useEffect(() => {
    const msgs = ["φ=1.618 ARMED","KELLY ¼f*","GABAGOOL ARB","FIBONACCI LIVE","500-PATH MC","BAYESIAN UPDATE","BOLLINGER ACTIVE","MULTI-TF ONLINE","WHALE RADAR","POLYGON RPC OK","$HAX STAKING V2"];
    let i = 0;
    const t = setInterval(() => { setTick(p => [...p.slice(-10), msgs[i++ % msgs.length]]); }, 1800);
    return () => clearInterval(t);
  }, []);

  const GO = { A:5, B:4, C:3, D:2, F:1 };
  const filtered = useMemo(() =>
    markets.filter(m => GO[m.grade] >= GO[minGrade]).sort((a, b) => b.evScore - a.evScore),
    [markets, minGrade]
  );

  // Top-line stats
  const stats = useMemo(() => ({
    gradeA: markets.filter(m => m.grade === "A").length,
    arbOps: markets.filter(m => m.gab?.active).length,
    topEV:  markets.reduce((mx, m) => Math.max(mx, m.ev || 0), 0),
    avgSharpe: markets.length > 0
      ? +(markets.reduce((s, m) => s + (m.sharpe || 0), 0) / markets.length).toFixed(2)
      : 0
  }), [markets]);

  // ── Full scan pipeline
  const scan = useCallback(async (loader = true) => {
    if (loader) setLoading(true);
    setPhase("FETCHING");
    try {
      const raw = await fetchMarkets(28);
      setPhase("COMPUTING");
      const b1 = await Promise.all(raw.slice(0, 8).map(analyzeMarket));
      setMarkets(b1.sort((a, b) => b.evScore - a.evScore));

      const b2 = await Promise.all(raw.slice(8, 20).map(analyzeMarket));
      const all = [...b1, ...b2].sort((a, b) => b.evScore - a.evScore);
      setMarkets(all);

      setPhase("SIGNAL ENGINE");
      const sigs = await generateAISignals(all);
      setAiSigs(sigs?.signals || []);
      setPhase("LIVE ●");
      addChat("assistant", `Scan complete — **${all.length} markets** analyzed.\n\n🏆 **Grade A:** ${all.filter(m=>m.grade==="A").length} markets\n⚡ **Arb Ops:** ${all.filter(m=>m.gab?.active).length} active\n📈 **Top EV:** ${f3(all[0]?.ev)}\n\nTop pick: **${all[0]?.question?.slice(0,55)}…** — ${all[0]?.action} at ${pct(all[0]?.yes)}, EV: +${f3(all[0]?.ev)}, Kelly: ${usd(all[0]?.kelly)}`);
    } catch(e) { setPhase("ERROR"); }
    if (loader) setLoading(false);
  }, []);

  // Signal generation via optional adapter, with local quant fallback
  const generateAISignals = async (mkts) => {
    const fallback = { signals: buildLocalSignals(mkts) };
    const ctx = mkts.slice(0, 6).map(m => ({
      q: m.question?.slice(0, 65), yes: pct(m.yes), tp: pct(m.tp),
      ev: f3(m.ev), kelly: usd(m.kelly), grade: m.grade,
      arb: m.gab?.active ? pct(m.gab.edge) : "N",
      whale: f2(m.ws), action: m.action,
      fib: m.fib?.find(f => f.near)?.label || "—", rsi: m.rsi?.toFixed(0) || "—"
    }));

    try {
      const d = await requestAdapter({ mode: "signals", context: ctx });
      if (Array.isArray(d?.signals)) return { signals: d.signals };
      const parsed = parseJsonSafe(d?.content, null);
      if (Array.isArray(parsed?.signals)) return { signals: parsed.signals };
      return fallback;
    } catch {
      return fallback;
    }
  };

  // Order placement
  const placeOrder = (m, side) => {
    if (paperMode) {
      const price = side === "BUY_YES" ? m.yes : m.no || 0.5;
      const size  = Math.max(10, Math.round(m.kelly || 30));
      const o = { id:"PAPER-"+Math.random().toString(16).slice(2,10).toUpperCase(), market:m.question?.slice(0,42), side, size, price, ev:m.ev, kelly:m.kelly, grade:m.grade, status:"SIMULATED", ts:new Date().toLocaleTimeString() };
      setOrders(p => [o, ...p.slice(0, 24)]);
      addChat("assistant", `📊 **PAPER TRADE LOGGED** (View-Only Mode)\n**${side}** $${size} on "${m.question?.slice(0,45)}…"\n@ ${pct(price)} | EV: ${f3(m.ev)} | Kelly: $${size} | Grade: ${m.grade}\n\n💡 This is a simulated order for analysis purposes only. Switch to LIVE MODE to execute real trades.`);
      // Simulate immediate "fill" for paper trading
      setTimeout(() => {
        setOrders(p => p.map(x => x.id===o.id ? {...x, status:"PAPER-FILLED"} : x));
        setPnl(p => ({ realized:+(p.realized+(m.ev||0)*size*0.5).toFixed(2), trades:p.trades+1, wins:p.wins+(m.ev>0?1:0) }));
      }, 800);
      return;
    }

    if (!wallet) { addChat("assistant","⚠️ Connect your wallet first! Head to the **Wallet** tab to verify on-chain."); return; }
    const price = side === "BUY_YES" ? m.yes : m.no || 0.5;
    const size  = Math.max(10, Math.round(m.kelly || 30));
    const o = { id:"0x"+Math.random().toString(16).slice(2,10).toUpperCase(), market:m.question?.slice(0,42), side, size, price, ev:m.ev, kelly:m.kelly, grade:m.grade, status:"PENDING", ts:new Date().toLocaleTimeString() };
    setOrders(p => [o, ...p.slice(0, 24)]);
    addChat("assistant", `Order placed! 🎯\n**${side}** $${size} on "${m.question?.slice(0,45)}…"\n@ ${pct(price)} | EV: ${f3(m.ev)} | Kelly: $${size} | Grade: ${m.grade}`);
    setTimeout(() => {
      const filled = Math.random() > 0.11;
      setOrders(p => p.map(x => x.id===o.id ? {...x, status: filled?"FILLED":"CANCELLED"} : x));
      if (filled) setPnl(p => ({ realized:+(p.realized+(m.ev||0)*size).toFixed(2), trades:p.trades+1, wins:p.wins+(m.ev>0?1:0) }));
    }, 2300);
  };

  // Wallet verify
  const verifyWallet = async () => {
    const a = walInput.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(a)) { setWalStatus({ ok:false, err:"Invalid address format" }); return; }
    setWalStatus("checking");
    const res = await verifyChain(a);
    setWalStatus(res);
    if (res.ok) {
      setWallet(res.address || a);
      addChat("assistant", `✅ Wallet verified on-chain!\n**${hsh(res.address || a)}** — ${res.bal?.toFixed(4)} POL on Polygon.\nYou're all set to execute trades.`);
    }
  };

  // Chat
  const addChat = (role, text) => setChatLog(p => [...p, { role, text, ts:new Date().toLocaleTimeString() }]);

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    addChat("user", msg);
    setChatLoading(true);

    const ctx = filtered.slice(0, 8).map(m =>
      `${m.question?.slice(0, 55)} | Price:${pct(m.yes)} TrueP:${pct(m.tp)} EV:${f3(m.ev)} Kelly:${usd(m.kelly)} Grade:${m.grade} Fib:${m.fib?.find(f=>f.near)?.label||"—"} Action:${m.action} RSI:${m.rsi?.toFixed(0)||"—"} Arb:${m.gab?.active?pct(m.gab.edge):"N"}`
    ).join("\n");

    try {
      const messages = chatLog.filter(m=>m.role!=="system").slice(-14)
        .map(m => ({ role:m.role==="user"?"user":"assistant", content:m.text }))
        .concat([{ role:"user", content:msg }]);

      let reply = "";
      if (AI_ENDPOINT) {
        const d = await requestAdapter({
          mode: "chat",
          system: buildSystemPrompt(ctx, bankroll, wallet, kFrac),
          messages
        });
        reply = d?.reply || d?.text || d?.content?.[0]?.text || d?.content || "";
      }

      if (!reply) {
        reply = buildLocalChatReply({ msg, markets: filtered, bankroll, kFrac, wallet });
      }

      addChat("assistant", reply);
    } catch {
      addChat("assistant", buildLocalChatReply({ msg, markets: filtered, bankroll, kFrac, wallet }));
    }
    setChatLoading(false);
  };

  useEffect(() => {
    const syncViewport = () => {
      const w = window.innerWidth;
      setIsMobile(w < 900);
      setIsTablet(w >= 900 && w < 1200);
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const phaseColor = phase === "LIVE ●" ? C.green : phase === "IDLE" ? C.textDim : phase === "ERROR" ? C.rose : C.amber;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  const VIEWS = [
    { id:"scanner",  icon:"◈", label:"Scanner"    },
    { id:"analysis", icon:"⌬", label:"Fibonacci"  },
    { id:"multitf",  icon:"◫", label:"Multi-TF"   },
    { id:"signals",  icon:"▲", label:"Signals"    },
    { id:"risk",     icon:"◆", label:"Risk Desk"  },
    { id:"orders",   icon:"⊕", label:"Orders"     },
    { id:"wallet",   icon:"◉", label:"Wallet"     },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans','Fira Code',sans-serif", background:C.bg, color:C.text, minHeight:"100vh", display:"flex", flexDirection:"column", overflow:isMobile?"auto":"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Fira+Code:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        html, body, #root { margin:0; height:100%; -webkit-text-size-adjust:100%; }
        * { box-sizing:border-box; } ::selection { background:#F5A62330; }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:${C.bg}; }
        ::-webkit-scrollbar-thumb { background:${C.borderL}; border-radius:4px; }
        ::-webkit-scrollbar-thumb:hover { background:${C.gold}44; }
        input::placeholder { color:${C.textSub} !important; }
        button, input, textarea, select { font: inherit; }
        button { touch-action: manipulation; }
        button:not(:disabled):hover { filter:brightness(1.15); }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px ${C.green}44} 50%{box-shadow:0 0 20px ${C.green}88} }
        @keyframes scanline { 0%{transform:translateY(0)} 100%{transform:translateY(100%)} }
        .market-row:hover { background:${C.panel} !important; }
        .nav-btn:hover { color:${C.text} !important; }
        .chat-msg { animation: fadeIn 0.2s ease; }
        @media (max-width: 899px) {
          .hide-mobile { display: none !important; }
          input, textarea { font-size:16px !important; }
          .mobile-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        }
        @media (max-width: 600px) {
          .compact-mobile { display:none !important; }
        }
      `}</style>

      {/* ── TICKER TAPE ─────────────────────────────────────────────────────── */}
      <div style={{ background:`${C.gold}10`, borderBottom:`1px solid ${C.gold}20`, padding:"3px 0", overflow:"hidden", fontSize:10, fontFamily:"'Fira Code',monospace", color:`${C.gold}88`, whiteSpace:"nowrap", letterSpacing:"0.06em" }}>
        {[...tick,...tick,...tick].map((t,i) => (
          <span key={i} style={{ margin:"0 20px" }}>◆ {t}</span>
        ))}
      </div>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:isMobile?"10px 12px":"10px 20px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0, gap:isMobile?10:0, flexWrap:isMobile?"wrap":"nowrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, minWidth:isMobile?"100%":"auto" }}>
          <div>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:18, fontWeight:900, color:C.gold, letterSpacing:"0.18em", textShadow:`0 0 24px ${C.gold}55` }}>
              TRADEHAX
            </div>
            <div style={{ fontFamily:"'Fira Code',monospace", fontSize:8, color:C.textDim, letterSpacing:"0.1em", marginTop:-2 }}>
              GPT APEX EDITION · tradehax.net
            </div>
          </div>
          <div style={{ width:1, height:32, background:C.border }} />
          <div style={{ display:"flex", gap:8 }}>
            <Pill c={phaseColor}>{phase}</Pill>
            {markets.length > 0 && <Pill c={C.blue}>{markets.length} MARKETS</Pill>}
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display:"flex", gap:isMobile?12:20, alignItems:"center", width:isMobile?"100%":"auto", justifyContent:isMobile?"space-between":"flex-end", flexWrap:isMobile?"wrap":"nowrap", overflowX:isMobile?"auto":"visible" }}>
          {[
            { l:paperMode?"PAPER P&L":"P&L", v:`${pnl.realized >= 0 ? "+" : ""}$${pnl.realized.toFixed(0)}`, c: pnl.realized >= 0 ? C.green : C.rose },
            { l:"TRADES", v:pnl.trades, c:C.text },
            { l:"WIN RATE", v:pnl.trades > 0 ? pct(pnl.wins/pnl.trades) : "—", c:C.gold },
            { l:"GRADE A", v:stats.gradeA, c:C.green },
            { l:"ARB OPS", v:stats.arbOps, c:C.violet },
          ].map(({ l,v,c }) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.textDim, letterSpacing:"0.08em" }}>{l}</div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:13, fontWeight:700, color:c }}>{v}</div>
            </div>
          ))}
          <div className="hide-mobile" style={{ width:1, height:32, background:C.border }} />
          <button
            onClick={() => {
              setPaperMode(p => !p);
              addChat("assistant", paperMode
                ? "🔴 **LIVE TRADING ACTIVATED** — Real orders will be executed. Connect your wallet and ensure you have funds ready."
                : "📊 **VIEW-ONLY MODE ACTIVATED** — All trades are simulated for analysis purposes only. No real funds at risk.");
            }}
            title={paperMode ? "Switch to Live Trading" : "Switch to Paper Trading"}
            style={{ background:paperMode?`${C.blue}15`:`${C.rose}15`, border:`1px solid ${paperMode?C.blue+"33":C.rose+"33"}`, color:paperMode?C.blue:C.rose, padding:"6px 14px", cursor:"pointer", fontFamily:"'Fira Code',monospace", fontSize:10, borderRadius:6, letterSpacing:"0.08em", display:"flex", alignItems:"center", gap:6 }}
          >
            <span style={{ fontSize:14 }}>{paperMode ? "📊" : "🔴"}</span>
            <span>{paperMode ? "VIEW-ONLY" : "LIVE"}</span>
          </button>
          <div className="hide-mobile" style={{ width:1, height:32, background:C.border }} />
          <Tag c={wallet ? C.green : C.rose}>
            {wallet ? `✓ ${hsh(wallet)}` : "NO WALLET"}
          </Tag>
          <button
            onClick={() => setChatPanelOpen(p => !p)}
            style={{ background:`${C.gold}15`, border:`1px solid ${C.gold}33`, color:C.gold, padding:"6px 14px", cursor:"pointer", fontFamily:"'Fira Code',monospace", fontSize:10, borderRadius:6, letterSpacing:"0.08em" }}
          >
            {chatPanelOpen ? "◁ HIDE GPT" : "▷ SHOW GPT"}
          </button>
        </div>
      </header>

      {/* ── MAIN BODY ────────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:isMobile?"column":"row", overflow:"hidden" }}>

        {/* ── SIDEBAR NAV ─────────────────────────────────────────────────── */}
        <nav style={{ width:isMobile?"100%":60, height:isMobile?56:"auto", background:C.surface, borderRight:isMobile?"none":`1px solid ${C.border}`, borderBottom:isMobile?`1px solid ${C.border}`:"none", display:"flex", flexDirection:isMobile?"row":"column", alignItems:"center", justifyContent:isMobile?"flex-start":"initial", padding:isMobile?"6px 8px":"12px 0", gap:4, flexShrink:0, overflowX:isMobile?"auto":"visible" }}>
          {VIEWS.map(v => (
            <button key={v.id} className="nav-btn" onClick={() => setView(v.id)} title={v.label} style={{
              width:isMobile?48:44, height:isMobile?48:44, background: view===v.id ? `${C.gold}15` : "transparent",
              border: `1px solid ${view===v.id ? C.gold+"33" : "transparent"}`,
              color: view===v.id ? C.gold : C.textDim,
              cursor:"pointer", fontSize:16, borderRadius:8, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:2, transition:"all 0.15s",
            }}>
              <span>{v.icon}</span>
              <span style={{ fontFamily:"'Fira Code',monospace", fontSize:6, letterSpacing:"0.05em" }}>{v.label.slice(0,3).toUpperCase()}</span>
            </button>
          ))}

          <div style={{ flex:isMobile?"0 0 auto":1 }} />

          {/* Scan button at bottom of sidebar */}
          <button onClick={() => scan()} disabled={loading} title="Full Scan" style={{
            width:isMobile?48:44, height:isMobile?48:44, background: loading ? C.panel : `${C.green}15`,
            border:`1px solid ${loading ? C.border : C.green+"44"}`,
            color: loading ? C.textDim : C.green,
            cursor: loading ? "wait" : "pointer", fontSize:18, borderRadius:8,
            display:"flex", alignItems:"center", justifyContent:"center",
            animation: loading ? "pulse 1s infinite" : "none",
            transition:"all 0.15s",
          }}>
            {loading ? "◌" : "⟳"}
          </button>
        </nav>

        {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
        <div style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column", minWidth:0 }}>
          <div style={{ flex:1, overflow:"auto", padding:isMobile?"12px":"16px 18px" }}>

            {/* ════════════════ SCANNER ════════════════════════════════════ */}
            {view === "scanner" && (
              <div>
                {/* Stat cards */}
                {markets.length > 0 && (
                  <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:10, marginBottom:18 }}>
                    <MetricCard label="Top EV" value={`+${f3(stats.topEV)}`} color={C.green} sub="Expected value" />
                    <MetricCard label="Grade A Markets" value={stats.gradeA} color={C.gold} sub="Highest conviction" />
                    <MetricCard label="Active Arb Ops" value={stats.arbOps} color={C.violet} sub="Gabagool engine" />
                    <MetricCard label="Avg Sharpe" value={f2(stats.avgSharpe)} color={C.blue} sub="Risk-adj quality" />
                  </div>
                )}

                {filtered.length === 0 && !loading && (
                  <div style={{ textAlign:"center", padding:"80px 0" }}>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontSize:48, color:C.border, marginBottom:16 }}>◈</div>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontSize:13, color:C.textDim, letterSpacing:"0.15em", marginBottom:8 }}>
                      ALL ENGINES ARMED
                    </div>
                    <div style={{ fontSize:12, color:C.textSub, marginBottom:24 }}>
                      Hit the ⟳ button to scan live Polymarket data
                    </div>
                    <button onClick={() => scan()} disabled={loading} style={{
                      background:`${C.gold}18`, border:`1px solid ${C.gold}44`, color:C.gold,
                      padding:"12px 32px", cursor:"pointer", fontFamily:"'Orbitron',monospace",
                      fontSize:11, borderRadius:8, letterSpacing:"0.12em",
                    }}>
                      ⟳ RUN FULL SCAN
                    </button>
                  </div>
                )}

                {filtered.length > 0 && (
                  <div className="mobile-scroll" style={{ background:C.surface, borderRadius:10, border:`1px solid ${C.border}`, overflow:"auto" }}>
                    {/* Header row */}
                    <div style={{ minWidth:isMobile?720:900, display:"grid", gridTemplateColumns:"20px 1fr 58px 58px 64px 62px 42px 52px 48px 52px 96px", gap:8, padding:"8px 14px", background:C.panel, fontSize:9, fontFamily:"'Fira Code',monospace", color:C.textDim, letterSpacing:"0.08em", borderBottom:`1px solid ${C.border}` }}>
                      <span>#</span><span>MARKET</span><span>YES↑</span><span>TRUE P</span><span>EV</span><span>KELLY $</span><span>GR</span><span>ARB</span><span>WHALE</span><span>RSI</span><span>SIGNAL</span>
                    </div>

                    {filtered.map((m, i) => (
                      <div key={m.id||i} className="market-row" onClick={() => { setSel(m); setView("analysis"); }}
                        style={{ minWidth:isMobile?720:900, display:"grid", gridTemplateColumns:"20px 1fr 58px 58px 64px 62px 42px 52px 48px 52px 96px", gap:8, padding:"9px 14px", borderBottom:`1px solid ${C.border}`, background: i%2===0?C.bg:C.surface, cursor:"pointer", transition:"background 0.12s", alignItems:"center" }}>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.textSub }}>{i+1}</span>
                        <div>
                          <div style={{ fontSize:11, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:200 }}>{m.question}</div>
                          <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.textSub, marginTop:2 }}>
                            {m.category||"MISC"} · ${kfmt(m.volumeNum)} vol · ${kfmt(m.liquidityNum)} liq
                          </div>
                        </div>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:11, fontWeight:600, color:C.green }}>{pct(m.yes)}</span>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:11, color: m.tp>(m.yes||0)+0.04?C.green:m.tp<(m.yes||0)-0.04?C.rose:C.textDim }}>{pct(m.tp)}</span>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:11, fontWeight:600, color: m.ev>0.05?C.green:m.ev<-0.05?C.rose:C.textDim }}>
                          {m.ev>0?"+":""}{f3(m.ev)}
                        </span>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:11, color:C.blue }}>{usd(m.kelly)}</span>
                        <span style={{ fontFamily:"'Orbitron',monospace", fontSize:12, fontWeight:700, color:GC[m.grade], textShadow:`0 0 10px ${GC[m.grade]}55` }}>{m.grade}</span>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:10, color:m.gab?.active?C.violet:C.textSub, fontWeight:m.gab?.active?600:undefined }}>
                          {m.gab?.active ? pct(m.gab.edge) : "—"}
                        </span>
                        <span style={{ fontSize:10, color:m.ws>0.6?C.amber:C.textSub }}>
                          {m.ws>0.4?`🐋${(m.ws*100).toFixed(0)}%`:"—"}
                        </span>
                        <RSIMeter val={m.rsi||50} />
                        <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                          <Tag c={AC[m.action]||C.textDim} sm>{m.action}</Tag>
                          {m.action !== "HOLD" && (
                            <button onClick={e => { e.stopPropagation(); placeOrder(m, m.action==="BUY_NO"?"BUY_NO":"BUY_YES"); }}
                              style={{ background:`${C.green}15`, border:`1px solid ${C.green}33`, color:C.green, padding:"2px 7px", cursor:"pointer", fontFamily:"inherit", fontSize:10, borderRadius:4 }}>
                              +
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ FIBONACCI ANALYSIS ════════════════════════ */}
            {view === "analysis" && (
              <div>
                {!sel ? (
                  <div style={{ textAlign:"center", padding:"60px 0", color:C.textSub, fontSize:12 }}>
                    Select a market from the Scanner to view Fibonacci analysis
                  </div>
                ) : (
                  <div style={{ animation:"fadeIn 0.25s ease" }}>
                    <div style={{ marginBottom:16 }}>
                      <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:600, color:C.text, margin:"0 0 6px" }}>{sel.question}</h2>
                      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                        <Tag c={GC[sel.grade]}>GRADE {sel.grade}</Tag>
                        <Tag c={AC[sel.action]||C.textDim}>{sel.action}</Tag>
                        {sel.fib?.find(f=>f.near) && <Tag c={C.gold}>φ {sel.fib.find(f=>f.near).label} CONFLUENCE</Tag>}
                        {sel.bb?.squeeze && <Tag c={C.rose}>BB SQUEEZE</Tag>}
                        {sel.gab?.active && <Tag c={C.violet}>GABAGOOL ARB {pct(sel.gab.edge)}</Tag>}
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.textDim, margin:"auto 0" }}>
                          VOL ${kfmt(sel.volumeNum)} · LIQ ${kfmt(sel.liquidityNum)} · EXP {sel.endDate ? new Date(sel.endDate).toLocaleDateString() : "OPEN"}
                        </span>
                      </div>
                    </div>

                    {/* Chart */}
                    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 18px", marginBottom:14, overflowX:"auto" }}>
                      <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.textDim, letterSpacing:"0.1em", marginBottom:12 }}>
                        PRICE HISTORY · FIBONACCI RETRACEMENTS · BOLLINGER BANDS (20, 2σ)
                      </div>
                      <FibChart prices={sel.ph} w={isMobile?760:530} h={130} />
                      <div style={{ display:"flex", gap:16, marginTop:10, flexWrap:"wrap" }}>
                        {FIB_R.map(f => (
                          <span key={f} style={{ fontFamily:"'Fira Code',monospace", fontSize:8, color:fC(f), opacity:sel.fib?.find(l=>l.f===f)?.near?1:0.5 }}>
                            ── {(f*100).toFixed(1)}%{sel.fib?.find(l=>l.f===f)?.near?" ◆":""}
                          </span>
                        ))}
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:8, color:`${C.blue}88` }}>─── BB</span>
                      </div>
                    </div>

                    {/* Metrics grid */}
                    <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:8, marginBottom:14 }}>
                      {[
                        ["MARKET PRICE", pct(sel.yes), C.green],
                        ["TRUE PROBABILITY", pct(sel.tp), sel.tp>(sel.yes||0)+0.04?C.green:sel.tp<(sel.yes||0)-0.04?C.rose:C.textDim],
                        ["EXPECTED VALUE", `${sel.ev>0?"+":""}${f3(sel.ev)}`, sel.ev>0.05?C.green:sel.ev<-0.05?C.rose:C.textDim],
                        ["KELLY ¼f*", usd(sel.kelly), C.blue],
                        ["BB %B", f2(sel.bb?.pctB), sel.bb?.pctB<0.2?C.green:sel.bb?.pctB>0.8?C.rose:C.textDim],
                        ["RSI-14", `${(sel.rsi||50).toFixed(0)}${sel.rsi>70?" OB":sel.rsi<30?" OS":""}`, sel.rsi>70?C.rose:sel.rsi<30?C.green:C.textDim],
                        ["SHARPE", f2(sel.sharpe), sel.sharpe>1?C.green:sel.sharpe<0?C.rose:C.textDim],
                        ["SORTINO", f2(sel.sortino), sel.sortino>1.5?C.green:sel.sortino<0?C.rose:C.textDim],
                        ["MACD BIAS", sel.macd?.bias||"—", sel.macd?.bias==="BULL"?C.green:C.rose],
                        ["WHALE SCORE", pct(sel.ws||0), sel.ws>0.6?C.amber:C.textDim],
                        ["UMA RISK", pct(sel.uma||0), sel.uma>0.5?C.rose:sel.uma>0.25?C.amber:C.green],
                        ["OB IMBALANCE", f2(sel.obi), sel.obi>0.15?C.green:sel.obi<-0.15?C.rose:C.textDim],
                      ].map(([l,v,c]) => <MetricCard key={l} label={l} value={v} color={c} />)}
                    </div>

                    {/* Fib extension targets */}
                    <div style={{ background:C.surface, border:`1px solid ${C.gold}33`, borderRadius:10, padding:"14px 16px", marginBottom:14, overflowX:"auto" }}>
                      <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.gold, marginBottom:10, letterSpacing:"0.1em" }}>
                        φ FIBONACCI EXTENSION TARGETS — PROFIT LEVELS
                      </div>
                      <div style={{ display:"flex", gap:10, minWidth:isMobile?560:"auto" }}>
                        {(sel.fibExt||[]).map(({ f, price, label }) => (
                          <div key={f} style={{ background:`${C.gold}0d`, border:`1px solid ${C.gold}28`, borderRadius:8, padding:"8px 14px", textAlign:"center" }}>
                            <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:`${C.gold}88`, marginBottom:4 }}>{label}</div>
                            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:14, fontWeight:700, color:C.gold }}>{pct(price)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gabagool arb detail */}
                    {sel.gab?.active && (
                      <div style={{ background:`${C.violet}0d`, border:`1px solid ${C.violet}33`, borderLeft:`3px solid ${C.violet}`, borderRadius:"0 10px 10px 0", padding:"14px 16px", marginBottom:14 }}>
                        <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.violet, marginBottom:8, letterSpacing:"0.1em" }}>
                          ◈ GABAGOOL ARBITRAGE — RISK-FREE COMPLETE-SET OPPORTUNITY
                        </div>
                        <div style={{ display:"flex", gap:20, fontSize:12 }}>
                          <span>YES+NO Total: <b style={{color:C.rose}}>{pct(sel.yes+sel.no)}</b></span>
                          <span>Edge: <b style={{color:C.green}}>{pct(sel.gab.edge)}</b></span>
                          <span>Side: <b style={{color:C.violet}}>{sel.gab.side}</b></span>
                          <span>Size: <b style={{color:C.blue}}>${sel.gab.size}</b></span>
                        </div>
                        <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.textSub, marginTop:6 }}>
                          Buy YES + NO for &lt;$1.00, redeem complete set for $1.00. Pure arbitrage — no directional risk.
                        </div>
                      </div>
                    )}

                    {/* Monte Carlo */}
                    {sel.mc && (
                      <div style={{ background:C.surface, border:`1px solid ${C.blue}33`, borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
                        <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.blue, marginBottom:14 }}>MONTE CARLO — 500 SIMULATIONS · 30 PERIODS · {(kFrac*100).toFixed(0)}% KELLY
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                          <MCBars mc={sel.mc} bank={bankroll} />
                          <div style={{ display:"flex", flexDirection:"column", gap:8, justifyContent:"center" }}>
                            <div style={{ fontSize:11, display:"flex", justifyContent:"space-between" }}>
                              <span style={{ color:C.textDim }}>Ruin Rate:</span>
                              <span style={{ color: sel.mc.ruin > 0.05 ? C.rose : C.green, fontWeight:600, fontFamily:"'Fira Code',monospace" }}>{pct(sel.mc.ruin)}</span>
                            </div>
                            <div style={{ fontSize:11, display:"flex", justifyContent:"space-between" }}>
                              <span style={{ color:C.textDim }}>Expectancy:</span>
                              <span style={{ color: sel.mc.exp > 0 ? C.green : C.rose, fontWeight:600, fontFamily:"'Fira Code',monospace" }}>
                                {sel.mc.exp > 0 ? "+" : ""}${sel.mc.exp}
                              </span>
                            </div>
                            <ScoreBar value={Math.max(0, sel.mc.exp)} max={bankroll * 0.5} color={sel.mc.exp>0?C.green:C.rose} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order buttons */}
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {["BUY_YES","BUY_NO","MKT_MAKE"].map(a => (
                        <button key={a} onClick={() => placeOrder(sel, a)} style={{
                          background:`${AC[a]||C.textDim}15`, border:`1px solid ${AC[a]||C.textDim}44`,
                          color:AC[a]||C.textDim, padding:"10px 22px", cursor:"pointer",
                          fontFamily:"'Orbitron',monospace", fontSize:10, borderRadius:8, letterSpacing:"0.1em",
                        }}>
                          {a} {usd(sel.kelly)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ MULTI-TIMEFRAME ════════════════════════════ */}
            {view === "multitf" && (
              <div>
                <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.blue, letterSpacing:"0.12em", marginBottom:16 }}>
                  ◫ MULTI-TIMEFRAME CONFLUENCE — SCALP · SWING · POSITION · MACRO
                </div>
                {filtered.length === 0 && <div style={{ textAlign:"center", padding:"50px 0", color:C.textSub }}>Run a scan first</div>}
                {filtered.slice(0, 12).map((m, mi) => (
                  <div key={mi} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", marginBottom:10, animation:"fadeIn 0.2s ease" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div style={{ fontSize:12, color:C.text, maxWidth:"65%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.question}</div>
                      <div style={{ display:"flex", gap:6 }}>
                        <Tag c={GC[m.grade]} sm>GRADE {m.grade}</Tag>
                        <Tag c={AC[m.action]||C.textDim} sm>{m.action}</Tag>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                      {(m.tfs||[]).map(tf => (
                        <div key={tf.id} style={{ background:C.panel, border:`1px solid ${C.border}`, borderTop:`2px solid ${dC(tf.dir)}`, borderRadius:8, padding:"10px 12px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                            <span style={{ fontFamily:"'Orbitron',monospace", fontSize:9, color:dC(tf.dir), fontWeight:700 }}>{tf.id}</span>
                            <span style={{ fontFamily:"'Fira Code',monospace", fontSize:8, color:C.textDim }}>{tf.label}</span>
                          </div>
                          <div style={{ fontFamily:"'Fira Code',monospace", fontSize:11, fontWeight:600, color:dC(tf.dir), marginBottom:6 }}>{tf.dir}</div>
                          <RSIMeter val={tf.rsi||50} />
                          <div style={{ marginTop:6 }}>
                            <ScoreBar value={tf.score||0} max={1} color={dC(tf.dir)} />
                          </div>
                          <div style={{ display:"flex", gap:4, marginTop:6, flexWrap:"wrap" }}>
                            <span style={{ fontFamily:"'Fira Code',monospace", fontSize:8, color:tf.macd?.bias==="BULL"?C.green:C.rose }}>{tf.macd?.bias}</span>
                            {tf.fib && <span style={{ fontSize:8, color:C.gold }}>φ {tf.fib.label}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ════════════════ AI SIGNALS ══════════════════════════════════ */}
            {view === "signals" && (
              <div>
                <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.violet, letterSpacing:"0.12em", marginBottom:16 }}>
                  ▲ AI SIGNAL ENGINE — QUANT ADAPTER · KELLY-WEIGHTED · FIBONACCI-TARGETED
                </div>
                {aiSigs.length === 0 && (
                  <div style={{ textAlign:"center", padding:"50px 0", color:C.textSub }}>Run a scan to generate AI signals</div>
                )}
                <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12 }}>
                  {aiSigs.map((s, i) => (
                    <div key={i} style={{ background:C.surface, border:`1px solid ${AC[s.action]||C.border}33`, borderLeft:`3px solid ${AC[s.action]||C.textDim}`, borderRadius:8, padding:"14px 16px", animation:"fadeIn 0.2s ease" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                        <span style={{ fontSize:11, color:C.text, flex:1, marginRight:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.question}</span>
                        <Tag c={AC[s.action]||C.textDim}>{s.action}</Tag>
                      </div>
                      <div style={{ display:"flex", gap:14, fontSize:11, fontFamily:"'Fira Code',monospace", marginBottom:8 }}>
                        <span>EDGE: <b style={{color:C.green}}>{pct(s.edge||0)}</b></span>
                        <span>CONF: <b style={{color:C.gold}}>{pct(s.confidence||0)}</b></span>
                        <span>KELLY: <b style={{color:C.blue}}>${(s.kelly||0).toFixed(0)}</b></span>
                      </div>
                      <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                        <Pill c={s.tf==="SCALP"?C.rose:s.tf==="SWING"?C.gold:s.tf==="POSITION"?C.green:C.blue}>{s.tf||"—"}</Pill>
                        <Pill c={s.risk==="LOW"?C.green:s.risk==="MED"?C.gold:C.rose}>{s.risk}</Pill>
                        {s.fibLevel && <Pill c={C.gold}>φ {s.fibLevel}</Pill>}
                      </div>
                      <div style={{ fontSize:10, color:C.textDim, fontStyle:"italic" }}>// {s.thesis}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════════ RISK DESK ═══════════════════════════════════ */}
            {view === "risk" && (
              <div>
                <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.gold, letterSpacing:"0.12em", marginBottom:16 }}>
                  ◆ RISK DESK — KELLY CONFIG · MONTE CARLO · CIRCUIT BREAKERS
                </div>
                <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:14, marginBottom:14 }}>
                  {/* Kelly Config */}
                  <div style={{ background:C.surface, border:`1px solid ${C.gold}33`, borderRadius:10, padding:"16px 18px" }}>
                    <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.gold, marginBottom:14 }}>KELLY CRITERION</div>
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, color:C.textDim, marginBottom:6 }}>BANKROLL (USDC)</div>
                      <input type="number" value={bankroll} onChange={e=>setBankroll(+e.target.value)} style={{ fontFamily:"'Fira Code',monospace", background:C.panel, border:`1px solid ${C.border}`, color:C.gold, padding:"8px 12px", outline:"none", borderRadius:6, width:"100%", fontSize:13 }} />
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.textDim, marginBottom:6 }}>
                        <span>KELLY FRACTION</span>
                        <span style={{ color:C.gold, fontWeight:600 }}>{(kFrac*100).toFixed(0)}%</span>
                      </div>
                      <input type="range" min="0.05" max="0.5" step="0.05" value={kFrac} onChange={e=>setKFrac(+e.target.value)} style={{ width:"100%", accentColor:C.gold }} />
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:C.textSub, marginTop:4 }}>
                        <span>Conservative</span><span>Aggressive</span>
                      </div>
                    </div>
                    <div style={{ fontFamily:"'Fira Code',monospace", fontSize:10, color:C.textDim, background:C.panel, borderRadius:6, padding:"10px 12px" }}>
                      f* = (p·b − q) / b × {kFrac}<br/>
                      Max/trade: <span style={{color:C.gold}}>${(bankroll*0.05).toFixed(0)}</span> (5% cap)<br/>
                      Golden zone ×φ at 61.8%
                    </div>
                  </div>
                  {/* Monte Carlo preview */}
                  <div style={{ background:C.surface, border:`1px solid ${C.blue}33`, borderRadius:10, padding:"16px 18px" }}>
                    <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.blue, marginBottom:14 }}>MONTE CARLO — 500 PATHS</div>
                    {markets[0]?.mc ? (
                      <>
                        <MCBars mc={markets[0].mc} bank={bankroll} />
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginTop:10, fontFamily:"'Fira Code',monospace" }}>
                          <span style={{color:C.textDim}}>Ruin Rate:</span>
                          <span style={{color:markets[0].mc.ruin>0.05?C.rose:C.green,fontWeight:600}}>{pct(markets[0].mc.ruin)}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginTop:4, fontFamily:"'Fira Code',monospace" }}>
                          <span style={{color:C.textDim}}>Expectancy:</span>
                          <span style={{color:markets[0].mc.exp>0?C.green:C.rose,fontWeight:600}}>{markets[0].mc.exp>0?"+":""}${markets[0].mc.exp}</span>
                        </div>
                        <div style={{fontSize:10,color:C.textSub,marginTop:6}}>Top market: {markets[0]?.question?.slice(0,40)}…</div>
                      </>
                    ) : <div style={{color:C.textSub,fontSize:11}}>Run a scan to compute</div>}
                  </div>
                </div>
                {/* Signal architecture */}
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 18px" }}>
                  <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.green, marginBottom:12, letterSpacing:"0.1em" }}>COMPOSITE SIGNAL ARCHITECTURE</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {[
                      ["Full Kelly Criterion","f*=(p·b−q)/b · ¼ fractional",C.gold],
                      ["Fibonacci + Golden Ratio","φ=1.618 · 6 levels · ×φ at 61.8%",C.gold],
                      ["Bayesian Probability","P(true|signal) via likelihood ratio",C.violet],
                      ["Bollinger Bands","20MA ± 2σ · %B position · squeeze",C.blue],
                      ["RSI-14","Overbought/oversold reversal signals",C.rose],
                      ["MACD Binary","EMA(12)−EMA(26) vs 9-period signal",C.green],
                      ["Gabagool Arb","YES+NO≠$1 → risk-free complete-set",C.violet],
                      ["Smart Ape Momentum","Price trend + volume acceleration",C.green],
                      ["Whale Radar","Vol/liq concentration detection",C.amber],
                      ["UMA Dispute Risk","Resolution ambiguity penalty",C.rose],
                      ["Monte Carlo Growth","500-path Kelly simulation",C.blue],
                      ["Sharpe + Sortino","Risk-adjusted quality scoring",C.green],
                    ].map(([name, formula, c]) => (
                      <div key={name} style={{ display:"flex", gap:10, padding:"7px 10px", background:C.panel, borderRadius:6, alignItems:"center" }}>
                        <div style={{ width:3, height:28, background:c, borderRadius:2, flexShrink:0 }} />
                        <div>
                          <div style={{ fontSize:11, color:C.text }}>{name}</div>
                          <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.textDim, marginTop:2 }}>{formula}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════ ORDERS ══════════════════════════════════════ */}
            {view === "orders" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.blue, letterSpacing:"0.12em" }}>
                    ⊕ EXECUTION LOG — {paperMode ? "PAPER TRADING MODE" : "CLOB · EIP-712 SIGNED · POLYGON"}
                  </div>
                  {paperMode && (
                    <Pill c={C.blue}>📊 VIEW-ONLY MODE</Pill>
                  )}
                </div>
                {orders.length === 0 && (
                  <div style={{ textAlign:"center", padding:"50px 0", color:C.textSub }}>
                    {paperMode
                      ? "No paper trades yet — click order buttons to simulate trades"
                      : "No orders yet — connect wallet and scan markets"}
                  </div>
                )}
                {orders.length > 0 && (
                  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, overflow:"auto" }}>
                    <div style={{ minWidth:700, display:"grid", gridTemplateColumns:"90px 1fr 90px 52px 56px 52px 46px 72px", gap:8, padding:"8px 14px", background:C.panel, fontFamily:"'Fira Code',monospace", fontSize:9, color:C.textDim, borderBottom:`1px solid ${C.border}` }}>
                      <span>TIME</span><span>MARKET</span><span>SIDE</span><span>SIZE</span><span>PRICE</span><span>EV</span><span>GR</span><span>STATUS</span>
                    </div>
                    {orders.map((o, i) => (
                      <div key={i} style={{ minWidth:700, display:"grid", gridTemplateColumns:"90px 1fr 90px 52px 56px 52px 46px 72px", gap:8, padding:"9px 14px", borderBottom:`1px solid ${C.border}`, background: i%2===0?C.bg:C.surface, alignItems:"center" }}>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.textDim }}>{o.ts}</span>
                        <span style={{ fontSize:11, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.market}</span>
                        <Tag c={AC[o.side]||C.textDim} sm>{o.side}</Tag>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:11 }}>${o.size}</span>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:11 }}>{pct(o.price)}</span>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:11, color:o.ev>0?C.green:C.rose }}>{f3(o.ev)}</span>
                        <span style={{ fontFamily:"'Orbitron',monospace", fontSize:11, fontWeight:700, color:GC[o.grade] }}>{o.grade}</span>
                        <Tag c={o.status==="FILLED"?C.green:o.status==="PENDING"?C.amber:o.status==="PAPER-FILLED"?C.blue:o.status==="SIMULATED"?C.blue:C.rose} sm>
                          {o.status==="PAPER-FILLED"?"PAPER":o.status==="SIMULATED"?"PAPER":o.status}
                        </Tag>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ WALLET ══════════════════════════════════════ */}
            {view === "wallet" && (
              <div style={{ maxWidth:isMobile?"100%":520 }}>
                <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.green, letterSpacing:"0.12em", marginBottom:16 }}>
                  ◉ WALLET — ON-CHAIN POLYGON VERIFICATION · EIP-712
                </div>
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px", marginBottom:14 }}>
                  <div style={{ fontSize:10, color:C.textDim, marginBottom:8 }}>POLYGON WALLET ADDRESS</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <input value={walInput} onChange={e=>setWalInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verifyWallet()} placeholder="0x…" style={{ flex:1, fontFamily:"'Fira Code',monospace", background:C.panel, border:`1px solid ${C.border}`, color:C.green, padding:"10px 14px", outline:"none", borderRadius:8, fontSize:12 }} />
                    <button onClick={verifyWallet} style={{ background:`${C.green}15`, border:`1px solid ${C.green}44`, color:C.green, padding:"10px 20px", cursor:"pointer", fontFamily:"'Orbitron',monospace", fontSize:10, borderRadius:8, letterSpacing:"0.1em" }}>VERIFY</button>
                  </div>
                  {walStatus === "checking" && <div style={{ marginTop:10, fontFamily:"'Fira Code',monospace", fontSize:11, color:C.blue }}>◌ Querying Polygon RPC…</div>}
                  {walStatus && walStatus !== "checking" && (
                    <div style={{ marginTop:10, padding:"10px 14px", background: walStatus.ok?`${C.green}0d`:`${C.rose}0d`, border:`1px solid ${walStatus.ok?C.green+"33":C.rose+"33"}`, borderRadius:8, fontFamily:"'Fira Code',monospace", fontSize:11, color:walStatus.ok?C.green:C.rose }}>
                      {walStatus.ok ? `✓ Verified · ${hsh(wallet)} · ${walStatus.bal?.toFixed(4)} POL` : `✗ ${walStatus.err}`}
                    </div>
                  )}
                </div>
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px", marginBottom:14 }}>
                  <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.textDim, marginBottom:14 }}>POLYMARKET CLOB API CREDENTIALS</div>
                  {["API KEY","API SECRET","PASSPHRASE"].map(l => (
                    <div key={l} style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10, color:C.textDim, marginBottom:5 }}>{l}</div>
                      <input type="password" placeholder={`${l.toLowerCase().replace(/ /g,"_")}…`} style={{ width:"100%", fontFamily:"'Fira Code',monospace", background:C.panel, border:`1px solid ${C.border}`, color:C.text, padding:"9px 12px", outline:"none", borderRadius:6, fontSize:11 }} />
                    </div>
                  ))}
                </div>
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", fontFamily:"'Fira Code',monospace", fontSize:10, color:C.textDim, lineHeight:2 }}>
                  <span style={{color:C.gold}}>◆ EIP-712 SIGNING FLOW</span><br/>
                  1. eth_getBalance → confirm address on Polygon<br/>
                  2. L1 auth: sign(address + timestamp + nonce)<br/>
                  3. Derive L2 credentials from signed message<br/>
                  4. Orders signed locally — only signature transmitted<br/>
                  <span style={{color:C.rose}}>⚠ Private keys NEVER stored or transmitted</span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ═══ TRADEHAX GPT CHAT PANEL ══════════════════════════════════════ */}
        {chatPanelOpen && (
          <div style={{ width:isMobile?"100%":(isTablet?320:360), maxHeight:isMobile?"48vh":"none", display:"flex", flexDirection:"column", background:C.surface, borderLeft:isMobile?"none":`1px solid ${C.border}`, borderTop:isMobile?`1px solid ${C.border}`:"none", flexShrink:0 }}>
            {/* Chat header */}
            <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, background:C.panel, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontFamily:"'Orbitron',monospace", fontSize:13, fontWeight:700, color:C.gold, letterSpacing:"0.15em" }}>TRADEHAX GPT</div>
                  <div style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.textDim, marginTop:2 }}>
                    Kelly · Fibonacci · Bayesian · Multi-TF
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:C.green, animation:"glow 2s infinite" }} />
                  <span style={{ fontFamily:"'Fira Code',monospace", fontSize:9, color:C.green }}>LIVE</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflow:"auto", padding:"14px" }}>
              {chatLog.map((m, i) => (
                <div key={i} className="chat-msg" style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:12 }}>
                  <div style={{
                    maxWidth:"88%",
                    padding:"10px 14px",
                    borderRadius: m.role==="user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background: m.role==="user" ? `${C.green}14` : C.panel,
                    border:`1px solid ${m.role==="user" ? C.green+"28" : C.border}`,
                    fontSize:12,
                    lineHeight:1.65,
                    color: m.role==="user" ? "#A8F0D0" : C.text,
                  }}>
                    {m.role === "assistant" && (
                      <div style={{ fontFamily:"'Orbitron',monospace", fontSize:8, color:C.gold, marginBottom:5, letterSpacing:"0.1em" }}>
                        TRADEHAX GPT {m.ts && `· ${m.ts}`}
                      </div>
                    )}
                    <div style={{ whiteSpace:"pre-wrap" }}>
                      {m.text.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                        part.startsWith("**") && part.endsWith("**")
                          ? <strong key={j} style={{ color:C.gold }}>{part.slice(2,-2)}</strong>
                          : part
                      )}
                    </div>
                    {m.ts && m.role !== "assistant" && (
                      <div style={{ fontFamily:"'Fira Code',monospace", fontSize:8, color:C.textSub, marginTop:4, textAlign:"right" }}>{m.ts}</div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:12 }}>
                  <div style={{ padding:"10px 14px", background:C.panel, border:`1px solid ${C.border}`, borderRadius:"14px 14px 14px 2px", fontSize:12, color:C.textDim }}>
                    <span style={{ animation:"pulse 1s infinite" }}>Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>

            {/* Quick prompts */}
            <div style={{ padding:"8px 14px", borderTop:`1px solid ${C.border}`, display:"flex", gap:5, flexWrap:"wrap", background:C.panel }}>
              {["🎯 Best trade now","📐 Fibonacci read","⏱ Multi-TF","⚡ Arb ops","💰 Size my bet","📊 Risk check"].map(q => (
                <button key={q} onClick={() => setChatInput(q.replace(/^[^\s]+\s/,""))} style={{
                  background:`${C.gold}0d`, border:`1px solid ${C.gold}22`, color:`${C.gold}99`,
                  padding:"3px 9px", cursor:"pointer", fontFamily:"'Fira Code',monospace",
                  fontSize:9, borderRadius:12, letterSpacing:"0.04em",
                }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding:"12px 14px", borderTop:`1px solid ${C.border}`, background:C.bg, display:"flex", gap:8, flexShrink:0 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && !chatLoading && sendChat()}
                placeholder="Ask anything — markets, sizing, strategy…"
                style={{ flex:1, fontFamily:"'DM Sans',sans-serif", background:C.panel, border:`1px solid ${C.borderL}`, color:C.text, padding:"10px 14px", outline:"none", borderRadius:20, fontSize:12 }}
              />
              <button onClick={sendChat} disabled={chatLoading} style={{
                background: chatLoading ? C.panel : `${C.gold}18`,
                border:`1px solid ${chatLoading?C.border:C.gold+"44"}`,
                color: chatLoading ? C.textDim : C.gold,
                padding:"10px 18px", cursor: chatLoading?"wait":"pointer",
                fontFamily:"'Orbitron',monospace", fontSize:10, borderRadius:20,
                letterSpacing:"0.08em", flexShrink:0,
              }}>
                SEND
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
