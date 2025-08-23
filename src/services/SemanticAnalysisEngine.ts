/**
 * Semantic Analysis Engine - Phase 2 Enhanced Local Analysis
 * Advanced semantic understanding and context analysis
 * Generates patterns like: "Multi-party contractual dispute with performance obligations and financial penalties"
 */

export interface SemanticEntity {
  id: string;
  text: string;
  type: 'legal_concept' | 'obligation' | 'right' | 'penalty' | 'condition' | 'party_role' | 'legal_standard';
  subType?: string;
  confidence: number;
  context: string;
  documentId: string;
  sourceLocation: {
    page?: number;
    line?: number;
    character?: number;
    context: string;
  };
  relatedEntities: string[];
  semanticProperties: {
    isConditional: boolean;
    isNegated: boolean;
    temporality: 'past' | 'present' | 'future' | 'ongoing' | 'conditional';
    certainty: 'definite' | 'probable' | 'possible' | 'uncertain';
  };
}

export interface SemanticRelationship {
  id: string;
  source: SemanticEntity;
  target: SemanticEntity;
  relationshipType: 'triggers' | 'requires' | 'prohibits' | 'modifies' | 'depends_on' | 'conflicts_with' | 'supports';
  confidence: number;
  contextualStrength: 'strong' | 'moderate' | 'weak';
  legalImplications: string[];
  anonymousPattern: string;
}

export interface LegalTheme {
  id: string;
  theme: string;
  category: 'contract_law' | 'tort_law' | 'property_law' | 'employment_law' | 'commercial_law' | 'dispute_resolution';
  prevalence: number;
  keyElements: SemanticEntity[];
  supportingEvidence: string[];
  legalPrinciples: string[];
  strategicImplications: string[];
  anonymousPattern: string;
}

export interface ContextualInsight {
  id: string;
  type: 'inconsistency' | 'ambiguity' | 'gap' | 'strength' | 'weakness' | 'opportunity' | 'risk';
  description: string;
  affectedEntities: SemanticEntity[];
  confidence: number;
  legalSignificance: 'high' | 'medium' | 'low';
  strategicValue: string;
  recommendedActions: string[];
  anonymousPattern: string;
}

export interface SemanticAnalysisResult {
  entities: SemanticEntity[];
  relationships: SemanticRelationship[];
  themes: LegalTheme[];
  insights: ContextualInsight[];
  summary: {
    totalEntities: number;
    primaryThemes: string[];
    keyInsights: string[];
    overallComplexity: number;
    semanticCoherence: number;
  };
  patterns: {
    disputeNature: string;
    legalFramework: string;
    complexityIndicators: string[];
    strategicFactors: string[];
  };
  anonymousPatterns: string[];
  recommendations: string[];
}

/**
 * Advanced semantic analysis engine for legal document understanding
 */
export class SemanticAnalysisEngine {
  private legalConceptPatterns = {
    obligations: [
      { pattern: /(?:shall|must|required to|obliged to|bound to)\s+(.*?)(?:\.|,|;|$)/gi, strength: 'mandatory' },
      { pattern: /(?:should|ought to|expected to)\s+(.*?)(?:\.|,|;|$)/gi, strength: 'expected' },
      { pattern: /(?:may|permitted to|entitled to)\s+(.*?)(?:\.|,|;|$)/gi, strength: 'permissive' }
    ],
    
    conditions: [
      { pattern: /(?:if|provided that|subject to|conditional upon)\s+(.*?)(?:then|,|\.|$)/gi, type: 'condition' },
      { pattern: /(?:unless|except|save for)\s+(.*?)(?:\.|,|;|$)/gi, type: 'exception' },
      { pattern: /(?:where|when|in the event)\s+(.*?)(?:\.|,|;|$)/gi, type: 'circumstance' }
    ],
    
    penalties: [
      { pattern: /(?:penalty|fine|damages|liquidated damages|forfeit)\s+(?:of|in the amount of)?\s*£?([^.]+)/gi, type: 'financial' },
      { pattern: /(?:terminate|termination|breach|default|void)\s+(.*?)(?:\.|,|;|$)/gi, type: 'contractual' },
      { pattern: /(?:injunction|restraining order|prohibition)\s+(.*?)(?:\.|,|;|$)/gi, type: 'equitable' }
    ],
    
    rights: [
      { pattern: /(?:right to|entitled to|privilege|authority to)\s+(.*?)(?:\.|,|;|$)/gi, type: 'positive' },
      { pattern: /(?:free from|protection from|immunity from)\s+(.*?)(?:\.|,|;|$)/gi, type: 'negative' },
      { pattern: /(?:claim|action|remedy|recourse)\s+(?:for|against)\s+(.*?)(?:\.|,|;|$)/gi, type: 'remedial' }
    ]
  };

