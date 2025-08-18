import React, { useState, useEffect } from 'react';
import { advancedCacheSystem } from '../utils/advancedCacheSystem';
import { AIModelMigration } from '../utils/aiModelMigration';
import { intelligentModelRouter } from '../utils/intelligentModelRouter';
import { fileSystemManager } from '../utils/fileSystemManager';
import { caseFolderScanner } from '../utils/caseFolderScanner';
import { EnhancedProgressTracker } from '../utils/enhancedProgressTracker';
const enhancedProgressTracker = new EnhancedProgressTracker();
import { UniversalDocumentExtractor } from '../services/universalDocumentExtractor';
import { localAIService } from '../services/localAIService';
import { EnhancedSystemHealth } from './EnhancedSystemHealth';
import './BackendServicesStatus.css';

interface ServiceStatus {
  name: string;
  category: 'AI' | 'Document' | 'Storage' | 'Testing' | 'System';
  status: 'active' | 'inactive' | 'error' | 'unknown';
  description: string;
  lastCheck?: Date;
  error?: string;
  exposed: boolean; // Whether it's exposed in the UI
  location?: string; // Where it's exposed in the UI
}

export const BackendServicesStatus: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    checkAllServices();
  }, []);

  const checkAllServices = async () => {
    setIsRefreshing(true);
    
    const serviceChecks: ServiceStatus[] = [
      // AI Services
      {
        name: 'LocalAI Service',
        category: 'AI',
        status: 'unknown',
        description: 'OpenAI-compatible local AI service for model inference',
        exposed: true,
        location: 'System Health Dashboard, AI Settings'
      },
      {
        name: 'AI Model Migration',
        category: 'AI',
        status: 'unknown',
        description: 'Intelligent model selection and migration service',
        exposed: true,
        location: 'Model Selection UI'
      },
      {
        name: 'Intelligent Model Router',
        category: 'AI',
        status: 'unknown',
        description: 'Dynamic model routing based on task complexity',
        exposed: false,
        location: 'Not directly exposed'
      },
      {
        name: 'LNAT Model Tester',
        category: 'Testing',
        status: 'active',
        description: 'Law National Aptitude Test evaluation framework',
        exposed: true,
        location: 'LNAT Testing Dashboard'
      },
      {
        name: 'Watson-Glaser Tester',
        category: 'Testing',
        status: 'active',
        description: 'Critical thinking assessment for AI models',
        exposed: true,
        location: 'Comprehensive Testing Dashboard'
      },
      {
        name: 'Legal Bench Evaluator',
        category: 'Testing',
        status: 'active',
        description: 'Legal reasoning benchmark evaluation',
        exposed: true,
        location: 'Model Selection UI'
      },
      
      // Document Services
      {
        name: 'Universal Document Extractor',
        category: 'Document',
        status: 'unknown',
        description: 'Multi-format document processing and extraction',
        exposed: true,
        location: 'Document Manager, Universal Document Viewer'
      },
      {
        name: 'Enhanced PDF Extractor',
        category: 'Document',
        status: 'unknown',
        description: 'Advanced PDF text and table extraction',
        exposed: true,
        location: 'Document processing workflows'
      },
      {
        name: 'Case Folder Scanner',
        category: 'Document',
        status: 'unknown',
        description: 'Automated case folder organization and scanning',
        exposed: false,
        location: 'Not directly exposed'
      },
      
      // Storage Services  
      {
        name: 'Advanced Cache System',
        category: 'Storage',
        status: 'unknown',
        description: 'Multi-tier caching with intelligent invalidation',
        exposed: true,
        location: 'System Health Dashboard'
      },
      {
        name: 'File System Manager',
        category: 'Storage',
        status: 'unknown',
        description: 'Enhanced file system operations and management',
        exposed: true,
        location: 'System Health Dashboard'
      },
      {
        name: 'Enhanced Progress Tracker',
        category: 'System',
        status: 'unknown',
        description: 'Real-time progress tracking for long operations',
        exposed: false,
        location: 'Not directly exposed'
      },
      
      // System Services
      {
        name: 'Docker Manager',
        category: 'System',
        status: 'unknown',
        description: 'Docker container lifecycle management',
        exposed: true,
        location: 'System Health Dashboard'
      }
    ];

    // Check each service
    for (const service of serviceChecks) {
      try {
        switch (service.name) {
          case 'LocalAI Service':
            const localAIStatus = localAIService.getStatus();
            service.status = localAIStatus.connected ? 'active' : 'inactive';
            service.lastCheck = new Date();
            if (!localAIStatus.connected && localAIStatus.error) {
              service.error = localAIStatus.error;
            }
            break;

          case 'Advanced Cache System':
            try {
              const cacheStats = await advancedCacheSystem.getStats();
              service.status = 'active';
              service.lastCheck = new Date();
            } catch (error: any) {
              service.status = 'error';
              service.error = error.message;
            }
            break;

          case 'AI Model Migration':
            try {
              const bestModel = await AIModelMigration.getBestModel();
              service.status = bestModel ? 'active' : 'inactive';
              service.lastCheck = new Date();
            } catch (error: any) {
              service.status = 'error';
              service.error = error.message;
            }
            break;

          case 'Intelligent Model Router':
            try {
              // Test if the router can be initialized
              const hasModels = (intelligentModelRouter as any).getAvailableModels?.().length > 0;
              service.status = hasModels ? 'active' : 'inactive';
              service.lastCheck = new Date();
            } catch (error: any) {
              service.status = 'error';
              service.error = error.message;
            }
            break;

          case 'File System Manager':
            try {
              const supported = fileSystemManager.isSupported();
              service.status = supported ? 'active' : 'inactive';
              service.lastCheck = new Date();
              if (!supported) {
                service.error = 'File System Access API not supported in this browser';
              }
            } catch (error: any) {
              service.status = 'error';
              service.error = error.message;
            }
            break;

          case 'Case Folder Scanner':
            try {
              const scannerStatus = await (caseFolderScanner as any).getStatus?.() || { isActive: false };
              service.status = scannerStatus.isActive ? 'active' : 'inactive';
              service.lastCheck = new Date();
            } catch (error: any) {
              service.status = 'error';
              service.error = error.message;
            }
            break;

          case 'Enhanced Progress Tracker':
            try {
              const activeJobs = (enhancedProgressTracker as any).getActiveJobs?.() || [];
              service.status = 'active'; // Service is available
              service.lastCheck = new Date();
            } catch (error: any) {
              service.status = 'error';
              service.error = error.message;
            }
            break;

          case 'Universal Document Extractor':
            try {
              const formats = UniversalDocumentExtractor.getSupportedFormats();
              service.status = formats.length > 0 ? 'active' : 'inactive';
              service.lastCheck = new Date();
            } catch (error: any) {
              service.status = 'error';
              service.error = error.message;
            }
            break;

          case 'Docker Manager':
            try {
              if ((window as any).electronAPI?.docker) {
                const dockerStatus = await (window as any).electronAPI.docker.checkRequirements();
                service.status = dockerStatus.hasDocker ? 'active' : 'inactive';
                service.lastCheck = new Date();
                if (!dockerStatus.hasDocker) {
                  service.error = 'Docker not installed or not running';
                }
              } else {
                service.status = 'inactive';
                service.error = 'Docker API not available';
              }
            } catch (error: any) {
              service.status = 'error';
              service.error = error.message;
            }
            break;

          default:
            // For testing services and others that are always available
            if (service.category === 'Testing') {
              service.status = 'active';
              service.lastCheck = new Date();
            } else {
              service.status = 'unknown';
            }
        }
      } catch (error: any) {
        service.status = 'error';
        service.error = error.message;
        service.lastCheck = new Date();
      }
    }

    setServices(serviceChecks);
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'inactive': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI': return '🤖';
      case 'Document': return '📄';
      case 'Storage': return '💾';
      case 'Testing': return '🧪';
      case 'System': return '⚙️';
      default: return '📋';
    }
  };

  const filteredServices = filter === 'all' 
    ? services 
    : services.filter(s => s.category.toLowerCase() === filter.toLowerCase());

  const categories = ['all', 'AI', 'Document', 'Storage', 'Testing', 'System'];

  const notExposedServices = services.filter(s => !s.exposed);
  const exposedServices = services.filter(s => s.exposed);

  return (
    <div className="backend-services-status">
      <div className="status-header">
        <h3>Backend Services Status</h3>
        <button 
          className="refresh-btn"
          onClick={checkAllServices}
          disabled={isRefreshing}
        >
          {isRefreshing ? '🔄 Checking...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="status-summary">
        <div className="summary-card">
          <span className="summary-label">Total Services:</span>
          <span className="summary-value">{services.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">🟢 Active:</span>
          <span className="summary-value">{services.filter(s => s.status === 'active').length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">🟡 Inactive:</span>
          <span className="summary-value">{services.filter(s => s.status === 'inactive').length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">🔴 Error:</span>
          <span className="summary-value">{services.filter(s => s.status === 'error').length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">UI Exposed:</span>
          <span className="summary-value">{exposedServices.length}</span>
        </div>
      </div>

      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category}
            className={`filter-btn ${filter === category ? 'active' : ''}`}
            onClick={() => setFilter(category)}
          >
            {category === 'all' ? '📋 All' : `${getCategoryIcon(category)} ${category}`}
          </button>
        ))}
      </div>

      <div className="services-grid">
        {filteredServices.map((service, index) => (
          <div key={index} className={`service-card ${service.status}`}>
            <div className="service-header">
              <div className="service-title">
                <span className="service-icon">{getCategoryIcon(service.category)}</span>
                <span className="service-name">{service.name}</span>
                <span className="status-icon">{getStatusIcon(service.status)}</span>
              </div>
              <div className="service-category">{service.category}</div>
            </div>
            
            <div className="service-description">
              {service.description}
            </div>

            <div className="service-details">
              <div className="detail-row">
                <span>Status:</span>
                <span style={{ color: getStatusColor(service.status) }}>
                  {service.status.toUpperCase()}
                </span>
              </div>
              <div className="detail-row">
                <span>UI Exposure:</span>
                <span className={service.exposed ? 'exposed' : 'not-exposed'}>
                  {service.exposed ? '✅ Exposed' : '❌ Not Exposed'}
                </span>
              </div>
              {service.location && (
                <div className="detail-row">
                  <span>Location:</span>
                  <span className="location">{service.location}</span>
                </div>
              )}
              {service.lastCheck && (
                <div className="detail-row">
                  <span>Last Check:</span>
                  <span className="timestamp">{service.lastCheck.toLocaleTimeString()}</span>
                </div>
              )}
              {service.error && (
                <div className="error-message">
                  <span>⚠️ {service.error}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {notExposedServices.length > 0 && (
        <div className="recommendations">
          <h4>🔧 Services Not Exposed in UI</h4>
          <div className="recommendation-list">
            {notExposedServices.map((service, index) => (
              <div key={index} className="recommendation-item">
                <span className="rec-service">{getCategoryIcon(service.category)} {service.name}</span>
                <span className="rec-description">{service.description}</span>
                <span className="rec-status">Status: {getStatusIcon(service.status)} {service.status}</span>
              </div>
            ))}
          </div>
          <p className="recommendation-note">
            💡 Consider adding UI components for these services to provide users with full access to backend capabilities.
          </p>
        </div>
      )}

      {/* Enhanced System Health Dashboard */}
      <div className="enhanced-health-section">
        <EnhancedSystemHealth />
      </div>
    </div>
  );
};

export default BackendServicesStatus;