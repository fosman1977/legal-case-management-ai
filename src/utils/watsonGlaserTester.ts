/**
 * Watson Glaser Model Tester
 * Automated testing system for running Watson Glaser Critical Thinking evaluations across AI models
 */

import { WatsonGlaserEvaluationFramework, WatsonGlaserResult } from './watsonGlaserFramework';
import { UnifiedAIClient } from './unifiedAIClient';
import { localAIService } from '../services/localAIService';

export interface WatsonGlaserTestConfiguration {
  models: string[];
  timeLimit: number; // minutes
  debugMode: boolean;
  saveResults: boolean;
  runInParallel: boolean;
  includeSectionAnalysis: boolean;
}

export interface WatsonGlaserTestSession {
  id: string;
  configuration: WatsonGlaserTestConfiguration;
  startTime: string;
  endTime?: string;
  results: WatsonGlaserResult[];
  status: 'running' | 'completed' | 'failed';
  progress: number; // 0-100
}

export interface WatsonGlaserLeaderboard {
  lastUpdated: string;
  totalTests: number;
  rankings: {
    rank: number;
    modelId: string;
    overallScore: number;
    percentileRank: number;
    grade: string;
    accuracy: number;
    strengths: string[];
    testDate: string;
    criticalThinkingProfile: {
      inference: number;
      assumptions: number;
      deduction: number;
      interpretation: number;
      evaluation: number;
    };
  }[];
}

export interface WatsonGlaserBenchmark {
  modelId: string;
  benchmarkDate: string;
  results: WatsonGlaserResult[];
  averageScore: number;
  consistency: number; // standard deviation
  reliability: 'High' | 'Medium' | 'Low';
  bestSection: string;
  worstSection: string;
}

export class WatsonGlaserModelTester {
  private framework: WatsonGlaserEvaluationFramework;
  private activeSessions: Map<string, WatsonGlaserTestSession> = new Map();
  private results: WatsonGlaserResult[] = [];
  private benchmarks: Map<string, WatsonGlaserBenchmark> = new Map();

  constructor() {
    this.framework = new WatsonGlaserEvaluationFramework();
    this.loadStoredResults();
  }

