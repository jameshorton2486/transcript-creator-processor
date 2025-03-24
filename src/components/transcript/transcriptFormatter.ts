
/**
 * Helper function to enhance transcript formatting especially for speaker labels
 */
export function formatTranscript(text: string): string {
  if (!text) return "";
  
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
