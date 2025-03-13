
import { DEFAULT_TRANSCRIPTION_OPTIONS } from './config';

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
  options = DEFAULT_TRANSCRIPTION_OPTIONS
) => {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // For large files, check if we're exceeding the API limit (10MB for sync requests)
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      throw new Error("File is too large for synchronous transcription. The API limit is 10MB.");
    }
    
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
    
    // Log what we're doing
    console.log(`Transcribing ${file.name} with Google Speech-to-Text`);
    console.log('Options:', transcriptionOptions);
    
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
    console.error('Google transcription error:', error);
    throw error;
  }
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
