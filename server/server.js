
// Server.js - Express proxy server for Deepgram API
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 250 * 1024 * 1024 } // 250MB file size limit
});

const PORT = process.env.PORT || 4000;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Endpoint to validate API key
app.get('/validate-key', async (req, res) => {
  const apiKey = req.query.apiKey || DEEPGRAM_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({ 
      isValid: false, 
      error: 'API key is required' 
    });
  }
  
  try {
    const response = await axios.get('https://api.deepgram.com/v1/projects', {
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    res.json({ 
      isValid: true, 
      message: 'API key is valid',
      data: response.data 
    });
  } catch (error) {
    console.error('API key validation error:', error.message);
    res.status(error.response?.status || 500).json({
      isValid: false,
      error: error.response?.data?.error || error.message,
    });
  }
});

// Endpoint to check API key status
app.get('/check-status', async (req, res) => {
  const apiKey = req.query.apiKey || DEEPGRAM_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({ 
      active: false, 
      error: 'API key is required' 
    });
  }
  
  try {
    const response = await axios.get('https://api.deepgram.com/v1/listen/usage', {
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    res.json({ 
      active: true, 
      message: 'API key is active'
    });
  } catch (error) {
    console.error('API status check error:', error.message);
    res.status(200).json({
      active: false,
      message: error.response?.data?.error || 'API key is invalid or inactive',
    });
  }
});

// Endpoint to handle file uploads and transcription
app.post('/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const apiKey = req.body.apiKey || DEEPGRAM_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    // Prepare options for Deepgram API
    const options = {
      model: req.body.model || 'general',
      version: req.body.version || 'latest',
      language: req.body.language || 'en',
      punctuate: req.body.punctuate !== 'false',
      diarize: req.body.diarize === 'true',
      smart_format: req.body.smartFormat !== 'false',
    };
    
    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    
    // Create form data for the API request
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    
    // Send request to Deepgram
    const response = await axios.post(
      `https://api.deepgram.com/v1/listen?${queryParams}`,
      formData,
      {
        headers: {
          Authorization: `Token ${apiKey}`,
          ...formData.getHeaders(),
        },
      }
    );
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json(response.data);
  } catch (error) {
    console.error('Transcription error:', error.message);
    
    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || error.message
    });
  }
});

// Add POST version of validate-key for compatibility
app.post('/validate-key', express.json(), async (req, res) => {
  const apiKey = req.body.apiKey || DEEPGRAM_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({ 
      valid: false, 
      error: 'API key is required' 
    });
  }
  
  try {
    const response = await axios.get('https://api.deepgram.com/v1/projects', {
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    res.json({ 
      valid: true,
      message: 'API key is valid' 
    });
  } catch (error) {
    console.error('API key validation error:', error.message);
    res.status(200).json({ // Using 200 for compatibility
      valid: false,
      message: error.response?.data?.error || 'Invalid API key'
    });
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Deepgram proxy server running at http://localhost:${PORT}`);
  console.log(`API Key provided: ${DEEPGRAM_API_KEY ? 'Yes' : 'No'}`);
});
