
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { combineTranscriptionResults } from './responseFormatter';
import { 
  fileToAudioBuffer, 
  splitAudioBuffer, 
  calculateOptimalChunkDuration, 
  float32ArrayToWav
} from '../audio';
import { transcribeSingleFile } from './singleFileProcessor';

// Increased from 50MB to 200MB
const MAX_FILE_SIZE = 200 * 1024 * 1024;

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
        const result = await transcribeSingleFile(file, apiKey, options, customTerms, true); // Pass flag to skip browser decoding
        onProgress?.(100);
        return result;
      } catch (error) {
        console.error("Direct FLAC upload failed:", error);
        throw new Error(`Unable to process FLAC file: ${error.message}`);
      }
    }
    
    // For MP3 files, we need a different approach since splitting can be tricky
    if (isMp3) {
      console.log("MP3 file detected, processing as single file with direct upload");
      try {
        // For MP3 files less than 200MB, try direct upload
        if (file.size < MAX_FILE_SIZE) {
          onProgress?.(10); // Show some initial progress
          const result = await transcribeSingleFile(file, apiKey, options, customTerms);
          onProgress?.(100);
          return result;
        }
        // For larger MP3 files, we need to convert to WAV first
      } catch (error) {
        console.error("Direct MP3 upload failed, falling back to conversion:", error);
        // Continue with the normal flow
      }
    }
    
    // For extremely large files, use a streaming approach to avoid memory issues
    if (file.size > 50 * 1024 * 1024) { // More than 50MB
      console.log("Very large file detected, using stream processing approach");
      return processExtremelyLargeFile(file, apiKey, options, onProgress, customTerms);
    }
    
    try {
      // Standard approach for regular large files that can be decoded by browser
      // Convert file to AudioBuffer
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
      return await processChunks(audioChunks, audioBuffer.sampleRate, file.name, apiKey, options, onProgress, customTerms);
    } catch (error) {
      console.error("Error in standard processing:", error);
      if (error.name === "EncodingError" || error.message?.includes("Unable to decode audio data")) {
        console.log("Browser cannot decode this audio format, falling back to direct API upload");
        try {
          // Fall back to direct upload without preprocessing
          onProgress?.(10);
          const result = await transcribeSingleFile(file, apiKey, options, customTerms, true); // Skip browser decoding
          onProgress?.(100);
          return result;
        } catch (directError) {
          console.error("Direct upload fallback failed:", directError);
          throw directError;
        }
      } else if (error.message && error.message.includes("buffer allocation failed")) {
        // If we hit a memory error, fall back to the streaming approach
        console.log("Memory error detected, falling back to stream processing approach");
        return processExtremelyLargeFile(file, apiKey, options, onProgress, customTerms);
      }
      throw error;
    }
  } catch (error) {
    console.error('Batched transcription error:', error);
    throw error;
  }
};

/**
 * Memory-efficient chunk processing
 */
const processChunks = async (
  audioChunks: Float32Array[],
  sampleRate: number,
  fileName: string,
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void,
  customTerms: string[] = []
) => {
  const results = [];
  
  // Process one chunk at a time to minimize memory usage
  for (let i = 0; i < audioChunks.length; i++) {
    try {
      // Convert chunk to WAV blob
      const wavBlob = float32ArrayToWav(audioChunks[i], sampleRate);
      
      // Create file from blob
      const chunkFile = new File(
        [wavBlob], 
        `${fileName.split('.')[0]}_chunk${i}.wav`, 
        { type: 'audio/wav' }
      );
      
      // Free up the Float32Array memory by removing the reference
      // This allows garbage collection to reclaim the memory
      audioChunks[i] = null;
      
      // Update progress
      onProgress?.(Math.round((i / audioChunks.length) * 100));
      console.log(`Processing chunk ${i+1}/${audioChunks.length}...`);
      
      // Process this chunk
      const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options, customTerms);
      results.push(chunkResult);
      
      // Small delay to avoid rate limiting and let GC run
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error processing chunk ${i}:`, error);
      // Continue with other chunks even if one fails
    }
  }
  
  // Combine all results
  onProgress?.(100);
  return combineTranscriptionResults(results);
};

/**
 * Process extremely large files by using a streaming approach
 * This avoids loading the entire file into memory at once
 */
const processExtremelyLargeFile = async (
  file: File,
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void,
  customTerms: string[] = []
) => {
  try {
    // Rough estimate: 16-bit mono at 16kHz = ~32KB per second
    const BYTES_PER_SECOND = 32 * 1024;
    const estimatedDurationSec = file.size / BYTES_PER_SECOND;
    console.log(`Estimated duration: ${estimatedDurationSec} seconds`);
    
    // Use very small chunks to avoid memory issues
    // For extremely large files, use 5-second chunks
    const chunkDurationSec = 5; 
    const totalChunks = Math.ceil(estimatedDurationSec / chunkDurationSec);
    console.log(`Will process in ${totalChunks} ${chunkDurationSec}-second chunks`);
    
    // Process the file in direct slices 
    const results = [];
    const chunkSize = BYTES_PER_SECOND * chunkDurationSec;
    
    for (let i = 0; i < totalChunks; i++) {
      try {
        // Update progress
        onProgress?.(Math.round((i / totalChunks) * 100));
        console.log(`Processing chunk ${i+1}/${totalChunks}...`);
        
        // Take a slice of the file
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end, file.type);
        
        // Create a chunk file
        const chunkFile = new File(
          [chunkBlob], 
          `${file.name.split('.')[0]}_chunk${i}.${file.name.split('.').pop()}`, 
          { type: file.type }
        );
        
        // Transcribe this chunk
        const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options, customTerms);
        results.push(chunkResult);
        
        // Small delay to avoid rate limiting and allow garbage collection
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing chunk ${i+1}:`, error);
        // Continue with other chunks even if one fails
      }
    }
    
    // Combine all results
    onProgress?.(100);
    return combineTranscriptionResults(results);
  } catch (error) {
    console.error('Extremely large file processing error:', error);
    throw error;
  }
};

// Alias for backward compatibility
export const processBatchFile = transcribeBatchedAudio;
