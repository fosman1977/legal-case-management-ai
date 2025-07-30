#!/bin/bash

# Legal Case Management - OpenWebUI Complete Reset Script
echo "🔄 Resetting OpenWebUI for Legal Case Management System"
echo "======================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Use modern docker compose if available, fallback to legacy docker-compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

echo "🛑 Stopping all OpenWebUI services..."
$DOCKER_COMPOSE_CMD -f docker-compose.openwebui.yml down

echo "🗑️  Removing all volumes and data..."
docker volume rm workspace_open-webui-data 2>/dev/null || true
docker volume rm workspace_postgres-data 2>/dev/null || true
docker volume rm workspace_ollama-data 2>/dev/null || true

echo "🧹 Cleaning up containers and networks..."
docker container rm legal-case-open-webui 2>/dev/null || true
docker container rm legal-case-postgres 2>/dev/null || true
docker container rm legal-case-ollama 2>/dev/null || true
docker network rm workspace_legal-ai-network 2>/dev/null || true

echo "📁 Recreating directories..."
rm -rf openwebui-uploads postgres-data ollama-data
mkdir -p openwebui-uploads
chmod 755 openwebui-uploads

echo "🚀 Starting fresh OpenWebUI services..."
$DOCKER_COMPOSE_CMD -f docker-compose.openwebui.yml up -d

echo "⏳ Waiting for services to initialize..."
echo "This may take a few minutes for first startup..."

# Wait for PostgreSQL to be healthy
echo "🔍 Waiting for PostgreSQL to be ready..."
timeout=120
counter=0
while [ $counter -lt $timeout ]; do
    if docker exec legal-case-postgres pg_isready -U openwebui -d openwebui >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done

if [ $counter -ge $timeout ]; then
    echo "❌ PostgreSQL failed to start within $timeout seconds"
    exit 1
fi

# Wait for OpenWebUI to be ready
echo "🔍 Waiting for OpenWebUI to be ready..."
counter=0
while [ $counter -lt $timeout ]; do
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        echo "✅ OpenWebUI is ready"
        break
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done

if [ $counter -ge $timeout ]; then
    echo "⚠️  OpenWebUI may still be starting up. Check manually at http://localhost:3001"
fi

# Check Ollama
echo "🔍 Checking Ollama service..."
if curl -s http://localhost:11435/api/version >/dev/null 2>&1; then
    echo "✅ Ollama is running"
else
    echo "⚠️  Ollama may still be starting up..."
fi

# Pull essential models
echo "📥 Pulling essential AI models..."
echo "This will take several minutes depending on your internet connection..."

# Pull embedding model for RAG (essential)
docker exec legal-case-ollama ollama pull nomic-embed-text:latest

# Pull lightweight models
docker exec legal-case-ollama ollama pull llama3.2:1b
docker exec legal-case-ollama ollama pull llama3.2:3b

echo ""
echo "🎉 OpenWebUI has been completely reset and is ready!"
echo ""
echo "📋 Next Steps:"
echo "1. Open OpenWebUI at: http://localhost:3001"
echo "2. Create your admin account (first user becomes admin)"
echo "3. You should now be able to sign up without permission errors"
echo "4. Test document upload and RAG functionality"
echo ""
echo "🔧 Services:"
echo "- OpenWebUI: http://localhost:3001"
echo "- Ollama API: http://localhost:11435"
echo "- Your app: http://localhost:5174 (when running npm run dev)"
echo ""
echo "📊 Check status: $DOCKER_COMPOSE_CMD -f docker-compose.openwebui.yml ps"
echo "📋 View logs: $DOCKER_COMPOSE_CMD -f docker-compose.openwebui.yml logs -f"
echo ""
echo "🔐 Security Note: Remember to change secret keys for production use"