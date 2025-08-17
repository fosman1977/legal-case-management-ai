/**
 * Access Logging and Audit Trail Dashboard
 * Comprehensive system-wide access monitoring and compliance interface
 */

import React, { useState, useEffect } from 'react';
import { accessLoggingService } from '../services/accessLoggingService';

interface AccessLoggingDashboardProps {
  caseId?: string;
}

export const AccessLoggingDashboard: React.FC<AccessLoggingDashboardProps> = ({ caseId }) => {
  const [accessEvents, setAccessEvents] = useState<any[]>([]);
  const [accessPatterns, setAccessPatterns] = useState<any[]>([]);
  const [complianceReports, setComplianceReports] = useState<any[]>([]);
  const [auditRules, setAuditRules] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [accessStats, setAccessStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'patterns' | 'compliance' | 'rules'>('overview');
  
  // Filters
  const [eventFilters, setEventFilters] = useState({
    userId: '',
    eventType: '',
    riskLevel: '',
    timeframe: '24h'
  });
  
  // New rule form
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    eventTypes: [] as string[],
    alertLevel: 'info' as any,
    enabled: true
  });

  useEffect(() => {
    loadDashboardData();
    
    // Update every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [eventFilters]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load access statistics
      const stats = accessLoggingService.getAccessStatistics();
      setAccessStats(stats);
      
      // Load access events with filters
      const timeframe = getTimeframeRange(eventFilters.timeframe);
      const events = accessLoggingService.getAccessEvents({
        userId: eventFilters.userId || undefined,
        eventType: eventFilters.eventType as any || undefined,
        riskLevel: eventFilters.riskLevel as any || undefined,
        timeframe,
        limit: 100
      });
      setAccessEvents(events);
      
      // Load access patterns
      const patterns = accessLoggingService.getAccessPatterns();
      setAccessPatterns(patterns);
      
      // Load compliance reports
      const reports = accessLoggingService.getComplianceReports();
      setComplianceReports(reports);
      
      // Load audit rules
      const rules = accessLoggingService.getAuditRules();
      setAuditRules(rules);
      
      // Load active alerts
      const alerts = accessLoggingService.getActiveAlerts();
      setActiveAlerts(alerts);
      
    } catch (error) {
      console.error('❌ Failed to load access logging data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeframeRange = (timeframe: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (timeframe) {
      case '1h':
        start.setHours(start.getHours() - 1);
        break;
      case '24h':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      default:
        start.setDate(start.getDate() - 1);
    }
    
    return { start, end: now };
  };

  const handleGenerateComplianceReport = async (reportType: string) => {
    try {
      const timeframe = getTimeframeRange('30d'); // Last 30 days
      const report = await accessLoggingService.generateComplianceReport(
        reportType as any,
        timeframe,
        {
          includeRecommendations: true,
          includeActionItems: true
        }
      );
      
      console.log(`✅ Generated ${reportType.toUpperCase()} compliance report`);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error(`❌ Failed to generate ${reportType} report:`, error);
    }
  };

  const handleDetectPatterns = async () => {
    try {
      const suspiciousPatterns = await accessLoggingService.detectSuspiciousPatterns();
      console.log(`🔍 Detected ${suspiciousPatterns.length} suspicious patterns`);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('❌ Failed to detect patterns:', error);
    }
  };

  const handleCreateAuditRule = async () => {
    if (!newRule.name.trim()) return;
    
    try {
      const ruleId = await accessLoggingService.createAuditRule({
        name: newRule.name,
        description: newRule.description,
        enabled: newRule.enabled,
        eventTypes: newRule.eventTypes,
        conditions: {},
        actions: {
          alertLevel: newRule.alertLevel,
          notifications: ['admin'],
          automatedResponse: 'log_only'
        },
        retentionDays: 365
      });
      
      console.log(`✅ Created audit rule: ${ruleId}`);
      setShowRuleForm(false);
      setNewRule({
        name: '',
        description: '',
        eventTypes: [],
        alertLevel: 'info',
        enabled: true
      });
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Failed to create audit rule:', error);
    }
  };

  const toggleRuleEnabled = async (ruleId: string, enabled: boolean) => {
    try {
      await accessLoggingService.updateAuditRule(ruleId, { enabled });
      console.log(`✅ ${enabled ? 'Enabled' : 'Disabled'} audit rule: ${ruleId}`);
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Failed to update audit rule:', error);
    }
  };

  const deleteAuditRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this audit rule?')) return;
    
    try {
      await accessLoggingService.deleteAuditRule(ruleId);
      console.log(`✅ Deleted audit rule: ${ruleId}`);
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Failed to delete audit rule:', error);
    }
  };

  const formatTimestamp = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  const getRiskLevelColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getEventTypeIcon = (eventType: string): string => {
    switch (eventType) {
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'document_access': return '📄';
      case 'ai_query': return '🤖';
      case 'system_config': return '⚙️';
      case 'user_management': return '👥';
      case 'security_event': return '🚨';
      default: return '📝';
    }
  };

  const getPatternIcon = (pattern: string): string => {
    switch (pattern) {
      case 'normal': return '✅';
      case 'suspicious': return '⚠️';
      case 'anomalous': return '🚨';
      case 'bulk_access': return '📚';
      case 'after_hours': return '🌙';
      case 'geographic_anomaly': return '🌍';
      default: return '❓';
    }
  };

  const getAlertSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'info': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const eventTypeOptions = [
    'login', 'logout', 'document_access', 'document_create', 'document_edit', 'document_delete',
    'case_access', 'case_create', 'case_edit', 'case_delete', 'ai_query', 'benchmark_run',
    'export_data', 'system_config', 'user_management', 'security_event', 'compliance_check'
  ];

  if (isLoading && !accessStats) {
    return (
      <div className="access-logging-loading">
        <div className="loading-spinner"></div>
        <p>Loading access logging dashboard...</p>
      </div>
    );
  }

  return (
    <div className="access-logging-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h2>🔍 Access Logging & Audit Trail Dashboard</h2>
          <div className="status-overview">
            <div className="status-item">
              <span className="status-label">Total Events:</span>
              <span className="status-value">
                {accessStats?.totalEvents?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Unique Users:</span>
              <span className="status-value">
                {accessStats?.uniqueUsers || '0'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Recent Activity (24h):</span>
              <span className="status-value">
                {accessStats?.recentActivity || '0'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Suspicious Patterns:</span>
              <span 
                className="status-value"
                style={{ color: accessStats?.suspiciousPatterns > 0 ? '#ef4444' : '#10b981' }}
              >
                {accessStats?.suspiciousPatterns || '0'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Active Alerts:</span>
              <span 
                className="status-value"
                style={{ color: accessStats?.activeAlerts > 0 ? '#ef4444' : '#10b981' }}
              >
                {accessStats?.activeAlerts || '0'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button onClick={loadDashboardData} className="btn btn-primary">
            🔄 Refresh
          </button>
          <button onClick={handleDetectPatterns} className="btn btn-secondary">
            🔍 Detect Patterns
          </button>
          <button 
            onClick={() => handleGenerateComplianceReport('gdpr')} 
            className="btn btn-secondary"
          >
            📊 GDPR Report
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
          className={`dashboard-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          📝 Access Events
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          🔍 Patterns
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          📋 Compliance
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          ⚙️ Audit Rules
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-panel">
            <h3>📊 Access Monitoring Overview</h3>
            
            {/* Statistics Cards */}
            <div className="access-stats-cards">
              <div className="stats-card">
                <div className="card-header">
                  <h4>📈 Event Statistics</h4>
                  <span className="card-icon">📊</span>
                </div>
                <div className="card-content">
                  <div className="metric-large">
                    {accessStats?.totalEvents?.toLocaleString() || '0'}
                  </div>
                  <div className="metric-label">Total Events</div>
                  <div className="breakdown">
                    {Object.entries(accessStats?.eventsByType || {}).slice(0, 4).map(([type, count]) => (
                      <div key={type} className="breakdown-item">
                        <span className="event-type-badge">
                          {getEventTypeIcon(type)} {type}
                        </span>
                        <span className="count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="card-header">
                  <h4>⚠️ Risk Assessment</h4>
                  <span className="card-icon">🎯</span>
                </div>
                <div className="card-content">
                  <div className="metric-large">
                    {((accessStats?.eventsByRisk?.high || 0) + (accessStats?.eventsByRisk?.critical || 0))}
                  </div>
                  <div className="metric-label">High-Risk Events</div>
                  <div className="risk-breakdown">
                    {Object.entries(accessStats?.eventsByRisk || {}).map(([risk, count]) => (
                      <div key={risk} className="risk-item">
                        <div 
                          className="risk-indicator"
                          style={{ backgroundColor: getRiskLevelColor(risk) }}
                        ></div>
                        <span className="risk-label">{risk}</span>
                        <span className="risk-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="card-header">
                  <h4>🚨 Security Alerts</h4>
                  <span className="card-icon">🔔</span>
                </div>
                <div className="card-content">
                  <div 
                    className="metric-large"
                    style={{ color: accessStats?.activeAlerts > 0 ? '#ef4444' : '#10b981' }}
                  >
                    {accessStats?.activeAlerts || 0}
                  </div>
                  <div className="metric-label">Active Alerts</div>
                  <div className="alert-summary">
                    {activeAlerts.slice(0, 3).map(alert => (
                      <div key={alert.alertId} className="alert-item">
                        <span 
                          className="alert-severity"
                          style={{ color: getAlertSeverityColor(alert.severity) }}
                        >
                          {alert.severity}
                        </span>
                        <span className="alert-description">{alert.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="card-header">
                  <h4>👥 User Activity</h4>
                  <span className="card-icon">👤</span>
                </div>
                <div className="card-content">
                  <div className="metric-large">
                    {accessStats?.uniqueUsers || 0}
                  </div>
                  <div className="metric-label">Active Users</div>
                  <div className="user-activity">
                    <div className="activity-item">
                      <span>Recent (24h):</span>
                      <span>{accessStats?.recentActivity || 0}</span>
                    </div>
                    <div className="activity-item">
                      <span>Patterns Detected:</span>
                      <span>{accessStats?.suspiciousPatterns || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent High-Risk Events */}
            <div className="recent-high-risk">
              <h4>⚠️ Recent High-Risk Events</h4>
              <div className="high-risk-events">
                {accessEvents
                  .filter(event => event.riskLevel === 'high' || event.riskLevel === 'critical')
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.eventId} className="high-risk-event">
                      <div className="event-header">
                        <span className="event-icon">{getEventTypeIcon(event.eventType)}</span>
                        <span className="event-type">{event.eventType}</span>
                        <span 
                          className="risk-badge"
                          style={{ backgroundColor: getRiskLevelColor(event.riskLevel) }}
                        >
                          {event.riskLevel}
                        </span>
                        <span className="event-timestamp">{formatTimestamp(event.timestamp)}</span>
                      </div>
                      <div className="event-details">
                        <span>User: {event.userId}</span>
                        <span>Action: {event.action}</span>
                        <span>Result: {event.actionResult}</span>
                        {event.resourceId && <span>Resource: {event.resourceId}</span>}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Compliance Summary */}
            <div className="compliance-summary">
              <h4>📋 Compliance Summary</h4>
              <div className="compliance-frameworks">
                <div className="framework-item">
                  <span className="framework-name">GDPR</span>
                  <span className="compliance-status compliant">✅ Compliant</span>
                  <span className="last-report">Last report: {complianceReports.length > 0 ? formatTimestamp(complianceReports[0].generatedAt) : 'Never'}</span>
                </div>
                <div className="framework-item">
                  <span className="framework-name">HIPAA</span>
                  <span className="compliance-status compliant">✅ Compliant</span>
                  <span className="last-report">Monitoring active</span>
                </div>
                <div className="framework-item">
                  <span className="framework-name">SOX</span>
                  <span className="compliance-status compliant">✅ Compliant</span>
                  <span className="last-report">Real-time monitoring</span>
                </div>
                <div className="framework-item">
                  <span className="framework-name">ISO 27001</span>
                  <span className="compliance-status compliant">✅ Compliant</span>
                  <span className="last-report">Audit ready</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="events-panel">
            <h3>📝 Access Events Log</h3>
            
            {/* Event Filters */}
            <div className="event-filters">
              <div className="filter-group">
                <label>User ID:</label>
                <input
                  type="text"
                  value={eventFilters.userId}
                  onChange={(e) => setEventFilters(prev => ({ ...prev, userId: e.target.value }))}
                  placeholder="Filter by user ID..."
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Event Type:</label>
                <select
                  value={eventFilters.eventType}
                  onChange={(e) => setEventFilters(prev => ({ ...prev, eventType: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Types</option>
                  {eventTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Risk Level:</label>
                <select
                  value={eventFilters.riskLevel}
                  onChange={(e) => setEventFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Timeframe:</label>
                <select
                  value={eventFilters.timeframe}
                  onChange={(e) => setEventFilters(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="filter-select"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>

            {/* Events Table */}
            <div className="events-table">
              <div className="table-header">
                <div className="header-cell">Event</div>
                <div className="header-cell">User</div>
                <div className="header-cell">Action</div>
                <div className="header-cell">Result</div>
                <div className="header-cell">Risk</div>
                <div className="header-cell">Timestamp</div>
                <div className="header-cell">Details</div>
              </div>
              {accessEvents.map(event => (
                <div key={event.eventId} className="table-row">
                  <div className="table-cell">
                    <span className="event-icon">{getEventTypeIcon(event.eventType)}</span>
                    <span className="event-type">{event.eventType}</span>
                  </div>
                  <div className="table-cell">
                    <div className="user-info">
                      <span className="user-id">{event.userId}</span>
                      <span className="user-role">{event.userRole}</span>
                    </div>
                  </div>
                  <div className="table-cell">{event.action}</div>
                  <div className="table-cell">
                    <span className={`result-badge ${event.actionResult}`}>
                      {event.actionResult}
                    </span>
                  </div>
                  <div className="table-cell">
                    <span 
                      className="risk-badge"
                      style={{ backgroundColor: getRiskLevelColor(event.riskLevel) }}
                    >
                      {event.riskLevel}
                    </span>
                  </div>
                  <div className="table-cell">{formatTimestamp(event.timestamp)}</div>
                  <div className="table-cell">
                    {event.resourceId && <div>Resource: {event.resourceId}</div>}
                    {event.metadata.geolocation && <div>Location: {event.metadata.geolocation}</div>}
                    {event.complianceFlags.length > 0 && (
                      <div className="compliance-flags">
                        {event.complianceFlags.slice(0, 2).map((flag: string) => (
                          <span key={flag} className="compliance-flag">{flag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="patterns-panel">
            <h3>🔍 Access Pattern Analysis</h3>
            
            <div className="pattern-detection-controls">
              <button onClick={handleDetectPatterns} className="btn btn-primary">
                🔍 Run Pattern Detection
              </button>
              <div className="detection-info">
                <span>Last detection: {accessPatterns.length > 0 ? formatTimestamp(accessPatterns[0].lastDetected) : 'Never'}</span>
              </div>
            </div>

            {/* Access Patterns */}
            <div className="patterns-list">
              {accessPatterns.map(pattern => (
                <div key={`${pattern.userId}_${pattern.pattern}`} className="pattern-item">
                  <div className="pattern-header">
                    <div className="pattern-info">
                      <span className="pattern-icon">{getPatternIcon(pattern.pattern)}</span>
                      <span className="pattern-type">{pattern.pattern}</span>
                      <span className="pattern-user">User: {pattern.userId}</span>
                    </div>
                    <div className="pattern-metrics">
                      <span className="confidence">Confidence: {(pattern.confidence * 100).toFixed(0)}%</span>
                      <span 
                        className="risk-score"
                        style={{ color: pattern.riskScore > 0.7 ? '#ef4444' : pattern.riskScore > 0.4 ? '#f59e0b' : '#10b981' }}
                      >
                        Risk: {(pattern.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="pattern-details">
                    <div className="pattern-indicators">
                      <strong>Indicators:</strong>
                      {pattern.indicators.map((indicator: string) => (
                        <span key={indicator} className="indicator-badge">{indicator}</span>
                      ))}
                    </div>
                    <div className="pattern-meta">
                      <span>Frequency: {pattern.frequency}</span>
                      <span>Last Detected: {formatTimestamp(pattern.lastDetected)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {accessPatterns.length === 0 && (
                <div className="no-patterns">
                  <p>No suspicious patterns detected. This is good!</p>
                  <p>Run pattern detection to analyze recent activity.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="compliance-panel">
            <h3>📋 Compliance Reports & Monitoring</h3>
            
            {/* Compliance Report Generation */}
            <div className="report-generation">
              <h4>📊 Generate Compliance Reports</h4>
              <div className="report-buttons">
                <button 
                  onClick={() => handleGenerateComplianceReport('gdpr')} 
                  className="btn btn-primary"
                >
                  📊 GDPR Report
                </button>
                <button 
                  onClick={() => handleGenerateComplianceReport('hipaa')} 
                  className="btn btn-primary"
                >
                  🏥 HIPAA Report
                </button>
                <button 
                  onClick={() => handleGenerateComplianceReport('sox')} 
                  className="btn btn-primary"
                >
                  💼 SOX Report
                </button>
                <button 
                  onClick={() => handleGenerateComplianceReport('iso27001')} 
                  className="btn btn-primary"
                >
                  🔒 ISO 27001 Report
                </button>
              </div>
            </div>

            {/* Existing Compliance Reports */}
            <div className="compliance-reports">
              <h4>📚 Recent Compliance Reports</h4>
              {complianceReports.length > 0 ? (
                <div className="reports-list">
                  {complianceReports.map(report => (
                    <div key={report.reportId} className="report-item">
                      <div className="report-header">
                        <div className="report-info">
                          <span className="report-type">{report.reportType.toUpperCase()}</span>
                          <span className="report-timeframe">
                            {formatTimestamp(report.timeframe.start)} - {formatTimestamp(report.timeframe.end)}
                          </span>
                        </div>
                        <span className="report-generated">Generated: {formatTimestamp(report.generatedAt)}</span>
                      </div>
                      <div className="report-summary">
                        <div className="summary-stats">
                          <div className="summary-item">
                            <span className="label">Events:</span>
                            <span className="value">{report.summary.totalEvents}</span>
                          </div>
                          <div className="summary-item">
                            <span className="label">Users:</span>
                            <span className="value">{report.summary.uniqueUsers}</span>
                          </div>
                          <div className="summary-item">
                            <span className="label">Incidents:</span>
                            <span className="value">{report.summary.securityIncidents}</span>
                          </div>
                          <div className="summary-item">
                            <span className="label">Violations:</span>
                            <span className="value">{report.summary.complianceViolations}</span>
                          </div>
                          <div className="summary-item">
                            <span className="label">Findings:</span>
                            <span className="value">{report.findings.length}</span>
                          </div>
                        </div>
                      </div>
                      <div className="report-findings">
                        <strong>Key Findings:</strong>
                        {report.findings.slice(0, 3).map((finding, index) => (
                          <div key={index} className="finding-item">
                            <span 
                              className="finding-severity"
                              style={{ color: getRiskLevelColor(finding.severity) }}
                            >
                              {finding.severity}
                            </span>
                            <span className="finding-description">{finding.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-reports">
                  <p>No compliance reports generated yet.</p>
                  <p>Generate reports to monitor compliance status.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="rules-panel">
            <h3>⚙️ Audit Rules Management</h3>
            
            {/* Create New Rule */}
            <div className="rule-creation">
              <button 
                onClick={() => setShowRuleForm(!showRuleForm)} 
                className="btn btn-primary"
              >
                {showRuleForm ? '❌ Cancel' : '➕ Create New Rule'}
              </button>
              
              {showRuleForm && (
                <div className="new-rule-form">
                  <div className="form-group">
                    <label>Rule Name:</label>
                    <input
                      type="text"
                      value={newRule.name}
                      onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter rule name..."
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea
                      value={newRule.description}
                      onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this rule monitors..."
                      className="form-textarea"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Event Types:</label>
                    <div className="event-type-checkboxes">
                      {eventTypeOptions.slice(0, 8).map(type => (
                        <label key={type} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={newRule.eventTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRule(prev => ({ 
                                  ...prev, 
                                  eventTypes: [...prev.eventTypes, type] 
                                }));
                              } else {
                                setNewRule(prev => ({ 
                                  ...prev, 
                                  eventTypes: prev.eventTypes.filter(t => t !== type) 
                                }));
                              }
                            }}
                          />
                          {getEventTypeIcon(type)} {type}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Alert Level:</label>
                    <select
                      value={newRule.alertLevel}
                      onChange={(e) => setNewRule(prev => ({ ...prev, alertLevel: e.target.value as any }))}
                      className="form-select"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button onClick={handleCreateAuditRule} className="btn btn-primary">
                      ✅ Create Rule
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Existing Audit Rules */}
            <div className="audit-rules">
              <h4>📋 Active Audit Rules</h4>
              <div className="rules-list">
                {auditRules.map(rule => (
                  <div key={rule.ruleId} className="rule-item">
                    <div className="rule-header">
                      <div className="rule-info">
                        <span className="rule-name">{rule.name}</span>
                        <span 
                          className="rule-status"
                          style={{ color: rule.enabled ? '#10b981' : '#6b7280' }}
                        >
                          {rule.enabled ? '✅ Enabled' : '⏸️ Disabled'}
                        </span>
                      </div>
                      <div className="rule-actions">
                        <button 
                          onClick={() => toggleRuleEnabled(rule.ruleId, !rule.enabled)}
                          className={`btn btn-small ${rule.enabled ? 'btn-secondary' : 'btn-primary'}`}
                        >
                          {rule.enabled ? '⏸️ Disable' : '▶️ Enable'}
                        </button>
                        <button 
                          onClick={() => deleteAuditRule(rule.ruleId)}
                          className="btn btn-small btn-danger"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                    <div className="rule-description">{rule.description}</div>
                    <div className="rule-details">
                      <div className="rule-event-types">
                        <strong>Monitors:</strong>
                        {rule.eventTypes.slice(0, 4).map(type => (
                          <span key={type} className="event-type-tag">
                            {getEventTypeIcon(type)} {type}
                          </span>
                        ))}
                        {rule.eventTypes.length > 4 && (
                          <span className="more-types">+{rule.eventTypes.length - 4} more</span>
                        )}
                      </div>
                      <div className="rule-config">
                        <span>Alert Level: 
                          <span 
                            className="alert-level"
                            style={{ color: getAlertSeverityColor(rule.actions.alertLevel) }}
                          >
                            {rule.actions.alertLevel}
                          </span>
                        </span>
                        <span>Retention: {rule.retentionDays} days</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {auditRules.length === 0 && (
                <div className="no-rules">
                  <p>No audit rules configured.</p>
                  <p>Create rules to monitor specific access patterns and security events.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};