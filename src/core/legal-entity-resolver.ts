/**
 * LEGAL ENTITY RESOLUTION ENGINE
 * Specialized entity resolution for legal documents and cases
 * 
 * Status: Phase 1, Week 4 - Cross-Document Analysis
 * Purpose: Resolve legal entities with high accuracy across case documents
 * Critical for: Lawyer-grade entity recognition and relationship mapping
 */

import { EventEmitter } from 'events';

// ============================================================================
// LEGAL ENTITY PATTERNS & RULES
// ============================================================================

export interface LegalEntityPattern {
  pattern: RegExp;
  entityType: LegalEntityType;
  confidence: number;
  context?: string[];
  jurisdiction?: 'us' | 'uk' | 'universal';
}

export interface LegalNamePattern {
  pattern: RegExp;
  variations: string[];
  normalizer: (text: string) => string;
  confidence: number;
}

export enum LegalEntityType {
  // Persons
  PERSON = 'person',
  LAWYER = 'lawyer',
  JUDGE = 'judge',
  WITNESS = 'witness',
  EXPERT = 'expert',
  
  // Organizations
  LAW_FIRM = 'law_firm',
  CORPORATION = 'corporation',
  GOVERNMENT_AGENCY = 'government_agency',
  COURT = 'court',
  TRIBUNAL = 'tribunal',
  
  // Legal Constructs
  CASE = 'case',
  STATUTE = 'statute',
  REGULATION = 'regulation',
  CONTRACT = 'contract',
  
  // Locations
  JURISDICTION = 'jurisdiction',
  VENUE = 'venue',
  
  // Other
  MONETARY = 'monetary',
  DATE = 'date',
  DOCUMENT_REFERENCE = 'document_reference'
}

export interface LegalContext {
  documentType: 'pleading' | 'motion' | 'order' | 'contract' | 'correspondence' | 'discovery' | 'other';
  jurisdiction: string;
  practiceArea: string[];
  courtLevel: 'trial' | 'appellate' | 'supreme' | 'administrative' | 'other';
  confidence: number;
}

// ============================================================================
// ENTITY RESOLUTION RESULTS
// ============================================================================

export interface ResolvedLegalEntity {
  id: string;
  canonicalName: string;
  entityType: LegalEntityType;
  confidence: number;
  
  // Name variations
  aliases: Set<string>;
  abbreviations: Set<string>;
  nicknames: Set<string>;
  formalNames: Set<string>;
  
  // Legal attributes
  barNumber?: string;
  licenseNumber?: string;
  registrationNumber?: string;
  taxId?: string;
  
  // Professional details
  title?: string;
  firm?: string;
  jurisdiction?: string;
  practiceAreas?: string[];
  
  // Contact information
  address?: Address;
  phone?: string;
  email?: string;
  
  // Legal roles and relationships
  roles: Set<LegalRole>;
  relationships: EntityRelationship[];
  
  // Evidence and mentions
  mentions: EntityMention[];
  documentFrequency: Map<string, number>; // Document ID -> mention count
  
  // Validation
  validatedBy: ValidationSource[];
  lastValidated: Date;
  validationConfidence: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  formatted?: string;
}

export interface ValidationSource {
  source: 'bar_directory' | 'court_records' | 'sec_filings' | 'manual' | 'cross_reference';
  confidence: number;
  validatedAt: Date;
  details?: any;
}

export enum LegalRole {
  // Party roles
  PLAINTIFF = 'plaintiff',
  DEFENDANT = 'defendant',
  PETITIONER = 'petitioner',
  RESPONDENT = 'respondent',
  APPELLANT = 'appellant',
  APPELLEE = 'appellee',
  THIRD_PARTY = 'third_party',
  INTERVENOR = 'intervenor',
  
  // Legal profession roles
  ATTORNEY = 'attorney',
  COUNSEL = 'counsel',
  CO_COUNSEL = 'co_counsel',
  LOCAL_COUNSEL = 'local_counsel',
  PROSECUTOR = 'prosecutor',
  PUBLIC_DEFENDER = 'public_defender',
  
  // Court roles
  JUDGE = 'judge',
  MAGISTRATE = 'magistrate',
  CLERK = 'clerk',
  BAILIFF = 'bailiff',
  COURT_REPORTER = 'court_reporter',
  
