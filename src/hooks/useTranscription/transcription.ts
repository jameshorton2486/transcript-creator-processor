
// This file is kept for backward compatibility but is disabled
// All transcription is now handled through Deepgram directly

import { useToast } from "@/components/ui/use-toast";

export const performTranscription = async (
  file: File | null,
  apiKey: string,
  options: any = {},
  customTerms: string[] = [],
  onProgressUpdate: (progress: number) => void,
  onLoadingUpdate: (isLoading: boolean) => void,
  onBatchProcessingUpdate: (isBatchProcessing: boolean) => void,
  onErrorUpdate: (error: string | null) => void,
  onSuccess: (transcript: string, jsonData: any) => void,
  toast: ReturnType<typeof useToast>["toast"]
) => {
  onErrorUpdate("Google Speech-to-Text has been removed. Please use Deepgram transcription instead.");
  toast({
    title: "Service Removed",
    description: "Google Speech-to-Text has been removed. Please use Deepgram transcription instead.",
    variant: "destructive",
  });
  
  onLoadingUpdate(false);
  onBatchProcessingUpdate(false);
  onProgressUpdate(0);
};
