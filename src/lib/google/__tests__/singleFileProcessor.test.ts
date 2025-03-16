
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processSingleFile } from '../singleFileProcessor';
import * as wavConverter from '../../audio/wavConverter';

// Mock fetch and other dependencies
vi.mock('../../audio/wavConverter');

describe('processSingleFile', () => {
  const mockFile = new File(['audio content'], 'test-audio.mp3', { type: 'audio/mp3' });
  const mockApiKey = 'test-api-key';
  const mockOptions = { language: 'en-US', model: 'default' };
  const mockCustomTerms = ['term1', 'term2'];
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the fetch function
    global.fetch = vi.fn();
    
    // Mock the wavConverter
    vi.mocked(wavConverter.convertToWav).mockResolvedValue(new ArrayBuffer(1024));
  });
  
  it('should process a file and return transcription results', async () => {
    const mockResponse = {
      results: [{ alternatives: [{ transcript: 'Test transcript' }] }]
    };
    
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await processSingleFile(mockFile, mockApiKey, mockOptions, mockCustomTerms);
    
    // Verify wavConverter was called
    expect(wavConverter.convertToWav).toHaveBeenCalledWith(mockFile);
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://speech.googleapis.com/v1p1beta1/speech:recognize'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockApiKey}`
        }),
        body: expect.any(String)
      })
    );
    
    // Verify the result matches the expected response
    expect(result).toEqual(mockResponse);
  });
  
  it('should include speech adaptation when custom terms are provided', async () => {
    const mockResponse = {
      results: [{ alternatives: [{ transcript: 'Test with custom terms' }] }]
    };
    
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });
    
    await processSingleFile(mockFile, mockApiKey, mockOptions, mockCustomTerms);
    
    // Capture the fetch call arguments
    const fetchCall = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    
    // Verify speech adaptation config was included
    expect(requestBody.config.speechContexts).toBeDefined();
    expect(requestBody.config.speechContexts[0].phrases).toEqual(mockCustomTerms);
  });
  
  it('should throw an error when API response is not ok', async () => {
    // Mock failed API response
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: 'Invalid request' })
    });
    
    await expect(processSingleFile(mockFile, mockApiKey, mockOptions))
      .rejects.toThrow('API request failed with status 400: Bad Request');
  });
});
