
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
}
