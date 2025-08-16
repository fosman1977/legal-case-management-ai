/**
 * ENTERPRISE WORKER POOL
 * Multi-worker processing system for enterprise-scale document processing
 * 
 * Status: Phase 1, Week 1 - Core enterprise architecture
 * Purpose: Distribute processing load across multiple workers for 1000+ document processing
 * Integration: Works with enterprise-queue.ts and resource-monitor.ts
 */

import { EventEmitter } from 'events';
import { resourceMonitor } from '../core/resource-monitor';

export interface WorkerConfiguration {
  type: WorkerType;
  maxConcurrency: number;
  memoryLimit: number;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  healthCheckInterval: number;
}

export interface WorkerPoolConfig {
  maxWorkers: number;
  workerTypes: WorkerConfiguration[];
  loadBalancingStrategy: 'round_robin' | 'least_loaded' | 'capability_based';
  healthMonitoringEnabled: boolean;
  autoScaling: AutoScalingConfig;
  resourceThresholds: ResourceThresholds;
}

export interface AutoScalingConfig {
  enabled: boolean;
  minWorkers: number;
  maxWorkers: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
}

export interface ResourceThresholds {
  memoryWarning: number;
  memoryCritical: number;
  cpuWarning: number;
  cpuCritical: number;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export enum WorkerType {
  DOCUMENT_PROCESSOR = 'document_processor',
  LEGAL_ANALYZER = 'legal_analyzer',
  SEARCH_INDEXER = 'search_indexer',
  CROSS_DOCUMENT_ANALYZER = 'cross_document_analyzer',
  ENTITY_RESOLVER = 'entity_resolver',
  TIMELINE_ANALYZER = 'timeline_analyzer'
}

export enum WorkerStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  SHUTDOWN = 'shutdown',
  INITIALIZING = 'initializing'
}

export interface Worker {
  id: string;
  type: WorkerType;
  status: WorkerStatus;
  currentTask: string | null;
  capabilities: string[];
  performance: WorkerPerformance;
  health: WorkerHealth;
  createdAt: Date;
  lastHeartbeat: Date;
}

export interface WorkerPerformance {
  tasksCompleted: number;
  tasksFailed: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  memoryUsageAverage: number;
  memoryUsagePeak: number;
  throughput: number; // tasks per minute
  efficiency: number; // 0.0-1.0 score
}

export interface WorkerHealth {
  score: number; // 0.0-1.0 health score
  factors: HealthFactor[];
  lastCheck: Date;
  consecutiveFailures: number;
  lastError: string | null;
  memoryLeakDetected: boolean;
  responsiveness: number; // ms response time
}

export interface HealthFactor {
  factor: string;
  impact: number; // -1.0 to 1.0
  description: string;
}

export interface WorkerTask {
  id: string;
  type: string;
  priority: number;
  data: any;
  assignedAt: Date;
  timeout: number;
  retryCount: number;
  maxRetries: number;
}

export interface PoolStatistics {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  errorWorkers: number;
  totalTasksProcessed: number;
  totalTasksFailed: number;
  averageProcessingTime: number;
  currentThroughput: number;
  memoryUsage: PoolMemoryUsage;
  cpuUsage: number;
  healthScore: number;
}

export interface PoolMemoryUsage {
  total: number;
  peak: number;
  average: number;
  byWorkerType: Map<WorkerType, number>;
}

export class EnterpriseWorkerPool extends EventEmitter {
  private workers: Map<string, Worker> = new Map();
  private workerConfigs: Map<WorkerType, WorkerConfiguration> = new Map();
  private taskQueue: WorkerTask[] = [];
  private poolConfig: WorkerPoolConfig;
  private running: boolean = false;
  private healthMonitorInterval: NodeJS.Timeout | null = null;
  private autoScalingInterval: NodeJS.Timeout | null = null;
  private lastScaleAction: Date = new Date();

  private statistics: PoolStatistics = {
    totalWorkers: 0,
    activeWorkers: 0,
    idleWorkers: 0,
    errorWorkers: 0,
    totalTasksProcessed: 0,
    totalTasksFailed: 0,
    averageProcessingTime: 0,
    currentThroughput: 0,
    memoryUsage: {
      total: 0,
      peak: 0,
      average: 0,
      byWorkerType: new Map()
    },
    cpuUsage: 0,
    healthScore: 1.0
  };

