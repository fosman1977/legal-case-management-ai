#!/bin/bash

# Legal Case Management - OpenWebUI Setup Script
echo "🏛️ Setting up OpenWebUI for Legal Case Management System"
echo "=========================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check for docker compose (modern) or docker-compose (legacy)
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose first."
    exit 1
fi

# Use modern docker compose if available, fallback to legacy docker-compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p openwebui-uploads
mkdir -p ollama-data
mkdir -p postgres-data

# Set proper permissions
chmod 755 openwebui-uploads

# Start OpenWebUI services
echo "🚀 Starting OpenWebUI services..."
$DOCKER_COMPOSE_CMD -f docker-compose.openwebui.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if Ollama is running
echo "🔍 Checking Ollama service..."
if curl -s http://localhost:11434/api/version > /dev/null; then
    echo "✅ Ollama is running"
else
    echo "⚠️  Ollama may still be starting up..."
fi

# Check if OpenWebUI is running
echo "🔍 Checking OpenWebUI service..."
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ OpenWebUI is running"
else
    echo "⚠️  OpenWebUI may still be starting up..."
fi

# Pull recommended models
echo "📥 Pulling recommended AI models..."
echo "This may take a while depending on your internet connection..."

# Pull embedding model for RAG
docker exec legal-case-ollama ollama pull nomic-embed-text:latest

# Pull lightweight models for development
docker exec legal-case-ollama ollama pull llama3.2:1b
docker exec legal-case-ollama ollama pull llama3.2:3b

# Optional: Pull larger models (uncomment if you have sufficient resources)
# docker exec legal-case-ollama ollama pull llama3.2:8b
# docker exec legal-case-ollama ollama pull llama3.1:8b

echo ""
echo "🎉 OpenWebUI setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Open OpenWebUI at: http://localhost:3001"
echo "2. Create your admin account (first user becomes admin)"
echo "3. Configure AI models in the OpenWebUI interface"
echo "4. Test document upload and RAG functionality"
echo ""
echo "🔧 Services:"
echo "- OpenWebUI: http://localhost:3001"
echo "- Ollama API: http://localhost:11434"
echo "- Your app: http://localhost:5174 (when running npm run dev)"
echo ""
echo "📚 To stop services: $DOCKER_COMPOSE_CMD -f docker-compose.openwebui.yml down"
echo "📚 To view logs: $DOCKER_COMPOSE_CMD -f docker-compose.openwebui.yml logs -f"
echo ""
echo "🔐 Security Note: Change the secret keys in docker-compose.openwebui.yml for production use"