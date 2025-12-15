'use client';

import { Select, Button } from '@/components/ui/components';
import { availableSymbols, availableTimeframes } from '@/lib/data-fetcher';
import { RefreshCw } from 'lucide-react';

interface ChartControlsProps {
  symbol: string;
  timeframe: string;
  onSymbolChange: (symbol: string) => void;
  onTimeframeChange: (tf: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function ChartControls({
  symbol,
  timeframe,
  onSymbolChange,
  onTimeframeChange,
  onRefresh,
  isLoading,
}: ChartControlsProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-t-lg border-b border-gray-800 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Пара:</span>
        <Select
          value={symbol}
          onChange={onSymbolChange}
          options={availableSymbols}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">ТФ:</span>
        <div className="flex gap-1">
          {availableTimeframes.map((tf) => (
            <Button
              key={tf.value}
              variant={timeframe === tf.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onTimeframeChange(tf.value)}
            >
              {tf.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="ml-auto">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}