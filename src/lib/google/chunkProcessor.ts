
/**
 * Handles processing of audio chunks for batch transcription
 */
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { transcribeSingleFile } from './singleFileProcessor';
import { float32ArrayToWav } from '../audio';

/**
 * Process a batch of chunks with memory-efficient approach
 */
export const processChunks = async (
  audioChunks: Float32Array[],
  sampleRate: number,
  fileName: string,
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void,
  customTerms: string[] = []
) => {
  const results = [];
  
  // Process one chunk at a time to minimize memory usage
  for (let i = 0; i < audioChunks.length; i++) {
    try {
      // Convert chunk to WAV blob
      const wavBlob = float32ArrayToWav(audioChunks[i], sampleRate);
      
      // Create file from blob
      const chunkFile = new File(
        [wavBlob], 
        `${fileName.split('.')[0]}_chunk${i}.wav`, 
        { type: 'audio/wav' }
      );
      
      // Free up the Float32Array memory by removing the reference
      // This allows garbage collection to reclaim the memory
      audioChunks[i] = null;
      
      // Update progress
      onProgress?.(Math.round((i / audioChunks.length) * 100));
      console.log(`Processing chunk ${i+1}/${audioChunks.length}...`);
      
      // Process this chunk
      const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options, customTerms);
      results.push(chunkResult);
      
      // Small delay to avoid rate limiting and let GC run
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error processing chunk ${i}:`, error);
      // Continue with other chunks even if one fails
    }
  }
  
  // Update final progress
  onProgress?.(100);
  return results;
};

/**
 * Process extremely large files by using a streaming approach
 * This avoids loading the entire file into memory at once
 */
export const processExtremelyLargeFile = async (
  file: File,
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void,
  customTerms: string[] = []
) => {
  try {
    // Rough estimate: 16-bit mono at 16kHz = ~32KB per second
    const BYTES_PER_SECOND = 32 * 1024;
    const estimatedDurationSec = file.size / BYTES_PER_SECOND;
    console.log(`Estimated duration: ${estimatedDurationSec} seconds`);
    
    // Use very small chunks to avoid memory issues
    // For extremely large files, use 5-second chunks
    const chunkDurationSec = 5; 
    const totalChunks = Math.ceil(estimatedDurationSec / chunkDurationSec);
    console.log(`Will process in ${totalChunks} ${chunkDurationSec}-second chunks`);
    
    // Process the file in direct slices 
    const results = [];
    const chunkSize = BYTES_PER_SECOND * chunkDurationSec;
    
    for (let i = 0; i < totalChunks; i++) {
      try {
        // Update progress
        onProgress?.(Math.round((i / totalChunks) * 100));
        console.log(`Processing chunk ${i+1}/${totalChunks}...`);
        
        // Take a slice of the file
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end, file.type);
        
        // Create a chunk file
        const chunkFile = new File(
          [chunkBlob], 
          `${file.name.split('.')[0]}_chunk${i}.${file.name.split('.').pop()}`, 
          { type: file.type }
        );
        
        // Transcribe this chunk
        const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options, customTerms);
        results.push(chunkResult);
        
        // Small delay to avoid rate limiting and allow garbage collection
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing chunk ${i+1}:`, error);
        // Continue with other chunks even if one fails
      }
    }
    
    // Update final progress
    onProgress?.(100);
    return results;
  } catch (error) {
    console.error('Extremely large file processing error:', error);
    throw error;
  }
};
