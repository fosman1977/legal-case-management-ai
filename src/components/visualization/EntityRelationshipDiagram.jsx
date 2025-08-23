/**
 * Entity Relationship Diagram - Week 16 Day 4-5
 * Interactive visualization of entities and their relationships
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTheme } from '../../design/ThemeProvider.jsx';
import Card, { CardHeader, CardContent } from '../../design/components/Card.jsx';
import Button from '../../design/components/Button.jsx';

// Icon Components
const XMarkIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BuildingIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const CalendarIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Utility functions
const getEntityGroup = (type) => {
  const groups = {
    person: 1,
    company: 2,
    date: 3,
    document: 4,
    location: 5
  };
  return groups[type] || 0;
};

const calculateEntitySize = (entity) => {
  const baseSize = 20;
  const importanceMultiplier = entity.importance || 1;
  return baseSize * Math.sqrt(importanceMultiplier);
};

const calculateEntityImportance = (entity, relationships) => {
  const connectionCount = relationships.filter(
    r => r.entity1 === entity.id || r.entity2 === entity.id
  ).length;
  return Math.min(connectionCount * 0.5 + 1, 3);
};

const getEntityColor = (type) => {
  const colors = {
    person: '#3b82f6',      // Blue
    company: '#10b981',     // Green
    date: '#f59e0b',        // Amber
    document: '#8b5cf6',    // Purple
    location: '#ef4444',    // Red
    default: '#6b7280'      // Gray
  };
  return colors[type] || colors.default;
};

const getRelationshipColor = (type) => {
  const colors = {
    contractual: '#3b82f6',
    financial: '#10b981',
    communication: '#8b5cf6',
    temporal: '#f59e0b',
    default: '#9ca3af'
  };
  return colors[type] || colors.default;
};

const getEntityIcon = (type) => {
  const icons = {
    person: UserIcon,
    company: BuildingIcon,
    date: CalendarIcon,
    document: DocumentIcon
  };
  return icons[type] || DocumentIcon;
};

// Entity Details Panel Component
const EntityDetailsPanel = ({ entity, relationships, onClose }) => {
  const { tokens } = useTheme();
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: tokens.spacing[4],
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 style={{ 
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.medium,
            margin: 0
          }}>
            Entity Details
          </h4>
          <button
            onClick={onClose}
            style={{
              padding: tokens.spacing[1],
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: tokens.colors.neutral[400]
            }}
          >
            <XMarkIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: tokens.spacing[4],
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing[4]
      }}>
        {/* Entity Information */}
        <div>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing[2],
            marginBottom: tokens.spacing[3]
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: getEntityColor(entity.type),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {React.createElement(getEntityIcon(entity.type), {
                style: { width: '20px', height: '20px', color: 'white' }
              })}
            </div>
            <div>
              <h5 style={{ 
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.colors.neutral[900],
                margin: 0
              }}>
                {entity.label}
              </h5>
              <span style={{
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.neutral[500],
                textTransform: 'capitalize'
              }}>
                {entity.type}
              </span>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing[2],
            fontSize: tokens.typography.fontSize.sm
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.colors.neutral[500] }}>Importance:</span>
              <span style={{ 
                fontWeight: tokens.typography.fontWeight.medium,
                color: entity.importance > 2 ? tokens.colors.error[600] : tokens.colors.neutral[700]
              }}>
                {entity.importance > 2 ? 'High' : entity.importance > 1 ? 'Medium' : 'Low'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.colors.neutral[500] }}>Connections:</span>
              <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>
                {relationships.length}
              </span>
            </div>
          </div>
        </div>

        {/* Relationships */}
        {relationships.length > 0 && (
          <div>
            <h6 style={{ 
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.neutral[900],
              marginBottom: tokens.spacing[2],
              margin: `0 0 ${tokens.spacing[2]} 0`
            }}>
              Relationships
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[2] }}>
              {relationships.map((rel, index) => (
                <div key={index} style={{
                  padding: tokens.spacing[2],
                  backgroundColor: tokens.colors.neutral[50],
                  borderRadius: tokens.borderRadius.md,
                  borderLeft: `3px solid ${getRelationshipColor(rel.type)}`
                }}>
                  <div style={{ 
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    marginBottom: tokens.spacing[1]
                  }}>
                    {rel.targetLabel}
                  </div>
                  <div style={{ 
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.neutral[600]
                  }}>
                    {rel.type} ({Math.round(rel.strength * 100)}% strength)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simplified D3-like Force Graph Component
const ForceGraph = ({ nodes, links, selectedEntity, onEntitySelect }) => {
  const { tokens } = useTheme();
  const svgRef = useRef();
  const [dimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    svgRef.current.innerHTML = '';

    const svg = svgRef.current;
    
    // Simple force simulation
    const nodePositions = {};
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2;
      const radius = 200;
      nodePositions[node.id] = {
        x: dimensions.width / 2 + Math.cos(angle) * radius,
        y: dimensions.height / 2 + Math.sin(angle) * radius
      };
    });

    // Draw links
    links.forEach(link => {
      const source = nodePositions[link.source];
      const target = nodePositions[link.target];
      
      if (source && target) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', source.x);
        line.setAttribute('y1', source.y);
        line.setAttribute('x2', target.x);
        line.setAttribute('y2', target.y);
        line.setAttribute('stroke', getRelationshipColor(link.type));
        line.setAttribute('stroke-width', Math.max(1, link.strength * 3));
        line.setAttribute('opacity', '0.6');
        svg.appendChild(line);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = nodePositions[node.id];
      
      // Node group
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
      g.style.cursor = 'pointer';
      
      // Node circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', node.size);
      circle.setAttribute('fill', getEntityColor(node.type));
      circle.setAttribute('stroke', selectedEntity?.id === node.id ? tokens.colors.primary[600] : 'white');
      circle.setAttribute('stroke-width', selectedEntity?.id === node.id ? '3' : '2');
      g.appendChild(circle);
      
      // Node label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '0.35em');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-weight', '500');
      text.setAttribute('fill', tokens.colors.neutral[700]);
      text.textContent = node.label.length > 12 ? node.label.substring(0, 12) + '...' : node.label;
      g.appendChild(text);
      
      // Click handler
      g.onclick = () => onEntitySelect(node);
      
      svg.appendChild(g);
    });

  }, [nodes, links, selectedEntity, dimensions]);

  return (
    <svg
      ref={svgRef}
      width={dimensions.width}
      height={dimensions.height}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      style={{ 
        width: '100%', 
        height: '100%',
        border: `1px solid ${tokens.colors.neutral[200]}`,
        borderRadius: tokens.borderRadius.lg,
        backgroundColor: tokens.colors.neutral[25]
      }}
    />
  );
};

