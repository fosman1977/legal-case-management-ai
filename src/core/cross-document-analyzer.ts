/**
 * CROSS-DOCUMENT ANALYSIS ENGINE
 * Legal intelligence through multi-document relationship analysis
 * 
 * Status: Phase 1, Week 4 - Cross-Document Analysis
 * Purpose: Extract legal intelligence from document collections
 * Critical for: Understanding case relationships, entity resolution, timeline construction
 */

import { EventEmitter } from 'events';

// ============================================================================
// LEGAL ENTITY RESOLUTION
// ============================================================================

export interface LegalEntity {
  id: string;
  type: 'person' | 'organization' | 'court' | 'case' | 'statute' | 'location';
  canonicalName: string;          // Primary name for this entity
  variations: Set<string>;         // All name variations found
  aliases: Set<string>;            // Known aliases
  roles: Set<LegalRole>;          // Legal roles (plaintiff, defendant, judge, etc.)
  mentions: EntityMention[];      // All document mentions
  confidence: number;              // Overall confidence score
  attributes: EntityAttributes;    // Additional attributes
  relationships: EntityRelationship[]; // Relationships to other entities
}

export interface EntityMention {
  documentId: string;
  documentName: string;
  page: number;
  position: { start: number; end: number };
  context: string;                // Surrounding text
  mentionText: string;            // Exact text of mention
  confidence: number;
  extractedAt: Date;
}

export interface EntityAttributes {
  // Person attributes
  title?: string;                 // Mr., Dr., Judge, etc.
  profession?: string;            // Lawyer, Doctor, etc.
  barNumber?: string;             // Bar registration for lawyers
  
  // Organization attributes
  organizationType?: 'law_firm' | 'corporation' | 'government' | 'court' | 'other';
  jurisdiction?: string;
  registrationNumber?: string;
  
  // Common attributes
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface EntityRelationship {
  fromEntity: string;             // Entity ID
  toEntity: string;               // Entity ID
  relationshipType: RelationshipType;
  confidence: number;
  evidence: RelationshipEvidence[];
  timeline?: { start?: Date; end?: Date };
}

export interface RelationshipEvidence {
  documentId: string;
  page: number;
  text: string;
  extractedAt: Date;
}

export enum LegalRole {
  PLAINTIFF = 'plaintiff',
  DEFENDANT = 'defendant',
  JUDGE = 'judge',
  ATTORNEY_PLAINTIFF = 'attorney_plaintiff',
  ATTORNEY_DEFENDANT = 'attorney_defendant',
  WITNESS = 'witness',
  EXPERT = 'expert',
  APPELLANT = 'appellant',
  APPELLEE = 'appellee',
  PETITIONER = 'petitioner',
  RESPONDENT = 'respondent',
  THIRD_PARTY = 'third_party'
}

export enum RelationshipType {
  REPRESENTS = 'represents',           // Attorney represents client
  OPPOSES = 'opposes',                // Opposing parties
  EMPLOYS = 'employs',                // Employment relationship
  AFFILIATED_WITH = 'affiliated_with', // Business affiliation
  RELATED_TO = 'related_to',          // Family relation
  PRESIDES_OVER = 'presides_over',    // Judge presides over case
  TESTIFIES_FOR = 'testifies_for',    // Witness testifies for party
  CONTRACTS_WITH = 'contracts_with',   // Contractual relationship
  SUES = 'sues',                      // Litigation relationship
  REFERENCES = 'references'            // Document references
}

// ============================================================================
// DOCUMENT RELATIONSHIPS
// ============================================================================

export interface DocumentRelationship {
  sourceDocId: string;
  targetDocId: string;
  relationshipType: DocumentRelationType;
  confidence: number;
  evidence: DocumentRelationshipEvidence[];
  metadata: DocumentRelationshipMetadata;
}

export interface DocumentRelationshipEvidence {
  sourceLocation: { page: number; text: string };
  targetMatch: { page?: number; text?: string };
  extractedAt: Date;
}

export interface DocumentRelationshipMetadata {
  isLegalCitation?: boolean;
  citationFormat?: string;         // Bluebook, etc.
  temporalOrder?: 'before' | 'after' | 'concurrent';
  importance: 'critical' | 'important' | 'reference';
}

export enum DocumentRelationType {
  CITES = 'cites',                // Legal citation
  AMENDS = 'amends',              // Amends previous document
  SUPERSEDES = 'supersedes',      // Replaces previous document
  RESPONDS_TO = 'responds_to',    // Response to another document
  EXHIBITS = 'exhibits',          // Document is exhibit to another
  INCORPORATES = 'incorporates',  // Incorporates by reference
  CONTRADICTS = 'contradicts',    // Contains contradictory information
  SUPPORTS = 'supports',          // Supports claims in another document
  REFERENCES = 'references'       // General reference
}

// ============================================================================
// KNOWLEDGE GRAPH
// ============================================================================

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  metadata: GraphMetadata;
  statistics: GraphStatistics;
}

