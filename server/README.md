
# Deepgram Proxy Server

This directory contains a simple Express.js proxy server for handling Deepgram API requests securely. This proxy addresses CORS issues when making direct API calls from the browser.

## Setup Instructions

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

## How it Works

The proxy server handles API key validation and audio file transcription by relaying requests to Deepgram. This approach:

1. Keeps your API key secure (not exposed in client-side code)
2. Avoids CORS issues that occur with direct browser-to-Deepgram API calls
3. Provides a consistent API for your frontend regardless of the underlying service

## Endpoints

- `GET /validate-key` - Validates if the provided API key is valid
- `GET /check-status` - Checks if the API key is active and has proper permissions
- `POST /transcribe` - Handles file uploads and transcription requests

## Frontend Integration

The frontend application is already configured to attempt connecting to this proxy server at `http://localhost:4000`. If the proxy server is not available, the application will fall back to direct API calls (which may face CORS issues in some environments).

