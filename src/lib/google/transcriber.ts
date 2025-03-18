
// Main Google transcription service
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { transcribeBatchedAudio } from './batchProcessor';
import { extractTranscriptText } from './formatters/responseFormatter';
import { testApiKey } from './apiTester';

/**
 * Main transcription function that always processes files in batches
 */
export const transcribeAudio = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void,
  customTerms: string[] = []
) => {
  try {
    // Log start of transcription process with file details
    console.log(`[TRANSCRIPTION] Starting transcription for: ${file.name}`);
    console.log(`[TRANSCRIPTION] File details: ${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[TRANSCRIPTION] Transcription options:`, options);
    if (customTerms?.length > 0) {
      console.log(`[TRANSCRIPTION] Using ${customTerms.length} custom terms for speech adaptation`);
    }

    // Check file type
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    const isAudio = fileType.includes('audio') || 
                   fileType.includes('video') ||
                   fileName.endsWith('.mp3') || 
                   fileName.endsWith('.wav') || 
                   fileName.endsWith('.flac') || 
                   fileName.endsWith('.m4a') || 
                   fileName.endsWith('.ogg') ||
                   fileName.endsWith('.mp4') ||
                   fileName.endsWith('.webm') ||
                   fileName.endsWith('.mov');
    
    if (!isAudio) {
      console.error(`[TRANSCRIPTION ERROR] Unsupported file type: ${fileType || fileName}`);
      throw new Error('Unsupported file type. Please upload an audio or video file.');
    }
    
    // Initialize progress if callback provided
    onProgress?.(0);
    
    // Always use batch processing for all files
    console.log(`[TRANSCRIPTION] Using batch processing for file: ${file.name}`);
    
    try {
      const result = await transcribeBatchedAudio(file, apiKey, options, onProgress, customTerms);
      console.log(`[TRANSCRIPTION] Successfully completed batch transcription for: ${file.name}`);
      return result;
    } catch (batchError) {
      console.error('[TRANSCRIPTION ERROR] Batch processing failed:', batchError);
      
      // Get detailed error information
      const errorMessage = batchError instanceof Error ? batchError.message : String(batchError);
      const errorStack = batchError instanceof Error ? batchError.stack : '';
      
      console.error('[TRANSCRIPTION ERROR] Details:', {
        file: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        error: errorMessage,
        stack: errorStack
      });
      
      throw new Error(`Failed to transcribe file in batches: ${errorMessage}`);
    }
  } catch (error) {
    // Log detailed error information
    console.error('[TRANSCRIPTION ERROR] Fatal error:', error);
    
    // Get specific error information
    let errorMessage = 'Unknown transcription error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[TRANSCRIPTION ERROR] Stack trace:', error.stack);
    } else {
      errorMessage = String(error);
    }
    
    // Re-throw with clear message
    throw new Error(`Transcription failed: ${errorMessage}`);
  }
};

// Re-export these functions for backward compatibility
export { testApiKey, extractTranscriptText };
