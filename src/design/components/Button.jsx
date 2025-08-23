/**
 * Button Component - Week 13 Day 1-2
 * Professional button component with design system integration
 */

import React, { forwardRef } from 'react'
import { useTheme } from '../ThemeProvider'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const { getButtonStyles, tokens, cx } = useTheme()
  
  const baseStyles = getButtonStyles(variant, size, disabled)
  
  const buttonStyles = {
    ...baseStyles,
    ...(fullWidth && { width: '100%' }),
    ...(loading && { opacity: 0.7, cursor: 'wait' }),
    gap: tokens.spacing[2]
  }
  
  const handleClick = (event) => {
    if (!disabled && !loading && onClick) {
      onClick(event)
    }
  }
  
  return (
    <button
      ref={ref}
      type={type}
      style={buttonStyles}
      className={cx('button', `button--${variant}`, `button--${size}`, className)}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <LoadingSpinner size={size} />
      )}
      
      {leftIcon && !loading && (
        <span className="button__left-icon" style={{ display: 'flex', alignItems: 'center' }}>
          {leftIcon}
        </span>
      )}
      
      <span className="button__content">
        {children}
      </span>
      
      {rightIcon && !loading && (
        <span className="button__right-icon" style={{ display: 'flex', alignItems: 'center' }}>
          {rightIcon}
        </span>
      )}
    </button>
  )
})

Button.displayName = 'Button'

// Loading spinner component
const LoadingSpinner = ({ size = 'md' }) => {
  const { tokens } = useTheme()
  
  const sizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20
  }
  
  const spinnerSize = sizes[size] || 16
  
  const spinnerStyles = {
    width: spinnerSize,
    height: spinnerSize,
    border: `2px solid transparent`,
    borderTop: `2px solid currentColor`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
  
  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <span style={spinnerStyles} aria-hidden="true" />
    </>
  )
}

// Button group component
export const ButtonGroup = ({ 
  children, 
  spacing = 'md',
  direction = 'horizontal',
  className = ''
}) => {
  const { tokens, cx } = useTheme()
  
  const spacingMap = {
    sm: tokens.spacing[2],
    md: tokens.spacing[3],
    lg: tokens.spacing[4]
  }
  
  const groupStyles = {
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'column' : 'row',
    gap: spacingMap[spacing] || spacingMap.md
  }
  
  return (
    <div 
      className={cx('button-group', className)}
      style={groupStyles}
    >
      {children}
    </div>
  )
}

// Icon button variant
export const IconButton = forwardRef(({
  children,
  size = 'md',
  variant = 'ghost',
  'aria-label': ariaLabel,
  ...props
}, ref) => {
  const { tokens } = useTheme()
  
  const sizeMap = {
    xs: tokens.spacing[6],
    sm: tokens.spacing[8],
    md: tokens.spacing[10],
    lg: tokens.spacing[12],
    xl: tokens.spacing[14]
  }
  
  const iconButtonStyles = {
    width: sizeMap[size],
    height: sizeMap[size],
    padding: 0
  }
  
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      aria-label={ariaLabel}
      style={iconButtonStyles}
      {...props}
    >
      {children}
    </Button>
  )
})

IconButton.displayName = 'IconButton'

export default Button