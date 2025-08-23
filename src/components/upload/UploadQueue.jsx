/**
 * Upload Queue Component - Week 14 Day 3-4
 * Manages document upload queue with batch processing
 */

import React, { useState, useCallback } from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'
import { Card, CardHeader, CardContent } from '../../design/components/Card.jsx'
import Button from '../../design/components/Button'

const PlayIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h6m-3-3v6m-9 1V7a3 3 0 013-3h6l3 3h6a3 3 0 013 3v4a3 3 0 01-3 3H6a3 3 0 01-3-3z" />
  </svg>
)

const PauseIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M10 9v6m4-6v6" />
  </svg>
)

const TrashIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const RefreshIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

// Queue item component
const QueueItem = ({ item, onRetry, onRemove, onPause, onResume }) => {
  const { tokens } = useTheme()
  
  const itemStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[4],
    borderLeft: `4px solid ${getStatusColor(item.status, tokens)}`,
    backgroundColor: tokens.colors.neutral[25] || tokens.colors.neutral[50]
  }
  
  const infoStyles = {
    flex: 1,
    marginRight: tokens.spacing[4]
  }
  
  const nameStyles = {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing[1]
  }
  
  const statusStyles = {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing[1]
  }
  
  const progressStyles = {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[500]
  }
  
  const actionsStyles = {
    display: 'flex',
    gap: tokens.spacing[2]
  }
  
  const buttonSize = 'sm'

  return (
    <div style={itemStyles}>
      <div style={infoStyles}>
        <div style={nameStyles}>{item.name}</div>
        <div style={statusStyles}>
          Status: {item.status} {item.priority && `• Priority: ${item.priority}`}
        </div>
        {item.progress > 0 && (
          <div style={progressStyles}>
            Progress: {item.progress}%
          </div>
        )}
      </div>
      
      <div style={actionsStyles}>
        {item.status === 'error' && (
          <Button
            size={buttonSize}
            variant="outline"
            onClick={() => onRetry(item.id)}
          >
            <RefreshIcon style={{ width: '16px', height: '16px' }} />
          </Button>
        )}
        
        {item.status === 'processing' && (
          <Button
            size={buttonSize}
            variant="outline"
            onClick={() => onPause(item.id)}
          >
            <PauseIcon style={{ width: '16px', height: '16px' }} />
          </Button>
        )}
        
        {item.status === 'paused' && (
          <Button
            size={buttonSize}
            variant="outline"
            onClick={() => onResume(item.id)}
          >
            <PlayIcon style={{ width: '16px', height: '16px' }} />
          </Button>
        )}
        
        <Button
          size={buttonSize}
          variant="ghost"
          onClick={() => onRemove(item.id)}
        >
          <TrashIcon style={{ width: '16px', height: '16px' }} />
        </Button>
      </div>
    </div>
  )
}

// Helper function for status colors
const getStatusColor = (status, tokens) => {
  const colorMap = {
    pending: tokens.colors.neutral[400],
    processing: tokens.colors.primary[500],
    paused: tokens.colors.warning[500],
    completed: tokens.colors.success[500],
    error: tokens.colors.error[500]
  }
  return colorMap[status] || tokens.colors.neutral[400]
}

