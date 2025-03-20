
import { splitFileIntoChunks } from '../audio/fileChunker';
import { transcribeSingleFile } from '../singleFileProcessor';

// Adjust payload limit to account for base64 encoding expansion (~33%)
const BASE64_EXPANSION_FACTOR = 1.33;
// Reducing the max payload size even further to avoid any potential issues
const GOOGLE_API_PAYLOAD_LIMIT = 5 * 1024 * 1024; // Much smaller than the actual 10MB limit
const SAFE_CHUNK_SIZE = Math.floor(GOOGLE_API_PAYLOAD_LIMIT / BASE64_EXPANSION_FACTOR) - 512 * 1024; // Add 512KB safety margin

/**
 * Split a file into appropriate chunks for processing
 */
export const prepareFileChunks = async (file: File) => {
  console.log(`[BATCH] Splitting file into smaller binary chunks of max ${(SAFE_CHUNK_SIZE / (1024 * 1024)).toFixed(2)} MB each`);
  const chunks = await splitFileIntoChunks(file, SAFE_CHUNK_SIZE);
  console.log(`[BATCH] Successfully split file into ${chunks.length} binary chunks`);
  return chunks;
};

/**
 * Create a temporary file from a chunk for processing
 */
export const createChunkFile = (chunk: ArrayBuffer, originalFile: File, index: number): File => {
  const chunkBlob = new Blob([chunk], { type: originalFile.type });
  const fileName = originalFile.name.toLowerCase();
  return new File(
    [chunkBlob], 
    `chunk-${index}.${fileName.split('.').pop()}`, 
    { type: originalFile.type }
  );
};

/**
 * Process a single chunk with potential sub-chunking for large chunks
 */
export const processChunk = async (
  chunk: ArrayBuffer,
  index: number,
  totalChunks: number,
  originalFile: File,
  apiKey: string,
  options: any,
  onProgress?: (progress: number) => void
) => {
  console.log(`[BATCH] Processing chunk ${index+1}/${totalChunks} (${(chunk.byteLength / (1024 * 1024)).toFixed(2)} MB)`);
  
  // Create a temporary File for the chunk
  const chunkFile = createChunkFile(chunk, originalFile, index);
  
  // Update progress
  const chunkProgress = Math.round((index / totalChunks) * 100);
  onProgress?.(chunkProgress);
  
  // If this chunk is still too large (over 2MB), split it further into smaller pieces
  if (chunkFile.size > 2 * 1024 * 1024) {
    console.log(`[BATCH] Chunk ${index+1} is still large (${(chunkFile.size / (1024 * 1024)).toFixed(2)} MB), splitting further...`);
    return await processLargeChunk(chunkFile, index, totalChunks, apiKey, options);
  } else {
    // For smaller chunks, process normally
    return await processSingleChunk(chunkFile, index, totalChunks, apiKey, options);
  }
};

/**
 * Process a large chunk by splitting it into sub-chunks
 */
