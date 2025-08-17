/**
 * Watson Glaser Critical Thinking Test Framework for AI Model Evaluation
 * Based on the Watson Glaser Critical Thinking Appraisal methodology
 */

export interface WatsonGlaserQuestion {
  id: string;
  section: WatsonGlaserSection;
  passage: string;
  question: string;
  options: string[];
  correctAnswer: number | number[]; // Can be single answer or multiple for complex scoring
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  businessContext: string;
}

export interface WatsonGlaserSection {
  name: 'inference' | 'assumptions' | 'deduction' | 'interpretation' | 'evaluation';
  description: string;
  instruction: string;
  answerFormat: 'binary' | 'multiple' | 'scale';
}

export interface WatsonGlaserResult {
  modelId: string;
  overallScore: number; // out of 40
  percentileRank: number; // 0-100
  sectionScores: {
    inference: number;
    assumptions: number;
    deduction: number;
    interpretation: number;
    evaluation: number;
  };
  timeToComplete: number; // minutes
  accuracy: number; // percentage
  strengths: string[];
  weaknesses: string[];
  grade: 'Excellent' | 'Strong' | 'Good' | 'Average' | 'Below Average';
  recommendation: string;
  evaluationDate: string;
}

export interface WatsonGlaserTestSuite {
  questions: WatsonGlaserQuestion[];
  sections: WatsonGlaserSection[];
  metadata: {
    version: string;
    totalQuestions: number;
    timeLimit: number; // minutes
    passingScore: number;
    created: string;
  };
}

// Define the 5 Watson Glaser sections
export const WATSON_GLASER_SECTIONS: WatsonGlaserSection[] = [
  {
    name: 'inference',
    description: 'Drawing logical conclusions from observed or assumed facts',
    instruction: 'For each statement, determine the degree of truth or falsity based solely on the information provided.',
    answerFormat: 'scale'
  },
  {
    name: 'assumptions',
    description: 'Identifying unstated assumptions underlying given statements',
    instruction: 'Determine whether each statement makes the given assumption or not.',
    answerFormat: 'binary'
  },
  {
    name: 'deduction',
    description: 'Determining whether conclusions logically follow from premises',
    instruction: 'Decide whether each conclusion necessarily follows from the given premises.',
    answerFormat: 'binary'
  },
  {
    name: 'interpretation',
    description: 'Weighing evidence and determining if conclusions follow logically',
    instruction: 'Determine whether each conclusion follows beyond reasonable doubt from the given information.',
    answerFormat: 'binary'
  },
  {
    name: 'evaluation',
    description: 'Distinguishing between strong and weak arguments',
    instruction: 'Determine whether each argument is strong or weak in relation to the question.',
    answerFormat: 'binary'
  }
];

