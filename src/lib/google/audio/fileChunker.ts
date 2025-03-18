
/**
 * Utilities for splitting files into chunks
 */

import { splitFlacFile } from './flacHandler';

// Calculate a safe chunk size that stays under Google's 10MB limit after base64 encoding
const BASE64_EXPANSION_FACTOR = 1.33; // base64 encoding increases size by ~33%
const GOOGLE_API_LIMIT = 10 * 1024 * 1024; // 10MB
const DEFAULT_CHUNK_SIZE = Math.floor(GOOGLE_API_LIMIT / BASE64_EXPANSION_FACTOR) - 512 * 1024; // Add 512KB safety margin

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
    // For simplicity and safety, just use equal-sized chunks for WAV files
    // This avoids potential issues with incorrect RIFF header detection
    for (let i = 0; i < totalBytes; i += maxChunkSize) {
      const chunkSize = Math.min(maxChunkSize, totalBytes - i);
      chunks.push(fileBuffer.slice(i, i + chunkSize));
      
      console.log(`Created WAV chunk ${chunks.length}: ${(chunkSize / (1024 * 1024)).toFixed(2)}MB`);
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
