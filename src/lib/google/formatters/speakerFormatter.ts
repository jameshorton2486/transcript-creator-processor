
/**
 * Functions for formatting speaker labels and diarization
 */

interface SpeakerMap {
  [speakerId: number]: number;
}

/**
 * Format and normalize speaker labels across transcript chunks
 */
export function normalizeSpeakerLabels(
  transcript: string, 
  globalSpeakerMap: Record<string, string> = {}
): string {
  // Process speaker labels to maintain consistency
  const speakerMatches = transcript.match(/Speaker \d+:/g) || [];
  
  speakerMatches.forEach(speaker => {
    if (globalSpeakerMap[speaker]) {
      const regex = new RegExp(speaker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      transcript = transcript.replace(regex, globalSpeakerMap[speaker]);
    }
  });
  
  return transcript;
}

/**
 * Process Google API results to create a transcript with speaker labels
 */
export function processSpeakerDiarization(results: any[]): { 
  transcript: string; 
  speakerMap: SpeakerMap;
} {
  let fullTranscript = '';
  let speakerNumber = 1;
  const speakerMap: SpeakerMap = {};
  let currentSpeaker = -1;
  let currentUtterance = '';
  
  // Process all results to create a full transcript with speaker labels
  results.forEach((result: any) => {
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
  
  return { transcript: fullTranscript, speakerMap };
}
