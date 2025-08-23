/**
 * Local Relationship Mapper - Phase 2 Enhanced Local Analysis
 * Build relationship networks locally
 * Generates patterns like: "Complex financial flow pattern with intermediary entities"
 */

export interface EntityNode {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'location' | 'financial_instrument' | 'legal_document' | 'event';
  attributes: {
    role?: string;
    jurisdiction?: string;
    value?: number;
    date?: string;
    confidence: number;
  };
  mentions: {
    documentId: string;
    context: string;
    position: number;
  }[];
}

export interface RelationshipEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'financial_transfer' | 'contractual' | 'hierarchical' | 'temporal' | 'causal' | 'ownership' | 'representation';
  strength: number;
  confidence: number;
  evidence: {
    documentId: string;
    context: string;
    statement: string;
  }[];
  attributes: {
    amount?: number;
    date?: string;
    direction?: 'bidirectional' | 'source_to_target' | 'target_to_source';
    description?: string;
  };
}

export interface EntityGraph {
  nodes: EntityNode[];
  edges: RelationshipEdge[];
  clusters: EntityCluster[];
  patterns: NetworkPattern[];
}

export interface EntityCluster {
  id: string;
  type: 'financial_network' | 'corporate_structure' | 'legal_parties' | 'temporal_sequence' | 'dispute_parties';
  nodes: string[]; // node IDs
  centralNode?: string;
  description: string;
  significance: 'high' | 'medium' | 'low';
  anonymousPattern: string;
}

export interface NetworkPattern {
  id: string;
  type: 'circular_flow' | 'hub_and_spoke' | 'chain_of_custody' | 'triangular_relationship' | 'complex_hierarchy';
  description: string;
  nodes: string[];
  edges: string[];
  riskLevel: 'high' | 'medium' | 'low';
  legalImplications: string[];
  anonymousPattern: string;
  confidence: number;
}

export interface RelationshipAnalysisResult {
  entityGraph: EntityGraph;
  keyInsights: {
    criticalRelationships: RelationshipEdge[];
    suspiciousPatterns: NetworkPattern[];
    centralEntities: EntityNode[];
    isolatedEntities: EntityNode[];
  };
  anonymousPatterns: string[];
  recommendations: string[];
  summary: {
    totalEntities: number;
    totalRelationships: number;
    networkComplexity: number;
    riskScore: number;
  };
}

/**
 * Advanced entity relationship mapping engine
 * Discovers complex relationships and patterns across multiple documents
 */
export class LocalRelationshipMapper {
  private relationshipPatterns = {
    financial: [
      { pattern: /(?:paid|transferred|sent)\s+£([\d,]+(?:\.\d{2})?)\s+(?:to|from)\s+([A-Z][a-zA-Z\s]+(?:Ltd|Limited|PLC|Corporation))/gi, type: 'payment' },
      { pattern: /([A-Z][a-zA-Z\s]+(?:Ltd|Limited|PLC))\s+(?:owes|is owed|owning)\s+£([\d,]+(?:\.\d{2})?)\s+(?:to|from)\s+([A-Z][a-zA-Z\s]+)/gi, type: 'debt' },
      { pattern: /([A-Z][a-zA-Z\s]+)\s+(?:invested|acquired|purchased)\s+(?:shares|equity|interest)\s+in\s+([A-Z][a-zA-Z\s]+)/gi, type: 'investment' }
    ],
    
    contractual: [
      { pattern: /([A-Z][a-zA-Z\s]+(?:Ltd|Limited|PLC))\s+(?:entered into|signed|executed)\s+(?:a|an|the)\s+([a-z\s]+contract|agreement)\s+with\s+([A-Z][a-zA-Z\s]+)/gi, type: 'contract' },
      { pattern: /([A-Z][a-zA-Z\s]+)\s+(?:as|acting as|representing)\s+([a-z\s]+)\s+for\s+([A-Z][a-zA-Z\s]+)/gi, type: 'representation' },
      { pattern: /([A-Z][a-zA-Z\s]+)\s+(?:guarantees|guaranteed|warrants)\s+(.*?)\s+for\s+([A-Z][a-zA-Z\s]+)/gi, type: 'guarantee' }
    ],
    
    hierarchical: [
      { pattern: /([A-Z][a-zA-Z\s]+(?:Ltd|Limited|PLC))\s+(?:is a|wholly owned)\s+subsidiary\s+of\s+([A-Z][a-zA-Z\s]+)/gi, type: 'subsidiary' },
      { pattern: /([A-Z][a-zA-Z\s]+)\s+(?:controls|owns|manages)\s+([A-Z][a-zA-Z\s]+)/gi, type: 'control' },
      { pattern: /([A-Z][a-zA-Z\s]+)\s+(?:director|officer|employee)\s+of\s+([A-Z][a-zA-Z\s]+)/gi, type: 'employment' }
    ]
  };

