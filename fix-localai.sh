#!/bin/bash

echo "🔧 Fixing LocalAI Configuration"
echo "================================"
echo ""

# Create proper configuration
cat > ./gpt-3.5-turbo-fixed.yaml << 'EOF'
name: gpt-3.5-turbo
backend: llama-cpp
parameters:
  model: /models/tinyllama.gguf
  temperature: 0.7
  top_k: 40
  top_p: 0.95
  threads: 4
  batch: 512
  mmap: true
  mlock: false
context_size: 2048
template:
  chat: |
    <|system|>
    You are a helpful legal assistant. {{.Input}}
    <|assistant|>
  completion: |
    {{.Input}}
EOF

echo "✅ Fixed configuration created"

# Copy to container
echo "📦 Updating LocalAI configuration..."
docker exec localai rm -f /models/gpt-3.5-turbo.yaml
docker cp ./gpt-3.5-turbo-fixed.yaml localai:/models/gpt-3.5-turbo.yaml

# Restart LocalAI
echo "🔄 Restarting LocalAI..."
docker restart localai

echo "⏳ Waiting for LocalAI to start (20 seconds)..."
sleep 20

# Test the API
echo ""
echo "🧪 Testing LocalAI API..."
echo ""

# First check if models are available
echo "📋 Available models:"
curl -s http://localhost:8080/v1/models | python3 -m json.tool || echo "Waiting for models to load..."

echo ""
echo "💬 Testing chat completion..."
response=$(curl -s -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello, can you help with legal matters?"}],
    "temperature": 0.7,
    "max_tokens": 50
  }')

if echo "$response" | grep -q "error"; then
    echo "❌ Error in response:"
    echo "$response" | python3 -m json.tool
    echo ""
    echo "📝 Checking logs for issues..."
    docker logs localai --tail 10
else
    echo "✅ Success! LocalAI is responding:"
    echo "$response" | python3 -m json.tool
fi

echo ""
echo "🎉 LocalAI setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. LocalAI is running at http://localhost:8080"
echo "2. Model 'gpt-3.5-turbo' is configured"
echo "3. Open your app and test the AI features"
echo ""
echo "💡 To install a better model (4GB Mistral), run:"
echo "   ./install-localai-models.sh"
echo "   and select option 1"
echo ""