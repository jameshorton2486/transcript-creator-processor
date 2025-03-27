
import { useToast } from "@/components/ui/use-toast";

// Configuration for OpenAI API requests
interface OpenAIConfig {
  model: string;
  temperature: number;
  max_tokens: number;
}

// Default configuration values
const DEFAULT_CONFIG: OpenAIConfig = {
  model: "gpt-4o-mini", // Using a fast, cost-effective model
  temperature: 0.3,     // Lower temperature for more consistent results
  max_tokens: 2048      // Reasonable limit for transcript processing
};

/**
 * Processes transcript text using OpenAI's API
 * 
 * @param text The raw transcript text to process
 * @param options Processing options (which improvements to apply)
 * @param apiKey The user's OpenAI API key
 * @returns Enhanced transcript text
 */
export async function processWithOpenAI(
  text: string,
  options: {
    correctPunctuation: boolean;
    formatSpeakers: boolean;
    identifyParties: boolean;
    extractEntities: boolean;
    preserveFormatting: boolean;
    cleanFillers: boolean;
  },
  apiKey: string
): Promise<string> {
  if (!text) throw new Error("No text provided for processing");
  if (!apiKey) throw new Error("OpenAI API key required");

  // Build the system prompt based on selected options
  const systemPrompt = buildSystemPrompt(options);
  
  try {
    // Prepare the API request
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_CONFIG.model,
        temperature: DEFAULT_CONFIG.temperature,
        max_tokens: DEFAULT_CONFIG.max_tokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ]
      })
    });

    // Handle API response
    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      throw new Error(error.error?.message || "Failed to process transcript with OpenAI");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error processing transcript with OpenAI:", error);
    throw error;
  }
}

/**
 * Builds the system prompt based on the selected processing options
 */
function buildSystemPrompt(options: {
  correctPunctuation: boolean;
  formatSpeakers: boolean;
  identifyParties: boolean;
  extractEntities: boolean;
  preserveFormatting: boolean;
  cleanFillers: boolean;
}): string {
  let instructions = [
    "You are an expert transcript editor with experience in legal and professional transcripts.",
    "Your task is to improve and clean a raw transcript while preserving its meaning and content.",
    ""
  ];

  if (options.formatSpeakers) {
    instructions.push("• Format speaker labels consistently (e.g., 'SPEAKER 1:', 'THE COURT:', etc.)");
    instructions.push("• Make sure speaker labels are on their own lines and properly formatted");
  }

  if (options.correctPunctuation) {
    instructions.push("• Fix punctuation and capitalization issues");
    instructions.push("• Ensure sentences begin with capital letters and end with proper punctuation");
  }

  if (options.cleanFillers) {
    instructions.push("• Remove filler words and hesitations (uh, um, like, you know, etc.)");
    instructions.push("• Clean up false starts and stuttering while preserving meaning");
  }

  if (options.identifyParties) {
    instructions.push("• Identify and standardize references to legal parties (PLAINTIFF, DEFENDANT, WITNESS, THE COURT, etc.)");
    instructions.push("• Format legal citations and case references properly");
  }

  if (options.extractEntities) {
    instructions.push("• Recognize and properly format names, dates, and other important entities");
  }

  if (options.preserveFormatting) {
    instructions.push("• Maintain paragraph structure and formatting of the original text");
    instructions.push("• Preserve the overall structure of the transcript");
  } else {
    instructions.push("• Improve paragraph breaks and overall readability");
  }

  instructions.push("");
  instructions.push("Return ONLY the improved transcript text without any explanations, comments, or additional formatting.");

  return instructions.join("\n");
}
