#!/bin/bash

echo "🔄 Restarting LocalAI with Full Backend Support"
echo "==============================================="
echo ""

# Stop current container
echo "📦 Stopping current LocalAI..."
docker stop localai
docker rm localai

# Start LocalAI with the image that includes all backends
echo "🚀 Starting LocalAI with all backends..."
docker run -d \
  --name localai \
  -p 8080:8080 \
  -v workspace_localai-models:/models \
  -e THREADS=4 \
  -e CONTEXT_SIZE=2048 \
  -e DEBUG=true \
  -e CORS=true \
  -e GALLERIES='[{"name":"model-gallery", "url":"github:go-skynet/model-gallery/index.yaml"}]' \
  --restart unless-stopped \
  quay.io/go-skynet/local-ai:latest-aio-cpu

echo "⏳ Waiting for LocalAI to start (30 seconds)..."
sleep 30

echo ""
echo "📋 Checking available models..."
curl -s http://localhost:8080/v1/models | python3 -m json.tool

echo ""
echo "🧪 Testing with TinyLlama..."
curl -s -X POST http://localhost:8080/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tinyllama.gguf",
    "prompt": "Hello, I am",
    "max_tokens": 20,
    "temperature": 0.7
  }' | python3 -m json.tool

echo ""
echo "✅ LocalAI restarted with full backend support!"
echo ""
echo "📝 If the test still fails, we'll download a pre-configured model from the gallery."
echo ""