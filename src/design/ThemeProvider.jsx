/**
 * Theme Provider - Week 13 Day 1-2
 * React context provider for design system
 */

import React, { createContext, useContext, useState } from 'react'
import { designTokens, componentStyles, layoutUtilities, designUtils } from './DesignSystem'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children, theme = 'light' }) => {
  const [currentTheme, setCurrentTheme] = useState(theme)
  
  // Theme variants
  const themes = {
    light: {
      ...designTokens,
      colors: {
        ...designTokens.colors,
        background: designTokens.colors.neutral[50],
        surface: 'white',
        text: {
          primary: designTokens.colors.neutral[900],
          secondary: designTokens.colors.neutral[700],
          tertiary: designTokens.colors.neutral[500]
        }
      }
    },
    
    dark: {
      ...designTokens,
      colors: {
        ...designTokens.colors,
        background: designTokens.colors.neutral[900],
        surface: designTokens.colors.neutral[800],
        text: {
          primary: designTokens.colors.neutral[100],
          secondary: designTokens.colors.neutral[300],
          tertiary: designTokens.colors.neutral[400]
        },
        // Adjust component colors for dark theme
        neutral: {
          ...designTokens.colors.neutral,
          50: designTokens.colors.neutral[900],
          100: designTokens.colors.neutral[800],
          200: designTokens.colors.neutral[700],
          300: designTokens.colors.neutral[600],
          400: designTokens.colors.neutral[500],
          500: designTokens.colors.neutral[400],
          600: designTokens.colors.neutral[300],
          700: designTokens.colors.neutral[200],
          800: designTokens.colors.neutral[100],
          900: designTokens.colors.neutral[50]
        }
      }
    }
  }
  
  const theme_context = {
    // Current theme data
    theme: themes[currentTheme],
    currentTheme,
    
    // Theme switching
    setTheme: setCurrentTheme,
    toggleTheme: () => setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light'),
    
    // Design system components
    tokens: themes[currentTheme],
    components: componentStyles,
    layout: layoutUtilities,
    utils: designUtils,
    
    // CSS-in-JS helpers
    css: (styles) => styles,
    cx: (...classNames) => classNames.filter(Boolean).join(' '),
    
    // Style generators
    getButtonStyles: (variant = 'primary', size = 'md', disabled = false) => {
      const base = componentStyles.button.base
      const variantStyles = componentStyles.button.variants[variant] || {}
      const sizeStyles = componentStyles.button.sizes[size] || {}
      
      return {
        ...base,
        ...variantStyles,
        ...sizeStyles,
        ...(disabled && variantStyles['&:disabled'])
      }
    },
    
    getCardStyles: (variant = 'base', elevated = false) => {
      const base = componentStyles.card.base
      const variantStyles = componentStyles.card.variants[variant] || {}
      
      return {
        ...base,
        ...variantStyles,
        ...(elevated && { boxShadow: designTokens.shadows.lg })
      }
    },
    
    getInputStyles: (variant = 'base', error = false, success = false) => {
      const base = componentStyles.input.base
      let variantStyles = {}
      
      if (error) variantStyles = componentStyles.input.variants.error
      if (success) variantStyles = componentStyles.input.variants.success
      
      return {
        ...base,
        ...variantStyles
      }
    },
    
    getTypographyStyles: (variant = 'body') => {
      return componentStyles.typography[variant] || componentStyles.typography.body
    },
    
    // Responsive helpers
    responsive: designUtils.responsive,
    
    // Color utilities
    colors: themes[currentTheme].colors,
    getColor: (colorPath) => {
      const path = colorPath.split('.')
      let color = themes[currentTheme].colors
      
      for (const segment of path) {
        color = color[segment]
        if (!color) return undefined
      }
      
      return color
    },
    
    withOpacity: designUtils.withOpacity,
    
    // Spacing utilities
    spacing: themes[currentTheme].spacing,
    getSpacing: (scale) => themes[currentTheme].spacing[scale],
    
    // Breakpoint utilities
    breakpoints: themes[currentTheme].breakpoints,
    
    // Animation utilities
    transitions: themes[currentTheme].transitions,
    animations: themes[currentTheme].animation
  }
  
  return (
    <ThemeContext.Provider value={theme_context}>
      {children}
    </ThemeContext.Provider>
  )
}

// Higher-order component for class-based components
export const withTheme = (Component) => {
  return React.forwardRef((props, ref) => {
    const theme = useTheme()
    return <Component {...props} theme={theme} ref={ref} />
  })
}

// Hook for accessing specific design tokens
export const useDesignTokens = () => {
  const { tokens } = useTheme()
  return tokens
}

// Hook for component styles
export const useComponentStyles = () => {
  const { components } = useTheme()
  return components
}

// Hook for layout utilities
export const useLayoutUtilities = () => {
  const { layout } = useTheme()
  return layout
}

// CSS-in-JS styled component helper
export const styled = (tag, baseStyles) => {
  return React.forwardRef(({ className, style, children, ...props }, ref) => {
    const theme = useTheme()
    const computedStyles = typeof baseStyles === 'function' ? baseStyles(theme) : baseStyles
    
    return React.createElement(tag, {
      ...props,
      ref,
      className: theme.cx(className),
      style: {
        ...computedStyles,
        ...style
      },
      children
    })
  })
}

export default ThemeProvider