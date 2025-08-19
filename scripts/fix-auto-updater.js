#!/usr/bin/env node
/**
 * Fix Auto-Updater Issues
 * Manually creates missing update metadata files for development/testing
 */

const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');
const version = packageJson.version;

console.log('🔧 Creating auto-updater metadata files for development...');

// Create latest-mac.yml
const latestMacYml = `version: ${version}
files:
  - url: Legal-Case-Manager-AI-${version}-mac.zip
    sha512: dev-build-no-checksum
    size: 100000000
  - url: Legal-Case-Manager-AI-${version}.dmg
    sha512: dev-build-no-checksum
    size: 100000000
path: Legal-Case-Manager-AI-${version}-mac.zip
sha512: dev-build-no-checksum
releaseDate: '${new Date().toISOString()}'
`;

// Create latest.yml (Windows)
const latestYml = `version: ${version}
files:
  - url: Legal-Case-Manager-AI-Setup-${version}.exe
    sha512: dev-build-no-checksum
    size: 100000000
path: Legal-Case-Manager-AI-Setup-${version}.exe
sha512: dev-build-no-checksum
releaseDate: '${new Date().toISOString()}'
`;

// Create latest-linux.yml
const latestLinuxYml = `version: ${version}
files:
  - url: Legal-Case-Manager-AI-${version}.AppImage
    sha512: dev-build-no-checksum
    size: 100000000
path: Legal-Case-Manager-AI-${version}.AppImage
sha512: dev-build-no-checksum
releaseDate: '${new Date().toISOString()}'
`;

// Ensure release directory exists
const releaseDir = path.join(__dirname, '../release');
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// Write files
fs.writeFileSync(path.join(releaseDir, 'latest-mac.yml'), latestMacYml);
fs.writeFileSync(path.join(releaseDir, 'latest.yml'), latestYml);
fs.writeFileSync(path.join(releaseDir, 'latest-linux.yml'), latestLinuxYml);

console.log('✅ Created auto-updater metadata files:');
console.log('  - latest-mac.yml');
console.log('  - latest.yml');
console.log('  - latest-linux.yml');
console.log('');
console.log('These files are for development only. Production builds will generate proper checksums.');