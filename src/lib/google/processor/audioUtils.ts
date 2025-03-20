
// Constants for audio processing
const TARGET_SAMPLE_RATE = 16000; // 16kHz for Google Speech API
import { arrayBufferToBase64 } from '@/lib/audio/base64Converter';

// Processes audio content for API request
export const processAudioContent = async (
  file: File,
  useDirectUpload: boolean,
  encoding: string
) => {
  console.log(`Processing audio content, direct upload: ${useDirectUpload}, encoding: ${encoding}`);
  
  let base64Audio;
  
  try {
    // Get original audio buffer
    const rawBuffer = await file.arrayBuffer();
    
    // Validate audio buffer isn't empty or corrupted
    if (!rawBuffer || rawBuffer.byteLength === 0) {
      throw new Error('Audio file appears to be empty or corrupted');
    }
    
    // Log audio file details for debugging
    console.log(`[AUDIO] Processing ${file.name} (${file.type}), size: ${(file.size / 1024).toFixed(1)}KB`);
    
    // For WAV (LINEAR16) files, verify the header is valid
    if (encoding === 'LINEAR16') {
      verifyWavHeader(rawBuffer);
    }
    
    // Convert buffer to base64
    base64Audio = await arrayBufferToBase64(rawBuffer);
    
    // Validate base64 string
    if (!base64Audio || base64Audio.length < 100) {
      console.warn('[AUDIO] Base64 conversion produced suspiciously small result');
      throw new Error('Base64 conversion failed or produced invalid output');
    }
    
    console.log(`[AUDIO] Successfully processed audio: encoding=${encoding}, base64 length=${base64Audio.length}`);
  } catch (error) {
    console.error("[AUDIO] Error processing audio:", error);
    
    // Fallback to direct upload if processing fails
    console.log("[AUDIO] Using direct upload as fallback");
    const rawBuffer = await file.arrayBuffer();
    base64Audio = await arrayBufferToBase64(rawBuffer);
  }
  
  return { base64Audio, actualSampleRate: TARGET_SAMPLE_RATE };
};

/**
 * Verifies WAV header to ensure it's properly formatted
 * @param {ArrayBuffer} buffer - WAV file buffer
 * @returns {boolean} - Whether the WAV header is valid
 */
function verifyWavHeader(buffer: ArrayBuffer): boolean {
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
}

// Helper function to get standard sample rate based on encoding
function getStandardSampleRate(encoding: string): number {
  // Always return 16000 Hz regardless of encoding
  return TARGET_SAMPLE_RATE;
}

// Determines if direct upload should be used based on file characteristics
export const shouldUseDirectUpload = (
  file: File, 
  skipBrowserDecoding: boolean
) => {
  const encoding = detectAudioEncoding(file);
  console.log(`Detected encoding: ${encoding}`);
  
  // For FLAC files, we might want to use direct upload
  // but for others, we'll process them to ensure correct sample rate
  const useDirectUpload = skipBrowserDecoding && encoding === "FLAC";
  return { encoding, useDirectUpload };
};

// Function to detect audio encoding based on file type
function detectAudioEncoding(file: File): string {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  
  if (type.includes('flac') || name.endsWith('.flac')) {
    return 'FLAC';
  } else if (type.includes('mp3') || name.endsWith('.mp3')) {
    return 'MP3';
  } else if (type.includes('wav') || name.endsWith('.wav')) {
    return 'LINEAR16';
  } else if (type.includes('ogg') || name.endsWith('.ogg')) {
    return 'OGG_OPUS';
  } else if (type.includes('amr') || name.endsWith('.amr')) {
    return 'AMR';
  } else if (type.includes('webm') || name.endsWith('.webm')) {
    return 'WEBM_OPUS';
  }
  
  // Default to WAV format if unknown
  return 'LINEAR16';
}
