
/**
 * Functions for applying legal transcript formatting conventions
 */

// Helper function to capitalize the first character of each word
export function capitalize(str: string): string {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Apply legal transcript formatting conventions
 */
export function applyLegalFormatting(text: string): string {
  return text
    // Ensure proper case citations "v." format
    .replace(/\bvs\.\b/g, 'v.')
    .replace(/\bversus\b/g, 'v.')
    
    // Format case names in proper case
    .replace(/([A-Za-z]+) v\. ([A-Za-z]+)/g, (match, p1, p2) => {
      return `${capitalize(p1)} v. ${capitalize(p2)}`;
    })
    
    // Format legal roles consistently (all caps)
    .replace(/\b(plaintiff|defendant|petitioner|respondent|appellant|appellee)\b/gi, 
      (match) => match.toUpperCase())
    
    // Format "THE COURT" consistently
    .replace(/\b(the court|judge|justice)\b\s*:/gi, 'THE COURT:')
    
    // Format counsel references
    .replace(/\b([A-Za-z]+)'s counsel\b\s*:/gi, (match, name) => 
      `${name.toUpperCase()}'S COUNSEL:`)
    
    // Proper formatting for section references
    .replace(/\bsection (\d+)/gi, 'Section $1')
    
    // Proper formatting for exhibit references
    .replace(/\bexhibit (\d+)/gi, 'Exhibit $1')
    
    // Clean up multiple paragraph breaks
    .replace(/\n{3,}/g, '\n\n')
    
    // Ensure consistent spacing after punctuation
    .replace(/([.!?])([A-Z])/g, '$1 $2');
}
