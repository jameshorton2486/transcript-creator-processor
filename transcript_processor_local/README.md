
# Local Audio Transcription Tool

A simple Python application that allows you to transcribe audio files locally using Deepgram and OpenAI APIs.

## Features

- Select audio files from your local filesystem
- Transcribe audio using the Deepgram API
- Automatically correct and improve transcriptions using OpenAI's API
- Save all files locally (original audio, raw transcripts, AI-corrected transcripts)
- Simple graphical user interface

## Project Structure

```
transcript_processor_local/
│
├── audio_files/                # Local audio files for transcription
├── transcripts/                # Raw transcripts from Deepgram
├── corrected_transcripts/      # AI-corrected transcripts
│
├── main.py                     # Main executable script with GUI
├── transcribe.py               # Module: Deepgram transcription
├── correct.py                  # Module: AI corrections with OpenAI
├── requirements.txt            # Python dependencies
├── .env                        # API keys for Deepgram and OpenAI
└── README.md                   # This file
```

## Requirements

- Python 3.7 or higher
- Required Python packages (automatically installed if missing):
  - requests
  - openai
  - python-dotenv
  - tkinter (usually comes with Python)

## Setup

1. Clone or download this repository
2. Install the requirements:

```
pip install -r requirements.txt
```

3. Set up your API keys:
   - Add your API keys to the `.env` file
   - Or enter them directly in the application when prompted

## Usage

1. Run the application:

```
python main.py
```

2. Enter your API keys and save them
3. Click "Browse Files..." to select an audio file
4. Configure transcription options (model, punctuation, etc.)
5. Click "Transcribe Audio" to send the file to Deepgram
6. Optionally, click "Correct Transcript" to improve the transcript with OpenAI
7. The results are automatically saved to the respective folders:
   - Audio files: `audio_files/`
   - Raw transcripts: `transcripts/`
   - Corrected transcripts: `corrected_transcripts/`

## File Outputs

For each transcription, the following files are created:

- `filename_raw_transcript.json` - Complete Deepgram API response
- `filename_raw_transcript.txt` - Plain text transcript from Deepgram
- `filename_corrected_transcript.json` - OpenAI correction details (if used)
- `filename_corrected_transcript.txt` - Corrected transcript text from OpenAI

## Security Note

API keys are stored locally in the `config.ini` file and can also be stored in the `.env` file. While they are masked in the UI, they are stored as plain text in these files. Ensure you keep these files secure.

## Troubleshooting

- For large audio files, the processing might take some time; please be patient
- If the Deepgram API returns errors, check your API key and ensure your audio file is in a supported format
- Supported audio formats include: MP3, WAV, FLAC, M4A, OGG, AAC
