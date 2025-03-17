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
