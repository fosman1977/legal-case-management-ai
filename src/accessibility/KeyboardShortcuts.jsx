/**
 * Keyboard Shortcuts & Accessibility - Week 17 Day 3-4
 * Comprehensive accessibility features and keyboard navigation
 */

import { useEffect, useCallback, useRef } from 'react';
import React from 'react';

// Global keyboard shortcuts hook
export const useKeyboardShortcuts = (navigationCallbacks = {}) => {
  const {
    navigateTo = () => {},
    focusSearch = () => {},
    toggleAIConsultation = () => {},
    openExportDialog = () => {},
    closeModals = () => {},
    clearSelections = () => {}
  } = navigationCallbacks;

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Global shortcuts with Ctrl/Cmd
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'u':
            event.preventDefault();
            navigateTo('brief'); // Upload documents
            break;
          case 'f':
            event.preventDefault();
            focusSearch();
            break;
          case 't':
            event.preventDefault();
            navigateTo('insights'); // Timeline in insights
            break;
          case 'a':
            event.preventDefault();
            toggleAIConsultation();
            break;
          case 'e':
            event.preventDefault();
            openExportDialog();
            break;
          case 'd':
            event.preventDefault();
            navigateTo('privacy'); // Data/Privacy dashboard
            break;
          case 'h':
            event.preventDefault();
            navigateTo('dashboard'); // Home
            break;
          case 'r':
            event.preventDefault();
            navigateTo('research'); // Research
            break;
          case 's':
            event.preventDefault();
            navigateTo('skeleton'); // Arguments
            break;
        }
      }

      // Function key shortcuts
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          showKeyboardShortcuts();
          break;
        case 'Escape':
          closeModals();
          clearSelections();
          break;
      }

      // Arrow key navigation for lists and timelines
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        handleListNavigation(event);
      }

      // Tab navigation enhancement
      if (event.key === 'Tab') {
        enhanceFocusVisibility();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigateTo, focusSearch, toggleAIConsultation, openExportDialog, closeModals, clearSelections]);

  const handleListNavigation = (event) => {
    const activeElement = document.activeElement;
    const listContainer = activeElement.closest('[role="listbox"], [role="grid"], .timeline-chart');
    
    if (listContainer) {
      event.preventDefault();
      const focusableItems = listContainer.querySelectorAll('[tabindex="0"], button, [role="option"]');
      const currentIndex = Array.from(focusableItems).indexOf(activeElement);
      
      let nextIndex;
      if (event.key === 'ArrowDown') {
        nextIndex = currentIndex < focusableItems.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableItems.length - 1;
      }
      
      focusableItems[nextIndex]?.focus();
    }
  };

  const enhanceFocusVisibility = () => {
    document.body.classList.add('keyboard-navigation');
    setTimeout(() => document.body.classList.remove('keyboard-navigation'), 3000);
  };

  const showKeyboardShortcuts = () => {
    const shortcuts = [
      'Ctrl+U: Upload Documents',
      'Ctrl+F: Focus Search',
      'Ctrl+T: View Timeline',
      'Ctrl+A: AI Consultation',
      'Ctrl+E: Export',
      'Ctrl+D: Privacy Dashboard',
      'Ctrl+H: Home',
      'Ctrl+R: Research',
      'Ctrl+S: Arguments',
      'F1: Show Shortcuts',
      'Escape: Close Modals',
      'Arrow Keys: Navigate Lists'
    ];
    
    alert('Keyboard Shortcuts:\n\n' + shortcuts.join('\n'));
  };
};