export interface KnowledgeNode {
  id: string;
  type: 'entity' | 'document' | 'event' | 'claim' | 'evidence';
  label: string;
  data: any;
  importance: number;              // 0-1 importance score
  centralityScore: number;         // Graph centrality
  cluster?: string;                // Cluster/community ID
}

export interface KnowledgeEdge {
  id: string;
  source: string;                  // Node ID
  target: string;                  // Node ID
  type: string;                    // Relationship type
  weight: number;                  // Relationship strength
  directed: boolean;
  temporal?: { date?: Date; order?: number };
  data: any;
}

export interface GraphMetadata {
  createdAt: Date;
  documentsAnalyzed: number;
  entitiesResolved: number;
  relationshipsFound: number;
  analysisVersion: string;
}

export interface GraphStatistics {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  density: number;
  components: number;
  centralNodes: string[];          // Most important nodes
}

// ============================================================================
// LEGAL TIMELINE
// ============================================================================

export interface LegalTimeline {
  events: LegalEvent[];
  periods: LegalPeriod[];
  criticalDates: CriticalDate[];
  metadata: TimelineMetadata;
}

export interface LegalEvent {
  id: string;
  date: Date;
  type: LegalEventType;
  title: string;
  description: string;
  participants: string[];          // Entity IDs
  documents: string[];             // Document IDs
  location?: string;
  significance: 'critical' | 'important' | 'contextual';
  confidence: number;
  evidence: EventEvidence[];
}

export interface EventEvidence {
  documentId: string;
  page: number;
  text: string;
  confidence: number;
}

export interface LegalPeriod {
  id: string;
  startDate: Date;
  endDate?: Date;
  type: 'statute_of_limitations' | 'discovery' | 'employment' | 'contract' | 'damages' | 'other';
  description: string;
  relatedEntities: string[];
  relatedEvents: string[];
}

export interface CriticalDate {
  date: Date;
  type: 'deadline' | 'statute_of_limitations' | 'filing' | 'hearing' | 'trial';
  description: string;
  passed: boolean;
  daysRemaining?: number;
  consequences?: string;
  documentReferences: string[];
}

export interface TimelineMetadata {
  earliestDate: Date;
  latestDate: Date;
  totalEvents: number;
  gaps: TimelineGap[];
  completeness: number;            // 0-1 score
}

export interface TimelineGap {
  startDate: Date;
  endDate: Date;
  duration: number;                // Days
  significance?: string;
}

export enum LegalEventType {
  FILING = 'filing',
  HEARING = 'hearing',
  DEPOSITION = 'deposition',
  MOTION = 'motion',
  ORDER = 'order',
  JUDGMENT = 'judgment',
  SETTLEMENT = 'settlement',
  CONTRACT_SIGNED = 'contract_signed',
  CONTRACT_BREACH = 'contract_breach',
  INCIDENT = 'incident',
  CORRESPONDENCE = 'correspondence',
  MEETING = 'meeting',
  PAYMENT = 'payment',
  NOTICE = 'notice'
}

// ============================================================================
// CROSS-DOCUMENT ANALYZER
// ============================================================================

export interface CrossDocumentAnalysis {
  id: string;
  caseId: string;
  timestamp: Date;
  documentsAnalyzed: number;
  entities: Map<string, LegalEntity>;
  documentRelationships: DocumentRelationship[];
  knowledgeGraph: KnowledgeGraph;
  timeline: LegalTimeline;
  insights: LegalInsight[];
  statistics: AnalysisStatistics;
}

export interface LegalInsight {
  type: InsightType;
  title: string;
  description: string;
  importance: 'critical' | 'important' | 'informational';
  entities: string[];              // Related entity IDs
  documents: string[];             // Related document IDs
  confidence: number;
  actionable: boolean;
  recommendations?: string[];
}

export enum InsightType {
  CONTRADICTION = 'contradiction',
  MISSING_EVIDENCE = 'missing_evidence',
  PATTERN = 'pattern',
  ANOMALY = 'anomaly',
  RELATIONSHIP = 'relationship',
  TIMELINE_GAP = 'timeline_gap',
  RISK = 'risk',
  OPPORTUNITY = 'opportunity'
}

export interface AnalysisStatistics {
  processingTime: number;
  entitiesFound: number;
  uniqueEntities: number;
  relationshipsFound: number;
  eventsExtracted: number;
  contradictionsFound: number;
  insightsGenerated: number;
  confidence: number;
}

export class CrossDocumentAnalyzer extends EventEmitter {
  private entities: Map<string, LegalEntity> = new Map();
  private documentRelationships: DocumentRelationship[] = [];
  private knowledgeGraph: KnowledgeGraph | null = null;
  private timeline: LegalTimeline | null = null;
  private insights: LegalInsight[] = [];
  
  // Entity resolution thresholds
  private readonly NAME_SIMILARITY_THRESHOLD = 0.85;
  private readonly CONTEXT_SIMILARITY_THRESHOLD = 0.7;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.6;

  constructor() {
    super();
    console.log('🔗 Cross-Document Analyzer initialized');
  }

  /**
   * Analyze a collection of documents for cross-document intelligence
   */
  async analyzeDocumentCollection(
    documents: ProcessedDocument[],
    options: AnalysisOptions = {}
  ): Promise<CrossDocumentAnalysis> {
    const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    console.log(`🧠 Starting cross-document analysis of ${documents.length} documents...`);
    
    try {
      // Phase 1: Entity Extraction and Resolution
      console.log('Phase 1: Entity Resolution...');
      await this.performEntityResolution(documents);
      
      // Phase 2: Document Relationship Analysis
      console.log('Phase 2: Document Relationships...');
      await this.analyzeDocumentRelationships(documents);
      
      // Phase 3: Knowledge Graph Construction
      console.log('Phase 3: Knowledge Graph Construction...');
      this.knowledgeGraph = await this.buildKnowledgeGraph();
      
      // Phase 4: Timeline Construction
      console.log('Phase 4: Timeline Construction...');
      this.timeline = await this.constructTimeline(documents);
      
      // Phase 5: Insight Generation
      console.log('Phase 5: Generating Legal Insights...');
      this.insights = await this.generateInsights();
      
      // Calculate statistics
      const statistics: AnalysisStatistics = {
        processingTime: Date.now() - startTime,
        entitiesFound: this.entities.size,
        uniqueEntities: this.countUniqueEntities(),
        relationshipsFound: this.documentRelationships.length,
        eventsExtracted: this.timeline?.events.length || 0,
        contradictionsFound: this.insights.filter(i => i.type === InsightType.CONTRADICTION).length,
        insightsGenerated: this.insights.length,
        confidence: this.calculateOverallConfidence()
      };
      
      const analysis: CrossDocumentAnalysis = {
        id: analysisId,
        caseId: options.caseId || 'unknown',
        timestamp: new Date(),
        documentsAnalyzed: documents.length,
        entities: this.entities,
        documentRelationships: this.documentRelationships,
        knowledgeGraph: this.knowledgeGraph,
        timeline: this.timeline,
        insights: this.insights,
        statistics
      };
      
      console.log(`✅ Cross-document analysis complete in ${statistics.processingTime}ms`);
      console.log(`   Found ${statistics.uniqueEntities} unique entities`);
      console.log(`   Discovered ${statistics.relationshipsFound} document relationships`);
      console.log(`   Extracted ${statistics.eventsExtracted} timeline events`);
      console.log(`   Generated ${statistics.insightsGenerated} legal insights`);
      
      this.emit('analysisComplete', analysis);
      return analysis;
      
    } catch (error) {
      console.error('❌ Cross-document analysis failed:', error);
      throw error;
    }
  }

  /**
   * PHASE 1: Entity Resolution
   * Identify and resolve entities across all documents
   */
  private async performEntityResolution(documents: ProcessedDocument[]): Promise<void> {
    const allMentions: EntityMention[] = [];
    
    // Extract all entity mentions from documents
    for (const doc of documents) {
      const mentions = this.extractEntityMentions(doc);
      allMentions.push(...mentions);
    }
    
    // Cluster similar mentions into entities
    const clusters = this.clusterEntityMentions(allMentions);
    
    // Create resolved entities
    for (const cluster of clusters) {
      const entity = this.createResolvedEntity(cluster);
      this.entities.set(entity.id, entity);
      
      // Extract entity relationships
      entity.relationships = this.extractEntityRelationships(entity, cluster);
    }
    
    // Resolve coreferences and merge entities
    await this.resolveCoreferences();
    
    console.log(`   ✓ Resolved ${this.entities.size} unique entities from ${allMentions.length} mentions`);
  }

