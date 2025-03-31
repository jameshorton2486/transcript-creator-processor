
import React, { useEffect } from 'react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface DeepgramTranscriptionOptionsProps {
  onOptionsChange: (name: string, value: any) => void;
  isLoading?: boolean;
  initialOptions?: Record<string, any>;
}

export const DeepgramTranscriptionOptions: React.FC<DeepgramTranscriptionOptionsProps> = ({
  onOptionsChange,
  isLoading = false,
  initialOptions
}) => {
  // Load initial options if provided
  useEffect(() => {
    if (initialOptions) {
      Object.entries(initialOptions).forEach(([key, value]) => {
        onOptionsChange(key, value);
      });
    }
  }, [initialOptions, onOptionsChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Deepgram Transcription Options</h3>
      <Separator />
      
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="transcription">
          <AccordionTrigger className="text-base font-medium">
            Core Transcription Options
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
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

              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="detect_language" 
                    onCheckedChange={(checked) => onOptionsChange('detect_language', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="detect_language">Auto-detect Language</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Automatically identifies the spoken language in the audio instead of assuming English.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="profanity_filter" 
                    onCheckedChange={(checked) => onOptionsChange('profanity_filter', checked === true)}
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
                      <p>Removes or masks profane words and expressions in the transcript.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="paragraphs" 
                    onCheckedChange={(checked) => onOptionsChange('paragraphs', checked === true)}
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
                      <p>Splits audio into paragraphs to improve transcript readability. When enabled, punctuation will also be turned on.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="utterances" 
                    onCheckedChange={(checked) => onOptionsChange('utterances', checked === true)}
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
                      <p>Segments speech into meaningful semantic units. By default, creates a new utterance after 0.8s of silence.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filler_words" 
                    onCheckedChange={(checked) => onOptionsChange('filler_words', checked === true)}
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
                      <p>Transcribes disfluencies in your audio, like "uh" and "um".</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ai-features">
          <AccordionTrigger className="text-base font-medium">
            AI Features
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="summarize" 
                    onCheckedChange={(checked) => onOptionsChange('summarize', checked === true)}
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
                      <p>Automatically generates summaries for sections of content.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="topics" 
                    onCheckedChange={(checked) => onOptionsChange('topics', checked === true)}
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
                    onCheckedChange={(checked) => onOptionsChange('intents', checked === true)}
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
                      <p>Recognizes the intentions behind spoken phrases.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="detect_entities" 
                    onCheckedChange={(checked) => onOptionsChange('detect_entities', checked === true)}
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
                      <p>Identifies and extracts key entities from the spoken content.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sentiment" 
                    onCheckedChange={(checked) => onOptionsChange('sentiment', checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="sentiment">Sentiment Analysis</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Identifies sentiment (positive, neutral, or negative) and provides a sentiment score at word, sentence, paragraph, and segment levels.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="model">
          <AccordionTrigger className="text-base font-medium">
            Model Selection
          </AccordionTrigger>
          <AccordionContent>
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="text-xs text-slate-500 pt-2">
        <p>These options control how Deepgram processes your audio during transcription.</p>
        <p>Hover over the help icons for more information about each option.</p>
      </div>
    </div>
  );
};
