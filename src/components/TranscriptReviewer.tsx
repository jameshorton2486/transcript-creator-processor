
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReviewApiKeyInput } from "@/components/review/ApiKeyInput";
import { ReviewOptions } from "@/components/review/ReviewOptions";
import { applyMockReviewRules, applyMockExamples, applyStandardImprovements } from "@/utils/transcriptReviewUtils";

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
  const [rules, setRules] = useState<any[]>([]);
  const [examples, setExamples] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved rules and examples from localStorage
    const savedRules = localStorage.getItem("transcriptRules");
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    }
    
    const savedExamples = localStorage.getItem("transcriptExamples");
    if (savedExamples) {
      setExamples(JSON.parse(savedExamples));
    }
  }, []);

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
      
      // Start with the original transcript
      let reviewedText = transcript;
      
      // Apply custom rules
      if (rules.length > 0) {
        toast({
          title: "Applying custom rules",
          description: `Applying ${rules.length} custom rules to transcript...`,
        });
        
        reviewedText = applyMockReviewRules(reviewedText, rules);
      }
      
      // Apply learning from examples
      if (examples.length > 0) {
        toast({
          title: "Applying learned patterns",
          description: `Applying patterns from ${examples.length} training examples...`,
        });
        
        reviewedText = applyMockExamples(reviewedText, examples);
      }
      
      // Apply standard improvements
      reviewedText = applyStandardImprovements(reviewedText);
      
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
        <CardDescription>
          Use AI to enhance and correct the transcript 
          {(rules.length > 0 || examples.length > 0) && (
            <span className="text-green-600 font-medium">
              {" "}• Using {rules.length} rules & {examples.length} examples
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ReviewApiKeyInput 
          apiKey={apiKey}
          setApiKey={setApiKey}
          visible={showApiInput}
        />
        
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
              {(rules.length > 0 || examples.length > 0) && ` (${rules.length + examples.length} rules/examples)`}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
