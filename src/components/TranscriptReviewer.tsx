
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, EyeOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { reviewWithOpenAI, TrainingRule, TrainingExample } from '@/lib/nlp/openAIReviewService';

interface TranscriptReviewerProps {
  transcript: string;
  onReviewComplete: (reviewedText: string) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const TranscriptReviewer = ({
  transcript,
  onReviewComplete,
  isLoading,
  setIsLoading
}: TranscriptReviewerProps) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const { toast } = useToast();

  // These would typically come from a database or user settings
  const rules: TrainingRule[] = [
    {
      id: "1",
      name: "Speaker Format",
      description: "Format speakers consistently",
      rule: "Format speaker labels consistently as 'SPEAKER 1:', 'SPEAKER 2:', etc. at the start of paragraphs."
    },
    {
      id: "2",
      name: "Remove Fillers",
      description: "Remove filler words",
      rule: "Remove filler words like 'um', 'uh', 'like', etc."
    }
  ];

  const examples: TrainingExample[] = [
    {
      id: "1",
      incorrect: "speaker 1: Yeah, um, I was thinking that, like, we should probably, you know, review the contract.",
      corrected: "SPEAKER 1: I was thinking that we should review the contract.",
      createdAt: Date.now()
    }
  ];

  const handleReviewTranscript = async () => {
    if (!transcript || transcript.trim().length === 0) {
      setError("No transcript to review. Please create or upload a transcript first.");
      toast({
        title: "Error",
        description: "No transcript to review",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey) {
      setError("OpenAI API key is required to review the transcript.");
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive"
      });
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      console.log("Starting OpenAI review process");
      
      const reviewedTranscript = await reviewWithOpenAI(
        transcript, 
        rules, 
        examples, 
        apiKey
      );
      
      console.log("OpenAI review complete:", {
        originalLength: transcript.length,
        reviewedLength: reviewedTranscript.length,
      });
      
      if (!reviewedTranscript || reviewedTranscript.trim().length === 0) {
        throw new Error("Review resulted in empty transcript.");
      }
      
      // Pass the reviewed transcript to the parent component
      onReviewComplete(reviewedTranscript);
      
      toast({
        title: "Transcript Review Complete",
        description: "Your transcript has been reviewed and enhanced."
      });
    } catch (err) {
      console.error("OpenAI review error:", err);
      setError(err instanceof Error ? err.message : "Failed to review transcript");
      toast({
        title: "Review Failed",
        description: err instanceof Error ? err.message : "Failed to review transcript",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <label htmlFor="openai-api-key" className="text-sm font-medium text-slate-700">
            OpenAI API Key
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={toggleApiKeyVisibility}
          >
            <EyeOff className="h-3.5 w-3.5 text-slate-500" />
          </Button>
        </div>
        
        <Input
          id="openai-api-key"
          type={showApiKey ? "text" : "password"}
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        
        <p className="text-xs text-slate-500">
          Your API key is used only for this request and is not stored.
        </p>
      </div>
      
      <div className="flex justify-between items-center">
        <Button
          onClick={handleReviewTranscript}
          disabled={isLoading || !transcript || !apiKey}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Reviewing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Enhance with AI
            </>
          )}
        </Button>
        
        <div className="text-xs text-slate-500">
          Uses rules & examples to improve transcripts
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm">Enhancing transcript with AI...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
