
import { DEFAULT_TRANSCRIPTION_OPTIONS, TranscriptionOptions } from '../config';
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
  options: TranscriptionOptions = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void,
  customTerms: string[] = []
) => {
  const results = [];
  let successfulChunks = 0;
  
  console.log(`[BATCH] Processing ${audioChunks.length} audio chunks with sample rate ${sampleRate}Hz`);
  
  // Process one chunk at a time to minimize memory usage
  for (let i = 0; i < audioChunks.length; i++) {
    try {
      // Verify chunk has data
      if (!audioChunks[i] || audioChunks[i].length === 0) {
        console.warn(`[BATCH] Chunk ${i+1}/${audioChunks.length} is empty, skipping`);
        continue;
      }
      
      // Convert chunk to WAV blob with explicit sample rate
      const wavBlob = float32ArrayToWav(audioChunks[i], sampleRate);
      
      // Verify WAV blob
      if (!wavBlob || wavBlob.size === 0) {
        console.error(`[BATCH] Failed to create WAV blob for chunk ${i+1}/${audioChunks.length}`);
        continue;
      }
      
      console.log(`[BATCH] Created WAV blob for chunk ${i+1}/${audioChunks.length}: ${(wavBlob.size / 1024).toFixed(1)}KB`);
      
      // Create file from blob with descriptive name
      const chunkFile = new File(
        [wavBlob], 
        `${fileName.split('.')[0]}_chunk${i+1}.wav`, 
        { type: 'audio/wav' }
      );
      
      // Update progress
      onProgress?.(Math.round((i / audioChunks.length) * 100));
      console.log(`[BATCH] Processing chunk ${i+1}/${audioChunks.length}...`);
      
      // Create a merged options object with the correct sample rate for the chunk
      // Make sure to use proper type casting to avoid TypeScript errors
      const mergedOptions = { 
        ...options,
        sampleRateHertz: sampleRate  // Pass the actual sample rate used when creating the WAV
      } as TranscriptionOptions;
      
      if (customTerms.length > 0) {
        mergedOptions.customTerms = customTerms;
      }
      
      // Process this chunk with explicit error handling
      console.log(`[BATCH] Sending chunk ${i+1} to transcribeSingleFile with sample rate ${sampleRate}Hz`);
      const chunkResult = await transcribeSingleFile(chunkFile, apiKey, mergedOptions);
      
      // If we get here, the chunk was processed successfully
      successfulChunks++;
      results.push(chunkResult);
      
      // Free up the Float32Array memory by removing the reference
      // This allows garbage collection to reclaim the memory
      audioChunks[i] = null;
      
      // Small delay to avoid rate limiting and let GC run
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[BATCH] Error processing chunk ${i+1}/${audioChunks.length}:`, error);
      // Continue with other chunks even if one fails
    }
  }
  
  // Check if any chunks were successful
  if (successfulChunks === 0 && audioChunks.length > 0) {
    throw new Error("All audio segments failed to process. This often indicates an issue with the audio format or quality.");
  }
  
  // Update final progress
  onProgress?.(100);
  console.log(`[BATCH] Completed processing ${successfulChunks}/${audioChunks.length} chunks successfully`);
  
  return results;
};

/**
 * Process extremely large files by using a streaming approach
 * This avoids loading the entire file into memory at once
 */
export const processExtremelyLargeFile = async (
  file: File,
  apiKey: string,
  options: TranscriptionOptions = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void,
  customTerms: string[] = []
) => {
  try {
    // Rough estimate: 16-bit mono at 16kHz = ~32KB per second
    const BYTES_PER_SECOND = 32 * 1024;
    const estimatedDurationSec = file.size / BYTES_PER_SECOND;
    console.log(`[LARGE] Estimated duration: ${estimatedDurationSec.toFixed(1)} seconds (${(file.size / (1024 * 1024)).toFixed(2)}MB file)`);
    
    // Use very small chunks to avoid memory issues and API limits
    // For extremely large files, use 5-second chunks (well below Google's limits)
    const chunkDurationSec = 5; 
    const totalChunks = Math.ceil(estimatedDurationSec / chunkDurationSec);
    console.log(`[LARGE] Will process in ${totalChunks} ${chunkDurationSec}-second chunks`);
    
    // Process the file in direct slices 
    const results = [];
    const chunkSize = BYTES_PER_SECOND * chunkDurationSec;
    let successfulChunks = 0;
    
    for (let i = 0; i < totalChunks; i++) {
      try {
        // Update progress
        onProgress?.(Math.round((i / totalChunks) * 100));
        console.log(`[LARGE] Processing chunk ${i+1}/${totalChunks}...`);
        
        // Take a slice of the file
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end, file.type);
        
        // Verify slice is valid
        if (chunkBlob.size === 0) {
          console.warn(`[LARGE] Chunk ${i+1}/${totalChunks} is empty, skipping`);
          continue;
        }
        
        // Create a chunk file with descriptive name
        const chunkFile = new File(
          [chunkBlob], 
          `${file.name.split('.')[0]}_large_chunk${i+1}.${file.name.split('.').pop()}`, 
          { type: file.type }
        );
        
        console.log(`[LARGE] Created chunk file ${i+1}/${totalChunks}: ${(chunkBlob.size / 1024).toFixed(1)}KB`);
        
        // Transcribe this chunk with full error logging
        const mergedOptions = { 
          ...options,
          // Don't set sampleRateHertz and let Google detect it for direct file slices
        } as TranscriptionOptions;
        
        if (customTerms.length > 0) {
          mergedOptions.customTerms = customTerms;
        }
        
        const chunkResult = await transcribeSingleFile(chunkFile, apiKey, mergedOptions);
        successfulChunks++;
        results.push(chunkResult);
        
        // Small delay to avoid rate limiting and allow garbage collection
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[LARGE] Error processing large file chunk ${i+1}/${totalChunks}:`, error);
        // Continue with other chunks even if one fails
      }
    }
    
    // Check if any chunks were successful
    if (successfulChunks === 0 && totalChunks > 0) {
      throw new Error("All audio segments failed to process. This often indicates an issue with the audio format or quality.");
    }
    
    // Update final progress
    onProgress?.(100);
    console.log(`[LARGE] Completed processing ${successfulChunks}/${totalChunks} large chunks successfully`);
    
    return results;
  } catch (error) {
    console.error('[LARGE] Extremely large file processing error:', error);
    throw error;
  }
};
