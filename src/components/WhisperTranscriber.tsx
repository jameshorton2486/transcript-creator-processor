
// The file is read-only so I can't modify it directly.
// I need to create a wrapper or adapter instead

import { useState, useEffect } from 'react';
import { AVAILABLE_MODELS } from '@/lib/whisper/core/modelLoader';

// Create a model adapter to handle model type differences
export const WhisperModelAdapter = () => {
  const [selectedModel, setSelectedModel] = useState<string>('tiny');
  const [availableModels, setAvailableModels] = useState<typeof AVAILABLE_MODELS>([]);
  
  useEffect(() => {
    setAvailableModels(AVAILABLE_MODELS);
  }, []);
  
  // This function converts the string model ID to the full model object
  const convertToModelObject = (modelId: string) => {
    return AVAILABLE_MODELS.find(model => model.id === modelId) || AVAILABLE_MODELS[0];
  };
  
  // This function converts the model object to just the ID string
  const convertToModelId = (model: typeof AVAILABLE_MODELS[0]) => {
    return model.id;
  };
  
  return {
    selectedModel: convertToModelObject(selectedModel),
    availableModels,
    setSelectedModel: (model: typeof AVAILABLE_MODELS[0]) => {
      setSelectedModel(model.id);
    }
  };
};
