// Run this in the DevTools Console of your app

async function checkUpdateStatus() {
  console.log('🔍 Checking for updates...');
  
  try {
    const result = await window.electronAPI.updater.checkForUpdates();
    console.log('✅ Update check complete:', result);
    
    if (result) {
      console.log('📦 Update available! Downloading...');
      // If update is available, it should auto-prompt you
    } else {
      console.log('✅ You have the latest version');
    }
  } catch (error) {
    console.error('❌ Update check failed:', error);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Try again in a few seconds');
    console.log('3. Check GitHub releases: https://github.com/fosman1977/legal-case-management-ai/releases');
  }
}

// Also check the current app version
console.log('Current app version:', window.electronAPI?.appVersion || 'Unknown');

// Run the check
checkUpdateStatus();