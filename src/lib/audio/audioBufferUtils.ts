
/**
 * Utilities for working with AudioBuffer objects
 */

/**
 * Decodes an audio file into an AudioBuffer
 * @param {File} file - Audio file to decode
 * @returns {Promise<AudioBuffer>} Decoded audio buffer
 */
export const decodeAudioFile = async (file: File): Promise<AudioBuffer> => {
  // Create audio context
  const audioContext = new AudioContext();
  
  // Get array buffer from file
  const arrayBuffer = await file.arrayBuffer();
  
  // Try to decode the audio data
  return await audioContext.decodeAudioData(arrayBuffer);
};

/**
 * Creates an AudioBuffer from a Float32Array chunk
 * @param {Float32Array} chunk - Audio data chunk
 * @param {number} sampleRate - Sample rate of the audio
 * @returns {AudioBuffer} - A new AudioBuffer containing the chunk data
 */
export const createAudioBufferFromChunk = (chunk: Float32Array, sampleRate: number): AudioBuffer => {
  const audioContext = new AudioContext();
  const chunkBuffer = audioContext.createBuffer(1, chunk.length, sampleRate);
  chunkBuffer.getChannelData(0).set(chunk);
  return chunkBuffer;
};
