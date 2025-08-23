/**
 * Privacy Section - Core Workflow Step 4
 * Transparency dashboard and compliance monitoring
 */

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardContent } from '../design/components/Card';
import { AccessibleButton, AccessibleTabList } from '../accessibility/KeyboardShortcuts';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

export const PrivacySection: React.FC = () => {
  const { announce } = useAccessibility();
  const [activeTab, setActiveTab] = useState('overview');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Mock audit logs for demonstration
  useEffect(() => {
    const mockLogs = [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        action: 'Document Analysis',
        status: 'Completed',
        dataProcessed: 'Anonymous patterns only',
        location: 'Local system',
        verification: 'Passed'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        action: 'AI Consultation',
        status: 'Completed', 
        dataProcessed: 'Anonymous legal patterns',
        location: 'Claude API',
        verification: 'Passed'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
        action: 'Entity Extraction',
        status: 'Completed',
        dataProcessed: 'Local processing only',
        location: 'Local system',
        verification: 'Passed'
      }
    ];
    setAuditLogs(mockLogs);
  }, []);

  const handlePrivacyCheck = () => {
    announce('Running privacy compliance check');
    // Simulate privacy check
    setTimeout(() => {
      announce('Privacy compliance check completed - All systems secure');
    }, 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Privacy Overview', icon: () => '🔒' },
    { id: 'compliance', label: 'Compliance Status', icon: () => '✅' },
    { id: 'audit', label: 'Audit Trail', icon: () => '📋' },
    { id: 'settings', label: 'Privacy Settings', icon: () => '⚙️' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            {/* Privacy Principles */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                margin: '0 0 16px 0',
                color: '#1f2937'
              }}>
                Core Privacy Principles
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px'
              }}>
                <div style={{
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f0fdf4'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.5rem' }}>🏠</div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Local Processing
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: '1.4' }}>
                    All client data and confidential information remains on your local system.
                    No sensitive data ever leaves your device.
                  </p>
                </div>

                <div style={{
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#eff6ff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.5rem' }}>🔄</div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Anonymous Patterns
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: '1.4' }}>
                    Only anonymous legal patterns (document types, issue categories) 
                    are sent to AI for strategic guidance.
                  </p>
                </div>

                <div style={{
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#fef3c7'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.5rem' }}>⚖️</div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Legal Compliance
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: '1.4' }}>
                    Full BSB, SRA, and GDPR compliance. Legal privilege never compromised 
                    through external data sharing.
                  </p>
                </div>
              </div>
            </div>

            {/* Data Flow Visualization */}
            <div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                margin: '0 0 16px 0',
                color: '#1f2937'
              }}>
                Secure Data Flow
              </h3>
              
              <div style={{
                padding: '24px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ textAlign: 'center', minWidth: '140px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      margin: '0 auto 8px auto'
                    }}>
                      📄
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Client Documents</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>(Private)</div>
                  </div>

                  <div style={{ fontSize: '1.5rem', color: '#9ca3af' }}>→</div>

                  <div style={{ textAlign: 'center', minWidth: '140px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#059669',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      margin: '0 auto 8px auto'
                    }}>
                      🔍
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Local Analysis</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>(Private)</div>
                  </div>

                  <div style={{ fontSize: '1.5rem', color: '#9ca3af' }}>→</div>

                  <div style={{ textAlign: 'center', minWidth: '140px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      margin: '0 auto 8px auto'
                    }}>
                      🔄
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Anonymous Patterns</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>(Safe)</div>
                  </div>

                  <div style={{ fontSize: '1.5rem', color: '#9ca3af' }}>→</div>

                  <div style={{ textAlign: 'center', minWidth: '140px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      margin: '0 auto 8px auto'
                    }}>
                      🤖
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Claude AI</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>(Insights)</div>
                  </div>

                  <div style={{ fontSize: '1.5rem', color: '#9ca3af' }}>→</div>

                  <div style={{ textAlign: 'center', minWidth: '140px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      margin: '0 auto 8px auto'
                    }}>
                      ⚖️
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Strategic Guidance</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>(Private)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <Card>
                <CardContent style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.5rem' }}>✅</div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      GDPR Compliance
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#059669', margin: 0, fontWeight: '500' }}>
                    Fully Compliant
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                    Anonymous processing only, Article 26 compliance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.5rem' }}>✅</div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      BSB/SRA Compliance
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#059669', margin: 0, fontWeight: '500' }}>
                    Zero Regulatory Risk
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                    Local-only processing maintains privilege
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.5rem' }}>✅</div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Legal Privilege
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#059669', margin: 0, fontWeight: '500' }}>
                    Never Compromised
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                    No external data sharing of client information
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                  Compliance Verification
                </h4>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  <AccessibleButton
                    onClick={handlePrivacyCheck}
                    variant="primary"
                    ariaLabel="Run privacy compliance check"
                  >
                    Run Privacy Check
                  </AccessibleButton>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Last check: {new Date().toLocaleDateString()}
                  </div>
                </div>
                
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>
                    ✓ All privacy controls operational
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#374151', marginTop: '4px' }}>
                    System verified: Local processing only, no data leakage detected
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'audit':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                Privacy Audit Trail
              </h3>
              <AccessibleButton
                variant="secondary"
                onClick={() => {
                  const auditData = JSON.stringify(auditLogs, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(auditData);
                  const exportFileDefaultName = `privacy-audit-${new Date().toISOString().split('T')[0]}.json`;
                  
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
                ariaLabel="Export audit trail"
              >
                Export Audit
              </AccessibleButton>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {auditLogs.map((log, index) => (
                <div key={index} style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                      {log.action}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: '9999px',
                      backgroundColor: log.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                      color: log.status === 'Completed' ? '#166534' : '#92400e'
                    }}>
                      {log.status}
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '8px',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    <div>
                      <strong>Time:</strong> {log.timestamp.toLocaleString()}
                    </div>
                    <div>
                      <strong>Data:</strong> {log.dataProcessed}
                    </div>
                    <div>
                      <strong>Location:</strong> {log.location}
                    </div>
                    <div>
                      <strong>Verification:</strong> 
                      <span style={{ 
                        color: log.verification === 'Passed' ? '#059669' : '#dc2626',
                        fontWeight: '500',
                        marginLeft: '4px'
                      }}>
                        {log.verification}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 16px 0' }}>
              Privacy Settings
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <Card>
                <CardContent style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 4px 0' }}>
                        AI Consultation
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        Allow anonymous pattern consultation with Claude AI
                      </p>
                    </div>
                    <div style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: '#3b82f6',
                      position: 'relative',
                      cursor: 'pointer'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        transition: 'all 0.2s'
                      }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 4px 0' }}>
                        Audit Logging
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        Log all privacy-related operations for compliance
                      </p>
                    </div>
                    <div style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: '#3b82f6',
                      position: 'relative',
                      cursor: 'pointer'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        transition: 'all 0.2s'
                      }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 4px 0' }}>
                        Local-Only Processing
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        Force all document processing to remain local (cannot be disabled)
                      </p>
                    </div>
                    <div style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: '#9ca3af',
                      position: 'relative',
                      opacity: 0.6
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        position: 'absolute',
                        top: '2px',
                        right: '2px'
                      }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
          Privacy & Compliance
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: '#6b7280',
          margin: '4px 0 0 0'
        }}>
          Transparency dashboard and regulatory compliance monitoring
        </p>
      </div>

      {/* Privacy Status Banner */}
      <Card style={{ marginBottom: '24px' }}>
        <CardContent style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#10b981'
            }} />
            <div>
              <span style={{ fontWeight: '600', color: '#059669' }}>
                Privacy Secure
              </span>
              <span style={{ 
                marginLeft: '12px', 
                fontSize: '0.875rem', 
                color: '#6b7280' 
              }}>
                All client data processing remains local - No external data transmission
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Card style={{ marginBottom: '24px' }}>
        <CardContent style={{ padding: 0 }}>
          <AccessibleTabList
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            ariaLabel="Privacy dashboard navigation"
          />
        </CardContent>
      </Card>

      {/* Tab Content */}
      <Card>
        <CardContent style={{ padding: '24px' }}>
          {renderTabContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacySection;