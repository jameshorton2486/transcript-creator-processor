
/**
 * Type definitions for the AssemblyAI transcription hook
 */

// Hook state shape
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

// Options for transcription
export interface AssemblyAITranscriptionOptions {
  language?: string;
  speakerLabels?: boolean;
  punctuate?: boolean;
  formatText?: boolean;
  model?: "default" | "standard" | "enhanced" | "nova2";
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

// Response from AssemblyAI API
export interface AssemblyAITranscriptionResponse {
  id: string;
  status: string;
  text: string;
  words?: WordTimestamp[];
  utterances?: SpeakerUtterance[];
  audio_url?: string;
  error?: string;
}

export interface WordTimestamp {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

export interface SpeakerUtterance {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker: string;
}

// For internal formatting
export interface FormattedTranscript {
  plainText: string;
  speakerSegments?: SpeakerSegment[];
  wordTimestamps?: {
    word: string;
    start: number;
    end: number;
    speaker?: string;
  }[];
}

// Final structure returned by formatter
export interface TranscriptionResult {
  transcript: string;
  text?: string; // for compatibility with hook
  formattedResult?: FormattedTranscript;
  rawResponse: AssemblyAITranscriptionResponse;
}

// Speaker segment block
export interface SpeakerSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

// Hook return structure
export interface UseAssemblyAITranscriptionReturn extends AssemblyAITranscriptionHookState {
  handleFileSelected: (file: File) => void;
  transcribeAudioFile: () => Promise<void>;
  setApiKey: (key: string) => void;
  cancelTranscription: () => void;
  handleTestApiKey: () => Promise<void>;
  setOptions: (options: Partial<AssemblyAITranscriptionOptions>) => void;
}
