# OpenWebUI Integration Guide

## Overview

This legal case management system has been enhanced with **OpenWebUI integration** to provide advanced AI capabilities including:

- 🔍 **RAG (Retrieval-Augmented Generation)** - AI queries with document context
- 📚 **Citation Support** - Precise source references for all AI responses  
- 🎯 **Higher Accuracy** - Better legal document analysis
- 🔐 **Enhanced Security** - Self-hosted AI with offline operation
- 👥 **Multi-User Support** - Team collaboration with role-based access

## Quick Start

### 1. Start OpenWebUI Services

```bash
# Make the setup script executable (if not already done)
chmod +x scripts/setup-openwebui.sh

# Run the setup script
./scripts/setup-openwebui.sh
```

This will:
- Start OpenWebUI at http://localhost:3001
- Start Ollama service at http://localhost:11434  
- Pull recommended AI models
- Set up PostgreSQL database

### 2. Initial Configuration

1. **Open OpenWebUI**: http://localhost:3001
2. **Create Admin Account**: First user becomes super admin
3. **Configure Models**: Verify AI models are loaded
4. **Test Upload**: Try uploading a test document

### 3. Start Your Application

```bash
# Start the case management system
npm run dev
```

Your app will be available at http://localhost:5174

## Features

### Enhanced AI Assistant (🧠 AI RAG Assistant)

The new AI assistant provides:

- **Document Analysis**: Upload case documents and ask questions
- **Citations**: Every response includes source references
- **Confidence Scores**: Know how reliable the AI's answers are
- **Processing Metrics**: See response times and sources used
- **Model Selection**: Choose from different AI models
- **Search Modes**: Semantic, hybrid, or keyword search

### Usage Examples

```
"What are the key deadlines mentioned in this case?"
"Who are all the parties involved and their roles?"
"Find all references to breach of contract"
"What evidence supports the plaintiff's claims?"
"Summarize the procedural history"
```

## Architecture

### Services

1. **OpenWebUI** (Port 3001)
   - Web interface for AI interactions
   - Document upload and RAG processing
   - User management and authentication

2. **Ollama** (Port 11434)  
   - Local LLM hosting
   - Embedding models for RAG
   - Model management

3. **PostgreSQL** (Internal)
   - OpenWebUI database
   - User data and configurations

4. **Your App** (Port 5174)
   - Legal case management interface
   - Integrates with OpenWebUI API

### Data Flow

```
Legal Documents → OpenWebUI → RAG Processing → AI Model → Cited Response
```

## Configuration

### Environment Variables

Edit `docker-compose.openwebui.yml` to customize:

```yaml
environment:
  - WEBUI_SECRET_KEY=your-secret-key-here
  - WEBUI_JWT_SECRET_KEY=your-jwt-secret  
  - DEFAULT_MODELS=llama3.2:1b,llama3.2:3b
  - ENABLE_SIGNUP=false  # Disable public signups
  - DEFAULT_USER_ROLE=user
```

### Security Settings

**Important for Production:**

1. **Change Secret Keys**: Update all default secrets
2. **Disable Signups**: Set `ENABLE_SIGNUP=false`  
3. **Configure HTTPS**: Use reverse proxy for SSL
4. **Backup Data**: Regular backups of volumes
5. **Network Security**: Restrict port access

## API Integration

### OpenWebUI Client

The system uses `src/utils/openWebUIClient.ts` which provides:

```typescript
// Initialize connection
await openWebUIClient.initialize(username, password);

// Upload documents for RAG
const upload = await openWebUIClient.uploadDocument(file);

// Query with RAG and citations
const response = await openWebUIClient.queryDocuments({
  query: "What are the key legal issues?",
  documentIds: [upload.id],
  includeCitations: true,
  searchMode: 'hybrid'
});
```

### RAG Features

- **Automatic Document Processing**: PDFs, Word docs, text files
- **Hybrid Search**: Combines semantic and keyword search
- **Citation Extraction**: Links responses to source documents
- **Confidence Scoring**: Reliability metrics for responses

## Troubleshooting

### Common Issues

**OpenWebUI not accessible:**
```bash
# Check services
docker-compose -f docker-compose.openwebui.yml ps

# View logs
docker-compose -f docker-compose.openwebui.yml logs -f
```

**Models not loading:**
```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Pull models manually
docker exec legal-case-ollama ollama pull llama3.2:3b
```

**Connection errors in app:**
- Verify OpenWebUI is running at http://localhost:3001
- Check browser console for CORS errors
- Ensure no firewall blocking connections

### Performance Optimization

**For Better Performance:**

1. **GPU Support**: Uncomment GPU settings in docker-compose if available
2. **Larger Models**: Use llama3.2:8b or llama3.1:8b for better quality  
3. **Memory**: Increase Docker memory allocation
4. **SSD Storage**: Use SSD for better I/O performance

## Development

### Adding New Features

1. **Extend API Client**: Add new methods to `openWebUIClient.ts`
2. **Update Components**: Enhance RAG dialogue for new features
3. **Test Integration**: Verify with actual legal documents

### Model Management

```bash
# List available models
docker exec legal-case-ollama ollama list

# Pull new models
docker exec legal-case-ollama ollama pull model-name

# Remove models
docker exec legal-case-ollama ollama rm model-name
```

## Migration from Basic Ollama

The system maintains backward compatibility:

- **Legacy AI Tab**: Basic Ollama integration still available
- **New RAG Tab**: Enhanced OpenWebUI features  
- **Gradual Migration**: Move to RAG features when ready
- **Same Data**: All case data remains unchanged

## Support

### Documentation Links

- [OpenWebUI Documentation](https://docs.openwebui.com/)
- [Ollama Documentation](https://ollama.ai/docs)
- [Legal Tech Best Practices](https://docs.openwebui.com/features)

### System Requirements

- **Docker & Docker Compose**: Latest versions
- **Memory**: 8GB RAM minimum (16GB recommended)
- **Storage**: 20GB free space for models
- **CPU**: Multi-core recommended for AI processing

## Production Deployment

For production use:

1. **Use HTTPS**: Configure SSL certificates
2. **Database Backup**: Regular PostgreSQL backups
3. **Monitor Resources**: CPU, memory, and disk usage
4. **Update Models**: Keep AI models current
5. **Security Audit**: Regular security reviews
6. **User Training**: Train team on new features

---

**🎉 You now have enterprise-grade AI capabilities for legal case management!**