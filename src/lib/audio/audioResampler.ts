
import { getAudioContext } from './audioContext';

/**
 * Resamples audio data to target sample rate (16000 Hz for Speech-to-Text API)
 * @param {ArrayBuffer} audioBuffer - Original audio buffer
 * @param {number} targetSampleRate - Target sample rate (usually 16000 Hz)
 * @returns {Promise<{resampled: AudioBuffer, sampleRate: number}>} - Resampled audio buffer and its rate
 */
export const resampleAudio = async (
  audioData: ArrayBuffer,
  targetSampleRate: number = 16000
): Promise<{ resampled: ArrayBuffer, sampleRate: number }> => {
  try {
    console.log(`[RESAMPLER] Starting resampling process to ${targetSampleRate} Hz`);
    const audioContext = getAudioContext();
    
    // Decode the audio data
    const decodedAudio = await audioContext.decodeAudioData(audioData.slice(0));
    console.log(`[RESAMPLER] Original sample rate: ${decodedAudio.sampleRate} Hz`);
    
    // If already at target sample rate, return original
    if (decodedAudio.sampleRate === targetSampleRate) {
      console.log(`[RESAMPLER] Audio already at target sample rate (${targetSampleRate} Hz)`);
      return { 
        resampled: audioData,
        sampleRate: targetSampleRate
      };
    }
    
    // Create offline context for resampling
    const offlineContext = new OfflineAudioContext(
      decodedAudio.numberOfChannels,
      decodedAudio.duration * targetSampleRate,
      targetSampleRate
    );
    
    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = decodedAudio;
    source.connect(offlineContext.destination);
    
    // Start source and process
    source.start(0);
    console.log(`[RESAMPLER] Rendering audio at ${targetSampleRate} Hz`);
    
    // Render and return the resampled buffer
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert AudioBuffer to Float32Array
    const channelData = renderedBuffer.getChannelData(0);
    console.log(`[RESAMPLER] Successfully resampled audio to ${targetSampleRate} Hz`);
    
    // Convert Float32Array to WAV format
    const wavArrayBuffer = await convertFloat32ToWav(channelData, targetSampleRate);
    
    return {
      resampled: wavArrayBuffer,
      sampleRate: targetSampleRate
    };
  } catch (error) {
    console.error('[RESAMPLER] Error resampling audio:', error);
    throw new Error(`Failed to resample audio: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Converts Float32Array to WAV format ArrayBuffer
 */
const convertFloat32ToWav = (
  audioData: Float32Array,
  sampleRate: number
): ArrayBuffer => {
  const numChannels = 1; // Mono
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = audioData.length * bytesPerSample;
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, 'WAVE');
  
  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // 16 = PCM format
  view.setUint16(20, 1, true); // 1 = PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  
  // Data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write the PCM samples
  const volume = 1;
  let index = 44;
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i])) * volume;
    const value = Math.floor(sample < 0 ? sample * 32768 : sample * 32767);
    view.setInt16(index, value, true);
    index += 2;
  }
  
  return arrayBuffer;
};

// Helper function to write a string to a DataView
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Detect sample rate from audio file
 */
export const detectSampleRate = async (audioData: ArrayBuffer): Promise<number> => {
  try {
    const audioContext = getAudioContext();
    const decodedAudio = await audioContext.decodeAudioData(audioData.slice(0));
    return decodedAudio.sampleRate;
  } catch (error) {
    console.error('[SAMPLE RATE] Failed to detect sample rate:', error);
    return 0; // Will trigger fallback to 16000 Hz
  }
};
