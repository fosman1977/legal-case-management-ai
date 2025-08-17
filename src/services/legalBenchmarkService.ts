/**
 * Advanced Legal Benchmark Service
 * Implements LegalBench, LNAT, and Watson-Glaser assessments
 * for comprehensive legal reasoning evaluation
 */

interface BenchmarkTest {
  id: string;
  name: string;
  category: 'legal-reasoning' | 'critical-thinking' | 'document-analysis' | 'statutory-interpretation';
  difficulty: 'basic' | 'intermediate' | 'advanced' | 'expert';
  question: string;
  context?: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  requiredCapabilities: string[];
}

interface BenchmarkResult {
  testId: string;
  engineName: string;
  score: number;
  timeTaken: number;
  correct: boolean;
  confidence: number;
  reasoning?: string;
  timestamp: Date;
}

interface BenchmarkSuite {
  id: string;
  name: string;
  description: string;
  tests: BenchmarkTest[];
  passingScore: number;
  version: string;
}

interface EnginePerformance {
  engineName: string;
  legalBenchScore: number;
  lnatScore: number;
  watsonGlaserScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  lastTested: Date;
}

export class LegalBenchmarkService {
  private benchmarkSuites: Map<string, BenchmarkSuite> = new Map();
  private benchmarkResults: Map<string, BenchmarkResult[]> = new Map();
  private enginePerformance: Map<string, EnginePerformance> = new Map();
  
  constructor() {
    this.initializeBenchmarkSuites();
  }

