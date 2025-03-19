
// This file exports all audio processing utilities from smaller modules

export * from "./audioContext";
export * from "./wavConverter";
export * from "./base64Converter";

// Export from sizeCalculator 
export { 
  estimateWavFileSize, 
  calculateOptimalChunkDuration, 
  MAX_BATCH_SIZE_BYTES 
} from "./sizeCalculator";

// Export from audioSplitter
import { splitAudioIntoChunks, splitAudioBuffer } from "./audioSplitter";
export { splitAudioIntoChunks, splitAudioBuffer };

// Note: We no longer export a standard sample rate constant
// as we want Google Speech API to detect it from the file header
