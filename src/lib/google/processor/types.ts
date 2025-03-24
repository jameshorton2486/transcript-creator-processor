
/**
 * Google Speech-to-Text API Request Types
 */

export interface TranscriptionOptions {
  encoding?: string;
  sampleRateHertz?: number;
  languageCode?: string;
  enableAutomaticPunctuation?: boolean;
  model?: string;
  useEnhanced?: boolean;
  enableWordTimeOffsets?: boolean;
  diarize?: boolean;
  maxSpeakerCount?: number;
}

export interface TranscriptionConfig extends TranscriptionOptions {
  useEnhanced: boolean;
}

export interface TranscriptionResult {
  results: Array<{
    alternatives: Array<{
      transcript: string;
      confidence: number;
      words?: Array<{
        word: string;
        startTime: string;
        endTime: string;
        speakerTag?: number;
      }>;
    }>;
    languageCode?: string;
    resultEndTime?: string;
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}
