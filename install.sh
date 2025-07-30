#!/bin/bash

# Legal Case Management AI System - Complete Installer
# Automated setup for macOS/Linux with Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="legal-case-management"
INSTALL_DIR="$HOME/Documents/$PROJECT_NAME"
GITHUB_REPO="https://github.com/anthropics/legal-case-management"  # Replace with actual repo
DOCKER_COMPOSE_FILE="docker-compose.minimal.yml"

print_header() {
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║              Legal Case Management AI System                   ║"
    echo "║                   Complete Installer                          ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${CYAN}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    print_step "Checking system requirements..."
    
    # Check if running on macOS or Linux
    if [[ "$OSTYPE" != "darwin"* ]] && [[ "$OSTYPE" != "linux-gnu"* ]]; then
        print_error "This installer only supports macOS and Linux"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop first:"
        echo "  macOS: https://docs.docker.com/desktop/install/mac-install/"
        echo "  Linux: https://docs.docker.com/desktop/install/linux-install/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not available. Please update Docker Desktop."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found. Installing via Homebrew (macOS) or package manager..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if ! command -v brew &> /dev/null; then
                print_error "Homebrew not found. Please install Node.js manually: https://nodejs.org/"
                exit 1
            fi
            brew install node
        else
            print_error "Please install Node.js manually: https://nodejs.org/"
            exit 1
        fi
    fi
    
    # Check available disk space (need at least 10GB)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        available_space=$(df -g . | awk 'NR==2 {print $4}')
    else
        available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    fi
    
    if [[ $available_space -lt 10 ]]; then
        print_warning "Low disk space detected. You need at least 10GB free for AI models."
    fi
    
    print_success "System requirements check completed"
}

create_project_structure() {
    print_step "Creating project structure..."
    
    # Remove existing installation if it exists
    if [[ -d "$INSTALL_DIR" ]]; then
        print_warning "Existing installation found. Backing up..."
        mv "$INSTALL_DIR" "${INSTALL_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Create project directory
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    print_success "Project directory created at $INSTALL_DIR"
}

create_package_json() {
    print_step "Creating package.json..."
    
    cat > package.json << 'EOF'
{
  "name": "legal-case-manager",
  "version": "1.0.0",
  "description": "AI-powered legal case preparation and document analysis tool",
  "keywords": ["legal", "case-management", "ai", "ollama"],
  "main": "dist-electron/main.js",
  "homepage": "./",
  "dependencies": {
    "pdfjs-dist": "^5.4.54",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "19.0.0",
    "@types/react-dom": "19.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "5.7.2",
    "vite": "^5.0.11",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1",
    "concurrently": "^8.2.2",
    "wait-on": "^7.2.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron": "wait-on http://localhost:5173 && electron .",
    "electron-dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "build-electron": "npm run build && electron-builder",
    "dist": "npm run build && electron-builder --publish=never",
    "ai": "docker compose -f docker-compose.minimal.yml up -d",
    "ai-stop": "docker compose -f docker-compose.minimal.yml down",
    "ai-logs": "docker compose -f docker-compose.minimal.yml logs -f",
    "install-models": "./scripts/install-models.sh"
  },
  "browserslist": [
    ">0.2%",
    "not dead",
    "not ie <= 11",
    "not op_mini all"
  ]
}
EOF
    
    print_success "package.json created"
}

