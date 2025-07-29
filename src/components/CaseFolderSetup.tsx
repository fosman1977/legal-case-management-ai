import React, { useState, useEffect } from 'react';
import { fileSystemManager } from '../utils/fileSystemManager';

interface CaseFolderSetupProps {
  caseId: string;
  caseTitle: string;
  onFolderSelected?: () => void;
}

export const CaseFolderSetup: React.FC<CaseFolderSetupProps> = ({ 
  caseId, 
  caseTitle, 
  onFolderSelected 
}) => {
  const [hasFolder, setHasFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    checkFolderStatus();
  }, [caseId]);

  const checkFolderStatus = () => {
    setIsSupported(fileSystemManager.isSupported());
    setHasFolder(fileSystemManager.hasCaseFolder(caseId));
    setFolderName(fileSystemManager.getCaseFolderName(caseId));
  };

  const handleSelectFolder = async () => {
    setIsSelecting(true);
    try {
      const success = await fileSystemManager.selectCaseFolder(caseId, caseTitle);
      if (success) {
        checkFolderStatus();
        onFolderSelected?.();
      }
    } finally {
      setIsSelecting(false);
    }
  };

  const handleResetFolder = () => {
    if (window.confirm(`This will unlink the OneDrive folder for "${caseTitle}". You will need to select the folder again to sync documents. Continue?`)) {
      fileSystemManager.removeCaseFolder(caseId);
      checkFolderStatus();
    }
  };

  if (!isSupported) {
    return (
      <div className="case-folder-setup unsupported">
        <div className="folder-card">
          <div className="folder-header">
            <h4>📁 OneDrive Folder Sync</h4>
            <div className="status-badge error">❌ Not Supported</div>
          </div>
          <p>
            File System Access API is not supported in this browser. 
            Please use Chrome, Edge, or another Chromium-based browser to sync with OneDrive folders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="case-folder-setup">
      <div className="folder-card">
        <div className="folder-header">
          <h4>📁 OneDrive Folder for "{caseTitle}"</h4>
          <div className={`status-badge ${hasFolder ? 'success' : 'pending'}`}>
            {hasFolder ? '✅ Connected' : '⏳ Not Connected'}
          </div>
        </div>

        {hasFolder ? (
          <div className="folder-connected">
            <div className="folder-info">
              <p><strong>📂 Linked Folder:</strong> {folderName}</p>
              <p className="folder-description">
                Documents will sync between this app and your OneDrive folder. 
                Any files you add to the folder will appear in the case documents.
              </p>
            </div>
            <div className="folder-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleSelectFolder}
                disabled={isSelecting}
              >
                {isSelecting ? '⏳ Selecting...' : '🔄 Change Folder'}
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleResetFolder}
              >
                🗑️ Unlink Folder
              </button>
            </div>
          </div>
        ) : (
          <div className="folder-setup">
            <p className="setup-description">
              Connect this case to an OneDrive folder to automatically sync documents. 
              This allows you to:
            </p>
            <ul className="benefits-list">
              <li>📄 Access documents across all your devices</li>
              <li>🔄 Automatically sync new files</li>
              <li>👥 Share folders with colleagues</li>
              <li>💾 Keep documents backed up in the cloud</li>
            </ul>
            <button 
              className="btn btn-primary folder-select-btn"
              onClick={handleSelectFolder}
              disabled={isSelecting}
            >
              {isSelecting ? '⏳ Selecting Folder...' : '📁 Select OneDrive Folder'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .case-folder-setup {
          margin: 20px 0;
        }

        .folder-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .folder-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .folder-header h4 {
          margin: 0;
          color: #495057;
          font-size: 16px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.success {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.error {
          background: #f8d7da;
          color: #721c24;
        }

        .folder-connected .folder-info {
          margin-bottom: 16px;
        }

        .folder-info p {
          margin: 8px 0;
          color: #495057;
        }

        .folder-description {
          font-size: 14px;
          color: #6c757d;
        }

        .folder-actions {
          display: flex;
          gap: 12px;
        }

        .setup-description {
          color: #495057;
          margin-bottom: 16px;
        }

        .benefits-list {
          margin: 16px 0;
          padding-left: 20px;
          color: #6c757d;
        }

        .benefits-list li {
          margin: 8px 0;
        }

        .folder-select-btn {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          margin-top: 16px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #c82333;
        }

        .unsupported .folder-card {
          background: #f8f9fa;
          border-color: #e9ecef;
        }
      `}</style>
    </div>
  );
};