
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
  const [showApiInput, setShowApiInput] = useState<boolean>(false);
  const { toast } = useToast();

  const reviewTranscript = async () => {
    if (!transcript) {
      toast({
        title: "No transcript available",
        description: "Please create a transcript first.",
        variant: "destructive",
      });
      return;
    }

    if (showApiInput && !apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key to use the AI review feature.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // In a real application, this would call OpenAI API
      // For now, we'll simulate the AI review with a timeout and mock improvements
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock AI improvements to the transcript
      let reviewedText = transcript;
      
      // Simple mock improvements for demonstration purposes
      reviewedText = reviewedText
        .replace(/Speaker 1:/g, "THE COURT:")
        .replace(/Speaker 2:/g, "PLAINTIFF'S COUNSEL:")
        .replace(/Speaker 3:/g, "DEFENDANT'S COUNSEL:")
        .replace(/Speaker 4:/g, "WITNESS:")
        .replace(/Speaker 5:/g, "COURT REPORTER:")
        .replace(/\b(\w+) vs\. (\w+)/g, "$1 v. $2")
        .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, "January $1, $3")
        .replace(/\b(\d{1,2}):(\d{1,2})\b/g, "$1:$2 o'clock")
        .replace(/gonna/g, "going to")
        .replace(/wanna/g, "want to")
        .replace(/kinda/g, "kind of")
        .replace(/sorta/g, "sort of")
        .replace(/cuz/g, "because")
        .replace(/\bur\b/g, "your")
        .replace(/today's date is (\w+), (\d{1,2})th (\d{4})/gi, "Today's date is $1 $2, $3")
        .replace(/(\d+) CI to (\d+)/gi, "$1-CI-$2");
      
      // Add some paragraph breaks for readability
      reviewedText = reviewedText.replace(/(\.\s*)([A-Z][a-z])/g, "$1\n\n$2");
      
      onReviewComplete(reviewedText);
      
      toast({
        title: "AI Review Complete",
        description: "The transcript has been reviewed and improved by AI.",
      });
    } catch (error) {
      console.error("AI review error:", error);
      toast({
        title: "Review failed",
        description: "There was an error reviewing your transcript with AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle>AI Transcript Review</CardTitle>
        <CardDescription>Use AI to enhance and correct the transcript</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showApiInput && (
          <div className="space-y-2">
            <Textarea
              placeholder="Enter your OpenAI API key here"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full text-sm"
            />
            <p className="text-xs text-slate-500">
              Your API key is only used for this session and is not stored.
            </p>
          </div>
        )}
        
        <Button 
          className="w-full" 
          onClick={() => {
            if (!showApiInput && !apiKey) {
              setShowApiInput(true);
            } else {
              reviewTranscript();
            }
          }}
          disabled={isLoading || !transcript}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reviewing with AI...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Review Transcript with AI
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
