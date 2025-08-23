/**
 * Strategic Guidance Framework - Week 5 Day 5 Implementation
 * Provides structured frameworks for strategic legal guidance
 */

class StrategicGuidanceFramework {
  constructor() {
    this.frameworks = {
      litigation_strategy: new LitigationStrategyFramework(),
      settlement_strategy: new SettlementStrategyFramework(),
      evidence_strategy: new EvidenceStrategyFramework(),
      risk_assessment: new RiskAssessmentFramework(),
      case_preparation: new CasePreparationFramework()
    };
    
    this.frameworkSelectionRules = this.initializeFrameworkRules();
  }

  initializeFrameworkRules() {
    return {
      litigation_strategy: {
        triggers: ['court_case', 'litigation', 'trial', 'judgment'],
        complexity_threshold: 0.6,
        document_types: ['court_document', 'pleading', 'evidence']
      },
      
      settlement_strategy: {
        triggers: ['settlement', 'negotiation', 'mediation', 'compromise'],
        complexity_threshold: 0.4,
        document_types: ['correspondence', 'contract', 'financial_document']
      },
      
      evidence_strategy: {
        triggers: ['evidence', 'witness', 'proof', 'documentation'],
        complexity_threshold: 0.3,
        document_types: ['evidence', 'witness_statement', 'expert_report']
      },
      
      risk_assessment: {
        triggers: ['risk', 'liability', 'exposure', 'damages'],
        complexity_threshold: 0.5,
        document_types: ['financial_document', 'contract', 'correspondence']
      },
      
      case_preparation: {
        triggers: ['preparation', 'case management', 'timeline', 'procedure'],
        complexity_threshold: 0.7,
        document_types: ['court_document', 'evidence', 'correspondence']
      }
    };
  }

  selectOptimalFrameworks(pattern, consultationHistory = null) {
    const selectedFrameworks = [];
    const frameworkScores = {};

    // Score each framework based on pattern matching
    for (const [frameworkName, rules] of Object.entries(this.frameworkSelectionRules)) {
      let score = 0;

      // Check for trigger keywords in legal issues
      const primaryIssues = pattern.legal_analysis?.primary_issues || [];
      const triggerMatches = rules.triggers.filter(trigger =>
        primaryIssues.some(issue => 
          issue.concept.toLowerCase().includes(trigger)
        )
      ).length;
      score += triggerMatches * 0.3;

      // Check document types
      const documentTypes = Object.keys(pattern.document_profile?.types?.distribution || {});
      const typeMatches = rules.document_types.filter(type =>
        documentTypes.includes(type)
      ).length;
      score += typeMatches * 0.2;

      // Complexity matching
      const complexity = pattern.document_profile?.complexity?.complexity_score || 0;
      if (complexity >= rules.complexity_threshold) {
        score += 0.2;
      }

      // Historical effectiveness boost
      if (consultationHistory) {
        const historical = consultationHistory.getRecommendationsForPattern(pattern);
        if (historical.pattern_insights.historical_effectiveness > 7) {
          score += 0.3;
        }
      }

      frameworkScores[frameworkName] = score;
    }

    // Select frameworks with scores above threshold
    const threshold = 0.4;
    for (const [frameworkName, score] of Object.entries(frameworkScores)) {
      if (score >= threshold) {
        selectedFrameworks.push({
          framework: frameworkName,
          score: score,
          priority: this.calculateFrameworkPriority(frameworkName, score, pattern)
        });
      }
    }

    // Sort by priority
    selectedFrameworks.sort((a, b) => b.priority - a.priority);

    console.log(`🎯 Selected ${selectedFrameworks.length} strategic frameworks`);
    return selectedFrameworks.slice(0, 3); // Maximum 3 frameworks
  }

  calculateFrameworkPriority(frameworkName, score, pattern) {
    let priority = score;

    // Boost priority based on urgency indicators
    const urgencyKeywords = ['urgent', 'deadline', 'limitation', 'expires'];
    const hasUrgency = pattern.risk_indicators?.timeline_pressures?.some(pressure =>
      urgencyKeywords.some(keyword => pressure.includes(keyword))
    );

    if (hasUrgency) {
      if (frameworkName === 'case_preparation') priority += 0.3;
      if (frameworkName === 'evidence_strategy') priority += 0.2;
    }

    // Boost based on case complexity
    const complexity = pattern.document_profile?.complexity?.complexity_score || 0;
    if (complexity > 0.8 && frameworkName === 'litigation_strategy') {
      priority += 0.2;
    }

    return priority;
  }

  generateGuidancePrompt(pattern, selectedFrameworks, consultationHistory = null) {
    const prompt = {
      consultation_context: {
        case_overview: this.generateCaseOverview(pattern),
        selected_frameworks: selectedFrameworks.map(f => f.framework),
        guidance_objectives: this.generateGuidanceObjectives(pattern, selectedFrameworks)
      },
      
      framework_analyses: {},
      strategic_recommendations: {},
      consultation_structure: this.generateConsultationStructure(selectedFrameworks)
    };

    // Generate specific analyses for each selected framework
    selectedFrameworks.forEach(framework => {
      const frameworkInstance = this.frameworks[framework.framework];
      if (frameworkInstance) {
        prompt.framework_analyses[framework.framework] = 
          frameworkInstance.generateAnalysis(pattern);
        
        prompt.strategic_recommendations[framework.framework] = 
          frameworkInstance.generateRecommendations(pattern, consultationHistory);
      }
    });

    return prompt;
  }

  generateCaseOverview(pattern) {
    return {
      case_type: this.determineCaseType(pattern),
      jurisdiction: pattern.document_profile?.jurisdiction?.primary || 'England and Wales',
      complexity_level: this.mapComplexityLevel(pattern.document_profile?.complexity?.complexity_score),
      primary_legal_issues: pattern.legal_analysis?.primary_issues?.slice(0, 3) || [],
      document_volume: pattern.document_profile?.volume || 0,
      timeline_span: pattern.document_profile?.date_range?.span_days || 0,
      urgency_indicators: pattern.risk_indicators?.timeline_pressures || []
    };
  }

  determineCaseType(pattern) {
    const primaryIssues = pattern.legal_analysis?.primary_issues || [];
    
    if (primaryIssues.some(issue => issue.concept.includes('contract'))) {
      return 'contract_dispute';
    }
    if (primaryIssues.some(issue => issue.concept.includes('negligence'))) {
      return 'negligence_claim';
    }
    if (primaryIssues.some(issue => issue.concept.includes('employment'))) {
      return 'employment_dispute';
    }
    
    return 'general_legal_matter';
  }

  mapComplexityLevel(score) {
    if (!score) return 'unknown';
    if (score > 0.8) return 'highly_complex';
    if (score > 0.6) return 'moderately_complex';
    if (score > 0.3) return 'straightforward';
    return 'simple';
  }

  generateGuidanceObjectives(pattern, selectedFrameworks) {
    const objectives = [];

    selectedFrameworks.forEach(framework => {
      switch (framework.framework) {
        case 'litigation_strategy':
          objectives.push('Develop comprehensive litigation approach');
          objectives.push('Assess prospects of success');
          break;
        case 'settlement_strategy':
          objectives.push('Evaluate settlement opportunities');
          objectives.push('Determine negotiation parameters');
          break;
        case 'evidence_strategy':
          objectives.push('Identify key evidence requirements');
          objectives.push('Plan evidence gathering approach');
          break;
        case 'risk_assessment':
          objectives.push('Quantify legal and financial risks');
          objectives.push('Develop risk mitigation strategies');
          break;
        case 'case_preparation':
          objectives.push('Create comprehensive case timeline');
          objectives.push('Identify procedural requirements');
          break;
      }
    });

    return [...new Set(objectives)]; // Remove duplicates
  }

  generateConsultationStructure(selectedFrameworks) {
    return {
      consultation_phases: [
        {
          phase: 'situation_analysis',
          focus: 'Understanding the current legal position',
          frameworks_involved: selectedFrameworks.map(f => f.framework)
        },
        {
          phase: 'strategic_options',
          focus: 'Identifying available strategic approaches',
          frameworks_involved: selectedFrameworks.filter(f => 
            ['litigation_strategy', 'settlement_strategy'].includes(f.framework)
          ).map(f => f.framework)
        },
        {
          phase: 'risk_evaluation',
          focus: 'Assessing risks and potential outcomes',
          frameworks_involved: ['risk_assessment']
        },
        {
          phase: 'action_planning',
          focus: 'Developing concrete next steps',
          frameworks_involved: ['case_preparation', 'evidence_strategy']
        }
      ],
      
      expected_deliverables: [
        'Strategic assessment summary',
        'Risk analysis report',
        'Recommended action plan',
        'Priority matrix for immediate actions'
      ]
    };
  }

  getFrameworkInfo() {
    return {
      name: 'Strategic Guidance Framework System',
      version: '5.0.0',
      available_frameworks: Object.keys(this.frameworks),
      selection_criteria: [
        'Pattern trigger matching',
        'Document type alignment',
        'Complexity threshold assessment',
        'Historical effectiveness',
        'Urgency indicators'
      ],
      features: [
        'Multi-framework analysis',
        'Dynamic framework selection',
        'Structured consultation guidance',
        'Priority-based recommendations'
      ]
    };
  }
}

// Individual Framework Classes
class LitigationStrategyFramework {
  generateAnalysis(pattern) {
    return {
      framework_type: 'litigation_strategy',
      analysis_focus: [
        'Case strength assessment',
        'Procedural pathway evaluation',
        'Evidence sufficiency analysis',
        'Cost-benefit projection'
      ],
      key_considerations: this.identifyLitigationConsiderations(pattern)
    };
  }

  identifyLitigationConsiderations(pattern) {
    const considerations = [];
    
    // Jurisdiction considerations
    const jurisdiction = pattern.document_profile?.jurisdiction?.primary;
    if (jurisdiction) {
      considerations.push(`Jurisdiction: ${jurisdiction} - relevant procedural rules apply`);
    }

    // Timeline considerations
    const timeSpan = pattern.document_profile?.date_range?.span_days;
    if (timeSpan > 365) {
      considerations.push('Extended timeline may indicate limitation period considerations');
    }

    // Evidence considerations
    const evidenceCategories = pattern.legal_analysis?.evidence_categories || {};
    Object.keys(evidenceCategories).forEach(category => {
      if (evidenceCategories[category].length > 0) {
        considerations.push(`${category} evidence available for litigation support`);
      }
    });

    return considerations;
  }

  generateRecommendations(pattern, consultationHistory) {
    return {
      strategic_approach: 'litigation_focused',
      immediate_actions: [
        'Assess limitation periods',
        'Evaluate evidence strength',
        'Consider procedural requirements'
      ],
      medium_term_actions: [
        'Prepare case strategy',
        'Identify expert witnesses',
        'Develop cost estimates'
      ],
      risk_factors: [
        'Litigation costs',
        'Time investment',
        'Uncertain outcomes'
      ]
    };
  }
}

class SettlementStrategyFramework {
  generateAnalysis(pattern) {
    return {
      framework_type: 'settlement_strategy',
      analysis_focus: [
        'Settlement value assessment',
        'Negotiation leverage evaluation',
        'Alternative dispute resolution options',
        'Timeline advantages'
      ],
      key_considerations: this.identifySettlementConsiderations(pattern)
    };
  }

  identifySettlementConsiderations(pattern) {
    const considerations = [];
    
    // Financial pattern analysis
    const hasFinancialDocs = pattern.document_profile?.types?.distribution?.financial_document > 0;
    if (hasFinancialDocs) {
      considerations.push('Financial documentation suggests quantifiable damages');
    }

    // Communication patterns
    const hasCorrespondence = pattern.document_profile?.types?.distribution?.correspondence > 0;
    if (hasCorrespondence) {
      considerations.push('Correspondence available to support negotiation position');
    }

    return considerations;
  }

