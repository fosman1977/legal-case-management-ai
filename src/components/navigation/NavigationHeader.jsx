/**
 * Navigation Header Component - Week 14 Day 1-2
 * Top-level navigation with user context and quick actions
 */

import React from 'react'
import { useTheme } from '../../design/ThemeProvider'

const BellIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const CogIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const HeaderButton = ({ icon: Icon, onClick, badge = null, ariaLabel }) => {
  const { tokens } = useTheme()
  
  const buttonStyles = {
    position: 'relative',
    padding: tokens.spacing[2],
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: tokens.borderRadius.md,
    cursor: 'pointer',
    color: tokens.colors.neutral[600],
    transition: tokens.transitions.colors,
    '&:hover': {
      backgroundColor: tokens.colors.neutral[100],
      color: tokens.colors.neutral[900]
    }
  }
  
  const iconStyles = {
    width: '20px',
    height: '20px'
  }
  
  const badgeStyles = {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    minWidth: '18px',
    height: '18px',
    backgroundColor: tokens.colors.error[500],
    color: 'white',
    borderRadius: tokens.borderRadius.full,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `0 ${tokens.spacing[1]}`
  }

  return (
    <button
      style={buttonStyles}
      onClick={onClick}
      aria-label={ariaLabel}
      className="header-button"
    >
      <Icon style={iconStyles} />
      {badge && <span style={badgeStyles}>{badge}</span>}
    </button>
  )
}

export const NavigationHeader = ({ 
  title = "Legal Case Manager",
  userName = "Barrister",
  notifications = 0,
  onNotifications,
  onSettings,
  onProfile
}) => {
  const { tokens } = useTheme()
  
  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing[4]} ${tokens.spacing[6]}`,
    backgroundColor: tokens.colors.background || 'white',
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
    position: 'sticky',
    top: 0,
    zIndex: tokens.zIndex[100]
  }
  
  const titleStyles = {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    margin: 0
  }
  
  const actionsStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[2]
  }
  
  const userSectionStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[3],
    marginLeft: tokens.spacing[4]
  }
  
  const userNameStyles = {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[700]
  }

  return (
    <header style={headerStyles}>
      <h1 style={titleStyles}>{title}</h1>
      
      <div style={actionsStyles}>
        <HeaderButton
          icon={BellIcon}
          onClick={onNotifications}
          badge={notifications > 0 ? notifications : null}
          ariaLabel={`Notifications${notifications > 0 ? ` (${notifications} unread)` : ''}`}
        />
        
        <HeaderButton
          icon={CogIcon}
          onClick={onSettings}
          ariaLabel="Settings"
        />
        
        <div style={userSectionStyles}>
          <span style={userNameStyles}>{userName}</span>
          <HeaderButton
            icon={UserIcon}
            onClick={onProfile}
            ariaLabel="User profile"
          />
        </div>
      </div>
    </header>
  )
}

export default NavigationHeader