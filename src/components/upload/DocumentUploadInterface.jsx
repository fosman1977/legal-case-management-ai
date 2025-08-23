/**
 * Document Upload Interface - Week 14 Day 3-4
 * Streamlined document upload with progress tracking
 */

import React, { useState, useRef, useCallback } from 'react';
import { useTheme } from '../../design/ThemeProvider.jsx';
import Card, { CardHeader, CardContent } from '../../design/components/Card.jsx';
import Button from '../../design/components/Button.jsx';
import { ProcessingStatus } from '../processing/ProcessingStatus.jsx';
import { VirtualizedDocumentList, useDebouncedSearch } from '../../performance/VirtualizedComponents.jsx';

// Upload icon component
const UploadIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

// File icon component  
const DocumentIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Remove icon
const XIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Utility functions
const generateId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Progress indicator component
const ProgressBar = ({ progress, tokens }) => (
  <div style={{
    width: '80px',
    height: '4px',
    backgroundColor: tokens.colors.neutral[200],
    borderRadius: tokens.borderRadius.full,
    overflow: 'hidden'
  }}>
    <div 
      style={{
        width: `${progress}%`,
        height: '100%',
        backgroundColor: tokens.colors.primary[500],
        transition: tokens.transitions.all
      }}
    />
  </div>
);

// Status badge component
const StatusBadge = ({ status, tokens }) => {
  const statusConfig = {
    pending: { bg: tokens.colors.neutral[100], text: tokens.colors.neutral[700], label: 'Pending' },
    processing: { bg: tokens.colors.warning[100], text: tokens.colors.warning[700], label: 'Processing' },
    completed: { bg: tokens.colors.success[100], text: tokens.colors.success[700], label: 'Complete' },
    error: { bg: tokens.colors.error[100], text: tokens.colors.error[700], label: 'Error' }
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <div style={{
      padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
      borderRadius: tokens.borderRadius.full,
      fontSize: tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.medium,
      backgroundColor: config.bg,
      color: config.text
    }}>
      {config.label}
    </div>
  );
};

// Enhanced file item component
const FileItem = ({ file, onRemove, tokens }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: tokens.spacing[4],
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[3] }}>
      <DocumentIcon style={{ 
        width: '32px', 
        height: '32px',
        color: tokens.colors.neutral[400]
      }} />
      <div>
        <div style={{ 
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.neutral[900]
        }}>
          {file.name}
        </div>
        <div style={{ 
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.neutral[500]
        }}>
          {formatFileSize(file.size)}
        </div>
      </div>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[4] }}>
      {file.status === 'processing' && (
        <ProgressBar progress={file.progress} tokens={tokens} />
      )}
      <StatusBadge status={file.status} tokens={tokens} />
      <button
        onClick={() => onRemove(file.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          border: 'none',
          borderRadius: tokens.borderRadius.full,
          backgroundColor: tokens.colors.neutral[200],
          cursor: 'pointer',
          transition: tokens.transitions.colors
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = tokens.colors.error[100];
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = tokens.colors.neutral[200];
        }}
      >
        <XIcon style={{ width: '12px', height: '12px', color: tokens.colors.neutral[600] }} />
      </button>
    </div>
  </div>
);

