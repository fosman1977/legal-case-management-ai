/**
 * Design System Foundation - Week 13 Day 1-2
 * Professional design system for legal case management
 */

export const designTokens = {
  // Professional legal color palette
  colors: {
    primary: {
      50: '#eff6ff',   // Lightest blue - backgrounds
      100: '#dbeafe',  // Light blue - subtle highlights
      200: '#bfdbfe',  // Soft blue - disabled states
      300: '#93c5fd',  // Medium light blue - hover states
      400: '#60a5fa',  // Medium blue - active states
      500: '#3b82f6',  // Main brand blue - primary actions
      600: '#2563eb',  // Medium dark blue - primary hover
      700: '#1d4ed8',  // Darker blue for emphasis
      800: '#1e40af',  // Dark blue - pressed states
      900: '#1e3a8a'   // Deep blue for headings/text
    },
    
    secondary: {
      50: '#f8fafc',   // Lightest slate
      100: '#f1f5f9',  // Light slate
      200: '#e2e8f0',  // Medium light slate
      300: '#cbd5e1',  // Medium slate
      400: '#94a3b8',  // Medium dark slate
      500: '#64748b',  // Slate - secondary text
      600: '#475569',  // Dark slate
      700: '#334155',  // Darker slate
      800: '#1e293b',  // Very dark slate
      900: '#0f172a'   // Darkest slate
    },
    
    neutral: {
      50: '#f9fafb',   // Background - lightest
      100: '#f3f4f6',  // Light background
      200: '#e5e7eb',  // Borders and dividers
      300: '#d1d5db',  // Disabled text
      400: '#9ca3af',  // Placeholder text
      500: '#6b7280',  // Secondary text
      600: '#4b5563',  // Body text secondary
      700: '#374151',  // Primary body text
      800: '#1f2937',  // Dark headings
      900: '#111827'   // Darkest text - main headings
    },
    
    // Semantic colors for legal contexts
    success: {
      50: '#ecfdf5',
      100: '#d1fae5', 
      500: '#10b981',  // Success green - completed tasks
      600: '#059669',  // Success green - primary
      700: '#047857'   // Success green - dark
    },
    
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',  // Warning amber - attention needed
      600: '#d97706',  // Warning amber - primary
      700: '#b45309'   // Warning amber - dark
    },
    
    error: {
      50: '#fef2f2',
      100: '#fecaca',
      500: '#ef4444',  // Error red - failed states
      600: '#dc2626',  // Error red - primary
      700: '#b91c1c'   // Error red - dark
    },
    
    // Legal-specific colors
    legal: {
      privilege: '#7c3aed',    // Purple for privileged content
      confidential: '#dc2626', // Red for confidential
      public: '#059669',       // Green for public documents
      draft: '#d97706',        // Amber for drafts
      final: '#1d4ed8'         // Blue for final documents
    }
  },

  // Typography scale optimized for legal documents
  typography: {
    fontFamily: {
      sans: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'system-ui',
        'sans-serif'
      ],
      mono: [
        'JetBrains Mono',
        'SF Mono',
        'Monaco',
        'Inconsolata',
        'monospace'
      ],
      serif: [
        'Crimson Text',
        'Times New Roman',
        'serif'
      ]
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px - metadata, footnotes
      sm: '0.875rem',   // 14px - captions, labels
      base: '1rem',     // 16px - body text, paragraphs
      lg: '1.125rem',   // 18px - subheadings, emphasis
      xl: '1.25rem',    // 20px - section headings
      '2xl': '1.5rem',  // 24px - page titles
      '3xl': '1.875rem',// 30px - case names, main titles
      '4xl': '2.25rem', // 36px - hero titles
      '5xl': '3rem'     // 48px - display titles
    },
    
    fontWeight: {
      thin: 100,
      light: 300,
      normal: 400,      // Body text
      medium: 500,      // Emphasis
      semibold: 600,    // Subheadings
      bold: 700,        // Headings
      extrabold: 800,   // Strong emphasis
      black: 900        // Display headings
    },
    
    lineHeight: {
      none: 1,          // Tight headings
      tight: 1.25,      // Headings
      snug: 1.375,      // Subheadings
      normal: 1.5,      // Body text
      relaxed: 1.625,   // Reading text
      loose: 2          // Spacious text
    },
    
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },

  // Spacing system based on 4px grid
  spacing: {
    0: '0rem',        // 0px
    px: '1px',        // 1px
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px - base unit
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem'       // 384px
  },

  // Professional shadows for depth
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  },

  // Border radius for professional appearance
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px'
  },

  // Border widths
  borderWidth: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px'
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: '640px',      // Small devices
    md: '768px',      // Medium devices (tablets)
    lg: '1024px',     // Large devices (desktops)
    xl: '1280px',     // Extra large devices
    '2xl': '1536px'   // 2X large devices
  },

  // Z-index layers
  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',        // Dropdowns
    100: '100',      // Sticky elements
    200: '200',      // Fixed headers
    300: '300',      // Overlays
    400: '400',      // Modals
    500: '500',      // Notifications
    1000: '1000'     // Tooltips
  },

  // Transitions for smooth interactions
  transitions: {
    none: 'none',
    all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    default: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Animation timing
  animation: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms'
    },
    
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
}

// Component-specific design patterns
export const componentStyles = {
  // Button styles
  button: {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: designTokens.borderRadius.md,
      fontWeight: designTokens.typography.fontWeight.medium,
      fontSize: designTokens.typography.fontSize.sm,
      lineHeight: designTokens.typography.lineHeight.none,
      padding: `${designTokens.spacing[2]} ${designTokens.spacing[4]}`,
      transition: designTokens.transitions.all,
      cursor: 'pointer',
      border: `${designTokens.borderWidth[1]} solid transparent`,
      textDecoration: 'none',
      userSelect: 'none'
    },
    
    variants: {
      primary: {
        backgroundColor: designTokens.colors.primary[500],
        color: 'white',
        '&:hover': {
          backgroundColor: designTokens.colors.primary[600]
        },
        '&:focus': {
          outline: 'none',
          boxShadow: `0 0 0 3px ${designTokens.colors.primary[200]}`
        },
        '&:disabled': {
          backgroundColor: designTokens.colors.neutral[300],
          color: designTokens.colors.neutral[500],
          cursor: 'not-allowed'
        }
      },
      
      secondary: {
        backgroundColor: 'white',
        color: designTokens.colors.neutral[700],
        borderColor: designTokens.colors.neutral[200],
        '&:hover': {
          backgroundColor: designTokens.colors.neutral[50]
        },
        '&:focus': {
          outline: 'none',
          boxShadow: `0 0 0 3px ${designTokens.colors.primary[200]}`
        }
      },
      
      outline: {
        backgroundColor: 'transparent',
        color: designTokens.colors.primary[600],
        borderColor: designTokens.colors.primary[300],
        '&:hover': {
          backgroundColor: designTokens.colors.primary[50]
        }
      },
      
      ghost: {
        backgroundColor: 'transparent',
        color: designTokens.colors.neutral[600],
        '&:hover': {
          backgroundColor: designTokens.colors.neutral[100]
        }
      }
    },
    
    sizes: {
      xs: {
        padding: `${designTokens.spacing[1]} ${designTokens.spacing[2]}`,
        fontSize: designTokens.typography.fontSize.xs
      },
      sm: {
        padding: `${designTokens.spacing[1.5]} ${designTokens.spacing[3]}`,
        fontSize: designTokens.typography.fontSize.sm
      },
      md: {
        padding: `${designTokens.spacing[2]} ${designTokens.spacing[4]}`,
        fontSize: designTokens.typography.fontSize.sm
      },
      lg: {
        padding: `${designTokens.spacing[2.5]} ${designTokens.spacing[6]}`,
        fontSize: designTokens.typography.fontSize.base
      },
      xl: {
        padding: `${designTokens.spacing[3]} ${designTokens.spacing[8]}`,
        fontSize: designTokens.typography.fontSize.lg
      }
    }
  },

  // Card styles
  card: {
    base: {
      backgroundColor: 'white',
      borderRadius: designTokens.borderRadius.lg,
      boxShadow: designTokens.shadows.base,
      border: `${designTokens.borderWidth[1]} solid ${designTokens.colors.neutral[200]}`,
      overflow: 'hidden'
    },
    
    variants: {
      elevated: {
        boxShadow: designTokens.shadows.lg,
        borderColor: 'transparent'
      },
      
      outlined: {
        boxShadow: 'none',
        borderColor: designTokens.colors.neutral[200]
      },
      
      filled: {
        backgroundColor: designTokens.colors.neutral[50],
        borderColor: 'transparent'
      }
    }
  },

  // Input styles
  input: {
    base: {
      display: 'block',
      width: '100%',
      borderRadius: designTokens.borderRadius.md,
      border: `${designTokens.borderWidth[1]} solid ${designTokens.colors.neutral[300]}`,
      backgroundColor: 'white',
      padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
      fontSize: designTokens.typography.fontSize.sm,
      lineHeight: designTokens.typography.lineHeight.tight,
      color: designTokens.colors.neutral[900],
      transition: designTokens.transitions.colors,
      '&::placeholder': {
        color: designTokens.colors.neutral[400]
      },
      '&:focus': {
        outline: 'none',
        borderColor: designTokens.colors.primary[500],
        boxShadow: `0 0 0 3px ${designTokens.colors.primary[200]}`
      },
      '&:disabled': {
        backgroundColor: designTokens.colors.neutral[50],
        color: designTokens.colors.neutral[500],
        cursor: 'not-allowed'
      }
    },
    
    variants: {
      error: {
        borderColor: designTokens.colors.error[500],
        '&:focus': {
          borderColor: designTokens.colors.error[500],
          boxShadow: `0 0 0 3px ${designTokens.colors.error[200]}`
        }
      },
      
      success: {
        borderColor: designTokens.colors.success[500],
        '&:focus': {
          borderColor: designTokens.colors.success[500],
          boxShadow: `0 0 0 3px ${designTokens.colors.success[200]}`
        }
      }
    }
  },

  // Typography styles
  typography: {
    h1: {
      fontSize: designTokens.typography.fontSize['3xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: designTokens.typography.lineHeight.tight,
      color: designTokens.colors.neutral[900],
      marginBottom: designTokens.spacing[6]
    },
    
    h2: {
      fontSize: designTokens.typography.fontSize['2xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.tight,
      color: designTokens.colors.neutral[800],
      marginBottom: designTokens.spacing[4]
    },
    
    h3: {
      fontSize: designTokens.typography.fontSize.xl,
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.snug,
      color: designTokens.colors.neutral[800],
      marginBottom: designTokens.spacing[3]
    },
    
    h4: {
      fontSize: designTokens.typography.fontSize.lg,
      fontWeight: designTokens.typography.fontWeight.medium,
      lineHeight: designTokens.typography.lineHeight.snug,
      color: designTokens.colors.neutral[700],
      marginBottom: designTokens.spacing[2]
    },
    
    body: {
      fontSize: designTokens.typography.fontSize.base,
      fontWeight: designTokens.typography.fontWeight.normal,
      lineHeight: designTokens.typography.lineHeight.relaxed,
      color: designTokens.colors.neutral[700],
      marginBottom: designTokens.spacing[4]
    },
    
    caption: {
      fontSize: designTokens.typography.fontSize.sm,
      fontWeight: designTokens.typography.fontWeight.normal,
      lineHeight: designTokens.typography.lineHeight.normal,
      color: designTokens.colors.neutral[500]
    },
    
    code: {
      fontFamily: designTokens.typography.fontFamily.mono.join(', '),
      fontSize: designTokens.typography.fontSize.sm,
      backgroundColor: designTokens.colors.neutral[100],
      color: designTokens.colors.neutral[800],
      padding: `${designTokens.spacing[1]} ${designTokens.spacing[1.5]}`,
      borderRadius: designTokens.borderRadius.sm
    }
  }
}

// Layout utilities
export const layoutUtilities = {
  container: {
    maxWidth: {
      sm: designTokens.breakpoints.sm,
      md: designTokens.breakpoints.md,
      lg: designTokens.breakpoints.lg,
      xl: designTokens.breakpoints.xl,
      '2xl': designTokens.breakpoints['2xl']
    },
    margin: '0 auto',
    padding: `0 ${designTokens.spacing[4]}`
  },
  
  grid: {
    base: {
      display: 'grid',
      gap: designTokens.spacing[6]
    },
    
    layouts: {
      sidebar: {
        gridTemplateColumns: '250px 1fr',
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr'
        }
      },
      
      twoColumn: {
        gridTemplateColumns: 'repeat(2, 1fr)',
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr'
        }
      },
      
      threeColumn: {
        gridTemplateColumns: 'repeat(3, 1fr)',
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr'
        },
        '@media (max-width: 1024px)': {
          gridTemplateColumns: 'repeat(2, 1fr)'
        }
      }
    }
  },
  
  flexbox: {
    center: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    
    between: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    
    column: {
      display: 'flex',
      flexDirection: 'column'
    },
    
    wrap: {
      display: 'flex',
      flexWrap: 'wrap'
    }
  }
}

// Utility functions for design system
export const designUtils = {
  // Get color with opacity
  withOpacity: (color, opacity) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  },
  
  // Responsive utilities
  responsive: {
    sm: (styles) => ({
      [`@media (min-width: ${designTokens.breakpoints.sm})`]: styles
    }),
    md: (styles) => ({
      [`@media (min-width: ${designTokens.breakpoints.md})`]: styles
    }),
    lg: (styles) => ({
      [`@media (min-width: ${designTokens.breakpoints.lg})`]: styles
    }),
    xl: (styles) => ({
      [`@media (min-width: ${designTokens.breakpoints.xl})`]: styles
    }),
    '2xl': (styles) => ({
      [`@media (min-width: ${designTokens.breakpoints['2xl']})`]: styles
    })
  },
  
  // Focus utilities
  focusRing: (color = designTokens.colors.primary[500]) => ({
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${designUtils.withOpacity(color, 0.3)}`
    }
  }),
  
  // Truncate text
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  
  // Screen reader only
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: '0'
  }
}

export default {
  designTokens,
  componentStyles,
  layoutUtilities,
  designUtils
}