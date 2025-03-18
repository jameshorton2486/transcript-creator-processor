
import { describe, it, expect } from 'vitest';
import { extractTranscriptText } from '../formatters/responseFormatter';

describe('extractTranscriptText', () => {
  it('should extract transcript text from a valid response', () => {
    const mockResponse = {
      results: [
        {
          alternatives: [{ transcript: 'This is the first segment. ' }]
        },
        {
          alternatives: [{ transcript: 'This is the second segment.' }]
        }
      ]
    };
    
    const result = extractTranscriptText(mockResponse);
    expect(result).toBe('This is the first segment. This is the second segment.');
  });
  
  it('should handle empty results array', () => {
    const mockResponse = { results: [] };
    const result = extractTranscriptText(mockResponse);
    expect(result).toBe('No transcript available');
  });
  
  it('should handle missing alternatives', () => {
    const mockResponse = { results: [{}] };
    const result = extractTranscriptText(mockResponse);
    expect(result).toBe('No transcript available');
  });
  
  it('should handle empty alternatives array', () => {
    const mockResponse = { results: [{ alternatives: [] }] };
    const result = extractTranscriptText(mockResponse);
    expect(result).toBe('No transcript available');
  });
  
  it('should handle null or undefined response', () => {
    expect(extractTranscriptText(null)).toBe('Error extracting transcript');
    expect(extractTranscriptText(undefined)).toBe('Error extracting transcript');
  });
  
  it('should handle response with unexpected structure', () => {
    const mockInvalidResponse = { wrongKey: 'wrong value' };
    const result = extractTranscriptText(mockInvalidResponse);
    expect(result).toBe('No transcript available');
  });
});
