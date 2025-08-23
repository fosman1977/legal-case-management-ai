/**
 * App Shell Component - Week 13 Day 5
 * Root layout component providing application structure
 */

import React from 'react'
import { useTheme } from '../../design/ThemeProvider'

export const AppShell = ({ children, className = '', ...props }) => {
  const { tokens, cx } = useTheme()
  
  const shellStyles = {
    minHeight: '100vh',
    backgroundColor: tokens.colors.neutral[50],
    display: 'flex',
    flexDirection: 'row'
  }
  
  return (
    <div
      style={shellStyles}
      className={cx('app-shell', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export default AppShell