/**
 * Entity Relationship Mapper
 * Intelligent system for mapping relationships between legal entities
 */

import React, { useState, useEffect } from 'react';

interface Entity {
  id: string;
  type: 'person' | 'organization' | 'location' | 'document' | 'concept' | 'date' | 'amount' | 'legal_principle';
  name: string;
  aliases?: string[];
  metadata: {
    confidence?: number;
    extractedFrom?: string[];
    category?: string;
    importance?: number;
    verified?: boolean;
    [key: string]: any;
  };
}

interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'owns' | 'works_for' | 'located_at' | 'authored' | 'references' | 'knows' | 'related_to' | 'contradicts' | 'supports';
  strength: number; // 0-1
  bidirectional: boolean;
  metadata: {
    confidence?: number;
    evidence?: string[];
    timeline?: string;
    source?: string;
    [key: string]: any;
  };
}

interface EntityNetwork {
  entities: Entity[];
  relationships: Relationship[];
  clusters: EntityCluster[];
}

interface EntityCluster {
  id: string;
  entities: string[];
  type: 'family' | 'business' | 'legal_team' | 'evidence_chain' | 'timeline' | 'location_based';
  confidence: number;
  description: string;
}

interface EntityRelationshipMapperProps {
  documentContent?: string;
  caseId?: string;
  onEntityNetwork?: (network: EntityNetwork) => void;
}

