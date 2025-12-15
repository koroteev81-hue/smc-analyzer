import { Candle } from './types';

export async function fetchCandles(
  symbol: string,
  timeframe: string,
  limit: number = 500
): Promise<Candle[]> {
  try {
    const interval = convertTimeframe(timeframe);
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return generateDemoCandles(limit);
    }
    
    const data = await response.json();
    
    return data.map((k: any[]) => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch (error) {
    console.error('Fetch error:', error);
    return generateDemoCandles(limit);
  }
}

function convertTimeframe(tf: string): string {
  const map: Record<string, string> = {
    '1m': '1m', '5m': '5m', '15m': '15m',
    '1H': '1h', '4H': '4h', '1D': '1d', '1W': '1w',
  };
  return map[tf] || '1h';
}

function generateDemoCandles(count: number): Candle[] {
  const candles: Candle[] = [];
  let price = 45000;
  const now = Math.floor(Date.now() / 1000);
  const interval = 3600;
  
  for (let i = count; i >= 0; i--) {
    const change = (Math.random() - 0.5) * 0.02 * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 0.01 * price;
    const low = Math.min(open, close) - Math.random() * 0.01 * price;
    
    candles.push({
      time: now - i * interval,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(Math.random() * 1000000),
    });
    
    price = close;
  }
  
  return candles;
}

export const availableSymbols = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'BNBUSDT', label: 'BNB/USDT' },
  { value: 'SOLUSDT', label: 'SOL/USDT' },
  { value: 'XRPUSDT', label: 'XRP/USDT' },
];

export const availableTimeframes = [
  { value: '5m', label: '5м' },
  { value: '15m', label: '15м' },
  { value: '1H', label: '1ч' },
  { value: '4H', label: '4ч' },
  { value: '1D', label: '1д' },
];