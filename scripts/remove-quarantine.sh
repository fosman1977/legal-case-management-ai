#!/bin/bash

# Remove macOS quarantine attributes from the app
# Run this after building the app

APP_PATH="release/mac/Legal Case Manager AI.app"

if [ -d "$APP_PATH" ]; then
    echo "🔓 Removing quarantine flags from $APP_PATH"
    sudo xattr -rd com.apple.quarantine "$APP_PATH"
    echo "✅ Quarantine flags removed"
    
    # Verify removal
    if xattr -l "$APP_PATH" | grep -q quarantine; then
        echo "❌ Quarantine flags still present"
        exit 1
    else
        echo "✅ App is no longer quarantined"
    fi
else
    echo "❌ App not found at $APP_PATH"
    echo "Run 'npm run dist:mac' first"
    exit 1
fi