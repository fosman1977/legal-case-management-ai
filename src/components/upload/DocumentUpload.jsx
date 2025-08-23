/**
 * Document Upload Component - Week 14 Day 3-4
 * Enhanced upload with drag-and-drop and design system integration
 */

import React, { useState, useCallback } from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'
import Button from '../../design/components/Button'
import { Card, CardHeader, CardContent } from '../../design/components/Card.jsx'

// Simple icons (avoiding external dependencies)
const DocumentIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const CheckCircleIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XCircleIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ClockIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// Hook for drag and drop functionality
const useDragAndDrop = ({ onDrop, accept = {}, disabled = false }) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    setDragCounter(prev => prev + 1)
    setIsDragActive(true)
  }, [disabled])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    setDragCounter(prev => prev - 1)
    if (dragCounter <= 1) {
      setIsDragActive(false)
    }
  }, [disabled, dragCounter])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    
    setIsDragActive(false)
    setDragCounter(0)
    
    const files = Array.from(e.dataTransfer.files)
    const acceptedFiles = files.filter(file => {
      if (Object.keys(accept).length === 0) return true
      return Object.keys(accept).some(mimeType => file.type === mimeType)
    })
    
    if (acceptedFiles.length > 0) {
      onDrop(acceptedFiles)
    }
  }, [disabled, accept, onDrop])

  const getRootProps = () => ({
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop
  })

  const getInputProps = () => ({
    type: 'file',
    multiple: true,
    accept: Object.keys(accept).join(','),
    style: { display: 'none' },
    disabled
  })

  return { getRootProps, getInputProps, isDragActive }
}

// Utility functions
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Processing status component
const ProcessingStatus = ({ status, progress }) => {
  const { tokens } = useTheme()
  
  if (status === 'processing') {
    const progressStyles = {
      width: '100px',
      height: '6px',
      backgroundColor: tokens.colors.neutral[200],
      borderRadius: tokens.borderRadius.full,
      overflow: 'hidden'
    }
    
    const progressFillStyles = {
      height: '100%',
      backgroundColor: tokens.colors.primary[500],
      width: `${progress}%`,
      transition: 'width 0.3s ease'
    }
    
    return (
      <div style={progressStyles}>
        <div style={progressFillStyles} />
      </div>
    )
  }
  
  return null
}

// Status badge component
const StatusBadge = ({ status }) => {
  const { tokens } = useTheme()
  
  const statusConfig = {
    pending: { icon: ClockIcon, color: tokens.colors.warning[500], bg: tokens.colors.warning[100] },
    processing: { icon: ClockIcon, color: tokens.colors.primary[500], bg: tokens.colors.primary[100] },
    completed: { icon: CheckCircleIcon, color: tokens.colors.success[500], bg: tokens.colors.success[100] },
    error: { icon: XCircleIcon, color: tokens.colors.error[500], bg: tokens.colors.error[100] }
  }
  
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon
  
  const badgeStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
    backgroundColor: config.bg,
    color: config.color,
    borderRadius: tokens.borderRadius.full,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium
  }
  
  const iconStyles = {
    width: '12px',
    height: '12px',
    marginRight: tokens.spacing[1]
  }

  return (
    <span style={badgeStyles}>
      <Icon style={iconStyles} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// File item component
const FileItem = ({ file }) => {
  const { tokens } = useTheme()
  
  const itemStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[4]
  }
  
  const fileInfoStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[3]
  }
  
  const iconStyles = {
    width: '32px',
    height: '32px',
    color: tokens.colors.neutral[400]
  }
  
  const nameStyles = {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing[0.5]
  }
  
  const sizeStyles = {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[500]
  }
  
  const actionsStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[4]
  }

  return (
    <div style={itemStyles}>
      <div style={fileInfoStyles}>
        <DocumentIcon style={iconStyles} />
        <div>
          <p style={nameStyles}>{file.name}</p>
          <p style={sizeStyles}>{formatFileSize(file.size)}</p>
        </div>
      </div>
      
      <div style={actionsStyles}>
        <ProcessingStatus status={file.status} progress={file.progress} />
        <StatusBadge status={file.status} />
      </div>
    </div>
  )
}

// Main component
export const DocumentUpload = ({ onUpload, processing = false }) => {
  const { tokens } = useTheme()
  const [files, setFiles] = useState([])

  const acceptedTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'], 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt']
  }

  const handleFiles = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }))
    
    setFiles(prev => [...prev, ...newFiles])
    onUpload?.(newFiles)
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDragAndDrop({
    accept: acceptedTypes,
    onDrop: handleFiles,
    disabled: processing
  })

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
  }

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[6]
  }
  
  const uploadZoneStyles = {
    padding: tokens.spacing[12],
    textAlign: 'center',
    cursor: processing ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: `2px dashed ${isDragActive ? tokens.colors.primary[400] : tokens.colors.neutral[300]}`,
    borderRadius: tokens.borderRadius.lg,
    backgroundColor: isDragActive ? tokens.colors.primary[50] : 'transparent',
    opacity: processing ? 0.5 : 1,
    '&:hover': !processing ? {
      borderColor: tokens.colors.neutral[400]
    } : {}
  }
  
  const iconStyles = {
    margin: `0 auto ${tokens.spacing[4]}`,
    width: '48px',
    height: '48px',
    color: tokens.colors.neutral[400]
  }
  
  const titleStyles = {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing[2]
  }
  
  const descriptionStyles = {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
    marginBottom: tokens.spacing[4]
  }
  
  const fileTypesStyles = {
    display: 'flex',
    justifyContent: 'center',
    gap: tokens.spacing[6],
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[400],
    marginBottom: tokens.spacing[4]
  }

  return (
    <div style={containerStyles}>
      {/* Upload Zone */}
      <Card>
        <div {...getRootProps()} style={uploadZoneStyles}>
          <input {...getInputProps()} onChange={handleFileSelect} />
          
          <DocumentIcon style={iconStyles} />
          
          <h3 style={titleStyles}>
            {isDragActive ? 'Drop documents here' : 'Upload legal documents'}
          </h3>
          
          <p style={descriptionStyles}>
            Drag and drop files or click to browse
          </p>
          
          <div style={fileTypesStyles}>
            <span>PDF</span>
            <span>DOCX</span>
            <span>TXT</span>
          </div>
          
          {!processing && (
            <Button variant="secondary">
              Choose Files
            </Button>
          )}
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader title="Uploaded Documents" />
          <CardContent padding="none">
            <div style={{ borderTop: `1px solid ${tokens.colors.neutral[200]}` }}>
              {files.map((file, index) => (
                <div key={file.id}>
                  <FileItem file={file} />
                  {index < files.length - 1 && (
                    <div style={{ height: '1px', backgroundColor: tokens.colors.neutral[200] }} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DocumentUpload