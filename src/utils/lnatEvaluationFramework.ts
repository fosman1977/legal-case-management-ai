/**
 * LNAT-Style AI Model Evaluation Framework
 * Based on the Law National Aptitude Test format for legal reasoning assessment
 */

export interface LNATQuestion {
  id: string;
  passageId: string;
  passage: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-3 index
  reasoning: string;
  skillsTested: LNATSkill[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'critical-reading' | 'logical-reasoning' | 'argument-analysis' | 'inference';
}

export interface LNATEssayPrompt {
  id: string;
  prompt: string;
  category: 'ethics' | 'policy' | 'social-issues' | 'current-affairs';
  expectedLength: number; // word count
  scoringCriteria: string[];
  timeLimit: number; // minutes
}

export interface LNATSkill {
  name: string;
  description: string;
  weight: number; // scoring weight
}

export interface ModelLNATResult {
  modelId: string;
  sectionAScore: number; // out of 42
  sectionAPercentage: number;
  sectionBScore: number; // out of 10
  essayAnalysis: {
    argumentQuality: number;
    logicalStructure: number;
    evidenceUsage: number;
    clarity: number;
    conclusion: number;
  };
  overallScore: number;
  skillBreakdown: Record<string, number>;
  timeToComplete: number;
  strengths: string[];
  weaknesses: string[];
  evaluationDate: string;
}

export interface LNATTestSuite {
  sectionA: LNATQuestion[];
  sectionB: LNATEssayPrompt[];
  metadata: {
    version: string;
    created: string;
    totalQuestions: number;
    estimatedTime: number;
  };
}

// Core LNAT skills based on official test criteria
export const LNAT_SKILLS: LNATSkill[] = [
  {
    name: 'critical-reading',
    description: 'Ability to understand and analyze complex texts',
    weight: 0.25
  },
  {
    name: 'logical-reasoning',
    description: 'Making valid inferences and deductions',
    weight: 0.25
  },
  {
    name: 'argument-analysis',
    description: 'Identifying strengths and weaknesses in arguments',
    weight: 0.20
  },
  {
    name: 'fact-opinion-distinction',
    description: 'Distinguishing between facts, opinions, and speculation',
    weight: 0.15
  },
  {
    name: 'verbal-reasoning',
    description: 'Understanding and manipulating verbal information',
    weight: 0.15
  }
];

// Sample LNAT-style questions based on research
export const SAMPLE_LNAT_QUESTIONS: LNATQuestion[] = [
  {
    id: 'lnat-001',
    passageId: 'passage-ethics-001',
    passage: `The rise of artificial intelligence in legal practice has sparked intense debate about the future of the legal profession. Proponents argue that AI can democratize access to justice by reducing costs and increasing efficiency. Legal document analysis, contract review, and case research can now be performed in minutes rather than hours. However, critics worry that the human element—essential for understanding nuance, context, and ethical considerations—may be lost.

    The Law Society has published guidelines requiring that AI-assisted legal work must always be supervised by qualified lawyers. They argue that while AI can process vast amounts of information quickly, it cannot replace the professional judgment that comes from years of training and experience. Furthermore, questions of liability arise: if an AI system makes an error in legal advice, who is responsible—the software company, the law firm, or the individual lawyer?

    Recent studies suggest that junior lawyers may benefit most from AI assistance, as it allows them to focus on higher-level analytical work rather than routine document review. However, this raises concerns about the traditional apprenticeship model of legal education, where junior lawyers learn through exposure to all aspects of legal practice.`,
    question: 'Which of the following best represents the main concern expressed by critics of AI in legal practice?',
    options: [
      'AI systems are too expensive for most law firms to implement effectively',
      'The loss of human judgment and nuanced understanding in legal work',
      'AI will make all lawyers redundant within the next decade',
      'Junior lawyers will not receive adequate training opportunities'
    ],
    correctAnswer: 1,
    reasoning: 'The passage explicitly states that critics worry about losing "the human element—essential for understanding nuance, context, and ethical considerations"',
    skillsTested: [
      { name: 'critical-reading', description: 'Understanding main arguments', weight: 0.4 },
      { name: 'argument-analysis', description: 'Identifying key concerns', weight: 0.6 }
    ],
    difficulty: 'medium',
    category: 'critical-reading'
  },
  {
    id: 'lnat-002',
    passageId: 'passage-ethics-001',
    passage: `The rise of artificial intelligence in legal practice has sparked intense debate about the future of the legal profession. Proponents argue that AI can democratize access to justice by reducing costs and increasing efficiency. Legal document analysis, contract review, and case research can now be performed in minutes rather than hours. However, critics worry that the human element—essential for understanding nuance, context, and ethical considerations—may be lost.

    The Law Society has published guidelines requiring that AI-assisted legal work must always be supervised by qualified lawyers. They argue that while AI can process vast amounts of information quickly, it cannot replace the professional judgment that comes from years of training and experience. Furthermore, questions of liability arise: if an AI system makes an error in legal advice, who is responsible—the software company, the law firm, or the individual lawyer?

    Recent studies suggest that junior lawyers may benefit most from AI assistance, as it allows them to focus on higher-level analytical work rather than routine document review. However, this raises concerns about the traditional apprenticeship model of legal education, where junior lawyers learn through exposure to all aspects of legal practice.`,
    question: 'According to the passage, the Law Society\'s position on AI in legal practice is:',
    options: [
      'AI should be banned from legal practice entirely',
      'AI can be used but must be supervised by qualified lawyers',
      'AI is superior to human lawyers in most legal tasks',
      'AI should only be used by junior lawyers for training purposes'
    ],
    correctAnswer: 1,
    reasoning: 'The passage directly states that "The Law Society has published guidelines requiring that AI-assisted legal work must always be supervised by qualified lawyers"',
    skillsTested: [
      { name: 'critical-reading', description: 'Extracting specific information', weight: 0.7 },
      { name: 'fact-opinion-distinction', description: 'Identifying factual claims', weight: 0.3 }
    ],
    difficulty: 'easy',
    category: 'critical-reading'
  },
  {
    id: 'lnat-003',
    passageId: 'passage-policy-001',
    passage: `The debate over mandatory vaccination policies has revealed fundamental tensions between individual liberty and collective public health. Supporters of vaccine mandates argue that vaccination is not merely a personal choice but a social responsibility, as unvaccinated individuals can pose risks to vulnerable populations who cannot be vaccinated due to medical conditions.

    However, opponents contend that mandatory vaccination violates principles of bodily autonomy and informed consent that are central to medical ethics. They argue that individuals should have the right to make their own medical decisions, even if those decisions are viewed as misguided by public health authorities.

    The legal landscape is complex, with courts generally upholding vaccine mandates for school attendance and healthcare workers, while being more skeptical of broader mandates for the general population. The Supreme Court has historically recognized that individual rights are not absolute when they conflict with compelling state interests in public health.`,
    question: 'Which of the following can be logically inferred from the passage?',
    options: [
      'All vaccine mandates have been upheld by the Supreme Court',
      'Medical conditions prevent some people from being vaccinated',
      'Individual rights always override public health concerns',
      'Healthcare workers are exempt from vaccination requirements'
    ],
    correctAnswer: 1,
    reasoning: 'The passage states that "unvaccinated individuals can pose risks to vulnerable populations who cannot be vaccinated due to medical conditions", which directly supports option B',
    skillsTested: [
      { name: 'logical-reasoning', description: 'Making valid inferences', weight: 0.6 },
      { name: 'critical-reading', description: 'Understanding implications', weight: 0.4 }
    ],
    difficulty: 'medium',
    category: 'inference'
  }
];

export const SAMPLE_ESSAY_PROMPTS: LNATEssayPrompt[] = [
  {
    id: 'essay-001',
    prompt: 'Should artificial intelligence be allowed to make decisions in criminal justice proceedings? Consider both the potential benefits and risks.',
    category: 'ethics',
    expectedLength: 600,
    scoringCriteria: [
      'Clear thesis statement and position',
      'Balanced consideration of multiple perspectives',
      'Use of relevant examples or evidence',
      'Logical structure and flow',
      'Strong conclusion that follows from arguments'
    ],
    timeLimit: 40
  },
  {
    id: 'essay-002',
    prompt: 'Privacy is dead in the digital age. Do you agree?',
    category: 'social-issues',
    expectedLength: 600,
    scoringCriteria: [
      'Demonstrates understanding of privacy concepts',
      'Addresses digital technology impacts',
      'Provides specific examples',
      'Shows awareness of counterarguments',
      'Clear and persuasive writing style'
    ],
    timeLimit: 40
  },
  {
    id: 'essay-003',
    prompt: 'Make the strongest case you can for or against the statement: "The law should reflect moral values"',
    category: 'ethics',
    expectedLength: 600,
    scoringCriteria: [
      'Takes a clear position on the statement',
      'Demonstrates understanding of law vs. morality relationship',
      'Uses philosophical or legal examples effectively',
      'Addresses potential objections',
      'Maintains coherent argument throughout'
    ],
    timeLimit: 40
  }
];

export class LNATEvaluationFramework {
  private testSuite: LNATTestSuite;

