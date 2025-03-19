
import { sendTranscriptionRequest } from './processor/apiRequest';
import { getSampleRate } from './audio/formatDetection';
import { isValidAudioFile, detectAudioEncoding } from './audioEncoding';

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
  [key: string]: any; // Allow for additional properties
}

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
    const audioArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(new Error('Failed to read audio file. The file may be corrupted.'));
      };
      reader.readAsArrayBuffer(file);
    });
    
    // Validate the file is not empty
    if (!audioArrayBuffer || audioArrayBuffer.byteLength === 0) {
      throw new Error('The audio file is empty or could not be read.');
    }
    
    // Get the sample rate from file if possible, otherwise use auto-detection
    // Pass undefined for WAV files to allow Google to auto-detect from header
    const sampleRateHertz = getSampleRate(audioArrayBuffer, file.type);
    
    // Convert to base64 for API request
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Extract the base64 content without the prefix
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        
        if (!base64) {
          reject(new Error('Failed to convert audio to base64 format.'));
          return;
        }
        
        resolve(base64);
      };
      reader.onerror = (error) => {
        console.error('Error converting to base64:', error);
        reject(new Error('Failed to convert audio to base64 format.'));
      };
      reader.readAsDataURL(file);
    });
    
    console.info('Processing audio content, encoding:', encoding);
    
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
      encoding,
      sampleRateHertz, // This might be undefined for auto-detection
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
