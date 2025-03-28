
// Export from audio modules
export * from './audio/formatDetection';
export * from './audio/audioValidation';
export * from './audio/wavConverter';
export * from './audio/flacHandler';
export * from './audio/fileChunker';

// Export from formatters
export * from './formatters/transcriptExtractor';
export * from './formatters/responseFormatter';
export * from './formatters/speakerFormatter';
export * from './formatters/legalFormatter';

// Export from processors
export * from './processor/audioUtils';
export * from './processor/apiRequest';
export * from './processor/operationPoller';
export * from './processor/request/prepareRequest';

// Export from API tester
export { testApiKey, testSpeechApiAccess } from './apiTester';

// Export from single file processor
export * from './singleFileProcessor';

// Export from chunk processor
export * from './chunkProcessor';

// Mock export for transcribeAudio function for compatibility
export const transcribeAudio = async (file: File, apiKey: string, options?: any): Promise<any> => {
  console.warn('Google transcribeAudio is a placeholder and not fully implemented');
  return { text: 'This is a placeholder transcription from Google API' };
};

// Function to extract transcript text from response
export const extractTranscriptText = (response: any): string => {
  if (!response || !response.results) return '';
  
  // Attempt to extract text from standard Google Speech-to-Text response format
  try {
    return response.results
      .map((result: any) => result.alternatives?.[0]?.transcript || '')
      .join(' ')
      .trim();
  } catch (error) {
    console.error('Error extracting transcript text:', error);
    return '';
  }
};