// Sample Watson Glaser questions based on research and typical formats
export const SAMPLE_WATSON_GLASER_QUESTIONS: WatsonGlaserQuestion[] = [
  // INFERENCE SECTION
  {
    id: 'wg-inf-001',
    section: WATSON_GLASER_SECTIONS[0],
    passage: `A legal technology company reported a 40% increase in revenue this quarter compared to the same period last year. The company's main products include AI-powered document review software and contract analysis tools. During this period, the legal industry experienced significant growth in technology adoption, with many law firms investing heavily in automation tools.`,
    question: 'The company\'s revenue increase was primarily due to increased demand for legal technology.',
    options: [
      'Definitely true',
      'Probably true', 
      'Insufficient data',
      'Probably false',
      'Definitely false'
    ],
    correctAnswer: 2, // Insufficient data
    explanation: 'While the context suggests this could be a factor, we cannot definitively conclude the primary cause without more specific data about what drove the revenue increase.',
    difficulty: 'medium',
    businessContext: 'Legal technology market analysis'
  },
  {
    id: 'wg-inf-002',
    section: WATSON_GLASER_SECTIONS[0],
    passage: `Law firm ABC implemented a new case management system six months ago. Since implementation, the firm has seen a 25% reduction in time spent on administrative tasks and a 15% increase in billable hours per lawyer. Client satisfaction scores have also improved by 20%.`,
    question: 'The new case management system directly caused the improvement in client satisfaction.',
    options: [
      'Definitely true',
      'Probably true',
      'Insufficient data', 
      'Probably false',
      'Definitely false'
    ],
    correctAnswer: 2, // Insufficient data
    explanation: 'While there is correlation, we cannot establish direct causation without ruling out other factors that might have contributed to improved client satisfaction.',
    difficulty: 'medium',
    businessContext: 'Law firm operations'
  },

  // ASSUMPTIONS SECTION
  {
    id: 'wg-ass-001',
    section: WATSON_GLASER_SECTIONS[1],
    passage: `Statement: "We should hire more junior associates because our current workload exceeds our capacity."`,
    question: 'Assumption: Junior associates can effectively handle the type of work that is causing the capacity issues.',
    options: [
      'Assumption made',
      'Assumption not made'
    ],
    correctAnswer: 0, // Assumption made
    explanation: 'The statement assumes that hiring junior associates will solve the capacity problem, which implies they can handle the relevant work.',
    difficulty: 'easy',
    businessContext: 'Law firm staffing decisions'
  },
  {
    id: 'wg-ass-002', 
    section: WATSON_GLASER_SECTIONS[1],
    passage: `Statement: "All law firms should adopt AI tools to remain competitive in the market."`,
    question: 'Assumption: AI tools provide a competitive advantage in the legal industry.',
    options: [
      'Assumption made',
      'Assumption not made'
    ],
    correctAnswer: 0, // Assumption made
    explanation: 'The statement assumes AI tools are necessary for competitiveness, implying they provide an advantage.',
    difficulty: 'easy',
    businessContext: 'Legal technology adoption'
  },

  // DEDUCTION SECTION
  {
    id: 'wg-ded-001',
    section: WATSON_GLASER_SECTIONS[2], 
    passage: `Premises: All successful law firms invest in technology. Firm XYZ is a successful law firm.`,
    question: 'Conclusion: Firm XYZ invests in technology.',
    options: [
      'Conclusion follows',
      'Conclusion does not follow'
    ],
    correctAnswer: 0, // Conclusion follows
    explanation: 'This is a valid logical deduction. If all successful firms invest in technology and XYZ is successful, then XYZ must invest in technology.',
    difficulty: 'easy',
    businessContext: 'Legal industry analysis'
  },
  {
    id: 'wg-ded-002',
    section: WATSON_GLASER_SECTIONS[2],
    passage: `Premises: Some corporate lawyers specialize in mergers and acquisitions. All lawyers who specialize in M&A command high fees.`,
    question: 'Conclusion: All corporate lawyers command high fees.',
    options: [
      'Conclusion follows', 
      'Conclusion does not follow'
    ],
    correctAnswer: 1, // Conclusion does not follow
    explanation: 'The conclusion does not follow because only "some" corporate lawyers specialize in M&A, not all.',
    difficulty: 'medium',
    businessContext: 'Legal specialization and fees'
  },

  // INTERPRETATION SECTION
  {
    id: 'wg-int-001',
    section: WATSON_GLASER_SECTIONS[3],
    passage: `A survey of 500 law firms found that 78% reported using at least one form of legal technology. The survey also found that firms using technology reported 23% higher client retention rates on average. The study controlled for firm size, practice areas, and geographic location.`,
    question: 'Technology adoption is associated with better client retention in law firms.',
    options: [
      'Conclusion follows',
      'Conclusion does not follow'
    ],
    correctAnswer: 0, // Conclusion follows
    explanation: 'The data shows a clear association between technology use and higher client retention rates in a controlled study.',
    difficulty: 'easy',
    businessContext: 'Legal technology impact study'
  },
  {
    id: 'wg-int-002',
    section: WATSON_GLASER_SECTIONS[3],
    passage: `A legal ethics committee reviewed 200 cases of professional misconduct over the past year. 85% of the cases involved lawyers with less than 5 years of experience. The committee noted that junior lawyers often struggle with time management and client communication.`,
    question: 'Inexperience is the primary cause of professional misconduct among lawyers.',
    options: [
      'Conclusion follows',
      'Conclusion does not follow'
    ],
    correctAnswer: 1, // Conclusion does not follow
    explanation: 'While there is correlation with experience level, the passage does not establish inexperience as the primary cause.',
    difficulty: 'medium',
    businessContext: 'Legal professional standards'
  },

  // EVALUATION SECTION
  {
    id: 'wg-eval-001',
    section: WATSON_GLASER_SECTIONS[4],
    passage: `Question: Should law schools require students to take courses in legal technology?`,
    question: 'Argument: Yes, because the legal profession is increasingly relying on technology, and lawyers need these skills to serve clients effectively.',
    options: [
      'Strong argument',
      'Weak argument'
    ],
    correctAnswer: 0, // Strong argument
    explanation: 'This is a strong argument because it provides a relevant reason (industry trend) and connects it to client service (professional duty).',
    difficulty: 'easy',
    businessContext: 'Legal education policy'
  },
  {
    id: 'wg-eval-002',
    section: WATSON_GLASER_SECTIONS[4],
    passage: `Question: Should large law firms be required to disclose their use of AI in legal work to clients?`,
    question: 'Argument: No, because AI tools are just like any other software tools that firms use, such as word processors or legal databases.',
    options: [
      'Strong argument',
      'Weak argument'
    ],
    correctAnswer: 1, // Weak argument
    explanation: 'This is a weak argument because it oversimplifies the differences between AI and traditional software tools, ignoring potential ethical and transparency concerns.',
    difficulty: 'medium',
    businessContext: 'Legal AI ethics and disclosure'
  },

  // Additional complex questions for comprehensive testing
  {
    id: 'wg-inf-003',
    section: WATSON_GLASER_SECTIONS[0],
    passage: `An international law firm opened offices in three new countries last year. The firm's global revenue increased by 30%, while the legal services market in those countries grew by an average of 12%. The firm's existing offices maintained steady performance.`,
    question: 'The firm\'s expansion strategy was more successful than the general market performance in the new countries.',
    options: [
      'Definitely true',
      'Probably true',
      'Insufficient data',
      'Probably false', 
      'Definitely false'
    ],
    correctAnswer: 1, // Probably true
    explanation: 'The firm\'s 30% growth significantly exceeds the 12% market average, suggesting superior performance, though other factors could contribute.',
    difficulty: 'hard',
    businessContext: 'International law firm expansion'
  },

  {
    id: 'wg-ass-003',
    section: WATSON_GLASER_SECTIONS[1],
    passage: `Statement: "We need to increase our marketing budget to attract more high-value corporate clients."`,
    question: 'Assumption: The current marketing efforts are insufficient to attract high-value corporate clients.',
    options: [
      'Assumption made',
      'Assumption not made'
    ],
    correctAnswer: 0, // Assumption made
    explanation: 'The statement implies current marketing is inadequate, requiring more budget to achieve the goal.',
    difficulty: 'medium',
    businessContext: 'Law firm marketing strategy'
  }
];

