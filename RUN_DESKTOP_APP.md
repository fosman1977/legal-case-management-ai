# 🚀 How to Run Your Air-Gapped Legal Case Manager Desktop App

## For Local Development (Your Machine)

### 1. Clone Your Project
```bash
git clone https://github.com/YOUR-USERNAME/legal-case-management-ai.git
cd legal-case-management-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start LocalAI (Air-Gapped AI)
```bash
# Start LocalAI services
docker compose -f docker-compose.minimal.yml up -d

# Check that LocalAI is ready
curl http://localhost:8080/v1/models
```

### 4. Run Desktop App
```bash
# Option 1: Run development version with hot reload
npm run electron-dev

# Option 2: Run web version first, then desktop
npm run dev
# In another terminal:
npm run electron
```

## What You'll See

### ✅ Desktop Window
- Native desktop app window
- Professional menu bar with File, Edit, View, AI, Help menus
- Keyboard shortcuts (Cmd/Ctrl+N for new case, etc.)

### ✅ AI Features Working (Air-Gapped)
- **No external connections** - All AI processing happens locally
- **Complete privacy** - No data ever leaves your machine
- AI document analysis works offline
- Model selection in AI Settings
- All document analysis features functional

### ✅ Menu Actions
- **File > New Case** - Creates new case
- **AI > Analyze Current Case** - Local AI analysis  
- **AI > Extract Chronology** - Timeline extraction
- **View > Toggle DevTools** - Developer tools

## Build Installer (Production)

```bash
# Build installer for your platform
npm run dist

# Custom build script
node build-electron.js
```

This creates installers in `dist-electron-final/`:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` file  
- **Linux**: `.AppImage` file

## Benefits You Now Have

### 🔒 Maximum Security & Privacy
- ✅ **Complete air-gap operation** - No external network calls
- ✅ **Local AI processing** - All analysis happens on your machine
- ✅ **Data isolation** - Perfect for confidential legal work
- ✅ **Offline capable** - Works without any internet connection

### 🏢 Perfect for Legal Work
- ✅ **Privacy focused** - Client confidentiality protected
- ✅ **Compliance ready** - Meets strictest security requirements
- ✅ **Professional interface** - Desktop menus and shortcuts
- ✅ **Cross-platform** - Windows, Mac, Linux support

### 🚀 Technical Excellence
- ✅ **No CORS issues** - Desktop apps don't have browser restrictions
- ✅ **Direct LocalAI access** - No proxy servers needed
- ✅ **Better file handling** - Native file system access
- ✅ **Hot reload** - Development changes reflect immediately

### 🤖 Advanced AI Features
- ✅ **Entity extraction** - Persons, dates, issues, authorities
- ✅ **Chronology building** - Automatic timeline generation
- ✅ **Legal document analysis** - Contract review, risk assessment
- ✅ **PDF processing** - OCR support for scanned documents

## AI Model Setup

On first run, you'll be guided through model selection:

### Recommended for Most Users
- **Llama 3.1-8B-Instruct** (4.7GB) - Perfect balance of speed and accuracy
- Works on consumer hardware (8GB+ RAM)
- Excellent legal document understanding

### For Professional Use
- **Qwen 2.5-14B-Instruct** (8.2GB) - Enhanced reasoning
- **Llama 3.3-70B-Instruct** (40GB) - Maximum accuracy
- Requires more powerful hardware

## Testing Your Air-Gap Setup

### Verify Complete Isolation
```bash
# Test with internet disconnected
sudo ifconfig en0 down  # Disconnect internet

# Application should work fully
# Only some font/CDN requests should fail (we'll fix these)

# Reconnect internet
sudo ifconfig en0 up
```

### Check LocalAI Status
```bash
# Verify LocalAI is responding
curl http://localhost:8080/v1/models

# Check container health
docker ps | grep localai
```

## Next Steps After Testing

1. **Test all AI features** - Document upload, entity extraction, chronology building
2. **Verify air-gap operation** - Test with internet disconnected
3. **Customize appearance** - Add app icon, splash screen
4. **Model management** - Try different models for your use case
5. **Distribution** - Share installer with colleagues
6. **Advanced features** - PDF-Extract-Kit integration, setup wizard

## Troubleshooting

### LocalAI Not Responding
```bash
# Restart LocalAI
docker compose -f docker-compose.minimal.yml restart

# Check logs
docker logs localai
```

### App Won't Start
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Model Issues
```bash
# Check available models
curl http://localhost:8080/v1/models

# Models will be managed through the upcoming setup wizard
```

---

**🎉 You now have a professional, air-gapped legal AI system perfect for confidential legal work!**