
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

interface TranscriptionOptionsProps {
  onOptionsChange: (name: string, value: any) => void;
  isLoading?: boolean;
  initialOptions?: Record<string, any>;
}

export const TranscriptionOptions: React.FC<TranscriptionOptionsProps> = ({
  onOptionsChange,
  isLoading = false,
  initialOptions = {}
}) => {
  const [options, setOptions] = useState({
    model: initialOptions.model || 'nova-2',
    punctuate: initialOptions.punctuate !== false,
    smart_format: initialOptions.smart_format !== false,
    diarize: initialOptions.diarize === true
  });

  useEffect(() => {
    // Apply initial options when they change
    if (initialOptions && Object.keys(initialOptions).length > 0) {
      setOptions(prev => ({
        ...prev,
        model: initialOptions.model || prev.model,
        punctuate: initialOptions.punctuate !== false,
        smart_format: initialOptions.smart_format !== false,
        diarize: initialOptions.diarize === true
      }));
    }
  }, [initialOptions]);

  const handleOptionChange = (name: string, value: any) => {
    setOptions(prev => ({ ...prev, [name]: value }));
    onOptionsChange(name, value);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-1">
          <Label htmlFor="model-select" className="text-sm font-medium">
            Model
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Deepgram offers different models for various use cases. 
                  Nova-2 offers the best accuracy for general transcription.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select
          disabled={isLoading}
          value={options.model}
          onValueChange={(value) => handleOptionChange('model', value)}
        >
          <SelectTrigger id="model-select" className="w-full">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nova-2">Nova 2 (Best Accuracy)</SelectItem>
            <SelectItem value="nova">Nova</SelectItem>
            <SelectItem value="enhanced">Enhanced</SelectItem>
            <SelectItem value="base">Base (Fastest)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label htmlFor="diarize" className="text-sm font-medium">Speaker Diarization</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Identifies different speakers in the audio and labels them separately.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="diarize"
            checked={options.diarize}
            onCheckedChange={(checked) => handleOptionChange('diarize', checked)}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label htmlFor="punctuate" className="text-sm font-medium">Punctuation</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Adds punctuation marks to the transcript.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="punctuate"
            checked={options.punctuate}
            onCheckedChange={(checked) => handleOptionChange('punctuate', checked)}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label htmlFor="smart_format" className="text-sm font-medium">Smart Format</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Formats numbers, dates, and other entities into their written form.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="smart_format"
            checked={options.smart_format}
            onCheckedChange={(checked) => handleOptionChange('smart_format', checked)}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default TranscriptionOptions;
