
/**
 * Type definitions for the Deepgram transcription hook
 */
import { 
  TranscriptionResult, 
  DeepgramWord, 
  DeepgramParagraph, 
  DeepgramUtterance, 
  DeepgramAPIResponse,
  DeepgramRequestOptions
} from '@/lib/deepgram/types';

// Re-export the core types for backwards compatibility
export type {
  DeepgramRequestOptions,
  DeepgramWord,
  DeepgramParagraph,
  DeepgramUtterance,
  DeepgramAPIResponse,
  TranscriptionResult
};

/**
 * Options for Deepgram transcription
 */
export interface DeepgramTranscriptionOptions {
  language?: string;
  model?: string;
  diarize?: boolean;
  punctuate?: boolean;
  smart_format?: boolean;
  utterances?: boolean;
  numSpeakers?: number;
  keywords?: string[];
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
  apiKey?: string;
}

/**
 * State for the Deepgram transcription hook
 */
export interface DeepgramTranscriptionHookState {
  file: File | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  apiKey: string;
  keyStatus: 'untested' | 'valid' | 'invalid';
  testingKey: boolean;
  keyErrorMessage?: string;
  estimatedTimeRemaining?: string;
  result?: TranscriptionResult | null;
}

/**
 * Return type for useDeepgramTranscription hook
 */
export interface UseDeepgramTranscriptionReturn extends DeepgramTranscriptionHookState {
  handleFileSelected: (file: File) => void;
  transcribeAudioFile: () => Promise<TranscriptionResult | undefined>;
  setApiKey: (key: string) => void;
  cancelTranscription: () => void;
  handleTestApiKey: (keyToTest?: string) => Promise<boolean>;
  setOptions: (options: Partial<DeepgramTranscriptionOptions>) => void;
}

/**
 * API key validation result
 */
export interface ApiKeyValidationResult {
  isValid: boolean;
  message: string;
  statusCode?: number;
  skipApiValidation?: boolean;
}
