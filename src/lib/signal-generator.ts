import { Candle, OrderBlock, TradeSignal, SMCAnalysis, DetectionSettings } from './types';

export class SignalGenerator {
  private candles: Candle[];
  private analysis: Omit<SMCAnalysis, 'signals'>;
  private settings: DetectionSettings;
  private symbol: string;
  private timeframe: string;

  constructor(
    candles: Candle[],
    analysis: Omit<SMCAnalysis, 'signals'>,
    settings: DetectionSettings,
    symbol: string,
    timeframe: string
  ) {
    this.candles = candles;
    this.analysis = analysis;
    this.settings = settings;
    this.symbol = symbol;
    this.timeframe = timeframe;
  }

  generateSignals(): TradeSignal[] {
    const signals: TradeSignal[] = [];
    const currentCandle = this.candles[this.candles.length - 1];
    const currentPrice = currentCandle.close;
    
    const longSignal = this.generateLongSignal(currentPrice, currentCandle);
    if (longSignal) signals.push(longSignal);
    
    const shortSignal = this.generateShortSignal(currentPrice, currentCandle);
    if (shortSignal) signals.push(shortSignal);
    
    return signals.filter(s => 
      s.riskReward >= this.settings.signals.minRR && 
      s.confidence >= this.settings.signals.minConfidence
    );
  }

  private generateLongSignal(currentPrice: number, currentCandle: Candle): TradeSignal | null {
    const { orderBlocks, fvgs, structure, liquidity, trend } = this.analysis;
    
    const recentCHoCH = structure.filter(s => s.type === 'choch' && s.direction === 'bullish').pop();
    if (trend === 'bearish' && !recentCHoCH) return null;
    
    const bullishOBs = orderBlocks
      .filter(ob => ob.direction === 'bullish' && ob.status === 'active' && ob.top <= currentPrice)
      .sort((a, b) => b.top - a.top);
    
    if (bullishOBs.length === 0) return null;
    
    const targetOB = bullishOBs[0];
    const distanceToOB = (currentPrice - targetOB.top) / currentPrice * 100;
    if (distanceToOB > 0.5) return null;
    
    const entry = targetOB.top;
    const stopLoss = targetOB.bottom - (targetOB.top - targetOB.bottom) * 0.1;
    const risk = entry - stopLoss;
    
    const targets = this.findTargetsAbove(entry, risk);
    if (targets.length < 3) return null;
    
    const riskReward = (targets[2] - entry) / risk;
    
    let confidence = 50;
    if (trend === 'bullish') confidence += 15;
    if (recentCHoCH) confidence += 10;
    if (targetOB.hasFVG) confidence += 10;
    if (targetOB.strength >= 3) confidence += 10;
    
    const reasons: string[] = [];
    if (trend === 'bullish') reasons.push('Бычий тренд');
    if (recentCHoCH) reasons.push('CHoCH');
    if (targetOB.hasFVG) reasons.push('FVG в OB');
    if (targetOB.strength >= 3) reasons.push(`OB ${targetOB.strength}★`);
    
    return {
      id: `long_${Date.now()}`,
      symbol: this.symbol,
      timeframe: this.timeframe,
      direction: 'LONG',
      entry,
      stopLoss,
      takeProfit1: targets[0],
      takeProfit2: targets[1],
      takeProfit3: targets[2],
      riskReward: Math.round(riskReward * 100) / 100,
      confidence: Math.min(100, confidence),
      reasons,
      timestamp: currentCandle.time,
      status: 'pending',
      patterns: {
        orderBlocks: [targetOB],
        fvgs: fvgs.filter(f => f.direction === 'bullish'),
        structure: structure.filter(s => s.direction === 'bullish'),
        liquidity: liquidity.filter(l => l.side === 'buy'),
      },
    };
  }

  private generateShortSignal(currentPrice: number, currentCandle: Candle): TradeSignal | null {
    const { orderBlocks, fvgs, structure, liquidity, trend } = this.analysis;
    
    const recentCHoCH = structure.filter(s => s.type === 'choch' && s.direction === 'bearish').pop();
    if (trend === 'bullish' && !recentCHoCH) return null;
    
    const bearishOBs = orderBlocks
      .filter(ob => ob.direction === 'bearish' && ob.status === 'active' && ob.bottom >= currentPrice)
      .sort((a, b) => a.bottom - b.bottom);
    
    if (bearishOBs.length === 0) return null;
    
    const targetOB = bearishOBs[0];
    const distanceToOB = (targetOB.bottom - currentPrice) / currentPrice * 100;
    if (distanceToOB > 0.5) return null;
    
    const entry = targetOB.bottom;
    const stopLoss = targetOB.top + (targetOB.top - targetOB.bottom) * 0.1;
    const risk = stopLoss - entry;
    
    const targets = this.findTargetsBelow(entry, risk);
    if (targets.length < 3) return null;
    
    const riskReward = (entry - targets[2]) / risk;
    
    let confidence = 50;
    if (trend === 'bearish') confidence += 15;
    if (recentCHoCH) confidence += 10;
    if (targetOB.hasFVG) confidence += 10;
    if (targetOB.strength >= 3) confidence += 10;
    
    const reasons: string[] = [];
    if (trend === 'bearish') reasons.push('Медвежий тренд');
    if (recentCHoCH) reasons.push('CHoCH');
    if (targetOB.hasFVG) reasons.push('FVG в OB');
    if (targetOB.strength >= 3) reasons.push(`OB ${targetOB.strength}★`);
    
    return {
      id: `short_${Date.now()}`,
      symbol: this.symbol,
      timeframe: this.timeframe,
      direction: 'SHORT',
      entry,
      stopLoss,
      takeProfit1: targets[0],
      takeProfit2: targets[1],
      takeProfit3: targets[2],
      riskReward: Math.round(riskReward * 100) / 100,
      confidence: Math.min(100, confidence),
      reasons,
      timestamp: currentCandle.time,
      status: 'pending',
      patterns: {
        orderBlocks: [targetOB],
        fvgs: fvgs.filter(f => f.direction === 'bearish'),
        structure: structure.filter(s => s.direction === 'bearish'),
        liquidity: liquidity.filter(l => l.side === 'sell'),
      },
    };
  }

  private findTargetsAbove(entry: number, risk: number): number[] {
    return [entry + risk, entry + risk * 2, entry + risk * 3];
  }

  private findTargetsBelow(entry: number, risk: number): number[] {
    return [entry - risk, entry - risk * 2, entry - risk * 3];
  }
}