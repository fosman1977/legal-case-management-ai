/**
 * Parallel AI Service - Deep Legal Research Integration
 * Implements the Task API for automated legal research workflows
 */

import { parallelAICache } from './parallelAICache';

export interface ParallelAIConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  timeout: number;
  retryAttempts: number;
}

export interface ResearchTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  progress?: number;
  results?: ResearchResult;
  metadata: {
    documentId?: string;
    caseId?: string;
    userId: string;
    tags: string[];
    researchType: 'case-law' | 'statutes' | 'precedents' | 'authorities' | 'background' | 'custom';
  };
}

export interface ResearchResult {
  summary: string;
  keyFindings: Array<{
    title: string;
    content: string;
    relevance: number;
    sources: string[];
    confidence: number;
  }>;
  sources: Array<{
    title: string;
    url: string;
    type: 'case' | 'statute' | 'article' | 'regulation';
    jurisdiction: string;
    date: string;
    relevance: number;
  }>;
  relatedCases: Array<{
    title: string;
    citation: string;
    relevance: number;
    summary: string;
  }>;
  actionableInsights: Array<{
    insight: string;
    priority: 'low' | 'medium' | 'high';
    category: 'argument' | 'precedent' | 'procedure' | 'strategy';
  }>;
  processingMetadata: {
    tokensUsed: number;
    processingTime: number;
    modelUsed: string;
    qualityScore: number;
  };
}

export interface ResearchQueue {
  pending: ResearchTask[];
  running: ResearchTask[];
  completed: ResearchTask[];
  failed: ResearchTask[];
}

class ParallelAIService {
  private config: ParallelAIConfig = {
    apiKey: '',
    baseUrl: 'https://api.parallel.ai',
    defaultModel: 'gpt-4',
    timeout: 300000, // 5 minutes for deep research
    retryAttempts: 3
  };

  private queue: ResearchQueue = {
    pending: [],
    running: [],
    completed: [],
    failed: []
  };

  private statusCallbacks: ((task: ResearchTask) => void)[] = [];
  private queueCallbacks: ((queue: ResearchQueue) => void)[] = [];
  private maxConcurrentTasks = 3;

  /**
   * Initialize service with API key
   */
  initialize(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.loadQueueFromStorage();
  }

  /**
   * Create a new research task
   */
  async createResearchTask(params: {
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    documentId?: string;
    caseId?: string;
    researchType: 'case-law' | 'statutes' | 'precedents' | 'authorities' | 'background' | 'custom';
    tags?: string[];
    customInstructions?: string;
  }): Promise<ResearchTask> {
    const task: ResearchTask = {
      id: this.generateTaskId(),
      title: params.title,
      description: params.description,
      status: 'pending',
      priority: params.priority || 'medium',
      createdAt: new Date(),
      progress: 0,
      metadata: {
        documentId: params.documentId,
        caseId: params.caseId,
        userId: 'current-user', // TODO: Get from auth context
        tags: params.tags || [],
        researchType: params.researchType
      }
    };

    // Add to queue
    this.queue.pending.push(task);
    this.sortQueueByPriority();
    this.saveQueueToStorage();
    this.notifyQueueChange();

    // Auto-start if capacity available
    this.processQueue();

    console.log(`📋 Created research task: ${task.title} [${task.id}]`);
    return task;
  }

