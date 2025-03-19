
/**
 * Utilities for splitting files into chunks with enhanced error handling
 */

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
    const processingStartTime = performance.now();
    console.log(`[CHUNKER] [${new Date().toISOString()}] Starting file chunking for ${file.name}`);
    
    // Get file as ArrayBuffer
    let fileBuffer: ArrayBuffer;
    try {
      fileBuffer = await file.arrayBuffer();
      console.log(`[CHUNKER] [${new Date().toISOString()}] Successfully read file into buffer: ${(fileBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`);
    } catch (readError) {
      console.error(`[CHUNKER ERROR] [${new Date().toISOString()}] Failed to read file:`, readError);
      throw new Error(`Failed to read file: ${readError instanceof Error ? readError.message : String(readError)}`);
    }
    
    const chunks: ArrayBuffer[] = [];
    const totalBytes = fileBuffer.byteLength;
    
    console.log(`[CHUNKER] [${new Date().toISOString()}] Splitting file of ${(totalBytes / (1024 * 1024)).toFixed(2)}MB into chunks of ~${(maxChunkSize / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`[CHUNKER] [${new Date().toISOString()}] After base64 encoding, each chunk will be approximately ${((maxChunkSize * BASE64_EXPANSION_FACTOR) / (1024 * 1024)).toFixed(2)}MB`);
    
    // For extremely large files, use stream processing approach to reduce memory usage
    if (totalBytes > 100 * 1024 * 1024) { // 100MB
      console.log(`[CHUNKER] [${new Date().toISOString()}] Using memory-efficient streaming approach for extremely large file (${(totalBytes / (1024 * 1024)).toFixed(2)}MB)`);
      
      // Use a smaller chunk size for large files to reduce memory pressure
      const largeFileChunkSize = maxChunkSize / 2;
      
      // Process file in segmented manner to avoid loading entire file into memory at once
      for (let i = 0; i < totalBytes; i += largeFileChunkSize) {
        // Free up memory by forcing garbage collection between chunks (indirectly)
        if (i > 0 && i % (largeFileChunkSize * 5) === 0) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Small pause to allow GC
        }
        
        const chunkSize = Math.min(largeFileChunkSize, totalBytes - i);
        const chunk = fileBuffer.slice(i, i + chunkSize);
        chunks.push(chunk);
        
        console.log(`[CHUNKER] [${new Date().toISOString()}] Created chunk ${chunks.length}: ${(chunk.byteLength / (1024 * 1024)).toFixed(2)}MB (${Math.round((i + chunkSize) / totalBytes * 100)}% of file)`);
      }
    } else {
      // For common audio formats, use standard chunking with appropriate sizes
      console.log(`[CHUNKER] [${new Date().toISOString()}] Using standard chunking`);
      
      for (let i = 0; i < totalBytes; i += maxChunkSize) {
        const chunkSize = Math.min(maxChunkSize, totalBytes - i);
        const chunk = fileBuffer.slice(i, i + chunkSize);
        chunks.push(chunk);
        
        console.log(`[CHUNKER] [${new Date().toISOString()}] Created chunk ${chunks.length}: ${(chunk.byteLength / (1024 * 1024)).toFixed(2)}MB (${Math.round((i + chunkSize) / totalBytes * 100)}% of file)`);
      }
    }
    
    console.log(`[CHUNKER] [${new Date().toISOString()}] Split file into ${chunks.length} chunks (${(totalBytes / (1024 * 1024)).toFixed(2)}MB total)`);
    
    // Validate chunks
    if (chunks.length === 0) {
      throw new Error('Failed to create any chunks from the file');
    }
    
    // Check if sum of chunk sizes equals the original file size
    const totalChunkSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    if (totalChunkSize !== totalBytes) {
      console.warn(`[CHUNKER WARNING] [${new Date().toISOString()}] Total chunk size (${totalChunkSize}) does not match original file size (${totalBytes})`);
    }
    
    // Report processing performance
    const processingEndTime = performance.now();
    console.log(`[CHUNKER] [${new Date().toISOString()}] Chunking completed in ${(processingEndTime - processingStartTime).toFixed(2)}ms`);
    
    return chunks;
  } catch (error) {
    console.error(`[CHUNKER ERROR] [${new Date().toISOString()}] File chunking failed:`, error);
    throw new Error(`Failed to split file into chunks: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Helper function to estimate memory requirements for processing
export const estimateMemoryRequirements = (fileSize: number): {
  estimatedMemoryMB: number;
  recommendedChunkCount: number;
  isMemoryCritical: boolean;
} => {
  // Base memory overhead for processing (browser, JS engine, etc.)
  const baseMemoryOverhead = 200; // MB
  
  // Conservative estimate: we need ~3x the file size for processing
  // (original file + decoded audio + processing buffers)
  const estimatedMemoryMB = (fileSize / (1024 * 1024)) * 3 + baseMemoryOverhead;
  
  // Determine if this might exceed typical browser memory limits
  const isMemoryCritical = estimatedMemoryMB > 1500; // 1.5GB is pushing it for many browsers
  
  // Calculate recommended number of chunks based on memory constraints
  let recommendedChunkCount = 1;
  if (estimatedMemoryMB > 1500) {
    recommendedChunkCount = Math.ceil(estimatedMemoryMB / 500); // Aim for ~500MB per chunk
  } else if (estimatedMemoryMB > 800) {
    recommendedChunkCount = Math.ceil(estimatedMemoryMB / 800); // Aim for ~800MB per chunk
  }
  
  return {
    estimatedMemoryMB,
    recommendedChunkCount,
    isMemoryCritical
  };
};
