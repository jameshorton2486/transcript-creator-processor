
import React, { useState, useEffect } from 'react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DeepgramTranscriptionOptionsProps {
  onOptionsChange: (name: string, value: any) => void;
  isLoading?: boolean;
  initialOptions?: any;
}

export const DeepgramTranscriptionOptions: React.FC<DeepgramTranscriptionOptionsProps> = ({
  onOptionsChange,
  isLoading = false,
  initialOptions = {}
}) => {
  const [options, setOptions] = useState(initialOptions);

  // Update options when initialOptions change
  useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  const handleOptionChange = (name: string, value: any) => {
    const updatedOptions = { ...options, [name]: value };
    setOptions(updatedOptions);
    onOptionsChange(name, value);
    
    // Special handling for automatic enablement of punctuation
    if (
      ['summarize', 'topics', 'intents', 'detect_entities', 'sentiment'].includes(name) && 
      value === true && 
      !options.punctuate
    ) {
      onOptionsChange('punctuate', true);
      setOptions(prev => ({ ...prev, punctuate: true }));
    }
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["transcription", "intelligence"]}>
        <AccordionItem value="transcription">
          <AccordionTrigger>Transcription Options</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 sm:grid-cols-2 mt-2">
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="punctuate" 
                    checked={options.punctuate}
                    onCheckedChange={(checked) => handleOptionChange('punctuate', checked === true)}
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
                    checked={options.smart_format}
                    onCheckedChange={(checked) => handleOptionChange('smart_format', checked === true)}
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
                      <p>Formats numbers, dates, and other entities in a human-readable way (e.g., "five hundred" becomes "500"). Also enables punctuation.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="paragraphs" 
                    checked={options.paragraphs}
                    onCheckedChange={(checked) => handleOptionChange('paragraphs', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="paragraphs">Paragraphs</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Splits audio into paragraphs to improve transcript readability. Also enables punctuation.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="diarize" 
                    checked={options.diarize}
                    onCheckedChange={(checked) => handleOptionChange('diarize', checked === true)}
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
                    id="utterances" 
                    checked={options.utterances}
                    onCheckedChange={(checked) => handleOptionChange('utterances', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="utterances">Utterances</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Segments speech into meaningful semantic units, typically starting a new utterance after 0.8s of silence.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filler_words" 
                    checked={options.filler_words}
                    onCheckedChange={(checked) => handleOptionChange('filler_words', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="filler_words">Filler Words</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Includes disfluencies like "uh" and "um" in the transcript.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="profanity_filter" 
                    checked={options.profanity_filter}
                    onCheckedChange={(checked) => handleOptionChange('profanity_filter', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="profanity_filter">Profanity Filter</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Removes profanity from the transcript. Not available for Nova 3 model.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="detect_language" 
                    checked={options.detect_language}
                    onCheckedChange={(checked) => handleOptionChange('detect_language', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="detect_language">Detect Language</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Automatically detects the language spoken in the audio.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="intelligence">
          <AccordionTrigger>Audio Intelligence Features</AccordionTrigger>
          <AccordionContent>
            <p className="text-xs text-slate-500 mb-4">
              Audio intelligence features are powered by task-specific language models. When enabled, Punctuation will also be enabled.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="summarize" 
                    checked={options.summarize}
                    onCheckedChange={(checked) => handleOptionChange('summarize', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="summarize">Summarization</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Provides summaries for sections of content.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="topics" 
                    checked={options.topics}
                    onCheckedChange={(checked) => handleOptionChange('topics', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="topics">Topic Detection</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Identifies and extracts key topics for sections of content.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="intents" 
                    checked={options.intents}
                    onCheckedChange={(checked) => handleOptionChange('intents', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="intents">Intent Recognition</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Recognizes intents in the audio content.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="detect_entities" 
                    checked={options.detect_entities}
                    onCheckedChange={(checked) => handleOptionChange('detect_entities', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="detect_entities">Entity Detection</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Identifies and extracts key entities for sections of content.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sentiment" 
                    checked={options.sentiment}
                    onCheckedChange={(checked) => handleOptionChange('sentiment', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="sentiment">Sentiment</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Identifies sentiment (positive, neutral, or negative) with a sentiment score at word, sentence, paragraph, and segment levels.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="pt-2">
        <Label htmlFor="model" className="block mb-1 text-sm">Transcription Model</Label>
        <Select 
          value={options.model || "nova-2"}
          onValueChange={(value) => handleOptionChange('model', value)}
          disabled={isLoading}
        >
          <SelectTrigger id="model" className="w-full">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nova-3">Nova 3 (Best Overall)</SelectItem>
            <SelectItem value="nova-2">Nova 2 (High Accuracy)</SelectItem>
            <SelectItem value="nova">Nova (Fast & Accurate)</SelectItem>
            <SelectItem value="enhanced">Enhanced (Balanced)</SelectItem>
            <SelectItem value="base">Base (Fastest)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 mt-2">
          Select the Deepgram model that best fits your needs. Nova 3 offers the highest accuracy but may take longer to process.
        </p>
      </div>
    </div>
  );
};
