
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
 * Apply legal transcript formatting conventions following standard court reporting practices
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
    
    // Format standard question/answer patterns
    .replace(/\b(q|question):\s*/gi, 'Q: ')
    .replace(/\b(a|answer):\s*/gi, 'A: ')
    
    // Format exhibit references
    .replace(/\bexhibit (\d+)/gi, 'Exhibit $1')
    
    // Format section references
    .replace(/\bsection (\d+)/gi, 'Section $1')
    
    // Format dates consistently
    .replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g, (match, month, day, year) => {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year.length === 2 ? '20' + year : year}`;
    })
    
    // Format time consistently using 12-hour format
    .replace(/(\d{1,2}):(\d{2})(?!\s*[ap]\.?m\.?)/gi, (match, hour, minute) => {
      const h = parseInt(hour, 10);
      return `${h > 12 ? h - 12 : h}:${minute} ${h >= 12 ? 'p.m.' : 'a.m.'}`;
    })
    
    // Ensure consistent spacing after punctuation
    .replace(/([.!?])([A-Z])/g, '$1 $2')
    
    // Clean up multiple paragraph breaks (no more than double line breaks)
    .replace(/\n{3,}/g, '\n\n')
    
    // Format objections and court responses
    .replace(/\b(objection|objection, your honor)\b/gi, 'OBJECTION')
    .replace(/\b(sustained|overruled)\b/gi, (match) => match.toUpperCase())
    
    // Format page line number references
    .replace(/\bpage (\d+), lines? (\d+)(?:-(\d+))?/gi, 'Page $1, Line$2$3')
    
    // Format transcript certification language
    .replace(/\b(certified|official|approved) transcript\b/gi, 'CERTIFIED TRANSCRIPT');
}

/**
 * Apply proper indentation for question and answer format
 * according to legal transcript standards
 */
export function formatQuestionAnswer(text: string): string {
  const lines = text.split('\n');
  const formattedLines = lines.map(line => {
    // Indent Q: and A: statements with proper spacing (5 spaces from margin)
    if (line.trim().startsWith('Q: ')) {
      return '     ' + line.trim();
    } else if (line.trim().startsWith('A: ')) {
      return '     ' + line.trim();
    }
    return line;
  });
  
  return formattedLines.join('\n');
}

/**
 * Format paragraph layout according to legal transcript standards
 * (28 lines per page with specified margins)
 */
export function formatParagraphLayout(text: string): string {
  // This is a simplified implementation as actual page formatting
  // would depend on the final output format (PDF, etc.)
  
  const lines = text.split('\n');
  const formattedLines = [];
  let lineCount = 0;
  const linesPerPage = 28;
  
  for (const line of lines) {
    formattedLines.push(line);
    lineCount++;
    
    // Insert page break after every 28 lines
    if (lineCount === linesPerPage) {
      formattedLines.push('\n[Page Break]\n');
      lineCount = 0;
    }
  }
  
  return formattedLines.join('\n');
}