  /**
   * Execute research task using Parallel AI Task API
   */
  private async executeResearchTask(task: ResearchTask): Promise<ResearchResult> {
    // Check cache first
    const cachedResult = await parallelAICache.getCachedResult({
      title: task.title,
      description: task.description,
      researchType: task.metadata.researchType,
      tags: task.metadata.tags
    });

    if (cachedResult) {
      console.log(`🎯 Using cached research result for: ${task.title.substring(0, 50)}...`);
      return cachedResult;
    }

    // Check for similar cached results
    const similarResults = await parallelAICache.findSimilarResults(task, 0.8, 1);
    if (similarResults.length > 0) {
      console.log(`🔄 Found similar cached result, adapting for: ${task.title.substring(0, 50)}...`);
      const similarResult = similarResults[0].result;
      
      // Add note about adaptation
      const adaptedResult = {
        ...similarResult,
        summary: `[Adapted from similar research] ${similarResult.summary}`,
        actionableInsights: [
          {
            insight: 'This result was adapted from similar research. Consider manual review for accuracy.',
            priority: 'medium' as const,
            category: 'strategy' as const
          },
          ...similarResult.actionableInsights
        ]
      };
      
      // Cache the adapted result
      await parallelAICache.setCachedResult(task, adaptedResult);
      return adaptedResult;
    }

    // No cache hit, proceed with API call
    console.log(`🔍 Executing fresh research for: ${task.title.substring(0, 50)}...`);
    
    const prompt = this.buildResearchPrompt(task);
    
    const requestBody = {
      model: this.config.defaultModel,
      prompt: prompt,
      max_tokens: 4000,
      temperature: 0.1, // Low temperature for factual research
      metadata: {
        task_id: task.id,
        research_type: task.metadata.researchType,
        priority: task.priority
      }
    };

    const response = await fetch(`${this.config.baseUrl}/v1/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`Parallel AI request failed: ${response.statusText}`);
    }

    const apiResult = await response.json();
    const result = this.parseResearchResult(apiResult, task);
    
    // Cache the result for future use
    await parallelAICache.setCachedResult(task, result);
    
    return result;
  }

  /**
   * Build research prompt based on task type
   */
  private buildResearchPrompt(task: ResearchTask): string {
    const baseInstructions = `
You are a specialized legal research AI assistant. Conduct comprehensive research on the following topic and provide detailed, accurate results.

Research Request: ${task.title}
Description: ${task.description}
Research Type: ${task.metadata.researchType}

Please provide:
1. A comprehensive summary of relevant legal information
2. Key findings with relevance scores and sources
3. Related case law and precedents
4. Actionable insights for legal strategy
5. Properly formatted citations

Format your response as structured JSON with the following sections:
- summary: Brief overview of findings
- keyFindings: Array of specific findings with sources
- sources: Detailed source information
- relatedCases: Relevant case law
- actionableInsights: Strategic recommendations
`;

    const typeSpecificInstructions = this.getTypeSpecificInstructions(task.metadata.researchType);
    
    return `${baseInstructions}\n\n${typeSpecificInstructions}`;
  }

  /**
   * Get research type specific instructions
   */
  private getTypeSpecificInstructions(researchType: string): string {
    const instructions = {
      'case-law': 'Focus on relevant case precedents, judicial decisions, and legal interpretations. Include citation analysis and precedential value.',
      'statutes': 'Research applicable statutes, regulations, and legislative history. Include current versions and recent amendments.',
      'precedents': 'Identify binding and persuasive precedents. Analyze factual similarities and distinguish contrary authorities.',
      'authorities': 'Find authoritative legal sources including primary and secondary authorities. Verify current validity.',
      'background': 'Provide comprehensive background research including historical context and legal development.',
      'custom': 'Conduct research according to the specific requirements outlined in the task description.'
    };

    return instructions[researchType as keyof typeof instructions] || instructions['custom'];
  }

  /**
   * Parse Parallel AI response into structured result
   */
  private parseResearchResult(apiResponse: any, task: ResearchTask): ResearchResult {
    try {
      // Parse JSON response from Parallel AI
      const content = apiResponse.choices?.[0]?.message?.content || apiResponse.content || '';
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;

      return {
        summary: parsedContent.summary || 'Research completed',
        keyFindings: parsedContent.keyFindings || [],
        sources: parsedContent.sources || [],
        relatedCases: parsedContent.relatedCases || [],
        actionableInsights: parsedContent.actionableInsights || [],
        processingMetadata: {
          tokensUsed: apiResponse.usage?.total_tokens || 0,
          processingTime: Date.now() - task.createdAt.getTime(),
          modelUsed: this.config.defaultModel,
          qualityScore: this.calculateQualityScore(parsedContent)
        }
      };
    } catch (error) {
      console.warn('Failed to parse structured response, creating basic result:', error);
      
      // Fallback for unstructured responses
      const content = apiResponse.choices?.[0]?.message?.content || apiResponse.content || '';
      return {
        summary: content.substring(0, 500) + '...',
        keyFindings: [{
          title: 'Research Result',
          content: content,
          relevance: 0.8,
          sources: [],
          confidence: 0.7
        }],
        sources: [],
        relatedCases: [],
        actionableInsights: [],
        processingMetadata: {
          tokensUsed: apiResponse.usage?.total_tokens || 0,
          processingTime: Date.now() - task.createdAt.getTime(),
          modelUsed: this.config.defaultModel,
          qualityScore: 0.6
        }
      };
    }
  }

  /**
   * Calculate quality score for research results
   */
  private calculateQualityScore(content: any): number {
    let score = 0.5; // Base score

    // Check for structured content
    if (content.keyFindings?.length > 0) score += 0.2;
    if (content.sources?.length > 0) score += 0.2;
    if (content.relatedCases?.length > 0) score += 0.1;

    // Check for citations and references
    const textContent = JSON.stringify(content);
    const citationCount = (textContent.match(/\[.*?\]|\d{4}\s+[A-Z]+|v\.|§/g) || []).length;
    if (citationCount > 5) score += 0.1;
    if (citationCount > 10) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Process the research queue
   */
  private async processQueue(): Promise<void> {
    const runningCount = this.queue.running.length;
    const availableSlots = this.maxConcurrentTasks - runningCount;

    if (availableSlots <= 0 || this.queue.pending.length === 0) {
      return;
    }

    // Start processing available tasks
    const tasksToStart = this.queue.pending.splice(0, availableSlots);
    
    for (const task of tasksToStart) {
      this.queue.running.push(task);
      task.status = 'running';
      this.notifyStatusChange(task);
      
      // Process task asynchronously
      this.processTaskAsync(task);
    }

    this.saveQueueToStorage();
    this.notifyQueueChange();
  }

  /**
   * Process individual task asynchronously
   */
  private async processTaskAsync(task: ResearchTask): Promise<void> {
    try {
      console.log(`🔍 Starting research task: ${task.title}`);
      
      // Update progress
      task.progress = 25;
      this.notifyStatusChange(task);

      // Execute research
      const result = await this.executeResearchTask(task);
      
      // Update progress
      task.progress = 90;
      this.notifyStatusChange(task);

      // Complete task
      task.status = 'completed';
      task.results = result;
      task.completedAt = new Date();
      task.actualDuration = task.completedAt.getTime() - task.createdAt.getTime();
      task.progress = 100;

      // Move to completed queue
      this.moveTaskToCompleted(task);
      
      console.log(`✅ Research task completed: ${task.title} [${task.actualDuration}ms]`);

    } catch (error) {
      console.error(`❌ Research task failed: ${task.title}`, error);
      
      task.status = 'failed';
      task.progress = 0;
      this.moveTaskToFailed(task);
    }

    this.notifyStatusChange(task);
    this.saveQueueToStorage();
    this.notifyQueueChange();

    // Process next tasks in queue
    setTimeout(() => this.processQueue(), 1000);
  }

  /**
   * Move task from running to completed
   */
  private moveTaskToCompleted(task: ResearchTask): void {
    this.queue.running = this.queue.running.filter(t => t.id !== task.id);
    this.queue.completed.unshift(task); // Add to beginning for recent-first order
    
    // Keep only last 50 completed tasks
    if (this.queue.completed.length > 50) {
      this.queue.completed = this.queue.completed.slice(0, 50);
    }
  }

  /**
   * Move task from running to failed
   */
  private moveTaskToFailed(task: ResearchTask): void {
    this.queue.running = this.queue.running.filter(t => t.id !== task.id);
    this.queue.failed.unshift(task);
    
    // Keep only last 20 failed tasks
    if (this.queue.failed.length > 20) {
      this.queue.failed = this.queue.failed.slice(0, 20);
    }
  }

  /**
   * Sort queue by priority
   */
  private sortQueueByPriority(): void {
    const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
    this.queue.pending.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Storage management
   */
  private saveQueueToStorage(): void {
    try {
      localStorage.setItem('parallelai_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.warn('Failed to save queue to storage:', error);
    }
  }

  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem('parallelai_queue');
      if (stored) {
        const parsedQueue = JSON.parse(stored);
        // Convert date strings back to Date objects
        ['pending', 'running', 'completed', 'failed'].forEach(queueType => {
          if (parsedQueue[queueType]) {
            parsedQueue[queueType].forEach((task: any) => {
              task.createdAt = new Date(task.createdAt);
              if (task.completedAt) task.completedAt = new Date(task.completedAt);
            });
          }
        });
        this.queue = { ...this.queue, ...parsedQueue };
      }
    } catch (error) {
      console.warn('Failed to load queue from storage:', error);
    }
  }

  /**
   * Event subscription methods
   */
  onStatusChange(callback: (task: ResearchTask) => void): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  onQueueChange(callback: (queue: ResearchQueue) => void): () => void {
    this.queueCallbacks.push(callback);
    return () => {
      this.queueCallbacks = this.queueCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyStatusChange(task: ResearchTask): void {
    this.statusCallbacks.forEach(callback => callback(task));
  }

  private notifyQueueChange(): void {
    this.queueCallbacks.forEach(callback => callback(this.queue));
  }

  /**
   * Public API methods
   */
  getQueue(): ResearchQueue {
    return { ...this.queue };
  }

  getTask(taskId: string): ResearchTask | undefined {
    const allTasks = [
      ...this.queue.pending,
      ...this.queue.running,
      ...this.queue.completed,
      ...this.queue.failed
    ];
    return allTasks.find(task => task.id === taskId);
  }

  cancelTask(taskId: string): boolean {
    const taskIndex = this.queue.pending.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.queue.pending.splice(taskIndex, 1);
      this.saveQueueToStorage();
      this.notifyQueueChange();
      return true;
    }
    return false;
  }

  retryFailedTask(taskId: string): boolean {
    const taskIndex = this.queue.failed.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      const task = this.queue.failed.splice(taskIndex, 1)[0];
      task.status = 'pending';
      task.progress = 0;
      this.queue.pending.push(task);
      this.sortQueueByPriority();
      this.saveQueueToStorage();
      this.notifyQueueChange();
      this.processQueue();
      return true;
    }
    return false;
  }

  clearCompleted(): void {
    this.queue.completed = [];
    this.saveQueueToStorage();
    this.notifyQueueChange();
  }

  getTasksByDocument(documentId: string): ResearchTask[] {
    const allTasks = [
      ...this.queue.pending,
      ...this.queue.running,
      ...this.queue.completed,
      ...this.queue.failed
    ];
    return allTasks.filter(task => task.metadata.documentId === documentId);
  }

  getTasksByCase(caseId: string): ResearchTask[] {
    const allTasks = [
      ...this.queue.pending,
      ...this.queue.running,
      ...this.queue.completed,
      ...this.queue.failed
    ];
    return allTasks.filter(task => task.metadata.caseId === caseId);
  }

  /**
   * Health check and configuration
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  updateConfig(newConfig: Partial<ParallelAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getStats(): {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
    successRate: number;
  } {
    const total = this.queue.completed.length + this.queue.failed.length;
    const completed = this.queue.completed.length;
    const failed = this.queue.failed.length;
    
    const avgTime = completed > 0 
      ? this.queue.completed.reduce((sum, task) => sum + (task.actualDuration || 0), 0) / completed
      : 0;

    return {
      totalTasks: total,
      completedTasks: completed,
      failedTasks: failed,
      averageProcessingTime: avgTime,
      successRate: total > 0 ? completed / total : 0
    };
  }
}

// Export singleton instance
export const parallelAIService = new ParallelAIService();
export default parallelAIService;