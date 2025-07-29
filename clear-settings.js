// Run this in browser console to clear model settings
console.log('🧹 Clearing model settings...');

// Get all localStorage keys that contain security preferences
const keys = Object.keys(localStorage).filter(key => key.includes('security_prefs_'));
console.log(`Found ${keys.length} security preference keys:`, keys);

// Clear them
keys.forEach(key => {
    console.log(`Clearing ${key}`);
    localStorage.removeItem(key);
});

// Also clear any general settings
localStorage.removeItem('selectedModel');

console.log('✅ Settings cleared. Refresh the page to use default model (llama3.2:1b)');