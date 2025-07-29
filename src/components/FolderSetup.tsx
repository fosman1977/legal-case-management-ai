import React, { useState, useEffect } from 'react';
import { fileSystemManager } from '../utils/fileSystemManager';

interface FolderSetupProps {
  onFolderSelected?: () => void;
}

export const FolderSetup: React.FC<FolderSetupProps> = ({ onFolderSelected }) => {
  const [hasFolder, setHasFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    checkFolderStatus();
  }, []);

  const checkFolderStatus = () => {
    setIsSupported(fileSystemManager.isSupported());
    setHasFolder(fileSystemManager.hasRootFolder());
    setFolderName(fileSystemManager.getRootFolderName());
  };

  const handleSelectFolder = async () => {
    setIsSelecting(true);
    try {
      const success = await fileSystemManager.selectRootFolder();
      if (success) {
        checkFolderStatus();
        onFolderSelected?.();
      }
    } finally {
      setIsSelecting(false);
    }
  };

  const handleResetFolder = () => {
    if (window.confirm('This will reset your folder selection. You will need to select your OneDrive folder again. Continue?')) {
      fileSystemManager.resetConfig();
      checkFolderStatus();
    }
  };

  if (!isSupported) {
    return (
      <div className="folder-setup unsupported">
        <div className="setup-card">
          <h3>🚫 Browser Not Supported</h3>
          <p>
            Your browser doesn't support direct folder access. Please use:
          </p>
          <ul>
            <li><strong>Chrome</strong> (recommended)</li>
            <li><strong>Microsoft Edge</strong></li>
            <li><strong>Other Chromium-based browsers</strong></li>
          </ul>
          <p>
            The app will continue to work with browser storage, but you won't be able to 
            sync files across machines via OneDrive.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="folder-setup">
      <div className="setup-card">
        <h3>📁 OneDrive Folder Setup</h3>
        
        {!hasFolder ? (
          <div className="no-folder">
            <p>
              Select your OneDrive folder to enable automatic syncing across all your machines.
            </p>
            
            <div className="setup-benefits">
              <h4>✨ Benefits:</h4>
              <ul>
                <li>🔄 <strong>Auto-sync</strong> across all your devices</li>
                <li>💾 <strong>No size limits</strong> for your legal documents</li>
                <li>🏠 <strong>Local speed</strong> with cloud backup</li>
                <li>📱 <strong>Access anywhere</strong> via OneDrive apps</li>
                <li>🔐 <strong>Secure</strong> - files stay in your OneDrive</li>
              </ul>
            </div>

            <div className="setup-instructions">
              <h4>📋 Recommended Setup:</h4>
              <ol>
                <li>Create a folder in your OneDrive: <code>LegalCases</code></li>
                <li>Click "Select OneDrive Folder" below</li>
                <li>Choose the <code>LegalCases</code> folder</li>
                <li>Start uploading your case documents!</li>
              </ol>
            </div>

            <button 
              className="btn btn-primary btn-large"
              onClick={handleSelectFolder}
              disabled={isSelecting}
            >
              {isSelecting ? '⏳ Selecting...' : '📁 Select OneDrive Folder'}
            </button>
          </div>
        ) : (
          <div className="folder-selected">
            <div className="status-success">
              <h4>✅ OneDrive Folder Connected</h4>
              <p>
                <strong>Selected folder:</strong> <code>{folderName}</code>
              </p>
              <p>
                Your documents will be saved to this folder and automatically synced 
                across all your machines via OneDrive.
              </p>
            </div>

            <div className="folder-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleSelectFolder}
                disabled={isSelecting}
              >
                {isSelecting ? '⏳ Selecting...' : '📁 Change Folder'}
              </button>
              
              <button 
                className="btn btn-danger"
                onClick={handleResetFolder}
              >
                🗑️ Reset Setup
              </button>
            </div>
          </div>
        )}

        <div className="setup-note">
          <p>
            <strong>💡 Note:</strong> Each browser session will ask you to reselect your folder 
            for security reasons. This is normal browser behavior.
          </p>
        </div>
      </div>
    </div>
  );
};