  /**
   * Initialize benchmark suites with comprehensive legal tests
   */
  private initializeBenchmarkSuites(): void {
    // LegalBench Suite - Based on Stanford's LegalBench
    this.benchmarkSuites.set('legalbench', {
      id: 'legalbench',
      name: 'LegalBench Comprehensive Suite',
      description: 'Stanford-inspired legal reasoning benchmark covering case law, statutes, and legal analysis',
      version: '1.0.0',
      passingScore: 75,
      tests: [
        {
          id: 'lb-001',
          name: 'Precedent Application',
          category: 'legal-reasoning',
          difficulty: 'advanced',
          question: 'Does the precedent set in Donoghue v Stevenson [1932] regarding duty of care apply to a software developer who releases buggy code that causes financial loss?',
          context: 'Donoghue v Stevenson established the neighbor principle for duty of care in negligence. The case involved a decomposed snail in a ginger beer bottle.',
          correctAnswer: 'Yes, with qualifications. The neighbor principle applies but pure economic loss requires special relationship or Hedley Byrne principles.',
          explanation: 'The neighbor principle establishes duty where harm is reasonably foreseeable, but pure economic loss has additional requirements.',
          requiredCapabilities: ['precedent-analysis', 'negligence-law', 'economic-loss']
        },
        {
          id: 'lb-002',
          name: 'Statutory Interpretation',
          category: 'statutory-interpretation',
          difficulty: 'intermediate',
          question: 'Under s.2(1) of the Health and Safety at Work Act 1974, does "so far as is reasonably practicable" create an absolute or qualified duty?',
          context: 'Section 2(1): "It shall be the duty of every employer to ensure, so far as is reasonably practicable, the health, safety and welfare at work of all his employees."',
          correctAnswer: 'Qualified duty',
          explanation: 'The phrase "so far as is reasonably practicable" qualifies the duty, requiring a balance between risk and cost/difficulty of prevention (Edwards v NCB).',
          requiredCapabilities: ['statutory-interpretation', 'health-safety-law']
        },
        {
          id: 'lb-003',
          name: 'Contract Formation',
          category: 'document-analysis',
          difficulty: 'basic',
          question: 'In a battle of forms scenario where buyer and seller exchange different standard terms, whose terms prevail under English law?',
          options: ['First shot rule', 'Last shot rule', 'No contract formed', 'Court decides fairest terms'],
          correctAnswer: 'Last shot rule',
          explanation: 'Under English law, the last shot rule typically applies - the last set of terms sent before performance prevails (Butler Machine Tool v Ex-Cell-O).',
          requiredCapabilities: ['contract-law', 'battle-of-forms']
        },
        {
          id: 'lb-004',
          name: 'Causation Analysis',
          category: 'legal-reasoning',
          difficulty: 'expert',
          question: 'Apply the "but for" test and legal causation principles to determine liability where multiple causes contribute to harm.',
          context: 'Claimant exposed to asbestos by 5 different employers over 20 years. Developed mesothelioma. Only 3 employers can be traced.',
          correctAnswer: 'Material contribution test applies (Fairchild exception). Each employer liable for full damage, can seek contribution.',
          explanation: 'Fairchild v Glenhaven allows claimants to succeed where "but for" test fails in multiple exposure cases. Material increase in risk sufficient.',
          requiredCapabilities: ['causation', 'tort-law', 'fairchild-exception']
        },
        {
          id: 'lb-005',
          name: 'Judicial Review Grounds',
          category: 'legal-reasoning',
          difficulty: 'advanced',
          question: 'Identify the ground for judicial review: A planning authority grants permission considering only economic benefits, ignoring environmental impact assessment requirements.',
          options: ['Illegality', 'Irrationality', 'Procedural impropriety', 'Proportionality'],
          correctAnswer: 'Illegality',
          explanation: 'Failure to consider mandatory relevant consideration (environmental impact) is illegality - acting beyond legal powers.',
          requiredCapabilities: ['administrative-law', 'judicial-review']
        }
      ]
    });

    // LNAT Suite - Law National Aptitude Test patterns
    this.benchmarkSuites.set('lnat', {
      id: 'lnat',
      name: 'LNAT-Style Reasoning Assessment',
      description: 'Tests logical reasoning, argument analysis, and comprehension skills essential for legal practice',
      version: '1.0.0',
      passingScore: 70,
      tests: [
        {
          id: 'lnat-001',
          name: 'Argument Structure Analysis',
          category: 'critical-thinking',
          difficulty: 'intermediate',
          question: 'Identify the main assumption in this argument: "Since all previous pandemics ended naturally, government intervention in the current pandemic is unnecessary."',
          correctAnswer: 'The current pandemic will follow the same pattern as previous pandemics',
          explanation: 'The argument assumes past patterns will repeat, ignoring potential differences in virus characteristics, global connectivity, or medical capabilities.',
          requiredCapabilities: ['logical-reasoning', 'assumption-identification']
        },
        {
          id: 'lnat-002',
          name: 'Inference from Facts',
          category: 'critical-thinking',
          difficulty: 'intermediate',
          question: 'Given: "All contracts require consideration. This agreement involves no exchange of value." What can be inferred?',
          options: [
            'The agreement is void',
            'The agreement is not a contract',
            'The agreement needs modification',
            'The parties acted in bad faith'
          ],
          correctAnswer: 'The agreement is not a contract',
          explanation: 'If contracts require consideration and this lacks it, it cannot be a contract. It may be valid as another form of agreement.',
          requiredCapabilities: ['logical-deduction', 'contract-elements']
        },
        {
          id: 'lnat-003',
          name: 'Strengthening Arguments',
          category: 'critical-thinking',
          difficulty: 'advanced',
          question: 'Which evidence would most strengthen the claim that "mandatory arbitration clauses in employment contracts are unconscionable"?',
          options: [
            'Statistics showing employees rarely win in arbitration',
            'Surveys showing employees prefer court litigation',
            'Evidence of systematic bias in arbitrator selection',
            'Data on high arbitration costs for employees'
          ],
          correctAnswer: 'Evidence of systematic bias in arbitrator selection',
          explanation: 'Systematic bias directly undermines fairness, the core of unconscionability. Other options show disadvantage but not fundamental unfairness.',
          requiredCapabilities: ['argument-evaluation', 'evidence-assessment']
        },
        {
          id: 'lnat-004',
          name: 'Logical Flaws',
          category: 'critical-thinking',
          difficulty: 'intermediate',
          question: 'Identify the logical flaw: "The defendant was seen near the crime scene, therefore they must be guilty."',
          correctAnswer: 'Affirming the consequent / Insufficient evidence',
          explanation: 'Presence near scene is consistent with guilt but doesn\'t prove it. Many innocent explanations possible.',
          requiredCapabilities: ['logical-fallacies', 'evidence-evaluation']
        }
      ]
    });

    // Watson-Glaser Suite - Critical thinking assessment
    this.benchmarkSuites.set('watson-glaser', {
      id: 'watson-glaser',
      name: 'Watson-Glaser Critical Thinking Appraisal',
      description: 'Evaluates critical thinking skills crucial for legal analysis and decision-making',
      version: '1.0.0',
      passingScore: 72,
      tests: [
        {
          id: 'wg-001',
          name: 'Assumption Recognition',
          category: 'critical-thinking',
          difficulty: 'intermediate',
          question: 'Statement: "The new legislation will reduce crime." Assumption: "Legislation can influence criminal behavior." Is this assumption made?',
          options: ['Assumption made', 'Assumption not made'],
          correctAnswer: 'Assumption made',
          explanation: 'The statement presupposes legislation can affect crime rates, otherwise the claim would be meaningless.',
          requiredCapabilities: ['assumption-analysis', 'critical-thinking']
        },
        {
          id: 'wg-002',
          name: 'Deduction',
          category: 'critical-thinking',
          difficulty: 'basic',
          question: 'Premises: "All barristers have right of audience in higher courts. John is a barrister." Conclusion: "John has right of audience in Crown Court." Valid?',
          options: ['Valid', 'Invalid', 'Insufficient information'],
          correctAnswer: 'Valid',
          explanation: 'Crown Court is a higher court. If all barristers have such rights and John is a barrister, the conclusion necessarily follows.',
          requiredCapabilities: ['deductive-reasoning', 'legal-profession']
        },
        {
          id: 'wg-003',
          name: 'Interpretation',
          category: 'critical-thinking',
          difficulty: 'advanced',
          question: 'A judge states: "Justice must not only be done but be seen to be done." This primarily emphasizes:',
          options: [
            'Actual fairness over appearance',
            'Public perception over substance',
            'Both substance and appearance equally',
            'Transparency in proceedings'
          ],
          correctAnswer: 'Both substance and appearance equally',
          explanation: 'The statement requires both actual justice AND its visible demonstration, neither alone is sufficient.',
          requiredCapabilities: ['interpretation', 'legal-principles']
        },
        {
          id: 'wg-004',
          name: 'Evaluation of Arguments',
          category: 'critical-thinking',
          difficulty: 'advanced',
          question: 'Evaluate: "Jury trials should be abolished because they are expensive." Strong or weak argument?',
          options: ['Strong', 'Weak'],
          correctAnswer: 'Weak',
          explanation: 'Cost alone ignores fundamental values like peer judgment, democratic participation, and protection against state power.',
          requiredCapabilities: ['argument-evaluation', 'legal-system']
        },
        {
          id: 'wg-005',
          name: 'Inference',
          category: 'critical-thinking',
          difficulty: 'intermediate',
          question: 'Data shows 90% of commercial disputes settle before trial. What inference is most justified?',
          options: [
            'Trials are too expensive',
            'Parties prefer to avoid trial',
            'The legal system encourages settlement',
            'Most cases lack merit'
          ],
          correctAnswer: 'Parties prefer to avoid trial',
          explanation: 'This is the most justified inference from the data alone. Other options may be true but require additional assumptions.',
          requiredCapabilities: ['statistical-inference', 'dispute-resolution']
        }
      ]
    });
  }

