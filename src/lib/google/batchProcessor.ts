// Module for batch processing of large audio files
import { formatGoogleResponse, combineTranscriptionResults } from './responseFormatter';
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { 
  fileToAudioBuffer, 
  splitAudioBuffer, 
  calculateOptimalChunkDuration, 
  float32ArrayToWav
} from '../audio';

/**
 * Process a single file (for files under 10MB)
 */
export const transcribeSingleFile = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS
) => {
  try {
    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    const base64Audio = arrayBufferToBase64(arrayBuffer);
    
    // Set up transcription options based on our default options
    const transcriptionOptions = {
      punctuate: options.punctuate,
      diarize: options.diarize,
      paragraphs: options.paragraphs,
      utterances: options.utterances,
      numerals: options.numerals,
      language: 'en-US'
    };
    
    // Detect audio encoding based on file type
    let encoding = "LINEAR16"; // Default for WAV
    if (file.type.includes("mp3") || file.name.toLowerCase().endsWith(".mp3")) {
      encoding = "MP3";
    } else if (file.type.includes("flac") || file.name.toLowerCase().endsWith(".flac")) {
      encoding = "FLAC";
    } else if (file.type.includes("ogg") || file.name.toLowerCase().endsWith(".ogg")) {
      encoding = "OGG_OPUS";
    }
    
    console.log(`Using encoding: ${encoding} for file type: ${file.type}`);
    
    // Prepare request body for Google Speech-to-Text API with a more flexible type
    const requestBody: {
      config: {
        encoding: string;
        sampleRateHertz?: number;
        languageCode: string;
        enableAutomaticPunctuation: boolean;
        model: string;
        diarizationConfig?: {
          enableSpeakerDiarization: boolean;
          minSpeakerCount: number;
          maxSpeakerCount: number;
        };
      };
      audio: {
        content: string;
      };
    } = {
      config: {
        encoding: encoding,
        sampleRateHertz: 16000,
        languageCode: transcriptionOptions.language,
        enableAutomaticPunctuation: transcriptionOptions.punctuate,
        model: "latest_long",
      },
      audio: {
        content: base64Audio
      }
    };
    
    // Add diarization config if enabled (using the updated API format)
    if (transcriptionOptions.diarize) {
      requestBody.config.diarizationConfig = {
        enableSpeakerDiarization: true,
        minSpeakerCount: 2,
        maxSpeakerCount: 8
      };
    }
    
    // Remove sampleRateHertz for MP3 files as Google auto-detects it
    if (encoding === "MP3" || encoding === "OGG_OPUS") {
      delete requestBody.config.sampleRateHertz;
    }
    
    console.log('Sending request to Google Speech API...');
    
    // Make request to Google Speech-to-Text API
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google API error:', errorData);
      throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Google transcription completed successfully');
    
    // Format Google's response to our app's expected format
    return formatGoogleResponse(data);
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

/**
 * Helper function to convert ArrayBuffer to base64
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
};

/**
 * Process audio in batches for larger files
 */
export const transcribeBatchedAudio = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void
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
          const result = await transcribeSingleFile(file, apiKey, options);
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
      const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options);
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
