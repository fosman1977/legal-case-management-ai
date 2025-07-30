#!/bin/bash

# Fix Electron port in package.json
cd /Users/faisalosman/Documents/legal-case-management

# Update the electron-dev script to use port 5173
sed -i '' 's/"wait-on http:\/\/localhost:5174/"wait-on http:\/\/localhost:5173/g' package.json

echo "✅ Updated package.json to use port 5173"
echo "📋 Now run: npm run electron-dev"