/**
 * Fail-Safe Service
 * Enterprise-grade fallback mechanisms when AI services are unavailable
 */

interface ServiceStatus {
  serviceName: string;
  isAvailable: boolean;
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  lastError?: string;
  fallbackActive: boolean;
}

interface FallbackStrategy {
  serviceName: string;
  strategy: 'cache_only' | 'rules_based' | 'manual_entry' | 'queue_for_later' | 'hybrid';
  priority: number;
  description: string;
  reliability: number; // 0-1
  userMessage: string;
}

interface QueuedTask {
  id: string;
  type: 'entity_extraction' | 'document_analysis' | 'benchmark_test' | 'consensus_validation';
  payload: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  originalService: string;
  queuedAt: Date;
  retryCount: number;
  maxRetries: number;
  userNotified: boolean;
}

interface FailSafeConfiguration {
  healthCheckInterval: number; // ms
  maxRetries: number;
  retryDelay: number; // ms
  timeoutThreshold: number; // ms
  fallbackThreshold: number; // consecutive failures
  queueLimit: number;
  userNotificationEnabled: boolean;
}

export class FailSafeService {
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private fallbackStrategies: Map<string, FallbackStrategy[]> = new Map();
  private taskQueue: QueuedTask[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  private configuration: FailSafeConfiguration = {
    healthCheckInterval: 30000, // 30 seconds
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    timeoutThreshold: 10000, // 10 seconds
    fallbackThreshold: 3, // 3 consecutive failures
    queueLimit: 1000,
    userNotificationEnabled: true
  };

  constructor() {
    this.initializeServiceMonitoring();
    this.initializeFallbackStrategies();
  }

  /**
   * Initialize service monitoring and fallback strategies
   */
  private initializeServiceMonitoring(): void {
    console.log('🛡️ Initializing Fail-Safe Service...');
    
    // Initialize service statuses
    const services = [
      'localai-service',
      'blackstone-engine',
      'eyecite-engine',
      'legal-regex-engine',
      'spacy-legal-engine',
      'custom-uk-engine',
      'database-validator',
      'statistical-validator',
      'benchmark-service',
      'cache-service'
    ];
    
    services.forEach(service => {
      this.serviceStatuses.set(service, {
        serviceName: service,
        isAvailable: true,
        lastCheck: new Date(),
        responseTime: 0,
        errorCount: 0,
        fallbackActive: false
      });
    });
    
    this.startHealthChecks();
    console.log('✅ Fail-safe monitoring initialized for', services.length, 'services');
  }

  /**
   * Initialize fallback strategies for each service
   */
  private initializeFallbackStrategies(): void {
    // LocalAI Service fallbacks
    this.fallbackStrategies.set('localai-service', [
      {
        serviceName: 'localai-service',
        strategy: 'cache_only',
        priority: 1,
        description: 'Use cached AI results only',
        reliability: 0.8,
        userMessage: 'Using cached AI results while LocalAI service is unavailable'
      },
      {
        serviceName: 'localai-service',
        strategy: 'rules_based',
        priority: 2,
        description: 'Fall back to rules-based engines only',
        reliability: 0.9,
        userMessage: 'Using rules-based processing - AI enhancement unavailable'
      },
      {
        serviceName: 'localai-service',
        strategy: 'queue_for_later',
        priority: 3,
        description: 'Queue AI tasks for when service returns',
        reliability: 0.95,
        userMessage: 'AI processing queued - will complete when service is restored'
      }
    ]);

    // Engine-specific fallbacks
    const engines = ['blackstone-engine', 'eyecite-engine', 'legal-regex-engine', 'spacy-legal-engine'];
    engines.forEach(engine => {
      this.fallbackStrategies.set(engine, [
        {
          serviceName: engine,
          strategy: 'cache_only',
          priority: 1,
          description: 'Use cached results from this engine',
          reliability: 0.7,
          userMessage: `Using cached ${engine} results`
        },
        {
          serviceName: engine,
          strategy: 'hybrid',
          priority: 2,
          description: 'Use other available engines with adjusted consensus',
          reliability: 0.85,
          userMessage: `${engine} unavailable - using remaining engines`
        },
        {
          serviceName: engine,
          strategy: 'manual_entry',
          priority: 3,
          description: 'Allow manual entity entry',
          reliability: 0.95,
          userMessage: `Manual entry required - ${engine} temporarily unavailable`
        }
      ]);
    });

    // Benchmark service fallbacks
    this.fallbackStrategies.set('benchmark-service', [
      {
        serviceName: 'benchmark-service',
        strategy: 'cache_only',
        priority: 1,
        description: 'Use cached benchmark results',
        reliability: 0.6,
        userMessage: 'Showing cached benchmark results'
      },
      {
        serviceName: 'benchmark-service',
        strategy: 'queue_for_later',
        priority: 2,
        description: 'Queue benchmark tests for later execution',
        reliability: 0.9,
        userMessage: 'Benchmark tests queued for execution'
      }
    ]);

    // Cache service fallbacks
    this.fallbackStrategies.set('cache-service', [
      {
        serviceName: 'cache-service',
        strategy: 'manual_entry',
        priority: 1,
        description: 'Direct processing without caching',
        reliability: 0.8,
        userMessage: 'Processing without cache optimization'
      }
    ]);
  }

  /**
   * Start health checks for all services
   */
  private startHealthChecks(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
      this.processTaskQueue();
    }, this.configuration.healthCheckInterval);
    
