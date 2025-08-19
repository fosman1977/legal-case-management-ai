#!/bin/bash

# Navigate to the project workspace where docker-compose.minimal.yml is located
cd /project/workspace

echo "🚀 Starting LocalAI service from /project/workspace..."

# Create necessary directories
mkdir -p models
mkdir -p localai-config
mkdir -p data

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    echo "Please run: open -a Docker"
    exit 1
fi

# Start LocalAI with docker-compose
echo "📦 Starting LocalAI containers..."
docker-compose -f docker-compose.minimal.yml up -d

# Wait for service to be ready
echo "⏳ Waiting for LocalAI to be ready..."
sleep 10

# Check if service is running
if curl -s http://localhost:8080/readiness > /dev/null; then
    echo "✅ LocalAI is running and ready!"
    echo "📡 API endpoint: http://localhost:8080"
    echo ""
    echo "Commands you can use:"
    echo "  Check status: cd /project/workspace && docker-compose -f docker-compose.minimal.yml ps"
    echo "  View logs:    cd /project/workspace && docker-compose -f docker-compose.minimal.yml logs -f"
    echo "  Stop service: cd /project/workspace && docker-compose -f docker-compose.minimal.yml down"
else
    echo "⚠️ LocalAI may still be starting up. Check logs with:"
    echo "cd /project/workspace && docker-compose -f docker-compose.minimal.yml logs -f"
fi