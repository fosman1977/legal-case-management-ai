/**
 * Sidebar Component - Week 13 Day 5
 * Navigation sidebar for legal case management system
 */

import React from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'
import { H1 } from '../../design/components/Typography.jsx'

export const Sidebar = ({ 
  children, 
  title = "Legal Case Manager",
  className = '',
  width = '256px',
  ...props 
}) => {
  const { tokens, cx, responsive } = useTheme()
  
  const sidebarStyles = {
    width: width,
    backgroundColor: tokens.colors.background || 'white',
    borderRight: `1px solid ${tokens.colors.neutral[200]}`,
    display: 'flex',
    flexDirection: 'column'
  }
  
  const containerStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: tokens.spacing[5],
    paddingBottom: tokens.spacing[4],
    overflowY: 'auto'
  }
  
  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    paddingLeft: tokens.spacing[6],
    paddingRight: tokens.spacing[6],
    marginBottom: tokens.spacing[8]
  }
  
  const navStyles = {
    flex: 1,
    paddingLeft: tokens.spacing[3],
    paddingRight: tokens.spacing[3],
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[1]
  }
  
  return (
    <div
      style={sidebarStyles}
      className={cx('sidebar', className)}
      {...props}
    >
      <div style={containerStyles}>
        <div style={headerStyles}>
          <H1 
            style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.neutral[900],
              margin: 0
            }}
          >
            {title}
          </H1>
        </div>
        <nav style={navStyles} aria-label="Main navigation">
          {children}
        </nav>
      </div>
    </div>
  )
}

export default Sidebar