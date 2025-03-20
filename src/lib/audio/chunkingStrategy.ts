
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
  
  // Check if it's a WAV file (special handling for sample rate issues)
  const isWavFile = file.type.includes('wav') || file.name.toLowerCase().endsWith('.wav');
  
  // More aggressive chunking strategy for WAV files to avoid sample rate issues
  // and for all files to avoid "exceeds duration limit" errors with Google's Speech API
  const baseChunkDuration = Math.min(
    MAX_CHUNK_DURATION_SECONDS, 
    // Use even shorter chunks for WAV files and large files
    isWavFile || fileSizeMB > 4 ? 5 : 10
  );
  
  console.log(`[SPLIT] Using chunking with ${baseChunkDuration}s chunks for ${isWavFile ? 'WAV' : 'non-WAV'} file`);
  
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
  
  // Almost always split files to avoid Google API duration limits
  // Only very small files (<0.5MB) can be processed directly
  if (fileSizeMB > 0.5) {
    return true;
  }
  
  // Only split supported audio formats
  if (!/^(audio|video)/.test(file.type) && !file.name.match(/\.(wav|mp3|flac|ogg|m4a|webm)$/i)) {
    return false;
  }
  
  return true;
};
