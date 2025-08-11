#!/bin/bash

# LocalAI Model Installation Script
# This script downloads and configures models for LocalAI

echo "🚀 LocalAI Model Installation Script"
echo "===================================="
echo ""

# Create model directory if it doesn't exist
mkdir -p ./models
mkdir -p ./localai-config

# Function to download model with progress
download_model() {
    local url=$1
    local filename=$2
    local description=$3
    
    echo "📥 Downloading $description..."
    if command -v wget &> /dev/null; then
        wget --show-progress -q -O "./models/$filename" "$url"
    elif command -v curl &> /dev/null; then
        curl -L --progress-bar -o "./models/$filename" "$url"
    else
        echo "❌ Error: Neither wget nor curl is installed"
        return 1
    fi
    echo "✅ Downloaded $filename"
    echo ""
}

# Function to create model config
create_config() {
    local name=$1
    local filename=$2
    local backend=$3
    local context=$4
    
    cat > "./localai-config/${name}.yaml" << EOF
name: ${name}
backend: ${backend}
parameters:
  model: /models/${filename}
context_size: ${context}
parameters:
  temperature: 0.7
  top_k: 40
  top_p: 0.95
  threads: 4
  batch: 512
  mmap: true
  mlock: false
EOF
    echo "✅ Created config for $name"
}

echo "Please select which models to install:"
echo ""
echo "1) Mistral 7B Instruct (Recommended - 4GB, excellent for legal analysis)"
echo "2) Llama 3.2 3B (Lightweight - 2GB, good for quick queries)"
echo "3) Phi-3 Mini (Ultra-light - 2.4GB, fast responses)"
echo "4) Qwen 2.5 7B (Advanced - 4.4GB, great reasoning)"
echo "5) All recommended models"
echo "6) Skip model installation"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "Installing Mistral 7B Instruct..."
        download_model \
            "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf" \
            "mistral-7b-instruct.gguf" \
            "Mistral 7B Instruct (Q4_K_M quantization)"
        
        create_config "gpt-3.5-turbo" "mistral-7b-instruct.gguf" "llama-cpp" "4096"
        create_config "mistral" "mistral-7b-instruct.gguf" "llama-cpp" "4096"
        ;;
    
    2)
        echo ""
        echo "Installing Llama 3.2 3B..."
        download_model \
            "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf" \
            "llama-3.2-3b-instruct.gguf" \
            "Llama 3.2 3B Instruct"
        
        create_config "llama-3.2" "llama-3.2-3b-instruct.gguf" "llama-cpp" "8192"
        ;;
    
    3)
        echo ""
        echo "Installing Phi-3 Mini..."
        download_model \
            "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf" \
            "phi-3-mini.gguf" \
            "Phi-3 Mini 4K"
        
        create_config "phi-3" "phi-3-mini.gguf" "llama-cpp" "4096"
        ;;
    
    4)
        echo ""
        echo "Installing Qwen 2.5 7B..."
        download_model \
            "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/main/qwen2.5-7b-instruct-q4_k_m.gguf" \
            "qwen2.5-7b-instruct.gguf" \
            "Qwen 2.5 7B Instruct"
        
        create_config "qwen" "qwen2.5-7b-instruct.gguf" "llama-cpp" "32768"
        ;;
    
    5)
        echo ""
        echo "Installing all recommended models..."
        
        # Install Mistral as default
        download_model \
            "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf" \
            "mistral-7b-instruct.gguf" \
            "Mistral 7B Instruct"
        create_config "gpt-3.5-turbo" "mistral-7b-instruct.gguf" "llama-cpp" "4096"
        create_config "mistral" "mistral-7b-instruct.gguf" "llama-cpp" "4096"
        
        # Install Llama 3.2 for lightweight tasks
        download_model \
            "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf" \
            "llama-3.2-3b-instruct.gguf" \
            "Llama 3.2 3B Instruct"
        create_config "llama-3.2" "llama-3.2-3b-instruct.gguf" "llama-cpp" "8192"
        ;;
    
    6)
        echo "Skipping model installation."
        ;;
    
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🔄 Copying models to LocalAI container..."

# Copy models to the LocalAI container volume
docker cp ./models/. localai:/models/
docker cp ./localai-config/. localai:/models/

echo ""
echo "🔄 Restarting LocalAI to load new models..."
docker restart localai

echo ""
echo "⏳ Waiting for LocalAI to restart..."
sleep 10

echo ""
echo "📋 Checking available models..."
curl -s http://localhost:8080/v1/models | python3 -m json.tool 2>/dev/null || echo "Models are being loaded..."

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. LocalAI is running at: http://localhost:8080"
echo "2. Open your app and go to AI Settings to test the connection"
echo "3. The default model 'gpt-3.5-turbo' is configured for compatibility"
echo ""
echo "💡 Tips:"
echo "- First model load may take 30-60 seconds"
echo "- Use 'docker logs -f localai' to monitor LocalAI"
echo "- Models are stored in Docker volume 'workspace_localai-models'"
echo ""