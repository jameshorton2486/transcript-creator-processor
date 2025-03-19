
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

// Export resampling and audio channel conversion utilities
export { 
  resampleAudio, 
  detectSampleRate, 
  convertToMono,
  analyzeAudioFile
} from './audioResampler';

