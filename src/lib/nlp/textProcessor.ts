
/**
 * NLP-based transcript processing module
 * Handles text normalization, speaker formatting, and cleaning
 */

// List of common filler words and hesitations to clean
const FILLER_WORDS = [
  'uh', 'um', 'er', 'ah', 'like', 'you know', 'i mean', 
  'sort of', 'kind of', 'literally', 'basically', 'actually'
];

// List of common legal parties and their formal representations
const LEGAL_ENTITIES = {
  'plaintiff': 'PLAINTIFF',
  'defendant': 'DEFENDANT',
  'judge': 'THE COURT',
  'court': 'THE COURT',
  'witness': 'WITNESS',
  'prosecution': "PROSECUTION",
  'defense': "DEFENSE",
  'counsel': "COUNSEL",
  'attorney': "ATTORNEY"
};

export interface TextProcessingOptions {
  correctPunctuation: boolean;
  formatSpeakers: boolean;
  identifyParties: boolean;
  extractEntities: boolean;
  preserveFormatting: boolean;
  cleanFillers: boolean;
}

/**
 * Main text processing function that applies various NLP techniques
 * to clean and enhance a transcript
 */
export async function processText(
  text: string, 
  options: TextProcessingOptions
): Promise<string> {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  let processedText = text;
  console.log('Processing text with options:', options);
  
  try {
    // Apply text normalization if enabled
    if (options.correctPunctuation) {
      processedText = normalizePunctuation(processedText);
    }
    
    // Clean filler words if enabled
    if (options.cleanFillers) {
      processedText = removeFillerWords(processedText);
    }
    
    // Format speakers if enabled
    if (options.formatSpeakers) {
      processedText = formatSpeakerLabels(processedText);
    }
    
    // Identify legal parties if enabled
    if (options.identifyParties) {
      processedText = identifyLegalParties(processedText);
    }
    
    // Apply further formatting based on detected patterns
    processedText = enhanceFormatting(processedText, options.preserveFormatting);
    
    return processedText;
  } catch (error) {
    console.error('Error during text processing:', error);
    // If processing fails, return the original text
    return text;
  }
}

/**
 * Normalize punctuation and capitalization in the text
 */
function normalizePunctuation(text: string): string {
  return text
    // Fix spacing around punctuation
    .replace(/\s+([.,;:!?])/g, '$1')
    
    // Ensure proper spacing after punctuation
    .replace(/([.,;:!?])([A-Za-z])/g, '$1 $2')
    
    // Fix capitalization after sentence-ending punctuation
    .replace(/([.!?])\s+([a-z])/g, (match, punctuation, letter) => 
      `${punctuation} ${letter.toUpperCase()}`
    )
    
    // Capitalize first letter of paragraphs
    .replace(/(^|\n\s*)([a-z])/g, (match, whitespace, letter) => 
      `${whitespace}${letter.toUpperCase()}`
    )
    
    // Fix common capitalization errors in legal contexts
    .replace(/\b(court|judge|plaintiff|defendant)\b/gi, (match) => 
      match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
    );
}

/**
 * Remove common filler words and hesitations
 */
function removeFillerWords(text: string): string {
  let processed = text;
  
  // Create a regex pattern from the filler words list
  const fillerPattern = new RegExp(`\\b(${FILLER_WORDS.join('|')})\\b`, 'gi');
  
  // Replace filler words with empty string
  processed = processed.replace(fillerPattern, '');
  
  // Clean up any double spaces created by removing fillers
  processed = processed.replace(/\s{2,}/g, ' ');
  
  return processed;
}

/**
 * Format speaker labels for better readability
 */
function formatSpeakerLabels(text: string): string {
  return text
    // Format standard speaker labels (Speaker 1:)
    .replace(/^(speaker\s*\d+:)/gim, (match) => 
      match.toUpperCase()
    )
    
    // Ensure speaker labels start on new lines
    .replace(/([^\n])(SPEAKER \d+:|[A-Z]+ [A-Z]+:)/g, '$1\n\n$2')
    
    // Format content after speaker label
    .replace(/(SPEAKER \d+:|[A-Z]+ [A-Z]+:)(\s*)/g, '$1\n    ')
    
    // Format Q&A style transcripts
    .replace(/^([QA]):\s*/gim, (match) => 
      match.toUpperCase() + '\n    '
    );
}

/**
 * Identify and format legal parties
 */
function identifyLegalParties(text: string): string {
  let processed = text;
  
  // Replace common legal party mentions with their formal representation
  Object.entries(LEGAL_ENTITIES).forEach(([informal, formal]) => {
    // Only replace when it appears to be a speaker label
    const pattern = new RegExp(`\\b${informal}\\b\\s*:`, 'gi');
    processed = processed.replace(pattern, `${formal}:`);
  });
  
  // Format case references
  processed = processed.replace(
    /\b([A-Z][a-z]+)\s+v[s]?[.]?\s+([A-Z][a-z]+)\b/g, 
    '$1 v. $2'
  );
  
  // Format legal citations
  processed = processed.replace(
    /(\d+)\s+U\.?S\.?\s+(\d+)/g,
    '$1 U.S. $2'
  );
  
  return processed;
}

/**
 * Apply additional formatting based on detected patterns
 */
function enhanceFormatting(text: string, preserveFormatting: boolean): string {
  if (!preserveFormatting) {
    // If not preserving formatting, normalize newlines and spacing
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  
  // Identify and format transcript sections
  return text
    // Format date patterns (MM/DD/YYYY to Month DD, YYYY)
    .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, month, day, year) => {
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
    })
    
    // Clean up excessive newlines while preserving paragraph structure
    .replace(/\n{3,}/g, '\n\n')
    
    // Ensure proper paragraph breaks
    .replace(/([.!?]"?)\s+([A-Z])/g, '$1\n\n$2')
    
    // Improve spacing in dialogue sections
    .replace(/(SPEAKER \d+:|[A-Z]+ [A-Z]+:)([^\n])/g, '$1\n    $2');
}
