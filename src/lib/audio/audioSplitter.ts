
/**
 * Audio splitting utilities for chunking large audio files
 */
import { calculateOptimalChunkDuration } from './sizeCalculator';
import { encodeWavFile } from './wavEncoder';
import { createAudioBufferFromChunk } from './audioBufferUtils';

/**
 * Splits an AudioBuffer into multiple shorter chunks based on optimal duration
 * @param {AudioBuffer} audioBuffer - The original audio buffer
 * @param {number} optimalDuration - The optimal duration for each chunk in seconds
 * @returns {Float32Array[]} An array of audio data chunks
 */
export const splitAudioBuffer = (
  audioBuffer: AudioBuffer, 
  optimalDuration: number = 60
): Float32Array[] => {
  try {
    console.log(`[SPLIT] Splitting audio buffer into chunks of ~${optimalDuration}s`);
    
    // Get audio details
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const samplesPerChunk = Math.floor(optimalDuration * sampleRate);
    
    // Log details for debugging
    console.log(`[SPLIT] Audio details: ${numberOfChannels} channels, ${sampleRate}Hz, ${audioBuffer.length} samples (${(audioBuffer.length / sampleRate).toFixed(1)}s)`);
    
    // For now, use only the first channel for mono processing
    // This ensures compatibility with Google Speech API
    const audioData = audioBuffer.getChannelData(0);
    
    // Calculate number of chunks needed
    const numChunks = Math.ceil(audioData.length / samplesPerChunk);
    console.log(`[SPLIT] Creating ${numChunks} chunks`);
    
    // Split the audio data into chunks
    const chunks: Float32Array[] = [];
    
    for (let i = 0; i < numChunks; i++) {
      const start = i * samplesPerChunk;
      const end = Math.min(start + samplesPerChunk, audioData.length);
      const chunkLength = end - start;
      
      // Create new audio chunk from this segment
      const chunk = new Float32Array(chunkLength);
      for (let j = 0; j < chunkLength; j++) {
        chunk[j] = audioData[start + j];
      }
      
      chunks.push(chunk);
      console.log(`[SPLIT] Chunk ${i+1}/${numChunks}: ${(chunkLength / sampleRate).toFixed(1)}s`);
    }
    
    return chunks;
  } catch (error) {
    console.error('[SPLIT] Error splitting audio buffer:', error);
    throw new Error(`Failed to split audio buffer: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Splits audio file into chunks of optimal duration
 * @param {File} file - Audio file to split
 * @returns {Promise<Blob[]>} Array of chunked audio blobs
 */
export const splitAudioIntoChunks = async (
  file: File
): Promise<Blob[]> => {
  try {
    const { determineOptimalChunking, shouldSplitFile } = await import('./chunkingStrategy');
    const { decodeAudioFile } = await import('./audioBufferUtils');

    // Decide if and how to split the file
    const { shouldChunk, optimalDuration } = await determineOptimalChunking(file);
    
    // If the file doesn't need to be split
    if (!shouldChunk) {
      console.log('[SPLIT] File is small enough to process without splitting');
      return [file];
    }
    
    console.log('[SPLIT] Audio needs chunking, decoding audio for splitting...');
    
    try {
      // Decode the audio file
      const audioBuffer = await decodeAudioFile(file);
      
      // Get the split chunks
      console.log(`[SPLIT] Successfully decoded audio, splitting into ~${optimalDuration}s chunks`);
      const audioChunks = splitAudioBuffer(audioBuffer, optimalDuration);
      
      // Convert Float32Array chunks back to blobs
      const audioChunkBlobs: Blob[] = [];
      
      // Process each chunk
      const { processAudioChunk } = await import('./chunkProcessor');
      for (let i = 0; i < audioChunks.length; i++) {
        const blob = await processAudioChunk(audioChunks[i], audioBuffer.sampleRate, i, audioChunks.length);
        audioChunkBlobs.push(blob);
      }
      
      console.log(`[SPLIT] Successfully split audio into ${audioChunkBlobs.length} chunks`);
      return audioChunkBlobs;
    } catch (decodeError) {
      console.warn('[SPLIT] Error decoding audio, returning original file:', decodeError);
      // If we can't decode the audio, return original file
      return [file];
    }
  } catch (error) {
    console.error('[SPLIT] Error in splitAudioIntoChunks:', error);
    // If anything fails, return original file
    return [file];
  }
};
