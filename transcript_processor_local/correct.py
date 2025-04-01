
#!/usr/bin/env python3
"""
OpenAI Transcript Correction Module

This module handles transcript correction using OpenAI's API.
"""

import time
import openai

def correct_transcript_with_openai(transcript, api_key):
    """
    Correct a transcript using OpenAI's API
    
    Parameters:
    - transcript: The raw transcript text to correct
    - api_key: OpenAI API key
    
    Returns:
    - Dictionary containing original and corrected transcript
    """
    if not transcript:
        raise ValueError("No transcript provided for correction")
    
    if not api_key:
        raise ValueError("OpenAI API key is required")
    
    print(f"Sending transcript correction request to OpenAI API (length: {len(transcript)} characters)")
    
    try:
        # Configure OpenAI client
        client = openai.OpenAI(api_key=api_key)
        
        # Make API call
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": (
                    "You are an expert transcription editor. Your task is to correct any errors in the transcript "
                    "while preserving the original meaning. Fix spelling, grammar, punctuation, and sentence structure. "
                    "If there are obvious mistakes or unclear passages, use your judgment to correct them. "
                    "Maintain any speaker labels if present (e.g., 'Speaker 1:'). "
                    "Format the text for easy readability with proper paragraphs."
                )},
                {"role": "user", "content": f"Please correct this transcript:\n\n{transcript}"}
            ],
            temperature=0.2,  # Low temperature for more predictable outputs
            max_tokens=4096
        )
        
        # Extract corrected transcript
        corrected_transcript = response.choices[0].message.content
        
        # Return results
        return {
            "original_transcript": transcript,
            "corrected_transcript": corrected_transcript,
            "model_used": "gpt-4o",
            "timestamp": time.time()
        }
        
    except Exception as e:
        print(f"Error in correct_transcript_with_openai: {str(e)}")
        raise
