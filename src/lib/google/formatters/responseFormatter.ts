
/**
 * Main module for formatting Google Speech-to-Text responses
 */

import { applyLegalFormatting } from './legalFormatter';
import { processSpeakerDiarization, normalizeSpeakerLabels } from './speakerFormatter';
import { extractTranscriptText } from './transcriptExtractor';

/**
 * Format the Google Speech-to-Text response to match our app's expected format
 * with improved speaker diarization and legal transcript formatting
 */
export function formatGoogleResponse(googleResponse: any) {
  if (!googleResponse.results || googleResponse.results.length === 0) {
    return {
      results: {
        transcripts: [{ transcript: "No transcript available", confidence: 0 }],
        channels: [{ alternatives: [{ transcript: "No transcript available", confidence: 0 }] }]
      }
    };
  }

  // Process speaker diarization and create full transcript
  const { transcript: fullTranscript } = processSpeakerDiarization(googleResponse.results);
  
  // Apply legal transcript formatting rules
  const formattedTranscript = applyLegalFormatting(fullTranscript);
  
  // Format the response to match our expected format
  return {
    results: {
      transcripts: [
        {
          transcript: formattedTranscript,
          confidence: googleResponse.results[0]?.alternatives[0]?.confidence || 0.8
        }
      ],
      channels: [
        {
          alternatives: [
            {
              transcript: formattedTranscript,
              confidence: googleResponse.results[0]?.alternatives[0]?.confidence || 0.8
            }
          ]
        }
      ]
    }
  };
}

/**
 * Combine multiple transcription results into a single result
 * with improved handling of speaker transitions between chunks
 */
export function combineTranscriptionResults(results: any[]): any {
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
    transcript = normalizeSpeakerLabels(transcript, globalSpeakerMap);
    
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
}

/**
 * Helper function to convert ArrayBuffer to base64
 * But rename it to avoid conflict with the same function in audio/index.ts
 */
export function responseFormatterBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
}

// Re-export the functions from other modules to maintain API compatibility
export { extractTranscriptText };
