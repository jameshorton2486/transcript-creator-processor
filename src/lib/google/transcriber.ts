
// Main Google transcription service
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { transcribeSingleFile, transcribeBatchedAudio } from './batchProcessor';
import { formatGoogleResponse, extractTranscriptText } from './responseFormatter';
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
    // Check if file is too large for synchronous processing
    const isLargeFile = file.size > 10 * 1024 * 1024;
    
    // Log what we're doing
    console.log(`Transcribing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) with Google Speech-to-Text`);
    console.log('Options:', options);
    
    if (customTerms && customTerms.length > 0) {
      console.log(`Using ${customTerms.length} custom terms for speech adaptation`);
    }
    
    if (!isLargeFile) {
      // For smaller files, use the existing synchronous method
      return await transcribeSingleFile(file, apiKey, options, customTerms);
    } else {
      // For large files, use batch processing
      return await transcribeBatchedAudio(file, apiKey, options, onProgress, customTerms);
    }
  } catch (error) {
    console.error('Google transcription error:', error);
    throw error;
  }
};

// Re-export these functions for backward compatibility
export { testApiKey, extractTranscriptText };
