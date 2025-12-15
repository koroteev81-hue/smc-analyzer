'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { Candle, SMCAnalysis, TradeSignal } from '@/lib/types';

interface SMCChartProps {
  candles: Candle[];
  analysis: SMCAnalysis | null;
  signals: TradeSignal[];
}

export default function SMCChart({ candles, analysis, signals }: SMCChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#0f0f1a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f1f3a' },
        horzLines: { color: '#1f1f3a' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#2d2d44',
      },
      timeScale: {
        borderColor: '#2d2d44',
        timeVisible: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;
    setIsReady(true);

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const chartData: CandlestickData[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    seriesRef.current.setData(chartData);
    chartRef.current?.timeScale().fitContent();
  }, [candles, isReady]);

  useEffect(() => {
    if (!seriesRef.current || !analysis) return;

    const markers: any[] = [];

    analysis.orderBlocks.forEach((ob) => {
      markers.push({
        time: ob.startTime as Time,
        position: ob.direction === 'bullish' ? 'belowBar' : 'aboveBar',
        color: ob.direction === 'bullish' ? '#22c55e' : '#ef4444',
        shape: 'square',
        text: `OB`,
      });
    });

    analysis.structure.forEach((s) => {
      markers.push({
        time: s.time as Time,
        position: s.direction === 'bullish' ? 'belowBar' : 'aboveBar',
        color: s.type === 'choch' ? '#f97316' : '#3b82f6',
        shape: 'circle',
        text: s.type.toUpperCase(),
      });
    });

    signals.forEach((signal) => {
      markers.push({
        time: signal.timestamp as Time,
        position: signal.direction === 'LONG' ? 'belowBar' : 'aboveBar',
        color: signal.direction === 'LONG' ? '#22c55e' : '#ef4444',
        shape: 'arrowUp',
        text: `${signal.direction} RR:${signal.riskReward}`,
        size: 2,
      });
    });

    seriesRef.current.setMarkers(markers);
  }, [analysis, signals, isReady]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full" />
      <div className="absolute top-2 left-2 flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-400">Bull OB</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-gray-400">Bear OB</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-gray-400">BOS</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded" />
          <span className="text-gray-400">CHoCH</span>
        </div>
      </div>
    </div>
  );
}