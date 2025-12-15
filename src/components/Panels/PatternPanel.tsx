'use client';

import { SMCAnalysis } from '@/lib/types';
import { Card, Badge } from '@/components/ui/components';
import { Layers, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PatternPanelProps {
  analysis: SMCAnalysis | null;
}

export default function PatternPanel({ analysis }: PatternPanelProps) {
  if (!analysis) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          SMC Паттерны
        </h3>
        <p className="text-gray-500 text-center py-4">Загрузка...</p>
      </Card>
    );
  }

  const TrendIcon = analysis.trend === 'bullish' ? TrendingUp : 
                    analysis.trend === 'bearish' ? TrendingDown : Activity;
  const trendColor = analysis.trend === 'bullish' ? 'text-green-400' : 
                     analysis.trend === 'bearish' ? 'text-red-400' : 'text-yellow-400';

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-indigo-500" />
        SMC Паттерны
      </h3>

      <div className="mb-4 p-3 bg-bg-tertiary rounded-lg flex items-center justify-between">
        <span className="text-gray-400">Тренд:</span>
        <div className={`flex items-center gap-2 ${trendColor}`}>
          <TrendIcon className="w-5 h-5" />
          <span className="font-semibold capitalize">{analysis.trend}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 hover:bg-bg-tertiary rounded">
          <span className="text-gray-300">Order Blocks</span>
          <div className="flex gap-2">
            <Badge variant="success">
              {analysis.orderBlocks.filter((ob) => ob.direction === 'bullish').length} ↑
            </Badge>
            <Badge variant="danger">
              {analysis.orderBlocks.filter((ob) => ob.direction === 'bearish').length} ↓
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 hover:bg-bg-tertiary rounded">
          <span className="text-gray-300">Fair Value Gaps</span>
          <Badge variant="default">{analysis.fvgs.length}</Badge>
        </div>

        <div className="flex items-center justify-between p-2 hover:bg-bg-tertiary rounded">
          <span className="text-gray-300">BOS / CHoCH</span>
          <div className="flex gap-2">
            <Badge variant="default">
              {analysis.structure.filter((s) => s.type === 'bos').length} BOS
            </Badge>
            <Badge variant="warning">
              {analysis.structure.filter((s) => s.type === 'choch').length} CHoCH
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 hover:bg-bg-tertiary rounded">
          <span className="text-gray-300">Liquidity</span>
          <Badge variant="default">{analysis.liquidity.length}</Badge>
        </div>
      </div>
    </Card>
  );
}