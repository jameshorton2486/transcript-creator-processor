
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
}

export interface UseAssemblyAITranscriptionReturn extends AssemblyAITranscriptionHookState {
  handleFileSelected: (selectedFile: File) => void;
  transcribeAudioFile: () => Promise<void>;
  setApiKey: (apiKey: string) => void;
  cancelTranscription: () => void;
  handleTestApiKey: () => Promise<void>;
}
