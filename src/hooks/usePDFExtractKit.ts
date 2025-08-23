/**
 * PDF-Extract-Kit Integration Hook
 * Provides easy access to enhanced PDF processing capabilities
 */

import { useState, useEffect } from 'react';
import { enhancedPDFService } from '../services/enhancedPDFService';
import { autoServiceManager } from '../services/autoServiceManager';

interface PDFExtractCapabilities {
  available: boolean;
  status: 'unknown' | 'starting' | 'ready' | 'unavailable';
  message: string;
  features: {
    advancedExtraction: boolean;
    tableExtraction: boolean;
    imageExtraction: boolean;
    formulaExtraction: boolean;
    layoutAnalysis: boolean;
  };
}

export const usePDFExtractKit = () => {
  const [capabilities, setCapabilities] = useState<PDFExtractCapabilities>({
    available: false,
    status: 'unknown',
    message: 'Checking PDF extraction capabilities...',
    features: {
      advancedExtraction: false,
      tableExtraction: false,
      imageExtraction: false,
      formulaExtraction: false,
      layoutAnalysis: false
    }
  });

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Subscribe to service status updates
    enhancedPDFService.onStatusChange((status) => {
      const serviceCapabilities = enhancedPDFService.getCapabilities();
      
      setCapabilities({
        available: status === 'ready',
        status: status as any,
        message: getStatusMessage(status),
        features: serviceCapabilities
      });
    });

    // Subscribe to auto-setup updates
    autoServiceManager.onStatusUpdate((status, message) => {
      setCapabilities(prev => ({
        ...prev,
        status: status as any,
        message: message
      }));
    });
  }, []);

  const processPDF = async (file: File, options = {}) => {
    setIsProcessing(true);
    try {
      const result = await enhancedPDFService.processPDF(file, options);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    const badges = {
      ready: { text: '🚀 Enhanced', color: '#10b981' },
      starting: { text: '⏳ Starting...', color: '#f59e0b' },
      unavailable: { text: '📄 Basic', color: '#6b7280' },
      unknown: { text: '❓ Checking...', color: '#6b7280' }
    };
    
    return badges[capabilities.status] || badges.unknown;
  };

  const getFeatureList = () => {
    const features = [];
    if (capabilities.features.advancedExtraction) features.push('Advanced Text');
    if (capabilities.features.tableExtraction) features.push('Tables');
    if (capabilities.features.imageExtraction) features.push('Images');
    if (capabilities.features.formulaExtraction) features.push('Formulas');
    if (capabilities.features.layoutAnalysis) features.push('Layout Analysis');
    
    return features.length > 0 ? features : ['Basic Text Extraction'];
  };

  return {
    capabilities,
    isProcessing,
    processPDF,
    getStatusBadge,
    getFeatureList,
    isEnhanced: capabilities.available,
    isReady: capabilities.status === 'ready'
  };
};

function getStatusMessage(status: string): string {
  switch (status) {
    case 'ready':
      return 'Advanced PDF extraction ready with tables, images & layout analysis';
    case 'starting':
      return 'Starting advanced PDF extraction service...';
    case 'unavailable':
      return 'Using basic PDF extraction (still works great!)';
    default:
      return 'Checking PDF extraction capabilities...';
  }
}