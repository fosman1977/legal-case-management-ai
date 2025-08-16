/**
 * ENTERPRISE RESOURCE MONITOR
 * Real-time system resource monitoring and management for legal document processing
 * 
 * Status: Phase 1, Week 1 - Core enterprise architecture
 * Purpose: Monitor memory, CPU, and disk usage to prevent system overload
 * Integration: Works with enterprise-queue.ts and document extractors
 */

import { EventEmitter } from 'events';

export interface ResourceMetrics {
  timestamp: number;
  memory: MemoryMetrics;
  cpu: CPUMetrics;
  disk: DiskMetrics;
  processing: ProcessingMetrics;
}

export interface MemoryMetrics {
  used: number;        // Bytes currently used
  available: number;   // Bytes available
  total: number;       // Total system memory
  percentage: number;  // Percentage used (0-100)
  jsHeapUsed: number;  // JavaScript heap used
  jsHeapLimit: number; // JavaScript heap limit
}

export interface CPUMetrics {
  usage: number;       // CPU usage percentage (0-100)
  cores: number;       // Number of CPU cores
  loadAverage: number; // System load average
  processLoad: number; // Current process CPU usage
}

export interface DiskMetrics {
  used: number;        // Disk space used
  available: number;   // Disk space available
  total: number;       // Total disk space
  percentage: number;  // Percentage used (0-100)
  tempSpaceUsed: number; // Temporary cache space used
}

export interface ProcessingMetrics {
  activeDocuments: number;     // Documents currently being processed
  queueLength: number;         // Tasks waiting to be processed
  averageProcessingTime: number; // Average time per document (ms)
  totalDocumentsProcessed: number;
  memoryPerDocument: number;   // Average memory per document
  successRate: number;         // Percentage of successful processing
}

export interface ResourceThresholds {
  memory: {
    warning: number;    // Warning threshold (0.0-1.0)
    critical: number;   // Critical threshold (0.0-1.0)
    emergency: number;  // Emergency threshold (0.0-1.0)
  };
  cpu: {
    warning: number;    // Warning threshold (0.0-1.0)
    critical: number;   // Critical threshold (0.0-1.0)
  };
  disk: {
    warning: number;    // Warning threshold (0.0-1.0)
    critical: number;   // Critical threshold (0.0-1.0)
  };
}

export interface ResourceAlert {
  type: 'memory' | 'cpu' | 'disk' | 'processing';
  level: 'warning' | 'critical' | 'emergency';
  message: string;
  metrics: ResourceMetrics;
  timestamp: number;
  recommendations: string[];
}

export interface OptimizationResult {
  type: 'memory_cleanup' | 'cache_clear' | 'task_throttle' | 'worker_scale';
  description: string;
  memoryFreed: number;
  processingImpact: string;
  success: boolean;
}

export class ResourceMonitor extends EventEmitter {
  private monitoring: boolean = false;
  private metrics: ResourceMetrics[] = [];
  private maxMetricsHistory: number = 1000;
  private monitoringInterval: number = 5000; // 5 seconds
  private intervalId: NodeJS.Timeout | null = null;
  
  private thresholds: ResourceThresholds = {
    memory: {
      warning: 0.7,   // 70% memory usage
      critical: 0.85, // 85% memory usage  
      emergency: 0.95 // 95% memory usage
    },
    cpu: {
      warning: 0.8,   // 80% CPU usage
      critical: 0.95  // 95% CPU usage
    },
    disk: {
      warning: 0.8,   // 80% disk usage
      critical: 0.95  // 95% disk usage
    }
  };

  private processingMetrics: ProcessingMetrics = {
    activeDocuments: 0,
    queueLength: 0,
    averageProcessingTime: 0,
    totalDocumentsProcessed: 0,
    memoryPerDocument: 0,
    successRate: 1.0
  };

  constructor(config: ResourceMonitorConfig = {}) {
    super();
    
    if (config.thresholds) {
      this.thresholds = { ...this.thresholds, ...config.thresholds };
    }
    
    if (config.monitoringInterval) {
      this.monitoringInterval = config.monitoringInterval;
    }

    console.log('📊 Resource Monitor initialized with enterprise thresholds');
  }

  /**
   * Start monitoring system resources
   */
  startMonitoring(): void {
    if (this.monitoring) {
      return;
    }

    this.monitoring = true;
    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, this.monitoringInterval);

