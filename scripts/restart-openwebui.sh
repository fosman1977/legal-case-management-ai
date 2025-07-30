#!/bin/bash

# Quick restart script for OpenWebUI with updated configuration
echo "🔄 Restarting OpenWebUI with updated configuration..."

# Use modern docker compose if available
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

echo "🛑 Stopping OpenWebUI..."
$DOCKER_COMPOSE_CMD -f docker-compose.openwebui.yml stop open-webui

echo "🗑️  Removing OpenWebUI container..."
$DOCKER_COMPOSE_CMD -f docker-compose.openwebui.yml rm -f open-webui

echo "🚀 Starting OpenWebUI with new configuration..."
$DOCKER_COMPOSE_CMD -f docker-compose.openwebui.yml up -d open-webui

echo "⏳ Waiting for OpenWebUI to start..."
sleep 10

echo "✅ OpenWebUI restarted!"
echo "🌐 Try accessing: http://localhost:3001"
echo "📋 Check logs: $DOCKER_COMPOSE_CMD -f docker-compose.openwebui.yml logs -f open-webui"