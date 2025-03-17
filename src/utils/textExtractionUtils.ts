export const extractPotentialTermsFromText = (text: string): string[] => {
  // Remove common words, numbers, and punctuation
  const cleanedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words
  const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
  
  // Define a comprehensive list of common words to filter out
  const commonWords = new Set([
    // Common legal terms to exclude
    'number', 'date', 'location', 'witness', 'videographer', 'interpreter', 
    'attorney', 'info', 'present', 'insured', 'name', 'insurer', 'claim', 
    'policy', 'loss', 'exhibits', 'description', 'jose', 'zambrano', 
    'friday', 'depo', 'notes', 'page',
    
    // Common English words
    'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 
    'but', 'his', 'from', 'they', 'say', 'her', 'she', 'will', 'one', 
    'all', 'would', 'there', 'their', 'what', 'out', 'about', 'who', 
    'get', 'which', 'when', 'make', 'can', 'like', 'time', 'just', 
    'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 
    'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 
    'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 
    'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 
    'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 
    'day', 'most', 'been', 'much', 'does', 'those', 'off', 'again',
    'down', 'should', 'still', 'find', 'through', 'same', 'said'
  ]);
  
  // First pass: identify proper nouns (capitalized words not at the beginning of sentences)
  const properNouns = new Set<string>();
  const wordRegex = /\b([A-Z][a-z]+)\b(?!\s*[\.!\?])/g;
  let match;
  
  while ((match = wordRegex.exec(text)) !== null) {
    if (!commonWords.has(match[1].toLowerCase())) {
      properNouns.add(match[1]);
    }
  }
  
  // Second pass: find important words by frequency
  const wordFrequency: {[key: string]: number} = {};
  words.forEach(word => {
    if (!commonWords.has(word) && word.length >= 3 && isNaN(Number(word))) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });
  
  // Get unique words sorted by frequency
  const frequentWords = Object.keys(wordFrequency)
    .filter(word => wordFrequency[word] >= 2) // Only words that appear at least twice
    .sort((a, b) => wordFrequency[b] - wordFrequency[a]);
  
  // Combine proper nouns and frequent words
  const combinedTerms = [...properNouns, ...frequentWords];
  
  // Remove duplicates (case-insensitive)
  const lowerCaseMap = new Map<string, string>();
  combinedTerms.forEach(term => {
    const lowerTerm = term.toLowerCase();
    // Keep the capitalized version if it exists
    if (!lowerCaseMap.has(lowerTerm) || term[0] === term[0].toUpperCase()) {
      lowerCaseMap.set(lowerTerm, term);
    }
  });
  
  // Return unique terms (up to 75)
  return Array.from(lowerCaseMap.values()).slice(0, 75);
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map((item: any) => item.str).join(' ');
      fullText += textItems + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

export const extractTextFromWord = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Word extraction error:", error);
    throw new Error("Failed to extract text from Word document");
  }
};
