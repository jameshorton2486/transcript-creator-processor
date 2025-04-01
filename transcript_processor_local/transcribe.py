
#!/usr/bin/env python3
"""
Deepgram Transcription Module

This module handles audio transcription using the Deepgram API.
"""

import requests
import os
import json
import time
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def transcribe_audio_with_deepgram(audio_file_path, api_key=None, options=None):
    """
    Transcribe an audio file using the Deepgram API
    
    Parameters:
    - audio_file_path: Path to the audio file to transcribe
    - api_key: Deepgram API key (defaults to DEEPGRAM_API_KEY environment variable)
    - options: Dictionary of transcription options
    
    Returns:
    - JSON response from Deepgram API
    """
    if not os.path.exists(audio_file_path):
        raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
    
    # Get API key from environment if not provided
    if not api_key:
        api_key = os.getenv("DEEPGRAM_API_KEY")
    
    if not api_key:
        raise ValueError("Deepgram API key is required. Set DEEPGRAM_API_KEY in .env file or provide it as parameter.")
    
    # Default options
    default_options = {
        "model": "nova-2",
        "punctuate": True,
        "diarize": False,
        "smart_format": True,
        "language": "auto",
        "detect_language": True,
        "summarize": False,
        "detect_topics": False,
        "utterances": False,
        "profanity_filter": False,
        "redact": None,
        "alternatives": 1
    }
    
    # Merge with provided options
    if options:
        default_options.update(options)
    
    # Prepare URL and parameters
    url = "https://api.deepgram.com/v1/listen"
    
    params = {
        "model": default_options["model"],
        "punctuate": str(default_options["punctuate"]).lower(),
        "diarize": str(default_options["diarize"]).lower(),
        "smart_format": str(default_options["smart_format"]).lower(),
        "utterances": str(default_options["utterances"]).lower()
    }
    
    # Add optional parameters only if they're enabled/specified
    if default_options["language"] != "auto":
        params["language"] = default_options["language"]
    
    if default_options["detect_language"]:
        params["detect_language"] = "true"
    
    if default_options["summarize"]:
        params["summarize"] = "true"
    
    if default_options["detect_topics"]:
        params["detect_topics"] = "true"
    
    if default_options["profanity_filter"]:
        params["profanity_filter"] = "true"
    
    if default_options["redact"]:
        params["redact"] = default_options["redact"]
    
    if default_options["alternatives"] > 1:
        params["alternatives"] = str(default_options["alternatives"])
    
    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": "audio/wav"  # Set appropriate content type based on file
    }
    
    # Determine content type based on file extension
    file_extension = os.path.splitext(audio_file_path)[1].lower()
    if file_extension == '.mp3':
        headers["Content-Type"] = "audio/mpeg"
    elif file_extension == '.wav':
        headers["Content-Type"] = "audio/wav"
    elif file_extension == '.flac':
        headers["Content-Type"] = "audio/flac"
    elif file_extension == '.ogg':
        headers["Content-Type"] = "audio/ogg"
    elif file_extension in ['.m4a', '.aac']:
        headers["Content-Type"] = "audio/mp4"
    
    print(f"Sending transcription request to Deepgram API with options: {params}")
    
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            # Send request to Deepgram API
            with open(audio_file_path, 'rb') as audio:
                audio_data = audio.read()
                
                # Build the URL with query parameters
                query_params = "&".join([f"{k}={v}" for k, v in params.items()])
                full_url = f"{url}?{query_params}"
                
                # Send the request with retries
                response = requests.post(
                    full_url,
                    headers=headers,
                    data=audio_data
                )
            
            # Check response
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:  # Rate limiting
                if attempt < max_retries - 1:
                    print(f"Rate limit hit. Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                    continue
                else:
                    error_message = f"Rate limit exceeded. Please try again later. Response: {response.text}"
                    print(error_message)
                    raise Exception(error_message)
            else:
                error_message = f"Deepgram API error: {response.status_code} - {response.text}"
                print(error_message)
                raise Exception(error_message)
                
        except requests.RequestException as e:
            if attempt < max_retries - 1:
                print(f"Network error: {str(e)}. Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
                continue
            
            error_message = f"Network error: {str(e)}"
            print(error_message)
            raise
        except Exception as e:
            print(f"Error in transcribe_audio_with_deepgram: {str(e)}")
            raise

def validate_deepgram_key(api_key):
    """
    Validate a Deepgram API key
    
    Parameters:
    - api_key: Deepgram API key to validate
    
    Returns:
    - Dict with validity status and message
    """
    if not api_key:
        return {"valid": False, "message": "API key is required"}
    
    url = "https://api.deepgram.com/v1/projects"
    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return {"valid": True, "message": "API key is valid"}
        else:
            return {
                "valid": False, 
                "message": f"Invalid API key (Status: {response.status_code})"
            }
    except Exception as e:
        return {"valid": False, "message": f"Error validating API key: {str(e)}"}

# Command line interface for testing
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Transcribe audio using Deepgram API")
    parser.add_argument("--file", required=True, help="Path to audio file")
    parser.add_argument("--key", help="Deepgram API key (defaults to DEEPGRAM_API_KEY in .env)")
    parser.add_argument("--model", default="nova-2", help="Deepgram model to use")
    parser.add_argument("--diarize", action="store_true", help="Enable speaker diarization")
    
    args = parser.parse_args()
    
    # Use API key from args or environment
    api_key = args.key if args.key else os.getenv("DEEPGRAM_API_KEY")
    
    # Test the API key first
    key_status = validate_deepgram_key(api_key)
    if not key_status["valid"]:
        print(f"Error: {key_status['message']}")
        exit(1)
    
    print(f"API key validated successfully")
    
    # Transcribe the file
    try:
        options = {
            "model": args.model,
            "diarize": args.diarize
        }
        
        result = transcribe_audio_with_deepgram(args.file, api_key, options)
        
        # Pretty print the result
        print(json.dumps(result, indent=2))
        
        # Display the transcript
        transcript = result["results"]["channels"][0]["alternatives"][0]["transcript"]
        print("\n--- Transcript ---")
        print(transcript)
        
    except Exception as e:
        print(f"Error: {str(e)}")
