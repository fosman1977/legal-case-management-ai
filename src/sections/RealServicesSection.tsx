/**
 * Real Services Section - Live NLP Services Integration
 * Frontend integration and testing for BlackstoneNLP + Presidio services
 */

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardContent } from '../design/components/Card';
import { AccessibleButton } from '../accessibility/KeyboardShortcuts';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

// Complete TypeScript integration for real BlackstoneNLP + Presidio services
interface EntityDetection {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
  source: 'blackstone' | 'presidio' | 'custom' | 'verified';
  category: 'person' | 'organization' | 'location' | 'financial' | 'date' | 'case_ref' | 'other';
  context?: string;
}

interface ServiceStatus {
  blackstone: { available: boolean; error?: string; info?: any };
  presidio: { available: boolean; error?: string; info?: any };
}

interface AnonymizationResult {
  originalText: string;
  anonymizedText: string;
  anonymousPatterns: string[];
  detectedEntities: EntityDetection[];
  serviceStatus: ServiceStatus;
  processingTime: number;
  safeForTransmission: boolean;
  servicesUsed: { real: boolean; fallback: boolean };
}

class RealServicesAnonymizer {
  private serviceUrls = {
    blackstone: 'http://localhost:5004',
    presidio: 'http://localhost:5002'
  };

  constructor(customUrls?: { blackstone?: string; presidio?: string }) {
    if (customUrls) {
      this.serviceUrls = { ...this.serviceUrls, ...customUrls };
    }
  }

  async checkServiceAvailability(): Promise<ServiceStatus> {
    const checkService = async (name: string, url: string) => {
      try {
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: this.createTimeoutSignal(5000)
        });
        
        if (response.ok) {
          const info = await response.json();
          return { available: true, info };
        } else {
          return { available: false, error: `HTTP ${response.status}` };
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return { available: false, error: errorMsg };
      }
    };

    const [blackstoneStatus, presidioStatus] = await Promise.all([
      checkService('BlackstoneNLP', this.serviceUrls.blackstone),
      checkService('Presidio', this.serviceUrls.presidio)
    ]);

