# Legal Case Manager - Electron Desktop App

## Quick Start

### 1. Install Dependencies (if not already done)
```bash
npm install
```

### 2. Run in Development Mode
```bash
# Option 1: Run web version first, then Electron
npm run dev
# In another terminal:
npm run electron

# Option 2: Run both together
npm run electron-dev
```

### 3. Build Desktop App
```bash
# Build for your platform
npm run dist

# Or use the custom build script
node build-electron.js
```

## What Changed

### ✅ No More CORS Issues
- Electron apps can directly access localhost services
- No need for proxy servers or browser security workarounds

### ✅ Desktop App Features
- **Native file system access** - Better document handling
- **Menu bar integration** - Professional desktop experience
- **Keyboard shortcuts** - Cmd/Ctrl+N for new case, etc.
- **Window management** - Proper desktop window behavior
- **Auto-updater ready** - Can add automatic updates later

### ✅ Menu Actions Available
- `File > New Case` - Create new case
- `File > Open Case Folder` - Browse case files
- `AI > Analyze Current Case` - Quick AI analysis
- `AI > Extract Chronology` - Extract timeline
- `AI > Find Legal Authorities` - Find case law

### ✅ Better Security
- **Local data only** - No cloud dependencies
- **Native file access** - Direct document processing
- **Isolated environment** - Electron security model

## Development Workflow

1. **Web development**: Use `npm run dev` for fastest iteration
2. **Desktop testing**: Use `npm run electron-dev` to test Electron features
3. **Production build**: Use `npm run dist` to create installer

## File Structure
```
/electron/
  ├── main.ts      # Main Electron process
  └── preload.ts   # Secure bridge to renderer

/dist-electron/    # Compiled Electron files
/dist-electron-final/ # Final app installers
```

## Next Steps
- ✅ Test the Electron app
- 🔄 Add file associations (.case files)
- 📱 Add system notifications
- 🔄 Add auto-updater
- 🎨 Add custom app icon