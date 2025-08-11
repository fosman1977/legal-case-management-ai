import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X, CheckCircle } from 'lucide-react';

interface UpdateNotificationProps {
  onClose: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onClose }) => {
  const [updateStatus, setUpdateStatus] = useState<'checking' | 'available' | 'downloading' | 'ready' | 'none'>('none');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateVersion, setUpdateVersion] = useState<string>('');

  useEffect(() => {
    // Listen for update events
    // @ts-ignore - Electron IPC
    if (window.electronAPI?.on) {
      // @ts-ignore - Electron IPC
      window.electronAPI.on('update-available', (event: any, info: any) => {
        setUpdateStatus('available');
        setUpdateVersion(info.version);
      });

      // @ts-ignore - Electron IPC
      window.electronAPI.on('download-progress', (event: any, progress: any) => {
        setUpdateStatus('downloading');
        setDownloadProgress(Math.round(progress.percent));
      });

      // @ts-ignore - Electron IPC
      window.electronAPI.on('update-downloaded', () => {
        setUpdateStatus('ready');
      });
    }

    return () => {
      // @ts-ignore - Electron IPC
      if (window.electronAPI?.removeAllListeners) {
        // @ts-ignore - Electron IPC
        window.electronAPI.removeAllListeners('update-available');
        // @ts-ignore - Electron IPC
        window.electronAPI.removeAllListeners('download-progress');
        // @ts-ignore - Electron IPC
        window.electronAPI.removeAllListeners('update-downloaded');
      }
    };
  }, []);

  const checkForUpdates = async () => {
    setUpdateStatus('checking');
    try {
      // @ts-ignore - Electron IPC
      await window.electronAPI?.updater?.checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
      setUpdateStatus('none');
    }
  };

  const downloadUpdate = async () => {
    try {
      // @ts-ignore - Electron IPC
      await window.electronAPI?.updater?.downloadUpdate();
    } catch (error) {
      console.error('Failed to download update:', error);
    }
  };

  const installUpdate = async () => {
    try {
      // @ts-ignore - Electron IPC
      await window.electronAPI?.updater?.quitAndInstall();
    } catch (error) {
      console.error('Failed to install update:', error);
    }
  };

  const renderContent = () => {
    switch (updateStatus) {
      case 'checking':
        return (
          <div className="update-content">
            <div className="update-icon">
              <RefreshCw className="spinning" />
            </div>
            <h3>Checking for Updates</h3>
            <p>Looking for the latest version...</p>
          </div>
        );

      case 'available':
        return (
          <div className="update-content">
            <div className="update-icon">
              <Download />
            </div>
            <h3>Update Available</h3>
            <p>Version {updateVersion} is ready to download.</p>
            <div className="update-actions">
              <button className="btn btn-primary" onClick={downloadUpdate}>
                Download Update
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Later
              </button>
            </div>
          </div>
        );

      case 'downloading':
        return (
          <div className="update-content">
            <div className="update-icon">
              <Download />
            </div>
            <h3>Downloading Update</h3>
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">{downloadProgress}%</div>
            </div>
            <p>Please wait while the update is downloaded...</p>
          </div>
        );

      case 'ready':
        return (
          <div className="update-content">
            <div className="update-icon success">
              <CheckCircle />
            </div>
            <h3>Update Ready</h3>
            <p>The update has been downloaded and is ready to install.</p>
            <div className="update-actions">
              <button className="btn btn-primary" onClick={installUpdate}>
                Restart & Install
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Install Later
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="update-content">
            <div className="update-icon">
              <RefreshCw />
            </div>
            <h3>Check for Updates</h3>
            <p>Keep your Legal Case Manager AI up to date with the latest features and improvements.</p>
            <div className="update-actions">
              <button className="btn btn-primary" onClick={checkForUpdates}>
                Check Now
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="update-notification-overlay">
      <div className="update-notification">
        <div className="update-header">
          <h2>App Updates</h2>
          <button className="close-button" onClick={onClose}>
            <X />
          </button>
        </div>
        
        {renderContent()}
      </div>
      
      <style jsx>{`
        .update-notification-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .update-notification {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          overflow: hidden;
        }

        .update-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e0e0e0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .update-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: white;
          padding: 4px;
          opacity: 0.8;
        }

        .close-button:hover {
          opacity: 1;
        }

        .update-content {
          padding: 32px 24px;
          text-align: center;
        }

        .update-icon {
          margin: 0 auto 20px;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f0f4ff;
          color: #667eea;
        }

        .update-icon.success {
          background: #dcfce7;
          color: #16a34a;
        }

        .update-icon svg {
          width: 32px;
          height: 32px;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .update-content h3 {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 24px;
        }

        .update-content p {
          margin: 0 0 24px 0;
          color: #666;
          line-height: 1.6;
        }

        .progress-container {
          margin: 20px 0;
        }

        .progress-bar {
          background: #e0e0e0;
          border-radius: 8px;
          height: 8px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          background: linear-gradient(90deg, #667eea, #764ba2);
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-weight: 600;
          color: #333;
        }

        .update-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
};