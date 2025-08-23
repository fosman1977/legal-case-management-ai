/**
 * Performance Optimization Dashboard
 * Comprehensive system performance monitoring, optimization, and scaling management
 */

import React, { useState, useEffect } from 'react';

interface SystemMetrics {
  id: string;
  category: 'cpu' | 'memory' | 'network' | 'storage' | 'database' | 'api' | 'ui';
  name: string;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
}

interface PerformanceOptimization {
  id: string;
  component: string;
  type: 'caching' | 'lazy_loading' | 'code_splitting' | 'compression' | 'indexing' | 'query_optimization';
  title: string;
  description: string;
  currentPerformance: {
    loadTime: number; // milliseconds
    memoryUsage: number; // MB
    cpuUsage: number; // percentage
    networkRequests: number;
  };
  optimizedPerformance: {
    loadTime: number;
    memoryUsage: number;
    cpuUsage: number;
    networkRequests: number;
  };
  improvement: {
    loadTimeReduction: number; // percentage
    memoryReduction: number;
    cpuReduction: number;
    networkReduction: number;
  };
  implementation: {
    complexity: 'low' | 'medium' | 'high';
    estimatedHours: number;
    dependencies: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'identified' | 'planned' | 'implementing' | 'testing' | 'deployed';
}

interface CacheStrategy {
  id: string;
  name: string;
  type: 'browser' | 'memory' | 'redis' | 'cdn' | 'application';
  scope: 'component' | 'api' | 'static' | 'dynamic' | 'global';
  ttl: number; // seconds
  maxSize: number; // MB
  hitRate: number; // percentage
  missRate: number; // percentage
  evictionPolicy: 'lru' | 'fifo' | 'ttl' | 'manual';
  performance: {
    averageResponseTime: number; // milliseconds
    bandwidthSaved: number; // MB/day
    cpuReduction: number; // percentage
  };
  configuration: {
    enabled: boolean;
    autoRefresh: boolean;
    compression: boolean;
    encryption: boolean;
  };
}

interface ScalabilityMetrics {
  id: string;
  component: string;
  current: {
    users: number;
    requests: number; // per minute
    dataSize: number; // MB
    responseTime: number; // milliseconds
  };
  capacity: {
    maxUsers: number;
    maxRequests: number;
    maxDataSize: number;
    maxResponseTime: number;
  };
  utilization: number; // percentage
  scalingTriggers: {
    metric: string;
    threshold: number;
    action: string;
  }[];
  bottlenecks: {
    component: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: string;
    solution: string;
  }[];
}

interface CodeQualityMetrics {
  id: string;
  category: 'complexity' | 'maintainability' | 'reliability' | 'security' | 'performance';
  name: string;
  value: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  threshold: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  issues: {
    critical: number;
    major: number;
    minor: number;
    info: number;
  };
  trends: {
    direction: 'improving' | 'stable' | 'degrading';
    rate: number; // change per week
  };
}

interface MonitoringAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'performance' | 'security' | 'availability' | 'data' | 'user_experience';
  title: string;
  description: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  actions: string[];
  affectedComponents: string[];
}

interface PerformanceOptimizationDashboardProps {
  onOptimizationApplied?: (optimization: PerformanceOptimization) => void;
  onCacheConfigured?: (cache: CacheStrategy) => void;
  onAlertResolved?: (alert: MonitoringAlert) => void;
}

