
// Default transcription options
export const DEFAULT_TRANSCRIPTION_OPTIONS = {
  punctuate: true,
  diarize: true,
  paragraphs: true,
  formatParagraphs: true,
  formatNames: true,
  removeHesitations: true,
  enableWordTimeOffsets: true,  // Always enable this for better results
};

// Transcription service options
export const TRANSCRIPTION_SERVICES = {
  ASSEMBLYAI: 'assemblyai',
};

// Default transcription service
export const DEFAULT_TRANSCRIPTION_SERVICE = TRANSCRIPTION_SERVICES.ASSEMBLYAI;

// App information
export const APP_INFO = {
  name: 'Audio Transcriber',
  version: '1.0.0',
};

// Punctuation rules for transcript correction
export const PUNCTUATION_RULES = [
  { search: /\bi\b/g, replace: 'I' },
  { search: /(?<=[.!?]\s+)([a-z])/g, replace: (match: string) => match.toUpperCase() },
  { search: /\.\s+([a-z])/g, replace: (match: string, group: string) => '. ' + group.toUpperCase() },
  { search: /\?\s+([a-z])/g, replace: (match: string, group: string) => '? ' + group.toUpperCase() },
  { search: /!\s+([a-z])/g, replace: (match: string, group: string) => '! ' + group.toUpperCase() },
];

// Typescript interface for transcription options
export interface TranscriptionOptions {
  punctuate?: boolean;
  diarize?: boolean;
  paragraphs?: boolean;
  formatParagraphs?: boolean;
  formatNames?: boolean;
  removeHesitations?: boolean;
  customTerms?: string[];
  languageCode?: string;
  encoding?: string;
  sampleRateHertz?: number;
  enableAutomaticPunctuation?: boolean;
  model?: string;
  useEnhanced?: boolean;
  enableSpeakerDiarization?: boolean;
  minSpeakerCount?: number;
  maxSpeakerCount?: number;
  enableWordTimeOffsets?: boolean;
  enableWordConfidence?: boolean;
}
