
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
    
    // Convert buffer to base64
    base64Audio = await arrayBufferToBase64(rawBuffer);
    console.log(`[AUDIO] Successfully processed audio: encoding=${encoding}`);
  } catch (error) {
    console.error("[AUDIO] Error processing audio:", error);
    
    // Fallback to direct upload if processing fails
    console.log("[AUDIO] Using direct upload as fallback");
    const rawBuffer = await file.arrayBuffer();
    base64Audio = await arrayBufferToBase64(rawBuffer);
  }
  
  return { base64Audio, actualSampleRate: TARGET_SAMPLE_RATE };
};

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
