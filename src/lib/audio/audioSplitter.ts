/**
 * Audio splitting utilities for chunking large audio files
 */
import { calculateOptimalChunkDuration } from './sizeCalculator';
import { encodeWavFile } from './wavEncoder';

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
 * @param {ArrayBuffer} audioData - Raw audio data as ArrayBuffer
 * @param {string} fileType - The MIME type of the audio file
 * @returns {Promise<Blob[]>} Array of chunked audio blobs
 */
export const splitAudioIntoChunks = async (
  file: File
): Promise<Blob[]> => {
  try {
    // Calculate optimal chunk duration based on file size
    const fileSizeMB = file.size / (1024 * 1024);
    console.log(`[SPLIT] Processing file: ${file.name}, Size: ${fileSizeMB.toFixed(2)} MB`);
    
    // For small files (less than 1MB), process in a single chunk
    if (fileSizeMB < 1) {
      console.log('[SPLIT] File is small, no splitting needed');
      return [file];
    }
    
    // Determine optimal chunk duration based on file size
    const optimalDuration = calculateOptimalChunkDuration(file.size);
    console.log(`[SPLIT] Calculated optimal chunk duration: ${optimalDuration}s`);
    
    // If the file is small enough to process directly, don't bother chunking
    if (optimalDuration >= 500) {
      console.log('[SPLIT] File is small enough to process without splitting');
      return [file];
    }
    
    // For audio formats we can't decode easily, return the original file
    if (!/^(audio|video)/.test(file.type) && !file.name.match(/\.(wav|mp3|flac|ogg|m4a|webm)$/i)) {
      console.log('[SPLIT] Unsupported format for browser audio decoding, returning original file');
      return [file];
    }
    
    console.log('[SPLIT] Audio needs chunking, decoding audio for splitting...');
    
    // We need to analyze the file to split it correctly
    try {
      // Create audio context
      const audioContext = new AudioContext();
      
      // Get array buffer from file
      const arrayBuffer = await file.arrayBuffer();
      
      // Try to decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        .catch(err => {
          console.warn('[SPLIT] Browser cannot decode this audio format:', err);
          throw new Error('Browser cannot decode this audio format');
        });
      
      // Get the split chunks
      console.log(`[SPLIT] Successfully decoded audio, splitting into ~${optimalDuration}s chunks`);
      const audioChunks = splitAudioBuffer(audioBuffer, optimalDuration);
      
      // Convert Float32Array chunks back to blobs
      const audioChunkBlobs: Blob[] = [];
      
      // Use WAV format for chunks for better compatibility
      for (let i = 0; i < audioChunks.length; i++) {
        const chunk = audioChunks[i];
        
        // Create a new AudioBuffer for this chunk
        const chunkBuffer = audioContext.createBuffer(1, chunk.length, audioBuffer.sampleRate);
        chunkBuffer.getChannelData(0).set(chunk);
        
        // Convert to WAV for better compatibility
        const wavBlob = await encodeWavFile(chunkBuffer);
        audioChunkBlobs.push(wavBlob);
        
        console.log(`[SPLIT] Processed chunk ${i+1}/${audioChunks.length}`);
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
