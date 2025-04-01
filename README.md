
# Local Audio Transcription Tool

A simple Python application that allows you to transcribe audio files locally using Deepgram and OpenAI APIs.

## Features

- Select audio files from your local filesystem
- Transcribe audio using the Deepgram API
- Automatically correct and improve transcriptions using OpenAI's API
- Save all files locally (original audio, raw transcripts, AI-corrected transcripts)
- Simple graphical user interface

## Requirements

- Python 3.7 or higher
- Required Python packages (automatically installed if missing):
  - requests
  - openai
  - tkinter (usually comes with Python)

## Setup

1. Clone or download this repository
2. Run the script:

```
python transcribe_audio.py
```

3. Enter your API keys:
   - Deepgram API key: Get one from [Deepgram Console](https://console.deepgram.com/)
   - OpenAI API key: Get one from [OpenAI Dashboard](https://platform.openai.com/api-keys)

4. Your API keys will be saved locally in `config.ini` for future use

## Usage

1. Enter your API keys and save them
2. Click "Browse Files..." to select an audio file
3. Configure transcription options (model, punctuation, etc.)
4. Click "Transcribe Audio" to send the file to Deepgram
5. Optionally, click "Correct Transcript" to improve the transcript with OpenAI
6. The results are automatically saved to the "output" folder

## File Outputs

For each transcription, the following files are created in the output folder:

- `filename_raw_transcript.json` - Complete Deepgram API response
- `filename_raw_transcript.txt` - Plain text transcript from Deepgram
- `filename_corrected_transcript.json` - OpenAI correction details (if used)
- `filename_corrected_transcript.txt` - Corrected transcript text from OpenAI

## Security Note

API keys are stored locally in the `config.ini` file. While they are masked in the UI, they are stored as plain text in the config file. Ensure you keep this file secure.

## Troubleshooting

- If you encounter CORS errors (as might happen with a web app), this local application avoids those issues altogether
- For large audio files, the processing might take some time; please be patient
- If the Deepgram API returns errors, check your API key and ensure your audio file is in a supported format
