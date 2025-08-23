/**
 * Processing Queue Component - Week 14 Day 5
 * Advanced queue management with priority handling and batch operations
 */

import React, { useState, useMemo } from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'
import { Card, CardHeader, CardContent } from '../../design/components/Card.jsx'
import Button from '../../design/components/Button'

// Icons
const ArrowUpIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
)

const ArrowDownIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
)

const TrashIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const ClockIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const DocumentIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

// Priority Badge Component
const PriorityBadge = ({ priority = 'medium' }) => {
  const { tokens } = useTheme()
  
  const priorityConfig = {
    high: { 
      label: 'High', 
      color: tokens.colors.error[600], 
      bg: tokens.colors.error[100] 
    },
    medium: { 
      label: 'Medium', 
      color: tokens.colors.warning[600], 
      bg: tokens.colors.warning[100] 
    },
    low: { 
      label: 'Low', 
      color: tokens.colors.neutral[600], 
      bg: tokens.colors.neutral[100] 
    }
  }
  
  const config = priorityConfig[priority] || priorityConfig.medium
  
  const badgeStyles = {
    display: 'inline-block',
    padding: `${tokens.spacing[0.5]} ${tokens.spacing[2]}`,
    backgroundColor: config.bg,
    color: config.color,
    borderRadius: tokens.borderRadius.full,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
  }

  return (
    <span style={badgeStyles}>
      {config.label}
    </span>
  )
}

// Estimated Time Component
const EstimatedTime = ({ file }) => {
  const { tokens } = useTheme()
  
  // Calculate estimated processing time based on file size and type
  const getEstimatedTime = (file) => {
    const baseTimePerMB = 30 // seconds
    const fileSizeMB = file.size / (1024 * 1024)
    const typeMultiplier = file.type === 'application/pdf' ? 1.5 : 1.0
    return Math.ceil(fileSizeMB * baseTimePerMB * typeMultiplier)
  }

  const estimatedSeconds = getEstimatedTime(file)
  const minutes = Math.floor(estimatedSeconds / 60)
  const seconds = estimatedSeconds % 60
  
  const timeStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[1],
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[500]
  }
  
  const iconStyles = {
    width: '12px',
    height: '12px'
  }

  return (
    <div style={timeStyles}>
      <ClockIcon style={iconStyles} />
      <span>
        ~{minutes > 0 ? `${minutes}m ` : ''}{seconds}s
      </span>
    </div>
  )
}

// Queue Item Component
const QueueItem = ({ 
  file, 
  position, 
  isSelected, 
  onSelect, 
  onMovePriority, 
  onRemove,
  canMoveUp = true,
  canMoveDown = true 
}) => {
  const { tokens } = useTheme()
  
  const itemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[3],
    padding: tokens.spacing[4],
    backgroundColor: isSelected ? tokens.colors.primary[50] : 'transparent',
    border: `1px solid ${isSelected ? tokens.colors.primary[200] : tokens.colors.neutral[200]}`,
    borderRadius: tokens.borderRadius.md,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colors.neutral[25] || tokens.colors.neutral[50]
    }
  }
  
  const checkboxStyles = {
    width: '16px',
    height: '16px',
    cursor: 'pointer'
  }
  
  const positionStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    backgroundColor: tokens.colors.neutral[100],
    borderRadius: tokens.borderRadius.full,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[600]
  }
  
  const fileInfoStyles = {
    flex: 1,
    minWidth: 0
  }
  
  const nameStyles = {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing[1],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
  
  const metaStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[3],
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[500]
  }
  
  const actionsStyles = {
    display: 'flex',
    gap: tokens.spacing[1]
  }
  
  const iconButtonStyles = {
    padding: tokens.spacing[1],
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: tokens.borderRadius.sm,
    cursor: 'pointer',
    color: tokens.colors.neutral[500],
    '&:hover': {
      backgroundColor: tokens.colors.neutral[100],
      color: tokens.colors.neutral[700]
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  }
  
  const buttonIconStyles = {
    width: '14px',
    height: '14px'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div style={itemStyles} onClick={onSelect}>
      <input 
        type="checkbox" 
        checked={isSelected}
        onChange={onSelect}
        style={checkboxStyles}
        onClick={(e) => e.stopPropagation()}
      />
      
      <div style={positionStyles}>
        {position}
      </div>
      
      <DocumentIcon style={{ width: '24px', height: '24px', color: tokens.colors.neutral[400] }} />
      
      <div style={fileInfoStyles}>
        <div style={nameStyles}>{file.name}</div>
        <div style={metaStyles}>
          <span>{formatFileSize(file.size)}</span>
          <PriorityBadge priority={file.priority} />
          <EstimatedTime file={file} />
        </div>
      </div>
      
      <div style={actionsStyles}>
        <button
          style={iconButtonStyles}
          onClick={(e) => { e.stopPropagation(); onMovePriority(file.id, 'up') }}
          disabled={!canMoveUp}
          title="Move up in queue"
        >
          <ArrowUpIcon style={buttonIconStyles} />
        </button>
        
        <button
          style={iconButtonStyles}
          onClick={(e) => { e.stopPropagation(); onMovePriority(file.id, 'down') }}
          disabled={!canMoveDown}
          title="Move down in queue"
        >
          <ArrowDownIcon style={buttonIconStyles} />
        </button>
        
        <button
          style={iconButtonStyles}
          onClick={(e) => { e.stopPropagation(); onRemove(file.id) }}
          title="Remove from queue"
        >
          <TrashIcon style={buttonIconStyles} />
        </button>
      </div>
    </div>
  )
}

// Main Processing Queue Component
export const ProcessingQueue = ({ 
  files = [], 
  onReorderFiles, 
  onRemoveFiles, 
  onBatchOperation,
  maxConcurrent = 3 
}) => {
  const { tokens } = useTheme()
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [sortBy, setSortBy] = useState('priority') // priority, name, size, time

  // Sort files by priority and other criteria
  const sortedFiles = useMemo(() => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    
    return [...pendingFiles].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'size':
          return b.size - a.size // Larger files first
        case 'time':
          return new Date(a.addedAt) - new Date(b.addedAt) // Older files first
        default:
          return 0
      }
    })
  }, [files, sortBy])

  const handleSelectFile = (fileId) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === sortedFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(sortedFiles.map(f => f.id)))
    }
  }

  const handleMovePriority = (fileId, direction) => {
    const currentIndex = sortedFiles.findIndex(f => f.id === fileId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sortedFiles.length) return

    const reorderedFiles = [...sortedFiles]
    const [movedFile] = reorderedFiles.splice(currentIndex, 1)
    reorderedFiles.splice(newIndex, 0, movedFile)

    onReorderFiles?.(reorderedFiles)
  }

  const handleBatchPriorityChange = (priority) => {
    const selectedFileIds = Array.from(selectedFiles)
    onBatchOperation?.('priority', { fileIds: selectedFileIds, priority })
    setSelectedFiles(new Set())
  }

  const handleBatchRemove = () => {
    const selectedFileIds = Array.from(selectedFiles)
    onRemoveFiles?.(selectedFileIds)
    setSelectedFiles(new Set())
  }

  const totalEstimatedTime = sortedFiles.reduce((total, file) => {
    const fileSizeMB = file.size / (1024 * 1024)
    const baseTimePerMB = 30 // seconds
    const typeMultiplier = file.type === 'application/pdf' ? 1.5 : 1.0
    return total + (fileSizeMB * baseTimePerMB * typeMultiplier)
  }, 0)

  if (sortedFiles.length === 0) {
    return (
      <Card>
        <CardContent>
          <div style={{ 
            textAlign: 'center', 
            padding: tokens.spacing[8],
            color: tokens.colors.neutral[500]
          }}>
            No files in processing queue
          </div>
        </CardContent>
      </Card>
    )
  }

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[4]
  }
  
  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[4]
  }
  
  const titleStyles = {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[900],
    margin: 0
  }
  
  const controlsStyles = {
    display: 'flex',
    gap: tokens.spacing[3],
    alignItems: 'center'
  }
  
  const selectStyles = {
    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
    borderRadius: tokens.borderRadius.md,
    border: `1px solid ${tokens.colors.neutral[300]}`,
    fontSize: tokens.typography.fontSize.sm,
    backgroundColor: tokens.colors.background || 'white'
  }
  
  const summaryStyles = {
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.primary[50],
    borderRadius: tokens.borderRadius.lg,
    fontSize: tokens.typography.fontSize.sm
  }
  
  const queueListStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[2]
  }
  
  const batchActionsStyles = {
    display: 'flex',
    gap: tokens.spacing[2],
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.neutral[50],
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center'
  }

  return (
    <div style={containerStyles}>
      <Card>
        <CardHeader>
          <div style={headerStyles}>
            <h3 style={titleStyles}>Processing Queue ({sortedFiles.length} files)</h3>
            
            <div style={controlsStyles}>
              <select
                style={selectStyles}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="priority">Sort by Priority</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="time">Sort by Time Added</option>
              </select>
            </div>
          </div>
          
          {/* Queue Summary */}
          <div style={summaryStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <strong>{sortedFiles.length}</strong> files • 
                Estimated processing time: <strong>{Math.ceil(totalEstimatedTime / 60)}m {totalEstimatedTime % 60}s</strong>
              </span>
              <span>
                Concurrent processing: <strong>{maxConcurrent}</strong> files
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent padding="none">
          {/* Batch Actions */}
          {selectedFiles.size > 0 && (
            <div style={batchActionsStyles}>
              <span style={{ fontSize: tokens.typography.fontSize.sm, marginRight: tokens.spacing[3] }}>
                {selectedFiles.size} files selected
              </span>
              
              <Button size="sm" variant="outline" onClick={() => handleBatchPriorityChange('high')}>
                Set High Priority
              </Button>
              
              <Button size="sm" variant="outline" onClick={() => handleBatchPriorityChange('medium')}>
                Set Medium Priority
              </Button>
              
              <Button size="sm" variant="outline" onClick={() => handleBatchPriorityChange('low')}>
                Set Low Priority
              </Button>
              
              <Button size="sm" variant="ghost" onClick={handleBatchRemove}>
                Remove Selected
              </Button>
              
              <Button size="sm" variant="ghost" onClick={handleSelectAll}>
                {selectedFiles.size === sortedFiles.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          )}
          
          {/* Queue Items */}
          <div style={queueListStyles}>
            {sortedFiles.map((file, index) => (
              <QueueItem
                key={file.id}
                file={file}
                position={index + 1}
                isSelected={selectedFiles.has(file.id)}
                onSelect={() => handleSelectFile(file.id)}
                onMovePriority={handleMovePriority}
                onRemove={(fileId) => onRemoveFiles?.([fileId])}
                canMoveUp={index > 0}
                canMoveDown={index < sortedFiles.length - 1}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProcessingQueue