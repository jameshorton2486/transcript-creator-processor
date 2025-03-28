
# AssemblyAI Transcription Integration Guide

This guide explains how to set up and use the AssemblyAI transcription service in the Legal Transcript Creator & Processor application.

## What is AssemblyAI?

[AssemblyAI](https://www.assemblyai.com/) is a powerful Speech-to-Text API that offers advanced transcription capabilities, including speaker diarization, entity detection, and more. Our application uses AssemblyAI to convert audio recordings into accurate transcripts.

## Getting Started with AssemblyAI

### 1. Create an AssemblyAI Account

To use the AssemblyAI transcription service:

1. Visit [AssemblyAI's website](https://www.assemblyai.com/) and create an account
2. Navigate to your dashboard and obtain your API key
3. Keep this API key secure - you'll need it for the application

### 2. Using AssemblyAI in the Application

Once you have your API key:

1. Open the Legal Transcript Creator & Processor application
2. Navigate to the transcription tab
3. In the AssemblyAI Transcriber panel, enter your API key in the designated field
4. Click "Test Key" to verify your API key is valid
5. Upload your audio file using the file selector
6. Click "Transcribe with AssemblyAI" to begin the transcription process

### 3. Transcription Features

AssemblyAI offers several features that enhance your transcription experience:

- **Speaker Diarization**: Identifies different speakers in the audio (enable with "Speaker Labels" option)
- **Punctuation**: Automatically adds appropriate punctuation
- **Formatting**: Improves readability of the transcript
- **Real-time Progress**: View the transcription progress as AssemblyAI processes your audio

## Technical Details

### File Size Limitations

AssemblyAI can handle files of various sizes, but for optimal performance:

- Recommended maximum file size: 500MB (approximately 6 hours of audio)
- Supported formats: MP3, WAV, FLAC, M4A, and more

### Supported Languages

Our AssemblyAI integration primarily supports English, but can work with multiple languages. For best results with non-English content, specify the language in the options.

### Transcript Optimization

After receiving your transcript from AssemblyAI, you can:

1. Process the transcript using our built-in tools
2. Perform AI review for further enhancements
3. Export the transcript in various formats

## Troubleshooting

### Common Issues

1. **Invalid API Key**: Ensure your AssemblyAI API key is entered correctly and is active
2. **Transcription Fails**: For large files, try splitting into smaller segments or use a different format
3. **Poor Transcription Quality**: Ensure your audio has good clarity and minimal background noise

### API Key Security

Your AssemblyAI API key is stored in your browser's local storage and is never sent to our servers. For security:

- Don't share your API key with others
- Consider refreshing your API key periodically from the AssemblyAI dashboard

## Pricing Information

AssemblyAI offers various pricing tiers, including a free tier with limited minutes per month. Check the [AssemblyAI pricing page](https://www.assemblyai.com/pricing) for current rates.

The application itself doesn't charge for transcription - you only pay for what you use through AssemblyAI.

## Further Assistance

If you encounter issues with the AssemblyAI integration:

1. Check the console logs for technical details (F12 > Console)
2. Verify your API key is valid
3. Ensure your audio file is in a supported format
4. Contact AssemblyAI support for API-specific issues

---

AssemblyAI and its logo are trademarks of AssemblyAI Inc. This integration guide is unofficial and not affiliated with or endorsed by AssemblyAI Inc.
