
// Maximum size for a single batch (10MB is Google's sync API limit, but we want to be safe)
export const MAX_BATCH_SIZE_BYTES = 9 * 1024 * 1024; // 9MB to be safe

/**
 * Estimates the file size in bytes for a WAV file of given duration
 */
export const estimateWavFileSize = (durationSec: number, sampleRate: number = 16000): number => {
  // Header size (44 bytes) + audio data (2 bytes per sample * sample rate * duration)
  return 44 + (2 * sampleRate * durationSec);
};

/**
 * Calculates optimal chunk duration based on MAX_BATCH_SIZE_BYTES
 * For legal transcriptions, we aim for optimal sentence boundaries
 * which typically occur around 30-60 second intervals
 */
export const calculateOptimalChunkDuration = (
  fileSize: number, 
  durationSec: number
): number => {
  // For very large files, use smaller chunks to avoid memory issues
  if (fileSize > 50 * 1024 * 1024) { // Files larger than 50MB
    return 10; // Use 10-second chunks for very large files
  }
  
  const bytesPerSecond = fileSize / durationSec;
  const optimalDurationSec = MAX_BATCH_SIZE_BYTES / bytesPerSecond;
  
  // For legal transcripts, we want to aim for natural breaks
  // Sentences in legal contexts tend to be longer, so aim for 30-60 second chunks
  // which typically contain complete thoughts or statements
  
  // If the calculated optimal duration is less than 15 seconds, use 15 seconds
  // If it's more than 60 seconds, use 60 seconds
  // Otherwise, round to the nearest 5 seconds for more natural breaks
  
  let adjustedDuration = Math.max(15, Math.min(60, Math.floor(optimalDurationSec)));
  
  // Round to nearest 5 seconds for more natural breakpoints
  adjustedDuration = Math.round(adjustedDuration / 5) * 5;
  
  return adjustedDuration;
};
