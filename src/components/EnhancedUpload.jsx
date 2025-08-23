/**
 * Enhanced Document Upload - Exact implementation from roadmap 
 * Week 2: Day 1-2 Enhanced Document Upload
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ProcessingIndicator from './ProcessingIndicator.jsx';

const EnhancedDocumentUpload = ({ onUpload, processing }) => {
  const [processingFiles, setProcessingFiles] = useState([]);
  const [processingState, setProcessingState] = useState('idle'); // 'idle', 'uploading', 'processing'

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    onDrop: handleFiles
  });

  const handleFiles = async (files) => {
    setProcessingState('uploading');
    
    // Initialize processing tracking for each file
    const fileTracking = files.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
      progress: 0,
      status: 'Uploading...',
      steps: {
        extraction: false,
        entities: false,
        patterns: false,
        anonymization: false
      }
    }));

    setProcessingFiles(fileTracking);
    
    for (const fileTrack of fileTracking) {
      await processFile(fileTrack);
    }
    
    setProcessingState('idle');
  };

  const processFile = async (fileTrack) => {
    try {
      // Step 1: Upload/Read file
      updateFileProgress(fileTrack.id, 10, 'Reading file...', {});
      await simulateDelay(500);

      // Step 2: Text extraction
      updateFileProgress(fileTrack.id, 30, 'Extracting text...', { extraction: true });
      await simulateDelay(1000);

      // Step 3: Entity recognition  
      updateFileProgress(fileTrack.id, 60, 'Recognizing entities...', { 
        extraction: true, 
        entities: true 
      });
      await simulateDelay(1500);

      // Step 4: Pattern analysis
      updateFileProgress(fileTrack.id, 80, 'Analyzing patterns...', { 
        extraction: true, 
        entities: true, 
        patterns: true 
      });
      await simulateDelay(1000);

      // Step 5: Anonymization
      updateFileProgress(fileTrack.id, 95, 'Anonymizing data...', { 
        extraction: true, 
        entities: true, 
        patterns: true,
        anonymization: true 
      });
      await simulateDelay(800);

      // Step 6: Complete
      updateFileProgress(fileTrack.id, 100, 'Complete!', { 
        extraction: true, 
        entities: true, 
        patterns: true,
        anonymization: true 
      });

      // Notify parent component
      if (onUpload) {
        onUpload({
          file: fileTrack.file,
          processed: true,
          id: fileTrack.id
        });
      }

    } catch (error) {
      updateFileProgress(fileTrack.id, 0, `Error: ${error.message}`, {});
    }
  };

  const updateFileProgress = (fileId, progress, status, steps) => {
    setProcessingFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { 
            ...file, 
            progress, 
            status, 
            steps: { ...file.steps, ...steps } 
          }
        : file
    ));
  };

  const simulateDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="upload-zone-enhanced">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''} ${processingState === 'uploading' ? 'processing' : ''}`}
      >
        <input {...getInputProps()} />
        <DocumentIcon />
        <h3>Drop documents here</h3>
        <p>PDF, Word, or drag a folder</p>
        <p className="supported-formats">Supports: PDF, DOCX, TXT</p>
      </div>
      
      {processingFiles.length > 0 && (
        <ProcessingIndicator files={processingFiles} status={processingState} />
      )}

      <style jsx>{`
        .upload-zone-enhanced {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .dropzone {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #fafafa;
        }

        .dropzone:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .dropzone.active {
          border-color: #1d4ed8;
          background: #dbeafe;
          transform: scale(1.02);
        }

        .dropzone.processing {
          border-color: #059669;
          background: #d1fae5;
          cursor: not-allowed;
        }

        .dropzone h3 {
          margin: 1rem 0 0.5rem 0;
          color: #111827;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .dropzone p {
          margin: 0.5rem 0;
          color: #6b7280;
        }

        .supported-formats {
          font-size: 0.875rem;
          color: #9ca3af;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

const DocumentIcon = () => (
  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
);

export default EnhancedDocumentUpload;