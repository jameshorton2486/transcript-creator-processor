
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
  
  console.log("Processing speaker diarization with results length:", results?.length || 0);
  
  // Check if we have any results at all
  if (!results || results.length === 0) {
    console.warn("No results to process for speaker diarization");
    return { transcript: "No transcript available", speakerMap: {} };
  }
  
  // Track if we found speaker tags anywhere in the results
  let hasSpeakerTags = false;
  let speakerTagsFound = false;
  
  // First, let's log speaker tag information for debugging
  results.forEach((result, index) => {
    if (result?.alternatives?.[0]?.words) {
      const words = result.alternatives[0].words;
      const hasTags = words.some((word: any) => word.speakerTag !== undefined && word.speakerTag > 0);
      console.log(`Result ${index + 1}/${results.length}: Has speaker tags: ${hasTags ? 'YES ✅' : 'NO ❌'}`);
      
      if (hasTags) {
        speakerTagsFound = true;
        const tagCounts: Record<number, number> = {};
        words.forEach((word: any) => {
          if (word.speakerTag) {
            tagCounts[word.speakerTag] = (tagCounts[word.speakerTag] || 0) + 1;
          }
        });
        console.log(`Result ${index + 1} speaker tag distribution:`, tagCounts);
        // Log a few sample words
        console.log(`Sample words from result ${index + 1}:`, words.slice(0, 5).map((w: any) => ({ 
          word: w.word, 
          speakerTag: w.speakerTag 
        })));
      }
    } else {
      console.log(`Result ${index + 1}/${results.length}: No words property or alternatives found ❌`);
    }
  });
  
  // If no speaker tags found in any result, log a warning
  if (!speakerTagsFound) {
    console.warn("⚠️ NO SPEAKER TAGS FOUND IN ANY RESULTS. Speaker diarization may not be enabled in the API request.");
    console.warn("Check that 'diarizationConfig.enableSpeakerDiarization=true' and 'enableWordTimeOffsets=true' are set in the API request.");
  }
  
  // Find the most suitable result with speaker tags - prioritize the last one as it often has full data
  let speakerResult = results[results.length - 1];
  
  // Check if the last result contains speaker tags
  if (speakerResult?.alternatives?.[0]?.words) {
    const words = speakerResult.alternatives[0].words;
    
    // Check for speaker tags
    hasSpeakerTags = words.some((word: any) => 
      word.speakerTag !== undefined && word.speakerTag > 0
    );
    
    if (hasSpeakerTags) {
      console.log("✅ Found speaker tags in the last result!");
    } else {
      console.warn("⚠️ No speaker tags found in the last result. Searching in other results...");
      
      // If no speaker tags in the last result, search through all results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result?.alternatives?.[0]?.words) {
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
  } else {
    console.warn("⚠️ Last result doesn't have words data. This may indicate diarization was not enabled or failed.");
  }
  
  // Now process the speaker result if we found tags
  if (hasSpeakerTags && 
      speakerResult?.alternatives?.[0]?.words) {
    
    console.log("Processing speaker diarization with speaker tags...");
    
    // Process all words with speaker tags
    const words = speakerResult.alternatives[0].words;
    
    // Debug output of the first few words with speaker tags
    console.log("Sample words with speaker tags:", 
      words.slice(0, 10).map((w: any) => ({ 
        word: w.word, 
        speakerTag: w.speakerTag || 'NO_TAG' 
      }))
    );
    
    // Create an array to group words by speaker
    let allUtterances: {speaker: number, text: string}[] = [];
    
    // Process word by word to build utterances
    words.forEach((word: any, index: number) => {
      const speakerId = word.speakerTag || 0;
      
      // Map Google speaker tags to our format (Speaker 1, Speaker 2, etc.)
      if (!speakerMap[speakerId] && speakerId > 0) {
        speakerMap[speakerId] = speakerNumber++;
        console.log(`Mapped speaker ${speakerId} to Speaker ${speakerMap[speakerId]}`);
      }
      
      // If speaker changed, start a new utterance
      if (speakerId !== currentSpeaker) {
        // If we had a previous utterance, save it
        if (currentUtterance.trim() && currentSpeaker > 0) {
          allUtterances.push({
            speaker: currentSpeaker,
            text: currentUtterance.trim()
          });
        }
        
        // Start new utterance with this speaker
        currentSpeaker = speakerId;
        currentUtterance = word.word;
      } else {
        // Continue the current utterance
        currentUtterance += ` ${word.word}`;
      }
      
      // If we're at the end of the words array, add the final utterance
      if (index === words.length - 1 && currentUtterance.trim() && currentSpeaker > 0) {
        allUtterances.push({
          speaker: currentSpeaker,
          text: currentUtterance.trim()
        });
      }
    });
    
    // Log the utterances we've extracted
    console.log(`Extracted ${allUtterances.length} utterances from speaker diarization`);
    
    // Format the transcript with proper speaker labels
    allUtterances.forEach(utterance => {
      const speakerLabel = `Speaker ${speakerMap[utterance.speaker] || '?'}:`;
      fullTranscript += `${speakerLabel} ${utterance.text}\n\n`;
    });
    
    // If we couldn't extract any utterances, create a fallback
    if (allUtterances.length === 0) {
      console.warn("No speaker utterances were extracted. Creating fallback transcript.");
      fullTranscript = words.map(w => w.word).join(' ');
    }
  } else {
    // Fallback: No speaker tags found, use traditional approach
    console.warn("No usable speaker tags found in any results. Falling back to basic formatting.");
    
    // Process all results to create a basic transcript
    results.forEach((result: any, resultIndex: number) => {
      console.log(`Processing result ${resultIndex + 1}/${results.length} (without speaker tags)`);
      
      if (result?.alternatives?.[0]?.transcript) {
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
      } else {
        console.warn(`Result ${resultIndex + 1} has no transcript text`);
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
  
  // If we couldn't identify any speakers, let's just use a simple format
  if (fullTranscript.trim() === '') {
    console.warn("Empty transcript after processing. Creating a simple transcript without speaker labels.");
    fullTranscript = "Speaker 1: " + results.map(r => 
      r.alternatives && r.alternatives.length > 0 ? r.alternatives[0].transcript : ''
    ).join(' ').trim();
  }
  
  console.log("Final processed transcript with speakers (first 500 chars):", 
    fullTranscript.slice(0, 500) + (fullTranscript.length > 500 ? "..." : ""));
  
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
