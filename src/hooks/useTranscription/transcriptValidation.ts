
/**
 * Utilities for validating transcription results
 */

/**
 * Checks if a transcription result is valid
 * 
 * @param result The transcription result to validate
 * @returns Boolean indicating if the result is valid
 */
export const isValidTranscriptionResult = (result: any): boolean => {
  // Check if result exists
  if (!result) return false;
  
  // Check for transcript text formats
  const hasTranscript = 
    (result.text && typeof result.text === 'string') || 
    (result.transcript && typeof result.transcript === 'string') ||
    (result.results?.transcripts?.[0]?.transcript && typeof result.results.transcripts[0].transcript === 'string');
  
  return hasTranscript;
};

/**
 * Extracts text from a transcription result
 * 
 * @param result The transcription result
 * @returns The extracted text or null if not found
 */
export const extractTranscriptText = (result: any): string | null => {
  if (!result) return null;
  
  // Handle different result formats
  if (result.text && typeof result.text === 'string') {
    return result.text;
  }
  
  if (result.transcript && typeof result.transcript === 'string') {
    return result.transcript;
  }
  
  if (result.results?.transcripts?.[0]?.transcript) {
    return result.results.transcripts[0].transcript;
  }
  
  return null;
};

/**
 * Formats result for display
 */
export const formatTranscriptionForDisplay = (result: any): string => {
  const text = extractTranscriptText(result);
  return text || "No transcript available";
};
