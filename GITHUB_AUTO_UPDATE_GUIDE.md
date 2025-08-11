# 🔄 GitHub Auto-Update Setup Guide

Your Legal Case Manager AI now has **automatic updates directly from GitHub releases**! Users will receive seamless updates without manual downloads.

## ✅ What's Been Implemented

### 🤖 **Auto-Updater Integration**
- ✅ Built-in `electron-updater` with GitHub provider
- ✅ Automatic update checks every 6 hours
- ✅ User-controlled download and installation
- ✅ Progress indicators and notifications
- ✅ Secure cryptographic verification

### 🏗️ **GitHub Actions Workflow**
- ✅ Multi-platform builds (Windows, macOS, Linux)
- ✅ Automatic release creation
- ✅ Code signing support
- ✅ Asset upload to GitHub releases

### 📱 **Update Notification UI**
- ✅ Beautiful update notification component
- ✅ Download progress tracking
- ✅ User-friendly install process
- ✅ Non-intrusive update prompts

## 🚀 How It Works

### For Users
1. **Automatic Check**: App checks for updates every 6 hours
2. **Notification**: User sees a friendly update notification
3. **Download**: User clicks to download the update
4. **Install**: App restarts and applies the update automatically
5. **Done**: User has the latest version seamlessly

### For Developers
1. **Tag Release**: Create a git tag (e.g., `v1.2.0`)
2. **Auto-Build**: GitHub Actions builds all platforms
3. **Auto-Release**: Creates GitHub release with installers
4. **Auto-Notify**: All users get update notifications

## 📋 Setup Instructions

### 1. Repository Configuration

Your repository already has the correct configuration in `package.json`:
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "fosman1977",
      "repo": "legal-case-management-ai",
      "releaseType": "release"
    }
  }
}
```

### 2. GitHub Secrets (Optional)

For enhanced security and macOS code signing, add these secrets:

#### Repository Secrets:
```
APPLE_ID=your.apple.id@email.com
APPLE_ID_PASSWORD=app-specific-password  
APPLE_TEAM_ID=your-team-id
APPLE_CERTIFICATE=base64-encoded-certificate
APPLE_CERTIFICATE_PASSWORD=certificate-password
```

### 3. Create a Release

#### Option A: Command Line
```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0
```

#### Option B: GitHub Web Interface
1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Enter tag version (e.g., `v1.0.0`)
4. Click "Publish release"

#### Option C: GitHub Actions Manual Trigger
1. Go to "Actions" tab in your repository
2. Select "Build and Release" workflow
3. Click "Run workflow"
4. Enter version (e.g., `v1.0.0`)

### 4. Verify Auto-Update

After releasing:
1. **Check Release**: Verify all platform binaries are uploaded
2. **Test Update**: Install older version and test update process
3. **Monitor Logs**: Check auto-updater logs in app

## 📦 Release Artifacts

Each release automatically includes:

### Windows
- **Installer** (`Legal-Case-Manager-AI-Setup-1.0.0.exe`)
- **Portable** (`Legal-Case-Manager-AI-1.0.0-portable.exe`)

### macOS  
- **DMG** (`Legal-Case-Manager-AI-1.0.0.dmg`)
- **ZIP** (`Legal-Case-Manager-AI-1.0.0-mac.zip`)

### Linux
- **AppImage** (`Legal-Case-Manager-AI-1.0.0.AppImage`)
- **DEB** (`legal-case-manager-ai_1.0.0_amd64.deb`)

## 🔒 Security Features

### Code Signing
- **Windows**: Authenticode signing (configurable)
- **macOS**: Developer ID + Notarization
- **Linux**: No signing (AppImage/DEB standards)

### Update Verification
- **Cryptographic**: SHA-256 checksums
- **Signature**: Code signature verification
- **HTTPS**: Secure downloads from GitHub

### Privacy
- **No Telemetry**: No tracking or analytics
- **Local Processing**: All update logic is local
- **User Control**: User decides when to update

## ⚙️ Configuration Options

### Update Frequency
Currently set to check every 6 hours. To modify:

```typescript
// In electron/main.ts
setInterval(() => {
  autoUpdater.checkForUpdatesAndNotify();
}, 6 * 60 * 60 * 1000); // Change this interval
```

### Auto-Download
Currently disabled (user consent required). To enable:

```typescript
// In electron/main.ts
autoUpdater.autoDownload = true; // Change to true
```

### Update Channels
Support for beta/alpha channels:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "releaseType": "prerelease" // For beta releases
    }
  }
}
```

## 🎯 Best Practices

### Version Numbering
Use semantic versioning:
- `v1.0.0` - Major release
- `v1.1.0` - Minor update
- `v1.0.1` - Bug fix/patch

### Release Notes
GitHub Actions automatically generates release notes. For custom notes:

1. Edit the generated release on GitHub
2. Add detailed changelog
3. Highlight important changes

### Testing Updates
1. **Build Locally**: Test electron-builder works
2. **Create Draft**: Use draft releases for testing
3. **Beta Testing**: Use pre-release tags for beta versions

## 🔧 Troubleshooting

### Build Failures
- **Check Logs**: Review GitHub Actions logs
- **Dependencies**: Ensure all dependencies are installed
- **Secrets**: Verify required secrets are set

### Update Failures
- **Network**: Check internet connectivity
- **Permissions**: Verify write permissions
- **Firewall**: Ensure GitHub access is allowed

### Platform Issues
- **Windows**: May require admin rights for system-wide install
- **macOS**: Requires trusted developer certificate
- **Linux**: AppImage needs execute permissions

## 📈 Usage Analytics

### Update Metrics (Optional)
Track update adoption (privacy-conscious):

```typescript
// Log successful updates locally
console.log('Update completed:', new Date().toISOString());
```

### Error Reporting
Built-in error logging for troubleshooting:

```typescript
autoUpdater.on('error', (error) => {
  console.error('Auto-updater error:', error);
  // Log to local file for debugging
});
```

## 🎉 Benefits for Users

### 🚀 **Seamless Experience**
- No manual downloads needed
- Always have latest features
- Security patches delivered automatically

### 🔒 **Enterprise Ready**
- Secure update mechanism
- User-controlled installation
- No forced updates

### 📱 **Professional Polish**
- Native update notifications
- Progress indicators
- Graceful error handling

## 🎯 Next Steps

1. **Create First Release**: Tag and release v1.0.0
2. **Test Update Flow**: Install v1.0.0, then release v1.0.1
3. **Monitor Adoption**: Check release download statistics
4. **Iterate**: Improve based on user feedback

Your Legal Case Manager AI now has **enterprise-grade auto-update functionality** that keeps all users on the latest version automatically! 🚀

---
*Generated with [Claude Code](https://claude.ai/code)*