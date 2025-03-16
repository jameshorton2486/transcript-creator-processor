
// Module for batch processing of large audio files
import { formatGoogleResponse, combineTranscriptionResults } from './responseFormatter';
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { float32ArrayToWav, fileToAudioBuffer, splitAudioBuffer, calculateOptimalChunkDuration } from '../audioProcessor';

/**
 * Process a single file (for files under 10MB)
 */
export const transcribeSingleFile = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS
) => {
  try {
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
    
    // Prepare request body for Google Speech-to-Text API
    const requestBody = {
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 16000,
        languageCode: transcriptionOptions.language,
        enableAutomaticPunctuation: transcriptionOptions.punctuate,
        enableSpeakerDiarization: transcriptionOptions.diarize,
        diarizationSpeakerCount: 2, // Default to 2 speakers, can be adjusted
        model: "latest_long",
      },
      audio: {
        content: base64Audio
      }
    };
    
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