  /**
   * Start a new Watson Glaser evaluation session
   */
  async startTestSession(config: WatsonGlaserTestConfiguration): Promise<string> {
    const sessionId = `wg-session-${Date.now()}`;
    
    const session: WatsonGlaserTestSession = {
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
      console.error(`Watson Glaser test session ${sessionId} failed:`, error);
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

    const { models, timeLimit, debugMode, runInParallel } = session.configuration;
    
    try {
      if (runInParallel) {
        // Run all models in parallel
        const promises = models.map(modelId => this.testSingleModel(modelId, session));
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            session.results.push(result.value);
          } else {
            console.error(`Watson Glaser test for model ${models[index]} failed:`, result.reason);
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
              console.log(`Completed Watson Glaser test for ${modelId}: ${result.overallScore}/40 (${result.grade})`);
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

      // Update benchmarks
      this.updateBenchmarks(session.results);

    } catch (error) {
      session.status = 'failed';
      throw error;
    }
  }

  /**
   * Test a single model with Watson Glaser
   */
  private async testSingleModel(modelId: string, session: WatsonGlaserTestSession): Promise<WatsonGlaserResult> {
    const { timeLimit, debugMode } = session.configuration;
    
    // Get appropriate AI client for the model
    const aiClient = await this.getAIClient(modelId);
    
    // Run the evaluation
    const result = await this.framework.evaluateModel(modelId, aiClient, {
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
    await unifiedClient.initialize();
    return unifiedClient;
  }

  /**
   * Quick test a single model
   */
  async quickTest(modelId: string): Promise<WatsonGlaserResult> {
    const aiClient = await this.getAIClient(modelId);
    return await this.framework.evaluateModel(modelId, aiClient, {
      debugMode: false
    });
  }

  /**
   * Run benchmark test across multiple models with repeated trials
   */
  async runBenchmark(modelIds: string[], trials: number = 3): Promise<WatsonGlaserBenchmark[]> {
    const benchmarks: WatsonGlaserBenchmark[] = [];

    for (const modelId of modelIds) {
      console.log(`Running Watson Glaser benchmark for ${modelId} (${trials} trials)`);
      
      const results: WatsonGlaserResult[] = [];
      
      for (let trial = 0; trial < trials; trial++) {
        try {
          const result = await this.quickTest(modelId);
          results.push(result);
          console.log(`Trial ${trial + 1}/${trials} for ${modelId}: ${result.overallScore}/40`);
        } catch (error) {
          console.error(`Trial ${trial + 1} failed for ${modelId}:`, error);
        }
      }

      if (results.length > 0) {
        const benchmark = this.calculateBenchmark(modelId, results);
        benchmarks.push(benchmark);
        this.benchmarks.set(modelId, benchmark);
      }
    }

    // Save benchmarks
    this.saveBenchmarks();
    
    return benchmarks;
  }

  /**
   * Calculate benchmark statistics for a model
   */
  private calculateBenchmark(modelId: string, results: WatsonGlaserResult[]): WatsonGlaserBenchmark {
    const scores = results.map(r => r.overallScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calculate standard deviation for consistency measure
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
    const consistency = Math.sqrt(variance);
    
    // Determine reliability based on consistency
    let reliability: 'High' | 'Medium' | 'Low';
    if (consistency <= 2) reliability = 'High';
    else if (consistency <= 4) reliability = 'Medium';
    else reliability = 'Low';

    // Find best and worst sections
    const sectionAverages = {
      inference: 0,
      assumptions: 0,
      deduction: 0,
      interpretation: 0,
      evaluation: 0
    };

    results.forEach(result => {
      Object.entries(result.sectionScores).forEach(([section, score]) => {
        sectionAverages[section as keyof typeof sectionAverages] += score;
      });
    });

    Object.keys(sectionAverages).forEach(section => {
      sectionAverages[section as keyof typeof sectionAverages] /= results.length;
    });

    const sortedSections = Object.entries(sectionAverages).sort(([,a], [,b]) => b - a);
    const bestSection = sortedSections[0][0];
    const worstSection = sortedSections[sortedSections.length - 1][0];

    return {
      modelId,
      benchmarkDate: new Date().toISOString(),
      results,
      averageScore,
      consistency,
      reliability,
      bestSection,
      worstSection
    };
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): WatsonGlaserTestSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): WatsonGlaserTestSession[] {
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
   * Get current leaderboard
   */
  getLeaderboard(): WatsonGlaserLeaderboard {
    const stored = localStorage.getItem('watson_glaser_leaderboard');
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
  private updateLeaderboard(newResults: WatsonGlaserResult[]): void {
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
        percentileRank: result.percentileRank,
        grade: result.grade,
        accuracy: result.accuracy,
        strengths: result.strengths,
        testDate: result.evaluationDate,
        criticalThinkingProfile: result.sectionScores
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
    localStorage.setItem('watson_glaser_leaderboard', JSON.stringify(leaderboard));
  }

  /**
   * Save results to localStorage
   */
  private saveResults(results: WatsonGlaserResult[]): void {
    this.results.push(...results);
    localStorage.setItem('watson_glaser_results', JSON.stringify(this.results));
  }

  /**
   * Load stored results
   */
  private loadStoredResults(): void {
    const stored = localStorage.getItem('watson_glaser_results');
    if (stored) {
      try {
        this.results = JSON.parse(stored);
      } catch (error) {
        console.error('Failed to load stored Watson Glaser results:', error);
        this.results = [];
      }
    }

    // Load benchmarks
    const storedBenchmarks = localStorage.getItem('watson_glaser_benchmarks');
    if (storedBenchmarks) {
      try {
        const benchmarkArray = JSON.parse(storedBenchmarks);
        benchmarkArray.forEach((benchmark: WatsonGlaserBenchmark) => {
          this.benchmarks.set(benchmark.modelId, benchmark);
        });
      } catch (error) {
        console.error('Failed to load stored Watson Glaser benchmarks:', error);
      }
    }
  }

  /**
   * Save benchmarks to localStorage
   */
  private saveBenchmarks(): void {
    const benchmarkArray = Array.from(this.benchmarks.values());
    localStorage.setItem('watson_glaser_benchmarks', JSON.stringify(benchmarkArray));
  }

  /**
   * Update benchmarks with new results
   */
  private updateBenchmarks(results: WatsonGlaserResult[]): void {
    results.forEach(result => {
      const existingBenchmark = this.benchmarks.get(result.modelId);
      if (existingBenchmark) {
        // Add to existing benchmark
        existingBenchmark.results.push(result);
        const updatedBenchmark = this.calculateBenchmark(result.modelId, existingBenchmark.results);
        this.benchmarks.set(result.modelId, updatedBenchmark);
      } else {
        // Create new benchmark
        const newBenchmark = this.calculateBenchmark(result.modelId, [result]);
        this.benchmarks.set(result.modelId, newBenchmark);
      }
    });
    
    this.saveBenchmarks();
  }

  /**
   * Get all stored results
   */
  getAllResults(): WatsonGlaserResult[] {
    return [...this.results];
  }

  /**
   * Get results for a specific model
   */
  getModelResults(modelId: string): WatsonGlaserResult[] {
    return this.results.filter(r => r.modelId === modelId);
  }

  /**
   * Get benchmark for a specific model
   */
  getModelBenchmark(modelId: string): WatsonGlaserBenchmark | null {
    return this.benchmarks.get(modelId) || null;
  }

  /**
   * Get all benchmarks
   */
  getAllBenchmarks(): WatsonGlaserBenchmark[] {
    return Array.from(this.benchmarks.values());
  }

  /**
   * Clear all stored data
   */
  clearAllData(): void {
    this.results = [];
    this.benchmarks.clear();
    localStorage.removeItem('watson_glaser_results');
    localStorage.removeItem('watson_glaser_leaderboard');
    localStorage.removeItem('watson_glaser_benchmarks');
  }

  /**
   * Export all data as JSON
   */
  exportData(): string {
    return JSON.stringify({
      results: this.results,
      benchmarks: Array.from(this.benchmarks.values()),
      leaderboard: this.getLeaderboard(),
      exported: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Compare critical thinking profiles between models
   */
  compareCriticalThinkingProfiles(modelIds: string[]): any {
    const comparisons = modelIds.map(modelId => {
      const results = this.getModelResults(modelId);
      const benchmark = this.getModelBenchmark(modelId);
      
      if (results.length === 0) {
        return {
          modelId,
          available: false,
          profile: null
        };
      }

      const latestResult = results[results.length - 1];
      
      return {
        modelId,
        available: true,
        profile: {
          overallScore: latestResult.overallScore,
          grade: latestResult.grade,
          percentileRank: latestResult.percentileRank,
          sectionScores: latestResult.sectionScores,
          strengths: latestResult.strengths,
          weaknesses: latestResult.weaknesses,
          consistency: benchmark?.reliability || 'Unknown'
        }
      };
    });

    // Find best performer in each section
    const sectionLeaders = {
      inference: '',
      assumptions: '',
      deduction: '',
      interpretation: '',
      evaluation: ''
    };

    const availableComparisons = comparisons.filter(c => c.available);
    
    Object.keys(sectionLeaders).forEach(section => {
      let bestScore = -1;
      let bestModel = '';
      
      availableComparisons.forEach(comp => {
        const score = comp.profile.sectionScores[section];
        if (score > bestScore) {
          bestScore = score;
          bestModel = comp.modelId;
        }
      });
      
      sectionLeaders[section as keyof typeof sectionLeaders] = bestModel;
    });

    return {
      models: comparisons,
      sectionLeaders,
      recommendations: this.generateComparisonRecommendations(comparisons)
    };
  }

  /**
   * Generate recommendations from model comparison
   */
  private generateComparisonRecommendations(comparisons: any[]): string[] {
    const recommendations: string[] = [];
    const available = comparisons.filter(c => c.available);
    
    if (available.length === 0) {
      recommendations.push('No Watson Glaser test results available. Run tests to get recommendations.');
      return recommendations;
    }

    // Best overall performer
    const bestOverall = available.reduce((best, current) => 
      current.profile.overallScore > best.profile.overallScore ? current : best
    );
    recommendations.push(`Best overall critical thinking: ${bestOverall.modelId} (${bestOverall.profile.overallScore}/40, ${bestOverall.profile.grade})`);

    // Most consistent performer
    const mostConsistent = available.filter(m => m.profile.consistency === 'High');
    if (mostConsistent.length > 0) {
      recommendations.push(`Most consistent performers: ${mostConsistent.map(m => m.modelId).join(', ')}`);
    }

    // Specialized recommendations
    const excellentModels = available.filter(m => m.profile.grade === 'Excellent');
    if (excellentModels.length > 0) {
      recommendations.push(`Excellent for complex legal reasoning: ${excellentModels.map(m => m.modelId).join(', ')}`);
    }

    return recommendations;
  }
}

export default WatsonGlaserModelTester;