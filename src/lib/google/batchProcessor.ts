
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
 * Process audio in batches for larger files
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
    
    // For MP3 files, we need a different approach since we can't easily split them
    // We'll convert to WAV for processing, which may be less efficient but more reliable
    if (file.type.includes("mp3") || file.name.toLowerCase().endsWith(".mp3")) {
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
    
    // For extremely large files, use a streaming approach
    if (file.size > 100 * 1024 * 1024) { // More than 100MB
      console.log("Extremely large file detected, using stream processing approach");
      return processExtremelyLargeFile(file, apiKey, options, onProgress, customTerms);
    }
    
    // Standard approach for regular large files
    // Convert file to AudioBuffer
    const audioBuffer = await fileToAudioBuffer(file);
    const fileDurationSec = audioBuffer.duration;
    console.log(`Audio duration: ${fileDurationSec} seconds`);
    
    // Calculate optimal chunk size based on file size and duration
    const optimalChunkDuration = calculateOptimalChunkDuration(file.size, fileDurationSec);
    console.log(`Using chunk duration of ${optimalChunkDuration} seconds`);
    
    // Split audio into chunks
    const audioChunks = splitAudioBuffer(audioBuffer, optimalChunkDuration);
    console.log(`Split audio into ${audioChunks.length} chunks`);
    
    // Convert chunks to WAV files
    const wavBlobs = audioChunks.map(chunk => 
      float32ArrayToWav(chunk, audioBuffer.sampleRate)
    );
    
    // Process each chunk
    const results = [];
    for (let i = 0; i < wavBlobs.length; i++) {
      const chunkFile = new File(
        [wavBlobs[i]], 
        `${file.name.split('.')[0]}_chunk${i}.wav`, 
        { type: 'audio/wav' }
      );
      
      // Update progress
      onProgress?.(Math.round((i / wavBlobs.length) * 100));
      console.log(`Processing chunk ${i+1}/${wavBlobs.length}...`);
      
      // Transcribe this chunk
      const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options, customTerms);
      results.push(chunkResult);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Combine all results
    onProgress?.(100);
    return combineTranscriptionResults(results);
  } catch (error) {
    console.error('Batched transcription error:', error);
    throw error;
  }
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
    // For extremely large files, we'll use a different technique:
    // 1. Calculate approximate duration from file size
    // 2. Process in small, timed chunks using slicing
    
    // Rough estimate: 16-bit mono at 16kHz = ~32KB per second
    const BYTES_PER_SECOND = 32 * 1024;
    const estimatedDurationSec = file.size / BYTES_PER_SECOND;
    console.log(`Estimated duration: ${estimatedDurationSec} seconds`);
    
    // Use very small chunks to avoid memory issues
    const chunkDurationSec = 10; // 10-second chunks
    const totalChunks = Math.ceil(estimatedDurationSec / chunkDurationSec);
    console.log(`Will process in ${totalChunks} 10-second chunks`);
    
    // Process the file in direct slices 
    const results = [];
    const chunkSize = BYTES_PER_SECOND * chunkDurationSec;
    
    for (let i = 0; i < totalChunks; i++) {
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
      
      try {
        // Transcribe this chunk
        const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options, customTerms);
        results.push(chunkResult);
      } catch (error) {
        console.error(`Error processing chunk ${i+1}:`, error);
        // Continue with other chunks even if one fails
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
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
