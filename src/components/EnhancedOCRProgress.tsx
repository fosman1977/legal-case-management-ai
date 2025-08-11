import React, { useState, useEffect } from 'react';

/**
 * Enhanced OCR Progress Component
 * Beautiful, detailed progress tracking for document extraction with OCR
 */

interface OCRProgressDetails {
  stage: 'initializing' | 'extracting' | 'ocr_processing' | 'entity_extraction' | 'table_detection' | 'finalizing' | 'completed' | 'error';
  progress: number;
  currentPage?: number;
  totalPages?: number;
  ocrPagesProcessed?: number;
  ocrPagesTotal?: number;
  ocrWorkersActive?: number;
  ocrWorkersTotal?: number;
  currentOperation?: string;
  textExtracted?: number;
  ocrTextExtracted?: number;
  tablesFound?: number;
  entitiesFound?: number;
  processingSpeed?: number; // pages per second
  estimatedTimeRemaining?: number; // seconds
  quality?: {
    textQuality: number;
    structureQuality: number;
    confidence: number;
  };
  error?: string;
  fileName?: string;
  fileSize?: number;
}

interface EnhancedOCRProgressProps {
  progress: OCRProgressDetails | null;
  onCancel?: () => void;
  showDetailedStats?: boolean;
}

export const EnhancedOCRProgress: React.FC<EnhancedOCRProgressProps> = ({
  progress,
  onCancel,
  showDetailedStats = true
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Animate progress changes
  useEffect(() => {
    if (progress) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress.progress);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress?.progress]);

  // Track elapsed time
  useEffect(() => {
    if (progress && progress.stage !== 'completed' && progress.stage !== 'error') {
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [progress?.stage]);

  if (!progress) return null;

  const getStageInfo = (stage: string) => {
    const stages = {
      initializing: { icon: '🚀', label: 'Initializing', color: '#6c757d' },
      extracting: { icon: '📄', label: 'Extracting Text', color: '#007bff' },
      ocr_processing: { icon: '🔍', label: 'OCR Processing', color: '#fd7e14' },
      entity_extraction: { icon: '🏷️', label: 'Finding Entities', color: '#20c997' },
      table_detection: { icon: '📊', label: 'Detecting Tables', color: '#6f42c1' },
      finalizing: { icon: '✨', label: 'Finalizing', color: '#17a2b8' },
      completed: { icon: '✅', label: 'Complete', color: '#28a745' },
      error: { icon: '❌', label: 'Error', color: '#dc3545' }
    };
    return stages[stage as keyof typeof stages] || stages.initializing;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const stageInfo = getStageInfo(progress.stage);
  const ocrProgress = progress.ocrPagesTotal ? 
    Math.round((progress.ocrPagesProcessed || 0) / progress.ocrPagesTotal * 100) : 0;

  return (
    <div className="enhanced-ocr-progress">
      {/* Header */}
      <div className="progress-header">
        <div className="title-section">
          <h3>
            <span className="stage-icon">{stageInfo.icon}</span>
            Document Processing
          </h3>
          {progress.fileName && (
            <div className="file-info">
              <span className="file-name">{progress.fileName}</span>
              {progress.fileSize && (
                <span className="file-size">({formatFileSize(progress.fileSize)})</span>
              )}
            </div>
          )}
        </div>
        <div className="time-info">
          <div className="elapsed-time">⏱️ {formatTime(timeElapsed)}</div>
          {progress.estimatedTimeRemaining && (
            <div className="eta">ETA: {formatTime(progress.estimatedTimeRemaining)}</div>
          )}
        </div>
      </div>

      {/* Main Progress Section */}
      <div className="progress-main">
        {/* Stage Progress Ring */}
        <div className="progress-ring-container">
          <div className="progress-ring">
            <svg width="120" height="120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#e9ecef"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={stageInfo.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={326.73}
                strokeDashoffset={326.73 - (326.73 * animatedProgress / 100)}
                transform="rotate(-90 60 60)"
                className="progress-circle"
              />
            </svg>
            <div className="progress-center">
              <div className="progress-percentage">{Math.round(animatedProgress)}%</div>
              <div className="progress-stage">{stageInfo.label}</div>
            </div>
          </div>
        </div>

        {/* Detailed Status */}
        <div className="status-details">
          <div className="current-operation">
            <h4>{progress.currentOperation || stageInfo.label}</h4>
            
            {/* Page Progress */}
            <div className="page-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${progress.totalPages ? 
                      ((progress.currentPage || 0) / progress.totalPages * 100) : 0}%`,
                    background: stageInfo.color
                  }}
                />
              </div>
              <div className="page-info">
                📄 Page {progress.currentPage || 0} of {progress.totalPages || 0}
              </div>
            </div>

            {/* OCR Specific Progress */}
            {progress.stage === 'ocr_processing' && progress.ocrPagesTotal && (
              <div className="ocr-progress-section">
                <div className="ocr-header">
                  <h5>🔍 OCR Processing</h5>
                  <div className="ocr-workers">
                    {progress.ocrWorkersActive}/{progress.ocrWorkersTotal} workers active
                  </div>
                </div>
                
                <div className="ocr-progress-bar">
                  <div className="progress-bar ocr-bar">
                    <div 
                      className="progress-fill ocr-fill"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                  <div className="ocr-info">
                    📝 {progress.ocrPagesProcessed || 0} of {progress.ocrPagesTotal} pages processed with OCR
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      {showDetailedStats && progress.stage !== 'error' && (
        <div className="stats-panel">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">
                  {(progress.textExtracted || 0).toLocaleString()}
                </div>
                <div className="stat-label">Characters Extracted</div>
              </div>
            </div>

            {progress.ocrTextExtracted && (
              <div className="stat-card ocr-stat">
                <div className="stat-icon">🔍</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {progress.ocrTextExtracted.toLocaleString()}
                  </div>
                  <div className="stat-label">OCR Characters</div>
                </div>
              </div>
            )}

            <div className="stat-card">
              <div className="stat-icon">🏷️</div>
              <div className="stat-content">
                <div className="stat-value">{progress.entitiesFound || 0}</div>
                <div className="stat-label">Entities Found</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-value">{progress.tablesFound || 0}</div>
                <div className="stat-label">Tables Detected</div>
              </div>
            </div>

            {progress.processingSpeed && (
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {progress.processingSpeed.toFixed(1)}
                  </div>
                  <div className="stat-label">Pages/Second</div>
                </div>
              </div>
            )}

            {progress.quality && (
              <div className="stat-card quality-stat">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {Math.round(progress.quality.confidence * 100)}%
                  </div>
                  <div className="stat-label">Quality Score</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {progress.stage === 'error' && (
        <div className="error-section">
          <div className="error-content">
            <div className="error-icon">❌</div>
            <h4>Processing Failed</h4>
            <div className="error-message">{progress.error}</div>
            <div className="error-suggestions">
              <h5>💡 Troubleshooting Tips:</h5>
              <ul>
                <li>🔄 Try refreshing and reprocessing the document</li>
                <li>📄 Ensure the PDF is not corrupted or password-protected</li>
                <li>💾 Check available system memory</li>
                <li>🔍 OCR may take longer for scanned documents</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        {onCancel && progress.stage !== 'completed' && progress.stage !== 'error' && (
          <button 
            className="btn btn-outline-secondary"
            onClick={onCancel}
          >
            ⏹️ Cancel Processing
          </button>
        )}
        
        {progress.stage === 'completed' && (
          <div className="completion-actions">
            <div className="success-message">
              🎉 Document processing completed successfully!
            </div>
          </div>
        )}
      </div>

      <style>{`
        .enhanced-ocr-progress {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border: 1px solid #dee2e6;
          border-radius: 16px;
          padding: 24px;
          margin: 16px 0;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e9ecef;
        }

        .title-section h3 {
          margin: 0 0 8px 0;
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 600;
        }

        .stage-icon {
          font-size: 24px;
        }

        .file-info {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .file-name {
          font-family: 'SF Mono', 'Monaco', monospace;
          background: #f1f3f4;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 13px;
          color: #5f6368;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 12px;
          color: #8e8e93;
        }

        .time-info {
          text-align: right;
          font-size: 14px;
          color: #6c757d;
        }

        .elapsed-time {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .eta {
          font-size: 12px;
          color: #8e8e93;
        }

        .progress-main {
          display: flex;
          gap: 32px;
          margin-bottom: 24px;
        }

        .progress-ring-container {
          flex-shrink: 0;
        }

        .progress-ring {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .progress-circle {
          transition: stroke-dashoffset 0.5s ease;
        }

        .progress-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .progress-percentage {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .progress-stage {
          font-size: 12px;
          color: #6c757d;
          font-weight: 500;
        }

        .status-details {
          flex: 1;
        }

        .current-operation h4 {
          margin: 0 0 16px 0;
          color: #2c3e50;
          font-size: 18px;
          font-weight: 600;
        }

        .page-progress {
          margin-bottom: 16px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #0056b3);
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .page-info {
          font-size: 14px;
          color: #6c757d;
          font-weight: 500;
        }

        .ocr-progress-section {
          background: #fff7e6;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #ffd966;
          margin-top: 16px;
        }

        .ocr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .ocr-header h5 {
          margin: 0;
          color: #b8860b;
          font-size: 16px;
          font-weight: 600;
        }

        .ocr-workers {
          font-size: 12px;
          color: #8b7355;
          background: #fff2cc;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .ocr-bar {
          height: 6px;
        }

        .ocr-fill {
          background: linear-gradient(90deg, #ff8c00, #ff6b35);
        }

        .ocr-info {
          font-size: 13px;
          color: #8b7355;
          font-weight: 500;
        }

        .stats-panel {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-card.ocr-stat {
          border-left: 4px solid #ff8c00;
        }

        .stat-card.quality-stat {
          border-left: 4px solid #28a745;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #6c757d;
          font-weight: 500;
        }

        .error-section {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          margin-bottom: 20px;
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .error-content h4 {
          color: #721c24;
          margin-bottom: 16px;
        }

        .error-message {
          color: #721c24;
          background: #f5c6cb;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .error-suggestions {
          text-align: left;
          background: #fff3cd;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #ffeaa7;
        }

        .error-suggestions h5 {
          color: #856404;
          margin: 0 0 12px 0;
        }

        .error-suggestions ul {
          color: #856404;
          margin: 0;
          padding-left: 20px;
        }

        .error-suggestions li {
          margin: 8px 0;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-outline-secondary {
          background: transparent;
          border: 1px solid #6c757d;
          color: #6c757d;
        }

        .btn-outline-secondary:hover {
          background: #6c757d;
          color: white;
        }

        .success-message {
          color: #155724;
          font-weight: 600;
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .progress-main {
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          
          .progress-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
          
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedOCRProgress;