
/**
 * This file is kept as a stub to avoid import errors.
 * Whisper functionality has been removed in favor of AssemblyAI.
 */

export const AVAILABLE_MODELS = [];

export const initTransformers = async () => {
  console.warn('Whisper functionality has been removed. Using AssemblyAI instead.');
  return false;
};

export const checkDeviceCapabilities = () => {
  return {
    supported: false,
    reason: 'Whisper functionality has been removed. Using AssemblyAI instead.'
  };
};

export const loadWhisperModel = async () => {
  throw new Error('Whisper functionality has been removed. Please use AssemblyAI instead.');
};

export const getModelLoadingStatus = () => {
  return [];
};

export const isModelAvailable = () => {
  return false;
};
