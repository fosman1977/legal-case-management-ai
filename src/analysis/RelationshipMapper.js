/**
 * Entity Relationship Mapping - Week 7 Day 3-4
 * Advanced relationship pattern detection and graph analysis
 */

import Graph from './Graph.js'

class EntityRelationshipMapper {
  constructor() {
    this.relationships = new Map()
    this.entityGraph = new Graph()
  }

  buildRelationshipGraph(entities, documents) {
    // Create nodes for each entity
    entities.forEach(entity => {
      this.entityGraph.addNode(entity.id, {
        type: entity.type,
        value: entity.anonymized_value,
        confidence: entity.confidence,
        documents: entity.source_documents
      })
    })

    // Analyze co-occurrence patterns
    const relationships = this.analyzeCoOccurrence(entities, documents)
    
    // Add edges for relationships
    relationships.forEach(rel => {
      this.entityGraph.addEdge(rel.entity1, rel.entity2, {
        type: rel.relationship_type,
        strength: rel.strength,
        evidence: rel.supporting_evidence
      })
    })

    return this.createRelationshipPatterns()
  }

  analyzeCoOccurrence(entities, documents) {
    const relationships = []
    
    documents.forEach(doc => {
      const docEntities = entities.filter(e => e.source_documents.includes(doc.id))
      
      // Find entities that appear together
      for (let i = 0; i < docEntities.length; i++) {
        for (let j = i + 1; j < docEntities.length; j++) {
          const relationship = this.inferRelationship(docEntities[i], docEntities[j], doc)
          if (relationship.confidence > 0.7) {
            relationships.push(relationship)
          }
        }
      }
    })

    return relationships
  }

  createRelationshipPatterns() {
    const patterns = []
    
    // Analyze graph structure for patterns
    const communities = this.detectCommunities()
    const centralNodes = this.findCentralNodes()
    const pathways = this.analyzePathways()

    return {
      community_patterns: communities.map(c => this.createCommunityPattern(c)),
      influence_patterns: centralNodes.map(n => this.createInfluencePattern(n)),
      pathway_patterns: pathways.map(p => this.createPathwayPattern(p))
    }
  }

  inferRelationship(entity1, entity2, document) {
    const relationshipType = this.determineRelationshipType(entity1, entity2, document)
    const strength = this.calculateRelationshipStrength(entity1, entity2, document)
    const confidence = this.calculateRelationshipConfidence(entity1, entity2, document, relationshipType, strength)

    return {
      entity1: entity1.id,
      entity2: entity2.id,
      relationship_type: relationshipType,
      strength: strength,
      confidence: confidence,
      supporting_evidence: {
        document_id: document.id,
        document_type: document.type,
        co_occurrence_context: this.extractCoOccurrenceContext(entity1, entity2, document)
      }
    }
  }

  determineRelationshipType(entity1, entity2, document) {
    const type1 = entity1.type
    const type2 = entity2.type
    const docContent = document.content || document.text || ''

    // Financial relationships
    if ((type1 === 'person' && type2 === 'amount') || (type1 === 'amount' && type2 === 'person')) {
      if (this.hasFinancialContext(docContent)) {
        return 'financial_transaction'
      }
    }

    // Temporal relationships
    if ((type1 === 'person' && type2 === 'date') || (type1 === 'date' && type2 === 'person')) {
      if (this.hasTemporalContext(docContent)) {
        return 'temporal_association'
      }
    }

    // Location relationships
    if ((type1 === 'person' && type2 === 'location') || (type1 === 'location' && type2 === 'person')) {
      return 'geographical_association'
    }

    // Document relationships
    if (type1 === 'document' || type2 === 'document') {
      return 'document_reference'
    }

    // Legal relationships
    if (this.hasLegalContext(docContent)) {
      if ((type1 === 'person' && type2 === 'person')) {
        return 'legal_party_relationship'
      }
    }

    // Contractual relationships
    if (this.hasContractualContext(docContent)) {
      return 'contractual_relationship'
    }

    // Default co-occurrence
    return 'co_occurrence'
  }

  hasFinancialContext(content) {
    const financialTerms = /\b(payment|paid|invoice|bill|cost|expense|fee|charge|amount|sum|total)\b/i
    return financialTerms.test(content)
  }

  hasTemporalContext(content) {
    const temporalTerms = /\b(when|during|before|after|on|at|occurred|happened|meeting|event)\b/i
    return temporalTerms.test(content)
  }

  hasLegalContext(content) {
    const legalTerms = /\b(contract|agreement|lawsuit|claim|defendant|plaintiff|court|legal|liability)\b/i
    return legalTerms.test(content)
  }

  hasContractualContext(content) {
    const contractTerms = /\b(terms|conditions|clause|provision|obligation|commitment|agreement)\b/i
    return contractTerms.test(content)
  }

  calculateRelationshipStrength(entity1, entity2, document) {
    let strength = 0.5 // Base strength

    // Increase strength based on entity confidence
    const avgConfidence = (entity1.confidence + entity2.confidence) / 2
    strength += avgConfidence * 0.3

    // Increase strength based on proximity in document
    const proximity = this.calculateEntityProximity(entity1, entity2, document)
    strength += proximity * 0.2

    // Increase strength for multiple co-occurrences
    const coOccurrenceCount = this.countCoOccurrences(entity1, entity2)
    strength += Math.min(coOccurrenceCount * 0.1, 0.3)

    return Math.min(Math.max(strength, 0.1), 1.0)
  }

  calculateEntityProximity(entity1, entity2, document) {
    const content = document.content || document.text || ''
    
    // Find positions of entities in text
    const pos1 = content.toLowerCase().indexOf(entity1.anonymized_value?.toLowerCase() || '')
    const pos2 = content.toLowerCase().indexOf(entity2.anonymized_value?.toLowerCase() || '')

    if (pos1 === -1 || pos2 === -1) return 0.1

    const distance = Math.abs(pos1 - pos2)
    const maxDistance = content.length
    
    // Closer entities get higher proximity score
    return Math.max(0.1, 1 - (distance / maxDistance))
  }

  countCoOccurrences(entity1, entity2) {
    // Count how many documents both entities appear in
    const docs1 = new Set(entity1.source_documents)
    const docs2 = new Set(entity2.source_documents)
    
    const intersection = new Set([...docs1].filter(x => docs2.has(x)))
    return intersection.size
  }

  calculateRelationshipConfidence(entity1, entity2, document, relationshipType, strength) {
    let confidence = 0.7 // Base confidence

    // Adjust based on relationship type specificity
    const typeConfidenceMap = {
      'financial_transaction': 0.9,
      'temporal_association': 0.8,
      'legal_party_relationship': 0.85,
      'contractual_relationship': 0.8,
      'geographical_association': 0.75,
      'document_reference': 0.7,
      'co_occurrence': 0.6
    }

    confidence = typeConfidenceMap[relationshipType] || 0.6

    // Adjust based on strength
    confidence += (strength - 0.5) * 0.2

    // Adjust based on entity confidences
    const minEntityConfidence = Math.min(entity1.confidence, entity2.confidence)
    confidence *= minEntityConfidence

    return Math.min(Math.max(confidence, 0.1), 1.0)
  }

  extractCoOccurrenceContext(entity1, entity2, document) {
    const content = document.content || document.text || ''
    
    // Find context around both entities
    const pos1 = content.toLowerCase().indexOf(entity1.anonymized_value?.toLowerCase() || '')
    const pos2 = content.toLowerCase().indexOf(entity2.anonymized_value?.toLowerCase() || '')

    if (pos1 === -1 || pos2 === -1) {
      return 'Entities appear in same document'
    }

    const startPos = Math.max(0, Math.min(pos1, pos2) - 100)
    const endPos = Math.min(content.length, Math.max(pos1, pos2) + 100)
    
    const context = content.substring(startPos, endPos).trim()
    return context || 'Context extraction unavailable'
  }

  detectCommunities() {
    const communities = this.entityGraph.findConnectedComponents()
    
    return communities.map(community => ({
      nodes: community,
      size: community.length,
      cohesion: this.calculateCommunityCohesion(community),
      dominant_types: this.findDominantEntityTypes(community),
      relationship_density: this.calculateRelationshipDensity(community)
    }))
  }

  calculateCommunityCohesion(community) {
    if (community.length < 2) return 1.0

    let totalStrength = 0
    let relationshipCount = 0

    for (let i = 0; i < community.length; i++) {
      for (let j = i + 1; j < community.length; j++) {
        const edge = this.entityGraph.getEdge(community[i], community[j])
        if (edge) {
          totalStrength += edge.strength || 0.5
          relationshipCount++
        }
      }
    }

    return relationshipCount > 0 ? totalStrength / relationshipCount : 0.0
  }

