
// Define shared types for API request/response handling

export interface TranscriptionConfig {
  encoding: string;
  sampleRateHertz?: number;
  languageCode: string;
  enableAutomaticPunctuation: boolean;
  model: string;
  useEnhanced: boolean;
  diarizationConfig?: {
    enableSpeakerDiarization: boolean;
    minSpeakerCount: number;
    maxSpeakerCount: number;
  };
  enableWordTimeOffsets?: boolean;
  enableWordConfidence?: boolean;
  speechContexts?: {
    phrases: string[];
    boost: number;
  }[];
  // Added fields for audio quality improvement
  audioChannelCount?: number;
  enableSeparateRecognitionPerChannel?: boolean;
  profanityFilter?: boolean;
  adaptation?: {
    phraseSets?: Array<{
      phrases: string[];
      boost: number;
    }>;
  };
}

export interface TranscriptionOptions {
  encoding: string;
  sampleRateHertz?: number;
  languageCode?: string;
  enableAutomaticPunctuation?: boolean;
  model?: string;
  useEnhanced?: boolean;
  enableSpeakerDiarization?: boolean;
  minSpeakerCount?: number;
  maxSpeakerCount?: number;
  enableWordTimeOffsets?: boolean;
  enableWordConfidence?: boolean;
  customTerms?: string[];
  // Added fields for audio quality handling
  audioChannelCount?: number;
  enableSeparateRecognitionPerChannel?: boolean;
  profanityFilter?: boolean;
  [key: string]: any; // Allow for additional properties
}
