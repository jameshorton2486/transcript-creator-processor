
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { validateDeepgramApiKey } from "@/lib/audio/deepgramKeyValidator";

export interface DeepgramOptions {
  model?: string;
  language?: string;
  punctuate?: boolean;
  diarize?: boolean;
}

export interface DeepgramResponse {
  transcript: string;
  words?: any[];
  confidence?: number;
}

export interface UseDeepgramTranscriptionProps {
  apiKey?: string;
  onComplete?: (result: DeepgramResponse) => void;
}

export interface UseDeepgramTranscriptionReturn {
  transcribe: (audioFile: File, options?: DeepgramOptions) => Promise<DeepgramResponse>;
  isTranscribing: boolean;
  transcriptionError: Error | null;
  progressPercent: number;
  validateApiKey: (apiKey: string) => Promise<{isValid: boolean, message: string}>;
  getStoredApiKey: () => string;
  storeApiKey: (apiKey: string) => void;
}

// Function to handle API key validation
export const useDeepgramService = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<Error | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const { toast } = useToast();

  // Local storage key for the API key
  const API_KEY_STORAGE_KEY = "deepgramApiKey";

  // Get API key from local storage
  const getStoredApiKey = useCallback(() => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
  }, []);

  // Store API key in local storage
  const storeApiKey = useCallback((apiKey: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  }, []);

  // Validate API key against Deepgram API
  const validateApiKey = useCallback(async (apiKey: string) => {
    try {
      const result = await validateDeepgramApiKey(apiKey);
      return result;
    } catch (error) {
      console.error("Error validating API key:", error);
      return { 
        isValid: false, 
        message: error instanceof Error ? error.message : "Unknown error validating API key" 
      };
    }
  }, []);

  // Transcribe audio with deepgram
  const transcribe = useCallback(
    async (audioFile: File, options: DeepgramOptions = {}): Promise<DeepgramResponse> => {
      if (!audioFile) {
        throw new Error("No audio file provided");
      }

      const apiKey = getStoredApiKey();
      if (!apiKey) {
        throw new Error("No API key provided");
      }

      setIsTranscribing(true);
      setTranscriptionError(null);
      setProgressPercent(0);

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgressPercent((prev) => {
            const newValue = prev + Math.random() * 10;
            return newValue > 90 ? 90 : newValue;
          });
        }, 300);

        // Here you would actually call the Deepgram API
        // This is a mock implementation
        const response: DeepgramResponse = {
          transcript: "This is a mock transcription response.",
          words: [],
          confidence: 0.95,
        };

        clearInterval(progressInterval);
        setProgressPercent(100);
        
        return response;
      } catch (error) {
        console.error("Transcription error:", error);
        setTranscriptionError(error instanceof Error ? error : new Error("Unknown error"));
        throw error;
      } finally {
        setIsTranscribing(false);
      }
    },
    [getStoredApiKey]
  );

  return {
    transcribe,
    isTranscribing,
    transcriptionError,
    progressPercent,
    validateApiKey,
    getStoredApiKey,
    storeApiKey,
  };
};
