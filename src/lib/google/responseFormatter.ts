
// Module for formatting Google Speech-to-Text responses

/**
 * Format the Google Speech-to-Text response to match our app's expected format
 * with improved speaker diarization and legal transcript formatting
 */
export const formatGoogleResponse = (googleResponse: any) => {
  if (!googleResponse.results || googleResponse.results.length === 0) {
    return {
      results: {
        transcripts: [{ transcript: "No transcript available", confidence: 0 }],
        channels: [{ alternatives: [{ transcript: "No transcript available", confidence: 0 }] }]
      }
    };
  }

  // Extract the transcript text from all results
  let fullTranscript = '';
  let speakerNumber = 1;
  const speakerMap: Record<number, number> = {};
  let currentSpeaker = -1;
  let currentUtterance = '';
  
  // Process all results to create a full transcript with speaker labels
  googleResponse.results.forEach((result: any, index: number) => {
    if (result.alternatives && result.alternatives.length > 0) {
      const transcript = result.alternatives[0].transcript || '';
      
      // If speaker diarization is available
      if (result.alternatives[0].words && result.alternatives[0].words.length > 0) {
        result.alternatives[0].words.forEach((word: any) => {
          const speakerId = word.speakerTag || 0;
          
          // Map Google speaker tags to our format (Speaker 1, Speaker 2, etc.)
          if (!speakerMap[speakerId] && speakerId > 0) {
            speakerMap[speakerId] = speakerNumber++;
          }
          
          // If speaker changed or if we have a punctuation that suggests a natural break
          const isPunctuation = word.word.match(/[.!?]$/);
          
          if ((currentSpeaker !== -1 && currentSpeaker !== speakerId) || 
              (isPunctuation && currentUtterance.length > 50)) {
            // Only add the speaker label if we have text to add
            if (currentUtterance.trim()) {
              const speakerLabel = currentSpeaker > 0 ? 
                `Speaker ${speakerMap[currentSpeaker] || speakerNumber}:` : 
                "Speaker 1:";
              
              fullTranscript += `${speakerLabel} ${currentUtterance.trim()}\n\n`;
            }
            currentUtterance = '';
          }
          
          currentSpeaker = speakerId;
          currentUtterance += ` ${word.word}`;
        });
        
        // Add the last segment
        if (currentUtterance.trim()) {
          const speakerLabel = currentSpeaker > 0 ? 
            `Speaker ${speakerMap[currentSpeaker] || 1}:` : 
            "Speaker 1:";
          
          fullTranscript += `${speakerLabel} ${currentUtterance.trim()}\n\n`;
        }
      } else {
        // No speaker diarization, just add the transcript with a default speaker
        // Format into appropriate paragraphs based on punctuation
        const sentences = transcript.split(/(?<=[.!?])\s+/);
        
        if (sentences.length > 0) {
          fullTranscript += `Speaker ${speakerNumber}: ${sentences.join(' ')}\n\n`;
        }
      }
    }
  });
  
  // Apply legal transcript formatting rules
  fullTranscript = applyLegalFormatting(fullTranscript);
  
  // Format the response to match our expected format
  return {
    results: {
      transcripts: [
        {
          transcript: fullTranscript,
          confidence: googleResponse.results[0]?.alternatives[0]?.confidence || 0.8
        }
      ],
      channels: [
        {
          alternatives: [
            {
              transcript: fullTranscript,
              confidence: googleResponse.results[0]?.alternatives[0]?.confidence || 0.8
            }
          ]
        }
      ]
    }
  };
};

/**
 * Apply legal transcript formatting conventions
 */
function applyLegalFormatting(text: string): string {
  return text
    // Ensure proper case citations "v." format
    .replace(/\bvs\.\b/g, 'v.')
    .replace(/\bversus\b/g, 'v.')
    
    // Format case names in proper case
    .replace(/([A-Za-z]+) v\. ([A-Za-z]+)/g, (match, p1, p2) => {
      return `${capitalize(p1)} v. ${capitalize(p2)}`;
    })
    
    // Format legal roles consistently (all caps)
    .replace(/\b(plaintiff|defendant|petitioner|respondent|appellant|appellee)\b/gi, 
      (match) => match.toUpperCase())
    
    // Format "THE COURT" consistently
    .replace(/\b(the court|judge|justice)\b\s*:/gi, 'THE COURT:')
    
    // Format counsel references
    .replace(/\b([A-Za-z]+)'s counsel\b\s*:/gi, (match, name) => 
      `${name.toUpperCase()}'S COUNSEL:`)
    
    // Proper formatting for section references
    .replace(/\bsection (\d+)/gi, 'Section $1')
    
    // Proper formatting for exhibit references
    .replace(/\bexhibit (\d+)/gi, 'Exhibit $1')
    
    // Clean up multiple paragraph breaks
    .replace(/\n{3,}/g, '\n\n')
    
    // Ensure consistent spacing after punctuation
    .replace(/([.!?])([A-Z])/g, '$1 $2');
}

