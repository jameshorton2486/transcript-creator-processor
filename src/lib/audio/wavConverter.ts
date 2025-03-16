
/**
 * Converts a Float32Array to a WAV file blob
 */
export const float32ArrayToWav = (
  audioData: Float32Array, 
  sampleRate: number = 16000
): Blob => {
  // Create a buffer for the WAV file
  const buffer = new ArrayBuffer(44 + audioData.length * 2);
  const view = new DataView(buffer);

  // Write the WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + audioData.length * 2, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (1 for PCM)
  view.setUint16(22, 1, true); // number of channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, audioData.length * 2, true);
  
  // Write the PCM samples
  const volume = 0.9; // Adjust volume as needed
  let index = 44;
  for (let i = 0; i < audioData.length; i++) {
    // Convert float to int
    const sample = Math.max(-1, Math.min(1, audioData[i])) * volume;
    view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    index += 2;
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
};

// Helper function to write strings to DataView
const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};
