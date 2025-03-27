
import { useState, useEffect } from 'react';
import { AVAILABLE_MODELS, isModelAvailable } from '@/lib/whisper/core/modelLoader';

// This component acts as an adapter between the WhisperTranscriber component
// and our specific model format
export const WhisperModelAdapterWrapper = ({ 
  children 
}: { 
  children: (props: {
    selectedModel: { id: string; name: string; size: string };
    availableModels: { id: string; name: string; size: string }[];
    setSelectedModel: (model: { id: string; name: string; size: string }) => void;
    isModelAvailable: (modelId: string) => boolean;
  }) => React.ReactNode 
}) => {
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [availableModels, setAvailableModels] = useState(AVAILABLE_MODELS);

  // Check which models are available on this device
  useEffect(() => {
    const checkAvailableModels = async () => {
      // Filter models based on device capabilities
      const availableModelsList = AVAILABLE_MODELS.filter(model => 
        isModelAvailable(model.id)
      );
      
      setAvailableModels(availableModelsList.length > 0 ? availableModelsList : AVAILABLE_MODELS);
    };
    
    checkAvailableModels();
  }, []);

  // Render the children with our adapter props
  return (
    <>
      {children({
        selectedModel,
        availableModels,
        setSelectedModel,
        isModelAvailable
      })}
    </>
  );
};
