
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processSingleFile, transcribeSingleFile } from '../singleFileProcessor';
import * as wavConverter from '../../audio/wavConverter';

// Mock fetch and other dependencies
vi.mock('../../audio/wavConverter');

describe('processSingleFile', () => {
  const mockFile = new File(['audio content'], 'test-audio.mp3', { type: 'audio/mp3' });
  const mockApiKey = 'test-api-key';
  const mockOptions = { 
    language: 'en-US', 
    model: 'default',
    punctuate: true,
    diarize: true,
    paragraphs: true,
    utterances: true,
    numerals: true
  };
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
    
    const result = await transcribeSingleFile(mockFile, mockApiKey, mockOptions, mockCustomTerms);
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://speech.googleapis.com/v1/speech:recognize'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.any(String)
      })
    );
    
    // Verify the result matches the expected response
    expect(result).toEqual(expect.objectContaining({
      results: expect.arrayContaining([
        expect.objectContaining({
          alternatives: expect.arrayContaining([
            expect.objectContaining({
              transcript: 'Test transcript'
            })
          ])
        })
      ])
    }));
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
    
    await transcribeSingleFile(mockFile, mockApiKey, mockOptions, mockCustomTerms);
    
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
    
    await expect(transcribeSingleFile(mockFile, mockApiKey, mockOptions))
      .rejects.toThrow(/Google API error/);
  });
  
  // Test the alias
  it('should process a file using the processSingleFile alias', async () => {
    const mockResponse = {
      results: [{ alternatives: [{ transcript: 'Test transcript' }] }]
    };
    
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await processSingleFile(mockFile, mockApiKey, mockOptions, mockCustomTerms);
    
    // Verify the result matches the expected response
    expect(result).toEqual(expect.objectContaining({
      results: expect.arrayContaining([
        expect.objectContaining({
          alternatives: expect.arrayContaining([
            expect.objectContaining({
              transcript: 'Test transcript'
            })
          ])
        })
      ])
    }));
  });
});
