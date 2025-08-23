/**
 * Main Content Component - Week 13 Day 5
 * Primary content area with proper focus management
 */

import React, { forwardRef } from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'

export const MainContent = forwardRef(({ 
  children, 
  className = '',
  padding = true,
  ...props 
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const containerStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }
  
  const mainStyles = {
    flex: 1,
    position: 'relative',
    overflowY: 'auto',
    outline: 'none',
    ...(padding && {
      padding: `${tokens.spacing[6]} ${tokens.spacing[6]}`,
    })
  }
  
  return (
    <div style={containerStyles} className={cx('main-content-container', className)}>
      <main
        ref={ref}
        style={mainStyles}
        className={cx('main-content')}
        tabIndex={-1}
        {...props}
      >
        {children}
      </main>
    </div>
  )
})

MainContent.displayName = 'MainContent'

export default MainContent