  // Evidence roles
  WITNESS = 'witness',
  EXPERT_WITNESS = 'expert_witness',
  CHARACTER_WITNESS = 'character_witness',
  
  // Business roles
  CEO = 'ceo',
  OFFICER = 'officer',
  DIRECTOR = 'director',
  EMPLOYEE = 'employee',
  CONTRACTOR = 'contractor',
  
  // Other
  BENEFICIARY = 'beneficiary',
  TRUSTEE = 'trustee',
  GUARDIAN = 'guardian'
}

export interface EntityMention {
  documentId: string;
  documentName: string;
  page: number;
  paragraph?: number;
  sentence?: number;
  position: { start: number; end: number };
  text: string;
  normalizedText: string;
  context: string;
  contextType: 'signature' | 'header' | 'body' | 'footer' | 'caption' | 'service_list';
  role?: LegalRole;
  confidence: number;
  extractedAt: Date;
  extractionMethod: 'pattern' | 'nlp' | 'manual';
}

export interface EntityRelationship {
  fromEntity: string;
  toEntity: string;
  relationshipType: RelationshipType;
  confidence: number;
  temporal?: { start?: Date; end?: Date; ongoing?: boolean };
  evidence: RelationshipEvidence[];
  context: LegalContext;
}

export interface RelationshipEvidence {
  documentId: string;
  page: number;
  text: string;
  patternMatched?: string;
  confidence: number;
  extractedAt: Date;
}

export enum RelationshipType {
  // Professional relationships
  REPRESENTS = 'represents',
  EMPLOYED_BY = 'employed_by',
  PARTNERS_WITH = 'partners_with',
  ASSOCIATES_WITH = 'associates_with',
  
  // Legal relationships
  SUES = 'sues',
  DEFENDS_AGAINST = 'defends_against',
  SETTLES_WITH = 'settles_with',
  ARBITRATES_WITH = 'arbitrates_with',
  
  // Corporate relationships
  OWNS = 'owns',
  CONTROLS = 'controls',
  SUBSIDIARY_OF = 'subsidiary_of',
  PARENT_OF = 'parent_of',
  
  // Court relationships
  PRESIDES_OVER = 'presides_over',
  APPEARS_BEFORE = 'appears_before',
  
  // Evidence relationships
  TESTIFIES_FOR = 'testifies_for',
  TESTIFIES_AGAINST = 'testifies_against',
  
  // Document relationships
  SIGNS = 'signs',
  DRAFTS = 'drafts',
  REVIEWS = 'reviews',
  APPROVES = 'approves',
  
  // Personal relationships
  SPOUSE_OF = 'spouse_of',
  CHILD_OF = 'child_of',
  FAMILY_PARENT_OF = 'family_parent_of'
}

// ============================================================================
// RESOLUTION ENGINE
// ============================================================================

export class LegalEntityResolver extends EventEmitter {
  private entities: Map<string, ResolvedLegalEntity> = new Map();
  private entityPatterns: LegalEntityPattern[] = [];
  private namePatterns: LegalNamePattern[] = [];
  private entityClusters: Map<string, Set<string>> = new Map();
  private validationCache: Map<string, ValidationResult> = new Map();
  
  // Resolution thresholds
  private readonly NAME_SIMILARITY_THRESHOLD = 0.85;
  private readonly CONTEXT_SIMILARITY_THRESHOLD = 0.7;
  private readonly PROFESSIONAL_MATCH_THRESHOLD = 0.9;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.6;

  constructor() {
    super();
    this.initializeLegalPatterns();
    console.log('⚖️ Legal Entity Resolver initialized');
  }

