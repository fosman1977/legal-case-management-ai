const { build } = require('electron-builder');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function buildElectron() {
  console.log('🔨 Building Legal Case Manager...');
  
  try {
    // Step 1: Build React app
    console.log('📦 Building React app...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Step 2: Compile TypeScript for Electron
    console.log('⚙️ Compiling Electron TypeScript...');
    
    // Create dist-electron directory
    if (!fs.existsSync('dist-electron')) {
      fs.mkdirSync('dist-electron');
    }
    
    // Compile TypeScript files
    execSync('npx tsc electron/main.ts --outDir dist-electron --target es2020 --module commonjs --esModuleInterop --skipLibCheck', 
      { stdio: 'inherit' });
    execSync('npx tsc electron/preload.ts --outDir dist-electron --target es2020 --module commonjs --esModuleInterop --skipLibCheck', 
      { stdio: 'inherit' });
    
    // Step 3: Build Electron app
    console.log('🚀 Building Electron app...');
    await build({
      config: {
        appId: 'com.legalcasemanager.app',
        productName: 'Legal Case Manager',
        directories: {
          output: 'dist-electron-final'
        },
        files: [
          'dist/**/*',
          'dist-electron/**/*',
          'node_modules/**/*',
          'package.json'
        ],
        mac: {
          category: 'public.app-category.productivity',
          target: 'dmg'
        },
        win: {
          target: 'nsis'
        },
        linux: {
          target: 'AppImage'
        }
      }
    });
    
    console.log('✅ Build completed successfully!');
    console.log('📁 Output files are in dist-electron-final/');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildElectron();