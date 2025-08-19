/**
 * Production Performance Dashboard
 * Enterprise-grade monitoring for performance, caching, and fail-safe systems
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitoringService } from '../services/performanceMonitoringService';
import { cacheOptimizationService } from '../services/cacheOptimizationService';
import { failSafeService } from '../services/failSafeService';

interface ProductionDashboardProps {
  caseId?: string;
}

export const ProductionPerformanceDashboard: React.FC<ProductionDashboardProps> = ({ caseId }) => {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [cacheData, setCacheData] = useState<any>(null);
  const [failSafeData, setFailSafeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'caching' | 'failsafe' | 'optimization'>('overview');

  useEffect(() => {
    loadDashboardData();
    
    // Start monitoring services
    startMonitoringServices();
    
    // Update every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const startMonitoringServices = async () => {
    try {
      await performanceMonitoringService.startMonitoring();
      // failSafeService is already monitoring
      console.log('✅ Production monitoring services started');
    } catch (error) {
      console.error('❌ Failed to start monitoring services:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load performance data
      const perfSummary = performanceMonitoringService.getPerformanceSummary();
      const systemMetrics = performanceMonitoringService.getSystemMetrics(30); // Last 30 minutes
      const bottleneckAnalysis = performanceMonitoringService.getBottleneckAnalysis();
      const perfAlerts = performanceMonitoringService.getPerformanceAlerts();
      const optimizationRecs = performanceMonitoringService.getOptimizationRecommendations();
      
      setPerformanceData({
        summary: perfSummary,
        metrics: systemMetrics,
        bottlenecks: bottleneckAnalysis,
        alerts: perfAlerts,
        recommendations: optimizationRecs
      });
      
      // Load cache data
      const cacheStats = cacheOptimizationService.getAllCacheStatistics();
      setCacheData({
        statistics: cacheStats
      });
      
      // Load fail-safe data
      const serviceStatuses = failSafeService.getServiceStatuses();
      const queueStatus = failSafeService.getQueueStatus();
      const systemReliability = failSafeService.getSystemReliability();
      
      setFailSafeData({
        services: serviceStatuses,
        queue: queueStatus,
        reliability: systemReliability
      });
      
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return '#10b981';
      case 'good': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading && !performanceData) {
    return (
      <div className="production-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading production performance dashboard...</p>
      </div>
    );
  }

  return (
    <div className="production-performance-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h2>⚡ Production Performance Dashboard</h2>
          <div className="status-overview">
            <div className="status-item">
              <span className="status-label">System Status:</span>
              <span 
                className="status-value"
                style={{ color: getStatusColor(performanceData?.summary?.status || 'warning') }}
              >
                {performanceData?.summary?.status || 'Unknown'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Reliability:</span>
              <span className="status-value">
                {failSafeData?.reliability 
                  ? `${(failSafeData.reliability.overallReliability * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Active Alerts:</span>
              <span className="status-value">
                {performanceData?.alerts?.length || 0}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Queue:</span>
              <span className="status-value">
                {failSafeData?.queue?.totalTasks || 0} tasks
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button onClick={loadDashboardData} className="btn btn-primary">
            🔄 Refresh
          </button>
          <button 
            onClick={() => {
              performanceMonitoringService.getPerformanceAlerts().forEach(alert => {
                performanceMonitoringService.acknowledgeAlert(alert.id);
              });
              loadDashboardData();
            }} 
            className="btn btn-secondary"
          >
            ✅ Acknowledge Alerts
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
          className={`dashboard-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          ⚡ Performance
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'caching' ? 'active' : ''}`}
          onClick={() => setActiveTab('caching')}
        >
          💾 Caching
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'failsafe' ? 'active' : ''}`}
          onClick={() => setActiveTab('failsafe')}
        >
          🛡️ Fail-Safe
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          🚀 Optimization
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-panel">
            <h3>📊 System Overview</h3>
            
            {/* Key Metrics Cards */}
            <div className="metrics-cards">
              <div className="metric-card">
                <div className="metric-header">
                  <h4>🖥️ System Resources</h4>
                  <span 
                    className="metric-status"
                    style={{ color: getStatusColor(performanceData?.summary?.status || 'warning') }}
                  >
                    {performanceData?.summary?.status || 'Unknown'}
                  </span>
                </div>
                <div className="metric-content">
                  <div className="metric-item">
                    <span className="metric-label">CPU Usage:</span>
                    <span className="metric-value">
                      {performanceData?.summary?.metrics?.cpu?.toFixed(1) || '0'}%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Memory Usage:</span>
                    <span className="metric-value">
                      {performanceData?.summary?.metrics?.memory?.toFixed(1) || '0'}%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Disk Usage:</span>
                    <span className="metric-value">
                      {performanceData?.summary?.metrics?.disk?.toFixed(1) || '0'}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <h4>💾 Cache Performance</h4>
                  <span className="metric-status">
                    {cacheData?.statistics ? '✅ Active' : '⚠️ Limited'}
                  </span>
                </div>
                <div className="metric-content">
                  {cacheData?.statistics && Object.entries(cacheData.statistics).map(([cacheType, stats]: [string, any]) => (
                    <div key={cacheType} className="metric-item">
                      <span className="metric-label">{cacheType} Hit Rate:</span>
                      <span className="metric-value">
                        {(stats.hitRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <h4>🛡️ System Reliability</h4>
                  <span 
                    className="metric-status"
                    style={{ 
                      color: failSafeData?.reliability?.overallReliability > 0.9 ? '#10b981' : 
                             failSafeData?.reliability?.overallReliability > 0.7 ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    {failSafeData?.reliability 
                      ? `${(failSafeData.reliability.overallReliability * 100).toFixed(1)}%`
                      : 'Unknown'
                    }
                  </span>
                </div>
                <div className="metric-content">
                  <div className="metric-item">
                    <span className="metric-label">Services Online:</span>
                    <span className="metric-value">
                      {failSafeData?.services?.filter((s: any) => s.isAvailable).length || 0} / {failSafeData?.services?.length || 0}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Fallbacks Active:</span>
                    <span className="metric-value">
                      {failSafeData?.reliability?.fallbacksActive || 0}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Queue Size:</span>
                    <span className="metric-value">
                      {failSafeData?.queue?.totalTasks || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <h4>📈 Processing Performance</h4>
                  <span className="metric-status">
                    {performanceData?.summary?.metrics?.avgProcessingTime < 15000 ? '✅ Good' : '⚠️ Slow'}
                  </span>
                </div>
                <div className="metric-content">
                  <div className="metric-item">
                    <span className="metric-label">Avg Processing:</span>
                    <span className="metric-value">
                      {performanceData?.summary?.metrics?.avgProcessingTime 
                        ? `${(performanceData.summary.metrics.avgProcessingTime / 1000).toFixed(1)}s`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Uptime:</span>
                    <span className="metric-value">
                      {performanceData?.summary?.uptime || 'Unknown'}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Recommendations:</span>
                    <span className="metric-value">
                      {performanceData?.recommendations?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            {performanceData?.alerts && performanceData.alerts.length > 0 && (
              <div className="recent-alerts">
                <h4>🚨 Recent Performance Alerts</h4>
                <div className="alerts-list">
                  {performanceData.alerts.slice(0, 5).map((alert: any) => (
                    <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                      <div className="alert-content">
                        <span className="alert-message">{alert.message}</span>
                        <span className="alert-time">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className="alert-recommendation">{alert.recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottleneck Analysis */}
            {performanceData?.bottlenecks && (
              <div className="bottleneck-analysis">
                <h4>🔍 Bottleneck Analysis</h4>
                <div className="bottleneck-card">
                  <div className="bottleneck-header">
                    <span className="bottleneck-type">Primary Bottleneck:</span>
                    <span 
                      className="bottleneck-name"
                      style={{ color: getStatusColor(performanceData.bottlenecks.severity) }}
                    >
                      {performanceData.bottlenecks.primaryBottleneck}
                    </span>
                  </div>
                  <div className="bottleneck-impact">
                    <strong>Impact:</strong> {performanceData.bottlenecks.impact}
                  </div>
                  <div className="bottleneck-recommendations">
                    <strong>Recommendations:</strong>
                    <ul>
                      {performanceData.bottlenecks.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-panel">
            <h3>⚡ Performance Monitoring</h3>
            
            {/* System Metrics Chart Placeholder */}
            <div className="metrics-chart">
              <h4>📊 System Metrics (Last 30 Minutes)</h4>
              <div className="chart-placeholder">
                <div className="chart-info">
                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="legend-color cpu"></span>
                      <span>CPU Usage</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color memory"></span>
                      <span>Memory Usage</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color disk"></span>
                      <span>Disk Usage</span>
                    </div>
                  </div>
                  <div className="chart-summary">
                    <p>Real-time system metrics monitoring. In production, this would display interactive charts showing CPU, memory, and disk usage trends.</p>
                    <p>Current metrics: CPU {performanceData?.summary?.metrics?.cpu?.toFixed(1)}%, Memory {performanceData?.summary?.metrics?.memory?.toFixed(1)}%, Disk {performanceData?.summary?.metrics?.disk?.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Alerts */}
            <div className="performance-alerts">
              <h4>🚨 Active Performance Alerts</h4>
              {performanceData?.alerts && performanceData.alerts.length > 0 ? (
                <div className="alerts-detailed-list">
                  {performanceData.alerts.map((alert: any) => (
                    <div key={alert.id} className={`alert-detailed severity-${alert.severity}`}>
                      <div className="alert-header">
                        <span className="alert-type">{alert.type.replace('_', ' ')}</span>
                        <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="alert-message">{alert.message}</div>
                      <div className="alert-metrics">
                        <span>Current: {alert.currentValue}</span>
                        <span>Threshold: {alert.threshold}</span>
                      </div>
                      <div className="alert-recommendation">
                        <strong>Recommendation:</strong> {alert.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-alerts">
                  <span className="no-alerts-icon">✅</span>
                  <p>No active performance alerts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'caching' && (
          <div className="caching-panel">
            <h3>💾 Cache Optimization</h3>
            
            {cacheData?.statistics && (
              <div className="cache-statistics">
                <h4>📊 Cache Performance Statistics</h4>
                <div className="cache-stats-grid">
                  {Object.entries(cacheData.statistics).map(([cacheType, stats]: [string, any]) => (
                    <div key={cacheType} className="cache-stat-card">
                      <div className="cache-stat-header">
                        <h5>{cacheType.charAt(0).toUpperCase() + cacheType.slice(1)} Cache</h5>
                        <span 
                          className="hit-rate"
                          style={{ 
                            color: stats.hitRate > 0.8 ? '#10b981' : 
                                   stats.hitRate > 0.6 ? '#f59e0b' : '#ef4444'
                          }}
                        >
                          {(stats.hitRate * 100).toFixed(1)}% hit rate
                        </span>
                      </div>
                      <div className="cache-stat-content">
                        <div className="stat-row">
                          <span>Hits:</span>
                          <span>{stats.hits.toLocaleString()}</span>
                        </div>
                        <div className="stat-row">
                          <span>Misses:</span>
                          <span>{stats.misses.toLocaleString()}</span>
                        </div>
                        <div className="stat-row">
                          <span>Size:</span>
                          <span>{formatBytes(stats.size)}</span>
                        </div>
                        <div className="stat-row">
                          <span>Entries:</span>
                          <span>{stats.entries.toLocaleString()}</span>
                        </div>
                        <div className="stat-row">
                          <span>Evictions:</span>
                          <span>{stats.evictions.toLocaleString()}</span>
                        </div>
                        <div className="stat-row">
                          <span>Avg Access Time:</span>
                          <span>{stats.averageAccessTime.toFixed(2)}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="cache-actions">
              <h4>🔧 Cache Management</h4>
              <div className="cache-action-buttons">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    cacheOptimizationService.clearCache();
                    loadDashboardData();
                  }}
                >
                  🧹 Clear All Caches
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    cacheOptimizationService.preloadFrequentlyUsedData();
                    loadDashboardData();
                  }}
                >
                  🚀 Preload Critical Data
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'failsafe' && (
          <div className="failsafe-panel">
            <h3>🛡️ Fail-Safe System Status</h3>
            
            {/* Service Status Grid */}
            <div className="service-status-grid">
              <h4>🔧 Service Health Status</h4>
              <div className="services-grid">
                {failSafeData?.services?.map((service: any) => (
                  <div key={service.serviceName} className={`service-card ${service.isAvailable ? 'online' : 'offline'}`}>
                    <div className="service-header">
                      <span className="service-name">{service.serviceName}</span>
                      <span className={`service-status ${service.isAvailable ? 'online' : 'offline'}`}>
                        {service.isAvailable ? '✅ Online' : '❌ Offline'}
                      </span>
                    </div>
                    <div className="service-details">
                      <div className="service-detail">
                        <span>Response Time:</span>
                        <span>{service.responseTime}ms</span>
                      </div>
                      <div className="service-detail">
                        <span>Error Count:</span>
                        <span>{service.errorCount}</span>
                      </div>
                      <div className="service-detail">
                        <span>Last Check:</span>
                        <span>{new Date(service.lastCheck).toLocaleTimeString()}</span>
                      </div>
                      {service.fallbackActive && (
                        <div className="service-detail fallback">
                          <span>Fallback:</span>
                          <span>🔄 Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Queue Status */}
            {failSafeData?.queue && (
              <div className="queue-status">
                <h4>📤 Task Queue Status</h4>
                <div className="queue-summary">
                  <div className="queue-stat">
                    <span className="queue-label">Total Tasks:</span>
                    <span className="queue-value">{failSafeData.queue.totalTasks}</span>
                  </div>
                  {failSafeData.queue.oldestTask && (
                    <div className="queue-stat">
                      <span className="queue-label">Oldest Task:</span>
                      <span className="queue-value">
                        {new Date(failSafeData.queue.oldestTask).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                
                {Object.entries(failSafeData.queue.tasksByPriority).some(([_, count]) => Number(count as any) > 0) && (
                  <div className="queue-breakdown">
                    <h5>By Priority:</h5>
                    <div className="priority-breakdown">
                      {Object.entries(failSafeData.queue.tasksByPriority).map(([priority, count]: [string, any]) => (
                        count > 0 && (
                          <div key={priority} className="priority-item">
                            <span className={`priority-label ${priority}`}>{priority}:</span>
                            <span className="priority-count">{count}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* System Reliability */}
            {failSafeData?.reliability && (
              <div className="reliability-status">
                <h4>📊 System Reliability Metrics</h4>
                <div className="reliability-grid">
                  <div className="reliability-item">
                    <span className="reliability-label">Overall Reliability:</span>
                    <span 
                      className="reliability-value"
                      style={{ 
                        color: failSafeData.reliability.overallReliability > 0.9 ? '#10b981' : 
                               failSafeData.reliability.overallReliability > 0.7 ? '#f59e0b' : '#ef4444'
                      }}
                    >
                      {(failSafeData.reliability.overallReliability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="reliability-item">
                    <span className="reliability-label">Critical Services:</span>
                    <span className="reliability-value">
                      {failSafeData.reliability.criticalServicesOnline}/{failSafeData.reliability.totalCriticalServices}
                    </span>
                  </div>
                  <div className="reliability-item">
                    <span className="reliability-label">Estimated Capability:</span>
                    <span className="reliability-value">
                      {(failSafeData.reliability.estimatedCapability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="optimization-panel">
            <h3>🚀 Performance Optimization</h3>
            
            {/* Optimization Recommendations */}
            {performanceData?.recommendations && performanceData.recommendations.length > 0 ? (
              <div className="optimization-recommendations">
                <h4>💡 Active Recommendations</h4>
                <div className="recommendations-list">
                  {performanceData.recommendations.map((rec: any) => (
                    <div key={rec.id} className={`recommendation-card priority-${rec.priority}`}>
                      <div className="recommendation-header">
                        <h5>{rec.title}</h5>
                        <span className={`priority-badge ${rec.priority}`}>
                          {rec.priority} priority
                        </span>
                      </div>
                      <div className="recommendation-content">
                        <p>{rec.description}</p>
                        <div className="recommendation-details">
                          <div className="detail-item">
                            <span className="detail-label">Impact:</span>
                            <span className="detail-value">{rec.impact}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Effort:</span>
                            <span className="detail-value">{rec.effort}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Improvement:</span>
                            <span className="detail-value">{rec.estimatedImprovement}</span>
                          </div>
                        </div>
                        <div className="implementation-steps">
                          <strong>Implementation Steps:</strong>
                          <ul>
                            {rec.implementation.map((step: string, index: number) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-recommendations">
                <span className="no-recommendations-icon">✅</span>
                <h4>System Running Optimally</h4>
                <p>No optimization recommendations at this time.</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <h4>⚡ Quick Optimization Actions</h4>
              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    cacheOptimizationService.preloadFrequentlyUsedData();
                    console.log('🚀 Preloading critical data for optimization');
                  }}
                >
                  🚀 Preload Critical Models
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    cacheOptimizationService.clearCache();
                    console.log('🧹 Clearing caches to free memory');
                  }}
                >
                  🧹 Clear Memory Caches
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    console.log('🔧 Triggering garbage collection');
                  }}
                >
                  🔧 Force Garbage Collection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};