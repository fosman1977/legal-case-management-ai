# LocalAI Setup Guide

This legal case management app uses **LocalAI** as its exclusively air-gapped AI backend, providing complete data isolation for sensitive legal work.

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

2. Open http://localhost:5174
3. Go to AI Settings to:
   - Check LocalAI connection status
   - Select available models
   - Configure AI processing options

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

Based on our research, the best models for legal document analysis are:

### Consumer Hardware (8-16GB RAM)
- **Llama 3.1-8B-Instruct** (4.7GB) - **RECOMMENDED** - Best balance of performance and resources
- **Qwen 2.5-14B-Instruct** (8.2GB) - Enhanced reasoning capabilities

### Professional Hardware (32GB+ RAM)
- **Llama 3.3-70B-Instruct** (~40GB) - Professional-grade legal analysis
- **Qwen 2.5-72B-Instruct** (~41GB) - Superior performance in structured analysis

### Enterprise Hardware (64GB+ RAM)
- **Command R+ 104B** (~62GB) - Built for enterprise use with excellent RAG capabilities

## Air-Gap Compliance

This system is designed for complete air-gap operation:

- **No External API Calls**: All processing happens locally
- **No Cloud Dependencies**: Everything runs on your machine
- **Complete Data Isolation**: Perfect for confidential legal work
- **Offline Capable**: Works without internet connection

### Verifying Air-Gap Status
```bash
# Check that only local connections are made
netstat -an | grep :8080

# Verify no external network calls (should show only local traffic)
sudo lsof -i -P | grep localai
```

## Upcoming Features

- **Setup Wizard**: One-click model downloads and configuration
- **Model Manager**: Easy switching between different models
- **PDF-Extract-Kit Integration**: Enhanced PDF processing capabilities
- **Performance Optimization**: Automatic hardware detection and model recommendations