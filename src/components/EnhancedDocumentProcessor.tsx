import React, { useState, useCallback, useRef } from 'react';
import { EnhancedOCRProgress } from './EnhancedOCRProgress';
import { EnhancedProgressTracker } from '../utils/enhancedProgressTracker';
import { ProductionDocumentExtractor, EnhancedProgressUpdate } from '../services/productionDocumentExtractor';

/**
 * Enhanced Document Processor
 * Integrates the beautiful OCR progress component with document extraction
 */

interface EnhancedDocumentProcessorProps {
  onDocumentProcessed?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const EnhancedDocumentProcessor: React.FC<EnhancedDocumentProcessorProps> = ({
  onDocumentProcessed,
  onError,
  className
}) => {
  const [progress, setProgress] = useState<EnhancedProgressUpdate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const progressTrackerRef = useRef<EnhancedProgressTracker | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProgress(null);
    }
  };

  const startProcessing = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(null);

    // Create new progress tracker
    progressTrackerRef.current = new EnhancedProgressTracker(
      selectedFile.name,
      selectedFile.size,
      2 // 2 OCR workers
    );

    // Set up enhanced progress callback
    progressTrackerRef.current.setProgressCallback((enhancedProgress) => {
      setProgress(enhancedProgress);
    });

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      console.log(`🚀 Starting enhanced document processing for ${selectedFile.name}`);

      // Process document with enhanced progress tracking
      const result = await ProductionDocumentExtractor.extract(selectedFile, {
        mode: 'full',
        enableOCR: true,
        enableTables: true,
        enableEntities: true,
        parallel: true,
        abortSignal: abortControllerRef.current.signal,
        onProgress: (basicProgress) => {
          // Convert basic progress to enhanced progress
          progressTrackerRef.current?.updateProgress(basicProgress);
        }
      });

      // Final completion update
      setProgress({
        stage: 'completed',
        progress: 100,
        currentPage: result.quality.totalPages,
        totalPages: result.quality.totalPages,
        textExtracted: result.text.length,
        tablesFound: result.tables.length,
        entitiesFound: result.entities.length,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        quality: {
          textQuality: result.quality.textQuality,
          structureQuality: result.quality.structureQuality,
          confidence: result.quality.overall
        }
      });

      console.log('✅ Document processing completed successfully');
      onDocumentProcessed?.(result);

    } catch (error) {
      console.error('❌ Document processing failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setProgress({
        stage: 'error',
        progress: 0,
        error: errorMessage,
        fileName: selectedFile.name,
        fileSize: selectedFile.size
      });

      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, onDocumentProcessed, onError]);

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Document processing cancelled by user');
    }
    setIsProcessing(false);
    setProgress(null);
  }, []);

  const resetProcessor = () => {
    setSelectedFile(null);
    setProgress(null);
    setIsProcessing(false);
    if (progressTrackerRef.current) {
      progressTrackerRef.current.reset();
    }
  };

  return (
    <div className={`enhanced-document-processor ${className || ''}`}>
      {/* File Selection */}
      {!selectedFile && !isProcessing && (
        <div className="file-selector">
          <div className="upload-area">
            <div className="upload-icon">📄</div>
            <h3>Select Document for Enhanced Processing</h3>
            <p>Choose a PDF document for advanced extraction with OCR, table detection, and entity recognition</p>
            
            <label className="upload-button">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              Choose PDF File
            </label>
            
            <div className="features-list">
              <div className="feature">🔍 <strong>Advanced OCR</strong> - Extract text from scanned documents</div>
              <div className="feature">📊 <strong>Table Detection</strong> - Automatically find and extract tables</div>
              <div className="feature">🏷️ <strong>Entity Recognition</strong> - Identify people, dates, amounts</div>
              <div className="feature">⚡ <strong>Parallel Processing</strong> - Maximum speed with multiple workers</div>
            </div>
          </div>
        </div>
      )}

      {/* File Ready for Processing */}
      {selectedFile && !isProcessing && !progress && (
        <div className="file-ready">
          <div className="file-info">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <h4>{selectedFile.name}</h4>
              <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          
          <div className="processing-options">
            <h4>🚀 Ready for Enhanced Processing</h4>
            <p>This document will be processed with:</p>
            <ul>
              <li>✅ Advanced PDF text extraction</li>
              <li>✅ OCR for scanned pages (2 workers)</li>
              <li>✅ Intelligent table detection</li>
              <li>✅ Named entity recognition</li>
              <li>✅ Real-time progress tracking</li>
            </ul>
          </div>

          <div className="action-buttons">
            <button className="btn btn-primary" onClick={startProcessing}>
              🚀 Start Enhanced Processing
            </button>
            <button className="btn btn-secondary" onClick={resetProcessor}>
              📁 Choose Different File
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Progress Display */}
      {(isProcessing || progress) && (
        <EnhancedOCRProgress
          progress={progress}
          onCancel={isProcessing ? cancelProcessing : undefined}
          showDetailedStats={true}
        />
      )}

      {/* Processing Complete Actions */}
      {progress && progress.stage === 'completed' && (
        <div className="completion-actions">
          <button className="btn btn-success" onClick={resetProcessor}>
            🔄 Process Another Document
          </button>
        </div>
      )}

      <style>{`
        .enhanced-document-processor {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .file-selector {
          text-align: center;
          margin-bottom: 24px;
        }

        .upload-area {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 48px 32px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        }

        .upload-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .upload-area h3 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
        }

        .upload-area p {
          margin: 0 0 32px 0;
          opacity: 0.9;
          font-size: 16px;
        }

        .upload-button {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .upload-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .features-list {
          margin-top: 32px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          text-align: left;
        }

        .feature {
          background: rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .file-ready {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .file-icon {
          font-size: 48px;
        }

        .file-details h4 {
          margin: 0 0 4px 0;
          color: #2c3e50;
        }

        .file-details p {
          margin: 0;
          color: #6c757d;
          font-size: 14px;
        }

        .processing-options h4 {
          color: #2c3e50;
          margin: 0 0 8px 0;
        }

        .processing-options p {
          color: #6c757d;
          margin: 0 0 16px 0;
        }

        .processing-options ul {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
        }

        .processing-options li {
          padding: 8px 0;
          color: #495057;
          font-size: 14px;
        }

        .action-buttons {
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
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .btn-success {
          background: linear-gradient(135deg, #28a745, #1e7e34);
          color: white;
        }

        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }

        .completion-actions {
          text-align: center;
          margin-top: 24px;
        }

        @media (max-width: 768px) {
          .enhanced-document-processor {
            padding: 16px;
          }
          
          .upload-area {
            padding: 32px 16px;
          }
          
          .features-list {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .file-info {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedDocumentProcessor;