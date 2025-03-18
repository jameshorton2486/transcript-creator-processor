
// Main Google transcription service
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { transcribeSingleFile } from './singleFileProcessor';
import { transcribeBatchedAudio } from './batchProcessor';
import { extractTranscriptText } from './responseFormatter';
import { testApiKey } from './apiTester';

/**
 * Main transcription function that handles both small and large files
 */
export const transcribeAudio = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void,
  customTerms: string[] = []
) => {
  try {
    // Considering base64 encoding increases size by ~33%, adjust threshold 
    // to account for the base64 expansion
    const BASE64_EXPANSION_FACTOR = 1.33; // base64 encoding increases size by ~33%
    const GOOGLE_API_LIMIT = 10 * 1024 * 1024; // 10MB
    const EFFECTIVE_THRESHOLD = GOOGLE_API_LIMIT / BASE64_EXPANSION_FACTOR; // ~7.5MB
    
    // If file is larger than our safe threshold, use batch processing
    const isLargeFile = file.size > EFFECTIVE_THRESHOLD;
    
    // Log what we're doing
    console.log(`Transcribing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) with Google Speech-to-Text`);
    console.log(`File size after base64 encoding (estimated): ~${((file.size * BASE64_EXPANSION_FACTOR) / 1024 / 1024).toFixed(2)} MB`);
    console.log('Options:', options);
    
    if (customTerms && customTerms.length > 0) {
      console.log(`Using ${customTerms.length} custom terms for speech adaptation: ${customTerms.slice(0, 5).join(', ')}${customTerms.length > 5 ? '...' : ''}`);
    }
    
    if (!isLargeFile) {
      // For smaller files, use the single file processor
      console.log(`Using single file processor (file size under threshold: ${(EFFECTIVE_THRESHOLD / 1024 / 1024).toFixed(2)} MB)`);
      return await transcribeSingleFile(file, apiKey, options, customTerms);
    } else {
      // For large files, use batch processing
      console.log(`Using batch processing for large file (exceeds threshold: ${(EFFECTIVE_THRESHOLD / 1024 / 1024).toFixed(2)} MB)`);
      return await transcribeBatchedAudio(file, apiKey, options, onProgress, customTerms);
    }
  } catch (error) {
    console.error('Google transcription error:', error);
    throw error;
  }
};

// Re-export these functions for backward compatibility
export { testApiKey, extractTranscriptText };
