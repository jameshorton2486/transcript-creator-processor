
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

/**
 * Encodes an AudioBuffer to a WAV file blob
 * This is used by various processing modules
 */
export function encodeWavFile(audioBuffer: AudioBuffer): Blob {
  try {
    // Extract raw audio data
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // Create the WAV file container
    const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(buffer);
    
    // Write WAV header
    // "RIFF" chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk1 size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
    view.setUint16(32, numberOfChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    
    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Write interleaved audio data
    const offset = 44;
    
    // Mono channel - optimized path
    if (numberOfChannels === 1) {
      const samples = audioBuffer.getChannelData(0);
      floatTo16BitPCM(view, offset, samples);
    } 
    // Multiple channels - interleave data
    else {
      const dataView = new DataView(buffer, offset);
      let bufferOffset = 0;
      
      // Get all channel data
      const channelData: Float32Array[] = [];
      for (let channel = 0; channel < numberOfChannels; channel++) {
        channelData.push(audioBuffer.getChannelData(channel));
      }
      
      // Interleave and convert to 16-bit samples
      for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
          const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          dataView.setInt16(bufferOffset, value, true);
          bufferOffset += 2;
        }
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  } catch (error) {
    console.error('[ENCODE] Error encoding WAV file:', error);
    throw error;
  }
}

// Helper function to write a string to a DataView
export function writeString(view: DataView, offset: number, string: string): void {
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
