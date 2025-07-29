const http = require('http');
const { URL } = require('url');

const server = http.createServer((req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if ((req.url === '/api/tags' || req.url === '/tags') && req.method === 'GET') {
    // Proxy to Ollama tags
    const ollamaReq = http.request('http://127.0.0.1:11434/api/tags', {
      method: 'GET'
    }, (ollamaRes) => {
      res.writeHead(ollamaRes.statusCode, ollamaRes.headers);
      ollamaRes.pipe(res);
    });
    
    ollamaReq.on('error', (err) => {
      console.error('Ollama tags error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    });
    
    ollamaReq.end();
    
  } else if ((req.url === '/api/generate' || req.url === '/generate') && req.method === 'POST') {
    // Proxy to Ollama generate
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      console.log('🤖 Proxying generate request to Ollama');
      
      const ollamaReq = http.request('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, (ollamaRes) => {
        res.writeHead(ollamaRes.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        ollamaRes.pipe(res);
      });
      
      ollamaReq.on('error', (err) => {
        console.error('Ollama generate error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
      
      ollamaReq.write(body);
      ollamaReq.end();
    });
    
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3001, () => {
  console.log('🚀 Simple Ollama proxy running on http://localhost:3001');
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down proxy server...');
  server.close();
  process.exit();
});