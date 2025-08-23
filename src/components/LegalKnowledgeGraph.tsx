/**
 * Legal Knowledge Graph - Revolutionary Relationship Visualization
 * Visualizes connections between cases, documents, people, legal concepts, and precedents
 */

import React, { useState, useEffect, useRef } from 'react';

interface GraphNode {
  id: string;
  type: 'case' | 'document' | 'person' | 'legal_concept' | 'precedent' | 'statute' | 'issue' | 'evidence';
  label: string;
  metadata: {
    practiceArea?: 'criminal' | 'civil' | 'poca' | 'mixed';
    importance?: number; // 0-1 scale
    caseReferences?: string[];
    documentIds?: string[];
    legalPrinciples?: string[];
    timeline?: string;
    status?: string;
    [key: string]: any;
  };
  position?: { x: number; y: number };
  connections: string[]; // Array of connected node IDs
  strength?: number; // Connection strength 0-1
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'cites' | 'contradicts' | 'supports' | 'involves' | 'references' | 'similar' | 'precedent' | 'timeline';
  weight: number; // 0-1 scale for visual thickness
  metadata?: {
    confidence?: number;
    description?: string;
    evidenceCount?: number;
    [key: string]: any;
  };
}

interface GraphCluster {
  id: string;
  name: string;
  nodeIds: string[];
  color: string;
  centroid?: { x: number; y: number };
}

