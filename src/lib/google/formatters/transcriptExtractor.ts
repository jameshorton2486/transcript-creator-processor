
/**
 * Functions for extracting transcript text from various response formats
 * with improved handling for legal transcripts
 */

import { applyLegalFormatting } from './legalFormatter';

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
      let hasQAFormat = false;
      
      // Check if the transcript has Q&A format
      for (const result of response.results) {
        if (result.alternatives && result.alternatives.length > 0) {
          const segmentText = result.alternatives[0].transcript || '';
          if (segmentText.match(/\b[QA]:\s/i)) {
            hasQAFormat = true;
            break;
          }
        }
      }
      
      // Process the transcript based on format
      response.results.forEach((result: any) => {
        if (result.alternatives && result.alternatives.length > 0) {
          const segmentText = result.alternatives[0].transcript || '';
          
          if (hasQAFormat) {
            // If Q&A format, preserve line breaks between Q and A
            const qaSegments = segmentText.split(/(?=\b[QA]:\s)/i);
            qaSegments.forEach((segment: string) => {
              if (segment.trim()) {
                fullText += segment.trim() + '\n';
              }
            });
          } else {
            // Regular format, just append with space
            fullText += segmentText + ' ';
          }
        }
      });
      
      if (fullText.trim()) {
        // Apply basic legal formatting to the extracted text
        return applyLegalFormatting(fullText.trim());
      }
    }
    
    // Second attempt: standard format expected by our app
    if (response.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      return applyLegalFormatting(response.results.channels[0].alternatives[0].transcript);
    }
    
    // Third attempt: our app's transcript format
    if (response.results?.transcripts?.[0]?.transcript) {
      return applyLegalFormatting(response.results.transcripts[0].transcript);
    }
    
    // Additional check for another potential format
    if (typeof response === 'string' && response.length > 0) {
      return applyLegalFormatting(response);
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

/**
 * Detect if transcript contains legal terminology or court proceedings
 */
export function detectLegalContext(transcript: string): boolean {
  const legalTerms = [
    /court/i, /judge/i, /plaintiff/i, /defendant/i, /counsel/i, 
    /exhibit/i, /objection/i, /sustained/i, /overruled/i,
    /testimony/i, /witness/i, /sworn/i, /oath/i, /case/i,
    /\bv\.\b/, /versus/i, /docket/i, /bailiff/i, /motion/i
  ];
  
  // Check for common Q&A format used in depositions and court proceedings
  const hasQAFormat = /\b[QA]:\s/i.test(transcript);
  
  // Check for legal terminology
  const hasLegalTerms = legalTerms.some(term => term.test(transcript));
  
  return hasQAFormat || hasLegalTerms;
}