  /**
   * Extract entity mentions from a document
   */
  private extractEntityMentions(doc: ProcessedDocument): EntityMention[] {
    const mentions: EntityMention[] = [];
    
    // Simulate entity extraction (in production, use NLP)
    const simulatedEntities = [
      { text: 'John Smith', type: 'person', page: 1 },
      { text: 'Acme Corporation', type: 'organization', page: 2 },
      { text: 'Judge Brown', type: 'person', page: 3 }
    ];
    
    for (const entity of simulatedEntities) {
      mentions.push({
        documentId: doc.id,
        documentName: doc.name,
        page: entity.page,
        position: { start: 0, end: entity.text.length },
        context: `...${entity.text}...`,
        mentionText: entity.text,
        confidence: 0.9,
        extractedAt: new Date()
      });
    }
    
    return mentions;
  }

  /**
   * Cluster similar entity mentions
   */
  private clusterEntityMentions(mentions: EntityMention[]): EntityMention[][] {
    const clusters: EntityMention[][] = [];
    const processed = new Set<number>();
    
    for (let i = 0; i < mentions.length; i++) {
      if (processed.has(i)) continue;
      
      const cluster: EntityMention[] = [mentions[i]];
      processed.add(i);
      
      // Find similar mentions
      for (let j = i + 1; j < mentions.length; j++) {
        if (processed.has(j)) continue;
        
        const similarity = this.calculateMentionSimilarity(mentions[i], mentions[j]);
        if (similarity >= this.NAME_SIMILARITY_THRESHOLD) {
          cluster.push(mentions[j]);
          processed.add(j);
        }
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  }

  /**
   * Calculate similarity between two entity mentions
   */
  private calculateMentionSimilarity(m1: EntityMention, m2: EntityMention): number {
    // Name similarity (simplified - in production use advanced NLP)
    const name1 = m1.mentionText.toLowerCase();
    const name2 = m2.mentionText.toLowerCase();
    
    if (name1 === name2) return 1.0;
    
    // Check for partial matches
    if (name1.includes(name2) || name2.includes(name1)) return 0.9;
    
    // Check for last name matches (for persons)
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    if (words1[words1.length - 1] === words2[words2.length - 1]) return 0.8;
    
    // Check context similarity
    const contextSim = this.calculateContextSimilarity(m1.context, m2.context);
    
    return contextSim * 0.7;
  }

  /**
   * Calculate context similarity
   */
  private calculateContextSimilarity(c1: string, c2: string): number {
    // Simplified context similarity (in production use embeddings)
    const words1 = new Set(c1.toLowerCase().split(' '));
    const words2 = new Set(c2.toLowerCase().split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Create a resolved entity from a cluster of mentions
   */
  private createResolvedEntity(cluster: EntityMention[]): LegalEntity {
    // Determine canonical name (most frequent or longest)
    const nameFreq = new Map<string, number>();
    cluster.forEach(m => {
      nameFreq.set(m.mentionText, (nameFreq.get(m.mentionText) || 0) + 1);
    });
    
    const canonicalName = Array.from(nameFreq.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // Collect all variations
    const variations = new Set(cluster.map(m => m.mentionText));
    
    // Determine entity type (simplified)
    let type: LegalEntity['type'] = 'person';
    if (canonicalName.includes('Corp') || canonicalName.includes('LLC')) {
      type = 'organization';
    } else if (canonicalName.includes('Court')) {
      type = 'court';
    }
    
    // Determine roles
    const roles = new Set<LegalRole>();
    if (canonicalName.includes('Judge')) roles.add(LegalRole.JUDGE);
    if (cluster.some(m => m.context.includes('Plaintiff'))) roles.add(LegalRole.PLAINTIFF);
    if (cluster.some(m => m.context.includes('Defendant'))) roles.add(LegalRole.DEFENDANT);
    
    return {
      id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      canonicalName,
      variations,
      aliases: new Set(),
      roles,
      mentions: cluster,
      confidence: this.calculateEntityConfidence(cluster),
      attributes: this.extractEntityAttributes(cluster),
      relationships: []
    };
  }

  /**
   * Calculate entity confidence
   */
  private calculateEntityConfidence(cluster: EntityMention[]): number {
    const avgMentionConfidence = cluster.reduce((sum, m) => sum + m.confidence, 0) / cluster.length;
    const consistencyBonus = Math.min(cluster.length * 0.05, 0.2); // More mentions = higher confidence
    return Math.min(avgMentionConfidence + consistencyBonus, 1.0);
  }

  /**
   * Extract entity attributes
   */
  private extractEntityAttributes(cluster: EntityMention[]): EntityAttributes {
    // Simplified attribute extraction
    const attributes: EntityAttributes = {};
    
    // Extract from context (in production, use NLP)
    for (const mention of cluster) {
      if (mention.context.includes('Attorney')) {
        attributes.profession = 'Attorney';
      }
      if (mention.context.includes('law firm')) {
        attributes.organizationType = 'law_firm';
      }
    }
    
    return attributes;
  }

  /**
   * Extract relationships between entities
   */
  private extractEntityRelationships(entity: LegalEntity, cluster: EntityMention[]): EntityRelationship[] {
    const relationships: EntityRelationship[] = [];
    
    // Look for relationship patterns in context
    for (const mention of cluster) {
      // Check for "represents" relationship
      if (mention.context.includes('represents')) {
        // Find the other entity in context
        for (const [otherId, otherEntity] of this.entities) {
          if (otherId !== entity.id && mention.context.includes(otherEntity.canonicalName)) {
            relationships.push({
              fromEntity: entity.id,
              toEntity: otherId,
              relationshipType: RelationshipType.REPRESENTS,
              confidence: 0.8,
              evidence: [{
                documentId: mention.documentId,
                page: mention.page,
                text: mention.context,
                extractedAt: new Date()
              }]
            });
          }
        }
      }
    }
    
    return relationships;
  }

  /**
   * Resolve coreferences and merge entities
   */
  private async resolveCoreferences(): Promise<void> {
    const entitiesToMerge: [string, string][] = [];
    
    // Find entities that should be merged
    const entityArray = Array.from(this.entities.values());
    for (let i = 0; i < entityArray.length; i++) {
      for (let j = i + 1; j < entityArray.length; j++) {
        if (this.shouldMergeEntities(entityArray[i], entityArray[j])) {
          entitiesToMerge.push([entityArray[i].id, entityArray[j].id]);
        }
      }
    }
    
    // Merge entities
    for (const [id1, id2] of entitiesToMerge) {
      this.mergeEntities(id1, id2);
    }
  }

  /**
   * Check if two entities should be merged
   */
  private shouldMergeEntities(e1: LegalEntity, e2: LegalEntity): boolean {
    // Same type check
    if (e1.type !== e2.type) return false;
    
    // Name similarity check
    const nameSim = this.calculateNameSimilarity(e1.canonicalName, e2.canonicalName);
    if (nameSim >= 0.9) return true;
    
    // Check for overlapping variations
    const overlap = new Set([...e1.variations].filter(x => e2.variations.has(x)));
    if (overlap.size > 0) return true;
    
    // Check for same attributes
    if (e1.attributes.barNumber && e1.attributes.barNumber === e2.attributes.barNumber) return true;
    
    return false;
  }

  /**
   * Calculate name similarity
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    // Simplified similarity (in production use Levenshtein distance or similar)
    const n1 = name1.toLowerCase();
    const n2 = name2.toLowerCase();
    
    if (n1 === n2) return 1.0;
    if (n1.includes(n2) || n2.includes(n1)) return 0.9;
    
    return 0.0;
  }

  /**
   * Merge two entities
   */
  private mergeEntities(id1: string, id2: string): void {
    const entity1 = this.entities.get(id1);
    const entity2 = this.entities.get(id2);
    
    if (!entity1 || !entity2) return;
    
    // Merge into entity1
    entity2.variations.forEach(v => entity1.variations.add(v));
    entity2.aliases.forEach(a => entity1.aliases.add(a));
    entity2.roles.forEach(r => entity1.roles.add(r));
    entity1.mentions.push(...entity2.mentions);
    entity1.relationships.push(...entity2.relationships);
    
    // Update confidence
    entity1.confidence = Math.max(entity1.confidence, entity2.confidence);
    
    // Remove entity2
    this.entities.delete(id2);
  }

  /**
   * PHASE 2: Document Relationship Analysis
   */
  private async analyzeDocumentRelationships(documents: ProcessedDocument[]): Promise<void> {
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const relationships = this.findDocumentRelationships(documents[i], documents[j]);
        this.documentRelationships.push(...relationships);
      }
    }
    
    console.log(`   ✓ Found ${this.documentRelationships.length} document relationships`);
  }

  /**
   * Find relationships between two documents
   */
  private findDocumentRelationships(doc1: ProcessedDocument, doc2: ProcessedDocument): DocumentRelationship[] {
    const relationships: DocumentRelationship[] = [];
    
    // Check for citations
    if (this.documentCites(doc1, doc2)) {
      relationships.push({
        sourceDocId: doc1.id,
        targetDocId: doc2.id,
        relationshipType: DocumentRelationType.CITES,
        confidence: 0.9,
        evidence: [{
          sourceLocation: { page: 1, text: `See ${doc2.name}` },
          targetMatch: { page: 1, text: doc2.name },
          extractedAt: new Date()
        }],
        metadata: {
          isLegalCitation: true,
          importance: 'important'
        }
      });
    }
    
    // Check for amendments
    if (doc1.name.includes('Amendment') && doc1.name.includes(doc2.name)) {
      relationships.push({
        sourceDocId: doc1.id,
        targetDocId: doc2.id,
        relationshipType: DocumentRelationType.AMENDS,
        confidence: 0.85,
        evidence: [],
        metadata: {
          temporalOrder: 'after',
          importance: 'critical'
        }
      });
    }
    
    return relationships;
  }

  /**
   * Check if doc1 cites doc2
   */
  private documentCites(doc1: ProcessedDocument, doc2: ProcessedDocument): boolean {
    // Simplified citation detection
    return Math.random() > 0.7; // 30% chance of citation
  }

  /**
   * PHASE 3: Knowledge Graph Construction
   */
  private async buildKnowledgeGraph(): Promise<KnowledgeGraph> {
    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];
    
    // Add entity nodes
    for (const [id, entity] of this.entities) {
      nodes.push({
        id,
        type: 'entity',
        label: entity.canonicalName,
        data: entity,
        importance: this.calculateEntityImportance(entity),
        centralityScore: 0 // Will be calculated later
      });
      
      // Add entity relationships as edges
      for (const rel of entity.relationships) {
        edges.push({
          id: `edge-${edges.length}`,
          source: rel.fromEntity,
          target: rel.toEntity,
          type: rel.relationshipType,
          weight: rel.confidence,
          directed: true,
          data: rel
        });
      }
    }
    
    // Add document relationship edges
    for (const docRel of this.documentRelationships) {
      edges.push({
        id: `edge-${edges.length}`,
        source: docRel.sourceDocId,
        target: docRel.targetDocId,
        type: docRel.relationshipType,
        weight: docRel.confidence,
        directed: true,
        data: docRel
      });
    }
    
    // Calculate centrality scores
    this.calculateCentralityScores(nodes, edges);
    
    const graph: KnowledgeGraph = {
      nodes,
      edges,
      metadata: {
        createdAt: new Date(),
        documentsAnalyzed: this.documentRelationships.length,
        entitiesResolved: this.entities.size,
        relationshipsFound: edges.length,
        analysisVersion: '1.0.0'
      },
      statistics: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        avgDegree: edges.length / nodes.length,
        density: (2 * edges.length) / (nodes.length * (nodes.length - 1)),
        components: 1, // Simplified
        centralNodes: nodes
          .sort((a, b) => b.centralityScore - a.centralityScore)
          .slice(0, 5)
          .map(n => n.id)
      }
    };
    
    console.log(`   ✓ Built knowledge graph with ${nodes.length} nodes and ${edges.length} edges`);
    return graph;
  }

  /**
   * Calculate entity importance
   */
  private calculateEntityImportance(entity: LegalEntity): number {
    let importance = 0.5; // Base importance
    
    // More mentions = more important
    importance += Math.min(entity.mentions.length * 0.05, 0.3);
    
    // Critical roles are more important
    if (entity.roles.has(LegalRole.PLAINTIFF)) importance += 0.2;
    if (entity.roles.has(LegalRole.DEFENDANT)) importance += 0.2;
    if (entity.roles.has(LegalRole.JUDGE)) importance += 0.15;
    
    // More relationships = more important
    importance += Math.min(entity.relationships.length * 0.05, 0.2);
    
    return Math.min(importance, 1.0);
  }

  /**
   * Calculate centrality scores for nodes
   */
  private calculateCentralityScores(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): void {
    // Simple degree centrality
    for (const node of nodes) {
      const degree = edges.filter(e => e.source === node.id || e.target === node.id).length;
      node.centralityScore = degree / (nodes.length - 1);
    }
  }

  /**
   * PHASE 4: Timeline Construction
   */
  private async constructTimeline(documents: ProcessedDocument[]): Promise<LegalTimeline> {
    const events: LegalEvent[] = [];
    
    // Extract events from documents
    for (const doc of documents) {
      const docEvents = this.extractEvents(doc);
      events.push(...docEvents);
    }
    
    // Sort events chronologically
    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Identify periods and critical dates
    const periods = this.identifyLegalPeriods(events);
    const criticalDates = this.identifyCriticalDates(events);
    
    // Identify timeline gaps
    const gaps = this.identifyTimelineGaps(events);
    
    const timeline: LegalTimeline = {
      events,
      periods,
      criticalDates,
      metadata: {
        earliestDate: events[0]?.date || new Date(),
        latestDate: events[events.length - 1]?.date || new Date(),
        totalEvents: events.length,
        gaps,
        completeness: this.calculateTimelineCompleteness(events, gaps)
      }
    };
    
    console.log(`   ✓ Constructed timeline with ${events.length} events`);
    return timeline;
  }

  /**
   * Extract events from a document
   */
  private extractEvents(doc: ProcessedDocument): LegalEvent[] {
    const events: LegalEvent[] = [];
    
    // Simulate event extraction
    const simulatedEvents = [
      { date: new Date('2023-01-15'), type: LegalEventType.FILING, title: 'Initial Complaint Filed' },
      { date: new Date('2023-03-20'), type: LegalEventType.MOTION, title: 'Motion to Dismiss' },
      { date: new Date('2023-06-10'), type: LegalEventType.HEARING, title: 'Preliminary Hearing' }
    ];
    
    for (const event of simulatedEvents) {
      events.push({
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: event.date,
        type: event.type,
        title: event.title,
        description: `${event.title} in ${doc.name}`,
        participants: [],
        documents: [doc.id],
        significance: 'important',
        confidence: 0.85,
        evidence: [{
          documentId: doc.id,
          page: 1,
          text: event.title,
          confidence: 0.85
        }]
      });
    }
    
    return events;
  }

  /**
   * Identify legal periods
   */
  private identifyLegalPeriods(events: LegalEvent[]): LegalPeriod[] {
    const periods: LegalPeriod[] = [];
    
    // Identify discovery period
    const discoveryStart = events.find(e => e.type === LegalEventType.FILING);
    const trialStart = events.find(e => e.type === LegalEventType.HEARING);
    
    if (discoveryStart && trialStart) {
      periods.push({
        id: `period-discovery`,
        startDate: discoveryStart.date,
        endDate: trialStart.date,
        type: 'discovery',
        description: 'Discovery Period',
        relatedEntities: [],
        relatedEvents: [discoveryStart.id, trialStart.id]
      });
    }
    
    return periods;
  }

  /**
   * Identify critical dates
   */
  private identifyCriticalDates(events: LegalEvent[]): CriticalDate[] {
    const criticalDates: CriticalDate[] = [];
    const now = new Date();
    
    for (const event of events) {
      if (event.significance === 'critical') {
        const date = event.date;
        const passed = date < now;
        const daysRemaining = passed ? 0 : Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        criticalDates.push({
          date,
          type: 'deadline',
          description: event.title,
          passed,
          daysRemaining,
          documentReferences: event.documents
        });
      }
    }
    
    return criticalDates;
  }

  /**
   * Identify timeline gaps
   */
  private identifyTimelineGaps(events: LegalEvent[]): TimelineGap[] {
    const gaps: TimelineGap[] = [];
    const GAP_THRESHOLD = 60; // 60 days
    
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];
      
      const daysBetween = Math.floor(
        (next.date.getTime() - current.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysBetween > GAP_THRESHOLD) {
        gaps.push({
          startDate: current.date,
          endDate: next.date,
          duration: daysBetween,
          significance: daysBetween > 180 ? 'Significant gap - missing information?' : undefined
        });
      }
    }
    
    return gaps;
  }

  /**
   * Calculate timeline completeness
   */
  private calculateTimelineCompleteness(events: LegalEvent[], gaps: TimelineGap[]): number {
    if (events.length === 0) return 0;
    
    // Factor in gaps
    const totalGapDays = gaps.reduce((sum, gap) => sum + gap.duration, 0);
    const totalTimelineDays = Math.floor(
      (events[events.length - 1].date.getTime() - events[0].date.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (totalTimelineDays === 0) return 1;
    
    const gapRatio = totalGapDays / totalTimelineDays;
    return Math.max(0, 1 - gapRatio);
  }

  /**
   * PHASE 5: Generate Legal Insights
   */
  private async generateInsights(): Promise<LegalInsight[]> {
    const insights: LegalInsight[] = [];
    
    // Check for contradictions
    insights.push(...this.findContradictions());
    
    // Check for missing evidence
    insights.push(...this.findMissingEvidence());
    
    // Identify patterns
    insights.push(...this.identifyPatterns());
    
    // Find timeline anomalies
    insights.push(...this.findTimelineAnomalies());
    
    console.log(`   ✓ Generated ${insights.length} legal insights`);
    return insights;
  }

  /**
   * Find contradictions across documents
   */
  private findContradictions(): LegalInsight[] {
    const insights: LegalInsight[] = [];
    
    // Check for conflicting entity roles
    for (const [id, entity] of this.entities) {
      if (entity.roles.has(LegalRole.PLAINTIFF) && entity.roles.has(LegalRole.DEFENDANT)) {
        insights.push({
          type: InsightType.CONTRADICTION,
          title: 'Conflicting Party Roles',
          description: `${entity.canonicalName} is identified as both plaintiff and defendant`,
          importance: 'critical',
          entities: [id],
          documents: entity.mentions.map(m => m.documentId),
          confidence: 0.9,
          actionable: true,
          recommendations: ['Review and clarify party roles', 'Check for multiple cases']
        });
      }
    }
    
    return insights;
  }

  /**
   * Find missing evidence
   */
  private findMissingEvidence(): LegalInsight[] {
    const insights: LegalInsight[] = [];
    
    // Check for events without supporting documents
    if (this.timeline) {
      for (const event of this.timeline.events) {
        if (event.evidence.length === 0) {
          insights.push({
            type: InsightType.MISSING_EVIDENCE,
            title: 'Event Lacks Documentation',
            description: `${event.title} has no supporting documentation`,
            importance: 'important',
            entities: event.participants,
            documents: event.documents,
            confidence: 0.8,
            actionable: true,
            recommendations: ['Locate supporting documents', 'Request discovery']
          });
        }
      }
    }
    
    return insights;
  }

  /**
   * Identify patterns
   */
  private identifyPatterns(): LegalInsight[] {
    const insights: LegalInsight[] = [];
    
    // Check for repeated behavior patterns
    // (Simplified - in production use ML pattern detection)
    
    return insights;
  }

  /**
   * Find timeline anomalies
   */
  private findTimelineAnomalies(): LegalInsight[] {
    const insights: LegalInsight[] = [];
    
    if (this.timeline) {
      // Check for significant gaps
      for (const gap of this.timeline.metadata.gaps) {
        if (gap.duration > 180) {
          insights.push({
            type: InsightType.TIMELINE_GAP,
            title: 'Significant Timeline Gap',
            description: `${gap.duration} day gap between ${gap.startDate.toLocaleDateString()} and ${gap.endDate.toLocaleDateString()}`,
            importance: 'important',
            entities: [],
            documents: [],
            confidence: 1.0,
            actionable: true,
            recommendations: ['Investigate gap period', 'Request additional discovery']
          });
        }
      }
    }
    
    return insights;
  }

  // Utility methods
  
  private countUniqueEntities(): number {
    return this.entities.size;
  }

  private calculateOverallConfidence(): number {
    if (this.entities.size === 0) return 0;
    
    const totalConfidence = Array.from(this.entities.values())
      .reduce((sum, entity) => sum + entity.confidence, 0);
    
    return totalConfidence / this.entities.size;
  }
}

// Supporting interfaces
interface ProcessedDocument {
  id: string;
  name: string;
  content?: string;
  metadata?: any;
  extractedEntities?: any[];
  extractedDates?: Date[];
}

interface AnalysisOptions {
  caseId?: string;
  enableInsights?: boolean;
  confidenceThreshold?: number;
}

// Export singleton instance
export const crossDocumentAnalyzer = new CrossDocumentAnalyzer();

console.log('🔗 Cross-Document Analyzer module loaded');