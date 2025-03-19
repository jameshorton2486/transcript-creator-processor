
/**
 * Utilities for processing audio chunks
 */
import { createAudioBufferFromChunk } from './audioBufferUtils';
import { encodeWavFile } from './wavEncoder';

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
  // Create a new AudioBuffer for this chunk
  const chunkBuffer = createAudioBufferFromChunk(chunk, sampleRate);
  
  // Convert to WAV for better compatibility
  const wavBlob = encodeWavFile(chunkBuffer, sampleRate);
  
  console.log(`[SPLIT] Processed chunk ${index+1}/${total}`);
  
  return wavBlob;
};
