/**
 * LNAT Model Test Runner
 * Automated testing system for running LNAT-style evaluations across multiple AI models
 */

import { LNATEvaluationFramework, ModelLNATResult } from './lnatEvaluationFramework';
import { UnifiedAIClient } from './unifiedAIClient';
import { localAIService } from '../services/localAIService';

export interface TestConfiguration {
  models: string[];
  includeEssay: boolean;
  timeLimit: number; // minutes
  debugMode: boolean;
  saveResults: boolean;
  runInParallel: boolean;
}

export interface TestSession {
  id: string;
  configuration: TestConfiguration;
  startTime: string;
  endTime?: string;
  results: ModelLNATResult[];
  status: 'running' | 'completed' | 'failed';
  progress: number; // 0-100
}

export interface LNATLeaderboard {
  lastUpdated: string;
  totalTests: number;
  rankings: {
    rank: number;
    modelId: string;
    overallScore: number;
    sectionAScore: number;
    sectionBScore: number;
    strengths: string[];
    testDate: string;
  }[];
}

export class LNATModelTester {
  private framework: LNATEvaluationFramework;
  private activeSessions: Map<string, TestSession> = new Map();
  private results: ModelLNATResult[] = [];

  constructor() {
    this.framework = new LNATEvaluationFramework();
    this.loadStoredResults();
  }

  /**
   * Start a new LNAT evaluation session
   */
  async startTestSession(config: TestConfiguration): Promise<string> {
    const sessionId = `lnat-session-${Date.now()}`;
    
    const session: TestSession = {
      id: sessionId,
      configuration: config,
      startTime: new Date().toISOString(),
      results: [],
      status: 'running',
      progress: 0
    };

    this.activeSessions.set(sessionId, session);

    // Start testing (don't await to return immediately)
    this.runTestSession(sessionId).catch(error => {
      console.error(`Test session ${sessionId} failed:`, error);
      session.status = 'failed';
    });

    return sessionId;
  }

  /**
   * Run the actual test session
   */
  private async runTestSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const { models, includeEssay, timeLimit, debugMode, runInParallel } = session.configuration;
    
