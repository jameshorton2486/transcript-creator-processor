
/**
 * Format Deepgram API responses into a consistent structure
 */
import {
  DeepgramTranscriptionResponse,
  FormattedTranscript,
  SpeakerSegment,
  TranscriptionResult,
  DeepgramWord
} from '../../hooks/useDeepgramTranscription/types';

/**
 * Formats a Deepgram transcription response into a structured transcription result
 * @param response Raw response from Deepgram API
 * @returns Formatted transcription result
 */
export function formatTranscriptionResult(response: DeepgramTranscriptionResponse): TranscriptionResult {
  try {
    const transcript = response.results?.channels[0]?.alternatives[0]?.transcript || '';

    return {
      transcript,
      text: transcript,
      formattedResult: formatDeepgramResponse(response),
      rawResponse: response,
    };
  } catch (error) {
    console.error('Error formatting transcription result:', error);

    return {
      transcript: '',
      text: '',
      formattedResult: { plainText: '' },
      rawResponse: response,
    };
  }
}

/**
 * Converts raw Deepgram response into structured formatted transcript
 * @param response Deepgram transcription response
 * @returns Structured formatted transcript
 */
function formatDeepgramResponse(response: DeepgramTranscriptionResponse): FormattedTranscript {
  const formatted: FormattedTranscript = {
    plainText: response.results?.channels[0]?.alternatives[0]?.transcript || '',
  };

  const alternative = response.results?.channels[0]?.alternatives[0];

  if (alternative?.words?.length) {
    formatted.wordTimestamps = alternative.words.map((word) => ({
      word: word.word,
      start: word.start,
      end: word.end,
      speaker: word.speaker !== undefined ? `Speaker ${word.speaker}` : undefined,
    }));
  }

  if (response.results?.utterances?.length) {
    formatted.speakerSegments = response.results.utterances.map((utterance) => ({
      speaker: `Speaker ${utterance.speaker}`,
      text: utterance.transcript,
      start: utterance.start,
      end: utterance.end,
    }));
  } else if (alternative?.words?.some((word) => word.speaker !== undefined)) {
    formatted.speakerSegments = createSpeakerSegmentsFromWords(alternative.words);
  }

  return formatted;
}

/**
 * Creates speaker segments from word-level speaker data
 * @param words Array of words with speaker and timing info
 * @returns Array of speaker segments
 */
function createSpeakerSegmentsFromWords(words: DeepgramWord[]): SpeakerSegment[] {
  const segments: SpeakerSegment[] = [];

  if (!words.length) return segments;

  let currentSegment: SpeakerSegment | null = null;

  for (const word of words) {
    const speakerLabel = word.speaker !== undefined ? `Speaker ${word.speaker}` : 'Unknown';

    if (!currentSegment || currentSegment.speaker !== speakerLabel) {
      if (currentSegment) segments.push(currentSegment);

      currentSegment = {
        speaker: speakerLabel,
        text: word.word,
        start: word.start,
        end: word.end,
      };
    } else {
      currentSegment.text += ` ${word.word}`;
      currentSegment.end = word.end;
    }
  }

  if (currentSegment) segments.push(currentSegment);

  return segments;
}
