
/**
 * WAV conversion utilities (re-exports from specialized modules)
 */

// Re-export format conversion utilities
export { convertFlacToWav, tryConvertToWav } from './formatConversion';

// Re-export WAV utilities
export { convertToMono, float32ArrayToWav, writeString } from './wavUtils';

// Re-export WAV encoder utilities
export { encodeWavFile } from './wavEncoder';

// Re-export normalization utilities
export { normalizeWavFile } from './normalization';
