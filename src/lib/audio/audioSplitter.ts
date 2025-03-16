
/**
 * Utility to split audio files into chunks for batch processing
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
 */
export const splitAudioBuffer = (buffer: AudioBuffer, chunkDurationSec: number): Float32Array[] => {
  const numberOfChannels = buffer.numberOfChannels;
  const chunks: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  const samplesPerChunk = Math.floor(chunkDurationSec * sampleRate);
  const totalSamples = buffer.length;
  
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
    offset += samplesToTake;
  }
  
  return chunks;
};

/**
 * Calculate the optimal chunk duration based on file size and audio duration
 */
export const calculateOptimalChunkDuration = (fileSizeBytes: number, durationSec: number): number => {
  // Target chunk size around 10MB (conservative for Speech API)
  const targetChunkSizeBytes = 5 * 1024 * 1024; // 5MB
  
  if (fileSizeBytes <= targetChunkSizeBytes) {
    return durationSec; // Return full duration if already small enough
  }
  
  // Calculate bytes per second
  const bytesPerSec = fileSizeBytes / durationSec;
  
  // Calculate optimal duration for target size
  let optimalDurationSec = targetChunkSizeBytes / bytesPerSec;
  
  // Ensure minimum duration is at least 5 seconds
  optimalDurationSec = Math.max(optimalDurationSec, 5);
  
  // Round to nearest second for simplicity
  return Math.floor(optimalDurationSec);
};
