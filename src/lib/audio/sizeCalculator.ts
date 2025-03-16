
// Maximum size for a single batch (10MB is Google's sync API limit)
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
 */
export const calculateOptimalChunkDuration = (
  fileSize: number, 
  durationSec: number
): number => {
  const bytesPerSecond = fileSize / durationSec;
  const optimalDurationSec = MAX_BATCH_SIZE_BYTES / bytesPerSecond;
  
  // Ensure the duration is at least 5 seconds and at most 60 seconds
  return Math.max(5, Math.min(60, Math.floor(optimalDurationSec)));
};
