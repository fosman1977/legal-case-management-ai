/**
 * Modal Component - Design System Integration
 * Modern modal with Week 13 design system
 */

import React, { useEffect } from 'react'
import { useTheme } from '../../design/ThemeProvider'
import Button from '../../design/components/Button'

const XIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  size = 'md', 
  children,
  hideCloseButton = false,
  closeOnOverlayClick = true
}) => {
  const { tokens } = useTheme()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeMap = {
    sm: '400px',
    md: '600px',
    lg: '800px',
    xl: '1200px'
  }

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: tokens.zIndex[1000] || 1000,
    padding: tokens.spacing[4]
  }

  const modalStyles = {
    backgroundColor: tokens.colors.background || 'white',
    borderRadius: tokens.borderRadius.lg,
    boxShadow: tokens.shadows.xl,
    width: '100%',
    maxWidth: sizeMap[size],
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing[6]} ${tokens.spacing[6]} ${tokens.spacing[4]}`,
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`
  }

  const titleStyles = {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[900],
    margin: 0
  }

  const contentStyles = {
    flex: 1,
    overflow: 'auto',
    padding: tokens.spacing[6]
  }

  const closeButtonStyles = {
    padding: tokens.spacing[1],
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: tokens.borderRadius.md,
    cursor: 'pointer',
    color: tokens.colors.neutral[500],
    transition: tokens.transitions.colors,
    '&:hover': {
      backgroundColor: tokens.colors.neutral[100],
      color: tokens.colors.neutral[700]
    }
  }

  const iconStyles = {
    width: '20px',
    height: '20px'
  }

  return (
    <div 
      style={overlayStyles}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div 
        style={modalStyles}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || !hideCloseButton) && (
          <div style={headerStyles}>
            {title && <h2 style={titleStyles}>{title}</h2>}
            {!hideCloseButton && (
              <button
                style={closeButtonStyles}
                onClick={onClose}
                aria-label="Close modal"
              >
                <XIcon style={iconStyles} />
              </button>
            )}
          </div>
        )}
        
        <div style={contentStyles}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal