
// This file exports all audio processing utilities from smaller modules

export * from "./audioContext";
export * from "./wavConverter";

// Export from sizeCalculator but not audioSplitter's version
export { 
  estimateWavFileSize, 
  calculateOptimalChunkDuration, 
  MAX_BATCH_SIZE_BYTES 
} from "./sizeCalculator";

// Export from audioSplitter but avoid the naming conflict
import { splitAudioIntoChunks, splitAudioBuffer } from "./audioSplitter";
export { splitAudioIntoChunks, splitAudioBuffer };

// Standardize sample rate for all Google Speech operations
export const STANDARD_SAMPLE_RATE = 16000;
