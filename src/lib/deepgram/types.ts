
/**
 * Type definitions for Deepgram transcription service
 * Compatible with the existing TranscriptionResult type in the project
 */

// API Request Options
export interface DeepgramRequestOptions {
  // Transcription parameters
  language?: string;
  model?: string; // Changed from strict union type to string for more flexibility
  detect_language?: boolean;
  punctuate?: boolean;
  profanity_filter?: boolean;
  redact?: string[];
  diarize?: boolean;
  multi_channel?: boolean;
  alternatives?: number;
  numerals?: boolean;
  smart_format?: boolean;
  
  // Additional parameters for specific use cases
  search?: string[];
  keywords?: string[];
  tag?: string;
  version?: string; // Added for version specification
}

// Word-level data from transcription
export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
}

// Paragraph data from transcription
export interface DeepgramParagraph {
  start: number;
  end: number;
  text: string;
}

// Utterance data for speaker diarization
export interface DeepgramUtterance {
  start: number;
  end: number;
  confidence: number;
  channel: number;
  transcript: string;
  words: DeepgramWord[];
  speaker?: number;
  id?: string;
}

// Main response from the API
export interface DeepgramAPIResponse {
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: DeepgramWord[];
        paragraphs?: {
          paragraphs: DeepgramParagraph[];
        };
      }>;
      detected_language?: string;
      language_confidence?: number;
    }>;
    utterances?: DeepgramUtterance[];
  };
  metadata?: {
    request_id: string;
    transaction_key: string;
    sha256: string;
    created: string;
    duration: number;
    channels: number;
    models: string[];
  };
}

// Speaker segment for formatted results
export interface SpeakerSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

// Formatted transcript with word timings and speaker segments
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

// Compatible with your existing TranscriptionResult type
export interface TranscriptionResult {
  // Original properties
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
  
  // Properties needed for compatibility with your existing code
  text?: string;
  formattedResult?: FormattedTranscript | string;
  rawResponse?: DeepgramAPIResponse;
  
  // Optional additional properties
  paragraphs?: DeepgramParagraph[];
  utterances?: DeepgramUtterance[];
  language?: string;
  duration?: number;
}

// Job status response
export interface TranscriptionJobStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  estimatedTimeRemaining?: string;
}

// Hook state interface
export interface DeepgramTranscriptionHookState {
  isLoading: boolean;
  progress: number;
  result: TranscriptionResult | null;
  file: File | null;
  error: string | null;
  apiKey: string;
  keyStatus: 'untested' | 'valid' | 'invalid';
  testingKey: boolean;
  keyErrorMessage?: string;
  estimatedTimeRemaining?: string;
}
