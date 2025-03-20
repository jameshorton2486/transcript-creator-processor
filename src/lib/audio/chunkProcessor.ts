
/**
 * Utilities for processing audio chunks
 */
import { createAudioBufferFromChunk } from './audioBufferUtils';
import { encodeWavFile } from './wavEncoder';

/**
 * Maximum duration for a single chunk in seconds (reduced to avoid Google's "exceeds duration limit" error)
 * Google recommends a maximum of 60 seconds for synchronous requests, but we'll use an even more conservative limit
 */
export const MAX_CHUNK_DURATION_SECONDS = 15; // Even more conservative limit than before

/**
 * Safely wraps a promise to ensure it properly handles cancellation
 * This helps prevent "Message Channel Closed" errors
 */
const safePromiseWrapper = <T>(promise: Promise<T>): Promise<T> => {
  let isCancelled = false;
  
  // Create an AbortController to help with cleanup
  const controller = new AbortController();
  const signal = controller.signal;
  
  // Cleanup function to prevent memory leaks
  const cleanup = () => {
    isCancelled = true;
    controller.abort();
  };
  
  // Return a new promise that wraps the original
  return new Promise<T>((resolve, reject) => {
    // Add listeners for page visibility changes and beforeunload
    // This helps detect when the user navigates away
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cleanup();
      }
    };
    
    const handleBeforeUnload = () => {
      cleanup();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Execute the original promise
    promise.then(
      (result) => {
        if (!isCancelled) {
          resolve(result);
        }
      },
      (error) => {
        if (!isCancelled) {
          reject(error);
        }
      }
    ).finally(() => {
      // Clean up event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    });
  });
};

/**
 * Processes a single audio chunk into a WAV blob
 * @param {Float32Array} chunk - Audio data chunk
 * @param {number} sampleRate - Sample rate of the audio
 * @param {number} index - Index of the current chunk
 * @param {number} total - Total number of chunks
 * @returns {Promise<Blob>} WAV blob of the processed chunk
 */
export const processAudioChunk = async (
  chunk: Float32Array, 
  sampleRate: number,
  index: number, 
  total: number
): Promise<Blob> => {
  try {
    // Validate chunk data
    if (!chunk || chunk.length === 0) {
      throw new Error('Empty audio chunk data');
    }
    
    // Log chunk details for debugging
    console.log(`[CHUNK] Processing chunk ${index+1}/${total} with ${chunk.length} samples at ${sampleRate}Hz`);
    
    // Create a new AudioBuffer for this chunk - wrap in safe promise
    const chunkBufferPromise = safePromiseWrapper(
      Promise.resolve(createAudioBufferFromChunk(chunk, sampleRate))
    );
    
    const chunkBuffer = await chunkBufferPromise;
    
    // Check if chunk duration exceeds Google's limit
    const chunkDurationSeconds = chunkBuffer.duration;
    if (chunkDurationSeconds > MAX_CHUNK_DURATION_SECONDS) {
      console.warn(`[CHUNK] Warning: Chunk ${index+1}/${total} exceeds Google's duration limit (${chunkDurationSeconds.toFixed(1)}s > ${MAX_CHUNK_DURATION_SECONDS}s). This may cause API errors.`);
    }
    
    // Convert to WAV for better compatibility - wrap in safe promise
    const wavBlobPromise = safePromiseWrapper(
      Promise.resolve(encodeWavFile(chunkBuffer))
    );
    
    const wavBlob = await wavBlobPromise;
    
    // Verify WAV blob is valid
    if (!wavBlob || wavBlob.size === 0) {
      throw new Error('Failed to encode WAV file from audio chunk');
    }
    
    console.log(`[CHUNK] Successfully processed chunk ${index+1}/${total} (${chunkDurationSeconds.toFixed(1)}s, ${(wavBlob.size / 1024).toFixed(1)}KB)`);
    
    return wavBlob;
  } catch (error) {
    console.error(`[CHUNK] Error processing chunk ${index+1}/${total}:`, error);
    throw new Error(`Failed to process audio chunk ${index+1}: ${error instanceof Error ? error.message : String(error)}`);
  }
};