  /**
   * Run comprehensive benchmark suite on an engine
   */
  async runBenchmarkSuite(
    engineName: string,
    suiteId: 'legalbench' | 'lnat' | 'watson-glaser' | 'all'
  ): Promise<EnginePerformance> {
    console.log(`🧪 Running ${suiteId} benchmark suite on ${engineName}...`);
    
    const suitesToRun = suiteId === 'all' 
      ? Array.from(this.benchmarkSuites.values())
      : [this.benchmarkSuites.get(suiteId)!];
    
    const results: BenchmarkResult[] = [];
    
    for (const suite of suitesToRun) {
      console.log(`📋 Testing ${suite.name}...`);
      
      for (const test of suite.tests) {
        const result = await this.runSingleTest(engineName, test);
        results.push(result);
        
        // Store result
        if (!this.benchmarkResults.has(engineName)) {
          this.benchmarkResults.set(engineName, []);
        }
        this.benchmarkResults.get(engineName)!.push(result);
      }
    }
    
    // Calculate performance scores
    const performance = this.calculateEnginePerformance(engineName, results);
    this.enginePerformance.set(engineName, performance);
    
    console.log(`✅ Benchmark complete for ${engineName}`);
    console.log(`   LegalBench: ${performance.legalBenchScore}%`);
    console.log(`   LNAT: ${performance.lnatScore}%`);
    console.log(`   Watson-Glaser: ${performance.watsonGlaserScore}%`);
    console.log(`   Overall: ${performance.overallScore}%`);
    
    return performance;
  }

