/**
 * BACKGROUND PROCESSING SERVICE
 * Enables document processing to continue when UI is inactive
 * 
 * Status: Phase 1, Week 2 - Distributed Processing
 * Purpose: Maintain processing continuity across browser sessions
 * Integration: Works with enterprise-queue.ts and streaming-processor.ts
 */

import { EventEmitter } from 'events';
import { EnterpriseProcessingQueue } from '../core/enterprise-queue';
import { StreamingDocumentProcessor } from '../core/streaming-processor';

export interface BackgroundServiceConfig {
  enablePersistence: boolean;
  enableAutoResume: boolean;
  checkpointInterval: number; // ms between state saves
  maxBackgroundTasks: number;
  priorityThreshold: number; // Only process tasks above this priority in background
  batteryAwareProcessing: boolean;
  networkAwareProcessing: boolean;
}

export interface BackgroundTask {
  id: string;
  type: 'document_processing' | 'legal_analysis' | 'indexing' | 'cross_document';
  priority: number;
  data: any;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  lastCheckpoint?: Date;
  checkpointData?: any;
  error?: string;
  retryCount: number;
  estimatedTimeRemaining?: number;
}

export interface BackgroundSession {
  id: string;
  startedAt: Date;
  lastActiveAt: Date;
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
  currentTask?: BackgroundTask;
  queuedTasks: BackgroundTask[];
  sessionState: 'active' | 'background' | 'suspended' | 'terminated';
  performanceMetrics: BackgroundPerformanceMetrics;
}

export interface BackgroundPerformanceMetrics {
  totalProcessingTime: number;
  backgroundProcessingTime: number;
  averageTaskTime: number;
  successRate: number;
  memoryEfficiency: number;
  batteryImpact: 'low' | 'medium' | 'high';
  networkUsage: number;
}

export interface BackgroundCheckpoint {
  taskId: string;
  timestamp: Date;
  progress: number;
  state: any;
  resumable: boolean;
  version: string;
}

export class BackgroundProcessingService extends EventEmitter {
  private config: BackgroundServiceConfig;
  private session: BackgroundSession | null = null;
  private queue: EnterpriseProcessingQueue;
  private streamingProcessor: StreamingDocumentProcessor;
  private serviceWorker: ServiceWorker | null = null;
  private localStorage: Storage | null = null;
  private checkpointTimer: NodeJS.Timeout | null = null;
  private visibilityHandler: (() => void) | null = null;
  private isBackground: boolean = false;
  private suspendedTasks: Map<string, BackgroundTask> = new Map();

  constructor(
    queue: EnterpriseProcessingQueue,
    streamingProcessor: StreamingDocumentProcessor,
    config: Partial<BackgroundServiceConfig> = {}
  ) {
    super();
    
    this.queue = queue;
    this.streamingProcessor = streamingProcessor;
    
    this.config = {
      enablePersistence: config.enablePersistence !== false,
      enableAutoResume: config.enableAutoResume !== false,
      checkpointInterval: config.checkpointInterval || 30000, // 30 seconds
      maxBackgroundTasks: config.maxBackgroundTasks || 5,
      priorityThreshold: config.priorityThreshold || 3, // MEDIUM priority
      batteryAwareProcessing: config.batteryAwareProcessing !== false,
      networkAwareProcessing: config.networkAwareProcessing !== false
    };

    this.initializeStorage();
    this.setupEventListeners();
    
    console.log('🌙 Background Processing Service initialized');
  }

  /**
   * Start background processing service
   */
  async start(): Promise<void> {
    console.log('🚀 Starting Background Processing Service...');
    
    // Create or restore session
    if (this.config.enablePersistence) {
      await this.restoreSession();
    }
    
    if (!this.session) {
      this.session = this.createNewSession();
    }
    
    // Register service worker if available
    if ('serviceWorker' in navigator && !this.serviceWorker) {
      await this.registerServiceWorker();
    }
    
    // Start checkpoint timer
    if (this.config.enablePersistence) {
      this.startCheckpointing();
    }
    
    // Setup visibility change detection
    this.setupVisibilityDetection();
    
    // Check for suspended tasks and resume if configured
    if (this.config.enableAutoResume) {
      await this.resumeSuspendedTasks();
    }
    
    this.emit('serviceStarted', this.session);
    console.log('✅ Background Processing Service started');
  }

