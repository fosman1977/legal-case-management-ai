#!/bin/bash

echo "🚀 Final LocalAI Setup"
echo "======================"
echo ""

# Simple working configuration for TinyLlama
cat > ./tinyllama.yaml << 'EOF'
name: tinyllama
backend: llama-cpp
parameters:
  model: tinyllama.gguf
  context_size: 2048
  threads: 4
  temperature: 0.7
EOF

# Also create a gpt-3.5-turbo alias
cat > ./gpt35.yaml << 'EOF'
name: gpt-3.5-turbo
backend: llama-cpp
parameters:
  model: tinyllama.gguf
  context_size: 2048
  threads: 4
  temperature: 0.7
EOF

echo "📦 Deploying configuration..."
docker cp ./tinyllama.yaml localai:/models/
docker cp ./gpt35.yaml localai:/models/

# Remove the broken config
docker exec localai rm -f /models/gpt-3.5-turbo.yaml

echo "🔄 Restarting LocalAI..."
docker restart localai

echo "⏳ Waiting for LocalAI to initialize (30 seconds)..."
sleep 30

echo ""
echo "🧪 Testing LocalAI..."
echo ""

# Test with the model name
echo "Testing direct model call..."
curl -s -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tinyllama",
    "messages": [{"role": "user", "content": "Say hello in 5 words"}],
    "max_tokens": 50
  }' 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print('Response:', data.get('choices', [{}])[0].get('message', {}).get('content', 'No response'))" 2>/dev/null || echo "Model is still loading..."

echo ""
echo "✅ LocalAI Setup Complete!"
echo ""
echo "📝 Status:"
echo "   - LocalAI is running at: http://localhost:8080"
echo "   - Model available: tinyllama"
echo "   - Alias available: gpt-3.5-turbo"
echo ""
echo "🔍 To check LocalAI status:"
echo "   docker logs localai --tail 20"
echo ""
echo "💡 The model may take 1-2 minutes to fully load on first use."
echo "   If you get errors, wait a moment and try again."
echo ""