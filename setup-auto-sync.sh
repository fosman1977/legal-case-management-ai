#!/bin/bash

echo "🔄 Setting up Auto-Sync Between Development Environment and Your Device..."

# Create the auto-sync configuration
cat > legal-case-management-ai-export/sync-config.sh << 'EOF'
#!/bin/bash

# Auto-sync configuration for Legal Case Management AI
# This script helps sync changes between development environment and local device

REPO_URL="https://github.com/YOUR-USERNAME/legal-case-management-ai.git"
LOCAL_PATH="$HOME/Documents/legal-case-management"

setup_sync() {
    echo "🔧 Setting up auto-sync..."
    
    # Create local directory if it doesn't exist
    mkdir -p "$LOCAL_PATH"
    cd "$LOCAL_PATH"
    
    # Initialize git if not already done
    if [ ! -d ".git" ]; then
        echo "📥 Cloning repository..."
        git clone "$REPO_URL" .
    else
        echo "🔄 Repository already exists, pulling latest changes..."
        git pull origin main
    fi
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    echo "✅ Auto-sync setup complete!"
}

sync_changes() {
    echo "🔄 Syncing latest changes..."
    cd "$LOCAL_PATH"
    
    # Pull latest changes
    git pull origin main
    
    # Install any new dependencies
    npm install
    
    echo "✅ Sync complete!"
    echo "🚀 Run 'npm run electron-dev' to start the application"
}

watch_changes() {
    echo "👀 Starting auto-sync watcher..."
    echo "This will check for updates every 30 seconds..."
    echo "Press Ctrl+C to stop"
    
    while true; do
        cd "$LOCAL_PATH"
        
        # Check if there are remote changes
        git fetch origin
        LOCAL=$(git rev-parse HEAD)
        REMOTE=$(git rev-parse origin/main)
        
        if [ "$LOCAL" != "$REMOTE" ]; then
            echo "📥 New changes detected, syncing..."
            sync_changes
            
            # Notify user (macOS)
            if command -v osascript &> /dev/null; then
                osascript -e 'display notification "Legal AI system updated!" with title "Auto-Sync"'
            fi
        fi
        
        sleep 30
    done
}

case "$1" in
    "setup")
        setup_sync
        ;;
    "sync")
        sync_changes
        ;;
    "watch")
        watch_changes
        ;;
    *)
        echo "Legal Case Management AI - Auto-Sync Tool"
        echo ""
        echo "Usage:"
        echo "  $0 setup     # Initial setup and clone repository"
        echo "  $0 sync      # Sync latest changes once"
        echo "  $0 watch     # Start auto-sync watcher (checks every 30s)"
        echo ""
        echo "Examples:"
        echo "  $0 setup                    # First time setup"
        echo "  $0 sync                     # Get latest updates"
        echo "  $0 watch                    # Auto-sync in background"
        ;;
esac
EOF

chmod +x legal-case-management-ai-export/sync-config.sh

# Create a deployment script for GitHub
cat > legal-case-management-ai-export/deploy-to-github.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying Legal Case Management AI to GitHub..."

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "📱 GitHub CLI detected, creating repository..."
    
    # Create repository using GitHub CLI
    gh repo create legal-case-management-ai --public --description "Professional AI-powered legal case management desktop application" --clone=false
    
    REPO_URL="https://github.com/$(gh auth status | grep "Logged in" | awk '{print $7}' | sed 's/[()]//g')/legal-case-management-ai.git"
else
    echo "📝 Please create a GitHub repository manually:"
    echo "1. Go to: https://github.com/new"
    echo "2. Repository name: legal-case-management-ai"
    echo "3. Description: Professional AI-powered legal case management desktop application"
    echo "4. Make it public (recommended)"
    echo "5. Don't initialize with README (we have one)"
    echo ""
    read -p "Enter your GitHub username: " USERNAME
    REPO_URL="https://github.com/$USERNAME/legal-case-management-ai.git"
fi

# Initialize git and push
echo "📤 Initializing git repository..."
git init
git add .
git commit -m "🎉 Complete Legal Case Management AI System

Features included:
✅ Professional case management with document upload
✅ AI-powered entity extraction and document analysis
✅ User notes with audio/video recording and transcription
✅ Court orders with automatic deadline extraction  
✅ Global procedural calendar showing all deadlines
✅ OpenWebUI integration for AI chat and analysis
✅ Electron desktop application
✅ Responsive professional UI
✅ Docker configuration for AI services
✅ Automated GitHub Actions builds

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git branch -M main
git remote add origin "$REPO_URL"

