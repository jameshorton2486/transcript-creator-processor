
/**
 * Formatter functions for AssemblyAI transcription results
 */

/**
 * Response interface for AssemblyAI transcriptions
 */
export interface AssemblyAITranscriptionResponse {
  id: string;
  status: string;
  text: string;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker?: string;
  }>;
  utterances?: Array<{
    speaker: string;
    text: string;
    start: number;
    end: number;
  }>;
  error?: string;
}

/**
 * Formats the AssemblyAI response to match the expected structure used by the app
 */
export const formatTranscriptionResult = (assemblyResult: AssemblyAITranscriptionResponse, fileName: string): any => {
  // Extract the main text
  const transcript = assemblyResult.text || '';
  
  // Get the words with timestamps
  const words = assemblyResult.words || [];
  
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
      modelUsed: 'assemblyai',
      words: words.map((word) => ({
        word: word.text,
        startTime: word.start / 1000, // Convert to seconds
        endTime: word.end / 1000, // Convert to seconds
        confidence: word.confidence,
        speaker: word.speaker
      })),
      utterances: assemblyResult.utterances || []
    },
    isAssemblyAI: true // Flag to indicate this came from AssemblyAI
  };
};
