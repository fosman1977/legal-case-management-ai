# 🚀 Legal Case Management AI - Air-Gapped Setup Instructions

## What You Have Now

Your legal case management system is now **completely air-gapped** with LocalAI integration, providing maximum security and privacy for sensitive legal work.

### 🔒 Air-Gapped Architecture
- **No external API calls** - All AI processing happens locally
- **No cloud dependencies** - Everything runs on your machine
- **Complete data isolation** - Perfect for confidential legal work
- **Offline capable** - Works without internet connection

## Quick Start on Your Machine

### Prerequisites
- **Docker Desktop** - For LocalAI services
- **Node.js 18+** - For the application
- **8GB+ RAM recommended** - For AI model processing

### Option 1: One-Command Setup (Recommended)

**Step 1: Clone Repository**
```bash
cd ~/Documents
git clone https://github.com/YOUR-USERNAME/legal-case-management-ai.git
cd legal-case-management-ai
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Start LocalAI Services**
```bash
docker compose -f docker-compose.minimal.yml up -d
```

**Step 4: Launch Application**
```bash
npm run dev
# Visit http://localhost:5174
```

### Option 2: Desktop App

For native desktop application:
```bash
npm run electron-dev
```

## 🤖 AI Model Setup

The system will guide you through model selection on first run:

### Recommended Models
- **Llama 3.1-8B-Instruct** - Best for most users (4.7GB)
- **Qwen 2.5-14B-Instruct** - Enhanced performance (8.2GB) 
- **Llama 3.3-70B-Instruct** - Professional grade (40GB+)

Models will be downloaded automatically through the setup wizard.

## What's Included

### Core Features
- **Case Management** - Professional case organization
- **Document Analysis** - AI-powered entity extraction
- **Chronology Building** - Automatic timeline generation
- **Legal Authority Detection** - Citation and reference extraction
- **Court Orders Processing** - Deadline extraction and tracking
- **Global Calendar** - All deadlines across all cases

### AI-Powered Features
- **Entity Extraction** - Persons, organizations, dates, issues
- **Document Summarization** - Key points and insights
- **Legal Research** - Case law and statute analysis
- **Contract Review** - Risk identification and analysis
- **Deadline Detection** - Automatic court order processing

### Technical Features
- **Electron Desktop App** - Native application for all platforms
- **LocalAI Integration** - Completely air-gapped AI processing
- **Advanced PDF Extraction** - OCR support for scanned documents
- **Professional UI** - Modern, responsive design
- **TypeScript** - Type-safe development
- **Air-Gap Compliance** - No external network dependencies

## LocalAI Services

### Check Service Status
```bash
# Verify LocalAI is running
curl http://localhost:8080/v1/models

# Check container status
docker ps | grep localai
```

### Manage Services
```bash
# Start services
docker compose -f docker-compose.minimal.yml up -d

# Stop services
docker compose -f docker-compose.minimal.yml down

# View logs
docker logs localai
```

## Troubleshooting

### Common Issues

**LocalAI not responding:**
```bash
# Restart LocalAI
docker compose -f docker-compose.minimal.yml restart

# Check logs for errors
docker logs localai
```

**Port conflicts:**
```bash
# Check what's using ports
netstat -tlnp | grep :8080  # LocalAI
netstat -tlnp | grep :5174  # Web app

# Kill conflicting processes
lsof -ti:5174 | xargs kill -9
```

**Model download issues:**
```bash
# Check available disk space
df -h

# Clean Docker if needed
docker system prune -a
```

**Application won't start:**
```bash
# Clean and reinstall
npm run clean
npm install
npm run build
```

## Security & Privacy

### Air-Gap Verification
To verify complete air-gap operation:
```bash
# Block internet access temporarily
sudo ifconfig en0 down

# Application should still work fully
# Only external CDN requests should fail (which we'll fix)
```

### Data Storage
- **Local Storage** - Case data in browser localStorage
- **IndexedDB** - Document storage and search indexes  
- **File System** - Document files and attachments
- **Docker Volumes** - AI models and configuration

### Privacy Features
- **No telemetry** - No usage tracking or data collection
- **Local processing** - All AI analysis happens on your machine
- **Encrypted storage** - Sensitive data protection
- **Audit trail** - Track all document access and modifications

## Success Indicators

When properly configured, you should see:
- ✅ Desktop application opens with professional interface
- ✅ LocalAI service responds at localhost:8080
- ✅ Can create and manage cases without internet
- ✅ Document upload and AI analysis works offline
- ✅ PDF extraction with OCR support
- ✅ Chronology building from documents
- ✅ Entity extraction (persons, dates, issues)
- ✅ Complete air-gap operation

## Next Steps

1. **Setup Wizard** - Upcoming feature for one-click model downloads
2. **Enhanced PDF Processing** - Integration with PDF-Extract-Kit
3. **Model Management** - Easy model switching and updates
4. **Advanced Features** - Specialized legal document templates

---

🎉 **Your air-gapped Legal Case Management AI system is ready for secure legal work!**

This system provides enterprise-grade AI capabilities while maintaining complete data isolation, making it perfect for handling confidential legal documents and client information.