
// This file exports all audio processing utilities from smaller modules

export * from "./audioContext";
export * from "./wavConverter";
export * from "./sizeCalculator";

// Export from audioSplitter but avoid the naming conflict
import { splitAudioIntoChunks, splitAudioBuffer } from "./audioSplitter";
export { splitAudioIntoChunks, splitAudioBuffer };

// Use the calculateOptimalChunkDuration from sizeCalculator.ts
// and not the one from audioSplitter.ts
export { MAX_BATCH_SIZE_BYTES } from "./sizeCalculator";
