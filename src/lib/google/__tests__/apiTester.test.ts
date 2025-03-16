
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testApiKey } from '../apiTester';

describe('testApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the fetch function
    global.fetch = vi.fn();
  });
  
  it('should return true for a valid API key', async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200
    });
    
    const result = await testApiKey('valid-api-key');
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://speech.googleapis.com/v1p1beta1/operations'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer valid-api-key'
        })
      })
    );
    
    expect(result).toBe(true);
  });
  
  it('should return false for an invalid API key', async () => {
    // Mock failed API response for invalid key
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401
    });
    
    const result = await testApiKey('invalid-api-key');
    expect(result).toBe(false);
  });
  
  it('should return false when API request fails', async () => {
    // Mock network failure
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    
    const result = await testApiKey('any-api-key');
    expect(result).toBe(false);
  });
  
  it('should handle different error status codes', async () => {
    // Test with various error status codes
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 403 // Forbidden
    });
    
    const result = await testApiKey('api-key-with-no-permissions');
    expect(result).toBe(false);
  });
});
