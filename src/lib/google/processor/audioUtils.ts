
import { 
  detectAudioEncoding, 
  getStandardSampleRate, 
  arrayBufferToBase64 
} from '../audio';
import { getAudioContext } from '../../audio/audioContext';

// Processes audio content for API request
export const processAudioContent = async (
  file: File,
  useDirectUpload: boolean,
  encoding: string
) => {
  console.log(`Processing audio content, direct upload: ${useDirectUpload}, encoding: ${encoding}`);
  
  let base64Audio;
  let actualSampleRate;
  
  if (useDirectUpload) {
    // For FLAC files or when browser decoding should be skipped, 
    // use direct upload without browser decoding
    console.log("Using direct upload without browser audio processing");
    const rawBuffer = await file.arrayBuffer();
    base64Audio = arrayBufferToBase64(rawBuffer);
    
    // Use standard sample rates based on file type
    actualSampleRate = getStandardSampleRate(encoding);
    console.log(`Using standard sample rate: ${actualSampleRate} Hz for direct upload`);
  } else {
    // Fall back to direct upload if preprocessing fails
    console.log("Using direct upload as fallback");
    const rawBuffer = await file.arrayBuffer();
    base64Audio = arrayBufferToBase64(rawBuffer);
    actualSampleRate = getStandardSampleRate(encoding);
    console.log(`Using standard sample rate: ${actualSampleRate} Hz as fallback`);
  }
  
  return { base64Audio, actualSampleRate };
};

// Attempts to detect actual sample rate from audio file
export const detectActualSampleRate = async (preprocessedAudio: ArrayBuffer) => {
  console.log("Detecting audio sample rate...");
  const audioContext = getAudioContext();
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(preprocessedAudio.slice(0));
    const actualSampleRate = audioBuffer.sampleRate;
    console.log(`Detected actual sample rate: ${actualSampleRate} Hz`);
    return actualSampleRate;
  } catch (error) {
    console.error("Failed to detect sample rate:", error);
    return null;
  }
};

// Determines if direct upload should be used based on file characteristics
export const shouldUseDirectUpload = (
  file: File, 
  skipBrowserDecoding: boolean
) => {
  const { encoding, shouldSkipBrowserDecoding } = detectAudioEncoding(file);
  console.log(`Detected encoding: ${encoding}`);
  
  const useDirectUpload = skipBrowserDecoding || shouldSkipBrowserDecoding || encoding === "FLAC";
  return { encoding, useDirectUpload };
};