// Main Entity Relationship Diagram Component
export const EntityRelationshipDiagram = ({ entities = [], relationships = [] }) => {
  const { tokens } = useTheme();
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Process data
  const processedData = useMemo(() => {
    // Filter entities by type
    const filteredEntities = filterType === 'all' 
      ? entities 
      : entities.filter(e => e.type === filterType);

    // Create nodes from entities
    const nodes = filteredEntities.map(entity => ({
      id: entity.id,
      label: entity.anonymized_value || entity.name || entity.id,
      type: entity.type,
      group: getEntityGroup(entity.type),
      size: calculateEntitySize(entity),
      importance: calculateEntityImportance(entity, relationships)
    }));

    // Filter relationships for visible entities
    const entityIds = new Set(nodes.map(n => n.id));
    const filteredRelationships = relationships.filter(
      rel => entityIds.has(rel.entity1) && entityIds.has(rel.entity2)
    );

    // Create links from relationships
    const links = filteredRelationships.map(rel => ({
      source: rel.entity1,
      target: rel.entity2,
      type: rel.relationship_type || 'default',
      strength: rel.strength || 0.5,
      evidence: rel.supporting_evidence
    }));

    return { nodes, links };
  }, [entities, relationships, filterType]);

  // Get relationships for selected entity
  const getEntityRelationships = (entity) => {
    if (!entity) return [];
    
    return relationships
      .filter(r => r.entity1 === entity.id || r.entity2 === entity.id)
      .map(r => {
        const isSource = r.entity1 === entity.id;
        const targetId = isSource ? r.entity2 : r.entity1;
        const targetEntity = entities.find(e => e.id === targetId);
        
        return {
          type: r.relationship_type || 'related',
          strength: r.strength || 0.5,
          targetLabel: targetEntity?.anonymized_value || targetEntity?.name || targetId,
          targetType: targetEntity?.type
        };
      });
  };

  const entityTypes = [
    { id: 'all', label: 'All Entities', count: entities.length },
    { id: 'person', label: 'People', count: entities.filter(e => e.type === 'person').length },
    { id: 'company', label: 'Companies', count: entities.filter(e => e.type === 'company').length },
    { id: 'date', label: 'Dates', count: entities.filter(e => e.type === 'date').length },
    { id: 'document', label: 'Documents', count: entities.filter(e => e.type === 'document').length }
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: tokens.colors.neutral[50],
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        padding: tokens.spacing[4]
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ 
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.neutral[900],
            margin: 0
          }}>
            Entity Relationships
          </h3>
          <Button variant="secondary" size="sm">
            Export Diagram
          </Button>
        </div>

        {/* Entity Type Filters */}
        <div style={{ 
          marginTop: tokens.spacing[4],
          display: 'flex',
          gap: tokens.spacing[2]
        }}>
          {entityTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              style={{
                padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
                borderRadius: tokens.borderRadius.full,
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.medium,
                cursor: 'pointer',
                transition: tokens.transitions.all,
                backgroundColor: filterType === type.id ? tokens.colors.primary[100] : tokens.colors.neutral[100],
                color: filterType === type.id ? tokens.colors.primary[700] : tokens.colors.neutral[700],
                border: `2px solid ${filterType === type.id ? tokens.colors.primary[300] : tokens.colors.neutral[300]}`
              }}
            >
              {type.label} ({type.count})
            </button>
          ))}
        </div>
      </div>

      {/* Visualization Area */}
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 1, padding: tokens.spacing[4] }}>
          <ForceGraph
            nodes={processedData.nodes}
            links={processedData.links}
            selectedEntity={selectedEntity}
            onEntitySelect={setSelectedEntity}
          />
        </div>
        
        {selectedEntity && (
          <div style={{ 
            width: '320px',
            borderLeft: `1px solid ${tokens.colors.neutral[200]}`,
            backgroundColor: tokens.colors.neutral[50]
          }}>
            <EntityDetailsPanel 
              entity={selectedEntity}
              relationships={getEntityRelationships(selectedEntity)}
              onClose={() => setSelectedEntity(null)}
            />
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div style={{ 
        backgroundColor: tokens.colors.neutral[100],
        borderTop: `1px solid ${tokens.colors.neutral[200]}`,
        padding: tokens.spacing[3],
        display: 'flex',
        gap: tokens.spacing[6],
        fontSize: tokens.typography.fontSize.sm
      }}>
        <div>
          <span style={{ color: tokens.colors.neutral[500] }}>Total Entities: </span>
          <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>
            {processedData.nodes.length}
          </span>
        </div>
        <div>
          <span style={{ color: tokens.colors.neutral[500] }}>Relationships: </span>
          <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>
            {processedData.links.length}
          </span>
        </div>
        <div>
          <span style={{ color: tokens.colors.neutral[500] }}>Network Density: </span>
          <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>
            {processedData.nodes.length > 0 
              ? Math.round((processedData.links.length / processedData.nodes.length) * 100) / 100
              : 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EntityRelationshipDiagram;