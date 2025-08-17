/**
 * Engine Performance Monitoring Service
 * Real-time monitoring, alerting, and quality assurance for all engines
 */

interface EngineMetrics {
  engineName: string;
  version: string;
  metrics: {
    accuracy: number;
    processingTime: number;
    memoryUsage: number;
    errorRate: number;
    throughput: number; // documents per minute
    confidence: number;
  };
  timestamp: Date;
}

interface PerformanceAlert {
  id: string;
  engineName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'accuracy_drop' | 'slow_performance' | 'memory_leak' | 'high_error_rate' | 'engine_offline';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
}

interface QualityTrend {
  engineName: string;
  period: '24h' | '7d' | '30d';
  trend: 'improving' | 'stable' | 'declining';
  changePercent: number;
  metrics: {
    accuracy: { current: number; previous: number };
    speed: { current: number; previous: number };
    reliability: { current: number; previous: number };
  };
}

export class EngineMonitoringService {
  private metrics: Map<string, EngineMetrics[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  // Performance thresholds
  private thresholds = {
    accuracy: {
      warning: 0.85,
      critical: 0.80
    },
    processingTime: {
      warning: 5000, // 5 seconds
      critical: 10000 // 10 seconds
    },
    memoryUsage: {
      warning: 512, // MB
      critical: 1024 // MB
    },
    errorRate: {
      warning: 0.05, // 5%
      critical: 0.15 // 15%
    }
  };

  /**
   * Start continuous monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    
    console.log('📊 Starting Engine Performance Monitoring...');
    
    this.isMonitoring = true;
    
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.checkAlerts();
    }, 30000);
    
    // Initial metrics collection
    await this.collectMetrics();
    
    console.log('✅ Engine monitoring started (30-second intervals)');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Engine monitoring stopped');
  }

  /**
   * Collect metrics from all engines
   */
  private async collectMetrics(): Promise<void> {
    try {
      // In production, would collect real metrics from running engines
      const mockEngines = [
        'blackstone-uk',
        'eyecite', 
        'legal-regex',
        'spacy-legal',
        'custom-uk',
        'database-validator',
        'statistical-validator'
      ];

      for (const engineName of mockEngines) {
        const metrics = await this.collectEngineMetrics(engineName);
        
        if (!this.metrics.has(engineName)) {
          this.metrics.set(engineName, []);
        }
        
        const engineMetrics = this.metrics.get(engineName)!;
        engineMetrics.push(metrics);
        
        // Keep only last 1000 metrics (about 8 hours at 30-second intervals)
        if (engineMetrics.length > 1000) {
          engineMetrics.splice(0, engineMetrics.length - 1000);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to collect engine metrics:', error);
    }
  }

  /**
   * Collect metrics for a specific engine
   */
  private async collectEngineMetrics(engineName: string): Promise<EngineMetrics> {
    // Simulate metrics collection
    const baseAccuracy = this.getBaseAccuracy(engineName);
    const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
    
    // Simulate gradual degradation for demo
    const degradationFactor = this.simulateDegradation(engineName);
    
    return {
      engineName,
      version: '1.0.0',
      metrics: {
        accuracy: Math.max(0.7, Math.min(0.99, baseAccuracy + variation - degradationFactor)),
        processingTime: 1000 + Math.random() * 2000 + (degradationFactor * 5000),
        memoryUsage: 100 + Math.random() * 50 + (degradationFactor * 200),
        errorRate: Math.max(0, Math.min(0.2, Math.random() * 0.02 + degradationFactor)),
        throughput: Math.max(5, 30 - (degradationFactor * 20) + (Math.random() * 10)),
        confidence: Math.max(0.6, Math.min(0.99, baseAccuracy + variation - degradationFactor))
      },
      timestamp: new Date()
    };
  }

  /**
   * Analyze performance trends and patterns
   */
  private analyzePerformance(): void {
    this.metrics.forEach((engineMetrics, engineName) => {
      if (engineMetrics.length < 2) return;
      
      const latest = engineMetrics[engineMetrics.length - 1];
      const previous = engineMetrics[engineMetrics.length - 2];
      
      // Check for significant performance changes
      this.detectPerformanceAnomalies(engineName, latest, previous);
      
      // Update quality trends
      this.updateQualityTrends(engineName, engineMetrics);
    });
  }

  /**
   * Detect performance anomalies
   */
  private detectPerformanceAnomalies(
    engineName: string,
    current: EngineMetrics,
    previous: EngineMetrics
  ): void {
    const currentMetrics = current.metrics;
    const previousMetrics = previous.metrics;
    
    // Check accuracy drop
    const accuracyDrop = previousMetrics.accuracy - currentMetrics.accuracy;
    if (accuracyDrop > 0.05) { // 5% drop
      this.createAlert({
        engineName,
        severity: accuracyDrop > 0.1 ? 'critical' : 'high',
        type: 'accuracy_drop',
        message: `Accuracy dropped by ${(accuracyDrop * 100).toFixed(1)}%`,
        threshold: this.thresholds.accuracy.warning,
        currentValue: currentMetrics.accuracy
      });
    }
    
    // Check processing time increase
    const speedIncrease = currentMetrics.processingTime - previousMetrics.processingTime;
    if (speedIncrease > 2000) { // 2 second increase
      this.createAlert({
        engineName,
        severity: speedIncrease > 5000 ? 'critical' : 'medium',
        type: 'slow_performance',
        message: `Processing time increased by ${(speedIncrease / 1000).toFixed(1)}s`,
        threshold: this.thresholds.processingTime.warning,
        currentValue: currentMetrics.processingTime
      });
    }
    
    // Check memory usage
    if (currentMetrics.memoryUsage > this.thresholds.memoryUsage.critical) {
      this.createAlert({
        engineName,
        severity: 'critical',
        type: 'memory_leak',
        message: `Memory usage at ${currentMetrics.memoryUsage.toFixed(0)}MB`,
        threshold: this.thresholds.memoryUsage.critical,
        currentValue: currentMetrics.memoryUsage
      });
    }
    
    // Check error rate
    if (currentMetrics.errorRate > this.thresholds.errorRate.warning) {
      this.createAlert({
        engineName,
        severity: currentMetrics.errorRate > this.thresholds.errorRate.critical ? 'critical' : 'high',
        type: 'high_error_rate',
        message: `Error rate at ${(currentMetrics.errorRate * 100).toFixed(1)}%`,
        threshold: this.thresholds.errorRate.warning,
        currentValue: currentMetrics.errorRate
      });
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    // Check if similar alert already exists and is recent
    const recentAlert = this.alerts.find(alert =>
      alert.engineName === alertData.engineName &&
      alert.type === alertData.type &&
      !alert.acknowledged &&
      (Date.now() - alert.timestamp.getTime()) < 300000 // 5 minutes
    );
    
    if (recentAlert) return; // Don't spam alerts
    
    const alert: PerformanceAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date(),
      acknowledged: false
    };
    
    this.alerts.push(alert);
    
    // Log alert
    const severityIcon = {
      low: '🟡',
      medium: '🟠', 
      high: '🔴',
      critical: '🚨'
    };
    
    console.log(`${severityIcon[alert.severity]} ALERT: ${alert.engineName} - ${alert.message}`);
    
    // In production, would trigger UI notifications and possibly email/Slack alerts
  }

  /**
   * Check and process alerts
   */
  private checkAlerts(): void {
    const unacknowledgedAlerts = this.alerts.filter(alert => !alert.acknowledged);
    
    if (unacknowledgedAlerts.length > 0) {
      // Auto-acknowledge low severity alerts after 1 hour
      const oneHourAgo = Date.now() - 3600000;
      unacknowledgedAlerts
        .filter(alert => alert.severity === 'low' && alert.timestamp.getTime() < oneHourAgo)
        .forEach(alert => {
          alert.acknowledged = true;
        });
    }
  }

  /**
   * Update quality trends
   */
  private updateQualityTrends(engineName: string, metrics: EngineMetrics[]): void {
    if (metrics.length < 20) return; // Need sufficient data
    
    const recent = metrics.slice(-10); // Last 10 measurements
    const older = metrics.slice(-20, -10); // Previous 10 measurements
    
    const recentAvg = this.calculateAverageMetrics(recent);
    const olderAvg = this.calculateAverageMetrics(older);
    
    const accuracyChange = recentAvg.accuracy - olderAvg.accuracy;
    const speedChange = olderAvg.processingTime - recentAvg.processingTime; // Negative = slower
    const reliabilityChange = olderAvg.errorRate - recentAvg.errorRate; // Negative = more errors
    
    // Determine overall trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (accuracyChange > 0.02 && speedChange > 0 && reliabilityChange > 0) {
      trend = 'improving';
    } else if (accuracyChange < -0.02 || speedChange < -1000 || reliabilityChange < -0.02) {
      trend = 'declining';
    }
    
    // Store trend data (in production, would persist to database)
    console.log(`📈 ${engineName} trend: ${trend} (accuracy: ${accuracyChange > 0 ? '+' : ''}${(accuracyChange * 100).toFixed(1)}%)`);
  }

  /**
   * Calculate average metrics
   */
  private calculateAverageMetrics(metrics: EngineMetrics[]): {
    accuracy: number;
    processingTime: number;
    errorRate: number;
  } {
    const avg = {
      accuracy: 0,
      processingTime: 0,
      errorRate: 0
    };
    
    metrics.forEach(metric => {
      avg.accuracy += metric.metrics.accuracy;
      avg.processingTime += metric.metrics.processingTime;
      avg.errorRate += metric.metrics.errorRate;
    });
    
    const count = metrics.length;
    return {
      accuracy: avg.accuracy / count,
      processingTime: avg.processingTime / count,
      errorRate: avg.errorRate / count
    };
  }

  /**
   * Helper methods
   */
  private getBaseAccuracy(engineName: string): number {
    const baseAccuracies: Record<string, number> = {
      'blackstone-uk': 0.95,
      'eyecite': 0.98,
      'legal-regex': 0.92,
      'spacy-legal': 0.88,
      'custom-uk': 0.94,
      'database-validator': 0.96,
      'statistical-validator': 0.87
    };
    return baseAccuracies[engineName] || 0.85;
  }

  private simulateDegradation(engineName: string): number {
    // Simulate gradual degradation over time for demo purposes
    const degradationRates: Record<string, number> = {
      'blackstone-uk': 0,
      'eyecite': 0.001,
      'legal-regex': 0,
      'spacy-legal': 0.002,
      'custom-uk': 0,
      'database-validator': 0.001,
      'statistical-validator': 0.003
    };
    
    const rate = degradationRates[engineName] || 0;
    const time = Date.now() / 1000000; // Slow degradation
    return Math.min(0.1, rate * time);
  }

  /**
   * Public API methods
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    enginesMonitored: number;
    totalMetrics: number;
    unacknowledgedAlerts: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      enginesMonitored: this.metrics.size,
      totalMetrics: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
      unacknowledgedAlerts: this.alerts.filter(a => !a.acknowledged).length
    };
  }

  getEngineMetrics(engineName: string, limit: number = 100): EngineMetrics[] {
    const metrics = this.metrics.get(engineName) || [];
    return metrics.slice(-limit);
  }

  getAllAlerts(): PerformanceAlert[] {
    return this.alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getUnacknowledgedAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  getEngineHealthSummary(): Array<{
    engineName: string;
    status: 'healthy' | 'warning' | 'critical';
    lastMetrics: EngineMetrics | null;
    activeAlerts: number;
  }> {
    return Array.from(this.metrics.keys()).map(engineName => {
      const metrics = this.metrics.get(engineName) || [];
      const lastMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null;
      const activeAlerts = this.alerts.filter(a => 
        a.engineName === engineName && !a.acknowledged
      ).length;
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (activeAlerts > 0) {
        const criticalAlerts = this.alerts.filter(a => 
          a.engineName === engineName && !a.acknowledged && a.severity === 'critical'
        ).length;
        status = criticalAlerts > 0 ? 'critical' : 'warning';
      }
      
      return {
        engineName,
        status,
        lastMetrics,
        activeAlerts
      };
    });
  }
}

// Export singleton instance
export const engineMonitoringService = new EngineMonitoringService();
export default engineMonitoringService;