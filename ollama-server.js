const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for your app
app.use(cors({
  origin: ['https://hpjp98-5173.csb.app', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json());

// Proxy to Ollama
app.post('/api/generate', async (req, res) => {
  try {
    console.log('🤖 Proxying request to Ollama:', req.body.model);
    
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Ollama proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tags', async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Ollama tags error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Ollama proxy server running on http://localhost:${PORT}`);
});