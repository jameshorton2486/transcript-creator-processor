
// Compatibility layer for legacy code
// All functionality has been migrated to AssemblyAI

// Mock function for backward compatibility
export const transcribeAudio = async (): Promise<any> => {
  console.warn('Google Speech-to-Text is no longer supported. Please use AssemblyAI.');
  throw new Error('Google Speech-to-Text has been removed. Please use AssemblyAI transcription instead.');
};

// Mock function for backward compatibility
export const testApiKey = async (): Promise<boolean> => {
  return false;
};

// Mock function for backward compatibility
export const extractTranscriptText = (): string => {
  return '';
};

// Mock function for backward compatibility
export const testSpeechApiAccess = async (): Promise<{isValid: boolean, message: string}> => {
  return {
    isValid: false,
    message: 'Google Speech-to-Text has been removed. Please use AssemblyAI transcription instead.'
  };
};
