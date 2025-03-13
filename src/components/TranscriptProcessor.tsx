
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PUNCTUATION_RULES } from "@/lib/config";
import { ProcessingOptions } from "@/components/ProcessingOptions";

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
      // In a real application, this would call OpenAI API
      // For now, we'll simulate the processing with a timeout
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Sample processed text with corrections
      let processedText = transcript;
      
      if (options.correctPunctuation) {
        // Mock punctuation correction
        processedText = processedText
          .replace(/speaker 1/gi, "Speaker 1")
          .replace(/speaker 2/gi, "Speaker 2")
          .replace(/march 15, 2023/g, "March 15, 2023")
          .replace(/april 30/g, "April 30");
      }
      
      if (options.formatSpeakers) {
        // Mock speaker formatting
        processedText = processedText
          .replace(/Speaker 1:/g, "THE COURT:")
          .replace(/Speaker 2:/g, "PLAINTIFF'S COUNSEL:");
      }
      
      if (options.identifyParties) {
        // Mock party identification
        processedText = processedText
          .replace(/Smith v\. Jones/g, "Smith v. Jones (Case No. 2023-CV-12345)")
          .replace(/section 3\.4/g, "Section 3.4")
          .replace(/contract/g, "Contract");
      }
      
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
        
        <div className="text-xs text-slate-500 mt-2">
          <p>Using {PUNCTUATION_RULES.length} punctuation rules for transcript correction</p>
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
