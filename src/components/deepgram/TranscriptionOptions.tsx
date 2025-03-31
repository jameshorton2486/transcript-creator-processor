
import React from 'react';
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
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TranscriptionOptionsProps {
  onOptionsChange: (name: string, value: any) => void;
  isLoading?: boolean;
}

export const TranscriptionOptions: React.FC<TranscriptionOptionsProps> = ({
  onOptionsChange,
  isLoading = false,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Transcription Options</h3>
      <Separator />
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-start space-x-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="diarize" 
              onCheckedChange={(checked) => onOptionsChange('diarize', checked === true)}
              disabled={isLoading}
            />
            <Label htmlFor="diarize">Speaker Diarization</Label>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Identifies and labels different speakers in the audio, making it easier to follow conversations.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-start space-x-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="punctuate" 
              defaultChecked
              onCheckedChange={(checked) => onOptionsChange('punctuate', checked === true)}
              disabled={isLoading}
            />
            <Label htmlFor="punctuate">Add Punctuation</Label>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Adds periods, commas, question marks, and other punctuation to make the transcript more readable.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-start space-x-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="smart_format" 
              defaultChecked
              onCheckedChange={(checked) => onOptionsChange('smart_format', checked === true)}
              disabled={isLoading}
            />
            <Label htmlFor="smart_format">Smart Format</Label>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Formats numbers, dates, and other entities in a human-readable way (e.g., "five hundred" becomes "500").</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="pt-2">
        <Label htmlFor="model" className="block mb-1 text-sm">Transcription Model</Label>
        <Select 
          defaultValue="nova-2"
          onValueChange={(value) => onOptionsChange('model', value)}
          disabled={isLoading}
        >
          <SelectTrigger id="model" className="w-full">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nova-2">Nova 2 (Latest & Most Accurate)</SelectItem>
            <SelectItem value="nova">Nova (Fast & Accurate)</SelectItem>
            <SelectItem value="enhanced">Enhanced (Balanced)</SelectItem>
            <SelectItem value="base">Base (Fastest)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 mt-2">
          Select the Deepgram model that best fits your needs. Nova 2 offers the highest accuracy but may take longer to process.
        </p>
      </div>
      
      <div className="text-xs text-slate-500 pt-2">
        <p>These options control how Deepgram processes your audio. More options are available in the Document Analysis page.</p>
        <p>Hover over the help icons for more information about each option.</p>
      </div>
    </div>
  );
};
