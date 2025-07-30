import { Issue, Person, ChronologyEvent, LegalAuthority, CaseDocument } from '../types';

export interface AIInsight {
  id: string;
  caseId: string;
  sourceComponent: string;
  sourceDocument?: string;
  timestamp: number;
  type: 'person' | 'issue' | 'chronology' | 'authority' | 'cross_reference';
  data: any;
  confidence: number;
}

export interface AIEventData {
  persons?: Omit<Person, 'id' | 'caseId'>[];
  issues?: Omit<Issue, 'id' | 'caseId'>[];
  chronologyEvents?: Omit<ChronologyEvent, 'id' | 'caseId'>[];
  authorities?: Omit<LegalAuthority, 'id' | 'caseId'>[];
  crossReferences?: {
    personIds?: string[];
    issueIds?: string[];
    documentIds?: string[];
  };
}

export type AIEventListener = (insight: AIInsight) => void;

class AIEventSystem {
  private listeners: Map<string, AIEventListener[]> = new Map();
  private insights: Map<string, AIInsight[]> = new Map(); // caseId -> insights
  
  /**
   * Subscribe to AI insights for a specific case
   */
  subscribe(caseId: string, listener: AIEventListener): () => void {
    if (!this.listeners.has(caseId)) {
      this.listeners.set(caseId, []);
    }
    this.listeners.get(caseId)!.push(listener);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(caseId);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Publish AI insights to all subscribers
   */
  publish(insight: AIInsight): void {
    // Store insight
    if (!this.insights.has(insight.caseId)) {
      this.insights.set(insight.caseId, []);
    }
    this.insights.get(insight.caseId)!.push(insight);
    
    // Notify listeners
    const listeners = this.listeners.get(insight.caseId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(insight);
        } catch (error) {
          console.error('Error in AI event listener:', error);
        }
      });
    }
    
    console.log(`🤖 AI Insight Published:`, {
      type: insight.type,
      source: insight.sourceComponent,
      caseId: insight.caseId,
      confidence: insight.confidence
    });
  }

  /**
   * Process AI analysis results and propagate insights
   */
  async processAIResults(
    caseId: string,
    sourceComponent: string,
    sourceDocument: string,
    aiResults: AIEventData,
    confidence: number = 0.8
  ): Promise<void> {
    const timestamp = Date.now();
    
    // Process persons
    if (aiResults.persons && aiResults.persons.length > 0) {
      const insight: AIInsight = {
        id: `person_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        caseId,
        sourceComponent,
        sourceDocument,
        timestamp,
        type: 'person',
        data: aiResults.persons,
        confidence
      };
      this.publish(insight);
    }

    // Process issues
    if (aiResults.issues && aiResults.issues.length > 0) {
      const insight: AIInsight = {
        id: `issue_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        caseId,
        sourceComponent,
        sourceDocument,
        timestamp,
        type: 'issue',
        data: aiResults.issues,
        confidence
      };
      this.publish(insight);
    }

    // Process chronology events
    if (aiResults.chronologyEvents && aiResults.chronologyEvents.length > 0) {
      const insight: AIInsight = {
        id: `chronology_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        caseId,
        sourceComponent,
        sourceDocument,
        timestamp,
        type: 'chronology',
        data: aiResults.chronologyEvents,
        confidence
      };
      this.publish(insight);
    }

    // Process authorities
    if (aiResults.authorities && aiResults.authorities.length > 0) {
      const insight: AIInsight = {
        id: `authority_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        caseId,
        sourceComponent,
        sourceDocument,
        timestamp,
        type: 'authority',
        data: aiResults.authorities,
        confidence
      };
      this.publish(insight);
    }

    // Process cross-references
    if (aiResults.crossReferences) {
      const insight: AIInsight = {
        id: `crossref_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        caseId,
        sourceComponent,
        sourceDocument,
        timestamp,
        type: 'cross_reference',
        data: aiResults.crossReferences,
        confidence
      };
      this.publish(insight);
    }
  }

  /**
   * Get all insights for a case
   */
  getInsights(caseId: string): AIInsight[] {
    return this.insights.get(caseId) || [];
  }

  /**
   * Get insights by type
   */
  getInsightsByType(caseId: string, type: AIInsight['type']): AIInsight[] {
    const insights = this.insights.get(caseId) || [];
    return insights.filter(insight => insight.type === type);
  }

  /**
   * Clear insights for a case
   */
  clearInsights(caseId: string): void {
    this.insights.delete(caseId);
  }
}

// Entity deduplication and merging utilities
export class AIEntityManager {
  /**
   * Check if a person already exists
   */
  static findSimilarPerson(newPerson: Omit<Person, 'id' | 'caseId'>, existingPersons: Person[]): Person | null {
    const threshold = 0.7;
    
    for (const existing of existingPersons) {
      const nameSimilarity = this.calculateStringSimilarity(
        newPerson.name.toLowerCase(), 
        existing.name.toLowerCase()
      );
      
      if (nameSimilarity > threshold) {
        return existing;
      }
      
      // Check role and organization similarity
      if (existing.role === newPerson.role && 
          existing.organization && newPerson.organization &&
          this.calculateStringSimilarity(existing.organization, newPerson.organization) > 0.8) {
        return existing;
      }
    }
    
    return null;
  }

  /**
   * Check if an issue already exists
   */
  static findSimilarIssue(newIssue: Omit<Issue, 'id' | 'caseId'>, existingIssues: Issue[]): Issue | null {
    const threshold = 0.6;
    
    for (const existing of existingIssues) {
      const titleSimilarity = this.calculateStringSimilarity(
        newIssue.title.toLowerCase(),
        existing.title.toLowerCase()
      );
      
      const descriptionSimilarity = this.calculateStringSimilarity(
        newIssue.description.toLowerCase(),
        existing.description.toLowerCase()
      );
      
      if (titleSimilarity > threshold || descriptionSimilarity > threshold) {
        return existing;
      }
    }
    
    return null;
  }

  /**
   * Merge person data intelligently
   */
  static mergePerson(existing: Person, newData: Omit<Person, 'id' | 'caseId'>): Person {
    return {
      ...existing,
      // Merge document references
      documentRefs: [...new Set([...existing.documentRefs, ...newData.documentRefs])],
      // Update description if new one is more detailed
      description: newData.description.length > existing.description.length ? 
        newData.description : existing.description,
      // Merge contact info if missing
      contactInfo: existing.contactInfo || newData.contactInfo,
      email: existing.email || newData.email,
      phone: existing.phone || newData.phone,
      organization: existing.organization || newData.organization,
      // Merge key quotes
      keyQuotes: [...new Set([...(existing.keyQuotes || []), ...(newData.keyQuotes || [])])],
      // Merge relationships
      relationships: this.mergeRelationships(existing.relationships || [], newData.relationships || []),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Merge issue data intelligently
   */
  static mergeIssue(existing: Issue, newData: Omit<Issue, 'id' | 'caseId'>): Issue {
    return {
      ...existing,
      // Merge document references
      documentRefs: [...new Set([...existing.documentRefs, ...newData.documentRefs])],
      // Update positions if not set
      claimantPosition: existing.claimantPosition || newData.claimantPosition,
      defendantPosition: existing.defendantPosition || newData.defendantPosition,
      // Merge related issues
      relatedIssues: [...new Set([...existing.relatedIssues, ...newData.relatedIssues])],
      // Merge tags
      tags: [...new Set([...(existing.tags || []), ...(newData.tags || [])])],
      // Merge evidence needed
      evidenceNeeded: [...new Set([...(existing.evidenceNeeded || []), ...(newData.evidenceNeeded || [])])],
      // Merge legal authorities
      legalAuthorities: [...new Set([...(existing.legalAuthorities || []), ...(newData.legalAuthorities || [])])],
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  /**
   * Merge relationship arrays
   */
  private static mergeRelationships(existing: any[], newRelationships: any[]): any[] {
    const merged = [...existing];
    
    for (const newRel of newRelationships) {
      const existingRel = merged.find(rel => 
        rel.targetPersonId === newRel.targetPersonId && rel.type === newRel.type
      );
      
      if (!existingRel) {
        merged.push(newRel);
      }
    }
    
    return merged;
  }
}

export const aiEventSystem = new AIEventSystem();