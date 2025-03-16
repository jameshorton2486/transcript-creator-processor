
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transcribeAudio } from '../transcriber';
import * as singleFileProcessor from '../singleFileProcessor';
import * as batchProcessor from '../batchProcessor';

// Mock the dependencies
vi.mock('../singleFileProcessor');
vi.mock('../batchProcessor');

describe('transcribeAudio', () => {
  const mockFile = new File(['audio content'], 'test-audio.mp3', { type: 'audio/mp3' });
  const mockApiKey = 'test-api-key';
  const mockOptions = { language: 'en-US', model: 'default' };
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
    vi.mocked(singleFileProcessor.processSingleFile).mockResolvedValue(mockResponse);
    
    // Create a small file (less than 10MB)
    const smallFile = new File(['small content'], 'small-audio.mp3', { type: 'audio/mp3' });
    Object.defineProperty(smallFile, 'size', { value: 1024 * 1024 }); // 1MB
    
    const result = await transcribeAudio(smallFile, mockApiKey, mockOptions, undefined, mockCustomTerms);
    
    expect(singleFileProcessor.processSingleFile).toHaveBeenCalledWith(
      smallFile, 
      mockApiKey, 
      mockOptions,
      mockCustomTerms
    );
    expect(batchProcessor.processBatchFile).not.toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });
  
  it('should process a large file with batchProcessor', async () => {
    const mockResponse = { results: [{ alternatives: [{ transcript: 'Test batch transcript' }] }] };
    vi.mocked(batchProcessor.processBatchFile).mockResolvedValue(mockResponse);
    
    // Create a large file (more than 10MB)
    const largeFile = new File(['large content'], 'large-audio.mp3', { type: 'audio/mp3' });
    Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }); // 15MB
    
    const result = await transcribeAudio(largeFile, mockApiKey, mockOptions, mockProgressCallback, mockCustomTerms);
    
    expect(batchProcessor.processBatchFile).toHaveBeenCalledWith(
      largeFile, 
      mockApiKey, 
      mockOptions, 
      mockProgressCallback,
      mockCustomTerms
    );
    expect(singleFileProcessor.processSingleFile).not.toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });
  
  it('should throw an error for unsupported file types', async () => {
    const invalidFile = new File(['content'], 'document.txt', { type: 'text/plain' });
    
    await expect(transcribeAudio(invalidFile, mockApiKey, mockOptions))
      .rejects.toThrow('Unsupported file type');
  });
});
