
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processBatchFile, transcribeBatchedAudio } from '../batchProcessor';
import * as audioSplitter from '../../audio/audioSplitter';
import * as singleFileProcessor from '../singleFileProcessor';
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '@/lib/config';

// Mock dependencies
vi.mock('../../audio/audioSplitter');
vi.mock('../singleFileProcessor');

describe('processBatchFile', () => {
  const mockFile = new File(['audio content'], 'large-audio.mp3', { type: 'audio/mp3' });
  const mockApiKey = 'test-api-key';
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
    
    // Mock singleFileProcessor to return transcription results with the correct format
    vi.mocked(singleFileProcessor.transcribeSingleFile).mockImplementation(
      async (file) => {
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
    
    // Verify audioSplitter was called
    expect(audioSplitter.splitAudioIntoChunks).toHaveBeenCalledWith(mockFile);
    
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
    
    // Verify custom terms were passed to transcribeSingleFile
    const calls = vi.mocked(singleFileProcessor.transcribeSingleFile).mock.calls;
    expect(calls[0][3]).toEqual(mockCustomTerms);
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
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Batched transcription error'));
  });
  
  // Test the alias
  it('should process a file using the processBatchFile alias', async () => {
    const result = await processBatchFile(mockFile, mockApiKey, DEFAULT_TRANSCRIPTION_OPTIONS, mockProgressCallback);
    
    // Verify audioSplitter was called
    expect(audioSplitter.splitAudioIntoChunks).toHaveBeenCalledWith(mockFile);
    
    // Verify the result contains transcripts
    expect(result.results.transcripts.length).toBeGreaterThan(0);
    expect(result.results.channels.length).toBeGreaterThan(0);
  });
});
