
/**
 * Functions for extracting transcript text from various response formats
 */

/**
 * Extract plain text transcript from Google response
 * With better error handling, response format detection, and legal transcript formatting
 */
export function extractTranscriptText(response: any): string {
  try {
    if (!response) {
      console.warn('Empty response received from the API');
      return "No transcript available";
    }
    
    // Log the response structure for debugging
    console.log('Extracting transcript from response structure:', 
      JSON.stringify({
        hasResults: !!response.results,
        resultsLength: response.results?.length,
        hasTranscripts: !!response.results?.transcripts,
        hasChannels: !!response.results?.channels,
        responseType: typeof response
      })
    );
    
    // First attempt: direct Google API response format (most common)
    if (response.results && Array.isArray(response.results) && response.results.length > 0) {
      let fullText = '';
      response.results.forEach((result: any) => {
        if (result.alternatives && result.alternatives.length > 0) {
          fullText += result.alternatives[0].transcript + ' ';
        }
      });
      if (fullText.trim()) {
        return fullText.trim();
      }
    }
    
    // Second attempt: standard format expected by our app
    if (response.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      return response.results.channels[0].alternatives[0].transcript;
    }
    
    // Third attempt: our app's transcript format
    if (response.results?.transcripts?.[0]?.transcript) {
      return response.results.transcripts[0].transcript;
    }
    
    // Additional check for another potential format
    if (typeof response === 'string' && response.length > 0) {
      return response;
    }
    
    // If we've reached here, no transcript is available
    console.warn('No valid transcript format found in response:', response);
    return "No transcript available";
  } catch (error) {
    console.error('Error extracting transcript text:', error);
    console.error('Response that caused error:', JSON.stringify(response, null, 2));
    return "Error extracting transcript";
  }
}
