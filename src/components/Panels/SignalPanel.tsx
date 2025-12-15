'use client';

import { TradeSignal } from '@/lib/types';
import { Card, Badge, Button } from '@/components/ui/components';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Copy, Bell } from 'lucide-react';

interface SignalPanelProps {
  signals: TradeSignal[];
  onCopySignal: (signal: TradeSignal) => void;
  onSetAlert: (signal: TradeSignal) => void;
}

export default function SignalPanel({ signals, onCopySignal, onSetAlert }: SignalPanelProps) {
  if (signals.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          Торговые сигналы
        </h3>
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Нет активных сигналов</p>
          <p className="text-sm mt-1">Ожидайте формирования паттернов</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-indigo-500" />
        Сигналы ({signals.length})
      </h3>

      <div className="space-y-4">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`p-4 rounded-lg border ${
              signal.direction === 'LONG'
                ? 'bg-green-900/20 border-green-700'
                : 'bg-red-900/20 border-red-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {signal.direction === 'LONG' ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span className={`font-bold text-lg ${
                  signal.direction === 'LONG' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {signal.direction}
                </span>
                <Badge variant={signal.confidence >= 80 ? 'success' : 'warning'}>
                  {signal.confidence}%
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onCopySignal(signal)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onSetAlert(signal)}>
                  <Bell className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div className="bg-bg-tertiary p-2 rounded">
                <span className="text-gray-400">Entry:</span>
                <span className="text-white ml-2">{signal.entry.toFixed(2)}</span>
              </div>
              <div className="bg-bg-tertiary p-2 rounded">
                <span className="text-gray-400">SL:</span>
                <span className="text-red-400 ml-2">{signal.stopLoss.toFixed(2)}</span>
              </div>
              <div className="bg-bg-tertiary p-2 rounded">
                <span className="text-gray-400">TP1:</span>
                <span className="text-green-400 ml-2">{signal.takeProfit1.toFixed(2)}</span>
              </div>
              <div className="bg-bg-tertiary p-2 rounded">
                <span className="text-gray-400">TP2:</span>
                <span className="text-green-400 ml-2">{signal.takeProfit2.toFixed(2)}</span>
              </div>
              <div className="bg-bg-tertiary p-2 rounded col-span-2">
                <span className="text-gray-400">TP3 (R:R {signal.riskReward}):</span>
                <span className="text-green-400 ml-2 font-bold">{signal.takeProfit3.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-2">
              <span className="text-xs text-gray-400">Основание:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {signal.reasons.map((reason, idx) => (
                  <Badge key={idx} variant="default">{reason}</Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}