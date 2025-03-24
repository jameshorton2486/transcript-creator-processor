
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
  
  console.log("Processing speaker diarization with results:", results);
  
  // Check if we have any results at all
  if (!results || results.length === 0) {
    console.warn("No results to process for speaker diarization");
    return { transcript: "No transcript available", speakerMap: {} };
  }
  
  // Check if we have speaker diarization data
  let hasSpeakerTags = false;
  
  // Find the most suitable result with speaker tags - usually the last one
  let speakerResult = results[results.length - 1];
  
  // Check if the last result contains speaker tags
  if (speakerResult && 
      speakerResult.alternatives && 
      speakerResult.alternatives[0] && 
      speakerResult.alternatives[0].words) {
    const words = speakerResult.alternatives[0].words;
    
    // Check for speaker tags
    hasSpeakerTags = words.some((word: any) => 
      word.speakerTag !== undefined && word.speakerTag > 0
    );
    
    if (hasSpeakerTags) {
      console.log("✅ Found speaker tags in the last result!");
    } else {
      console.warn("⚠️ No speaker tags found in the last result.");
      
      // If no speaker tags in the last result, search through all results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.alternatives && 
            result.alternatives[0] && 
            result.alternatives[0].words) {
          const resultHasSpeakerTags = result.alternatives[0].words.some((word: any) => 
            word.speakerTag !== undefined && word.speakerTag > 0
          );
          
          if (resultHasSpeakerTags) {
            hasSpeakerTags = true;
            speakerResult = result;
            console.log(`✅ Found speaker tags in result ${i + 1}!`);
            break;
          }
        }
      }
    }
  }
  
  // Now process the speaker result if we found tags
  if (hasSpeakerTags && 
      speakerResult && 
      speakerResult.alternatives && 
      speakerResult.alternatives[0] && 
      speakerResult.alternatives[0].words) {
    
    console.log("Processing speaker diarization with speaker tags...");
    
    // Process all words with speaker tags
    const words = speakerResult.alternatives[0].words;
    
    // Debug output of the first few words with speaker tags
    console.log("Sample words with speaker tags:", 
      words.slice(0, 10).map((w: any) => ({ 
        word: w.word, 
        speakerTag: w.speakerTag 
      }))
    );
    
    words.forEach((word: any) => {
      const speakerId = word.speakerTag || 0;
      
      // Map Google speaker tags to our format (Speaker 1, Speaker 2, etc.)
      if (!speakerMap[speakerId] && speakerId > 0) {
        speakerMap[speakerId] = speakerNumber++;
        console.log(`Mapped speaker ${speakerId} to Speaker ${speakerMap[speakerId]}`);
      }
      
      // If speaker changed or if we have a punctuation that suggests a natural break
      const isPunctuation = word.word.match(/[.!?]$/);
      
      if ((currentSpeaker !== -1 && currentSpeaker !== speakerId) || 
          (isPunctuation && currentUtterance.length > 50)) {
        // Only add the speaker label if we have text to add
        if (currentUtterance.trim()) {
          const speakerLabel = currentSpeaker > 0 ? 
            `Speaker ${speakerMap[currentSpeaker] || '1'}:` : 
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
        `Speaker ${speakerMap[currentSpeaker] || '1'}:` : 
        "Speaker 1:";
      
      fullTranscript += `${speakerLabel} ${currentUtterance.trim()}\n\n`;
    }
  } else {
    // Fallback: No speaker tags found, use traditional approach
    console.warn("No speaker tags found in any results. Falling back to basic formatting.");
    
    // Process all results to create a basic transcript
    results.forEach((result: any, resultIndex: number) => {
      console.log(`Processing result ${resultIndex + 1}/${results.length} (without speaker tags)`);
      
      if (result.alternatives && result.alternatives.length > 0) {
        const transcript = result.alternatives[0].transcript || '';
        
        // Enhanced detection for transcript formats
        const qaPattern = /\b(Q|A):\s/i;
        const speakerPattern = /^(Speaker \d+:|[A-Z][A-Z\s']+:)/;
        
        if (qaPattern.test(transcript)) {
          // Format as question and answer
          const segments = transcript.split(/(?=\b[QA]:\s)/i);
          segments.forEach(segment => {
            if (segment.trim()) {
              fullTranscript += segment.trim() + '\n\n';
            }
          });
        } else if (speakerPattern.test(transcript)) {
          // The transcript already has speaker labels
          fullTranscript += transcript.trim() + '\n\n';
        } else {
          // No speaker diarization or existing formatting, format as a single speaker
          fullTranscript += `Speaker ${resultIndex % 2 + 1}: ${transcript.trim()}\n\n`;
        }
      }
    });
  }
  
  // If no speaker tags were found but diarization was requested, log a warning
  if (!hasSpeakerTags) {
    console.warn("⚠️ NO SPEAKER TAGS FOUND IN ANY RESULTS. Speaker diarization may not be properly enabled in the Google API request.");
    console.warn("Double-check that enableSpeakerDiarization=true and diarizationConfig is properly set in the API request!");
    
    // If no transcript was generated due to lack of speaker tags, create a basic transcript
    if (!fullTranscript.trim()) {
      console.log("Generating basic transcript without speaker diarization");
      fullTranscript = results.map((result, idx) => 
        result.alternatives && result.alternatives.length > 0 
          ? `Speaker ${(idx % 2) + 1}: ${result.alternatives[0].transcript || ''}\n\n`
          : ''
      ).join('').trim();
    }
  }
  
  console.log("Processed transcript with speakers:", fullTranscript.slice(0, 500) + "...");
  
  // If we couldn't identify any speakers, let's just use a simple format
  if (fullTranscript.trim() === '') {
    fullTranscript = "Speaker 1: " + results.map(r => 
      r.alternatives && r.alternatives.length > 0 ? r.alternatives[0].transcript : ''
    ).join(' ').trim();
  }
  
  return { transcript: fullTranscript.trim(), speakerMap };
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
    .replace(/(\n\n)([A-Z][A-Z\s']+:)/g, '\n$2')
    
    // Better format for Speaker X: labels
    .replace(/(Speaker \d+:)(\s*)([A-Za-z])/g, '$1\n     $3');
}
