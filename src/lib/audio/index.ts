
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

// Standardize sample rate for all Google Speech operations
export const STANDARD_SAMPLE_RATE = 16000;
