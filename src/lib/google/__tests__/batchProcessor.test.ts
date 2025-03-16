
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processBatchFile } from '../batchProcessor';
import * as audioSplitter from '../../audio/audioSplitter';
import * as singleFileProcessor from '../singleFileProcessor';

// Mock dependencies
vi.mock('../../audio/audioSplitter');
vi.mock('../singleFileProcessor');

describe('processBatchFile', () => {
  const mockFile = new File(['audio content'], 'large-audio.mp3', { type: 'audio/mp3' });
  const mockApiKey = 'test-api-key';
  const mockOptions = { language: 'en-US', model: 'default' };
  const mockProgressCallback = vi.fn();
  const mockCustomTerms = ['term1', 'term2'];
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the audioSplitter to return chunks
    const chunk1 = new Blob(['chunk1'], { type: 'audio/wav' });
    const chunk2 = new Blob(['chunk2'], { type: 'audio/wav' });
    vi.mocked(audioSplitter.splitAudioIntoChunks).mockResolvedValue([
      new File([chunk1], 'chunk1.wav', { type: 'audio/wav' }),
      new File([chunk2], 'chunk2.wav', { type: 'audio/wav' })
    ]);
    
    // Mock singleFileProcessor to return transcription results
    vi.mocked(singleFileProcessor.processSingleFile).mockImplementation(
      async (file) => {
        const chunkNumber = file.name.includes('1') ? '1' : '2';
        return {
          results: [{
            alternatives: [{ transcript: `Transcript for chunk ${chunkNumber}` }]
          }]
        };
      }
    );
  });
  
  it('should process a file in chunks and merge results', async () => {
    const result = await processBatchFile(mockFile, mockApiKey, mockOptions, mockProgressCallback);
    
    // Verify audioSplitter was called
    expect(audioSplitter.splitAudioIntoChunks).toHaveBeenCalledWith(mockFile);
    
    // Verify processSingleFile was called for each chunk
    expect(singleFileProcessor.processSingleFile).toHaveBeenCalledTimes(2);
    
    // Verify progressCallback was called with updates
    expect(mockProgressCallback).toHaveBeenCalledWith(50); // 1/2 chunks processed
    expect(mockProgressCallback).toHaveBeenCalledWith(100); // 2/2 chunks processed
    
    // Verify merged results
    expect(result.results.length).toBeGreaterThan(0);
    const fullTranscript = result.results
      .flatMap(r => r.alternatives)
      .map(a => a.transcript)
      .join(' ');
      
    expect(fullTranscript).toContain('Transcript for chunk 1');
    expect(fullTranscript).toContain('Transcript for chunk 2');
  });
  
  it('should pass custom terms to each chunk processor', async () => {
    await processBatchFile(mockFile, mockApiKey, mockOptions, mockProgressCallback, mockCustomTerms);
    
    // Verify custom terms were passed to processSingleFile
    const calls = vi.mocked(singleFileProcessor.processSingleFile).mock.calls;
    expect(calls[0][3]).toEqual(mockCustomTerms);
    expect(calls[1][3]).toEqual(mockCustomTerms);
  });
  
  it('should handle errors in chunk processing', async () => {
    // Make the second chunk fail
    vi.mocked(singleFileProcessor.processSingleFile).mockImplementationOnce(
      async () => ({
        results: [{ alternatives: [{ transcript: 'Transcript for chunk 1' }] }]
      })
    ).mockRejectedValueOnce(new Error('Failed to process chunk'));
    
    // Should still complete without throwing, but log the error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const result = await processBatchFile(mockFile, mockApiKey, mockOptions, mockProgressCallback);
    
    // Verify the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to process chunk'));
    
    // Verify we still get results from the successful chunk
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].alternatives[0].transcript).toContain('Transcript for chunk 1');
  });
});
