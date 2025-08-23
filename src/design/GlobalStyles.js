/**
 * Global Styles - Week 13 Day 1-2
 * Global CSS styles for professional legal application
 */

import { designTokens } from './DesignSystem'

export const createGlobalStyles = (theme = designTokens) => `
  /* Reset and base styles */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    scroll-behavior: smooth;
  }

  body {
    font-family: ${theme.typography.fontFamily.sans.join(', ')};
    font-size: ${theme.typography.fontSize.base};
    font-weight: ${theme.typography.fontWeight.normal};
    line-height: ${theme.typography.lineHeight.normal};
    color: ${theme.colors.neutral[700]};
    background-color: ${theme.colors.neutral[50]};
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Typography reset */
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: inherit;
    color: ${theme.colors.neutral[900]};
  }

  p {
    margin: 0;
    line-height: ${theme.typography.lineHeight.relaxed};
  }

  /* Link styles */
  a {
    color: ${theme.colors.primary[600]};
    text-decoration: none;
    transition: ${theme.transitions.colors};
  }

  a:hover {
    color: ${theme.colors.primary[700]};
    text-decoration: underline;
  }

  a:focus {
    outline: 2px solid ${theme.colors.primary[500]};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }

  /* Button reset */
  button {
    border: none;
    background: none;
    font: inherit;
    cursor: pointer;
  }

  /* Form elements */
  input, textarea, select {
    font: inherit;
    color: inherit;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
  }

  /* List reset */
  ul, ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  /* Table styles */
  table {
    border-collapse: collapse;
    border-spacing: 0;
    width: 100%;
  }

  /* Image styles */
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Focus visible for better accessibility */
  :focus-visible {
    outline: 2px solid ${theme.colors.primary[500]};
    outline-offset: 2px;
  }

  /* Selection styles */
  ::selection {
    background-color: ${theme.colors.primary[200]};
    color: ${theme.colors.primary[900]};
  }

  /* Scrollbar styles for webkit browsers */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.neutral[100]};
    border-radius: ${theme.borderRadius.full};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.neutral[300]};
    border-radius: ${theme.borderRadius.full};
    transition: ${theme.transitions.colors};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.neutral[400]};
  }

  /* Print styles */
  @media print {
    * {
      color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      background: white !important;
      color: black !important;
      font-size: 12pt;
      line-height: 1.4;
    }

    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      color: black !important;
    }

    p {
      orphans: 3;
      widows: 3;
    }

    .no-print {
      display: none !important;
    }
  }

  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  /* Legal document specific styles */
  .legal-document {
    font-family: ${theme.typography.fontFamily.serif.join(', ')};
    line-height: ${theme.typography.lineHeight.loose};
    max-width: 65ch;
    margin: 0 auto;
  }

  .legal-document h1,
  .legal-document h2,
  .legal-document h3 {
    font-family: ${theme.typography.fontFamily.sans.join(', ')};
    text-align: center;
    margin: ${theme.spacing[8]} 0 ${theme.spacing[6]} 0;
  }

  .legal-document p {
    margin-bottom: ${theme.spacing[4]};
    text-align: justify;
  }

  .legal-document .clause {
    margin: ${theme.spacing[6]} 0;
    padding-left: ${theme.spacing[6]};
  }

  .legal-document .signature-block {
    margin-top: ${theme.spacing[12]};
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing[8]};
  }

  /* Case timeline styles */
  .timeline {
    position: relative;
    padding-left: ${theme.spacing[8]};
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: ${theme.spacing[3]};
    top: 0;
    bottom: 0;
    width: 2px;
    background: ${theme.colors.neutral[300]};
  }

  .timeline-item {
    position: relative;
    padding-bottom: ${theme.spacing[6]};
  }

  .timeline-item::before {
    content: '';
    position: absolute;
    left: -${theme.spacing[5]};
    top: ${theme.spacing[1]};
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${theme.colors.primary[500]};
    border: 2px solid white;
    box-shadow: ${theme.shadows.sm};
  }

  /* Evidence priority styles */
  .evidence-high { border-left: 4px solid ${theme.colors.success[500]}; }
  .evidence-medium { border-left: 4px solid ${theme.colors.warning[500]}; }
  .evidence-low { border-left: 4px solid ${theme.colors.neutral[400]}; }

  /* Status indicators */
  .status-draft { color: ${theme.colors.warning[600]}; }
  .status-review { color: ${theme.colors.primary[600]}; }
  .status-final { color: ${theme.colors.success[600]}; }
  .status-confidential { color: ${theme.colors.error[600]}; }

  /* Animation keyframes */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Utility animations */
  .animate-fade-in {
    animation: fadeIn ${theme.animation.duration[300]} ${theme.animation.easing.out};
  }

  .animate-slide-up {
    animation: slideInUp ${theme.animation.duration[300]} ${theme.animation.easing.out};
  }

  .animate-slide-right {
    animation: slideInRight ${theme.animation.duration[300]} ${theme.animation.easing.out};
  }

  .animate-pulse {
    animation: pulse ${theme.animation.duration[1000]} ${theme.animation.easing.inOut} infinite;
  }

  /* Loading states */
  .loading {
    position: relative;
    color: transparent !important;
    pointer-events: none;
  }

  .loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px;
    border: 2px solid ${theme.colors.neutral[300]};
    border-top-color: ${theme.colors.primary[500]};
    border-radius: 50%;
    animation: spin ${theme.animation.duration[1000]} linear infinite;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    * {
      border-color: currentColor !important;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Focus management for accessibility */
  .focus-trap {
    position: fixed;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  /* Skip link styles */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: ${theme.colors.neutral[900]};
    color: white;
    padding: ${theme.spacing[2]} ${theme.spacing[4]};
    text-decoration: none;
    border-radius: ${theme.borderRadius.md};
    font-size: ${theme.typography.fontSize.sm};
    z-index: ${theme.zIndex[1000]};
    transition: top ${theme.animation.duration[200]} ${theme.animation.easing.out};
  }

  .skip-link:focus {
    top: 6px;
  }
`

export const injectGlobalStyles = (theme = designTokens) => {
  const styleId = 'legal-app-global-styles'
  
  // Remove existing styles
  const existingStyles = document.getElementById(styleId)
  if (existingStyles) {
    existingStyles.remove()
  }
  
  // Create and inject new styles
  const styleElement = document.createElement('style')
  styleElement.id = styleId
  styleElement.textContent = createGlobalStyles(theme)
  document.head.appendChild(styleElement)
}

export default createGlobalStyles