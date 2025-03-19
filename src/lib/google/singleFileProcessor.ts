
import { sendTranscriptionRequest } from './processor/apiRequest';
import { isValidAudioFile, detectAudioEncoding } from './audio/audioValidation';
import { arrayBufferToBase64 } from '@/lib/audio/base64Converter';

interface TranscriptionOptions {
  encoding?: string;
  sampleRateHertz?: number;
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
    
    // Determine encoding based on file type
    const { encoding } = file instanceof File ? detectAudioEncoding(file) : { encoding: options.encoding || 'LINEAR16' };
    console.info(`Detected encoding: ${encoding}`);
    
    // Read the file content as ArrayBuffer for processing
    const audioArrayBuffer = await readFileAsArrayBuffer(file);
    
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
      console.info(`Added ${legalTerms.length} common legal terms to speech context`);
    }
    
    // Prepare transcription options with custom terms
    const transcriptionOptions = {
      encoding: encoding, // Use the detected encoding
      sampleRateHertz: 16000, // Always 16000 Hz
      ...options,
      customTerms: [...(options.customTerms || []), ...legalTerms]
    };
    
    // Send the request to Google's Speech-to-Text API
    const response = await sendTranscriptionRequest(apiKey, audioBase64, transcriptionOptions);
    
    if (!response.results || response.results.length === 0) {
      console.warn('Google API returned empty results. This may mean no speech was detected.');
    }
    
    return response;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

// For backward compatibility
export const processSingleFile = transcribeSingleFile;