  constructor() {}

  /**
   * Main relationship mapping method
   */
  async buildEntityGraph(documents: any[]): Promise<RelationshipAnalysisResult> {
    // Phase 1: Extract entities from all documents
    const entities = await this.extractEntities(documents);
    
    // Phase 2: Discover relationships between entities
    const relationships = await this.discoverRelationships(entities, documents);
    
    // Phase 3: Build graph structure
    const entityGraph = await this.buildGraph(entities, relationships);
    
    // Phase 4: Detect patterns and clusters
    const patterns = await this.detectNetworkPatterns(entityGraph);
    const clusters = await this.identifyClusters(entityGraph);
    
    entityGraph.patterns = patterns;
    entityGraph.clusters = clusters;
    
    // Phase 5: Generate insights and analysis
    const keyInsights = await this.generateInsights(entityGraph);
    const anonymousPatterns = this.generateAnonymousPatterns(entityGraph);
    const recommendations = this.generateRecommendations(entityGraph, keyInsights);
    const summary = this.generateSummary(entityGraph);

    return {
      entityGraph,
      keyInsights,
      anonymousPatterns,
      recommendations,
      summary
    };
  }

  /**
   * Extract entities from documents with relationship context
   */
  private async extractEntities(documents: any[]): Promise<EntityNode[]> {
    const entities: Map<string, EntityNode> = new Map();
    
    for (const doc of documents) {
      const text = doc.text || doc.content || '';
      const docId = doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract organizations
      const orgPattern = /\b([A-Z][a-zA-Z\s]+(?:Ltd|Limited|PLC|Corporation|Inc|LLC))\b/g;
      let match;
      while ((match = orgPattern.exec(text)) !== null) {
        const entityName = match[1].trim();
        const entityId = this.generateEntityId(entityName);
        
        if (!entities.has(entityId)) {
          entities.set(entityId, {
            id: entityId,
            name: entityName,
            type: 'organization',
            attributes: { confidence: 0.9 },
            mentions: []
          });
        }
        
        const entity = entities.get(entityId)!;
        entity.mentions.push({
          documentId: docId,
          context: this.extractContext(text, match.index, match[0].length),
          position: match.index
        });
      }
      
      // Extract people (simplified pattern)
      const personPattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
      while ((match = personPattern.exec(text)) !== null) {
        const name = match[1].trim();
        if (this.isLikelyPersonName(name)) {
          const entityId = this.generateEntityId(name);
          
          if (!entities.has(entityId)) {
            entities.set(entityId, {
              id: entityId,
              name: name,
              type: 'person',
              attributes: { confidence: 0.85 },
              mentions: []
            });
          }
          
          const entity = entities.get(entityId)!;
          entity.mentions.push({
            documentId: docId,
            context: this.extractContext(text, match.index, match[0].length),
            position: match.index
          });
        }
      }
      
      // Extract financial amounts as entities
      const amountPattern = /£([\d,]+(?:\.\d{2})?)/g;
      while ((match = amountPattern.exec(text)) !== null) {
        const amount = match[0];
        const value = parseFloat(match[1].replace(/,/g, ''));
        
        if (value > 1000) { // Only significant amounts
          const entityId = this.generateEntityId(`amount_${value}`);
          
          if (!entities.has(entityId)) {
            entities.set(entityId, {
              id: entityId,
              name: amount,
              type: 'financial_instrument',
              attributes: { 
                value: value,
                confidence: 0.95 
              },
              mentions: []
            });
          }
          
          const entity = entities.get(entityId)!;
          entity.mentions.push({
            documentId: docId,
            context: this.extractContext(text, match.index, match[0].length),
            position: match.index
          });
        }
      }
    }
    
    return Array.from(entities.values());
  }

