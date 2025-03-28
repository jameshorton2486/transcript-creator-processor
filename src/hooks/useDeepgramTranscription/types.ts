
/**
 * Type definitions for the Deepgram transcription hook
 */

/**
 * Response structure from Deepgram API
 */
export interface DeepgramTranscriptionResponse {
  results?: {
    channels: Array<{
      alternatives: Array<{
        transcript?: string;
        confidence?: number;
        words?: DeepgramWord[];
      }>;
    }>;
    utterances?: Array<{
      speaker: number;
      transcript: string;
      start: number;
      end: number;
    }>;
  };
  metadata?: {
    request_id: string;
    transaction_key: string;
  };
}

/**
 * Word object from Deepgram API
 */
export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  speaker?: number;
  confidence?: number;
}

/**
 * Formatted transcript structure
 */
export interface FormattedTranscript {
  plainText: string;
  wordTimestamps?: Array<{
    word: string;
    start: number;
    end: number;
    speaker?: string;
  }>;
  speakerSegments?: SpeakerSegment[];
}

/**
 * Speaker segment with timing information
 */
export interface SpeakerSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

/**
 * Final transcription result structure
 */
export interface TranscriptionResult {
  transcript: string;
  text: string;
  formattedResult: FormattedTranscript;
  rawResponse: DeepgramTranscriptionResponse;
}

/**
 * Options for Deepgram transcription
 */
export interface DeepgramTranscriptionOptions {
  language?: string;
  model?: string;
  diarize?: boolean;
  punctuate?: boolean;
  utterances?: boolean;
  numSpeakers?: number;
  keywords?: string[];
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
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
  result?: TranscriptionResult;
}

/**
 * Return type for useDeepgramTranscription hook
 */
export interface UseDeepgramTranscriptionReturn extends DeepgramTranscriptionHookState {
  handleFileSelected: (file: File) => void;
  transcribeAudioFile: () => Promise<void>;
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
}
