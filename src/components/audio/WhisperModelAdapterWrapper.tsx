
import { useState } from 'react';
import { AVAILABLE_MODELS } from '@/lib/whisper/core/modelLoader';

// This component is kept as a minimal adapter to prevent errors
// This functionality has been replaced by AssemblyAI
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
  const [selectedModel] = useState(AVAILABLE_MODELS[0] || { id: 'base', name: 'Base', size: '142MB' });
  
  // Return stub implementation
  return (
    <>
      {children({
        selectedModel,
        availableModels: AVAILABLE_MODELS,
        setSelectedModel: () => console.warn('Whisper functionality has been removed. Using AssemblyAI instead.'),
        isModelAvailable: () => false // This was causing TS2554 - now returns a function with no args
      })}
    </>
  );
};