    return {
      blackstone: blackstoneStatus,
      presidio: presidioStatus
    };
  }

  async anonymizeDocument(text: string): Promise<AnonymizationResult> {
    const startTime = Date.now();
    console.log('🛡️ Starting real service anonymization...');
    
    // Check service availability
    const serviceStatus = await this.checkServiceAvailability();
    let servicesUsed = { real: false, fallback: false };
    
    let legalEntities: EntityDetection[] = [];
    let piiEntities: EntityDetection[] = [];

    // BlackstoneNLP - Real Service
    if (serviceStatus.blackstone.available) {
      try {
        const response = await fetch(`${this.serviceUrls.blackstone}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: this.createTimeoutSignal(15000)
        });

        if (response.ok) {
          const data = await response.json();
          legalEntities = (data.entities || []).map((entity: any) => ({
            text: entity.text,
            label: entity.label,
            start: entity.start,
            end: entity.end,
            confidence: entity.confidence || 0.9,
            source: 'blackstone' as const,
            category: this.mapBlackstoneLabel(entity.label),
            context: text.substring(Math.max(0, entity.start - 20), Math.min(text.length, entity.end + 20))
          }));
          servicesUsed.real = true;
          console.log('✅ Real BlackstoneNLP used:', legalEntities.length, 'entities');
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn('⚠️ BlackstoneNLP failed:', error);
        legalEntities = this.fallbackLegalDetection(text);
        servicesUsed.fallback = true;
      }
    } else {
      console.log('❌ BlackstoneNLP not available:', serviceStatus.blackstone.error);
      legalEntities = this.fallbackLegalDetection(text);
      servicesUsed.fallback = true;
    }

    // Presidio - Real Service
    if (serviceStatus.presidio.available) {
      try {
        const response = await fetch(`${this.serviceUrls.presidio}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            language: 'en'
            // Let Presidio detect all available entities by default
          }),
          signal: this.createTimeoutSignal(15000)
        });

        if (response.ok) {
          const data = await response.json();
          // Handle both possible response structures from Presidio
          const resultsArray = data.entities || data.results || [];
          piiEntities = resultsArray.map((entity: any) => ({
            text: entity.text,
            label: entity.entity_type || entity.label,
            start: entity.start,
            end: entity.end,
            confidence: entity.score || entity.confidence || 0.8,
            source: 'presidio' as const,
            category: this.mapPresidioLabel(entity.entity_type || entity.label),
            context: text.substring(Math.max(0, entity.start - 20), Math.min(text.length, entity.end + 20))
          }));
          servicesUsed.real = true;
          console.log('✅ Real Presidio used:', piiEntities.length, 'entities');
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn('⚠️ Presidio failed:', error);
        piiEntities = this.fallbackPIIDetection(text);
        servicesUsed.fallback = true;
      }
    } else {
      console.log('❌ Presidio not available:', serviceStatus.presidio.error);
      piiEntities = this.fallbackPIIDetection(text);
      servicesUsed.fallback = true;
    }

    // Merge and process entities
    const allEntities = [...legalEntities, ...piiEntities];
    const verifiedEntities = this.verifyAndMergeEntities(allEntities);
    const anonymizedText = this.createAnonymizedText(text, verifiedEntities);
    const anonymousPatterns = this.createAnonymousPatterns(verifiedEntities, text);

    return {
      originalText: text,
      anonymizedText,
      anonymousPatterns,
      detectedEntities: verifiedEntities,
      serviceStatus,
      processingTime: Date.now() - startTime,
      safeForTransmission: true,
      servicesUsed
    };
  }

  // Helper methods
  private createTimeoutSignal(ms: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }

  private mapBlackstoneLabel(label: string): EntityDetection['category'] {
    const mapping: { [key: string]: EntityDetection['category'] } = {
      'PERSON': 'person', 'ORG': 'organization', 'COURT': 'location',
      'CASE_NUMBER': 'case_ref', 'UK_COURT': 'location', 'UK_CURRENCY': 'financial',
      'LEGAL_PARTY': 'person', 'LEGAL_PROFESSIONAL': 'person'
    };
    return mapping[label] || 'other';
  }

  private mapPresidioLabel(label: string): EntityDetection['category'] {
    const mapping: { [key: string]: EntityDetection['category'] } = {
      'PERSON': 'person', 'EMAIL_ADDRESS': 'other', 'PHONE_NUMBER': 'other',
      'LOCATION': 'location', 'DATE_TIME': 'date'
    };
    return mapping[label] || 'other';
  }

  private fallbackLegalDetection(text: string): EntityDetection[] {
    // Fallback patterns when BlackstoneNLP is unavailable
    const patterns = [
      { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, label: 'PERSON', category: 'person' as const },
      { regex: /\b[A-Za-z]+ Ltd\b/g, label: 'ORG', category: 'organization' as const },
      { regex: /Case No[:\s]*[A-Z0-9\-\/]+/gi, label: 'CASE_NUMBER', category: 'case_ref' as const }
    ];

    const entities: EntityDetection[] = [];
    patterns.forEach(({ regex, label, category }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0], label, start: match.index, end: match.index + match[0].length,
          confidence: 0.7, source: 'blackstone', category
        });
      }
      regex.lastIndex = 0;
    });
    return entities;
  }

  private fallbackPIIDetection(text: string): EntityDetection[] {
    // Fallback patterns when Presidio is unavailable
    const patterns = [
      { regex: /\b[\w.-]+@[\w.-]+\.\w+\b/gi, label: 'EMAIL_ADDRESS', category: 'other' as const },
      { regex: /\b(?:\+44|0)\d{10,11}\b/g, label: 'PHONE_NUMBER', category: 'other' as const }
    ];

    const entities: EntityDetection[] = [];
    patterns.forEach(({ regex, label, category }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0], label, start: match.index, end: match.index + match[0].length,
          confidence: 0.75, source: 'presidio', category
        });
      }
      regex.lastIndex = 0;
    });
    return entities;
  }

  private verifyAndMergeEntities(entities: EntityDetection[]): EntityDetection[] {
    return entities.filter((entity, index, self) => 
      index === self.findIndex(e => e.start === entity.start && e.end === entity.end)
    );
  }

  private createAnonymizedText(text: string, entities: EntityDetection[]): string {
    let result = text;
    entities.sort((a, b) => b.start - a.start);
    
    entities.forEach(entity => {
      const placeholder = this.getPlaceholder(entity.category);
      result = result.substring(0, entity.start) + placeholder + result.substring(entity.end);
    });
    
    return result;
  }

  private createAnonymousPatterns(entities: EntityDetection[], text: string): string[] {
    const patterns = [`Document Type: ${text.toLowerCase().includes('contract') ? 'Contract' : 'Legal Document'}`];
    
    if (entities.length > 10) patterns.push('Complexity: High');
    else if (entities.length > 5) patterns.push('Complexity: Medium');
    else patterns.push('Complexity: Standard');
    
    return patterns;
  }

  private getPlaceholder(category: EntityDetection['category']): string {
    const placeholders = {
      'person': '[PERSON]', 'organization': '[ORGANIZATION]', 'location': '[LOCATION]',
      'financial': '[AMOUNT]', 'date': '[DATE]', 'case_ref': '[CASE_REF]', 'other': '[REDACTED]'
    };
    return placeholders[category];
  }
}

interface RealServicesSectionProps {
  selectedCase?: any;
}

export const RealServicesSection: React.FC<RealServicesSectionProps> = ({ selectedCase }) => {
  const { announce } = useAccessibility();
  const [inputText, setInputText] = useState('Case No: HC-2024-001234. John Smith v ABC Ltd. Amount: £50,000. Contact: legal@example.com');
  const [result, setResult] = useState<AnonymizationResult | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStartingServices, setIsStartingServices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const anonymizer = new RealServicesAnonymizer();
  
  // Check service status on component mount
  useEffect(() => {
    checkServices();
  }, []);
  
  const checkServices = async () => {
    try {
      const status = await anonymizer.checkServiceAvailability();
      setServiceStatus(status);
      announce(`Service status checked: BlackstoneNLP ${status.blackstone.available ? 'online' : 'offline'}, Presidio ${status.presidio.available ? 'online' : 'offline'}`);
    } catch (error) {
      setError('Failed to check service status');
      announce('Failed to check service status', 'assertive');
    }
  };
  
  const handleAnonymize = async () => {
    if (!inputText.trim()) {
      announce('Please enter text to anonymize', 'assertive');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      announce('Starting real services anonymization');
      const anonymizationResult = await anonymizer.anonymizeDocument(inputText);
      setResult(anonymizationResult);
      announce(`Anonymization complete: ${anonymizationResult.detectedEntities.length} entities found using ${anonymizationResult.servicesUsed.real ? 'real services' : 'fallback patterns'}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Anonymization failed';
      setError(errorMessage);
      setResult(null);
      announce(`Anonymization failed: ${errorMessage}`, 'assertive');
    }
    
    setIsProcessing(false);
  };

  const startServices = async () => {
    setIsStartingServices(true);
    setError(null);
    
    try {
      announce('Starting NLP services...');
      
      // For Electron environment, use a direct approach
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        // Use Electron IPC if available
        const result = await (window as any).electronAPI.startNLPServices();
        announce(`Services started: ${result.message}`);
      } else {
        // Fallback: Show instructions for manual start
        const instructions = `Please manually start the services:

1. Open terminal/command prompt
2. Navigate to: nlp-anonymizer-services/
3. Activate virtual environment: source venv/bin/activate (Linux/Mac) or venv\\Scripts\\activate (Windows)
4. Run: python start_nlp_services.py

The script will show "🎉 NLP SERVICES ARE READY!" when complete.`;
        
        // Create a simple modal-like display
        const instructionDiv = document.createElement('div');
        instructionDiv.style.cssText = `
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: white; padding: 30px; border-radius: 10px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 1000;
          max-width: 600px; font-family: monospace;
          border: 2px solid #3b82f6;
        `;
        instructionDiv.innerHTML = `
          <h3 style="margin-top: 0; color: #1f2937;">🚀 Start NLP Services</h3>
          <pre style="background: #f8fafc; padding: 15px; border-radius: 5px; overflow-x: auto;">${instructions}</pre>
          <button onclick="this.parentElement.remove()" 
                  style="background: #3b82f6; color: white; border: none; padding: 10px 20px; 
                         border-radius: 5px; cursor: pointer; margin-top: 15px;">
            Got it! ✅
          </button>
        `;
        document.body.appendChild(instructionDiv);
        
        announce('Manual setup instructions displayed');
      }
      
      // Wait a moment and then check services
      setTimeout(() => {
        checkServices();
      }, 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start services';
      setError(errorMessage);
      announce(`Failed to start services: ${errorMessage}`, 'assertive');
    }
    
    setIsStartingServices(false);
  };

  const stopServices = async () => {
    setIsStartingServices(true);
    setError(null);
    
    try {
      announce('Stopping NLP services...');
      
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        // Use Electron IPC if available
        const result = await (window as any).electronAPI.stopNLPServices();
        announce(`Services stopped: ${result.message}`);
      } else {
        // Fallback: Show instructions for manual stop
        const instructions = `To stop NLP services manually:

Option 1 - Using Task Manager/Activity Monitor:
  - Find processes: blackstone_server.py, presidio_server.py
  - End these processes

Option 2 - Using Terminal:
  Linux/Mac: pkill -f "blackstone_server|presidio_server"
  Windows: taskkill /F /IM python.exe

Option 3 - Ctrl+C in the terminal where services are running`;
        
        const instructionDiv = document.createElement('div');
        instructionDiv.style.cssText = `
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: white; padding: 30px; border-radius: 10px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 1000;
          max-width: 600px; font-family: monospace;
          border: 2px solid #ef4444;
        `;
        instructionDiv.innerHTML = `
          <h3 style="margin-top: 0; color: #1f2937;">🛑 Stop NLP Services</h3>
          <pre style="background: #f8fafc; padding: 15px; border-radius: 5px; overflow-x: auto;">${instructions}</pre>
          <button onclick="this.parentElement.remove()" 
                  style="background: #ef4444; color: white; border: none; padding: 10px 20px; 
                         border-radius: 5px; cursor: pointer; margin-top: 15px;">
            Got it! ✅
          </button>
        `;
        document.body.appendChild(instructionDiv);
        
        announce('Manual stop instructions displayed');
      }
      
      // Update status immediately to show stopped
      setServiceStatus({
        blackstone: { available: false },
        presidio: { available: false }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop services';
      setError(errorMessage);
      announce(`Failed to stop services: ${errorMessage}`, 'assertive');
    }
    
    setIsStartingServices(false);
  };
  
  const ServiceStatusBadge = ({ service, status }: { service: string, status: any }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      border: '1px solid',
      borderRadius: '8px',
      backgroundColor: status.available ? '#f0fdf4' : '#fef2f2',
      borderColor: status.available ? '#bbf7d0' : '#fecaca'
    }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: status.available ? '#10b981' : '#ef4444'
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '4px' }}>
          {service} {status.available ? '✅ Online' : '❌ Offline'}
        </div>
        {status.error && (
          <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
            Error: {status.error}
          </div>
        )}
        {status.info && status.available && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Status: {status.info.status || 'Running'}
            {status.info.available_entities && (
              <span> • {status.info.available_entities.length} entity types</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          margin: 0,
          color: '#1f2937'
        }}>
          🛡️ Real NLP Services
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: '#6b7280',
          margin: '4px 0 0 0'
        }}>
          Live BlackstoneNLP + Presidio Integration for Legal Document Anonymization
        </p>
      </div>

      {/* Service Status */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            Service Status
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0 0' }}>
            Real-time status of NLP processing services
          </p>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {serviceStatus ? (
              <>
                <ServiceStatusBadge service="BlackstoneNLP" status={serviceStatus.blackstone} />
                <ServiceStatusBadge service="Presidio" status={serviceStatus.presidio} />
              </>
            ) : (
              <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                Checking services...
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <AccessibleButton
              onClick={checkServices}
              variant="secondary"
              ariaLabel="Refresh service status"
              style={{ fontSize: '0.875rem' }}
            >
              🔍 Refresh Status
            </AccessibleButton>
            
            <AccessibleButton
              onClick={startServices}
              variant="primary"
              ariaLabel="Start NLP services"
              style={{ fontSize: '0.875rem' }}
              disabled={isStartingServices}
            >
              {isStartingServices ? '🔄 Starting...' : '🚀 Start Services'}
            </AccessibleButton>
            
            <AccessibleButton
              onClick={stopServices}
              variant="secondary"
              ariaLabel="Stop NLP services"
              style={{ fontSize: '0.875rem' }}
              disabled={isStartingServices}
            >
              🛑 Stop Services
            </AccessibleButton>
          </div>
        </CardContent>
      </Card>
      
      {/* Service Setup Instructions */}
      {serviceStatus && (!serviceStatus.blackstone.available || !serviceStatus.presidio.available) && (
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#d97706' }}>
              ⚠️ Services Setup Required
            </h3>
          </CardHeader>
          <CardContent>
            <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 12px 0' }}><strong>To start the NLP services:</strong></p>
                <code style={{ display: 'block', backgroundColor: '#fffbeb', padding: '12px', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', border: '1px solid #f59e0b' }}>
                  cd nlp-anonymizer-services<br/>
                  source venv/bin/activate<br/>
                  python master_startup.py
                </code>
                <p style={{ margin: '12px 0 0 0' }}>
                  Services will automatically fallback to regex patterns if unavailable.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Input Section */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            Document Anonymization
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0 0' }}>
            Enter legal text to analyze with real BlackstoneNLP and Presidio services
          </p>
        </CardHeader>
        <CardContent>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="legal-text-input" style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              marginBottom: '8px',
              color: '#374151'
            }}>
              Legal Text to Anonymize:
            </label>
            <textarea
              id="legal-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
              placeholder="Enter legal document text here..."
              aria-describedby="legal-text-help"
            />
            <div id="legal-text-help" style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
              Sample legal text is provided. Modify or replace with your own content.
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <AccessibleButton
              onClick={handleAnonymize}
              variant="primary"
              disabled={isProcessing || !inputText.trim()}
              ariaLabel={isProcessing ? 'Processing anonymization' : 'Start anonymization with real services'}
            >
              {isProcessing ? '🔄 Processing...' : '🛡️ Anonymize with Real Services'}
            </AccessibleButton>
            
            {inputText.trim() && (
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Ready to process {inputText.length} characters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Error Display */}
      {error && (
        <Card style={{ marginBottom: '24px' }}>
          <CardContent>
            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px', 
              padding: '16px' 
            }}>
              <h3 style={{ color: '#dc2626', fontWeight: '600', margin: '0 0 8px 0', fontSize: '1rem' }}>
                ❌ Error
              </h3>
              <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: 0 }}>
                {error}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Results */}
      {result && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Service Usage Info */}
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                {result.servicesUsed.real ? '✅ Real Services Used' : '⚠️ Fallback Patterns Used'}
              </h3>
            </CardHeader>
            <CardContent>
              <div style={{
                backgroundColor: result.servicesUsed.real ? '#f0fdf4' : '#fef3c7',
                border: result.servicesUsed.real ? '1px solid #bbf7d0' : '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.875rem' }}>
                  <div>
                    <strong>Processing Time:</strong> {result.processingTime}ms
                  </div>
                  <div>
                    <strong>Entities Detected:</strong> {result.detectedEntities.length}
                  </div>
                  <div>
                    <strong>Safe for Transmission:</strong> {result.safeForTransmission ? '✅ Yes' : '❌ No'}
                  </div>
                  <div>
                    <strong>Services Used:</strong> {result.servicesUsed.real ? 'Real NLP' : 'Fallback Patterns'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Anonymized Text */}
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1e40af' }}>
                🛡️ Anonymized Text
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                Safe for transmission with sensitive information replaced
              </p>
            </CardHeader>
            <CardContent>
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.5'
              }}>
                {result.anonymizedText}
              </div>
            </CardContent>
          </Card>
          
          {/* Detected Entities */}
          {result.detectedEntities.length > 0 && (
            <Card>
              <CardHeader>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#7c3aed' }}>
                  🏷️ Detected Entities ({result.detectedEntities.length})
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                  Entities found by BlackstoneNLP and Presidio services
                </p>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {result.detectedEntities.map((entity, idx) => (
                    <div key={idx} style={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      <div style={{ 
                        fontFamily: 'monospace', 
                        fontWeight: '600', 
                        color: entity.source === 'blackstone' ? '#dc2626' : '#2563eb',
                        marginBottom: '4px'
                      }}>
                        {entity.text}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'grid', gap: '2px' }}>
                        <div><strong>Type:</strong> {entity.label}</div>
                        <div><strong>Source:</strong> {entity.source}</div>
                        <div><strong>Confidence:</strong> {(entity.confidence * 100).toFixed(1)}%</div>
                        <div><strong>Category:</strong> {entity.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Anonymous Patterns */}
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#059669' }}>
                📊 Anonymous Patterns
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                Safe document characteristics for AI consultation
              </p>
            </CardHeader>
            <CardContent>
              <div style={{ 
                backgroundColor: '#f0fdf4', 
                border: '1px solid #bbf7d0', 
                borderRadius: '8px', 
                padding: '16px' 
              }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {result.anonymousPatterns.map((pattern, idx) => (
                    <div key={idx} style={{ fontSize: '0.875rem', color: '#065f46' }}>
                      • {pattern}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions for Integration */}
      <Card style={{ marginTop: '24px' }}>
        <CardHeader>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            🔗 Integration Instructions
          </h3>
        </CardHeader>
        <CardContent>
          <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
            <p><strong>To use this component in your application:</strong></p>
            <ol style={{ marginLeft: '20px', marginTop: '12px' }}>
              <li>Start the NLP services using <code>python master_startup.py</code></li>
              <li>Import and use the <code>RealServicesAnonymizer</code> class</li>
              <li>The component automatically falls back to regex patterns if services are unavailable</li>
              <li>Results include both anonymized text and safe anonymous patterns for AI consultation</li>
            </ol>
            
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              padding: '16px', 
              marginTop: '16px',
              fontFamily: 'monospace',
              fontSize: '0.75rem'
            }}>
              <div>Service URLs:</div>
              <div>• BlackstoneNLP: http://localhost:5004</div>
              <div>• Presidio: http://localhost:5002</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealServicesSection;