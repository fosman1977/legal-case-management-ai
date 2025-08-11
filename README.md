# ⚖️ Legal Case Manager AI

[![Build Status](https://github.com/fosman1977/legal-case-management-ai/actions/workflows/build-and-release.yml/badge.svg)](https://github.com/fosman1977/legal-case-management-ai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/fosman1977/legal-case-management-ai/releases)
[![Electron](https://img.shields.io/badge/Electron-Desktop%20App-green)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

**Professional AI-powered legal case management system with 100% offline document analysis and automatic GitHub updates.**

## ✨ Key Features

### 🚀 **Desktop Application**
- **Native installers** for Windows (.exe), macOS (.dmg), and Linux (.AppImage)
- **Automatic updates** directly from GitHub releases
- **Professional UI** with modern, intuitive design
- **Works offline** after initial setup

### 🤖 **Integrated AI (No Docker Required!)**
- **100% Offline Processing** - All AI runs locally on your machine
- **LocalAI Embedded** - No Docker or complex setup needed
- **One-Click Setup** - Beautiful wizard guides you through AI configuration
- **Legal-Optimized Models** - Specialized AI models for legal documents

### ⚖️ **Legal Case Management**
- **Case Organization** - Create, organize, and track legal cases
- **Document Analysis** - AI-powered document processing and entity extraction
- **Chronology Builder** - Automatic timeline generation from case events
- **Procedural Calendar** - Track all deadlines across cases
- **Authorities Manager** - Track legal precedents and citations
- **Dramatis Personae** - Manage all parties involved in cases

### 📄 **Document Processing**
- **Universal Support** - PDF, DOCX, TXT, MD, HTML, and more
- **Advanced OCR** - Extract text from scanned documents
- **Intelligent Analysis** - AI extracts entities, dates, and key information
- **Batch Processing** - Handle multiple documents efficiently

### 🔒 **Security & Privacy**
- **Air-Gapped Operation** - No data leaves your computer
- **Local Storage** - All data stored securely on your machine
- **No Cloud Dependencies** - Complete offline functionality
- **GDPR Compliant** - Full data sovereignty

## 🚀 Quick Start

### For End Users (Download & Run)

1. **Download the installer for your platform:**
   - 🪟 **Windows**: [Download .exe installer](https://github.com/fosman1977/legal-case-management-ai/releases/latest)
   - 🍎 **macOS**: [Download .dmg installer](https://github.com/fosman1977/legal-case-management-ai/releases/latest)
   - 🐧 **Linux**: [Download .AppImage](https://github.com/fosman1977/legal-case-management-ai/releases/latest)

2. **Run the installer** - Standard installation process for your OS

3. **Launch the app** - First launch shows a setup wizard that:
   - Downloads and configures LocalAI automatically
   - Helps you select the best AI model for your needs
   - No Docker or technical knowledge required!

4. **Start managing cases** with AI assistance immediately

### For Developers

```bash
# Clone the repository
git clone https://github.com/fosman1977/legal-case-management-ai.git
cd legal-case-management-ai

# Install dependencies
npm install

# Run in development mode with hot reload
npm run electron-dev

# Build installers for production
npm run dist        # Current platform
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

```

## 🧠 AI Models

The app includes three legal-optimized AI models (downloaded during setup):

### **Mistral 7B Legal** (🏆 Recommended)
- **Size**: 4.1GB
- **Best for**: Document analysis, contract review, case summarization
- **Speed**: Fast
- **RAM Required**: 8GB minimum

### **Llama 2 13B Legal** (Premium)
- **Size**: 7.3GB
- **Best for**: Complex legal reasoning, precedent analysis, brief writing
- **Speed**: Moderate
- **RAM Required**: 16GB recommended

### **Phi-3 Legal** (Lightweight)
- **Size**: 2.4GB
- **Best for**: Quick summaries, basic legal Q&A
- **Speed**: Very fast
- **RAM Required**: 4GB minimum

## 🔄 Automatic Updates

The app automatically checks for updates from GitHub and notifies you when a new version is available. Updates are seamless and preserve all your data.

## 💻 System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 20.04+
- **RAM**: 8GB
- **Storage**: 10GB free space
- **CPU**: Intel i5 / AMD Ryzen 5 (2018 or newer)
- **Internet**: Required only for initial setup and updates

### Recommended Requirements
- **RAM**: 16GB or more
- **Storage**: 20GB+ SSD
- **CPU**: Intel i7 / AMD Ryzen 7 (2020 or newer)

## 🔒 Security & Privacy

- **🏠 100% Local Processing** - All AI processing happens on your machine
- **🚫 No Cloud Dependencies** - Works completely offline after setup
- **🔐 Data Sovereignty** - Your legal documents never leave your computer
- **🔒 Encrypted Storage** - All case data is securely stored locally
- **✅ GDPR Compliant** - Full control over your data

## 🎆 What's New

### Version 1.0.0
- ✨ **Desktop Application** - Native installers for all platforms
- 🤖 **Embedded LocalAI** - No Docker required!
- 🎓 **Setup Wizard** - Beautiful one-click AI configuration
- 🔄 **Auto-Updates** - Seamless updates from GitHub
- 🛡️ **Enhanced Security** - Complete offline operation
- 📊 **OCR Support** - Extract text from scanned documents
- 📋 **Procedural Calendar** - Track all deadlines in one place

## 🎨 Screenshots

### Main Dashboard
Modern, intuitive interface for managing all your legal cases

### Document Analysis
AI-powered extraction of entities, dates, and key information

### Setup Wizard
Beautiful one-click setup guides you through AI configuration

### Procedural Calendar
Track all deadlines across cases in a unified view

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **LocalAI** - For providing the offline AI engine
- **Electron** - For the desktop application framework
- **React** - For the user interface
- **PDF.js** - For PDF processing capabilities
- **Tesseract.js** - For OCR functionality

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/fosman1977/legal-case-management-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fosman1977/legal-case-management-ai/discussions)

## 🚀 Roadmap

- [x] Desktop application with native installers
- [x] Integrated LocalAI (no Docker required)
- [x] Auto-updates from GitHub releases
- [x] Document OCR support
- [x] One-click setup wizard
- [ ] Cloud backup integration (optional)
- [ ] Mobile companion app
- [ ] Legal templates library
- [ ] Court filing integration
- [ ] Multi-language support

## 🏆 Why Choose Legal Case Manager AI?

- **🔒 Complete Privacy**: Your legal documents never leave your computer
- **🚀 No Setup Hassle**: One-click AI setup, no Docker or technical knowledge required
- **💰 Cost Effective**: No subscription fees, cloud costs, or API charges
- **⚡ Fast Performance**: Local processing means instant results
- **🎯 Legal-Focused**: Built specifically for legal professionals
- **🔄 Always Updated**: Automatic updates keep you on the latest version

---

**Built with ❤️ for legal professionals who value privacy and efficiency.**

*🤖 Generated with [Claude Code](https://claude.ai/code)*