    console.log(`📈 Resource monitoring started (interval: ${this.monitoringInterval}ms)`);
    this.emit('monitoringStarted');
  }

  /**
   * Stop monitoring system resources
   */
  stopMonitoring(): void {
    if (!this.monitoring) {
      return;
    }

    this.monitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('📉 Resource monitoring stopped');
    this.emit('monitoringStopped');
  }

  /**
   * Get current resource metrics
   */
  getCurrentMetrics(): ResourceMetrics {
    return this.collectMetrics();
  }

  /**
   * Get resource metrics history
   */
  getMetricsHistory(minutes: number = 60): ResourceMetrics[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Check if memory is available for processing
   */
  async checkMemoryAvailable(requiredMB: number = 500): Promise<{ available: boolean; freeMemory: number }> {
    const metrics = this.getCurrentMetrics();
    const availableBytes = metrics.memory.available;
    const requiredBytes = requiredMB * 1024 * 1024;

    return {
      available: availableBytes >= requiredBytes,
      freeMemory: Math.floor(availableBytes / (1024 * 1024))
    };
  }

  /**
   * Optimize memory usage when resources are constrained
   */
  async optimizeMemory(): Promise<OptimizationResult[]> {
    console.log('🧹 Starting memory optimization...');
    const results: OptimizationResult[] = [];

    // Force garbage collection if available
    if (global.gc) {
      const beforeMemory = this.getJSMemoryUsage();
      global.gc();
      const afterMemory = this.getJSMemoryUsage();
      const freed = beforeMemory - afterMemory;

      results.push({
        type: 'memory_cleanup',
        description: 'Forced garbage collection',
        memoryFreed: freed,
        processingImpact: 'Minimal - brief pause during GC',
        success: freed > 0
      });

      console.log(`♻️ Garbage collection freed ${Math.floor(freed / (1024 * 1024))}MB`);
    }

    // Clear internal caches
    const cacheCleared = this.clearInternalCaches();
    if (cacheCleared > 0) {
      results.push({
        type: 'cache_clear',
        description: 'Cleared internal metrics cache',
        memoryFreed: cacheCleared,
        processingImpact: 'None - no processing impact',
        success: true
      });
    }

    // Emit optimization event
    this.emit('memoryOptimized', results);

    return results;
  }

  /**
   * Update processing metrics from external sources
   */
  updateProcessingMetrics(update: Partial<ProcessingMetrics>): void {
    this.processingMetrics = { ...this.processingMetrics, ...update };
  }

  /**
   * Get memory usage for a specific task
   */
  async getTaskMemoryUsage(taskId: string): Promise<number> {
    // Placeholder for task-specific memory tracking
    // In a full implementation, this would track memory usage per task
    return this.processingMetrics.memoryPerDocument;
  }

  /**
   * Calculate system load score (0-1, higher = more loaded)
   */
  getSystemLoadScore(): number {
    const metrics = this.getCurrentMetrics();
    
    const memoryLoad = metrics.memory.percentage / 100;
    const cpuLoad = metrics.cpu.usage / 100;
    const diskLoad = metrics.disk.percentage / 100;
    
    // Weighted average (memory is most important for document processing)
    return (memoryLoad * 0.5) + (cpuLoad * 0.3) + (diskLoad * 0.2);
  }

  /**
   * Get recommended processing throttle level
   */
  getRecommendedThrottleLevel(): 'none' | 'light' | 'moderate' | 'heavy' {
    const loadScore = this.getSystemLoadScore();
    
    if (loadScore < 0.6) return 'none';
    if (loadScore < 0.75) return 'light';
    if (loadScore < 0.9) return 'moderate';
    return 'heavy';
  }

  // Private methods
  private collectMetrics(): ResourceMetrics {
    const timestamp = Date.now();
    
    const metrics: ResourceMetrics = {
      timestamp,
      memory: this.collectMemoryMetrics(),
      cpu: this.collectCPUMetrics(),
      disk: this.collectDiskMetrics(),
      processing: { ...this.processingMetrics }
    };

    // Store metrics
    this.metrics.push(metrics);
    
    // Trim metrics history
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Check thresholds and emit alerts
    this.checkThresholds(metrics);

    return metrics;
  }

  private collectMemoryMetrics(): MemoryMetrics {
    let jsHeapUsed = 0;
    let jsHeapLimit = 0;

    // Get JavaScript heap information if available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      jsHeapUsed = memory.usedJSHeapSize || 0;
      jsHeapLimit = memory.jsHeapSizeLimit || 0;
    }

    // Estimate total system memory (fallback values)
    const estimatedTotalMemory = 8 * 1024 * 1024 * 1024; // 8GB default
    const used = jsHeapUsed;
    const total = jsHeapLimit || estimatedTotalMemory;
    const available = total - used;

    return {
      used,
      available,
      total,
      percentage: total > 0 ? (used / total) * 100 : 0,
      jsHeapUsed,
      jsHeapLimit
    };
  }

  private collectCPUMetrics(): CPUMetrics {
    // Get CPU information
    const cores = typeof navigator !== 'undefined' ? 
      navigator.hardwareConcurrency || 4 : 4;

    // CPU usage estimation (limited in browser environment)
    let usage = 0;
    let loadAverage = 0;
    let processLoad = 0;

    // Rough CPU usage estimation based on processing queue
    if (this.processingMetrics.activeDocuments > 0) {
      usage = Math.min(90, (this.processingMetrics.activeDocuments / cores) * 40);
      processLoad = usage;
      loadAverage = usage / 100;
    }

    return {
      usage,
      cores,
      loadAverage,
      processLoad
    };
  }

  private collectDiskMetrics(): DiskMetrics {
    // Disk usage estimation (limited in browser environment)
    let used = 0;
    let available = 0;
    let total = 0;
    let tempSpaceUsed = 0;

    // Estimate based on storage quotas if available
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      // This will be async, so we'll use cached values or defaults
      navigator.storage.estimate().then(estimate => {
        total = estimate.quota || 1024 * 1024 * 1024; // 1GB default
        used = estimate.usage || 0;
        available = total - used;
      }).catch(() => {
        // Fallback values
        total = 1024 * 1024 * 1024; // 1GB
        used = 100 * 1024 * 1024;   // 100MB
        available = total - used;
      });
    } else {
      // Fallback values for environments without storage API
      total = 1024 * 1024 * 1024; // 1GB
      used = 100 * 1024 * 1024;   // 100MB
      available = total - used;
    }

    return {
      used,
      available,
      total,
      percentage: total > 0 ? (used / total) * 100 : 0,
      tempSpaceUsed
    };
  }

  private checkThresholds(metrics: ResourceMetrics): void {
    const alerts: ResourceAlert[] = [];

    // Check memory thresholds
    const memoryPercentage = metrics.memory.percentage / 100;
    if (memoryPercentage >= this.thresholds.memory.emergency) {
      alerts.push(this.createAlert('memory', 'emergency', 
        `Critical memory usage: ${metrics.memory.percentage.toFixed(1)}%`, metrics));
    } else if (memoryPercentage >= this.thresholds.memory.critical) {
      alerts.push(this.createAlert('memory', 'critical', 
        `High memory usage: ${metrics.memory.percentage.toFixed(1)}%`, metrics));
    } else if (memoryPercentage >= this.thresholds.memory.warning) {
      alerts.push(this.createAlert('memory', 'warning', 
        `Elevated memory usage: ${metrics.memory.percentage.toFixed(1)}%`, metrics));
    }

    // Check CPU thresholds
    const cpuPercentage = metrics.cpu.usage / 100;
    if (cpuPercentage >= this.thresholds.cpu.critical) {
      alerts.push(this.createAlert('cpu', 'critical', 
        `High CPU usage: ${metrics.cpu.usage.toFixed(1)}%`, metrics));
    } else if (cpuPercentage >= this.thresholds.cpu.warning) {
      alerts.push(this.createAlert('cpu', 'warning', 
        `Elevated CPU usage: ${metrics.cpu.usage.toFixed(1)}%`, metrics));
    }

    // Check disk thresholds
    const diskPercentage = metrics.disk.percentage / 100;
    if (diskPercentage >= this.thresholds.disk.critical) {
      alerts.push(this.createAlert('disk', 'critical', 
        `High disk usage: ${metrics.disk.percentage.toFixed(1)}%`, metrics));
    } else if (diskPercentage >= this.thresholds.disk.warning) {
      alerts.push(this.createAlert('disk', 'warning', 
        `Elevated disk usage: ${metrics.disk.percentage.toFixed(1)}%`, metrics));
    }

    // Emit alerts
    alerts.forEach(alert => {
      this.emit('resourceAlert', alert);
      if (alert.level === 'critical' || alert.level === 'emergency') {
        console.warn(`⚠️ ${alert.level.toUpperCase()}: ${alert.message}`);
      }
    });
  }

  private createAlert(
    type: ResourceAlert['type'], 
    level: ResourceAlert['level'], 
    message: string, 
    metrics: ResourceMetrics
  ): ResourceAlert {
    const recommendations: string[] = [];

    if (type === 'memory') {
      recommendations.push(
        'Consider reducing concurrent document processing',
        'Enable incremental processing to reduce memory usage',
        'Clear document cache and temporary files'
      );
      if (level === 'emergency') {
        recommendations.push('Immediately pause new document processing');
      }
    } else if (type === 'cpu') {
      recommendations.push(
        'Reduce number of parallel workers',
        'Enable processing throttling',
        'Consider background processing mode'
      );
    } else if (type === 'disk') {
      recommendations.push(
        'Clear temporary files and cache',
        'Archive processed documents',
        'Enable compression for stored results'
      );
    }

    return {
      type,
      level,
      message,
      metrics,
      timestamp: Date.now(),
      recommendations
    };
  }

  private getJSMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  private clearInternalCaches(): number {
    const initialSize = this.metrics.length;
    
    // Keep only recent metrics (last 10 minutes)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= tenMinutesAgo);
    
    const clearedItems = initialSize - this.metrics.length;
    return clearedItems * 1024; // Rough estimate of memory freed
  }
}

// Configuration interface
export interface ResourceMonitorConfig {
  thresholds?: Partial<ResourceThresholds>;
  monitoringInterval?: number;
  maxMetricsHistory?: number;
}

// Export default configured instance
export const resourceMonitor = new ResourceMonitor({
  monitoringInterval: 5000,     // 5 seconds
  maxMetricsHistory: 720        // 1 hour of 5-second intervals
});

console.log('📊 Resource Monitor module loaded');