
/**
 * Utilities for splitting files into chunks
 */

import { splitFlacFile } from './flacHandler';

// Calculate a safe chunk size that stays under Google's 10MB limit after base64 encoding
const BASE64_EXPANSION_FACTOR = 1.33; // base64 encoding increases size by ~33%
const GOOGLE_API_LIMIT = 10 * 1024 * 1024; // 10MB
const DEFAULT_CHUNK_SIZE = Math.floor(GOOGLE_API_LIMIT / BASE64_EXPANSION_FACTOR) - 100 * 1024; // Add 100KB safety margin

/**
 * Splits a binary file into chunks of a specified size
 * Used for large files that exceed Google's 10MB request limit
 */
export const splitFileIntoChunks = async (
  file: File, 
  maxChunkSize: number = DEFAULT_CHUNK_SIZE
): Promise<ArrayBuffer[]> => {
  const fileBuffer = await file.arrayBuffer();
  const chunks: ArrayBuffer[] = [];
  const totalBytes = fileBuffer.byteLength;
  
  console.log(`Splitting file of ${(totalBytes / (1024 * 1024)).toFixed(2)}MB into chunks of ~${(maxChunkSize / (1024 * 1024)).toFixed(2)}MB`);
  console.log(`After base64 encoding, each chunk will be approximately ${((maxChunkSize * BASE64_EXPANSION_FACTOR) / (1024 * 1024)).toFixed(2)}MB`);
  
  // For FLAC files, we need to make sure each chunk is a valid FLAC file
  if (file.type.includes("flac") || file.name.toLowerCase().endsWith(".flac")) {
    return splitFlacFile(fileBuffer, maxChunkSize);
  }
  
  // For WAV files, try to find proper chunk boundaries around RIFF headers
  if (file.type.includes("wav") || file.name.toLowerCase().endsWith(".wav")) {
    // Try to find chunk boundaries that align with WAV structure
    const isWavHeader = (data: Uint8Array, offset: number): boolean => {
      // Check for "RIFF" marker at the beginning of the WAV file
      if (offset <= 8) return false; // Too close to the start
      
      return (
        data[offset] === 0x52 && // 'R'
        data[offset + 1] === 0x49 && // 'I'
        data[offset + 2] === 0x46 && // 'F'
        data[offset + 3] === 0x46 // 'F'
      );
    };
    
    const dataView = new Uint8Array(fileBuffer);
    let currentPos = 0;
    
    while (currentPos < totalBytes) {
      // Calculate tentative end position
      let endPos = Math.min(currentPos + maxChunkSize, totalBytes);
      
      // If not at the end and not at a safe boundary, look for a better split point
      if (endPos < totalBytes && endPos > currentPos + 1024) {
        // Search backwards from the end position to find a potential header
        for (let i = endPos; i > endPos - 1024 && i > currentPos; i--) {
          if (isWavHeader(dataView, i)) {
            endPos = i;
            break;
          }
        }
      }
      
      // Extract chunk
      chunks.push(fileBuffer.slice(currentPos, endPos));
      currentPos = endPos;
      
      console.log(`Created WAV chunk: ${((endPos - (currentPos - endPos)) / (1024 * 1024)).toFixed(2)}MB`);
    }
  } else {
    // For other formats, just split by size
    for (let i = 0; i < totalBytes; i += maxChunkSize) {
      const chunkSize = Math.min(maxChunkSize, totalBytes - i);
      chunks.push(fileBuffer.slice(i, i + chunkSize));
      
      console.log(`Created chunk ${chunks.length}: ${(chunkSize / (1024 * 1024)).toFixed(2)}MB`);
    }
  }
  
  console.log(`Split file into ${chunks.length} chunks (${Math.round(totalBytes / (1024 * 1024))}MB total)`);
  return chunks;
};
