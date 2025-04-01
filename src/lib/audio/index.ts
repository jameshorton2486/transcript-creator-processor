
// Export all audio utility functions with proper namespacing to avoid conflicts

// Audio buffer utilities
export * from './audioBufferUtils';

// Audio context management
export * from './audioContext';

// Audio conversion and processing
export { resampleAudio, convertToWAV } from './audioResampler';

// Audio splitting for large files
export * from './audioSplitter';

// Audio validation
export * from './audioValidation';

// Base64 conversion utilities
export * from './base64Converter';

// Audio chunk processing
export * from './chunkProcessor';
export * from './chunkingStrategy';

// Deepgram API validators
export { validateDeepgramApiRequest } from './deepgramApiValidator';
export { validateDeepgramApiKey } from './deepgramKeyValidator';

// Format conversion and detection
export * from './formatConversion';
export * from './formatDetection';

// Audio normalization
export * from './normalization';

// Size calculations
export * from './sizeCalculator';

// WAV conversion and encoding
export { 
  convertToWav, 
  createWavFile, 
  saveAsWav 
} from './wavConverter';

export { 
  encodeWav,
  createWavHeader
} from './wavEncoder';

export * from './wavUtils';
