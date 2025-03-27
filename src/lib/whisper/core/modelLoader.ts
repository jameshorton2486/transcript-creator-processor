import * as ort from 'onnxruntime-web';
import { HfInference } from '@huggingface/inference';
import { env, pipeline } from '@huggingface/transformers';

interface ModelInfo {
  id: string;
  name: string;
  size: string;
}

// Set up the environment for Transformers.js
const setupEnvironment = async () => {
  try {
    // For browser environment
    if (typeof window !== 'undefined') {
      env.useBrowserCache = true;
      env.allowLocalModels = true;
      
      // If the environment has a check cache method (newer versions)
      if (typeof env.checkCache === 'function') {
        await env.checkCache();
      }
    }
  } catch (error) {
    console.error('Error setting up Transformers.js environment:', error);
  }
};

// Define available models with their corresponding data
export const AVAILABLE_MODELS: ModelInfo[] = [
  { id: 'tiny', name: 'Whisper Tiny', size: '75MB' },
  { id: 'base', name: 'Whisper Base', size: '142MB' },
  { id: 'small', name: 'Whisper Small', size: '466MB' },
];

// Global variable to keep track of model loading state
let modelLoadingState: {
  [key: string]: { 
    isLoading: boolean; 
    isLoaded: boolean; 
    error: Error | null;
    pipeline: any | null;
  }
} = {};

AVAILABLE_MODELS.forEach(model => {
  modelLoadingState[model.id] = {
    isLoading: false,
    isLoaded: false,
    error: null,
    pipeline: null
  };
});

// Initialize Transformers.js
export const initTransformers = async () => {
  try {
    await setupEnvironment();
    console.log('Transformers.js environment initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Transformers.js:', error);
    return false;
  }
};

// Check if all required capabilities are available
export const checkDeviceCapabilities = () => {
  // Check for browser environment
  if (typeof window === 'undefined') {
    return {
      supported: false,
      reason: 'Browser environment is required'
    };
  }

  // Check for WebAssembly
  if (typeof WebAssembly === 'undefined') {
    return {
      supported: false,
      reason: 'WebAssembly is not supported in this browser'
    };
  }

  // Check for SharedArrayBuffer (needed for multithreading)
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

  // Check for required APIs
  const hasRequiredAPIs = 
    typeof navigator !== 'undefined' && 
    'mediaDevices' in navigator;

  // Check for Web Audio API
  const hasAudioAPI = typeof AudioContext !== 'undefined' || 
                      typeof (window as any).webkitAudioContext !== 'undefined';

  // If missing some features but has basic support
  if (!hasSharedArrayBuffer || !hasAudioAPI) {
    return {
      supported: true,
      limited: true,
      reason: !hasSharedArrayBuffer 
        ? 'Limited: Missing SharedArrayBuffer support (slower processing)' 
        : 'Limited: Missing Web Audio API support'
    };
  }

  // All good
  return {
    supported: true,
    limited: false
  };
};

// Load a specific Whisper model
export const loadWhisperModel = async (modelId: string) => {
  if (!modelId || !modelLoadingState[modelId]) {
    throw new Error(`Invalid model ID: ${modelId}`);
  }

  // If already loaded, return the loaded status
  if (modelLoadingState[modelId].isLoaded && modelLoadingState[modelId].pipeline) {
    return {
      loaded: true,
      model: modelLoadingState[modelId].pipeline
    };
  }

  // If already loading, wait for it
  if (modelLoadingState[modelId].isLoading) {
    console.log(`Model ${modelId} is already loading, waiting...`);
    // In a real implementation, we would return a promise that resolves when loading completes
    // For now, we'll just wait a bit and then recheck
    await new Promise(resolve => setTimeout(resolve, 500));
    return loadWhisperModel(modelId);
  }

  try {
    // Set loading state
    modelLoadingState[modelId] = {
      ...modelLoadingState[modelId],
      isLoading: true,
      error: null
    };

    // Determine which model variant to load based on the modelId
    let modelIdentifier;
    switch (modelId) {
      case 'tiny':
        modelIdentifier = 'openai/whisper-tiny';
        break;
      case 'base':
        modelIdentifier = 'openai/whisper-base';
        break;
      case 'small':
        modelIdentifier = 'openai/whisper-small';
        break;
      default:
        modelIdentifier = 'openai/whisper-tiny'; // Default to tiny
    }

    console.log(`Loading Whisper model: ${modelIdentifier}`);
    
    // In a real implementation, this would load the model
    // For now we'll simulate the loading
    const loadedPipeline = await simulateModelLoading(modelIdentifier);
    
    // Update loading state
    modelLoadingState[modelId] = {
      isLoading: false,
      isLoaded: true,
      error: null,
      pipeline: loadedPipeline
    };

    return {
      loaded: true,
      model: loadedPipeline
    };
  } catch (error) {
    console.error(`Error loading model ${modelId}:`, error);
    
    // Update error state
    modelLoadingState[modelId] = {
      isLoading: false,
      isLoaded: false,
      error: error instanceof Error ? error : new Error(String(error)),
      pipeline: null
    };
    
    throw error;
  }
};

// For now, we're just simulating model loading
// In a real implementation, this would use the Transformers.js pipeline
const simulateModelLoading = async (modelIdentifier: string) => {
  console.log(`Simulating loading of ${modelIdentifier}...`);
  
  // Simulate loading time based on model size
  const loadingTime = modelIdentifier.includes('tiny') ? 1000 : 
                     modelIdentifier.includes('base') ? 2000 : 4000;
  
  await new Promise(resolve => setTimeout(resolve, loadingTime));
  
  return {
    transcribe: async (audioData: any) => {
      // This is where the real model would transcribe audio
      console.log('Simulating transcription with model:', modelIdentifier);
      return {
        text: "This is a simulated transcription result. In a real implementation, this would be the actual transcribed text from the audio.",
        chunks: []
      };
    }
  };
};

// Get the loading status of all models
export const getModelLoadingStatus = () => {
  return Object.entries(modelLoadingState).map(([id, state]) => ({
    id,
    isLoading: state.isLoading,
    isLoaded: state.isLoaded,
    hasError: !!state.error,
    errorMessage: state.error ? state.error.message : null
  }));
};

// Check if a specific model is available (loaded or can be loaded)
export const isModelAvailable = (modelId: string) => {
  if (!modelId || !modelLoadingState[modelId]) {
    return false;
  }
  
  // Check if device capabilities support running the model
  const capabilities = checkDeviceCapabilities();
  if (!capabilities.supported) {
    return false;
  }
  
  // If it's already loaded or loading
  if (modelLoadingState[modelId].isLoaded || modelLoadingState[modelId].isLoading) {
    return true;
  }
  
  // Otherwise, check if it's one of the available models
  return AVAILABLE_MODELS.some(model => model.id === modelId);
};