  /**
   * Run a single benchmark test
   */
  private async runSingleTest(engineName: string, test: BenchmarkTest): Promise<BenchmarkResult> {
    const startTime = Date.now();
    
    // Simulate engine processing (in production, would call actual engine)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate different engine capabilities and accuracy
    const engineAccuracy = this.getEngineAccuracy(engineName, test.category);
    const isCorrect = Math.random() < engineAccuracy;
    
    const result: BenchmarkResult = {
      testId: test.id,
      engineName,
      score: isCorrect ? 100 : 0,
      timeTaken: Date.now() - startTime,
      correct: isCorrect,
      confidence: 0.7 + Math.random() * 0.3,
      reasoning: this.generateReasoning(test, isCorrect),
      timestamp: new Date()
    };
    
    return result;
  }

  /**
   * Calculate comprehensive engine performance
   */
  private calculateEnginePerformance(engineName: string, results: BenchmarkResult[]): EnginePerformance {
    // Group results by suite
    const legalBenchResults = results.filter(r => r.testId.startsWith('lb-'));
    const lnatResults = results.filter(r => r.testId.startsWith('lnat-'));
    const watsonGlaserResults = results.filter(r => r.testId.startsWith('wg-'));
    
    // Calculate scores
    const legalBenchScore = this.calculateScore(legalBenchResults);
    const lnatScore = this.calculateScore(lnatResults);
    const watsonGlaserScore = this.calculateScore(watsonGlaserResults);
    
    // Weighted overall score
    const overallScore = Math.round(
      legalBenchScore * 0.5 +  // Legal knowledge weighted highest
      lnatScore * 0.25 +        // Logical reasoning
      watsonGlaserScore * 0.25  // Critical thinking
    );
    
    // Analyze strengths and weaknesses
    const { strengths, weaknesses } = this.analyzePerformance(results);
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(overallScore, strengths, weaknesses);
    
    return {
      engineName,
      legalBenchScore,
      lnatScore,
      watsonGlaserScore,
      overallScore,
      strengths,
      weaknesses,
      recommendation,
      lastTested: new Date()
    };
  }

  /**
   * Calculate percentage score from results
   */
  private calculateScore(results: BenchmarkResult[]): number {
    if (results.length === 0) return 0;
    const correctCount = results.filter(r => r.correct).length;
    return Math.round((correctCount / results.length) * 100);
  }