  private legalStandardPatterns = [
    { pattern: /reasonable(?:\s+(?:care|skill|time|notice|grounds))?/gi, standard: 'reasonableness' },
    { pattern: /best endeavours|best efforts/gi, standard: 'best_endeavours' },
    { pattern: /good faith|bona fide/gi, standard: 'good_faith' },
    { pattern: /material(?:\s+(?:breach|change|adverse|effect))?/gi, standard: 'materiality' },
    { pattern: /fundamental breach|repudiatory breach/gi, standard: 'fundamental_breach' }
  ];

  private contextualModifiers = {
    negation: [/not|no|never|neither|without|absence of|fail to|refuse to/gi],
    uncertainty: [/may|might|could|possibly|potentially|arguably/gi],
    temporality: [
      { pattern: /(?:before|prior to|previously)/gi, time: 'past' },
      { pattern: /(?:after|following|subsequently)/gi, time: 'future' },
      { pattern: /(?:during|while|throughout)/gi, time: 'ongoing' },
      { pattern: /(?:currently|presently|now)/gi, time: 'present' }
    ]
  };

  constructor() {}

  /**
   * Main semantic analysis method
   */
  async analyzeSemantics(documents: any[]): Promise<SemanticAnalysisResult> {
    // Phase 1: Extract semantic entities
    const entities = await this.extractSemanticEntities(documents);
    
    // Phase 2: Discover semantic relationships
    const relationships = await this.discoverSemanticRelationships(entities, documents);
    
    // Phase 3: Identify legal themes
    const themes = await this.identifyLegalThemes(entities, relationships);
    
    // Phase 4: Generate contextual insights
    const insights = await this.generateContextualInsights(entities, relationships, themes);
    
    // Phase 5: Create analysis summary
    const summary = this.generateSemanticSummary(entities, relationships, themes, insights);
    const patterns = this.generateSemanticPatterns(themes, insights);
    const anonymousPatterns = this.generateAnonymousPatterns(entities, relationships, themes, insights);
    const recommendations = this.generateRecommendations(insights, themes);

    return {
      entities,
      relationships,
      themes,
      insights,
      summary,
      patterns,
      anonymousPatterns,
      recommendations
    };
  }

  /**
   * Extract semantic entities with legal understanding
   */
  private async extractSemanticEntities(documents: any[]): Promise<SemanticEntity[]> {
    const entities: SemanticEntity[] = [];
    
    for (const doc of documents) {
      const text = doc.text || doc.content || '';
      const docId = doc.id || `doc_${Date.now()}`;
      
      // Extract different types of legal concepts
      const obligations = this.extractObligations(text, docId);
      const conditions = this.extractConditions(text, docId);
      const penalties = this.extractPenalties(text, docId);
      const rights = this.extractRights(text, docId);
      const legalStandards = this.extractLegalStandards(text, docId);
      
      entities.push(...obligations, ...conditions, ...penalties, ...rights, ...legalStandards);
    }
    
    // Post-process entities for semantic properties
    return this.enhanceSemanticProperties(entities);
  }

