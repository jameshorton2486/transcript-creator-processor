
/**
 * Default transcription options for AssemblyAI
 */
export const DEFAULT_TRANSCRIPTION_OPTIONS = {
  language: 'en',
  speakerLabels: true,
  punctuate: true,
  formatText: true,
  model: 'default' as "default" | "standard" | "enhanced" | "nova2"
};

export interface TranscriptionOptions {
  language?: string;
  speakerLabels?: boolean;
  punctuate?: boolean;
  formatText?: boolean;
  model?: "default" | "standard" | "enhanced" | "nova2";
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
