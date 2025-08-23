import PQueue from 'p-queue';

export interface ProcessingTask {
  id: string;
  title: string;
  type: 'extraction' | 'ocr' | 'analysis' | 'upload';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: Error;
  createdAt: Date;
  completedAt?: Date;
}

export interface ProcessingProgress {
  taskId: string;
  progress: number;
  status: string;
  message?: string;
}

export type ProgressCallback = (progress: ProcessingProgress) => void;

class DocumentProcessingQueueManager {
  private queue: PQueue;
  private tasks: Map<string, ProcessingTask> = new Map();
  private progressCallbacks: Map<string, ProgressCallback[]> = new Map();
  private globalProgressCallback?: (tasks: ProcessingTask[]) => void;

  constructor() {
    this.queue = new PQueue({
      concurrency: 3, // Process 3 documents at once
      intervalCap: 5, // Max 5 operations per interval
      interval: 1000, // 1 second interval
      timeout: 300000, // 5 minute timeout per task
      throwOnTimeout: true
    });

    this.queue.on('active', () => {
      console.log(`📋 Queue active. Size: ${this.queue.size}, Pending: ${this.queue.pending}`);
    });

    this.queue.on('idle', () => {
      console.log('✅ Document processing queue is idle');
      this.notifyGlobalProgress();
    });

    this.queue.on('error', (error, task) => {
      console.error('❌ Queue error:', error);
    });
  }

  async addTask<T>(
    taskId: string,
    title: string,
    type: ProcessingTask['type'],
    processor: (onProgress: (progress: number, message?: string) => void) => Promise<T>,
    onProgress?: ProgressCallback
  ): Promise<T> {
    const task: ProcessingTask = {
      id: taskId,
      title,
      type,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.tasks.set(taskId, task);

    if (onProgress) {
      this.addProgressListener(taskId, onProgress);
    }

    return this.queue.add(async () => {
      try {
        // Update task status
        this.updateTask(taskId, { status: 'processing' });

        console.log(`🚀 Starting task: ${title}`);

        // Create progress handler
        const progressHandler = (progress: number, message?: string) => {
          this.updateTaskProgress(taskId, progress, message);
        };

        // Execute the processor
        const result = await processor(progressHandler);

        // Mark as completed
        this.updateTask(taskId, { 
          status: 'completed', 
          progress: 100,
          result,
          completedAt: new Date()
        });

        console.log(`✅ Completed task: ${title}`);
        return result;

      } catch (error) {
        console.error(`❌ Failed task: ${title}`, error);
        
        this.updateTask(taskId, { 
          status: 'failed', 
          error: error as Error,
          completedAt: new Date()
        });

        throw error;
      }
    });
  }

  private updateTask(taskId: string, updates: Partial<ProcessingTask>) {
    const task = this.tasks.get(taskId);
    if (task) {
      Object.assign(task, updates);
      this.tasks.set(taskId, task);
      this.notifyGlobalProgress();
    }
  }

  private updateTaskProgress(taskId: string, progress: number, message?: string) {
    this.updateTask(taskId, { progress });

    // Notify specific progress listeners
    const callbacks = this.progressCallbacks.get(taskId) || [];
    callbacks.forEach(callback => {
      callback({
        taskId,
        progress,
        status: 'processing',
        message
      });
    });
  }

  private notifyGlobalProgress() {
    if (this.globalProgressCallback) {
      const tasks = Array.from(this.tasks.values());
      this.globalProgressCallback(tasks);
    }
  }

  addProgressListener(taskId: string, callback: ProgressCallback) {
    if (!this.progressCallbacks.has(taskId)) {
      this.progressCallbacks.set(taskId, []);
    }
    this.progressCallbacks.get(taskId)!.push(callback);
  }

  removeProgressListener(taskId: string, callback: ProgressCallback) {
    const callbacks = this.progressCallbacks.get(taskId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  setGlobalProgressCallback(callback: (tasks: ProcessingTask[]) => void) {
    this.globalProgressCallback = callback;
  }

  getTask(taskId: string): ProcessingTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): ProcessingTask[] {
    return Array.from(this.tasks.values());
  }

  getQueueStats() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      isPaused: this.queue.isPaused
    };
  }

  async pause() {
    this.queue.pause();
    console.log('⏸️ Document processing queue paused');
  }

  start() {
    this.queue.start();
    console.log('▶️ Document processing queue started');
  }

  async clear() {
    this.queue.clear();
    this.tasks.clear();
    this.progressCallbacks.clear();
    console.log('🧹 Document processing queue cleared');
  }

  async onIdle(): Promise<void> {
    return this.queue.onIdle();
  }
}

// Singleton instance
let processingQueue: DocumentProcessingQueueManager | null = null;

export const getProcessingQueue = (): DocumentProcessingQueueManager => {
  if (!processingQueue) {
    processingQueue = new DocumentProcessingQueueManager();
  }
  return processingQueue;
};