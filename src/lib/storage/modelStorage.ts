
/**
 * Handles storage/persistence of model data and training examples
 */

// Define interfaces for stored data
export interface StoredTrainingRule {
  id: string;
  name: string;
  description: string;
  rule: string;
  createdAt: number;
}

export interface StoredTrainingExample {
  id: string;
  incorrect: string;
  corrected: string;
  createdAt: number;
}

export interface StoredTranscript {
  id: string;
  name: string;
  text: string;
  originalText?: string;
  createdAt: number;
}

// Storage keys
const KEYS = {
  TRAINING_RULES: 'transcriptRules',
  TRAINING_EXAMPLES: 'transcriptExamples',
  SAVED_TRANSCRIPTS: 'savedTranscripts',
};

// Rules storage
export const getRules = (): StoredTrainingRule[] => {
  try {
    const rules = localStorage.getItem(KEYS.TRAINING_RULES);
    if (rules) {
      const parsedRules = JSON.parse(rules);
      
      // Add createdAt if not present (backward compatibility)
      return parsedRules.map((rule: any) => ({
        ...rule,
        createdAt: rule.createdAt || Date.now()
      }));
    }
    return [];
  } catch (err) {
    console.error('Error getting training rules:', err);
    return [];
  }
};

export const saveRule = (rule: Omit<StoredTrainingRule, 'createdAt'>): StoredTrainingRule => {
  try {
    const rules = getRules();
    const newRule = {
      ...rule,
      createdAt: Date.now()
    };
    
    localStorage.setItem(KEYS.TRAINING_RULES, JSON.stringify([...rules, newRule]));
    return newRule;
  } catch (err) {
    console.error('Error saving training rule:', err);
    throw new Error('Failed to save training rule');
  }
};

export const deleteRule = (id: string): void => {
  try {
    const rules = getRules();
    const updatedRules = rules.filter(rule => rule.id !== id);
    localStorage.setItem(KEYS.TRAINING_RULES, JSON.stringify(updatedRules));
  } catch (err) {
    console.error('Error deleting training rule:', err);
    throw new Error('Failed to delete training rule');
  }
};

// Examples storage
export const getExamples = (): StoredTrainingExample[] => {
  try {
    const examples = localStorage.getItem(KEYS.TRAINING_EXAMPLES);
    if (examples) {
      const parsedExamples = JSON.parse(examples);
      
      // Add createdAt if not present (backward compatibility)
      return parsedExamples.map((example: any) => ({
        ...example,
        createdAt: example.createdAt || Date.now()
      }));
    }
    return [];
  } catch (err) {
    console.error('Error getting training examples:', err);
    return [];
  }
};

export const saveExample = (example: Omit<StoredTrainingExample, 'createdAt'>): StoredTrainingExample => {
  try {
    const examples = getExamples();
    const newExample = {
      ...example,
      createdAt: Date.now()
    };
    
    localStorage.setItem(KEYS.TRAINING_EXAMPLES, JSON.stringify([...examples, newExample]));
    return newExample;
  } catch (err) {
    console.error('Error saving training example:', err);
    throw new Error('Failed to save training example');
  }
};

export const deleteExample = (id: string): void => {
  try {
    const examples = getExamples();
    const updatedExamples = examples.filter(example => example.id !== id);
    localStorage.setItem(KEYS.TRAINING_EXAMPLES, JSON.stringify(updatedExamples));
  } catch (err) {
    console.error('Error deleting training example:', err);
    throw new Error('Failed to delete training example');
  }
};

// Transcript storage
export const getTranscripts = (): StoredTranscript[] => {
  try {
    const transcripts = localStorage.getItem(KEYS.SAVED_TRANSCRIPTS);
    if (transcripts) {
      return JSON.parse(transcripts);
    }
    return [];
  } catch (err) {
    console.error('Error getting saved transcripts:', err);
    return [];
  }
};

export const saveTranscript = (
  name: string, 
  text: string, 
  originalText?: string
): StoredTranscript => {
  try {
    const transcripts = getTranscripts();
    const newTranscript: StoredTranscript = {
      id: Date.now().toString(),
      name,
      text,
      originalText,
      createdAt: Date.now()
    };
    
    localStorage.setItem(KEYS.SAVED_TRANSCRIPTS, JSON.stringify([...transcripts, newTranscript]));
    return newTranscript;
  } catch (err) {
    console.error('Error saving transcript:', err);
    throw new Error('Failed to save transcript');
  }
};

export const deleteTranscript = (id: string): void => {
  try {
    const transcripts = getTranscripts();
    const updatedTranscripts = transcripts.filter(transcript => transcript.id !== id);
    localStorage.setItem(KEYS.SAVED_TRANSCRIPTS, JSON.stringify(updatedTranscripts));
  } catch (err) {
    console.error('Error deleting transcript:', err);
    throw new Error('Failed to delete transcript');
  }
};

// Export a method for initializing remote storage when available
export const initRemoteStorage = async () => {
  // This is a placeholder for future implementation with Supabase or Firebase
  console.log('Remote storage initialization would happen here');
  return {
    isRemoteAvailable: false,
    message: 'Using local storage only'
  };
};
