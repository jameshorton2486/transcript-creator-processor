
export const applyMockReviewRules = (transcript: string, rules: any[]): string => {
  let reviewedText = transcript;
  
  // Apply custom rules (in a real app, this would be done more intelligently via AI)
  if (rules.length > 0) {
    // Mock rule application (simple text replacements)
    // In a real implementation, this would use more sophisticated NLP techniques
    rules.forEach(rule => {
      if (rule.name.toLowerCase().includes("capitalize")) {
        reviewedText = reviewedText.replace(/\bcourt\b/g, "Court");
      }
      
      if (rule.name.toLowerCase().includes("date")) {
        reviewedText = reviewedText.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, "January $1, $3");
      }
      
      if (rule.name.toLowerCase().includes("speaker")) {
        reviewedText = reviewedText
          .replace(/Speaker 1:/g, "THE COURT:")
          .replace(/Speaker 2:/g, "PLAINTIFF'S COUNSEL:")
          .replace(/Speaker 3:/g, "DEFENDANT'S COUNSEL:");
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
      if (example.incorrect.includes("vs.") && example.corrected.includes("v.")) {
        reviewedText = reviewedText.replace(/\bvs\.\b/g, "v.");
      }
      
      if (example.incorrect.includes("gonna") && example.corrected.includes("going to")) {
        reviewedText = reviewedText.replace(/\bgonna\b/g, "going to");
      }
    });
  }
  
  return reviewedText;
};

export const applyStandardImprovements = (transcript: string): string => {
  // Apply standard improvements
  return transcript
    .replace(/\b(\w+) vs\. (\w+)/g, "$1 v. $2")
    .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, "January $1, $3")
    .replace(/\b(\d{1,2}):(\d{1,2})\b/g, "$1:$2 o'clock")
    .replace(/gonna/g, "going to")
    .replace(/wanna/g, "want to")
    .replace(/kinda/g, "kind of")
    .replace(/sorta/g, "sort of")
    .replace(/cuz/g, "because")
    .replace(/\bur\b/g, "your")
    .replace(/today's date is (\w+), (\d{1,2})th (\d{4})/gi, "Today's date is $1 $2, $3")
    .replace(/(\d+) CI to (\d+)/gi, "$1-CI-$2")
    // Add some paragraph breaks for readability
    .replace(/(\.\s*)([A-Z][a-z])/g, "$1\n\n$2");
};
