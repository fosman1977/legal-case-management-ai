import React from 'react';
// import { ExtractionProgress } from '../utils/advancedPdfExtractor';
// TODO: Replace with LocalAI PDF extraction
interface ExtractionProgress {
  stage: string;
  progress: number;
  status?: string;
  currentPage?: number;
  totalPages?: number;
  extractedText?: string;
  error?: string;
}

interface PDFExtractionProgressProps {
  progress: ExtractionProgress | null;
  fileName: string;
  onCancel?: () => void;
}

export const PDFExtractionProgress: React.FC<PDFExtractionProgressProps> = ({
  progress,
  fileName,
  onCancel
}) => {
  if (!progress) return null;

  const progressPercentage = (progress.totalPages || 0) > 0 
    ? Math.round(((progress.currentPage || 0) / (progress.totalPages || 1)) * 100) 
    : 0;


  return (
    <div className="pdf-extraction-progress">
      <div className="progress-header">
        <h4>📄 Extracting Text from PDF</h4>
        <p className="file-name">{fileName}</p>
      </div>

      <div className="progress-content">
        {progress.status === 'processing' && (
          <>
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="progress-text">
                {progressPercentage}% - Page {progress.currentPage || 0} of {progress.totalPages || 0}
              </span>
            </div>

            <div className="progress-details">
              <div className="progress-stats">
                <span>📊 Extracted: {(progress.extractedText || '').length.toLocaleString()} characters</span>
                <span>⏱️ Processing large legal document...</span>
              </div>
            </div>

            {onCancel && (
              <button 
                className="btn btn-secondary cancel-btn"
                onClick={onCancel}
              >
                Cancel Extraction
              </button>
            )}
          </>
        )}

        {progress.status === 'completed' && (
          <div className="progress-completed">
            <div className="success-icon">✅</div>
            <h4>Extraction Complete!</h4>
            <div className="completion-stats">
              <p>📄 Processed {progress.totalPages || 0} pages</p>
              <p>📊 Extracted {(progress.extractedText || '').length.toLocaleString()} characters</p>
              <p>🎯 Ready for AI analysis</p>
            </div>
          </div>
        )}

        {progress.status === 'error' && (
          <div className="progress-error">
            <div className="error-icon">❌</div>
            <h4>Extraction Failed</h4>
            <p className="error-message">{progress.error}</p>
            <div className="error-suggestions">
              <h5>Possible solutions:</h5>
              <ul>
                <li>📄 Try a smaller PDF file (under 100MB)</li>
                <li>🔍 Check if the PDF is corrupted</li>
                <li>📱 For scanned documents, use OCR-enabled extraction</li>
                <li>💾 Ensure sufficient memory is available</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .pdf-extraction-progress {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin: 16px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .progress-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .progress-header h4 {
          margin: 0 0 8px 0;
          color: #495057;
        }

        .file-name {
          font-family: monospace;
          background: #e9ecef;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          color: #6c757d;
          margin: 0;
          word-break: break-all;
        }

        .progress-bar-container {
          margin: 16px 0;
        }

        .progress-bar {
          width: 100%;
          height: 24px;
          background: #e9ecef;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #20c997);
          transition: width 0.3s ease;
          border-radius: 12px;
        }

        .progress-text {
          display: block;
          text-align: center;
          margin-top: 8px;
          font-weight: 500;
          color: #495057;
        }

        .progress-details {
          background: white;
          padding: 12px;
          border-radius: 6px;
          margin: 16px 0;
        }

        .progress-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
          color: #6c757d;
        }

        .cancel-btn {
          width: 100%;
          margin-top: 16px;
        }

        .progress-completed {
          text-align: center;
          padding: 20px 0;
        }

        .success-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .completion-stats {
          margin-top: 16px;
        }

        .completion-stats p {
          margin: 8px 0;
          color: #495057;
        }

        .progress-error {
          text-align: center;
          padding: 20px 0;
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .error-message {
          color: #dc3545;
          font-weight: 500;
          margin: 16px 0;
          padding: 12px;
          background: #f8d7da;
          border-radius: 6px;
        }

        .error-suggestions {
          text-align: left;
          margin-top: 20px;
          padding: 16px;
          background: #fff3cd;
          border-radius: 6px;
        }

        .error-suggestions h5 {
          margin: 0 0 12px 0;
          color: #856404;
        }

        .error-suggestions ul {
          margin: 0;
          padding-left: 20px;
          color: #856404;
        }

        .error-suggestions li {
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
};