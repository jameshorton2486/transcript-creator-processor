
#!/usr/bin/env python3
"""
OpenAI Transcript Correction Module

This module handles transcript correction using OpenAI's API.
"""

import time
import openai
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class TranscriptionCorrectionError(Exception):
    """Custom exception for transcription correction errors"""
    pass

def correct_transcript_with_openai(transcript, api_key=None, options=None):
    """
    Correct a transcript using OpenAI's API
    
    Parameters:
    - transcript: The raw transcript text to correct
    - api_key: OpenAI API key (defaults to OPENAI_API_KEY environment variable)
    - options: Dictionary containing correction options
        - model: OpenAI model to use (default: gpt-4o)
        - temperature: Creativity level (default: 0.2)
        - max_retries: Number of retries on failure (default: 2)
        - format_output: Format output as JSON (default: False)
        - extract_speakers: Try to identify speakers (default: False) 
        - extract_topics: Extract main topics (default: False)
        - clean_filler_words: Remove filler words (default: True)
    
    Returns:
    - Dictionary containing original and corrected transcript
    """
    if not transcript:
        raise ValueError("No transcript provided for correction")
    
    # Get API key from environment if not provided
    if not api_key:
        api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY in .env file or provide it as parameter.")
    
    # Default options
    default_options = {
        "model": "gpt-4o",
        "temperature": 0.2,
        "max_retries": 2,
        "format_output": False,
        "extract_speakers": False,
        "extract_topics": False,
        "clean_filler_words": True
    }
    
    # Merge with provided options
    if options:
        default_options.update(options)
    
    print(f"Sending transcript correction request to OpenAI API (length: {len(transcript)} characters)")
    
    # Construct system prompt based on options
    system_prompt = (
        "You are an expert transcription editor. Your task is to correct any errors in the transcript "
        "while preserving the original meaning. Fix spelling, grammar, punctuation, and sentence structure. "
        "If there are obvious mistakes or unclear passages, use your judgment to correct them. "
    )
    
    if default_options["clean_filler_words"]:
        system_prompt += "Remove filler words and verbal tics like 'um', 'uh', 'like', 'you know', etc. "
    
    if default_options["extract_speakers"]:
        system_prompt += "Try to identify different speakers and label them consistently throughout. "
    
    if default_options["format_output"] and default_options["extract_topics"]:
        system_prompt += (
            "Format your response as a JSON object with the following structure: "
            "{ 'corrected_transcript': 'the corrected text', 'topics': ['topic1', 'topic2', ...] }"
        )
    elif default_options["format_output"]:
        system_prompt += (
            "Format your response as a JSON object with the following structure: "
            "{ 'corrected_transcript': 'the corrected text' }"
        )
    else:
        system_prompt += "Format the text for easy readability with proper paragraphs."
    
    retries = 0
    max_retries = default_options["max_retries"]
    
    while retries <= max_retries:
        try:
            # Configure OpenAI client
            client = openai.OpenAI(api_key=api_key)
            
            # Make API call
            response = client.chat.completions.create(
                model=default_options["model"],
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Please correct this transcript:\n\n{transcript}"}
                ],
                temperature=default_options["temperature"],
                max_tokens=4096
            )
            
            # Extract corrected transcript
            corrected_text = response.choices[0].message.content
            
            # Parse JSON if format_output is True
            result = {
                "original_transcript": transcript,
                "model_used": default_options["model"],
                "timestamp": time.time()
            }
            
            if default_options["format_output"]:
                try:
                    parsed_content = json.loads(corrected_text)
                    result["corrected_transcript"] = parsed_content.get("corrected_transcript", "")
                    if "topics" in parsed_content:
                        result["topics"] = parsed_content["topics"]
                except json.JSONDecodeError:
                    # Fallback if the response isn't valid JSON
                    result["corrected_transcript"] = corrected_text
                    result["error"] = "Failed to parse JSON response"
            else:
                result["corrected_transcript"] = corrected_text
            
            return result
        
        except openai.APIError as e:
            retries += 1
            if retries > max_retries:
                error_msg = f"OpenAI API error after {max_retries} retries: {str(e)}"
                print(error_msg)
                raise TranscriptionCorrectionError(error_msg) from e
            print(f"OpenAI API error (retry {retries}/{max_retries}): {str(e)}")
            time.sleep(2 * retries)  # Exponential backoff
            
        except openai.RateLimitError as e:
            retries += 1
            if retries > max_retries:
                error_msg = f"OpenAI rate limit exceeded after {max_retries} retries: {str(e)}"
                print(error_msg)
                raise TranscriptionCorrectionError(error_msg) from e
            wait_time = 5 * retries
            print(f"OpenAI rate limit exceeded (retry {retries}/{max_retries}). Waiting {wait_time} seconds.")
            time.sleep(wait_time)  # Longer wait for rate limits
            
        except Exception as e:
            error_msg = f"Error in correct_transcript_with_openai: {str(e)}"
            print(error_msg)
            raise TranscriptionCorrectionError(error_msg) from e

# Command line interface for testing
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Correct transcript using OpenAI")
    parser.add_argument("--input", required=True, help="Path to input transcript file")
    parser.add_argument("--output", help="Path to output file (defaults to input_corrected.txt)")
    parser.add_argument("--key", help="OpenAI API key (defaults to OPENAI_API_KEY in .env)")
    parser.add_argument("--model", default="gpt-4o", help="OpenAI model to use")
    parser.add_argument("--clean-filler", action="store_true", help="Clean filler words")
    parser.add_argument("--extract-speakers", action="store_true", help="Extract speakers")
    
    args = parser.parse_args()
    
    # Read transcript from file
    try:
        with open(args.input, 'r') as file:
            transcript = file.read()
    except Exception as e:
        print(f"Error reading file: {str(e)}")
        exit(1)
    
    # Use API key from args or environment
    api_key = args.key if args.key else os.getenv("OPENAI_API_KEY")
    
    # Set options
    options = {
        "model": args.model,
        "clean_filler_words": args.clean_filler,
        "extract_speakers": args.extract_speakers
    }
    
    # Generate output filename if not provided
    if not args.output:
        base_name = os.path.splitext(args.input)[0]
        args.output = f"{base_name}_corrected.txt"
    
    # Correct transcript
    try:
        print(f"Correcting transcript with OpenAI {args.model}...")
        result = correct_transcript_with_openai(transcript, api_key, options)
        
        # Save corrected transcript
        with open(args.output, 'w') as file:
            file.write(result["corrected_transcript"])
        
        print(f"Corrected transcript saved to: {args.output}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
