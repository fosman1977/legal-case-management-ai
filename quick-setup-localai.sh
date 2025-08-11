#!/bin/bash

# Quick LocalAI Setup with Lightweight Model
echo "🚀 Quick LocalAI Setup"
echo "====================="
echo ""

# Create directories
mkdir -p ./models
mkdir -p ./localai-config

echo "📥 Downloading TinyLlama (small, fast model for testing)..."
# TinyLlama is only 638MB - much faster to download
curl -L --progress-bar \
    -o "./models/tinyllama.gguf" \
    "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"

echo ""
echo "✅ Model downloaded!"

# Create configuration
cat > "./localai-config/gpt-3.5-turbo.yaml" << 'EOF'
name: gpt-3.5-turbo
backend: llama-cpp
parameters:
  model: /models/tinyllama.gguf
context_size: 2048
parameters:
  temperature: 0.7
  top_k: 40
  top_p: 0.95
  threads: 4
  batch: 512
  mmap: true
  mlock: false
template:
  chat: |
    <|system|>
    You are a helpful legal assistant. {{.Input}}
    <|assistant|>
  completion: |
    {{.Input}}
EOF

echo "✅ Configuration created!"
echo ""

# Copy to container
echo "📦 Installing model in LocalAI container..."
docker cp ./models/tinyllama.gguf localai:/models/
docker cp ./localai-config/gpt-3.5-turbo.yaml localai:/models/

# Restart LocalAI
echo "🔄 Restarting LocalAI..."
docker restart localai

echo ""
echo "⏳ Waiting for LocalAI to load model (30 seconds)..."
sleep 30

# Test the model
echo ""
echo "🧪 Testing model..."
curl -s -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Say hello"}],
    "temperature": 0.7,
    "max_tokens": 50
  }' | python3 -m json.tool

echo ""
echo "✅ Quick setup complete!"
echo ""
echo "📝 LocalAI is now running with TinyLlama model"
echo "   - API endpoint: http://localhost:8080"
echo "   - Model name: gpt-3.5-turbo"
echo ""
echo "💡 To install better models later, run:"
echo "   ./install-localai-models.sh"
echo ""