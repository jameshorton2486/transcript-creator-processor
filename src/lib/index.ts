
// Main library exports
export * from './config';
export * from './transcriptProcessor';
export * from './nlp/openAIReviewService';

// Export audio utilities but rename the transcribeAudioFile function
// to avoid naming conflicts with the Deepgram implementation
import { transcribeAudioFile as audioTranscribeAudioFile } from './audio';
export { audioTranscribeAudioFile };
export * from './audio/audioValidation';
export * from './audio/wavConverter';
export * from './audio/audioContext';

// Export transcriptionService but rename the transcribeAudioFile function
// to avoid naming conflicts
import { transcribeAudioFile as serviceTranscribeAudioFile } from './audio/transcriptionService';
export { serviceTranscribeAudioFile };
// Note: No other items to export from transcriptionService

// Export Deepgram utilities
export * from './deepgram';
