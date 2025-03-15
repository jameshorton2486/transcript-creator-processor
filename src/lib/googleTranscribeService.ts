
import { DEFAULT_TRANSCRIPTION_OPTIONS } from './config';
import { Progress } from '@/components/ui/progress';
import { float32ArrayToWav, fileToAudioBuffer, splitAudioBuffer, calculateOptimalChunkDuration } from './audioProcessor';

// New function to test if the API key is valid by making a minimal request
export const testApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    // Make a minimal request to the Google Speech API
    const response = await fetch(
      `https://speech.googleapis.com/v1/operations?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    // If the response is 400, it could be because it's an empty request, which is expected
    // What's important is that the API key was accepted (no 403 or 401)
    return response.status !== 403 && response.status !== 401;
  } catch (error) {
    console.error('API key test error:', error);
    return false;
  }
};

// This service handles communication with Google Speech-to-Text API
export const transcribeAudio = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void
) => {
  try {
    // Check if file is too large for synchronous processing
    const isLargeFile = file.size > 10 * 1024 * 1024;
    
    // Log what we're doing
    console.log(`Transcribing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) with Google Speech-to-Text`);
    console.log('Options:', options);
    
    if (!isLargeFile) {
      // For smaller files, use the existing synchronous method
      return await transcribeSingleFile(file, apiKey, options);
    } else {
      // For large files, use batch processing
      return await transcribeBatchedAudio(file, apiKey, options, onProgress);
    }
  } catch (error) {
    console.error('Google transcription error:', error);
    throw error;
  }
};

// Process a single file (original method for files under 10MB)
const transcribeSingleFile = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS
) => {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    const base64Audio = arrayBufferToBase64(arrayBuffer);
    
    // Set up transcription options based on our default options
    const transcriptionOptions = {
      punctuate: options.punctuate,
      diarize: options.diarize,
      paragraphs: options.paragraphs,
      utterances: options.utterances,
      numerals: options.numerals,
      language: 'en-US'
    };
    
    // Prepare request body for Google Speech-to-Text API
    const requestBody = {
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 16000,
        languageCode: transcriptionOptions.language,
        enableAutomaticPunctuation: transcriptionOptions.punctuate,
        enableSpeakerDiarization: transcriptionOptions.diarize,
        diarizationSpeakerCount: 2, // Default to 2 speakers, can be adjusted
        model: "latest_long",
      },
      audio: {
        content: base64Audio
      }
    };
    
    // Make request to Google Speech-to-Text API
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google API error:', errorData);
      throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Google transcription completed successfully');
    
    // Format Google's response to our app's expected format
    return formatGoogleResponse(data);
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

// New method to handle large files through batch processing
const transcribeBatchedAudio = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  onProgress?: (progress: number) => void
) => {
  try {
    console.log('Processing large file in batches...');
    onProgress?.(0); // Initialize progress
    
    // Convert file to AudioBuffer
    const audioBuffer = await fileToAudioBuffer(file);
    const fileDurationSec = audioBuffer.duration;
    console.log(`Audio duration: ${fileDurationSec} seconds`);
    
    // Calculate optimal chunk size based on file size and duration
    const optimalChunkDuration = calculateOptimalChunkDuration(file.size, fileDurationSec);
    console.log(`Using chunk duration of ${optimalChunkDuration} seconds`);
    
    // Split audio into chunks
    const audioChunks = splitAudioBuffer(audioBuffer, optimalChunkDuration);
    console.log(`Split audio into ${audioChunks.length} chunks`);
    
    // Convert chunks to WAV files
    const wavBlobs = audioChunks.map(chunk => 
      float32ArrayToWav(chunk, audioBuffer.sampleRate)
    );
    
    // Process each chunk
    const results = [];
    for (let i = 0; i < wavBlobs.length; i++) {
      const chunkFile = new File(
        [wavBlobs[i]], 
        `${file.name.split('.')[0]}_chunk${i}.wav`, 
        { type: 'audio/wav' }
      );
      
      // Update progress
      onProgress?.(Math.round((i / wavBlobs.length) * 100));
      console.log(`Processing chunk ${i+1}/${wavBlobs.length}...`);
      
      // Transcribe this chunk
      const chunkResult = await transcribeSingleFile(chunkFile, apiKey, options);
      results.push(chunkResult);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Combine all results
    onProgress?.(100);
    return combineTranscriptionResults(results);
  } catch (error) {
    console.error('Batched transcription error:', error);
    throw error;
  }
};

// Combine multiple transcription results into a single result
const combineTranscriptionResults = (results: any[]): any => {
  if (results.length === 0) {
    return {
      results: {
        transcripts: [{ transcript: "No transcript available", confidence: 0 }],
        channels: [{ alternatives: [{ transcript: "No transcript available", confidence: 0 }] }]
      }
    };
  }
  
  // Combine all transcripts with proper spacing
  let combinedTranscript = '';
  let confidenceSum = 0;
  
  results.forEach((result, index) => {
    if (result.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      const transcript = result.results.channels[0].alternatives[0].transcript;
      combinedTranscript += transcript;
      
      // Add a newline if not the last chunk and if the transcript doesn't end with one
      if (index < results.length - 1 && !transcript.trim().endsWith('\n')) {
        combinedTranscript += '\n';
      }
      
      // Accumulate confidence scores
      if (result.results?.channels?.[0]?.alternatives?.[0]?.confidence) {
        confidenceSum += result.results.channels[0].alternatives[0].confidence;
      }
    }
  });
  
  // Calculate average confidence
  const avgConfidence = results.length > 0 ? confidenceSum / results.length : 0;
  
  // Return in the expected format
  return {
    results: {
      transcripts: [
        {
          transcript: combinedTranscript,
          confidence: avgConfidence
        }
      ],
      channels: [
        {
          alternatives: [
            {
              transcript: combinedTranscript,
              confidence: avgConfidence
            }
          ]
        }
      ]
    }
  };
};

// Helper function to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
};

// Format the Google Speech-to-Text response to match our app's expected format
const formatGoogleResponse = (googleResponse: any) => {
  if (!googleResponse.results || googleResponse.results.length === 0) {
    return {
      results: {
        transcripts: [{ transcript: "No transcript available", confidence: 0 }],
        channels: [{ alternatives: [{ transcript: "No transcript available", confidence: 0 }] }]
      }
    };
  }

  // Extract the transcript text from all results
  let fullTranscript = '';
  let speakerNumber = 1;
  const speakerMap: Record<number, number> = {};
  
  // Process all results to create a full transcript with speaker labels
  googleResponse.results.forEach((result: any, index: number) => {
    if (result.alternatives && result.alternatives.length > 0) {
      const transcript = result.alternatives[0].transcript || '';
      
      // If speaker diarization is available
      if (result.alternatives[0].words && result.alternatives[0].words.length > 0) {
        let currentSpeaker = -1;
        let currentText = '';
        
        result.alternatives[0].words.forEach((word: any) => {
          const speakerId = word.speakerTag || 0;
          
          // Map Google speaker tags to our format (Speaker 1, Speaker 2, etc.)
          if (!speakerMap[speakerId]) {
            speakerMap[speakerId] = speakerNumber++;
          }
          
          // If speaker changed, add the previous segment
          if (currentSpeaker !== -1 && currentSpeaker !== speakerId) {
            fullTranscript += `Speaker ${speakerMap[currentSpeaker]}: ${currentText.trim()}\n`;
            currentText = '';
          }
          
          currentSpeaker = speakerId;
          currentText += ` ${word.word}`;
        });
        
        // Add the last segment
        if (currentText.trim()) {
          fullTranscript += `Speaker ${speakerMap[currentSpeaker]}: ${currentText.trim()}\n`;
        }
      } else {
        // No speaker diarization, just add the transcript with a default speaker
        fullTranscript += `Speaker ${speakerNumber}: ${transcript.trim()}\n`;
      }
    }
  });
  
  // Format the response to match our expected format
  return {
    results: {
      transcripts: [
        {
          transcript: fullTranscript,
          confidence: googleResponse.results[0]?.alternatives[0]?.confidence || 0.8
        }
      ],
      channels: [
        {
          alternatives: [
            {
              transcript: fullTranscript,
              confidence: googleResponse.results[0]?.alternatives[0]?.confidence || 0.8
            }
          ]
        }
      ]
    }
  };
};

// Helper function to extract plain text transcript from Google response
export const extractTranscriptText = (response: any): string => {
  try {
    if (!response || !response.results || !response.results.channels || 
        response.results.channels.length === 0 || 
        !response.results.channels[0].alternatives || 
        response.results.channels[0].alternatives.length === 0) {
      return "No transcript available";
    }
    
    return response.results.channels[0].alternatives[0].transcript || "No transcript available";
  } catch (error) {
    console.error('Error extracting transcript text:', error);
    return "Error extracting transcript";
  }
};
