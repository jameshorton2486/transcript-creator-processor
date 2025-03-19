
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { combineTranscriptionResults } from './formatters/responseFormatter';
import { splitFileIntoChunks } from './audio/fileChunker';
import { transcribeSingleFile } from './singleFileProcessor';

// Adjust payload limit to account for base64 encoding expansion (~33%)
const BASE64_EXPANSION_FACTOR = 1.33;
const GOOGLE_API_PAYLOAD_LIMIT = 10 * 1024 * 1024;
const SAFE_CHUNK_SIZE = Math.floor(GOOGLE_API_PAYLOAD_LIMIT / BASE64_EXPANSION_FACTOR) - 512 * 1024; // Add 512KB safety margin

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
    console.log(`[BATCH] Estimated size after base64 encoding: ${((file.size * BASE64_EXPANSION_FACTOR) / (1024 * 1024)).toFixed(2)} MB`);
    
    try {
      // Always split the file into binary chunks regardless of size
      console.log(`[BATCH] Splitting file into binary chunks of max ${(SAFE_CHUNK_SIZE / (1024 * 1024)).toFixed(2)} MB each`);
      const chunks = await splitFileIntoChunks(file, SAFE_CHUNK_SIZE);
      console.log(`[BATCH] Successfully split file into ${chunks.length} binary chunks`);
      
      // Process each chunk
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      let lastErrorMessage = ''; // Track the last error message for better error reporting
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkProgress = Math.round((i / chunks.length) * 100);
        onProgress?.(chunkProgress);
        
        console.log(`[BATCH] Processing chunk ${i+1}/${chunks.length} (${(chunks[i].byteLength / (1024 * 1024)).toFixed(2)} MB)`);
        
        // Create a temporary File for each chunk
        const chunkBlob = new Blob([chunks[i]], { type: file.type });
        const chunkFile = new File([chunkBlob], `chunk-${i}.${fileName.split('.').pop()}`, { type: file.type });
        
        try {
          // Process this chunk with the options including custom terms
          const mergedOptions = { ...options, encoding };
          const chunkResult = await transcribeSingleFile(chunkFile, apiKey, mergedOptions);
          
          // Validate the result has some transcription data
          if (!chunkResult.results || chunkResult.results.length === 0 || 
              !chunkResult.results[0].alternatives || chunkResult.results[0].alternatives.length === 0) {
            console.warn(`[BATCH] Chunk ${i+1}/${chunks.length} returned no transcription data, but didn't throw an error`);
            
            // Add an empty result with warning
            results.push({
              results: [{
                alternatives: [{
                  transcript: `[No speech detected in chunk ${i+1}]`,
                  confidence: 0
                }]
              }]
            });
            
            // Count as success but log warning
            successCount++;
          } else {
            // Normal successful result
            results.push(chunkResult);
            successCount++;
            console.log(`[BATCH] Successfully processed chunk ${i+1}/${chunks.length}`);
          }
        } catch (chunkError) {
          errorCount++;
          
          // Extract detailed error message
          const errorMessage = chunkError instanceof Error ? chunkError.message : String(chunkError);
          lastErrorMessage = errorMessage; // Save this for the final error message if needed
          
          console.error(`[BATCH ERROR] Error processing chunk ${i+1}/${chunks.length}:`, chunkError);
          
          // Log detailed chunk error information
          console.error(`[BATCH ERROR] Chunk details:`, {
            chunkNumber: i+1,
            totalChunks: chunks.length,
            chunkSize: `${(chunks[i].byteLength / (1024 * 1024)).toFixed(2)} MB`,
            errorMessage
          });
          
          // Add informative error message for failed chunk
          results.push({
            results: [{
              alternatives: [{
                transcript: `[Transcription failed for chunk ${i+1}: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}]`,
                confidence: 0
              }]
            }]
          });
          
          // If this is the first chunk and it failed, we might need to continue with the others
          if (i === 0 && chunks.length > 1) {
            console.log(`[BATCH] First chunk failed but continuing with remaining chunks...`);
          }
        }
        
        // Add a small delay between chunks to prevent rate limiting
        if (i < chunks.length - 1) {
          console.log(`[BATCH] Adding delay between chunks to prevent rate limiting`);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      
      // Log batch processing completion stats
      console.log(`[BATCH] Batch processing completed. Success: ${successCount}/${chunks.length}, Errors: ${errorCount}/${chunks.length}`);
      
      onProgress?.(100);
      
      // If all chunks failed, throw an error with the most detailed information
      if (successCount === 0) {
        throw new Error(`All chunks failed to process. Last error: ${lastErrorMessage}`);
      }
      
      // Even if some chunks failed, try to combine the successful ones
      const combinedResult = combineTranscriptionResults(results);
      
      // Check if the combined result has any meaningful transcription
      if (combinedResult?.results?.length > 0) {
        console.log(`[BATCH] Successfully combined results from ${results.length} chunks`);
        return combinedResult;
      } else {
        // If combined result is empty, provide a better error message
        const errorMsg = errorCount > 0 
          ? `Failed to transcribe any meaningful content. ${errorCount} of ${chunks.length} chunks failed. Last error: ${lastErrorMessage}`
          : 'No speech was detected in the audio file. The file may be silent or contain background noise only.';
        
        throw new Error(errorMsg);
      }
      
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