echo "📤 Pushing to GitHub..."
git push -u origin main

echo ""
echo "🎉 SUCCESS! Your Legal Case Management AI is now on GitHub!"
echo ""
echo "🔗 Repository URL: $REPO_URL"
echo ""
echo "🚀 Next steps for your device:"
echo "1. On your Mac, run these commands:"
echo "   cd ~/Documents"
echo "   git clone $REPO_URL"
echo "   cd legal-case-management-ai"
echo "   ./install.sh"
echo ""
echo "🔄 For auto-sync, run:"
echo "   ./sync-config.sh setup     # One-time setup"
echo "   ./sync-config.sh watch     # Start auto-sync"
echo ""
echo "✨ Your complete legal AI system is ready!"
EOF

chmod +x legal-case-management-ai-export/deploy-to-github.sh

# Create a final comprehensive installation guide
cat > legal-case-management-ai-export/DEVICE_SETUP.md << 'EOF'
# Legal Case Management AI - Device Setup Guide

Complete setup instructions for your Mac device.

## Method 1: Automatic Setup (Recommended)

### Step 1: Deploy to GitHub
```bash
cd /path/to/legal-case-management-ai-export
./deploy-to-github.sh
```

### Step 2: Setup on Your Mac
```bash
cd ~/Documents
git clone https://github.com/YOUR-USERNAME/legal-case-management-ai.git
cd legal-case-management-ai
./install.sh
```

### Step 3: Start Application
```bash
npm run electron-dev
```

### Step 4: Enable Auto-Sync (Optional)
```bash
./sync-config.sh setup
./sync-config.sh watch
```

## Method 2: Manual Setup

### Download and Extract
1. Go to your GitHub repository
2. Click "Code" → "Download ZIP"
3. Extract to `~/Documents/legal-case-management-ai/`

### Install
```bash
cd ~/Documents/legal-case-management-ai
npm install
npm run build
npm run electron-dev
```

## AI Features Setup

### Start AI Services
```bash
npm run ai
```

### Access AI Chat
Open: http://localhost:3002

### Install AI Models (Optional)
The system will download models automatically when first used.

## Features Available

✅ **Case Management** - Professional case organization
✅ **Document Analysis** - AI-powered document processing  
✅ **Audio/Video Notes** - Client meeting recordings with transcription
✅ **Court Orders** - Automatic deadline extraction
✅ **Global Calendar** - All deadlines in one view
✅ **AI Chat** - Document analysis and legal research
✅ **Desktop App** - Native macOS application

## Troubleshooting

### Port Issues
If port 5173 is in use:
```bash
lsof -ti:5173 | xargs kill -9
```

### Docker Issues
```bash
docker system prune -a
npm run ai
```

### Auto-Sync Not Working
```bash
./sync-config.sh setup
```

## Development Sync

To keep your local version updated with changes made in the development environment:

1. **One-time sync**: `./sync-config.sh sync`
2. **Auto-sync**: `./sync-config.sh watch` (runs in background)
3. **Manual check**: `git pull origin main`

## Support

- Check logs: `npm run ai-logs`  
- Restart services: `npm run ai-stop && npm run ai`
- Rebuild app: `npm run clean && npm install && npm run build`

---

🎉 **Your professional Legal Case Management AI system is ready!**

Made with ❤️ for legal professionals worldwide.
EOF

echo ""
echo "🎉 AUTO-SYNC SETUP COMPLETE!"
echo ""
echo "📋 What's been created:"
echo "✅ Complete GitHub-ready project package"
echo "✅ Auto-sync configuration script"  
echo "✅ GitHub deployment script"
echo "✅ Comprehensive device setup guide"
echo ""
echo "🚀 Next steps:"
echo "1. Deploy to GitHub:"
echo "   cd legal-case-management-ai-export"
echo "   ./deploy-to-github.sh"
echo ""
echo "2. Setup on your Mac:"
echo "   cd ~/Documents"
echo "   git clone https://github.com/YOUR-USERNAME/legal-case-management-ai.git"
echo "   cd legal-case-management-ai"
echo "   ./install.sh"
echo ""
echo "3. Enable auto-sync:"
echo "   ./sync-config.sh setup"
echo "   ./sync-config.sh watch"
echo ""
echo "🌟 Your complete Legal AI system will automatically sync any changes!"
echo "📖 See DEVICE_SETUP.md for detailed instructions"