export const PerformanceOptimizationDashboard: React.FC<PerformanceOptimizationDashboardProps> = ({
  onOptimizationApplied,
  onCacheConfigured,
  onAlertResolved
}) => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [optimizations, setOptimizations] = useState<PerformanceOptimization[]>([]);
  const [cacheStrategies, setCacheStrategies] = useState<CacheStrategy[]>([]);
  const [scalabilityMetrics, setScalabilityMetrics] = useState<ScalabilityMetrics[]>([]);
  const [codeQuality, setCodeQuality] = useState<CodeQualityMetrics[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'caching' | 'scalability' | 'quality' | 'monitoring'>('overview');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    initializeOptimizationDashboard();
    startMonitoring();
    
    return () => stopMonitoring();
  }, []);

  const initializeOptimizationDashboard = async (): Promise<void> => {
    try {
      const metrics = generateSystemMetrics();
      const optimizationData = generateOptimizations();
      const cacheData = generateCacheStrategies();
      const scalabilityData = generateScalabilityMetrics();
      const qualityData = generateCodeQualityMetrics();
      const alertData = generateMonitoringAlerts();
      
      setSystemMetrics(metrics);
      setOptimizations(optimizationData);
      setCacheStrategies(cacheData);
      setScalabilityMetrics(scalabilityData);
      setCodeQuality(qualityData);
      setAlerts(alertData);
      
    } catch (error) {
      console.error('Performance dashboard initialization failed:', error);
    }
  };

  const startMonitoring = (): void => {
    setIsMonitoring(true);
    // In real implementation, this would start real-time monitoring
  };

  const stopMonitoring = (): void => {
    setIsMonitoring(false);
    // In real implementation, this would stop monitoring
  };

  const generateSystemMetrics = (): SystemMetrics[] => {
    return [
      {
        id: 'metric_cpu_usage',
        category: 'cpu',
        name: 'CPU Usage',
        value: 34,
        unit: '%',
        threshold: { warning: 70, critical: 90 },
        trend: { direction: 'stable', percentage: 2, period: 'last hour' },
        status: 'healthy',
        lastUpdated: new Date()
      },
      {
        id: 'metric_memory_usage',
        category: 'memory',
        name: 'Memory Usage',
        value: 68,
        unit: '%',
        threshold: { warning: 80, critical: 95 },
        trend: { direction: 'up', percentage: 5, period: 'last hour' },
        status: 'warning',
        lastUpdated: new Date()
      },
      {
        id: 'metric_api_response_time',
        category: 'api',
        name: 'API Response Time',
        value: 245,
        unit: 'ms',
        threshold: { warning: 500, critical: 1000 },
        trend: { direction: 'down', percentage: 8, period: 'last hour' },
        status: 'healthy',
        lastUpdated: new Date()
      },
      {
        id: 'metric_database_queries',
        category: 'database',
        name: 'Database Query Time',
        value: 89,
        unit: 'ms',
        threshold: { warning: 200, critical: 500 },
        trend: { direction: 'stable', percentage: 1, period: 'last hour' },
        status: 'healthy',
        lastUpdated: new Date()
      },
      {
        id: 'metric_ui_load_time',
        category: 'ui',
        name: 'UI Load Time',
        value: 1.8,
        unit: 's',
        threshold: { warning: 3, critical: 5 },
        trend: { direction: 'down', percentage: 12, period: 'last hour' },
        status: 'healthy',
        lastUpdated: new Date()
      },
      {
        id: 'metric_network_throughput',
        category: 'network',
        name: 'Network Throughput',
        value: 89,
        unit: 'Mbps',
        threshold: { warning: 50, critical: 20 },
        trend: { direction: 'up', percentage: 15, period: 'last hour' },
        status: 'healthy',
        lastUpdated: new Date()
      }
    ];
  };

  const generateOptimizations = (): PerformanceOptimization[] => {
    return [
      {
        id: 'opt_component_lazy_loading',
        component: 'Legal Practice Modules',
        type: 'lazy_loading',
        title: 'Implement Lazy Loading for Practice Area Modules',
        description: 'Load Criminal, Civil, and POCA modules only when accessed to reduce initial bundle size and improve startup performance.',
        currentPerformance: {
          loadTime: 3200,
          memoryUsage: 45,
          cpuUsage: 15,
          networkRequests: 12
        },
        optimizedPerformance: {
          loadTime: 1200,
          memoryUsage: 18,
          cpuUsage: 8,
          networkRequests: 4
        },
        improvement: {
          loadTimeReduction: 62,
          memoryReduction: 60,
          cpuReduction: 47,
          networkReduction: 67
        },
        implementation: {
          complexity: 'medium',
          estimatedHours: 16,
          dependencies: ['React.lazy', 'Suspense boundaries', 'Route splitting'],
          riskLevel: 'low'
        },
        priority: 'high',
        status: 'identified'
      },
      {
        id: 'opt_knowledge_graph_caching',
        component: 'Legal Knowledge Graph',
        type: 'caching',
        title: 'Implement Intelligent Caching for Knowledge Graph Data',
        description: 'Cache frequently accessed graph nodes and relationships with intelligent invalidation to reduce database queries and improve visualization performance.',
        currentPerformance: {
          loadTime: 2800,
          memoryUsage: 32,
          cpuUsage: 22,
          networkRequests: 18
        },
        optimizedPerformance: {
          loadTime: 450,
          memoryUsage: 28,
          cpuUsage: 8,
          networkRequests: 3
        },
        improvement: {
          loadTimeReduction: 84,
          memoryReduction: 12,
          cpuReduction: 64,
          networkReduction: 83
        },
        implementation: {
          complexity: 'high',
          estimatedHours: 24,
          dependencies: ['Redis cache', 'Graph query optimization', 'Cache invalidation logic'],
          riskLevel: 'medium'
        },
        priority: 'critical',
        status: 'planned'
      },
      {
        id: 'opt_document_compression',
        component: 'Document Intelligence',
        type: 'compression',
        title: 'Implement Document Content Compression',
        description: 'Compress document content using advanced algorithms to reduce storage requirements and improve transfer speeds.',
        currentPerformance: {
          loadTime: 1500,
          memoryUsage: 120,
          cpuUsage: 12,
          networkRequests: 8
        },
        optimizedPerformance: {
          loadTime: 650,
          memoryUsage: 48,
          cpuUsage: 18,
          networkRequests: 8
        },
        improvement: {
          loadTimeReduction: 57,
          memoryReduction: 60,
          cpuReduction: -50, // Slight increase due to decompression
          networkReduction: 0
        },
        implementation: {
          complexity: 'low',
          estimatedHours: 8,
          dependencies: ['Compression library', 'Client-side decompression'],
          riskLevel: 'low'
        },
        priority: 'medium',
        status: 'implementing'
      },
      {
        id: 'opt_predictive_prefetching',
        component: 'Predictive Analytics',
        type: 'caching',
        title: 'Predictive Data Prefetching',
        description: 'Use ML to predict user actions and prefetch likely needed data to improve perceived performance and user experience.',
        currentPerformance: {
          loadTime: 2100,
          memoryUsage: 38,
          cpuUsage: 16,
          networkRequests: 15
        },
        optimizedPerformance: {
          loadTime: 300,
          memoryUsage: 42,
          cpuUsage: 20,
          networkRequests: 8
        },
        improvement: {
          loadTimeReduction: 86,
          memoryReduction: -11, // Slight increase due to prefetched data
          cpuReduction: -25, // Increase due to prediction algorithms
          networkReduction: 47
        },
        implementation: {
          complexity: 'high',
          estimatedHours: 32,
          dependencies: ['User behavior analytics', 'Prediction models', 'Background prefetching'],
          riskLevel: 'high'
        },
        priority: 'medium',
        status: 'identified'
      }
    ];
  };

  const generateCacheStrategies = (): CacheStrategy[] => {
    return [
      {
        id: 'cache_api_responses',
        name: 'API Response Cache',
        type: 'memory',
        scope: 'api',
        ttl: 300,
        maxSize: 50,
        hitRate: 78,
        missRate: 22,
        evictionPolicy: 'lru',
        performance: {
          averageResponseTime: 45,
          bandwidthSaved: 2400,
          cpuReduction: 25
        },
        configuration: {
          enabled: true,
          autoRefresh: true,
          compression: true,
          encryption: false
        }
      },
      {
        id: 'cache_static_assets',
        name: 'Static Assets Cache',
        type: 'browser',
        scope: 'static',
        ttl: 86400,
        maxSize: 100,
        hitRate: 92,
        missRate: 8,
        evictionPolicy: 'ttl',
        performance: {
          averageResponseTime: 15,
          bandwidthSaved: 8600,
          cpuReduction: 5
        },
        configuration: {
          enabled: true,
          autoRefresh: false,
          compression: true,
          encryption: false
        }
      },
      {
        id: 'cache_component_state',
        name: 'Component State Cache',
        type: 'memory',
        scope: 'component',
        ttl: 600,
        maxSize: 25,
        hitRate: 85,
        missRate: 15,
        evictionPolicy: 'lru',
        performance: {
          averageResponseTime: 8,
          bandwidthSaved: 1200,
          cpuReduction: 18
        },
        configuration: {
          enabled: true,
          autoRefresh: true,
          compression: false,
          encryption: false
        }
      },
      {
        id: 'cache_ml_models',
        name: 'ML Model Cache',
        type: 'application',
        scope: 'global',
        ttl: 3600,
        maxSize: 200,
        hitRate: 96,
        missRate: 4,
        evictionPolicy: 'manual',
        performance: {
          averageResponseTime: 120,
          bandwidthSaved: 15000,
          cpuReduction: 45
        },
        configuration: {
          enabled: true,
          autoRefresh: false,
          compression: true,
          encryption: true
        }
      }
    ];
  };

  const generateScalabilityMetrics = (): ScalabilityMetrics[] => {
    return [
      {
        id: 'scale_concurrent_users',
        component: 'User Sessions',
        current: {
          users: 25,
          requests: 450,
          dataSize: 128,
          responseTime: 245
        },
        capacity: {
          maxUsers: 100,
          maxRequests: 2000,
          maxDataSize: 500,
          maxResponseTime: 1000
        },
        utilization: 25,
        scalingTriggers: [
          { metric: 'concurrent_users', threshold: 80, action: 'Scale up application instances' },
          { metric: 'response_time', threshold: 800, action: 'Add load balancer' },
          { metric: 'memory_usage', threshold: 85, action: 'Increase memory allocation' }
        ],
        bottlenecks: [
          {
            component: 'Database queries',
            severity: 'medium',
            impact: 'Increased response time under load',
            solution: 'Implement query optimization and connection pooling'
          },
          {
            component: 'ML model inference',
            severity: 'high',
            impact: 'CPU spikes during prediction generation',
            solution: 'Implement model caching and async processing'
          }
        ]
      },
      {
        id: 'scale_data_storage',
        component: 'Data Storage',
        current: {
          users: 25,
          requests: 120,
          dataSize: 2400,
          responseTime: 89
        },
        capacity: {
          maxUsers: 500,
          maxRequests: 5000,
          maxDataSize: 50000,
          maxResponseTime: 200
        },
        utilization: 5,
        scalingTriggers: [
          { metric: 'storage_size', threshold: 80, action: 'Archive old data' },
          { metric: 'query_time', threshold: 150, action: 'Add database indexes' },
          { metric: 'backup_time', threshold: 300, action: 'Implement incremental backups' }
        ],
        bottlenecks: [
          {
            component: 'Document indexing',
            severity: 'low',
            impact: 'Slower search performance with large document sets',
            solution: 'Implement distributed indexing and search optimization'
          }
        ]
      }
    ];
  };

  const generateCodeQualityMetrics = (): CodeQualityMetrics[] => {
    return [
      {
        id: 'quality_complexity',
        category: 'complexity',
        name: 'Cyclomatic Complexity',
        value: 8.2,
        grade: 'B',
        threshold: { excellent: 5, good: 10, acceptable: 15, poor: 20 },
        issues: { critical: 0, major: 3, minor: 8, info: 15 },
        trends: { direction: 'improving', rate: -0.5 }
      },
      {
        id: 'quality_maintainability',
        category: 'maintainability',
        name: 'Maintainability Index',
        value: 78,
        grade: 'B',
        threshold: { excellent: 85, good: 70, acceptable: 50, poor: 25 },
        issues: { critical: 0, major: 2, minor: 12, info: 22 },
        trends: { direction: 'stable', rate: 0.2 }
      },
      {
        id: 'quality_reliability',
        category: 'reliability',
        name: 'Reliability Rating',
        value: 92,
        grade: 'A',
        threshold: { excellent: 90, good: 80, acceptable: 70, poor: 60 },
        issues: { critical: 0, major: 1, minor: 4, info: 8 },
        trends: { direction: 'improving', rate: 1.2 }
      },
      {
        id: 'quality_security',
        category: 'security',
        name: 'Security Hotspots',
        value: 5,
        grade: 'A',
        threshold: { excellent: 2, good: 5, acceptable: 10, poor: 20 },
        issues: { critical: 0, major: 0, minor: 2, info: 3 },
        trends: { direction: 'improving', rate: -0.8 }
      },
      {
        id: 'quality_performance',
        category: 'performance',
        name: 'Performance Score',
        value: 85,
        grade: 'A',
        threshold: { excellent: 90, good: 80, acceptable: 70, poor: 60 },
        issues: { critical: 0, major: 1, minor: 6, info: 12 },
        trends: { direction: 'improving', rate: 2.1 }
      }
    ];
  };

  const generateMonitoringAlerts = (): MonitoringAlert[] => {
    return [
      {
        id: 'alert_memory_usage',
        severity: 'warning',
        category: 'performance',
        title: 'Memory Usage Above Threshold',
        description: 'Application memory usage has exceeded 80% for the past 10 minutes',
        metric: 'memory_usage',
        value: 82,
        threshold: 80,
        timestamp: new Date(Date.now() - 10 * 60000),
        status: 'active',
        actions: [
          'Monitor memory patterns',
          'Check for memory leaks',
          'Consider garbage collection optimization',
          'Review component lifecycle management'
        ],
        affectedComponents: ['Predictive Analytics', 'Knowledge Graph', 'Document Viewer']
      },
      {
        id: 'alert_api_errors',
        severity: 'error',
        category: 'availability',
        title: 'Increased API Error Rate',
        description: 'API error rate has increased to 5.2% over the last 15 minutes',
        metric: 'api_error_rate',
        value: 5.2,
        threshold: 2.0,
        timestamp: new Date(Date.now() - 15 * 60000),
        status: 'acknowledged',
        actions: [
          'Investigate API endpoints',
          'Check database connectivity',
          'Review error logs',
          'Implement circuit breaker if needed'
        ],
        affectedComponents: ['Case Management API', 'Document API', 'Prediction API']
      },
      {
        id: 'alert_slow_queries',
        severity: 'warning',
        category: 'performance',
        title: 'Database Query Performance Degradation',
        description: 'Average database query time has increased by 40% in the last hour',
        metric: 'db_query_time',
        value: 156,
        threshold: 100,
        timestamp: new Date(Date.now() - 60 * 60000),
        status: 'resolved',
        actions: [
          'Analyze slow query logs',
          'Check index usage',
          'Review query execution plans',
          'Consider query optimization'
        ],
        affectedComponents: ['Case Search', 'Document Indexing', 'Analytics Queries']
      }
    ];
  };

  const renderOverview = (): JSX.Element => (
    <div className="overview-panel">
      <h3>📊 Performance Overview</h3>
      
      <div className="system-health">
        <div className="health-status">
          <div className="health-indicator healthy">
            <span className="status-dot"></span>
            <span>System Healthy</span>
          </div>
          <div className="health-metrics">
            <span>Uptime: 99.8%</span>
            <span>Response Time: 245ms</span>
            <span>Throughput: 450 req/min</span>
          </div>
        </div>
      </div>
      
      <div className="metrics-grid">
        {systemMetrics.map(metric => (
          <div key={metric.id} className={`metric-card ${metric.category} ${metric.status}`}>
            <div className="metric-header">
              <h4>{metric.name}</h4>
              <span className={`status-indicator ${metric.status}`}>
                {metric.status === 'healthy' ? '✅' : 
                 metric.status === 'warning' ? '⚠️' : '🚨'}
              </span>
            </div>
            
            <div className="metric-value">
              <span className="value">{metric.value}</span>
              <span className="unit">{metric.unit}</span>
            </div>
            
            <div className="metric-thresholds">
              <div className="threshold-bar">
                <div 
                  className="current-value"
                  style={{ left: `${(metric.value / (metric.threshold.critical * 1.2)) * 100}%` }}
                />
                <div 
                  className="warning-threshold"
                  style={{ left: `${(metric.threshold.warning / (metric.threshold.critical * 1.2)) * 100}%` }}
                />
                <div 
                  className="critical-threshold"
                  style={{ left: `${(metric.threshold.critical / (metric.threshold.critical * 1.2)) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="metric-trend">
              <span className={`trend-direction ${metric.trend.direction}`}>
                {metric.trend.direction === 'up' ? '↗️' : 
                 metric.trend.direction === 'down' ? '↘️' : '➡️'}
              </span>
              <span className="trend-text">
                {metric.trend.percentage}% {metric.trend.period}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="performance-insights">
        <h4>🚀 Performance Insights</h4>
        <div className="insights-list">
          <div className="insight-item critical">
            <h5>Critical Optimization Available</h5>
            <p>Knowledge Graph caching can reduce load time by 84% and improve user experience significantly.</p>
          </div>
          <div className="insight-item warning">
            <h5>Memory Usage Trending Up</h5>
            <p>Memory usage increased 5% in the last hour. Consider implementing lazy loading for practice modules.</p>
          </div>
          <div className="insight-item success">
            <p>API response times improved 8% due to recent optimizations. Continue monitoring for sustained performance.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformance = (): JSX.Element => (
    <div className="performance-panel">
      <h3>⚡ Performance Optimizations</h3>
      
      <div className="optimizations-list">
        {optimizations.map(optimization => (
          <div key={optimization.id} className={`optimization-card ${optimization.priority} ${optimization.type}`}>
            <div className="optimization-header">
              <div className="optimization-title">
                <h4>{optimization.title}</h4>
                <span className={`priority-badge ${optimization.priority}`}>
                  {optimization.priority}
                </span>
              </div>
              <span className={`status-badge ${optimization.status}`}>
                {optimization.status.replace('_', ' ')}
              </span>
            </div>
            
            <p className="optimization-description">{optimization.description}</p>
            
            <div className="performance-comparison">
              <div className="current-performance">
                <h5>📊 Current</h5>
                <div className="perf-metrics">
                  <div className="perf-metric">
                    <span className="label">Load Time:</span>
                    <span className="value">{optimization.currentPerformance.loadTime}ms</span>
                  </div>
                  <div className="perf-metric">
                    <span className="label">Memory:</span>
                    <span className="value">{optimization.currentPerformance.memoryUsage}MB</span>
                  </div>
                  <div className="perf-metric">
                    <span className="label">CPU:</span>
                    <span className="value">{optimization.currentPerformance.cpuUsage}%</span>
                  </div>
                  <div className="perf-metric">
                    <span className="label">Requests:</span>
                    <span className="value">{optimization.currentPerformance.networkRequests}</span>
                  </div>
                </div>
              </div>
              
              <div className="optimized-performance">
                <h5>🎯 Optimized</h5>
                <div className="perf-metrics">
                  <div className="perf-metric">
                    <span className="label">Load Time:</span>
                    <span className="value">{optimization.optimizedPerformance.loadTime}ms</span>
                  </div>
                  <div className="perf-metric">
                    <span className="label">Memory:</span>
                    <span className="value">{optimization.optimizedPerformance.memoryUsage}MB</span>
                  </div>
                  <div className="perf-metric">
                    <span className="label">CPU:</span>
                    <span className="value">{optimization.optimizedPerformance.cpuUsage}%</span>
                  </div>
                  <div className="perf-metric">
                    <span className="label">Requests:</span>
                    <span className="value">{optimization.optimizedPerformance.networkRequests}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="improvement-metrics">
              <h5>📈 Improvements</h5>
              <div className="improvements-grid">
                <div className="improvement-item">
                  <span className="improvement-label">Load Time:</span>
                  <span className={`improvement-value ${optimization.improvement.loadTimeReduction > 0 ? 'positive' : 'negative'}`}>
                    {optimization.improvement.loadTimeReduction > 0 ? '-' : '+'}{Math.abs(optimization.improvement.loadTimeReduction)}%
                  </span>
                </div>
                <div className="improvement-item">
                  <span className="improvement-label">Memory:</span>
                  <span className={`improvement-value ${optimization.improvement.memoryReduction > 0 ? 'positive' : 'negative'}`}>
                    {optimization.improvement.memoryReduction > 0 ? '-' : '+'}{Math.abs(optimization.improvement.memoryReduction)}%
                  </span>
                </div>
                <div className="improvement-item">
                  <span className="improvement-label">CPU:</span>
                  <span className={`improvement-value ${optimization.improvement.cpuReduction > 0 ? 'positive' : 'negative'}`}>
                    {optimization.improvement.cpuReduction > 0 ? '-' : '+'}{Math.abs(optimization.improvement.cpuReduction)}%
                  </span>
                </div>
                <div className="improvement-item">
                  <span className="improvement-label">Network:</span>
                  <span className={`improvement-value ${optimization.improvement.networkReduction > 0 ? 'positive' : 'negative'}`}>
                    {optimization.improvement.networkReduction > 0 ? '-' : '+'}{Math.abs(optimization.improvement.networkReduction)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="implementation-details">
              <div className="implementation-metrics">
                <span className={`complexity ${optimization.implementation.complexity}`}>
                  {optimization.implementation.complexity} complexity
                </span>
                <span className="hours">{optimization.implementation.estimatedHours}h estimate</span>
                <span className={`risk ${optimization.implementation.riskLevel}`}>
                  {optimization.implementation.riskLevel} risk
                </span>
              </div>
              
              <div className="dependencies">
                <strong>Dependencies:</strong> {optimization.implementation.dependencies.join(', ')}
              </div>
            </div>
            
            <button 
              className="apply-optimization-btn"
              onClick={() => onOptimizationApplied?.(optimization)}
              disabled={optimization.status === 'implementing' || optimization.status === 'deployed'}
            >
              {optimization.status === 'deployed' ? 'Deployed' : 
               optimization.status === 'implementing' ? 'Implementing...' : 
               'Apply Optimization'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCaching = (): JSX.Element => (
    <div className="caching-panel">
      <h3>🗄️ Caching Strategies</h3>
      
      <div className="cache-overview">
        <div className="cache-stats">
          <div className="stat-card">
            <h4>Overall Hit Rate</h4>
            <div className="stat-value">
              {Math.round(cacheStrategies.reduce((sum, cache) => sum + cache.hitRate, 0) / cacheStrategies.length)}%
            </div>
          </div>
          <div className="stat-card">
            <h4>Bandwidth Saved</h4>
            <div className="stat-value">
              {(cacheStrategies.reduce((sum, cache) => sum + cache.performance.bandwidthSaved, 0) / 1000).toFixed(1)}GB/day
            </div>
          </div>
          <div className="stat-card">
            <h4>Response Time</h4>
            <div className="stat-value">
              {Math.round(cacheStrategies.reduce((sum, cache) => sum + cache.performance.averageResponseTime, 0) / cacheStrategies.length)}ms avg
            </div>
          </div>
        </div>
      </div>
      
      <div className="cache-strategies">
        {cacheStrategies.map(cache => (
          <div key={cache.id} className={`cache-card ${cache.type} ${cache.scope}`}>
            <div className="cache-header">
              <h4>{cache.name}</h4>
              <div className="cache-badges">
                <span className="type-badge">{cache.type}</span>
                <span className="scope-badge">{cache.scope}</span>
                <span className={`status-badge ${cache.configuration.enabled ? 'enabled' : 'disabled'}`}>
                  {cache.configuration.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div className="cache-metrics">
              <div className="hit-rate-section">
                <h5>Cache Performance</h5>
                <div className="hit-rate-chart">
                  <div className="hit-rate-bar">
                    <div 
                      className="hit-portion"
                      style={{ width: `${cache.hitRate}%` }}
                    />
                    <div 
                      className="miss-portion"
                      style={{ width: `${cache.missRate}%` }}
                    />
                  </div>
                  <div className="hit-rate-labels">
                    <span className="hit-label">Hit: {cache.hitRate}%</span>
                    <span className="miss-label">Miss: {cache.missRate}%</span>
                  </div>
                </div>
              </div>
              
              <div className="cache-config">
                <h5>Configuration</h5>
                <div className="config-grid">
                  <div className="config-item">
                    <span className="label">TTL:</span>
                    <span className="value">{cache.ttl}s</span>
                  </div>
                  <div className="config-item">
                    <span className="label">Max Size:</span>
                    <span className="value">{cache.maxSize}MB</span>
                  </div>
                  <div className="config-item">
                    <span className="label">Policy:</span>
                    <span className="value">{cache.evictionPolicy.toUpperCase()}</span>
                  </div>
                  <div className="config-item">
                    <span className="label">Compression:</span>
                    <span className="value">{cache.configuration.compression ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              
              <div className="performance-benefits">
                <h5>Performance Benefits</h5>
                <div className="benefits-list">
                  <div className="benefit-item">
                    <span className="label">Response Time:</span>
                    <span className="value">{cache.performance.averageResponseTime}ms</span>
                  </div>
                  <div className="benefit-item">
                    <span className="label">Bandwidth Saved:</span>
                    <span className="value">{(cache.performance.bandwidthSaved / 1000).toFixed(1)}GB/day</span>
                  </div>
                  <div className="benefit-item">
                    <span className="label">CPU Reduction:</span>
                    <span className="value">{cache.performance.cpuReduction}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="cache-actions">
              <button 
                className="configure-cache-btn"
                onClick={() => onCacheConfigured?.(cache)}
              >
                Configure Cache
              </button>
              <button className="clear-cache-btn">
                Clear Cache
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderScalability = (): JSX.Element => (
    <div className="scalability-panel">
      <h3>📈 Scalability Analysis</h3>
      
      <div className="scalability-metrics">
        {scalabilityMetrics.map(metric => (
          <div key={metric.id} className="scalability-card">
            <div className="scalability-header">
              <h4>{metric.component}</h4>
              <div className="utilization-indicator">
                <span className="utilization-label">Utilization:</span>
                <span className="utilization-value">{metric.utilization}%</span>
                <div className="utilization-bar">
                  <div 
                    className="utilization-fill"
                    style={{ width: `${metric.utilization}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="capacity-comparison">
              <div className="current-capacity">
                <h5>📊 Current Load</h5>
                <div className="capacity-metrics">
                  <div className="capacity-metric">
                    <span className="label">Users:</span>
                    <span className="value">{metric.current.users}</span>
                  </div>
                  <div className="capacity-metric">
                    <span className="label">Requests/min:</span>
                    <span className="value">{metric.current.requests}</span>
                  </div>
                  <div className="capacity-metric">
                    <span className="label">Data Size:</span>
                    <span className="value">{metric.current.dataSize}MB</span>
                  </div>
                  <div className="capacity-metric">
                    <span className="label">Response Time:</span>
                    <span className="value">{metric.current.responseTime}ms</span>
                  </div>
                </div>
              </div>
              
              <div className="max-capacity">
                <h5>🎯 Maximum Capacity</h5>
                <div className="capacity-metrics">
                  <div className="capacity-metric">
                    <span className="label">Users:</span>
                    <span className="value">{metric.capacity.maxUsers}</span>
                  </div>
                  <div className="capacity-metric">
                    <span className="label">Requests/min:</span>
                    <span className="value">{metric.capacity.maxRequests}</span>
                  </div>
                  <div className="capacity-metric">
                    <span className="label">Data Size:</span>
                    <span className="value">{metric.capacity.maxDataSize}MB</span>
                  </div>
                  <div className="capacity-metric">
                    <span className="label">Max Response:</span>
                    <span className="value">{metric.capacity.maxResponseTime}ms</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="scaling-triggers">
              <h5>⚡ Scaling Triggers</h5>
              <div className="triggers-list">
                {metric.scalingTriggers.map((trigger, index) => (
                  <div key={index} className="trigger-item">
                    <span className="trigger-metric">{trigger.metric.replace('_', ' ')}</span>
                    <span className="trigger-threshold">&gt; {trigger.threshold}</span>
                    <span className="trigger-action">{trigger.action}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bottlenecks">
              <h5>🚧 Bottlenecks</h5>
              <div className="bottlenecks-list">
                {metric.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className={`bottleneck-item ${bottleneck.severity}`}>
                    <div className="bottleneck-header">
                      <span className="bottleneck-component">{bottleneck.component}</span>
                      <span className={`severity-badge ${bottleneck.severity}`}>
                        {bottleneck.severity}
                      </span>
                    </div>
                    <div className="bottleneck-impact">{bottleneck.impact}</div>
                    <div className="bottleneck-solution">
                      <strong>Solution:</strong> {bottleneck.solution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQuality = (): JSX.Element => (
    <div className="quality-panel">
      <h3>🔍 Code Quality Metrics</h3>
      
      <div className="quality-overview">
        <div className="overall-grade">
          <div className="grade-display">
            <span className="grade-letter">B+</span>
            <span className="grade-description">Good Quality</span>
          </div>
          <div className="grade-trend">
            <span className="trend-indicator improving">↗️</span>
            <span>Improving</span>
          </div>
        </div>
      </div>
      
      <div className="quality-metrics">
        {codeQuality.map(quality => (
          <div key={quality.id} className={`quality-card ${quality.category}`}>
            <div className="quality-header">
              <h4>{quality.name}</h4>
              <div className="quality-badges">
                <span className={`grade-badge ${quality.grade.toLowerCase()}`}>
                  {quality.grade}
                </span>
                <span className="category-badge">{quality.category}</span>
              </div>
            </div>
            
            <div className="quality-value">
              <span className="value">{quality.value}</span>
              <div className="quality-bar">
                <div 
                  className="quality-fill"
                  style={{ 
                    width: `${Math.min((quality.value / quality.threshold.excellent) * 100, 100)}%` 
                  }}
                />
                <div className="thresholds">
                  <div className="threshold excellent" style={{ left: '80%' }} title="Excellent" />
                  <div className="threshold good" style={{ left: '60%' }} title="Good" />
                  <div className="threshold acceptable" style={{ left: '40%' }} title="Acceptable" />
                </div>
              </div>
            </div>
            
            <div className="issues-breakdown">
              <h5>Issues Breakdown</h5>
              <div className="issues-grid">
                <div className="issue-item critical">
                  <span className="issue-count">{quality.issues.critical}</span>
                  <span className="issue-label">Critical</span>
                </div>
                <div className="issue-item major">
                  <span className="issue-count">{quality.issues.major}</span>
                  <span className="issue-label">Major</span>
                </div>
                <div className="issue-item minor">
                  <span className="issue-count">{quality.issues.minor}</span>
                  <span className="issue-label">Minor</span>
                </div>
                <div className="issue-item info">
                  <span className="issue-count">{quality.issues.info}</span>
                  <span className="issue-label">Info</span>
                </div>
              </div>
            </div>
            
            <div className="quality-trend">
              <span className={`trend-direction ${quality.trends.direction}`}>
                {quality.trends.direction === 'improving' ? '↗️' : 
                 quality.trends.direction === 'degrading' ? '↘️' : '➡️'}
              </span>
              <span className="trend-text">
                {quality.trends.direction} ({quality.trends.rate > 0 ? '+' : ''}{quality.trends.rate}/week)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonitoring = (): JSX.Element => (
    <div className="monitoring-panel">
      <h3>🚨 Monitoring & Alerts</h3>
      
      <div className="monitoring-status">
        <div className="monitoring-indicator">
          <span className={`status-dot ${isMonitoring ? 'active' : 'inactive'}`}></span>
          <span>Real-time monitoring {isMonitoring ? 'active' : 'inactive'}</span>
        </div>
        <div className="refresh-interval">
          <label>Refresh Interval:</label>
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
          >
            <option value={10}>10 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={300}>5 minutes</option>
          </select>
        </div>
      </div>
      
      <div className="alerts-summary">
        <div className="alert-counts">
          <div className="alert-count critical">
            <span className="count">{alerts.filter(a => a.severity === 'critical').length}</span>
            <span className="label">Critical</span>
          </div>
          <div className="alert-count error">
            <span className="count">{alerts.filter(a => a.severity === 'error').length}</span>
            <span className="label">Error</span>
          </div>
          <div className="alert-count warning">
            <span className="count">{alerts.filter(a => a.severity === 'warning').length}</span>
            <span className="label">Warning</span>
          </div>
          <div className="alert-count info">
            <span className="count">{alerts.filter(a => a.severity === 'info').length}</span>
            <span className="label">Info</span>
          </div>
        </div>
      </div>
      
      <div className="alerts-list">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert-card ${alert.severity} ${alert.status}`}>
            <div className="alert-header">
              <div className="alert-title">
                <span className={`severity-icon ${alert.severity}`}>
                  {alert.severity === 'critical' ? '🚨' : 
                   alert.severity === 'error' ? '❌' : 
                   alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <h4>{alert.title}</h4>
              </div>
              <div className="alert-meta">
                <span className="alert-time">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
                <span className={`alert-status ${alert.status}`}>
                  {alert.status}
                </span>
              </div>
            </div>
            
            <p className="alert-description">{alert.description}</p>
            
            <div className="alert-details">
              <div className="alert-metric">
                <span className="metric-label">Metric:</span>
                <span className="metric-name">{alert.metric.replace('_', ' ')}</span>
                <span className="metric-value">{alert.value}</span>
                <span className="metric-threshold">(threshold: {alert.threshold})</span>
              </div>
              
              <div className="affected-components">
                <span className="components-label">Affected Components:</span>
                <div className="components-list">
                  {alert.affectedComponents.map(component => (
                    <span key={component} className="component-tag">
                      {component}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="alert-actions">
              <h5>Recommended Actions:</h5>
              <ul>
                {alert.actions.map(action => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
            
            <div className="alert-buttons">
              {alert.status === 'active' && (
                <button className="acknowledge-btn">
                  Acknowledge
                </button>
              )}
              {alert.status !== 'resolved' && (
                <button 
                  className="resolve-btn"
                  onClick={() => onAlertResolved?.(alert)}
                >
                  Mark Resolved
                </button>
              )}
              <button className="details-btn">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="performance-optimization-dashboard">
      {isMonitoring && (
        <div className="monitoring-indicator">
          <span className="monitor-icon">📊</span>
          <span>Real-time performance monitoring active</span>
        </div>
      )}
      
      <div className="dashboard-header">
        <h2>🚀 Performance Optimization Dashboard</h2>
        <p>Comprehensive system performance monitoring, optimization, and scaling management</p>
      </div>
      
      <div className="dashboard-tabs">
        {([
          ['overview', '📊 Overview'],
          ['performance', '⚡ Performance'],
          ['caching', '🗄️ Caching'],
          ['scalability', '📈 Scalability'],
          ['quality', '🔍 Quality'],
          ['monitoring', '🚨 Monitoring']
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            className={`dashboard-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'caching' && renderCaching()}
        {activeTab === 'scalability' && renderScalability()}
        {activeTab === 'quality' && renderQuality()}
        {activeTab === 'monitoring' && renderMonitoring()}
      </div>
    </div>
  );
};

export default PerformanceOptimizationDashboard;