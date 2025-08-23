/**
 * Processing Status Component - Week 14 Day 5
 * Comprehensive processing status display with design system integration
 */

import React from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'
import Card, { CardHeader, CardContent } from '../../design/components/Card.jsx'

// Icons
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

const ClockIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ExclamationCircleIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CogIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

// Progress Bar Component
const ProgressBar = ({ value = 0, className = '', showPercentage = false }) => {
  const { tokens } = useTheme()
  
  const containerStyles = {
    width: '100%',
    backgroundColor: tokens.colors.neutral[200],
    borderRadius: tokens.borderRadius.full,
    overflow: 'hidden'
  }
  
  const fillStyles = {
    height: '100%',
    backgroundColor: tokens.colors.primary[500],
    width: `${Math.min(Math.max(value, 0), 100)}%`,
    transition: 'width 0.3s ease',
    borderRadius: tokens.borderRadius.full
  }
  
  const defaultHeight = '8px'

  return (
    <div className={className}>
      <div style={{ ...containerStyles, height: defaultHeight }}>
        <div style={fillStyles} />
      </div>
      {showPercentage && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: tokens.spacing[1],
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.neutral[600]
        }}>
          {Math.round(value)}%
        </div>
      )}
    </div>
  )
}

// Overall Status Badge
const OverallStatusBadge = ({ status }) => {
  const { tokens } = useTheme()
  
  const statusConfig = {
    idle: { 
      label: 'Ready', 
      color: tokens.colors.neutral[600], 
      bg: tokens.colors.neutral[100],
      icon: ClockIcon 
    },
    processing: { 
      label: 'Processing', 
      color: tokens.colors.primary[600], 
      bg: tokens.colors.primary[100],
      icon: CogIcon 
    },
    completed: { 
      label: 'Completed', 
      color: tokens.colors.success[600], 
      bg: tokens.colors.success[100],
      icon: CheckCircleIcon 
    },
    error: { 
      label: 'Error', 
      color: tokens.colors.error[600], 
      bg: tokens.colors.error[100],
      icon: ExclamationCircleIcon 
    },
    paused: { 
      label: 'Paused', 
      color: tokens.colors.warning[600], 
      bg: tokens.colors.warning[100],
      icon: ClockIcon 
    }
  }
  
  const config = statusConfig[status] || statusConfig.idle
  const Icon = config.icon
  
  const badgeStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${tokens.spacing[1]} ${tokens.spacing[3]}`,
    backgroundColor: config.bg,
    color: config.color,
    borderRadius: tokens.borderRadius.full,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    gap: tokens.spacing[1]
  }
  
  const iconStyles = {
    width: '16px',
    height: '16px'
  }

  return (
    <span style={badgeStyles}>
      <Icon style={iconStyles} />
      {config.label}
    </span>
  )
}

// Status Badge for individual items
const StatusBadge = ({ status }) => {
  const { tokens } = useTheme()
  
  const statusConfig = {
    pending: { 
      label: 'Pending', 
      color: tokens.colors.neutral[600], 
      bg: tokens.colors.neutral[100] 
    },
    processing: { 
      label: 'Processing', 
      color: tokens.colors.primary[600], 
      bg: tokens.colors.primary[100] 
    },
    completed: { 
      label: 'Completed', 
      color: tokens.colors.success[600], 
      bg: tokens.colors.success[100] 
    },
    error: { 
      label: 'Error', 
      color: tokens.colors.error[600], 
      bg: tokens.colors.error[100] 
    },
    paused: { 
      label: 'Paused', 
      color: tokens.colors.warning[600], 
      bg: tokens.colors.warning[100] 
    }
  }
  
  const config = statusConfig[status] || statusConfig.pending
  
  const badgeStyles = {
    display: 'inline-block',
    padding: `${tokens.spacing[0.5]} ${tokens.spacing[2]}`,
    backgroundColor: config.bg,
    color: config.color,
    borderRadius: tokens.borderRadius.full,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium
  }

  return (
    <span style={badgeStyles}>
      {config.label}
    </span>
  )
}

// Processing Step Component
const ProcessingStep = ({ label, status = 'pending', confidence = null, timestamp = null }) => {
  const { tokens } = useTheme()
  
  const stepStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing[2]} 0`
  }
  
  const leftSectionStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[2]
  }
  
  const rightSectionStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[2],
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[500]
  }
  
  const labelStyles = {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[700],
    fontWeight: status === 'processing' ? tokens.typography.fontWeight.medium : tokens.typography.fontWeight.normal
  }
  
  const getStepIcon = () => {
    const iconStyles = { width: '16px', height: '16px' }
    switch (status) {
      case 'completed':
        return <CheckCircleIcon style={{ ...iconStyles, color: tokens.colors.success[500] }} />
      case 'processing':
        return <CogIcon style={{ ...iconStyles, color: tokens.colors.primary[500] }} />
      case 'error':
        return <ExclamationCircleIcon style={{ ...iconStyles, color: tokens.colors.error[500] }} />
      default:
        return <ClockIcon style={{ ...iconStyles, color: tokens.colors.neutral[400] }} />
    }
  }

  return (
    <div style={stepStyles}>
      <div style={leftSectionStyles}>
        {getStepIcon()}
        <span style={labelStyles}>{label}</span>
      </div>
      
      <div style={rightSectionStyles}>
        {confidence !== null && (
          <span>{Math.round(confidence * 100)}% confidence</span>
        )}
        {timestamp && (
          <span>{new Date(timestamp).toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  )
}

// Individual File Processing Item
const ProcessingFileItem = ({ file }) => {
  const { tokens } = useTheme()
  
  const itemStyles = {
    border: `1px solid ${tokens.colors.neutral[200]}`,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing[4],
    marginBottom: tokens.spacing[3]
  }
  
  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[3]
  }
  
  const fileInfoStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[3]
  }
  
  const iconStyles = {
    width: '24px',
    height: '24px',
    color: tokens.colors.neutral[400]
  }
  
  const nameStyles = {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[900]
  }
  
  const stepsStyles = {
    marginBottom: tokens.spacing[3]
  }

  const processingSteps = [
    { key: 'extraction', label: 'Text extraction', confidence: file.confidence?.extraction },
    { key: 'entities', label: 'Entity recognition', confidence: file.confidence?.entities },
    { key: 'patterns', label: 'Pattern analysis', confidence: file.confidence?.patterns },
    { key: 'anonymization', label: 'Anonymization', confidence: file.confidence?.anonymization }
  ]

  return (
    <div style={itemStyles}>
      <div style={headerStyles}>
        <div style={fileInfoStyles}>
          <DocumentIcon style={iconStyles} />
          <span style={nameStyles}>{file.name}</span>
        </div>
        <StatusBadge status={file.status} />
      </div>

      {/* Processing Steps */}
      <div style={stepsStyles}>
        {processingSteps.map(step => (
          <ProcessingStep
            key={step.key}
            label={step.label}
            status={file.steps?.[step.key] || 'pending'}
            confidence={step.confidence}
          />
        ))}
      </div>

      {/* Progress Bar for Processing Files */}
      {file.status === 'processing' && (
        <ProgressBar value={file.progress || 0} showPercentage />
      )}
      
      {/* Error Message */}
      {file.status === 'error' && file.error && (
        <div style={{
          marginTop: tokens.spacing[2],
          padding: tokens.spacing[3],
          backgroundColor: tokens.colors.error[50],
          borderRadius: tokens.borderRadius.md,
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.error[700]
        }}>
          Error: {file.error}
        </div>
      )}
    </div>
  )
}