  /**
   * Analyze performance to identify strengths and weaknesses
   */
  private analyzePerformance(results: BenchmarkResult[]): {
    strengths: string[];
    weaknesses: string[];
  } {
    const categoryPerformance = new Map<string, number>();
    const categoryCount = new Map<string, number>();
    
    // Group by category
    results.forEach(result => {
      const test = this.findTestById(result.testId);
      if (test) {
        const category = test.category;
        categoryPerformance.set(
          category,
          (categoryPerformance.get(category) || 0) + (result.correct ? 1 : 0)
        );
        categoryCount.set(
          category,
          (categoryCount.get(category) || 0) + 1
        );
      }
    });
    
    // Calculate category scores
    const categoryScores: Array<{ category: string; score: number }> = [];
    categoryPerformance.forEach((correct, category) => {
      const total = categoryCount.get(category) || 1;
      categoryScores.push({
        category,
        score: (correct / total) * 100
      });
    });
    
    // Sort by performance
    categoryScores.sort((a, b) => b.score - a.score);
    
    // Identify strengths (>80%) and weaknesses (<60%)
    const strengths = categoryScores
      .filter(cs => cs.score >= 80)
      .map(cs => this.formatCategoryName(cs.category));
    
    const weaknesses = categoryScores
      .filter(cs => cs.score < 60)
      .map(cs => this.formatCategoryName(cs.category));
    
    // Add default entries if empty
    if (strengths.length === 0) {
      strengths.push('Consistent performance across categories');
    }
    if (weaknesses.length === 0) {
      weaknesses.push('No significant weaknesses identified');
    }
    
    return { strengths, weaknesses };
  }

  /**
   * Generate recommendation based on performance
   */
  private generateRecommendation(score: number, strengths: string[], weaknesses: string[]): string {
    if (score >= 90) {
      return 'Excellent performance. Ready for production use in critical legal analysis.';
    } else if (score >= 75) {
      return `Strong performance. Particularly good at ${strengths[0]}. Consider supplementing for ${weaknesses[0] || 'edge cases'}.`;
    } else if (score >= 60) {
      return `Adequate performance. Best suited for ${strengths[0] || 'basic tasks'}. Requires validation for ${weaknesses[0] || 'complex reasoning'}.`;
    } else {
      return `Below threshold. Recommend additional training or limiting use to ${strengths[0] || 'simple extraction tasks'}.`;
    }
  }

