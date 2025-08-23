/**
 * Advanced Prompt Engineering System - Phase 3 Advanced AI Integration
 * Sophisticated prompt generation, optimization, and adaptation for legal consultations
 * Handles context-aware prompting, template management, and dynamic optimization
 */

import { EnhancedConsultationPattern } from './EnhancedPatternGenerator';
import { ConsultationRound, ConsultationSession } from './AIConsultationManager';

export interface PromptTemplate {
  id: string;
  name: string;
  category: 'initial' | 'follow_up' | 'deep_dive' | 'clarification' | 'strategic_pivot';
  description: string;
  template: string;
  variables: PromptVariable[];
  conditions: PromptCondition[];
  optimizationLevel: 'basic' | 'advanced' | 'expert';
  legalDomain: string[];
  effectiveness: {
    averageRating: number;
    usageCount: number;
    successRate: number;
  };
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'array' | 'object' | 'boolean';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    options?: string[];
  };
}

export interface PromptCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  description: string;
}

export interface PromptContext {
  caseComplexity: number;
  disputeNature: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  consultationStage: 'initial' | 'developing' | 'deep' | 'concluding';
  priorityAreas: string[];
  previousRounds: ConsultationRound[];
  sessionGoals: string[];
  timeConstraints?: string;
  budgetConstraints?: string;
  clientProfile: 'risk_averse' | 'balanced' | 'aggressive';
  legalFramework: string[];
}

export interface PromptOptimization {
  technique: 'chain_of_thought' | 'role_playing' | 'structured_output' | 'multi_perspective' | 'devil_advocate';
  description: string;
  applicability: {
    caseTypes: string[];
    consultationStages: string[];
    complexityLevels: number[];
  };
  implementation: string;
}

export interface GeneratedPrompt {
  id: string;
  content: string;
  templateUsed: string;
  context: PromptContext;
  optimizations: PromptOptimization[];
  expectedResponseStructure: ResponseStructure;
  metadata: {
    generatedAt: Date;
    estimatedTokens: number;
    complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
    confidenceScore: number;
  };
  qualityMetrics: {
    clarity: number;
    specificity: number;
    actionability: number;
    legalRelevance: number;
  };
}

export interface ResponseStructure {
  sections: ResponseSection[];
  format: 'markdown' | 'structured' | 'narrative' | 'bullet_points';
  expectedLength: 'short' | 'medium' | 'long' | 'comprehensive';
  requiredElements: string[];
}

export interface ResponseSection {
  title: string;
  purpose: string;
  expectedContent: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Advanced Prompt Engineering System for Legal Consultations
 */
export class AdvancedPromptEngine {
  private templates: Map<string, PromptTemplate> = new Map();
  private optimizations: PromptOptimization[] = [];
  private promptHistory: GeneratedPrompt[] = [];
  private performanceMetrics: Map<string, any> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeOptimizations();
  }

  /**
   * Generate optimized prompt based on consultation pattern and context
   */
  generatePrompt(
    consultationPattern: EnhancedConsultationPattern,
    context: Partial<PromptContext> = {},
    requestedType: PromptTemplate['category'] = 'initial'
  ): GeneratedPrompt {
    // Build comprehensive context
    const fullContext = this.buildPromptContext(consultationPattern, context);
    
    // Select optimal template
    const template = this.selectOptimalTemplate(requestedType, fullContext);
    
    // Apply optimizations
    const optimizations = this.selectOptimizations(template, fullContext);
    
    // Generate prompt content
    const content = this.generatePromptContent(template, fullContext, optimizations);
    
    // Define expected response structure
    const expectedResponseStructure = this.defineResponseStructure(template, fullContext);
    
    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(content, fullContext);
    
    const generatedPrompt: GeneratedPrompt = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      templateUsed: template.id,
      context: fullContext,
      optimizations,
      expectedResponseStructure,
      metadata: {
        generatedAt: new Date(),
        estimatedTokens: this.estimateTokens(content),
        complexity: this.assessComplexity(fullContext),
        confidenceScore: this.calculateConfidenceScore(template, fullContext, optimizations)
      },
      qualityMetrics
    };

