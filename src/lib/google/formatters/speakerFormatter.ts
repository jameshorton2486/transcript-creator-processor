
/**
 * Functions for formatting speaker labels and diarization
 * according to legal transcript conventions
 */

interface SpeakerMap {
  [speakerId: number]: number;
}

// Map of standard court roles to their proper formatted display
const COURT_ROLES = {
  'judge': 'THE COURT',
  'court': 'THE COURT',
  'plaintiff': 'PLAINTIFF',
  'defendant': 'DEFENDANT',
  'witness': 'WITNESS',
  'prosecutor': 'PROSECUTOR',
  'defense': 'DEFENSE COUNSEL',
  'plaintiff counsel': 'PLAINTIFF\'S COUNSEL',
  'defendant counsel': 'DEFENDANT\'S COUNSEL',
  'bailiff': 'BAILIFF',
  'clerk': 'CLERK',
};

/**
 * Format and normalize speaker labels across transcript chunks
 * with consistent legal formatting
 */
export function normalizeSpeakerLabels(
  transcript: string, 
  globalSpeakerMap: Record<string, string> = {}
): string {
  // Process speaker labels to maintain consistency
  const speakerMatches = transcript.match(/Speaker \d+:|[A-Z]+ [A-Z]+:/g) || [];
  
  speakerMatches.forEach(speaker => {
    if (globalSpeakerMap[speaker]) {
      const regex = new RegExp(speaker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      transcript = transcript.replace(regex, globalSpeakerMap[speaker]);
    }
  });
  
  // Apply standardized formatting for known court roles
  Object.entries(COURT_ROLES).forEach(([role, formalTitle]) => {
    const roleRegex = new RegExp(`\\b${role}\\b\\s*:`, 'gi');
    transcript = transcript.replace(roleRegex, `${formalTitle}:`);
  });
  
  return transcript;
}

/**
 * Process Google API results to create a transcript with speaker labels
 * following legal transcript formatting conventions
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
        // Detection of Q&A patterns for court transcripts
        const qaPattern = /\b(Q|A):\s/i;
        
        if (qaPattern.test(transcript)) {
          // Format as question and answer
          const segments = transcript.split(/(?=\b[QA]:\s)/i);
          segments.forEach(segment => {
            if (segment.trim()) {
              fullTranscript += segment.trim() + '\n\n';
            }
          });
        } else {
          // No speaker diarization, format as paragraphs based on punctuation
          const sentences = transcript.split(/(?<=[.!?])\s+/);
          
          if (sentences.length > 0) {
            fullTranscript += `Speaker ${speakerNumber}: ${sentences.join(' ')}\n\n`;
          }
        }
      }
    }
  });
  
  return { transcript: fullTranscript, speakerMap };
}

/**
 * Format speaker turn-taking according to standard legal transcript conventions
 */
export function formatSpeakerTurns(transcript: string): string {
  // Format common court dialogue patterns
  return transcript
    // Format THE COURT sections with proper indentation and spacing
    .replace(/(THE COURT:)(\s*)([A-Za-z])/g, '$1\n     $3')
    
    // Format counsel sections
    .replace(/([A-Z]+'S COUNSEL:)(\s*)([A-Za-z])/g, '$1\n     $3')
    
    // Format witness sections
    .replace(/(WITNESS:)(\s*)([A-Za-z])/g, '$1\n     $3')
    
    // Ensure proper spacing between speaker changes
    .replace(/(\n\n)([A-Z][A-Z\s']+:)/g, '\n$2');
}
