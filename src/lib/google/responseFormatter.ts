
// Module for formatting Google Speech API responses

/**
 * Format the Google Speech-to-Text response to match our app's expected format
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
  
  // Process all results to create a full transcript with speaker labels
  googleResponse.results.forEach((result: any, index: number) => {
    if (result.alternatives && result.alternatives.length > 0) {
      const transcript = result.alternatives[0].transcript || '';
      
      // If speaker diarization is available
      if (result.alternatives[0].words && result.alternatives[0].words.length > 0) {
        let currentSpeaker = -1;
        let currentText = '';
        
        result.alternatives[0].words.forEach((word: any) => {
          const speakerId = word.speakerTag || 0;
          
          // Map Google speaker tags to our format (Speaker 1, Speaker 2, etc.)
          if (!speakerMap[speakerId]) {
            speakerMap[speakerId] = speakerNumber++;
          }
          
          // If speaker changed, add the previous segment
          if (currentSpeaker !== -1 && currentSpeaker !== speakerId) {
            fullTranscript += `Speaker ${speakerMap[currentSpeaker]}: ${currentText.trim()}\n`;
            currentText = '';
          }
          
          currentSpeaker = speakerId;
          currentText += ` ${word.word}`;
        });
        
        // Add the last segment
        if (currentText.trim()) {
          fullTranscript += `Speaker ${speakerMap[currentSpeaker]}: ${currentText.trim()}\n`;
        }
      } else {
        // No speaker diarization, just add the transcript with a default speaker
        fullTranscript += `Speaker ${speakerNumber}: ${transcript.trim()}\n`;
      }
    }
  });
  
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
 * Extract plain text transcript from Google response
 */
export const extractTranscriptText = (response: any): string => {
  try {
    // First attempt: standard format expected by our app
    if (response?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      return response.results.channels[0].alternatives[0].transcript;
    }
    
    // Second attempt: direct from Google API format
    if (response?.results?.transcripts?.[0]?.transcript) {
      return response.results.transcripts[0].transcript;
    }
    
    // Third attempt: raw Google API response format
    if (response?.results && Array.isArray(response.results) && response.results.length > 0) {
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
    
    // If we've reached here, no transcript is available
    console.warn('No valid transcript format found in response:', response);
    return "No transcript available";
  } catch (error) {
    console.error('Error extracting transcript text:', error, 'From response:', response);
    return "Error extracting transcript";
  }
};

/**
 * Combine multiple transcription results into a single result
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
  
  // Combine all transcripts with proper spacing
  let combinedTranscript = '';
  let confidenceSum = 0;
  
  results.forEach((result, index) => {
    if (result.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      const transcript = result.results.channels[0].alternatives[0].transcript;
      combinedTranscript += transcript;
      
      // Add a newline if not the last chunk and if the transcript doesn't end with one
      if (index < results.length - 1 && !transcript.trim().endsWith('\n')) {
        combinedTranscript += '\n';
      }
      
      // Accumulate confidence scores
      if (result.results?.channels?.[0]?.alternatives?.[0]?.confidence) {
        confidenceSum += result.results.channels[0].alternatives[0].confidence;
      }
    }
  });
  
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
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
};
