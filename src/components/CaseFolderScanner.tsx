import React, { useState } from 'react';
import { CaseDocument } from '../types';
import { caseFolderScanner, ScannedFile, FileTags } from '../utils/caseFolderScanner';

interface CaseFolderScannerProps {
  caseId: string;
  caseTitle: string;
  onDocumentsScanned: (documents: CaseDocument[]) => void;
}

export const CaseFolderScanner: React.FC<CaseFolderScannerProps> = ({
  caseId,
  caseTitle: _caseTitle, // Reserved for future use
  onDocumentsScanned
}) => {
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [tags, setTags] = useState<FileTags>({});
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, currentFile: '' });

  const handleSelectFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('File System Access API is not supported. Please use Chrome, Edge, or another Chromium-based browser.');
        return;
      }

      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });

      setFolderHandle(directoryHandle);
      setScannedFiles([]);
      setTags({});
      setScanComplete(false);
      
      console.log(`📁 Selected case folder: ${directoryHandle.name}`);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to select folder:', error);
        alert('Failed to select folder. Please try again.');
      }
    }
  };

  const handleScanFolder = async () => {
    if (!folderHandle) return;

    setIsScanning(true);
    setScanProgress({ current: 0, total: 0, currentFile: '' });
    
    try {
      // Scan all files in the folder with progress tracking
      const files = await caseFolderScanner.scanCaseFolder(
        folderHandle,
        (current, total, currentFile) => {
          setScanProgress({ current, total, currentFile });
        }
      );
      setScannedFiles(files);

      // Load existing tags
      const existingTags = await caseFolderScanner.loadTags(folderHandle);
      setTags(existingTags);

      setScanComplete(true);
      console.log(`📄 Found ${files.length} documents in case folder (including subfolders)`);
    } catch (error) {
      console.error('Failed to scan folder:', error);
      alert('Failed to scan folder. Please try again.');
    } finally {
      setIsScanning(false);
      setScanProgress({ current: 0, total: 0, currentFile: '' });
    }
  };

  const handleTagChange = (fileName: string, field: keyof FileTags[string], value: any) => {
    setTags(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [field]: value,
        manuallyTagged: true
      }
    }));
  };

  const handleProcessDocuments = async () => {
    if (!folderHandle || !scanComplete) {
      console.log('⚠️ Cannot process - missing folder handle or scan not complete');
      return;
    }

    setIsProcessing(true);
    try {
      console.log(`🔄 Processing ${scannedFiles.length} files with tags:`, tags);
      
      // Save tags to folder
      await caseFolderScanner.saveTags(folderHandle, tags);
      console.log('💾 Saved tags to folder');

      // Convert to document format
      const documents = await caseFolderScanner.convertToDocuments(scannedFiles, tags, caseId);
      console.log(`📄 Converted to ${documents.length} documents:`, documents.map(d => ({ id: d.id, title: d.title, category: d.category })));
      
      // Notify parent component
      console.log('📤 Calling onDocumentsScanned callback...');
      onDocumentsScanned(documents);
      
      console.log(`✅ Processed ${documents.length} documents from case folder`);
    } catch (error) {
      console.error('Failed to process documents:', error);
      alert('Failed to process documents. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getAvailableTypes = (category: string) => {
    switch (category) {
      case 'claimant':
      case 'defendant':
        return [
          { value: 'witness_statement', label: 'Witness Statement' },
          { value: 'exhibit', label: 'Exhibit' },
          { value: 'letter', label: 'Letter' },
          { value: 'memo', label: 'Memo' }
        ];
      case 'pleadings':
        return [
          { value: 'particulars', label: 'Particulars of Claim' },
          { value: 'defence', label: 'Defence' },
          { value: 'reply', label: 'Reply' },
          { value: 'skeleton_argument', label: 'Skeleton Argument' },
          { value: 'letter', label: 'Letter' }
        ];
      case 'hearing_bundle':
        return [
          { value: 'hearing_bundle', label: 'Hearing Bundle' },
          { value: 'memo', label: 'Memo' }
        ];
      case 'authorities':
        return [{ value: 'authorities', label: 'Legal Authorities' }];
      case 'orders_judgments':
        return [
          { value: 'order', label: 'Court Order' },
          { value: 'judgment', label: 'Judgment' },
          { value: 'ruling', label: 'Ruling' }
        ];
      default:
        return [{ value: 'exhibit', label: 'Exhibit' }];
    }
  };

  return (
    <div className="case-folder-scanner">
      <div className="scanner-header">
        <h3>📁 Case Folder Scanner</h3>
        <p>Select your existing OneDrive case folder to import all documents automatically.</p>
      </div>

      {!folderHandle ? (
        <div className="folder-selection">
          <div className="instruction-card">
            <h4>🎯 Instructions:</h4>
            <ol>
              <li>Make sure your case documents are in a OneDrive folder</li>
              <li>Click "Select Case Folder" below</li>
              <li>Choose the folder containing your case documents</li>
              <li>The app will scan and categorize all documents automatically</li>
            </ol>
          </div>
          
          <button 
            className="btn btn-primary btn-large"
            onClick={handleSelectFolder}
          >
            📁 Select Case Folder
          </button>
        </div>
      ) : (
        <div className="folder-selected">
          <div className="folder-info">
            <h4>✅ Selected Folder: <code>{folderHandle.name}</code></h4>
            <div className="folder-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleSelectFolder}
              >
                📁 Change Folder
              </button>
              
              {!scanComplete && (
                <button 
                  className="btn btn-primary"
                  onClick={handleScanFolder}
                  disabled={isScanning}
                >
                  {isScanning ? '🔍 Scanning...' : '🔍 Scan Documents'}
                </button>
              )}
            </div>
          </div>

          {isScanning && scanProgress.total > 0 && (
            <div className="scan-progress">
              <div className="progress-header">
                <h4>📂 Scanning Documents</h4>
                <p>Including all subfolders...</p>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                />
              </div>
              <div className="progress-details">
                <span className="progress-text">
                  {scanProgress.current} of {scanProgress.total} files processed
                </span>
                {scanProgress.currentFile && (
                  <span className="current-file">
                    📄 {scanProgress.currentFile.length > 50 
                      ? '...' + scanProgress.currentFile.slice(-47)
                      : scanProgress.currentFile
                    }
                  </span>
                )}
              </div>
            </div>
          )}

          {scanComplete && (
            <div className="scan-results">
              <div className="results-header">
                <h4>📄 Found {scannedFiles.length} Documents</h4>
                <p>Review the automatic categorization below and adjust as needed:</p>
              </div>

              <div className="document-list">
                {scannedFiles.map((file, index) => {
                  const tag = tags[file.name];
                  const category = tag?.category || file.suggestedCategory;
                  const type = tag?.type || file.suggestedType;
                  const confidence = tag?.manuallyTagged ? 'manual' : file.confidence;

                  return (
                    <div key={index} className="document-card">
                      <div className="document-header">
                        <div className="file-info">
                          <h5>{file.name}</h5>
                          <p className="file-meta">
                            {Math.round(file.size / 1024)}KB • {file.lastModified.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="confidence-badge" 
                             style={{ backgroundColor: caseFolderScanner.getConfidenceColor(confidence) }}>
                          {confidence === 'manual' ? 'Manual' : confidence}
                        </div>
                      </div>

                      <div className="document-tagging">
                        <div className="tag-row">
                          <div className="tag-field">
                            <label>Title:</label>
                            <input
                              type="text"
                              value={tag?.title || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}
                              onChange={(e) => handleTagChange(file.name, 'title', e.target.value)}
                              placeholder="Document title"
                            />
                          </div>
                        </div>

                        <div className="tag-row">
                          <div className="tag-field">
                            <label>Category:</label>
                            <select
                              value={category}
                              onChange={(e) => {
                                handleTagChange(file.name, 'category', e.target.value);
                                // Reset type to first available for new category
                                const availableTypes = getAvailableTypes(e.target.value);
                                if (availableTypes.length > 0) {
                                  handleTagChange(file.name, 'type', availableTypes[0].value);
                                }
                              }}
                            >
                              <option value="claimant">Claimant Documents</option>
                              <option value="defendant">Defendant Documents</option>
                              <option value="pleadings">Pleadings</option>
                              <option value="hearing_bundle">Hearing Bundle</option>
                              <option value="authorities">Authorities</option>
                              <option value="orders_judgments">Orders & Judgments</option>
                            </select>
                          </div>

                          <div className="tag-field">
                            <label>Type:</label>
                            <select
                              value={type}
                              onChange={(e) => handleTagChange(file.name, 'type', e.target.value)}
                            >
                              {getAvailableTypes(category).map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="tag-row">
                          <div className="tag-field">
                            <label>Page References:</label>
                            <input
                              type="text"
                              value={tag?.pageReferences || ''}
                              onChange={(e) => handleTagChange(file.name, 'pageReferences', e.target.value)}
                              placeholder="e.g., 1-10, 15, 20-25"
                            />
                          </div>
                        </div>

                        <div className="tag-row">
                          <div className="tag-field full-width">
                            <label>Notes:</label>
                            <textarea
                              value={tag?.notes || ''}
                              onChange={(e) => handleTagChange(file.name, 'notes', e.target.value)}
                              placeholder="Additional notes about this document"
                              rows={2}
                            />
                          </div>
                        </div>

                        {file.extractedText && (
                          <div className="text-preview">
                            <label>Text Preview:</label>
                            <p className="preview-text">{file.extractedText}...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="process-actions">
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleProcessDocuments}
                  disabled={isProcessing}
                >
                  {isProcessing ? '⏳ Processing...' : `✅ Import ${scannedFiles.length} Documents`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};