  constructor() {
    this.testSuite = {
      sectionA: SAMPLE_LNAT_QUESTIONS,
      sectionB: SAMPLE_ESSAY_PROMPTS,
      metadata: {
        version: '1.0',
        created: new Date().toISOString(),
        totalQuestions: SAMPLE_LNAT_QUESTIONS.length,
        estimatedTime: 135 // 95 minutes for Section A + 40 for Section B
      }
    };
  }

  /**
   * Run the complete LNAT-style evaluation for a specific AI model
   */
  async evaluateModel(
    modelId: string,
    aiClient: any,
    options: {
      includeEssay?: boolean;
      timeLimit?: number;
      debugMode?: boolean;
    } = {}
  ): Promise<ModelLNATResult> {
    const startTime = Date.now();
    
    console.log(`Starting LNAT evaluation for model: ${modelId}`);
    
    // Section A: Multiple Choice Questions
    const sectionAResults = await this.runSectionA(modelId, aiClient, options);
    
    // Section B: Essay (optional)
    const sectionBResults = options.includeEssay 
      ? await this.runSectionB(modelId, aiClient, options)
      : null;
    
    const endTime = Date.now();
    const timeToComplete = (endTime - startTime) / 1000 / 60; // minutes
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(sectionAResults, sectionBResults);
    
    // Analyze strengths and weaknesses
    const { strengths, weaknesses } = this.analyzePerformance(sectionAResults, sectionBResults);
    
    return {
      modelId,
      sectionAScore: sectionAResults.score,
      sectionAPercentage: (sectionAResults.score / this.testSuite.sectionA.length) * 100,
      sectionBScore: sectionBResults?.score || 0,
      essayAnalysis: sectionBResults?.analysis || {
        argumentQuality: 0,
        logicalStructure: 0,
        evidenceUsage: 0,
        clarity: 0,
        conclusion: 0
      },
      overallScore,
      skillBreakdown: sectionAResults.skillBreakdown,
      timeToComplete,
      strengths,
      weaknesses,
      evaluationDate: new Date().toISOString()
    };
  }

