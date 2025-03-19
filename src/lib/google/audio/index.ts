
/**
 * Export all audio encoding and processing utilities
 */

export * from './formatDetection';
export * from './fileChunker';
export * from './flacHandler';
export * from './wavConverter';

// Import from the central audio lib to maintain consistency
import { arrayBufferToBase64, directBufferToBase64 } from '@/lib/audio/base64Converter';
export { arrayBufferToBase64, directBufferToBase64 };
