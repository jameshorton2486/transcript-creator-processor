
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TranscriptionOptions {
  punctuate: boolean;
  speakerLabels: boolean;
  formatText: boolean;
  model?: string;
}

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
    
    console.log('Updated transcription options:', updatedOptions);
    onOptionsChange(updatedOptions);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">AssemblyAI Transcription Options</h3>
      
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
            id="speakerLabels"
            checked={options.speakerLabels}
            onCheckedChange={(checked) => updateOption('speakerLabels', checked === true)}
          />
          <Label htmlFor="speakerLabels" className="cursor-pointer text-sm">
            Speaker identification
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="formatText"
            checked={options.formatText}
            onCheckedChange={(checked) => updateOption('formatText', checked === true)}
          />
          <Label htmlFor="formatText" className="cursor-pointer text-sm">
            Format text
          </Label>
        </div>
      </div>
    </div>
  );
};
