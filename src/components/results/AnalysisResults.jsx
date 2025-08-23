/**
 * Analysis Results Component - Week 14 Day 5
 * Professional results presentation for legal document analysis
 */

import React, { useState } from 'react';
import { useTheme } from '../../design/ThemeProvider.jsx';
import Card, { CardHeader, CardContent } from '../../design/components/Card.jsx';
import Button from '../../design/components/Button.jsx';

// Result icons
const DocumentIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UserIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CalendarIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BookOpenIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CheckIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ExclamationIcon = ({ style }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

// Sample analysis results data
const sampleResults = {
  documentInfo: {
    filename: "Contract_Amendment_2024.pdf",
    pages: 15,
    wordCount: 3420,
    analysisTime: "2.3 seconds",
    confidence: 0.94
  },
  
  keyEntities: [
    { type: "Person", name: "Sarah Mitchell", role: "Legal Counsel", confidence: 0.98 },
    { type: "Person", name: "David Chen", role: "Director", confidence: 0.95 },
    { type: "Organization", name: "TechCorp Limited", role: "Client", confidence: 0.96 },
    { type: "Organization", name: "Legal Partners LLP", role: "Law Firm", confidence: 0.99 }
  ],
  
  keyDates: [
    { date: "2024-01-15", event: "Contract Execution", importance: "High" },
    { date: "2024-06-30", event: "Performance Review", importance: "Medium" },
    { date: "2024-12-31", event: "Contract Termination", importance: "High" }
  ],
  
  legalIssues: [
    { 
      issue: "Indemnification Clause",
      severity: "Medium",
      description: "Broad indemnification language may expose client to excessive liability",
      recommendation: "Consider narrowing indemnification scope"
    },
    {
      issue: "Termination Rights",
      severity: "Low", 
      description: "Termination provisions appear standard and balanced",
      recommendation: "No immediate action required"
    },
    {
      issue: "Governing Law",
      severity: "High",
      description: "Governing law clause specifies foreign jurisdiction",
      recommendation: "Review implications for dispute resolution"
    }
  ],
  
  summary: "This contract amendment introduces significant changes to the indemnification provisions and extends the term by 12 months. Key areas requiring attention include the broad liability exposure and foreign governing law implications."
};

const ResultSection = ({ title, icon: Icon, children, tokens }) => (
  <Card style={{ marginBottom: tokens.spacing[4] }}>
    <CardHeader>
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
        <Icon style={{ 
          width: '20px', 
          height: '20px',
          color: tokens.colors.primary[600]
        }} />
        <h3 style={{
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.semibold,
          margin: 0
        }}>
          {title}
        </h3>
      </div>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

const ConfidenceBadge = ({ confidence, tokens }) => {
  const percentage = Math.round(confidence * 100);
  const color = percentage >= 90 ? 'success' : percentage >= 70 ? 'warning' : 'error';
  
  const colorMap = {
    success: { bg: tokens.colors.success[100], text: tokens.colors.success[700] },
    warning: { bg: tokens.colors.warning[100], text: tokens.colors.warning[700] },
    error: { bg: tokens.colors.error[100], text: tokens.colors.error[700] }
  };

  return (
    <span style={{
      padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
      borderRadius: tokens.borderRadius.full,
      fontSize: tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.medium,
      backgroundColor: colorMap[color].bg,
      color: colorMap[color].text
    }}>
      {percentage}% confidence
    </span>
  );
};

export const AnalysisResults = ({ results = sampleResults, onExport }) => {
  const { tokens } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'entities', label: 'Key Entities' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'issues', label: 'Legal Issues' }
  ];

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[6] }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: tokens.spacing[4]
      }}>
        <div style={{
          padding: tokens.spacing[4],
          backgroundColor: tokens.colors.primary[50],
          borderRadius: tokens.borderRadius.lg,
          border: `1px solid ${tokens.colors.primary[200]}`
        }}>
          <div style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.primary[600]
          }}>
            {results.documentInfo.pages}
          </div>
          <div style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.neutral[600]
          }}>
            Pages Analyzed
          </div>
        </div>

        <div style={{
          padding: tokens.spacing[4],
          backgroundColor: tokens.colors.success[50],
          borderRadius: tokens.borderRadius.lg,
          border: `1px solid ${tokens.colors.success[200]}`
        }}>
          <div style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.success[600]
          }}>
            {results.documentInfo.analysisTime}
          </div>
          <div style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.neutral[600]
          }}>
            Processing Time
          </div>
        </div>

        <div style={{
          padding: tokens.spacing[4],
          backgroundColor: tokens.colors.warning[50],
          borderRadius: tokens.borderRadius.lg,
          border: `1px solid ${tokens.colors.warning[200]}`
        }}>
          <div style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.warning[600]
          }}>
            {results.keyEntities.length}
          </div>
          <div style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.neutral[600]
          }}>
            Entities Found
          </div>
        </div>
      </div>

      <div>
        <h4 style={{
          fontSize: tokens.typography.fontSize.md,
          fontWeight: tokens.typography.fontWeight.semibold,
          margin: `0 0 ${tokens.spacing[3]} 0`
        }}>
          Executive Summary
        </h4>
        <p style={{
          fontSize: tokens.typography.fontSize.base,
          lineHeight: tokens.typography.lineHeight.relaxed,
          color: tokens.colors.neutral[700],
          margin: 0
        }}>
          {results.summary}
        </p>
      </div>
    </div>
  );

  const renderEntities = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[3] }}>
      {results.keyEntities.map((entity, index) => (
        <div key={index} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: tokens.spacing[4],
          backgroundColor: tokens.colors.neutral[50],
          borderRadius: tokens.borderRadius.md,
          border: `1px solid ${tokens.colors.neutral[200]}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[3] }}>
            <UserIcon style={{
              width: '20px',
              height: '20px',
              color: tokens.colors.neutral[500]
            }} />
            <div>
              <div style={{
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.colors.neutral[900]
              }}>
                {entity.name}
              </div>
              <div style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.neutral[600]
              }}>
                {entity.type} • {entity.role}
              </div>
            </div>
          </div>
          <ConfidenceBadge confidence={entity.confidence} tokens={tokens} />
        </div>
      ))}
    </div>
  );

  const renderTimeline = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[4] }}>
      {results.keyDates.map((date, index) => (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[4],
          padding: tokens.spacing[4],
          backgroundColor: tokens.colors.neutral[50],
          borderRadius: tokens.borderRadius.md,
          borderLeft: `4px solid ${
            date.importance === 'High' ? tokens.colors.error[500] :
            date.importance === 'Medium' ? tokens.colors.warning[500] :
            tokens.colors.success[500]
          }`
        }}>
          <CalendarIcon style={{
            width: '20px',
            height: '20px',
            color: tokens.colors.neutral[500]
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: tokens.typography.fontSize.base,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.neutral[900]
            }}>
              {date.event}
            </div>
            <div style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.neutral[600]
            }}>
              {date.date}
            </div>
          </div>
          <div style={{
            padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
            borderRadius: tokens.borderRadius.full,
            fontSize: tokens.typography.fontSize.xs,
            fontWeight: tokens.typography.fontWeight.medium,
            backgroundColor: 
              date.importance === 'High' ? tokens.colors.error[100] :
              date.importance === 'Medium' ? tokens.colors.warning[100] :
              tokens.colors.success[100],
            color:
              date.importance === 'High' ? tokens.colors.error[700] :
              date.importance === 'Medium' ? tokens.colors.warning[700] :
              tokens.colors.success[700]
          }}>
            {date.importance}
          </div>
        </div>
      ))}
    </div>
  );

  const renderIssues = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[4] }}>
      {results.legalIssues.map((issue, index) => (
        <div key={index} style={{
          padding: tokens.spacing[4],
          backgroundColor: tokens.colors.neutral[50],
          borderRadius: tokens.borderRadius.md,
          border: `1px solid ${tokens.colors.neutral[200]}`
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: tokens.spacing[2]
          }}>
            <h5 style={{
              fontSize: tokens.typography.fontSize.base,
              fontWeight: tokens.typography.fontWeight.semibold,
              margin: 0,
              color: tokens.colors.neutral[900]
            }}>
              {issue.issue}
            </h5>
            <div style={{
              padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
              borderRadius: tokens.borderRadius.full,
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.medium,
              backgroundColor: 
                issue.severity === 'High' ? tokens.colors.error[100] :
                issue.severity === 'Medium' ? tokens.colors.warning[100] :
                tokens.colors.success[100],
              color:
                issue.severity === 'High' ? tokens.colors.error[700] :
                issue.severity === 'Medium' ? tokens.colors.warning[700] :
                tokens.colors.success[700]
            }}>
              {issue.severity}
            </div>
          </div>
          <p style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.neutral[700],
            margin: `0 0 ${tokens.spacing[2]} 0`,
            lineHeight: tokens.typography.lineHeight.relaxed
          }}>
            {issue.description}
          </p>
          <div style={{
            padding: tokens.spacing[2],
            backgroundColor: tokens.colors.primary[50],
            borderRadius: tokens.borderRadius.sm,
            borderLeft: `3px solid ${tokens.colors.primary[500]}`
          }}>
            <strong style={{ color: tokens.colors.primary[700] }}>Recommendation:</strong>{' '}
            <span style={{ color: tokens.colors.neutral[700] }}>{issue.recommendation}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'entities': return renderEntities();
      case 'timeline': return renderTimeline();
      case 'issues': return renderIssues();
      default: return renderOverview();
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{
                fontSize: tokens.typography.fontSize['2xl'],
                fontWeight: tokens.typography.fontWeight.semibold,
                margin: `0 0 ${tokens.spacing[1]} 0`
              }}>
                Analysis Results
              </h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing[3],
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.neutral[600]
              }}>
                <span>{results.documentInfo.filename}</span>
                <ConfidenceBadge confidence={results.documentInfo.confidence} tokens={tokens} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: tokens.spacing[2] }}>
              <Button variant="outline" onClick={() => onExport && onExport('pdf')}>
                Export PDF
              </Button>
              <Button variant="primary" onClick={() => onExport && onExport('report')}>
                Generate Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
            marginBottom: tokens.spacing[6]
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                  border: 'none',
                  background: 'none',
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                  color: activeTab === tab.id ? tokens.colors.primary[600] : tokens.colors.neutral[600],
                  borderBottom: activeTab === tab.id ? `2px solid ${tokens.colors.primary[600]}` : '2px solid transparent',
                  cursor: 'pointer',
                  transition: tokens.transitions.colors
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.color = tokens.colors.neutral[900];
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.color = tokens.colors.neutral[600];
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResults;