
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProcessingOptions } from "@/components/ProcessingOptions";
import { processText } from "@/lib/nlp/textProcessor";

interface TranscriptProcessorProps {
  transcript: string;
  onProcessed: (processedText: string) => void;
}

export const TranscriptProcessor = ({ transcript, onProcessed }: TranscriptProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] = useState({
    correctPunctuation: true,
    formatSpeakers: true,
    identifyParties: true,
    extractEntities: true,
    preserveFormatting: true,
    cleanFillers: true, // Added new option for cleaning filler words
  });
  const { toast } = useToast();

  const processTranscript = async () => {
    if (!transcript) {
      toast({
        title: "No transcript available",
        description: "Please create a transcript first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Process text using our NLP pipeline
      const processedText = await processText(transcript, {
        correctPunctuation: options.correctPunctuation,
        formatSpeakers: options.formatSpeakers,
        identifyParties: options.identifyParties,
        extractEntities: options.extractEntities,
        preserveFormatting: options.preserveFormatting,
        cleanFillers: options.cleanFillers,
      });
      
      onProcessed(processedText);
      
      toast({
        title: "Processing complete",
        description: "The transcript has been successfully processed.",
      });
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing failed",
        description: "There was an error processing your transcript. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle>Process Transcript</CardTitle>
        <CardDescription>Apply formatting and corrections to the transcript</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ProcessingOptions 
          options={{
            correctPunctuation: options.correctPunctuation,
            extractEntities: options.extractEntities,
            preserveFormatting: options.preserveFormatting
          }}
          onChange={(newOptions) => {
            setOptions({
              ...options,
              ...newOptions
            });
          }}
        />
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="formatSpeakers" 
            checked={options.formatSpeakers}
            onCheckedChange={(checked) => 
              setOptions({...options, formatSpeakers: checked === true})
            }
          />
          <Label htmlFor="formatSpeakers">Format speaker labels</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="identifyParties" 
            checked={options.identifyParties}
            onCheckedChange={(checked) => 
              setOptions({...options, identifyParties: checked === true})
            }
          />
          <Label htmlFor="identifyParties">Identify parties and legal terms</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="cleanFillers" 
            checked={options.cleanFillers}
            onCheckedChange={(checked) => 
              setOptions({...options, cleanFillers: checked === true})
            }
          />
          <Label htmlFor="cleanFillers">Remove filler words (uh, um, like)</Label>
        </div>
        
        <div className="text-xs text-slate-500 mt-2">
          <p>Using natural language processing for transcript enhancement</p>
        </div>
        
        <Button 
          className="w-full" 
          onClick={processTranscript} 
          disabled={!transcript || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Process Transcript
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
