
# Local Audio Transcription Tool

A simple, standalone GUI application for transcribing audio files using Deepgram's AI and correcting transcripts using OpenAI.

## Features

- Transcribe audio files with Deepgram API
- Correct transcripts with OpenAI
- Batch processing of multiple files
- Multiple transcription options
- Locally saved results
- No web server or proxy needed

## Setup

1. Install required packages:
   ```
   pip install -r requirements.txt
   ```

2. Add your API keys:
   - Copy `.env.example` to `.env` and add your API keys, or
   - Enter your API keys directly in the application's Settings tab

## Usage

Simply run:
```
python main.py
```

This will open a graphical interface where you can:
1. Select audio files to transcribe
2. Configure transcription options
3. Process files individually or in batches
4. Save and review results

## Directory Structure

- `audio_files/` - Local audio files for transcription
- `transcripts/` - Raw transcripts from Deepgram
- `corrected_transcripts/` - AI-corrected transcripts
- `batch_results/` - Results from batch processing

## Supported Audio Formats

- MP3 (.mp3)
- WAV (.wav)
- FLAC (.flac)
- M4A (.m4a)
- OGG (.ogg)
- AAC (.aac)

## No Server Required

This application runs completely locally, with no need for a web server or Express proxy.