// Helper function to capitalize the first character of each word
function capitalize(str: string): string {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extract plain text transcript from Google response
 * Now with better error handling, response format detection, and legal transcript formatting
 */
export const extractTranscriptText = (response: any): string => {
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
        return applyLegalFormatting(fullText.trim());
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
};

/**
 * Combine multiple transcription results into a single result
 * with improved handling of speaker transitions between chunks
 */
export const combineTranscriptionResults = (results: any[]): any => {
  if (results.length === 0) {
    return {
      results: {
        transcripts: [{ transcript: "No transcript available", confidence: 0 }],
        channels: [{ alternatives: [{ transcript: "No transcript available", confidence: 0 }] }]
      }
    };
  }
  
  // Track speakers across chunks to maintain consistency
  const globalSpeakerMap: Record<string, string> = {};
  let nextSpeakerId = 1;
  
  // Process each chunk to normalize speaker IDs across chunks
  results.forEach(result => {
    if (!result.results?.channels?.[0]?.alternatives?.[0]?.transcript) return;
    
    const transcript = result.results.channels[0].alternatives[0].transcript;
    const speakerMatches = transcript.match(/Speaker \d+:/g) || [];
    
    speakerMatches.forEach(speaker => {
      if (!globalSpeakerMap[speaker]) {
        globalSpeakerMap[speaker] = `Speaker ${nextSpeakerId}:`;
        nextSpeakerId++;
      }
    });
  });
  
  // Combine all transcripts with proper spacing and consistent speaker IDs
  let combinedTranscript = '';
  let confidenceSum = 0;
  
  results.forEach((result, index) => {
    if (!result.results?.channels?.[0]?.alternatives?.[0]?.transcript) return;
    
    let transcript = result.results.channels[0].alternatives[0].transcript;
    
    // Replace speaker IDs according to global mapping
    Object.entries(globalSpeakerMap).forEach(([originalId, normalizedId]) => {
      const regex = new RegExp(originalId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      transcript = transcript.replace(regex, normalizedId);
    });
    
    // Handle chunk transitions to avoid abrupt speaker changes at boundaries
    if (index > 0 && combinedTranscript.length > 0) {
      // If the last chunk ended with a speaker and this one starts with text (no speaker),
      // then we don't need an additional newline
      const lastChunkEndsSpeaker = /Speaker \d+:[^\n]*$/i.test(combinedTranscript);
      const thisChunkStartsSpeaker = /^Speaker \d+:/i.test(transcript.trimStart());
      
      if (lastChunkEndsSpeaker && !thisChunkStartsSpeaker) {
        // Just add a space instead of a newline
        combinedTranscript += ' ';
      } else if (!combinedTranscript.endsWith('\n\n')) {
        // Add proper paragraph spacing
        combinedTranscript += '\n\n';
      }
    }
    
    combinedTranscript += transcript;
    
    // Accumulate confidence scores
    if (result.results?.channels?.[0]?.alternatives?.[0]?.confidence) {
      confidenceSum += result.results.channels[0].alternatives[0].confidence;
    }
  });
  
  // Apply final legal formatting to the combined transcript
  combinedTranscript = applyLegalFormatting(combinedTranscript);
  
  // Calculate average confidence
  const avgConfidence = results.length > 0 ? confidenceSum / results.length : 0;
  
  // Return in the expected format
  return {
    results: {
      transcripts: [
        {
          transcript: combinedTranscript || "No transcript available",
          confidence: avgConfidence
        }
      ],
      channels: [
        {
          alternatives: [
            {
              transcript: combinedTranscript || "No transcript available",
              confidence: avgConfidence
            }
          ]
        }
      ]
    }
  };
};

/**
 * Helper function to convert ArrayBuffer to base64
 * But rename it to avoid conflict with the same function in audio/index.ts
 */
export const responseFormatterBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
};
