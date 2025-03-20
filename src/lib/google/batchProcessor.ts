
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { 
  prepareFileChunks, 
  processChunk 
} from './batch/chunkProcessing';
import { 
  addDelayBetweenChunks, 
  logBatchCompletionStats, 
  extractLastErrorMessage 
} from './batch/retryLogic';
import { 
  combineChunkResults, 
  flattenChunkResults 
} from './batch/resultCombiner';

/**
 * Process audio in batches for all files
 */
export const transcribeBatchedAudio = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void,
  customTerms: string[] = []
) => {
  try {
    console.log('[BATCH] Starting batch processing...');
    console.log(`[BATCH] File: ${file.name}, Type: ${file.type}, Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    onProgress?.(0); // Initialize progress
    
    // Determine file type and encoding
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    let encoding = 'LINEAR16'; // Default encoding for WAV files
    
    if (fileType.includes('mp3') || fileName.endsWith('.mp3')) {
      encoding = 'MP3';
    } else if (fileType.includes('flac') || fileName.endsWith('.flac')) {
      encoding = 'FLAC';
    } else if (fileType.includes('ogg') || fileName.endsWith('.ogg')) {
      encoding = 'OGG_OPUS';
    } else if (fileType.includes('amr') || fileName.endsWith('.amr')) {
      encoding = 'AMR';
    } else if (fileType.includes('webm') || fileName.endsWith('.webm')) {
      encoding = 'WEBM_OPUS';
    }
    
    console.log(`[BATCH] File format: ${fileType || 'Unknown, using filename: ' + fileName}`);
    console.log(`[BATCH] Encoding detected: ${encoding}`);
    console.log(`[BATCH] Estimated size after base64 encoding: ${((file.size * 1.33) / (1024 * 1024)).toFixed(2)} MB`);
    
    try {
      // Split the file into chunks
      const chunks = await prepareFileChunks(file);
      
      // Process each chunk
      const chunkResponses = [];
      let successCount = 0;
      let errorCount = 0;
      let lastErrorMessage = ''; // Track the last error message for better error reporting
      
      for (let i = 0; i < chunks.length; i++) {
        // Process this chunk
        const mergedOptions = { ...options, encoding, customTerms };
        const chunkResponse = await processChunk(
          chunks[i], 
          i, 
          chunks.length, 
          file, 
          apiKey, 
          mergedOptions, 
          onProgress
        );
        
        // Track statistics
        if (chunkResponse.isSuccess) {
          successCount++;
          console.log(`[BATCH] Successfully processed chunk ${i+1}/${chunks.length}`);
        } else {
          errorCount++;
          lastErrorMessage = chunkResponse.error || '';
        }
        
        // Add the results to our collection
        chunkResponses.push(...chunkResponse.results);
        
        // Add a small delay between chunks to prevent rate limiting
        if (i < chunks.length - 1) {
          await addDelayBetweenChunks();
        }
      }
      
      // Log batch processing completion stats
      logBatchCompletionStats(successCount, errorCount, chunks.length);
      
      onProgress?.(100);
      
      // If no error message was captured but there were errors, extract from results
      if (errorCount > 0 && !lastErrorMessage) {
        lastErrorMessage = extractLastErrorMessage(chunkResponses, errorCount);
      }
      
      // Get all results flattened
      const flattenedResults = flattenChunkResults(chunkResponses);
      
      // Combine results into a single response
      return combineChunkResults(flattenedResults, successCount, errorCount, lastErrorMessage);
      
    } catch (processingError) {
      console.error('[BATCH ERROR] File processing failed:', processingError);
      
      // Get detailed error information
      const errorMessage = processingError instanceof Error ? processingError.message : String(processingError);
      const errorStack = processingError instanceof Error ? processingError.stack : '';
      
      throw new Error(`Failed to process file in batches: ${errorMessage}`);
    }
  } catch (error) {
    console.error('[BATCH ERROR] Fatal error in batch processing:', error);
    
    // Provide more user-friendly error message
    let errorMessage = 'Failed to process file in batches.';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[BATCH ERROR] Stack trace:', error.stack);
    }
    
    throw new Error(errorMessage);
  }
};

// Alias for backward compatibility
export const processBatchFile = transcribeBatchedAudio;
