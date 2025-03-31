
/**
 * Type definitions for Deepgram API integration
 */

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
}

export interface DeepgramParagraph {
  start: number;
  end: number;
  text: string;
}

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

export interface SpeakerSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface FormattedTranscript {
  plainText: string;
  wordTimestamps?: {
    word: string;
    start: number;
    end: number;
    speaker?: string;
  }[];
  speakerSegments?: SpeakerSegment[];
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
  text?: string;
  formattedResult?: FormattedTranscript | string;
  rawResponse?: DeepgramAPIResponse;
  paragraphs?: DeepgramParagraph[];
  utterances?: DeepgramUtterance[];
  language?: string;
  duration?: number;
}

export interface TranscriptionJobStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created: string;
  completed?: string;
  error?: string;
}

export interface DeepgramRequestOptions {
  language?: string;
  model?: 'nova' | 'enhanced' | 'base';
  detect_language?: boolean;
  punctuate?: boolean;
  profanity_filter?: boolean;
  redact?: string[];
  diarize?: boolean;
  multi_channel?: boolean;
  alternatives?: number;
  numerals?: boolean;
  smart_format?: boolean;
  search?: string[];
  keywords?: string[];
  tag?: string;
  version?: string;
}
