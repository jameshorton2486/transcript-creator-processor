
/**
 * Utilities for handling FLAC audio files
 */

/**
 * Splits a FLAC file into chunks based on frames to ensure each chunk is valid
 * This is a simplified approach that tries to find FLAC frame boundaries
 */
export const splitFlacFile = (fileBuffer: ArrayBuffer, maxChunkSize: number): ArrayBuffer[] => {
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