  /**
   * Run Section A: Multiple Choice Questions
   */
  private async runSectionA(modelId: string, aiClient: any, options: any): Promise<any> {
    const results = {
      score: 0,
      responses: [] as any[],
      skillBreakdown: {} as Record<string, number>
    };

    // Initialize skill tracking
    LNAT_SKILLS.forEach(skill => {
      results.skillBreakdown[skill.name] = 0;
    });

    for (const question of this.testSuite.sectionA) {
      try {
        const response = await this.askMultipleChoiceQuestion(question, aiClient, options);
        const isCorrect = response.selectedAnswer === question.correctAnswer;
        
        if (isCorrect) {
          results.score++;
          // Add to skill scores
          question.skillsTested.forEach(skill => {
            results.skillBreakdown[skill.name] += skill.weight;
          });
        }
        
        results.responses.push({
          questionId: question.id,
          selectedAnswer: response.selectedAnswer,
          reasoning: response.reasoning,
          correct: isCorrect,
          timeSpent: response.timeSpent
        });
        
        if (options.debugMode) {
          console.log(`Question ${question.id}: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
        }
        
      } catch (error) {
        console.error(`Error processing question ${question.id}:`, error);
        results.responses.push({
          questionId: question.id,
          selectedAnswer: -1,
          reasoning: 'Error occurred',
          correct: false,
          timeSpent: 0
        });
      }
    }

    return results;
  }

  /**
   * Ask a multiple choice question to the AI model
   */
  private async askMultipleChoiceQuestion(question: LNATQuestion, aiClient: any, options: any): Promise<any> {
    const startTime = Date.now();
    
    const prompt = `
Read the following passage carefully and answer the question based solely on the information provided.

PASSAGE:
${question.passage}

QUESTION: ${question.question}

OPTIONS:
A) ${question.options[0]}
B) ${question.options[1]}
C) ${question.options[2]}
D) ${question.options[3]}

Please provide your answer in the following format:
ANSWER: [A, B, C, or D]
REASONING: [Brief explanation of your reasoning]

Think step by step and select the best answer based on the passage.
`;

    try {
      // Use chat method for UnifiedAIClient compatibility
      const response = await aiClient.chat([
        { role: 'user', content: prompt }
      ]);
      
      const timeSpent = (Date.now() - startTime) / 1000;
      
      // Parse the response - handle both string and object responses
      const responseText = typeof response === 'string' ? response : response.content || '';
      const answerMatch = responseText.match(/ANSWER:\s*([ABCD])/i);
      const reasoningMatch = responseText.match(/REASONING:\s*(.+)/i);
      
      const selectedAnswer = answerMatch ? 
        ['A', 'B', 'C', 'D'].indexOf(answerMatch[1].toUpperCase()) : -1;
      
      return {
        selectedAnswer,
        reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided',
        timeSpent,
        rawResponse: responseText
      };
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      return {
        selectedAnswer: -1,
        reasoning: 'Error occurred during evaluation',
        timeSpent: 0,
        rawResponse: ''
      };
    }
  }

  /**
   * Run Section B: Essay Questions
   */
  private async runSectionB(modelId: string, aiClient: any, options: any): Promise<any> {
    // For now, just evaluate one essay prompt
    const prompt = this.testSuite.sectionB[0];
    
    const essayPrompt = `
Write a well-structured essay responding to the following prompt. Your essay should be approximately ${prompt.expectedLength} words and demonstrate clear reasoning, balanced analysis, and a strong conclusion.

PROMPT: ${prompt.prompt}

Please write your essay below:
`;

    try {
      const startTime = Date.now();
      const response = await aiClient.completion(essayPrompt, {
        maxTokens: Math.ceil(prompt.expectedLength * 1.5), // Allow for longer responses
        temperature: 0.3 // Some creativity but still focused
      });
      const timeSpent = (Date.now() - startTime) / 1000;
      
      // Basic essay analysis (would need more sophisticated NLP in practice)
      const analysis = this.analyzeEssay(response, prompt);
      const score = this.scoreEssay(analysis);
      
      return {
        score,
        analysis,
        essay: response,
        timeSpent,
        wordCount: response.split(/\s+/).length
      };
      
    } catch (error) {
      console.error('Error generating essay:', error);
      return {
        score: 0,
        analysis: {
          argumentQuality: 0,
          logicalStructure: 0,
          evidenceUsage: 0,
          clarity: 0,
          conclusion: 0
        },
        essay: '',
        timeSpent: 0,
        wordCount: 0
      };
    }
  }

  /**
   * Basic essay analysis (simplified version)
   */
  private analyzeEssay(essay: string, prompt: LNATEssayPrompt): any {
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = essay.split(/\s+/).filter(w => w.length > 0);
    
    return {
      argumentQuality: Math.min(10, sentences.length * 0.3), // Basic heuristic
      logicalStructure: essay.includes('however') || essay.includes('therefore') ? 8 : 5,
      evidenceUsage: essay.includes('example') || essay.includes('evidence') ? 7 : 4,
      clarity: Math.min(10, words.length / prompt.expectedLength * 10),
      conclusion: essay.toLowerCase().includes('conclusion') || essay.toLowerCase().includes('therefore') ? 8 : 5
    };
  }

  /**
   * Score essay based on analysis
   */
  private scoreEssay(analysis: any): number {
    const total = analysis.argumentQuality + analysis.logicalStructure + 
                 analysis.evidenceUsage + analysis.clarity + analysis.conclusion;
    return Math.round((total / 50) * 10); // Scale to 0-10
  }

  /**
   * Calculate overall LNAT-style score
   */
  private calculateOverallScore(sectionAResults: any, sectionBResults: any): number {
    const sectionAWeight = 0.8; // Section A is more heavily weighted
    const sectionBWeight = 0.2;
    
    const sectionAScore = (sectionAResults.score / this.testSuite.sectionA.length) * 100;
    const sectionBScore = sectionBResults ? (sectionBResults.score / 10) * 100 : 0;
    
    return Math.round(sectionAScore * sectionAWeight + sectionBScore * sectionBWeight);
  }

  /**
   * Analyze performance to identify strengths and weaknesses
   */
  private analyzePerformance(sectionAResults: any, sectionBResults: any): { strengths: string[], weaknesses: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Analyze Section A skills
    Object.entries(sectionAResults.skillBreakdown).forEach(([skill, score]: [string, any]) => {
      const maxPossible = LNAT_SKILLS.find(s => s.name === skill)?.weight || 1;
      const percentage = (score / maxPossible) * 100;
      
      if (percentage >= 75) {
        strengths.push(`Strong ${skill.replace('-', ' ')}`);
      } else if (percentage <= 40) {
        weaknesses.push(`Needs improvement in ${skill.replace('-', ' ')}`);
      }
    });
    
    // Analyze essay performance
    if (sectionBResults) {
      if (sectionBResults.analysis.argumentQuality >= 7) {
        strengths.push('Strong argumentative writing');
      }
      if (sectionBResults.analysis.logicalStructure <= 5) {
        weaknesses.push('Essay structure and organization');
      }
    }
    
    return { strengths, weaknesses };
  }

  /**
   * Get test suite for external use
   */
  getTestSuite(): LNATTestSuite {
    return this.testSuite;
  }

  /**
   * Add custom questions to test suite
   */
  addQuestion(question: LNATQuestion): void {
    this.testSuite.sectionA.push(question);
    this.testSuite.metadata.totalQuestions++;
  }

  /**
   * Add custom essay prompt
   */
  addEssayPrompt(prompt: LNATEssayPrompt): void {
    this.testSuite.sectionB.push(prompt);
  }
}

export default LNATEvaluationFramework;