  constructor(config: Partial<WorkerPoolConfig> = {}) {
    super();

    this.poolConfig = {
      maxWorkers: config.maxWorkers || this.calculateOptimalWorkerCount(),
      workerTypes: config.workerTypes || this.getDefaultWorkerConfigurations(),
      loadBalancingStrategy: config.loadBalancingStrategy || 'least_loaded',
      healthMonitoringEnabled: config.healthMonitoringEnabled !== false,
      autoScaling: config.autoScaling || {
        enabled: true,
        minWorkers: 2,
        maxWorkers: 12,
        scaleUpThreshold: 0.8,
        scaleDownThreshold: 0.3,
        scaleUpCooldown: 60000,
        scaleDownCooldown: 300000
      },
      resourceThresholds: config.resourceThresholds || {
        memoryWarning: 0.7,
        memoryCritical: 0.85,
        cpuWarning: 0.8,
        cpuCritical: 0.95
      }
    };

    // Initialize worker configurations
    this.poolConfig.workerTypes.forEach(config => {
      this.workerConfigs.set(config.type, config);
    });

    console.log(`🏗️ Enterprise Worker Pool initialized with max ${this.poolConfig.maxWorkers} workers`);
  }

  /**
   * Start the worker pool with initial workers
   */
  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    console.log('🚀 Starting Enterprise Worker Pool...');

    // Create initial workers
    await this.createInitialWorkers();

    // Start health monitoring
    if (this.poolConfig.healthMonitoringEnabled) {
      this.startHealthMonitoring();
    }

    // Start auto-scaling if enabled
    if (this.poolConfig.autoScaling.enabled) {
      this.startAutoScaling();
    }

    // Listen for resource monitor events
    if (resourceMonitor) {
      resourceMonitor.on('resourceAlert', this.handleResourceAlert.bind(this));
    }

