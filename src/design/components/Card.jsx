/**
 * Card Component - Week 13 Day 1-2
 * Professional card component with design system integration
 */

import React, { forwardRef } from 'react'
import { useTheme } from '../ThemeProvider'

const Card = forwardRef(({
  children,
  variant = 'base',
  padding = 'md',
  hoverable = false,
  clickable = false,
  className = '',
  onClick,
  ...props
}, ref) => {
  const { getCardStyles, tokens, cx } = useTheme()
  
  const baseStyles = getCardStyles(variant, hoverable)
  
  const paddingMap = {
    none: 0,
    sm: tokens.spacing[3],
    md: tokens.spacing[6],
    lg: tokens.spacing[8],
    xl: tokens.spacing[10]
  }
  
  const cardStyles = {
    ...baseStyles,
    padding: paddingMap[padding] || paddingMap.md,
    cursor: clickable ? 'pointer' : 'default',
    transition: tokens.transitions.all,
    ...(hoverable && {
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: tokens.shadows.lg
      }
    })
  }
  
  return (
    <div
      ref={ref}
      style={cardStyles}
      className={cx('card', `card--${variant}`, className)}
      onClick={clickable ? onClick : undefined}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

// Card Header component
export const CardHeader = ({ 
  children, 
  className = '',
  title,
  subtitle,
  action
}) => {
  const { tokens, cx, getTypographyStyles } = useTheme()
  
  const headerStyles = {
    marginBottom: tokens.spacing[4],
    paddingBottom: tokens.spacing[4],
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`
  }
  
  const titleStyles = getTypographyStyles('h3')
  const subtitleStyles = getTypographyStyles('caption')
  
  return (
    <div 
      className={cx('card-header', className)}
      style={headerStyles}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        gap: tokens.spacing[4]
      }}>
        <div style={{ flex: 1 }}>
          {title && (
            <h3 style={titleStyles}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={subtitleStyles}>
              {subtitle}
            </p>
          )}
          {!title && !subtitle && children}
        </div>
        
        {action && (
          <div className="card-header__action">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

// Card Content component
export const CardContent = ({ 
  children, 
  className = '',
  ...props 
}) => {
  const { cx } = useTheme()
  
  return (
    <div 
      className={cx('card-content', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Footer component
export const CardFooter = ({ 
  children, 
  className = '',
  justify = 'flex-end',
  ...props 
}) => {
  const { tokens, cx } = useTheme()
  
  const footerStyles = {
    marginTop: tokens.spacing[6],
    paddingTop: tokens.spacing[4],
    borderTop: `1px solid ${tokens.colors.neutral[200]}`,
    display: 'flex',
    justifyContent: justify,
    alignItems: 'center',
    gap: tokens.spacing[3]
  }
  
  return (
    <div 
      className={cx('card-footer', className)}
      style={footerStyles}
      {...props}
    >
      {children}
    </div>
  )
}

// Status Card variant
export const StatusCard = forwardRef(({
  status = 'default',
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const statusColors = {
    default: tokens.colors.neutral[500],
    success: tokens.colors.success[500],
    warning: tokens.colors.warning[500],
    error: tokens.colors.error[500],
    info: tokens.colors.primary[500]
  }
  
  const changeColors = {
    positive: tokens.colors.success[600],
    negative: tokens.colors.error[600],
    neutral: tokens.colors.neutral[500]
  }
  
  const cardStyles = {
    padding: tokens.spacing[6],
    borderLeft: `4px solid ${statusColors[status]}`
  }
  
  const titleStyles = {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing[1]
  }
  
  const valueStyles = {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing[2]
  }
  
  const changeStyles = {
    fontSize: tokens.typography.fontSize.sm,
    color: changeColors[changeType],
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[1]
  }
  
  return (
    <Card
      ref={ref}
      className={cx('status-card', className)}
      style={cardStyles}
      {...props}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
      }}>
        <div style={{ flex: 1 }}>
          {title && (
            <div style={titleStyles}>
              {title}
            </div>
          )}
          
          {value && (
            <div style={valueStyles}>
              {value}
            </div>
          )}
          
          {change && (
            <div style={changeStyles}>
              {changeType === 'positive' && '↗'}
              {changeType === 'negative' && '↘'}
              <span>{change}</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div style={{
            padding: tokens.spacing[3],
            backgroundColor: `${statusColors[status]}20`,
            borderRadius: tokens.borderRadius.lg,
            color: statusColors[status]
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
})

StatusCard.displayName = 'StatusCard'

export default Card