// Main upload queue component
export const UploadQueue = ({ 
  files = [], 
  isProcessing = false, 
  onStartProcessing, 
  onPauseProcessing,
  onRetryFile,
  onRemoveFile,
  onClearCompleted,
  maxConcurrent = 3 
}) => {
  const { tokens } = useTheme()
  const [sortBy, setSortBy] = useState('added') // added, name, status, priority
  
  const queueStats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    processing: files.filter(f => f.status === 'processing').length,
    completed: files.filter(f => f.status === 'completed').length,
    error: files.filter(f => f.status === 'error').length,
    paused: files.filter(f => f.status === 'paused').length
  }

  const sortedFiles = [...files].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'status':
        const statusOrder = { processing: 0, pending: 1, paused: 2, error: 3, completed: 4 }
        return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5)
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
      default:
        return new Date(a.addedAt || 0) - new Date(b.addedAt || 0)
    }
  })

  const handleRetryFile = useCallback((fileId) => {
    onRetryFile?.(fileId)
  }, [onRetryFile])

  const handlePauseFile = useCallback((fileId) => {
    // Implementation would pause specific file processing
    console.log('Pausing file:', fileId)
  }, [])

  const handleResumeFile = useCallback((fileId) => {
    // Implementation would resume specific file processing
    console.log('Resuming file:', fileId)
  }, [])

  if (files.length === 0) {
    return null
  }

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[4]
  }
  
  const statsStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: tokens.spacing[4],
    marginBottom: tokens.spacing[4]
  }
  
  const statItemStyles = {
    textAlign: 'center',
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.neutral[50],
    borderRadius: tokens.borderRadius.md
  }
  
  const statValueStyles = {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary[600],
    marginBottom: tokens.spacing[1]
  }
  
  const statLabelStyles = {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  }
  
  const controlsStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[4]
  }
  
  const sortStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[2]
  }
  
  const selectStyles = {
    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
    borderRadius: tokens.borderRadius.md,
    border: `1px solid ${tokens.colors.neutral[300]}`,
    fontSize: tokens.typography.fontSize.sm,
    backgroundColor: tokens.colors.background || 'white'
  }

  return (
    <div style={containerStyles}>
      <Card>
        <CardHeader title="Processing Queue" />
        <CardContent>
          {/* Queue Statistics */}
          <div style={statsStyles}>
            <div style={statItemStyles}>
              <div style={statValueStyles}>{queueStats.total}</div>
              <div style={statLabelStyles}>Total</div>
            </div>
            <div style={statItemStyles}>
              <div style={statValueStyles}>{queueStats.pending}</div>
              <div style={statLabelStyles}>Pending</div>
            </div>
            <div style={statItemStyles}>
              <div style={statValueStyles}>{queueStats.processing}</div>
              <div style={statLabelStyles}>Processing</div>
            </div>
            <div style={statItemStyles}>
              <div style={statValueStyles}>{queueStats.completed}</div>
              <div style={statLabelStyles}>Completed</div>
            </div>
            {queueStats.error > 0 && (
              <div style={statItemStyles}>
                <div style={{ ...statValueStyles, color: tokens.colors.error[600] }}>
                  {queueStats.error}
                </div>
                <div style={statLabelStyles}>Errors</div>
              </div>
            )}
          </div>

          {/* Queue Controls */}
          <div style={controlsStyles}>
            <div style={{ display: 'flex', gap: tokens.spacing[2] }}>
              {!isProcessing && queueStats.pending > 0 && (
                <Button onClick={onStartProcessing}>
                  Start Processing
                </Button>
              )}
              
              {isProcessing && (
                <Button variant="outline" onClick={onPauseProcessing}>
                  Pause All
                </Button>
              )}
              
              {queueStats.completed > 0 && (
                <Button variant="ghost" onClick={onClearCompleted}>
                  Clear Completed
                </Button>
              )}
            </div>
            
            <div style={sortStyles}>
              <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700] }}>
                Sort by:
              </span>
              <select
                style={selectStyles}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="added">Date Added</option>
                <option value="name">File Name</option>
                <option value="status">Status</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Items */}
      {sortedFiles.length > 0 && (
        <Card>
          <CardContent padding="none">
            <div>
              {sortedFiles.map((file, index) => (
                <div key={file.id}>
                  <QueueItem
                    item={file}
                    onRetry={handleRetryFile}
                    onRemove={onRemoveFile}
                    onPause={handlePauseFile}
                    onResume={handleResumeFile}
                  />
                  {index < sortedFiles.length - 1 && (
                    <div style={{ 
                      height: '1px', 
                      backgroundColor: tokens.colors.neutral[200] 
                    }} />
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

export default UploadQueue