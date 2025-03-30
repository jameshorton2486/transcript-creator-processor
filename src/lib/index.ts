
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

// Export Deepgram utilities
export * from './deepgram';

// Export the Deepgram API validator
export * from './audio/deepgramApiValidator';

// Export Deepgram auth service with renamed clearApiKey function
import { 
  validateApiKey,
  mockValidateApiKey,
  getSavedApiKey,
  saveApiKey,
  clearApiKey as clearDeepgramAuthApiKey 
} from './deepgram/authService';

export {
  validateApiKey,
  mockValidateApiKey,
  getSavedApiKey,
  saveApiKey,
  clearDeepgramAuthApiKey
};
