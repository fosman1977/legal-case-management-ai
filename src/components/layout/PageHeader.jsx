/**
 * Page Header Component - Week 13 Day 5
 * Standardized page header with title, subtitle, and actions
 */

import React from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'
import { H1, Paragraph } from '../../design/components/Typography.jsx'

export const PageHeader = ({ 
  title, 
  subtitle, 
  actions,
  className = '',
  borderBottom = true,
  ...props 
}) => {
  const { tokens, cx } = useTheme()
  
  const headerStyles = {
    backgroundColor: tokens.colors.background || 'white',
    ...(borderBottom && {
      borderBottom: `1px solid ${tokens.colors.neutral[200]}`
    })
  }
  
  const containerStyles = {
    padding: `${tokens.spacing[4]} ${tokens.spacing[6]}`
  }
  
  const contentStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing[6]
  }
  
  const titleSectionStyles = {
    flex: 1,
    minWidth: 0 // Allows text truncation if needed
  }
  
  const titleStyles = {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    margin: 0,
    marginBottom: subtitle ? tokens.spacing[1] : 0
  }
  
  const subtitleStyles = {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[500],
    margin: 0
  }
  
  const actionsStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[3],
    flexShrink: 0
  }
  
  return (
    <div
      style={headerStyles}
      className={cx('page-header', className)}
      {...props}
    >
      <div style={containerStyles}>
        <div style={contentStyles}>
          <div style={titleSectionStyles}>
            <H1 style={titleStyles}>
              {title}
            </H1>
            {subtitle && (
              <Paragraph style={subtitleStyles}>
                {subtitle}
              </Paragraph>
            )}
          </div>
          
          {actions && (
            <div style={actionsStyles}>
              {Array.isArray(actions) ? actions.map((action, index) => (
                <div key={index}>
                  {action}
                </div>
              )) : actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageHeader