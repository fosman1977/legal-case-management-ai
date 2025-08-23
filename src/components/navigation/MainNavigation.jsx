/**
 * Main Navigation Component - Week 14 Day 1-2
 * Streamlined navigation with design system integration
 */

import React from 'react'
import { useTheme } from '../../design/ThemeProvider'

// Simple icon components (avoiding external dependencies)
const FolderIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
  </svg>
)

const DocumentTextIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const LightBulbIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const ShieldCheckIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const SearchIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ScaleIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
)

const CalendarIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const NavItem = ({ icon: Icon, label, description, active, onClick }) => {
  const { tokens } = useTheme()
  
  const itemStyles = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    borderRadius: tokens.borderRadius.md,
    borderTopWidth: '0px',
    borderBottomWidth: '0px',
    borderLeftWidth: '0px',
    borderRightWidth: active ? '2px' : '0px',
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: active ? tokens.colors.primary[600] : 'transparent',
    backgroundColor: active ? tokens.colors.primary[50] : 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    transition: tokens.transitions.colors,
    color: active ? tokens.colors.primary[700] : tokens.colors.neutral[700]
  }
  
  const iconStyles = {
    marginRight: tokens.spacing[3],
    height: '20px',
    width: '20px',
    flexShrink: 0,
    color: active ? tokens.colors.primary[500] : tokens.colors.neutral[400]
  }
  
  const labelStyles = {
    fontWeight: tokens.typography.fontWeight.medium
  }
  
  const descriptionStyles = {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.neutral[500]
  }

  return (
    <button
      onClick={onClick}
      style={itemStyles}
      className="nav-item"
    >
      <Icon style={iconStyles} />
      <div style={{ textAlign: 'left' }}>
        <div style={labelStyles}>{label}</div>
        <div style={descriptionStyles}>{description}</div>
      </div>
    </button>
  )
}

export const MainNavigation = ({ activeRoute, onRouteChange }) => {
  const { tokens } = useTheme()
  
  const navItems = [
    {
      id: 'cases',
      label: 'Cases',
      icon: FolderIcon,
      route: '/cases',
      description: 'Manage your legal cases'
    },
    {
      id: 'analyze',
      label: 'Analyze',
      icon: DocumentTextIcon,
      route: '/analyze',
      description: 'Upload and analyze documents'
    },
    {
      id: 'research',
      label: 'Research',
      icon: SearchIcon,
      route: '/research',
      description: 'Legal research and authorities'
    },
    {
      id: 'arguments',
      label: 'Arguments',
      icon: ScaleIcon,
      route: '/arguments',
      description: 'Skeleton arguments and pleadings'
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: CalendarIcon,
      route: '/timeline',
      description: 'Case chronology and events'
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: LightBulbIcon,
      route: '/insights',
      description: 'AI-powered case insights'
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: ShieldCheckIcon,
      route: '/privacy',
      description: 'Privacy dashboard and compliance'
    }
  ]

  const navStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[1]
  }

  return (
    <nav style={navStyles} role="navigation" aria-label="Main navigation">
      {navItems.map(item => (
        <NavItem
          key={item.id}
          {...item}
          active={activeRoute === item.route}
          onClick={() => onRouteChange(item.route)}
        />
      ))}
    </nav>
  )
}

export default MainNavigation