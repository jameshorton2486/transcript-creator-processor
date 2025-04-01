
# Audio Transcription Options

This project offers two ways to transcribe audio files:

## Option 1: Direct Transcription via Python (Recommended)

Using the Python script directly is the simplest approach:

1. Make sure you have the Python requirements installed:
```bash
pip install -r transcript_processor_local/requirements.txt
```

2. Run the transcription script directly:
```bash
cd transcript_processor_local
python main.py
```

This approach doesn't require any proxy server and avoids CORS issues completely.

## Option 2: Express Proxy Server (Alternative)

If you prefer to use the web interface and need to avoid CORS issues:

1. Install dependencies:
```bash
npm install express cors axios dotenv multer
```

2. Create a `.env` file in the server directory with your Deepgram API key:
```
DEEPGRAM_API_KEY=your_deepgram_api_key_here
PORT=4000
```

3. Start the server:
```bash
node server.js
```

## Which Option Should I Use?

- For simplicity and reliability: Use Option 1 (Python script)
- For web interface with proxy: Use Option 2 (Express server)

The Python script avoids CORS issues entirely since it doesn't run in a browser.
