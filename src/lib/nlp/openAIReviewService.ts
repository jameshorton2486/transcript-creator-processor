
/**
 * AI-powered transcript review service using OpenAI
 */
import OpenAI from 'openai';

// Define types for our functions
export interface TrainingRule {
  id: string;
  name: string;
  description: string;
  rule: string;
}

export interface TrainingExample {
  id: string;
  incorrect: string;
  corrected: string;
  createdAt: number;
}

/**
 * Builds a comprehensive system prompt for the AI review
 * Incorporates custom rules and learning from examples
 */
function buildReviewPrompt(rules: TrainingRule[] = [], examples: TrainingExample[] = []): string {
  let instructions = [
    "You are an expert transcript editor specializing in legal and professional transcripts.",
    "Your task is to review, improve, and correct the provided transcript according to the rules and examples below.",
    ""
  ];

  // Add custom rules section if rules exist
  if (rules.length > 0) {
    instructions.push("# CUSTOM FORMATTING RULES");
    instructions.push("Apply these specific rules to the transcript:");
    
    rules.forEach((rule, index) => {
      instructions.push(`${index + 1}. ${rule.name}: ${rule.rule}`);
    });
    
    instructions.push("");
  }

  // Add examples section if examples exist
  if (examples.length > 0) {
    instructions.push("# LEARNING FROM EXAMPLES");
    instructions.push("Apply the patterns and corrections demonstrated in these examples:");
    
    examples.forEach((example, index) => {
      instructions.push(`## Example ${index + 1}:`);
      instructions.push(`Original: "${example.incorrect}"`);
      instructions.push(`Corrected: "${example.corrected}"`);
      instructions.push("");
    });
  }

  // Add standard improvements guidance
  instructions.push("# STANDARD IMPROVEMENTS");
  instructions.push("Always apply these standard improvements:");
  instructions.push("• Format speaker labels consistently (e.g., 'SPEAKER 1:', 'THE COURT:', etc.)");
  instructions.push("• Fix punctuation and capitalization issues");
  instructions.push("• Ensure proper paragraph breaks and formatting");
  instructions.push("• Format legal citations and case references properly");
  instructions.push("• Format dates consistently (e.g., 'January 1, 2023' instead of '1/1/23')");
  instructions.push("• Remove filler words (uh, um, like) when appropriate");
  instructions.push("");
  
  instructions.push("Return ONLY the improved transcript text without any explanations, comments, or meta information.");

  return instructions.join("\n");
}

/**
 * Processes a transcript using OpenAI's API with rules and examples
 * 
 * @param transcript The raw transcript text to review
 * @param rules Array of custom rules to apply
 * @param examples Array of training examples to learn from
 * @param apiKey The user's OpenAI API key
 * @returns Reviewed and enhanced transcript text
 */
export async function reviewWithOpenAI(
  transcript: string,
  rules: TrainingRule[] = [],
  examples: TrainingExample[] = [],
  apiKey: string
): Promise<string> {
  if (!transcript) throw new Error("No transcript provided for review");
  if (!apiKey) throw new Error("OpenAI API key required");

  // Create OpenAI instance with user-provided API key
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  // Build the system prompt based on rules and examples
  const systemPrompt = buildReviewPrompt(rules, examples);
  
  try {
    console.log("Sending transcript to OpenAI for review:", {
      transcriptLength: transcript.length,
      rulesCount: rules.length,
      examplesCount: examples.length,
      model: "gpt-4o-mini" // Using a fast, cost-effective model
    });
    
    // Make the API request to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript }
      ]
    });

    const result = response.choices[0].message.content || "";
    
    // Log result summary
    console.log("OpenAI review complete:", {
      originalLength: transcript.length,
      resultLength: result.length,
      success: result.length > 0
    });
    
    return result;
  } catch (error) {
    console.error("Error reviewing transcript with OpenAI:", error);
    throw error;
  }
}
