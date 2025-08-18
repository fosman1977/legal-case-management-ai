/**
 * Code Quality and Monitoring System
 * Comprehensive system for monitoring code quality, performance, and system health
 */

interface CodeMetrics {
  complexity: {
    cyclomatic: number;
    cognitive: number;
    halstead: {
      volume: number;
      difficulty: number;
      effort: number;
    };
  };
  maintainability: {
    index: number;
    linesOfCode: number;
    technicalDebt: number; // in hours
    duplication: number; // percentage
  };
  reliability: {
    bugs: number;
    vulnerabilities: number;
    codeSmells: number;
    coverage: number; // percentage
  };
  security: {
    hotspots: number;
    vulnerabilities: SecurityVulnerability[];
    cwe: number[]; // Common Weakness Enumeration IDs
  };
  performance: {
    bundleSize: number; // in KB
    loadTime: number; // in ms
    runtimeErrors: number;
    memoryLeaks: number;
  };
}

interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  file: string;
  line: number;
  cwe: number;
  remediation: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  trend: {
    direction: 'up' | 'down' | 'stable';
    change: number; // percentage
    period: string;
  };
  category: 'frontend' | 'backend' | 'database' | 'network' | 'infrastructure';
}

interface MonitoringAlert {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  type: 'performance' | 'security' | 'availability' | 'quality' | 'business';
  source: string;
  message: string;
  details: any;
  acknowledged: boolean;
  resolved: boolean;
  assignee?: string;
  actions: string[];
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  uptime: number; // percentage
  dependencies: {
    name: string;
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  }[];
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

interface ErrorTracking {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  stack: string;
  context: {
    userId?: string;
    sessionId: string;
    url: string;
    userAgent: string;
    component: string;
    action: string;
  };
  fingerprint: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
}

interface UserExperienceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  bounceRate: number;
  sessionDuration: number;
  errorRate: number;
  satisfactionScore: number; // 1-5
}

class CodeQualityMonitor {
  private metrics: CodeMetrics;
  private performanceMetrics: PerformanceMetric[] = [];
  private alerts: MonitoringAlert[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private errorLogs: ErrorTracking[] = [];
  private uxMetrics: UserExperienceMetrics;
  private monitoringInterval?: number;
  private errorHandler?: (error: ErrorEvent) => void;
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.metrics = this.initializeCodeMetrics();
    this.uxMetrics = this.initializeUXMetrics();
    this.initializeMonitoring();
    this.startHealthChecks();
    this.setupErrorTracking();
    this.setupPerformanceMonitoring();
  }

  private initializeCodeMetrics(): CodeMetrics {
    return {
      complexity: {
        cyclomatic: 8.2,
        cognitive: 12.5,
        halstead: {
          volume: 1250.5,
          difficulty: 15.2,
          effort: 19008.6
        }
      },
      maintainability: {
        index: 78.5,
        linesOfCode: 15420,
        technicalDebt: 45.2,
        duplication: 3.8
      },
      reliability: {
        bugs: 5,
        vulnerabilities: 2,
        codeSmells: 23,
        coverage: 85.7
      },
      security: {
        hotspots: 8,
        vulnerabilities: [
          {
            id: 'vuln_001',
            severity: 'medium',
            type: 'Cross-Site Scripting (XSS)',
            description: 'Potential XSS vulnerability in user input handling',
            file: 'src/components/CaseForm.tsx',
            line: 145,
            cwe: 79,
            remediation: 'Implement proper input sanitization and validation'
          },
          {
            id: 'vuln_002',
            severity: 'low',
            type: 'Information Disclosure',
            description: 'Sensitive information in console logs',
            file: 'src/utils/apiClient.ts',
            line: 89,
            cwe: 532,
            remediation: 'Remove or obfuscate sensitive information from logs'
          }
        ],
        cwe: [79, 532, 352, 22]
      },
      performance: {
        bundleSize: 2048,
        loadTime: 1800,
        runtimeErrors: 3,
        memoryLeaks: 1
      }
    };
  }

  private initializeUXMetrics(): UserExperienceMetrics {
    return {
      pageLoadTime: 1850,
      timeToInteractive: 2100,
      firstContentfulPaint: 800,
      largestContentfulPaint: 1600,
      cumulativeLayoutShift: 0.05,
      firstInputDelay: 45,
      bounceRate: 15.2,
      sessionDuration: 420000, // 7 minutes in ms
      errorRate: 0.8,
      satisfactionScore: 4.2
    };
  }

  private initializeMonitoring(): void {
    // Initialize performance metrics
    this.performanceMetrics = [
      {
        name: 'Response Time',
        value: 245,
        unit: 'ms',
        threshold: { warning: 500, critical: 1000 },
        trend: { direction: 'down', change: 8, period: 'last hour' },
        category: 'frontend'
      },
      {
        name: 'Memory Usage',
        value: 68,
        unit: '%',
        threshold: { warning: 80, critical: 95 },
        trend: { direction: 'up', change: 5, period: 'last hour' },
        category: 'infrastructure'
      },
      {
        name: 'API Throughput',
        value: 450,
        unit: 'req/min',
        threshold: { warning: 1000, critical: 2000 },
        trend: { direction: 'stable', change: 2, period: 'last hour' },
        category: 'backend'
      },
      {
        name: 'Error Rate',
        value: 0.8,
        unit: '%',
        threshold: { warning: 2, critical: 5 },
        trend: { direction: 'down', change: 15, period: 'last hour' },
        category: 'frontend'
      },
      {
        name: 'Database Query Time',
        value: 89,
        unit: 'ms',
        threshold: { warning: 200, critical: 500 },
        trend: { direction: 'stable', change: 1, period: 'last hour' },
        category: 'database'
      }
    ];

    // Start monitoring interval
    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics();
      this.evaluateAlerts();
    }, 30000); // Monitor every 30 seconds
  }

  private startHealthChecks(): void {
    // Initialize health checks for key services
    const services = [
      'legal-intelligence-frontend',
      'document-intelligence-api',
      'ml-prediction-service',
      'case-management-db',
      'knowledge-graph-service'
    ];

    for (const service of services) {
      this.healthChecks.set(service, {
        service,
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: Math.random() * 100 + 50,
        uptime: 99.5 + Math.random() * 0.5,
        dependencies: [
          { name: 'database', status: 'healthy', responseTime: 25 },
          { name: 'cache', status: 'healthy', responseTime: 15 },
          { name: 'storage', status: 'healthy', responseTime: 35 }
        ],
        metrics: {
          cpu: Math.random() * 40 + 20,
          memory: Math.random() * 50 + 30,
          disk: Math.random() * 30 + 10,
          network: Math.random() * 20 + 5
        }
      });
    }

    // Periodic health checks
    setInterval(() => {
      this.performHealthChecks();
    }, 60000); // Check every minute
  }

  private setupErrorTracking(): void {
    this.errorHandler = (event: ErrorEvent) => {
      const error: ErrorTracking = {
        id: this.generateId(),
        timestamp: new Date(),
        level: 'error',
        message: event.message,
        stack: event.error?.stack || '',
        context: {
          sessionId: this.getSessionId(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          component: this.getComponentFromStack(event.error?.stack),
          action: 'unknown'
        },
        fingerprint: this.generateFingerprint(event.message, event.filename || ''),
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        resolved: false
      };

      this.addError(error);
    };

    window.addEventListener('error', this.errorHandler);
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error: ErrorTracking = {
        id: this.generateId(),
        timestamp: new Date(),
        level: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack || '',
        context: {
          sessionId: this.getSessionId(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          component: 'promise-handler',
          action: 'promise-rejection'
        },
        fingerprint: this.generateFingerprint(`promise-rejection-${event.reason}`, window.location.href),
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        resolved: false
      };

      this.addError(error);
    });
  }

  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      try {
        this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'measure', 'resource'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
  }

  private monitorCoreWebVitals(): void {
    // Monitor Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.uxMetrics.largestContentfulPaint = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // Monitor First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const firstInputEntry = entry as any;
            if (firstInputEntry.processingStart && firstInputEntry.startTime) {
              this.uxMetrics.firstInputDelay = firstInputEntry.processingStart - firstInputEntry.startTime;
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Monitor Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as any;
            if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
              clsValue += layoutShiftEntry.value;
            }
          }
          this.uxMetrics.cumulativeLayoutShift = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }
  }

  private async collectMetrics(): Promise<void> {
    // Update performance metrics
    this.updatePerformanceMetrics();
    
    // Update UX metrics
    this.updateUXMetrics();
    
    // Check for new issues
    this.checkCodeQuality();
  }

  private updatePerformanceMetrics(): void {
    // Simulate metric updates with realistic variations
    for (const metric of this.performanceMetrics) {
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      metric.value = Math.max(0, metric.value * (1 + variation));
      
      // Update trend
      if (variation > 0.02) {
        metric.trend.direction = 'up';
        metric.trend.change = Math.abs(variation * 100);
      } else if (variation < -0.02) {
        metric.trend.direction = 'down';
        metric.trend.change = Math.abs(variation * 100);
      } else {
        metric.trend.direction = 'stable';
        metric.trend.change = Math.abs(variation * 100);
      }
    }
  }

  private updateUXMetrics(): void {
    // Get current navigation timing
    if ('getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.uxMetrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.uxMetrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
      }

      // Get paint timing
      const paints = performance.getEntriesByType('paint');
      for (const paint of paints) {
        if (paint.name === 'first-contentful-paint') {
          this.uxMetrics.firstContentfulPaint = paint.startTime;
        }
      }
    }
  }

  private checkCodeQuality(): void {
    // Simulate code quality checks
    const now = Date.now();
    
    // Check for performance regressions
    const responseTime = this.performanceMetrics.find(m => m.name === 'Response Time');
    if (responseTime && responseTime.value > responseTime.threshold.warning) {
      this.createAlert({
        severity: responseTime.value > responseTime.threshold.critical ? 'critical' : 'warning',
        type: 'performance',
        source: 'performance-monitor',
        message: `Response time (${responseTime.value}ms) exceeds threshold`,
        details: { metric: responseTime },
        actions: [
          'Check server performance',
          'Review recent deployments',
          'Scale infrastructure if needed'
        ]
      });
    }

    // Check memory usage
    const memoryMetric = this.performanceMetrics.find(m => m.name === 'Memory Usage');
    if (memoryMetric && memoryMetric.value > memoryMetric.threshold.warning) {
      this.createAlert({
        severity: memoryMetric.value > memoryMetric.threshold.critical ? 'critical' : 'warning',
        type: 'performance',
        source: 'memory-monitor',
        message: `Memory usage (${memoryMetric.value}%) exceeds threshold`,
        details: { metric: memoryMetric },
        actions: [
          'Check for memory leaks',
          'Optimize component lifecycle',
          'Clear unnecessary caches'
        ]
      });
    }
  }

  private performHealthChecks(): void {
    for (const [serviceName, healthCheck] of Array.from(this.healthChecks.entries())) {
      // Simulate health check
      const isHealthy = Math.random() > 0.05; // 95% success rate
      const responseTime = Math.random() * 200 + 50;
      
      healthCheck.lastCheck = new Date();
      healthCheck.responseTime = responseTime;
      healthCheck.status = isHealthy ? 'healthy' : 'degraded';
      
      // Update dependencies
      for (const dep of healthCheck.dependencies) {
        dep.status = Math.random() > 0.02 ? 'healthy' : 'unhealthy';
        dep.responseTime = Math.random() * 100 + 10;
      }
      
      // Update metrics
      healthCheck.metrics.cpu = Math.random() * 60 + 20;
      healthCheck.metrics.memory = Math.random() * 70 + 20;
      healthCheck.metrics.disk = Math.random() * 40 + 10;
      healthCheck.metrics.network = Math.random() * 30 + 5;
      
      // Create alert if unhealthy
      if (!isHealthy) {
        this.createAlert({
          severity: 'error',
          type: 'availability',
          source: `health-check-${serviceName}`,
          message: `Service ${serviceName} health check failed`,
          details: { healthCheck },
          actions: [
            'Check service logs',
            'Verify dependencies',
            'Restart service if necessary'
          ]
        });
      }
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming;
      this.uxMetrics.pageLoadTime = navEntry.loadEventEnd - navEntry.fetchStart;
    }
    
    if (entry.entryType === 'resource') {
      const resourceEntry = entry as PerformanceResourceTiming;
      if (resourceEntry.duration > 1000) { // Slow resource
        this.createAlert({
          severity: 'warning',
          type: 'performance',
          source: 'resource-monitor',
          message: `Slow resource loading detected: ${resourceEntry.name}`,
          details: { 
            resource: resourceEntry.name,
            duration: resourceEntry.duration 
          },
          actions: [
            'Optimize resource size',
            'Enable compression',
            'Use CDN for static assets'
          ]
        });
      }
    }
  }

  private evaluateAlerts(): void {
    // Auto-resolve old alerts
    const now = Date.now();
    for (const alert of this.alerts) {
      if (!alert.resolved && (now - alert.timestamp.getTime()) > 3600000) { // 1 hour
        alert.resolved = true;
      }
    }
    
    // Limit alert count
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  private createAlert(alertData: Partial<MonitoringAlert>): void {
    const alert: MonitoringAlert = {
      id: this.generateId(),
      timestamp: new Date(),
      severity: 'info',
      type: 'performance',
      source: 'unknown',
      message: '',
      details: {},
      acknowledged: false,
      resolved: false,
      actions: [],
      ...alertData
    };

    this.alerts.unshift(alert);
    
    // Send notification for critical alerts
    if (alert.severity === 'critical') {
      this.sendNotification(alert);
    }
  }

  private addError(error: ErrorTracking): void {
    // Check if error already exists
    const existingError = this.errorLogs.find(e => e.fingerprint === error.fingerprint);
    
    if (existingError) {
      existingError.count++;
      existingError.lastSeen = new Date();
    } else {
      this.errorLogs.unshift(error);
      
      // Create alert for new errors
      this.createAlert({
        severity: error.level === 'fatal' ? 'critical' : 'error',
        type: 'quality',
        source: 'error-tracker',
        message: `New error detected: ${error.message}`,
        details: { error },
        actions: [
          'Review error stack trace',
          'Check recent code changes',
          'Add error handling if necessary'
        ]
      });
    }
    
    // Limit error log size
    if (this.errorLogs.length > 500) {
      this.errorLogs = this.errorLogs.slice(0, 500);
    }
  }

  private sendNotification(alert: MonitoringAlert): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${alert.severity.toUpperCase()}: ${alert.source}`, {
        body: alert.message,
        icon: '/alert-icon.png',
        tag: alert.id
      });
    }
    
    console.error('Critical Alert:', alert);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring-session-id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('monitoring-session-id', sessionId);
    }
    return sessionId;
  }

  private getComponentFromStack(stack?: string): string {
    if (!stack) return 'unknown';
    
    const componentMatch = stack.match(/at\s+(\w+)/);
    return componentMatch ? componentMatch[1] : 'unknown';
  }

  private generateFingerprint(message: string, file: string): string {
    return btoa(`${message}-${file}`).substr(0, 16);
  }

  // Public API methods
  getCodeMetrics(): CodeMetrics {
    return { ...this.metrics };
  }

  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  getAlerts(severity?: string): MonitoringAlert[] {
    if (severity) {
      return this.alerts.filter(a => a.severity === severity);
    }
    return [...this.alerts];
  }

  getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  getErrorLogs(): ErrorTracking[] {
    return [...this.errorLogs];
  }

  getUXMetrics(): UserExperienceMetrics {
    return { ...this.uxMetrics };
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  resolveError(errorId: string): void {
    const error = this.errorLogs.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
    }
  }

  logCustomEvent(event: string, data?: any): void {
    console.log(`Custom Event: ${event}`, data);
    
    // Could be sent to analytics service
    if (data?.error) {
      this.createAlert({
        severity: 'warning',
        type: 'business',
        source: 'custom-event',
        message: `Custom event: ${event}`,
        details: { event, data },
        actions: ['Review event details', 'Check business logic']
      });
    }
  }

  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler);
      this.errorHandler = undefined;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = undefined;
    }
  }
}

export default CodeQualityMonitor;
export {
  CodeQualityMonitor,
  type CodeMetrics,
  type PerformanceMetric,
  type MonitoringAlert,
  type HealthCheck,
  type ErrorTracking,
  type UserExperienceMetrics,
  type SecurityVulnerability
};