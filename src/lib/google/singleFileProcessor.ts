
import { sendTranscriptionRequest } from './processor/apiRequest';
import { getSampleRate } from './audio/formatDetection';

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
    console.info(`Processing file: ${(file as File).name}, type: ${file.type}, size: ${file.size} bytes`);
    
    // Determine encoding based on file type
    let encoding = 'LINEAR16'; // Default encoding for WAV files
    if (file.type.includes('mp3')) {
      encoding = 'MP3';
    } else if (file.type.includes('flac')) {
      encoding = 'FLAC';
    } else if (file.type.includes('ogg')) {
      encoding = 'OGG_OPUS';
    } else if (file.type.includes('amr')) {
      encoding = 'AMR';
    } else if (file.type.includes('webm')) {
      encoding = 'WEBM_OPUS';
    }
    
    console.info(`Detected encoding: ${encoding}`);
    
    // Read the file content as ArrayBuffer for processing
    const audioArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
    
    // Get the sample rate from file if possible, otherwise use auto-detection
    // Pass undefined for WAV files to allow Google to auto-detect from header
    const sampleRateHertz = getSampleRate(audioArrayBuffer, file.type);
    
    // Convert to base64 for API request
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Extract the base64 content without the prefix
        const base64 = (e.target?.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    console.info('Processing audio content, direct upload:', true, 'encoding:', encoding);
    
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
    
    return response;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

// For backward compatibility
export const processSingleFile = transcribeSingleFile;
