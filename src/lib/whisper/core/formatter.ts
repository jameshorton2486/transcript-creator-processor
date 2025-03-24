
/**
 * Converts Whisper output format to match the expected format used by the rest of the app
 */
export const formatTranscriptionResult = (whisperResult: any, fileName: string): any => {
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
export const getAvailableModels = (whisperModels: any) => {
  return Object.entries(whisperModels).map(([name, id]) => ({
    name: `Whisper ${name}`,
    id,
    size: name === 'tiny' ? 'Smallest (150MB)' : 
          name === 'base' ? 'Medium (290MB)' : 
          'Largest (970MB)'
  }));
};
