
// Deepgram API interface definitions

// Remove the circular import statement
// import { DeepgramRequestOptions } from './types';

// Interface for Deepgram API request options
export interface DeepgramRequestOptions {
  language?: string;
  model?: string;
  version?: string;
  punctuate?: boolean;
  diarize?: boolean;
  smart_format?: boolean;
  utterances?: boolean;
  numSpeakers?: number;
  keywords?: string[];
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

// Include a TranscriptionResult interface here for DeepgramServiceTranscriber
export interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  words?: any[];
  metadata?: any;
  speakers?: any[];
  paragraphs?: any[];
  utterances?: any[];
  formattedResult?: FormattedTranscript | string;
  rawResponse?: DeepgramAPIResponse;
  language?: string;
  duration?: number;
}

// Add a DeepgramAPIResponse type to fix import errors
export interface DeepgramAPIResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
        confidence?: number;
        words?: any[];
      }>;
      detected_language?: string;
    }>;
    utterances?: Array<{
      speaker: number;
      transcript: string;
      start: number;
      end: number;
    }>;
  };
  metadata?: any;
  request_id?: string;
  transaction_key?: string;
}

// Add missing word-level types
export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: number;
  punctuated_word?: string;
}

// Add paragraph and utterance types
export interface DeepgramParagraph {
  start: number;
  end: number;
  text: string;
}

export interface DeepgramUtterance {
  speaker: number;
  start: number;
  end: number;
  transcript: string;
  confidence?: number;
}

// Add formatted transcript interfaces
export interface FormattedTranscript {
  plainText: string;
  wordTimestamps: Array<{
    word: string;
    start: number;
    end: number;
    speaker?: string;
  }>;
  speakerSegments: SpeakerSegment[];
}

export interface SpeakerSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}
