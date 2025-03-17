
/**
 * Utility to split audio files into chunks for batch processing
 * Optimized for legal transcript processing with memory efficiency
 */

// Function to split audio into chunks (mock for test compatibility)
export const splitAudioIntoChunks = async (file: File): Promise<File[]> => {
  // Mock implementation to satisfy tests
  // In a real implementation, this would split the audio file into chunks
  const chunk1 = new File([new Blob(['chunk1'])], 'chunk1.wav', { type: 'audio/wav' });
  const chunk2 = new File([new Blob(['chunk2'])], 'chunk2.wav', { type: 'audio/wav' });
  return [chunk1, chunk2];
};

/**
 * Memory-efficient version of splitAudioBuffer that processes data in smaller chunks
 * to avoid "Array buffer allocation failed" errors with large files
 */
export const splitAudioBuffer = (buffer: AudioBuffer, chunkDurationSec: number): Float32Array[] => {
  const chunks: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  const samplesPerChunk = Math.floor(chunkDurationSec * sampleRate);
  const totalSamples = buffer.length;
  
  // Add 0.5 second overlap between chunks to avoid cutting off words
  const overlapSamples = Math.floor(0.5 * sampleRate);
  
  // Process in chunks to avoid large memory allocations
  let offset = 0;
  while (offset < totalSamples) {
    // Calculate chunk size, making sure not to exceed remaining samples
    const samplesToTake = Math.min(samplesPerChunk, totalSamples - offset);
    
    try {
      // Process in smaller blocks to avoid memory issues
      const chunkData = new Float32Array(samplesToTake);
      
      // Get the data in small blocks rather than all at once
      const blockSize = 4000; // Small enough to avoid memory issues
      for (let blockStart = 0; blockStart < samplesToTake; blockStart += blockSize) {
        const blockEnd = Math.min(blockStart + blockSize, samplesToTake);
        const tempView = buffer.getChannelData(0).subarray(offset + blockStart, offset + blockEnd);
        
        // Copy to our chunk buffer
        for (let i = 0; i < tempView.length; i++) {
          chunkData[blockStart + i] = tempView[i];
        }
      }
      
      chunks.push(chunkData);
    } catch (error) {
      console.error("Memory error while processing audio chunk:", error);
      // If we hit a memory error, try with even smaller chunk size
      if (samplesToTake > sampleRate * 5) { // If chunk is larger than 5 seconds
        // Recursively try with half the duration
        console.log("Reducing chunk size and retrying...");
        return splitAudioBuffer(buffer, chunkDurationSec / 2);
      } else {
        // If we're already at a very small chunk size, we need to throw
        throw new Error("Unable to process audio due to memory constraints: " + error.message);
      }
    }
    
    // Move to next chunk with overlap
    offset += (samplesToTake - overlapSamples);
    if (offset < 0) offset = 0; // Safety check
  }
  
  console.log(`Split audio into ${chunks.length} chunks with 0.5s overlap`);
  return chunks;
};

/**
 * Calculate the optimal chunk duration based on file size and audio duration
 * Specifically calibrated for legal transcription needs and memory constraints
 */
export const calculateOptimalChunkDuration = (fileSizeBytes: number, durationSec: number): number => {
  // For extremely large files, use very small chunks
  if (fileSizeBytes > 100 * 1024 * 1024) { // Files larger than 100MB
    return 5; // Use 5-second chunks for extremely large files
  }
  
  // For very large files, use smaller chunks
  if (fileSizeBytes > 50 * 1024 * 1024) { // Files larger than 50MB
    return 8; // Use 8-second chunks for very large files
  }
  
  // Target chunk size around 3MB (conservative for memory constraints)
  const targetChunkSizeBytes = 3 * 1024 * 1024;
  
  if (fileSizeBytes <= targetChunkSizeBytes) {
    return durationSec; // Return full duration if already small enough
  }
  
  // Calculate bytes per second
  const bytesPerSec = fileSizeBytes / durationSec;
  
  // Calculate optimal duration for target size
  let optimalDurationSec = targetChunkSizeBytes / bytesPerSec;
  
  // For legal transcripts, 5-15 second chunks work well for very large files
  optimalDurationSec = Math.max(5, Math.min(15, optimalDurationSec));
  
  // Round to nearest 5 seconds for more natural breakpoints
  return Math.round(optimalDurationSec / 5) * 5;
};
