
/**
 * Splits an AudioBuffer into smaller chunks of specified duration
 */
export const splitAudioBuffer = (
  buffer: AudioBuffer, 
  maxChunkDurationSec: number = 60
): Float32Array[] => {
  const chunks: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const samplesPerChunk = maxChunkDurationSec * sampleRate;
  const totalSamples = buffer.length;
  
  // Use the first channel for mono processing
  const audioData = buffer.getChannelData(0);
  
  // Split the audio data into chunks
  for (let i = 0; i < totalSamples; i += samplesPerChunk) {
    const chunkLength = Math.min(samplesPerChunk, totalSamples - i);
    const chunk = new Float32Array(chunkLength);
    
    // Copy data to the chunk
    for (let j = 0; j < chunkLength; j++) {
      chunk[j] = audioData[i + j];
    }
    
    chunks.push(chunk);
  }
  
  return chunks;
};

/**
 * Creates File objects from audio chunks for API upload
 */
export const createChunkFiles = (
  chunks: Blob[],
  originalFilename: string
): File[] => {
  return chunks.map((chunk, index) => {
    const name = `${originalFilename.split('.')[0]}_part${index + 1}.wav`;
    return new File([chunk], name, { type: 'audio/wav' });
  });
};
