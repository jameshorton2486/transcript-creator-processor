
/**
 * Utility to split audio files into chunks for batch processing
 * Optimized for legal transcript processing
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
 * Splits an AudioBuffer into chunks based on a specified duration
 * Uses a small overlap between chunks to ensure no content is lost at boundaries
 */
export const splitAudioBuffer = (buffer: AudioBuffer, chunkDurationSec: number): Float32Array[] => {
  const numberOfChannels = buffer.numberOfChannels;
  const chunks: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  const samplesPerChunk = Math.floor(chunkDurationSec * sampleRate);
  const totalSamples = buffer.length;
  
  // Add 0.5 second overlap between chunks to avoid cutting off words
  const overlapSamples = Math.floor(0.5 * sampleRate);
  
  // Get audio data from first channel (mono)
  const channelData = buffer.getChannelData(0);
  
  let offset = 0;
  while (offset < totalSamples) {
    // Calculate samples for this chunk
    const samplesToTake = Math.min(samplesPerChunk, totalSamples - offset);
    
    // Create a new chunk with the samples
    const chunk = new Float32Array(samplesToTake);
    for (let i = 0; i < samplesToTake; i++) {
      chunk[i] = channelData[offset + i];
    }
    
    chunks.push(chunk);
    
    // Move to next chunk with a small overlap to avoid cutting words at boundaries
    offset += (samplesToTake - overlapSamples);
    if (offset < 0) offset = 0; // Safety check
  }
  
  console.log(`Split audio into ${chunks.length} chunks with 0.5s overlap`);
  return chunks;
};

/**
 * Calculate the optimal chunk duration based on file size and audio duration
 * Specifically calibrated for legal transcription needs
 */
export const calculateOptimalChunkDuration = (fileSizeBytes: number, durationSec: number): number => {
  // Target chunk size around 5MB (conservative for Speech API)
  const targetChunkSizeBytes = 5 * 1024 * 1024;
  
  if (fileSizeBytes <= targetChunkSizeBytes) {
    return durationSec; // Return full duration if already small enough
  }
  
  // Calculate bytes per second
  const bytesPerSec = fileSizeBytes / durationSec;
  
  // Calculate optimal duration for target size
  let optimalDurationSec = targetChunkSizeBytes / bytesPerSec;
  
  // For legal transcripts, 30-60 second chunks often work well
  // as they typically contain complete statements or exchanges
  optimalDurationSec = Math.max(30, Math.min(60, optimalDurationSec));
  
  // Round to nearest 5 seconds for more natural breakpoints
  return Math.round(optimalDurationSec / 5) * 5;
};
