/**
 * Quick Actions Component - Week 14 Day 1-2
 * Fast access to common barrister workflow actions
 */

import React from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const UploadIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const BookOpenIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const QuickActionButton = ({ icon: Icon, label, description, onClick, primary = false }) => {
  const { tokens } = useTheme()
  
  const buttonStyles = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
    backgroundColor: primary ? tokens.colors.primary[600] : tokens.colors.background || 'white',
    border: primary ? 'none' : `1px solid ${tokens.colors.neutral[200]}`,
    borderRadius: tokens.borderRadius.lg,
    cursor: 'pointer',
    transition: tokens.transitions.all,
    boxShadow: tokens.shadows.sm,
    '&:hover': {
      backgroundColor: primary ? tokens.colors.primary[700] : tokens.colors.neutral[50],
      boxShadow: tokens.shadows.md,
      transform: 'translateY(-1px)'
    }
  }
  
  const iconStyles = {
    width: '20px',
    height: '20px',
    marginRight: tokens.spacing[3],
    color: primary ? 'white' : tokens.colors.neutral[600]
  }
  
  const textStyles = {
    textAlign: 'left',
    flex: 1
  }
  
  const labelStyles = {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: primary ? 'white' : tokens.colors.neutral[900],
    marginBottom: tokens.spacing[0.5]
  }
  
  const descriptionStyles = {
    fontSize: tokens.typography.fontSize.xs,
    color: primary ? 'rgba(255, 255, 255, 0.8)' : tokens.colors.neutral[500]
  }

  return (
    <button
      style={buttonStyles}
      onClick={onClick}
      className="quick-action-button"
    >
      <Icon style={iconStyles} />
      <div style={textStyles}>
        <div style={labelStyles}>{label}</div>
        <div style={descriptionStyles}>{description}</div>
      </div>
    </button>
  )
}

export const QuickActions = ({ onAction }) => {
  const { tokens } = useTheme()
  
  const actions = [
    {
      id: 'new-case',
      icon: PlusIcon,
      label: 'New Case',
      description: 'Create a new legal case',
      primary: true
    },
    {
      id: 'upload-document',
      icon: UploadIcon,
      label: 'Upload Document',
      description: 'Add documents for analysis'
    },
    {
      id: 'search',
      icon: SearchIcon,
      label: 'Legal Search',
      description: 'Search cases and authorities'
    },
    {
      id: 'research',
      icon: BookOpenIcon,
      label: 'Research',
      description: 'AI-powered legal research'
    }
  ]
  
  const containerStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacing[3],
    padding: tokens.spacing[4]
  }

  return (
    <div style={containerStyles}>
      {actions.map(action => (
        <QuickActionButton
          key={action.id}
          {...action}
          onClick={() => onAction?.(action.id)}
        />
      ))}
    </div>
  )
}

export default QuickActions