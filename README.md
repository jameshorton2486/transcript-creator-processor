
# Legal Transcript Creator & Processor

This application helps with processing and creating legal transcripts from audio recordings.

## Quick Setup

1. **Clone the repository**:
   ```
   git clone https://github.com/jameshorton2486/transcript-creator-processor.git
   cd transcript-creator-processor
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Start the development server**:
   ```
   npm run dev
   ```

4. **Access the application**:
   Open your browser and go to `http://localhost:5173`

## Required API Keys

### Deepgram API

This application uses Deepgram's AI speech-to-text API for high-quality transcription:

1. Go to the [Deepgram Dashboard](https://console.deepgram.com/)
2. Create a free account if you don't have one
3. Create a new project and navigate to the API Keys section
4. Create a new API key with appropriate permissions (at minimum, "Usage" scoped key)
5. Enter this API key in the application when prompted

**Note**: Your Deepgram API key is stored securely in your browser's local storage and is only used for making API requests. It is not transmitted elsewhere.

## How to Use

1. **Transcribe Audio**:
   - Enter your Deepgram API key
   - Upload an audio file (supports MP3, WAV, FLAC, OGG, M4A)
   - Configure transcription options:
     - Speaker Diarization: Identifies different speakers in the audio
     - Add Punctuation: Automatically adds appropriate punctuation
     - Smart Format: Intelligently formats numbers, dates, and other entities
     - Model Selection: Choose between different accuracy levels
   - Click "Start Transcription"
   - For files larger than 10MB, the application will automatically process them in batches

2. **Process Transcript**:
   - After transcription, use the processing options to format and clean up the transcript
   - Apply punctuation corrections, speaker formatting, and entity extraction
   - The processed transcript will appear in the "Processed Transcript" tab

3. **Export Results**:
   - Use the download button to save transcripts as text files
   - JSON data is also available for export

## Accessibility Features

- Keyboard navigable interface
- ARIA attributes for screen reader compatibility
- Visual feedback that doesn't rely solely on color
- Focus management for form elements

## Troubleshooting

- **API Key Issues**: Ensure your Deepgram API key has Speech-to-Text permissions enabled
- **Large File Processing**: Large files are split into chunks. If processing fails, try a smaller file first
- **Unsupported Format**: If your file isn't recognized, convert it to MP3 or WAV using a tool like Audacity
- **Network Problems**: If API key validation fails due to network issues, the application can work in offline mode with format-valid API keys

## Logs and Debugging

The application logs important events to the browser console. Press F12 to open developer tools and select the Console tab to view logs.

## File Size Limitations

- Files under 10MB are processed directly
- Files over 10MB are automatically split into chunks
- Maximum recommended file size: 500MB (approximately 6 hours of audio)
