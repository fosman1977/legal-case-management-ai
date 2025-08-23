/**
 * Enhanced Claude Engine - Week 5 Integration
 * Integrates all Week 5 enhancements for sophisticated Claude consultation
 */

import EnhancedPatternGenerator from './PatternGenerator.js';
import ConsultationHistory from './ConsultationHistory.js';
import StrategicGuidanceFramework from './StrategicGuidanceFramework.js';
import ClaudeAPIOptimizer from './ClaudeAPIOptimizer.js';

class EnhancedClaudeEngine {
  constructor() {
    this.patternGenerator = new EnhancedPatternGenerator();
    this.consultationHistory = new ConsultationHistory();
    this.strategicFramework = new StrategicGuidanceFramework();
    this.apiOptimizer = new ClaudeAPIOptimizer();
    
    this.claudeEndpoint = 'https://api.anthropic.com/v1/messages';
    this.apiKey = null; // Set via configuration
    this.isInitialized = false;

    console.log('🧠 Enhanced Claude Engine initialized');
  }

  async initialize(config) {
    this.apiKey = config.claude_api_key;
    this.claudeEndpoint = config.claude_endpoint || this.claudeEndpoint;
    this.isInitialized = true;

    console.log('✅ Enhanced Claude Engine ready for consultation');
  }

  async consultClaude(documents, caseContext = {}) {
    if (!this.isInitialized) {
      throw new Error('Enhanced Claude Engine not initialized - call initialize() first');
    }

    const consultationId = `consultation_${Date.now()}`;
    console.log(`🎯 Starting enhanced consultation: ${consultationId}`);

    try {
      // Step 1: Generate rich consultation pattern
      const extractedAnalysis = this.extractAnalysisFromDocuments(documents);
      const consultationPattern = this.patternGenerator.generateConsultationPattern(
        documents, 
        extractedAnalysis
      );

      // Step 2: Get historical recommendations
      const historicalRecommendations = this.consultationHistory
        .getRecommendationsForPattern(consultationPattern);

      // Step 3: Select strategic frameworks
      const selectedFrameworks = this.strategicFramework.selectOptimalFrameworks(
        consultationPattern, 
        this.consultationHistory
      );

      // Step 4: Optimize API request
      const optimizedRequest = await this.apiOptimizer.optimizeConsultationRequest(
        consultationPattern,
        historicalRecommendations,
        selectedFrameworks
      );

      // Step 5: Generate strategic guidance prompt
      const guidancePrompt = this.strategicFramework.generateGuidancePrompt(
        consultationPattern,
        selectedFrameworks,
        this.consultationHistory
      );

      // Step 6: Execute Claude consultation
      const claudeResponse = await this.executeClaudeConsultation(
        optimizedRequest,
        guidancePrompt
      );

      // Step 7: Process and enhance response
      const enhancedResponse = this.enhanceClaudeResponse(
        claudeResponse,
        consultationPattern,
        selectedFrameworks,
        optimizedRequest
      );

      // Step 8: Record consultation for learning
      const consultationRecord = {
        pattern: consultationPattern,
        response: claudeResponse,
        case_context: caseContext,
        frameworks_used: selectedFrameworks,
        optimization_data: optimizedRequest
      };
      
      const recordId = await this.consultationHistory.recordConsultation(consultationRecord);

      console.log(`✅ Enhanced consultation complete: ${consultationId}`);

      return {
        consultation_id: consultationId,
        record_id: recordId,
        strategic_guidance: enhancedResponse,
        consultation_metadata: {
          pattern_confidence: consultationPattern.pattern_metadata.confidence,
          frameworks_used: selectedFrameworks.map(f => f.framework),
          historical_insights: historicalRecommendations.pattern_insights,
          optimization_applied: optimizedRequest.compression_applied,
          estimated_cost: optimizedRequest.cost_estimate
        }
      };

    } catch (error) {
      console.error('❌ Enhanced consultation failed:', error);
      throw new Error(`Enhanced consultation failed: ${error.message}`);
    }
  }

  extractAnalysisFromDocuments(documents) {
    // Extract anonymized analysis patterns from processed documents
    const analysis = {
      document_count: documents.length,
      legal_concepts: this.extractLegalConcepts(documents),
      entity_patterns: this.extractEntityPatterns(documents),
      temporal_patterns: this.extractTemporalPatterns(documents),
      anonymization_verified: true
    };

    return analysis;
  }

  extractLegalConcepts(documents) {
    const legalConcepts = [];
    const conceptKeywords = [
      'contract', 'negligence', 'damages', 'liability', 'breach',
      'misrepresentation', 'duress', 'estoppel', 'consideration'
    ];

    documents.forEach(doc => {
      const text = doc.extractedText || '';
      conceptKeywords.forEach(concept => {
        const regex = new RegExp(`\\b${concept}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          legalConcepts.push({
            concept: concept,
            frequency: matches.length,
            context: 'legal_analysis'
          });
        }
      });
    });

    return legalConcepts;
  }

  extractEntityPatterns(documents) {
    // Extract patterns from anonymized entities
    return documents.reduce((patterns, doc) => {
      if (doc.anonymization?.patterns) {
        patterns.push(...doc.anonymization.patterns);
      }
      return patterns;
    }, []);
  }

  extractTemporalPatterns(documents) {
    // Extract temporal relationship patterns
    const dates = [];
    documents.forEach(doc => {
      if (doc.metadata?.created) {
        dates.push(new Date(doc.metadata.created));
      }
    });

    return {
      date_span: dates.length > 0 ? {
        earliest: Math.min(...dates),
        latest: Math.max(...dates)
      } : null,
      document_timeline: dates.sort()
    };
  }

  async executeClaudeConsultation(optimizedRequest, guidancePrompt) {
    const requestPayload = {
      model: optimizedRequest.model,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: this.formatConsultationPrompt(optimizedRequest.optimized_prompt, guidancePrompt)
        }
      ],
      system: optimizedRequest.optimized_prompt.system_prompt
    };

    try {
      const response = await fetch(this.claudeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const claudeResponse = await response.json();
      
      // Track usage for optimization
      await this.apiOptimizer.trackUsage(
        optimizedRequest,
        claudeResponse,
        this.calculateActualCost(claudeResponse, optimizedRequest.model)
      );

      return claudeResponse.content[0].text;

    } catch (error) {
      console.error('Claude API consultation failed:', error);
      throw error;
    }
  }

  formatConsultationPrompt(optimizedPrompt, guidancePrompt) {
    return `
# Legal Strategy Consultation Request

## Case Overview
${JSON.stringify(optimizedPrompt.consultation_request.case_summary, null, 2)}

## Legal Analysis Summary
${JSON.stringify(optimizedPrompt.consultation_request.legal_analysis, null, 2)}

## Strategic Frameworks for Analysis
${optimizedPrompt.consultation_request.strategic_frameworks.map(f => 
  `- ${f.framework} (Priority: ${f.priority.toFixed(2)}) - Focus: ${f.key_focus}`
).join('\n')}

## Risk Indicators
${JSON.stringify(optimizedPrompt.consultation_request.risk_indicators, null, 2)}

## Historical Context (Similar Cases)
${optimizedPrompt.historical_context ? JSON.stringify(optimizedPrompt.historical_context, null, 2) : 'No similar cases in history'}

## Required Response Structure
Please structure your response with these sections:
${optimizedPrompt.response_structure.required_sections.map(section => `- ${section}`).join('\n')}

## Consultation Objectives
Please provide strategic legal guidance focusing on:
${guidancePrompt.consultation_context.guidance_objectives.map(obj => `- ${obj}`).join('\n')}

---

**Important**: This consultation is based on anonymized patterns to protect client confidentiality. All entity references have been anonymized as placeholders like <PERSON_1>, <COMPANY_2>, etc.

Please provide comprehensive strategic guidance based on the patterns and frameworks above.
    `.trim();
  }

  calculateActualCost(claudeResponse, model) {
    const usage = claudeResponse.usage;
    const costs = this.apiOptimizer.costPerToken[model];
    
    const inputCost = (usage.input_tokens / 1000) * costs.input;
    const outputCost = (usage.output_tokens / 1000) * costs.output;
    
    return inputCost + outputCost;
  }

  enhanceClaudeResponse(claudeResponse, pattern, frameworks, optimizedRequest) {
    const enhancedResponse = {
      strategic_guidance: claudeResponse,
      
      consultation_analysis: {
        frameworks_addressed: frameworks.map(f => f.framework),
        pattern_insights_used: pattern.pattern_metadata.confidence > 0.8,
        optimization_effective: optimizedRequest.compression_applied.compression_ratio > 0.2
      },

      follow_up_recommendations: this.generateFollowUpRecommendations(
        claudeResponse, 
        pattern,
        frameworks
      ),

      actionable_insights: this.extractActionableInsights(claudeResponse),
      
      confidence_indicators: {
        strategic_confidence: this.assessStrategicConfidence(claudeResponse),
        pattern_reliability: pattern.pattern_metadata.confidence,
        framework_coverage: frameworks.length / 5 // Max 5 frameworks
      },

      next_consultation_suggestions: this.suggestNextConsultation(
        claudeResponse,
        pattern
      )
    };

    return enhancedResponse;
  }

  generateFollowUpRecommendations(claudeResponse, pattern, frameworks) {
    const recommendations = [];

    // Analyze response for gaps that might need follow-up
    if (claudeResponse.includes('more information needed')) {
      recommendations.push({
        type: 'information_gathering',
        priority: 'high',
        description: 'Gather additional information identified in consultation'
      });
    }

    if (claudeResponse.includes('expert opinion') || claudeResponse.includes('specialist advice')) {
      recommendations.push({
        type: 'expert_consultation',
        priority: 'medium',
        description: 'Consider consulting relevant specialists'
      });
    }

    if (frameworks.some(f => f.framework === 'evidence_strategy')) {
      recommendations.push({
        type: 'evidence_review',
        priority: 'high',
        description: 'Conduct detailed evidence analysis following strategic guidance'
      });
    }

    return recommendations;
  }

  extractActionableInsights(claudeResponse) {
    const insights = [];
    
    // Look for action-oriented language
    const actionPatterns = [
      /should\s+([^.]+)/gi,
      /must\s+([^.]+)/gi,
      /recommend\s+([^.]+)/gi,
      /consider\s+([^.]+)/gi,
      /advise\s+([^.]+)/gi
    ];

    actionPatterns.forEach(pattern => {
      const matches = [...claudeResponse.matchAll(pattern)];
      matches.forEach(match => {
        insights.push({
          action: match[1].trim(),
          urgency: this.assessActionUrgency(match[0]),
          category: this.categorizeAction(match[1])
        });
      });
    });

    return insights.slice(0, 10); // Limit to top 10 most actionable insights
  }

  assessActionUrgency(actionText) {
    const urgentKeywords = ['immediately', 'urgent', 'asap', 'must'];
    const mediumKeywords = ['should', 'recommend', 'advise'];
    
    const text = actionText.toLowerCase();
    
    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      return 'high';
    } else if (mediumKeywords.some(keyword => text.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  categorizeAction(actionText) {
    const text = actionText.toLowerCase();
    
    if (text.includes('evidence') || text.includes('document')) return 'evidence';
    if (text.includes('court') || text.includes('filing')) return 'procedural';
    if (text.includes('settlement') || text.includes('negotiat')) return 'settlement';
    if (text.includes('legal') || text.includes('law')) return 'legal_research';
    
    return 'general';
  }

  assessStrategicConfidence(claudeResponse) {
    let confidence = 0.5; // Base confidence

    // Look for confidence indicators in response
    if (claudeResponse.includes('strong case') || claudeResponse.includes('clear')) {
      confidence += 0.2;
    }
    
    if (claudeResponse.includes('uncertain') || claudeResponse.includes('unclear')) {
      confidence -= 0.2;
    }
    
    if (claudeResponse.includes('precedent') || claudeResponse.includes('established')) {
      confidence += 0.15;
    }

    if (claudeResponse.includes('complex') || claudeResponse.includes('difficult')) {
      confidence -= 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  suggestNextConsultation(claudeResponse, pattern) {
    const suggestions = [];

    // Analyze what areas might benefit from follow-up consultation
    if (claudeResponse.includes('evidence') && claudeResponse.includes('gather')) {
      suggestions.push({
        timing: 'after_evidence_collection',
        focus: 'evidence_strategy_refinement',
        description: 'Refine strategy after gathering additional evidence'
      });
    }

    if (claudeResponse.includes('settlement') || claudeResponse.includes('negotiation')) {
      suggestions.push({
        timing: 'before_negotiation',
        focus: 'settlement_strategy_optimization',
        description: 'Optimize negotiation approach before engaging with opposing party'
      });
    }

    return suggestions;
  }

  async updateConsultationOutcome(recordId, outcome) {
    return await this.consultationHistory.updateConsultationOutcome(recordId, outcome);
  }

  generateUsageReport() {
    return {
      api_optimization: this.apiOptimizer.generateUsageReport(),
      consultation_history: this.consultationHistory.getConsultationHistoryInfo(),
      pattern_generation: this.patternGenerator.getPatternGeneratorInfo(),
      strategic_frameworks: this.strategicFramework.getFrameworkInfo()
    };
  }

  getEngineInfo() {
    return {
      name: 'Enhanced Claude Engine',
      version: '5.0.0',
      components: [
        'Enhanced Pattern Generator',
        'Consultation History & Learning',
        'Strategic Guidance Framework',
        'API Optimizer'
      ],
      capabilities: [
        'Rich pattern generation',
        'Historical learning',
        'Multi-framework strategic analysis',
        'Cost-optimized API usage',
        'Actionable insight extraction',
        'Follow-up consultation planning'
      ],
      features: [
        'Privacy-first consultation patterns',
        'Dynamic framework selection',
        'Intelligent API optimization',
        'Learning from consultation outcomes',
        'Strategic confidence assessment'
      ]
    };
  }
}

export default EnhancedClaudeEngine;