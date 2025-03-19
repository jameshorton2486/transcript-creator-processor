
// This file exports all audio processing utilities from smaller modules

export * from "./audioContext";
export * from "./base64Converter";
export * from "./formatConversion";
export * from "./normalization";
export * from "./audioBufferUtils";
export * from "./chunkProcessor";
export * from "./chunkingStrategy";

// Export from wavUtils and wavEncoder (avoid duplicate exports)
export { convertToMono, writeString } from './wavUtils';
export { encodeWavFile, float32ArrayToWav } from './wavEncoder';

// Export from sizeCalculator 
export { 
  estimateWavFileSize, 
  calculateOptimalChunkDuration, 
  MAX_BATCH_SIZE_BYTES 
} from "./sizeCalculator";

// Export from audioSplitter
import { splitAudioIntoChunks, splitAudioBuffer } from "./audioSplitter";
export { splitAudioIntoChunks, splitAudioBuffer };