export const EntityRelationshipMapper: React.FC<EntityRelationshipMapperProps> = ({
  documentContent,
  caseId,
  onEntityNetwork
}) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [clusters, setClusters] = useState<EntityCluster[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (documentContent) {
      processDocumentForEntities(documentContent);
    }
  }, [documentContent]);

  const processDocumentForEntities = async (content: string): Promise<void> => {
    setIsProcessing(true);
    
    try {
      // Simulate entity extraction and relationship mapping
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const extractedEntities = extractEntitiesFromText(content);
      const mappedRelationships = mapEntityRelationships(extractedEntities, content);
      const entityClusters = identifyEntityClusters(extractedEntities, mappedRelationships);
      
      setEntities(extractedEntities);
      setRelationships(mappedRelationships);
      setClusters(entityClusters);
      
      // Notify parent component
      onEntityNetwork?.({
        entities: extractedEntities,
        relationships: mappedRelationships,
        clusters: entityClusters
      });
      
    } catch (error) {
      console.error('Entity processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractEntitiesFromText = (text: string): Entity[] => {
    const entities: Entity[] = [];
    const content = text.toLowerCase();
    
    // Person extraction patterns
    const personPatterns = [
      /(?:mr|mrs|ms|dr|prof|judge|lord|lady|sir)\s+([a-z]+(?:\s+[a-z]+)*)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+\(defendant\)|\s+\(claimant\)|\s+\(witness\))/gi,
      /the defendant\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+testified|\s+stated|\s+claimed)/gi
    ];

    personPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match, matchIndex) => {
          const cleanName = match.replace(/\(.*?\)/g, '').trim();
          const role = match.includes('defendant') ? 'defendant' : 
                      match.includes('claimant') ? 'claimant' :
                      match.includes('witness') ? 'witness' : 'unknown';
          
          entities.push({
            id: `person_${index}_${matchIndex}`,
            type: 'person',
            name: cleanName,
            metadata: {
              confidence: 0.8 + Math.random() * 0.2,
              extractedFrom: [caseId || 'current_document'],
              category: role,
              importance: role === 'defendant' ? 0.9 : role === 'claimant' ? 0.8 : 0.6
            }
          });
        });
      }
    });

    // Organization extraction
    const orgPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Ltd|Limited|plc|PLC|Corporation|Corp|Company|Co)/gi,
      /(?:the|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Bank|Hospital|School|University|Police))/gi
    ];

    orgPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match, matchIndex) => {
          entities.push({
            id: `org_${index}_${matchIndex}`,
            type: 'organization',
            name: match.trim(),
            metadata: {
              confidence: 0.7 + Math.random() * 0.2,
              extractedFrom: [caseId || 'current_document'],
              importance: 0.6
            }
          });
        });
      }
    });

    // Location extraction
    const locationPatterns = [
      /(?:at|in|near|on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|Road|Avenue|Lane|Court|Place))/gi,
      /(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+[A-Z]{2,3}\s+\d/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Crown Court/gi
    ];

    locationPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match, matchIndex) => {
          const location = match.replace(/^(?:at|in|near|on)\s+/i, '').trim();
          entities.push({
            id: `location_${index}_${matchIndex}`,
            type: 'location',
            name: location,
            metadata: {
              confidence: 0.6 + Math.random() * 0.3,
              extractedFrom: [caseId || 'current_document'],
              importance: 0.5
            }
          });
        });
      }
    });

    // Date extraction
    const datePatterns = [
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
      /(\d{1,2}\/\d{1,2}\/\d{4})/gi,
      /(\d{4}-\d{2}-\d{2})/gi
    ];

    datePatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match, matchIndex) => {
          entities.push({
            id: `date_${index}_${matchIndex}`,
            type: 'date',
            name: match.trim(),
            metadata: {
              confidence: 0.9,
              extractedFrom: [caseId || 'current_document'],
              importance: 0.7
            }
          });
        });
      }
    });

    // Legal concept extraction
    const legalConcepts = [
      'negligence', 'breach of contract', 'fraud', 'misrepresentation', 
      'damages', 'liability', 'duty of care', 'reasonable person',
      'criminal intent', 'mens rea', 'actus reus', 'beyond reasonable doubt',
      'balance of probabilities', 'causation', 'foreseeability'
    ];

    legalConcepts.forEach((concept, index) => {
      if (content.includes(concept.toLowerCase())) {
        entities.push({
          id: `concept_${index}`,
          type: 'concept',
          name: concept,
          metadata: {
            confidence: 0.8,
            extractedFrom: [caseId || 'current_document'],
            category: 'legal_principle',
            importance: 0.7
          }
        });
      }
    });

    // Amount extraction
    const amountPattern = /£(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi;
    const amountMatches = text.match(amountPattern);
    if (amountMatches) {
      amountMatches.forEach((match, index) => {
        entities.push({
          id: `amount_${index}`,
          type: 'amount',
          name: match,
          metadata: {
            confidence: 0.95,
            extractedFrom: [caseId || 'current_document'],
            importance: 0.8
          }
        });
      });
    }

    return entities;
  };

  const mapEntityRelationships = (entities: Entity[], content: string): Relationship[] => {
    const relationships: Relationship[] = [];
    
    // Map relationships based on proximity and context
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i];
        const entityB = entities[j];
        
        const relationshipType = determineRelationshipType(entityA, entityB, content);
        if (relationshipType) {
          const strength = calculateRelationshipStrength(entityA, entityB, content);
          
          relationships.push({
            id: `rel_${entityA.id}_${entityB.id}`,
            sourceId: entityA.id,
            targetId: entityB.id,
            type: relationshipType,
            strength,
            bidirectional: shouldBeBidirectional(relationshipType),
            metadata: {
              confidence: (entityA.metadata.confidence || 0.5) * (entityB.metadata.confidence || 0.5),
              source: 'text_analysis',
              evidence: findRelationshipEvidence(entityA, entityB, content)
            }
          });
        }
      }
    }
    
    return relationships;
  };

  const determineRelationshipType = (entityA: Entity, entityB: Entity, content: string): Relationship['type'] | null => {
    const contentLower = content.toLowerCase();
    const nameA = entityA.name.toLowerCase();
    const nameB = entityB.name.toLowerCase();
    
    // Person-Organization relationships
    if (entityA.type === 'person' && entityB.type === 'organization') {
      if (contentLower.includes(`${nameA} works for ${nameB}`) || 
          contentLower.includes(`${nameA} employed by ${nameB}`)) {
        return 'works_for';
      }
      if (contentLower.includes(`${nameA} owns ${nameB}`) ||
          contentLower.includes(`${nameA} director of ${nameB}`)) {
        return 'owns';
      }
    }
    
    // Person-Location relationships
    if (entityA.type === 'person' && entityB.type === 'location') {
      if (contentLower.includes(`${nameA} at ${nameB}`) ||
          contentLower.includes(`${nameA} located at ${nameB}`)) {
        return 'located_at';
      }
    }
    
    // Person-Person relationships
    if (entityA.type === 'person' && entityB.type === 'person') {
      if (contentLower.includes(`${nameA} and ${nameB}`) ||
          contentLower.includes(`${nameA}, ${nameB}`)) {
        return 'knows';
      }
    }
    
    // Document-Person relationships
    if (entityA.type === 'document' && entityB.type === 'person') {
      if (contentLower.includes(`${nameB} authored`) ||
          contentLower.includes(`statement by ${nameB}`)) {
        return 'authored';
      }
    }
    
    // Concept relationships
    if (entityA.type === 'concept' || entityB.type === 'concept') {
      return 'references';
    }
    
    // Default relationship for co-occurrence
    if (Math.abs(content.indexOf(entityA.name) - content.indexOf(entityB.name)) < 100) {
      return 'related_to';
    }
    
    return null;
  };

  const calculateRelationshipStrength = (entityA: Entity, entityB: Entity, content: string): number => {
    const nameA = entityA.name.toLowerCase();
    const nameB = entityB.name.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Count co-occurrences in sentences
    const sentences = contentLower.split(/[.!?]+/);
    let coOccurrences = 0;
    
    sentences.forEach(sentence => {
      if (sentence.includes(nameA) && sentence.includes(nameB)) {
        coOccurrences++;
      }
    });
    
    // Calculate strength based on various factors
    const proximityScore = Math.max(0, 1 - Math.abs(content.indexOf(entityA.name) - content.indexOf(entityB.name)) / content.length);
    const frequencyScore = Math.min(1, coOccurrences / 3);
    const importanceScore = (entityA.metadata.importance || 0.5) * (entityB.metadata.importance || 0.5);
    
    return Math.min(0.95, (proximityScore + frequencyScore + importanceScore) / 3);
  };

  const shouldBeBidirectional = (relationshipType: Relationship['type']): boolean => {
    const bidirectionalTypes: Relationship['type'][] = ['knows', 'related_to', 'contradicts', 'supports'];
    return bidirectionalTypes.includes(relationshipType);
  };

  const findRelationshipEvidence = (entityA: Entity, entityB: Entity, content: string): string[] => {
    const evidence: string[] = [];
    const sentences = content.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      if (sentence.includes(entityA.name) && sentence.includes(entityB.name)) {
        evidence.push(sentence.trim());
      }
    });
    
    return evidence.slice(0, 3); // Limit to 3 pieces of evidence
  };

  const identifyEntityClusters = (entities: Entity[], relationships: Relationship[]): EntityCluster[] => {
    const clusters: EntityCluster[] = [];
    
    // Group entities by type and relationships
    const personEntities = entities.filter(e => e.type === 'person');
    const orgEntities = entities.filter(e => e.type === 'organization');
    const locationEntities = entities.filter(e => e.type === 'location');
    
    // Create person cluster if multiple people are connected
    if (personEntities.length > 1) {
      const connectedPeople = personEntities.filter(person => 
        relationships.some(rel => 
          (rel.sourceId === person.id || rel.targetId === person.id) &&
          (rel.type === 'knows' || rel.type === 'related_to')
        )
      );
      
      if (connectedPeople.length > 0) {
        clusters.push({
          id: 'cluster_people',
          entities: connectedPeople.map(p => p.id),
          type: 'family',
          confidence: 0.7,
          description: `Group of ${connectedPeople.length} connected individuals`
        });
      }
    }
    
    // Create business cluster for organizations and related people
    if (orgEntities.length > 0) {
      const businessRelated = entities.filter(entity =>
        relationships.some(rel =>
          ((rel.sourceId === entity.id || rel.targetId === entity.id) &&
           (rel.type === 'works_for' || rel.type === 'owns')) ||
          orgEntities.some(org => org.id === entity.id)
        )
      );
      
      if (businessRelated.length > 1) {
        clusters.push({
          id: 'cluster_business',
          entities: businessRelated.map(e => e.id),
          type: 'business',
          confidence: 0.8,
          description: `Business network with ${businessRelated.length} entities`
        });
      }
    }
    
    // Create evidence chain cluster
    const evidenceEntities = entities.filter(e => 
      e.type === 'document' || e.type === 'date' || e.type === 'amount'
    );
    
    if (evidenceEntities.length > 1) {
      clusters.push({
        id: 'cluster_evidence',
        entities: evidenceEntities.map(e => e.id),
        type: 'evidence_chain',
        confidence: 0.9,
        description: `Evidence chain with ${evidenceEntities.length} items`
      });
    }
    
    return clusters;
  };

  return (
    <div className="entity-relationship-mapper">
      {isProcessing && (
        <div className="processing-indicator">
          <span className="spinner">🔄</span>
          <span>Mapping entity relationships...</span>
        </div>
      )}
      
      <div className="entity-summary">
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">{entities.length}</span>
            <span className="stat-label">Entities</span>
          </div>
          <div className="stat">
            <span className="stat-value">{relationships.length}</span>
            <span className="stat-label">Relationships</span>
          </div>
          <div className="stat">
            <span className="stat-value">{clusters.length}</span>
            <span className="stat-label">Clusters</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityRelationshipMapper;