/**
 * Resource Optimization Intelligence
 * AI-powered system for optimizing practice resources, workflows, and efficiency
 */

import React, { useState, useEffect } from 'react';

interface ResourceMetrics {
  id: string;
  category: 'time' | 'cost' | 'capacity' | 'quality' | 'efficiency';
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: Date;
  benchmark: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface OptimizationOpportunity {
  id: string;
  type: 'workflow' | 'automation' | 'training' | 'technology' | 'process' | 'allocation';
  title: string;
  description: string;
  impact: {
    timeImprovement: number; // percentage
    costSavings: number; // percentage or absolute
    qualityImprovement: number; // percentage
    riskReduction: number; // percentage
  };
  effort: {
    level: 'low' | 'medium' | 'high' | 'very_high';
    timeToImplement: string;
    resourcesRequired: string[];
    complexity: number; // 1-10
  };
  roi: {
    timeframe: '1month' | '3months' | '6months' | '1year';
    multiple: number; // ROI multiplier
    confidence: number; // 0-1
  };
  implementation: {
    phases: {
      phase: string;
      duration: string;
      deliverables: string[];
      dependencies: string[];
    }[];
    risks: string[];
    successCriteria: string[];
  };
  category: string[];
  affectedDepartments: string[];
  status: 'identified' | 'planned' | 'in_progress' | 'completed' | 'on_hold';
}

interface WorkflowAnalysis {
  id: string;
  workflowName: string;
  currentState: {
    steps: {
      step: string;
      duration: number; // minutes
      efficiency: number; // 0-1
      automation: number; // 0-1
      bottleneck: boolean;
      errorRate: number; // 0-1
    }[];
    totalDuration: number;
    overallEfficiency: number;
    bottlenecks: string[];
    redundancies: string[];
  };
  optimizedState: {
    proposedChanges: string[];
    newDuration: number;
    efficiencyGain: number;
    automationOpportunities: string[];
    eliminatedSteps: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

interface CapacityAnalysis {
  id: string;
  resource: string;
  type: 'personnel' | 'technology' | 'space' | 'equipment';
  utilization: {
    current: number; // 0-1
    optimal: number; // 0-1
    peak: number; // 0-1
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  capacity: {
    current: number;
    maximum: number;
    planned: number;
    unit: string;
  };
  constraints: {
    factor: string;
    impact: number; // 0-1
    mitigation: string[];
  }[];
  expansion: {
    options: {
      option: string;
      cost: number;
      capacity_increase: number;
      timeframe: string;
      risks: string[];
    }[];
    recommendation: string;
  };
}

interface PerformanceKPI {
  id: string;
  name: string;
  category: 'productivity' | 'quality' | 'efficiency' | 'client_satisfaction' | 'financial';
  value: number;
  target: number;
  benchmark: number;
  unit: string;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  factors: {
    factor: string;
    correlation: number; // -1 to 1
    controllable: boolean;
  }[];
  actionItems: string[];
}

interface ResourceOptimizationIntelligenceProps {
  practiceData?: {
    metrics: ResourceMetrics[];
    workflows: any[];
    performance: any[];
  };
  onOptimizationImplemented?: (opportunity: OptimizationOpportunity) => void;
  onWorkflowUpdated?: (workflow: WorkflowAnalysis) => void;
}

export const ResourceOptimizationIntelligence: React.FC<ResourceOptimizationIntelligenceProps> = ({
  practiceData,
  onOptimizationImplemented,
  onWorkflowUpdated
}) => {
  const [metrics, setMetrics] = useState<ResourceMetrics[]>([]);
  const [opportunities, setOpportunities] = useState<OptimizationOpportunity[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowAnalysis[]>([]);
  const [capacity, setCapacity] = useState<CapacityAnalysis[]>([]);
  const [kpis, setKpis] = useState<PerformanceKPI[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'workflows' | 'capacity' | 'performance'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1month' | '3months' | '6months' | '1year'>('3months');

  useEffect(() => {
    initializeOptimizationSystem();
  }, [practiceData]);

  const initializeOptimizationSystem = async (): Promise<void> => {
    setIsAnalyzing(true);
    
    try {
      // Simulate resource analysis
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const generatedMetrics = generateResourceMetrics();
      const generatedOpportunities = generateOptimizationOpportunities();
      const generatedWorkflows = generateWorkflowAnalysis();
      const generatedCapacity = generateCapacityAnalysis();
      const generatedKPIs = generatePerformanceKPIs();
      
      setMetrics(generatedMetrics);
      setOpportunities(generatedOpportunities);
      setWorkflows(generatedWorkflows);
      setCapacity(generatedCapacity);
      setKpis(generatedKPIs);
      
    } catch (error) {
      console.error('Optimization system initialization failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateResourceMetrics = (): ResourceMetrics[] => {
    return [
      {
        id: 'metric_time_utilization',
        category: 'time',
        name: 'Billable Hour Utilization',
        currentValue: 68,
        targetValue: 85,
        unit: '%',
        trend: 'improving',
        lastUpdated: new Date(),
        benchmark: 75,
        priority: 'high'
      },
      {
        id: 'metric_cost_efficiency',
        category: 'cost',
        name: 'Cost per Case Hour',
        currentValue: 245,
        targetValue: 200,
        unit: '£',
        trend: 'declining',
        lastUpdated: new Date(),
        benchmark: 220,
        priority: 'critical'
      },
      {
        id: 'metric_quality_score',
        category: 'quality',
        name: 'Client Satisfaction Score',
        currentValue: 8.2,
        targetValue: 9.0,
        unit: '/10',
        trend: 'stable',
        lastUpdated: new Date(),
        benchmark: 8.5,
        priority: 'medium'
      },
      {
        id: 'metric_efficiency_ratio',
        category: 'efficiency',
        name: 'Task Completion Efficiency',
        currentValue: 72,
        targetValue: 90,
        unit: '%',
        trend: 'improving',
        lastUpdated: new Date(),
        benchmark: 80,
        priority: 'high'
      }
    ];
  };

  const generateOptimizationOpportunities = (): OptimizationOpportunity[] => {
    return [
      {
        id: 'opp_document_automation',
        type: 'automation',
        title: 'Automated Document Assembly and Review',
        description: 'Implement AI-powered document generation and review system to reduce manual drafting time by 60% and improve consistency across all practice areas.',
        impact: {
          timeImprovement: 60,
          costSavings: 35,
          qualityImprovement: 25,
          riskReduction: 40
        },
        effort: {
          level: 'medium',
          timeToImplement: '3-4 months',
          resourcesRequired: ['Document AI platform', 'Template library development', 'Staff training'],
          complexity: 6
        },
        roi: {
          timeframe: '6months',
          multiple: 4.2,
          confidence: 0.88
        },
        implementation: {
          phases: [
            {
              phase: 'Assessment and Planning',
              duration: '3 weeks',
              deliverables: ['Current process mapping', 'Technology selection', 'Implementation plan'],
              dependencies: ['Management approval', 'Budget allocation']
            },
            {
              phase: 'System Setup and Integration',
              duration: '6 weeks',
              deliverables: ['Platform configuration', 'Template migration', 'System integration'],
              dependencies: ['Platform procurement', 'IT infrastructure']
            },
            {
              phase: 'Training and Rollout',
              duration: '4 weeks',
              deliverables: ['Staff training program', 'Pilot testing', 'Full deployment'],
              dependencies: ['System testing completion', 'Training materials']
            }
          ],
          risks: [
            'Resistance to change from traditional staff',
            'Integration challenges with existing systems',
            'Initial learning curve reducing productivity',
            'Quality concerns during transition period'
          ],
          successCriteria: [
            '60% reduction in document preparation time',
            '95% staff adoption within 90 days',
            'Zero critical errors in automated documents',
            'Client satisfaction maintained or improved'
          ]
        },
        category: ['Document Management', 'Process Automation', 'Quality Improvement'],
        affectedDepartments: ['Fee Earning', 'Support Staff', 'Quality Assurance'],
        status: 'identified'
      },
      {
        id: 'opp_client_portal',
        type: 'technology',
        title: 'Intelligent Client Communication Portal',
        description: 'Deploy AI-enhanced client portal with automated case updates, document sharing, and intelligent query routing to reduce client management overhead by 45%.',
        impact: {
          timeImprovement: 45,
          costSavings: 28,
          qualityImprovement: 35,
          riskReduction: 20
        },
        effort: {
          level: 'high',
          timeToImplement: '4-5 months',
          resourcesRequired: ['Client portal platform', 'AI integration', 'Mobile app development', 'Security infrastructure'],
          complexity: 8
        },
        roi: {
          timeframe: '1year',
          multiple: 3.1,
          confidence: 0.82
        },
        implementation: {
          phases: [
            {
              phase: 'Portal Development',
              duration: '8 weeks',
              deliverables: ['Portal platform setup', 'AI integration', 'Security implementation'],
              dependencies: ['Platform selection', 'Security requirements', 'Data privacy compliance']
            },
            {
              phase: 'Client Onboarding System',
              duration: '6 weeks',
              deliverables: ['Onboarding workflow', 'Training materials', 'Support processes'],
              dependencies: ['Portal completion', 'Client communication strategy']
            },
            {
              phase: 'Launch and Optimization',
              duration: '4 weeks',
              deliverables: ['Client migration', 'Performance monitoring', 'Continuous improvement'],
              dependencies: ['Client acceptance', 'Staff readiness']
            }
          ],
          risks: [
            'Client adoption resistance',
            'Security and privacy concerns',
            'Technical integration complexity',
            'Increased support burden during transition'
          ],
          successCriteria: [
            '80% client adoption within 6 months',
            '45% reduction in client management time',
            '90% client satisfaction with portal experience',
            'Zero security incidents'
          ]
        },
        category: ['Client Management', 'Communication', 'Technology'],
        affectedDepartments: ['Client Services', 'Fee Earning', 'IT Support'],
        status: 'planned'
      },
      {
        id: 'opp_resource_allocation',
        type: 'allocation',
        title: 'AI-Driven Resource Allocation System',
        description: 'Implement machine learning system for optimal staff allocation based on case complexity, expertise, and workload to improve efficiency by 30%.',
        impact: {
          timeImprovement: 30,
          costSavings: 22,
          qualityImprovement: 18,
          riskReduction: 25
        },
        effort: {
          level: 'medium',
          timeToImplement: '2-3 months',
          resourcesRequired: ['ML platform', 'Data integration', 'Dashboard development'],
          complexity: 7
        },
        roi: {
          timeframe: '3months',
          multiple: 2.8,
          confidence: 0.91
        },
        implementation: {
          phases: [
            {
              phase: 'Data Analysis and Model Development',
              duration: '4 weeks',
              deliverables: ['Historical data analysis', 'ML model training', 'Performance validation'],
              dependencies: ['Data access', 'ML platform setup']
            },
            {
              phase: 'System Integration',
              duration: '3 weeks',
              deliverables: ['Case management integration', 'Real-time dashboard', 'Alert systems'],
              dependencies: ['Model completion', 'System architecture']
            },
            {
              phase: 'Testing and Deployment',
              duration: '2 weeks',
              deliverables: ['Pilot testing', 'Performance monitoring', 'Full deployment'],
              dependencies: ['Integration testing', 'User acceptance']
            }
          ],
          risks: [
            'Data quality issues affecting model accuracy',
            'Staff concerns about AI-driven decisions',
            'Model bias leading to unfair allocations',
            'Integration complexity with existing systems'
          ],
          successCriteria: [
            '30% improvement in resource utilization',
            '90% allocation recommendation acceptance',
            'Reduced workload imbalance across teams',
            'Improved case outcome predictability'
          ]
        },
        category: ['Resource Management', 'AI/ML', 'Process Optimization'],
        affectedDepartments: ['Management', 'Fee Earning', 'Resource Planning'],
        status: 'in_progress'
      }
    ];
  };

  const generateWorkflowAnalysis = (): WorkflowAnalysis[] => {
    return [
      {
        id: 'workflow_case_intake',
        workflowName: 'New Case Intake and Assessment',
        currentState: {
          steps: [
            { step: 'Initial client contact', duration: 30, efficiency: 0.65, automation: 0.2, bottleneck: false, errorRate: 0.05 },
            { step: 'Conflict check', duration: 45, efficiency: 0.4, automation: 0.8, bottleneck: true, errorRate: 0.02 },
            { step: 'Case assessment', duration: 90, efficiency: 0.7, automation: 0.1, bottleneck: false, errorRate: 0.08 },
            { step: 'Fee negotiation', duration: 60, efficiency: 0.55, automation: 0.0, bottleneck: true, errorRate: 0.12 },
            { step: 'Client onboarding', duration: 120, efficiency: 0.6, automation: 0.3, bottleneck: false, errorRate: 0.06 }
          ],
          totalDuration: 345,
          overallEfficiency: 0.58,
          bottlenecks: ['Conflict check delays', 'Fee negotiation complexity'],
          redundancies: ['Duplicate client information collection', 'Multiple approval steps']
        },
        optimizedState: {
          proposedChanges: [
            'Automated conflict checking with real-time database',
            'Standardized fee structure with AI-assisted negotiation',
            'Integrated client portal for information collection',
            'Streamlined approval workflow'
          ],
          newDuration: 210,
          efficiencyGain: 0.39,
          automationOpportunities: ['Conflict checking', 'Document generation', 'Client communication'],
          eliminatedSteps: ['Duplicate data entry', 'Manual approval routing']
        },
        recommendations: {
          immediate: [
            'Implement automated conflict checking system',
            'Create standardized client intake forms',
            'Establish clear fee guidelines'
          ],
          shortTerm: [
            'Deploy client portal for self-service onboarding',
            'Integrate with practice management system',
            'Train staff on new processes'
          ],
          longTerm: [
            'Implement AI-assisted case assessment',
            'Develop predictive analytics for case outcomes',
            'Create automated client communication system'
          ]
        }
      },
      {
        id: 'workflow_document_production',
        workflowName: 'Legal Document Production and Review',
        currentState: {
          steps: [
            { step: 'Document request', duration: 15, efficiency: 0.8, automation: 0.6, bottleneck: false, errorRate: 0.03 },
            { step: 'Template selection', duration: 20, efficiency: 0.5, automation: 0.3, bottleneck: false, errorRate: 0.15 },
            { step: 'Content drafting', duration: 180, efficiency: 0.6, automation: 0.1, bottleneck: true, errorRate: 0.1 },
            { step: 'Internal review', duration: 90, efficiency: 0.45, automation: 0.0, bottleneck: true, errorRate: 0.08 },
            { step: 'Client review', duration: 120, efficiency: 0.3, automation: 0.2, bottleneck: false, errorRate: 0.2 },
            { step: 'Final preparation', duration: 45, efficiency: 0.7, automation: 0.4, bottleneck: false, errorRate: 0.05 }
          ],
          totalDuration: 470,
          overallEfficiency: 0.51,
          bottlenecks: ['Content drafting complexity', 'Multiple review cycles'],
          redundancies: ['Repetitive formatting', 'Multiple approval levels', 'Version control issues']
        },
        optimizedState: {
          proposedChanges: [
            'AI-powered document assembly',
            'Intelligent template recommendations',
            'Automated review routing',
            'Real-time collaboration tools'
          ],
          newDuration: 280,
          efficiencyGain: 0.40,
          automationOpportunities: ['Document assembly', 'Review routing', 'Version control'],
          eliminatedSteps: ['Manual formatting', 'Redundant review cycles']
        },
        recommendations: {
          immediate: [
            'Standardize document templates',
            'Implement version control system',
            'Create review checklists'
          ],
          shortTerm: [
            'Deploy document automation platform',
            'Train staff on collaboration tools',
            'Establish quality standards'
          ],
          longTerm: [
            'Implement AI-powered document intelligence',
            'Create predictive quality scoring',
            'Develop automated compliance checking'
          ]
        }
      }
    ];
  };

  const generateCapacityAnalysis = (): CapacityAnalysis[] => {
    return [
      {
        id: 'capacity_legal_staff',
        resource: 'Legal Staff (Fee Earners)',
        type: 'personnel',
        utilization: {
          current: 0.72,
          optimal: 0.85,
          peak: 0.95,
          trend: 'increasing'
        },
        capacity: {
          current: 8640, // hours per month
          maximum: 12000,
          planned: 10800,
          unit: 'hours/month'
        },
        constraints: [
          {
            factor: 'Recruitment challenges',
            impact: 0.6,
            mitigation: ['Improved recruitment process', 'Competitive compensation', 'Remote work options']
          },
          {
            factor: 'Training time for new hires',
            impact: 0.4,
            mitigation: ['Structured training program', 'Mentorship system', 'Knowledge base']
          }
        ],
        expansion: {
          options: [
            {
              option: 'Hire 2 additional senior associates',
              cost: 180000,
              capacity_increase: 3200,
              timeframe: '4-6 months',
              risks: ['Recruitment difficulties', 'Integration challenges']
            },
            {
              option: 'Contract with freelance specialists',
              cost: 120000,
              capacity_increase: 2400,
              timeframe: '1-2 months',
              risks: ['Quality control', 'Availability issues']
            }
          ],
          recommendation: 'Hire 2 additional senior associates for long-term capacity building'
        }
      },
      {
        id: 'capacity_case_management',
        resource: 'Case Management System',
        type: 'technology',
        utilization: {
          current: 0.68,
          optimal: 0.80,
          peak: 0.92,
          trend: 'stable'
        },
        capacity: {
          current: 500, // concurrent cases
          maximum: 750,
          planned: 600,
          unit: 'concurrent cases'
        },
        constraints: [
          {
            factor: 'System performance limitations',
            impact: 0.7,
            mitigation: ['Infrastructure upgrade', 'Database optimization', 'Caching implementation']
          },
          {
            factor: 'User interface complexity',
            impact: 0.3,
            mitigation: ['UI/UX improvements', 'User training', 'Workflow simplification']
          }
        ],
        expansion: {
          options: [
            {
              option: 'System infrastructure upgrade',
              cost: 45000,
              capacity_increase: 200,
              timeframe: '2-3 months',
              risks: ['System downtime', 'Data migration issues']
            },
            {
              option: 'Cloud-based system migration',
              cost: 85000,
              capacity_increase: 400,
              timeframe: '4-6 months',
              risks: ['Security concerns', 'Performance uncertainty']
            }
          ],
          recommendation: 'Infrastructure upgrade for immediate capacity increase'
        }
      }
    ];
  };

  const generatePerformanceKPIs = (): PerformanceKPI[] => {
    return [
      {
        id: 'kpi_case_resolution_time',
        name: 'Average Case Resolution Time',
        category: 'efficiency',
        value: 8.5,
        target: 6.0,
        benchmark: 7.2,
        unit: 'months',
        trend: {
          direction: 'down',
          percentage: 15,
          period: 'last 6 months'
        },
        factors: [
          { factor: 'Case complexity', correlation: 0.8, controllable: false },
          { factor: 'Resource allocation', correlation: -0.6, controllable: true },
          { factor: 'Client responsiveness', correlation: -0.4, controllable: false },
          { factor: 'Process efficiency', correlation: -0.7, controllable: true }
        ],
        actionItems: [
          'Implement workflow automation',
          'Improve resource allocation algorithms',
          'Enhance client communication systems',
          'Standardize case management processes'
        ]
      },
      {
        id: 'kpi_billable_efficiency',
        name: 'Billable Hour Efficiency',
        category: 'productivity',
        value: 68,
        target: 85,
        benchmark: 75,
        unit: '%',
        trend: {
          direction: 'up',
          percentage: 8,
          period: 'last quarter'
        },
        factors: [
          { factor: 'Administrative overhead', correlation: -0.75, controllable: true },
          { factor: 'Technology adoption', correlation: 0.6, controllable: true },
          { factor: 'Staff experience level', correlation: 0.5, controllable: true },
          { factor: 'Case mix complexity', correlation: -0.3, controllable: false }
        ],
        actionItems: [
          'Reduce administrative tasks through automation',
          'Accelerate technology adoption training',
          'Optimize case assignment based on experience',
          'Implement time tracking improvements'
        ]
      },
      {
        id: 'kpi_client_satisfaction',
        name: 'Client Satisfaction Score',
        category: 'quality',
        value: 8.2,
        target: 9.0,
        benchmark: 8.5,
        unit: '/10',
        trend: {
          direction: 'stable',
          percentage: 2,
          period: 'last year'
        },
        factors: [
          { factor: 'Communication frequency', correlation: 0.8, controllable: true },
          { factor: 'Case outcome quality', correlation: 0.9, controllable: true },
          { factor: 'Response time', correlation: 0.7, controllable: true },
          { factor: 'Fee transparency', correlation: 0.6, controllable: true }
        ],
        actionItems: [
          'Implement proactive client communication system',
          'Enhance case outcome prediction and management',
          'Improve response time through automation',
          'Develop transparent fee reporting system'
        ]
      }
    ];
  };

  const renderOverview = (): JSX.Element => (
    <div className="overview-panel">
      <h3>⚡ Resource Optimization Overview</h3>
      
      <div className="metrics-dashboard">
        <div className="metrics-grid">
          {metrics.map(metric => (
            <div key={metric.id} className={`metric-card ${metric.category} ${metric.priority}`}>
              <div className="metric-header">
                <h4>{metric.name}</h4>
                <span className={`trend-indicator ${metric.trend}`}>
                  {metric.trend === 'improving' ? '↗️' : metric.trend === 'declining' ? '↘️' : '➡️'}
                </span>
              </div>
              
              <div className="metric-values">
                <div className="current-value">
                  <span className="value">{metric.currentValue}</span>
                  <span className="unit">{metric.unit}</span>
                </div>
                <div className="target-comparison">
                  <span className="target">Target: {metric.targetValue}{metric.unit}</span>
                  <span className="benchmark">Benchmark: {metric.benchmark}{metric.unit}</span>
                </div>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min((metric.currentValue / metric.targetValue) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="optimization-summary">
        <h4>🔍 Key Optimization Insights</h4>
        <div className="insights-grid">
          <div className="insight-card high-impact">
            <h5>📈 High-Impact Opportunity</h5>
            <p>Document automation could save 60% of drafting time and £420K annually while improving quality.</p>
            <button className="insight-action">View Details</button>
          </div>
          
          <div className="insight-card capacity-alert">
            <h5>⚠️ Capacity Alert</h5>
            <p>Legal staff utilization at 72% with increasing trend. Consider expansion to meet growing demand.</p>
            <button className="insight-action">Analyze Capacity</button>
          </div>
          
          <div className="insight-card workflow-improvement">
            <h5>🔄 Workflow Inefficiency</h5>
            <p>Case intake process has 39% optimization potential through automation and streamlining.</p>
            <button className="insight-action">Optimize Workflow</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOpportunities = (): JSX.Element => (
    <div className="opportunities-panel">
      <h3>💡 Optimization Opportunities</h3>
      
      <div className="opportunities-filters">
        <div className="filter-group">
          <label>ROI Timeframe:</label>
          {(['1month', '3months', '6months', '1year'] as const).map(timeframe => (
            <button
              key={timeframe}
              className={`filter-btn ${selectedTimeframe === timeframe ? 'active' : ''}`}
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe === '1month' ? '1M' : 
               timeframe === '3months' ? '3M' :
               timeframe === '6months' ? '6M' : '1Y'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="opportunities-list">
        {opportunities.map(opportunity => (
          <div key={opportunity.id} className={`opportunity-card ${opportunity.type} ${opportunity.effort.level}`}>
            <div className="opportunity-header">
              <div className="opportunity-title">
                <h4>{opportunity.title}</h4>
                <span className={`status-badge ${opportunity.status}`}>
                  {opportunity.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="opportunity-metrics">
                <div className="roi-metric">
                  <span className="label">ROI:</span>
                  <span className="value">{opportunity.roi.multiple}x</span>
                </div>
                <div className="effort-metric">
                  <span className="label">Effort:</span>
                  <span className="value">{opportunity.effort.level}</span>
                </div>
              </div>
            </div>
            
            <p className="opportunity-description">{opportunity.description}</p>
            
            <div className="impact-grid">
              <div className="impact-item">
                <span className="impact-label">Time Improvement:</span>
                <span className="impact-value">+{opportunity.impact.timeImprovement}%</span>
              </div>
              <div className="impact-item">
                <span className="impact-label">Cost Savings:</span>
                <span className="impact-value">-{opportunity.impact.costSavings}%</span>
              </div>
              <div className="impact-item">
                <span className="impact-label">Quality Improvement:</span>
                <span className="impact-value">+{opportunity.impact.qualityImprovement}%</span>
              </div>
              <div className="impact-item">
                <span className="impact-label">Risk Reduction:</span>
                <span className="impact-value">-{opportunity.impact.riskReduction}%</span>
              </div>
            </div>
            
            <div className="implementation-preview">
              <h5>Implementation Plan:</h5>
              <div className="phases-timeline">
                {opportunity.implementation.phases.map((phase, index) => (
                  <div key={index} className="phase-item">
                    <span className="phase-number">{index + 1}</span>
                    <div className="phase-details">
                      <span className="phase-name">{phase.phase}</span>
                      <span className="phase-duration">{phase.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="opportunity-actions">
              <button 
                className="implement-btn"
                onClick={() => onOptimizationImplemented?.(opportunity)}
              >
                Implement Optimization
              </button>
              <button className="details-btn">
                View Full Analysis
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorkflows = (): JSX.Element => (
    <div className="workflows-panel">
      <h3>🔄 Workflow Analysis</h3>
      
      <div className="workflows-list">
        {workflows.map(workflow => (
          <div key={workflow.id} className="workflow-card">
            <div className="workflow-header">
              <h4>{workflow.workflowName}</h4>
              <div className="workflow-metrics">
                <span className="duration">Duration: {workflow.currentState.totalDuration} min</span>
                <span className="efficiency">Efficiency: {Math.round(workflow.currentState.overallEfficiency * 100)}%</span>
              </div>
            </div>
            
            <div className="workflow-comparison">
              <div className="current-state">
                <h5>📊 Current State</h5>
                <div className="steps-list">
                  {workflow.currentState.steps.map((step, index) => (
                    <div key={index} className={`step-item ${step.bottleneck ? 'bottleneck' : ''}`}>
                      <div className="step-info">
                        <span className="step-name">{step.step}</span>
                        <span className="step-duration">{step.duration} min</span>
                      </div>
                      <div className="step-metrics">
                        <div className="efficiency-bar">
                          <div 
                            className="efficiency-fill"
                            style={{ width: `${step.efficiency * 100}%` }}
                          />
                        </div>
                        <span className="automation-level">
                          {Math.round(step.automation * 100)}% automated
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bottlenecks">
                  <h6>Bottlenecks:</h6>
                  <ul>
                    {workflow.currentState.bottlenecks.map(bottleneck => (
                      <li key={bottleneck}>{bottleneck}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="optimized-state">
                <h5>🎯 Optimized State</h5>
                <div className="optimization-summary">
                  <div className="optimization-metric">
                    <span className="label">New Duration:</span>
                    <span className="value">{workflow.optimizedState.newDuration} min</span>
                    <span className="improvement">
                      ({Math.round(((workflow.currentState.totalDuration - workflow.optimizedState.newDuration) / workflow.currentState.totalDuration) * 100)}% faster)
                    </span>
                  </div>
                  
                  <div className="optimization-metric">
                    <span className="label">Efficiency Gain:</span>
                    <span className="value">+{Math.round(workflow.optimizedState.efficiencyGain * 100)}%</span>
                  </div>
                </div>
                
                <div className="proposed-changes">
                  <h6>Proposed Changes:</h6>
                  <ul>
                    {workflow.optimizedState.proposedChanges.map(change => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="automation-opportunities">
                  <h6>Automation Opportunities:</h6>
                  <ul>
                    {workflow.optimizedState.automationOpportunities.map(opportunity => (
                      <li key={opportunity}>{opportunity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="recommendations">
              <h5>💡 Implementation Recommendations</h5>
              <div className="recommendations-timeline">
                <div className="recommendation-phase">
                  <h6>Immediate (0-1 month):</h6>
                  <ul>
                    {workflow.recommendations.immediate.map(rec => (
                      <li key={rec}>{rec}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="recommendation-phase">
                  <h6>Short-term (1-3 months):</h6>
                  <ul>
                    {workflow.recommendations.shortTerm.map(rec => (
                      <li key={rec}>{rec}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="recommendation-phase">
                  <h6>Long-term (3+ months):</h6>
                  <ul>
                    {workflow.recommendations.longTerm.map(rec => (
                      <li key={rec}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <button 
              className="optimize-workflow-btn"
              onClick={() => onWorkflowUpdated?.(workflow)}
            >
              Optimize This Workflow
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCapacity = (): JSX.Element => (
    <div className="capacity-panel">
      <h3>📊 Capacity Analysis</h3>
      
      <div className="capacity-list">
        {capacity.map(cap => (
          <div key={cap.id} className={`capacity-card ${cap.type}`}>
            <div className="capacity-header">
              <h4>{cap.resource}</h4>
              <span className="resource-type">{cap.type}</span>
            </div>
            
            <div className="utilization-section">
              <h5>📈 Utilization Analysis</h5>
              <div className="utilization-metrics">
                <div className="utilization-item">
                  <span className="label">Current:</span>
                  <div className="utilization-bar">
                    <div 
                      className="utilization-fill current"
                      style={{ width: `${cap.utilization.current * 100}%` }}
                    />
                  </div>
                  <span className="value">{Math.round(cap.utilization.current * 100)}%</span>
                </div>
                
                <div className="utilization-item">
                  <span className="label">Optimal:</span>
                  <div className="utilization-bar">
                    <div 
                      className="utilization-fill optimal"
                      style={{ width: `${cap.utilization.optimal * 100}%` }}
                    />
                  </div>
                  <span className="value">{Math.round(cap.utilization.optimal * 100)}%</span>
                </div>
                
                <div className="utilization-item">
                  <span className="label">Peak:</span>
                  <div className="utilization-bar">
                    <div 
                      className="utilization-fill peak"
                      style={{ width: `${cap.utilization.peak * 100}%` }}
                    />
                  </div>
                  <span className="value">{Math.round(cap.utilization.peak * 100)}%</span>
                </div>
              </div>
              
              <div className="trend-indicator">
                <span>Trend: </span>
                <span className={`trend ${cap.utilization.trend}`}>
                  {cap.utilization.trend}
                  {cap.utilization.trend === 'increasing' ? ' ↗️' : 
                   cap.utilization.trend === 'decreasing' ? ' ↘️' : ' ➡️'}
                </span>
              </div>
            </div>
            
            <div className="capacity-metrics">
              <h5>📊 Capacity Metrics</h5>
              <div className="capacity-values">
                <div className="capacity-item">
                  <span className="label">Current:</span>
                  <span className="value">{cap.capacity.current.toLocaleString()} {cap.capacity.unit}</span>
                </div>
                <div className="capacity-item">
                  <span className="label">Maximum:</span>
                  <span className="value">{cap.capacity.maximum.toLocaleString()} {cap.capacity.unit}</span>
                </div>
                <div className="capacity-item">
                  <span className="label">Planned:</span>
                  <span className="value">{cap.capacity.planned.toLocaleString()} {cap.capacity.unit}</span>
                </div>
              </div>
            </div>
            
            <div className="constraints-section">
              <h5>⚠️ Constraints</h5>
              <div className="constraints-list">
                {cap.constraints.map((constraint, index) => (
                  <div key={index} className="constraint-item">
                    <div className="constraint-header">
                      <span className="constraint-factor">{constraint.factor}</span>
                      <span className="constraint-impact">
                        Impact: {Math.round(constraint.impact * 100)}%
                      </span>
                    </div>
                    
                    <div className="mitigation-strategies">
                      <h6>Mitigation:</h6>
                      <ul>
                        {constraint.mitigation.map(strategy => (
                          <li key={strategy}>{strategy}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="expansion-options">
              <h5>🚀 Expansion Options</h5>
              <div className="options-list">
                {cap.expansion.options.map((option, index) => (
                  <div key={index} className="expansion-option">
                    <h6>{option.option}</h6>
                    <div className="option-metrics">
                      <span>Cost: £{option.cost.toLocaleString()}</span>
                      <span>Capacity: +{option.capacity_increase.toLocaleString()} {cap.capacity.unit}</span>
                      <span>Timeframe: {option.timeframe}</span>
                    </div>
                    
                    <div className="option-risks">
                      <strong>Risks:</strong>
                      <ul>
                        {option.risks.map(risk => (
                          <li key={risk}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="expansion-recommendation">
                <strong>Recommendation:</strong> {cap.expansion.recommendation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerformance = (): JSX.Element => (
    <div className="performance-panel">
      <h3>📈 Performance KPIs</h3>
      
      <div className="kpis-grid">
        {kpis.map(kpi => (
          <div key={kpi.id} className={`kpi-card ${kpi.category}`}>
            <div className="kpi-header">
              <h4>{kpi.name}</h4>
              <span className="category-badge">{kpi.category}</span>
            </div>
            
            <div className="kpi-values">
              <div className="current-value">
                <span className="value">{kpi.value}</span>
                <span className="unit">{kpi.unit}</span>
              </div>
              
              <div className="target-benchmark">
                <div className="target">
                  <span className="label">Target:</span>
                  <span className="value">{kpi.target}{kpi.unit}</span>
                </div>
                <div className="benchmark">
                  <span className="label">Benchmark:</span>
                  <span className="value">{kpi.benchmark}{kpi.unit}</span>
                </div>
              </div>
            </div>
            
            <div className="kpi-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` 
                  }}
                />
                <div 
                  className="benchmark-marker"
                  style={{ 
                    left: `${Math.min((kpi.benchmark / kpi.target) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="trend-section">
              <div className="trend-info">
                <span className={`trend-direction ${kpi.trend.direction}`}>
                  {kpi.trend.direction === 'up' ? '↗️' : 
                   kpi.trend.direction === 'down' ? '↘️' : '➡️'}
                </span>
                <span className="trend-text">
                  {kpi.trend.percentage}% {kpi.trend.period}
                </span>
              </div>
            </div>
            
            <div className="factors-section">
              <h5>Key Factors:</h5>
              <div className="factors-list">
                {kpi.factors.slice(0, 3).map((factor, index) => (
                  <div key={index} className="factor-item">
                    <span className="factor-name">{factor.factor}</span>
                    <span className={`correlation ${factor.correlation > 0 ? 'positive' : 'negative'}`}>
                      {factor.correlation > 0 ? '+' : ''}{factor.correlation.toFixed(2)}
                    </span>
                    <span className={`controllable ${factor.controllable ? 'yes' : 'no'}`}>
                      {factor.controllable ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="action-items">
              <h5>Action Items:</h5>
              <ul>
                {kpi.actionItems.slice(0, 2).map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="resource-optimization-intelligence">
      {isAnalyzing && (
        <div className="analysis-indicator">
          <span className="spinner">⚡</span>
          <span>Analyzing resource utilization and optimization opportunities...</span>
        </div>
      )}
      
      <div className="intelligence-header">
        <h2>⚡ Resource Optimization Intelligence</h2>
        <p>AI-powered system for optimizing practice resources, workflows, and efficiency</p>
      </div>
      
      <div className="intelligence-tabs">
        {([
          ['overview', '📊 Overview'],
          ['opportunities', '💡 Opportunities'],
          ['workflows', '🔄 Workflows'],
          ['capacity', '📊 Capacity'],
          ['performance', '📈 Performance']
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            className={`intelligence-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>
      
      <div className="intelligence-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'opportunities' && renderOpportunities()}
        {activeTab === 'workflows' && renderWorkflows()}
        {activeTab === 'capacity' && renderCapacity()}
        {activeTab === 'performance' && renderPerformance()}
      </div>
    </div>
  );
};

export default ResourceOptimizationIntelligence;