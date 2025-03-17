
/**
 * Utilities for splitting files into chunks
 */

import { splitFlacFile } from './flacHandler';

/**
 * Splits a binary file into chunks of a specified size
 * Used for large files that exceed Google's 10MB request limit
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
