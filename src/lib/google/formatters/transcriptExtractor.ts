
/**
 * Utility functions for extracting transcript text from Google Speech-to-Text API responses
 */

// Check if response contains legal terms that would indicate legal context
export function detectLegalContext(transcript: string): boolean {
  const legalTerms = [
    'court', 'judge', 'plaintiff', 'defendant', 'witness', 'testimony',
    'exhibit', 'objection', 'counsel', 'attorney', 'legal', 'deposition',
    'sworn', 'oath', 'verdict', 'testimony', 'prosecution', 'defense',
    'THE COURT:', 'MR.', 'MS.', 'WITNESS:', 'PLAINTIFF:', 'DEFENDANT:',
  ];
  
  const lowercaseTranscript = transcript.toLowerCase();
  
  return legalTerms.some(term => 
    lowercaseTranscript.includes(term.toLowerCase())
  );
}

/**
 * Extract plain text transcript from API response with enhanced logging for debugging
 */
export function extractTranscriptText(response: any): string {
  console.log("Extracting transcript from response:", {
    hasResponse: Boolean(response),
    responseType: typeof response,
    hasResults: Boolean(response?.results),
    resultsType: response?.results ? (Array.isArray(response.results) ? 'array' : typeof response.results) : 'undefined',
    resultsKeys: response?.results ? Object.keys(response.results) : [],
    hasTranscripts: Boolean(response?.results?.transcripts),
    hasChannels: Boolean(response?.results?.channels),
    responseKeys: response ? Object.keys(response) : []
  });
  
  // Return empty string for undefined/null responses
  if (!response) {
    console.error("extractTranscriptText received null/undefined response");
    return "No transcript available";
  }
  
  try {
    // Check for the processed response format from our adapter
    if (response.results && response.results.transcripts) {
      console.log("Found AssemblyAI-style transcript format");
      const transcript = response.results.transcripts[0]?.transcript || "No transcript available";
      console.log("Extracted transcript from AssemblyAI format:", {
        length: transcript.length,
        sample: transcript.substring(0, 100)
      });
      return transcript;
    }
    
    // Check for processed results in the expected format from our formatter
    if (response.results && response.results.channels) {
      console.log("Found processed response format");
      const transcript = response.results.channels[0]?.alternatives[0]?.transcript || "No transcript available";
      console.log("Extracted transcript from channels format:", {
        length: transcript.length,
        sample: transcript.substring(0, 100)
      });
      return transcript;
    }
    
    // Check for raw Google Speech API response format
    if (Array.isArray(response.results)) {
      console.log("Found raw Google API response format");
      
      // Combine all transcript pieces into one
      let fullTranscript = '';
      for (const result of response.results) {
        if (result.alternatives && result.alternatives.length > 0) {
          fullTranscript += result.alternatives[0].transcript + ' ';
        }
      }
      
      console.log("Extracted full transcript from raw format:", {
        length: fullTranscript.length,
        sample: fullTranscript.substring(0, 100),
        isEmpty: fullTranscript.trim().length === 0
      });
      
      return fullTranscript.trim() || "No transcript available";
    }
    
    // Check for single result Google format
    if (response.results && response.results.alternatives) {
      console.log("Found single result format");
      const transcript = response.results.alternatives[0]?.transcript || "No transcript available";
      console.log("Extracted transcript from single result format:", {
        length: transcript.length,
        sample: transcript.substring(0, 100)
      });
      return transcript;
    }
    
    // Last attempt - check if the response itself might be the transcript string
    if (typeof response === 'string' && response.length > 0) {
      console.log("Response is already a string, returning as-is:", {
        length: response.length,
        sample: response.substring(0, 100)
      });
      return response;
    }
    
    console.error("Could not extract transcript from response:", response);
    return "Error extracting transcript";
  } catch (error) {
    console.error("Error extracting transcript:", error);
    return "Error extracting transcript";
  }
}
