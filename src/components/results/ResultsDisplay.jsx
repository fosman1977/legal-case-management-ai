/**
 * Professional Results Display - Week 15 Day 1-2
 * Advanced results interface with tabbed navigation and AI insights
 */

import React, { useState } from 'react';
import { useTheme } from '../../design/ThemeProvider.jsx';
import Card, { CardHeader, CardContent } from '../../design/components/Card.jsx';
import Button from '../../design/components/Button.jsx';
import { InsightsPresentation } from '../insights/InsightsPresentation.jsx';
import { ExportInterface } from '../export/ExportInterface.jsx';
import { InteractiveTimeline } from '../timeline/InteractiveTimeline.jsx';
import { EntityRelationshipDiagram } from '../visualization/EntityRelationshipDiagram.jsx';

// Icon Components
const ChartBarIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const DocumentTextIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ClockIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LightBulbIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const DownloadIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const UserGroupIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ScaleIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const CheckCircleIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Confidence Indicator Component
const ConfidenceIndicator = ({ confidence }) => {
  const { tokens } = useTheme();
  
  const getConfidenceColor = (conf) => {
    if (conf >= 0.9) return tokens.colors.success[500];
    if (conf >= 0.7) return tokens.colors.warning[500];
    return tokens.colors.error[500];
  };

  const getConfidenceLabel = (conf) => {
    if (conf >= 0.9) return 'High Confidence';
    if (conf >= 0.7) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: getConfidenceColor(confidence)
      }} />
      <span style={{ 
        fontSize: tokens.typography.fontSize.sm,
        color: tokens.colors.neutral[600],
        fontWeight: tokens.typography.fontWeight.medium
      }}>
        {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
      </span>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ id, label, icon: Icon, active, onClick }) => {
  const { tokens } = useTheme();
  
  const tabStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: active ? tokens.colors.primary[600] : tokens.colors.neutral[500],
    borderBottom: `2px solid ${active ? tokens.colors.primary[600] : 'transparent'}`,
    cursor: 'pointer',
    transition: tokens.transitions.colors,
    backgroundColor: 'transparent',
    border: 'none'
  };

  const iconStyles = {
    width: '18px',
    height: '18px',
    color: active ? tokens.colors.primary[500] : tokens.colors.neutral[400]
  };

  return (
    <button onClick={onClick} style={tabStyles}>
      <Icon style={iconStyles} />
      {label}
    </button>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon: Icon, description }) => {
  const { tokens } = useTheme();
  
  return (
    <Card>
      <CardContent style={{ padding: tokens.spacing[6] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ 
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.neutral[600],
              margin: 0,
              marginBottom: tokens.spacing[1]
            }}>
              {title}
            </p>
            <p style={{ 
              fontSize: tokens.typography.fontSize['3xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.neutral[900],
              margin: 0,
              marginBottom: tokens.spacing[1]
            }}>
              {value}
            </p>
            <p style={{ 
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.neutral[500],
              margin: 0
            }}>
              {description}
            </p>
          </div>
          <Icon style={{ 
            width: '48px', 
            height: '48px', 
            color: tokens.colors.neutral[300] 
          }} />
        </div>
      </CardContent>
    </Card>
  );
};

// Overview Tab Component
const OverviewTab = ({ analysis, insights }) => {
  const { tokens } = useTheme();
  
  return (
    <div style={{ padding: tokens.spacing[6], display: 'flex', flexDirection: 'column', gap: tokens.spacing[6] }}>
      {/* Key Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: tokens.spacing[6] 
      }}>
        <MetricCard
          title="Documents Processed"
          value={analysis.documents_processed}
          icon={DocumentTextIcon}
          description="Successfully analyzed"
        />
        <MetricCard
          title="Entities Found"
          value={analysis.entities_found}
          icon={UserGroupIcon}
          description="People, companies, dates"
        />
        <MetricCard
          title="Legal Issues"
          value={analysis.legal_issues.length}
          icon={ScaleIcon}
          description="Identified issues"
        />
      </div>

      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <h3 style={{ 
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.medium,
            margin: 0
          }}>
            Analysis Summary
          </h3>
        </CardHeader>
        <CardContent>
          <div style={{ marginBottom: tokens.spacing[4] }}>
            <p style={{ 
              color: tokens.colors.neutral[600],
              lineHeight: tokens.typography.lineHeight.relaxed,
              margin: 0
            }}>
              {analysis.executive_summary}
            </p>
          </div>
          
          {insights && (
            <div style={{
              padding: tokens.spacing[4],
              backgroundColor: tokens.colors.primary[50],
              borderRadius: tokens.borderRadius.lg
            }}>
              <h4 style={{ 
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.colors.primary[900],
                marginBottom: tokens.spacing[2],
                margin: `0 0 ${tokens.spacing[2]} 0`
              }}>
                AI Strategic Guidance
              </h4>
              <p style={{ 
                color: tokens.colors.primary[800],
                fontSize: tokens.typography.fontSize.sm,
                margin: 0
              }}>
                {insights.strategic_summary}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <h3 style={{ 
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.medium,
            margin: 0
          }}>
            Next Steps
          </h3>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[3] }}>
            {analysis.recommended_actions.map((action, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacing[3] }}>
                <CheckCircleIcon style={{ 
                  width: '20px', 
                  height: '20px', 
                  color: tokens.colors.success[500],
                  marginTop: '2px',
                  flexShrink: 0
                }} />
                <span style={{ 
                  fontSize: tokens.typography.fontSize.sm,
                  color: tokens.colors.neutral[700]
                }}>
                  {action}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Placeholder tabs for now
const DocumentsTab = ({ documents }) => {
  // Generate sample entity data for visualization
  const sampleEntities = [
    {
      id: 'abc_corp',
      name: 'ABC Corporation',
      anonymized_value: 'Company A',
      type: 'company',
      importance: 3
    },
    {
      id: 'xyz_ltd',
      name: 'XYZ Limited',
      anonymized_value: 'Company B',
      type: 'company',
      importance: 3
    },
    {
      id: 'john_smith',
      name: 'John Smith',
      anonymized_value: 'Person X',
      type: 'person',
      importance: 2
    },
    {
      id: 'mary_jones',
      name: 'Mary Jones',
      anonymized_value: 'Person Y',
      type: 'person',
      importance: 2
    },
    {
      id: 'supply_agreement',
      name: 'Supply Agreement',
      anonymized_value: 'Contract Doc 1',
      type: 'document',
      importance: 3
    },
    {
      id: 'delivery_date',
      name: '2023-04-15',
      anonymized_value: 'Key Date 1',
      type: 'date',
      importance: 2
    },
    {
      id: 'breach_notice',
      name: 'Notice of Breach',
      anonymized_value: 'Legal Notice 1',
      type: 'document',
      importance: 2
    }
  ];

  const sampleRelationships = [
    {
      entity1: 'abc_corp',
      entity2: 'xyz_ltd',
      relationship_type: 'contractual',
      strength: 0.9
    },
    {
      entity1: 'john_smith',
      entity2: 'abc_corp',
      relationship_type: 'employment',
      strength: 0.8
    },
    {
      entity1: 'mary_jones',
      entity2: 'xyz_ltd',
      relationship_type: 'employment',
      strength: 0.8
    },
    {
      entity1: 'supply_agreement',
      entity2: 'abc_corp',
      relationship_type: 'contractual',
      strength: 0.9
    },
    {
      entity1: 'supply_agreement',
      entity2: 'xyz_ltd',
      relationship_type: 'contractual',
      strength: 0.9
    },
    {
      entity1: 'delivery_date',
      entity2: 'supply_agreement',
      relationship_type: 'temporal',
      strength: 0.7
    },
    {
      entity1: 'breach_notice',
      entity2: 'abc_corp',
      relationship_type: 'legal',
      strength: 0.8
    }
  ];

  return (
    <div style={{ height: '600px' }}>
      <EntityRelationshipDiagram 
        entities={documents?.entities || sampleEntities}
        relationships={documents?.relationships || sampleRelationships}
      />
    </div>
  );
};

const TimelineTab = ({ timeline }) => {
  // Generate sample timeline events
  const sampleEvents = [
    {
      id: '1',
      title: 'Contract Signed',
      description: 'Supply agreement executed between ABC Corporation and XYZ Limited',
      date: '2023-03-15',
      type: 'legal',
      source_document: 'Supply Agreement v1.2.pdf',
      confidence: 0.95,
      legal_significance: 'Establishes contractual obligations and delivery terms'
    },
    {
      id: '2',
      title: 'First Delivery Deadline',
      description: 'Initial delivery deadline per contract terms',
      date: '2023-04-15',
      type: 'deadline',
      source_document: 'Supply Agreement v1.2.pdf',
      confidence: 0.92
    },
    {
      id: '3',
      title: 'Delivery Failure Notice',
      description: 'Email from XYZ Limited notifying of delivery delays',
      date: '2023-04-16',
      type: 'communication',
      source_document: 'Email_20230416_XYZ.pdf',
      confidence: 0.88,
      legal_significance: 'First documented breach of contract terms'
    },
    {
      id: '4',
      title: 'Financial Loss Report',
      description: 'Internal report documenting losses from non-delivery',
      date: '2023-04-30',
      type: 'financial',
      source_document: 'Loss_Report_April2023.xlsx',
      confidence: 0.85
    },
    {
      id: '5',
      title: 'Legal Notice Sent',
      description: 'Formal notice of breach sent to XYZ Limited',
      date: '2023-05-10',
      type: 'legal',
      source_document: 'Notice_of_Breach.pdf',
      confidence: 0.93,
      legal_significance: 'Formal notice requirement fulfilled'
    },
    {
      id: '6',
      title: 'Response Received',
      description: 'XYZ Limited responds citing force majeure',
      date: '2023-05-25',
      type: 'communication',
      source_document: 'Response_XYZ_20230525.pdf',
      confidence: 0.90
    },
    {
      id: '7',
      title: 'Settlement Meeting',
      description: 'Initial settlement discussion held',
      date: '2023-06-05',
      type: 'legal',
      source_document: 'Meeting_Minutes_20230605.pdf',
      confidence: 0.87
    },
    {
      id: '8',
      title: 'Limitation Period Warning',
      description: 'Three months remaining to file formal claim',
      date: '2024-01-15',
      type: 'deadline',
      source_document: 'Legal Analysis Memo',
      confidence: 0.95,
      legal_significance: 'Critical deadline for preserving legal claims'
    }
  ];

  return (
    <div style={{ height: '600px' }}>
      <InteractiveTimeline 
        events={timeline || sampleEvents}
        analysis={{}}
      />
    </div>
  );
};

const InsightsTab = ({ insights }) => {
  // Generate comprehensive insights data
  const comprehensiveInsights = {
    strategic_framework: "The case presents strong grounds for a breach of contract claim with multiple supporting elements. The primary strategy should focus on demonstrating clear contractual obligations, repeated failures to perform, and quantifiable damages. Consider pursuing both compensatory and consequential damages while maintaining flexibility for settlement negotiations.",
    evidence_priorities: [
      "Original supply agreement with specific delivery terms and obligations",
      "Email correspondence documenting delivery failures and excuses",
      "Financial records showing losses due to non-delivery",
      "Witness statements from logistics and operations personnel",
      "Documentation of attempts to mitigate damages"
    ],
    risk_assessment: [
      "Potential counterclaim regarding force majeure clauses (Medium Risk)",
      "Limitation period approaching in 3 months (High Risk)",
      "Jurisdiction challenges if defendant is foreign entity (Low Risk)",
      "Document preservation obligations must be met immediately (High Risk)"
    ],
    tactical_recommendations: [
      "Issue formal notice of breach within 7 days to preserve all claims",
      "Initiate document preservation protocols immediately",
      "Consider expert witness on industry delivery standards",
      "Explore alternative dispute resolution before formal litigation",
      "Prepare detailed quantum analysis for damages claim"
    ],
    confidence_scores: {
      strategic: 0.88,
      evidence: 0.92,
      risk: 0.75,
      tactical: 0.85
    }
  };

  const consultationHistory = [
    {
      timestamp: "2024-01-15 14:30",
      type: "Strategic Analysis",
      summary: "Initial case assessment completed with 88% confidence in primary breach claim. Recommended immediate action on notice requirements."
    },
    {
      timestamp: "2024-01-14 10:15",
      type: "Document Review",
      summary: "Analyzed 24 documents identifying key contractual terms and 3 potential issues requiring attention."
    }
  ];

  return (
    <InsightsPresentation 
      insights={comprehensiveInsights}
      consultation_history={consultationHistory}
    />
  );
};

const ExportTab = ({ analysis, insights, case_context }) => {
  return (
    <ExportInterface 
      analysis={analysis}
      insights={insights}
      case_context={case_context}
    />
  );
};

// Main Results Display Component
export const ResultsDisplay = ({ analysis, insights, case_context }) => {
  const { tokens } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
    { id: 'timeline', label: 'Timeline', icon: ClockIcon },
    { id: 'insights', label: 'AI Insights', icon: LightBulbIcon },
    { id: 'export', label: 'Export', icon: DownloadIcon }
  ];

  const headerStyles = {
    backgroundColor: tokens.colors.neutral[50],
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`
  };

  const titleSectionStyles = {
    padding: `${tokens.spacing[4]} ${tokens.spacing[6]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const navigationStyles = {
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`
  };

  const navListStyles = {
    padding: `0 ${tokens.spacing[6]}`,
    display: 'flex',
    gap: tokens.spacing[8]
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Results Header */}
      <div style={headerStyles}>
        <div style={titleSectionStyles}>
          <div>
            <h1 style={{ 
              fontSize: tokens.typography.fontSize['2xl'],
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.neutral[900],
              margin: 0,
              marginBottom: tokens.spacing[1]
            }}>
              Case Analysis Results
            </h1>
            <p style={{ 
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.neutral[500],
              margin: 0
            }}>
              {case_context.case_name} • {analysis.documents_processed} documents processed
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[4] }}>
            <ConfidenceIndicator confidence={analysis.overall_confidence} />
            <Button variant="primary">
              Consult AI
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={navigationStyles}>
          <nav style={navListStyles}>
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                {...tab}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'overview' && (
          <OverviewTab analysis={analysis} insights={insights} />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab documents={analysis.documents} />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab timeline={analysis.timeline} />
        )}
        {activeTab === 'insights' && (
          <InsightsTab insights={insights} />
        )}
        {activeTab === 'export' && (
          <ExportTab analysis={analysis} insights={insights} case_context={case_context} />
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;