  /**
   * Extract obligations from text
   */
  private extractObligations(text: string, documentId: string): SemanticEntity[] {
    const obligations: SemanticEntity[] = [];
    
    this.legalConceptPatterns.obligations.forEach(({ pattern, strength }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const obligationText = match[1]?.trim();
        if (obligationText && obligationText.length > 5) {
          const context = this.extractContext(text, match.index, match[0].length);
          
          obligations.push({
            id: `obligation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: obligationText,
            type: 'obligation',
            subType: strength,
            confidence: this.calculateConfidence(match[0], context),
            context,
            documentId,
            sourceLocation: {
              character: match.index,
              context: context
            },
            relatedEntities: this.extractRelatedEntities(context),
            semanticProperties: {
              isConditional: false,
              isNegated: false,
              temporality: 'ongoing',
              certainty: strength === 'mandatory' ? 'definite' : 'probable'
            }
          });
        }
      }
    });
    
    return obligations;
  }

  /**
   * Extract conditions from text
   */
  private extractConditions(text: string, documentId: string): SemanticEntity[] {
    const conditions: SemanticEntity[] = [];
    
    this.legalConceptPatterns.conditions.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const conditionText = match[1]?.trim();
        if (conditionText && conditionText.length > 5) {
          const context = this.extractContext(text, match.index, match[0].length);
          
          conditions.push({
            id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: conditionText,
            type: 'condition',
            subType: type,
            confidence: this.calculateConfidence(match[0], context),
            context,
            documentId,
            sourceLocation: {
              character: match.index,
              context: context
            },
            relatedEntities: this.extractRelatedEntities(context),
            semanticProperties: {
              isConditional: true,
              isNegated: type === 'exception',
              temporality: 'conditional',
              certainty: 'conditional'
            }
          });
        }
      }
    });
    
    return conditions;
  }

  /**
   * Extract penalties from text
   */
  private extractPenalties(text: string, documentId: string): SemanticEntity[] {
    const penalties: SemanticEntity[] = [];
    
    this.legalConceptPatterns.penalties.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const penaltyText = match[1]?.trim() || match[0];
        if (penaltyText && penaltyText.length > 3) {
          const context = this.extractContext(text, match.index, match[0].length);
          
          penalties.push({
            id: `penalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: penaltyText,
            type: 'penalty',
            subType: type,
            confidence: this.calculateConfidence(match[0], context),
            context,
            documentId,
            sourceLocation: {
              character: match.index,
              context: context
            },
            relatedEntities: this.extractRelatedEntities(context),
            semanticProperties: {
              isConditional: true,
              isNegated: false,
              temporality: 'conditional',
              certainty: 'definite'
            }
          });
        }
      }
    });
    
