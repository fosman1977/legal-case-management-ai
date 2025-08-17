/**
 * Engine Discovery Dashboard
 * Shows discovered engines, recommendations, and monitoring data
 */

import React, { useState, useEffect } from 'react';
import { engineDiscoveryService } from '../services/engineDiscoveryService';
import { engineMonitoringService } from '../services/engineMonitoringService';

interface DiscoveryDashboardProps {
  caseId?: string;
}

export const EngineDiscoveryDashboard: React.FC<DiscoveryDashboardProps> = ({ caseId }) => {
  const [discoveryStatus, setDiscoveryStatus] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discovery' | 'monitoring' | 'recommendations' | 'alerts'>('discovery');

  useEffect(() => {
    loadDashboardData();
    
    // Start services if not already running
    startServices();
    
    // Update every minute
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const startServices = async () => {
    try {
      // Start discovery service
      await engineDiscoveryService.start();
      
      // Start monitoring service
      await engineMonitoringService.startMonitoring();
      
    } catch (error) {
      console.error('Failed to start services:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load discovery data
      const discoveryStatus = engineDiscoveryService.getDiscoveryStatus();
      setDiscoveryStatus(discoveryStatus);
      
      const recommendations = engineDiscoveryService.getRecommendations();
      setRecommendations(recommendations);
      
      // Load monitoring data
      const monitoringStatus = engineMonitoringService.getMonitoringStatus();
      setMonitoringData(monitoringStatus);
      
      const alerts = engineMonitoringService.getUnacknowledgedAlerts();
      setAlerts(alerts);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualScan = async () => {
    setIsLoading(true);
    try {
      await engineDiscoveryService.manualScan();
      await loadDashboardData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    engineMonitoringService.acknowledgeAlert(alertId);
    await loadDashboardData();
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'adopt': return '✅';
      case 'test': return '🧪';
      case 'monitor': return '👀';
      case 'reject': return '❌';
      default: return '❓';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'low': return '#2196f3';
      default: return '#666';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟠';
      case 'low': return '🟡';
      default: return '⚪';
    }
  };

  if (isLoading && !discoveryStatus) {
    return (
      <div className="discovery-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading engine discovery dashboard...</p>
      </div>
    );
  }

  return (
    <div className="engine-discovery-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h2>🔍 Engine Discovery & Monitoring</h2>
          <div className="status-overview">
            <div className="status-item">
              <span className="status-label">Discovery:</span>
              <span className="status-value">
                {discoveryStatus?.isScanning ? '🔄 Scanning...' : '✅ Active'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Monitoring:</span>
              <span className="status-value">
                {monitoringData?.isMonitoring ? '📊 Active' : '⏸️ Stopped'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Alerts:</span>
              <span className="status-value">
                {alerts.length > 0 ? `🚨 ${alerts.length}` : '✅ None'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={handleManualScan} 
            disabled={isLoading || discoveryStatus?.isScanning}
            className="btn btn-primary"
          >
            🔍 Manual Scan
          </button>
          <button onClick={loadDashboardData} className="btn btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`dashboard-tab ${activeTab === 'discovery' ? 'active' : ''}`}
          onClick={() => setActiveTab('discovery')}
        >
          🔍 Discovery ({discoveryStatus?.candidatesFound || 0})
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          💡 Recommendations ({recommendations.length})
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          📊 Monitoring ({monitoringData?.enginesMonitored || 0})
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Alerts ({alerts.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'discovery' && (
          <div className="discovery-panel">
            <h3>🕵️ Engine Discovery Status</h3>
            
            <div className="discovery-stats">
              <div className="stat-card">
                <h4>📊 Discovery Summary</h4>
                <div className="stat-grid">
                  <div className="stat-item">
                    <span className="stat-label">Last Scan:</span>
                    <span className="stat-value">
                      {discoveryStatus?.lastScan 
                        ? new Date(discoveryStatus.lastScan).toLocaleString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Candidates Found:</span>
                    <span className="stat-value">{discoveryStatus?.candidatesFound || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Recommendations:</span>
                    <span className="stat-value">{discoveryStatus?.recommendationsAvailable || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Next Scan:</span>
                    <span className="stat-value">
                      {discoveryStatus?.lastScan 
                        ? new Date(new Date(discoveryStatus.lastScan).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
                        : 'Scheduled'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="discovery-sources">
              <h4>🌐 Discovery Sources</h4>
              <div className="sources-grid">
                <div className="source-item">
                  <span className="source-icon">🐙</span>
                  <span className="source-name">GitHub</span>
                  <span className="source-status">✅ Active</span>
                </div>
                <div className="source-item">
                  <span className="source-icon">🐍</span>
                  <span className="source-name">PyPI</span>
                  <span className="source-status">✅ Active</span>
                </div>
                <div className="source-item">
                  <span className="source-icon">🤗</span>
                  <span className="source-name">HuggingFace</span>
                  <span className="source-status">✅ Active</span>
                </div>
                <div className="source-item">
                  <span className="source-icon">⚖️</span>
                  <span className="source-name">Legal Tech</span>
                  <span className="source-status">✅ Active</span>
                </div>
              </div>
            </div>

            {discoveryStatus?.isScanning && (
              <div className="scanning-indicator">
                <div className="scanning-animation">
                  <span className="scanning-dots">🔍 Scanning for new engines</span>
                  <div className="dots">...</div>
                </div>
                <p>This may take a few minutes to complete.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-panel">
            <h3>💡 Engine Recommendations</h3>
            
            {recommendations.length === 0 ? (
              <div className="no-recommendations">
                <p>No engine recommendations available yet.</p>
                <p>Run a manual scan to discover new engines.</p>
              </div>
            ) : (
              <div className="recommendations-list">
                {recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <div className="recommendation-header">
                      <div className="recommendation-info">
                        <h4>
                          {getRecommendationIcon(rec.recommendation)} {rec.candidate.name}
                        </h4>
                        <div className="recommendation-meta">
                          <span 
                            className="impact-badge"
                            style={{ backgroundColor: getImpactColor(rec.potentialImpact) }}
                          >
                            {rec.potentialImpact} impact
                          </span>
                          <span className="version">v{rec.candidate.version}</span>
                          <span className="source">{rec.candidate.source}</span>
                        </div>
                      </div>
                      <div className="recommendation-action">
                        <span className="recommendation-type">{rec.recommendation}</span>
                      </div>
                    </div>

                    <div className="recommendation-description">
                      <p>{rec.candidate.description}</p>
                    </div>

                    <div className="recommendation-details">
                      <div className="detail-section">
                        <strong>Specialties:</strong>
                        <div className="specialty-tags">
                          {rec.candidate.specialties.map(specialty => (
                            <span key={specialty} className="specialty-tag">{specialty}</span>
                          ))}
                        </div>
                      </div>

                      <div className="detail-section">
                        <strong>Reasoning:</strong>
                        <ul>
                          {rec.reasoning.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="detail-section">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Integration Effort:</span>
                            <span className="detail-value">{rec.integrationEffort}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Risk Level:</span>
                            <span className="detail-value">{rec.riskLevel}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Estimated Accuracy:</span>
                            <span className="detail-value">
                              {(rec.candidate.estimatedAccuracy * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {rec.benchmarkResults.length > 0 && (
                        <div className="detail-section">
                          <strong>Benchmark Results:</strong>
                          <div className="benchmark-results">
                            {rec.benchmarkResults.map((benchmark, idx) => (
                              <div key={idx} className="benchmark-item">
                                <span className="benchmark-name">{benchmark.testSuite}</span>
                                <span className="benchmark-score">
                                  {(benchmark.accuracy * 100).toFixed(1)}% accuracy
                                </span>
                                <span className="benchmark-status">
                                  {benchmark.passed ? '✅' : '❌'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="recommendation-actions">
                      <a 
                        href={rec.candidate.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        🔗 View Source
                      </a>
                      {rec.recommendation === 'adopt' && (
                        <button className="btn btn-primary btn-sm">
                          ✅ Adopt Engine
                        </button>
                      )}
                      {rec.recommendation === 'test' && (
                        <button className="btn btn-warning btn-sm">
                          🧪 Test Engine
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="monitoring-panel">
            <h3>📊 Engine Performance Monitoring</h3>
            
            <div className="monitoring-stats">
              <div className="stat-card">
                <h4>📈 Monitoring Overview</h4>
                <div className="stat-grid">
                  <div className="stat-item">
                    <span className="stat-label">Engines Monitored:</span>
                    <span className="stat-value">{monitoringData?.enginesMonitored || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Metrics:</span>
                    <span className="stat-value">{monitoringData?.totalMetrics || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Active Alerts:</span>
                    <span className="stat-value">{monitoringData?.unacknowledgedAlerts || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Status:</span>
                    <span className="stat-value">
                      {monitoringData?.isMonitoring ? '🟢 Active' : '🔴 Stopped'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="monitoring-explanation">
              <h4>📋 What We Monitor</h4>
              <div className="monitoring-metrics">
                <div className="metric-item">
                  <span className="metric-icon">🎯</span>
                  <span className="metric-name">Accuracy</span>
                  <span className="metric-desc">Entity extraction accuracy rates</span>
                </div>
                <div className="metric-item">
                  <span className="metric-icon">⚡</span>
                  <span className="metric-name">Speed</span>
                  <span className="metric-desc">Processing time per document</span>
                </div>
                <div className="metric-item">
                  <span className="metric-icon">💾</span>
                  <span className="metric-name">Memory</span>
                  <span className="metric-desc">Memory usage and potential leaks</span>
                </div>
                <div className="metric-item">
                  <span className="metric-icon">❌</span>
                  <span className="metric-name">Errors</span>
                  <span className="metric-desc">Error rates and failure patterns</span>
                </div>
                <div className="metric-item">
                  <span className="metric-icon">📊</span>
                  <span className="metric-name">Throughput</span>
                  <span className="metric-desc">Documents processed per minute</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-panel">
            <h3>🚨 Performance Alerts</h3>
            
            {alerts.length === 0 ? (
              <div className="no-alerts">
                <div className="no-alerts-icon">✅</div>
                <h4>All Clear!</h4>
                <p>No performance alerts at this time.</p>
                <p>All engines are operating within normal parameters.</p>
              </div>
            ) : (
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-card severity-${alert.severity}`}>
                    <div className="alert-header">
                      <div className="alert-info">
                        <h4>
                          {getSeverityIcon(alert.severity)} {alert.engineName}
                        </h4>
                        <div className="alert-meta">
                          <span className="alert-type">{alert.type.replace('_', ' ')}</span>
                          <span className="alert-time">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="alert-actions">
                        <button 
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="btn btn-sm btn-secondary"
                        >
                          ✅ Acknowledge
                        </button>
                      </div>
                    </div>

                    <div className="alert-message">
                      <p>{alert.message}</p>
                    </div>

                    <div className="alert-details">
                      <div className="alert-metrics">
                        <div className="metric">
                          <span className="metric-label">Threshold:</span>
                          <span className="metric-value">{alert.threshold}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Current:</span>
                          <span className="metric-value">{alert.currentValue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};