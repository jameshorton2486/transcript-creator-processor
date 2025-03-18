
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { combineTranscriptionResults } from './responseFormatter';
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
const SAFE_CHUNK_SIZE = Math.floor(GOOGLE_API_PAYLOAD_LIMIT / BASE64_EXPANSION_FACTOR);

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
    
    // For WAV files that exceed the payload limit, we need to split them
    if (isWav && file.size > SAFE_CHUNK_SIZE) {
      console.log(`WAV file exceeds safe size limit (${(SAFE_CHUNK_SIZE / (1024 * 1024)).toFixed(2)} MB), using chunking`);
      
      try {
        // Split the file into binary chunks (ensuring each chunk is below the safe size)
        const chunks = await splitFileIntoChunks(file, SAFE_CHUNK_SIZE);
        console.log(`Split WAV file into ${chunks.length} binary chunks`);
        
        // Process each chunk
        const results = [];
        for (let i = 0; i < chunks.length; i++) {
          const chunkProgress = (i / chunks.length) * 100;
          onProgress?.(chunkProgress);
          
          console.log(`Processing WAV chunk ${i+1}/${chunks.length} (${(chunks[i].byteLength / (1024 * 1024)).toFixed(2)} MB)`);
          
          // Create a temporary File for each chunk
          const chunkBlob = new Blob([chunks[i]], { type: 'audio/wav' });
          const chunkFile = new File([chunkBlob], `chunk-${i}.wav`, { type: 'audio/wav' });
          
          try {
            // Process this chunk
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
        console.error("WAV chunking failed:", chunkingError);
        // Fall back to other methods
      }
    }
    
    // Special handling for FLAC files
    if (isFlac) {
      console.log("FLAC file detected");
      
      // If FLAC file is large, convert it to WAV for better compatibility
      if (file.size > SAFE_CHUNK_SIZE) {
        console.log(`Large FLAC file (${(file.size / (1024 * 1024)).toFixed(2)} MB) detected, attempting conversion to WAV`);
        onProgress?.(5);
        
        try {
          // Try to convert FLAC to WAV first for better compatibility
          const wavFile = await convertFlacToWav(file);
          
          // If conversion was successful and produced a different file
          if (wavFile !== file && wavFile.type === 'audio/wav') {
            console.log(`Successfully converted FLAC to WAV: ${(wavFile.size / (1024 * 1024)).toFixed(2)} MB`);
            onProgress?.(10);
            
            // Process the WAV file using our standard processing flow
            return await transcribeBatchedAudio(wavFile, apiKey, options, 
              (progress) => onProgress?.(10 + progress * 0.9), // Adjust progress to account for conversion
              customTerms
            );
          }
        } catch (conversionError) {
          console.error("FLAC to WAV conversion failed:", conversionError);
          // Continue with binary chunking if conversion fails
        }
        
        // If conversion failed or wasn't possible, fall back to binary chunking
        console.log(`Using binary chunking for FLAC file`);
        onProgress?.(10);
        
        try {
          // Split the FLAC file into binary chunks (not audio chunks - just raw binary splits)
          // Each chunk will be treated as its own FLAC file segment
          const binaryChunks = await splitFileIntoChunks(file, SAFE_CHUNK_SIZE);
          console.log(`Split FLAC file into ${binaryChunks.length} binary chunks`);
          
          // Process each binary chunk and collect results
          const results = [];
          for (let i = 0; i < binaryChunks.length; i++) {
            const chunkProgress = (i / binaryChunks.length) * 100;
            onProgress?.(10 + chunkProgress * 0.9); // 10-100% progress
            
            console.log(`Processing FLAC chunk ${i+1}/${binaryChunks.length}`);
            
            // Create a temporary Blob/File for each chunk
            const chunkBlob = new Blob([binaryChunks[i]], { type: 'audio/flac' });
            const chunkFile = new File([chunkBlob], `chunk-${i}.flac`, { type: 'audio/flac' });
            
            try {
              // Process each chunk as a separate FLAC file
              const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options, customTerms, true);
              results.push(chunkResult);
            } catch (error) {
              console.error(`Error processing FLAC chunk ${i+1}:`, error);
              // Continue with next chunk even if one fails
            }
            
            // Add a small delay between chunks to prevent rate limiting
            if (i < binaryChunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          onProgress?.(100);
          return combineTranscriptionResults(results);
        } catch (error) {
          console.error("FLAC binary chunking failed:", error);
          throw new Error(`Unable to process large FLAC file: ${error.message}`);
        }
      } else {
        // For smaller FLAC files that fit within the safe size limit
        console.log(`FLAC file is under ${(SAFE_CHUNK_SIZE / (1024 * 1024)).toFixed(2)} MB, using direct API upload`);
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
      if (file.size <= SAFE_CHUNK_SIZE) {
        console.log("MP3 file within safe size limit, processing as single file with direct upload");
        try {
          onProgress?.(10);
          const result = await transcribeSingleFile(file, apiKey, options, customTerms);
          onProgress?.(100);
          return result;
        } catch (error) {
          console.error("Direct MP3 upload failed, falling back to conversion:", error);
          // Continue with the normal flow
        }
      } else {
        // For larger MP3 files, split into binary chunks
        console.log("Large MP3 file detected, using binary chunking");
        try {
          const chunks = await splitFileIntoChunks(file, SAFE_CHUNK_SIZE);
          console.log(`Split MP3 file into ${chunks.length} binary chunks`);
          
          const results = [];
          for (let i = 0; i < chunks.length; i++) {
            const chunkProgress = (i / chunks.length) * 100;
            onProgress?.(chunkProgress);
            
            console.log(`Processing MP3 chunk ${i+1}/${chunks.length}`);
            
            const chunkBlob = new Blob([chunks[i]], { type: 'audio/mp3' });
            const chunkFile = new File([chunkBlob], `chunk-${i}.mp3`, { type: 'audio/mp3' });
            
            try {
              const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options, customTerms, true);
              results.push(chunkResult);
            } catch (error) {
              console.error(`Error processing MP3 chunk ${i+1}:`, error);
              // Continue with next chunk
            }
            
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          onProgress?.(100);
          return combineTranscriptionResults(results);
        } catch (error) {
          console.error("MP3 chunking failed:", error);
          // Fall back to stream processing
        }
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
