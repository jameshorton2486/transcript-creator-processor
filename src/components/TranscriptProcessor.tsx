import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Wand2 } from "lucide-react";
import { processTranscript } from "@/lib/transcriptProcessor";
import { useToast } from "@/components/ui/use-toast";

interface TranscriptProcessorProps {
  transcript: string;
  onProcessed: (processedText: string) => void;
}

export const TranscriptProcessor = ({
  transcript,
  onProcessed,
}: TranscriptProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [correctPunctuation, setCorrectPunctuation] = useState(true);
  const [extractEntities, setExtractEntities] = useState(false);
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [formatSpeakers, setFormatSpeakers] = useState(true);
  const [identifyParties, setIdentifyParties] = useState(true);
  const [cleanFillers, setCleanFillers] = useState(true);
  const [useAI, setUseAI] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const handleProcessTranscript = async () => {
    setIsProcessing(true);
    try {
      // Create a dummy file for processing
      const file = new File([transcript], "transcript.txt", {
        type: "text/plain",
      });

      const result = await processTranscript(file, {
        correctPunctuation,
        extractEntities,
        preserveFormatting,
        useAI,
        apiKey,
        formatSpeakers,
        identifyParties,
        cleanFillers
      });

      onProcessed(result.correctedText);
      toast({
        title: "Transcript processed",
        description: "The transcript has been successfully processed.",
      });
    } catch (error: any) {
      console.error("Error processing transcript:", error);
      toast({
        variant: "destructive",
        title: "Processing failed",
        description:
          error.message || "Failed to process the transcript. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Label htmlFor="correct-punctuation">Correct Punctuation</Label>
        <Switch
          id="correct-punctuation"
          checked={correctPunctuation}
          onCheckedChange={setCorrectPunctuation}
          disabled={isProcessing}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Label htmlFor="extract-entities">Extract Entities</Label>
        <Switch
          id="extract-entities"
          checked={extractEntities}
          onCheckedChange={setExtractEntities}
          disabled={isProcessing}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Label htmlFor="preserve-formatting">Preserve Formatting</Label>
        <Switch
          id="preserve-formatting"
          checked={preserveFormatting}
          onCheckedChange={setPreserveFormatting}
          disabled={isProcessing}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="format-speakers">Format Speakers</Label>
        <Switch
          id="format-speakers"
          checked={formatSpeakers}
          onCheckedChange={setFormatSpeakers}
          disabled={isProcessing}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="identify-parties">Identify Parties</Label>
        <Switch
          id="identify-parties"
          checked={identifyParties}
          onCheckedChange={setIdentifyParties}
          disabled={isProcessing}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="clean-fillers">Clean Fillers</Label>
        <Switch
          id="clean-fillers"
          checked={cleanFillers}
          onCheckedChange={setCleanFillers}
          disabled={isProcessing}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="use-ai">Use AI (OpenAI)</Label>
        <Switch
          id="use-ai"
          checked={useAI}
          onCheckedChange={setUseAI}
          disabled={isProcessing}
        />
      </div>

      {useAI && (
        <div className="space-y-2">
          <Label htmlFor="api-key">OpenAI API Key</Label>
          <input
            type="password"
            id="api-key"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter your OpenAI API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isProcessing}
          />
        </div>
      )}

      <Button
        onClick={handleProcessTranscript}
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Wand2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Process Transcript
          </>
        )}
      </Button>
    </div>
  );
};