    // Initial health check
    this.performHealthChecks();
  }

  /**
   * Perform health checks on all monitored services
   */
  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.serviceStatuses.keys()).map(service => 
      this.checkServiceHealth(service)
    );
    
    await Promise.allSettled(promises);
    
    // Log overall status
    const availableServices = Array.from(this.serviceStatuses.values()).filter(s => s.isAvailable).length;
    const totalServices = this.serviceStatuses.size;
    
    if (availableServices < totalServices) {
      console.log(`🛡️ Service Status: ${availableServices}/${totalServices} services available`);
    }
  }

  /**
   * Check health of a specific service
   */
  private async checkServiceHealth(serviceName: string): Promise<void> {
    const status = this.serviceStatuses.get(serviceName);
    if (!status) return;
    
    const startTime = Date.now();
    
    try {
      const isHealthy = await this.pingService(serviceName);
      const responseTime = Date.now() - startTime;
      
      if (isHealthy && responseTime < this.configuration.timeoutThreshold) {
        // Service is healthy
        if (!status.isAvailable) {
          console.log(`✅ Service ${serviceName} is back online`);
          await this.handleServiceRecovery(serviceName);
        }
        
        status.isAvailable = true;
        status.responseTime = responseTime;
        status.errorCount = 0;
        status.fallbackActive = false;
      } else {
        // Service is unhealthy
        status.errorCount++;
        
        if (status.errorCount >= this.configuration.fallbackThreshold) {
          if (status.isAvailable) {
            console.log(`❌ Service ${serviceName} marked as unavailable after ${status.errorCount} failures`);
            await this.activateFallback(serviceName);
          }
          status.isAvailable = false;
          status.fallbackActive = true;
        }
      }
      
      status.lastCheck = new Date();
      status.responseTime = responseTime;
      
    } catch (error) {
      status.errorCount++;
      status.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      if (status.errorCount >= this.configuration.fallbackThreshold && status.isAvailable) {
        console.log(`❌ Service ${serviceName} failed health check: ${status.lastError}`);
        await this.activateFallback(serviceName);
        status.isAvailable = false;
        status.fallbackActive = true;
      }
      
      status.lastCheck = new Date();
    }
  }

  /**
   * Ping a service to check if it's available
   */
  private async pingService(serviceName: string): Promise<boolean> {
    // Simulate service pinging (in production, would make actual health check calls)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate occasional service failures for testing
        const failureRate = serviceName.includes('test') ? 0.3 : 0.05;
        const isHealthy = Math.random() > failureRate;
        resolve(isHealthy);
      }, 100 + Math.random() * 200);
    });
  }

  /**
   * Activate fallback strategy for a service
   */
  private async activateFallback(serviceName: string): Promise<void> {
    const strategies = this.fallbackStrategies.get(serviceName);
    if (!strategies || strategies.length === 0) {
      console.log(`⚠️ No fallback strategy available for ${serviceName}`);
      return;
    }
    
    // Use the highest priority (lowest number) strategy
    const strategy = strategies.sort((a, b) => a.priority - b.priority)[0];
    
    console.log(`🔄 Activating fallback for ${serviceName}: ${strategy.description}`);
    
    // Notify users if enabled
    if (this.configuration.userNotificationEnabled) {
      this.notifyUsers(strategy.userMessage, 'warning');
    }
    
    // Implement strategy-specific logic
    await this.implementFallbackStrategy(serviceName, strategy);
  }

  /**
   * Implement specific fallback strategy
   */
  private async implementFallbackStrategy(serviceName: string, strategy: FallbackStrategy): Promise<void> {
    switch (strategy.strategy) {
      case 'cache_only':
        await this.enableCacheOnlyMode(serviceName);
        break;
      case 'rules_based':
        await this.enableRulesBasedMode(serviceName);
        break;
      case 'manual_entry':
        await this.enableManualEntryMode(serviceName);
        break;
      case 'queue_for_later':
        await this.enableQueueMode(serviceName);
        break;
      case 'hybrid':
        await this.enableHybridMode(serviceName);
        break;
    }
  }

  /**
   * Fallback strategy implementations
   */
  
  private async enableCacheOnlyMode(serviceName: string): Promise<void> {
    console.log(`💾 ${serviceName}: Cache-only mode activated`);
    // Implementation would configure services to only use cached results
  }

  private async enableRulesBasedMode(serviceName: string): Promise<void> {
    console.log(`📋 ${serviceName}: Rules-based mode activated`);
    // Implementation would disable AI processing and use only rules engines
  }

  private async enableManualEntryMode(serviceName: string): Promise<void> {
    console.log(`✏️ ${serviceName}: Manual entry mode activated`);
    // Implementation would show manual entry interfaces
  }

  private async enableQueueMode(serviceName: string): Promise<void> {
    console.log(`📤 ${serviceName}: Queue mode activated`);
    // Implementation would queue tasks for later processing
  }

  private async enableHybridMode(serviceName: string): Promise<void> {
    console.log(`🔄 ${serviceName}: Hybrid mode activated`);
    // Implementation would use alternative engines/methods
  }

  /**
   * Handle service recovery
   */
  private async handleServiceRecovery(serviceName: string): Promise<void> {
    const status = this.serviceStatuses.get(serviceName);
    if (!status) return;
    
    // Process queued tasks for this service
    const queuedTasks = this.taskQueue.filter(task => task.originalService === serviceName);
    
    if (queuedTasks.length > 0) {
      console.log(`🔄 Processing ${queuedTasks.length} queued tasks for ${serviceName}`);
      
      for (const task of queuedTasks) {
        try {
          await this.executeQueuedTask(task);
          this.removeFromQueue(task.id);
        } catch (error) {
          console.error(`❌ Failed to execute queued task ${task.id}:`, error);
        }
      }
    }
    
    // Notify users of recovery
    if (this.configuration.userNotificationEnabled) {
      this.notifyUsers(`${serviceName} is back online and functioning normally`, 'success');
    }
  }

  /**
   * Queue management
   */
  
  async queueTask(task: Omit<QueuedTask, 'id' | 'queuedAt' | 'retryCount' | 'userNotified'>): Promise<string> {
    if (this.taskQueue.length >= this.configuration.queueLimit) {
      throw new Error('Task queue is full');
    }
    
    const queuedTask: QueuedTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      queuedAt: new Date(),
      retryCount: 0,
      userNotified: false
    };
    
    this.taskQueue.push(queuedTask);
    
    console.log(`📤 Queued task ${queuedTask.id} for ${task.originalService}`);
    
    return queuedTask.id;
  }

  private async processTaskQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return;
    
    // Sort by priority and queue time
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return a.queuedAt.getTime() - b.queuedAt.getTime();
    });
    
    // Process tasks for available services
    const tasksToProcess = this.taskQueue.filter(task => {
      const status = this.serviceStatuses.get(task.originalService);
      return status?.isAvailable;
    });
    
    for (const task of tasksToProcess.slice(0, 5)) { // Process up to 5 tasks per cycle
      try {
        await this.executeQueuedTask(task);
        this.removeFromQueue(task.id);
      } catch (error) {
        task.retryCount++;
        
        if (task.retryCount >= task.maxRetries) {
          console.error(`❌ Task ${task.id} failed after ${task.retryCount} retries`);
          this.removeFromQueue(task.id);
        }
      }
    }
  }

  private async executeQueuedTask(task: QueuedTask): Promise<void> {
    console.log(`⚡ Executing queued task ${task.id} (${task.type})`);
    
    // Implementation would call the appropriate service based on task type
    switch (task.type) {
      case 'entity_extraction':
        // Call entity extraction service
        break;
      case 'document_analysis':
        // Call document analysis service
        break;
      case 'benchmark_test':
        // Call benchmark service
        break;
      case 'consensus_validation':
        // Call consensus validation
        break;
    }
  }

  private removeFromQueue(taskId: string): void {
    const index = this.taskQueue.findIndex(task => task.id === taskId);
    if (index >= 0) {
      this.taskQueue.splice(index, 1);
    }
  }

  /**
   * User notification system
   */
  
  private notifyUsers(message: string, type: 'info' | 'warning' | 'error' | 'success'): void {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅'
    };
    
    console.log(`${icons[type]} USER NOTIFICATION: ${message}`);
    
    // In production, would trigger actual user notifications
    // - Push notifications
    // - In-app banners
    // - Email alerts for critical issues
  }

  /**
   * Public API methods
   */
  
  getServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  getServiceStatus(serviceName: string): ServiceStatus | null {
    return this.serviceStatuses.get(serviceName) || null;
  }

  isServiceAvailable(serviceName: string): boolean {
    const status = this.serviceStatuses.get(serviceName);
    return status?.isAvailable ?? false;
  }

  getQueuedTasks(): QueuedTask[] {
    return [...this.taskQueue];
  }

  getQueueStatus(): {
    totalTasks: number;
    tasksByPriority: Record<string, number>;
    tasksByService: Record<string, number>;
    oldestTask?: Date;
  } {
    const tasksByPriority: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    const tasksByService: Record<string, number> = {};
    
    this.taskQueue.forEach(task => {
      tasksByPriority[task.priority]++;
      tasksByService[task.originalService] = (tasksByService[task.originalService] || 0) + 1;
    });
    
    const oldestTask = this.taskQueue.length > 0 
      ? this.taskQueue.reduce((oldest, task) => 
          task.queuedAt < oldest.queuedAt ? task : oldest
        ).queuedAt
      : undefined;
    
    return {
      totalTasks: this.taskQueue.length,
      tasksByPriority,
      tasksByService,
      oldestTask
    };
  }

  async forceRetryService(serviceName: string): Promise<boolean> {
    console.log(`🔄 Force retrying service ${serviceName}`);
    
    const status = this.serviceStatuses.get(serviceName);
    if (status) {
      status.errorCount = 0;
      await this.checkServiceHealth(serviceName);
      return status.isAvailable;
    }
    
    return false;
  }

  getFailSafeConfiguration(): FailSafeConfiguration {
    return { ...this.configuration };
  }

  updateFailSafeConfiguration(config: Partial<FailSafeConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
    console.log('⚙️ Updated fail-safe configuration');
  }

  getSystemReliability(): {
    overallReliability: number;
    criticalServicesOnline: number;
    totalCriticalServices: number;
    fallbacksActive: number;
    estimatedCapability: number;
  } {
    const criticalServices = ['localai-service', 'blackstone-engine', 'eyecite-engine'];
    const criticalOnline = criticalServices.filter(service => 
      this.serviceStatuses.get(service)?.isAvailable
    ).length;
    
    const totalServices = this.serviceStatuses.size;
    const onlineServices = Array.from(this.serviceStatuses.values()).filter(s => s.isAvailable).length;
    const fallbacksActive = Array.from(this.serviceStatuses.values()).filter(s => s.fallbackActive).length;
    
    const overallReliability = onlineServices / totalServices;
    const estimatedCapability = criticalOnline / criticalServices.length * 0.8 + 
                                (onlineServices - criticalOnline) / (totalServices - criticalServices.length) * 0.2;
    
    return {
      overallReliability,
      criticalServicesOnline: criticalOnline,
      totalCriticalServices: criticalServices.length,
      fallbacksActive,
      estimatedCapability
    };
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Fail-safe service monitoring stopped');
  }
}

// Export singleton instance
export const failSafeService = new FailSafeService();
export default failSafeService;