  /**
   * Stop background processing service
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Background Processing Service...');
    
    // Save current state
    if (this.config.enablePersistence && this.session) {
      await this.saveSession();
    }
    
    // Suspend active tasks
    await this.suspendActiveTasks();
    
    // Stop checkpoint timer
    this.stopCheckpointing();
    
    // Cleanup event listeners
    this.cleanupEventListeners();
    
    // Unregister service worker
    if (this.serviceWorker) {
      await this.unregisterServiceWorker();
    }
    
    this.session = null;
    this.emit('serviceStopped');
    console.log('✅ Background Processing Service stopped');
  }

  /**
   * Add task for background processing
   */
  async addBackgroundTask(task: Omit<BackgroundTask, 'id' | 'status' | 'progress' | 'retryCount'>): Promise<string> {
    const backgroundTask: BackgroundTask = {
      ...task,
      id: `bg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0,
      retryCount: 0
    };
    
    // Check if should process in background based on priority
    if (task.priority < this.config.priorityThreshold) {
      console.log(`⏸️ Task priority too low for background processing: ${task.priority}`);
      return '';
    }
    
    // Check battery status if battery-aware
    if (this.config.batteryAwareProcessing) {
      const batteryOk = await this.checkBatteryStatus();
      if (!batteryOk) {
        console.log('🔋 Battery too low for background processing');
        return '';
      }
    }
    
    // Check network if network-aware
    if (this.config.networkAwareProcessing && task.type === 'legal_analysis') {
      const networkOk = await this.checkNetworkStatus();
      if (!networkOk) {
        console.log('📡 Network conditions not suitable for background processing');
        return '';
      }
    }
    
    // Add to session queue
    if (this.session) {
      this.session.queuedTasks.push(backgroundTask);
      this.session.tasksTotal++;
    }
    
    // If in background mode, start processing immediately
    if (this.isBackground) {
      this.processNextBackgroundTask();
    }
    
    console.log(`📋 Added background task: ${backgroundTask.id} (priority: ${task.priority})`);
    this.emit('taskAdded', backgroundTask);
    
    return backgroundTask.id;
  }

  /**
   * Process next background task
   */
  private async processNextBackgroundTask(): Promise<void> {
    if (!this.session || this.session.queuedTasks.length === 0) {
      return;
    }
    
    // Check if already processing maximum tasks
    const activeTasks = this.session.queuedTasks.filter(t => t.status === 'active').length;
    if (activeTasks >= this.config.maxBackgroundTasks) {
      return;
    }
    
    // Get next pending task
    const task = this.session.queuedTasks.find(t => t.status === 'pending');
    if (!task) {
      return;
    }
    
    console.log(`⚙️ Processing background task: ${task.id}`);
    task.status = 'active';
    task.startedAt = new Date();
    this.session.currentTask = task;
    
    try {
      // Process based on task type
      const result = await this.executeBackgroundTask(task);
      
      task.status = 'completed';
      task.completedAt = new Date();
      task.progress = 100;
      
      this.session.tasksCompleted++;
      
      console.log(`✅ Background task completed: ${task.id}`);
      this.emit('taskCompleted', { task, result });
      
      // Process next task
      this.processNextBackgroundTask();
      
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      task.retryCount++;
      
      this.session.tasksFailed++;
      
      console.error(`❌ Background task failed: ${task.id} - ${error.message}`);
      this.emit('taskFailed', { task, error: error.message });
      
      // Retry if under limit
      if (task.retryCount < 3) {
        task.status = 'pending';
        setTimeout(() => this.processNextBackgroundTask(), 5000 * task.retryCount);
      }
    }
  }

  /**
   * Execute a background task
   */
  private async executeBackgroundTask(task: BackgroundTask): Promise<any> {
    // Report progress periodically
    const progressInterval = setInterval(() => {
      task.progress = Math.min(task.progress + 10, 90);
      this.emit('taskProgress', { taskId: task.id, progress: task.progress });
    }, 2000);
    
    try {
      switch (task.type) {
        case 'document_processing':
          // Use streaming processor for memory efficiency
          const file = task.data.file;
          const result = await this.streamingProcessor.processDocumentStream(file, {
            maxMemoryUsage: 1024 * 1024 * 1024, // 1GB limit in background
            enableBackpressure: true,
            onProgress: (progress) => {
              task.progress = progress.percentage;
            }
          });
          return result;
          
        case 'legal_analysis':
          // Placeholder for legal analysis
          await this.simulateProcessing(10000);
          return { analysis: 'Legal analysis complete' };
          
        case 'indexing':
          // Placeholder for indexing
          await this.simulateProcessing(5000);
          return { indexed: true };
          
        case 'cross_document':
          // Placeholder for cross-document analysis
          await this.simulateProcessing(15000);
          return { relationships: [] };
          
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } finally {
      clearInterval(progressInterval);
    }
  }

  /**
   * Suspend active tasks when going to foreground
   */
  private async suspendActiveTasks(): Promise<void> {
    if (!this.session) return;
    
    const activeTasks = this.session.queuedTasks.filter(t => t.status === 'active');
    
    for (const task of activeTasks) {
      console.log(`⏸️ Suspending task: ${task.id}`);
      
      // Create checkpoint
      const checkpoint: BackgroundCheckpoint = {
        taskId: task.id,
        timestamp: new Date(),
        progress: task.progress,
        state: task.checkpointData || {},
        resumable: true,
        version: '1.0.0'
      };
      
      task.lastCheckpoint = checkpoint.timestamp;
      task.checkpointData = checkpoint.state;
      task.status = 'paused';
      
      this.suspendedTasks.set(task.id, task);
      
      // Save checkpoint
      if (this.config.enablePersistence) {
        await this.saveCheckpoint(checkpoint);
      }
      
      this.emit('taskSuspended', task);
    }
  }

  /**
   * Resume suspended tasks
   */
  private async resumeSuspendedTasks(): Promise<void> {
    console.log(`📥 Resuming ${this.suspendedTasks.size} suspended tasks`);
    
    for (const [taskId, task] of this.suspendedTasks) {
      // Load checkpoint if available
      if (this.config.enablePersistence) {
        const checkpoint = await this.loadCheckpoint(taskId);
        if (checkpoint) {
          task.progress = checkpoint.progress;
          task.checkpointData = checkpoint.state;
        }
      }
      
      task.status = 'pending';
      
      if (this.session) {
        this.session.queuedTasks.push(task);
      }
      
      console.log(`▶️ Resumed task: ${taskId} at ${task.progress}% progress`);
      this.emit('taskResumed', task);
    }
    
    this.suspendedTasks.clear();
    
    // Start processing if in background
    if (this.isBackground) {
      this.processNextBackgroundTask();
    }
  }

  /**
   * Setup visibility detection for background/foreground transitions
   */
  private setupVisibilityDetection(): void {
    this.visibilityHandler = () => {
      const wasBackground = this.isBackground;
      this.isBackground = document.hidden;
      
      if (!wasBackground && this.isBackground) {
        // Transitioned to background
        console.log('🌙 Entered background mode');
        this.onEnterBackground();
      } else if (wasBackground && !this.isBackground) {
        // Transitioned to foreground
        console.log('☀️ Entered foreground mode');
        this.onEnterForeground();
      }
    };
    
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * Handle entering background mode
   */
  private async onEnterBackground(): Promise<void> {
    if (!this.session) return;
    
    this.session.sessionState = 'background';
    
    // Start processing queued tasks
    this.processNextBackgroundTask();
    
    this.emit('enteredBackground');
  }

  /**
   * Handle entering foreground mode
   */
  private async onEnterForeground(): Promise<void> {
    if (!this.session) return;
    
    this.session.sessionState = 'active';
    
    // Suspend background tasks to give priority to foreground
    await this.suspendActiveTasks();
    
    this.emit('enteredForeground');
  }

  /**
   * Check battery status
   */
  private async checkBatteryStatus(): Promise<boolean> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        const level = battery.level;
        const charging = battery.charging;
        
        // Allow if charging or battery > 20%
        return charging || level > 0.2;
      } catch {
        return true; // Allow if can't check
      }
    }
    return true; // Allow if API not available
  }

  /**
   * Check network status
   */
  private async checkNetworkStatus(): Promise<boolean> {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection.effectiveType;
      
      // Allow if 3G or better
      return ['3g', '4g', '5g'].includes(effectiveType);
    }
    return true; // Allow if API not available
  }

  /**
   * Register service worker for background processing
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/background-worker.js');
      this.serviceWorker = registration.active || registration.installing || registration.waiting;
      console.log('✅ Service worker registered for background processing');
    } catch (error) {
      console.warn('⚠️ Could not register service worker:', error.message);
    }
  }

  /**
   * Unregister service worker
   */
  private async unregisterServiceWorker(): Promise<void> {
    if (this.serviceWorker) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        this.serviceWorker = null;
        console.log('✅ Service worker unregistered');
      } catch (error) {
        console.warn('⚠️ Could not unregister service worker:', error.message);
      }
    }
  }

  /**
   * Initialize storage for persistence
   */
  private initializeStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.localStorage = window.localStorage;
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Queue events
    this.queue.on('taskCompleted', (result) => {
      this.updateSessionMetrics();
    });
    
    this.queue.on('taskFailed', (result) => {
      this.updateSessionMetrics();
    });
  }

  /**
   * Cleanup event listeners
   */
  private cleanupEventListeners(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    
    this.queue.removeAllListeners();
  }

  /**
   * Start checkpointing timer
   */
  private startCheckpointing(): void {
    this.checkpointTimer = setInterval(() => {
      this.createCheckpoints();
    }, this.config.checkpointInterval);
  }

  /**
   * Stop checkpointing timer
   */
  private stopCheckpointing(): void {
    if (this.checkpointTimer) {
      clearInterval(this.checkpointTimer);
      this.checkpointTimer = null;
    }
  }

  /**
   * Create checkpoints for active tasks
   */
  private async createCheckpoints(): Promise<void> {
    if (!this.session) return;
    
    const activeTasks = this.session.queuedTasks.filter(t => t.status === 'active');
    
    for (const task of activeTasks) {
      const checkpoint: BackgroundCheckpoint = {
        taskId: task.id,
        timestamp: new Date(),
        progress: task.progress,
        state: task.checkpointData || {},
        resumable: true,
        version: '1.0.0'
      };
      
      await this.saveCheckpoint(checkpoint);
      task.lastCheckpoint = checkpoint.timestamp;
    }
  }

  /**
   * Save checkpoint to storage
   */
  private async saveCheckpoint(checkpoint: BackgroundCheckpoint): Promise<void> {
    if (!this.localStorage) return;
    
    const key = `checkpoint_${checkpoint.taskId}`;
    this.localStorage.setItem(key, JSON.stringify(checkpoint));
  }

  /**
   * Load checkpoint from storage
   */
  private async loadCheckpoint(taskId: string): Promise<BackgroundCheckpoint | null> {
    if (!this.localStorage) return null;
    
    const key = `checkpoint_${taskId}`;
    const data = this.localStorage.getItem(key);
    
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    
    return null;
  }

  /**
   * Save session to storage
   */
  private async saveSession(): Promise<void> {
    if (!this.localStorage || !this.session) return;
    
    const key = 'background_session';
    this.localStorage.setItem(key, JSON.stringify(this.session));
    console.log('💾 Session saved to storage');
  }

  /**
   * Restore session from storage
   */
  private async restoreSession(): Promise<void> {
    if (!this.localStorage) return;
    
    const key = 'background_session';
    const data = this.localStorage.getItem(key);
    
    if (data) {
      try {
        this.session = JSON.parse(data);
        console.log('📂 Session restored from storage');
      } catch (error) {
        console.warn('⚠️ Could not restore session:', error.message);
      }
    }
  }

  /**
   * Create new session
   */
  private createNewSession(): BackgroundSession {
    return {
      id: `session-${Date.now()}`,
      startedAt: new Date(),
      lastActiveAt: new Date(),
      tasksTotal: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      queuedTasks: [],
      sessionState: 'active',
      performanceMetrics: {
        totalProcessingTime: 0,
        backgroundProcessingTime: 0,
        averageTaskTime: 0,
        successRate: 0,
        memoryEfficiency: 0,
        batteryImpact: 'low',
        networkUsage: 0
      }
    };
  }

  /**
   * Update session metrics
   */
  private updateSessionMetrics(): void {
    if (!this.session) return;
    
    const metrics = this.session.performanceMetrics;
    const total = this.session.tasksCompleted + this.session.tasksFailed;
    
    if (total > 0) {
      metrics.successRate = this.session.tasksCompleted / total;
    }
    
    this.session.lastActiveAt = new Date();
  }

  /**
   * Simulate processing delay
   */
  private simulateProcessing(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current session
   */
  getSession(): BackgroundSession | null {
    return this.session;
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): BackgroundTask | undefined {
    if (!this.session) return undefined;
    
    return this.session.queuedTasks.find(t => t.id === taskId) ||
           this.suspendedTasks.get(taskId);
  }

  /**
   * Cancel a background task
   */
  cancelTask(taskId: string): boolean {
    if (!this.session) return false;
    
    const taskIndex = this.session.queuedTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = this.session.queuedTasks[taskIndex];
      
      if (task.status === 'pending' || task.status === 'paused') {
        this.session.queuedTasks.splice(taskIndex, 1);
        console.log(`🚫 Cancelled background task: ${taskId}`);
        this.emit('taskCancelled', task);
        return true;
      }
    }
    
    return false;
  }
}

// Export factory function
export function createBackgroundProcessor(
  queue: EnterpriseProcessingQueue,
  streamingProcessor: StreamingDocumentProcessor
): BackgroundProcessingService {
  return new BackgroundProcessingService(queue, streamingProcessor);
}

console.log('🌙 Background Processing Service module loaded');