create_docker_compose() {
    print_step "Creating Docker configuration..."
    
    cat > docker-compose.minimal.yml << 'EOF'
version: '3.8'

services:
  # OpenWebUI with Ollama integration - Optimized setup
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: legal-ai-openwebui
    ports:
      - "3002:8080"  # OpenWebUI interface
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - WEBUI_AUTH=False  # Disable authentication for simplicity
      - ENABLE_SIGNUP=True
      - DEFAULT_USER_ROLE=admin
      - WEBUI_SECRET_KEY=legal-case-ai-secret-key
      - CORS_ALLOW_ORIGIN=http://localhost:5173,http://localhost:3002
      - ENABLE_RAG_WEB_SEARCH=true
      - RAG_EMBEDDING_ENGINE=ollama
      - RAG_EMBEDDING_MODEL=nomic-embed-text:latest
      - CHUNK_SIZE=1500
      - CHUNK_OVERLAP=100
      - PDF_EXTRACT_IMAGES=true
      - ENABLE_IMAGE_GENERATION=false
      - ENABLE_COMMUNITY_SHARING=false
      - HF_HUB_OFFLINE=1  # Offline mode for better performance
      - WEBUI_NAME="Legal Case Management AI"
    volumes:
      - legal-webui-data:/app/backend/data
      - ./uploads:/app/backend/data/uploads
    depends_on:
      - ollama
    restart: unless-stopped
    networks:
      - legal-ai-network

  # Ollama service for LLM hosting
  ollama:
    image: ollama/ollama:latest
    container_name: legal-ai-ollama
    ports:
      - "11435:11434"  # Ollama API
    environment:
      - OLLAMA_ORIGINS=*
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_KEEP_ALIVE=24h
      - OLLAMA_MAX_LOADED_MODELS=3
    volumes:
      - legal-ollama-data:/root/.ollama
    restart: unless-stopped
    networks:
      - legal-ai-network
    # Uncomment if you have NVIDIA GPU
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

volumes:
  legal-webui-data:
    driver: local
  legal-ollama-data:
    driver: local

networks:
  legal-ai-network:
    driver: bridge
EOF
    
    print_success "Docker configuration created"
}

create_vite_config() {
    print_step "Creating Vite configuration..."
    
    cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
EOF
    
    print_success "Vite configuration created"
}

create_typescript_config() {
    print_step "Creating TypeScript configuration..."
    
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
    
    cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
EOF
    
    print_success "TypeScript configuration created"
}

create_index_html() {
    print_step "Creating HTML template..."
    
    cat > index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legal Case Management AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
EOF
    
    print_success "HTML template created"
}

create_directories() {
    print_step "Creating directory structure..."
    
    mkdir -p src/{components,utils,hooks}
    mkdir -p scripts
    mkdir -p uploads
    mkdir -p public
    
    print_success "Directory structure created"
}

create_install_scripts() {
    print_step "Creating installation scripts..."
    
    # Model installation script
    cat > scripts/install-models.sh << 'EOF'
#!/bin/bash
echo "📥 Installing AI models for Legal Case Management..."
echo "This will download several GB of data and may take 10-30 minutes."

# Start Ollama if not running
docker compose -f docker-compose.minimal.yml up -d ollama

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
sleep 10

# Pull essential models
echo "📥 Pulling embedding model (for document search)..."
docker exec legal-ai-ollama ollama pull nomic-embed-text:latest

echo "📥 Pulling small language model (fast responses)..."
docker exec legal-ai-ollama ollama pull llama3.2:1b

echo "📥 Pulling medium language model (better quality)..."
docker exec legal-ai-ollama ollama pull llama3.2:3b

echo "✅ AI models installation completed!"
echo "🚀 You can now use the legal AI system."
EOF
    
    chmod +x scripts/install-models.sh
    
    # Startup script
    cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Legal Case Management AI System..."

# Start AI services
echo "🤖 Starting AI services (OpenWebUI + Ollama)..."
docker compose -f docker-compose.minimal.yml up -d

echo "⏳ Waiting for services to start..."
sleep 5

# Start the web application
echo "🌐 Starting web application..."
npm run dev

echo "✅ System started!"
echo "📋 Access points:"
echo "  - Main App: http://localhost:5173"
echo "  - AI Interface: http://localhost:3002"
echo ""
echo "🛑 To stop: Ctrl+C, then run: npm run ai-stop"
EOF
    
    chmod +x start.sh
    
    # Desktop launcher (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        cat > "Legal AI System.command" << EOF
#!/bin/bash
cd "$INSTALL_DIR"
./start.sh
EOF
        chmod +x "Legal AI System.command"
    fi
    
    print_success "Installation scripts created"
}

install_dependencies() {
    print_step "Installing Node.js dependencies..."
    
    npm install
    
    print_success "Dependencies installed"
}

