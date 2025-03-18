
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { combineTranscriptionResults } from './formatters/responseFormatter';
import { 
  fileToAudioBuffer, 
  splitAudioBuffer, 
  calculateOptimalChunkDuration
} from '../audio';
import { transcribeSingleFile } from './singleFileProcessor';
import { processChunks, processExtremelyLargeFile } from './chunkProcessor';
import { 
  detectAudioEncoding, 
  splitFileIntoChunks,
  convertFlacToWav 
} from './audioEncoding';

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const MEMORY_EFFICIENT_THRESHOLD = 50 * 1024 * 1024;
// Adjust payload limit to account for base64 encoding expansion (~33%)
const BASE64_EXPANSION_FACTOR = 1.33;
const GOOGLE_API_PAYLOAD_LIMIT = 10 * 1024 * 1024;
const SAFE_CHUNK_SIZE = Math.floor(GOOGLE_API_PAYLOAD_LIMIT / BASE64_EXPANSION_FACTOR) - 512 * 1024; // Add 512KB safety margin

/**
 * Process audio in batches for larger files with memory-efficient approach
 */
export const transcribeBatchedAudio = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void,
  customTerms: string[] = []
) => {
  try {
    console.log('Processing large file in batches...');
    onProgress?.(0); // Initialize progress
    
    // Determine file type and choose appropriate processing method
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const { encoding } = detectAudioEncoding(file);
    const isFlac = encoding === "FLAC";
    const isMp3 = encoding === "MP3";
    const isWav = encoding === "LINEAR16" || fileType.includes('wav') || fileName.endsWith('.wav');
    
    console.log(`File format detected: ${fileType || 'Unknown, using filename: ' + fileName}`);
    console.log(`Encoding detected: ${encoding}`);
    console.log(`File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Estimated size after base64 encoding: ${((file.size * BASE64_EXPANSION_FACTOR) / (1024 * 1024)).toFixed(2)} MB`);
    
    // Always use binary chunking for files that exceed the API payload limit
    if (file.size * BASE64_EXPANSION_FACTOR > GOOGLE_API_PAYLOAD_LIMIT) {
      console.log(`File exceeds API payload limit (${(GOOGLE_API_PAYLOAD_LIMIT / (1024 * 1024)).toFixed(2)} MB), using chunking`);
      
      try {
        // Split the file into binary chunks (ensuring each chunk is below the safe size)
        console.log(`Splitting file into binary chunks of max ${(SAFE_CHUNK_SIZE / (1024 * 1024)).toFixed(2)} MB each`);
        const chunks = await splitFileIntoChunks(file, SAFE_CHUNK_SIZE);
        console.log(`Split file into ${chunks.length} binary chunks`);
        
        // Process each chunk
        const results = [];
        for (let i = 0; i < chunks.length; i++) {
          const chunkProgress = (i / chunks.length) * 100;
          onProgress?.(chunkProgress);
          
          console.log(`Processing chunk ${i+1}/${chunks.length} (${(chunks[i].byteLength / (1024 * 1024)).toFixed(2)} MB)`);
          
          // Create a temporary File for each chunk
          const chunkBlob = new Blob([chunks[i]], { type: file.type });
          const chunkFile = new File([chunkBlob], `chunk-${i}.${fileName.split('.').pop()}`, { type: file.type });
          
          try {
            // Process this chunk with skipBrowserDecoding=true to force direct API upload
            const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options, customTerms, true);
            results.push(chunkResult);
          } catch (chunkError) {
            console.error(`Error processing chunk ${i+1}:`, chunkError);
            // Continue with next chunk even if one fails
          }
          
          // Add a small delay between chunks to prevent rate limiting
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        onProgress?.(100);
        return combineTranscriptionResults(results);
      } catch (chunkingError) {
        console.error("File chunking failed:", chunkingError);
        throw new Error("Failed to process file in chunks. Please try a smaller file or contact support.");
      }
    }
    
    // For normal-sized files, we don't need to do any complex processing
    try {
      // Standard approach for regular files
      console.log("Using standard processing approach...");
      const result = await transcribeSingleFile(file, apiKey, options, customTerms);
      onProgress?.(100);
      return result;
    } catch (error: any) {
      console.error("Error in standard processing:", error);
      
      // If we hit the payload limit error, try again with binary chunking
      if (error.message && error.message.includes("payload size exceeds")) {
        console.log("Payload size error detected, retrying with binary chunking");
        
        try {
          const chunks = await splitFileIntoChunks(file, SAFE_CHUNK_SIZE);
          console.log(`Split file into ${chunks.length} binary chunks`);
          
          const results = [];
          for (let i = 0; i < chunks.length; i++) {
            const chunkProgress = (i / chunks.length) * 100;
            onProgress?.(chunkProgress);
            
            console.log(`Processing chunked file ${i+1}/${chunks.length}`);
            
            const chunkBlob = new Blob([chunks[i]], { type: file.type });
            const chunkFile = new File([chunkBlob], `chunk-${i}.${fileName.split('.').pop()}`, { type: file.type });
            
            try {
              const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options, customTerms, true);
              results.push(chunkResult);
            } catch (chunkError) {
              console.error(`Error processing chunk ${i+1}:`, chunkError);
              // Continue with next chunk
            }
            
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          onProgress?.(100);
          return combineTranscriptionResults(results);
        } catch (chunkError) {
          console.error("Chunking fallback failed:", chunkError);
          throw new Error("Failed to process file even with chunking. Please try a smaller file.");
        }
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Batched transcription error:', error);
    throw error;
  }
};

// Alias for backward compatibility
export const processBatchFile = transcribeBatchedAudio;
