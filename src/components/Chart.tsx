"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

export default function Chart({ candles, orderBlocks, signals }: any) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !candles || candles.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0a15" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#1f1f3a" },
        horzLines: { color: "#1f1f3a" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    // Сортируем и форматируем данные
    const sortedCandles = [...candles]
      .sort((a, b) => a.time - b.time)
      .map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    candleSeries.setData(sortedCandles);

    // Добавляем маркеры для Order Blocks
    const markers: any[] = [];
    
    if (orderBlocks) {
      orderBlocks.forEach((ob: any, index: number) => {
        // Находим ближайшую свечу по времени
        const nearestCandle = sortedCandles.find(c => c.time >= (ob.time || sortedCandles[sortedCandles.length - 10 - index]?.time));
        if (nearestCandle) {
          markers.push({
            time: nearestCandle.time,
            position: ob.direction === "bullish" ? "belowBar" : "aboveBar",
            color: ob.direction === "bullish" ? "#22c55e" : "#ef4444",
            shape: ob.direction === "bullish" ? "arrowUp" : "arrowDown",
            text: "OB",
          });
        }
      });
    }

    if (signals) {
      signals.forEach((s: any) => {
        const lastCandle = sortedCandles[sortedCandles.length - 1];
        if (lastCandle) {
          markers.push({
            time: lastCandle.time,
            position: s.direction === "LONG" ? "belowBar" : "aboveBar",
            color: s.direction === "LONG" ? "#22c55e" : "#ef4444",
            shape: "circle",
            text: s.direction,
            size: 2,
          });
        }
      });
    }

    if (markers.length > 0) {
      // Сортируем маркеры по времени
      markers.sort((a, b) => a.time - b.time);
      candleSeries.setMarkers(markers);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [candles, orderBlocks, signals]);

  return (
    <div
      ref={chartContainerRef}
      style={{
        width: "100%",
        height: "400px",
        backgroundColor: "#0a0a15",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
}
