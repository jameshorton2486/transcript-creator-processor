
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { reviewWithOpenAI, TrainingRule, TrainingExample } from '@/lib/nlp/openAIReviewService';

export interface AITranscriptReviewOptions {
  rules?: TrainingRule[];
  examples?: TrainingExample[];
}

export interface AITranscriptReviewResult {
  reviewedTranscript: string | null;
  originalTranscript: string | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export interface UseAITranscriptReviewReturn extends AITranscriptReviewResult {
  reviewTranscript: (transcript: string, apiKey: string) => Promise<string>;
  reset: () => void;
}

/**
 * Hook for AI-powered transcript review using OpenAI
 * 
 * @param options Configuration options including custom rules and examples
 * @returns Object with review function, state, and utilities
 */
export function useAITranscriptReview(options: AITranscriptReviewOptions = {}): UseAITranscriptReviewReturn {
  const [reviewedTranscript, setReviewedTranscript] = useState<string | null>(null);
  const [originalTranscript, setOriginalTranscript] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const { toast } = useToast();

  // Default rules and examples
  const defaultRules: TrainingRule[] = [
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

  const defaultExamples: TrainingExample[] = [
    {
      id: "1",
      incorrect: "speaker 1: Yeah, um, I was thinking that, like, we should probably, you know, review the contract.",
      corrected: "SPEAKER 1: I was thinking that we should review the contract.",
      createdAt: Date.now()
    }
  ];

  // Use provided rules/examples or fallback to defaults
  const rules = options.rules || defaultRules;
  const examples = options.examples || defaultExamples;

  /**
   * Reset the state of the review hook
   */
  const reset = useCallback(() => {
    setReviewedTranscript(null);
    setOriginalTranscript(null);
    setIsLoading(false);
    setError(null);
    setProgress(0);
  }, []);

  /**
   * Process a transcript with OpenAI
   * 
   * @param transcript The transcript text to review
   * @param apiKey OpenAI API key
   * @returns The reviewed transcript
   */
  const reviewTranscript = useCallback(async (transcript: string, apiKey: string): Promise<string> => {
    if (!transcript || transcript.trim().length === 0) {
      const errorMsg = "No transcript to review. Please create or upload a transcript first.";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      throw new Error(errorMsg);
    }

    if (!apiKey) {
      const errorMsg = "OpenAI API key is required to review the transcript.";
      setError(errorMsg);
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive"
      });
      throw new Error(errorMsg);
    }

    try {
      setIsLoading(true);
      setError(null);
      setProgress(10);
      setOriginalTranscript(transcript);
      
      console.log("Starting OpenAI review process");
      setProgress(30);
      
      // Simulate progress while OpenAI processes (not actual progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);
      
      const result = await reviewWithOpenAI(transcript, rules, examples, apiKey);
      clearInterval(progressInterval);
      
      if (!result || result.trim().length === 0) {
        throw new Error("Review resulted in empty transcript.");
      }
      
      setReviewedTranscript(result);
      setProgress(100);
      
      toast({
        title: "Transcript Review Complete",
        description: "Your transcript has been reviewed and enhanced."
      });
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to review transcript";
      setError(errorMsg);
      toast({
        title: "Review Failed",
        description: errorMsg,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [rules, examples, toast]);

  return {
    reviewTranscript,
    reviewedTranscript,
    originalTranscript,
    isLoading,
    error,
    progress,
    reset
  };
}
