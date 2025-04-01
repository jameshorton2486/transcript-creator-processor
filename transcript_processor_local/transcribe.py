
#!/usr/bin/env python3
"""
Deepgram Transcription Module

This module handles audio transcription using the Deepgram API.
"""

import requests
import os
import json

def transcribe_audio_with_deepgram(audio_file_path, api_key, options=None):
    """
    Transcribe an audio file using the Deepgram API
    
    Parameters:
    - audio_file_path: Path to the audio file to transcribe
    - api_key: Deepgram API key
    - options: Dictionary of transcription options
    
    Returns:
    - JSON response from Deepgram API
    """
    if not os.path.exists(audio_file_path):
        raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
    
    if not api_key:
        raise ValueError("Deepgram API key is required")
    
    # Default options
    default_options = {
        "model": "nova-2",
        "punctuate": True,
        "diarize": False,
        "smart_format": True
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
        "smart_format": str(default_options["smart_format"]).lower()
    }
    
    headers = {
        "Authorization": f"Token {api_key}"
    }
    
    print(f"Sending transcription request to Deepgram API with options: {params}")
    
    try:
        # Send request to Deepgram API
        with open(audio_file_path, 'rb') as audio:
            response = requests.post(
                url,
                headers=headers,
                params=params,
                data=audio
            )
        
        # Check response
        if response.status_code == 200:
            return response.json()
        else:
            error_message = f"Deepgram API error: {response.status_code} - {response.text}"
            print(error_message)
            raise Exception(error_message)
            
    except Exception as e:
        print(f"Error in transcribe_audio_with_deepgram: {str(e)}")
        raise
