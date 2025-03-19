
// Maximum size for a single batch (10MB is Google's sync API limit, but we want to be safe)
export const MAX_BATCH_SIZE_BYTES = 5 * 1024 * 1024; // 5MB to be memory-efficient

/**
 * Estimates the file size in bytes for a WAV file of given duration
 */
export const estimateWavFileSize = (durationSec: number, sampleRate: number = 16000): number => {
  // Header size (44 bytes) + audio data (2 bytes per sample * sample rate * duration)
  return 44 + (2 * sampleRate * durationSec);
};

/**
 * Calculates optimal chunk duration based on MAX_BATCH_SIZE_BYTES
 * Memory-efficient version for legal transcriptions
 * @param {number} fileSize - File size in bytes
 * @param {number} durationSec - Estimated duration in seconds
 * @returns {number} Optimal chunk duration in seconds
 */
export const calculateOptimalChunkDuration = (
  fileSize: number, 
  durationSec: number
): number => {
  // For extremely large files, use even smaller chunks to avoid memory issues
  if (fileSize > 100 * 1024 * 1024) { // Files larger than 100MB
    return 5; // Use 5-second chunks for extremely large files
  }
  
  // For very large files, use smaller chunks to avoid memory issues
  if (fileSize > 50 * 1024 * 1024) { // Files larger than 50MB
    return 8; // Use 8-second chunks for very large files
  }
  
  const bytesPerSecond = fileSize / durationSec;
  const optimalDurationSec = MAX_BATCH_SIZE_BYTES / bytesPerSecond;
  
  // For legal transcripts, we want to balance natural language breaks with memory efficiency
  // Use shorter chunks to prevent memory issues
  
  // If the calculated optimal duration is less than 10 seconds, use calculated value
  // If it's more than 30 seconds, cap at 30 seconds
  // Otherwise, round to the nearest 5 seconds for more natural breaks
  
  let adjustedDuration = Math.max(5, Math.min(30, Math.floor(optimalDurationSec)));
  
  // Round to nearest 5 seconds for more natural breakpoints
  adjustedDuration = Math.round(adjustedDuration / 5) * 5;
  
  return adjustedDuration;
};

/**
 * Calculates the estimated duration of an audio file based on its size and encoding
 * @param {number} fileSize - File size in bytes
 * @param {string} encoding - Audio encoding (e.g., 'LINEAR16', 'MP3')
 * @returns {number} - Estimated duration in seconds
 */
export const estimateAudioDuration = (fileSize: number, encoding: string): number => {
  let bytesPerSecond: number;
  
  // Approximate values for different encodings (very rough estimates)
  switch (encoding.toUpperCase()) {
    case 'MP3':
      bytesPerSecond = 16 * 1024; // ~128kbps
      break;
    case 'FLAC':
      bytesPerSecond = 88 * 1024; // ~700kbps
      break;
    case 'LINEAR16': // WAV
      bytesPerSecond = 32 * 1024; // 16-bit mono at 16kHz
      break;
    case 'OGG_OPUS':
      bytesPerSecond = 8 * 1024; // ~64kbps
      break;
    case 'WEBM_OPUS':
      bytesPerSecond = 8 * 1024; // ~64kbps
      break;
    case 'AMR':
      bytesPerSecond = 1.5 * 1024; // ~12kbps
      break;
    default:
      bytesPerSecond = 32 * 1024; // Default to 16-bit mono at 16kHz
  }
  
  // Calculate estimated duration
  const estimatedDuration = fileSize / bytesPerSecond;
  
  console.log(`[ESTIMATE] File size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB, ` +
              `encoding: ${encoding}, estimated duration: ${estimatedDuration.toFixed(2)} seconds`);
              
  return estimatedDuration;
};

/**
 * Estimates memory requirements for processing an audio file
 * @param {number} fileSize - File size in bytes
 * @returns {object} - Memory requirement estimates
 */
export const estimateMemoryRequirements = (fileSize: number) => {
  // Memory usage increases when processing audio (loading, decoding, resampling)
  // This is a very rough estimate and actual usage will vary
  
  // For processing, we'll need at least 2-3x the file size due to:
  // 1. Original file in memory
  // 2. Decoded PCM data (which is larger than compressed audio)
  // 3. Resampled data
  // 4. Extra buffers for processing
  const processingMultiplier = 3;
  const estimatedMemoryBytes = fileSize * processingMultiplier;
  const estimatedMemoryMB = estimatedMemoryBytes / (1024 * 1024);
  
  // Default memory limit for mobile browsers is often around 512MB-1GB
  // For desktop, it's higher but still limited
  const memoryLimit = 768 * 1024 * 1024; // 768MB as a safe limit
  const isMemoryCritical = estimatedMemoryBytes > memoryLimit;
  
  // Calculate recommended chunks based on memory considerations
  // We want to keep each chunk's memory usage under 256MB
  const targetChunkMemory = 256 * 1024 * 1024; // 256MB per chunk
  const recommendedChunkCount = Math.max(1, Math.ceil(estimatedMemoryBytes / targetChunkMemory));
  
  return {
    estimatedMemoryMB,
    isMemoryCritical,
    recommendedChunkCount
  };
};
