/**
 * Processing Dashboard Component - Week 14 Day 5
 * Comprehensive processing overview with real-time updates
 */

import React, { useState, useEffect } from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'
import { Card, CardHeader, CardContent } from '../../design/components/Card.jsx'
import Button from '../../design/components/Button'
import { ProcessingStatus } from './ProcessingStatus.jsx'

// Icons
const PlayIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h6m-3-3v6m-9 1V7a3 3 0 013-3h6l3 3h6a3 3 0 013 3v4a3 3 0 01-3 3H6a3 3 0 01-3-3z" />
  </svg>
)

const PauseIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M10 9v6m4-6v6" />
  </svg>
)

const StopIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 9h6v6H9V9z" />
  </svg>
)

const RefreshIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

// Performance Metrics Component
const PerformanceMetrics = ({ metrics }) => {
  const { tokens } = useTheme()
  
  const metricsGridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: tokens.spacing[4]
  }
  
  const metricItemStyles = {
    textAlign: 'center',
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.neutral[50],
    borderRadius: tokens.borderRadius.lg,
    border: `1px solid ${tokens.colors.neutral[200]}`
  }
  
  const valueStyles = {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary[600],
    marginBottom: tokens.spacing[1]
  }
  
  const labelStyles = {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing[1]
  }
  
  const unitStyles = {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[500]
  }

  return (
    <div style={metricsGridStyles}>
      <div style={metricItemStyles}>
        <div style={valueStyles}>{metrics.avgProcessingTime || 0}</div>
        <div style={labelStyles}>Avg Processing</div>
        <div style={unitStyles}>seconds</div>
      </div>
      
      <div style={metricItemStyles}>
        <div style={valueStyles}>{metrics.throughput || 0}</div>
        <div style={labelStyles}>Throughput</div>
        <div style={unitStyles}>files/hour</div>
      </div>
      
      <div style={metricItemStyles}>
        <div style={valueStyles}>{metrics.accuracy || 0}%</div>
        <div style={labelStyles}>Accuracy</div>
        <div style={unitStyles}>confidence</div>
      </div>
      
      <div style={metricItemStyles}>
        <div style={valueStyles}>{metrics.queueSize || 0}</div>
        <div style={labelStyles}>Queue Size</div>
        <div style={unitStyles}>files</div>
      </div>
      
      <div style={metricItemStyles}>
        <div style={valueStyles}>{metrics.uptime || 0}%</div>
        <div style={labelStyles}>Uptime</div>
        <div style={unitStyles}>availability</div>
      </div>
    </div>
  )
}

// Processing Controls Component
const ProcessingControls = ({ 
  overallStatus, 
  onStart, 
  onPause, 
  onStop, 
  onRetryAll, 
  canStart, 
  canPause, 
  canStop 
}) => {
  const { tokens } = useTheme()
  
  const controlsStyles = {
    display: 'flex',
    gap: tokens.spacing[3],
    alignItems: 'center'
  }
  
  const iconStyles = {
    width: '16px',
    height: '16px',
    marginRight: tokens.spacing[1]
  }

  return (
    <div style={controlsStyles}>
      {canStart && (
        <Button onClick={onStart} size="sm">
          <PlayIcon style={iconStyles} />
          Start Processing
        </Button>
      )}
      
      {canPause && (
        <Button onClick={onPause} variant="outline" size="sm">
          <PauseIcon style={iconStyles} />
          Pause
        </Button>
      )}
      
      {canStop && (
        <Button onClick={onStop} variant="outline" size="sm">
          <StopIcon style={iconStyles} />
          Stop
        </Button>
      )}
      
      <Button onClick={onRetryAll} variant="ghost" size="sm">
        <RefreshIcon style={iconStyles} />
        Retry Failed
      </Button>
    </div>
  )
}

