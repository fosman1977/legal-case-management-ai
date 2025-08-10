import React, { useState, useEffect } from 'react';
import { 
  SecurityMode, 
  setSecurityMode, 
  getCurrentSecurityMode,
  getSecurityModeDescription 
} from '../config/airgap-config';

interface SecurityModeSelectorProps {
  onModeChange: (mode: SecurityMode) => void;
}


interface SecurityModeOption {
  id: SecurityMode;
  name: string;
  description: string;
  features: string[];
  security: 'High' | 'Maximum' | 'Enterprise';
  internetRequired: boolean;
  icon: string;
  pros: string[];
  cons: string[];
}

const SECURITY_MODES: SecurityModeOption[] = [
  {
    id: 'enhanced',
    name: 'Enhanced Mode',
    description: 'Full features with OCR for scanned documents',
    features: [
      '✅ PDF extraction (native + scanned)',
      '✅ Word document processing',
      '✅ OCR for images and scanned PDFs',
      '✅ Advanced legal entity detection',
      '✅ Table extraction from all formats',
      '✅ Document quality assessment'
    ],
    security: 'High',
    internetRequired: true,
    icon: '🚀',
    pros: [
      'Complete document processing capabilities',
      'Handles scanned and image-based documents',
      'Best accuracy for legal entity extraction',
      'Full OCR support for difficult documents'
    ],
    cons: [
      'Requires internet connection for OCR models',
      'Downloads models from external servers',
      'May not be suitable for highest security environments'
    ]
  },
  {
    id: 'hybrid',
    name: 'Hybrid Mode (Recommended)',
    description: 'Download models once, then work offline',
    features: [
      '✅ One-time model download',
      '✅ Full functionality after download',
      '✅ Offline operation after setup',
      '✅ OCR models cached locally',
      '✅ No ongoing internet requirements',
      '✅ Best of both worlds'
    ],
    security: 'High',
    internetRequired: false, // After initial setup
    icon: '🔄',
    pros: [
      'Full features after initial setup',
      'Works offline after model download',
      'Good for controlled network environments',
      'Balances security with functionality'
    ],
    cons: [
      'Requires initial internet connection',
      'Larger storage footprint for models',
      'One-time external dependency'
    ]
  },
  {
    id: 'airgap',
    name: 'Air-Gap Mode',
    description: 'Maximum security - zero external connections',
    features: [
      '✅ PDF text extraction (native PDFs)',
      '✅ Word document processing',
      '✅ Text file processing',
      '✅ Legal entity extraction (pattern-based)',
      '✅ Document classification',
      '❌ No OCR for scanned documents'
    ],
    security: 'Maximum',
    internetRequired: false,
    icon: '🔒',
    pros: [
      'Zero external connections',
      'Maximum data security',
      'No external dependencies',
      'Perfect for sensitive legal work',
      'Attorney-client privilege protection'
    ],
    cons: [
      'Cannot process scanned PDFs',
      'No OCR capabilities',
      'Reduced functionality for image-based documents'
    ]
  },
  {
    id: 'auto',
    name: 'Auto-Detect Mode',
    description: 'Automatically adapt based on network availability',
    features: [
      '🔄 Switches modes based on network status',
      '✅ Enhanced features when online',
      '✅ Air-gap features when offline',
      '✅ Graceful degradation',
      '✅ Smart capability detection',
      '✅ Transparent operation'
    ],
    security: 'Enterprise',
    internetRequired: false,
    icon: '🎯',
    pros: [
      'Automatic adaptation to environment',
      'Best user experience',
      'Works in any network condition',
      'Intelligent feature selection'
    ],
    cons: [
      'May attempt network connections',
      'Less predictable in secure environments',
      'Could unexpectedly change behavior'
    ]
  }
];

export const SecurityModeSelector: React.FC<SecurityModeSelectorProps> = ({ onModeChange }) => {
  const [selectedMode, setSelectedMode] = useState<SecurityMode>(getCurrentSecurityMode());
  const [showDetails, setShowDetails] = useState<SecurityMode | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleModeSelect = (mode: SecurityMode) => {
    setSelectedMode(mode);
    setSecurityMode(mode);
    onModeChange(mode);
  };

  const getNetworkStatus = () => {
    if (isOnline) {
      return <span className="text-green-600">🌐 Online - All modes available</span>;
    } else {
      return <span className="text-orange-600">📴 Offline - Air-gap and hybrid modes only</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Deployment Mode</h2>
        <p className="text-gray-600 mb-4">
          Choose the security level and features appropriate for your legal environment
        </p>
        <div className="bg-blue-50 p-3 rounded-lg">
          {getNetworkStatus()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {SECURITY_MODES.map((mode) => (
          <div
            key={mode.id}
            className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 ${
              selectedMode === mode.id
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            } ${
              !isOnline && mode.internetRequired && mode.id !== 'hybrid'
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            onClick={() => {
              if (isOnline || !mode.internetRequired || mode.id === 'hybrid') {
                handleModeSelect(mode.id);
              }
            }}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{mode.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900">{mode.name}</h3>
              <p className="text-sm text-gray-600 mt-2">{mode.description}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Security:</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  mode.security === 'Maximum' 
                    ? 'bg-red-100 text-red-800'
                    : mode.security === 'Enterprise'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {mode.security}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Internet:</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  mode.internetRequired
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {mode.internetRequired ? 'Required' : 'Optional'}
                </span>
              </div>

              <div className="pt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(showDetails === mode.id ? null : mode.id);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showDetails === mode.id ? 'Hide Details ▼' : 'Show Details ▶'}
                </button>
              </div>
            </div>

            {selectedMode === mode.id && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center text-blue-600">
                  <span className="mr-2">✓</span>
                  <span className="text-sm font-medium">Selected</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showDetails && (
        <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-lg">
          {(() => {
            const mode = SECURITY_MODES.find(m => m.id === showDetails)!;
            return (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <span className="text-2xl mr-3">{mode.icon}</span>
                    {mode.name} - Detailed Information
                  </h3>
                  <button
                    onClick={() => setShowDetails(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">✅ Features</h4>
                    <ul className="space-y-1">
                      {mode.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">👍 Advantages</h4>
                    <ul className="space-y-1">
                      {mode.pros.map((pro, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          • {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">⚠️ Considerations</h4>
                    <ul className="space-y-1">
                      {mode.cons.map((con, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          • {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {mode.id === selectedMode && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-3 mt-1">ℹ️</span>
                      <div>
                        <h5 className="font-medium text-blue-900 mb-2">Current Selection</h5>
                        <p className="text-sm text-blue-800">
                          You have selected <strong>{mode.name}</strong>. This mode will be applied when you start document processing.
                          {mode.id === 'airgap' && (
                            <span className="block mt-2 font-medium">
                              🔒 Maximum Security: No external connections will be made. Scanned PDF processing will be disabled.
                            </span>
                          )}
                          {mode.id === 'enhanced' && (
                            <span className="block mt-2 text-orange-700">
                              🌐 Internet Required: OCR models will be downloaded from external servers as needed.
                            </span>
                          )}
                          {mode.id === 'hybrid' && (
                            <span className="block mt-2 text-green-700">
                              🔄 Recommended: Models will be downloaded once, then cached for offline use.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🛡️ Security Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">🏛️ Government/Highly Sensitive</h4>
            <p className="text-red-700">Use <strong>Air-Gap Mode</strong> for maximum security with zero external connections.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">⚖️ Law Firms/Corporate Legal</h4>
            <p className="text-blue-700">Use <strong>Hybrid Mode</strong> for best balance of security and functionality.</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">📋 General Legal Work</h4>
            <p className="text-green-700">Use <strong>Enhanced Mode</strong> for full features and capabilities.</p>
          </div>
        </div>
      </div>
    </div>
  );
};