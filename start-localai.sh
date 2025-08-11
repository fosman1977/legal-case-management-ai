#!/bin/bash

# One-Click LocalAI Setup Script
echo "🚀 Starting LocalAI with One-Click Setup..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Installing..."
    sudo apt-get update
    sudo apt-get install -y docker-compose
fi

# Create models directory if it doesn't exist
mkdir -p models

# Check if LocalAI is already running
if docker ps | grep -q localai; then
    echo "✅ LocalAI is already running!"
    echo "   Endpoint: http://localhost:8080"
else
    echo "📦 Starting LocalAI container..."
    
    # Start LocalAI using docker-compose
    docker-compose -f docker-compose.minimal.yml up -d
    
    if [ $? -eq 0 ]; then
        echo "⏳ Waiting for LocalAI to be ready..."
        
        # Wait for LocalAI to be ready (max 30 seconds)
        for i in {1..30}; do
            if curl -s http://localhost:8080/readyz > /dev/null 2>&1; then
                echo "✅ LocalAI is ready!"
                break
            fi
            sleep 1
            echo -n "."
        done
        echo ""
        
        # Download default model if not exists
        if ! curl -s http://localhost:8080/v1/models | grep -q "gpt-3.5-turbo"; then
            echo "📥 Downloading default model (gpt-3.5-turbo)..."
            curl -X POST http://localhost:8080/models/apply \
                -H "Content-Type: application/json" \
                -d '{
                    "id": "gpt-3.5-turbo",
                    "name": "gpt-3.5-turbo",
                    "url": "https://gpt4all.io/models/gguf/gpt4all-13b-snoozy-q4_0.gguf",
                    "overrides": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 2048
                    }
                }'
        fi
        
        echo ""
        echo "🎉 LocalAI is running successfully!"
        echo "   Endpoint: http://localhost:8080"
        echo "   API Docs: http://localhost:8080/swagger/index.html"
        echo ""
        echo "📱 Open your app and click the '🤖 LocalAI' button to connect!"
    else
        echo "❌ Failed to start LocalAI. Please check Docker logs."
        exit 1
    fi
fi

echo ""
echo "💡 To stop LocalAI, run: docker-compose -f docker-compose.minimal.yml down"
echo "💡 To view logs, run: docker-compose -f docker-compose.minimal.yml logs -f"