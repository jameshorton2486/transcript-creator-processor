
// This file exports all audio processing utilities from smaller modules

export * from "./audioContext";
export * from "./wavConverter";
export * from "./base64Converter";
export * from "./wavUtils";
export * from "./formatConversion";
export * from "./wavEncoder";
export * from "./normalization";

// Export from sizeCalculator 
export { 
  estimateWavFileSize, 
  calculateOptimalChunkDuration, 
  MAX_BATCH_SIZE_BYTES 
} from "./sizeCalculator";

// Export from audioSplitter
import { splitAudioIntoChunks, splitAudioBuffer } from "./audioSplitter";
export { splitAudioIntoChunks, splitAudioBuffer };
