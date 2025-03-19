
// This file exports all audio processing utilities from smaller modules

export * from "./audioContext";
export * from "./wavConverter";
export * from "./preprocessor";

// Export from sizeCalculator but not audioSplitter's version
export { 
  estimateWavFileSize, 
  calculateOptimalChunkDuration, 
  MAX_BATCH_SIZE_BYTES 
} from "./sizeCalculator";

// Export from audioSplitter but avoid the naming conflict
import { splitAudioIntoChunks, splitAudioBuffer } from "./audioSplitter";
export { splitAudioIntoChunks, splitAudioBuffer };

// Import and export resampling and audio channel conversion utilities from audioResampler
import { 
  resampleAudio, 
  detectSampleRate, 
  convertToMono,
  analyzeAudioFile
} from './audioResampler';

export { 
  resampleAudio, 
  detectSampleRate, 
  convertToMono,
  analyzeAudioFile
};

// Standardize sample rate for all Google Speech operations
export const STANDARD_SAMPLE_RATE = 16000;

// Utility function to check if an audio file needs resampling
export const needsResampling = async (buffer: ArrayBuffer): Promise<boolean> => {
  const detectedRate = await detectSampleRate(buffer);
  return detectedRate !== STANDARD_SAMPLE_RATE && detectedRate > 0;
};

// Utility function to ensure audio is properly formatted for Google Speech API
export const ensureProperAudioFormat = async (buffer: ArrayBuffer): Promise<{
  audioBuffer: ArrayBuffer;
  sampleRate: number;
  wasResampled: boolean;
  wasConverted: boolean;
}> => {
  // First, analyze the audio to get current properties
  const audioInfo = await analyzeAudioFile(buffer);
  
  // Check if we need to resample or convert channels
  const needsConversion = audioInfo.numberOfChannels > 1; // Needs mono conversion
  const needsResample = audioInfo.sampleRate !== STANDARD_SAMPLE_RATE;
  
  if (!needsConversion && !needsResample) {
    // Already in correct format
    return {
      audioBuffer: buffer,
      sampleRate: audioInfo.sampleRate,
      wasResampled: false, 
      wasConverted: false
    };
  }
  
  // Process the audio
  console.log(`[AUDIO FORMAT] Converting audio: channels=${audioInfo.numberOfChannels}, rate=${audioInfo.sampleRate}Hz → mono, ${STANDARD_SAMPLE_RATE}Hz`);
  const { resampled } = await resampleAudio(buffer, STANDARD_SAMPLE_RATE);
  
  return {
    audioBuffer: resampled,
    sampleRate: STANDARD_SAMPLE_RATE,
    wasResampled: needsResample,
    wasConverted: needsConversion
  };
};
