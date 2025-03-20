
/**
 * Utilities for processing audio chunks
 */
import { createAudioBufferFromChunk } from './audioBufferUtils';
import { encodeWavFile } from './wavEncoder';

/**
 * Maximum duration for a single chunk in seconds (to avoid Google's "exceeds duration limit" error)
 * Google recommends a maximum of 60 seconds for synchronous requests
 */
export const MAX_CHUNK_DURATION_SECONDS = 45; // Conservative limit below Google's 60s max

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
    // Create a new AudioBuffer for this chunk
    const chunkBuffer = createAudioBufferFromChunk(chunk, sampleRate);
    
    // Check if chunk duration exceeds Google's limit
    const chunkDurationSeconds = chunkBuffer.duration;
    if (chunkDurationSeconds > MAX_CHUNK_DURATION_SECONDS) {
      console.warn(`[SPLIT] Warning: Chunk ${index+1}/${total} exceeds Google's duration limit (${chunkDurationSeconds.toFixed(1)}s > ${MAX_CHUNK_DURATION_SECONDS}s). This may cause API errors.`);
    }
    
    // Convert to WAV for better compatibility
    const wavBlob = encodeWavFile(chunkBuffer);
    
    console.log(`[SPLIT] Processed chunk ${index+1}/${total} (${chunkDurationSeconds.toFixed(1)}s)`);
    
    return wavBlob;
  } catch (error) {
    console.error(`[SPLIT] Error processing chunk ${index+1}/${total}:`, error);
    throw new Error(`Failed to process audio chunk ${index+1}: ${error instanceof Error ? error.message : String(error)}`);
  }
};
