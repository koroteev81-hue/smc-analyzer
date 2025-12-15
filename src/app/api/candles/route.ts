import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol = 'BTCUSDT', timeframe = '1H' } = body

    const interval = timeframe === '1H' ? '1h' : timeframe === '4H' ? '4h' : '15m'
    
    let candles: any[] = []
    let currentPrice = 0

    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`
      const res = await fetch(url)
      const data = await res.json()
      
      // Преобразуем и СОРТИРУЕМ по времени
      candles = data.map((k: any[]) => ({
        time: Math.floor(k[0] / 1000), // Конвертируем в секунды
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
      }))
      
      // Сортируем по возрастанию времени
      candles.sort((a, b) => a.time - b.time)
      
      currentPrice = candles[candles.length - 1]?.close || 0
    } catch (e) {
      // Генерируем демо-данные если API недоступен
      const now = Math.floor(Date.now() / 1000)
      currentPrice = 45000
      
      for (let i = 99; i >= 0; i--) {
        const time = now - i * 3600
        const change = (Math.random() - 0.5) * 500
        const open = currentPrice
        const close = currentPrice + change
        
        candles.push({
          time: time,
          open: open,
          high: Math.max(open, close) + Math.random() * 100,
          low: Math.min(open, close) - Math.random() * 100,
          close: close
        })
        
        currentPrice = close
      }
    }

    // Находим Order Blocks
    const orderBlocks: any[] = []
    
    for (let i = 2; i < candles.length; i++) {
      const prev = candles[i - 1]
      const curr = candles[i]
      
      // Бычий OB: медвежья свеча + бычья свеча
      if (prev.close < prev.open && curr.close > curr.open) {
        const impulse = Math.abs(curr.close - curr.open)
        const prevSize = Math.abs(prev.close - prev.open)
        
        if (impulse > prevSize * 1.2) {
          orderBlocks.push({
            id: `ob_bull_${i}`,
            direction: 'bullish',
            top: Math.round(prev.high * 100) / 100,
            bottom: Math.round(prev.low * 100) / 100,
            strength: Math.min(5, Math.floor(impulse / prevSize))
          })
        }
      }
      
      // Медвежий OB: бычья свеча + медвежья свеча
      if (prev.close > prev.open && curr.close < curr.open) {
        const impulse = Math.abs(curr.close - curr.open)
        const prevSize = Math.abs(prev.close - prev.open)
        
        if (impulse > prevSize * 1.2) {
          orderBlocks.push({
            id: `ob_bear_${i}`,
            direction: 'bearish',
            top: Math.round(prev.high * 100) / 100,
            bottom: Math.round(prev.low * 100) / 100,
            strength: Math.min(5, Math.floor(impulse / prevSize))
          })
        }
      }
    }

    // Определяем тренд
    const recent = candles.slice(-20)
    const firstPrice = recent[0]?.close || 0
    const lastPrice = recent[recent.length - 1]?.close || 0
    
    let trend = 'ranging'
    if (lastPrice > firstPrice * 1.005) trend = 'bullish'
    if (lastPrice < firstPrice * 0.995) trend = 'bearish'

    // Генерируем сигналы
    const signals: any[] = []
    const lastOBs = orderBlocks.slice(-10)
    const price = candles[candles.length - 1]?.close || 0

    // Ищем LONG сигнал
    const bullOB = lastOBs.find(ob => ob.direction === 'bullish' && ob.top <= price)
    if (bullOB && trend !== 'bearish') {
      const entry = bullOB.top
      const sl = bullOB.bottom - (bullOB.top - bullOB.bottom) * 0.1
      const risk = entry - sl
      
      if (risk > 0) {
        signals.push({
          id: 'long_' + Date.now(),
          direction: 'LONG',
          entry: Math.round(entry * 100) / 100,
          stopLoss: Math.round(sl * 100) / 100,
          takeProfit1: Math.round((entry + risk * 1) * 100) / 100,
          takeProfit2: Math.round((entry + risk * 2) * 100) / 100,
          takeProfit3: Math.round((entry + risk * 3) * 100) / 100,
          riskReward: 3,
          confidence: trend === 'bullish' ? 85 : 70,
          reasons: ['Order Block', trend === 'bullish' ? 'Bullish Trend' : 'Neutral Trend']
        })
      }
    }

    // Ищем SHORT сигнал
    const bearOB = lastOBs.find(ob => ob.direction === 'bearish' && ob.bottom >= price)
    if (bearOB && trend !== 'bullish') {
      const entry = bearOB.bottom
      const sl = bearOB.top + (bearOB.top - bearOB.bottom) * 0.1
      const risk = sl - entry
      
      if (risk > 0) {
        signals.push({
          id: 'short_' + Date.now(),
          direction: 'SHORT',
          entry: Math.round(entry * 100) / 100,
          stopLoss: Math.round(sl * 100) / 100,
          takeProfit1: Math.round((entry - risk * 1) * 100) / 100,
          takeProfit2: Math.round((entry - risk * 2) * 100) / 100,
          takeProfit3: Math.round((entry - risk * 3) * 100) / 100,
          riskReward: 3,
          confidence: trend === 'bearish' ? 85 : 70,
          reasons: ['Order Block', trend === 'bearish' ? 'Bearish Trend' : 'Neutral Trend']
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        trend,
        orderBlocks: orderBlocks.slice(-10),
        signals,
        currentPrice: Math.round(price * 100) / 100,
        candles: candles // Отправляем отсортированные свечи
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 })
  }
}