  findDominantEntityTypes(community) {
    const typeCounts = {}
    
    community.forEach(nodeId => {
      const node = this.entityGraph.getNode(nodeId)
      const type = node?.type || 'unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })

    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({ type, count, percentage: (count / community.length) * 100 }))
  }

  calculateRelationshipDensity(community) {
    if (community.length < 2) return 0

    const possibleEdges = (community.length * (community.length - 1)) / 2
    let actualEdges = 0

    for (let i = 0; i < community.length; i++) {
      for (let j = i + 1; j < community.length; j++) {
        if (this.entityGraph.getEdge(community[i], community[j])) {
          actualEdges++
        }
      }
    }

    return actualEdges / possibleEdges
  }

  findCentralNodes() {
    return this.entityGraph.getCentralNodes(10)
  }

  analyzePathways() {
    const centrality = this.entityGraph.calculateBetweennessCentrality()
    const pathways = []

    // Find high-centrality nodes that act as bridges
    const bridgeNodes = Array.from(centrality.entries())
      .filter(([nodeId, score]) => score > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    bridgeNodes.forEach(([nodeId, score]) => {
      const neighbors = this.entityGraph.getNeighbors(nodeId)
      if (neighbors.length >= 2) {
        pathways.push({
          bridge_node: nodeId,
          centrality_score: score,
          connected_nodes: neighbors,
          pathway_significance: this.calculatePathwaySignificance(nodeId, neighbors)
        })
      }
    })

    return pathways
  }

  calculatePathwaySignificance(bridgeNode, connectedNodes) {
    let significance = 0

    // Calculate based on diversity of connected entity types
    const connectedTypes = new Set()
    connectedNodes.forEach(nodeId => {
      const node = this.entityGraph.getNode(nodeId)
      connectedTypes.add(node?.type || 'unknown')
    })

    significance += connectedTypes.size * 0.2

    // Calculate based on relationship strengths
    let totalStrength = 0
    connectedNodes.forEach(nodeId => {
      const edge = this.entityGraph.getEdge(bridgeNode, nodeId)
      totalStrength += edge?.strength || 0.5
    })

    significance += (totalStrength / connectedNodes.length) * 0.5

    // Add bonus for high-confidence nodes
    const bridgeNodeData = this.entityGraph.getNode(bridgeNode)
    significance += (bridgeNodeData?.confidence || 0.5) * 0.3

    return Math.min(significance, 1.0)
  }

  createCommunityPattern(community) {
    return {
      pattern_type: 'entity_community',
      pattern_id: `community_${community.nodes.join('_').substring(0, 10)}`,
      description: `Community of ${community.size} entities with ${community.dominant_types[0]?.type || 'mixed'} dominance`,
      entities: community.nodes,
      cohesion_score: community.cohesion,
      relationship_density: community.relationship_density,
      dominant_entity_types: community.dominant_types,
      legal_significance: this.assessCommunityLegalSignificance(community),
      privacy_note: 'Entity values anonymized in pattern analysis'
    }
  }

  createInfluencePattern(centralNode) {
    const node = this.entityGraph.getNode(centralNode.id)
    const neighbors = this.entityGraph.getNeighbors(centralNode.id)

    return {
      pattern_type: 'influence_hub',
      pattern_id: `hub_${centralNode.id}`,
      description: `Central entity with ${centralNode.degree} connections`,
      central_entity: {
        id: centralNode.id,
        type: node?.type || 'unknown',
        anonymized_value: node?.value || '[REDACTED]'
      },
      influence_degree: centralNode.degree,
      connected_entities: neighbors.map(nodeId => ({
        id: nodeId,
        type: this.entityGraph.getNode(nodeId)?.type || 'unknown'
      })),
      influence_strength: this.calculateInfluenceStrength(centralNode.id, neighbors),
      legal_significance: this.assessInfluenceLegalSignificance(centralNode),
      privacy_note: 'Entity identities anonymized for pattern analysis'
    }
  }

  calculateInfluenceStrength(centralNodeId, neighbors) {
    let totalStrength = 0
    let relationshipCount = 0

    neighbors.forEach(nodeId => {
      const edge = this.entityGraph.getEdge(centralNodeId, nodeId)
      if (edge) {
        totalStrength += edge.strength || 0.5
        relationshipCount++
      }
    })

    return relationshipCount > 0 ? totalStrength / relationshipCount : 0.5
  }

  createPathwayPattern(pathway) {
    const bridgeNode = this.entityGraph.getNode(pathway.bridge_node)

    return {
      pattern_type: 'connection_pathway',
      pattern_id: `pathway_${pathway.bridge_node}`,
      description: `Entity serves as bridge connecting ${pathway.connected_nodes.length} other entities`,
      bridge_entity: {
        id: pathway.bridge_node,
        type: bridgeNode?.type || 'unknown',
        anonymized_value: bridgeNode?.value || '[REDACTED]'
      },
      centrality_score: pathway.centrality_score,
      pathway_significance: pathway.pathway_significance,
      connected_entity_types: this.getConnectedEntityTypes(pathway.connected_nodes),
      legal_significance: this.assessPathwayLegalSignificance(pathway),
      privacy_note: 'Pathway analysis based on anonymized entity relationships'
    }
  }

  getConnectedEntityTypes(nodeIds) {
    const typeCounts = {}
    
    nodeIds.forEach(nodeId => {
      const node = this.entityGraph.getNode(nodeId)
      const type = node?.type || 'unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })

    return Object.entries(typeCounts).map(([type, count]) => ({ type, count }))
  }

  assessCommunityLegalSignificance(community) {
    // Assess legal significance based on entity types and relationships
    const hasPersons = community.dominant_types.some(dt => dt.type === 'person')
    const hasFinancial = community.dominant_types.some(dt => dt.type === 'amount')
    const hasTemporal = community.dominant_types.some(dt => dt.type === 'date')

    if (hasPersons && hasFinancial && hasTemporal) {
      return 'high - involves persons, financial elements, and temporal data'
    } else if (hasPersons && hasFinancial) {
      return 'medium - involves persons and financial elements'
    } else if (hasPersons) {
      return 'medium - involves multiple persons'
    } else {
      return 'low - primarily non-personal entities'
    }
  }

  assessInfluenceLegalSignificance(centralNode) {
    const node = this.entityGraph.getNode(centralNode.id)
    const entityType = node?.type || 'unknown'

    if (entityType === 'person' && centralNode.degree >= 5) {
      return 'high - person with extensive connections suggests key role'
    } else if (entityType === 'document' && centralNode.degree >= 3) {
      return 'high - document referenced across multiple contexts'
    } else if (centralNode.degree >= 4) {
      return 'medium - entity with significant connectivity'
    } else {
      return 'low - limited connectivity pattern'
    }
  }

  assessPathwayLegalSignificance(pathway) {
    const bridgeNode = this.entityGraph.getNode(pathway.bridge_node)
    const entityType = bridgeNode?.type || 'unknown'

    if (entityType === 'person' && pathway.centrality_score > 2) {
      return 'high - person acts as key intermediary'
    } else if (entityType === 'document' && pathway.centrality_score > 1) {
      return 'medium - document connects disparate information'
    } else if (pathway.pathway_significance > 0.7) {
      return 'medium - significant bridging entity'
    } else {
      return 'low - minor pathway connection'
    }
  }

  // Additional analysis methods
  analyzeEntityCoherence(entities, documents) {
    const coherenceScores = new Map()

    entities.forEach(entity => {
      let coherenceScore = entity.confidence || 0.5

      // Check consistency across documents
      const documentTypes = entity.source_documents.map(docId => {
        const doc = documents.find(d => d.id === docId)
        return doc?.type || 'unknown'
      })

      const uniqueDocTypes = new Set(documentTypes)
      if (uniqueDocTypes.size === 1) {
        coherenceScore += 0.1 // Same document type bonus
      }

      // Check for contradictory relationships
      const entityRelationships = this.getEntityRelationships(entity.id)
      const contradictoryRels = entityRelationships.filter(rel => rel.type === 'contradictory').length
      
      if (contradictoryRels > 0) {
        coherenceScore -= contradictoryRels * 0.1
      }

      coherenceScores.set(entity.id, Math.max(0.1, Math.min(1.0, coherenceScore)))
    })

    return coherenceScores
  }

  getEntityRelationships(entityId) {
    const relationships = []
    const neighbors = this.entityGraph.getNeighbors(entityId)

    neighbors.forEach(neighborId => {
      const edge = this.entityGraph.getEdge(entityId, neighborId)
      if (edge) {
        relationships.push({
          target: neighborId,
          type: edge.type,
          strength: edge.strength,
          evidence: edge.evidence
        })
      }
    })

    return relationships
  }

  generateRelationshipReport(entities, documents) {
    const patterns = this.buildRelationshipGraph(entities, documents)
    const graphData = this.entityGraph.exportGraphData()
    const coherenceScores = this.analyzeEntityCoherence(entities, documents)

    return {
      analysis_summary: {
        total_entities: entities.length,
        total_relationships: graphData.edges.length,
        graph_density: graphData.metrics.density,
        community_count: patterns.community_patterns.length,
        influence_hubs: patterns.influence_patterns.length,
        connection_pathways: patterns.pathway_patterns.length
      },
      relationship_patterns: patterns,
      graph_metrics: graphData.metrics,
      entity_coherence: Array.from(coherenceScores.entries()).map(([id, score]) => ({ id, score })),
      privacy_compliance: {
        anonymization_status: 'All entity values anonymized',
        pattern_analysis_only: true,
        no_personal_data_retained: true
      },
      analysis_metadata: {
        analyzer_version: '1.0.0',
        analysis_timestamp: new Date().toISOString(),
        confidence_threshold: 0.7,
        relationship_types_detected: this.getUniqueRelationshipTypes()
      }
    }
  }

  getUniqueRelationshipTypes() {
    const types = new Set()
    const edges = this.entityGraph.getAllEdges()

    edges.forEach(([edgeId, data]) => {
      if (data.type) {
        types.add(data.type)
      }
    })

    return Array.from(types)
  }
}

export default EntityRelationshipMapper