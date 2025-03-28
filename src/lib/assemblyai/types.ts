
/**
 * Type definitions for AssemblyAI API integration
 */

export interface AssemblyAITranscriptionOptions {
  language?: string;
  speakerLabels?: boolean;
  punctuate?: boolean;
  formatText?: boolean;
  model?: 'default' | 'standard' | 'enhanced' | 'nova2';
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

export interface AssemblyAITranscriptionResponse {
  id: string;
  status: string;
  text: string;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker?: string;
  }>;
  utterances?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker: string;
  }>;
  audio_url?: string;
  error?: string;
}

export interface AssemblyAITranscriptionRequest {
  audio_url: string;
  language_code?: string;
  speaker_labels?: boolean;
  punctuate?: boolean;
  format_text?: boolean;
  model?: string;
}

/**
 * Additional types exported for broader application use
 */
export interface SpeakerSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface FormattedTranscript {
  plainText: string;
  speakerSegments?: SpeakerSegment[];
  wordTimestamps?: Array<{
    word: string;
    start: number;
    end: number;
    speaker?: string;
  }>;
}

export interface TranscriptionResult {
  transcript: string;
  formattedResult?: FormattedTranscript;
  rawResponse: AssemblyAITranscriptionResponse;
}
