const http = require('http');
const httpProxy = require('http-proxy-middleware');
const express = require('express');

const app = express();

// Enable CORS for all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Proxy all requests to Ollama
const proxyOptions = {
  target: 'http://127.0.0.1:11434',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/', // Remove any prefix if needed
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy Error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('📤 Proxying request:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('📥 Proxy response:', proxyRes.statusCode, req.url);
  }
};

const proxy = httpProxy.createProxyMiddleware(proxyOptions);
app.use('/', proxy);

const PORT = 11435;
app.listen(PORT, () => {
  console.log(`🔧 Ollama CORS proxy running on http://localhost:${PORT}`);
  console.log(`🎯 Proxying requests to http://127.0.0.1:11434`);
});