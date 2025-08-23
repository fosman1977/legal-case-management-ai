/**
 * Layout Components - Week 13 Day 1-2
 * Professional layout components with design system integration
 */

import React, { forwardRef } from 'react'
import { useTheme } from '../ThemeProvider.jsx'

// Container component
export const Container = forwardRef(({
  size = 'xl',
  padding = true,
  center = true,
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx, responsive } = useTheme()
  
  const sizeMap = {
    sm: tokens.breakpoints.sm,
    md: tokens.breakpoints.md,
    lg: tokens.breakpoints.lg,
    xl: tokens.breakpoints.xl,
    '2xl': tokens.breakpoints['2xl'],
    full: '100%'
  }
  
  const containerStyles = {
    width: '100%',
    maxWidth: sizeMap[size] || sizeMap.xl,
    ...(center && { margin: '0 auto' }),
    ...(padding && { 
      paddingLeft: tokens.spacing[4],
      paddingRight: tokens.spacing[4],
      ...responsive.md({
        paddingLeft: tokens.spacing[6],
        paddingRight: tokens.spacing[6]
      }),
      ...responsive.lg({
        paddingLeft: tokens.spacing[8],
        paddingRight: tokens.spacing[8]
      })
    })
  }
  
  return (
    <div
      ref={ref}
      style={containerStyles}
      className={cx('container', className)}
      {...props}
    >
      {children}
    </div>
  )
})

Container.displayName = 'Container'

// Stack component for vertical layouts
export const Stack = forwardRef(({
  spacing = 4,
  align = 'stretch',
  justify = 'flex-start',
  wrap = false,
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const stackStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: align,
    justifyContent: justify,
    gap: typeof spacing === 'number' ? tokens.spacing[spacing] : spacing,
    ...(wrap && { flexWrap: 'wrap' })
  }
  
  return (
    <div
      ref={ref}
      style={stackStyles}
      className={cx('stack', className)}
      {...props}
    >
      {children}
    </div>
  )
})

Stack.displayName = 'Stack'

// Flex component for flexible layouts
export const Flex = forwardRef(({
  direction = 'row',
  align = 'stretch',
  justify = 'flex-start',
  wrap = false,
  gap = 0,
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const flexStyles = {
    display: 'flex',
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    gap: typeof gap === 'number' ? tokens.spacing[gap] : gap
  }
  
  return (
    <div
      ref={ref}
      style={flexStyles}
      className={cx('flex', className)}
      {...props}
    >
      {children}
    </div>
  )
})

Flex.displayName = 'Flex'

// Grid component
export const Grid = forwardRef(({
  columns = 1,
  rows = 'auto',
  gap = 4,
  columnGap = null,
  rowGap = null,
  areas = null,
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx, responsive } = useTheme()
  
  const getColumns = (cols) => {
    if (typeof cols === 'number') {
      return `repeat(${cols}, 1fr)`
    }
    if (typeof cols === 'object') {
      // Responsive columns
      return `repeat(${cols.base || 1}, 1fr)`
    }
    return cols
  }
  
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: getColumns(columns),
    gridTemplateRows: rows,
    gap: typeof gap === 'number' ? tokens.spacing[gap] : gap,
    ...(columnGap && { columnGap: typeof columnGap === 'number' ? tokens.spacing[columnGap] : columnGap }),
    ...(rowGap && { rowGap: typeof rowGap === 'number' ? tokens.spacing[rowGap] : rowGap }),
    ...(areas && { gridTemplateAreas: areas })
  }
  
  // Add responsive column handling
  if (typeof columns === 'object') {
    Object.entries(columns).forEach(([breakpoint, cols]) => {
      if (breakpoint !== 'base') {
        Object.assign(gridStyles, responsive[breakpoint]({
          gridTemplateColumns: getColumns(cols)
        }))
      }
    })
  }
  
  return (
    <div
      ref={ref}
      style={gridStyles}
      className={cx('grid', className)}
      {...props}
    >
      {children}
    </div>
  )
})

Grid.displayName = 'Grid'

// Grid item component
export const GridItem = forwardRef(({
  colSpan = 1,
  rowSpan = 1,
  colStart = null,
  colEnd = null,
  rowStart = null,
  rowEnd = null,
  area = null,
  children,
  className = '',
  ...props
}, ref) => {
  const { cx } = useTheme()
  
  const gridItemStyles = {
    gridColumn: colStart && colEnd ? `${colStart} / ${colEnd}` : 
                 colSpan > 1 ? `span ${colSpan}` : undefined,
    gridRow: rowStart && rowEnd ? `${rowStart} / ${rowEnd}` : 
             rowSpan > 1 ? `span ${rowSpan}` : undefined,
    ...(area && { gridArea: area })
  }
  
  return (
    <div
      ref={ref}
      style={gridItemStyles}
      className={cx('grid-item', className)}
      {...props}
    >
      {children}
    </div>
  )
})

GridItem.displayName = 'GridItem'

// Spacer component
export const Spacer = ({ size = 4, direction = 'vertical' }) => {
  const { tokens } = useTheme()
  
  const spacerStyles = {
    ...(direction === 'vertical' && { 
      height: typeof size === 'number' ? tokens.spacing[size] : size,
      width: '100%'
    }),
    ...(direction === 'horizontal' && { 
      width: typeof size === 'number' ? tokens.spacing[size] : size,
      height: '100%'
    })
  }
  
  return <div style={spacerStyles} aria-hidden="true" />
}

// Divider component
export const Divider = forwardRef(({
  orientation = 'horizontal',
  size = 'md',
  color = 'neutral.200',
  className = '',
  ...props
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const sizeMap = {
    sm: '1px',
    md: '1px',
    lg: '2px'
  }
  
  const dividerStyles = {
    border: 'none',
    backgroundColor: tokens.colors.neutral[200],
    ...(orientation === 'horizontal' && {
      width: '100%',
      height: sizeMap[size],
      margin: `${tokens.spacing[4]} 0`
    }),
    ...(orientation === 'vertical' && {
      height: '100%',
      width: sizeMap[size],
      margin: `0 ${tokens.spacing[4]}`
    })
  }
  
  return (
    <hr
      ref={ref}
      style={dividerStyles}
      className={cx('divider', `divider--${orientation}`, className)}
      {...props}
    />
  )
})

Divider.displayName = 'Divider'

// Center component
export const Center = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  const { cx } = useTheme()
  
  const centerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
  
  return (
    <div
      ref={ref}
      style={centerStyles}
      className={cx('center', className)}
      {...props}
    >
      {children}
    </div>
  )
})

Center.displayName = 'Center'

// Aspect Ratio component
export const AspectRatio = forwardRef(({
  ratio = 16 / 9,
  children,
  className = '',
  ...props
}, ref) => {
  const { cx } = useTheme()
  
  const aspectStyles = {
    position: 'relative',
    width: '100%',
    paddingBottom: `${(1 / ratio) * 100}%`
  }
  
  const contentStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
  
  return (
    <div
      ref={ref}
      style={aspectStyles}
      className={cx('aspect-ratio', className)}
      {...props}
    >
      <div style={contentStyles}>
        {children}
      </div>
    </div>
  )
})

AspectRatio.displayName = 'AspectRatio'

// Sidebar Layout component
export const SidebarLayout = forwardRef(({
  sidebar,
  sidebarWidth = '250px',
  sidebarPosition = 'left',
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx, responsive } = useTheme()
  
  const layoutStyles = {
    display: 'grid',
    gridTemplateColumns: sidebarPosition === 'left' ? 
      `${sidebarWidth} 1fr` : `1fr ${sidebarWidth}`,
    gap: tokens.spacing[6],
    minHeight: '100vh',
    ...responsive.md({
      gridTemplateColumns: '1fr',
      gap: tokens.spacing[4]
    })
  }
  
  return (
    <div
      ref={ref}
      style={layoutStyles}
      className={cx('sidebar-layout', className)}
      {...props}
    >
      {sidebarPosition === 'left' && (
        <aside className="sidebar">
          {sidebar}
        </aside>
      )}
      
      <main className="main-content">
        {children}
      </main>
      
      {sidebarPosition === 'right' && (
        <aside className="sidebar">
          {sidebar}
        </aside>
      )}
    </div>
  )
})

SidebarLayout.displayName = 'SidebarLayout'

// Header Layout component
export const HeaderLayout = forwardRef(({
  header,
  headerHeight = 'auto',
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const layoutStyles = {
    display: 'grid',
    gridTemplateRows: `${headerHeight} 1fr`,
    minHeight: '100vh',
    gap: 0
  }
  
  const headerStyles = {
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
    backgroundColor: tokens.colors.background || 'white',
    zIndex: tokens.zIndex[100]
  }
  
  return (
    <div
      ref={ref}
      style={layoutStyles}
      className={cx('header-layout', className)}
      {...props}
    >
      <header style={headerStyles}>
        {header}
      </header>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  )
})

HeaderLayout.displayName = 'HeaderLayout'

export default Container