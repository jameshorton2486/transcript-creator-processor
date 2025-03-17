
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { combineTranscriptionResults } from './responseFormatter';
import { 
  fileToAudioBuffer, 
  splitAudioBuffer, 
  calculateOptimalChunkDuration
} from '../audio';
import { transcribeSingleFile } from './singleFileProcessor';
import { processChunks, processExtremelyLargeFile } from './chunkProcessor';

// Increased from 50MB to 200MB
const MAX_FILE_SIZE = 200 * 1024 * 1024;
const MEMORY_EFFICIENT_THRESHOLD = 50 * 1024 * 1024;

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
    const isFlac = fileType.includes("flac") || fileName.endsWith(".flac");
    const isMp3 = fileType.includes("mp3") || fileName.endsWith(".mp3");
    
    console.log(`File format detected: ${fileType || 'Unknown, using filename: ' + fileName}`);
    
    // For FLAC files, use direct upload since browser audio context often can't decode them
    if (isFlac) {
      console.log("FLAC file detected, using direct API upload");
      try {
        // Always use direct upload for FLAC files to avoid browser decoding issues
        onProgress?.(10); // Show some initial progress
        const result = await transcribeSingleFile(file, apiKey, options, customTerms, true); 
        onProgress?.(100);
        return result;
      } catch (error) {
        console.error("Direct FLAC upload failed:", error);
        throw new Error(`Unable to process FLAC file: ${error.message}`);
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
