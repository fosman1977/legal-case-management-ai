import React, { useState, useEffect } from 'react';
import { UnifiedAIClient } from '../utils/unifiedAIClient';
import { advancedCacheSystem } from '../utils/advancedCacheSystem';
import { AIModelMigration } from '../utils/aiModelMigration';
import './SystemHealthDashboard.css';

interface SystemHealth {
  docker: {
    installed: boolean;
    running: boolean;
    version?: string;
  };
  localAI: {
    available: boolean;
    endpoint?: string;
    model?: string;
    responseTime?: number;
  };
  cache: {
    size: number;
    entries: number;
    hitRate: number;
  };
  fileSystem: {
    supported: boolean;
    connectedFolders: number;
  };
}

export const SystemHealthDashboard: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth>({
    docker: { installed: false, running: false },
    localAI: { available: false },
    cache: { size: 0, entries: 0, hitRate: 0 },
    fileSystem: { supported: false, connectedFolders: 0 }
  });
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkSystemHealth = async () => {
    setIsChecking(true);
    try {
      const newHealth: SystemHealth = {
        docker: { installed: false, running: false },
        localAI: { available: false },
        cache: { size: 0, entries: 0, hitRate: 0 },
        fileSystem: { supported: false, connectedFolders: 0 }
      };

      // Check Docker status via Electron IPC
      if ((window as any).electronAPI?.docker) {
        try {
          const dockerStatus = await (window as any).electronAPI.docker.checkRequirements();
          newHealth.docker = {
            installed: dockerStatus.hasDocker || false,
            running: dockerStatus.dockerRunning || false,
            version: dockerStatus.dockerVersion
          };
        } catch (error) {
          console.error('Failed to check Docker status:', error);
        }
      }

      // Check LocalAI availability
      const aiClient = new UnifiedAIClient();
      const startTime = Date.now();
      const isAvailable = await aiClient.isAvailable();
      
      if (isAvailable) {
        const responseTime = Date.now() - startTime;
        const bestModel = await AIModelMigration.getBestModel();
        const endpoint = localStorage.getItem('localai_endpoint') || 'http://localhost:8080';
        
        newHealth.localAI = {
          available: true,
          endpoint,
          model: bestModel,
          responseTime
        };
      }

      // Check cache status
      const cacheStats = await advancedCacheSystem.getStats();
      newHealth.cache = {
        size: cacheStats.totalSize,
        entries: cacheStats.totalEntries,
        hitRate: cacheStats.hitRate
      };

      // Check File System API support
      newHealth.fileSystem = {
        supported: 'showDirectoryPicker' in window,
        connectedFolders: Object.keys(JSON.parse(localStorage.getItem('file_system_config') || '{}').caseFolders || {}).length
      };

      setHealth(newHealth);
      setLastCheck(new Date());
    } catch (error) {
      console.error('System health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStatusColor = (status: boolean): string => {
    return status ? 'status-green' : 'status-red';
  };

  const getStatusIcon = (status: boolean): string => {
    return status ? '✓' : '✗';
  };

  return (
    <div className="system-health-dashboard">
      <div className="health-header">
        <h3>System Health</h3>
        <button 
          className="btn btn-sm btn-secondary" 
          onClick={checkSystemHealth}
          disabled={isChecking}
        >
          {isChecking ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {lastCheck && (
        <div className="last-check">
          Last checked: {lastCheck.toLocaleTimeString()}
        </div>
      )}

      <div className="health-grid">
        {/* Docker Status */}
        <div className="health-card">
          <div className="health-card-header">
            <span className="health-icon">🐳</span>
            <h4>Docker</h4>
          </div>
          <div className="health-card-body">
            <div className="health-item">
              <span>Installed:</span>
              <span className={getStatusColor(health.docker.installed)}>
                {getStatusIcon(health.docker.installed)}
              </span>
            </div>
            <div className="health-item">
              <span>Running:</span>
              <span className={getStatusColor(health.docker.running)}>
                {getStatusIcon(health.docker.running)}
              </span>
            </div>
            {health.docker.version && (
              <div className="health-item">
                <span>Version:</span>
                <span className="health-value">{health.docker.version}</span>
              </div>
            )}
          </div>
        </div>

        {/* LocalAI Status */}
        <div className="health-card">
          <div className="health-card-header">
            <span className="health-icon">🤖</span>
            <h4>LocalAI</h4>
          </div>
          <div className="health-card-body">
            <div className="health-item">
              <span>Available:</span>
              <span className={getStatusColor(health.localAI.available)}>
                {getStatusIcon(health.localAI.available)}
              </span>
            </div>
            {health.localAI.available && (
              <>
                <div className="health-item">
                  <span>Model:</span>
                  <span className="health-value">{health.localAI.model}</span>
                </div>
                <div className="health-item">
                  <span>Response:</span>
                  <span className="health-value">{health.localAI.responseTime}ms</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cache Status */}
        <div className="health-card">
          <div className="health-card-header">
            <span className="health-icon">💾</span>
            <h4>Cache</h4>
          </div>
          <div className="health-card-body">
            <div className="health-item">
              <span>Size:</span>
              <span className="health-value">{formatBytes(health.cache.size)}</span>
            </div>
            <div className="health-item">
              <span>Entries:</span>
              <span className="health-value">{health.cache.entries}</span>
            </div>
            <div className="health-item">
              <span>Hit Rate:</span>
              <span className="health-value">{(health.cache.hitRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* File System Status */}
        <div className="health-card">
          <div className="health-card-header">
            <span className="health-icon">📁</span>
            <h4>File System</h4>
          </div>
          <div className="health-card-body">
            <div className="health-item">
              <span>API Support:</span>
              <span className={getStatusColor(health.fileSystem.supported)}>
                {getStatusIcon(health.fileSystem.supported)}
              </span>
            </div>
            <div className="health-item">
              <span>Connected:</span>
              <span className="health-value">{health.fileSystem.connectedFolders} folders</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};