
/**
 * WAV encoding utilities
 */
import { writeString } from './wavUtils';

/**
 * Encodes an AudioBuffer to a WAV file
 */
export const encodeWavFile = (audioBuffer: AudioBuffer): Blob => {
  try {
    // Get the number of samples and sample rate
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    
    // Create the WAV file container
    const buffer = new ArrayBuffer(44 + length * 2); // 44 bytes header + 2 bytes per sample
    const view = new DataView(buffer);
    
    // Write WAV header
    // "RIFF" chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk1 size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono - 1 channel
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate (sampleRate * 1 channel * 2 bytes per sample)
    view.setUint16(32, 2, true); // block align (1 channel * 2 bytes per sample)
    view.setUint16(34, 16, true); // bits per sample
    
    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Write audio data
    const dataView = new DataView(buffer, 44);
    const channelData = audioBuffer.getChannelData(0);
    
    // Convert to 16-bit samples
    for (let i = 0; i < length; i++) {
      // Convert float32 (-1 to 1) to int16 (-32768 to 32767)
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      dataView.setInt16(i * 2, value, true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  } catch (error) {
    console.error('[CONVERT] Error encoding WAV file:', error);
    throw error;
  }
};
