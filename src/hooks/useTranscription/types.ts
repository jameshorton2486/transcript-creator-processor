
import { TranscriptionOptions } from "@/lib/config";

export type TranscriptionHookState = {
  file: File | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  isBatchProcessing: boolean;
  apiKey: string;
  documentFiles: File[];
};

export interface UseTranscriptionProps {
  options: TranscriptionOptions;
  customTerms: string[];
  handleFileSelected: (file: File) => void;
  transcribeAudioFile: () => Promise<void>;
  setOptions: (options: TranscriptionOptions) => void;
  setApiKey: (apiKey: string) => void;
  setError: (error: string | null) => void;
  setCustomTerms: (terms: string[]) => void;
  handleDocumentFilesChange: (files: File[]) => void;
}

export interface UseTranscriptionReturn extends TranscriptionHookState, UseTranscriptionProps {}
