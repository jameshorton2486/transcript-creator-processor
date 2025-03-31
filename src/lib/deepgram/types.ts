
// Add any missing exports needed by components/hooks
import { DeepgramRequestOptions } from './types';

// Include a TranscriptionResult interface here for DeepgramServiceTranscriber
export interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  words?: any[];
  metadata?: any;
  speakers?: any[];
  paragraphs?: any[];
  utterances?: any[];
}

// Re-export DeepgramRequestOptions for other imports
export { DeepgramRequestOptions };

// Add a DeepgramAPIResponse type to fix import errors
export interface DeepgramAPIResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
        confidence?: number;
        words?: any[];
      }>;
    }>;
  };
  metadata?: any;
}
