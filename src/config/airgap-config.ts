/**
 * AIR-GAP CONFIGURATION
 * User-selectable security modes for different environments
 */

export type SecurityMode = 'enhanced' | 'hybrid' | 'airgap' | 'auto';

// Default configuration - can be overridden by user selection
let currentSecurityMode: SecurityMode = 'hybrid';

export const SECURITY_MODE_CONFIGS = {
  enhanced: {
    FULLY_OFFLINE: false,
    OCR: {
      ENABLED: true,
      ALLOW_EXTERNAL_MODELS: true,
      LOCAL_MODEL_PATH: '/models/tessdata',
    },
    PDF: {
      USE_MAIN_THREAD: true,
      ALLOW_CDN_FALLBACK: false, // Still no CDN for security
    },
    FEATURES: {
      PDF_TEXT_EXTRACTION: true,
      WORD_DOCUMENT_PROCESSING: true,
      TEXT_FILE_PROCESSING: true,
      LEGAL_ENTITY_EXTRACTION: true,
      DOCUMENT_CLASSIFICATION: true,
      TABLE_DETECTION: true,
      OCR_SCANNED_DOCUMENTS: true,
    }
  },

  hybrid: {
    FULLY_OFFLINE: false, // Allow initial download
    OCR: {
      ENABLED: true,
      ALLOW_EXTERNAL_MODELS: true, // One-time download
      LOCAL_MODEL_PATH: '/models/tessdata',
    },
    PDF: {
      USE_MAIN_THREAD: true,
      ALLOW_CDN_FALLBACK: false,
    },
    FEATURES: {
      PDF_TEXT_EXTRACTION: true,
      WORD_DOCUMENT_PROCESSING: true,
      TEXT_FILE_PROCESSING: true,
      LEGAL_ENTITY_EXTRACTION: true,
      DOCUMENT_CLASSIFICATION: true,
      TABLE_DETECTION: true,
      OCR_SCANNED_DOCUMENTS: true, // After models downloaded
    }
  },

  airgap: {
    FULLY_OFFLINE: true,
    OCR: {
      ENABLED: false, // No external models
      ALLOW_EXTERNAL_MODELS: false,
      LOCAL_MODEL_PATH: '/models/tessdata',
    },
    PDF: {
      USE_MAIN_THREAD: true,
      ALLOW_CDN_FALLBACK: false,
    },
    FEATURES: {
      PDF_TEXT_EXTRACTION: true,
      WORD_DOCUMENT_PROCESSING: true,
      TEXT_FILE_PROCESSING: true,
      LEGAL_ENTITY_EXTRACTION: true,
      DOCUMENT_CLASSIFICATION: true,
      TABLE_DETECTION: true,
      OCR_SCANNED_DOCUMENTS: false, // Disabled for security
    }
  },

  auto: {
    FULLY_OFFLINE: false, // Dynamic based on network
    OCR: {
      ENABLED: true,
      ALLOW_EXTERNAL_MODELS: true, // If online
      LOCAL_MODEL_PATH: '/models/tessdata',
    },
    PDF: {
      USE_MAIN_THREAD: true,
      ALLOW_CDN_FALLBACK: false,
    },
    FEATURES: {
      PDF_TEXT_EXTRACTION: true,
      WORD_DOCUMENT_PROCESSING: true,
      TEXT_FILE_PROCESSING: true,
      LEGAL_ENTITY_EXTRACTION: true,
      DOCUMENT_CLASSIFICATION: true,
      TABLE_DETECTION: true,
      OCR_SCANNED_DOCUMENTS: true, // Dynamic
    }
  }
};

/**
 * Set the current security mode (called by UI)
 */
export const setSecurityMode = (mode: SecurityMode): void => {
  currentSecurityMode = mode;
  console.log(`🔒 Security mode set to: ${mode.toUpperCase()}`);
  
  // Store in localStorage for persistence
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('securityMode', mode);
  }
};

/**
 * Get the current security mode
 */
export const getCurrentSecurityMode = (): SecurityMode => {
  // Check localStorage first
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('securityMode') as SecurityMode;
    if (stored && Object.keys(SECURITY_MODE_CONFIGS).includes(stored)) {
      return stored;
    }
  }
  return currentSecurityMode;
};

/**
 * Check if we're in air-gap mode
 */
export const isAirGapMode = (): boolean => {
  const mode = getCurrentSecurityMode();
  return mode === 'airgap' || 
         (mode === 'auto' && typeof navigator !== 'undefined' && !navigator.onLine);
};

/**
 * Get current configuration based on selected security mode
 */
export const getAirGapConfig = () => {
  const mode = getCurrentSecurityMode();
  
  // For auto mode, adapt based on network status
  if (mode === 'auto') {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
    if (!isOnline) {
      return SECURITY_MODE_CONFIGS.airgap; // Use air-gap when offline
    } else {
      return SECURITY_MODE_CONFIGS.hybrid; // Use hybrid when online
    }
  }
  
  return SECURITY_MODE_CONFIGS[mode];
};

/**
 * Get user-friendly mode description
 */
export const getSecurityModeDescription = (mode?: SecurityMode): string => {
  const currentMode = mode || getCurrentSecurityMode();
  
  const descriptions = {
    enhanced: 'Full features with internet access for OCR models',
    hybrid: 'Download models once, then work offline (Recommended)',
    airgap: 'Maximum security - zero external connections',
    auto: 'Automatically adapt based on network availability'
  };
  
  return descriptions[currentMode];
};