
/**
 * Utility functions for handling retry logic and error cases in batch processing
 */

/**
 * Adds a delay between chunk processing to prevent rate limiting
 */
export const addDelayBetweenChunks = async (delayMs = 800): Promise<void> => {
  console.log(`[BATCH] Adding delay of ${delayMs}ms between chunks to prevent rate limiting`);
  await new Promise(resolve => setTimeout(resolve, delayMs));
};

/**
 * Formats an error message from any error type
 */
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

/**
 * Extracts the last error message from a batch of results
 */
export const extractLastErrorMessage = (results: any[], errorCount: number): string => {
  // Look for the last error message in the results
  for (let i = results.length - 1; i >= 0; i--) {
    const result = results[i];
    if (result.error) {
      return result.error;
    }
    // Check for error message in transcript
    if (result.results?.[0]?.alternatives?.[0]?.transcript) {
      const transcript = result.results[0].alternatives[0].transcript;
      if (transcript.includes('[Transcription failed')) {
        const match = transcript.match(/\[Transcription failed[^:]*:\s*([^\]]+)/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
  }
  
  return `All chunks failed to process. ${errorCount} errors occurred.`;
};

/**
 * Combines chunk processing stats for logging
 */
export const logBatchCompletionStats = (
  successCount: number, 
  errorCount: number, 
  totalChunks: number
): void => {
  console.log(`[BATCH] Batch processing completed. Success: ${successCount}/${totalChunks}, Errors: ${errorCount}/${totalChunks}`);
};

/**
 * Checks if the combined results have any meaningful content
 */
export const hasValidResults = (combinedResult: any): boolean => {
  if (!combinedResult?.results?.length) {
    return false;
  }
  
  // Check each channel alternative for non-empty transcript
  const channels = combinedResult.results.channels || [];
  for (const channel of channels) {
    const alternatives = channel.alternatives || [];
    for (const alt of alternatives) {
      if (alt.transcript && alt.transcript.length > 0 && 
          !alt.transcript.includes('[No speech detected') && 
          !alt.transcript.includes('[Transcription failed')) {
        return true;
      }
    }
  }
  
  // Check each transcript for non-empty content
  const transcripts = combinedResult.results.transcripts || [];
  for (const transcript of transcripts) {
    if (transcript.transcript && transcript.transcript.length > 0 && 
        !transcript.transcript.includes('[No speech detected') && 
        !transcript.transcript.includes('[Transcription failed')) {
      return true;
    }
  }
  
  return false;
};