setup_ai_services() {
    print_step "Setting up AI services..."
    
    # Create uploads directory with proper permissions
    mkdir -p uploads
    chmod 755 uploads
    
    # Pull Docker images
    echo "📥 Pulling Docker images (this may take a few minutes)..."
    docker compose -f docker-compose.minimal.yml pull
    
    # Start services
    echo "🚀 Starting AI services..."
    docker compose -f docker-compose.minimal.yml up -d
    
    print_success "AI services are starting up"
}

create_readme() {
    print_step "Creating documentation..."
    
    cat > README.md << 'EOF'
# Legal Case Management AI System

An AI-powered legal case preparation and document analysis tool with advanced RAG capabilities.

## 🚀 Quick Start

### Start the System
```bash
./start.sh
```
This will start both the AI services and the web application.

### Access Points
- **Main Application**: http://localhost:5173
- **AI Interface**: http://localhost:3002

## 📋 Available Commands

```bash
# Start AI services only
npm run ai

# Stop AI services
npm run ai-stop

# View AI service logs
npm run ai-logs

# Install additional AI models
npm run install-models

# Start development server only
npm run dev

# Build for production
npm run build
```

## 🤖 AI Features

- **Document Analysis**: Upload PDFs and extract legal entities
- **RAG Chat**: Ask questions about your documents with citations
- **Case Management**: Organize cases, chronologies, and key points
- **Auto-generation**: Generate skeletons, pleadings, and summaries

## 🔧 System Requirements

- **Docker Desktop**: Latest version
- **Node.js**: v18 or later
- **Memory**: 8GB RAM minimum (16GB recommended)
- **Storage**: 10GB free space for AI models

## 📖 Usage Guide

1. **Start the system**: Run `./start.sh`
2. **Create a case**: Use the web interface to create your first case
3. **Upload documents**: Add PDFs, Word docs, or text files
4. **Ask questions**: Use the AI chat to analyze your documents
5. **Generate content**: Auto-create legal documents and summaries

## 🛠️ Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker version

# Restart services
npm run ai-stop
npm run ai
```

### Out of disk space
```bash
# Clean up Docker
docker system prune -a
```

### Performance issues
- Increase Docker memory to 8GB+ in Docker Desktop settings
- Close other applications while using AI features

## 🔒 Security

- All AI processing happens locally on your machine
- No data is sent to external services
- Documents are stored locally in the uploads folder

## 📞 Support

Check the logs if you encounter issues:
```bash
npm run ai-logs
```

For technical support, check the documentation or contact your system administrator.
EOF
    
    print_success "Documentation created"
}

print_completion() {
    print_step "Installation completed successfully!"
    
    echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                 🎉 INSTALLATION COMPLETE! 🎉                     ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${CYAN}📋 Next Steps:${NC}"
    echo -e "   1. Install AI models: ${YELLOW}cd '$INSTALL_DIR' && npm run install-models${NC}"
    echo -e "   2. Start the system:  ${YELLOW}./start.sh${NC}"
    echo -e "   3. Open your browser:  ${YELLOW}http://localhost:5173${NC}"
    
    echo -e "\n${CYAN}📍 Installation Location:${NC} $INSTALL_DIR"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "\n${CYAN}🖥️  Desktop Launcher:${NC} 'Legal AI System.command' (double-click to start)"
    fi
    
    echo -e "\n${CYAN}📖 Documentation:${NC} README.md in the installation directory"
    
    echo -e "\n${YELLOW}⚠️  Important:${NC}"
    echo -e "   - First startup will download AI models (5-10GB)"
    echo -e "   - Ensure Docker Desktop is running before starting"
    echo -e "   - Keep at least 10GB free disk space"
    
    echo -e "\n${GREEN}🚀 Your Legal AI System is ready to use!${NC}"
}

# Main installation flow
main() {
    print_header
    
    # Preflight checks
    check_requirements
    
    # Create project
    create_project_structure
    
    # Setup files
    create_package_json
    create_docker_compose
    create_vite_config
    create_typescript_config
    create_index_html
    create_directories
    create_install_scripts
    
    # Install and setup
    install_dependencies
    setup_ai_services
    
    # Documentation
    create_readme
    
    # Done!
    print_completion
}

# Run installer
main "$@"