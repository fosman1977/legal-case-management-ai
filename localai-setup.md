# LocalAI Setup Guide

This legal case management app now uses **LocalAI** as its primary AI backend, replacing Ollama.

## Quick Start

### 1. Start LocalAI Service

```bash
# Start LocalAI container
docker-compose -f docker-compose.minimal.yml up -d

# Check if LocalAI is running
curl http://localhost:8080/v1/models
```

### 2. Install Models (Optional)

LocalAI can use models from various sources. Create a `localai-config` directory with model configurations:

```bash
mkdir -p localai-config

# Example: Create a simple GPT-3.5-turbo compatible model config
cat > localai-config/gpt-3.5-turbo.yaml << EOF
name: gpt-3.5-turbo
backend: llama
model: ggml-gpt4all-j-v1.3-groovy.bin
context_size: 4096
top_k: 10
top_p: 0.84
temperature: 0.7
EOF
```

### 3. Access the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173
3. Go to Security Settings to:
   - Check LocalAI connection status
   - Select available models
   - Configure anonymization settings

## Features

- **OpenAI-Compatible API**: LocalAI provides `/v1/chat/completions` endpoints
- **Local Processing**: All AI operations run locally on your machine
- **Model Flexibility**: Supports various model formats (GGML, GGUF, etc.)
- **No External Dependencies**: No internet connection required for AI processing

## Troubleshooting

### LocalAI Not Starting

1. Check Docker is running:
   ```bash
   docker ps
   ```

2. Check LocalAI logs:
   ```bash
   docker-compose -f docker-compose.minimal.yml logs localai
   ```

3. Restart the service:
   ```bash
   docker-compose -f docker-compose.minimal.yml restart localai
   ```

### No Models Available

1. Check if models directory exists:
   ```bash
   docker exec -it localai ls /models
   ```

2. Download a model manually:
   ```bash
   # Example: Download a small model
   wget -O ./localai-config/ggml-model.bin https://huggingface.co/microsoft/DialoGPT-medium/resolve/main/pytorch_model.bin
   ```

3. Restart LocalAI to detect new models:
   ```bash
   docker-compose -f docker-compose.minimal.yml restart localai
   ```

## Model Recommendations for Legal Work

For optimal legal document analysis, consider:

- **Small Models** (faster, less accurate): `gpt-3.5-turbo`, `llama-7b`
- **Large Models** (slower, more accurate): `gpt-4`, `llama-13b`
- **Legal-Specific**: Models fine-tuned for legal tasks if available

## Migration from Ollama

If you were previously using Ollama:

1. Stop Ollama containers:
   ```bash
   docker stop minimal-ollama minimal-open-webui
   ```

2. Start LocalAI:
   ```bash
   docker-compose -f docker-compose.minimal.yml up -d
   ```

3. Update any custom configurations to use port 8080 instead of 11436

The application will automatically detect and use LocalAI once it's running.