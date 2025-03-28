/**
 * Default transcription options for Google Speech API
 */
export const DEFAULT_TRANSCRIPTION_OPTIONS = {
  languageCode: 'en-US',
  enableAutomaticPunctuation: true,
  enableSpeakerDiarization: false,
  diarizationSpeakerCount: 2,
  model: 'default',
  maxAlternatives: 1,
  enableWordTimeOffsets: true,
  profanityFilter: false,
  sampleRateHertz: 16000,
  diarize: false,
  paragraphs: true,
  formatParagraphs: true,
  formatNames: false,
  customTerms: [],
  enhancedModel: false,
  speakerCount: 2
};

export interface TranscriptionOptions {
  languageCode: string;
  enableAutomaticPunctuation: boolean;
  enableSpeakerDiarization: boolean;
  diarizationSpeakerCount: number;
  model: string;
  maxAlternatives: number;
  enableWordTimeOffsets: boolean;
  profanityFilter: boolean;
  sampleRateHertz: number;
  diarize: boolean;
  paragraphs: boolean;
  formatParagraphs: boolean;
  formatNames: boolean;
  customTerms: string[];
  enhancedModel: boolean;
  speakerCount: number;
}
