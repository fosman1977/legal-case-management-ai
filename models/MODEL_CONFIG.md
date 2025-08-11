# LocalAI Model Configuration

## Model Management

The large AI models (4.1GB total) have been moved to a local cache system to save repository space.

### Quick Start

To download and use AI models locally:

```bash
# Run the model manager
./scripts/download-models.sh
```

This interactive script allows you to:
- Download models to a local cache (~/.cache/localai-models)
- Link them to the project when needed
- Remove them from the project while keeping the cache
- Clear the cache completely

### Available Models

1. **Mistral 7B Instruct** (3.4GB)
   - High-quality general-purpose model
   - Best for complex tasks and reasoning
   - File: `mistral-7b-instruct.gguf`

2. **TinyLlama 1.1B** (638MB)
   - Lightweight, fast model
   - Good for simple tasks and quick responses
   - File: `tinyllama.gguf`

### Storage Locations

- **Cache**: `~/.cache/localai-models/` (persists between projects)
- **Project**: `./models/` (symlinks to cache)

### Benefits

1. **Space Efficient**: Models stored once, used across projects
2. **Git-Friendly**: Large files not tracked in repository
3. **Fast Setup**: Download once, link instantly
4. **Flexible**: Add/remove models as needed

### LocalAI Configuration

The models are configured in the `localai-config/` directory:
- `gpt-3.5-turbo-fixed.yaml` - Mistral 7B configuration
- `tinyllama.yaml` - TinyLlama configuration

### Troubleshooting

If models are not working:
1. Run `./scripts/download-models.sh` and select option 6 to check disk usage
2. Ensure models are linked (option 1 or 2)
3. Check LocalAI logs for loading errors
4. Verify model paths in config files

### For Docker/Container Deployments

Mount the cache directory:
```bash
docker run -v ~/.cache/localai-models:/models ...
```