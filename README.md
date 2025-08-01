# Legal Case Management AI System

A professional desktop application for legal case preparation with integrated AI capabilities.

![Legal AI System](https://img.shields.io/badge/Legal%20AI-Professional-blue)
![Electron](https://img.shields.io/badge/Electron-Desktop%20App-green)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🎯 Features

### Core Legal Management
- ✅ **Case Management** - Create, organize, and track legal cases
- ✅ **Document Analysis** - AI-powered document processing and entity extraction
- ✅ **Chronology Builder** - Automatic timeline generation from case events
- ✅ **Key Points Manager** - Organize and present crucial case information

### Advanced Features
- 🎙️ **Audio/Video Notes** - Record client meetings with AI transcription
- 📋 **Court Orders Management** - Track orders with automatic deadline extraction
- 📅 **Global Procedural Calendar** - All case deadlines in one unified view
- 🤖 **AI Integration** - OpenWebUI chat for document analysis and legal research

### Professional Tools
- 📄 **Auto-Generation** - Create skeletons, pleadings, and legal documents
- 👥 **Dramatis Personae** - Manage all parties involved in cases
- 🏛️ **Authorities Manager** - Track legal precedents and citations
- 🔍 **Advanced Search** - Find information across all cases instantly

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **macOS** 10.14+ / **Windows** 10+ / **Linux** Ubuntu 18+

### Installation

#### Option 1: One-Click Install (Recommended)
```bash
# Clone and install
git clone https://github.com/YOUR-USERNAME/legal-case-management-ai.git
cd legal-case-management-ai
./install.sh
```

#### Option 2: Manual Setup
```bash
# Install dependencies
npm install

# Start AI services (optional)
npm run ai

# Run development version
npm run dev

# Build desktop app
npm run build-electron
```

### First Run
1. **Start the application**
   ```bash
   npm run electron-dev
   ```

2. **Access AI features** (optional)
   - Start AI services: `npm run ai`
   - Open AI Chat: http://localhost:3002

3. **Create your first case**
   - Click "New Case" in the dashboard
   - Upload documents for AI analysis
   - Start managing your legal workflow!

## 📱 Usage

### Case Management
1. **Create Cases** - Add client information, case details, and documents
2. **Upload Documents** - Drag & drop PDFs, Word docs, or text files
3. **AI Analysis** - Automatic entity extraction (persons, organizations, dates)
4. **Track Progress** - Monitor case status and important deadlines

### Notes & Recording
1. **Text Notes** - Create detailed case memos and working papers
2. **Audio Recording** - Record client meetings with AI transcription
3. **Video Notes** - Capture video conferences and presentations
4. **Organization** - Tag and search all notes across cases

### Deadline Management
1. **Court Orders** - Upload orders for automatic deadline extraction
2. **Task Tracking** - AI-generated to-do lists from court documents
3. **Global Calendar** - See all deadlines across all cases
4. **Alerts** - Never miss important filing dates

## 🔧 Development

### Project Structure
```
legal-case-management-ai/
├── src/
│   ├── components/          # React components
│   │   ├── CaseList.tsx
│   │   ├── CaseView.tsx
│   │   ├── UserNotesManager.tsx
│   │   ├── OrdersDirectionsManager.tsx
│   │   └── GlobalProceduralCalendar.tsx
│   ├── utils/              # Utility functions
│   │   ├── unifiedAIClient.ts
│   │   ├── openWebUIClient.ts
│   │   └── aiDocumentProcessor.ts
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript definitions
│   └── App.tsx             # Main application
├── electron/               # Electron main process
├── docker-compose.yml      # AI services configuration
└── package.json
```

### Available Scripts
```bash
# Development
npm run dev                 # Start dev server
npm run electron-dev        # Start Electron dev mode

# Production
npm run build              # Build React app
npm run build-electron     # Build desktop app
npm run dist              # Create installer

# AI Services
npm run ai                # Start AI services
npm run ai-stop           # Stop AI services
npm run ai-logs           # View AI logs

# Maintenance
npm run test              # Run tests
npm run lint              # Check code quality
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Desktop**: Electron 28
- **Styling**: CSS3 with CSS Variables
- **Icons**: Lucide React
- **Routing**: React Router 6
- **AI Services**: OpenWebUI + Ollama
- **Database**: LocalStorage + IndexedDB

## 🤖 AI Integration

### OpenWebUI Setup
The system integrates with OpenWebUI for advanced AI capabilities:

```bash
# Start AI services
npm run ai

# Access AI interface
open http://localhost:3002
```

### AI Features
- **Document Analysis** - Extract entities, dates, and legal concepts
- **Chat Interface** - Ask questions about your cases and documents
- **Transcription** - Convert audio/video recordings to text
- **Deadline Extraction** - Automatically find due dates in court orders
- **Legal Research** - AI-assisted case law and statute lookup

### Supported Models
- **Llama 3.2** - General purpose legal analysis
- **Nomic Embed** - Document similarity and search
- **Code Llama** - Legal document generation
- **Custom Models** - Add your own fine-tuned legal models

## 🔒 Security & Privacy

### Data Storage
- **Local First** - All data stored on your device
- **No Cloud Sync** - Documents never leave your machine
- **Encrypted Storage** - Sensitive data encrypted at rest
- **Secure Communication** - TLS for all AI API calls

### Privacy Features
- **Offline Mode** - Core features work without internet
- **Data Anonymization** - Remove sensitive info for AI analysis
- **Audit Trail** - Track all document access and modifications
- **User Controls** - Granular privacy settings

## 📦 Deployment

### Desktop Distribution
```bash
# Build for current platform
npm run dist

# Build for all platforms
npm run dist -- --mac --win --linux

# Create installer
npm run build-electron
```

### Docker Deployment
```bash
# Build container
docker build -t legal-ai-system .

# Run with AI services
docker-compose up -d
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- **TypeScript** for type safety
- **ESLint + Prettier** for formatting
- **Conventional Commits** for commit messages
- **Component-based architecture**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [User Guide](docs/USER_GUIDE.md)
- [API Reference](docs/API.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

### Community
- **Issues**: [GitHub Issues](https://github.com/YOUR-USERNAME/legal-case-management-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR-USERNAME/legal-case-management-ai/discussions)
- **Email**: support@legal-ai.com

### Troubleshooting
Common issues and solutions:

**Port 5173 already in use**
```bash
# Kill existing process
lsof -ti:5173 | xargs kill -9
```

**Docker services won't start**
```bash
# Reset Docker
docker system prune -a
npm run ai
```

**AI features not working**
```bash
# Check AI services status
docker ps
npm run ai-logs
```

## 🎯 Roadmap

### Version 1.1 (Coming Soon)
- [ ] Multi-user support
- [ ] Cloud backup integration
- [ ] Advanced reporting
- [ ] Mobile app companion

### Version 1.2 (Future)
- [ ] Practice management features
- [ ] Time tracking integration
- [ ] Client portal
- [ ] Advanced AI models

---

**Legal Case Management AI** - Revolutionizing legal practice with artificial intelligence.

Made with ❤️ for legal professionals worldwide.