    return penalties;
  }

  /**
   * Extract rights from text
   */
  private extractRights(text: string, documentId: string): SemanticEntity[] {
    const rights: SemanticEntity[] = [];
    
    this.legalConceptPatterns.rights.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const rightText = match[1]?.trim();
        if (rightText && rightText.length > 5) {
          const context = this.extractContext(text, match.index, match[0].length);
          
          rights.push({
            id: `right_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: rightText,
            type: 'right',
            subType: type,
            confidence: this.calculateConfidence(match[0], context),
            context,
            documentId,
            sourceLocation: {
              character: match.index,
              context: context
            },
            relatedEntities: this.extractRelatedEntities(context),
            semanticProperties: {
              isConditional: false,
              isNegated: type === 'negative',
              temporality: 'ongoing',
              certainty: 'definite'
            }
          });
        }
      }
    });
    
    return rights;
  }

  /**
   * Extract legal standards from text
   */
  private extractLegalStandards(text: string, documentId: string): SemanticEntity[] {
    const standards: SemanticEntity[] = [];
    
    this.legalStandardPatterns.forEach(({ pattern, standard }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const context = this.extractContext(text, match.index, match[0].length);
        
        standards.push({
          id: `standard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: match[0],
          type: 'legal_standard',
          subType: standard,
          confidence: 0.9,
          context,
          documentId,
          sourceLocation: {
            character: match.index,
            context: context
          },
          relatedEntities: this.extractRelatedEntities(context),
          semanticProperties: {
            isConditional: false,
            isNegated: false,
            temporality: 'ongoing',
            certainty: 'definite'
          }
        });
      }
    });
    
    return standards;
  }

  /**
   * Enhance semantic properties of entities
   */
  private enhanceSemanticProperties(entities: SemanticEntity[]): SemanticEntity[] {
    return entities.map(entity => {
      const context = entity.context.toLowerCase();
      
      // Check for negation
      const isNegated = this.contextualModifiers.negation.some(pattern => 
        pattern.test(context)
      );
      
      // Check for uncertainty
      const isUncertain = this.contextualModifiers.uncertainty.some(pattern => 
        pattern.test(context)
      );
      
      // Check for temporality
      let temporality = entity.semanticProperties.temporality;
      for (const { pattern, time } of this.contextualModifiers.temporality) {
        if (pattern.test(context)) {
          temporality = time as any;
          break;
        }
      }
      
      return {
        ...entity,
        semanticProperties: {
          ...entity.semanticProperties,
          isNegated: isNegated || entity.semanticProperties.isNegated,
          certainty: isUncertain ? 'uncertain' : entity.semanticProperties.certainty,
          temporality
        }
      };
    });
  }

  /**
   * Discover semantic relationships between entities
   */
  private async discoverSemanticRelationships(entities: SemanticEntity[], documents: any[]): Promise<SemanticRelationship[]> {
    const relationships: SemanticRelationship[] = [];
    
    // Look for relationships between entities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        
        const relationship = this.analyzeEntityRelationship(entity1, entity2);
        if (relationship) {
          relationships.push(relationship);
        }
      }
    }
    
    return relationships;
  }

  /**
   * Analyze relationship between two entities
   */
  private analyzeEntityRelationship(entity1: SemanticEntity, entity2: SemanticEntity): SemanticRelationship | null {
    // Same document relationships are stronger
    if (entity1.documentId !== entity2.documentId) {
      return null;
    }
    
    // Analyze based on entity types and proximity
    const relationship = this.determineRelationshipType(entity1, entity2);
    if (!relationship) return null;
    
    const confidence = this.calculateRelationshipConfidence(entity1, entity2, relationship);
    if (confidence < 0.6) return null;
    
    return {
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: entity1,
      target: entity2,
      relationshipType: relationship,
      confidence,
      contextualStrength: confidence > 0.8 ? 'strong' : confidence > 0.7 ? 'moderate' : 'weak',
      legalImplications: this.generateLegalImplications(entity1, entity2, relationship),
      anonymousPattern: this.createRelationshipPattern(entity1.type, entity2.type, relationship)
    };
  }

  private determineRelationshipType(entity1: SemanticEntity, entity2: SemanticEntity): SemanticRelationship['relationshipType'] | null {
    // Condition-Obligation relationships
    if (entity1.type === 'condition' && entity2.type === 'obligation') {
      return 'triggers';
    }
    
    // Obligation-Penalty relationships
    if (entity1.type === 'obligation' && entity2.type === 'penalty') {
      return 'triggers';
    }
    
    // Right-Obligation relationships
    if (entity1.type === 'right' && entity2.type === 'obligation') {
      return 'requires';
    }
    
    // Conflicting obligations
    if (entity1.type === 'obligation' && entity2.type === 'obligation') {
      if (this.detectConflict(entity1, entity2)) {
        return 'conflicts_with';
      }
      return 'supports';
    }
    
    return null;
  }

  private detectConflict(entity1: SemanticEntity, entity2: SemanticEntity): boolean {
    // Simple conflict detection - in practice would be more sophisticated
    const text1 = entity1.text.toLowerCase();
    const text2 = entity2.text.toLowerCase();
    
    // Check for contradictory terms
    const contradictions = [
      ['shall', 'shall not'],
      ['required', 'prohibited'],
      ['must', 'must not'],
      ['entitled', 'forbidden']
    ];
    
    return contradictions.some(([pos, neg]) => 
      (text1.includes(pos) && text2.includes(neg)) ||
      (text1.includes(neg) && text2.includes(pos))
    );
  }

  /**
   * Identify legal themes across the document set
   */
  private async identifyLegalThemes(entities: SemanticEntity[], relationships: SemanticRelationship[]): Promise<LegalTheme[]> {
    const themes: LegalTheme[] = [];
    
    // Analyze entity patterns to identify themes
    const entityGroups = this.groupEntitiesByTheme(entities);
    
    for (const [themeName, themeEntities] of Object.entries(entityGroups)) {
      if (themeEntities.length < 2) continue;
      
      const theme = this.buildLegalTheme(themeName, themeEntities, relationships);
      themes.push(theme);
    }
    
    return themes;
  }

  private groupEntitiesByTheme(entities: SemanticEntity[]): Record<string, SemanticEntity[]> {
    const groups: Record<string, SemanticEntity[]> = {
      'Contractual Obligations': [],
      'Performance Standards': [],
      'Financial Penalties': [],
      'Termination Provisions': [],
      'Dispute Resolution': [],
      'Compliance Requirements': []
    };
    
    entities.forEach(entity => {
      const entityText = entity.text.toLowerCase();
      
      if (entity.type === 'obligation') {
        if (entityText.includes('perform') || entityText.includes('deliver') || entityText.includes('complete')) {
          groups['Contractual Obligations'].push(entity);
        }
        if (entityText.includes('reasonable') || entityText.includes('standard') || entityText.includes('quality')) {
          groups['Performance Standards'].push(entity);
        }
      }
      
      if (entity.type === 'penalty' && entity.subType === 'financial') {
        groups['Financial Penalties'].push(entity);
      }
      
      if (entityText.includes('terminate') || entityText.includes('breach') || entityText.includes('default')) {
        groups['Termination Provisions'].push(entity);
      }
      
      if (entityText.includes('dispute') || entityText.includes('arbitration') || entityText.includes('court')) {
        groups['Dispute Resolution'].push(entity);
      }
      
      if (entityText.includes('comply') || entityText.includes('regulation') || entityText.includes('law')) {
        groups['Compliance Requirements'].push(entity);
      }
    });
    
    return groups;
  }

  private buildLegalTheme(themeName: string, entities: SemanticEntity[], relationships: SemanticRelationship[]): LegalTheme {
    const category = this.categorizeLegalTheme(themeName);
    const prevalence = entities.length / 100; // Normalized prevalence
    
    return {
      id: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      theme: themeName,
      category,
      prevalence,
      keyElements: entities.slice(0, 5), // Top 5 most relevant
      supportingEvidence: entities.map(e => e.context).slice(0, 3),
      legalPrinciples: this.identifyLegalPrinciples(themeName, entities),
      strategicImplications: this.generateStrategicImplications(themeName, entities),
      anonymousPattern: this.createThemePattern(themeName, entities.length)
    };
  }

  private categorizeLegalTheme(themeName: string): LegalTheme['category'] {
    const themeMap: Record<string, LegalTheme['category']> = {
      'Contractual Obligations': 'contract_law',
      'Performance Standards': 'contract_law',
      'Financial Penalties': 'commercial_law',
      'Termination Provisions': 'contract_law',
      'Dispute Resolution': 'dispute_resolution',
      'Compliance Requirements': 'commercial_law'
    };
    
    return themeMap[themeName] || 'commercial_law';
  }

  /**
   * Generate contextual insights
   */
  private async generateContextualInsights(
    entities: SemanticEntity[], 
    relationships: SemanticRelationship[], 
    themes: LegalTheme[]
  ): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];
    
    // Analyze for inconsistencies
    const inconsistencies = this.findInconsistencies(entities, relationships);
    insights.push(...inconsistencies);
    
    // Analyze for ambiguities
    const ambiguities = this.findAmbiguities(entities);
    insights.push(...ambiguities);
    
    // Analyze for gaps
    const gaps = this.findGaps(themes);
    insights.push(...gaps);
    
    // Analyze for strengths and weaknesses
    const strengths = this.findStrengths(entities, relationships);
    const weaknesses = this.findWeaknesses(entities, relationships);
    insights.push(...strengths, ...weaknesses);
    
    return insights;
  }

  private findInconsistencies(entities: SemanticEntity[], relationships: SemanticRelationship[]): ContextualInsight[] {
    const insights: ContextualInsight[] = [];
    
    // Find conflicting relationships
    const conflicts = relationships.filter(r => r.relationshipType === 'conflicts_with');
    
    for (const conflict of conflicts) {
      insights.push({
        id: `inconsistency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'inconsistency',
        description: `Conflicting requirements between obligations`,
        affectedEntities: [conflict.source, conflict.target],
        confidence: conflict.confidence,
        legalSignificance: 'high',
        strategicValue: 'May create enforcement difficulties or require clarification',
        recommendedActions: [
          'Clarify conflicting obligations',
          'Establish priority hierarchy',
          'Consider amendment to resolve conflict'
        ],
        anonymousPattern: 'Conflicting obligation pattern requiring resolution'
      });
    }
    
    return insights;
  }

  private findAmbiguities(entities: SemanticEntity[]): ContextualInsight[] {
    const insights: ContextualInsight[] = [];
    
    // Find entities with uncertain certainty
    const uncertainEntities = entities.filter(e => 
      e.semanticProperties.certainty === 'uncertain' || 
      e.confidence < 0.7
    );
    
    if (uncertainEntities.length > 0) {
      insights.push({
        id: `ambiguity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'ambiguity',
        description: `${uncertainEntities.length} ambiguous provisions requiring clarification`,
        affectedEntities: uncertainEntities,
        confidence: 0.8,
        legalSignificance: 'medium',
        strategicValue: 'Ambiguity may create interpretation challenges',
        recommendedActions: [
          'Seek clarification on ambiguous terms',
          'Document interpretation assumptions',
          'Consider worst-case interpretation scenarios'
        ],
        anonymousPattern: 'Ambiguous provision pattern with interpretation challenges'
      });
    }
    
    return insights;
  }

  private findGaps(themes: LegalTheme[]): ContextualInsight[] {
    const insights: ContextualInsight[] = [];
    
    // Expected themes in comprehensive legal documents
    const expectedThemes = [
      'Dispute Resolution',
      'Termination Provisions',
      'Performance Standards'
    ];
    
    const presentThemes = themes.map(t => t.theme);
    const missingThemes = expectedThemes.filter(theme => 
      !presentThemes.some(present => present.includes(theme))
    );
    
    if (missingThemes.length > 0) {
      insights.push({
        id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'gap',
        description: `Missing key legal provisions: ${missingThemes.join(', ')}`,
        affectedEntities: [],
        confidence: 0.85,
        legalSignificance: 'high',
        strategicValue: 'Gaps may create legal vulnerabilities',
        recommendedActions: [
          'Review for missing standard provisions',
          'Consider comprehensive legal framework',
          'Assess risk of incomplete documentation'
        ],
        anonymousPattern: 'Documentation gap pattern with missing key provisions'
      });
    }
    
    return insights;
  }

  private findStrengths(entities: SemanticEntity[], relationships: SemanticRelationship[]): ContextualInsight[] {
    const insights: ContextualInsight[] = [];
    
    // Strong legal standards
    const strongStandards = entities.filter(e => 
      e.type === 'legal_standard' && 
      ['best_endeavours', 'reasonable'].includes(e.subType || '')
    );
    
    if (strongStandards.length > 0) {
      insights.push({
        id: `strength_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'strength',
        description: `Well-defined legal standards providing clear expectations`,
        affectedEntities: strongStandards,
        confidence: 0.9,
        legalSignificance: 'medium',
        strategicValue: 'Clear standards support enforceability',
        recommendedActions: [
          'Leverage clear standards in arguments',
          'Document compliance with standards',
          'Use standards as benchmark for performance'
        ],
        anonymousPattern: 'Strong legal standard pattern with clear benchmarks'
      });
    }
    
    return insights;
  }

  private findWeaknesses(entities: SemanticEntity[], relationships: SemanticRelationship[]): ContextualInsight[] {
    const insights: ContextualInsight[] = [];
    
    // Weak or permissive obligations
    const weakObligations = entities.filter(e => 
      e.type === 'obligation' && 
      e.subType === 'expected'
    );
    
    if (weakObligations.length > 0) {
      insights.push({
        id: `weakness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'weakness',
        description: `Permissive language may weaken enforceability`,
        affectedEntities: weakObligations,
        confidence: 0.8,
        legalSignificance: 'medium',
        strategicValue: 'Weak obligations may be difficult to enforce',
        recommendedActions: [
          'Consider strengthening obligation language',
          'Document performance expectations clearly',
          'Assess enforcement alternatives'
        ],
        anonymousPattern: 'Weak obligation pattern with enforcement challenges'
      });
    }
    
    return insights;
  }

  // Helper methods

  private extractContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + length + 50);
    return text.substring(start, end);
  }

  private extractRelatedEntities(context: string): string[] {
    // Simple entity extraction - in practice would be more sophisticated
    const entities = [];
    
    const companyPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Ltd|Limited|PLC)\b/g;
    let match;
    while ((match = companyPattern.exec(context)) !== null && entities.length < 3) {
      entities.push(match[0]);
    }
    
    return entities;
  }

  private calculateConfidence(matchText: string, context: string): number {
    let confidence = 0.75;
    
    // Boost confidence for legal language
    if (context.toLowerCase().includes('contract') || context.toLowerCase().includes('agreement')) {
      confidence += 0.1;
    }
    
    // Boost for clear obligation language
    if (matchText.toLowerCase().includes('shall') || matchText.toLowerCase().includes('must')) {
      confidence += 0.15;
    }
    
    return Math.min(0.98, confidence);
  }

  private calculateRelationshipConfidence(entity1: SemanticEntity, entity2: SemanticEntity, relationship: string): number {
    let confidence = 0.7;
    
    // Boost for same document
    if (entity1.documentId === entity2.documentId) {
      confidence += 0.1;
    }
    
    // Boost for logical relationships
    if (relationship === 'triggers' && entity1.type === 'condition' && entity2.type === 'obligation') {
      confidence += 0.2;
    }
    
    return Math.min(0.98, confidence);
  }

  private generateLegalImplications(entity1: SemanticEntity, entity2: SemanticEntity, relationship: string): string[] {
    const implications = [];
    
    if (relationship === 'conflicts_with') {
      implications.push('May create enforceability issues');
      implications.push('Requires resolution to avoid disputes');
    }
    
    if (relationship === 'triggers') {
      implications.push('Creates conditional obligation structure');
      implications.push('Performance depends on trigger conditions');
    }
    
    return implications;
  }

  private createRelationshipPattern(type1: string, type2: string, relationship: string): string {
    return `${type1.replace('_', ' ')} ${relationship.replace('_', ' ')} ${type2.replace('_', ' ')} relationship`;
  }

  private identifyLegalPrinciples(themeName: string, entities: SemanticEntity[]): string[] {
    const principles: Record<string, string[]> = {
      'Contractual Obligations': [
        'Pacta sunt servanda (agreements must be kept)',
        'Good faith in contractual performance',
        'Reasonable performance standards'
      ],
      'Performance Standards': [
        'Objective reasonableness test',
        'Industry standard compliance',
        'Best endeavours requirement'
      ],
      'Financial Penalties': [
        'Liquidated damages enforceability',
        'Penalty clause restrictions',
        'Proportionality principle'
      ]
    };
    
    return principles[themeName] || [];
  }

  private generateStrategicImplications(themeName: string, entities: SemanticEntity[]): string[] {
    return [
      `${themeName} framework requires careful consideration`,
      'May impact negotiation strategy and risk assessment',
      'Should inform compliance and performance monitoring'
    ];
  }

  private createThemePattern(themeName: string, entityCount: number): string {
    const complexity = entityCount > 5 ? 'complex' : entityCount > 2 ? 'moderate' : 'simple';
    return `${complexity} ${themeName.toLowerCase()} framework with ${entityCount} key elements`;
  }

  private generateSemanticSummary(entities: SemanticEntity[], relationships: SemanticRelationship[], themes: LegalTheme[], insights: ContextualInsight[]) {
    const primaryThemes = themes
      .sort((a, b) => b.prevalence - a.prevalence)
      .slice(0, 3)
      .map(t => t.theme);
    
    const keyInsights = insights
      .filter(i => i.legalSignificance === 'high')
      .map(i => i.description);
    
    const overallComplexity = Math.min(1.0, (entities.length * 0.02) + (relationships.length * 0.05) + (themes.length * 0.1));
    const semanticCoherence = Math.max(0.0, 1.0 - (insights.filter(i => i.type === 'inconsistency').length * 0.1));
    
    return {
      totalEntities: entities.length,
      primaryThemes,
      keyInsights,
      overallComplexity,
      semanticCoherence
    };
  }

  private generateSemanticPatterns(themes: LegalTheme[], insights: ContextualInsight[]) {
    const disputeNature = this.determineDisputeNature(themes, insights);
    const legalFramework = this.determineLegalFramework(themes);
    const complexityIndicators = this.identifyComplexityIndicators(themes, insights);
    const strategicFactors = this.identifyStrategicFactors(insights);
    
    return {
      disputeNature,
      legalFramework,
      complexityIndicators,
      strategicFactors
    };
  }

  private determineDisputeNature(themes: LegalTheme[], insights: ContextualInsight[]): string {
    const hasContractual = themes.some(t => t.category === 'contract_law');
    const hasCommercial = themes.some(t => t.category === 'commercial_law');
    const hasInconsistencies = insights.some(i => i.type === 'inconsistency');
    
    if (hasContractual && hasCommercial && hasInconsistencies) {
      return 'Complex multi-faceted commercial dispute with contractual inconsistencies';
    } else if (hasContractual && hasInconsistencies) {
      return 'Contractual dispute with obligation conflicts';
    } else if (hasCommercial) {
      return 'Commercial law matter with financial implications';
    }
    
    return 'Legal matter requiring detailed analysis';
  }

  private determineLegalFramework(themes: LegalTheme[]): string {
    const categories = [...new Set(themes.map(t => t.category))];
    return `Multi-domain legal framework spanning ${categories.join(', ')}`;
  }

  private identifyComplexityIndicators(themes: LegalTheme[], insights: ContextualInsight[]): string[] {
    const indicators = [];
    
    if (themes.length > 4) indicators.push('Multiple legal themes present');
    if (insights.some(i => i.type === 'inconsistency')) indicators.push('Internal contradictions detected');
    if (insights.some(i => i.type === 'ambiguity')) indicators.push('Ambiguous provisions requiring interpretation');
    if (themes.some(t => t.prevalence > 0.1)) indicators.push('High density of legal concepts');
    
    return indicators;
  }

  private identifyStrategicFactors(insights: ContextualInsight[]): string[] {
    return insights
      .filter(i => i.legalSignificance === 'high')
      .map(i => i.strategicValue);
  }

  private generateAnonymousPatterns(entities: SemanticEntity[], relationships: SemanticRelationship[], themes: LegalTheme[], insights: ContextualInsight[]): string[] {
    const patterns = [];
    
    // Entity patterns
    patterns.push(...relationships.map(r => r.anonymousPattern));
    patterns.push(...themes.map(t => t.anonymousPattern));
    patterns.push(...insights.map(i => i.anonymousPattern));
    
    return patterns;
  }

  private generateRecommendations(insights: ContextualInsight[], themes: LegalTheme[]): string[] {
    const recommendations = [];
    
    // High-priority insights
    const criticalInsights = insights.filter(i => i.legalSignificance === 'high');
    for (const insight of criticalInsights) {
      recommendations.push(...insight.recommendedActions);
    }
    
    // Theme-based recommendations
    if (themes.some(t => t.category === 'contract_law')) {
      recommendations.push('Review contractual framework for completeness and consistency');
    }
    
    if (themes.some(t => t.category === 'dispute_resolution')) {
      recommendations.push('Assess dispute resolution mechanisms and procedures');
    }
    
    // Remove duplicates
    return [...new Set(recommendations)];
  }
}

export default SemanticAnalysisEngine;