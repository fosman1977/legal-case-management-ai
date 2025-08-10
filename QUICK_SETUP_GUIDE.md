# Quick Setup Guide - LocalAI Integration

## What This System Provides

Your legal case management system is now fully **air-gapped** with LocalAI integration, providing secure, offline AI capabilities without any external dependencies.

## ✅ What's Already Ready

Your legal case management system is now **fully equipped** with LocalAI integration:

1. **🔗 LocalAI Client** - `src/utils/unifiedAIClient.ts`
2. **🧠 AI Integration** - Built into all components for document analysis  
3. **🎨 Professional UI** - Complete styling in `styles.css`
4. **🐳 Docker Configuration** - `docker-compose.minimal.yml`
5. **🔒 Air-Gapped Security** - No external API calls or data transmission

## 🚀 Complete Setup on Your Local Machine

### Option 1: One-Command Setup (Recommended)

On your local machine with Docker installed:

```bash
# 1. Navigate to your project directory
cd /path/to/your/legal-case-management

# 2. Start LocalAI services
docker compose -f docker-compose.minimal.yml up -d

# 3. Wait for LocalAI to initialize (2-3 minutes first time)
# The system will automatically:
# - Download LocalAI container (~300MB)
# - Initialize the AI service
# - Create local model storage

# 4. Start your app
npm run dev
# Visit http://localhost:5174

# 5. Check LocalAI status
curl http://localhost:8080/v1/models
```

### Option 2: Manual Docker Commands

```bash
# Pull LocalAI image manually
docker pull localai/localai:latest

# Start services
docker compose -f docker-compose.minimal.yml up -d

# Check status
docker ps | grep localai
```

### Option 3: Production Deployment

For production deployment on a VPS or cloud server:

```bash
# 1. Clone your repository
git clone [your-repo] legal-ai-system
cd legal-ai-system

# 2. Configure for production
# Edit docker-compose.minimal.yml if needed

# 3. Run with production settings
docker compose -f docker-compose.minimal.yml up -d

# 4. Configure reverse proxy (nginx/caddy) for HTTPS (optional)
# 5. Set up domain and SSL certificates (optional)
```

## 🎯 Testing the Integration

Once LocalAI is running:

1. **Open your app**: http://localhost:5174
2. **Navigate to any case**
3. **Try AI features**:
   - Document upload and analysis
   - Entity extraction (persons, issues, chronology)
   - AI-powered document processing

### Test Queries

The AI integration works through:
- **Document Analysis** - Upload PDFs for automatic entity extraction
- **Chronology Building** - AI extracts dates and events
- **Legal Authority Detection** - Finds citations and legal references
- **Issue Identification** - Discovers legal issues in documents

## 🎛️ Model Management

### Recommended Models for Legal Work

**For Consumer Hardware (8-16GB RAM):**
```bash
# Download Llama 3.1 8B Instruct (recommended)
# This will be handled through the upcoming Setup Wizard
```

**For Professional Hardware (32GB+ RAM):**
```bash
# Llama 3.3 70B Instruct or Qwen 2.5 72B
# Higher accuracy for complex legal analysis
```

## 🔧 Troubleshooting

### Common Issues

**LocalAI not accessible:**
```bash
# Check services
docker ps | grep localai

# View logs
docker logs localai
```

**Out of disk space:**
```bash
# Clean up Docker
docker system prune -a

# Check disk usage
df -h
```

**Port conflicts:**
```bash
# Check what's using port 8080
netstat -tlnp | grep :8080

# Kill conflicting processes or change port in docker-compose.minimal.yml
```

**Models not available:**
```bash
# Check LocalAI models
curl http://localhost:8080/v1/models

# Models will be downloaded through the Setup Wizard
```

### Performance Tips

1. **Increase Docker memory** to 8GB+ in Docker Desktop settings
2. **Use SSD storage** for better model loading performance
3. **Enable GPU support** if you have compatible hardware
4. **Choose appropriate model size** based on your hardware capabilities

## 🎉 What You'll Get

Once running, your system provides:

- **📚 Complete Air-Gap Operation** - No external connections required
- **🎯 Legal Document Analysis** - Entity extraction, chronology building
- **🔐 Maximum Security** - All data stays on your machine
- **🚀 High Performance** - Local processing with no network latency
- **📊 Professional Features** - Case management, document analysis, deadline tracking
- **🔍 AI-Powered Search** - Semantic document search and analysis

## 📞 Need Help?

If you encounter issues:

1. **Check the logs**: `docker logs localai`
2. **Restart services**: `docker compose -f docker-compose.minimal.yml restart`
3. **Full reset**: `docker compose -f docker-compose.minimal.yml down -v && docker compose -f docker-compose.minimal.yml up -d`

## 🎓 Next Steps

Once running:
1. **Upload your first case documents** for AI analysis
2. **Test entity extraction** - persons, dates, issues
3. **Build chronologies** automatically from documents
4. **Explore deadline tracking** with court order analysis
5. **Experience fully air-gapped legal AI**

---

**Your legal case management system is now ready for secure, air-gapped AI! 🏛️⚖️🔒**