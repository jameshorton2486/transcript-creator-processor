
/**
 * Helper functions for audio encoding detection and conversion
 */

/**
 * Determines the encoding format based on file type
 */
export const detectAudioEncoding = (file: File): {
  encoding: string;
  shouldSkipBrowserDecoding: boolean;
} => {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  // Determine encoding based on file type
  if (fileType.includes("flac") || fileName.endsWith(".flac")) {
    return { 
      encoding: "FLAC", 
      shouldSkipBrowserDecoding: true 
    };
  } else if (fileType.includes("mp3") || fileName.endsWith(".mp3")) {
    return { 
      encoding: "MP3", 
      shouldSkipBrowserDecoding: false 
    };
  } else if (fileType.includes("ogg") || fileName.endsWith(".oga") || fileName.endsWith(".ogg")) {
    return { 
      encoding: "OGG_OPUS", 
      shouldSkipBrowserDecoding: false 
    };
  }
  
  // Default for WAV and other formats
  return { 
    encoding: "LINEAR16", 
    shouldSkipBrowserDecoding: false 
  };
};

/**
 * Suggests a standard sample rate based on encoding format
 */
export const getStandardSampleRate = (encoding: string): number => {
  switch (encoding) {
    case "FLAC":
      return 48000; // Common default for FLAC
    case "MP3":
      return 44100; // Common default for MP3
    case "OGG_OPUS":
      return 48000; // Common for OGG
    default:
      return 16000; // Default fallback
  }
};

/**
 * Converts ArrayBuffer to base64 string
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
};
