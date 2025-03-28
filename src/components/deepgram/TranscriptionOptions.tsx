
import React, { useCallback } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface TranscriptionOptionsProps {
  onOptionsChange: (name: string, value: any) => void;
  isLoading: boolean;
}

export const TranscriptionOptions: React.FC<TranscriptionOptionsProps> = ({
  onOptionsChange,
  isLoading
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Transcription Options</h3>
      <Separator />
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="diarize" 
            onCheckedChange={(checked) => onOptionsChange('diarize', checked === true)}
            disabled={isLoading}
          />
          <Label htmlFor="diarize">Speaker Diarization</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="punctuate" 
            defaultChecked
            onCheckedChange={(checked) => onOptionsChange('punctuate', checked === true)}
            disabled={isLoading}
          />
          <Label htmlFor="punctuate">Add Punctuation</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="smart_format" 
            defaultChecked
            onCheckedChange={(checked) => onOptionsChange('smart_format', checked === true)}
            disabled={isLoading}
          />
          <Label htmlFor="smart_format">Smart Format</Label>
        </div>

        <div className="space-y-1">
          <Label htmlFor="model">Model</Label>
          <Select 
            defaultValue="nova-2"
            onValueChange={(value) => onOptionsChange('model', value)}
            disabled={isLoading}
          >
            <SelectTrigger id="model" className="w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nova-2">Nova 2 (Recommended)</SelectItem>
              <SelectItem value="nova">Nova</SelectItem>
              <SelectItem value="enhanced">Enhanced</SelectItem>
              <SelectItem value="base">Base</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
