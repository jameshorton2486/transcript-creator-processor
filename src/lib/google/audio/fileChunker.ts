
/**
 * Utilities for splitting files into chunks with enhanced error handling
 */

import { splitFlacFile } from './flacHandler';

// Calculate a safe chunk size that stays under Google's 10MB limit after base64 encoding
const BASE64_EXPANSION_FACTOR = 1.33; // base64 encoding increases size by ~33%
const GOOGLE_API_LIMIT = 10 * 1024 * 1024; // 10MB
const DEFAULT_CHUNK_SIZE = Math.floor(GOOGLE_API_LIMIT / BASE64_EXPANSION_FACTOR) - 768 * 1024; // Add 768KB safety margin

/**
 * Splits a binary file into chunks of a specified size
 * Used for large files that exceed Google's 10MB request limit
 */
export const splitFileIntoChunks = async (
  file: File, 
  maxChunkSize: number = DEFAULT_CHUNK_SIZE
): Promise<ArrayBuffer[]> => {
  try {
    console.log(`[CHUNKER] Starting file chunking for ${file.name}`);
    
    // Get file as ArrayBuffer
    let fileBuffer: ArrayBuffer;
    try {
      fileBuffer = await file.arrayBuffer();
      console.log(`[CHUNKER] Successfully read file into buffer: ${(fileBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`);
    } catch (readError) {
      console.error(`[CHUNKER ERROR] Failed to read file:`, readError);
      throw new Error(`Failed to read file: ${readError instanceof Error ? readError.message : String(readError)}`);
    }
    
    const chunks: ArrayBuffer[] = [];
    const totalBytes = fileBuffer.byteLength;
    
    console.log(`[CHUNKER] Splitting file of ${(totalBytes / (1024 * 1024)).toFixed(2)}MB into chunks of ~${(maxChunkSize / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`[CHUNKER] After base64 encoding, each chunk will be approximately ${((maxChunkSize * BASE64_EXPANSION_FACTOR) / (1024 * 1024)).toFixed(2)}MB`);
    
    // For FLAC files, use specialized splitter to ensure valid FLAC chunks
    if (file.type.includes("flac") || file.name.toLowerCase().endsWith(".flac")) {
      console.log(`[CHUNKER] Using specialized FLAC file splitter`);
      try {
        const flacChunks = await splitFlacFile(fileBuffer, maxChunkSize);
        console.log(`[CHUNKER] Successfully split FLAC file into ${flacChunks.length} chunks`);
        return flacChunks;
      } catch (flacError) {
        console.error(`[CHUNKER ERROR] FLAC splitting failed:`, flacError);
        // Fall back to generic chunking if FLAC specific chunking fails
        console.log(`[CHUNKER] Falling back to generic chunking for FLAC file`);
      }
    }
    
    // Use different chunking strategies based on file type
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const isWav = fileType.includes("wav") || fileName.endsWith(".wav");
    const isMp3 = fileType.includes("mp3") || fileName.endsWith(".mp3");
    const isVideo = fileType.includes("video") || fileName.endsWith(".mp4") || fileName.endsWith(".webm") || fileName.endsWith(".mov");
    
    // For common audio formats, use standard chunking with appropriate sizes
    console.log(`[CHUNKER] Using standard chunking for ${isWav ? 'WAV' : isMp3 ? 'MP3' : isVideo ? 'video' : 'generic'} file`);
    
    for (let i = 0; i < totalBytes; i += maxChunkSize) {
      const chunkSize = Math.min(maxChunkSize, totalBytes - i);
      const chunk = fileBuffer.slice(i, i + chunkSize);
      chunks.push(chunk);
      
      console.log(`[CHUNKER] Created chunk ${chunks.length}: ${(chunk.byteLength / (1024 * 1024)).toFixed(2)}MB (${Math.round((i + chunkSize) / totalBytes * 100)}% of file)`);
    }
    
    console.log(`[CHUNKER] Split file into ${chunks.length} chunks (${(totalBytes / (1024 * 1024)).toFixed(2)}MB total)`);
    
    // Validate chunks
    if (chunks.length === 0) {
      throw new Error('Failed to create any chunks from the file');
    }
    
    // Check if sum of chunk sizes equals the original file size
    const totalChunkSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    if (totalChunkSize !== totalBytes) {
      console.warn(`[CHUNKER WARNING] Total chunk size (${totalChunkSize}) does not match original file size (${totalBytes})`);
    }
    
    return chunks;
  } catch (error) {
    console.error(`[CHUNKER ERROR] File chunking failed:`, error);
    throw new Error(`Failed to split file into chunks: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Helper function to create a proper chunk boundary
export const findSafeChunkBoundary = (buffer: ArrayBuffer, startPosition: number, maxChunkSize: number): number => {
  // For simplicity, we're just using fixed sizes
  // In a production system, you might want to look for silence or other markers
  return Math.min(startPosition + maxChunkSize, buffer.byteLength);
};
