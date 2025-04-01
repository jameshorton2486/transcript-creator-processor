
import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface TranscriptionOptions {
  punctuate: boolean;
  diarize: boolean;
  language: string;
}

interface TranscriptionOptionsSectionProps {
  options: TranscriptionOptions;
  onOptionChange: (name: string, value: any) => void;
  isProcessing: boolean;
}

export const TranscriptionOptionsSection: React.FC<TranscriptionOptionsSectionProps> = ({
  options,
  onOptionChange,
  isProcessing
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Transcription Options</h3>
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="punctuate">Auto-punctuation</Label>
            <p className="text-xs text-slate-500">Add punctuation and capitalization</p>
          </div>
          <Switch
            id="punctuate"
            checked={options.punctuate}
            onCheckedChange={(checked) => onOptionChange('punctuate', checked)}
            disabled={isProcessing}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="diarize">Speaker Identification</Label>
            <p className="text-xs text-slate-500">Identify different speakers</p>
          </div>
          <Switch
            id="diarize"
            checked={options.diarize}
            onCheckedChange={(checked) => onOptionChange('diarize', checked)}
            disabled={isProcessing}
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="language">Language</Label>
          <Input
            id="language"
            value={options.language}
            onChange={(e) => onOptionChange('language', e.target.value)}
            placeholder="Language code (e.g., en, es, fr)"
            disabled={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};
