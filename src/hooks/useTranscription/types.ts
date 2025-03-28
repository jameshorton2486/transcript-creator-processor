
export interface TranscriptionHookState {
  file: File | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  isBatchProcessing: boolean;
  apiKey: string;
  documentFiles: File[];
}

export interface UseTranscriptionReturn extends TranscriptionHookState {
  options: {
    punctuate: boolean;
    speakerLabels: boolean;
    formatText: boolean;
    model?: string;
  };
  customTerms: string[];
  handleFileSelected: (file: File) => void;
  transcribeAudioFile: () => Promise<void>;
  setOptions: (options: any) => void;
  setApiKey: (apiKey: string) => void;
  setError: (error: string | null) => void;
  setCustomTerms: (terms: string[]) => void;
  handleDocumentFilesChange: (files: File[]) => void;
}