export class WatsonGlaserEvaluationFramework {
  private testSuite: WatsonGlaserTestSuite;

  constructor() {
    this.testSuite = {
      questions: SAMPLE_WATSON_GLASER_QUESTIONS,
      sections: WATSON_GLASER_SECTIONS,
      metadata: {
        version: '1.0',
        totalQuestions: SAMPLE_WATSON_GLASER_QUESTIONS.length,
        timeLimit: 30,
        passingScore: 30, // 75% of 40 questions
        created: new Date().toISOString()
      }
    };
  }

  /**
   * Evaluate a single AI model using Watson Glaser methodology
   */
  async evaluateModel(
    modelId: string,
    aiClient: any,
    options: {
      timeLimit?: number;
      debugMode?: boolean;
    } = {}
  ): Promise<WatsonGlaserResult> {
    const startTime = Date.now();
    
    console.log(`Starting Watson Glaser evaluation for model: ${modelId}`);
    
    const sectionScores = {
      inference: 0,
      assumptions: 0,
      deduction: 0,
      interpretation: 0,
      evaluation: 0
    };

    const responses: any[] = [];
    let correctAnswers = 0;

    // Process each question
    for (const question of this.testSuite.questions) {
      try {
        const response = await this.askQuestion(question, aiClient, options);
        const isCorrect = this.evaluateResponse(question, response);
        
        if (isCorrect) {
          correctAnswers++;
          sectionScores[question.section.name]++;
        }

        responses.push({
          questionId: question.id,
          section: question.section.name,
          response: response.answer,
          correct: isCorrect,
          timeSpent: response.timeSpent,
          reasoning: response.reasoning
        });

        if (options.debugMode) {
          console.log(`Question ${question.id} (${question.section.name}): ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
        }

      } catch (error) {
        console.error(`Error processing question ${question.id}:`, error);
        responses.push({
          questionId: question.id,
          section: question.section.name,
          response: -1,
          correct: false,
          timeSpent: 0,
          reasoning: 'Error occurred'
        });
      }
    }

    const endTime = Date.now();
    const timeToComplete = (endTime - startTime) / 1000 / 60; // minutes
    const accuracy = (correctAnswers / this.testSuite.questions.length) * 100;
    const percentileRank = this.calculatePercentileRank(correctAnswers);
    const grade = this.calculateGrade(percentileRank);
    const { strengths, weaknesses } = this.analyzePerformance(sectionScores, responses);

    return {
      modelId,
      overallScore: correctAnswers,
      percentileRank,
      sectionScores,
      timeToComplete,
      accuracy,
      strengths,
      weaknesses,
      grade,
      recommendation: this.generateRecommendation(grade, strengths, weaknesses),
      evaluationDate: new Date().toISOString()
    };
  }

  /**
   * Ask a single Watson Glaser question to the AI model
   */
  private async askQuestion(question: WatsonGlaserQuestion, aiClient: any, options: any): Promise<any> {
    const startTime = Date.now();

    const prompt = this.buildQuestionPrompt(question);

    try {
      const response = await aiClient.completion(prompt, {
        maxTokens: 150,
        temperature: 0.1 // Low temperature for consistent reasoning
      });

      const timeSpent = (Date.now() - startTime) / 1000;
      const parsed = this.parseResponse(response, question);

      return {
        answer: parsed.answer,
        reasoning: parsed.reasoning,
        timeSpent,
        rawResponse: response
      };

    } catch (error) {
      console.error('Error getting AI response:', error);
      return {
        answer: -1,
        reasoning: 'Error occurred during evaluation',
        timeSpent: 0,
        rawResponse: ''
      };
    }
  }

  /**
   * Build appropriate prompt for each question type
   */
  private buildQuestionPrompt(question: WatsonGlaserQuestion): string {
    const sectionInstructions = {
      'inference': 'Based ONLY on the information provided, determine the degree of truth or falsity of the statement. Do not use external knowledge.',
      'assumptions': 'Determine whether the given statement makes the specified assumption. An assumption is something taken for granted or supposed to be true.',
      'deduction': 'Determine whether the conclusion logically follows from the given premises. Focus on logical necessity, not probability.',
      'interpretation': 'Determine whether the conclusion follows beyond reasonable doubt from the given information.',
      'evaluation': 'Evaluate whether the argument is strong or weak. A strong argument is both relevant and important to the question.'
    };

    let optionsText = '';
    question.options.forEach((option, index) => {
      optionsText += `${String.fromCharCode(65 + index)}) ${option}\n`;
    });

    return `
INSTRUCTIONS: ${sectionInstructions[question.section.name]}

PASSAGE:
${question.passage}

QUESTION: ${question.question}

OPTIONS:
${optionsText}

Please provide your answer in this exact format:
ANSWER: [Letter A, B, C, D, or E]
REASONING: [Brief explanation of your reasoning]

Think carefully and select the most appropriate answer based on the instructions.
`;
  }

  /**
   * Parse AI response to extract answer and reasoning
   */
  private parseResponse(response: string, question: WatsonGlaserQuestion): any {
    const answerMatch = response.match(/ANSWER:\s*([ABCDE])/i);
    const reasoningMatch = response.match(/REASONING:\s*(.+)/i);

    let answerIndex = -1;
    if (answerMatch) {
      answerIndex = answerMatch[1].toUpperCase().charCodeAt(0) - 65;
      // Validate answer is within range
      if (answerIndex < 0 || answerIndex >= question.options.length) {
        answerIndex = -1;
      }
    }

    return {
      answer: answerIndex,
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided'
    };
  }

  /**
   * Evaluate if the AI's response is correct
   */
  private evaluateResponse(question: WatsonGlaserQuestion, response: any): boolean {
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.includes(response.answer);
    }
    return response.answer === question.correctAnswer;
  }

  /**
   * Calculate percentile rank based on score
   */
  private calculatePercentileRank(score: number): number {
    // Based on typical Watson Glaser scoring distributions
    const scoreToPercentile: Record<number, number> = {
      40: 99, 39: 98, 38: 95, 37: 92, 36: 90,
      35: 87, 34: 85, 33: 80, 32: 75, 31: 70,
      30: 65, 29: 60, 28: 55, 27: 50, 26: 45,
      25: 40, 24: 35, 23: 30, 22: 25, 21: 20,
      20: 15, 19: 12, 18: 10, 17: 8, 16: 6,
      15: 5, 14: 4, 13: 3, 12: 2, 11: 1
    };

    return scoreToPercentile[score] || (score > 40 ? 99 : 1);
  }

  /**
   * Calculate grade based on percentile rank
   */
  private calculateGrade(percentileRank: number): 'Excellent' | 'Strong' | 'Good' | 'Average' | 'Below Average' {
    if (percentileRank >= 90) return 'Excellent';
    if (percentileRank >= 80) return 'Strong';
    if (percentileRank >= 65) return 'Good';
    if (percentileRank >= 40) return 'Average';
    return 'Below Average';
  }

  /**
   * Analyze performance to identify strengths and weaknesses
   */
  private analyzePerformance(sectionScores: any, responses: any[]): { strengths: string[], weaknesses: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    const sectionTotals = {
      inference: responses.filter(r => r.section === 'inference').length,
      assumptions: responses.filter(r => r.section === 'assumptions').length,
      deduction: responses.filter(r => r.section === 'deduction').length,
      interpretation: responses.filter(r => r.section === 'interpretation').length,
      evaluation: responses.filter(r => r.section === 'evaluation').length
    };

    Object.entries(sectionScores).forEach(([section, score]: [string, any]) => {
      const total = sectionTotals[section as keyof typeof sectionTotals] || 1;
      const percentage = (score / total) * 100;

      if (percentage >= 80) {
        strengths.push(`Excellent ${section} skills`);
      } else if (percentage >= 65) {
        strengths.push(`Good ${section} ability`);
      } else if (percentage <= 40) {
        weaknesses.push(`Needs improvement in ${section}`);
      }
    });

    return { strengths, weaknesses };
  }

  /**
   * Generate recommendation based on performance
   */
  private generateRecommendation(grade: string, strengths: string[], weaknesses: string[]): string {
    const recommendations = {
      'Excellent': 'Outstanding critical thinking abilities suitable for complex legal reasoning tasks.',
      'Strong': 'Strong analytical skills well-suited for most legal applications requiring critical thinking.',
      'Good': 'Good reasoning abilities appropriate for standard legal tasks with some supervision.',
      'Average': 'Average performance may require additional support for complex critical thinking tasks.',
      'Below Average': 'Limited critical thinking capabilities may not be suitable for complex legal reasoning without significant oversight.'
    };

    let recommendation = recommendations[grade as keyof typeof recommendations];
    
    if (weaknesses.length > 0) {
      recommendation += ` Focus areas for improvement: ${weaknesses.join(', ')}.`;
    }

    return recommendation;
  }

  /**
   * Get test suite information
   */
  getTestSuite(): WatsonGlaserTestSuite {
    return this.testSuite;
  }

  /**
   * Add custom question to test suite
   */
  addQuestion(question: WatsonGlaserQuestion): void {
    this.testSuite.questions.push(question);
    this.testSuite.metadata.totalQuestions++;
  }

  /**
   * Get questions by section
   */
  getQuestionsBySection(sectionName: string): WatsonGlaserQuestion[] {
    return this.testSuite.questions.filter(q => q.section.name === sectionName);
  }
}

export default WatsonGlaserEvaluationFramework;