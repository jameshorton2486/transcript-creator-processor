
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { combineTranscriptionResults } from './responseFormatter';
import { 
  fileToAudioBuffer, 
  splitAudioBuffer, 
  calculateOptimalChunkDuration
} from '../audio';
import { transcribeSingleFile } from './singleFileProcessor';
import { processChunks, processExtremelyLargeFile } from './chunkProcessor';
import { detectAudioEncoding, splitFileIntoChunks } from './audioEncoding';

// Increased from 50MB to 200MB
const MAX_FILE_SIZE = 200 * 1024 * 1024;
const MEMORY_EFFICIENT_THRESHOLD = 50 * 1024 * 1024;
// Google API has a hard 10MB limit for request payloads
const GOOGLE_API_PAYLOAD_LIMIT = 10 * 1024 * 1024;

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
    
    console.log(`File format detected: ${fileType || 'Unknown, using filename: ' + fileName}`);
    console.log(`File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Special handling for FLAC files
    if (isFlac) {
      console.log("FLAC file detected");
      
      // For FLAC files that exceed Google's 10MB request limit, we need to split them
      if (file.size > GOOGLE_API_PAYLOAD_LIMIT) {
        console.log(`Large FLAC file (${(file.size / (1024 * 1024)).toFixed(2)} MB) detected, using binary chunking`);
        onProgress?.(5);
        
        try {
          // Split the FLAC file into binary chunks (not audio chunks - just raw binary splits)
          // Each chunk will be treated as its own FLAC file segment
          const binaryChunks = await splitFileIntoChunks(file, GOOGLE_API_PAYLOAD_LIMIT * 0.9);
          console.log(`Split FLAC file into ${binaryChunks.length} binary chunks`);
          
          // Process each binary chunk and collect results
          const results = [];
          for (let i = 0; i < binaryChunks.length; i++) {
            const chunkProgress = (i / binaryChunks.length) * 100;
            onProgress?.(5 + chunkProgress * 0.9); // 5-95% progress
            
            console.log(`Processing FLAC chunk ${i+1}/${binaryChunks.length}`);
            
            // Create a temporary Blob/File for each chunk
            const chunkBlob = new Blob([binaryChunks[i]], { type: 'audio/flac' });
            const chunkFile = new File([chunkBlob], `chunk-${i}.flac`, { type: 'audio/flac' });
            
            // Process each chunk as a separate FLAC file
            const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options, customTerms, true);
            results.push(chunkResult);
          }
          
          onProgress?.(100);
          return combineTranscriptionResults(results);
        } catch (error) {
          console.error("FLAC binary chunking failed:", error);
          throw new Error(`Unable to process large FLAC file: ${error.message}`);
        }
      } else {
        // For smaller FLAC files that fit within the 10MB limit
        console.log("FLAC file is under 10MB, using direct API upload");
        try {
          onProgress?.(10);
          const result = await transcribeSingleFile(file, apiKey, options, customTerms, true); 
          onProgress?.(100);
          return result;
        } catch (error) {
          console.error("Direct FLAC upload failed:", error);
          throw new Error(`Unable to process FLAC file: ${error.message}`);
        }
      }
    }
    
    // For MP3 files, we need a different approach since splitting can be tricky
    if (isMp3 && file.size < MAX_FILE_SIZE) {
      console.log("MP3 file detected, processing as single file with direct upload");
      try {
        onProgress?.(10); // Show some initial progress
        const result = await transcribeSingleFile(file, apiKey, options, customTerms);
        onProgress?.(100);
        return result;
      } catch (error) {
        console.error("Direct MP3 upload failed, falling back to conversion:", error);
        // Continue with the normal flow
      }
    }
    
    // For extremely large files, use a streaming approach to avoid memory issues
    if (file.size > MEMORY_EFFICIENT_THRESHOLD) {
      console.log("Very large file detected, using stream processing approach");
      const results = await processExtremelyLargeFile(file, apiKey, options, onProgress, customTerms);
      return combineTranscriptionResults(results);
    }
    
    try {
      // Standard approach for regular large files that can be decoded by browser
      console.log("Attempting to decode audio file with browser's AudioContext...");
      const audioBuffer = await fileToAudioBuffer(file);
      const fileDurationSec = audioBuffer.duration;
      console.log(`Audio duration: ${fileDurationSec} seconds, sample rate: ${audioBuffer.sampleRate} Hz`);
      
      // Calculate optimal chunk size based on file size and duration
      const optimalChunkDuration = calculateOptimalChunkDuration(file.size, fileDurationSec);
      console.log(`Using chunk duration of ${optimalChunkDuration} seconds`);
      
      // Split audio into chunks with memory-efficient approach
      const audioChunks = splitAudioBuffer(audioBuffer, optimalChunkDuration);
      console.log(`Split audio into ${audioChunks.length} chunks`);
      
      // Process chunks with memory-efficient approach
      const results = await processChunks(
        audioChunks, 
        audioBuffer.sampleRate, 
        file.name, 
        apiKey, 
        options, 
        onProgress, 
        customTerms
      );
      
      return combineTranscriptionResults(results);
    } catch (error) {
      console.error("Error in standard processing:", error);
      
      if (error.name === "EncodingError" || error.message?.includes("Unable to decode audio data")) {
        console.log("Browser cannot decode this audio format, falling back to direct API upload");
        try {
          // Fall back to direct upload without preprocessing
          onProgress?.(10);
          const result = await transcribeSingleFile(file, apiKey, options, customTerms, true);
          onProgress?.(100);
          return result;
        } catch (directError) {
          console.error("Direct upload fallback failed:", directError);
          throw directError;
        }
      } else if (error.message && error.message.includes("buffer allocation failed")) {
        // If we hit a memory error, fall back to the streaming approach
        console.log("Memory error detected, falling back to stream processing approach");
        const results = await processExtremelyLargeFile(file, apiKey, options, onProgress, customTerms);
        return combineTranscriptionResults(results);
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
