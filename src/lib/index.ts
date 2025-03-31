
// Re-export audio utilities
export {
  isAudioSupported,
  getAudioFromBlob,
  sliceAudioBuffer,
  decodeAudioData,
  convertToWav,
  downloadBlob,
  mergeAudioBuffers
} from './audio';

// Re-export Deepgram services
export {
  formatTranscriptionResponse,
  mockTranscription,
  createDeepgramUrl,
  shouldUseMockResponses
} from './deepgram';

// Re-export utility functions
export { chunk, createQueryParams } from './utils';

// Re-export audio validation (with different name to avoid naming conflicts)
export {
  validateAudioFile as validateDeepgramAudioFile,
  SUPPORTED_MIME_TYPES,
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE
} from './deepgram/deepgramService';
