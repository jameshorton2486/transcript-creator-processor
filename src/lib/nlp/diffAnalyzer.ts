
/**
 * Text difference analyzer
 * Identifies and categorizes differences between text versions
 */

/**
 * Analyzes differences between two text strings
 * @param original The original text
 * @param corrected The corrected text
 * @returns Array of string descriptions of key differences
 */
export function analyzeDifferences(original: string, corrected: string): string[] {
  const differences: string[] = [];
  
  // Split both texts into words for comparison
  const originalWords = original.split(/\s+/);
  const correctedWords = corrected.split(/\s+/);
  
  // Check for capitalization changes
  const capitalizationChanges = detectCapitalizationChanges(originalWords, correctedWords);
  if (capitalizationChanges.length > 0) {
    differences.push(...capitalizationChanges);
  }
  
  // Check for punctuation changes
  const punctuationChanges = detectPunctuationChanges(original, corrected);
  if (punctuationChanges.length > 0) {
    differences.push(...punctuationChanges);
  }
  
  // Check for spacing/formatting changes
  if (detectNewlines(original) !== detectNewlines(corrected)) {
    differences.push("Paragraph formatting changed");
  }
  
  // Check for word replacements/additions/removals
  const wordChanges = detectWordChanges(originalWords, correctedWords);
  if (wordChanges.length > 0) {
    differences.push(...wordChanges);
  }
  
  // Check for speaker label formatting
  const speakerChanges = detectSpeakerChanges(original, corrected);
  if (speakerChanges.length > 0) {
    differences.push(...speakerChanges);
  }
  
  // Date format changes
  const dateChanges = detectDateFormatChanges(original, corrected);
  if (dateChanges.length > 0) {
    differences.push(...dateChanges);
  }
  
  // If no specific differences detected, add a generic difference
  if (differences.length === 0 && original !== corrected) {
    differences.push("General text corrections");
  }
  
  return differences;
}

/**
 * Detects capitalization changes between word arrays
 */
function detectCapitalizationChanges(originalWords: string[], correctedWords: string[]): string[] {
  const changes: string[] = [];
  const capitalizedWords: Record<string, boolean> = {};
  
  // Find words that were capitalized in the correction
  for (let i = 0; i < Math.min(originalWords.length, correctedWords.length); i++) {
    if (originalWords[i].toLowerCase() === correctedWords[i].toLowerCase()) {
      if (originalWords[i] !== correctedWords[i]) {
        const word = correctedWords[i].toLowerCase();
        capitalizedWords[word] = correctedWords[i][0] === correctedWords[i][0].toUpperCase();
      }
    }
  }
  
  // Look for patterns in capitalizations
  const courtTerms = Object.keys(capitalizedWords).filter(word => 
    ["court", "judge", "plaintiff", "defendant", "witness"].includes(word) && 
    capitalizedWords[word]
  );
  
  if (courtTerms.length > 0) {
    changes.push(`Capitalization of legal terms: ${courtTerms.join(", ")}`);
  }
  
  // Check for sentence case corrections
  const sentenceCaseCorrections = originalWords.length > 5 && correctedWords.length > 5 && 
    originalWords[0].toLowerCase() === correctedWords[0].toLowerCase() &&
    originalWords[0] !== correctedWords[0] &&
    correctedWords[0][0] === correctedWords[0][0].toUpperCase();
  
  if (sentenceCaseCorrections) {
    changes.push("Sentence case corrections applied");
  }
  
  return changes;
}

/**
 * Detects punctuation changes between texts
 */
