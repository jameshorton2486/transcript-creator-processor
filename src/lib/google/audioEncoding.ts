
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
  } else if (fileType.includes("wav") || fileName.endsWith(".wav")) {
    return { 
      encoding: "LINEAR16", 
      shouldSkipBrowserDecoding: false 
    };
  }
  
  // Default for other formats
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
    case "LINEAR16": // WAV
      return 48000; // Common for WAV
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

/**
 * Splits a binary file into chunks of a specified size
 * Used for large FLAC files that exceed Google's 10MB request limit
 */
export const splitFileIntoChunks = async (file: File, maxChunkSize: number = 9 * 1024 * 1024): Promise<ArrayBuffer[]> => {
  const fileBuffer = await file.arrayBuffer();
  const chunks: ArrayBuffer[] = [];
  const totalBytes = fileBuffer.byteLength;
  
  // For FLAC files, we need to make sure each chunk is a valid FLAC file
  if (file.type.includes("flac") || file.name.toLowerCase().endsWith(".flac")) {
    return splitFlacFile(fileBuffer, maxChunkSize);
  }
  
  // For other formats, just split by size
  for (let i = 0; i < totalBytes; i += maxChunkSize) {
    const chunkSize = Math.min(maxChunkSize, totalBytes - i);
    chunks.push(fileBuffer.slice(i, i + chunkSize));
  }
  
  console.log(`Split file into ${chunks.length} chunks (${Math.round(totalBytes / (1024 * 1024))}MB total)`);
  return chunks;
};

/**
 * Splits a FLAC file into chunks based on frames to ensure each chunk is valid
 * This is a simplified approach that tries to find FLAC frame boundaries
 */
const splitFlacFile = (fileBuffer: ArrayBuffer, maxChunkSize: number): ArrayBuffer[] => {
  const bytes = new Uint8Array(fileBuffer);
  const chunks: ArrayBuffer[] = [];
  const totalBytes = bytes.byteLength;
  
  // FLAC header is 4 bytes "fLaC"
  const flacSignature = [0x66, 0x4C, 0x61, 0x43]; // "fLaC"
  
  // Find the FLAC signature - should be at the start of file
  let mainHeaderStart = -1;
  for (let i = 0; i < Math.min(100, totalBytes - 4); i++) {
    if (
      bytes[i] === flacSignature[0] &&
      bytes[i + 1] === flacSignature[1] &&
      bytes[i + 2] === flacSignature[2] &&
      bytes[i + 3] === flacSignature[3]
    ) {
      mainHeaderStart = i;
      break;
    }
  }
  
  if (mainHeaderStart === -1) {
    console.error("FLAC signature not found, file may be corrupted");
    // Fall back to simple chunking if we can't find FLAC signature
    for (let i = 0; i < totalBytes; i += maxChunkSize) {
      const chunkSize = Math.min(maxChunkSize, totalBytes - i);
      chunks.push(fileBuffer.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  // Extract the header section (metadata blocks)
  let metadataEnd = mainHeaderStart + 4;
  let isLastMetadataBlock = false;
  
  // Scan through metadata blocks
  while (!isLastMetadataBlock && metadataEnd < totalBytes - 4) {
    const blockHeader = bytes[metadataEnd];
    isLastMetadataBlock = (blockHeader & 0x80) !== 0; // Check if this is the last metadata block
    const blockType = blockHeader & 0x7F; // Get block type
    
    // Next 3 bytes are the length of this block
    const blockLength = 
      (bytes[metadataEnd + 1] << 16) | 
      (bytes[metadataEnd + 2] << 8) | 
      bytes[metadataEnd + 3];
    
    metadataEnd += 4 + blockLength; // Move past this block
  }
  
  // Now metadataEnd points to the start of the actual audio frames
  console.log(`FLAC header size: ${metadataEnd - mainHeaderStart} bytes`);
  
  // Create a header buffer that will be prepended to each chunk
  const headerBuffer = fileBuffer.slice(mainHeaderStart, metadataEnd);
  
  // Split the audio data part into chunks
  const audioData = fileBuffer.slice(metadataEnd);
  const audioBytes = new Uint8Array(audioData);
  const audioSize = audioBytes.byteLength;
  
  // Calculate actual chunk size (accounting for header in each chunk)
  const actualMaxChunkSize = maxChunkSize - headerBuffer.byteLength;
  
  // Function to find a sync code (frame boundary)
  const findNextFrameSync = (data: Uint8Array, startPos: number): number => {
    // FLAC frame sync code starts with 0xFF 0xF8 (first 14 bits are 1s)
    for (let i = startPos; i < data.length - 1; i++) {
      if (data[i] === 0xFF && (data[i + 1] & 0xF8) === 0xF8) {
        return i;
      }
    }
    return -1; // Not found
  };
  
  // Split audio part into chunks
  let position = 0;
  while (position < audioSize) {
    // Calculate end position for this chunk
    let endPos = position + actualMaxChunkSize;
    
    // Don't exceed the audio size
    if (endPos >= audioSize) {
      endPos = audioSize;
    } else {
      // Try to find a frame boundary near the end position
      const frameStart = findNextFrameSync(audioBytes, endPos - 2000);
      if (frameStart !== -1 && frameStart < endPos + 2000) {
        endPos = frameStart;
      }
    }
    
    // Extract this chunk's audio data
    const chunkAudioData = audioData.slice(position, endPos);
    
    // Create a complete chunk with header + audio data
    const chunk = new Uint8Array(headerBuffer.byteLength + chunkAudioData.byteLength);
    chunk.set(new Uint8Array(headerBuffer), 0);
    chunk.set(new Uint8Array(chunkAudioData), headerBuffer.byteLength);
    
    // Add to chunks array
    chunks.push(chunk.buffer);
    
    // Move to next position
    position = endPos;
  }
  
  console.log(`Split FLAC file into ${chunks.length} chunks`);
  return chunks;
};

/**
 * Converts a FLAC file to WAV format for better compatibility
 * Returns a promise that resolves to the converted WAV file
 */
export const convertFlacToWav = async (flacFile: File): Promise<File> => {
  try {
    // If we have a Web Audio API with AudioContext support, we can try to convert
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Read the file as an ArrayBuffer
      const arrayBuffer = await flacFile.arrayBuffer();
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create a WAV file from the decoded audio buffer
      const wav = encodeWavFile(audioBuffer);
      
      // Create a new File object from the WAV data
      return new File([wav], flacFile.name.replace(/\.flac$/i, '.wav'), { type: 'audio/wav' });
    } else {
      console.warn('AudioContext not supported by this browser, cannot convert FLAC to WAV');
      return flacFile; // Return original file if conversion is not possible
    }
  } catch (error) {
    console.error('Error converting FLAC to WAV:', error);
    return flacFile; // Return original file if conversion fails
  }
};

/**
 * Encodes an AudioBuffer to a WAV file
 */
const encodeWavFile = (audioBuffer: AudioBuffer): Blob => {
  // Extract raw audio data
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  
  // Create the WAV file container
  const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(buffer);
  
  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk1 size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
  view.setUint16(32, numberOfChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Write interleaved audio data
  const dataView = new DataView(buffer, 44);
  let offset = 0;
  
  // Get all channel data
  const channelData: Float32Array[] = [];
  for (let channel = 0; channel < numberOfChannels; channel++) {
    channelData.push(audioBuffer.getChannelData(channel));
  }
  
  // Interleave and convert to 16-bit samples
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      // Convert float32 (-1 to 1) to int16 (-32768 to 32767)
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      dataView.setInt16(offset, value, true);
      offset += 2;
    }
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
};

// Helper function to write a string to a DataView
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