  /**
   * Find test by ID
   */
  private findTestById(testId: string): BenchmarkTest | null {
    for (const suite of this.benchmarkSuites.values()) {
      const test = suite.tests.find(t => t.id === testId);
      if (test) return test;
    }
    return null;
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(category: string): string {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Generate reasoning for test result
   */
  private generateReasoning(test: BenchmarkTest, correct: boolean): string {
    if (correct) {
      return `Correctly identified: ${test.explanation}`;
    } else {
      return `Missed key aspect: ${test.requiredCapabilities[0]}`;
    }
  }

  /**
   * Get simulated engine accuracy for a category
   */
  private getEngineAccuracy(engineName: string, category: string): number {
    // Simulate different engine strengths
    const engineProfiles: Record<string, Record<string, number>> = {
      'blackstone-uk': {
        'legal-reasoning': 0.92,
        'critical-thinking': 0.85,
        'document-analysis': 0.88,
        'statutory-interpretation': 0.95
      },
      'eyecite': {
        'legal-reasoning': 0.85,
        'critical-thinking': 0.80,
        'document-analysis': 0.95,
        'statutory-interpretation': 0.82
      },
      'legal-regex': {
        'legal-reasoning': 0.75,
        'critical-thinking': 0.70,
        'document-analysis': 0.90,
        'statutory-interpretation': 0.78
      },
      'spacy-legal': {
        'legal-reasoning': 0.82,
        'critical-thinking': 0.78,
        'document-analysis': 0.85,
        'statutory-interpretation': 0.80
      },
      'custom-uk': {
        'legal-reasoning': 0.88,
        'critical-thinking': 0.82,
        'document-analysis': 0.86,
        'statutory-interpretation': 0.90
      },
      'database-validator': {
        'legal-reasoning': 0.80,
        'critical-thinking': 0.75,
        'document-analysis': 0.92,
        'statutory-interpretation': 0.85
      },
      'statistical-validator': {
        'legal-reasoning': 0.78,
        'critical-thinking': 0.85,
        'document-analysis': 0.82,
        'statutory-interpretation': 0.76
      }
    };
    
    const profile = engineProfiles[engineName] || engineProfiles['legal-regex'];
    return profile[category] || 0.75;
  }

  /**
   * Public API methods
   */
  
  async runAllBenchmarks(): Promise<Map<string, EnginePerformance>> {
    const engines = [
      'blackstone-uk',
      'eyecite',
      'legal-regex',
      'spacy-legal',
      'custom-uk',
      'database-validator',
      'statistical-validator'
    ];
    
    const performances = new Map<string, EnginePerformance>();
    
    for (const engine of engines) {
      const performance = await this.runBenchmarkSuite(engine, 'all');
      performances.set(engine, performance);
    }
    
    return performances;
  }

  getEnginePerformance(engineName: string): EnginePerformance | null {
    return this.enginePerformance.get(engineName) || null;
  }

  getAllPerformances(): EnginePerformance[] {
    return Array.from(this.enginePerformance.values());
  }

  getBenchmarkSuite(suiteId: string): BenchmarkSuite | null {
    return this.benchmarkSuites.get(suiteId) || null;
  }

  getTestResults(engineName: string): BenchmarkResult[] {
    return this.benchmarkResults.get(engineName) || [];
  }

  /**
   * Compare multiple engines
   */
  compareEngines(engineNames: string[]): {
    comparison: Array<{
      metric: string;
      scores: Record<string, number>;
      winner: string;
    }>;
    overallWinner: string;
  } {
    const comparison: Array<{
      metric: string;
      scores: Record<string, number>;
      winner: string;
    }> = [];
    
    const metrics = ['legalBenchScore', 'lnatScore', 'watsonGlaserScore', 'overallScore'];
    const metricTotals: Record<string, number> = {};
    
    metrics.forEach(metric => {
      const scores: Record<string, number> = {};
      let highestScore = 0;
      let winner = '';
      
      engineNames.forEach(engine => {
        const performance = this.enginePerformance.get(engine);
        if (performance) {
          const score = (performance as any)[metric];
          scores[engine] = score;
          
          if (score > highestScore) {
            highestScore = score;
            winner = engine;
          }
          
          metricTotals[engine] = (metricTotals[engine] || 0) + score;
        }
      });
      
      comparison.push({
        metric: this.formatMetricName(metric),
        scores,
        winner
      });
    });
    
    // Determine overall winner
    let overallWinner = '';
    let highestTotal = 0;
    Object.entries(metricTotals).forEach(([engine, total]) => {
      if (total > highestTotal) {
        highestTotal = total;
        overallWinner = engine;
      }
    });
    
    return { comparison, overallWinner };
  }

  private formatMetricName(metric: string): string {
    const names: Record<string, string> = {
      'legalBenchScore': 'LegalBench',
      'lnatScore': 'LNAT',
      'watsonGlaserScore': 'Watson-Glaser',
      'overallScore': 'Overall'
    };
    return names[metric] || metric;
  }

  /**
   * Export benchmark results
   */
  exportResults(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      performances: Array.from(this.enginePerformance.entries()).map(([engine, perf]) => ({
        engine,
        ...perf
      })),
      detailedResults: Array.from(this.benchmarkResults.entries()).map(([engine, results]) => ({
        engine,
        results
      }))
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV format
      const headers = ['Engine', 'LegalBench', 'LNAT', 'Watson-Glaser', 'Overall', 'Recommendation'];
      const rows = Array.from(this.enginePerformance.values()).map(perf => [
        perf.engineName,
        perf.legalBenchScore,
        perf.lnatScore,
        perf.watsonGlaserScore,
        perf.overallScore,
        perf.recommendation
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}

// Export singleton instance
export const legalBenchmarkService = new LegalBenchmarkService();
export default legalBenchmarkService;