const DocumentQueue = ({ files, onRemoveFile, onStartProcessing, processing, tokens }) => {
  if (files.length === 0) return null;

  const pendingFiles = files.filter(f => f.status === 'pending').length;
  const processingFiles = files.filter(f => f.status === 'processing').length;
  const completedFiles = files.filter(f => f.status === 'completed').length;

  return (
    <Card style={{ marginTop: tokens.spacing[4] }}>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ 
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
            margin: 0
          }}>
            Document Queue ({files.length})
          </h3>
          
          <div style={{ display: 'flex', gap: tokens.spacing[2] }}>
            {pendingFiles > 0 && (
              <Button 
                variant="primary" 
                disabled={processing}
                onClick={onStartProcessing}
              >
                {processing ? 'Processing...' : `Analyze ${pendingFiles} File${pendingFiles !== 1 ? 's' : ''}`}
              </Button>
            )}
          </div>
        </div>
        
        {(processingFiles > 0 || completedFiles > 0) && (
          <div style={{ 
            display: 'flex', 
            gap: tokens.spacing[4], 
            marginTop: tokens.spacing[2],
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.neutral[600]
          }}>
            {processingFiles > 0 && <span>⏳ {processingFiles} Processing</span>}
            {completedFiles > 0 && <span>✅ {completedFiles} Complete</span>}
          </div>
        )}
      </CardHeader>
      <CardContent style={{ padding: 0 }}>
        <div>
          {files.map(file => (
            <FileItem 
              key={file.id} 
              file={file} 
              onRemove={onRemoveFile}
              tokens={tokens}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const DocumentUploadInterface = ({ onFilesUploaded, onProcessingComplete }) => {
  const { tokens } = useTheme();
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((selectedFiles) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];

    const newFiles = Array.from(selectedFiles)
      .filter(file => allowedTypes.includes(file.type))
      .map(file => ({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
        uploadedAt: new Date()
      }));

    setFiles(prev => [...prev, ...newFiles]);
    
    if (onFilesUploaded) {
      onFilesUploaded(newFiles);
    }
  }, [onFilesUploaded]);

  const handleRemoveFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const handleStartProcessing = useCallback(() => {
    setProcessing(true);
    
    // Simulate processing for each pending file
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    pendingFiles.forEach((file, index) => {
      // Set to processing status
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing', progress: 0 } : f
        ));
      }, index * 100);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === file.id && f.status === 'processing') {
            const newProgress = Math.min(f.progress + Math.random() * 15, 100);
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              return { ...f, status: 'completed', progress: 100 };
            }
            return { ...f, progress: newProgress };
          }
          return f;
        }));
      }, 200);

      // Complete processing after random time (2-5 seconds)
      setTimeout(() => {
        clearInterval(progressInterval);
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
        ));
        
        // Check if all files are complete
        setTimeout(() => {
          setFiles(current => {
            const allComplete = current.every(f => f.status === 'completed' || f.status === 'error');
            if (allComplete) {
              setProcessing(false);
              if (onProcessingComplete) {
                onProcessingComplete(current);
              }
            }
            return current;
          });
        }, 100);
        
      }, 2000 + Math.random() * 3000);
    });
  }, [files, onProcessingComplete]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const dropzoneStyles = {
    border: `2px dashed ${isDragOver ? tokens.colors.primary[400] : tokens.colors.neutral[300]}`,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing[12],
    textAlign: 'center',
    backgroundColor: isDragOver ? tokens.colors.primary[25] : tokens.colors.neutral[25],
    transition: tokens.transitions.all,
    cursor: 'pointer'
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <h2 style={{ 
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.semibold,
            margin: 0
          }}>
            Document Upload
          </h2>
          <p style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.neutral[600],
            margin: `${tokens.spacing[2]} 0 0 0`
          }}>
            Upload documents for AI-powered legal analysis
          </p>
        </CardHeader>
        <CardContent>
          <div
            style={dropzoneStyles}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleBrowseClick}
          >
            <UploadIcon style={{
              width: '48px',
              height: '48px',
              color: tokens.colors.neutral[400],
              margin: `0 auto ${tokens.spacing[4]} auto`,
              display: 'block'
            }} />
            
            <h3 style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.neutral[900],
              margin: `0 0 ${tokens.spacing[2]} 0`
            }}>
              Drop files here or click to browse
            </h3>
            
            <p style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.neutral[600],
              margin: `0 0 ${tokens.spacing[4]} 0`
            }}>
              Supported formats: PDF, Word, Text, Images
            </p>
            
            <Button variant="outline">
              Browse Files
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          <div style={{ 
            marginTop: tokens.spacing[4],
            padding: tokens.spacing[3],
            backgroundColor: tokens.colors.neutral[50],
            borderRadius: tokens.borderRadius.md
          }}>
            <h4 style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.neutral[700],
              margin: `0 0 ${tokens.spacing[2]} 0`
            }}>
              Privacy Notice
            </h4>
            <p style={{
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.neutral[600],
              margin: 0,
              lineHeight: tokens.typography.lineHeight.relaxed
            }}>
              Documents are processed locally with privacy-first AI analysis. 
              Only anonymized patterns may be shared with Claude AI for legal guidance.
            </p>
          </div>
        </CardContent>
      </Card>

      <DocumentQueue 
        files={files} 
        onRemoveFile={handleRemoveFile}
        onStartProcessing={handleStartProcessing}
        processing={processing}
        tokens={tokens} 
      />
      
      {files.some(f => f.status === 'processing' || f.status === 'completed') && (
        <ProcessingStatus 
          files={files.map(f => ({
            ...f,
            steps: {
              extraction: f.status === 'completed' ? 'completed' : f.status === 'processing' ? 'processing' : 'pending',
              entities: f.status === 'completed' ? 'completed' : f.status === 'processing' && f.progress > 25 ? 'processing' : 'pending',
              patterns: f.status === 'completed' ? 'completed' : f.status === 'processing' && f.progress > 50 ? 'processing' : 'pending',
              anonymization: f.status === 'completed' ? 'completed' : f.status === 'processing' && f.progress > 75 ? 'processing' : 'pending'
            },
            confidence: f.status === 'completed' ? {
              extraction: Math.random() * 0.2 + 0.8,
              entities: Math.random() * 0.2 + 0.75,
              patterns: Math.random() * 0.2 + 0.85,
              anonymization: Math.random() * 0.1 + 0.9
            } : undefined
          }))}
          overallStatus={processing ? 'processing' : files.every(f => f.status === 'completed') ? 'completed' : 'idle'}
        />
      )}
    </div>
  );
};

export default DocumentUploadInterface;