    try {
      if (runInParallel) {
        // Run all models in parallel
        const promises = models.map(modelId => this.testSingleModel(modelId, session));
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            session.results.push(result.value);
          } else {
            console.error(`Model ${models[index]} test failed:`, result.reason);
          }
        });
      } else {
        // Run models sequentially
        for (let i = 0; i < models.length; i++) {
          const modelId = models[i];
          try {
            const result = await this.testSingleModel(modelId, session);
            session.results.push(result);
            
            // Update progress
            session.progress = ((i + 1) / models.length) * 100;
            
            if (debugMode) {
              console.log(`Completed test for ${modelId}: ${result.overallScore}/100`);
            }
          } catch (error) {
            console.error(`Failed to test model ${modelId}:`, error);
          }
        }
      }

      session.status = 'completed';
      session.endTime = new Date().toISOString();
      session.progress = 100;

      // Save results if configured
      if (session.configuration.saveResults) {
        this.saveResults(session.results);
      }

      // Update leaderboard
      this.updateLeaderboard(session.results);

    } catch (error) {
      session.status = 'failed';
      throw error;
    }
  }

  /**
   * Test a single model
   */
  private async testSingleModel(modelId: string, session: TestSession): Promise<ModelLNATResult> {
    const { includeEssay, timeLimit, debugMode } = session.configuration;
    
    // Get appropriate AI client for the model
    const aiClient = await this.getAIClient(modelId);
    
    // Run the evaluation
    const result = await this.framework.evaluateModel(modelId, aiClient, {
      includeEssay,
      timeLimit,
      debugMode
    });

    return result;
  }

  /**
   * Get appropriate AI client for model
   */
  private async getAIClient(modelId: string): Promise<any> {
    // Check if it's a LocalAI model
    const localAIStatus = localAIService.getStatus();
    if (localAIStatus.connected && localAIStatus.availableModels.includes(modelId)) {
      return localAIService;
    }
    
    // Fall back to unified client
    const unifiedClient = new UnifiedAIClient();
    return unifiedClient as any;
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): TestSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): TestSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Cancel a running session
   */
  cancelSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'running') {
      session.status = 'failed';
      return true;
    }
    return false;
  }

  /**
   * Quick test a single model with default configuration
   */
  async quickTest(modelId: string): Promise<ModelLNATResult> {
    const aiClient = await this.getAIClient(modelId);
    return await this.framework.evaluateModel(modelId, aiClient, {
      includeEssay: false,
      debugMode: false
    });
  }

  /**
   * Run benchmark test across multiple models
   */
  async runBenchmark(modelIds: string[]): Promise<ModelLNATResult[]> {
    const config: TestConfiguration = {
      models: modelIds,
      includeEssay: true,
      timeLimit: 135, // Full LNAT time
      debugMode: false,
      saveResults: true,
      runInParallel: false
    };

    const sessionId = await this.startTestSession(config);
    
    // Wait for completion
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const session = this.getSessionStatus(sessionId);
        if (!session) {
          reject(new Error('Session not found'));
          return;
        }

        if (session.status === 'completed') {
          resolve(session.results);
        } else if (session.status === 'failed') {
          reject(new Error('Benchmark test failed'));
        } else {
          // Still running, check again in 5 seconds
          setTimeout(checkStatus, 5000);
        }
      };

      checkStatus();
    });
  }

  /**
   * Get current leaderboard
   */
  getLeaderboard(): LNATLeaderboard {
    const stored = localStorage.getItem('lnat_leaderboard');
    if (stored) {
      return JSON.parse(stored);
    }

    return {
      lastUpdated: new Date().toISOString(),
      totalTests: 0,
      rankings: []
    };
  }

  /**
   * Update leaderboard with new results
   */
  private updateLeaderboard(newResults: ModelLNATResult[]): void {
    const leaderboard = this.getLeaderboard();
    
    // Add new results
    newResults.forEach(result => {
      // Remove existing entry for this model if it exists
      leaderboard.rankings = leaderboard.rankings.filter(r => r.modelId !== result.modelId);
      
      // Add new entry
      leaderboard.rankings.push({
        rank: 0, // Will be calculated after sorting
        modelId: result.modelId,
        overallScore: result.overallScore,
        sectionAScore: result.sectionAPercentage,
        sectionBScore: result.sectionBScore,
        strengths: result.strengths,
        testDate: result.evaluationDate
      });
    });

    // Sort by overall score and assign ranks
    leaderboard.rankings.sort((a, b) => b.overallScore - a.overallScore);
    leaderboard.rankings.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    leaderboard.lastUpdated = new Date().toISOString();
    leaderboard.totalTests = leaderboard.rankings.length;

    // Save to localStorage
    localStorage.setItem('lnat_leaderboard', JSON.stringify(leaderboard));
  }

  /**
   * Save results to localStorage
   */
  private saveResults(results: ModelLNATResult[]): void {
    this.results.push(...results);
    localStorage.setItem('lnat_test_results', JSON.stringify(this.results));
  }

  /**
   * Load stored results
   */
  private loadStoredResults(): void {
    const stored = localStorage.getItem('lnat_test_results');
    if (stored) {
      try {
        this.results = JSON.parse(stored);
      } catch (error) {
        console.error('Failed to load stored LNAT results:', error);
        this.results = [];
      }
    }
  }

  /**
   * Get all stored results
   */
  getAllResults(): ModelLNATResult[] {
    return [...this.results];
  }

  /**
   * Get results for a specific model
   */
  getModelResults(modelId: string): ModelLNATResult[] {
    return this.results.filter(r => r.modelId === modelId);
  }

  /**
   * Clear all stored results
   */
  clearResults(): void {
    this.results = [];
    localStorage.removeItem('lnat_test_results');
    localStorage.removeItem('lnat_leaderboard');
  }

  /**
   * Export results as JSON
   */
  exportResults(): string {
    return JSON.stringify({
      results: this.results,
      leaderboard: this.getLeaderboard(),
      exported: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Get performance comparison between models
   */
  compareModels(modelIds: string[]): any {
    const modelResults = modelIds.map(id => ({
      modelId: id,
      results: this.getModelResults(id)
    }));

    const comparison = {
      models: modelResults.map(m => m.modelId),
      avgScores: modelResults.map(m => ({
        modelId: m.modelId,
        avgOverall: m.results.reduce((sum, r) => sum + r.overallScore, 0) / (m.results.length || 1),
        avgSectionA: m.results.reduce((sum, r) => sum + r.sectionAPercentage, 0) / (m.results.length || 1),
        avgSectionB: m.results.reduce((sum, r) => sum + r.sectionBScore, 0) / (m.results.length || 1),
        testCount: m.results.length
      })),
      skillComparison: this.compareSkills(modelResults),
      recommendations: this.generateRecommendations(modelResults)
    };

    return comparison;
  }

  /**
   * Compare skills across models
   */
  private compareSkills(modelResults: any[]): any {
    const skillComparison: any = {};

    modelResults.forEach(({ modelId, results }) => {
      if (results.length === 0) return;

      const avgSkills: any = {};
      const latestResult = results[results.length - 1];
      
      Object.entries(latestResult.skillBreakdown).forEach(([skill, score]: [string, any]) => {
        avgSkills[skill] = score;
      });

      skillComparison[modelId] = avgSkills;
    });

    return skillComparison;
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(modelResults: any[]): string[] {
    const recommendations: string[] = [];
    
    const validResults = modelResults.filter(m => m.results.length > 0);
    if (validResults.length === 0) {
      recommendations.push('No test results available. Run tests to get recommendations.');
      return recommendations;
    }

    // Find best overall performer
    const bestOverall = validResults.reduce((best, current) => {
      const bestAvg = best.results.reduce((sum: number, r: any) => sum + r.overallScore, 0) / best.results.length;
      const currentAvg = current.results.reduce((sum: number, r: any) => sum + r.overallScore, 0) / current.results.length;
      return currentAvg > bestAvg ? current : best;
    });

    recommendations.push(`Best overall performer: ${bestOverall.modelId}`);

    // Find best for specific tasks
    const bestReading = validResults.reduce((best, current) => {
      const bestScore = best.results[0]?.skillBreakdown?.['critical-reading'] || 0;
      const currentScore = current.results[0]?.skillBreakdown?.['critical-reading'] || 0;
      return currentScore > bestScore ? current : best;
    });

    recommendations.push(`Best for critical reading: ${bestReading.modelId}`);

    return recommendations;
  }
}

export default LNATModelTester;