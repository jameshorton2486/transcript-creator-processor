
/**
 * Format Deepgram API responses into a consistent structure
 */
import {
  DeepgramAPIResponse,
  FormattedTranscript,
  SpeakerSegment,
  TranscriptionResult,
  DeepgramWord
} from './types';

/**
 * Format a Deepgram response into a consistent structure
 * @param response Raw response from Deepgram API
 * @returns Formatted transcription result
 */
export function formatTranscriptionResult(response: DeepgramAPIResponse): { formattedResult: FormattedTranscript | string } {
  try {
    // Extract the main transcript from the first alternative of the first channel
    const mainTranscript = response.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    
    // Format the response
    const formattedResult = formatDeepgramResponse(response);
    
    return { formattedResult };
  } catch (error) {
    console.error('Error formatting transcription result:', error);
    
    // Return a minimal valid result
    return {
      formattedResult: {
        plainText: '',
        wordTimestamps: [],
        speakerSegments: []
      }
    };
  }
}

/**
 * Format a raw Deepgram response into a structured format
 * @param response Raw Deepgram response
 * @returns Formatted transcript with word timings and speaker segments
 */
function formatDeepgramResponse(response: DeepgramAPIResponse): FormattedTranscript {
  const formatted: FormattedTranscript = {
    plainText: '',
    wordTimestamps: [],
    speakerSegments: []
  };
  
  // Early return if no data
  if (!response.results?.channels?.[0]?.alternatives?.[0]) {
    return formatted;
  }
  
  const alternative = response.results.channels[0].alternatives[0];
  formatted.plainText = alternative.transcript || '';
  
  // Format word timestamps
  if (alternative.words && alternative.words.length > 0) {
    formatted.wordTimestamps = alternative.words.map(word => ({
      word: word.word,
      start: word.start,
      end: word.end,
      speaker: word.speaker !== undefined ? `Speaker ${word.speaker}` : undefined
    }));
  }
  
  // Format speaker segments if available (from utterances)
  if (response.results.utterances && response.results.utterances.length > 0) {
    formatted.speakerSegments = response.results.utterances.map(utterance => ({
      speaker: `Speaker ${utterance.speaker}`,
      text: utterance.transcript,
      start: utterance.start,
      end: utterance.end
    }));
  } 
  // If no utterances but words have speaker info, create segments
  else if (alternative.words && alternative.words.some(word => word.speaker !== undefined)) {
    formatted.speakerSegments = createSpeakerSegmentsFromWords(alternative.words);
  }
  
  return formatted;
}

/**
 * Create speaker segments from word-level speaker information
 * @param words Array of words with timing and speaker info
 * @returns Array of speaker segments
 */
function createSpeakerSegmentsFromWords(words: DeepgramWord[]): SpeakerSegment[] {
  const segments: SpeakerSegment[] = [];
  
  if (!words.length) {
    return segments;
  }
  
  let currentSegment: SpeakerSegment | null = null;
  
  for (const word of words) {
    const speaker = word.speaker !== undefined ? `Speaker ${word.speaker}` : 'Unknown';
    
    // Start a new segment if there's no current one or speaker changed
    if (!currentSegment || currentSegment.speaker !== speaker) {
      // Push the current segment if it exists
      if (currentSegment) {
        segments.push(currentSegment);
      }
      
      // Start a new segment
      currentSegment = {
        speaker,
        text: word.word,
        start: word.start,
        end: word.end
      };
    } else {
      // Add to existing segment
      currentSegment.text += ` ${word.word}`;
      currentSegment.end = word.end;
    }
  }
  
  // Add the last segment if it exists
  if (currentSegment) {
    segments.push(currentSegment);
  }
  
  return segments;
}
