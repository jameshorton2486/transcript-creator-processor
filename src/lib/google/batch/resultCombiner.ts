
import { combineTranscriptionResults } from '../formatters/responseFormatter';

/**
 * Combines individual chunk results into a final response
 */
export const combineChunkResults = (
  results: any[], 
  successCount: number, 
  errorCount: number,
  lastErrorMessage: string
) => {
  // If no successful chunks, throw an error
  if (successCount === 0) {
    throw new Error(`All chunks failed to process. Last error: ${lastErrorMessage}`);
  }
  
  // Even if some chunks failed, try to combine the successful ones
  const combinedResult = combineTranscriptionResults(results);
  
  // Check if the combined result has any meaningful transcription
  if (combinedResult?.results?.length > 0) {
    console.log(`[BATCH] Successfully combined results from ${results.length} chunks`);
    return combinedResult;
  } else {
    // If combined result is empty, provide a better error message
    const errorMsg = errorCount > 0 
      ? `Failed to transcribe any meaningful content. ${errorCount} chunks failed. Last error: ${lastErrorMessage}`
      : 'No speech was detected in the audio file. The file may be silent or contain only background noise.';
    
    throw new Error(errorMsg);
  }
};

/**
 * Creates a placeholder result for a failed chunk
 */
export const createErrorPlaceholder = (chunkIndex: number, errorMessage: string) => ({
  results: [{
    alternatives: [{
      transcript: `[Transcription failed for chunk ${chunkIndex}: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}]`,
      confidence: 0
    }]
  }]
});

/**
 * Extracts results from chunk processing responses
 */
export const flattenChunkResults = (chunkResponses: any[]): any[] => {
  const flattenedResults: any[] = [];
  
  for (const response of chunkResponses) {
    if (response && response.results) {
      if (Array.isArray(response.results)) {
        // Handle case where results is an array of results
        flattenedResults.push(...response.results);
      } else {
        // Handle case where results is a single result
        flattenedResults.push(response);
      }
    }
  }
  
  return flattenedResults;
};