const processLargeChunk = async (
  chunkFile: File,
  chunkIndex: number,
  totalChunks: number,
  apiKey: string,
  options: any
) => {
  try {
    // Split this chunk into smaller sub-chunks (recursive splitting)
    const subChunks = await splitFileIntoChunks(chunkFile, 1 * 1024 * 1024); // 1MB sub-chunks
    console.log(`[BATCH] Further split chunk ${chunkIndex+1} into ${subChunks.length} sub-chunks`);
    
    // Process each sub-chunk
    const subChunkResults = [];
    
    for (let j = 0; j < subChunks.length; j++) {
      const subChunkBlob = new Blob([subChunks[j]], { type: chunkFile.type });
      const subChunkFile = new File(
        [subChunkBlob], 
        `sub-chunk-${chunkIndex}-${j}.${chunkFile.name.split('.').pop()}`, 
        { type: chunkFile.type }
      );
      
      try {
        // Process this sub-chunk
        const mergedOptions = { ...options, encoding: options.encoding || detectEncoding(chunkFile) };
        const subChunkResult = await transcribeSingleFile(subChunkFile, apiKey, mergedOptions);
        
        // Validate the result
        if (!subChunkResult.results || subChunkResult.results.length === 0) {
          console.warn(`[BATCH] Sub-chunk ${j+1} of chunk ${chunkIndex+1} returned no results`);
          subChunkResults.push({
            results: [{
              alternatives: [{
                transcript: `[No speech detected in sub-chunk ${j+1} of chunk ${chunkIndex+1}]`,
                confidence: 0
              }]
            }]
          });
        } else {
          subChunkResults.push(subChunkResult);
          console.log(`[BATCH] Successfully processed sub-chunk ${j+1} of chunk ${chunkIndex+1}`);
        }
      } catch (subChunkError) {
        console.error(`[BATCH ERROR] Error processing sub-chunk ${j+1} of chunk ${chunkIndex+1}:`, subChunkError);
        
        // Add error message for failed sub-chunk
        subChunkResults.push({
          results: [{
            alternatives: [{
              transcript: `[Transcription failed for sub-chunk ${j+1} of chunk ${chunkIndex+1}: ${subChunkError instanceof Error ? subChunkError.message.substring(0, 100) : String(subChunkError).substring(0, 100)}]`,
              confidence: 0
            }]
          }]
        });
      }
      
      // Add delay between sub-chunks to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Return the combined results from all sub-chunks
    return {
      results: subChunkResults,
      isSuccess: subChunkResults.some(r => r.results[0]?.alternatives?.[0]?.confidence > 0),
      error: null
    };
  } catch (splitError) {
    console.error(`[BATCH ERROR] Error splitting chunk ${chunkIndex+1} further:`, splitError);
    
    // Try to process the original chunk anyway as a fallback
    try {
      const mergedOptions = { ...options, encoding: options.encoding || detectEncoding(chunkFile) };
      const chunkResult = await transcribeSingleFile(chunkFile, apiKey, mergedOptions);
      return { results: [chunkResult], isSuccess: true, error: null };
    } catch (fallbackError) {
      console.error(`[BATCH ERROR] Fallback processing of chunk ${chunkIndex+1} also failed:`, fallbackError);
      
      return {
        results: [{
          results: [{
            alternatives: [{
              transcript: `[Transcription failed for chunk ${chunkIndex+1}]`,
              confidence: 0
            }]
          }]
        }],
        isSuccess: false,
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      };
    }
  }
};

/**
 * Process a single chunk directly
 */
const processSingleChunk = async (
  chunkFile: File,
  chunkIndex: number,
  totalChunks: number,
  apiKey: string,
  options: any
) => {
  try {
    // Process this chunk with the options
    const mergedOptions = { ...options, encoding: options.encoding || detectEncoding(chunkFile) };
    const chunkResult = await transcribeSingleFile(chunkFile, apiKey, mergedOptions);
    
    // Validate the result has some transcription data
    if (!chunkResult.results || chunkResult.results.length === 0 || 
        !chunkResult.results[0].alternatives || chunkResult.results[0].alternatives.length === 0) {
      console.warn(`[BATCH] Chunk ${chunkIndex+1}/${totalChunks} returned no transcription data, but didn't throw an error`);
      
      // Add an empty result with warning
      return {
        results: [{
          results: [{
            alternatives: [{
              transcript: `[No speech detected in chunk ${chunkIndex+1}]`,
              confidence: 0
            }]
          }]
        }],
        isSuccess: true,
        error: null
      };
    } else {
      // Normal successful result
      return {
        results: [chunkResult],
        isSuccess: true,
        error: null
      };
    }
  } catch (chunkError) {
    // Extract detailed error message
    const errorMessage = chunkError instanceof Error ? chunkError.message : String(chunkError);
    
    console.error(`[BATCH ERROR] Error processing chunk ${chunkIndex+1}/${totalChunks}:`, chunkError);
    
    // Log detailed chunk error information
    console.error(`[BATCH ERROR] Chunk details:`, {
      chunkNumber: chunkIndex+1,
      totalChunks: totalChunks,
      chunkSize: `${(chunkFile.size / (1024 * 1024)).toFixed(2)} MB`,
      errorMessage
    });
    
    return {
      results: [{
        results: [{
          alternatives: [{
            transcript: `[Transcription failed for chunk ${chunkIndex+1}: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}]`,
            confidence: 0
          }]
        }]
      }],
      isSuccess: false,
      error: errorMessage
    };
  }
};

/**
 * Detect audio encoding based on file type
 */
function detectEncoding(file: File): string {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  
  if (type.includes('flac') || name.endsWith('.flac')) {
    return 'FLAC';
  } else if (type.includes('mp3') || name.endsWith('.mp3')) {
    return 'MP3';
  } else if (type.includes('wav') || name.endsWith('.wav')) {
    return 'LINEAR16';
  } else if (type.includes('ogg') || name.endsWith('.ogg')) {
    return 'OGG_OPUS';
  } else if (type.includes('amr') || name.endsWith('.amr')) {
    return 'AMR';
  } else if (type.includes('webm') || name.endsWith('.webm')) {
    return 'WEBM_OPUS';
  }
  
  return 'LINEAR16'; // Default to WAV format
}
