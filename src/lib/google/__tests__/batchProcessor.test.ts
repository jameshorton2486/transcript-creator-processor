
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processBatchFile, transcribeBatchedAudio } from '../batchProcessor';
import * as fileChunker from '../audio/fileChunker';
import * as singleFileProcessor from '../singleFileProcessor';
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '@/lib/config';

// Mock dependencies
vi.mock('../audio/fileChunker');
vi.mock('../singleFileProcessor');

describe('processBatchFile', () => {
  const mockFile = new File(['audio content'], 'large-audio.mp3', { type: 'audio/mp3' });
  const mockApiKey = 'test-api-key';
  const mockProgressCallback = vi.fn();
  const mockCustomTerms = ['term1', 'term2'];
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the fileChunker to return chunks
    const mockChunk1 = new ArrayBuffer(100);
    const mockChunk2 = new ArrayBuffer(100);
    vi.mocked(fileChunker.splitFileIntoChunks).mockResolvedValue([mockChunk1, mockChunk2]);
    
    // Mock singleFileProcessor to return transcription results with the correct format
    vi.mocked(singleFileProcessor.transcribeSingleFile).mockImplementation(
      async (file, apiKey, options) => {
        const chunkNumber = file.name.includes('1') ? '1' : '2';
        return {
          results: {
            transcripts: [{ transcript: `Transcript for chunk ${chunkNumber}`, confidence: 0.95 }],
            channels: [{ alternatives: [{ transcript: `Transcript for chunk ${chunkNumber}`, confidence: 0.95 }] }]
          }
        };
      }
    );
  });
  
  it('should process a file in chunks and merge results', async () => {
    const result = await transcribeBatchedAudio(mockFile, mockApiKey, DEFAULT_TRANSCRIPTION_OPTIONS, mockProgressCallback);
    
    // Verify fileChunker was called
    expect(fileChunker.splitFileIntoChunks).toHaveBeenCalledWith(mockFile, expect.any(Number));
    
    // Verify transcribeSingleFile was called for each chunk
    expect(singleFileProcessor.transcribeSingleFile).toHaveBeenCalledTimes(2);
    
    // Verify progressCallback was called with updates
    expect(mockProgressCallback).toHaveBeenCalled();
    
    // Verify the result contains transcripts from both chunks
    expect(result.results.transcripts.length).toBeGreaterThan(0);
    expect(result.results.channels.length).toBeGreaterThan(0);
  });
  
  it('should pass custom terms to each chunk processor', async () => {
    await transcribeBatchedAudio(mockFile, mockApiKey, DEFAULT_TRANSCRIPTION_OPTIONS, mockProgressCallback, mockCustomTerms);
    
    // Verify custom terms were passed in options
    const callOptions = vi.mocked(singleFileProcessor.transcribeSingleFile).mock.calls[0][2];
    expect(callOptions).toMatchObject(expect.objectContaining({
      encoding: 'MP3'
    }));
  });
  
  it('should handle errors in chunk processing', async () => {
    // Make the second chunk fail
    vi.mocked(singleFileProcessor.transcribeSingleFile)
      .mockResolvedValueOnce({
        results: {
          transcripts: [{ transcript: 'Transcript for chunk 1', confidence: 0.9 }],
          channels: [{ alternatives: [{ transcript: 'Transcript for chunk 1', confidence: 0.9 }] }]
        }
      })
      .mockRejectedValueOnce(new Error('Failed to process chunk'));
    
    // Should still complete without throwing, but log the error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const result = await transcribeBatchedAudio(mockFile, mockApiKey, DEFAULT_TRANSCRIPTION_OPTIONS, mockProgressCallback);
    
    // Verify the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[BATCH ERROR]'), expect.anything());
    
    // Verify we still got some results
    expect(result.results.transcripts.length).toBeGreaterThan(0);
  });
  
  // Test the alias
  it('should process a file using the processBatchFile alias', async () => {
    const result = await processBatchFile(mockFile, mockApiKey, DEFAULT_TRANSCRIPTION_OPTIONS, mockProgressCallback);
    
    // Verify fileChunker was called
    expect(fileChunker.splitFileIntoChunks).toHaveBeenCalledWith(mockFile, expect.any(Number));
    
    // Verify the result contains transcripts
    expect(result.results.transcripts.length).toBeGreaterThan(0);
    expect(result.results.channels.length).toBeGreaterThan(0);
  });
});
