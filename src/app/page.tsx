"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("../components/Chart"), { ssr: false });

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1H");

  const symbols = [
    { value: "BTCUSDT", label: "BTC" },
    { value: "ETHUSDT", label: "ETH" },
    { value: "SOLUSDT", label: "SOL" },
    { value: "ADAUSDT", label: "ADA" },
    { value: "BNBUSDT", label: "BNB" },
    { value: "DOTUSDT", label: "DOT" },
    { value: "TRXUSDT", label: "TRX" },
    { value: "NEARUSDT", label: "NEAR" },
    { value: "APTUSDT", label: "APT" },
    { value: "SUIUSDT", label: "SUI" },
    { value: "ARBUSDT", label: "ARB" },
    { value: "OPUSDT", label: "OP" },
    { value: "XRPUSDT", label: "XRP" },
    { value: "XLMUSDT", label: "XLM" },
    { value: "LTCUSDT", label: "LTC" },
  ];

  const timeframes = [
    { value: "15m", label: "15m" },
    { value: "1H", label: "1H" },
    { value: "4H", label: "4H" },
    { value: "1D", label: "1D" },
  ];

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, timeframe }),
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [symbol, timeframe]);

  function copySignal(s: any) {
    const text = "🎯 " + s.direction + " #" + symbol.replace("USDT", "") + "\n\n" +
      "📊 Timeframe: " + timeframe + "\n" +
      "━━━━━━━━━━━━━━━\n" +
      "▫️ Entry: $" + s.entry + "\n" +
      "🔴 Stop Loss: $" + s.stopLoss + "\n" +
      "🟢 TP1: $" + s.takeProfit1 + "\n" +
      "🟢 TP2: $" + s.takeProfit2 + "\n" +
      "🟢 TP3: $" + s.takeProfit3 + "\n" +
      "━━━━━━━━━━━━━━━\n" +
      "📈 R:R: 1:" + s.riskReward + "\n" +
      "✅ Confidence: " + s.confidence + "%\n\n" +
      "Reasons: " + s.reasons.join(", ");
    navigator.clipboard.writeText(text);
    alert("Signal copied!");
  }

  const boxStyle: any = { padding: 20, backgroundColor: "#0d0d1a", borderRadius: 12, border: "1px solid #1a1a2e" };
  const cardStyle: any = { padding: 12, backgroundColor: "#12121f", borderRadius: 8, marginTop: 10 };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#08080f", color: "white", padding: 20, fontFamily: "system-ui" }}>
      
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>🦈 SMC Analyzer</h1>
        <p style={{ color: "#666", margin: "5px 0 0" }}>Smart Money Concept • High Probability Signals (85%+) • R:R 1:3</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ padding: 12, backgroundColor: "#12121f", color: "white", border: "1px solid #2a2a3e", borderRadius: 8, fontSize: 14 }}>
          {symbols.map((s) => (<option key={s.value} value={s.value}>{s.label}/USDT</option>))}
        </select>

        <div style={{ display: "flex", gap: 4 }}>
          {timeframes.map((tf) => (
            <button key={tf.value} onClick={() => setTimeframe(tf.value)} style={{ padding: "10px 16px", backgroundColor: timeframe === tf.value ? "#6366f1" : "#12121f", color: "white", border: timeframe === tf.value ? "1px solid #6366f1" : "1px solid #2a2a3e", borderRadius: 8, cursor: "pointer", fontWeight: timeframe === tf.value ? "bold" : "normal", fontSize: 13 }}>
              {tf.label}
            </button>
          ))}
        </div>

        <button onClick={loadData} disabled={loading} style={{ padding: "10px 20px", backgroundColor: loading ? "#333" : "#22c55e", color: "white", border: "none", borderRadius: 8, cursor: loading ? "wait" : "pointer", fontWeight: "bold", fontSize: 13 }}>
          {loading ? "⏳ Loading..." : "🔄 Refresh"}
        </button>

        {data && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 15, flexWrap: "wrap" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#888", fontSize: 11 }}>PRICE</div>
              <div style={{ fontSize: 18, fontWeight: "bold" }}></div>
            </div>
            <span style={{ padding: "6px 14px", backgroundColor: data.trend === "bullish" ? "#22c55e20" : data.trend === "bearish" ? "#ef444420" : "#eab30820", color: data.trend === "bullish" ? "#22c55e" : data.trend === "bearish" ? "#ef4444" : "#eab308", borderRadius: 20, fontSize: 12, fontWeight: "bold", border: "1px solid " + (data.trend === "bullish" ? "#22c55e50" : data.trend === "bearish" ? "#ef444450" : "#eab30850") }}>
              {data.trend === "bullish" ? "▲ BULLISH" : data.trend === "bearish" ? "▼ BEARISH" : "◆ RANGING"}
            </span>
          </div>
        )}
      </div>

      <div style={{ ...boxStyle, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>📈 Chart ({symbol.replace("USDT", "")}/USDT)</h2>
          {data && <span style={{ color: "#888", fontSize: 12 }}>{data.candles?.length} candles • ATR: </span>}
        </div>
        {data?.candles ? (
          <Chart candles={data.candles} orderBlocks={data.orderBlocks} signals={data.signals} />
        ) : (
          <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
            {loading ? "Loading chart..." : "No data"}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        
        <div style={boxStyle}>
          <h2 style={{ margin: "0 0 15px", fontSize: 16 }}>📊 Market Structure</h2>
          {data ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={cardStyle}>
                  <div style={{ color: "#888", fontSize: 11 }}>ORDER BLOCKS</div>
                  <div style={{ fontSize: 20, fontWeight: "bold" }}>{data.orderBlocks?.length || 0}</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ color: "#888", fontSize: 11 }}>FVGs</div>
                  <div style={{ fontSize: 20, fontWeight: "bold" }}>{data.fvgs?.length || 0}</div>
                </div>
              </div>
              
              <div style={{ marginTop: 15 }}>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 8 }}>ACTIVE ORDER BLOCKS</div>
                {data.orderBlocks?.slice(-5).map((ob: any) => (
                  <div key={ob.id} style={{ ...cardStyle, borderLeft: "3px solid " + (ob.direction === "bullish" ? "#22c55e" : "#ef4444"), backgroundColor: ob.direction === "bullish" ? "#22c55e08" : "#ef444408", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ color: ob.direction === "bullish" ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
                        {ob.direction === "bullish" ? "▲ BULL" : "▼ BEAR"}
                      </span>
                      <span style={{ color: "#888", marginLeft: 10, fontSize: 12 }}> - </span>
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1,2,3,4,5].map((i) => (
                        <span key={i} style={{ color: i <= ob.strength ? "#eab308" : "#333" }}>★</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {data.structure?.length > 0 && (
                <div style={{ marginTop: 15 }}>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 8 }}>STRUCTURE BREAKS</div>
                  {data.structure?.slice(-3).map((s: any, i: number) => (
                    <div key={i} style={{ ...cardStyle, fontSize: 12 }}>
                      <span style={{ color: s.type === "choch" ? "#f97316" : "#3b82f6", fontWeight: "bold" }}>
                        {s.type.toUpperCase()}
                      </span>
                      <span style={{ color: s.direction === "bullish" ? "#22c55e" : "#ef4444", marginLeft: 8 }}>
                        {s.direction === "bullish" ? "▲" : "▼"}
                      </span>
                      <span style={{ color: "#888", marginLeft: 8 }}></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "#666" }}>{loading ? "Loading..." : "No data"}</p>
          )}
        </div>

        <div style={boxStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>🎯 High Probability Signals</h2>
            <span style={{ color: "#888", fontSize: 11 }}>Min 85% • R:R 1:3</span>
          </div>
          
          {data?.signals?.length > 0 ? (
            data.signals.map((s: any) => (
              <div key={s.id} style={{ marginTop: 15, padding: 15, border: "2px solid " + (s.direction === "LONG" ? "#22c55e" : "#ef4444"), borderRadius: 12, backgroundColor: s.direction === "LONG" ? "#22c55e08" : "#ef444408" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 22, fontWeight: "bold", color: s.direction === "LONG" ? "#22c55e" : "#ef4444" }}>
                    {s.direction === "LONG" ? "🟢 LONG" : "🔴 SHORT"}
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ padding: "4px 10px", backgroundColor: s.confidence >= 90 ? "#22c55e30" : "#6366f130", color: s.confidence >= 90 ? "#22c55e" : "#a5b4fc", borderRadius: 20, fontSize: 13, fontWeight: "bold" }}>
                      {s.confidence}%
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={cardStyle}><div style={{ color: "#888", fontSize: 10 }}>ENTRY</div><div style={{ fontWeight: "bold", fontSize: 15 }}></div></div>
                  <div style={cardStyle}><div style={{ color: "#888", fontSize: 10 }}>STOP LOSS</div><div style={{ color: "#ef4444", fontWeight: "bold", fontSize: 15 }}></div></div>
                  <div style={cardStyle}><div style={{ color: "#888", fontSize: 10 }}>TP1 (1:1)</div><div style={{ color: "#22c55e" }}></div></div>
                  <div style={cardStyle}><div style={{ color: "#888", fontSize: 10 }}>TP2 (1:2)</div><div style={{ color: "#22c55e" }}></div></div>
                  <div style={{ ...cardStyle, gridColumn: "span 2", backgroundColor: "#22c55e15", border: "1px solid #22c55e30" }}>
                    <div style={{ color: "#22c55e", fontSize: 10 }}>TP3 (R:R 1:{s.riskReward})</div>
                    <div style={{ fontSize: 20, color: "#22c55e", fontWeight: "bold" }}></div>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {s.reasons?.map((r: string, i: number) => (
                    <span key={i} style={{ padding: "4px 8px", backgroundColor: "#1a1a2e", borderRadius: 4, fontSize: 10, color: "#888" }}>{r}</span>
                  ))}
                </div>

                <button onClick={() => copySignal(s)} style={{ width: "100%", marginTop: 12, padding: 12, backgroundColor: "#6366f1", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
                  📋 Copy Signal
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: 50, color: "#666" }}>
              <div style={{ fontSize: 50, marginBottom: 15 }}>⏳</div>
              <p style={{ margin: 0, fontSize: 14 }}>No high-probability signals</p>
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#555" }}>
                Waiting for confirmed SMC patterns...
              </p>
              <p style={{ margin: "5px 0 0", fontSize: 11, color: "#444" }}>
                Requires: Trend + BOS/CHoCH + Strong OB + FVG
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 30, color: "#333", fontSize: 11 }}>
        SMC Analyzer v1.0 • Signals require 85%+ confidence • R:R minimum 1:3 • For educational purposes only
      </div>
    </div>
  );
}
