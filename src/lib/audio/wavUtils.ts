
/**
 * WAV format utilities and helper functions
 */

/**
 * Ensure audio buffer is mono by averaging channels if needed
 */
export const convertToMono = (audioBuffer: AudioBuffer): AudioBuffer => {
  // If already mono, just return it
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer;
  }
  
  console.log(`[CONVERT] Converting ${audioBuffer.numberOfChannels} channels to mono`);
  
  // Create a new offline audio context
  const offlineContext = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  
  // Create a new AudioBuffer (mono)
  const monoBuffer = offlineContext.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
  const monoChannelData = monoBuffer.getChannelData(0);
  
  // Mix down all channels to mono
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0;
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      sum += audioBuffer.getChannelData(channel)[i];
    }
    monoChannelData[i] = sum / audioBuffer.numberOfChannels;
  }
  
  return monoBuffer;
};

/**
 * Converts a Float32Array to WAV format as a Blob
 * Primarily used for converting audio buffer chunks to WAV format
 */
export const float32ArrayToWav = (audioData: Float32Array, sampleRate: number): Blob => {
  try {
    // Create WAV header and file
    const dataLength = audioData.length * 2; // 16-bit samples = 2 bytes per sample
    const totalLength = 44 + dataLength;
    
    // Create buffer and view for WAV file
    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);
    
    // Write WAV header
    // "RIFF" chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true); // Mono channel (1)
    view.setUint16(22, 1, true); // Mono = 1 channel
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate (sampleRate * 1 channel * 2 bytes per sample)
    view.setUint16(32, 2, true); // Block align (1 channel * 2 bytes per sample)
    view.setUint16(34, 16, true); // Bits per sample
    
    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data (convert Float32 to Int16)
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      // Clamp value between -1 and 1
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      // Convert to 16-bit signed integer
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, value, true);
      offset += 2;
    }
    
    // Create Blob with WAV file
    return new Blob([buffer], { type: 'audio/wav' });
  } catch (error) {
    console.error('[WAV] Error creating WAV from Float32Array:', error);
    throw error;
  }
};

// Helper function to write a string to a DataView
export function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
