export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface OrderBlock {
  id: string;
  type: 'ob';
  direction: 'bullish' | 'bearish';
  startTime: number;
  endTime: number;
  top: number;
  bottom: number;
  status: 'active' | 'mitigated' | 'expired';
  strength: number;
  hasFVG: boolean;
}

export interface FairValueGap {
  id: string;
  type: 'fvg';
  direction: 'bullish' | 'bearish';
  time: number;
  top: number;
  bottom: number;
  filled: boolean;
  fillPercentage: number;
}

export interface StructureBreak {
  id: string;
  type: 'bos' | 'choch';
  direction: 'bullish' | 'bearish';
  time: number;
  price: number;
  brokenLevel: number;
}

export interface LiquidityZone {
  id: string;
  type: 'liquidity';
  side: 'buy' | 'sell';
  price: number;
  startTime: number;
  endTime: number;
  touches: number;
  swept: boolean;
}

export interface TradeSignal {
  id: string;
  symbol: string;
  timeframe: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskReward: number;
  confidence: number;
  reasons: string[];
  timestamp: number;
  status: 'pending' | 'active' | 'hit_tp' | 'hit_sl' | 'expired';
  patterns: {
    orderBlocks: OrderBlock[];
    fvgs: FairValueGap[];
    structure: StructureBreak[];
    liquidity: LiquidityZone[];
  };
}

export interface SMCAnalysis {
  orderBlocks: OrderBlock[];
  fvgs: FairValueGap[];
  structure: StructureBreak[];
  liquidity: LiquidityZone[];
  trend: 'bullish' | 'bearish' | 'ranging';
  signals: TradeSignal[];
}

export interface DetectionSettings {
  orderBlocks: {
    enabled: boolean;
    minImpulseMultiplier: number;
    maxAge: number;
  };
  fvg: {
    enabled: boolean;
    minGapPercent: number;
    showFilled: boolean;
  };
  structure: {
    enabled: boolean;
    swingLookback: number;
  };
  liquidity: {
    enabled: boolean;
    tolerance: number;
    minTouches: number;
  };
  signals: {
    minRR: number;
    minConfidence: number;
  };
}