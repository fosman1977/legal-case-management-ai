@echo off
:: Legal Case Management AI System - Windows Installer
:: Automated setup for Windows with Docker Desktop

setlocal enabledelayedexpansion

:: Configuration
set PROJECT_NAME=legal-case-management
set INSTALL_DIR=%USERPROFILE%\Documents\%PROJECT_NAME%

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              Legal Case Management AI System                   ║
echo ║                   Windows Installer                           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: Check Docker
echo 🔧 Checking system requirements...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed or not running.
    echo Please install Docker Desktop from: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed.
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ System requirements check completed

:: Create project directory
echo 🔧 Creating project structure...
if exist "%INSTALL_DIR%" (
    echo ⚠️  Existing installation found. Creating backup...
    set BACKUP_DIR=%INSTALL_DIR%_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set BACKUP_DIR=!BACKUP_DIR: =0!
    move "%INSTALL_DIR%" "!BACKUP_DIR!" >nul
)

mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

echo ✅ Project directory created at %INSTALL_DIR%

:: Create package.json
echo 🔧 Creating package.json...
(
echo {
echo   "name": "legal-case-manager",
echo   "version": "1.0.0",
echo   "description": "AI-powered legal case preparation and document analysis tool",
echo   "scripts": {
echo     "dev": "vite",
echo     "build": "tsc && vite build",
echo     "ai": "docker compose -f docker-compose.minimal.yml up -d",
echo     "ai-stop": "docker compose -f docker-compose.minimal.yml down",
echo     "ai-logs": "docker compose -f docker-compose.minimal.yml logs -f",
echo     "install-models": "install-models.bat"
echo   },
echo   "dependencies": {
echo     "pdfjs-dist": "^5.4.54",
echo     "react": "^19.0.0",
echo     "react-dom": "^19.0.0"
echo   },
echo   "devDependencies": {
echo     "@types/react": "19.0.0",
echo     "@types/react-dom": "19.0.0",
echo     "@vitejs/plugin-react": "^4.2.1",
echo     "typescript": "5.7.2",
echo     "vite": "^5.0.11"
echo   }
echo }
) > package.json

echo ✅ package.json created

:: Create Docker Compose
echo 🔧 Creating Docker configuration...
(
echo version: '3.8'
echo.
echo services:
echo   open-webui:
echo     image: ghcr.io/open-webui/open-webui:main
echo     container_name: legal-ai-openwebui
echo     ports:
echo       - "3002:8080"
echo     environment:
echo       - OLLAMA_BASE_URL=http://ollama:11434
echo       - WEBUI_AUTH=False
echo       - ENABLE_SIGNUP=True
echo       - DEFAULT_USER_ROLE=admin
echo       - WEBUI_SECRET_KEY=legal-case-ai-secret-key
echo       - CORS_ALLOW_ORIGIN=http://localhost:5173,http://localhost:3002
echo       - ENABLE_RAG_WEB_SEARCH=true
echo       - RAG_EMBEDDING_ENGINE=ollama
echo       - RAG_EMBEDDING_MODEL=nomic-embed-text:latest
echo       - PDF_EXTRACT_IMAGES=true
echo       - WEBUI_NAME="Legal Case Management AI"
echo     volumes:
echo       - legal-webui-data:/app/backend/data
echo       - ./uploads:/app/backend/data/uploads
echo     depends_on:
echo       - ollama
echo     restart: unless-stopped
echo     networks:
echo       - legal-ai-network
echo.
echo   ollama:
echo     image: ollama/ollama:latest
echo     container_name: legal-ai-ollama
echo     ports:
echo       - "11435:11434"
echo     environment:
echo       - OLLAMA_ORIGINS=*
echo       - OLLAMA_HOST=0.0.0.0
echo       - OLLAMA_KEEP_ALIVE=24h
echo     volumes:
echo       - legal-ollama-data:/root/.ollama
echo     restart: unless-stopped
echo     networks:
echo       - legal-ai-network
echo.
echo volumes:
echo   legal-webui-data:
echo     driver: local
echo   legal-ollama-data:
echo     driver: local
echo.
echo networks:
echo   legal-ai-network:
echo     driver: bridge
) > docker-compose.minimal.yml

echo ✅ Docker configuration created

:: Create Vite config
echo 🔧 Creating configuration files...
(
echo import { defineConfig } from 'vite'
echo import react from '@vitejs/plugin-react'
echo.
echo export default defineConfig({
echo   plugins: [react()],
echo   server: {
echo     port: 5173,
echo     host: true
echo   }
echo })
) > vite.config.ts

