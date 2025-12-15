import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol = "BTCUSDT", timeframe = "1H" } = body;

    const interval = timeframe === "1H" ? "1h" : timeframe === "4H" ? "4h" : timeframe === "1D" ? "1d" : "15m";

    let candles: any[] = [];

    try {
      const url = "https://api.binance.com/api/v3/klines?symbol=" + symbol + "&interval=" + interval + "&limit=300";
      const res = await fetch(url);
      const data = await res.json();

      candles = data.map((k: any[]) => ({
        time: Math.floor(k[0] / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));

      candles.sort((a, b) => a.time - b.time);
    } catch (e) {
      return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
    }

    const currentPrice = candles[candles.length - 1]?.close || 0;

    // Calculate ATR for volatility
    function calcATR(period: number, endIndex: number): number {
      let sum = 0;
      for (let i = endIndex - period + 1; i <= endIndex; i++) {
        if (i < 1) continue;
        const tr = Math.max(
          candles[i].high - candles[i].low,
          Math.abs(candles[i].high - candles[i - 1].close),
          Math.abs(candles[i].low - candles[i - 1].close)
        );
        sum += tr;
      }
      return sum / period;
    }

    // Find Swing Highs and Lows
    function findSwings(lookback: number) {
      const swingHighs: any[] = [];
      const swingLows: any[] = [];

      for (let i = lookback; i < candles.length - lookback; i++) {
        let isHigh = true;
        let isLow = true;

        for (let j = 1; j <= lookback; j++) {
          if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) isHigh = false;
          if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) isLow = false;
        }

        if (isHigh) swingHighs.push({ index: i, price: candles[i].high, time: candles[i].time });
        if (isLow) swingLows.push({ index: i, price: candles[i].low, time: candles[i].time });
      }

      return { swingHighs, swingLows };
    }

    // Detect Market Structure (BOS/CHoCH)
    function detectStructure(swingHighs: any[], swingLows: any[]) {
      const structure: any[] = [];
      let lastTrend = "unknown";

      for (let i = 1; i < candles.length; i++) {
        const recentHighs = swingHighs.filter((s) => s.index < i);
        const recentLows = swingLows.filter((s) => s.index < i);

        if (recentHighs.length < 2 || recentLows.length < 2) continue;

        const lastHigh = recentHighs[recentHighs.length - 1];
        const prevHigh = recentHighs[recentHighs.length - 2];
        const lastLow = recentLows[recentLows.length - 1];
        const prevLow = recentLows[recentLows.length - 2];

        // Bullish BOS: Higher High
        if (candles[i].close > lastHigh.price && lastHigh.price > prevHigh.price) {
          if (lastTrend === "bearish") {
            structure.push({ type: "choch", direction: "bullish", index: i, price: lastHigh.price });
          } else {
            structure.push({ type: "bos", direction: "bullish", index: i, price: lastHigh.price });
          }
          lastTrend = "bullish";
        }

        // Bearish BOS: Lower Low
        if (candles[i].close < lastLow.price && lastLow.price < prevLow.price) {
          if (lastTrend === "bullish") {
            structure.push({ type: "choch", direction: "bearish", index: i, price: lastLow.price });
          } else {
            structure.push({ type: "bos", direction: "bearish", index: i, price: lastLow.price });
          }
          lastTrend = "bearish";
        }
      }

      return { structure, currentTrend: lastTrend };
    }

    // Detect Order Blocks with strict criteria
    function detectOrderBlocks(atr: number) {
      const orderBlocks: any[] = [];

      for (let i = 3; i < candles.length - 1; i++) {
        const prev = candles[i - 1];
        const curr = candles[i];
        const prevSize = Math.abs(prev.close - prev.open);
        const currSize = Math.abs(curr.close - curr.open);

        // Bullish OB: Bearish candle followed by strong bullish impulse
        const isBullishOB = prev.close < prev.open && curr.close > curr.open && currSize > atr * 1.5 && currSize > prevSize * 1.5;

        // Bearish OB: Bullish candle followed by strong bearish impulse
        const isBearishOB = prev.close > prev.open && curr.close < curr.open && currSize > atr * 1.5 && currSize > prevSize * 1.5;

        if (isBullishOB) {
          // Check if OB is still valid (not mitigated)
          let mitigated = false;
          for (let j = i + 1; j < candles.length; j++) {
            if (candles[j].low < prev.low) {
              mitigated = true;
              break;
            }
          }

          if (!mitigated) {
            orderBlocks.push({
              id: "ob_bull_" + i,
              direction: "bullish",
              top: Math.round(prev.high * 100) / 100,
              bottom: Math.round(prev.low * 100) / 100,
              time: prev.time,
              index: i,
              strength: Math.min(5, Math.floor(currSize / atr)),
              impulseRatio: Math.round((currSize / prevSize) * 10) / 10,
            });
          }
        }

        if (isBearishOB) {
          let mitigated = false;
          for (let j = i + 1; j < candles.length; j++) {
            if (candles[j].high > prev.high) {
              mitigated = true;
              break;
            }
          }

          if (!mitigated) {
            orderBlocks.push({
              id: "ob_bear_" + i,
              direction: "bearish",
              top: Math.round(prev.high * 100) / 100,
              bottom: Math.round(prev.low * 100) / 100,
              time: prev.time,
              index: i,
              strength: Math.min(5, Math.floor(currSize / atr)),
              impulseRatio: Math.round((currSize / prevSize) * 10) / 10,
            });
          }
        }
      }

      return orderBlocks;
    }

    // Detect FVG (Fair Value Gaps)
    function detectFVG() {
      const fvgs: any[] = [];

      for (let i = 2; i < candles.length; i++) {
        const c1 = candles[i - 2];
        const c3 = candles[i];

        // Bullish FVG
        if (c3.low > c1.high) {
          const gapSize = c3.low - c1.high;
          let filled = false;
          for (let j = i + 1; j < candles.length; j++) {
            if (candles[j].low <= c1.high) {
              filled = true;
              break;
            }
          }
          if (!filled && gapSize > 0) {
            fvgs.push({ direction: "bullish", top: c3.low, bottom: c1.high, index: i });
          }
        }

        // Bearish FVG
        if (c3.high < c1.low) {
          const gapSize = c1.low - c3.high;
          let filled = false;
          for (let j = i + 1; j < candles.length; j++) {
            if (candles[j].high >= c1.low) {
              filled = true;
              break;
            }
          }
          if (!filled && gapSize > 0) {
            fvgs.push({ direction: "bearish", top: c1.low, bottom: c3.high, index: i });
          }
        }
      }

      return fvgs;
    }

    // Main Analysis
    const atr = calcATR(14, candles.length - 1);
    const { swingHighs, swingLows } = findSwings(5);
    const { structure, currentTrend } = detectStructure(swingHighs, swingLows);
    const orderBlocks = detectOrderBlocks(atr);
    const fvgs = detectFVG();

    // Generate HIGH QUALITY signals only
    const signals: any[] = [];
    const price = currentPrice;

    // Get recent structure events
    const recentStructure = structure.slice(-10);
    const lastCHoCH = recentStructure.filter((s) => s.type === "choch").pop();
    const lastBOS = recentStructure.filter((s) => s.type === "bos").pop();

    // LONG Signal Criteria
    const bullishOBs = orderBlocks.filter((ob) => ob.direction === "bullish" && ob.strength >= 2);

    for (const ob of bullishOBs) {
      // Check all confirmation criteria
      let confidence = 0;
      const reasons: string[] = [];

      // 1. Trend alignment (25%)
      if (currentTrend === "bullish") {
        confidence += 25;
        reasons.push("Bullish Trend");
      }

      // 2. CHoCH or BOS confirmation (25%)
      if (lastCHoCH && lastCHoCH.direction === "bullish" && lastCHoCH.index > ob.index) {
        confidence += 25;
        reasons.push("CHoCH Confirmed");
      } else if (lastBOS && lastBOS.direction === "bullish" && lastBOS.index > ob.index) {
        confidence += 20;
        reasons.push("BOS Confirmed");
      }

      // 3. Strong Order Block (20%)
      if (ob.strength >= 3) {
        confidence += 20;
        reasons.push("Strong OB (" + ob.strength + "/5)");
      } else if (ob.strength >= 2) {
        confidence += 10;
        reasons.push("Valid OB");
      }

      // 4. FVG in OB zone (15%)
      const hasFVG = fvgs.some((f) => f.direction === "bullish" && f.bottom >= ob.bottom && f.top <= ob.top);
      if (hasFVG) {
        confidence += 15;
        reasons.push("FVG Present");
      }

      // 5. Price near OB (15%)
      const distanceToOB = ((price - ob.top) / price) * 100;
      if (distanceToOB >= 0 && distanceToOB < 1) {
        confidence += 15;
        reasons.push("Price at OB");
      } else if (distanceToOB >= -1 && distanceToOB < 0) {
        confidence += 10;
        reasons.push("Price near OB");
      }

      // Only create signal if confidence >= 85%
      if (confidence >= 85) {
        const entry = ob.top;
        const sl = ob.bottom - atr * 0.2;
        const risk = entry - sl;
        const tp1 = entry + risk * 1;
        const tp2 = entry + risk * 2;
        const tp3 = entry + risk * 3;
        const rr = 3;

        // Verify RR is at least 1:3
        if (risk > 0 && rr >= 3) {
          signals.push({
            id: "long_" + ob.id,
            direction: "LONG",
            entry: Math.round(entry * 100) / 100,
            stopLoss: Math.round(sl * 100) / 100,
            takeProfit1: Math.round(tp1 * 100) / 100,
            takeProfit2: Math.round(tp2 * 100) / 100,
            takeProfit3: Math.round(tp3 * 100) / 100,
            riskReward: rr,
            confidence: confidence,
            reasons: reasons,
            obStrength: ob.strength,
          });
        }
      }
    }

    // SHORT Signal Criteria
    const bearishOBs = orderBlocks.filter((ob) => ob.direction === "bearish" && ob.strength >= 2);

    for (const ob of bearishOBs) {
      let confidence = 0;
      const reasons: string[] = [];

      if (currentTrend === "bearish") {
        confidence += 25;
        reasons.push("Bearish Trend");
      }

      if (lastCHoCH && lastCHoCH.direction === "bearish" && lastCHoCH.index > ob.index) {
        confidence += 25;
        reasons.push("CHoCH Confirmed");
      } else if (lastBOS && lastBOS.direction === "bearish" && lastBOS.index > ob.index) {
        confidence += 20;
        reasons.push("BOS Confirmed");
      }

      if (ob.strength >= 3) {
        confidence += 20;
        reasons.push("Strong OB (" + ob.strength + "/5)");
      } else if (ob.strength >= 2) {
        confidence += 10;
        reasons.push("Valid OB");
      }

      const hasFVG = fvgs.some((f) => f.direction === "bearish" && f.bottom >= ob.bottom && f.top <= ob.top);
      if (hasFVG) {
        confidence += 15;
        reasons.push("FVG Present");
      }

      const distanceToOB = ((ob.bottom - price) / price) * 100;
      if (distanceToOB >= 0 && distanceToOB < 1) {
        confidence += 15;
        reasons.push("Price at OB");
      } else if (distanceToOB >= -1 && distanceToOB < 0) {
        confidence += 10;
        reasons.push("Price near OB");
      }

      if (confidence >= 85) {
        const entry = ob.bottom;
        const sl = ob.top + atr * 0.2;
        const risk = sl - entry;
        const tp1 = entry - risk * 1;
        const tp2 = entry - risk * 2;
        const tp3 = entry - risk * 3;
        const rr = 3;

        if (risk > 0 && rr >= 3) {
          signals.push({
            id: "short_" + ob.id,
            direction: "SHORT",
            entry: Math.round(entry * 100) / 100,
            stopLoss: Math.round(sl * 100) / 100,
            takeProfit1: Math.round(tp1 * 100) / 100,
            takeProfit2: Math.round(tp2 * 100) / 100,
            takeProfit3: Math.round(tp3 * 100) / 100,
            riskReward: rr,
            confidence: confidence,
            reasons: reasons,
            obStrength: ob.strength,
          });
        }
      }
    }

    // Sort signals by confidence (highest first)
    signals.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({
      success: true,
      data: {
        trend: currentTrend === "unknown" ? "ranging" : currentTrend,
        orderBlocks: orderBlocks.slice(-15),
        fvgs: fvgs.slice(-10),
        structure: structure.slice(-10),
        signals: signals.slice(0, 3),
        currentPrice: Math.round(price * 100) / 100,
        candles,
        atr: Math.round(atr * 100) / 100,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}