    this.emit('poolStarted', this.getPoolStatistics());
    console.log(`✅ Worker pool started with ${this.workers.size} workers`);
  }

  /**
   * Stop the worker pool gracefully
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    console.log('🛑 Stopping Enterprise Worker Pool...');
    this.running = false;

    // Stop monitoring intervals
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
      this.healthMonitorInterval = null;
    }

    if (this.autoScalingInterval) {
      clearInterval(this.autoScalingInterval);
      this.autoScalingInterval = null;
    }

    // Gracefully shutdown all workers
    const shutdownPromises = Array.from(this.workers.values()).map(worker => 
      this.shutdownWorker(worker.id)
    );

    await Promise.all(shutdownPromises);

    this.workers.clear();
    this.taskQueue = [];

    this.emit('poolStopped');
    console.log('✅ Worker pool stopped');
  }

  /**
   * Assign a task to the best available worker
   */
  async assignTask(task: WorkerTask): Promise<string | null> {
    if (!this.running) {
      throw new Error('Worker pool is not running');
    }

    // Find the best worker for this task
    const worker = this.findBestWorkerForTask(task);
    
    if (!worker) {
      // Queue the task if no worker available
      this.taskQueue.push(task);
      this.emit('taskQueued', { taskId: task.id, queueLength: this.taskQueue.length });
      console.log(`📋 Task queued: ${task.id} (queue length: ${this.taskQueue.length})`);
      
      // Try to scale up if auto-scaling is enabled
      if (this.poolConfig.autoScaling.enabled) {
        await this.checkAutoScaling();
      }
      
      return null;
    }

    // Assign task to worker
    await this.assignTaskToWorker(worker, task);
    return worker.id;
  }

  /**
   * Get current pool statistics
   */
  getPoolStatistics(): PoolStatistics {
    this.updateStatistics();
    return { ...this.statistics };
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId: string): Worker | undefined {
    return this.workers.get(workerId);
  }

  /**
   * Get all workers of a specific type
   */
  getWorkersByType(type: WorkerType): Worker[] {
    return Array.from(this.workers.values()).filter(worker => worker.type === type);
  }

  /**
   * Scale the pool to a specific size
   */
  async scalePool(targetSize: number): Promise<void> {
    const currentSize = this.workers.size;
    
    if (targetSize === currentSize) {
      return;
    }

    if (targetSize > currentSize) {
      // Scale up
      const workersToAdd = targetSize - currentSize;
      const promises = [];
      
      for (let i = 0; i < workersToAdd; i++) {
        promises.push(this.createWorker(this.selectWorkerTypeForScaling()));
      }
      
      await Promise.all(promises);
      console.log(`📈 Scaled up pool to ${this.workers.size} workers`);
    } else {
      // Scale down
      const workersToRemove = currentSize - targetSize;
      const workersToShutdown = this.selectWorkersForShutdown(workersToRemove);
      
      const promises = workersToShutdown.map(worker => this.shutdownWorker(worker.id));
      await Promise.all(promises);
      console.log(`📉 Scaled down pool to ${this.workers.size} workers`);
    }

    this.emit('poolScaled', { previousSize: currentSize, newSize: this.workers.size });
  }

  /**
   * Force restart a worker
   */
  async restartWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    const workerType = worker.type;
    await this.shutdownWorker(workerId);
    const newWorker = await this.createWorker(workerType);
    
    console.log(`🔄 Restarted worker: ${workerId} -> ${newWorker.id}`);
    this.emit('workerRestarted', { oldWorkerId: workerId, newWorkerId: newWorker.id });
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { length: number; tasks: WorkerTask[] } {
    return {
      length: this.taskQueue.length,
      tasks: [...this.taskQueue]
    };
  }

  // Private methods

  private async createInitialWorkers(): Promise<void> {
    const minWorkers = this.poolConfig.autoScaling.minWorkers;
    const promises = [];

    // Create at least one worker of each type
    for (const config of this.poolConfig.workerTypes) {
      promises.push(this.createWorker(config.type));
    }

    // Fill up to minimum worker count
    const additionalWorkers = Math.max(0, minWorkers - this.poolConfig.workerTypes.length);
    for (let i = 0; i < additionalWorkers; i++) {
      promises.push(this.createWorker(WorkerType.DOCUMENT_PROCESSOR));
    }

    await Promise.all(promises);
  }

  private async createWorker(type: WorkerType): Promise<Worker> {
    const workerId = `worker-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const config = this.workerConfigs.get(type);
    
    if (!config) {
      throw new Error(`No configuration found for worker type: ${type}`);
    }

    const worker: Worker = {
      id: workerId,
      type,
      status: WorkerStatus.INITIALIZING,
      currentTask: null,
      capabilities: this.getWorkerCapabilities(type),
      performance: {
        tasksCompleted: 0,
        tasksFailed: 0,
        averageProcessingTime: 0,
        totalProcessingTime: 0,
        memoryUsageAverage: 0,
        memoryUsagePeak: 0,
        throughput: 0,
        efficiency: 1.0
      },
      health: {
        score: 1.0,
        factors: [],
        lastCheck: new Date(),
        consecutiveFailures: 0,
        lastError: null,
        memoryLeakDetected: false,
        responsiveness: 0
      },
      createdAt: new Date(),
      lastHeartbeat: new Date()
    };

    // Initialize worker (placeholder for actual worker initialization)
    await this.initializeWorker(worker, config);

    this.workers.set(workerId, worker);
    this.emit('workerCreated', worker);
    
    console.log(`👷 Created ${type} worker: ${workerId}`);
    return worker;
  }

  private async initializeWorker(worker: Worker, config: WorkerConfiguration): Promise<void> {
    // Placeholder for actual worker initialization
    // In a real implementation, this would:
    // 1. Set up worker process or thread
    // 2. Initialize worker capabilities
    // 3. Establish communication channels
    // 4. Run health checks
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate initialization
    worker.status = WorkerStatus.IDLE;
  }

  private async shutdownWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return;
    }

    worker.status = WorkerStatus.SHUTDOWN;
    
    // If worker has a current task, try to reassign it
    if (worker.currentTask) {
      const task = this.findTaskById(worker.currentTask);
      if (task) {
        this.taskQueue.push(task);
      }
    }

    // Cleanup worker resources
    await this.cleanupWorker(worker);
    
    this.workers.delete(workerId);
    this.emit('workerShutdown', { workerId, type: worker.type });
    
    console.log(`🗑️ Shutdown worker: ${workerId}`);
  }

  private async cleanupWorker(worker: Worker): Promise<void> {
    // Placeholder for worker cleanup
    // In a real implementation, this would:
    // 1. Terminate worker process/thread
    // 2. Clean up memory allocations
    // 3. Close communication channels
    // 4. Update worker database records
    
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate cleanup
  }

  private findBestWorkerForTask(task: WorkerTask): Worker | null {
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => 
        worker.status === WorkerStatus.IDLE && 
        this.workerCanHandleTask(worker, task)
      );

    if (availableWorkers.length === 0) {
      return null;
    }

    // Apply load balancing strategy
    switch (this.poolConfig.loadBalancingStrategy) {
      case 'round_robin':
        return this.selectWorkerRoundRobin(availableWorkers);
      case 'least_loaded':
        return this.selectLeastLoadedWorker(availableWorkers);
      case 'capability_based':
        return this.selectBestCapabilityWorker(availableWorkers, task);
      default:
        return availableWorkers[0];
    }
  }

  private workerCanHandleTask(worker: Worker, task: WorkerTask): boolean {
    // Check if worker type matches task requirements
    const taskTypeMapping: Record<string, WorkerType[]> = {
      'document_extraction': [WorkerType.DOCUMENT_PROCESSOR],
      'legal_analysis': [WorkerType.LEGAL_ANALYZER],
      'cross_document': [WorkerType.CROSS_DOCUMENT_ANALYZER],
      'search_indexing': [WorkerType.SEARCH_INDEXER],
      'entity_resolution': [WorkerType.ENTITY_RESOLVER],
      'timeline_analysis': [WorkerType.TIMELINE_ANALYZER]
    };

    const compatibleTypes = taskTypeMapping[task.type] || [];
    return compatibleTypes.includes(worker.type);
  }

  private selectWorkerRoundRobin(workers: Worker[]): Worker {
    // Simple round-robin selection (would need state tracking in real implementation)
    return workers[0];
  }

  private selectLeastLoadedWorker(workers: Worker[]): Worker {
    return workers.reduce((least, current) => 
      current.performance.tasksCompleted < least.performance.tasksCompleted ? current : least
    );
  }

  private selectBestCapabilityWorker(workers: Worker[], task: WorkerTask): Worker {
    // Score workers based on their suitability for the task
    return workers.reduce((best, current) => {
      const currentScore = this.calculateWorkerTaskScore(current, task);
      const bestScore = this.calculateWorkerTaskScore(best, task);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateWorkerTaskScore(worker: Worker, task: WorkerTask): number {
    // Calculate a score based on:
    // - Worker health
    // - Worker performance history
    // - Worker type compatibility
    // - Current load
    
    let score = worker.health.score * 0.4; // Health weight: 40%
    score += worker.performance.efficiency * 0.3; // Efficiency weight: 30%
    score += (1 - (worker.performance.tasksCompleted / 100)) * 0.2; // Load weight: 20%
    score += (task.priority / 5) * 0.1; // Priority weight: 10%
    
    return Math.max(0, Math.min(1, score));
  }

  private async assignTaskToWorker(worker: Worker, task: WorkerTask): Promise<void> {
    worker.status = WorkerStatus.BUSY;
    worker.currentTask = task.id;
    worker.lastHeartbeat = new Date();

    this.emit('taskAssigned', { workerId: worker.id, taskId: task.id });
    
    console.log(`⚡ Assigned task ${task.id} to worker ${worker.id}`);

    // Simulate task processing (in real implementation, this would delegate to actual worker)
    this.processTaskInWorker(worker, task);
  }

  private async processTaskInWorker(worker: Worker, task: WorkerTask): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate task processing time based on task type
      const processingTime = this.estimateTaskProcessingTime(task);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Update worker performance
      const actualTime = Date.now() - startTime;
      this.updateWorkerPerformance(worker, actualTime, true);
      
      worker.status = WorkerStatus.IDLE;
      worker.currentTask = null;
      
      this.emit('taskCompleted', { 
        workerId: worker.id, 
        taskId: task.id, 
        processingTime: actualTime 
      });
      
      console.log(`✅ Task ${task.id} completed by worker ${worker.id} in ${actualTime}ms`);
      
      // Process next queued task if available
      this.processNextQueuedTask();
      
    } catch (error) {
      // Handle task failure
      this.updateWorkerPerformance(worker, Date.now() - startTime, false);
      worker.health.consecutiveFailures++;
      worker.health.lastError = (error as Error).message;
      worker.status = WorkerStatus.ERROR;
      worker.currentTask = null;
      
      this.emit('taskFailed', { 
        workerId: worker.id, 
        taskId: task.id, 
        error: (error as Error).message 
      });
      
      console.error(`❌ Task ${task.id} failed in worker ${worker.id}: ${(error as Error).message}`);
      
      // Consider restarting worker if too many failures
      if (worker.health.consecutiveFailures >= 3) {
        await this.restartWorker(worker.id);
      }
    }
  }

  private updateWorkerPerformance(worker: Worker, processingTime: number, success: boolean): void {
    if (success) {
      worker.performance.tasksCompleted++;
      worker.health.consecutiveFailures = 0;
    } else {
      worker.performance.tasksFailed++;
    }
    
    worker.performance.totalProcessingTime += processingTime;
    worker.performance.averageProcessingTime = 
      worker.performance.totalProcessingTime / 
      (worker.performance.tasksCompleted + worker.performance.tasksFailed);
    
    // Update efficiency score
    const totalTasks = worker.performance.tasksCompleted + worker.performance.tasksFailed;
    worker.performance.efficiency = totalTasks > 0 ? 
      worker.performance.tasksCompleted / totalTasks : 1.0;
    
    // Update health score based on recent performance
    this.updateWorkerHealth(worker);
  }

  private updateWorkerHealth(worker: Worker): void {
    const factors: HealthFactor[] = [];
    
    // Performance factor
    factors.push({
      factor: 'performance',
      impact: worker.performance.efficiency * 0.4,
      description: `Task success rate: ${(worker.performance.efficiency * 100).toFixed(1)}%`
    });
    
    // Responsiveness factor
    const responsivenessScore = Math.max(0, 1 - (worker.health.responsiveness / 1000));
    factors.push({
      factor: 'responsiveness',
      impact: responsivenessScore * 0.3,
      description: `Response time: ${worker.health.responsiveness}ms`
    });
    
    // Failure rate factor
    const failureImpact = Math.max(-0.5, -worker.health.consecutiveFailures * 0.1);
    factors.push({
      factor: 'failures',
      impact: failureImpact,
      description: `Consecutive failures: ${worker.health.consecutiveFailures}`
    });
    
    // Calculate overall health score
    worker.health.factors = factors;
    worker.health.score = Math.max(0.1, Math.min(1.0, 
      factors.reduce((sum, factor) => sum + factor.impact, 0.5)
    ));
    worker.health.lastCheck = new Date();
  }

  private processNextQueuedTask(): void {
    if (this.taskQueue.length === 0) {
      return;
    }
    
    const task = this.taskQueue.shift();
    if (task) {
      this.assignTask(task);
    }
  }

  private findTaskById(taskId: string): WorkerTask | undefined {
    return this.taskQueue.find(task => task.id === taskId);
  }

  private estimateTaskProcessingTime(task: WorkerTask): number {
    // Estimate processing time based on task type and priority
    const baseTime = {
      'document_extraction': 5000,
      'legal_analysis': 15000,
      'cross_document': 10000,
      'search_indexing': 3000,
      'entity_resolution': 8000,
      'timeline_analysis': 6000
    };
    
    const baseTimeMap = baseTime as Record<string, number>;
    const base = baseTimeMap[task.type] || 5000;
    const priorityMultiplier = 1 + (task.priority / 10); // Higher priority = more thorough processing
    
    return base * priorityMultiplier;
  }

  private startHealthMonitoring(): void {
    this.healthMonitorInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check health every 30 seconds
  }

  private performHealthChecks(): void {
    for (const worker of this.workers.values()) {
      this.updateWorkerHealth(worker);
      
      // Check for unresponsive workers
      const timeSinceHeartbeat = Date.now() - worker.lastHeartbeat.getTime();
      if (timeSinceHeartbeat > 120000 && worker.status === WorkerStatus.BUSY) {
        // Worker hasn't responded in 2 minutes
        console.warn(`⚠️ Worker ${worker.id} appears unresponsive`);
        this.restartWorker(worker.id);
      }
    }
    
    this.updateStatistics();
    this.emit('healthCheckCompleted', this.getPoolStatistics());
  }

  private startAutoScaling(): void {
    this.autoScalingInterval = setInterval(() => {
      this.checkAutoScaling();
    }, 60000); // Check auto-scaling every minute
  }

  private async checkAutoScaling(): Promise<void> {
    const now = new Date();
    const config = this.poolConfig.autoScaling;
    
    // Check cooldown periods
    const timeSinceLastScale = now.getTime() - this.lastScaleAction.getTime();
    
    const currentLoad = this.calculateCurrentLoad();
    const currentSize = this.workers.size;
    
    // Scale up conditions
    if (currentLoad > config.scaleUpThreshold && 
        currentSize < config.maxWorkers &&
        timeSinceLastScale > config.scaleUpCooldown) {
      
      const newSize = Math.min(config.maxWorkers, currentSize + 1);
      await this.scalePool(newSize);
      this.lastScaleAction = now;
      
      console.log(`📈 Auto-scaled up due to high load: ${currentLoad.toFixed(2)}`);
    }
    
    // Scale down conditions
    else if (currentLoad < config.scaleDownThreshold && 
             currentSize > config.minWorkers &&
             timeSinceLastScale > config.scaleDownCooldown) {
      
      const newSize = Math.max(config.minWorkers, currentSize - 1);
      await this.scalePool(newSize);
      this.lastScaleAction = now;
      
      console.log(`📉 Auto-scaled down due to low load: ${currentLoad.toFixed(2)}`);
    }
  }

  private calculateCurrentLoad(): number {
    const totalWorkers = this.workers.size;
    const busyWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === WorkerStatus.BUSY).length;
    
    if (totalWorkers === 0) return 0;
    
    const workerLoad = busyWorkers / totalWorkers;
    const queueLoad = Math.min(1, this.taskQueue.length / totalWorkers);
    
    return Math.max(workerLoad, queueLoad);
  }

  private selectWorkerTypeForScaling(): WorkerType {
    // Select worker type based on current demand and queue composition
    const taskTypes = this.taskQueue.map(task => task.type);
    const typeCounts = taskTypes.reduce((counts, type) => {
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    // Find the most needed worker type
    const maxType = Object.keys(typeCounts).reduce((max, type) => 
      typeCounts[type] > (typeCounts[max] || 0) ? type : max, 
      'document_extraction'
    );
    
    const typeMapping: Record<string, WorkerType> = {
      'document_extraction': WorkerType.DOCUMENT_PROCESSOR,
      'legal_analysis': WorkerType.LEGAL_ANALYZER,
      'cross_document': WorkerType.CROSS_DOCUMENT_ANALYZER,
      'search_indexing': WorkerType.SEARCH_INDEXER,
      'entity_resolution': WorkerType.ENTITY_RESOLVER,
      'timeline_analysis': WorkerType.TIMELINE_ANALYZER
    };
    
    return typeMapping[maxType] || WorkerType.DOCUMENT_PROCESSOR;
  }

  private selectWorkersForShutdown(count: number): Worker[] {
    // Select workers for shutdown based on health, performance, and load
    const candidates = Array.from(this.workers.values())
      .filter(worker => worker.status === WorkerStatus.IDLE)
      .sort((a, b) => {
        // Prioritize workers with lower health scores and poor performance
        const aScore = a.health.score * a.performance.efficiency;
        const bScore = b.health.score * b.performance.efficiency;
        return aScore - bScore;
      });
    
    return candidates.slice(0, count);
  }

  private handleResourceAlert(alert: any): void {
    console.warn(`⚠️ Resource alert received: ${alert.message}`);
    
    if (alert.level === 'critical' || alert.level === 'emergency') {
      // Reduce worker pool size to conserve resources
      const currentSize = this.workers.size;
      const targetSize = Math.max(
        this.poolConfig.autoScaling.minWorkers,
        Math.floor(currentSize * 0.7)
      );
      
      if (targetSize < currentSize) {
        console.log(`🚨 Scaling down due to resource alert: ${currentSize} -> ${targetSize}`);
        this.scalePool(targetSize);
      }
    }
  }

  private updateStatistics(): void {
    const workers = Array.from(this.workers.values());
    
    this.statistics.totalWorkers = workers.length;
    this.statistics.activeWorkers = workers.filter(w => w.status === WorkerStatus.BUSY).length;
    this.statistics.idleWorkers = workers.filter(w => w.status === WorkerStatus.IDLE).length;
    this.statistics.errorWorkers = workers.filter(w => w.status === WorkerStatus.ERROR).length;
    
    this.statistics.totalTasksProcessed = workers.reduce(
      (sum, w) => sum + w.performance.tasksCompleted, 0
    );
    this.statistics.totalTasksFailed = workers.reduce(
      (sum, w) => sum + w.performance.tasksFailed, 0
    );
    
    if (workers.length > 0) {
      this.statistics.averageProcessingTime = workers.reduce(
        (sum, w) => sum + w.performance.averageProcessingTime, 0
      ) / workers.length;
      
      this.statistics.healthScore = workers.reduce(
        (sum, w) => sum + w.health.score, 0
      ) / workers.length;
    }
    
    // Update memory usage by worker type
    this.statistics.memoryUsage.byWorkerType.clear();
    for (const worker of workers) {
      const current = this.statistics.memoryUsage.byWorkerType.get(worker.type) || 0;
      this.statistics.memoryUsage.byWorkerType.set(
        worker.type, 
        current + worker.performance.memoryUsageAverage
      );
    }
  }

  private calculateOptimalWorkerCount(): number {
    // Calculate optimal worker count based on system resources
    const cpuCores = typeof navigator !== 'undefined' ? 
      navigator.hardwareConcurrency || 4 : 4;
    
    // Conservative approach: 1.5x CPU cores for I/O bound tasks
    return Math.max(2, Math.min(12, Math.floor(cpuCores * 1.5)));
  }

  private getDefaultWorkerConfigurations(): WorkerConfiguration[] {
    const defaultRetryPolicy: RetryPolicy = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2
    };

    return [
      {
        type: WorkerType.DOCUMENT_PROCESSOR,
        maxConcurrency: 4,
        memoryLimit: 512 * 1024 * 1024, // 512MB
        timeoutMs: 300000, // 5 minutes
        retryPolicy: defaultRetryPolicy,
        healthCheckInterval: 30000
      },
      {
        type: WorkerType.LEGAL_ANALYZER,
        maxConcurrency: 2,
        memoryLimit: 256 * 1024 * 1024, // 256MB
        timeoutMs: 180000, // 3 minutes
        retryPolicy: defaultRetryPolicy,
        healthCheckInterval: 30000
      },
      {
        type: WorkerType.SEARCH_INDEXER,
        maxConcurrency: 2,
        memoryLimit: 128 * 1024 * 1024, // 128MB
        timeoutMs: 120000, // 2 minutes
        retryPolicy: defaultRetryPolicy,
        healthCheckInterval: 30000
      }
    ];
  }

  private getWorkerCapabilities(type: WorkerType): string[] {
    const capabilities: Record<WorkerType, string[]> = {
      [WorkerType.DOCUMENT_PROCESSOR]: [
        'pdf_extraction', 'word_processing', 'excel_processing', 
        'ocr_processing', 'table_extraction', 'entity_extraction'
      ],
      [WorkerType.LEGAL_ANALYZER]: [
        'legal_entity_analysis', 'case_analysis', 'legal_reasoning',
        'precedent_analysis', 'evidence_evaluation'
      ],
      [WorkerType.SEARCH_INDEXER]: [
        'full_text_indexing', 'semantic_indexing', 'faceted_search',
        'incremental_indexing'
      ],
      [WorkerType.CROSS_DOCUMENT_ANALYZER]: [
        'entity_resolution', 'document_relationships', 'timeline_construction',
        'knowledge_graph_building'
      ],
      [WorkerType.ENTITY_RESOLVER]: [
        'entity_clustering', 'entity_disambiguation', 'entity_linking',
        'entity_validation'
      ],
      [WorkerType.TIMELINE_ANALYZER]: [
        'event_extraction', 'timeline_construction', 'temporal_reasoning',
        'deadline_identification'
      ]
    };

    return capabilities[type] || [];
  }
}

// Export default configured worker pool
export const enterpriseWorkerPool = new EnterpriseWorkerPool({
  autoScaling: {
    enabled: true,
    minWorkers: 2,
    maxWorkers: 8,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.3,
    scaleUpCooldown: 60000,
    scaleDownCooldown: 300000
  },
  healthMonitoringEnabled: true,
  loadBalancingStrategy: 'least_loaded'
});

console.log('👷 Enterprise Worker Pool module loaded');