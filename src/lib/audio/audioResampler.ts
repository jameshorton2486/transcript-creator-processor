
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
    console.log(`[RESAMPLER] Original sample rate: ${decodedAudio.sampleRate} Hz, channels: ${decodedAudio.numberOfChannels}`);
    
    // If multi-channel, convert to mono first
    let monoAudio = decodedAudio;
    if (decodedAudio.numberOfChannels > 1) {
      console.log(`[RESAMPLER] Converting ${decodedAudio.numberOfChannels} channels to mono`);
      monoAudio = convertToMono(audioContext, decodedAudio);
    }
    
    // If already at target sample rate and mono, return original
    if (decodedAudio.sampleRate === targetSampleRate && decodedAudio.numberOfChannels === 1) {
      console.log(`[RESAMPLER] Audio already at target sample rate (${targetSampleRate} Hz) and mono`);
      return { 
        resampled: audioData,
        sampleRate: targetSampleRate
      };
    }
    
    // Create offline context for resampling
    const offlineContext = new OfflineAudioContext(
      1, // Always use 1 channel (mono) for Google Speech API
      monoAudio.duration * targetSampleRate,
      targetSampleRate
    );
    
    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = monoAudio;
    source.connect(offlineContext.destination);
    
    // Start source and process
    source.start(0);
    console.log(`[RESAMPLER] Rendering audio at ${targetSampleRate} Hz (mono)`);
    
    // Render and return the resampled buffer
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert AudioBuffer to Float32Array
    const channelData = renderedBuffer.getChannelData(0);
    console.log(`[RESAMPLER] Successfully resampled audio to ${targetSampleRate} Hz (mono)`);
    
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
 * Converts a multi-channel audio buffer to mono
 * @param {AudioContext} audioContext - The audio context
 * @param {AudioBuffer} audioBuffer - The audio buffer to convert
 * @returns {AudioBuffer} - Mono audio buffer
 */
export const convertToMono = (audioContext: AudioContext, audioBuffer: AudioBuffer): AudioBuffer => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  
  // Create a new mono buffer
  const monoBuffer = audioContext.createBuffer(1, length, audioBuffer.sampleRate);
  const monoData = monoBuffer.getChannelData(0);
  
  // Mix down all channels to mono
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let channel = 0; channel < numberOfChannels; channel++) {
      sum += audioBuffer.getChannelData(channel)[i];
    }
    monoData[i] = sum / numberOfChannels;
  }
  
  return monoBuffer;
};

/**
 * Converts Float32Array to WAV format ArrayBuffer
 */
const convertFloat32ToWav = (
  audioData: Float32Array,
  sampleRate: number
): ArrayBuffer => {
  const numChannels = 1; // Always mono for Google Speech API
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
  view.setUint16(22, numChannels, true); // Always mono
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

/**
 * Analyzes audio file properties
 */
export const analyzeAudioFile = async (audioData: ArrayBuffer): Promise<{
  sampleRate: number;
  numberOfChannels: number;
  duration: number;
}> => {
  try {
    const audioContext = getAudioContext();
    const decodedAudio = await audioContext.decodeAudioData(audioData.slice(0));
    
    return {
      sampleRate: decodedAudio.sampleRate,
      numberOfChannels: decodedAudio.numberOfChannels,
      duration: decodedAudio.duration
    };
  } catch (error) {
    console.error('[AUDIO ANALYSIS] Failed to analyze audio:', error);
    throw new Error('Failed to analyze audio file');
  }
};
