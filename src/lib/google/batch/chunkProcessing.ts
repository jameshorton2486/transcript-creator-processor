
import { DEFAULT_TRANSCRIPTION_OPTIONS, TranscriptionOptions } from '../../config';
import { transcribeSingleFile } from '../singleFileProcessor';

/**
 * Prepares audio file chunks for batch processing
 */
export const prepareFileChunks = async (file: File) => {
  try {
    // For simplicity, we're just creating one chunk with the entire file for now
    // In a real-world scenario, you'd split large files into multiple chunks
    return [file];
  } catch (error) {
    console.error("[BATCH] Error preparing file chunks:", error);
    throw new Error(`Failed to prepare file chunks: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Processes a single chunk of audio
 */
export const processChunk = async (
  chunk: File,
  chunkIndex: number,
  totalChunks: number,
  originalFile: File,
  apiKey: string,
  options: TranscriptionOptions,
  onProgress?: (progress: number) => void
) => {
  try {
    console.log(`[BATCH] Processing chunk ${chunkIndex + 1}/${totalChunks}`);
    
    // Update progress based on chunk index
    const progressStart = (chunkIndex / totalChunks) * 100;
    const progressEnd = ((chunkIndex + 1) / totalChunks) * 100;
    onProgress?.(Math.floor(progressStart));
    
    // Process the chunk with the provided options
    const response = await transcribeSingleFile(chunk, apiKey, options);
    
    // Update progress to indicate chunk completion
    onProgress?.(Math.floor(progressEnd));
    
    return {
      isSuccess: true,
      results: [response],
      error: null
    };
  } catch (error) {
    console.error(`[BATCH] Error processing chunk ${chunkIndex + 1}/${totalChunks}:`, error);
    
    // Prepare error information
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      isSuccess: false,
      results: [],
      error: errorMessage
    };
  }
};