// Main Processing Status Component
export const ProcessingStatus = ({ files = [], overallStatus = 'idle' }) => {
  const { tokens } = useTheme()
  
  const totalFiles = files.length
  const completedFiles = files.filter(f => f.status === 'completed').length
  const processingFiles = files.filter(f => f.status === 'processing').length
  const errorFiles = files.filter(f => f.status === 'error').length
  const pendingFiles = files.filter(f => f.status === 'pending').length

  const progressPercentage = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }
  
  const titleStyles = {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[900],
    margin: 0
  }
  
  const progressSectionStyles = {
    marginBottom: tokens.spacing[6]
  }
  
  const progressLabelStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing[2]
  }
  
  const fileListStyles = {
    marginBottom: tokens.spacing[6]
  }
  
  const summaryStyles = {
    marginTop: tokens.spacing[6],
    paddingTop: tokens.spacing[6],
    borderTop: `1px solid ${tokens.colors.neutral[200]}`
  }
  
  const statsGridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: tokens.spacing[4],
    textAlign: 'center'
  }
  
  const statItemStyles = {
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.neutral[50],
    borderRadius: tokens.borderRadius.md
  }
  
  const statValueStyles = {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.semibold,
    marginBottom: tokens.spacing[1]
  }
  
  const statLabelStyles = {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  }

  if (totalFiles === 0) {
    return (
      <Card>
        <CardContent>
          <div style={{ 
            textAlign: 'center', 
            padding: tokens.spacing[8],
            color: tokens.colors.neutral[500]
          }}>
            No documents to process
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div style={headerStyles}>
          <h3 style={titleStyles}>Document Processing</h3>
          <OverallStatusBadge status={overallStatus} />
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Progress Overview */}
        <div style={progressSectionStyles}>
          <div style={progressLabelStyles}>
            <span>Overall Progress</span>
            <span>{completedFiles} of {totalFiles} completed</span>
          </div>
          <ProgressBar value={progressPercentage} className="h-2" />
        </div>

        {/* Processing Files */}
        <div style={fileListStyles}>
          {files.map(file => (
            <ProcessingFileItem key={file.id} file={file} />
          ))}
        </div>

        {/* Summary Statistics */}
        <div style={summaryStyles}>
          <div style={statsGridStyles}>
            <div style={statItemStyles}>
              <div style={{ ...statValueStyles, color: tokens.colors.success[600] }}>
                {completedFiles}
              </div>
              <div style={statLabelStyles}>Completed</div>
            </div>
            <div style={statItemStyles}>
              <div style={{ ...statValueStyles, color: tokens.colors.primary[600] }}>
                {processingFiles}
              </div>
              <div style={statLabelStyles}>Processing</div>
            </div>
            <div style={statItemStyles}>
              <div style={{ ...statValueStyles, color: tokens.colors.neutral[600] }}>
                {pendingFiles}
              </div>
              <div style={statLabelStyles}>Pending</div>
            </div>
            <div style={statItemStyles}>
              <div style={{ ...statValueStyles, color: tokens.colors.error[600] }}>
                {errorFiles}
              </div>
              <div style={statLabelStyles}>Errors</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProcessingStatus