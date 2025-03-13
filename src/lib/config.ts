
// Configuration for transcript processing
export const PUNCTUATION_RULES = [
  "Use proper punctuation marks where necessary.",
  "Ensure correct spacing around punctuation marks.",
  "Capitalize the first word of each sentence.",
  "Capitalize all proper nouns, including names of people, companies, and places.",
  "Do not correct spelling or grammar unless specified in these rules.",
  "Do not change abbreviations or acronyms.",
  "Maintain original formatting for speaker labels.",
  "Do not add or remove line breaks.",
  "Change 'Alright' to 'All right'.",
  "Format dates as 'Month Day, Year' (e.g., July 15, 2024).",
  "Format times in 12-hour format with AM/PM (e.g., 10:04 AM).",
  "Ensure proper capitalization for company names.",
  "Capitalize all letters in abbreviations like 'LLC', 'Inc.', 'Ltd.'.",
  "Change 'K' at the beginning of a sentence to 'Okay'.",
  "Ensure proper punctuation for questions, including the use of question marks."
];

export const COMMON_LOWERCASE_WORDS = [
  "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", 
  "to", "from", "by", "with", "in", "of", "vs", "v"
];

export const ENTITY_PATTERNS = [
  "(?i)\\b[A-Z][a-z]+ [A-Z][a-z]+\\b",  // Names
  "(?i)\\b[A-Z][a-z]+ [A-Z]\\. [A-Z][a-z]+\\b",  // Names with middle initial
  "(?i)\\b[A-Z][a-z]+ & [A-Z][a-z]+\\b",  // Law firms
  "(?i)\\b[A-Z][a-z]+ [A-Z][a-z]+ & [A-Z][a-z]+\\b",  // Law firms
  "(?i)\\bState Bar No\\. \\d+\\b"  // State Bar Numbers
];

export interface TranscriptionOptions {
  punctuate: boolean;
  diarize: boolean;
  paragraphs: boolean;
  utterances: boolean;
  numerals: boolean;
}

export const DEFAULT_TRANSCRIPTION_OPTIONS: TranscriptionOptions = {
  punctuate: true,
  diarize: true,
  paragraphs: true,
  utterances: true,
  numerals: true
};

export interface ProcessingOptions {
  correctPunctuation: boolean;
  formatSpeakers: boolean;
  identifyParties: boolean;
  preserveFormatting: boolean;
  extractEntities: boolean;
}

export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  correctPunctuation: true,
  formatSpeakers: true,
  identifyParties: true,
  preserveFormatting: true,
  extractEntities: true
};

// Version information
export const APP_INFO = {
  name: "Legal Transcript Processor",
  version: "1.0.0",
  description: "Process, transcribe, and extract information from legal transcripts"
};

// API settings
export const API_SETTINGS = {
  openaiModel: "gpt-4o",
  maxTokens: 4000,
  tokensPerMinute: 3500
};