// Privacy Compliance Indicator
const PrivacyComplianceIndicator = ({ compliance }) => {
  const { tokens } = useTheme()
  
  const indicatorStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[3],
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.success[50],
    border: `1px solid ${tokens.colors.success[200]}`,
    borderRadius: tokens.borderRadius.lg
  }
  
  const iconStyles = {
    width: '24px',
    height: '24px',
    color: tokens.colors.success[600]
  }
  
  const textStyles = {
    flex: 1
  }
  
  const titleStyles = {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.success[800],
    marginBottom: tokens.spacing[1]
  }
  
  const descriptionStyles = {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.success[700]
  }

  return (
    <div style={indicatorStyles}>
      <div style={iconStyles}>🛡️</div>
      <div style={textStyles}>
        <div style={titleStyles}>Privacy-First Processing Active</div>
        <div style={descriptionStyles}>
          All documents processed with bulletproof anonymization • {compliance.documentsProcessed} documents secured
        </div>
      </div>
    </div>
  )
}

// Main Processing Dashboard Component
export const ProcessingDashboard = ({ 
  files = [], 
  overallStatus = 'idle',
  onStatusChange,
  onRetryFile,
  metrics = {},
  compliance = { documentsProcessed: 0 }
}) => {
  const { tokens } = useTheme()
  const [isProcessing, setIsProcessing] = useState(overallStatus === 'processing')
  const [refreshInterval, setRefreshInterval] = useState(null)

  // Auto-refresh processing status
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        // In a real implementation, this would fetch updated status
        console.log('Refreshing processing status...')
      }, 2000)
      setRefreshInterval(interval)
      
      return () => clearInterval(interval)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [isProcessing])

  const handleStart = () => {
    setIsProcessing(true)
    onStatusChange?.('processing')
  }

  const handlePause = () => {
    setIsProcessing(false)
    onStatusChange?.('paused')
  }

  const handleStop = () => {
    setIsProcessing(false)
    onStatusChange?.('idle')
  }

  const handleRetryAll = () => {
    const failedFiles = files.filter(f => f.status === 'error')
    failedFiles.forEach(file => onRetryFile?.(file.id))
  }

  const canStart = !isProcessing && files.some(f => f.status === 'pending')
  const canPause = isProcessing
  const canStop = isProcessing || overallStatus === 'paused'

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[6]
  }
  
  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacing[4]
  }
  
  const titleStyles = {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    margin: 0
  }

  return (
    <div style={containerStyles}>
      {/* Dashboard Header */}
      <div style={headerStyles}>
        <div>
          <h2 style={titleStyles}>Document Processing Dashboard</h2>
          <p style={{ 
            fontSize: tokens.typography.fontSize.sm, 
            color: tokens.colors.neutral[600],
            margin: `${tokens.spacing[2]} 0 0 0`
          }}>
            Monitor and control document processing with privacy-first architecture
          </p>
        </div>
        
        <ProcessingControls
          overallStatus={overallStatus}
          onStart={handleStart}
          onPause={handlePause}
          onStop={handleStop}
          onRetryAll={handleRetryAll}
          canStart={canStart}
          canPause={canPause}
          canStop={canStop}
        />
      </div>

      {/* Privacy Compliance */}
      <PrivacyComplianceIndicator compliance={compliance} />

      {/* Performance Metrics */}
      <Card>
        <CardHeader title="Performance Metrics" />
        <CardContent>
          <PerformanceMetrics metrics={metrics} />
        </CardContent>
      </Card>

      {/* Processing Status */}
      <ProcessingStatus 
        files={files} 
        overallStatus={overallStatus}
      />

      {/* Real-time Updates Indicator */}
      {isProcessing && (
        <div style={{
          position: 'fixed',
          bottom: tokens.spacing[4],
          right: tokens.spacing[4],
          padding: tokens.spacing[3],
          backgroundColor: tokens.colors.primary[600],
          color: 'white',
          borderRadius: tokens.borderRadius.lg,
          fontSize: tokens.typography.fontSize.sm,
          boxShadow: tokens.shadows.lg,
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[2]
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: tokens.borderRadius.full,
            backgroundColor: tokens.colors.success[400],
            animation: 'pulse 2s infinite'
          }} />
          Processing active • Real-time updates
        </div>
      )}
    </div>
  )
}

export default ProcessingDashboard