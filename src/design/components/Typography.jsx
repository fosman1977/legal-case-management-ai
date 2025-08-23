/**
 * Typography Components - Week 13 Day 1-2
 * Professional typography system with design system integration
 */

import React, { forwardRef } from 'react'
import { useTheme } from '../ThemeProvider.jsx'

// Base Text component
export const Text = forwardRef(({
  as = 'p',
  variant = 'body',
  color = null,
  size = null,
  weight = null,
  align = 'left',
  decoration = 'none',
  transform = 'none',
  truncate = false,
  children,
  className = '',
  ...props
}, ref) => {
  const { getTypographyStyles, tokens, cx } = useTheme()
  
  const baseStyles = getTypographyStyles(variant)
  
  const customStyles = {
    ...baseStyles,
    ...(color && { color: tokens.colors[color] || color }),
    ...(size && { fontSize: tokens.typography.fontSize[size] || size }),
    ...(weight && { fontWeight: tokens.typography.fontWeight[weight] || weight }),
    textAlign: align,
    textDecoration: decoration,
    textTransform: transform,
    ...(truncate && {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    })
  }
  
  const Component = as
  
  return (
    <Component
      ref={ref}
      style={customStyles}
      className={`text text--${variant} ${className || ''}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
})

Text.displayName = 'Text'

// Heading components
export const Heading = forwardRef(({
  level = 1,
  size = null,
  children,
  className = '',
  ...props
}, ref) => {
  const headingTag = `h${Math.min(Math.max(level, 1), 6)}`
  const variantMap = {
    1: 'h1',
    2: 'h2', 
    3: 'h3',
    4: 'h4',
    5: 'h4',
    6: 'h4'
  }
  
  const variant = size || variantMap[level]
  
  return (
    <Text
      ref={ref}
      as={headingTag}
      variant={variant}
      className={`heading heading--${level} ${className || ''}`.trim()}
      {...props}
    >
      {children}
    </Text>
  )
})

Heading.displayName = 'Heading'

// Specialized heading components
export const H1 = forwardRef((props, ref) => (
  <Heading ref={ref} level={1} {...props} />
))
H1.displayName = 'H1'

export const H2 = forwardRef((props, ref) => (
  <Heading ref={ref} level={2} {...props} />
))
H2.displayName = 'H2'

export const H3 = forwardRef((props, ref) => (
  <Heading ref={ref} level={3} {...props} />
))
H3.displayName = 'H3'

export const H4 = forwardRef((props, ref) => (
  <Heading ref={ref} level={4} {...props} />
))
H4.displayName = 'H4'

// Paragraph component
export const Paragraph = forwardRef(({
  size = 'base',
  leading = 'relaxed',
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const leadingMap = {
    none: tokens.typography.lineHeight.none,
    tight: tokens.typography.lineHeight.tight,
    snug: tokens.typography.lineHeight.snug,
    normal: tokens.typography.lineHeight.normal,
    relaxed: tokens.typography.lineHeight.relaxed,
    loose: tokens.typography.lineHeight.loose
  }
  
  return (
    <Text
      ref={ref}
      as="p"
      variant="body"
      size={size}
      className={`paragraph ${className || ''}`.trim()}
      style={{
        lineHeight: leadingMap[leading] || leadingMap.relaxed
      }}
      {...props}
    >
      {children}
    </Text>
  )
})

Paragraph.displayName = 'Paragraph'

// Caption component
export const Caption = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <Text
      ref={ref}
      variant="caption"
      className={`caption ${className || ''}`.trim()}
      {...props}
    >
      {children}
    </Text>
  )
})

Caption.displayName = 'Caption'

// Code component
export const Code = forwardRef(({
  inline = true,
  children,
  className = '',
  ...props
}, ref) => {
  const { getTypographyStyles, cx } = useTheme()
  
  const codeStyles = getTypographyStyles('code')
  
  if (inline) {
    return (
      <code
        ref={ref}
        style={codeStyles}
        className={`code code--inline ${className || ''}`.trim()}
        {...props}
      >
        {children}
      </code>
    )
  }
  
  return (
    <pre
      ref={ref}
      style={{
        ...codeStyles,
        display: 'block',
        padding: tokens.spacing[4],
        overflow: 'auto',
        borderRadius: tokens.borderRadius.md
      }}
      className={`code code--block ${className || ''}`.trim()}
      {...props}
    >
      <code>{children}</code>
    </pre>
  )
})

Code.displayName = 'Code'

// Label component
export const Label = forwardRef(({
  htmlFor,
  required = false,
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const labelStyles = {
    display: 'block',
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.neutral[700],
    marginBottom: tokens.spacing[1]
  }
  
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      style={labelStyles}
      className={`label ${className || ''}`.trim()}
      {...props}
    >
      {children}
      {required && (
        <span 
          style={{ 
            color: tokens.colors.error[500],
            marginLeft: tokens.spacing[1]
          }}
          aria-label="required"
        >
          *
        </span>
      )}
    </label>
  )
})

Label.displayName = 'Label'

// Link component
export const Link = forwardRef(({
  href,
  external = false,
  underline = 'hover',
  color = 'primary.600',
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const linkStyles = {
    color: tokens.colors.primary[600],
    textDecoration: underline === 'always' ? 'underline' : 'none',
    transition: tokens.transitions.colors,
    cursor: 'pointer',
    ...(underline === 'hover' && {
      '&:hover': {
        textDecoration: 'underline'
      }
    }),
    '&:hover': {
      color: tokens.colors.primary[700]
    },
    '&:focus': {
      outline: `2px solid ${tokens.colors.primary[500]}`,
      outlineOffset: '2px',
      borderRadius: tokens.borderRadius.sm
    }
  }
  
  const linkProps = {
    ...props,
    ...(external && {
      target: '_blank',
      rel: 'noopener noreferrer'
    })
  }
  
  return (
    <a
      ref={ref}
      href={href}
      style={linkStyles}
      className={`link ${className || ''}`.trim()}
      {...linkProps}
    >
      {children}
      {external && (
        <span 
          style={{ 
            marginLeft: tokens.spacing[1],
            fontSize: '0.8em'
          }}
          aria-label="opens in new window"
        >
          ↗
        </span>
      )}
    </a>
  )
})

Link.displayName = 'Link'

// List components
export const List = forwardRef(({
  as = 'ul',
  spacing = 'sm',
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const spacingMap = {
    none: 0,
    sm: tokens.spacing[1],
    md: tokens.spacing[2],
    lg: tokens.spacing[3]
  }
  
  const listStyles = {
    margin: 0,
    padding: 0,
    listStyle: as === 'ol' ? 'decimal' : 'disc',
    paddingLeft: tokens.spacing[6]
  }
  
  const Component = as
  
  return (
    <Component
      ref={ref}
      style={listStyles}
      className={`list ${className || ''}`.trim()}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <li 
          key={index}
          style={{
            marginBottom: spacingMap[spacing],
            lineHeight: tokens.typography.lineHeight.relaxed
          }}
        >
          {child}
        </li>
      ))}
    </Component>
  )
})

List.displayName = 'List'

export const OrderedList = forwardRef((props, ref) => (
  <List ref={ref} as="ol" {...props} />
))
OrderedList.displayName = 'OrderedList'

export const UnorderedList = forwardRef((props, ref) => (
  <List ref={ref} as="ul" {...props} />
))
UnorderedList.displayName = 'UnorderedList'

// Blockquote component
export const Blockquote = forwardRef(({
  cite,
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const blockquoteStyles = {
    margin: `${tokens.spacing[6]} 0`,
    padding: `${tokens.spacing[4]} ${tokens.spacing[6]}`,
    borderLeft: `4px solid ${tokens.colors.primary[500]}`,
    backgroundColor: tokens.colors.neutral[50],
    fontStyle: 'italic',
    fontSize: tokens.typography.fontSize.lg,
    lineHeight: tokens.typography.lineHeight.relaxed,
    color: tokens.colors.neutral[700]
  }
  
  return (
    <blockquote
      ref={ref}
      cite={cite}
      style={blockquoteStyles}
      className={`blockquote ${className || ''}`.trim()}
      {...props}
    >
      {children}
    </blockquote>
  )
})

Blockquote.displayName = 'Blockquote'

// Mark/Highlight component
export const Mark = forwardRef(({
  color = 'warning',
  children,
  className = '',
  ...props
}, ref) => {
  const { tokens, cx } = useTheme()
  
  const colorMap = {
    primary: tokens.colors.primary[100],
    warning: tokens.colors.warning[100],
    success: tokens.colors.success[100],
    error: tokens.colors.error[100]
  }
  
  const markStyles = {
    backgroundColor: colorMap[color] || colorMap.warning,
    padding: `${tokens.spacing[0.5]} ${tokens.spacing[1]}`,
    borderRadius: tokens.borderRadius.sm,
    fontWeight: tokens.typography.fontWeight.medium
  }
  
  return (
    <mark
      ref={ref}
      style={markStyles}
      className={`mark ${className || ''}`.trim()}
      {...props}
    >
      {children}
    </mark>
  )
})

Mark.displayName = 'Mark'

export default Text