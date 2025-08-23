/**
 * Real-time Workflow Status Indicator
 * Shows current workflow completeness and provides guidance
 */

import React, { useState, useEffect } from 'react';
import { workflowValidator, WorkflowValidation } from '../utils/workflowValidator';
import { AccessibleButton } from '../accessibility/KeyboardShortcuts';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

interface WorkflowStatusIndicatorProps {
  selectedCase: any;
  analysisResults: any;
  consultationResults: any;
  workflowProgress: any;
  onNavigate: (section: string) => void;
}

export const WorkflowStatusIndicator: React.FC<WorkflowStatusIndicatorProps> = ({
  selectedCase,
  analysisResults,
  consultationResults,
  workflowProgress,
  onNavigate
}) => {
  const { announce } = useAccessibility();
  const [validation, setValidation] = useState<WorkflowValidation | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    const currentValidation = workflowValidator.validateCompleteWorkflow(
      selectedCase,
      analysisResults,
      consultationResults,
      workflowProgress
    );
    setValidation(currentValidation);
  }, [selectedCase, analysisResults, consultationResults, workflowProgress]);
  
  if (!validation) return null;
  
  const getStatusColor = () => {
    if (validation.confidence >= 0.9) return '#10b981'; // Green
    if (validation.confidence >= 0.7) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };
  
  const getStatusText = () => {
    if (validation.isValid) return 'Workflow Complete';
    if (validation.confidence >= 0.7) return 'Nearly Complete';
    return 'In Progress';
  };
  
  const getNextAction = () => {
    if (validation.missingComponents.includes('Selected Case')) {
      return { text: 'Select Case', section: 'cases' };
    }
    if (validation.missingComponents.includes('Document Analysis')) {
      return { text: 'Analyze Documents', section: 'analyze' };
    }
    if (validation.missingComponents.includes('AI Consultation')) {
      return { text: 'Get AI Insights', section: 'insights' };
    }
    return { text: 'Review Results', section: 'insights' };
  };
  
  const nextAction = getNextAction();
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'white',
      border: `2px solid ${getStatusColor()}`,
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      minWidth: '280px',
      maxWidth: '400px',
      zIndex: 1000
    }}>
      {/* Compact Status Bar */}
      <div 
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
        }}
        onClick={() => {
          setIsExpanded(!isExpanded);
          announce(isExpanded ? 'Workflow status collapsed' : 'Workflow status expanded');
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: getStatusColor()
          }} />
          <span style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            {getStatusText()}
          </span>
          <span style={{ 
            fontSize: '0.75rem', 
            color: '#6b7280'
          }}>
            {Math.round(validation.confidence * 100)}%
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!validation.isValid && (
            <AccessibleButton
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(nextAction.section);
                announce(`Navigating to ${nextAction.text}`);
              }}
              ariaLabel={`Next step: ${nextAction.text}`}
            >
              {nextAction.text}
            </AccessibleButton>
          )}
          <span style={{ 
            fontSize: '0.75rem',
            color: '#9ca3af',
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            ▼
          </span>
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div style={{ padding: '16px' }}>
          {/* Progress Stages */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              Workflow Progress
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {[
                { stage: 'case_selected', label: 'Case', icon: '📁' },
                { stage: 'documents_uploaded', label: 'Upload', icon: '📄' },
                { stage: 'analysis_complete', label: 'Analysis', icon: '🔍' },
                { stage: 'consultation_complete', label: 'AI', icon: '🤖' },
                { stage: 'ready_for_export', label: 'Export', icon: '📋' }
              ].map(({ stage, label, icon }) => (
                <div
                  key={stage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    backgroundColor: workflowProgress?.completedStages?.includes(stage) 
                      ? '#dcfce7' : '#f3f4f6',
                    color: workflowProgress?.completedStages?.includes(stage)
                      ? '#166534' : '#6b7280'
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Missing Components */}
          {validation.missingComponents.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                marginBottom: '6px',
                color: '#dc2626'
              }}>
                Missing Components
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {validation.missingComponents.join(' • ')}
              </div>
            </div>
          )}
          
          {/* Recommendations */}
          {validation.recommendations.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                marginBottom: '6px',
                color: '#1f2937'
              }}>
                Recommendations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {validation.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '4px'
                  }}>
                    <span style={{ color: '#3b82f6', fontWeight: '600' }}>•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          {validation.isValid && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f0f9ff',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0369a1' }}>
                🎉 Ready for Professional Export!
              </div>
              <div style={{ fontSize: '0.75rem', color: '#0c4a6e', marginTop: '2px' }}>
                Generate court-ready documents from Insights section
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowStatusIndicator;