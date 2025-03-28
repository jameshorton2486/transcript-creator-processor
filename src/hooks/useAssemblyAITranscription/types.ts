
/**
 * Type definitions for the AssemblyAI transcription hook
 */

export interface AssemblyAITranscriptionHookState {
  file: File | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  apiKey: string;
  keyStatus: "untested" | "valid" | "invalid";
  testingKey: boolean;
  estimatedTimeRemaining?: string;
}

export interface AssemblyAITranscriptionOptions {
  language?: string;
  speakerLabels?: boolean;
  punctuate?: boolean;
  formatText?: boolean;
  model?: 'default' | 'standard' | 'enhanced' | 'nova2';
}

export interface TranscriptionResult {
  text: string;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    speaker?: string;
  }>;
  utterances?: Array<{
    speaker: string;
    text: string;
    start: number;
    end: number;
  }>;
  id?: string;
  status?: string;
}

export interface UseAssemblyAITranscriptionReturn extends AssemblyAITranscriptionHookState {
  handleFileSelected: (selectedFile: File) => void;
  transcribeAudioFile: () => Promise<void>;
  setApiKey: (apiKey: string) => void;
  cancelTranscription: () => void;
  handleTestApiKey: () => Promise<void>;
  setOptions: (options: Partial<AssemblyAITranscriptionOptions>) => void;
}