// Accessible button component with enhanced keyboard support
export const AccessibleButton = ({ 
  children, 
  onClick, 
  active = false, 
  disabled = false, 
  variant = 'primary',
  size = 'md',
  ariaLabel,
  ariaDescribedBy,
  ...props 
}) => {
  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onClick?.(e);
    }
  };

  const getVariantStyles = () => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300'
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    return sizes[size] || sizes.md;
  };

  return (
    <button
      {...props}
      role="button"
      aria-pressed={active}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      tabIndex={disabled ? -1 : 0}
      disabled={disabled}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        font-medium rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${props.className || ''}
      `}
    >
      {children}
    </button>
  );
};

// Accessible tab list with full keyboard navigation
export const AccessibleTabList = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  orientation = 'horizontal',
  ariaLabel = 'Tab navigation'
}) => {
  const tabRefs = useRef({});

  const handleKeyDown = (e, tab, index) => {
    let nextIndex;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = index > 0 ? index - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = index < tabs.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    
    const nextTab = tabs[nextIndex];
    onTabChange(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  };

  return (
    <div 
      role="tablist" 
      aria-label={ariaLabel}
      aria-orientation={orientation}
      className="border-b border-gray-200"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={el => tabRefs.current[tab.id] = el}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, tab, index)}
          className={`
            px-4 py-2 font-medium text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${activeTab === tab.id
              ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }
          `}
        >
          {tab.icon && (
            <tab.icon 
              className="w-4 h-4 inline-block mr-2" 
              aria-hidden="true" 
            />
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// Screen reader announcements
export const useScreenReaderAnnouncements = () => {
  const announce = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only absolute -m-px w-px h-px p-0 border-0 overflow-hidden whitespace-nowrap';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, []);

  return { announce };
};

// Accessible modal with focus management
export const AccessibleModal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  description 
}) => {
  const modalRef = useRef();
  const previousActiveElement = useRef();

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      modalRef.current?.focus();
      
      // Trap focus within modal
      const trapFocus = (e) => {
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        } else if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', trapFocus);
      return () => {
        document.removeEventListener('keydown', trapFocus);
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-25" 
          onClick={onClose}
          aria-hidden="true"
        />
        
        <div
          ref={modalRef}
          tabIndex={-1}
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 focus:outline-none"
        >
          {title && (
            <h2 id="modal-title" className="text-lg font-semibold mb-4">
              {title}
            </h2>
          )}
          
          {description && (
            <div id="modal-description" className="sr-only">
              {description}
            </div>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
};

// Accessible form field with proper labeling
export const AccessibleFormField = ({ 
  label, 
  id, 
  error, 
  helpText, 
  required = false,
  children 
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;

  return (
    <div className="mb-4">
      <label 
        htmlFor={id} 
        className={`block text-sm font-medium mb-2 ${
          error ? 'text-red-700' : 'text-gray-700'
        }`}
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>
      
      {React.cloneElement(children, {
        id,
        'aria-describedby': [helpId, errorId].filter(Boolean).join(' '),
        'aria-invalid': error ? 'true' : 'false',
        required
      })}
      
      {helpText && (
        <p id={helpId} className="mt-1 text-sm text-gray-600">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Skip to main content link
export const SkipToMainContent = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white px-4 py-2 z-50"
  >
    Skip to main content
  </a>
);

// Focus management utility
export const useFocusManagement = () => {
  const focusableSelectors = [
    'button:not(:disabled)',
    '[href]',
    'input:not(:disabled)',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  const getFocusableElements = (container = document) => {
    return Array.from(container.querySelectorAll(focusableSelectors));
  };

  const focusFirst = (container) => {
    const elements = getFocusableElements(container);
    elements[0]?.focus();
  };

  const focusLast = (container) => {
    const elements = getFocusableElements(container);
    elements[elements.length - 1]?.focus();
  };

  return {
    getFocusableElements,
    focusFirst,
    focusLast
  };
};

// Live region for dynamic content announcements
export const LiveRegion = ({ children, priority = 'polite' }) => (
  <div
    aria-live={priority}
    aria-atomic="true"
    className="sr-only"
  >
    {children}
  </div>
);

export default {
  useKeyboardShortcuts,
  AccessibleButton,
  AccessibleTabList,
  useScreenReaderAnnouncements,
  AccessibleModal,
  AccessibleFormField,
  SkipToMainContent,
  useFocusManagement,
  LiveRegion
};