    this.promptHistory.push(generatedPrompt);
    return generatedPrompt;
  }

  /**
   * Initialize prompt templates
   */
  private initializeTemplates(): void {
    const templates: PromptTemplate[] = [
      {
        id: 'comprehensive_initial',
        name: 'Comprehensive Initial Consultation',
        category: 'initial',
        description: 'Complete initial case analysis with strategic recommendations',
        template: `# Comprehensive Legal Strategy Consultation

## Case Overview
**Dispute Nature**: {{disputeNature}}
**Case Complexity**: {{caseComplexityPercent}}% complexity score
**Risk Assessment**: {{riskLevel}} risk level
**Legal Framework**: {{legalFramework}}

## Document Analysis Summary
{{documentAnalysisSummary}}

## Key Issues Identified

### Contradictions & Conflicts
{{contradictionSummary}}
{{#criticalIssues}}
**Critical Issues**:
{{#each criticalIssues}}
- {{this}}
{{/each}}
{{/criticalIssues}}

### Entity Relationships
**Network Structure**: {{networkComplexity}}
{{#influentialEntities}}
**Key Entities**: {{influentialEntities}}
{{/influentialEntities}}

### Timeline Analysis
**Chronology Assessment**: {{chronologyAssessment}}
{{#significantGaps}}
**Timeline Issues**: {{significantGaps}}
{{/significantGaps}}

### Legal Semantic Analysis
**Framework**: {{semanticFramework}}
**Complexity Factors**: {{complexityFactors}}

## Strategic Consultation Request

As an expert legal strategist with deep experience in {{legalDomain}}, please provide comprehensive analysis addressing:

### 1. Overall Case Strategy
- What primary strategic approach would be most effective given these patterns?
- How should the identified complexity be managed strategically?
- What are the key decision points that will determine case outcome?

### 2. Risk Management Framework
- How should the {{riskLevel}} risk factors be prioritized and addressed?
- What contingency plans should be prepared for high-probability risks?
- How can identified strengths be leveraged to mitigate weaknesses?

### 3. Evidence Strategy
- What evidence gaps require immediate attention?
- How should the existing strong evidence base be optimally utilized?
- What expert evidence would strengthen the case most effectively?

### 4. Settlement vs. Litigation Analysis
- Given these patterns, what is the optimal settlement strategy?
- What are the key leverage points for negotiations?
- If litigation becomes necessary, what should the trial strategy prioritize?

### 5. Tactical Implementation
- What are the immediate next steps (next 2-4 weeks)?
- How should resources be allocated across different strategic priorities?
- What timeline should guide major strategic decisions?

Please provide specific, actionable recommendations that account for:
- Case complexity level of {{caseComplexityPercent}}%
- {{clientRiskProfile}} risk tolerance
{{#timeConstraints}}- Time constraints: {{timeConstraints}}{{/timeConstraints}}
{{#budgetConstraints}}- Budget considerations: {{budgetConstraints}}{{/budgetConstraints}}

Structure your response with clear strategic priorities, risk assessments, and implementation timelines.`,
        variables: [
          { name: 'disputeNature', type: 'string', description: 'Nature of the legal dispute', required: true },
          { name: 'caseComplexityPercent', type: 'number', description: 'Case complexity as percentage', required: true },
          { name: 'riskLevel', type: 'string', description: 'Overall risk assessment level', required: true },
          { name: 'legalFramework', type: 'string', description: 'Applicable legal framework areas', required: true }
        ],
        conditions: [],
        optimizationLevel: 'expert',
        legalDomain: ['commercial', 'contract', 'dispute_resolution'],
        effectiveness: { averageRating: 4.7, usageCount: 0, successRate: 0.85 }
      },
      
      {
        id: 'focused_follow_up',
        name: 'Focused Follow-up Analysis',
        category: 'follow_up',
        description: 'Targeted follow-up on specific strategic questions',
        template: `# Strategic Follow-up Analysis

## Context Reference
Building on our previous consultation regarding the {{disputeNature}} matter with {{caseComplexityPercent}}% complexity.

## Specific Questions for Deep Analysis

{{#followUpQuestions}}
### Question {{@index}}: {{this}}
{{/followUpQuestions}}

## Updated Context
Since our initial consultation:
{{#newDevelopments}}
- {{this}}
{{/newDevelopments}}

## Priority Focus Areas
{{#priorityAreas}}
- **{{this}}**: Requires immediate strategic attention
{{/priorityAreas}}

## Strategic Refinement Request

Please provide focused analysis on the specific questions above, considering:

1. **Implementation Specifics**: Detailed steps for executing recommended strategies
2. **Resource Allocation**: Specific resource requirements and timeline implications  
3. **Risk Evolution**: How identified risks may have evolved since initial analysis
4. **Decision Trees**: Clear decision frameworks for upcoming strategic choices
5. **Success Metrics**: Measurable indicators for strategy effectiveness

For each question, please address:
- **Immediate Actions** (next 1-2 weeks)
- **Medium-term Strategy** (next 4-8 weeks)
- **Contingency Planning** (if primary approach encounters obstacles)
- **Resource Requirements** (expertise, time, budget implications)

Consider the {{clientRiskProfile}} risk approach and current strategic priorities: {{sessionGoals}}.`,
        variables: [
          { name: 'followUpQuestions', type: 'array', description: 'Specific questions for follow-up', required: true },
          { name: 'newDevelopments', type: 'array', description: 'New developments since last consultation', required: false },
          { name: 'priorityAreas', type: 'array', description: 'Current priority focus areas', required: true }
        ],
        conditions: [
          { field: 'consultationStage', operator: 'not_in', value: ['initial'], description: 'Not initial consultation' }
        ],
        optimizationLevel: 'advanced',
        legalDomain: ['general'],
        effectiveness: { averageRating: 4.5, usageCount: 0, successRate: 0.82 }
      },

      {
        id: 'risk_deep_dive',
        name: 'Comprehensive Risk Analysis',
        category: 'deep_dive',
        description: 'Deep dive analysis of critical risk factors',
        template: `# Comprehensive Risk Analysis & Mitigation Framework

## Risk Assessment Context
**Case**: {{disputeNature}} with {{caseComplexityPercent}}% complexity
**Current Risk Level**: {{riskLevel}}
**Critical Risk Areas Identified**: {{criticalRiskCount}}

## High-Priority Risk Factors for Analysis

{{#riskFactors}}
### Risk Factor {{@index}}: {{this}}
{{/riskFactors}}

## Deep Risk Analysis Required

For each identified risk factor, please provide comprehensive analysis including:

### 1. Risk Quantification
- **Probability Assessment**: Likelihood of this risk materializing (%)
- **Impact Severity**: Potential consequences if risk occurs (High/Medium/Low)
- **Timeline**: When this risk is most likely to emerge
- **Interdependencies**: How this risk relates to or amplifies other risks

### 2. Root Cause Analysis
- **Primary Drivers**: What factors make this risk likely?
- **Warning Indicators**: Early signs that this risk is materializing
- **Stakeholder Impact**: Who would be most affected by this risk

### 3. Mitigation Strategy Framework
- **Prevention Measures**: Steps to reduce probability of occurrence
- **Impact Minimization**: Actions to reduce severity if risk occurs
- **Resource Requirements**: Time, expertise, and budget needed for mitigation
- **Implementation Timeline**: Phased approach to risk mitigation

### 4. Contingency Planning
- **Trigger Points**: When to activate contingency plans
- **Response Protocols**: Step-by-step response if risk materializes
- **Recovery Strategies**: How to restore strategic position after risk event
- **Communication Plans**: How to manage stakeholder communications

## Strategic Risk Management Integration

Please also address:
- **Risk Prioritization Matrix**: How to sequence risk mitigation efforts
- **Resource Allocation**: Optimal distribution of resources across risk factors
- **Monitoring Framework**: How to track risk evolution over time
- **Strategic Adaptation**: How risk management should influence overall case strategy

Consider the {{clientRiskProfile}} risk tolerance and available resources for risk management activities.

Provide actionable risk management recommendations that can be implemented within current case constraints.`,
        variables: [
          { name: 'riskFactors', type: 'array', description: 'Specific risk factors to analyze', required: true },
          { name: 'criticalRiskCount', type: 'number', description: 'Number of critical risks', required: true }
        ],
        conditions: [
          { field: 'riskLevel', operator: 'in', value: ['high', 'critical'], description: 'High or critical risk level' }
        ],
        optimizationLevel: 'expert',
        legalDomain: ['risk_management', 'litigation', 'commercial'],
        effectiveness: { averageRating: 4.8, usageCount: 0, successRate: 0.88 }
      },

      {
        id: 'strategic_pivot_analysis',
        name: 'Strategic Pivot Analysis',
        category: 'strategic_pivot',
        description: 'Analysis for major strategy changes based on new insights',
        template: `# Strategic Pivot Analysis & Recommendation

## Current Strategic Position
**Existing Strategy**: {{currentStrategy}}
**Case Status**: {{consultationStage}} stage consultation
**Complexity Level**: {{caseComplexityPercent}}% complexity

## Critical Insights Driving Pivot Consideration

{{#criticalInsights}}
### Insight {{@index}}: {{this}}
**Priority**: {{priority}}
**Confidence**: {{confidence}}%
{{/criticalInsights}}

## Strategic Pivot Analysis Framework

### 1. Current Strategy Assessment
- **Effectiveness Review**: How well is the current strategy performing?
- **Assumption Validation**: Which original assumptions have proven incorrect?
- **Resource Efficiency**: Are current resource allocations optimal?
- **Risk Profile Evolution**: How has the risk landscape changed?

### 2. Alternative Strategy Evaluation
Please analyze these potential strategic pivots:

#### Option A: **Fundamental Strategy Change**
- Complete revision of approach based on new insights
- Assessment of implementation feasibility and resource requirements
- Timeline implications and disruption costs
- Success probability and risk profile

#### Option B: **Strategic Modification**  
- Adaptation of current strategy to incorporate new insights
- Incremental changes that address identified issues
- Resource reallocation within existing framework
- Risk mitigation while maintaining strategic continuity

#### Option C: **Enhanced Execution**
- Maintain current strategy but improve implementation
- Address tactical weaknesses while preserving strategic direction
- Focus on execution optimization rather than strategic change
- Minimal disruption with targeted improvements

### 3. Decision Framework Analysis
For each strategic option, please evaluate:

**Implementation Factors**:
- Resource requirements (time, expertise, budget)
- Timeline for implementation and results
- Stakeholder impact and communication needs
- Integration with ongoing activities

**Risk-Benefit Analysis**:
- Probability of improved outcomes
- Potential downside risks of change
- Opportunity costs of alternatives
- Reversibility if pivot proves unsuccessful

**Success Metrics**:
- Key performance indicators for each option
- Timeline for measuring success
- Decision points for further strategy adjustments

### 4. Recommendation Framework
Please provide:
- **Clear Recommendation**: Which strategic option is optimal and why
- **Implementation Roadmap**: Step-by-step approach for chosen strategy
- **Risk Mitigation**: How to minimize transition risks
- **Success Monitoring**: Framework for evaluating pivot effectiveness

Consider the {{clientRiskProfile}} approach to change and the current stage of {{consultationStage}} consultation.

Time sensitivity: {{#timeConstraints}}{{timeConstraints}}{{/timeConstraints}}{{^timeConstraints}}Standard timeline flexibility{{/timeConstraints}}`,
        variables: [
          { name: 'currentStrategy', type: 'string', description: 'Current strategic approach', required: true },
          { name: 'criticalInsights', type: 'array', description: 'Insights driving pivot consideration', required: true }
        ],
        conditions: [
          { field: 'consultationStage', operator: 'in', value: ['developing', 'deep'], description: 'Advanced consultation stage' }
        ],
        optimizationLevel: 'expert',
        legalDomain: ['strategic_planning', 'change_management'],
        effectiveness: { averageRating: 4.6, usageCount: 0, successRate: 0.79 }
      }
    ];

    templates.forEach(template => this.templates.set(template.id, template));
  }

  /**
   * Initialize prompt optimizations
   */
  private initializeOptimizations(): void {
    this.optimizations = [
      {
        technique: 'chain_of_thought',
        description: 'Encourages step-by-step logical reasoning',
        applicability: {
          caseTypes: ['complex', 'analytical'],
          consultationStages: ['initial', 'deep_dive'],
          complexityLevels: [0.6, 0.7, 0.8, 0.9, 1.0]
        },
        implementation: 'Let\'s think through this step by step:\n\n1. First, consider...\n2. Next, analyze...\n3. Then, evaluate...\n4. Finally, recommend...'
      },
      {
        technique: 'role_playing',
        description: 'Assumes expert legal strategist persona for deeper insights',
        applicability: {
          caseTypes: ['strategic', 'complex'],
          consultationStages: ['initial', 'strategic_pivot'],
          complexityLevels: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        },
        implementation: 'As a senior legal strategist with 20+ years experience in {{legalDomain}}, drawing on similar cases involving {{disputeType}} matters:'
      },
      {
        technique: 'structured_output',
        description: 'Requests organized, structured responses for clarity',
        applicability: {
          caseTypes: ['complex', 'multi-issue'],
          consultationStages: ['initial', 'follow_up'],
          complexityLevels: [0.7, 0.8, 0.9, 1.0]
        },
        implementation: 'Please structure your response using clear headings, bullet points, and numbered recommendations for maximum clarity and actionability.'
      },
      {
        technique: 'multi_perspective',
        description: 'Requests analysis from multiple strategic viewpoints',
        applicability: {
          caseTypes: ['dispute', 'negotiation'],
          consultationStages: ['deep_dive', 'strategic_pivot'],
          complexityLevels: [0.6, 0.7, 0.8, 0.9, 1.0]
        },
        implementation: 'Please analyze this from multiple perspectives:\n- From our client\'s strategic position\n- From the opposing party\'s likely approach\n- From a neutral arbitrator/judge\'s viewpoint\n- From a settlement negotiation standpoint'
      },
      {
        technique: 'devil_advocate',
        description: 'Challenges assumptions and identifies weaknesses',
        applicability: {
          caseTypes: ['high_risk', 'critical'],
          consultationStages: ['deep_dive', 'strategic_pivot'],
          complexityLevels: [0.7, 0.8, 0.9, 1.0]
        },
        implementation: 'Please also play devil\'s advocate: What are the strongest arguments against our proposed strategy? What could go wrong with this approach? How would opposing counsel attack our position?'
      }
    ];
  }

  /**
   * Build comprehensive prompt context
   */
  private buildPromptContext(
    consultationPattern: EnhancedConsultationPattern,
    partialContext: Partial<PromptContext>
  ): PromptContext {
    return {
      caseComplexity: consultationPattern.synthesis.caseComplexityScore,
      disputeNature: consultationPattern.synthesis.disputeCharacterization,
      riskLevel: this.assessRiskLevel(consultationPattern),
      consultationStage: partialContext.consultationStage || 'initial',
      priorityAreas: consultationPattern.synthesis.keyRiskFactors.slice(0, 3),
      previousRounds: partialContext.previousRounds || [],
      sessionGoals: partialContext.sessionGoals || ['Develop comprehensive strategy'],
      timeConstraints: partialContext.timeConstraints,
      budgetConstraints: partialContext.budgetConstraints,
      clientProfile: partialContext.clientProfile || 'balanced',
      legalFramework: consultationPattern.synthesis.legalFrameworkIndicators,
      ...partialContext
    };
  }

  /**
   * Select optimal template based on type and context
   */
  private selectOptimalTemplate(
    requestedType: PromptTemplate['category'],
    context: PromptContext
  ): PromptTemplate {
    // Get templates of requested type
    const candidateTemplates = Array.from(this.templates.values())
      .filter(template => template.category === requestedType);

    if (candidateTemplates.length === 0) {
      throw new Error(`No templates available for type: ${requestedType}`);
    }

    // Select based on effectiveness and context match
    let bestTemplate = candidateTemplates[0];
    let highestScore = 0;

    for (const template of candidateTemplates) {
      let score = template.effectiveness.averageRating * template.effectiveness.successRate;
      
      // Boost score for matching legal domains
      const domainMatch = template.legalDomain.some(domain => 
        context.legalFramework.some(framework => 
          framework.toLowerCase().includes(domain)
        )
      );
      if (domainMatch) score += 0.2;

      // Boost score for appropriate complexity level
      if (template.optimizationLevel === 'expert' && context.caseComplexity > 0.7) score += 0.1;
      if (template.optimizationLevel === 'advanced' && context.caseComplexity > 0.5) score += 0.05;

      if (score > highestScore) {
        highestScore = score;
        bestTemplate = template;
      }
    }

    return bestTemplate;
  }

  /**
   * Select appropriate optimizations
   */
  private selectOptimizations(
    template: PromptTemplate,
    context: PromptContext
  ): PromptOptimization[] {
    const selectedOptimizations: PromptOptimization[] = [];
    
    for (const optimization of this.optimizations) {
      // Check applicability
      const complexityMatch = optimization.applicability.complexityLevels.some(level => 
        Math.abs(level - context.caseComplexity) < 0.1
      );
      
      const stageMatch = optimization.applicability.consultationStages.includes(context.consultationStage);
      
      if (complexityMatch && stageMatch) {
        selectedOptimizations.push(optimization);
      }
    }

    // Limit to most relevant optimizations to avoid overwhelming the prompt
    return selectedOptimizations.slice(0, 3);
  }

  /**
   * Generate actual prompt content
   */
  private generatePromptContent(
    template: PromptTemplate,
    context: PromptContext,
    optimizations: PromptOptimization[]
  ): string {
    // Create template variables
    const variables = this.createTemplateVariables(context);
    
    // Apply template
    let content = this.applyTemplate(template.template, variables);
    
    // Apply optimizations
    content = this.applyOptimizations(content, optimizations, variables);
    
    return content;
  }

  /**
   * Create variables for template interpolation
   */
  private createTemplateVariables(context: PromptContext): Record<string, any> {
    return {
      disputeNature: context.disputeNature,
      caseComplexityPercent: Math.round(context.caseComplexity * 100),
      riskLevel: context.riskLevel,
      legalFramework: context.legalFramework.join(', '),
      priorityAreas: context.priorityAreas,
      sessionGoals: context.sessionGoals.join(', '),
      clientRiskProfile: context.clientProfile,
      timeConstraints: context.timeConstraints,
      budgetConstraints: context.budgetConstraints,
      consultationStage: context.consultationStage,
      followUpQuestions: context.previousRounds.flatMap(round => round.followUpQuestions),
      criticalInsights: context.previousRounds.flatMap(round => 
        round.keyInsights.map(insight => ({
          insight,
          priority: 'high',
          confidence: Math.round(round.confidence * 100)
        }))
      )
    };
  }

  /**
   * Apply template with variable substitution
   */
  private applyTemplate(template: string, variables: Record<string, any>): string {
    let content = template;
    
    // Simple template variable substitution
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, String(value || ''));
    }
    
    // Handle conditional sections and arrays (basic implementation)
    content = this.handleConditionals(content, variables);
    content = this.handleArrays(content, variables);
    
    return content;
  }

  /**
   * Handle conditional template sections
   */
  private handleConditionals(content: string, variables: Record<string, any>): string {
    // Basic conditional handling: {{#variable}}content{{/variable}}
    const conditionalRegex = /{{#(\w+)}}(.*?){{\/\1}}/gs;
    
    return content.replace(conditionalRegex, (match, varName, conditionalContent) => {
      const value = variables[varName];
      return (value && (Array.isArray(value) ? value.length > 0 : true)) ? conditionalContent : '';
    });
  }

  /**
   * Handle array template sections
   */
  private handleArrays(content: string, variables: Record<string, any>): string {
    // Basic array handling: {{#each array}}{{this}}{{/each}}
    const eachRegex = /{{#each (\w+)}}(.*?){{\/each}}/gs;
    
    return content.replace(eachRegex, (match, varName, itemTemplate) => {
      const array = variables[varName];
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        let itemContent = itemTemplate;
        itemContent = itemContent.replace(/{{this}}/g, String(item));
        itemContent = itemContent.replace(/{{@index}}/g, String(index + 1));
        return itemContent;
      }).join('\n');
    });
  }

  /**
   * Apply selected optimizations to prompt
   */
  private applyOptimizations(
    content: string,
    optimizations: PromptOptimization[],
    variables: Record<string, any>
  ): string {
    let optimizedContent = content;
    
    for (const optimization of optimizations) {
      switch (optimization.technique) {
        case 'chain_of_thought':
          optimizedContent = this.addChainOfThought(optimizedContent);
          break;
        case 'role_playing':
          optimizedContent = this.addRolePlaying(optimizedContent, variables);
          break;
        case 'structured_output':
          optimizedContent = this.addStructuredOutput(optimizedContent);
          break;
        case 'multi_perspective':
          optimizedContent = this.addMultiPerspective(optimizedContent);
          break;
        case 'devil_advocate':
          optimizedContent = this.addDevilAdvocate(optimizedContent);
          break;
      }
    }
    
    return optimizedContent;
  }

  // Optimization application methods
  private addChainOfThought(content: string): string {
    return content + '\n\nPlease approach this analysis systematically, thinking through each step of your reasoning before providing recommendations.';
  }

  private addRolePlaying(content: string, variables: Record<string, any>): string {
    const rolePrompt = `\n\nAs a senior legal strategist with extensive experience in ${variables.legalFramework} matters, please draw upon similar cases and established strategic frameworks in your analysis.`;
    return content + rolePrompt;
  }

  private addStructuredOutput(content: string): string {
    return content + '\n\nPlease structure your response with clear headings, bullet points, and numbered recommendations for maximum clarity and actionability.';
  }

  private addMultiPerspective(content: string): string {
    return content + '\n\nPlease consider multiple perspectives in your analysis:\n- Our client\'s strategic position\n- The opposing party\'s likely approach\n- A neutral decision-maker\'s viewpoint\n- Settlement negotiation dynamics';
  }

  private addDevilAdvocate(content: string): string {
    return content + '\n\nPlease also challenge your recommendations: What are the strongest arguments against the proposed strategy? What could go wrong? How might opposing counsel attack our position?';
  }

  /**
   * Define expected response structure
   */
  private defineResponseStructure(template: PromptTemplate, context: PromptContext): ResponseStructure {
    const sections: ResponseSection[] = [];

    switch (template.category) {
      case 'initial':
        sections.push(
          { title: 'Executive Summary', purpose: 'High-level overview', expectedContent: 'Key findings and recommendations', priority: 'critical' },
          { title: 'Strategic Analysis', purpose: 'Core strategy recommendations', expectedContent: 'Primary strategic approach', priority: 'critical' },
          { title: 'Risk Assessment', purpose: 'Risk identification and mitigation', expectedContent: 'Risk factors and management strategies', priority: 'high' },
          { title: 'Implementation Plan', purpose: 'Actionable next steps', expectedContent: 'Specific actions and timeline', priority: 'high' }
        );
        break;
      case 'follow_up':
        sections.push(
          { title: 'Specific Answers', purpose: 'Address follow-up questions', expectedContent: 'Direct responses to questions', priority: 'critical' },
          { title: 'Strategic Refinement', purpose: 'Updated recommendations', expectedContent: 'Refined strategic guidance', priority: 'high' }
        );
        break;
      case 'deep_dive':
        sections.push(
          { title: 'Detailed Analysis', purpose: 'Comprehensive examination', expectedContent: 'In-depth analysis of focus area', priority: 'critical' },
          { title: 'Mitigation Strategies', purpose: 'Risk management', expectedContent: 'Specific mitigation approaches', priority: 'high' }
        );
        break;
    }

    return {
      sections,
      format: 'markdown',
      expectedLength: context.caseComplexity > 0.7 ? 'comprehensive' : 'medium',
      requiredElements: ['recommendations', 'timeline', 'next_steps']
    };
  }

  /**
   * Calculate quality metrics for generated prompt
   */
  private calculateQualityMetrics(content: string, context: PromptContext) {
    return {
      clarity: this.assessClarity(content),
      specificity: this.assessSpecificity(content, context),
      actionability: this.assessActionability(content),
      legalRelevance: this.assessLegalRelevance(content, context)
    };
  }

  // Quality assessment methods
  private assessClarity(content: string): number {
    let score = 0.7; // Base score
    
    // Check for clear structure
    if (content.includes('##') || content.includes('###')) score += 0.1;
    if (content.includes('1.') || content.includes('•')) score += 0.05;
    
    // Check for clear questions
    const questionCount = (content.match(/\?/g) || []).length;
    score += Math.min(0.1, questionCount * 0.02);
    
    return Math.min(0.95, score);
  }

  private assessSpecificity(content: string, context: PromptContext): number {
    let score = 0.6;
    
    // Check for specific case details
    if (content.includes(context.disputeNature)) score += 0.1;
    if (content.includes(`${Math.round(context.caseComplexity * 100)}%`)) score += 0.1;
    
    // Check for specific legal terms
    const legalTerms = ['strategy', 'evidence', 'settlement', 'litigation', 'risk'];
    const foundTerms = legalTerms.filter(term => content.toLowerCase().includes(term)).length;
    score += foundTerms * 0.04;
    
    return Math.min(0.95, score);
  }

  private assessActionability(content: string): number {
    let score = 0.5;
    
    // Check for action words
    const actionWords = ['recommend', 'should', 'must', 'consider', 'analyze', 'develop', 'implement'];
    const foundActions = actionWords.filter(word => content.toLowerCase().includes(word)).length;
    score += foundActions * 0.05;
    
    // Check for timeline references
    if (content.includes('next') || content.includes('immediate') || content.includes('week')) score += 0.1;
    
    return Math.min(0.95, score);
  }

  private assessLegalRelevance(content: string, context: PromptContext): number {
    let score = 0.7;
    
    // Check for legal framework mentions
    const frameworkMatches = context.legalFramework.filter(framework => 
      content.toLowerCase().includes(framework.toLowerCase())
    ).length;
    score += frameworkMatches * 0.1;
    
    // Check for legal process terms
    const legalTerms = ['court', 'trial', 'settlement', 'negotiation', 'evidence', 'witness'];
    const foundLegalTerms = legalTerms.filter(term => content.toLowerCase().includes(term)).length;
    score += foundLegalTerms * 0.03;
    
    return Math.min(0.95, score);
  }

  // Utility methods
  private assessRiskLevel(pattern: EnhancedConsultationPattern): 'low' | 'medium' | 'high' | 'critical' {
    const contradictionRisk = pattern.contradictionPatterns.riskLevel;
    const complexityScore = pattern.synthesis.caseComplexityScore;
    
    if (contradictionRisk === 'critical' || complexityScore > 0.8) return 'critical';
    if (contradictionRisk === 'high' || complexityScore > 0.6) return 'high';
    if (contradictionRisk === 'medium' || complexityScore > 0.4) return 'medium';
    return 'low';
  }

  private estimateTokens(content: string): number {
    return Math.ceil(content.length / 4); // Rough estimation
  }

  private assessComplexity(context: PromptContext): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    if (context.caseComplexity > 0.8) return 'expert';
    if (context.caseComplexity > 0.6) return 'advanced';
    if (context.caseComplexity > 0.4) return 'intermediate';
    return 'basic';
  }

  private calculateConfidenceScore(
    template: PromptTemplate,
    context: PromptContext,
    optimizations: PromptOptimization[]
  ): number {
    let score = template.effectiveness.averageRating / 5; // Normalize to 0-1
    
    // Boost for appropriate complexity match
    if ((template.optimizationLevel === 'expert' && context.caseComplexity > 0.7) ||
        (template.optimizationLevel === 'advanced' && context.caseComplexity > 0.5)) {
      score += 0.1;
    }
    
    // Boost for optimizations
    score += optimizations.length * 0.05;
    
    return Math.min(0.95, score);
  }

  /**
   * Get prompt performance metrics
   */
  getPerformanceMetrics(): any {
    const totalPrompts = this.promptHistory.length;
    const avgComplexity = totalPrompts > 0 ? 
      this.promptHistory.reduce((sum, p) => sum + (p.context.caseComplexity), 0) / totalPrompts : 0;
    
    return {
      totalPromptsGenerated: totalPrompts,
      averageComplexity: avgComplexity,
      templateUsage: this.getTemplateUsageStats(),
      qualityMetrics: this.getAverageQualityMetrics()
    };
  }

  private getTemplateUsageStats(): Record<string, number> {
    const usage: Record<string, number> = {};
    this.promptHistory.forEach(prompt => {
      usage[prompt.templateUsed] = (usage[prompt.templateUsed] || 0) + 1;
    });
    return usage;
  }

  private getAverageQualityMetrics() {
    if (this.promptHistory.length === 0) return null;
    
    const totals = this.promptHistory.reduce(
      (acc, prompt) => ({
        clarity: acc.clarity + prompt.qualityMetrics.clarity,
        specificity: acc.specificity + prompt.qualityMetrics.specificity,
        actionability: acc.actionability + prompt.qualityMetrics.actionability,
        legalRelevance: acc.legalRelevance + prompt.qualityMetrics.legalRelevance
      }),
      { clarity: 0, specificity: 0, actionability: 0, legalRelevance: 0 }
    );
    
    const count = this.promptHistory.length;
    return {
      clarity: totals.clarity / count,
      specificity: totals.specificity / count,
      actionability: totals.actionability / count,
      legalRelevance: totals.legalRelevance / count
    };
  }

  /**
   * Update template effectiveness based on results
   */
  updateTemplateEffectiveness(templateId: string, rating: number, success: boolean): void {
    const template = this.templates.get(templateId);
    if (template) {
      const currentRating = template.effectiveness.averageRating;
      const currentCount = template.effectiveness.usageCount;
      
      template.effectiveness.averageRating = (currentRating * currentCount + rating) / (currentCount + 1);
      template.effectiveness.usageCount += 1;
      template.effectiveness.successRate = success ? 
        (template.effectiveness.successRate * currentCount + 1) / (currentCount + 1) :
        (template.effectiveness.successRate * currentCount) / (currentCount + 1);
    }
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }
}

export default AdvancedPromptEngine;