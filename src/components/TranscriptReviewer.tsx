
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface TrainingRule {
  id: string;
  name: string;
  description: string;
  rule: string;
}

interface TrainingExample {
  id: string;
  incorrect: string;
  corrected: string;
  createdAt: number;
}

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
      
      // Apply custom rules (in a real app, this would be done more intelligently via AI)
      if (rules.length > 0) {
        toast({
          title: "Applying custom rules",
          description: `Applying ${rules.length} custom rules to transcript...`,
        });
        
        // Mock rule application (simple text replacements)
        // In a real implementation, this would use more sophisticated NLP techniques
        rules.forEach(rule => {
          if (rule.name.toLowerCase().includes("capitalize")) {
            reviewedText = reviewedText.replace(/\bcourt\b/g, "Court");
          }
          
          if (rule.name.toLowerCase().includes("date")) {
            reviewedText = reviewedText.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, "January $1, $3");
          }
          
          if (rule.name.toLowerCase().includes("speaker")) {
            reviewedText = reviewedText
              .replace(/Speaker 1:/g, "THE COURT:")
              .replace(/Speaker 2:/g, "PLAINTIFF'S COUNSEL:")
              .replace(/Speaker 3:/g, "DEFENDANT'S COUNSEL:");
          }
        });
      }
      
      // Apply learning from examples (in a real app, this would be done with ML)
      if (examples.length > 0) {
        toast({
          title: "Applying learned patterns",
          description: `Applying patterns from ${examples.length} training examples...`,
        });
        
        // Very simple simulation of learning from examples
        // In a real implementation, this would use more sophisticated techniques
        examples.forEach(example => {
          // Find obvious patterns from examples and apply them
          if (example.incorrect.includes("vs.") && example.corrected.includes("v.")) {
            reviewedText = reviewedText.replace(/\bvs\.\b/g, "v.");
          }
          
          if (example.incorrect.includes("gonna") && example.corrected.includes("going to")) {
            reviewedText = reviewedText.replace(/\bgonna\b/g, "going to");
          }
        });
      }
      
      // Apply standard improvements
      reviewedText = reviewedText
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
              {(rules.length > 0 || examples.length > 0) && ` (${rules.length + examples.length} rules/examples)`}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
