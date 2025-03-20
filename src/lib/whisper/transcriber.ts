
/**
 * Client-side transcription using Whisper.js via the Hugging Face Transformers.js library
 */
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to use cache and allow local models
env.useBrowserCache = true;
env.allowLocalModels = false;

// Model options - smaller models are faster but less accurate
const WHISPER_MODELS = {
  tiny: 'onnx-community/whisper-tiny.en',   // ~150MB, fastest but least accurate
  base: 'onnx-community/whisper-base.en',   // ~290MB, good balance
  small: 'onnx-community/whisper-small.en', // ~970MB, more accurate but slower
};

// Default model to use
const DEFAULT_MODEL = WHISPER_MODELS.tiny;

// Interface for transcription options
export interface WhisperTranscriptionOptions {
  model?: string;
  language?: string;
  taskType?: 'transcribe' | 'translate';
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

// Status messages for loading the model
export type ModelStatus = 'not-loaded' | 'loading' | 'loaded' | 'failed';

// Track model loading status globally
let modelStatus: ModelStatus = 'not-loaded';
let transcriber: any = null;
let loadingPromise: Promise<any> | null = null;

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
            const progressPercent = Math.round((progressInfo?.progress || 0) * 90);
            onProgress?.(5 + progressPercent);
            console.log(`[WHISPER] Model loading progress: ${progressPercent}%`);
          },
          revision: 'main',
          quantized: true, // Use quantized model for smaller size
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
 * Transcribes an audio file using Whisper.js
 */
export const transcribeAudio = async (
  file: File,
  options: WhisperTranscriptionOptions = {}
): Promise<any> => {
  try {
    const {
      model = DEFAULT_MODEL,
      language = 'en',
      taskType = 'transcribe',
      onProgress = () => {},
      abortSignal
    } = options;
    
    console.log(`[WHISPER] Starting transcription for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    onProgress(0);
    
    // Load the model (or reuse existing)
    const loadingProgress = (progress: number) => onProgress(progress * 0.4); // 40% of progress for model loading
    const whisperModel = await loadWhisperModel(model, loadingProgress);
    
    onProgress(40); // Model loaded at 40%
    
    // Check if operation was aborted during model loading
    if (abortSignal?.aborted) {
      throw new Error('Transcription cancelled');
    }
    
    // Create a signal to handle timeouts and cancellation
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Merge with the provided signal if any
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort());
    }
    
    // Set a timeout (10 minutes) for large files
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10 * 60 * 1000);
    
    try {
      onProgress(50); // Started transcription at 50%
      
      console.log('[WHISPER] Processing audio...');
      
      // Transcribe the audio file
      const result = await whisperModel(file, {
        language: language,
        task: taskType,
        chunk_length_s: 30, // Process in 30-second chunks
        stride_length_s: 5, // 5-second overlap for better continuity
        return_timestamps: true, // Get word timestamps
        callback_function: (progressInfo: any) => {
          const percent = 50 + Math.round((progressInfo?.progress || 0) * 50);
          onProgress(percent);
          console.log(`[WHISPER] Transcription progress: ${percent}%`);
        },
        signal: signal,
      });
      
      onProgress(100);
      console.log('[WHISPER] Transcription complete:', result);
      
      // Format result to match expected structure for the app
      return formatTranscriptionResult(result, file.name);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('[WHISPER] Transcription error:', error);
    
    // Rethrow with a user-friendly message
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('abort') || errorMessage.includes('cancel')) {
      throw new Error('Transcription was cancelled');
    } else {
      throw new Error(`Failed to transcribe audio: ${errorMessage}`);
    }
  }
};

/**
 * Converts Whisper output format to match the expected format used by the rest of the app
 */
const formatTranscriptionResult = (whisperResult: any, fileName: string): any => {
  // Extract the main text
  const transcript = whisperResult.text || '';
  
  // Get the words with timestamps if available
  const words = whisperResult.chunks || [];
  
  // Format to match the structure expected by the app
  return {
    results: {
      transcripts: [{ transcript, confidence: 0.9 }],
      channels: [{
        alternatives: [{ transcript, confidence: 0.9 }]
      }],
    },
    metadata: {
      fileName,
      modelUsed: 'whisper',
      words: words.map((chunk: any) => ({
        word: chunk.text,
        startTime: chunk.timestamp[0],
        endTime: chunk.timestamp[1],
        confidence: 0.9
      }))
    },
    isWhisper: true // Flag to indicate this came from Whisper
  };
};

/**
 * Gets a list of available models
 */
export const getAvailableModels = () => {
  return Object.entries(WHISPER_MODELS).map(([name, id]) => ({
    name: `Whisper ${name}`,
    id,
    size: name === 'tiny' ? 'Smallest (150MB)' : 
          name === 'base' ? 'Medium (290MB)' : 
          'Largest (970MB)'
  }));
};

/**
 * Determines the best device to use for inference
 */
const determineOptimalDevice = async (): Promise<'cpu' | 'webgpu'> => {
  // Check for WebGPU support (fastest)
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    try {
      // @ts-ignore - TypeScript doesn't know about navigator.gpu yet
      const adapter = await navigator.gpu?.requestAdapter();
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

// Preload the model when this module is imported
preloadWhisperModel();
