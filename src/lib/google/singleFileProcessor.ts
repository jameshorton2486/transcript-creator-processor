
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
  sampleRateHertz?: number; // Added this missing property
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
 * Verifies WAV header information to ensure it's properly formatted
 * @param {ArrayBuffer} buffer - WAV file buffer
 * @returns {boolean} - Whether the WAV header is valid
 */
const verifyWavHeader = (buffer: ArrayBuffer): boolean => {
  try {
    // WAV header should be at least 44 bytes
    if (buffer.byteLength < 44) {
      console.warn('[VERIFY] WAV buffer too small to contain a valid header');
      return false;
    }
    
    const view = new DataView(buffer);
    
    // Check "RIFF" signature (first 4 bytes)
    const riff = String.fromCharCode(
      view.getUint8(0), view.getUint8(1), 
      view.getUint8(2), view.getUint8(3)
    );
    
    // Check "WAVE" format (bytes 8-11)
    const wave = String.fromCharCode(
      view.getUint8(8), view.getUint8(9), 
      view.getUint8(10), view.getUint8(11)
    );
    
    // Check "fmt " subchunk (bytes 12-15)
    const fmt = String.fromCharCode(
      view.getUint8(12), view.getUint8(13), 
      view.getUint8(14), view.getUint8(15)
    );
    
    if (riff !== 'RIFF' || wave !== 'WAVE' || fmt !== 'fmt ') {
      console.warn(`[VERIFY] Invalid WAV header: RIFF=${riff}, WAVE=${wave}, fmt=${fmt}`);
      return false;
    }
    
    // Extract sample rate (bytes 24-27)
    const sampleRate = view.getUint32(24, true);
    
    // Extract number of channels (bytes 22-23)
    const numChannels = view.getUint16(22, true);
    
    // Extract bits per sample (bytes 34-35)
    const bitsPerSample = view.getUint16(34, true);
    
    console.log(`[VERIFY] WAV header valid: ${sampleRate}Hz, ${numChannels} channel(s), ${bitsPerSample} bits`);
    return true;
  } catch (error) {
    console.error('[VERIFY] Error checking WAV header:', error);
    return false;
  }
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
      
      // Read the file to verify WAV header
      const arrayBuffer = await normalizedFile.arrayBuffer();
      const isValidWav = verifyWavHeader(arrayBuffer);
      
      if (!isValidWav) {
        console.warn('[PREPROCESS] WAV header invalid, attempting full normalization');
      }
      
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
    // Generate a unique ID for this request for logging
    const requestId = Math.random().toString(36).substring(2, 10);
    
    // Log file details
    console.info(`[TRANSCRIBE:${requestId}] Processing file: ${(file as File).name || 'unnamed blob'}, type: ${file.type}, size: ${(file.size / 1024).toFixed(1)}KB`);
    
    // Validate file is a supported audio type
    if (file instanceof File && !isValidAudioFile(file)) {
      throw new Error('Unsupported audio file format. Please upload a WAV, MP3, FLAC, OGG, AMR, or WebM file.');
    }
    
    let fileToProcess = file;
    
    // Attempt to preprocess the file if it's a File (not a Blob)
    if (file instanceof File) {
      try {
        console.log(`[TRANSCRIBE:${requestId}] Attempting to preprocess audio file for better compatibility`);
        fileToProcess = await preprocessAudioFile(file);
        
        if (fileToProcess !== file) {
          console.log(`[TRANSCRIBE:${requestId}] File was successfully preprocessed`);
        } else {
          console.log(`[TRANSCRIBE:${requestId}] File preprocessing skipped, using original file`);
        }
      } catch (preprocessError) {
        console.warn(`[TRANSCRIBE:${requestId}] Error during preprocessing, falling back to original file:`, preprocessError);
        fileToProcess = file; // Fall back to original file
      }
    }
    
    // Determine encoding based on file type
    const fileName = fileToProcess instanceof File ? fileToProcess.name.toLowerCase() : '';
    const fileType = fileToProcess.type.toLowerCase();
    
    // Default to AUTO for WAV files, detect otherwise
    let encoding = 'AUTO'; // Changed default to AUTO
    
    if (fileName.endsWith('.wav') || fileType.includes('wav')) {
      encoding = 'AUTO'; // Always use AUTO for WAV files
      console.log(`[TRANSCRIBE:${requestId}] WAV file detected, using AUTO encoding to let Google determine parameters`);
    } else if (fileName.endsWith('.mp3') || fileType.includes('mp3')) {
      encoding = 'MP3';
    } else if (fileName.endsWith('.flac') || fileType.includes('flac')) {
      encoding = 'FLAC';
    } else if (fileName.endsWith('.ogg') || fileType.includes('ogg')) {
      encoding = 'OGG_OPUS';
    } else if (fileName.endsWith('.amr') || fileType.includes('amr')) {
      encoding = 'AMR';
    } else if (fileName.endsWith('.webm') || fileType.includes('webm')) {
      encoding = 'WEBM_OPUS';
    } else if (file instanceof File) {
      // If unable to determine from name/type, try audio validation
      const detected = detectAudioEncoding(file as File);
      encoding = detected.encoding;
      
      // If it's LINEAR16 (WAV), still use AUTO
      if (encoding === 'LINEAR16') {
        encoding = 'AUTO';
      }
    }
    
    // Override with explicit encoding from options if provided
    if (options.encoding) {
      // But still force AUTO for LINEAR16 (WAV) files
      if (options.encoding === 'LINEAR16') {
        encoding = 'AUTO';
      } else {
        encoding = options.encoding;
      }
    }
    
    console.info(`[TRANSCRIBE:${requestId}] Using encoding: ${encoding}`);
    
    // Read the file content as ArrayBuffer for processing
    const audioArrayBuffer = await readFileAsArrayBuffer(fileToProcess);
    
    // Validate the file is not empty
    if (!audioArrayBuffer || audioArrayBuffer.byteLength === 0) {
      throw new Error('The audio file is empty or could not be read.');
    }
    
    console.log(`[TRANSCRIBE:${requestId}] Read file as ArrayBuffer: ${(audioArrayBuffer.byteLength / 1024).toFixed(1)}KB`);
    
    // If this is a WAV file, verify the header
    if ((fileName.endsWith('.wav') || fileType.includes('wav'))) {
      const isValidWav = verifyWavHeader(audioArrayBuffer);
      if (!isValidWav) {
        console.warn(`[TRANSCRIBE:${requestId}] WARNING: WAV file has invalid header`);
      }
    }
    
    // Convert to base64 for API request
    const audioBase64 = await arrayBufferToBase64(audioArrayBuffer);
    console.info(`[TRANSCRIBE:${requestId}] Successfully encoded audio to base64, ready for transmission`);
    
    // Create custom terms list for legal vocabulary
    const legalTerms = [
      'plaintiff', 'defendant', 'counsel', 'objection', 'sustained', 'overruled', 
      'witness', 'testimony', 'exhibit', 'evidence', 'deposition', 'affidavit', 
      'stipulation', 'pursuant to'
    ];
    
    // Prepare transcription options with custom terms
    const transcriptionOptions = {
      encoding: encoding,
      ...options,
      customTerms: [...(options.customTerms || []), ...legalTerms]
    };
    
    // NEVER include sample rate for WAV files - let Google API detect it automatically
    if (encoding === 'AUTO' || encoding === 'LINEAR16' || 
        fileName.endsWith('.wav') || fileType.includes('wav')) {
      if (transcriptionOptions.sampleRateHertz) {
        delete transcriptionOptions.sampleRateHertz;
      }
      console.info(`[TRANSCRIBE:${requestId}] Omitting sample rate to allow Google API to detect it automatically from WAV header`);
    }
    
    console.log(`[TRANSCRIBE:${requestId}] Sending request to Google Speech API with encoding ${encoding}`);
    
    // Send the request to Google's Speech-to-Text API
    const response = await sendTranscriptionRequest(apiKey, audioBase64, transcriptionOptions);
    
    if (!response.results || response.results.length === 0) {
      console.warn(`[TRANSCRIBE:${requestId}] Google API returned empty results. This may mean no speech was detected.`);
      throw new Error('No speech was detected in the audio file. The file may be silent or contain background noise only.');
    }
    
    console.log(`[TRANSCRIBE:${requestId}] Successfully received transcription results with ${response.results.length} segments`);
    
    return response;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

// For backward compatibility
export const processSingleFile = transcribeSingleFile;
