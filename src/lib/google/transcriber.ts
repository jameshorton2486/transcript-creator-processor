
// Main Google transcription service
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { transcribeSingleFile } from './singleFileProcessor';
import { transcribeBatchedAudio } from './batchProcessor';
import { extractTranscriptText } from './formatters/responseFormatter';
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
    // Check file type
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    const isAudio = fileType.includes('audio') || 
                   fileName.endsWith('.mp3') || 
                   fileName.endsWith('.wav') || 
                   fileName.endsWith('.flac') || 
                   fileName.endsWith('.m4a') || 
                   fileName.endsWith('.ogg');
    
    if (!isAudio) {
      throw new Error('Unsupported file type. Please upload an audio file.');
    }
    
    // Considering base64 encoding increases size by ~33%, adjust threshold 
    // to account for the base64 expansion
    const BASE64_EXPANSION_FACTOR = 1.33; // base64 encoding increases size by ~33%
    const GOOGLE_API_LIMIT = 10 * 1024 * 1024; // 10MB
    const EFFECTIVE_THRESHOLD = Math.floor(GOOGLE_API_LIMIT / BASE64_EXPANSION_FACTOR); // ~7.5MB
    
    // If file is larger than our safe threshold, ALWAYS use batch processing
    const isLargeFile = file.size > EFFECTIVE_THRESHOLD;
    
    // Log what we're doing
    console.log(`Transcribing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) with Google Speech-to-Text`);
    console.log(`File size after base64 encoding (estimated): ~${((file.size * BASE64_EXPANSION_FACTOR) / 1024 / 1024).toFixed(2)} MB`);
    console.log('Options:', options);
    console.log(`Using ${isLargeFile ? 'batch' : 'single file'} processing`);
    
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
      
      // Initialize progress if callback provided
      onProgress?.(0);
      
      try {
        return await transcribeBatchedAudio(file, apiKey, options, onProgress, customTerms);
      } catch (batchError) {
        console.error('Batch processing failed:', batchError);
        throw new Error('Failed to transcribe file. This file will be automatically processed in smaller chunks.');
      }
    }
  } catch (error) {
    console.error('Google transcription error:', error);
    throw error;
  }
};

// Re-export these functions for backward compatibility
export { testApiKey, extractTranscriptText };
