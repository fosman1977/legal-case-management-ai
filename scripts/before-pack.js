const fs = require('fs');
const path = require('path');

// This script runs before Electron Builder packs the app
module.exports = async function(context) {
  console.log('Running before-pack script...');
  
  // Ensure all required directories exist
  const appDir = context.appDir;
  const requiredDirs = [
    path.join(appDir, 'assets'),
    path.join(appDir, 'dist'),
    path.join(appDir, 'dist-electron')
  ];
  
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      console.log(`Creating missing directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Create placeholder assets if they don't exist
  const assetFiles = [
    { name: 'icon.png', content: 'placeholder for app icon' },
    { name: 'icon.ico', content: 'placeholder for Windows icon' },
    { name: 'icon.icns', content: 'placeholder for macOS icon' }
  ];
  
  for (const asset of assetFiles) {
    const assetPath = path.join(appDir, 'assets', asset.name);
    if (!fs.existsSync(assetPath)) {
      console.log(`Creating placeholder asset: ${asset.name}`);
      fs.writeFileSync(assetPath, asset.content);
    }
  }
  
  console.log('Before-pack script completed successfully');
};