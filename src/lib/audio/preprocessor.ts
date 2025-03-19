
// Function to handle audio preprocessing

import { getAudioContext } from "./audioContext";
import { convertToMono } from "./audioResampler";

/**
 * Normalizes the audio volume to ensure consistent loudness across the file
 * @param audioBuffer The audio buffer to normalize
 * @returns A new audio buffer with normalized volume
 */
export const normalizeAudio = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const audioContext = getAudioContext();
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const normalizedBuffer = audioContext.createBuffer(
    numberOfChannels,
    length,
    audioBuffer.sampleRate
  );

  // Find the peak amplitude across all channels
  let maxPeak = 0;
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const absValue = Math.abs(channelData[i]);
      if (absValue > maxPeak) {
        maxPeak = absValue;
      }
    }
  }

  // Target level for normalization (keep some headroom to avoid clipping)
  const targetLevel = 0.9;
  const gainFactor = maxPeak > 0 ? targetLevel / maxPeak : 1;

  // Apply normalization
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const originalData = audioBuffer.getChannelData(channel);
    const normalizedData = normalizedBuffer.getChannelData(channel);

    for (let i = 0; i < length; i++) {
      normalizedData[i] = originalData[i] * gainFactor;
    }
  }

  return normalizedBuffer;
};

/**
 * Reduces noise in the audio signal using a simple noise gate technique
 * @param audioBuffer The audio buffer to process
 * @param threshold Noise gate threshold (typical values: 0.01-0.05)
 * @returns A new audio buffer with reduced noise
 */
export const reduceNoise = async (audioBuffer: AudioBuffer, threshold = 0.02): Promise<AudioBuffer> => {
  const audioContext = getAudioContext();
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const processedBuffer = audioContext.createBuffer(
    numberOfChannels,
    length,
    audioBuffer.sampleRate
  );

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const originalData = audioBuffer.getChannelData(channel);
    const processedData = processedBuffer.getChannelData(channel);

    // Simple noise gate implementation
    for (let i = 0; i < length; i++) {
      if (Math.abs(originalData[i]) < threshold) {
        // Apply soft transition to avoid harsh cuts
        processedData[i] = originalData[i] * (Math.abs(originalData[i]) / threshold);
      } else {
        processedData[i] = originalData[i];
      }
    }
  }

  return processedBuffer;
};

/**
 * Removes DC offset from the audio signal
 * @param audioBuffer The audio buffer to process
 * @returns A new audio buffer with DC offset removed
 */
export const removeDCOffset = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const audioContext = getAudioContext();
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const processedBuffer = audioContext.createBuffer(
    numberOfChannels,
    length,
    audioBuffer.sampleRate
  );

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const originalData = audioBuffer.getChannelData(channel);
    const processedData = processedBuffer.getChannelData(channel);

    // Calculate the DC offset (mean value of the signal)
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += originalData[i];
    }
    const dcOffset = sum / length;

    // Remove the DC offset
    for (let i = 0; i < length; i++) {
      processedData[i] = originalData[i] - dcOffset;
    }
  }

  return processedBuffer;
};

/**
 * Apply all preprocessing steps to an audio buffer to improve transcription quality
 * @param audioBuffer The audio buffer to process
 * @returns A processed audio buffer ready for transcription
 */
export const preprocessAudio = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const audioContext = getAudioContext();
  
  // 1. Convert to mono if it's not already mono
  let processedBuffer = audioBuffer;
  if (audioBuffer.numberOfChannels > 1) {
    console.log(`[PREPROCESS] Converting ${audioBuffer.numberOfChannels} channels to mono`);
    processedBuffer = convertToMono(audioContext, audioBuffer);
  }
  
  // 2. Remove DC offset
  processedBuffer = await removeDCOffset(processedBuffer);
  
  // 3. Normalize to ensure consistent volume
  processedBuffer = await normalizeAudio(processedBuffer);
  
  // 4. Finally reduce noise
  processedBuffer = await reduceNoise(processedBuffer, 0.015);

  return processedBuffer;
};

/**
 * Preprocess an audio file for improved transcription quality
 * @param file Audio file to preprocess
 * @returns Processed audio as ArrayBuffer
 */
export const preprocessAudioFile = async (file: File): Promise<ArrayBuffer> => {
  const audioContext = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  
  // Analyze input audio
  console.log(`[PREPROCESS] Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log(`[PREPROCESS] File decoded: ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate} Hz, ${audioBuffer.duration.toFixed(2)}s`);
    
    // Apply all preprocessing steps including mono conversion
    const processedBuffer = await preprocessAudio(audioBuffer);
    console.log(`[PREPROCESS] Processing complete: 1 channel, ${processedBuffer.sampleRate} Hz`);
    
    // Convert back to WAV
    const waveBlob = await audioBufferToWav(processedBuffer);
    return await waveBlob.arrayBuffer();
  } catch (error) {
    console.error(`[PREPROCESS] Error processing audio:`, error);
    throw new Error(`Failed to preprocess audio: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Convert an AudioBuffer to WAV format
 * @param audioBuffer The audio buffer to convert
 * @returns A Blob containing WAV data
 */
export const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
  const numOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChannels * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let offset = 0;
  let pos = 0;

  // Extract channels
  for (let i = 0; i < numOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, offset, 'RIFF'); offset += 4;
  view.setUint32(offset, 36 + audioBuffer.length * numOfChannels * 2, true); offset += 4;
  writeString(view, offset, 'WAVE'); offset += 4;

  // "fmt " sub-chunk
  writeString(view, offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4; // 16 for PCM
  view.setUint16(offset, 1, true); offset += 2; // PCM format
  view.setUint16(offset, numOfChannels, true); offset += 2; // Num of channels
  view.setUint32(offset, audioBuffer.sampleRate, true); offset += 4; // Sample rate
  view.setUint32(offset, audioBuffer.sampleRate * 4, true); offset += 4; // Byte rate
  view.setUint16(offset, numOfChannels * 2, true); offset += 2; // Block align
  view.setUint16(offset, 16, true); offset += 2; // Bits per sample

  // "data" sub-chunk
  writeString(view, offset, 'data'); offset += 4;
  view.setUint32(offset, audioBuffer.length * numOfChannels * 2, true); offset += 4;

  // Write interleaved audio data
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      // Convert float32 to int16
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16Sample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};
