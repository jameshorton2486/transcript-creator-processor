
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
  
  // For small files (less than 1MB), process in a single chunk
  if (fileSizeMB < 1) {
    console.log('[SPLIT] File is small, no splitting needed');
    return { shouldChunk: false, optimalDuration: 0 };
  }
  
  // Estimate audio duration based on file size (rough estimate: 16-bit mono at 16kHz = ~32KB per second)
  const estimatedDurationSec = file.size / (32 * 1024);
  
  // Determine optimal chunk duration based on file size and estimated duration
  const optimalDuration = calculateOptimalChunkDuration(file.size, estimatedDurationSec);
  console.log(`[SPLIT] Calculated optimal chunk duration: ${optimalDuration}s`);
  
  // Enforce Google's maximum duration limit for direct API requests
  const finalChunkDuration = Math.min(optimalDuration, MAX_CHUNK_DURATION_SECONDS);
  if (finalChunkDuration < optimalDuration) {
    console.log(`[SPLIT] Adjusted chunk duration to ${finalChunkDuration}s to comply with Google API limits`);
  }
  
  // For audio formats we can't decode easily, return the original file
  if (!/^(audio|video)/.test(file.type) && !file.name.match(/\.(wav|mp3|flac|ogg|m4a|webm)$/i)) {
    console.log('[SPLIT] Unsupported format for browser audio decoding');
    return { shouldChunk: false, optimalDuration: 0 };
  }
  
  return { shouldChunk: true, optimalDuration: finalChunkDuration };
};

/**
 * Determines if a file should be split based on its size and type
 * @param {File} file - The audio file to check
 * @returns {boolean} Whether the file should be split
 */
export const shouldSplitFile = (file: File): boolean => {
  const fileSizeMB = file.size / (1024 * 1024);
  
  // Files larger than 0.5MB should be split to avoid Google API duration limits
  if (fileSizeMB > 0.5) {
    return true;
  }
  
  // Only split supported audio formats
  if (!/^(audio|video)/.test(file.type) && !file.name.match(/\.(wav|mp3|flac|ogg|m4a|webm)$/i)) {
    return false;
  }
  
  return true;
};