interface InsightCard {
  id: string;
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk' | 'precedent' | 'timeline';
  title: string;
  description: string;
  confidence: number;
  relatedNodes: string[];
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface LegalKnowledgeGraphProps {
  isOpen: boolean;
  onClose: () => void;
  caseContext?: {
    caseId: string;
    practiceArea: 'criminal' | 'civil' | 'poca' | 'mixed';
  };
  onNodeSelect?: (node: GraphNode) => void;
  onInsightSelect?: (insight: InsightCard) => void;
}

export const LegalKnowledgeGraph: React.FC<LegalKnowledgeGraphProps> = ({
  isOpen,
  onClose,
  caseContext,
  onNodeSelect,
  onInsightSelect
}) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [clusters, setClusters] = useState<GraphCluster[]>([]);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'case_focused' | 'timeline' | 'precedents'>('full');
  const [filterType, setFilterType] = useState<'all' | GraphNode['type']>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'insights' | 'details' | 'analysis' | 'export'>('insights');

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      generateKnowledgeGraph();
    }
  }, [isOpen, caseContext]);

  const generateKnowledgeGraph = async (): Promise<void> => {
    setIsGenerating(true);
    
    try {
      // Simulate knowledge graph generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const graphData = buildLegalKnowledgeGraph(caseContext);
      setNodes(graphData.nodes);
      setEdges(graphData.edges);
      setClusters(graphData.clusters);
      setInsights(graphData.insights);
      
    } catch (error) {
      console.error('Knowledge graph generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const buildLegalKnowledgeGraph = (context?: any) => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const clusters: GraphCluster[] = [];
    const insights: InsightCard[] = [];

    // Create sample nodes for demonstration
    const sampleNodes = [
      {
        id: 'case_current',
        type: 'case' as const,
        label: context?.caseId || 'R v Smith [2023]',
        metadata: {
          practiceArea: context?.practiceArea || 'criminal',
          importance: 1.0,
          status: 'active',
          timeline: '2023-03-15'
        },
        position: { x: 400, y: 300 },
        connections: ['doc_statement', 'person_smith', 'precedent_jones', 'concept_fraud']
      },
      {
        id: 'doc_statement',
        type: 'document' as const,
        label: 'Witness Statement - Jones',
        metadata: {
          importance: 0.8,
          documentType: 'witness_statement',
          timeline: '2023-03-16'
        },
        position: { x: 200, y: 200 },
        connections: ['case_current', 'person_jones', 'evidence_cctv']
      },
      {
        id: 'person_smith',
        type: 'person' as const,
        label: 'John Smith (Defendant)',
        metadata: {
          importance: 0.9,
          role: 'defendant',
          timeline: '2023-03-15'
        },
        position: { x: 600, y: 200 },
        connections: ['case_current', 'case_related', 'concept_intent']
      },
      {
        id: 'precedent_jones',
        type: 'precedent' as const,
        label: 'R v Jones [2022] EWCA Crim 456',
        metadata: {
          importance: 0.7,
          jurisdiction: 'England & Wales',
          timeline: '2022-08-15'
        },
        position: { x: 300, y: 100 },
        connections: ['case_current', 'concept_fraud', 'statute_theft']
      },
      {
        id: 'concept_fraud',
        type: 'legal_concept' as const,
        label: 'Fraud by Misrepresentation',
        metadata: {
          importance: 0.85,
          legalPrinciples: ['dishonesty', 'misrepresentation', 'intent'],
          precedents: ['precedent_jones']
        },
        position: { x: 500, y: 100 },
        connections: ['case_current', 'precedent_jones', 'person_smith']
      },
      {
        id: 'evidence_cctv',
        type: 'evidence' as const,
        label: 'CCTV Evidence',
        metadata: {
          importance: 0.6,
          evidenceType: 'video',
          timeline: '2023-03-15'
        },
        position: { x: 100, y: 300 },
        connections: ['doc_statement', 'case_current']
      },
      {
        id: 'case_related',
        type: 'case' as const,
        label: 'R v Smith [2021] Crown Court',
        metadata: {
          practiceArea: 'criminal' as const,
          importance: 0.6,
          status: 'concluded',
          timeline: '2021-11-20'
        },
        position: { x: 700, y: 300 },
        connections: ['person_smith', 'concept_precedent']
      },
      {
        id: 'person_jones',
        type: 'person' as const,
        label: 'Michael Jones (Witness)',
        metadata: {
          importance: 0.7,
          role: 'witness',
          credibility: 0.8
        },
        position: { x: 150, y: 150 },
        connections: ['doc_statement', 'evidence_cctv']
      }
    ];

    // Create edges between connected nodes
    sampleNodes.forEach(node => {
      node.connections.forEach(targetId => {
        const targetNode = sampleNodes.find(n => n.id === targetId);
        if (targetNode) {
          const edgeType = determineEdgeType(node.type, targetNode.type);
          edges.push({
            id: `${node.id}_${targetId}`,
            source: node.id,
            target: targetId,
            type: edgeType,
            weight: calculateEdgeWeight(node, targetNode),
            metadata: {
              confidence: 0.8 + Math.random() * 0.2,
              description: generateEdgeDescription(node, targetNode, edgeType)
            }
          });
        }
      });
    });

    nodes.push(...sampleNodes);

    // Create clusters
    clusters.push(
      {
        id: 'cluster_case',
        name: 'Current Case',
        nodeIds: ['case_current', 'doc_statement', 'evidence_cctv'],
        color: '#3b82f6'
      },
      {
        id: 'cluster_people',
        name: 'People Involved',
        nodeIds: ['person_smith', 'person_jones'],
        color: '#8b5cf6'
      },
      {
        id: 'cluster_legal',
        name: 'Legal Framework',
        nodeIds: ['precedent_jones', 'concept_fraud'],
        color: '#059669'
      }
    );

    // Generate insights
    insights.push(
      {
        id: 'insight_1',
        type: 'pattern',
        title: 'Strong Precedent Connection',
        description: 'R v Jones [2022] shares 3 key legal principles with current case, strengthening fraud arguments',
        confidence: 0.92,
        relatedNodes: ['precedent_jones', 'concept_fraud', 'case_current'],
        actionable: true,
        priority: 'high'
      },
      {
        id: 'insight_2',
        type: 'anomaly',
        title: 'Timeline Inconsistency',
        description: 'CCTV timestamp conflicts with witness statement by 30 minutes',
        confidence: 0.85,
        relatedNodes: ['evidence_cctv', 'doc_statement'],
        actionable: true,
        priority: 'critical'
      },
      {
        id: 'insight_3',
        type: 'opportunity',
        title: 'Character Evidence Available',
        description: 'Previous case shows pattern that could support/undermine current charges',
        confidence: 0.78,
        relatedNodes: ['case_related', 'person_smith'],
        actionable: true,
        priority: 'medium'
      },
      {
        id: 'insight_4',
        type: 'precedent',
        title: 'Similar Fact Evidence',
        description: 'Jones precedent allows similar fact evidence in fraud cases with dishonesty patterns',
        confidence: 0.89,
        relatedNodes: ['precedent_jones', 'concept_fraud'],
        actionable: true,
        priority: 'high'
      }
    );

    return { nodes, edges, clusters, insights };
  };

  const determineEdgeType = (sourceType: string, targetType: string): GraphEdge['type'] => {
    if (sourceType === 'case' && targetType === 'precedent') return 'cites';
    if (sourceType === 'document' && targetType === 'person') return 'involves';
    if (sourceType === 'case' && targetType === 'legal_concept') return 'references';
    if (sourceType === 'precedent' && targetType === 'legal_concept') return 'supports';
    return 'references';
  };

  const calculateEdgeWeight = (source: GraphNode, target: GraphNode): number => {
    const importanceWeight = (source.metadata.importance || 0.5) * (target.metadata.importance || 0.5);
    return Math.min(0.9, Math.max(0.1, importanceWeight + Math.random() * 0.2));
  };

  const generateEdgeDescription = (source: GraphNode, target: GraphNode, type: string): string => {
    const descriptions = {
      cites: `${source.label} cites ${target.label}`,
      involves: `${source.label} involves ${target.label}`,
      references: `${source.label} references ${target.label}`,
      supports: `${source.label} supports ${target.label}`,
      contradicts: `${source.label} contradicts ${target.label}`
    };
    return descriptions[type as keyof typeof descriptions] || `${source.label} relates to ${target.label}`;
  };

  const getNodeColor = (node: GraphNode): string => {
    const colors = {
      case: '#3b82f6',
      document: '#10b981',
      person: '#8b5cf6',
      legal_concept: '#f59e0b',
      precedent: '#ef4444',
      statute: '#6366f1',
      issue: '#f97316',
      evidence: '#06b6d4'
    };
    return colors[node.type];
  };

  const getNodeIcon = (type: GraphNode['type']): string => {
    const icons = {
      case: '⚖️',
      document: '📄',
      person: '👤',
      legal_concept: '💡',
      precedent: '📚',
      statute: '📜',
      issue: '❗',
      evidence: '🔍'
    };
    return icons[type];
  };

  const handleNodeClick = (node: GraphNode): void => {
    setSelectedNode(node);
    onNodeSelect?.(node);
  };

  const filteredNodes = nodes.filter(node => 
    filterType === 'all' || node.type === filterType
  ).filter(node =>
    !searchQuery || node.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEdges = edges.filter(edge =>
    filteredNodes.some(n => n.id === edge.source) && 
    filteredNodes.some(n => n.id === edge.target)
  );

  if (!isOpen) return null;

  return (
    <div className="legal-knowledge-graph">
      <div className="graph-overlay" onClick={onClose}>
        <div className="graph-container" onClick={(e) => e.stopPropagation()}>
          <div className="graph-header">
            <div className="graph-title-section">
              <h2>🧠 Legal Knowledge Graph</h2>
              <span className="graph-subtitle">
                Revolutionary relationship mapping and insight discovery
              </span>
            </div>
            <div className="graph-controls">
              <div className="view-modes">
                {(['full', 'case_focused', 'timeline', 'precedents'] as const).map(mode => (
                  <button
                    key={mode}
                    className={`view-mode-btn ${viewMode === mode ? 'active' : ''}`}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <button className="graph-close-btn" onClick={onClose}>✕</button>
            </div>
          </div>

          <div className="graph-content">
            <div className="graph-sidebar">
              <div className="graph-sidebar-tabs">
                <button
                  className={`sidebar-tab ${sidebarTab === 'insights' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('insights')}
                >
                  💡 Insights
                </button>
                <button
                  className={`sidebar-tab ${sidebarTab === 'details' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('details')}
                >
                  📋 Details
                </button>
                <button
                  className={`sidebar-tab ${sidebarTab === 'analysis' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('analysis')}
                >
                  📊 Analysis
                </button>
              </div>

              <div className="sidebar-content">
                {sidebarTab === 'insights' && (
                  <div className="insights-panel">
                    <h3>🔍 AI Insights ({insights.length})</h3>
                    <div className="insights-list">
                      {insights.map(insight => (
                        <div
                          key={insight.id}
                          className={`insight-card ${insight.type} ${insight.priority}`}
                          onClick={() => onInsightSelect?.(insight)}
                        >
                          <div className="insight-header">
                            <div className="insight-type-icon">
                              {insight.type === 'pattern' && '🧩'}
                              {insight.type === 'anomaly' && '🚨'}
                              {insight.type === 'opportunity' && '💎'}
                              {insight.type === 'risk' && '⚠️'}
                              {insight.type === 'precedent' && '📚'}
                              {insight.type === 'timeline' && '⏰'}
                            </div>
                            <div className="insight-priority">
                              <span className={`priority-badge ${insight.priority}`}>
                                {insight.priority.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <h4 className="insight-title">{insight.title}</h4>
                          <p className="insight-description">{insight.description}</p>
                          <div className="insight-meta">
                            <span className="insight-confidence">
                              {Math.round(insight.confidence * 100)}% confidence
                            </span>
                            {insight.actionable && (
                              <span className="actionable-badge">Actionable</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sidebarTab === 'details' && selectedNode && (
                  <div className="node-details">
                    <h3>📋 Node Details</h3>
                    <div className="node-info">
                      <div className="node-icon-label">
                        <span className="node-detail-icon">{getNodeIcon(selectedNode.type)}</span>
                        <div className="node-detail-text">
                          <h4>{selectedNode.label}</h4>
                          <span className="node-type">{selectedNode.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                      
                      <div className="node-metadata">
                        {Object.entries(selectedNode.metadata).map(([key, value]) => (
                          <div key={key} className="metadata-item">
                            <span className="metadata-key">{key}:</span>
                            <span className="metadata-value">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="node-connections">
                        <h5>Connected to ({selectedNode.connections.length}):</h5>
                        <div className="connection-list">
                          {selectedNode.connections.map(connId => {
                            const connectedNode = nodes.find(n => n.id === connId);
                            return connectedNode ? (
                              <div key={connId} className="connection-item">
                                <span className="connection-icon">{getNodeIcon(connectedNode.type)}</span>
                                <span className="connection-label">{connectedNode.label}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {sidebarTab === 'analysis' && (
                  <div className="graph-analysis">
                    <h3>📊 Graph Analysis</h3>
                    <div className="analysis-metrics">
                      <div className="metric">
                        <span className="metric-label">Total Nodes:</span>
                        <span className="metric-value">{nodes.length}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Total Connections:</span>
                        <span className="metric-value">{edges.length}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Clusters:</span>
                        <span className="metric-value">{clusters.length}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Critical Insights:</span>
                        <span className="metric-value">
                          {insights.filter(i => i.priority === 'critical').length}
                        </span>
                      </div>
                    </div>

                    <div className="cluster-analysis">
                      <h4>🎯 Cluster Analysis:</h4>
                      {clusters.map(cluster => (
                        <div key={cluster.id} className="cluster-item">
                          <div className="cluster-header">
                            <span 
                              className="cluster-color" 
                              style={{ backgroundColor: cluster.color }}
                            />
                            <span className="cluster-name">{cluster.name}</span>
                            <span className="cluster-size">({cluster.nodeIds.length})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="graph-main">
              <div className="graph-toolbar">
                <div className="search-section">
                  <input
                    type="text"
                    placeholder="Search nodes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="graph-search"
                  />
                </div>
                
                <div className="filter-section">
                  <label>Filter:</label>
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="graph-filter"
                  >
                    <option value="all">All Types</option>
                    <option value="case">Cases</option>
                    <option value="document">Documents</option>
                    <option value="person">People</option>
                    <option value="precedent">Precedents</option>
                    <option value="legal_concept">Legal Concepts</option>
                    <option value="evidence">Evidence</option>
                  </select>
                </div>

                <div className="graph-actions">
                  <button className="graph-btn">🔄 Refresh</button>
                  <button className="graph-btn">📸 Export</button>
                  <button className="graph-btn">🎯 Focus</button>
                </div>
              </div>

              <div className="graph-visualization" ref={containerRef}>
                {isGenerating ? (
                  <div className="graph-loading">
                    <div className="loading-spinner">🧠</div>
                    <p>Generating knowledge graph...</p>
                    <span className="loading-subtext">Analyzing relationships and patterns</span>
                  </div>
                ) : (
                  <svg 
                    ref={svgRef}
                    width="100%" 
                    height="100%" 
                    className="knowledge-graph-svg"
                  >
                    {/* Render edges */}
                    {filteredEdges.map(edge => {
                      const sourceNode = filteredNodes.find(n => n.id === edge.source);
                      const targetNode = filteredNodes.find(n => n.id === edge.target);
                      if (!sourceNode || !targetNode) return null;

                      return (
                        <line
                          key={edge.id}
                          x1={sourceNode.position?.x || 0}
                          y1={sourceNode.position?.y || 0}
                          x2={targetNode.position?.x || 0}
                          y2={targetNode.position?.y || 0}
                          stroke="#cbd5e0"
                          strokeWidth={edge.weight * 3}
                          strokeOpacity={0.6}
                          className="graph-edge"
                        />
                      );
                    })}

                    {/* Render nodes */}
                    {filteredNodes.map(node => (
                      <g key={node.id} className="graph-node">
                        <circle
                          cx={node.position?.x || 0}
                          cy={node.position?.y || 0}
                          r={15 + (node.metadata.importance || 0.5) * 10}
                          fill={getNodeColor(node)}
                          stroke={selectedNode?.id === node.id ? '#2d3748' : 'white'}
                          strokeWidth={selectedNode?.id === node.id ? 3 : 2}
                          className="node-circle"
                          onClick={() => handleNodeClick(node)}
                        />
                        <text
                          x={node.position?.x || 0}
                          y={(node.position?.y || 0) + 30}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#4a5568"
                          className="node-label"
                        >
                          {node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalKnowledgeGraph;