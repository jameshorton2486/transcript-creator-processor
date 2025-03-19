
import { sendTranscriptionRequest } from './processor/apiRequest';
import { isValidAudioFile, detectAudioEncoding } from './audio/audioValidation';
import { arrayBufferToBase64 } from '@/lib/audio/base64Converter';
import { normalizeWavFile, tryConvertToWav } from '@/lib/audio/wavConverter';

interface TranscriptionOptions {
  encoding?: string;
  languageCode?: string;
  enableAutomaticPunctuation?: boolean;
  model?: string;
  useEnhanced?: boolean;
  enableSpeakerDiarization?: boolean;
  minSpeakerCount?: number;
  maxSpeakerCount?: number;
  enableWordTimeOffsets?: boolean;
  enableWordConfidence?: boolean;
  customTerms?: string[];
  [key: string]: any; 
}

/**
 * Reads the file as an ArrayBuffer
 */
const readFileAsArrayBuffer = async (file: File | Blob): Promise<ArrayBuffer> => {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(new Error('Failed to read audio file. The file may be corrupted.'));
    };
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Attempts to pre-process audio file for better compatibility
 */
const preprocessAudioFile = async (file: File): Promise<File> => {
  try {
    console.log(`[PREPROCESS] Checking if file needs conversion: ${file.name} (${file.type})`);
    
    // First try to convert to WAV format for better compatibility
    const normalizedFile = await tryConvertToWav(file);
    
    // If the file is WAV, ensure it's properly normalized (mono, correct sample rate)
    if (normalizedFile.type.includes('wav') || normalizedFile.name.toLowerCase().endsWith('.wav')) {
      console.log('[PREPROCESS] Normalizing WAV file');
      return await normalizeWavFile(normalizedFile);
    }
    
    return normalizedFile;
  } catch (error) {
    console.warn('[PREPROCESS] Error preprocessing file:', error);
    return file; // Return original file if preprocessing fails
  }
};

/**
 * Transcribes a single audio file
 * @param {File|Blob} file - The audio file to transcribe
 * @param {string} apiKey - The Google Cloud API key
 * @param {object} options - Transcription options
 * @returns {Promise<object>} - The transcription response
 */
export const transcribeSingleFile = async (
  file: File | Blob, 
  apiKey: string, 
  options: TranscriptionOptions = {}
) => {
  try {
    // Log file details
    console.info(`Processing file: ${(file as File).name || 'unnamed blob'}, type: ${file.type}, size: ${file.size} bytes`);
    
    // Validate file is a supported audio type
    if (file instanceof File && !isValidAudioFile(file)) {
      throw new Error('Unsupported audio file format. Please upload a WAV, MP3, FLAC, OGG, AMR, or WebM file.');
    }
    
    let fileToProcess = file;
    
    // Attempt to preprocess the file if it's a File (not a Blob)
    if (file instanceof File) {
      try {
        console.log('[PROCESSING] Attempting to preprocess audio file for better compatibility');
        fileToProcess = await preprocessAudioFile(file);
        
        if (fileToProcess !== file) {
          console.log('[PROCESSING] File was successfully preprocessed');
        } else {
          console.log('[PROCESSING] File preprocessing skipped, using original file');
        }
      } catch (preprocessError) {
        console.warn('[PROCESSING] Error during preprocessing, falling back to original file:', preprocessError);
        fileToProcess = file; // Fall back to original file
      }
    }
    
    // Determine encoding based on file type
    const { encoding } = file instanceof File ? detectAudioEncoding(file as File) : { encoding: options.encoding || 'LINEAR16' };
    console.info(`[PROCESSING] Detected encoding: ${encoding}`);
    
    // Read the file content as ArrayBuffer for processing
    const audioArrayBuffer = await readFileAsArrayBuffer(fileToProcess);
    
    // Validate the file is not empty
    if (!audioArrayBuffer || audioArrayBuffer.byteLength === 0) {
      throw new Error('The audio file is empty or could not be read.');
    }
    
    // Convert to base64 for API request
    const audioBase64 = await arrayBufferToBase64(audioArrayBuffer);
    console.info('[PROCESSING] Successfully encoded audio to base64, ready for transmission');
    
    // Create custom terms list for legal vocabulary
    const legalTerms = [
      'plaintiff', 'defendant', 'counsel', 'objection', 'sustained', 'overruled', 
      'witness', 'testimony', 'exhibit', 'evidence', 'deposition', 'affidavit', 
      'stipulation', 'pursuant to'
    ];
    
    if (legalTerms.length > 0) {
      console.info(`[PROCESSING] Added ${legalTerms.length} common legal terms to speech context`);
    }
    
    // Prepare transcription options with custom terms
    // NEVER include sample rate to let Google Speech API extract it automatically
    const transcriptionOptions = {
      encoding: encoding, // Use the detected encoding
      ...options,
      customTerms: [...(options.customTerms || []), ...legalTerms]
    };
    
    // Explicitly remove sample rate to let Google API auto-detect it
    if (transcriptionOptions.sampleRateHertz) {
      console.info('[PROCESSING] Omitting sample rate to allow Google API to use the one from audio header');
      delete transcriptionOptions.sampleRateHertz;
    }
    
    console.log('[PROCESSING] Sending request to Google Speech API');
    
    // Send the request to Google's Speech-to-Text API
    const response = await sendTranscriptionRequest(apiKey, audioBase64, transcriptionOptions);
    
    if (!response.results || response.results.length === 0) {
      console.warn('[PROCESSING] Google API returned empty results. This may mean no speech was detected.');
      throw new Error('No speech was detected in the audio file. The file may be silent or contain background noise only.');
    }
    
    return response;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

// For backward compatibility
export const processSingleFile = transcribeSingleFile;
