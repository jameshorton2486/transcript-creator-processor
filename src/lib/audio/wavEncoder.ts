
// Functions for WAV encoding/decoding

/**
 * Convert a Float32Array to a WAV file blob
 * This is used for processing audio chunks
 */
export function float32ArrayToWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);               // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);                // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true);                // NumChannels (1 for mono)
  view.setUint32(24, sampleRate, true);       // SampleRate
  view.setUint32(28, sampleRate * 2, true);   // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true);                // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true);               // BitsPerSample (16 bits)
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  
  // Write audio data
  floatTo16BitPCM(view, 44, samples);
  
  return new Blob([buffer], { type: 'audio/wav' });
}

// Helper function to write a string to a DataView
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Helper function to convert Float32 samples to 16-bit PCM
function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array): void {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}
