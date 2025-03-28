
/**
 * Default transcription options for AssemblyAI
 */
export const DEFAULT_TRANSCRIPTION_OPTIONS = {
  language: 'en',
  speakerLabels: true,
  punctuate: true,
  formatText: true,
  model: 'default'
};

export interface TranscriptionOptions {
  language?: string;
  speakerLabels?: boolean;
  punctuate?: boolean;
  formatText?: boolean;
  model?: string;
  customTerms?: string[];
}

/**
 * Application information
 */
export const APP_INFO = {
  name: "Audio Transcription Tool",
  version: "1.0.0",
  description: "Transcribe audio files using AssemblyAI"
};
