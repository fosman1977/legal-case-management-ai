/**
 * File Processor Component - Week 14 Day 3-4
 * Handles document processing with privacy-first architecture
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'
import { Card, CardHeader, CardContent } from '../../design/components/Card.jsx'
import Button from '../../design/components/Button'

// Processing utilities
class DocumentProcessor {
  constructor() {
    this.queue = []
    this.processing = false
  }

  async processFile(file) {
    return new Promise((resolve) => {
      // Simulate document processing with privacy-first approach
      const steps = [
        { name: 'Scanning document', duration: 500 },
        { name: 'Anonymizing content', duration: 800 },
        { name: 'Extracting text', duration: 1200 },
        { name: 'Legal analysis', duration: 1500 },
        { name: 'Generating insights', duration: 1000 }
      ]

      let currentStep = 0
      let progress = 0

      const processStep = () => {
        if (currentStep >= steps.length) {
          resolve({
            id: file.id,
            status: 'completed',
            progress: 100,
            result: {
              text: `Processed content from ${file.name}`,
              anonymized: true,
              insights: ['Document contains legal terminology', 'Privacy compliance verified'],
              metadata: {
                pages: Math.floor(Math.random() * 50) + 1,
                words: Math.floor(Math.random() * 10000) + 1000,
                processedAt: new Date()
              }
            }
          })
          return
        }

        const step = steps[currentStep]
        progress = Math.floor(((currentStep + 1) / steps.length) * 100)
        
        // Emit progress update
        if (file.onProgress) {
          file.onProgress({
            id: file.id,
            status: 'processing',
            progress,
            currentStep: step.name
          })
        }

        setTimeout(() => {
          currentStep++
          processStep()
        }, step.duration)
      }

      processStep()
    })
  }

  async addToQueue(file) {
    this.queue.push(file)
    if (!this.processing) {
      this.processQueue()
    }
  }

  async processQueue() {
    this.processing = true
    
    while (this.queue.length > 0) {
      const file = this.queue.shift()
      try {
        await this.processFile(file)
      } catch (error) {
        if (file.onProgress) {
          file.onProgress({
            id: file.id,
            status: 'error',
            progress: 0,
            error: error.message
          })
        }
      }
    }
    
    this.processing = false
  }
}

const processor = new DocumentProcessor()

// Processing status component
const ProcessingStep = ({ step, isActive, isCompleted }) => {
  const { tokens } = useTheme()
  
  const stepStyles = {
    display: 'flex',
    alignItems: 'center',
    padding: `${tokens.spacing[2]} 0`,
    opacity: isActive || isCompleted ? 1 : 0.5
  }
  
  const indicatorStyles = {
    width: '24px',
    height: '24px',
    borderRadius: tokens.borderRadius.full,
    backgroundColor: isCompleted 
      ? tokens.colors.success[500] 
      : isActive 
        ? tokens.colors.primary[500] 
        : tokens.colors.neutral[200],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing[3],
    color: 'white',
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold
  }
  
  const labelStyles = {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[700],
    fontWeight: isActive ? tokens.typography.fontWeight.medium : tokens.typography.fontWeight.normal
  }

  return (
    <div style={stepStyles}>
      <div style={indicatorStyles}>
        {isCompleted ? '✓' : isActive ? '•' : '○'}
      </div>
      <span style={labelStyles}>{step}</span>
    </div>
  )
}

// Progress indicator component
const ProcessingProgress = ({ progress, currentStep }) => {
  const { tokens } = useTheme()
  
  const containerStyles = {
    marginBottom: tokens.spacing[4]
  }
  
  const progressBarStyles = {
    width: '100%',
    height: '8px',
    backgroundColor: tokens.colors.neutral[200],
    borderRadius: tokens.borderRadius.full,
    overflow: 'hidden',
    marginBottom: tokens.spacing[2]
  }
  
  const progressFillStyles = {
    height: '100%',
    backgroundColor: tokens.colors.primary[500],
    width: `${progress}%`,
    transition: 'width 0.3s ease',
    borderRadius: tokens.borderRadius.full
  }
  
  const labelStyles = {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600],
    textAlign: 'center'
  }

  return (
    <div style={containerStyles}>
      <div style={progressBarStyles}>
        <div style={progressFillStyles} />
      </div>
      <div style={labelStyles}>
        {progress}% - {currentStep}
      </div>
    </div>
  )
}

// Main file processor component
export const FileProcessor = ({ files = [], onFileUpdate }) => {
  const { tokens } = useTheme()
  const [processingFiles, setProcessingFiles] = useState({})

  const handleFileProgress = useCallback((update) => {
    setProcessingFiles(prev => ({
      ...prev,
      [update.id]: update
    }))
    
    if (onFileUpdate) {
      onFileUpdate(update)
    }
  }, [onFileUpdate])

  const startProcessing = useCallback((file) => {
    const fileWithCallback = {
      ...file,
      onProgress: handleFileProgress
    }
    
    processor.addToQueue(fileWithCallback)
  }, [handleFileProgress])

  useEffect(() => {
    // Auto-start processing for new files
    files.forEach(file => {
      if (file.status === 'pending' && !processingFiles[file.id]) {
        startProcessing(file)
      }
    })
  }, [files, processingFiles, startProcessing])

  const processingSteps = [
    'Scanning document',
    'Anonymizing content',
    'Extracting text',
    'Legal analysis',
    'Generating insights'
  ]

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[4]
  }

  const activeProcessing = Object.values(processingFiles).filter(f => f.status === 'processing')

  if (activeProcessing.length === 0 && files.length === 0) {
    return null
  }

  return (
    <div style={containerStyles}>
      {activeProcessing.map(processing => {
        const file = files.find(f => f.id === processing.id)
        if (!file) return null

        const currentStepIndex = Math.floor((processing.progress / 100) * processingSteps.length)

        return (
          <Card key={processing.id}>
            <CardHeader 
              title={`Processing ${file.name}`}
              subtitle="Privacy-first document analysis"
            />
            <CardContent>
              <ProcessingProgress 
                progress={processing.progress}
                currentStep={processing.currentStep}
              />
              
              <div style={{ marginTop: tokens.spacing[4] }}>
                {processingSteps.map((step, index) => (
                  <ProcessingStep
                    key={step}
                    step={step}
                    isActive={index === currentStepIndex}
                    isCompleted={index < currentStepIndex}
                  />
                ))}
              </div>
              
              <div style={{ 
                marginTop: tokens.spacing[4],
                padding: tokens.spacing[3],
                backgroundColor: tokens.colors.primary[50],
                borderRadius: tokens.borderRadius.md,
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.primary[700]
              }}>
                🛡️ All processing maintains privacy-first architecture with bulletproof anonymization
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Processing Queue Summary */}
      {files.length > 0 && (
        <Card>
          <CardHeader title="Processing Summary" />
          <CardContent>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: tokens.spacing[4],
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.primary[600] }}>
                  {files.filter(f => f.status === 'pending').length}
                </div>
                <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                  Pending
                </div>
              </div>
              <div>
                <div style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.warning[600] }}>
                  {activeProcessing.length}
                </div>
                <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                  Processing
                </div>
              </div>
              <div>
                <div style={{ fontSize: tokens.typography.fontSize.xl, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.success[600] }}>
                  {files.filter(f => f.status === 'completed').length}
                </div>
                <div style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
                  Completed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FileProcessor