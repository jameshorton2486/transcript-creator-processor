
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { combineTranscriptionResults } from './responseFormatter';
import { 
  fileToAudioBuffer, 
  splitAudioBuffer, 
  calculateOptimalChunkDuration, 
  float32ArrayToWav
} from '../audio';
import { transcribeSingleFile } from './singleFileProcessor';

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
        // For MP3 files less than 50MB, try direct upload
        if (file.size < 50 * 1024 * 1024) {
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