:: Create index.html
(
echo ^<!doctype html^>
echo ^<html lang="en"^>
echo   ^<head^>
echo     ^<meta charset="UTF-8" /^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>
echo     ^<title^>Legal Case Management AI^</title^>
echo   ^</head^>
echo   ^<body^>
echo     ^<div id="root"^>^</div^>
echo     ^<script type="module" src="/src/index.tsx"^>^</script^>
echo   ^</body^>
echo ^</html^>
) > index.html

:: Create directories
mkdir src\components src\utils src\hooks uploads public >nul 2>&1

:: Create startup script
echo 🔧 Creating startup scripts...
(
echo @echo off
echo echo 🚀 Starting Legal Case Management AI System...
echo echo 🤖 Starting AI services...
echo docker compose -f docker-compose.minimal.yml up -d
echo echo ⏳ Waiting for services to start...
echo timeout /t 5 /nobreak ^> nul
echo echo 🌐 Starting web application...
echo npm run dev
) > start.bat

:: Create model installer
(
echo @echo off
echo echo 📥 Installing AI models for Legal Case Management...
echo echo This will download several GB of data and may take 10-30 minutes.
echo docker compose -f docker-compose.minimal.yml up -d ollama
echo echo ⏳ Waiting for Ollama to start...
echo timeout /t 10 /nobreak ^> nul
echo echo 📥 Pulling embedding model...
echo docker exec legal-ai-ollama ollama pull nomic-embed-text:latest
echo echo 📥 Pulling small language model...
echo docker exec legal-ai-ollama ollama pull llama3.2:1b
echo echo 📥 Pulling medium language model...
echo docker exec legal-ai-ollama ollama pull llama3.2:3b
echo echo ✅ AI models installation completed!
echo pause
) > install-models.bat

echo ✅ Startup scripts created

:: Install dependencies
echo 🔧 Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed

:: Setup Docker services
echo 🔧 Setting up AI services...
echo 📥 Pulling Docker images...
docker compose -f docker-compose.minimal.yml pull
if errorlevel 1 (
    echo ❌ Failed to pull Docker images
    pause
    exit /b 1
)

echo 🚀 Starting AI services...
docker compose -f docker-compose.minimal.yml up -d

echo ✅ AI services are starting up

:: Create README
echo 🔧 Creating documentation...
(
echo # Legal Case Management AI System
echo.
echo ## Quick Start
echo.
echo 1. Run `start.bat` to start the system
echo 2. Open http://localhost:5173 in your browser
echo 3. Create your first case and upload documents
echo.
echo ## Commands
echo.
echo - `start.bat` - Start the complete system
echo - `install-models.bat` - Install AI models
echo - `npm run ai` - Start AI services only
echo - `npm run ai-stop` - Stop AI services
echo.
echo ## Access Points
echo.
echo - Main App: http://localhost:5173
echo - AI Interface: http://localhost:3002
echo.
echo ## Requirements
echo.
echo - Docker Desktop (running)
echo - Node.js v18+
echo - 8GB+ RAM
echo - 10GB+ free disk space
echo.
echo ## Troubleshooting
echo.
echo If services won't start:
echo 1. Ensure Docker Desktop is running
echo 2. Run: npm run ai-stop
echo 3. Run: npm run ai
echo.
echo ## Security
echo.
echo All processing happens locally. No data is sent externally.
) > README.md

echo ✅ Documentation created

:: Create desktop shortcut
echo 🔧 Creating desktop shortcut...
powershell -Command "^
$WshShell = New-Object -comObject WScript.Shell; ^
$Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Legal AI System.lnk'); ^
$Shortcut.TargetPath = '%INSTALL_DIR%\start.bat'; ^
$Shortcut.WorkingDirectory = '%INSTALL_DIR%'; ^
$Shortcut.Description = 'Legal Case Management AI System'; ^
$Shortcut.Save()^
"

echo ✅ Desktop shortcut created

:: Installation complete
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║                 🎉 INSTALLATION COMPLETE! 🎉                     ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.
echo 📋 Next Steps:
echo    1. Install AI models: install-models.bat
echo    2. Start the system:  start.bat
echo    3. Open your browser:  http://localhost:5173
echo.
echo 📍 Installation Location: %INSTALL_DIR%
echo 🖥️  Desktop Shortcut: "Legal AI System" on your desktop
echo.
echo ⚠️  Important:
echo    - First startup will download AI models (5-10GB)
echo    - Ensure Docker Desktop is running before starting
echo    - Keep at least 10GB free disk space
echo.
echo 🚀 Your Legal AI System is ready to use!
echo.
pause