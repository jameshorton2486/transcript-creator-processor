
/**
 * Apply basic formatting to transcript text to improve readability in Word document
 */
export function formatTranscriptForWord(text: string): string {
  if (!text) return "No transcript content available.";
  
  // Apply special formatting to speaker labels
  return text
    // Style standard speaker format (Speaker 1:)
    .replace(/^(Speaker \d+:)/gm, match => `\n${match}`)
    
    // Style legal transcript format (THE COURT:, WITNESS:, etc.)
    .replace(/^([A-Z][A-Z\s']+:)/gm, match => `\n${match}`)
    
    // Style Q&A format
    .replace(/^(Q|A):\s/gm, match => `\n${match}`)
    
    // Ensure proper spacing after speaker changes
    .replace(/(Speaker \d+:|[A-Z][A-Z\s']+:)(\s*)/g, '$1\n    ')
    
    // Clean up any excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    
    // Make sure speaker labels are properly formatted with new lines
    .replace(/\n(Speaker \d+:|[A-Z][A-Z\s']+:)/g, '\n\n$1');
}

/**
 * Determine if a line is a speaker label
 */
export function isSpeakerLabel(line: string): boolean {
  return /^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line);
}

/**
 * Determine if a line is a Q&A format line
 */
export function isQAFormat(line: string): boolean {
  return /^(Q|A):/.test(line);
}