  /**
   * Initialize legal entity patterns for US and UK legal systems
   */
  private initializeLegalPatterns(): void {
    // US Legal patterns
    this.entityPatterns.push(
      // Lawyers
      { pattern: /\b([A-Z][a-z]+ [A-Z][a-z]+),?\s+(Esq\.?|Attorney|Counsel)\b/g, entityType: LegalEntityType.LAWYER, confidence: 0.9, jurisdiction: 'us' },
      { pattern: /\b([A-Z][a-z]+ [A-Z][a-z]+),?\s+Bar No\.?\s*\d+/g, entityType: LegalEntityType.LAWYER, confidence: 0.95, jurisdiction: 'us' },
      
      // Judges
      { pattern: /(?:Judge|Justice|Hon\.?)\s+([A-Z][a-z]+ [A-Z][a-z]+)/g, entityType: LegalEntityType.JUDGE, confidence: 0.9 },
      { pattern: /([A-Z][a-z]+ [A-Z][a-z]+),?\s+J\.?$/gm, entityType: LegalEntityType.JUDGE, confidence: 0.8 },
      
      // Law firms
      { pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+(?:LLC|LLP|P\.?C\.?|Law Firm|& Associates)\b/g, entityType: LegalEntityType.LAW_FIRM, confidence: 0.85 },
      
      // Corporations
      { pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+(?:Inc\.?|Corp\.?|Corporation|Company|Co\.)\b/g, entityType: LegalEntityType.CORPORATION, confidence: 0.8 },
      
      // Courts
      { pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Court|District|Circuit|Supreme Court)\b/g, entityType: LegalEntityType.COURT, confidence: 0.9 },
      
      // Cases
      { pattern: /\b([A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+)\b/g, entityType: LegalEntityType.CASE, confidence: 0.85 },
      
      // Monetary amounts
      { pattern: /\$[\d,]+(?:\.\d{2})?/g, entityType: LegalEntityType.MONETARY, confidence: 0.95 }
    );

    // UK Legal patterns (Barrister/Solicitor system)
    this.entityPatterns.push(
      // Barristers
      { pattern: /\b([A-Z][a-z]+ [A-Z][a-z]+),?\s+(?:QC|KC|Barrister)\b/g, entityType: LegalEntityType.LAWYER, confidence: 0.9, jurisdiction: 'uk' },
      
      // Solicitors
      { pattern: /\b([A-Z][a-z]+ [A-Z][a-z]+),?\s+Solicitor\b/g, entityType: LegalEntityType.LAWYER, confidence: 0.9, jurisdiction: 'uk' },
      
      // UK Courts
      { pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:High Court|Crown Court|Magistrates' Court|Court of Appeal)\b/g, entityType: LegalEntityType.COURT, confidence: 0.9, jurisdiction: 'uk' }
    );

    // Name normalization patterns
    this.namePatterns.push(
      { pattern: /\b([A-Z][a-z]+)\s+([A-Z])\.?\s+([A-Z][a-z]+)\b/, variations: ['$1 $2. $3', '$1 $2 $3', '$1 $3'], normalizer: (text) => text.replace(/\s+/g, ' ').trim(), confidence: 0.9 },
      { pattern: /\b(Mr\.?|Ms\.?|Mrs\.?|Dr\.?)\s+([A-Z][a-z]+ [A-Z][a-z]+)\b/, variations: ['$2'], normalizer: (text) => text.replace(/^(?:Mr\.?|Ms\.?|Mrs\.?|Dr\.?)\s+/, ''), confidence: 0.85 }
    );

    console.log(`   ✓ Loaded ${this.entityPatterns.length} legal entity patterns`);
  }

  /**
   * Resolve entities across a collection of legal documents
   */
  async resolveEntitiesInDocuments(
    documents: LegalDocument[],
    context: LegalContext
  ): Promise<EntityResolutionResult> {
    const startTime = Date.now();
    
    console.log(`⚖️ Resolving legal entities in ${documents.length} documents...`);
    
    // Phase 1: Extract entity mentions
    const allMentions: EntityMention[] = [];
    for (const doc of documents) {
      const mentions = await this.extractEntityMentions(doc, context);
      allMentions.push(...mentions);
    }
    
    console.log(`   ✓ Extracted ${allMentions.length} entity mentions`);
    
    // Phase 2: Cluster similar mentions
    const clusters = await this.clusterEntityMentions(allMentions);
    console.log(`   ✓ Created ${clusters.length} entity clusters`);
    
    // Phase 3: Resolve each cluster to a canonical entity
    const resolvedEntities: ResolvedLegalEntity[] = [];
    for (const cluster of clusters) {
      const entity = await this.resolveEntityCluster(cluster, context);
      if (entity) {
        resolvedEntities.push(entity);
        this.entities.set(entity.id, entity);
      }
    }
    
    console.log(`   ✓ Resolved ${resolvedEntities.length} unique legal entities`);
    
    // Phase 4: Extract relationships
    const relationships = await this.extractEntityRelationships(resolvedEntities, allMentions);
    console.log(`   ✓ Discovered ${relationships.length} entity relationships`);
    
    // Phase 5: Validate entities against external sources
    const validatedEntities = await this.validateEntities(resolvedEntities);
    console.log(`   ✓ Validated ${validatedEntities} entities`);
    
    const result: EntityResolutionResult = {
      entities: resolvedEntities,
      relationships,
      statistics: {
        documentsProcessed: documents.length,
        mentionsExtracted: allMentions.length,
        entitiesResolved: resolvedEntities.length,
        relationshipsFound: relationships.length,
        validatedEntities,
        processingTime: Date.now() - startTime,
        averageConfidence: this.calculateAverageConfidence(resolvedEntities)
      },
      metadata: {
        context,
        processingDate: new Date(),
        version: '1.0.0'
      }
    };
    
    this.emit('resolutionComplete', result);
    return result;
  }

  /**
   * Extract entity mentions from a legal document
   */
  private async extractEntityMentions(
    document: LegalDocument,
    context: LegalContext
  ): Promise<EntityMention[]> {
    const mentions: EntityMention[] = [];
    const text = document.content || '';
    
    // Apply entity patterns
    for (const pattern of this.entityPatterns) {
      // Skip patterns that don't match jurisdiction
      if (pattern.jurisdiction && pattern.jurisdiction !== context.jurisdiction) {
        continue;
      }
      
      let match;
      while ((match = pattern.pattern.exec(text)) !== null) {
        const mentionText = match[1] || match[0];
        const startPos = match.index;
        const endPos = startPos + match[0].length;
        
        // Extract context around the mention
        const contextStart = Math.max(0, startPos - 100);
        const contextEnd = Math.min(text.length, endPos + 100);
        const contextText = text.substring(contextStart, contextEnd);
        
        // Determine context type
        const contextType = this.determineContextType(contextText, document);
        
        // Extract potential role from context
        const role = this.extractRoleFromContext(contextText, pattern.entityType);
        
        mentions.push({
          documentId: document.id,
          documentName: document.name,
          page: this.calculatePageNumber(text, startPos),
          position: { start: startPos, end: endPos },
          text: mentionText,
          normalizedText: this.normalizeEntityName(mentionText),
          context: contextText,
          contextType,
          role,
          confidence: pattern.confidence,
          extractedAt: new Date(),
          extractionMethod: 'pattern'
        });
      }
      
      // Reset regex for next iteration
      pattern.pattern.lastIndex = 0;
    }
    
    return mentions;
  }

  /**
   * Normalize entity names for comparison
   */
  private normalizeEntityName(name: string): string {
    return name
      .replace(/[.,;:]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  /**
   * Determine the context type of a mention
   */
  private determineContextType(context: string, document: LegalDocument): EntityMention['contextType'] {
    const lower = context.toLowerCase();
    
    if (lower.includes('signature') || lower.includes('signed by')) return 'signature';
    if (lower.includes('attorney for') || lower.includes('counsel for')) return 'service_list';
    if (lower.includes('v.') || lower.includes('versus')) return 'caption';
    
    return 'body';
  }

  /**
   * Extract legal role from context
   */
  private extractRoleFromContext(context: string, entityType: LegalEntityType): LegalRole | undefined {
    const lower = context.toLowerCase();
    
    // Role patterns
    if (lower.includes('attorney for plaintiff')) return LegalRole.ATTORNEY;
    if (lower.includes('counsel for defendant')) return LegalRole.ATTORNEY;
    if (lower.includes('plaintiff')) return LegalRole.PLAINTIFF;
    if (lower.includes('defendant')) return LegalRole.DEFENDANT;
    if (lower.includes('witness')) return LegalRole.WITNESS;
    if (entityType === LegalEntityType.JUDGE) return LegalRole.JUDGE;
    
    return undefined;
  }

  /**
   * Calculate page number from text position
   */
  private calculatePageNumber(text: string, position: number): number {
    // Count page breaks before this position
    const pageBreaks = (text.substring(0, position).match(/\f|\n\s*Page\s+\d+/gi) || []).length;
    return Math.max(1, pageBreaks + 1);
  }

  /**
   * Cluster similar entity mentions
   */
  private async clusterEntityMentions(mentions: EntityMention[]): Promise<EntityMention[][]> {
    const clusters: EntityMention[][] = [];
    const processed = new Set<number>();
    
    for (let i = 0; i < mentions.length; i++) {
      if (processed.has(i)) continue;
      
      const cluster: EntityMention[] = [mentions[i]];
      processed.add(i);
      
      // Find similar mentions
      for (let j = i + 1; j < mentions.length; j++) {
        if (processed.has(j)) continue;
        
        const similarity = await this.calculateMentionSimilarity(mentions[i], mentions[j]);
        if (similarity.overall >= this.NAME_SIMILARITY_THRESHOLD) {
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
  private async calculateMentionSimilarity(
    m1: EntityMention, 
    m2: EntityMention
  ): Promise<SimilarityScore> {
    const result: SimilarityScore = {
      name: 0,
      context: 0,
      professional: 0,
      overall: 0
    };
    
    // Name similarity
    result.name = this.calculateNameSimilarity(m1.normalizedText, m2.normalizedText);
    
    // Context similarity
    result.context = this.calculateContextSimilarity(m1.context, m2.context);
    
    // Professional similarity (for lawyers, judges, etc.)
    if (m1.role && m2.role) {
      result.professional = m1.role === m2.role ? 1.0 : 0.0;
    }
    
    // Calculate overall similarity
    result.overall = (
      result.name * 0.6 +
      result.context * 0.25 +
      result.professional * 0.15
    );
    
    return result;
  }

  /**
   * Calculate name similarity using multiple techniques
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    if (name1 === name2) return 1.0;
    
    // Exact substring match
    if (name1.includes(name2) || name2.includes(name1)) {
      return 0.9;
    }
    
    // Split into parts and check overlap
    const parts1 = name1.split(' ');
    const parts2 = name2.split(' ');
    
    // Check for last name + first initial match
    if (parts1.length >= 2 && parts2.length >= 2) {
      const lastName1 = parts1[parts1.length - 1];
      const lastName2 = parts2[parts2.length - 1];
      const firstInit1 = parts1[0][0];
      const firstInit2 = parts2[0][0];
      
      if (lastName1 === lastName2 && firstInit1 === firstInit2) {
        return 0.85;
      }
    }
    
    // Jaccard similarity of words
    const set1 = new Set(parts1);
    const set2 = new Set(parts2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate context similarity
   */
  private calculateContextSimilarity(context1: string, context2: string): number {
    const words1 = new Set(context1.toLowerCase().split(/\s+/));
    const words2 = new Set(context2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Resolve a cluster of mentions to a canonical entity
   */
  private async resolveEntityCluster(
    cluster: EntityMention[],
    context: LegalContext
  ): Promise<ResolvedLegalEntity | null> {
    if (cluster.length === 0) return null;
    
    // Determine canonical name (most frequent or highest confidence)
    const canonicalName = this.selectCanonicalName(cluster);
    
    // Determine entity type
    const entityType = this.determineEntityType(cluster);
    
    // Collect all name variations
    const aliases = new Set<string>();
    const abbreviations = new Set<string>();
    const formalNames = new Set<string>();
    
    for (const mention of cluster) {
      aliases.add(mention.text);
      formalNames.add(mention.normalizedText);
    }
    
    // Collect roles
    const roles = new Set<LegalRole>();
    for (const mention of cluster) {
      if (mention.role) roles.add(mention.role);
    }
    
    // Calculate document frequency
    const documentFrequency = new Map<string, number>();
    for (const mention of cluster) {
      documentFrequency.set(
        mention.documentId,
        (documentFrequency.get(mention.documentId) || 0) + 1
      );
    }
    
    // Extract professional attributes
    const attributes = await this.extractProfessionalAttributes(cluster);
    
    const entity: ResolvedLegalEntity = {
      id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      canonicalName,
      entityType,
      confidence: this.calculateEntityConfidence(cluster),
      aliases,
      abbreviations,
      nicknames: new Set(),
      formalNames,
      ...attributes,
      roles,
      relationships: [],
      mentions: cluster,
      documentFrequency,
      validatedBy: [],
      lastValidated: new Date(),
      validationConfidence: 0
    };
    
    return entity;
  }

  /**
   * Select the canonical name for an entity
   */
  private selectCanonicalName(cluster: EntityMention[]): string {
    // Count frequency of each name
    const nameFreq = new Map<string, number>();
    for (const mention of cluster) {
      nameFreq.set(mention.text, (nameFreq.get(mention.text) || 0) + 1);
    }
    
    // Get most frequent name, prefer longer names in case of ties
    const sortedNames = Array.from(nameFreq.entries())
      .sort((a, b) => {
        if (a[1] !== b[1]) return b[1] - a[1]; // Frequency first
        return b[0].length - a[0].length;      // Length second
      });
    
    return sortedNames[0][0];
  }

  /**
   * Determine entity type from cluster
   */
  private determineEntityType(cluster: EntityMention[]): LegalEntityType {
    // Look for specific indicators
    for (const mention of cluster) {
      if (mention.text.includes('Judge') || mention.text.includes('Justice')) {
        return LegalEntityType.JUDGE;
      }
      if (mention.text.includes('Esq') || mention.text.includes('Attorney')) {
        return LegalEntityType.LAWYER;
      }
      if (mention.text.includes('Corp') || mention.text.includes('Inc')) {
        return LegalEntityType.CORPORATION;
      }
      if (mention.text.includes('Court')) {
        return LegalEntityType.COURT;
      }
    }
    
    // Default to person if no specific indicators
    return LegalEntityType.PERSON;
  }

  /**
   * Extract professional attributes from mentions
   */
  private async extractProfessionalAttributes(cluster: EntityMention[]): Promise<Partial<ResolvedLegalEntity>> {
    const attributes: Partial<ResolvedLegalEntity> = {};
    
    // Extract bar number
    for (const mention of cluster) {
      const barMatch = mention.context.match(/Bar No\.?\s*(\d+)/i);
      if (barMatch) {
        attributes.barNumber = barMatch[1];
        break;
      }
    }
    
    // Extract firm affiliation
    for (const mention of cluster) {
      const firmMatch = mention.context.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*),?\s+(?:LLC|LLP|P\.C\.)/);
      if (firmMatch) {
        attributes.firm = firmMatch[1];
        break;
      }
    }
    
    // Extract title
    for (const mention of cluster) {
      const titleMatch = mention.text.match(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Judge|Justice|Hon\.)/);
      if (titleMatch) {
        attributes.title = titleMatch[1];
        break;
      }
    }
    
    return attributes;
  }

  /**
   * Calculate entity confidence
   */
  private calculateEntityConfidence(cluster: EntityMention[]): number {
    if (cluster.length === 0) return 0;
    
    // Base confidence from mentions
    const avgMentionConfidence = cluster.reduce((sum, m) => sum + m.confidence, 0) / cluster.length;
    
    // Boost confidence for multiple mentions
    const mentionBonus = Math.min(cluster.length * 0.05, 0.2);
    
    // Boost confidence for consistent context
    const contextConsistency = this.calculateContextConsistency(cluster);
    const contextBonus = contextConsistency * 0.1;
    
    return Math.min(avgMentionConfidence + mentionBonus + contextBonus, 1.0);
  }

  /**
   * Calculate context consistency across mentions
   */
  private calculateContextConsistency(cluster: EntityMention[]): number {
    if (cluster.length <= 1) return 1.0;
    
    const roles = cluster.map(m => m.role).filter(Boolean);
    const contextTypes = cluster.map(m => m.contextType);
    
    // Check role consistency
    const uniqueRoles = new Set(roles);
    const roleConsistency = uniqueRoles.size <= 1 ? 1.0 : 0.5;
    
    // Check context type diversity
    const uniqueContextTypes = new Set(contextTypes);
    const contextDiversity = uniqueContextTypes.size / contextTypes.length;
    
    return (roleConsistency + contextDiversity) / 2;
  }

  /**
   * Extract relationships between entities
   */
  private async extractEntityRelationships(
    entities: ResolvedLegalEntity[],
    allMentions: EntityMention[]
  ): Promise<EntityRelationship[]> {
    const relationships: EntityRelationship[] = [];
    
    // Look for relationship patterns in document text
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        
        // Find co-occurrences
        const coOccurrences = this.findEntityCoOccurrences(entity1, entity2, allMentions);
        
        for (const coOcc of coOccurrences) {
          const relationshipType = this.inferRelationshipType(entity1, entity2, coOcc);
          
          if (relationshipType) {
            relationships.push({
              fromEntity: entity1.id,
              toEntity: entity2.id,
              relationshipType,
              confidence: coOcc.confidence,
              evidence: [{
                documentId: coOcc.documentId,
                page: coOcc.page,
                text: coOcc.context,
                confidence: coOcc.confidence,
                extractedAt: new Date()
              }],
              context: {
                documentType: 'other',
                jurisdiction: 'us',
                practiceArea: [],
                courtLevel: 'other',
                confidence: 0.8
              }
            });
          }
        }
      }
    }
    
    return relationships;
  }

  /**
   * Find co-occurrences of two entities
   */
  private findEntityCoOccurrences(
    entity1: ResolvedLegalEntity,
    entity2: ResolvedLegalEntity,
    allMentions: EntityMention[]
  ): CoOccurrence[] {
    const coOccurrences: CoOccurrence[] = [];
    
    // Find mentions in the same document within a proximity window
    const mentions1 = entity1.mentions;
    const mentions2 = entity2.mentions;
    
    for (const m1 of mentions1) {
      for (const m2 of mentions2) {
        if (m1.documentId === m2.documentId) {
          const distance = Math.abs(m1.position.start - m2.position.start);
          
          // If mentions are within 500 characters, consider them co-occurring
          if (distance <= 500) {
            coOccurrences.push({
              documentId: m1.documentId,
              page: m1.page,
              entity1Position: m1.position,
              entity2Position: m2.position,
              distance,
              context: this.extractCoOccurrenceContext(m1, m2),
              confidence: Math.max(0.1, 1.0 - (distance / 500))
            });
          }
        }
      }
    }
    
    return coOccurrences;
  }

  /**
   * Extract context around co-occurring entities
   */
  private extractCoOccurrenceContext(m1: EntityMention, m2: EntityMention): string {
    // Use the broader context that encompasses both mentions
    const start = Math.min(m1.position.start, m2.position.start);
    const end = Math.max(m1.position.end, m2.position.end);
    
    return m1.context; // Simplified - in production, would extract actual surrounding text
  }

  /**
   * Infer relationship type from co-occurrence
   */
  private inferRelationshipType(
    entity1: ResolvedLegalEntity,
    entity2: ResolvedLegalEntity,
    coOcc: CoOccurrence
  ): RelationshipType | null {
    const context = coOcc.context.toLowerCase();
    
    // Attorney-client relationships
    if (entity1.entityType === LegalEntityType.LAWYER || entity2.entityType === LegalEntityType.LAWYER) {
      if (context.includes('represents') || context.includes('counsel for')) {
        return RelationshipType.REPRESENTS;
      }
    }
    
    // Opposing parties
    if ((entity1.roles.has(LegalRole.PLAINTIFF) && entity2.roles.has(LegalRole.DEFENDANT)) ||
        (entity1.roles.has(LegalRole.DEFENDANT) && entity2.roles.has(LegalRole.PLAINTIFF))) {
      return RelationshipType.SUES;
    }
    
    // Employment relationships
    if (context.includes('employed by') || context.includes('works for')) {
      return RelationshipType.EMPLOYED_BY;
    }
    
    // Corporate relationships
    if (context.includes('subsidiary') || context.includes('parent company')) {
      return RelationshipType.SUBSIDIARY_OF;
    }
    
    return null;
  }

  /**
   * Validate entities against external sources
   */
  private async validateEntities(entities: ResolvedLegalEntity[]): Promise<number> {
    let validatedCount = 0;
    
    for (const entity of entities) {
      // For lawyers, try to validate against bar directory
      if (entity.entityType === LegalEntityType.LAWYER && entity.barNumber) {
        const validation = await this.validateWithBarDirectory(entity);
        if (validation.valid) {
          entity.validatedBy.push({
            source: 'bar_directory',
            confidence: validation.confidence,
            validatedAt: new Date(),
            details: validation.details
          });
          entity.validationConfidence = validation.confidence;
          validatedCount++;
        }
      }
      
      // For corporations, try to validate against SEC filings
      if (entity.entityType === LegalEntityType.CORPORATION) {
        const validation = await this.validateWithSECFilings(entity);
        if (validation.valid) {
          entity.validatedBy.push({
            source: 'sec_filings',
            confidence: validation.confidence,
            validatedAt: new Date(),
            details: validation.details
          });
          entity.validationConfidence = Math.max(entity.validationConfidence, validation.confidence);
          validatedCount++;
        }
      }
    }
    
    return validatedCount;
  }

  /**
   * Validate lawyer against bar directory
   */
  private async validateWithBarDirectory(entity: ResolvedLegalEntity): Promise<ValidationResult> {
    // Simulated validation (in production, would call actual bar directory APIs)
    return {
      valid: Math.random() > 0.3, // 70% validation success rate
      confidence: 0.9,
      details: {
        barNumber: entity.barNumber,
        status: 'active',
        admissionDate: '2010-01-01'
      }
    };
  }

  /**
   * Validate corporation against SEC filings
   */
  private async validateWithSECFilings(entity: ResolvedLegalEntity): Promise<ValidationResult> {
    // Simulated validation
    return {
      valid: Math.random() > 0.5, // 50% validation success rate
      confidence: 0.8,
      details: {
        filingStatus: 'current',
        incorporationState: 'Delaware'
      }
    };
  }

  /**
   * Calculate average confidence across entities
   */
  private calculateAverageConfidence(entities: ResolvedLegalEntity[]): number {
    if (entities.length === 0) return 0;
    
    const totalConfidence = entities.reduce((sum, entity) => sum + entity.confidence, 0);
    return totalConfidence / entities.length;
  }

  /**
   * Get resolved entity by ID
   */
  getEntity(entityId: string): ResolvedLegalEntity | undefined {
    return this.entities.get(entityId);
  }

  /**
   * Find entities by name
   */
  findEntitiesByName(name: string): ResolvedLegalEntity[] {
    const normalizedName = this.normalizeEntityName(name);
    const results: ResolvedLegalEntity[] = [];
    
    for (const entity of this.entities.values()) {
      if (entity.aliases.has(name) || 
          entity.formalNames.has(normalizedName) ||
          entity.canonicalName.toLowerCase().includes(name.toLowerCase())) {
        results.push(entity);
      }
    }
    
    return results;
  }

  /**
   * Get entity statistics
   */
  getStatistics(): EntityStatistics {
    const entities = Array.from(this.entities.values());
    
    return {
      totalEntities: entities.length,
      entitiesByType: this.groupEntitiesByType(entities),
      averageConfidence: this.calculateAverageConfidence(entities),
      validatedEntities: entities.filter(e => e.validatedBy.length > 0).length,
      highConfidenceEntities: entities.filter(e => e.confidence >= 0.9).length
    };
  }

  /**
   * Group entities by type
   */
  private groupEntitiesByType(entities: ResolvedLegalEntity[]): Map<LegalEntityType, number> {
    const groups = new Map<LegalEntityType, number>();
    
    for (const entity of entities) {
      groups.set(entity.entityType, (groups.get(entity.entityType) || 0) + 1);
    }
    
    return groups;
  }
}

// Supporting interfaces and types

interface LegalDocument {
  id: string;
  name: string;
  content: string;
  metadata?: any;
}

interface SimilarityScore {
  name: number;
  context: number;
  professional: number;
  overall: number;
}

interface CoOccurrence {
  documentId: string;
  page: number;
  entity1Position: { start: number; end: number };
  entity2Position: { start: number; end: number };
  distance: number;
  context: string;
  confidence: number;
}

interface ValidationResult {
  valid: boolean;
  confidence: number;
  details?: any;
}

interface EntityResolutionResult {
  entities: ResolvedLegalEntity[];
  relationships: EntityRelationship[];
  statistics: ResolutionStatistics;
  metadata: ResolutionMetadata;
}

interface ResolutionStatistics {
  documentsProcessed: number;
  mentionsExtracted: number;
  entitiesResolved: number;
  relationshipsFound: number;
  validatedEntities: number;
  processingTime: number;
  averageConfidence: number;
}

interface ResolutionMetadata {
  context: LegalContext;
  processingDate: Date;
  version: string;
}

interface EntityStatistics {
  totalEntities: number;
  entitiesByType: Map<LegalEntityType, number>;
  averageConfidence: number;
  validatedEntities: number;
  highConfidenceEntities: number;
}

// Export singleton instance
export const legalEntityResolver = new LegalEntityResolver();

console.log('⚖️ Legal Entity Resolver module loaded');