/**
 * Encryption Management Dashboard
 * Enterprise encryption monitoring and key management interface
 */

import React, { useState, useEffect } from 'react';
import { documentEncryptionService } from '../services/documentEncryptionService';

interface EncryptionManagementDashboardProps {
  caseId?: string;
}

export const EncryptionManagementDashboard: React.FC<EncryptionManagementDashboardProps> = ({ caseId }) => {
  const [encryptionStats, setEncryptionStats] = useState<any>(null);
  const [encryptedDocuments, setEncryptedDocuments] = useState<any[]>([]);
  const [encryptionKeys, setEncryptionKeys] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [transitSessions, setTransitSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'keys' | 'audit' | 'transit'>('overview');
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [encryptionContent, setEncryptionContent] = useState('');
  const [decryptionUserId, setDecryptionUserId] = useState('admin');

  useEffect(() => {
    loadDashboardData();
    
    // Update every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load encryption statistics
      const stats = documentEncryptionService.getEncryptionStatistics();
      setEncryptionStats(stats);
      
      // Load encrypted documents
      const documents = documentEncryptionService.getAllEncryptedDocuments();
      setEncryptedDocuments(documents);
      
      // Load encryption keys
      const keys = documentEncryptionService.getAllEncryptionKeys();
      setEncryptionKeys(keys);
      
      // Load audit log
      const audit = documentEncryptionService.getAuditLog({ limit: 50 });
      setAuditLog(audit);
      
      // Load transit sessions
      const sessions = documentEncryptionService.getTransitSessions();
      setTransitSessions(sessions);
      
    } catch (error) {
      console.error('❌ Failed to load encryption data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEncryptDocument = async () => {
    if (!encryptionContent.trim()) return;
    
    try {
      const documentId = `doc_${Date.now()}`;
      await documentEncryptionService.encryptDocument(
        documentId,
        encryptionContent,
        { title: 'Test Document' },
        {
          classificationLevel: 'confidential',
          authorizedUsers: ['admin', 'user1'],
          userId: 'admin'
        }
      );
      
      setEncryptionContent('');
      await loadDashboardData();
      console.log('✅ Document encrypted successfully');
    } catch (error) {
      console.error('❌ Failed to encrypt document:', error);
    }
  };

  const handleDecryptDocument = async (documentId: string) => {
    try {
      const decryptedContent = await documentEncryptionService.decryptDocument(documentId, {
        userId: decryptionUserId,
        ipAddress: '127.0.0.1',
        userAgent: 'EncryptionDashboard',
        authorizedRoles: ['admin']
      });
      
      alert(`Decrypted content: ${decryptedContent.substring(0, 200)}...`);
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Failed to decrypt document:', error);
      alert(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRotateKey = async (keyId: string) => {
    try {
      const newKeyId = await documentEncryptionService.rotateKey(keyId);
      console.log(`✅ Key rotated: ${keyId} -> ${newKeyId}`);
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Failed to rotate key:', error);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await documentEncryptionService.revokeKey(keyId, 'Manual revocation from dashboard');
      console.log(`✅ Key revoked: ${keyId}`);
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Failed to revoke key:', error);
    }
  };

  const handleEstablishTransit = async () => {
    try {
      const sessionId = await documentEncryptionService.establishTransitEncryption('https://api.example.com');
      console.log(`✅ Transit encryption established: ${sessionId}`);
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Failed to establish transit encryption:', error);
    }
  };

  const formatTimestamp = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#10b981';
      case 'deprecated': return '#f59e0b';
      case 'revoked': return '#ef4444';
      case 'establishing': return '#3b82f6';
      case 'expired': return '#6b7280';
      case 'terminated': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getClassificationColor = (classification: string): string => {
    switch (classification) {
      case 'public': return '#10b981';
      case 'internal': return '#3b82f6';
      case 'confidential': return '#f59e0b';
      case 'restricted': return '#ef4444';
      case 'top-secret': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (isLoading && !encryptionStats) {
    return (
      <div className="encryption-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading encryption management dashboard...</p>
      </div>
    );
  }

  return (
    <div className="encryption-management-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h2>🔐 Encryption Management Dashboard</h2>
          <div className="status-overview">
            <div className="status-item">
              <span className="status-label">Encrypted Documents:</span>
              <span className="status-value">
                {encryptionStats?.totalEncryptedDocuments || 0}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Encryption Keys:</span>
              <span className="status-value">
                {encryptionStats?.totalEncryptionKeys || 0}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Active Transit Sessions:</span>
              <span className="status-value">
                {encryptionStats?.activeTransitSessions || 0}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Key Rotations Due:</span>
              <span 
                className="status-value"
                style={{ color: encryptionStats?.keyRotationsDue > 0 ? '#ef4444' : '#10b981' }}
              >
                {encryptionStats?.keyRotationsDue || 0}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Recent Audit Events:</span>
              <span className="status-value">
                {encryptionStats?.recentAuditEvents || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button onClick={loadDashboardData} className="btn btn-primary">
            🔄 Refresh
          </button>
          <button onClick={handleEstablishTransit} className="btn btn-secondary">
            🔒 New Transit Session
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          📄 Documents
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'keys' ? 'active' : ''}`}
          onClick={() => setActiveTab('keys')}
        >
          🔑 Keys
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📋 Audit Log
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'transit' ? 'active' : ''}`}
          onClick={() => setActiveTab('transit')}
        >
          🚀 Transit
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-panel">
            <h3>🔐 Encryption Overview</h3>
            
            {/* Statistics Cards */}
            <div className="encryption-stats-cards">
              <div className="stats-card">
                <div className="card-header">
                  <h4>📄 Document Encryption</h4>
                  <span className="card-icon">🔐</span>
                </div>
                <div className="card-content">
                  <div className="metric-large">
                    {encryptionStats?.totalEncryptedDocuments || 0}
                  </div>
                  <div className="metric-label">Encrypted Documents</div>
                  <div className="breakdown">
                    {Object.entries(encryptionStats?.documentsByClassification || {}).map(([classification, count]) => (
                      <div key={classification} className="breakdown-item">
                        <span 
                          className="classification-badge"
                          style={{ backgroundColor: getClassificationColor(classification) }}
                        >
                          {classification}
                        </span>
                        <span className="count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="card-header">
                  <h4>🔑 Key Management</h4>
                  <span className="card-icon">🗝️</span>
                </div>
                <div className="card-content">
                  <div className="metric-large">
                    {encryptionStats?.totalEncryptionKeys || 0}
                  </div>
                  <div className="metric-label">Total Keys</div>
                  <div className="breakdown">
                    {Object.entries(encryptionStats?.keysByAlgorithm || {}).map(([algorithm, count]) => (
                      <div key={algorithm} className="breakdown-item">
                        <span className="algorithm-badge">{algorithm}</span>
                        <span className="count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="card-header">
                  <h4>🚀 Transit Security</h4>
                  <span className="card-icon">🔒</span>
                </div>
                <div className="card-content">
                  <div className="metric-large">
                    {encryptionStats?.activeTransitSessions || 0}
                  </div>
                  <div className="metric-label">Active Sessions</div>
                  <div className="sessions-status">
                    {transitSessions.slice(0, 3).map(session => (
                      <div key={session.sessionId} className="session-item">
                        <span className="session-endpoint">{session.endpoint}</span>
                        <span 
                          className="session-status"
                          style={{ color: getStatusColor(session.status) }}
                        >
                          {session.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="card-header">
                  <h4>⚠️ Security Alerts</h4>
                  <span className="card-icon">🚨</span>
                </div>
                <div className="card-content">
                  <div 
                    className="metric-large"
                    style={{ color: encryptionStats?.keyRotationsDue > 0 ? '#ef4444' : '#10b981' }}
                  >
                    {encryptionStats?.keyRotationsDue || 0}
                  </div>
                  <div className="metric-label">Keys Due for Rotation</div>
                  <div className="alert-summary">
                    <div className="alert-item">
                      <span>Recent Events:</span>
                      <span>{encryptionStats?.recentAuditEvents || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h4>⚡ Quick Actions</h4>
              <div className="action-grid">
                <div className="action-card">
                  <h5>🔐 Encrypt Document</h5>
                  <div className="action-content">
                    <textarea
                      value={encryptionContent}
                      onChange={(e) => setEncryptionContent(e.target.value)}
                      placeholder="Enter document content to encrypt..."
                      className="content-input"
                      rows={4}
                    />
                    <button 
                      onClick={handleEncryptDocument}
                      className="btn btn-primary"
                      disabled={!encryptionContent.trim()}
                    >
                      🔐 Encrypt Document
                    </button>
                  </div>
                </div>

                <div className="action-card">
                  <h5>🔓 Decrypt Document</h5>
                  <div className="action-content">
                    <select
                      value={selectedDocument}
                      onChange={(e) => setSelectedDocument(e.target.value)}
                      className="document-select"
                    >
                      <option value="">Select document...</option>
                      {encryptedDocuments.map(doc => (
                        <option key={doc.documentId} value={doc.documentId}>
                          {doc.documentId} ({doc.metadata.classificationLevel})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={decryptionUserId}
                      onChange={(e) => setDecryptionUserId(e.target.value)}
                      placeholder="User ID"
                      className="user-input"
                    />
                    <button 
                      onClick={() => handleDecryptDocument(selectedDocument)}
                      className="btn btn-secondary"
                      disabled={!selectedDocument}
                    >
                      🔓 Decrypt Document
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Audit Events */}
            <div className="recent-audit">
              <h4>📋 Recent Security Events</h4>
              <div className="audit-list">
                {auditLog.slice(0, 5).map(event => (
                  <div key={event.auditId} className="audit-item">
                    <div className="audit-header">
                      <span className="event-type">{event.eventType.replace('_', ' ')}</span>
                      <span 
                        className="severity-badge"
                        style={{ backgroundColor: getSeverityColor(event.severity) }}
                      >
                        {event.severity}
                      </span>
                      <span className="timestamp">{formatTimestamp(event.timestamp)}</span>
                    </div>
                    <div className="audit-details">
                      <span>User: {event.userId}</span>
                      {event.documentId && <span>Document: {event.documentId}</span>}
                      {event.keyId && <span>Key: {event.keyId}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="documents-panel">
            <h3>📄 Encrypted Documents</h3>
            
            <div className="documents-table">
              <div className="table-header">
                <div className="header-cell">Document ID</div>
                <div className="header-cell">Classification</div>
                <div className="header-cell">Algorithm</div>
                <div className="header-cell">Size</div>
                <div className="header-cell">Encrypted At</div>
                <div className="header-cell">Actions</div>
              </div>
              {encryptedDocuments.map(doc => (
                <div key={doc.documentId} className="table-row">
                  <div className="table-cell">{doc.documentId}</div>
                  <div className="table-cell">
                    <span 
                      className="classification-badge"
                      style={{ backgroundColor: getClassificationColor(doc.metadata.classificationLevel) }}
                    >
                      {doc.metadata.classificationLevel}
                    </span>
                  </div>
                  <div className="table-cell">{doc.algorithm}</div>
                  <div className="table-cell">
                    {(doc.metadata.encryptedSize / 1024).toFixed(1)}KB
                  </div>
                  <div className="table-cell">
                    {formatTimestamp(doc.metadata.encryptedAt)}
                  </div>
                  <div className="table-cell">
                    <button 
                      onClick={() => handleDecryptDocument(doc.documentId)}
                      className="btn btn-small"
                    >
                      🔓 Decrypt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="keys-panel">
            <h3>🔑 Encryption Key Management</h3>
            
            <div className="keys-table">
              <div className="table-header">
                <div className="header-cell">Key ID</div>
                <div className="header-cell">Algorithm</div>
                <div className="header-cell">Usage</div>
                <div className="header-cell">Status</div>
                <div className="header-cell">Created</div>
                <div className="header-cell">Last Used</div>
                <div className="header-cell">Actions</div>
              </div>
              {encryptionKeys.map(key => (
                <div key={key.id} className="table-row">
                  <div className="table-cell">{key.id}</div>
                  <div className="table-cell">{key.algorithm}</div>
                  <div className="table-cell">{key.usage}</div>
                  <div className="table-cell">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(key.status) }}
                    >
                      {key.status}
                    </span>
                  </div>
                  <div className="table-cell">{formatTimestamp(key.created)}</div>
                  <div className="table-cell">{formatTimestamp(key.lastUsed)}</div>
                  <div className="table-cell">
                    <div className="key-actions">
                      {key.status === 'active' && (
                        <>
                          <button 
                            onClick={() => handleRotateKey(key.id)}
                            className="btn btn-small"
                          >
                            🔄 Rotate
                          </button>
                          <button 
                            onClick={() => handleRevokeKey(key.id)}
                            className="btn btn-small btn-danger"
                          >
                            🚫 Revoke
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="audit-panel">
            <h3>📋 Security Audit Log</h3>
            
            <div className="audit-detailed-list">
              {auditLog.map(event => (
                <div key={event.auditId} className="audit-event">
                  <div className="event-header">
                    <div className="event-info">
                      <span className="event-type">{event.eventType.replace('_', ' ')}</span>
                      <span 
                        className="severity-badge"
                        style={{ backgroundColor: getSeverityColor(event.severity) }}
                      >
                        {event.severity}
                      </span>
                    </div>
                    <span className="event-timestamp">{formatTimestamp(event.timestamp)}</span>
                  </div>
                  <div className="event-content">
                    <div className="event-details">
                      <div className="detail-item">
                        <span className="detail-label">User:</span>
                        <span className="detail-value">{event.userId}</span>
                      </div>
                      {event.documentId && (
                        <div className="detail-item">
                          <span className="detail-label">Document:</span>
                          <span className="detail-value">{event.documentId}</span>
                        </div>
                      )}
                      {event.keyId && (
                        <div className="detail-item">
                          <span className="detail-label">Key:</span>
                          <span className="detail-value">{event.keyId}</span>
                        </div>
                      )}
                    </div>
                    <div className="compliance-flags">
                      {event.complianceFlags.map(flag => (
                        <span key={flag} className="compliance-flag">
                          {flag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                    {event.details && (
                      <div className="event-metadata">
                        <strong>Details:</strong>
                        <pre>{JSON.stringify(event.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transit' && (
          <div className="transit-panel">
            <h3>🚀 Transit Encryption Sessions</h3>
            
            <div className="transit-sessions">
              {transitSessions.map(session => (
                <div key={session.sessionId} className="session-card">
                  <div className="session-header">
                    <div className="session-info">
                      <h5>{session.sessionId}</h5>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(session.status) }}
                      >
                        {session.status}
                      </span>
                    </div>
                    <div className="session-endpoint">{session.endpoint}</div>
                  </div>
                  <div className="session-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Algorithm:</span>
                        <span className="detail-value">{session.algorithm}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Key Exchange:</span>
                        <span className="detail-value">{session.keyExchange}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Established:</span>
                        <span className="detail-value">{formatTimestamp(session.established)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Expires:</span>
                        <span className="detail-value">{formatTimestamp(session.expires)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="transit-actions">
              <button onClick={handleEstablishTransit} className="btn btn-primary">
                🔒 Establish New Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};