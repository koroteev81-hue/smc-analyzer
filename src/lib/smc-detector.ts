import { Candle, OrderBlock, FairValueGap, StructureBreak, LiquidityZone, SMCAnalysis, DetectionSettings } from './types';

export class SMCDetector {
  private candles: Candle[];
  private settings: DetectionSettings;

  constructor(candles: Candle[], settings: DetectionSettings) {
    this.candles = candles;
    this.settings = settings;
  }

  analyze(): Omit<SMCAnalysis, 'signals'> {
    const orderBlocks = this.settings.orderBlocks.enabled ? this.detectOrderBlocks() : [];
    const fvgs = this.settings.fvg.enabled ? this.detectFVGs() : [];
    const structure = this.settings.structure.enabled ? this.detectStructure() : [];
    const liquidity = this.settings.liquidity.enabled ? this.detectLiquidity() : [];
    const trend = this.determineTrend(structure);

    return { orderBlocks, fvgs, structure, liquidity, trend, signals: [] };
  }

  private detectOrderBlocks(): OrderBlock[] {
    const blocks: OrderBlock[] = [];
    const { minImpulseMultiplier, maxAge } = this.settings.orderBlocks;
    
    for (let i = 2; i < this.candles.length - 1; i++) {
      const prev = this.candles[i - 1];
      const curr = this.candles[i];
      
      const atr = this.calculateATR(Math.max(0, i - 14), i);
      const impulseSize = Math.abs(curr.close - curr.open);
      
      if (this.isBearishCandle(prev) && this.isBullishCandle(curr)) {
        const impulseStrength = impulseSize / atr;
        
        if (impulseStrength >= minImpulseMultiplier) {
          const isMitigated = this.isZoneMitigated(prev.low, prev.high, i + 1, 'bullish');
          
          blocks.push({
            id: `ob_bull_${i}`,
            type: 'ob',
            direction: 'bullish',
            startTime: prev.time,
            endTime: this.candles[Math.min(i + maxAge, this.candles.length - 1)].time,
            top: prev.high,
            bottom: prev.low,
            status: isMitigated ? 'mitigated' : 'active',
            strength: Math.min(5, Math.round(impulseStrength)),
            hasFVG: this.hasFVGNear(i, 'bullish'),
          });
        }
      }
      
      if (this.isBullishCandle(prev) && this.isBearishCandle(curr)) {
        const impulseStrength = impulseSize / atr;
        
        if (impulseStrength >= minImpulseMultiplier) {
          const isMitigated = this.isZoneMitigated(prev.low, prev.high, i + 1, 'bearish');
          
          blocks.push({
            id: `ob_bear_${i}`,
            type: 'ob',
            direction: 'bearish',
            startTime: prev.time,
            endTime: this.candles[Math.min(i + maxAge, this.candles.length - 1)].time,
            top: prev.high,
            bottom: prev.low,
            status: isMitigated ? 'mitigated' : 'active',
            strength: Math.min(5, Math.round(impulseStrength)),
            hasFVG: this.hasFVGNear(i, 'bearish'),
          });
        }
      }
    }
    
    return blocks.filter(b => b.status === 'active');
  }

  private detectFVGs(): FairValueGap[] {
    const gaps: FairValueGap[] = [];
    const { minGapPercent, showFilled } = this.settings.fvg;
    
    for (let i = 2; i < this.candles.length; i++) {
      const candle1 = this.candles[i - 2];
      const candle3 = this.candles[i];
      
      if (candle3.low > candle1.high) {
        const gapSize = (candle3.low - candle1.high) / candle1.high * 100;
        
        if (gapSize >= minGapPercent) {
          const { filled, fillPercentage } = this.checkFVGFill(candle1.high, candle3.low, i, 'bullish');
          
          if (showFilled || !filled) {
            gaps.push({
              id: `fvg_bull_${i}`,
              type: 'fvg',
              direction: 'bullish',
              time: this.candles[i - 1].time,
              top: candle3.low,
              bottom: candle1.high,
              filled,
              fillPercentage,
            });
          }
        }
      }
      
      if (candle3.high < candle1.low) {
        const gapSize = (candle1.low - candle3.high) / candle1.low * 100;
        
        if (gapSize >= minGapPercent) {
          const { filled, fillPercentage } = this.checkFVGFill(candle3.high, candle1.low, i, 'bearish');
          
          if (showFilled || !filled) {
            gaps.push({
              id: `fvg_bear_${i}`,
              type: 'fvg',
              direction: 'bearish',
              time: this.candles[i - 1].time,
              top: candle1.low,
              bottom: candle3.high,
              filled,
              fillPercentage,
            });
          }
        }
      }
    }
    
    return gaps;
  }

  private detectStructure(): StructureBreak[] {
    const breaks: StructureBreak[] = [];
    const { swingLookback } = this.settings.structure;
    
    const swingHighs: { index: number; price: number }[] = [];
    const swingLows: { index: number; price: number }[] = [];
    
    for (let i = swingLookback; i < this.candles.length - swingLookback; i++) {
      let isSwingHigh = true;
      let isSwingLow = true;
      
      for (let j = 1; j <= swingLookback; j++) {
        if (this.candles[i].high <= this.candles[i - j].high ||
            this.candles[i].high <= this.candles[i + j].high) {
          isSwingHigh = false;
        }
        if (this.candles[i].low >= this.candles[i - j].low ||
            this.candles[i].low >= this.candles[i + j].low) {
          isSwingLow = false;
        }
      }
      
      if (isSwingHigh) swingHighs.push({ index: i, price: this.candles[i].high });
      if (isSwingLow) swingLows.push({ index: i, price: this.candles[i].low });
    }
    
    let lastTrend: 'bullish' | 'bearish' | null = null;
    
    for (let i = 1; i < this.candles.length; i++) {
      const candle = this.candles[i];
      
      const lastSwingHigh = swingHighs.filter(s => s.index < i).pop();
      const lastSwingLow = swingLows.filter(s => s.index < i).pop();
      
      if (lastSwingHigh && candle.close > lastSwingHigh.price) {
        if (lastTrend === 'bearish') {
          breaks.push({
            id: `choch_bull_${i}`,
            type: 'choch',
            direction: 'bullish',
            time: candle.time,
            price: candle.close,
            brokenLevel: lastSwingHigh.price,
          });
        } else if (lastTrend === 'bullish') {
          breaks.push({
            id: `bos_bull_${i}`,
            type: 'bos',
            direction: 'bullish',
            time: candle.time,
            price: candle.close,
            brokenLevel: lastSwingHigh.price,
          });
        }
        lastTrend = 'bullish';
      }
      
      if (lastSwingLow && candle.close < lastSwingLow.price) {
        if (lastTrend === 'bullish') {
          breaks.push({
            id: `choch_bear_${i}`,
            type: 'choch',
            direction: 'bearish',
            time: candle.time,
            price: candle.close,
            brokenLevel: lastSwingLow.price,
          });
        } else if (lastTrend === 'bearish') {
          breaks.push({
            id: `bos_bear_${i}`,
            type: 'bos',
            direction: 'bearish',
            time: candle.time,
            price: candle.close,
            brokenLevel: lastSwingLow.price,
          });
        }
        lastTrend = 'bearish';
      }
    }
    
    return breaks;
  }

  private detectLiquidity(): LiquidityZone[] {
    const zones: LiquidityZone[] = [];
    const { tolerance, minTouches } = this.settings.liquidity;
    
    const levels: Map<string, { price: number; touches: number; side: 'buy' | 'sell'; times: number[] }> = new Map();
    
    for (let i = 0; i < this.candles.length; i++) {
      const candle = this.candles[i];
      
      let foundHigh = false;
      levels.forEach((level) => {
        if (level.side === 'sell') {
          const diff = Math.abs(candle.high - level.price) / level.price * 100;
          if (diff <= tolerance) {
            level.touches++;
            level.times.push(i);
            foundHigh = true;
          }
        }
      });
      
      if (!foundHigh) {
        levels.set(`h_${i}`, { price: candle.high, touches: 1, side: 'sell', times: [i] });
      }
      
      let foundLow = false;
      levels.forEach((level) => {
        if (level.side === 'buy') {
          const diff = Math.abs(candle.low - level.price) / level.price * 100;
          if (diff <= tolerance) {
            level.touches++;
            level.times.push(i);
            foundLow = true;
          }
        }
      });
      
      if (!foundLow) {
        levels.set(`l_${i}`, { price: candle.low, touches: 1, side: 'buy', times: [i] });
      }
    }
    
    levels.forEach((level, key) => {
      if (level.touches >= minTouches) {
        const firstTime = this.candles[level.times[0]].time;
        const lastTime = this.candles[level.times[level.times.length - 1]].time;
        const swept = this.isLiquiditySwept(level.price, level.side, level.times[level.times.length - 1]);
        
        zones.push({
          id: `liq_${key}`,
          type: 'liquidity',
          side: level.side,
          price: level.price,
          startTime: firstTime,
          endTime: lastTime,
          touches: level.touches,
          swept,
        });
      }
    });
    
    return zones.filter(z => !z.swept);
  }

