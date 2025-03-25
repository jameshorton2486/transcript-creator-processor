
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
    responseKeys: response ? Object.keys(response) : [],
    responseSample: JSON.stringify(response).substring(0, 200)
  });
  
  // Return empty string for undefined/null responses
  if (!response) {
    console.error("extractTranscriptText received null/undefined response");
    return "No transcript available";
  }
  
  try {
    // Additional check: if response is already a string, use it directly
    if (typeof response === 'string' && response.length > 0) {
      console.log("Response is already a string, returning as-is:", {
        length: response.length,
        sample: response.substring(0, 100)
      });
      return response;
    }
    
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
      
      // Try to handle the case where results might contain transcript directly
      if (response.results.length === 1 && typeof response.results[0] === 'string') {
        console.log("Special case: results contains a single string");
        return response.results[0];
      }
      
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
      
      // If we have no content after processing, check if there's a direct transcript field
      if (fullTranscript.trim().length === 0 && response.transcript) {
        console.log("Using response.transcript field directly");
        return response.transcript;
      }
      
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
    
    // Direct transcript field in the response
    if (response.transcript) {
      console.log("Found direct transcript field in response");
      return response.transcript;
    }
    
    // Check if the response itself might contain text content directly
    if (response.text || response.content || response.transcription) {
      const directContent = response.text || response.content || response.transcription;
      console.log("Found direct text content field:", {
        field: response.text ? "text" : (response.content ? "content" : "transcription"),
        length: directContent.length
      });
      return directContent;
    }
    
    // Super fallback - try to get any string field that might contain the transcript
    const possibleTextFields = Object.entries(response)
      .filter(([key, value]) => typeof value === 'string' && value.length > 20)
      .sort(([, a], [, b]) => (b as string).length - (a as string).length);
    
    if (possibleTextFields.length > 0) {
      const [fieldName, fieldValue] = possibleTextFields[0];
      console.log(`Last resort: Using field "${fieldName}" as transcript:`, {
        length: (fieldValue as string).length,
        sample: (fieldValue as string).substring(0, 100)
      });
      return fieldValue as string;
    }
    
    console.error("Could not extract transcript from response:", response);
    return "Error extracting transcript";
  } catch (error) {
    console.error("Error extracting transcript:", error);
    return "Error extracting transcript";
  }
}
