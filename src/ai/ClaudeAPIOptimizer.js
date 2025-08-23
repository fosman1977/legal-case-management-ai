/**
 * Claude API Optimizer - Week 5 API Usage and Cost Optimization
 * Optimizes Claude API usage for cost efficiency and performance
 */

class ClaudeAPIOptimizer {
  constructor() {
    this.tokenLimits = {
      claude_3_haiku: 200000,    // 200k context, fast and cheap
      claude_3_sonnet: 200000,   // 200k context, balanced
      claude_3_opus: 200000      // 200k context, most capable
    };

    this.costPerToken = {
      claude_3_haiku: { input: 0.00025, output: 0.00125 },   // Per 1k tokens
      claude_3_sonnet: { input: 0.003, output: 0.015 },
      claude_3_opus: { input: 0.015, output: 0.075 }
    };

    this.compressionStrategies = {
      pattern_summarization: new PatternSummarizationStrategy(),
      context_pruning: new ContextPruningStrategy(),
      incremental_consultation: new IncrementalConsultationStrategy(),
      template_reuse: new TemplateReuseStrategy()
    };

    this.usageMetrics = {
      total_requests: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_cost: 0,
      model_usage: {},
      optimization_savings: 0
    };
  }

  async optimizeConsultationRequest(pattern, consultationHistory, frameworks) {
    console.log('⚡ Optimizing Claude consultation request...');

    // Step 1: Select optimal model based on complexity
    const selectedModel = this.selectOptimalModel(pattern, frameworks);
    
    // Step 2: Apply compression strategies
    const optimizedPattern = await this.compressPattern(pattern);
    
    // Step 3: Optimize consultation structure
    const optimizedPrompt = this.optimizePromptStructure(
      optimizedPattern, 
      consultationHistory, 
      frameworks,
      selectedModel
    );

    // Step 4: Calculate expected costs
    const costEstimate = this.calculateCostEstimate(optimizedPrompt, selectedModel);

    console.log(`💡 Optimization complete: ${selectedModel}, estimated cost: $${costEstimate.total_cost.toFixed(4)}`);

    return {
      model: selectedModel,
      optimized_prompt: optimizedPrompt,
      cost_estimate: costEstimate,
      compression_applied: this.getCompressionSummary(pattern, optimizedPattern),
      optimization_metadata: {
        original_size: this.estimatePatternSize(pattern),
        optimized_size: this.estimatePatternSize(optimizedPattern),
        compression_ratio: this.calculateCompressionRatio(pattern, optimizedPattern)
      }
    };
  }

  selectOptimalModel(pattern, frameworks) {
    const complexity = pattern.document_profile?.complexity?.complexity_score || 0;
    const frameworkCount = frameworks.length;
    const docCount = pattern.document_profile?.volume || 0;

    // Simple cases - use Haiku for cost efficiency
    if (complexity < 0.4 && frameworkCount <= 2 && docCount < 10) {
      return 'claude_3_haiku';
    }

    // Complex cases requiring deep analysis - use Opus
    if (complexity > 0.8 || frameworkCount > 3 || docCount > 50) {
      return 'claude_3_opus';
    }

    // Balanced cases - use Sonnet
    return 'claude_3_sonnet';
  }

  async compressPattern(pattern) {
    let compressedPattern = { ...pattern };

    // Apply pattern summarization
    compressedPattern = await this.compressionStrategies.pattern_summarization
      .compress(compressedPattern);

    // Apply context pruning
    compressedPattern = await this.compressionStrategies.context_pruning
      .compress(compressedPattern);

    return compressedPattern;
  }

  optimizePromptStructure(pattern, consultationHistory, frameworks, model) {
    const basePrompt = this.generateBasePrompt(pattern, frameworks);
    
    // Model-specific optimizations
    const modelOptimizations = this.getModelOptimizations(model);
    
    // Add relevant historical context (compressed)
    const historicalContext = this.compressHistoricalContext(
      consultationHistory, 
      pattern,
      modelOptimizations.max_history_items
    );

    // Structure the final prompt
    const optimizedPrompt = {
      system_prompt: this.generateSystemPrompt(modelOptimizations),
      
      consultation_request: {
        case_summary: pattern.document_profile,
        legal_analysis: this.compressLegalAnalysis(pattern.legal_analysis),
        strategic_frameworks: frameworks.map(f => ({
          framework: f.framework,
          priority: f.priority,
          key_focus: this.getFrameworkKeyFocus(f.framework)
        })),
        risk_indicators: this.compressRiskIndicators(pattern.risk_indicators)
      },

      historical_context: historicalContext,
      
      response_structure: this.generateResponseStructure(frameworks),
      
      optimization_notes: {
        model: model,
        compression_applied: true,
        cost_optimized: true
      }
    };

    return optimizedPrompt;
  }

  getModelOptimizations(model) {
    const optimizations = {
      claude_3_haiku: {
        max_history_items: 3,
        response_length: 'concise',
        detail_level: 'high-level',
        focus: 'practical_actions'
      },
      
      claude_3_sonnet: {
        max_history_items: 5,
        response_length: 'detailed',
        detail_level: 'comprehensive',
        focus: 'balanced_analysis'
      },
      
      claude_3_opus: {
        max_history_items: 8,
        response_length: 'extensive',
        detail_level: 'deep_analysis',
        focus: 'strategic_insight'
      }
    };

    return optimizations[model] || optimizations.claude_3_sonnet;
  }

  generateSystemPrompt(modelOptimizations) {
    return `You are a senior barrister providing strategic legal guidance. 
    
Response requirements:
- Length: ${modelOptimizations.response_length}
- Detail level: ${modelOptimizations.detail_level}
- Focus: ${modelOptimizations.focus}
- Structure: Use clear headings and bullet points
- Prioritize: Most critical insights first

Remember: This consultation is based on anonymized patterns to protect client confidentiality.`;
  }

  compressLegalAnalysis(legalAnalysis) {
    if (!legalAnalysis) return null;

    return {
      primary_issues: (legalAnalysis.primary_issues || [])
        .slice(0, 5) // Limit to top 5
        .map(issue => ({
          concept: issue.concept,
          importance: Math.round(issue.importance_score * 100) / 100
        })),
      
      secondary_issues_count: (legalAnalysis.secondary_issues || []).length,
      
      procedural_highlights: (legalAnalysis.procedural_considerations || [])
        .filter(proc => proc.urgency === 'high')
        .slice(0, 3)
    };
  }

  compressRiskIndicators(riskIndicators) {
    if (!riskIndicators) return null;

    return {
      timeline_pressures: (riskIndicators.timeline_pressures || []).slice(0, 3),
      high_impact_factors: (riskIndicators.complexity_factors || [])
        .filter(factor => factor.impact === 'high')
        .slice(0, 3),
      strategic_considerations_count: (riskIndicators.strategic_considerations || []).length
    };
  }

  compressHistoricalContext(consultationHistory, pattern, maxItems) {
    if (!consultationHistory) return null;

    const recommendations = consultationHistory.getRecommendationsForPattern(pattern);
    
    return {
      similar_cases_count: recommendations.similar_cases.length,
      successful_strategies: recommendations.learned_strategies
        .filter(strategy => strategy.effectiveness >= 7)
        .slice(0, maxItems)
        .map(strategy => ({
          effectiveness: strategy.effectiveness,
          key_approach: strategy.context
        })),
      
      pattern_confidence: recommendations.pattern_insights.confidence_level,
      historical_effectiveness: recommendations.pattern_insights.historical_effectiveness
    };
  }

  getFrameworkKeyFocus(frameworkName) {
    const focuses = {
      litigation_strategy: 'Case strength and procedural approach',
      settlement_strategy: 'Negotiation leverage and settlement value',
      evidence_strategy: 'Evidence gaps and gathering priorities',
      risk_assessment: 'Risk quantification and mitigation',
      case_preparation: 'Timeline and resource management'
    };

    return focuses[frameworkName] || 'Strategic analysis';
  }

  generateResponseStructure(frameworks) {
    return {
      required_sections: [
        'Executive Summary',
        'Strategic Assessment',
        'Immediate Actions',
        'Risk Analysis',
        'Next Steps Timeline'
      ],
      
      framework_integration: frameworks.map(f => f.framework),
      
      output_format: {
        use_bullet_points: true,
        include_confidence_levels: true,
        prioritize_actions: true,
        limit_word_count: 2000 // Reasonable limit for cost control
      }
    };
  }

  calculateCostEstimate(prompt, model) {
    const inputTokens = this.estimateTokenCount(JSON.stringify(prompt));
    const estimatedOutputTokens = this.estimateOutputTokens(prompt, model);
    
    const costs = this.costPerToken[model];
    const inputCost = (inputTokens / 1000) * costs.input;
    const outputCost = (estimatedOutputTokens / 1000) * costs.output;
    
    return {
      input_tokens: inputTokens,
      estimated_output_tokens: estimatedOutputTokens,
      input_cost: inputCost,
      output_cost: outputCost,
      total_cost: inputCost + outputCost,
      model: model
    };
  }

  estimateTokenCount(text) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  estimateOutputTokens(prompt, model) {
    const baseOutputTokens = {
      claude_3_haiku: 800,   // Concise responses
      claude_3_sonnet: 1500, // Detailed responses  
      claude_3_opus: 2500    // Extensive responses
    };

    const frameworkCount = prompt.consultation_request?.strategic_frameworks?.length || 1;
    const complexityMultiplier = frameworkCount * 0.3 + 0.7; // 0.7 to 1.6 range

    return Math.round(baseOutputTokens[model] * complexityMultiplier);
  }

  estimatePatternSize(pattern) {
    return JSON.stringify(pattern).length;
  }

  calculateCompressionRatio(originalPattern, compressedPattern) {
    const originalSize = this.estimatePatternSize(originalPattern);
    const compressedSize = this.estimatePatternSize(compressedPattern);
    
    return Math.round((1 - compressedSize / originalSize) * 100) / 100;
  }

  getCompressionSummary(originalPattern, compressedPattern) {
    return {
      original_size_chars: this.estimatePatternSize(originalPattern),
      compressed_size_chars: this.estimatePatternSize(compressedPattern),
      compression_ratio: this.calculateCompressionRatio(originalPattern, compressedPattern),
      strategies_applied: [
        'pattern_summarization',
        'context_pruning'
      ]
    };
  }

  async trackUsage(request, response, actualCost) {
    this.usageMetrics.total_requests++;
    this.usageMetrics.total_input_tokens += request.cost_estimate.input_tokens;
    this.usageMetrics.total_output_tokens += response.output_tokens || request.cost_estimate.estimated_output_tokens;
    this.usageMetrics.total_cost += actualCost;

    // Track model usage
    const model = request.model;
    if (!this.usageMetrics.model_usage[model]) {
      this.usageMetrics.model_usage[model] = {
        requests: 0,
        total_cost: 0,
        avg_cost: 0
      };
    }
    
    this.usageMetrics.model_usage[model].requests++;
    this.usageMetrics.model_usage[model].total_cost += actualCost;
    this.usageMetrics.model_usage[model].avg_cost = 
      this.usageMetrics.model_usage[model].total_cost / 
      this.usageMetrics.model_usage[model].requests;

    // Calculate optimization savings
    const unoptimizedCost = this.estimateUnoptimizedCost(request);
    const savings = unoptimizedCost - actualCost;
    if (savings > 0) {
      this.usageMetrics.optimization_savings += savings;
    }

    console.log(`💰 Usage tracked: $${actualCost.toFixed(4)} (${savings.toFixed(4)} saved)`);
  }

  estimateUnoptimizedCost(request) {
    // Estimate what the cost would have been without optimization
    const unoptimizedTokens = request.optimization_metadata.original_size / 4;
    const model = request.model;
    const costs = this.costPerToken[model];
    
    return (unoptimizedTokens / 1000) * costs.input + 
           (request.cost_estimate.estimated_output_tokens / 1000) * costs.output;
  }

  generateUsageReport() {
    const report = {
      period: 'current_session',
      timestamp: new Date().toISOString(),
      
      summary: {
        total_consultations: this.usageMetrics.total_requests,
        total_cost: Math.round(this.usageMetrics.total_cost * 10000) / 10000,
        total_savings: Math.round(this.usageMetrics.optimization_savings * 10000) / 10000,
        savings_percentage: this.usageMetrics.total_cost > 0 
          ? Math.round((this.usageMetrics.optimization_savings / 
             (this.usageMetrics.total_cost + this.usageMetrics.optimization_savings)) * 100)
          : 0
      },

      token_usage: {
        total_input_tokens: this.usageMetrics.total_input_tokens,
        total_output_tokens: this.usageMetrics.total_output_tokens,
        avg_tokens_per_request: this.usageMetrics.total_requests > 0
          ? Math.round((this.usageMetrics.total_input_tokens + this.usageMetrics.total_output_tokens) 
            / this.usageMetrics.total_requests)
          : 0
      },

      model_breakdown: this.usageMetrics.model_usage,

      optimization_effectiveness: {
        compression_average: 0.35, // Would be calculated from actual usage
        cost_reduction_average: this.usageMetrics.optimization_savings / Math.max(1, this.usageMetrics.total_requests),
        strategies_most_effective: [
          'pattern_summarization',
          'model_selection_optimization'
        ]
      }
    };

    return report;
  }

  getOptimizerInfo() {
    return {
      name: 'Claude API Optimizer',
      version: '5.0.0',
      supported_models: Object.keys(this.tokenLimits),
      optimization_strategies: Object.keys(this.compressionStrategies),
      features: [
        'Dynamic model selection',
        'Pattern compression',
        'Cost estimation',
        'Usage tracking',
        'Optimization reporting'
      ],
      current_session_savings: `$${this.usageMetrics.optimization_savings.toFixed(4)}`
    };
  }
}

// Compression Strategy Classes
class PatternSummarizationStrategy {
  async compress(pattern) {
    // Summarize verbose sections while preserving key information
    const compressed = { ...pattern };
    
    // Compress document profile
    if (compressed.document_profile?.types?.distribution) {
      const distribution = compressed.document_profile.types.distribution;
      const topTypes = Object.entries(distribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5); // Keep only top 5 document types
      
      compressed.document_profile.types.distribution = Object.fromEntries(topTypes);
    }

    return compressed;
  }
}

class ContextPruningStrategy {
  async compress(pattern) {
    // Remove redundant or low-value information
    const compressed = { ...pattern };
    
    // Prune secondary legal issues (keep only high importance)
    if (compressed.legal_analysis?.secondary_issues) {
      compressed.legal_analysis.secondary_issues = compressed.legal_analysis.secondary_issues
        .filter(issue => issue.relevance > 1.0)
        .slice(0, 5);
    }

    return compressed;
  }
}

class IncrementalConsultationStrategy {
  async compress(pattern) {
    // For follow-up consultations, reference previous context instead of repeating
    return pattern; // Implementation would track consultation chains
  }
}

class TemplateReuseStrategy {
  async compress(pattern) {
    // Use template structures for common pattern types
    return pattern; // Implementation would identify common patterns
  }
}

export default ClaudeAPIOptimizer;