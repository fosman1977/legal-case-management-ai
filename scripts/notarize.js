const { notarize } = require('@electron/notarize');

// This script notarizes the macOS app for distribution
module.exports = async function(context) {
  const { electronPlatformName, appOutDir } = context;
  
  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization - not building for macOS');
    return;
  }
  
  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;
  
  console.log('Notarizing macOS app...');
  
  try {
    await notarize({
      appBundleId: 'com.legalai.casemanager',
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
    
    console.log('Notarization completed successfully');
  } catch (error) {
    console.error('Notarization failed:', error);
    // Don't fail the build if notarization fails
    console.log('Continuing build despite notarization failure');
  }
};