
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TranscriptionOptions } from "@/lib/config";

interface TranscriptionOptionsSelectorProps {
  options: TranscriptionOptions;
  onOptionsChange: (options: Partial<TranscriptionOptions>) => void;
}

export const TranscriptionOptionsSelector = ({ 
  options, 
  onOptionsChange 
}: TranscriptionOptionsSelectorProps) => {
  // Function to update a specific option
  const updateOption = (key: keyof TranscriptionOptions, value: boolean) => {
    const updatedOptions = { 
      ...options, 
      [key]: value 
    };
    
    // When enabling speaker identification (diarize), always enable word time offsets
    // This is REQUIRED for Google's speaker diarization to work properly
    if (key === 'diarize' && value === true) {
      updatedOptions.enableWordTimeOffsets = true;
      console.log('Enabling word time offsets as required for speaker identification');
    }
    
    console.log('Updated transcription options:', updatedOptions);
    onOptionsChange(updatedOptions);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Transcription Options</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="punctuate"
            checked={options.punctuate}
            onCheckedChange={(checked) => updateOption('punctuate', checked === true)}
          />
          <Label htmlFor="punctuate" className="cursor-pointer text-sm">
            Automatic punctuation
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="diarize"
            checked={options.diarize}
            onCheckedChange={(checked) => updateOption('diarize', checked === true)}
          />
          <Label htmlFor="diarize" className="cursor-pointer text-sm">
            Speaker identification
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="word-timestamps"
            checked={options.enableWordTimeOffsets}
            disabled={options.diarize} // Disable this when diarize is enabled as it's required
            onCheckedChange={(checked) => updateOption('enableWordTimeOffsets', checked === true)}
          />
          <Label 
            htmlFor="word-timestamps" 
            className={`cursor-pointer text-sm ${options.diarize ? 'text-gray-500' : ''}`}
          >
            Word timestamps {options.diarize && "(required for speaker identification)"}
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="enhanced-model"
            checked={options.useEnhanced}
            onCheckedChange={(checked) => updateOption('useEnhanced', checked === true)}
          />
          <Label htmlFor="enhanced-model" className="cursor-pointer text-sm">
            Enhanced model
          </Label>
        </div>
      </div>
    </div>
  );
};
