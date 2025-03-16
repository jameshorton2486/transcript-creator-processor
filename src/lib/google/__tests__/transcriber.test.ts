
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transcribeAudio } from '../transcriber';
import * as singleFileProcessor from '../singleFileProcessor';
import * as batchProcessor from '../batchProcessor';
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '@/lib/config';

// Mock the dependencies
vi.mock('../singleFileProcessor');
vi.mock('../batchProcessor');

describe('transcribeAudio', () => {
  const mockFile = new File(['audio content'], 'test-audio.mp3', { type: 'audio/mp3' });
  const mockApiKey = 'test-api-key';
  const mockProgressCallback = vi.fn();
  const mockCustomTerms = ['term1', 'term2'];
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should process a small file with singleFileProcessor', async () => {
    const mockResponse = { results: [{ alternatives: [{ transcript: 'Test transcript' }] }] };
    vi.mocked(singleFileProcessor.transcribeSingleFile).mockResolvedValue(mockResponse);
    
    // Create a small file (less than 10MB)
    const smallFile = new File(['small content'], 'small-audio.mp3', { type: 'audio/mp3' });
    Object.defineProperty(smallFile, 'size', { value: 1024 * 1024 }); // 1MB
    
    const result = await transcribeAudio(smallFile, mockApiKey, DEFAULT_TRANSCRIPTION_OPTIONS, undefined, mockCustomTerms);
    
    expect(singleFileProcessor.transcribeSingleFile).toHaveBeenCalledWith(
      smallFile, 
      mockApiKey, 
      DEFAULT_TRANSCRIPTION_OPTIONS,
      mockCustomTerms
    );
    expect(batchProcessor.transcribeBatchedAudio).not.toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });
  
  it('should process a large file with batchProcessor', async () => {
    const mockResponse = { results: [{ alternatives: [{ transcript: 'Test batch transcript' }] }] };
    vi.mocked(batchProcessor.transcribeBatchedAudio).mockResolvedValue(mockResponse);
    
    // Create a large file (more than 10MB)
    const largeFile = new File(['large content'], 'large-audio.mp3', { type: 'audio/mp3' });
    Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }); // 15MB
    
    const result = await transcribeAudio(largeFile, mockApiKey, DEFAULT_TRANSCRIPTION_OPTIONS, mockProgressCallback, mockCustomTerms);
    
    expect(batchProcessor.transcribeBatchedAudio).toHaveBeenCalledWith(
      largeFile, 
      mockApiKey, 
      DEFAULT_TRANSCRIPTION_OPTIONS, 
      mockProgressCallback,
      mockCustomTerms
    );
    expect(singleFileProcessor.transcribeSingleFile).not.toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });
  
  it('should throw an error for unsupported file types', async () => {
    const invalidFile = new File(['content'], 'document.txt', { type: 'text/plain' });
    
    await expect(transcribeAudio(invalidFile, mockApiKey, DEFAULT_TRANSCRIPTION_OPTIONS))
      .rejects.toThrow('Unsupported file type');
  });
});
