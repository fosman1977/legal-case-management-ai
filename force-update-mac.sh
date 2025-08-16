#!/bin/bash

echo "🔄 Force Update Legal Case Manager AI to Latest Release"
echo "======================================================="

# Kill any running instances
echo "1. Closing any running instances..."
pkill -f "Legal Case Manager AI" 2>/dev/null || true

# Remove old app
echo "2. Removing old application..."
rm -rf "/Applications/Legal Case Manager AI.app" 2>/dev/null || true
rm -rf ~/Library/Application\ Support/legal-case-management-ai/Cache/* 2>/dev/null || true

# Download latest release
echo "3. Downloading latest release (v1.2.0)..."
cd ~/Downloads

# For Mac ARM64 (Apple Silicon)
if [[ $(uname -m) == 'arm64' ]]; then
    echo "   Detected Apple Silicon Mac..."
    curl -L https://github.com/fosman1977/legal-case-management-ai/releases/download/v1.2.0/Legal-Case-Manager-AI-1.0.0-arm64.dmg -o LegalCaseManager.dmg
else
    echo "   Detected Intel Mac..."
    curl -L https://github.com/fosman1977/legal-case-management-ai/releases/download/v1.2.0/Legal-Case-Manager-AI-1.0.0.dmg -o LegalCaseManager.dmg
fi

# Mount and install
echo "4. Installing new version..."
hdiutil attach LegalCaseManager.dmg -nobrowse -quiet
cp -R "/Volumes/Legal Case Manager AI/Legal Case Manager AI.app" /Applications/
hdiutil detach "/Volumes/Legal Case Manager AI" -quiet

# Clean up
rm LegalCaseManager.dmg

# Fix permissions
echo "5. Fixing permissions..."
xattr -cr "/Applications/Legal Case Manager AI.app"
chmod +x "/Applications/Legal Case Manager AI.app/Contents/MacOS/Legal Case Manager AI"

echo ""
echo "✅ Update complete! You can now open the app from Applications."
echo ""
echo "To open the app:"
echo "  1. Go to Applications folder"
echo "  2. Right-click 'Legal Case Manager AI'"
echo "  3. Select 'Open'"
echo "  4. Click 'Open' when macOS asks for confirmation"