function detectPunctuationChanges(original: string, corrected: string): string[] {
  const changes: string[] = [];
  
  // Count punctuation marks in both texts
  const originalPunctCount = (original.match(/[.,;:!?]/g) || []).length;
  const correctedPunctCount = (corrected.match(/[.,;:!?]/g) || []).length;
  
  if (Math.abs(originalPunctCount - correctedPunctCount) > 2) {
    changes.push("Punctuation added or corrected");
  }
  
  // Check for specific punctuation patterns
  if (!original.includes(". ") && corrected.includes(". ")) {
    changes.push("Added periods at end of sentences");
  }
  
  if (!original.includes("? ") && corrected.includes("? ")) {
    changes.push("Added question marks");
  }
  
  // Check for quote formatting
  const originalQuotes = (original.match(/["']/g) || []).length;
  const correctedQuotes = (corrected.match(/["']/g) || []).length;
  
  if (Math.abs(originalQuotes - correctedQuotes) > 1) {
    changes.push("Quotation marks added or corrected");
  }
  
  return changes;
}

/**
 * Counts newlines in a text
 */
function detectNewlines(text: string): number {
  return (text.match(/\n/g) || []).length;
}

/**
 * Detects word-level changes between texts
 */
function detectWordChanges(originalWords: string[], correctedWords: string[]): string[] {
  const changes: string[] = [];
  
  // Check for filler word removal
  const fillerWords = ["um", "uh", "like", "you know", "sort of", "kind of"];
  const originalFillerCount = originalWords.filter(word => 
    fillerWords.includes(word.toLowerCase())
  ).length;
  
  const correctedFillerCount = correctedWords.filter(word => 
    fillerWords.includes(word.toLowerCase())
  ).length;
  
  if (originalFillerCount > correctedFillerCount && originalFillerCount > 2) {
    changes.push("Removed filler words (um, uh, like, etc.)");
  }
  
  // Check for legal terminology standardization
  const legalTermReplacements = [
    {original: "plaintiff", corrected: "PLAINTIFF"},
    {original: "defendant", corrected: "DEFENDANT"},
    {original: "court", corrected: "Court"},
    {original: "judge", corrected: "Judge"},
  ];
  
  for (const {original, corrected} of legalTermReplacements) {
    if (originalWords.some(w => w.toLowerCase() === original) && 
        correctedWords.some(w => w === corrected)) {
      changes.push(`Standardized "${original}" → "${corrected}"`);
    }
  }
  
  return changes;
}

/**
 * Detects changes in speaker labels
 */
function detectSpeakerChanges(original: string, corrected: string): string[] {
  const changes: string[] = [];
  
  // Check for speaker label formatting
  const originalSpeakerMatches = original.match(/^([A-Za-z0-9\s]+):/gm) || [];
  const correctedSpeakerMatches = corrected.match(/^([A-Za-z0-9\s]+):/gm) || [];
  
  if (originalSpeakerMatches.length > 0 && correctedSpeakerMatches.length > 0) {
    // Check for capitalization changes in speaker labels
    const originalAllCaps = originalSpeakerMatches.every(m => m === m.toUpperCase());
    const correctedAllCaps = correctedSpeakerMatches.every(m => m === m.toUpperCase());
    
    if (!originalAllCaps && correctedAllCaps) {
      changes.push("Speaker labels converted to all caps");
    }
    
    // Check for standardization of speaker references
    if (originalSpeakerMatches.some(m => m.toLowerCase().includes("speaker")) && 
        correctedSpeakerMatches.some(m => m.includes("THE COURT"))) {
      changes.push("Speaker references formalized (e.g., 'Speaker 1' → 'THE COURT')");
    }
  }
  
  return changes;
}

/**
 * Detects changes in date formats
 */
function detectDateFormatChanges(original: string, corrected: string): string[] {
  const changes: string[] = [];
  
  // Check for date format standardization (MM/DD/YYYY → Month D, YYYY)
  const numericDateRegex = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
  const writtenDateRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/g;
  
  if (original.match(numericDateRegex) && corrected.match(writtenDateRegex)) {
    changes.push("Date formats converted from numeric (MM/DD/YYYY) to written (Month D, YYYY)");
  }
  
  return changes;
}
