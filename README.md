
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

This application uses Google Speech-to-Text API for transcription:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Speech-to-Text API
4. Create an API key under "Credentials"
5. Enter this API key in the application when prompted

## How to Use

1. **Transcribe Audio**:
   - Enter your Google API key
   - Upload an audio file (supports MP3, WAV, FLAC, OGG)
   - Select transcription options
   - Click "Transcribe Audio"
   - For files larger than 10MB, the application will automatically process them in batches

2. **Process Transcript**:
   - After transcription, use the processing options to format and clean up the transcript
   - Apply punctuation corrections, speaker formatting, and entity extraction
   - The processed transcript will appear in the "Processed Transcript" tab

3. **Export Results**:
   - Use the download button to save transcripts as text files
   - JSON data is also available for export

## Troubleshooting

- **API Key Issues**: Ensure your Google API key has Speech-to-Text permissions enabled
- **Large File Processing**: Large files are split into chunks. If processing fails, try a smaller file first
- **Unsupported Format**: If your file isn't recognized, convert it to MP3 or WAV using a tool like Audacity

## Logs and Debugging

The application logs important events to the browser console. Press F12 to open developer tools and select the Console tab to view logs.

## File Size Limitations

- Files under 10MB are processed directly
- Files over 10MB are automatically split into chunks
- Maximum recommended file size: 500MB (approximately 6 hours of audio)

