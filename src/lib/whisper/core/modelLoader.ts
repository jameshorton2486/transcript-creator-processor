
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to use cache and allow local models
env.useBrowserCache = true;
env.allowLocalModels = false;

// Model options - smaller models are faster but less accurate
export const WHISPER_MODELS = {
  tiny: 'onnx-community/whisper-tiny.en',   // ~150MB, fastest but least accurate
  base: 'onnx-community/whisper-base.en',   // ~290MB, good balance
  small: 'onnx-community/whisper-small.en', // ~970MB, more accurate but slower
};

// Default model to use
export const DEFAULT_MODEL = WHISPER_MODELS.tiny;

// Status messages for loading the model
export type ModelStatus = 'not-loaded' | 'loading' | 'loaded' | 'failed';

// Track model loading status globally
let modelStatus: ModelStatus = 'not-loaded';
let transcriber: any = null;
let loadingPromise: Promise<any> | null = null;
let modelSizes = {
  [WHISPER_MODELS.tiny]: 150,  // ~150MB
  [WHISPER_MODELS.base]: 290,  // ~290MB
  [WHISPER_MODELS.small]: 970, // ~970MB
};

/**
 * Loads the Whisper model for transcription
 */
export const loadWhisperModel = async (
  modelName: string = DEFAULT_MODEL,
  onProgress?: (progress: number) => void
): Promise<any> => {
  // If the model is already loaded, return it
  if (modelStatus === 'loaded' && transcriber) {
    return transcriber;
  }
  
  // If the model is currently loading, return the existing promise
  if (modelStatus === 'loading' && loadingPromise) {
    return loadingPromise;
  }
  
  // Update status and start loading
  modelStatus = 'loading';
  
  try {
    // Create a loading promise to track the operation
    loadingPromise = (async () => {
      // Provide initial progress update
      onProgress?.(5);
      
      console.log(`[WHISPER] Loading model: ${modelName}`);
      
      // Determine best device to use (WebGPU preferred for speed)
      const device = await determineOptimalDevice();
      console.log(`[WHISPER] Using device: ${device}`);
      
      // Create an ASR pipeline with the specified model
      const whisperTranscriber = await pipeline(
        'automatic-speech-recognition',
        modelName,
        {
          progress_callback: (progressInfo: any) => {
            // Handle progress updates safely with optional chaining
            const progressPercent = Math.round(((progressInfo as any)?.progress || 0) * 90);
            onProgress?.(5 + progressPercent);
            console.log(`[WHISPER] Model loading progress: ${progressPercent}%`);
          },
          revision: 'main',
          device: device,
        }
      );
      
      // Final progress update
      onProgress?.(100);
      console.log('[WHISPER] Model loaded successfully');
      
      return whisperTranscriber;
    })();
    
    // Wait for the model to load
    transcriber = await loadingPromise;
    modelStatus = 'loaded';
    
    return transcriber;
  } catch (error) {
    console.error('[WHISPER] Error loading model:', error);
    modelStatus = 'failed';
    loadingPromise = null;
    throw new Error(`Failed to load Whisper model: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Determines the best device to use for inference
 */
export const determineOptimalDevice = async (): Promise<'cpu' | 'webgpu'> => {
  // Check for WebGPU support (fastest)
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    try {
      // Use type assertion to handle the gpu property
      const adapter = await (navigator as any).gpu?.requestAdapter();
      if (adapter) {
        console.log('[WHISPER] WebGPU support detected');
        return 'webgpu';
      }
    } catch (e) {
      console.warn('[WHISPER] WebGPU available but failed to initialize');
    }
  }
  
  // Fall back to CPU
  console.log('[WHISPER] Falling back to CPU');
  return 'cpu';
};

/**
 * Loads models in the background to speed up first transcription
 */
export const preloadWhisperModel = () => {
  // Load in the background with low priority
  setTimeout(() => {
    loadWhisperModel().catch(e => 
      console.warn('[WHISPER] Background preload failed:', e)
    );
  }, 5000); // Wait 5 seconds after page load before starting
};

/**
 * Checks if a model is available offline (already cached)
 */
export const checkModelAvailability = async (modelName: string = DEFAULT_MODEL): Promise<boolean> => {
  try {
    // Check if the model is cached by the browser
    const isAvailable = await env.checkCache('automatic-speech-recognition', modelName);
    return isAvailable;
  } catch (e) {
    console.warn(`[WHISPER] Error checking model availability: ${e}`);
    return false;
  }
};

/**
 * Gets the current model status
 */
export const getModelStatus = (): ModelStatus => {
  return modelStatus;
};

/**
 * Gets the approximate size of the model in MB
 */
export const getModelSize = (modelName: string): number => {
  return modelSizes[modelName] || 0;
};
