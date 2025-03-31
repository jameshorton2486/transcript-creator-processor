
// Re-export audio utilities
// Note: Only exporting the ones that actually exist in the audio module
export {
  validateAudioFile as validateDeepgramAudioFile
} from './deepgram/deepgramService';

// Re-export Deepgram configuration constants
export {
  SUPPORTED_MIME_TYPES,
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE
} from './deepgram/deepgramConfig';

// Re-export utility functions
export { createQueryParams } from './deepgram/deepgramConfig';
