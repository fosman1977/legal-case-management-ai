#!/bin/bash

# Legal Case Manager AI - LocalAI Setup Script
# This script sets up LocalAI for offline AI processing

set -e

echo "🚀 Setting up LocalAI for Legal Case Manager AI..."
echo "=================================================="

# Detect platform
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Normalize architecture names
case $ARCH in
    x86_64)
        ARCH="x64"
        ;;
    aarch64|arm64)
        ARCH="arm64"
        ;;
    *)
        echo "❌ Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

echo "🔍 Detected platform: $PLATFORM-$ARCH"

# Define LocalAI binary URLs
declare -A BINARY_URLS
BINARY_URLS[linux-x64]="https://github.com/mudler/LocalAI/releases/latest/download/local-ai-Linux-x86_64"
BINARY_URLS[darwin-x64]="https://github.com/mudler/LocalAI/releases/latest/download/local-ai-Darwin-x86_64" 
BINARY_URLS[darwin-arm64]="https://github.com/mudler/LocalAI/releases/latest/download/local-ai-Darwin-arm64"

# Get the appropriate binary URL
BINARY_URL="${BINARY_URLS[$PLATFORM-$ARCH]}"

if [ -z "$BINARY_URL" ]; then
    echo "❌ No LocalAI binary available for $PLATFORM-$ARCH"
    echo "💡 Please use Docker instead: docker run -p 8080:8080 -v \$PWD/models:/models quay.io/go-skynet/local-ai"
    exit 1
fi

# Create directories
USER_DATA_DIR="$HOME/.legal-case-manager"
LOCALAI_DIR="$USER_DATA_DIR/localai"
MODELS_DIR="$USER_DATA_DIR/models"

mkdir -p "$LOCALAI_DIR" "$MODELS_DIR"

echo "📁 Created directories:"
echo "   LocalAI: $LOCALAI_DIR"
echo "   Models: $MODELS_DIR"

# Download LocalAI binary
BINARY_NAME="localai"
BINARY_PATH="$LOCALAI_DIR/$BINARY_NAME"

if [ -f "$BINARY_PATH" ]; then
    echo "✅ LocalAI binary already exists"
else
    echo "⬇️  Downloading LocalAI binary..."
    curl -L "$BINARY_URL" -o "$BINARY_PATH"
    chmod +x "$BINARY_PATH"
    echo "✅ LocalAI binary downloaded"
fi

# Verify binary
if [ -x "$BINARY_PATH" ]; then
    echo "✅ LocalAI binary is executable"
else
    echo "❌ LocalAI binary is not executable"
    exit 1
fi

# Create a simple test config
cat > "$MODELS_DIR/test-config.yaml" << EOF
name: test-model
parameters:
  model: test
  temperature: 0.7
  top_p: 0.9
  max_tokens: 2048
EOF

echo "✅ Setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. The Legal Case Manager AI will automatically use LocalAI"
echo "2. Models will be downloaded on first use"
echo "3. All processing happens locally on your machine"
echo ""
echo "💡 To start LocalAI manually:"
echo "   $BINARY_PATH --address 0.0.0.0:8080 --models-path \"$MODELS_DIR\""
echo ""
echo "🔧 LocalAI installed to: $LOCALAI_DIR"
echo "📦 Models directory: $MODELS_DIR"