import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transcribeSingleFile, processSingleFile } from '../singleFileProcessor';
import * as apiRequest from '../processor/apiRequest';
import * as formatDetection from '../audio/formatDetection';

// Mock dependencies
vi.mock('../processor/apiRequest');
vi.mock('../audio/formatDetection');

describe('transcribeSingleFile', () => {
  const mockFile = new File(['audio content'], 'test-audio.wav', { type: 'audio/wav' });
  const mockApiKey = 'test-api-key';
  const mockAudioBuffer = new ArrayBuffer(100);
  const mockBase64 = 'base64audio';
  const mockResponse = { results: [{ alternatives: [{ transcript: 'test transcript', confidence: 0.9 }] }] };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock FileReader
    const mockFileReaderInstance = {
      onload: null,
      onerror: null,
      readAsArrayBuffer: function() {
        setTimeout(() => {
          this.onload && this.onload({ target: { result: mockAudioBuffer } });
        }, 0);
      },
      readAsDataURL: function() {
        setTimeout(() => {
          this.onload && this.onload({ target: { result: `data:audio/wav;base64,${mockBase64}` } });
        }, 0);
      }
    };
    
    // @ts-ignore
    global.FileReader = vi.fn(() => mockFileReaderInstance);
    
    // Mock getSampleRate - return null to let Google detect sample rate automatically
    vi.mocked(formatDetection.getSampleRate).mockReturnValue(null);
    
    // Mock sendTranscriptionRequest
    vi.mocked(apiRequest.sendTranscriptionRequest).mockResolvedValue(mockResponse);
  });
  
  it('should process a WAV file correctly', async () => {
    const result = await transcribeSingleFile(mockFile, mockApiKey);
    
    // Verify the sample rate was detected
    expect(formatDetection.getSampleRate).toHaveBeenCalled();
    
    // Verify API request was made with correct parameters - without sampleRateHertz
    expect(apiRequest.sendTranscriptionRequest).toHaveBeenCalledWith(
      mockApiKey,
      mockBase64,
      expect.objectContaining({
        encoding: 'LINEAR16'
      })
    );
    
    // Verify result
    expect(result).toEqual(mockResponse);
  });
  
  it('should support custom options', async () => {
    const options = {
      enableAutomaticPunctuation: false,
      languageCode: 'en-GB'
    };
    
    await transcribeSingleFile(mockFile, mockApiKey, options);
    
    // Verify options were passed to API request without sampleRateHertz
    expect(apiRequest.sendTranscriptionRequest).toHaveBeenCalledWith(
      mockApiKey,
      mockBase64,
      expect.objectContaining({
        encoding: 'LINEAR16',
        enableAutomaticPunctuation: false,
        languageCode: 'en-GB'
      })
    );
  });
  
  it('should handle MP3 files correctly', async () => {
    const mp3File = new File(['audio content'], 'test-audio.mp3', { type: 'audio/mp3' });
    
    await transcribeSingleFile(mp3File, mockApiKey);
    
    // Verify correct encoding for MP3
    expect(apiRequest.sendTranscriptionRequest).toHaveBeenCalledWith(
      mockApiKey,
      mockBase64,
      expect.objectContaining({
        encoding: 'MP3'
      })
    );
  });
  
  it('should handle errors and rethrow them', async () => {
    const error = new Error('API error');
    vi.mocked(apiRequest.sendTranscriptionRequest).mockRejectedValueOnce(error);
    
    await expect(transcribeSingleFile(mockFile, mockApiKey)).rejects.toThrow('API error');
  });
  
  it('should add legal terms to speech context', async () => {
    await transcribeSingleFile(mockFile, mockApiKey);
    
    // Verify legal terms were added
    expect(apiRequest.sendTranscriptionRequest).toHaveBeenCalledWith(
      mockApiKey,
      mockBase64,
      expect.objectContaining({
        customTerms: expect.arrayContaining(['plaintiff', 'defendant', 'counsel'])
      })
    );
  });
  
  // Test backward compatibility
  it('should be accessible via processSingleFile alias', async () => {
    expect(processSingleFile).toBe(transcribeSingleFile);
  });
});
