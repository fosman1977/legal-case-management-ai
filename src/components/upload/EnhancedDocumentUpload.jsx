/**
 * Enhanced Document Upload - Week 14 Day 3-4
 * Complete document upload system integrating all upload components
 */

import React, { useState, useCallback } from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'
import { DocumentUpload } from './DocumentUpload.jsx'
import { FileProcessor } from './FileProcessor.jsx'
import { UploadQueue } from './UploadQueue.jsx'

// Enhanced upload component that combines all functionality
export const EnhancedDocumentUpload = ({ 
  caseId,
  onDocumentAdded,
  onDocumentProcessed,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 20,
  autoProcess = true 
}) => {
  const { tokens } = useTheme()
  const [files, setFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Handle new file uploads
  const handleUpload = useCallback((newFiles) => {
    const processedFiles = newFiles.map(file => ({
      ...file,
      caseId,
      addedAt: new Date(),
      status: 'pending',
      progress: 0,
      priority: 'medium'
    }))

    setFiles(prev => [...prev, ...processedFiles])
    
    if (onDocumentAdded) {
      processedFiles.forEach(file => onDocumentAdded(file))
    }

    // Auto-start processing if enabled
    if (autoProcess && !isProcessing) {
      setIsProcessing(true)
    }
  }, [caseId, onDocumentAdded, autoProcess, isProcessing])

  // Handle file updates during processing
  const handleFileUpdate = useCallback((update) => {
    setFiles(prev => prev.map(file => 
      file.id === update.id 
        ? { ...file, ...update }
        : file
    ))

    if (update.status === 'completed' && onDocumentProcessed) {
      const file = files.find(f => f.id === update.id)
      if (file) {
        onDocumentProcessed({
          ...file,
          ...update
        })
      }
    }
  }, [files, onDocumentProcessed])

  // Queue management functions
  const handleStartProcessing = useCallback(() => {
    setIsProcessing(true)
  }, [])

  const handlePauseProcessing = useCallback(() => {
    setIsProcessing(false)
  }, [])

  const handleRetryFile = useCallback((fileId) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, status: 'pending', progress: 0 }
        : file
    ))
  }, [])

  const handleRemoveFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }, [])

  const handleClearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(file => file.status !== 'completed'))
  }, [])

  // File validation
  const validateFile = (file) => {
    const errors = []
    
    if (file.size > maxFileSize) {
      errors.push(`File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`)
    }
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not supported')
    }
    
    return errors
  }

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[6],
    maxWidth: '100%'
  }

  const sectionStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[4]
  }

  // Check if we're at max files
  const isAtMaxFiles = files.length >= maxFiles
  const activeFiles = files.filter(f => f.status !== 'completed')

  return (
    <div style={containerStyles}>
      {/* Upload Section */}
      {!isAtMaxFiles && (
        <section style={sectionStyles}>
          <DocumentUpload 
            onUpload={handleUpload}
            processing={isProcessing}
            validateFile={validateFile}
          />
        </section>
      )}

      {/* Processing Section */}
      {activeFiles.length > 0 && (
        <section style={sectionStyles}>
          <FileProcessor
            files={activeFiles}
            onFileUpdate={handleFileUpdate}
          />
        </section>
      )}

      {/* Queue Management */}
      {files.length > 0 && (
        <section style={sectionStyles}>
          <UploadQueue
            files={files}
            isProcessing={isProcessing}
            onStartProcessing={handleStartProcessing}
            onPauseProcessing={handlePauseProcessing}
            onRetryFile={handleRetryFile}
            onRemoveFile={handleRemoveFile}
            onClearCompleted={handleClearCompleted}
          />
        </section>
      )}

      {/* Status Summary */}
      {files.length > 0 && (
        <div style={{
          padding: tokens.spacing[4],
          backgroundColor: tokens.colors.neutral[50],
          borderRadius: tokens.borderRadius.lg,
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.neutral[700],
          textAlign: 'center'
        }}>
          {files.length} document{files.length !== 1 ? 's' : ''} uploaded 
          {caseId && ` for case ${caseId}`}
          {isAtMaxFiles && ` (Maximum ${maxFiles} files reached)`}
        </div>
      )}
    </div>
  )
}

export default EnhancedDocumentUpload