
/**
 * Strategies for determining how to split audio files
 */
import { calculateOptimalChunkDuration } from './sizeCalculator';
import { MAX_CHUNK_DURATION_SECONDS } from './chunkProcessor';

/**
 * Determines if a file should be split and what the optimal chunk duration should be
 * @param {File} file - The audio file to analyze
 * @returns {Promise<{shouldChunk: boolean, optimalDuration: number}>} Strategy result
 */
export const determineOptimalChunking = async (
  file: File
): Promise<{shouldChunk: boolean, optimalDuration: number}> => {
  // Calculate optimal chunk duration based on file size
  const fileSizeMB = file.size / (1024 * 1024);
  console.log(`[SPLIT] Processing file: ${file.name}, Size: ${fileSizeMB.toFixed(2)} MB`);
  
  // For very small files (less than 0.5MB), process in a single chunk
  if (fileSizeMB < 0.5) {
    console.log('[SPLIT] File is very small, no splitting needed');
    return { shouldChunk: false, optimalDuration: 0 };
  }
  
  // Estimate audio duration based on file size (rough estimate: 16-bit mono at 16kHz = ~32KB per second)
  const estimatedDurationSec = file.size / (32 * 1024);
  
  // More aggressive chunking strategy - for any file over 0.5MB, use much smaller chunks
  // to avoid "exceeds duration limit" errors with Google's Speech API
  const baseChunkDuration = Math.min(
    MAX_CHUNK_DURATION_SECONDS,
    // Use 10 second chunks for files under 4MB, 5 seconds for larger files
    fileSizeMB < 4 ? 10 : 5
  );
  
  console.log(`[SPLIT] Using aggressive chunking with ${baseChunkDuration}s chunks`);
  
  // For audio formats we can't decode easily, return the original file
  if (!/^(audio|video)/.test(file.type) && !file.name.match(/\.(wav|mp3|flac|ogg|m4a|webm)$/i)) {
    console.log('[SPLIT] Unsupported format for browser audio decoding');
    return { shouldChunk: false, optimalDuration: 0 };
  }
  
  return { shouldChunk: true, optimalDuration: baseChunkDuration };
};

/**
 * Determines if a file should be split based on its size and type
 * @param {File} file - The audio file to check
 * @returns {boolean} Whether the file should be split
 */
export const shouldSplitFile = (file: File): boolean => {
  const fileSizeMB = file.size / (1024 * 1024);
  
  // Always split files larger than 0.5MB to avoid Google API duration limits
  if (fileSizeMB > 0.5) {
    return true;
  }
  
  // Only split supported audio formats
  if (!/^(audio|video)/.test(file.type) && !file.name.match(/\.(wav|mp3|flac|ogg|m4a|webm)$/i)) {
    return false;
  }
  
  return true;
};
