/**
 * Database Optimization Dashboard
 * Enterprise database optimization monitoring and management interface
 */

import React, { useState, useEffect } from 'react';
import { databaseOptimizationService } from '../services/databaseOptimizationService';

interface DatabaseOptimizationDashboardProps {
  caseId?: string;
}

export const DatabaseOptimizationDashboard: React.FC<DatabaseOptimizationDashboardProps> = ({ caseId }) => {
  const [storageMetrics, setStorageMetrics] = useState<any>(null);
  const [batchJobs, setBatchJobs] = useState<any[]>([]);
  const [documentIndices, setDocumentIndices] = useState<any[]>([]);
  const [optimizationRecommendations, setOptimizationRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'storage' | 'batch' | 'optimization' | 'search'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    
    // Update every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load storage metrics
      const metrics = databaseOptimizationService.getStorageMetrics();
      setStorageMetrics(metrics);
      
      // Load batch jobs
      const jobs = databaseOptimizationService.getAllBatchJobs();
      setBatchJobs(jobs);
      
      // Load document indices
      const indices = databaseOptimizationService.getAllDocumentIndices();
      setDocumentIndices(indices);
      
      // Get optimization recommendations
      const recommendations = await databaseOptimizationService.optimizeStorageConfiguration(0.85);
      setOptimizationRecommendations(recommendations);
      
    } catch (error) {
      console.error('❌ Failed to load database optimization data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await databaseOptimizationService.searchDocuments(searchQuery, {
        caseId,
        limit: 20
      });
      setSearchResults(results);
    } catch (error) {
      console.error('❌ Search failed:', error);
      setSearchResults([]);
    }
  };

  const startBatchJob = async (type: string, documentIds: string[]) => {
    try {
      const jobId = await databaseOptimizationService.startBatchJob(type as any, documentIds);
      console.log(`✅ Started batch job: ${jobId}`);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error(`❌ Failed to start batch job:`, error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getJobStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'running': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (isLoading && !storageMetrics) {
    return (
      <div className="database-optimization-loading">
        <div className="loading-spinner"></div>
        <p>Loading database optimization dashboard...</p>
      </div>
    );
  }

  return (
    <div className="database-optimization-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h2>💾 Database Optimization Dashboard</h2>
          <div className="status-overview">
            <div className="status-item">
              <span className="status-label">Total Documents:</span>
              <span className="status-value">
                {storageMetrics?.totalDocuments?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Storage Used:</span>
              <span className="status-value">
                {formatBytes(storageMetrics?.totalSize || 0)}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Compression Ratio:</span>
              <span className="status-value">
                {storageMetrics?.compressionRatio?.toFixed(1) || '1.0'}x
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Storage Efficiency:</span>
              <span 
                className="status-value"
                style={{ 
                  color: storageMetrics?.storageEfficiency > 0.8 ? '#10b981' : 
                         storageMetrics?.storageEfficiency > 0.6 ? '#f59e0b' : '#ef4444'
                }}
              >
                {((storageMetrics?.storageEfficiency || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Active Jobs:</span>
              <span className="status-value">
                {batchJobs.filter(job => job.status === 'running').length}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button onClick={loadDashboardData} className="btn btn-primary">
            🔄 Refresh
          </button>
          <button 
            onClick={() => startBatchJob('indexing', documentIndices.map(d => d.documentId))}
            className="btn btn-secondary"
            disabled={documentIndices.length === 0}
          >
            📇 Reindex All
          </button>
          <button 
            onClick={() => startBatchJob('compression', documentIndices.map(d => d.documentId))}
            className="btn btn-secondary"
            disabled={documentIndices.length === 0}
          >
            🗜️ Compress All
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
          className={`dashboard-tab ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          💾 Storage
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => setActiveTab('batch')}
        >
          ⚙️ Batch Jobs
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          🚀 Optimization
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-panel">
            <h3>📊 Database Overview</h3>
            
            {/* Storage Summary Cards */}
            <div className="storage-cards">
              <div className="storage-card">
                <div className="card-header">
                  <h4>📁 Document Storage</h4>
                  <span className="card-icon">💾</span>
                </div>
                <div className="card-content">
                  <div className="metric-large">
                    {formatBytes(storageMetrics?.totalSize || 0)}
                  </div>
                  <div className="metric-details">
                    <div className="detail-row">
                      <span>Documents:</span>
                      <span>{storageMetrics?.totalDocuments?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="detail-row">
                      <span>Avg Size:</span>
                      <span>{formatBytes(storageMetrics?.avgDocumentSize || 0)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Largest:</span>
                      <span>{formatBytes(storageMetrics?.largestDocument || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="storage-card">
                <div className="card-header">
                  <h4>🗜️ Compression</h4>
                  <span className="card-icon">📦</span>
                </div>
                <div className="card-content">
                  <div className="metric-large">
                    {storageMetrics?.compressionRatio?.toFixed(1) || '1.0'}x
                  </div>
                  <div className="metric-details">
                    <div className="detail-row">
                      <span>Original:</span>
                      <span>{formatBytes(storageMetrics?.totalSize || 0)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Compressed:</span>
                      <span>{formatBytes(storageMetrics?.compressedSize || 0)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Saved:</span>
                      <span>
                        {formatBytes((storageMetrics?.totalSize || 0) - (storageMetrics?.compressedSize || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="storage-card">
                <div className="card-header">
                  <h4>⚡ Efficiency</h4>
                  <span className="card-icon">📈</span>
                </div>
                <div className="card-content">
                  <div 
                    className="metric-large"
                    style={{ 
                      color: storageMetrics?.storageEfficiency > 0.8 ? '#10b981' : 
                             storageMetrics?.storageEfficiency > 0.6 ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    {((storageMetrics?.storageEfficiency || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="metric-details">
                    <div className="detail-row">
                      <span>Redundancy:</span>
                      <span>{((storageMetrics?.redundantData || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="detail-row">
                      <span>Fragmentation:</span>
                      <span>{((storageMetrics?.fragmentationLevel || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="storage-card">
                <div className="card-header">
                  <h4>🔄 Processing</h4>
                  <span className="card-icon">⚙️</span>
                </div>
                <div className="card-content">
                  <div className="metric-large">
                    {batchJobs.filter(job => job.status === 'running').length}
                  </div>
                  <div className="metric-details">
                    <div className="detail-row">
                      <span>Running:</span>
                      <span>{batchJobs.filter(job => job.status === 'running').length}</span>
                    </div>
                    <div className="detail-row">
                      <span>Pending:</span>
                      <span>{batchJobs.filter(job => job.status === 'pending').length}</span>
                    </div>
                    <div className="detail-row">
                      <span>Completed:</span>
                      <span>{batchJobs.filter(job => job.status === 'completed').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chunk Distribution */}
            {storageMetrics?.chunkDistribution && (
              <div className="chunk-distribution">
                <h4>📊 Document Chunk Distribution</h4>
                <div className="distribution-chart">
                  {Object.entries(storageMetrics.chunkDistribution).map(([type, count]) => (
                    <div key={type} className="distribution-item">
                      <div className="distribution-label">{type}</div>
                      <div className="distribution-bar">
                        <div 
                          className="distribution-fill"
                          style={{ 
                            width: `${(Number(count) / Math.max(...Object.values(storageMetrics.chunkDistribution).map(v => Number(v)))) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="distribution-count">{String(count)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Documents */}
            <div className="recent-documents">
              <h4>📄 Recent Documents</h4>
              <div className="documents-list">
                {documentIndices.slice(0, 5).map(doc => (
                  <div key={doc.documentId} className="document-item">
                    <div className="document-info">
                      <div className="document-title">{doc.title}</div>
                      <div className="document-meta">
                        <span>Type: {doc.documentType}</span>
                        <span>Size: {formatBytes(doc.size)}</span>
                        <span>Chunks: {doc.chunkCount}</span>
                        <span 
                          className="document-priority"
                          style={{ color: getPriorityColor(doc.priority) }}
                        >
                          {doc.priority} priority
                        </span>
                      </div>
                    </div>
                    <div className="document-actions">
                      <button 
                        className="btn btn-small"
                        onClick={() => startBatchJob('indexing', [doc.documentId])}
                      >
                        📇 Reindex
                      </button>
                      <button 
                        className="btn btn-small"
                        onClick={() => startBatchJob('compression', [doc.documentId])}
                      >
                        🗜️ Compress
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="storage-panel">
            <h3>💾 Storage Management</h3>
            
            {/* Storage Metrics Details */}
            <div className="storage-metrics-detailed">
              <div className="metrics-section">
                <h4>📊 Storage Statistics</h4>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">Total Storage:</span>
                    <span className="metric-value">{formatBytes(storageMetrics?.totalSize || 0)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Compressed Size:</span>
                    <span className="metric-value">{formatBytes(storageMetrics?.compressedSize || 0)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Space Saved:</span>
                    <span className="metric-value">
                      {formatBytes((storageMetrics?.totalSize || 0) - (storageMetrics?.compressedSize || 0))}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Compression Ratio:</span>
                    <span className="metric-value">{storageMetrics?.compressionRatio?.toFixed(2) || '1.00'}x</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Storage Efficiency:</span>
                    <span 
                      className="metric-value"
                      style={{ 
                        color: storageMetrics?.storageEfficiency > 0.8 ? '#10b981' : 
                               storageMetrics?.storageEfficiency > 0.6 ? '#f59e0b' : '#ef4444'
                      }}
                    >
                      {((storageMetrics?.storageEfficiency || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Redundant Data:</span>
                    <span className="metric-value">{((storageMetrics?.redundantData || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Fragmentation:</span>
                    <span className="metric-value">{((storageMetrics?.fragmentationLevel || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Average Doc Size:</span>
                    <span className="metric-value">{formatBytes(storageMetrics?.avgDocumentSize || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Breakdown by Type */}
            <div className="document-breakdown">
              <h4>📋 Documents by Type</h4>
              <div className="breakdown-list">
                {Object.entries(
                  documentIndices.reduce((acc: Record<string, number>, doc) => {
                    acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([type, count]) => (
                  <div key={type} className="breakdown-item">
                    <div className="breakdown-info">
                      <span className="breakdown-type">{type}</span>
                      <span className="breakdown-count">{count} documents</span>
                    </div>
                    <div className="breakdown-actions">
                      <button 
                        className="btn btn-small"
                        onClick={() => startBatchJob('compression', 
                          documentIndices.filter(d => d.documentType === type).map(d => d.documentId)
                        )}
                      >
                        🗜️ Compress Type
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Actions */}
            <div className="storage-actions">
              <h4>🔧 Storage Actions</h4>
              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => startBatchJob('cleanup', documentIndices.map(d => d.documentId))}
                >
                  🧹 Cleanup Storage
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => startBatchJob('compression', documentIndices.map(d => d.documentId))}
                >
                  🗜️ Optimize Compression
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => startBatchJob('backup', documentIndices.map(d => d.documentId))}
                >
                  💾 Backup All
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="batch-panel">
            <h3>⚙️ Batch Job Management</h3>
            
            {/* Active Jobs */}
            <div className="active-jobs">
              <h4>🔄 Active Jobs</h4>
              {batchJobs.filter(job => job.status === 'running' || job.status === 'pending').length > 0 ? (
                <div className="jobs-list">
                  {batchJobs
                    .filter(job => job.status === 'running' || job.status === 'pending')
                    .map(job => (
                      <div key={job.id} className="job-item active">
                        <div className="job-header">
                          <div className="job-info">
                            <span className="job-type">{job.type}</span>
                            <span 
                              className="job-status"
                              style={{ color: getJobStatusColor(job.status) }}
                            >
                              {job.status}
                            </span>
                          </div>
                          <div className="job-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${job.progress}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{job.progress.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="job-details">
                          <span>Documents: {job.documentIds.length}</span>
                          <span>Started: {job.startTime ? new Date(job.startTime).toLocaleString() : 'Not started'}</span>
                          <span>Est. Duration: {formatDuration(job.estimatedDuration)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="no-active-jobs">
                  <p>No active batch jobs</p>
                </div>
              )}
            </div>

            {/* Job History */}
            <div className="job-history">
              <h4>📜 Job History</h4>
              <div className="jobs-table">
                <div className="table-header">
                  <div className="header-cell">Type</div>
                  <div className="header-cell">Status</div>
                  <div className="header-cell">Documents</div>
                  <div className="header-cell">Duration</div>
                  <div className="header-cell">Results</div>
                </div>
                {batchJobs.slice(0, 10).map(job => (
                  <div key={job.id} className="table-row">
                    <div className="table-cell">{job.type}</div>
                    <div 
                      className="table-cell"
                      style={{ color: getJobStatusColor(job.status) }}
                    >
                      {job.status}
                    </div>
                    <div className="table-cell">{job.documentIds.length}</div>
                    <div className="table-cell">
                      {job.startTime && job.endTime 
                        ? formatDuration((new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / 60000)
                        : 'N/A'
                      }
                    </div>
                    <div className="table-cell">
                      {job.resultStats 
                        ? `${job.resultStats.successful}/${job.resultStats.processed}`
                        : 'N/A'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="optimization-panel">
            <h3>🚀 Storage Optimization</h3>
            
            {/* Optimization Recommendations */}
            {optimizationRecommendations && (
              <div className="optimization-recommendations">
                <h4>💡 Optimization Recommendations</h4>
                <div className="recommendation-card">
                  <div className="recommendation-header">
                    <span className="current-efficiency">
                      Current Efficiency: {(optimizationRecommendations.currentEfficiency * 100).toFixed(1)}%
                    </span>
                    <span className="potential-improvement">
                      Potential Improvement: +{(optimizationRecommendations.estimatedImprovement * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="recommendations-list">
                    {optimizationRecommendations.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="recommendation-item">
                        <span className="recommendation-icon">💡</span>
                        <span className="recommendation-text">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Optimization Actions */}
            <div className="quick-optimization">
              <h4>⚡ Quick Optimization</h4>
              <div className="optimization-actions">
                <button 
                  className="optimization-action"
                  onClick={() => startBatchJob('compression', documentIndices.map(d => d.documentId))}
                >
                  <div className="action-icon">🗜️</div>
                  <div className="action-info">
                    <div className="action-title">Optimize Compression</div>
                    <div className="action-description">Recompress all documents with improved algorithms</div>
                  </div>
                </button>
                
                <button 
                  className="optimization-action"
                  onClick={() => startBatchJob('indexing', documentIndices.map(d => d.documentId))}
                >
                  <div className="action-icon">📇</div>
                  <div className="action-info">
                    <div className="action-title">Rebuild Indices</div>
                    <div className="action-description">Optimize search indices for better performance</div>
                  </div>
                </button>
                
                <button 
                  className="optimization-action"
                  onClick={() => startBatchJob('cleanup', documentIndices.map(d => d.documentId))}
                >
                  <div className="action-icon">🧹</div>
                  <div className="action-info">
                    <div className="action-title">Clean Redundant Data</div>
                    <div className="action-description">Remove duplicate chunks and optimize storage</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Configuration */}
            <div className="optimization-config">
              <h4>⚙️ Optimization Configuration</h4>
              <div className="config-info">
                <p>Current optimization settings are automatically managed based on document characteristics and usage patterns.</p>
                <p>Advanced configuration options are available for enterprise deployments.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="search-panel">
            <h3>🔍 Document Search</h3>
            
            {/* Search Interface */}
            <div className="search-interface">
              <div className="search-input-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search documents by keywords, entities, or content..."
                  className="search-input"
                />
                <button onClick={handleSearch} className="search-button">
                  🔍 Search
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="search-results">
              <h4>📄 Search Results ({searchResults.length})</h4>
              {searchResults.length > 0 ? (
                <div className="results-list">
                  {searchResults.map(doc => (
                    <div key={doc.documentId} className="result-item">
                      <div className="result-header">
                        <div className="result-title">{doc.title}</div>
                        <div className="result-meta">
                          <span>Type: {doc.documentType}</span>
                          <span>Size: {formatBytes(doc.size)}</span>
                          <span>Case: {doc.caseId}</span>
                        </div>
                      </div>
                      <div className="result-details">
                        <div className="result-keywords">
                          <strong>Keywords:</strong> {doc.keywords.slice(0, 5).join(', ')}
                        </div>
                        <div className="result-entities">
                          <strong>Entities:</strong> {doc.entities.slice(0, 3).join(', ')}
                        </div>
                      </div>
                      <div className="result-actions">
                        <button 
                          className="btn btn-small"
                          onClick={() => startBatchJob('indexing', [doc.documentId])}
                        >
                          📇 Reindex
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="no-results">
                  <p>No documents found matching your search query.</p>
                </div>
              ) : (
                <div className="search-help">
                  <p>Enter a search query to find documents by content, keywords, or entities.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};