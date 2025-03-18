
export const applyMockReviewRules = (transcript: string, rules: any[]): string => {
  let reviewedText = transcript;
  
  // Apply custom rules (in a real app, this would be done more intelligently via AI)
  if (rules.length > 0) {
    // Mock rule application (simple text replacements)
    // In a real implementation, this would use more sophisticated NLP techniques
    rules.forEach(rule => {
      if (rule.name.toLowerCase().includes("capitalize")) {
        // Apply correct capitalization for common legal entities
        reviewedText = reviewedText
          .replace(/\bcourt\b/g, "Court")
          .replace(/\bplaintiff\b/g, "Plaintiff")
          .replace(/\bdefendant\b/g, "Defendant")
          .replace(/\bcounsel\b/g, "Counsel")
          .replace(/\bjudge\b/g, "Judge")
          .replace(/\battorney\b/g, "Attorney");
      }
      
      if (rule.name.toLowerCase().includes("date")) {
        // Format dates according to legal standards
        reviewedText = reviewedText
          .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, month, day, year) => {
            const months = [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ];
            return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
          });
      }
      
      if (rule.name.toLowerCase().includes("speaker")) {
        // Format speaker labels according to legal transcript conventions
        reviewedText = reviewedText
          .replace(/Speaker 1:/g, "THE COURT:")
          .replace(/Speaker 2:/g, "PLAINTIFF'S COUNSEL:")
          .replace(/Speaker 3:/g, "DEFENDANT'S COUNSEL:")
          .replace(/Speaker 4:/g, "WITNESS:")
          .replace(/Speaker 5:/g, "THE REPORTER:")
          .replace(/Speaker 6:/g, "THE CLERK:");
      }
      
      if (rule.name.toLowerCase().includes("citation")) {
        // Format legal citations properly
        reviewedText = reviewedText
          .replace(/(\d+)\s+U\.S\.\s+(\d+)/g, "$1 U.S. $2")
          .replace(/(\d+)\s+F\.(\d+)\s+(\d+)/g, "$1 F.$2d $3")
          .replace(/([A-Za-z]+)\s+vs\.\s+([A-Za-z]+)/g, "$1 v. $2");
      }
      
      if (rule.name.toLowerCase().includes("punctuation")) {
        // Fix common punctuation issues in transcripts
        reviewedText = reviewedText
          .replace(/\s+\./g, ".")
          .replace(/\s+,/g, ",")
          .replace(/\s+\?/g, "?")
          .replace(/\s+!/g, "!")
          .replace(/\s+:/g, ":");
      }
    });
  }
  
  return reviewedText;
};

export const applyMockExamples = (transcript: string, examples: any[]): string => {
  let reviewedText = transcript;
  
  // Apply learning from examples (in a real app, this would be done with ML)
  if (examples.length > 0) {
    // Very simple simulation of learning from examples
    // In a real implementation, this would use more sophisticated techniques
    examples.forEach(example => {
      // Find obvious patterns from examples and apply them
      if (example.incorrect && example.corrected) {
        // Simple direct replacement
        const regex = new RegExp(escapeRegExp(example.incorrect), 'g');
        reviewedText = reviewedText.replace(regex, example.corrected);
      
        // Learn some generalizable patterns
        if (example.incorrect.includes("vs.") && example.corrected.includes("v.")) {
          reviewedText = reviewedText.replace(/\bvs\.\b/g, "v.");
        }
        
        if (example.incorrect.includes("gonna") && example.corrected.includes("going to")) {
          reviewedText = reviewedText.replace(/\bgonna\b/g, "going to");
        }
        
        if (example.incorrect.includes("wanna") && example.corrected.includes("want to")) {
          reviewedText = reviewedText.replace(/\bwanna\b/g, "want to");
        }
        
        // Learn from court title corrections
        if (example.incorrect.includes("the judge") && example.corrected.includes("THE COURT")) {
          reviewedText = reviewedText
            .replace(/\bthe judge\b\s*:/gi, "THE COURT:")
            .replace(/\bjudge\b\s*:/gi, "THE COURT:");
        }
      }
    });
  }
  
  return reviewedText;
};

// Helper function to escape special regex characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const applyStandardImprovements = (transcript: string): string => {
  // Apply standard improvements for legal transcripts
  return transcript
    // Case citation formatting
    .replace(/\b(\w+) vs\. (\w+)/g, "$1 v. $2")
    .replace(/\b(\w+) versus (\w+)/g, "$1 v. $2")
    
    // Date formatting (convert MM/DD/YYYY to Month DD, YYYY)
    .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, month, day, year) => {
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
    })
    
    // Time formatting
    .replace(/(\d{1,2}):(\d{2})\s*(am|pm)/gi, (match, hours, minutes, period) => 
      `${hours}:${minutes} ${period.toUpperCase()}`)
    
    // Replace informal contractions with formal language
    .replace(/gonna/g, "going to")
    .replace(/wanna/g, "want to")
    .replace(/kinda/g, "kind of")
    .replace(/sorta/g, "sort of")
    .replace(/cuz/g, "because")
    .replace(/\bur\b/g, "your")
    .replace(/\by+a+\b/g, "yes")
    .replace(/\bn+o+\b/g, "no")
    .replace(/\bo+k+a*y+\b/g, "okay")
    
    // Format case numbers and document references
    .replace(/today's date is (\w+), (\d{1,2})th (\d{4})/gi, "Today's date is $1 $2, $3")
    .replace(/(\d+) CI to (\d+)/gi, "$1-CI-$2")
    .replace(/case number/gi, "Case No.")
    .replace(/cause number/gi, "Cause No.")
    .replace(/docket number/gi, "Docket No.")
    
    // Format legal roles consistently
    .replace(/\bthe plaintiff\b/gi, "THE PLAINTIFF")
    .replace(/\bthe defendant\b/gi, "THE DEFENDANT")
    .replace(/\bthe witness\b/gi, "THE WITNESS")
    
    // Improve speaker formatting
    .replace(/\b(Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+):/g, "$1 $2:")
    
    // Proper formatting for "Q" and "A" in depositions
    .replace(/^Q\.\s*/gm, "Q: ")
    .replace(/^A\.\s*/gm, "A: ")
    
    // Add paragraph breaks for readability
    .replace(/(\.\s*)([A-Z][a-z])/g, "$1\n\n$2")
    .replace(/(:\s*\n+)([A-Z])/g, ":\n    $2")
    
    // Ensure proper spacing after punctuation
    .replace(/([.!?])([A-Z])/g, "$1 $2");
};
