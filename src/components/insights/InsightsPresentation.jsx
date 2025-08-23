/**
 * AI Insights Presentation - Week 15 Day 3-4
 * Privacy-first AI strategic consultation interface
 */

import React from 'react';
import { useTheme } from '../../design/ThemeProvider.jsx';
import Card, { CardHeader, CardContent } from '../../design/components/Card.jsx';

// Icon Components
const ShieldCheckIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const TargetIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    <circle cx="12" cy="12" r="3" strokeWidth={2} />
    <circle cx="12" cy="12" r="6" strokeWidth={2} />
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
  </svg>
);

const DocumentSearchIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
  </svg>
);

const ExclamationTriangleIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const LightBulbIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ClockIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Confidence Badge Component
const ConfidenceBadge = ({ confidence }) => {
  const { tokens } = useTheme();
  
  const getConfidenceColor = () => {
    if (confidence >= 0.9) return tokens.colors.success[100];
    if (confidence >= 0.7) return tokens.colors.warning[100];
    return tokens.colors.error[100];
  };
  
  const getTextColor = () => {
    if (confidence >= 0.9) return tokens.colors.success[700];
    if (confidence >= 0.7) return tokens.colors.warning[700];
    return tokens.colors.error[700];
  };

  return (
    <div style={{
      padding: `${tokens.spacing[1]} ${tokens.spacing[3]}`,
      backgroundColor: getConfidenceColor(),
      color: getTextColor(),
      borderRadius: tokens.borderRadius.full,
      fontSize: tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.medium
    }}>
      {Math.round(confidence * 100)}% confidence
    </div>
  );
};

// Consultation History Item Component
const ConsultationHistoryItem = ({ consultation }) => {
  const { tokens } = useTheme();
  
  return (
    <div style={{
      padding: tokens.spacing[3],
      backgroundColor: tokens.colors.neutral[50],
      borderRadius: tokens.borderRadius.md,
      borderLeft: `3px solid ${tokens.colors.primary[500]}`
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginBottom: tokens.spacing[2]
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
          <ClockIcon style={{ width: '16px', height: '16px', color: tokens.colors.neutral[500] }} />
          <span style={{ 
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.neutral[600]
          }}>
            {consultation.timestamp}
          </span>
        </div>
        <span style={{
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.primary[600],
          fontWeight: tokens.typography.fontWeight.medium
        }}>
          {consultation.type}
        </span>
      </div>
      <p style={{
        fontSize: tokens.typography.fontSize.sm,
        color: tokens.colors.neutral[700],
        margin: 0
      }}>
        {consultation.summary}
      </p>
    </div>
  );
};

// Insight Card Component
const InsightCard = ({ title, icon: Icon, content, confidence, variant = 'default' }) => {
  const { tokens } = useTheme();
  
  const getVariantStyles = () => {
    if (variant === 'warning') {
      return {
        backgroundColor: tokens.colors.warning[50],
        borderColor: tokens.colors.warning[200]
      };
    }
    return {
      backgroundColor: tokens.colors.neutral[50],
      borderColor: tokens.colors.neutral[200]
    };
  };

  const variantStyles = getVariantStyles();

  return (
    <Card style={{
      border: `1px solid ${variantStyles.borderColor}`,
      backgroundColor: variantStyles.backgroundColor
    }}>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[3] }}>
            <Icon style={{ 
              width: '24px', 
              height: '24px', 
              color: tokens.colors.primary[600] 
            }} />
            <h3 style={{ 
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.medium,
              margin: 0
            }}>
              {title}
            </h3>
          </div>
          <ConfidenceBadge confidence={confidence} />
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ color: tokens.colors.neutral[700] }}>
          {Array.isArray(content) ? (
            <ul style={{ 
              margin: 0,
              paddingLeft: tokens.spacing[5],
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacing[2]
            }}>
              {content.map((item, index) => (
                <li key={index} style={{
                  fontSize: tokens.typography.fontSize.sm,
                  lineHeight: tokens.typography.lineHeight.relaxed
                }}>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{
              fontSize: tokens.typography.fontSize.sm,
              lineHeight: tokens.typography.lineHeight.relaxed,
              margin: 0
            }}>
              {content}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Insights Presentation Component
export const InsightsPresentation = ({ insights, consultation_history = [] }) => {
  const { tokens } = useTheme();
  
  return (
    <div style={{ 
      padding: tokens.spacing[6],
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spacing[6]
    }}>
      {/* Consultation Status */}
      <div style={{
        background: `linear-gradient(to right, ${tokens.colors.primary[50]}, ${tokens.colors.primary[100]})`,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing[6]
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.neutral[900],
              margin: 0,
              marginBottom: tokens.spacing[1]
            }}>
              AI Strategic Consultation
            </h2>
            <p style={{
              color: tokens.colors.neutral[600],
              margin: 0
            }}>
              Privacy-first legal analysis • No client data transmitted
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
            <ShieldCheckIcon style={{ 
              width: '24px', 
              height: '24px', 
              color: tokens.colors.success[500] 
            }} />
            <span style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.success[700]
            }}>
              100% Private
            </span>
          </div>
        </div>
      </div>

      {/* Strategic Framework */}
      <InsightCard
        title="Strategic Framework"
        icon={TargetIcon}
        content={insights.strategic_framework}
        confidence={insights.confidence_scores.strategic}
      />

      {/* Evidence Priorities */}
      <InsightCard
        title="Evidence Development"
        icon={DocumentSearchIcon}
        content={insights.evidence_priorities}
        confidence={insights.confidence_scores.evidence}
      />

      {/* Risk Assessment */}
      <InsightCard
        title="Risk Assessment"
        icon={ExclamationTriangleIcon}
        content={insights.risk_assessment}
        confidence={insights.confidence_scores.risk}
        variant="warning"
      />

      {/* Tactical Recommendations */}
      <InsightCard
        title="Tactical Recommendations"
        icon={LightBulbIcon}
        content={insights.tactical_recommendations}
        confidence={insights.confidence_scores.tactical}
      />

      {/* Consultation History */}
      {consultation_history.length > 0 && (
        <Card>
          <CardHeader>
            <h3 style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.medium,
              margin: 0
            }}>
              Consultation History
            </h3>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[4] }}>
              {consultation_history.map((consultation, index) => (
                <ConsultationHistoryItem 
                  key={index} 
                  consultation={consultation} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InsightsPresentation;