  /**
   * Discover relationships between entities
   */
  private async discoverRelationships(entities: EntityNode[], documents: any[]): Promise<RelationshipEdge[]> {
    const relationships: RelationshipEdge[] = [];
    
    for (const doc of documents) {
      const text = doc.text || doc.content || '';
      const docId = doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Financial relationships
      for (const { pattern, type } of this.relationshipPatterns.financial) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const relationship = await this.createFinancialRelationship(match, type, entities, docId, text);
          if (relationship) relationships.push(relationship);
        }
      }
      
      // Contractual relationships
      for (const { pattern, type } of this.relationshipPatterns.contractual) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const relationship = await this.createContractualRelationship(match, type, entities, docId, text);
          if (relationship) relationships.push(relationship);
        }
      }
      
      // Hierarchical relationships
      for (const { pattern, type } of this.relationshipPatterns.hierarchical) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const relationship = await this.createHierarchicalRelationship(match, type, entities, docId, text);
          if (relationship) relationships.push(relationship);
        }
      }
    }
    
    return relationships;
  }

  /**
   * Build graph structure from entities and relationships
   */
  private async buildGraph(entities: EntityNode[], relationships: RelationshipEdge[]): Promise<EntityGraph> {
    return {
      nodes: entities,
      edges: relationships,
      clusters: [],
      patterns: []
    };
  }

  /**
   * Detect network patterns in the graph
   */
  private async detectNetworkPatterns(graph: EntityGraph): Promise<NetworkPattern[]> {
    const patterns: NetworkPattern[] = [];
    
    // Detect circular financial flows
    const circularFlows = this.detectCircularFlows(graph);
    patterns.push(...circularFlows);
    
    // Detect hub-and-spoke patterns
    const hubPatterns = this.detectHubPatterns(graph);
    patterns.push(...hubPatterns);
    
    // Detect complex hierarchies
    const hierarchies = this.detectHierarchicalPatterns(graph);
    patterns.push(...hierarchies);
    
    return patterns;
  }

  /**
   * Identify entity clusters
   */
  private async identifyClusters(graph: EntityGraph): Promise<EntityCluster[]> {
    const clusters: EntityCluster[] = [];
    
    // Financial network clusters
    const financialClusters = this.identifyFinancialClusters(graph);
    clusters.push(...financialClusters);
    
    // Corporate structure clusters
    const corporateClusters = this.identifyCorporateClusters(graph);
    clusters.push(...corporateClusters);
    
    // Legal party clusters
    const legalClusters = this.identifyLegalPartyClusters(graph);
    clusters.push(...legalClusters);
    
    return clusters;
  }

  // Helper methods
  private generateEntityId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  private extractContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + length + 50);
    return `...${text.substring(start, end)}...`;
  }

  private isLikelyPersonName(name: string): boolean {
    // Simple heuristic - in production would use more sophisticated name recognition
    const commonTitles = ['Mr', 'Mrs', 'Ms', 'Dr', 'Professor', 'Sir', 'Dame', 'Lord', 'Lady'];
    const words = name.split(' ');
    return words.length >= 2 && words.length <= 4 && !name.includes('Ltd') && !name.includes('Limited');
  }

  private async createFinancialRelationship(
    match: RegExpExecArray, 
    type: string, 
    entities: EntityNode[], 
    docId: string, 
    text: string
  ): Promise<RelationshipEdge | null> {
    // Mock implementation - would create actual financial relationships
    const relationshipId = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: relationshipId,
      sourceId: 'mock_source',
      targetId: 'mock_target',
      type: 'financial_transfer',
      strength: 0.8,
      confidence: 0.85,
      evidence: [{
        documentId: docId,
        context: this.extractContext(text, match.index, match[0].length),
        statement: match[0]
      }],
      attributes: {
        direction: 'source_to_target'
      }
    };
  }

  private async createContractualRelationship(
    match: RegExpExecArray, 
    type: string, 
    entities: EntityNode[], 
    docId: string, 
    text: string
  ): Promise<RelationshipEdge | null> {
    // Mock implementation
    return null;
  }

  private async createHierarchicalRelationship(
    match: RegExpExecArray, 
    type: string, 
    entities: EntityNode[], 
    docId: string, 
    text: string
  ): Promise<RelationshipEdge | null> {
    // Mock implementation
    return null;
  }

  private detectCircularFlows(graph: EntityGraph): NetworkPattern[] {
    // Mock implementation - would detect actual circular patterns
    if (graph.edges.length > 5) {
      return [{
        id: `pattern_circular_${Date.now()}`,
        type: 'circular_flow',
        description: 'Circular financial flow detected involving multiple entities',
        nodes: graph.nodes.slice(0, 3).map(n => n.id),
        edges: graph.edges.slice(0, 3).map(e => e.id),
        riskLevel: 'high',
        legalImplications: [
          'Potential money laundering indicators',
          'Complex financial structure requiring investigation',
          'May indicate attempts to obscure true beneficial ownership'
        ],
        anonymousPattern: 'Circular financial flow pattern with intermediary entities',
        confidence: 0.75
      }];
    }
    return [];
  }

  private detectHubPatterns(graph: EntityGraph): NetworkPattern[] {
    // Mock implementation
    return [];
  }

  private detectHierarchicalPatterns(graph: EntityGraph): NetworkPattern[] {
    // Mock implementation
    return [];
  }

  private identifyFinancialClusters(graph: EntityGraph): EntityCluster[] {
    // Mock implementation
    return [];
  }

  private identifyCorporateClusters(graph: EntityGraph): EntityCluster[] {
    // Mock implementation
    return [];
  }

  private identifyLegalPartyClusters(graph: EntityGraph): EntityCluster[] {
    // Mock implementation
    return [];
  }

  private async generateInsights(graph: EntityGraph): Promise<RelationshipAnalysisResult['keyInsights']> {
    return {
      criticalRelationships: graph.edges.filter(e => e.strength > 0.8),
      suspiciousPatterns: graph.patterns.filter(p => p.riskLevel === 'high'),
      centralEntities: this.findCentralEntities(graph),
      isolatedEntities: this.findIsolatedEntities(graph)
    };
  }

  private findCentralEntities(graph: EntityGraph): EntityNode[] {
    // Find nodes with highest connection count
    const connectionCounts = new Map<string, number>();
    
    graph.edges.forEach(edge => {
      connectionCounts.set(edge.sourceId, (connectionCounts.get(edge.sourceId) || 0) + 1);
      connectionCounts.set(edge.targetId, (connectionCounts.get(edge.targetId) || 0) + 1);
    });
    
    const centralNodeIds = Array.from(connectionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nodeId]) => nodeId);
    
    return graph.nodes.filter(node => centralNodeIds.includes(node.id));
  }

  private findIsolatedEntities(graph: EntityGraph): EntityNode[] {
    const connectedNodeIds = new Set<string>();
    
    graph.edges.forEach(edge => {
      connectedNodeIds.add(edge.sourceId);
      connectedNodeIds.add(edge.targetId);
    });
    
    return graph.nodes.filter(node => !connectedNodeIds.has(node.id));
  }

  private generateAnonymousPatterns(graph: EntityGraph): string[] {
    const patterns: string[] = [];
    
    if (graph.nodes.length > 10) {
      patterns.push('Complex entity network with multiple organizational relationships');
    }
    
    if (graph.edges.some(e => e.type === 'financial_transfer')) {
      patterns.push('Financial transfer patterns between multiple entities');
    }
    
    if (graph.patterns.some(p => p.type === 'circular_flow')) {
      patterns.push('Circular relationship patterns requiring investigation');
    }
    
    patterns.push(...graph.patterns.map(p => p.anonymousPattern));
    
    return patterns;
  }

  private generateRecommendations(graph: EntityGraph, insights: any): string[] {
    const recommendations: string[] = [];
    
    if (insights.centralEntities.length > 0) {
      recommendations.push('Focus investigation on central entities with high connectivity');
    }
    
    if (insights.suspiciousPatterns.length > 0) {
      recommendations.push('High-risk patterns detected - consider forensic analysis');
    }
    
    if (graph.edges.length > 20) {
      recommendations.push('Complex relationship network - consider visualization tools');
    }
    
    return recommendations;
  }

  private generateSummary(graph: EntityGraph): RelationshipAnalysisResult['summary'] {
    return {
      totalEntities: graph.nodes.length,
      totalRelationships: graph.edges.length,
      networkComplexity: Math.min(1.0, (graph.edges.length / graph.nodes.length) * 0.1),
      riskScore: graph.patterns.filter(p => p.riskLevel === 'high').length * 0.2
    };
  }
}

export default LocalRelationshipMapper;