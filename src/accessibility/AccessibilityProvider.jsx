/**
 * Accessibility Provider - Week 17 Day 3-4
 * Global accessibility context and configuration
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useKeyboardShortcuts, useScreenReaderAnnouncements } from './KeyboardShortcuts.js';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    reducedMotion: false,
    highContrast: false,
    focusVisible: true,
    screenReader: false,
    keyboardNavigation: true,
    fontSize: 'medium' // small, medium, large
  });

  const { announce } = useScreenReaderAnnouncements();

  // Detect user preferences
  useEffect(() => {
    const updateSettings = () => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        screenReader: window.navigator.userAgent.includes('NVDA') || 
                     window.navigator.userAgent.includes('JAWS') || 
                     window.speechSynthesis
      }));
    };

    updateSettings();
    
    // Listen for preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    motionQuery.addEventListener('change', updateSettings);
    contrastQuery.addEventListener('change', updateSettings);
    
    return () => {
      motionQuery.removeEventListener('change', updateSettings);
      contrastQuery.removeEventListener('change', updateSettings);
    };
  }, []);

  // Apply accessibility classes to document
  useEffect(() => {
    const classes = [];
    
    if (settings.reducedMotion) classes.push('reduced-motion');
    if (settings.highContrast) classes.push('high-contrast');
    if (settings.focusVisible) classes.push('focus-visible');
    if (settings.keyboardNavigation) classes.push('keyboard-nav');
    
    classes.push(`font-size-${settings.fontSize}`);
    
    document.documentElement.className = classes.join(' ');
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    announce(`${key} changed to ${value}`);
  };

  const contextValue = {
    settings,
    updateSetting,
    announce
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// HOC for accessibility enhancements
export const withAccessibility = (Component) => {
  return function AccessibleComponent(props) {
    const accessibility = useAccessibility();
    
    return (
      <Component 
        {...props} 
        accessibility={accessibility}
      />
    );
  };
};

// Custom hook for keyboard navigation within components
export const useComponentKeyboardNav = (options = {}) => {
  const {
    onEscape,
    onEnter,
    onSpace,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    disabled = false
  } = options;

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          onEscape?.(event);
          break;
        case 'Enter':
          onEnter?.(event);
          break;
        case ' ':
          onSpace?.(event);
          break;
        case 'ArrowUp':
          onArrowUp?.(event);
          break;
        case 'ArrowDown':
          onArrowDown?.(event);
          break;
        case 'ArrowLeft':
          onArrowLeft?.(event);
          break;
        case 'ArrowRight':
          onArrowRight?.(event);
          break;
        case 'Tab':
          onTab?.(event);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onEnter, onSpace, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, disabled]);
};

export default AccessibilityProvider;