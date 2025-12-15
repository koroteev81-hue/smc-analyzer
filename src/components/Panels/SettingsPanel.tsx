'use client';

import { useState } from 'react';
import { DetectionSettings } from '@/lib/types';
import { Card } from '@/components/ui/components';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';

interface SettingsPanelProps {
  settings: DetectionSettings;
  onSettingsChange: (settings: DetectionSettings) => void;
}

export default function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = (category: keyof DetectionSettings, key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [category]: {
        ...(settings[category] as any),
        [key]: value,
      },
    });
  };

  return (
    <Card className="p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-white"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold">Настройки</span>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="p-3 bg-bg-tertiary rounded-lg">
            <span className="text-gray-300 font-medium block mb-2">Сигналы</span>
            <div className="space-y-2 text-sm">
              <label className="flex items-center justify-between">
                <span className="text-gray-400">Мин. R:R:</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={settings.signals.minRR}
                  onChange={(e) => updateSetting('signals', 'minRR', parseFloat(e.target.value))}
                  className="w-20 px-2 py-1 bg-bg-secondary rounded border border-gray-700 text-white"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-gray-400">Мин. уверенность:</span>
                <input
                  type="number"
                  step="5"
                  min="50"
                  max="100"
                  value={settings.signals.minConfidence}
                  onChange={(e) => updateSetting('signals', 'minConfidence', parseInt(e.target.value))}
                  className="w-20 px-2 py-1 bg-bg-secondary rounded border border-gray-700 text-white"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}