  generateRecommendations(pattern, consultationHistory) {
    return {
      strategic_approach: 'settlement_focused',
      immediate_actions: [
        'Assess settlement value range',
        'Identify negotiation leverage points',
        'Consider mediation options'
      ],
      medium_term_actions: [
        'Develop negotiation strategy',
        'Prepare settlement proposals',
        'Engage in structured negotiations'
      ],
      advantages: [
        'Cost certainty',
        'Time efficiency',
        'Confidentiality'
      ]
    };
  }
}

class EvidenceStrategyFramework {
  generateAnalysis(pattern) {
    return {
      framework_type: 'evidence_strategy',
      analysis_focus: [
        'Evidence gap analysis',
        'Evidence strength assessment',
        'Discovery strategy',
        'Expert witness requirements'
      ],
      key_considerations: this.identifyEvidenceConsiderations(pattern)
    };
  }

  identifyEvidenceConsiderations(pattern) {
    const considerations = [];
    const evidenceCategories = pattern.legal_analysis?.evidence_categories || {};
    
    Object.entries(evidenceCategories).forEach(([category, evidence]) => {
      if (evidence.length > 0) {
        considerations.push(`${category}: ${evidence.length} items available`);
      } else {
        considerations.push(`${category}: Evidence gap identified`);
      }
    });

    return considerations;
  }

  generateRecommendations(pattern, consultationHistory) {
    return {
      strategic_approach: 'evidence_focused',
      immediate_actions: [
        'Catalog existing evidence',
        'Identify evidence gaps',
        'Preserve relevant documents'
      ],
      medium_term_actions: [
        'Obtain missing evidence',
        'Arrange expert assessments',
        'Prepare evidence bundles'
      ]
    };
  }
}

class RiskAssessmentFramework {
  generateAnalysis(pattern) {
    return {
      framework_type: 'risk_assessment',
      analysis_focus: [
        'Legal risk quantification',
        'Financial exposure assessment',
        'Reputational risk evaluation',
        'Strategic risk analysis'
      ],
      key_considerations: this.identifyRiskConsiderations(pattern)
    };
  }

  identifyRiskConsiderations(pattern) {
    const considerations = [];
    const complexity = pattern.document_profile?.complexity?.complexity_score || 0;
    
    if (complexity > 0.7) {
      considerations.push('High complexity increases procedural risks');
    }

    const riskFactors = pattern.risk_indicators?.complexity_factors || [];
    riskFactors.forEach(factor => {
      considerations.push(`Risk factor: ${factor.factor} (${factor.impact} impact)`);
    });

    return considerations;
  }

  generateRecommendations(pattern, consultationHistory) {
    return {
      strategic_approach: 'risk_managed',
      immediate_actions: [
        'Quantify potential exposures',
        'Assess probability outcomes',
        'Identify mitigation strategies'
      ]
    };
  }
}

class CasePreparationFramework {
  generateAnalysis(pattern) {
    return {
      framework_type: 'case_preparation',
      analysis_focus: [
        'Timeline management',
        'Resource allocation',
        'Procedural compliance',
        'Team coordination'
      ],
      key_considerations: this.identifyPreparationConsiderations(pattern)
    };
  }

  identifyPreparationConsiderations(pattern) {
    const considerations = [];
    const timeSpan = pattern.document_profile?.date_range?.span_days || 0;
    
    if (timeSpan > 0) {
      considerations.push(`Case timeline spans ${timeSpan} days`);
    }

    const docCount = pattern.document_profile?.volume || 0;
    if (docCount > 20) {
      considerations.push(`Large document volume (${docCount} documents) requires systematic review`);
    }

    return considerations;
  }

  generateRecommendations(pattern, consultationHistory) {
    return {
      strategic_approach: 'preparation_focused',
      immediate_actions: [
        'Create case timeline',
        'Establish document management system',
        'Identify key deadlines'
      ]
    };
  }
}

export default StrategicGuidanceFramework;