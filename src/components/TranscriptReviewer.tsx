
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ReviewApiKeyInput } from "@/components/review/ApiKeyInput";
import { ReviewOptions } from "@/components/review/ReviewOptions";
import { 
  reviewWithOpenAI, 
  TrainingRule, 
  TrainingExample 
} from "@/lib/nlp/openAIReviewService";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [rules, setRules] = useState<TrainingRule[]>([]);
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [useExamples, setUseExamples] = useState<boolean>(true);
  const [useRules, setUseRules] = useState<boolean>(true);
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
    
    // Load saved API key from sessionStorage (not localStorage for security)
    const savedApiKey = sessionStorage.getItem("openai_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
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
      // Save API key to sessionStorage (not localStorage for security)
      if (apiKey) {
        sessionStorage.setItem("openai_api_key", apiKey);
      }
      
      // Filter rules and examples based on user selection
      const activeRules = useRules ? rules : [];
      const activeExamples = useExamples ? examples : [];
      
      // Show toast with appropriate message based on what's being used
      let toastDescription = "Processing transcript";
      if (activeRules.length > 0 || activeExamples.length > 0) {
        toastDescription += " with";
        if (activeRules.length > 0) {
          toastDescription += ` ${activeRules.length} rules`;
        }
        if (activeRules.length > 0 && activeExamples.length > 0) {
          toastDescription += " and";
        }
        if (activeExamples.length > 0) {
          toastDescription += ` ${activeExamples.length} examples`;
        }
      }
      
      toast({
        title: "Processing transcript",
        description: toastDescription,
      });
      
      console.log("Starting OpenAI transcript review with:", {
        transcriptLength: transcript?.length,
        rulesCount: activeRules.length,
        examplesCount: activeExamples.length
      });
      
      // Make the actual API call to OpenAI for review
      const reviewedText = await reviewWithOpenAI(transcript, activeRules, activeExamples, apiKey);
      
      if (!reviewedText || reviewedText.trim().length === 0) {
        throw new Error("OpenAI returned an empty response. Please try again.");
      }
      
      onReviewComplete(reviewedText);
      
      toast({
        title: "AI Review Complete",
        description: "The transcript has been reviewed and improved by AI.",
      });
    } catch (error) {
      console.error("AI review error:", error);
      toast({
        title: "Review failed",
        description: typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : "There was an error reviewing your transcript with AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>AI Transcript Review</span>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Review Settings</h4>
                <div className="space-y-2">
                  <ReviewOptions
                    options={[
                      {
                        id: "useRules",
                        label: `Use ${rules.length} saved rules`,
                        checked: useRules,
                        onChange: setUseRules
                      },
                      {
                        id: "useExamples",
                        label: `Learn from ${examples.length} examples`,
                        checked: useExamples,
                        onChange: setUseExamples
                      }
                    ]}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardTitle>
        <CardDescription>
          Use AI to enhance and correct the transcript 
          {(rules.length > 0 || examples.length > 0) && (
            <span className="text-green-600 font-medium">
              {" "}• Using {useRules ? rules.length : 0} rules & {useExamples ? examples.length : 0} examples
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
              {(rules.length > 0 || examples.length > 0) && (
                ` (${(useRules ? rules.length : 0) + (useExamples ? examples.length : 0)} rules/examples)`
              )}
            </>
          )}
        </Button>
      </CardContent>
      
      {(rules.length === 0 && examples.length === 0) && (
        <CardFooter>
          <p className="text-xs text-slate-500 w-full text-center">
            Add custom rules and examples in the Training section for better results
          </p>
        </CardFooter>
      )}
    </Card>
  );
};
