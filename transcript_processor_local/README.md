
# Local Audio Transcription Tool

A Python application that allows you to transcribe audio files locally using Deepgram and OpenAI APIs.

## Features

- **Audio Transcription**: Transcribe audio files using Deepgram's AI models
- **Transcript Correction**: Enhance and correct transcripts using OpenAI's AI
- **Batch Processing**: Process multiple files at once
- **Advanced Options**: Configure detailed transcription and correction settings
- **Local Storage**: All files are saved locally on your computer
- **User-friendly Interface**: Simple graphical user interface

## Project Structure

```
transcript_processor_local/
│
├── audio_files/                # Local audio files for transcription
├── transcripts/                # Raw transcripts from Deepgram
├── corrected_transcripts/      # AI-corrected transcripts
├── batch_results/              # Results from batch processing
│
├── main.py                     # Main executable script with GUI
├── transcribe.py               # Module: Deepgram transcription
├── correct.py                  # Module: AI corrections with OpenAI
├── requirements.txt            # Python dependencies
├── .env                        # API keys for Deepgram and OpenAI (optional)
└── README.md                   # This file
```

## Requirements

- Python 3.7 or higher
- Required Python packages (automatically installed if missing):
  - requests
  - openai
  - python-dotenv
  - tqdm
  - rich
  - tkinter (usually comes with Python)

## Setup

1. Clone or download this repository
2. Install the requirements:

```
pip install -r requirements.txt
```

3. Set up your API keys:
   - Enter them directly in the application UI
   - Or add them to a `.env` file (optional)

## Usage

1. Run the application:

```
python main.py
```

2. Enter your API keys and save them
3. Select audio file(s) to transcribe
4. Configure transcription options (model, language, etc.)
5. Click "Transcribe Audio" to send the file to Deepgram
6. Optionally, click "Correct Transcript" to improve the transcript with OpenAI

## Transcription Options

The application supports various Deepgram transcription options:

- **Model Selection**: Choose from nova-2, nova, enhanced, or base models
- **Language Selection**: Auto-detect or specify a language
- **Speaker Diarization**: Identify different speakers in the audio
- **Smart Formatting**: Improve formatting of numbers, dates, etc.
- **Punctuation**: Add punctuation to the transcript
- **Summarization**: Generate a summary of the content
- **Topic Detection**: Identify main topics in the content

## Correction Options

OpenAI correction features include:

- **Model Selection**: Choose from GPT-4o, GPT-3.5-Turbo, or GPT-4o-mini
- **Clean Filler Words**: Remove "um", "uh", and other filler words
- **Extract Speakers**: Improve speaker identification
- **Extract Topics**: Identify main discussion topics
- **JSON Formatting**: Output in structured JSON format

## Batch Processing

Process multiple files at once:

1. Go to the "Batch Processing" tab
2. Add individual files or an entire folder
3. Click "Start Batch Processing"
4. Results are saved in a timestamped folder in "batch_results"

## Security Note

API keys are stored locally in the `config.ini` file or can be stored in a `.env` file. While they are masked in the UI, they are stored as plain text in these files. Ensure you keep these files secure.

## Troubleshooting

- For large audio files, the processing might take some time; please be patient
- If the Deepgram API returns errors, check your API key and ensure your audio file is in a supported format
- Supported audio formats include: MP3, WAV, FLAC, M4A, OGG, AAC

## Error Handling

The application includes robust error handling:

- Network connection issues are detected and reported
- API key validation before sending requests
- API rate limiting and retry mechanisms
- Detailed error logging

If you encounter persistent issues, check the application logs for detailed error information.
