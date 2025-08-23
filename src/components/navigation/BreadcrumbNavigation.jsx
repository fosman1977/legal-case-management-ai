/**
 * Breadcrumb Navigation Component - Week 14 Day 1-2
 * Hierarchical navigation breadcrumbs with design system integration
 */

import React from 'react'
import { useTheme } from '../../design/ThemeProvider.jsx'

const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

export const BreadcrumbNavigation = ({ items = [], onNavigate }) => {
  const { tokens } = useTheme()
  
  const breadcrumbStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[2],
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.neutral[600]
  }
  
  const itemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[1]
  }
  
  const linkStyles = {
    color: tokens.colors.neutral[600],
    textDecoration: 'none',
    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
    borderRadius: tokens.borderRadius.sm,
    transition: tokens.transitions.colors,
    cursor: 'pointer',
    '&:hover': {
      color: tokens.colors.primary[600],
      backgroundColor: tokens.colors.primary[50]
    }
  }
  
  const currentItemStyles = {
    ...linkStyles,
    color: tokens.colors.neutral[900],
    fontWeight: tokens.typography.fontWeight.medium,
    cursor: 'default'
  }
  
  const separatorStyles = {
    color: tokens.colors.neutral[400],
    width: '16px',
    height: '16px'
  }

  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav style={breadcrumbStyles} aria-label="Breadcrumb navigation">
      <ol style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2], margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isHome = item.id === 'home' || index === 0
          
          return (
            <li key={item.id || index} style={itemStyles}>
              {index > 0 && (
                <ChevronRightIcon style={separatorStyles} />
              )}
              
              {isLast ? (
                <span style={currentItemStyles} aria-current="page">
                  {isHome && <HomeIcon style={{ width: '16px', height: '16px', marginRight: tokens.spacing[1] }} />}
                  {item.label}
                </span>
              ) : (
                <button
                  style={linkStyles}
                  onClick={() => onNavigate?.(item.route || item.id)}
                  aria-label={`Navigate to ${item.label}`}
                >
                  {isHome && <HomeIcon style={{ width: '16px', height: '16px', marginRight: tokens.spacing[1] }} />}
                  {item.label}
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default BreadcrumbNavigation