  private determineTrend(structure: StructureBreak[]): 'bullish' | 'bearish' | 'ranging' {
    if (structure.length === 0) return 'ranging';
    
    const recent = structure.slice(-5);
    const bullish = recent.filter(s => s.direction === 'bullish').length;
    const bearish = recent.filter(s => s.direction === 'bearish').length;
    
    if (bullish > bearish + 1) return 'bullish';
    if (bearish > bullish + 1) return 'bearish';
    return 'ranging';
  }

  private isBullishCandle(candle: Candle): boolean {
    return candle.close > candle.open;
  }

  private isBearishCandle(candle: Candle): boolean {
    return candle.close < candle.open;
  }

  private calculateATR(start: number, end: number): number {
    let sum = 0;
    let count = 0;
    
    for (let i = Math.max(1, start); i <= end; i++) {
      const tr = Math.max(
        this.candles[i].high - this.candles[i].low,
        Math.abs(this.candles[i].high - this.candles[i - 1].close),
        Math.abs(this.candles[i].low - this.candles[i - 1].close)
      );
      sum += tr;
      count++;
    }
    
    return count > 0 ? sum / count : 1;
  }

  private isZoneMitigated(low: number, high: number, startIndex: number, direction: 'bullish' | 'bearish'): boolean {
    for (let i = startIndex; i < this.candles.length; i++) {
      if (direction === 'bullish' && this.candles[i].low <= high) return true;
      if (direction === 'bearish' && this.candles[i].high >= low) return true;
    }
    return false;
  }

  private hasFVGNear(index: number, direction: 'bullish' | 'bearish'): boolean {
    for (let i = Math.max(2, index - 3); i <= Math.min(this.candles.length - 1, index + 3); i++) {
      if (i < 2) continue;
      const c1 = this.candles[i - 2];
      const c3 = this.candles[i];
      if (direction === 'bullish' && c3.low > c1.high) return true;
      if (direction === 'bearish' && c3.high < c1.low) return true;
    }
    return false;
  }

  private checkFVGFill(bottom: number, top: number, startIndex: number, direction: 'bullish' | 'bearish'): { filled: boolean; fillPercentage: number } {
    const gapSize = top - bottom;
    let maxFill = 0;
    
    for (let i = startIndex + 1; i < this.candles.length; i++) {
      if (direction === 'bullish') {
        if (this.candles[i].low <= bottom) return { filled: true, fillPercentage: 100 };
        maxFill = Math.max(maxFill, top - this.candles[i].low);
      } else {
        if (this.candles[i].high >= top) return { filled: true, fillPercentage: 100 };
        maxFill = Math.max(maxFill, this.candles[i].high - bottom);
      }
    }
    
    return { filled: false, fillPercentage: gapSize > 0 ? (maxFill / gapSize) * 100 : 0 };
  }

  private isLiquiditySwept(price: number, side: 'buy' | 'sell', lastTouchIndex: number): boolean {
    for (let i = lastTouchIndex + 1; i < this.candles.length; i++) {
      if (side === 'sell' && this.candles[i].high > price) return true;
      if (side === 'buy' && this.candles[i].low < price) return true;
    }
    return false;
  }
}

export const defaultSettings: DetectionSettings = {
  orderBlocks: { enabled: true, minImpulseMultiplier: 1.5, maxAge: 100 },
  fvg: { enabled: true, minGapPercent: 0.05, showFilled: false },
  structure: { enabled: true, swingLookback: 5 },
  liquidity: { enabled: true, tolerance: 0.1, minTouches: 2 },
  signals: { minRR: 3, minConfidence: 70 },
};