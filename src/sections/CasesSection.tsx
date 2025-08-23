/**
 * Cases Section - Core Workflow Step 1
 * Case creation and organization
 */

import React, { useState } from 'react';
import { Case } from '../types';
import Button from '../design/components/Button';
import Card, { CardHeader, CardContent } from '../design/components/Card';
import { Modal } from '../components/common/Modal';
import { CaseForm } from '../components/CaseForm';
import { AccessibleButton } from '../accessibility/KeyboardShortcuts';

interface CasesSectionProps {
  cases: Case[];
  selectedCase: Case | null;
  onCaseSelect: (case_: Case) => void;
  onCaseCreate: () => void;
  onCaseUpdate: () => void;
}

export const CasesSection: React.FC<CasesSectionProps> = ({
  cases,
  selectedCase,
  onCaseSelect,
  onCaseCreate,
  onCaseUpdate
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | undefined>();

  const handleNewCase = () => {
    setEditingCase(undefined);
    setShowForm(true);
  };

  const handleEditCase = (case_: Case) => {
    setEditingCase(case_);
    setShowForm(true);
  };

  const handleSaveCase = (case_: Case) => {
    setShowForm(false);
    setEditingCase(undefined);
    onCaseUpdate();
  };

  const handleCaseClick = (case_: Case) => {
    onCaseSelect(case_);
  };

  return (
    <div>
      {/* Header with Quick Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            margin: 0,
            color: '#1f2937'
          }}>
            Cases
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: '#6b7280',
            margin: '4px 0 0 0'
          }}>
            Manage and organize your legal cases
          </p>
        </div>

        <AccessibleButton
          onClick={handleNewCase}
          variant="primary"
          size="lg"
          ariaLabel="Create new case"
        >
          + New Case
        </AccessibleButton>
      </div>

      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <Card>
          <CardContent style={{ padding: '20px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
              {cases.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Total Cases
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent style={{ padding: '20px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#059669' }}>
              {cases.filter(c => c.status === 'active').length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Active Cases
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '20px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#dc2626' }}>
              {cases.filter(c => c.priority === 'high').length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              High Priority
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases List */}
      <Card>
        <CardHeader>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            All Cases ({cases.length})
          </h2>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '64px 24px',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📁</div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                margin: '0 0 8px 0',
                color: '#374151'
              }}>
                No Cases Yet
              </h3>
              <p style={{ marginBottom: '24px', fontSize: '1rem' }}>
                Get started by creating your first legal case
              </p>
              <AccessibleButton onClick={handleNewCase} size="lg">
                Create First Case
              </AccessibleButton>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {cases.map(case_ => (
                <div 
                  key={case_.id}
                  role="button"
                  tabIndex={0}
                  style={{
                    padding: '20px',
                    border: selectedCase?.id === case_.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: selectedCase?.id === case_.id ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => handleCaseClick(case_)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCaseClick(case_);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCase?.id !== case_.id) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCase?.id !== case_.id) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        {case_.title}
                      </h3>
                      
                      {/* Status Badge */}
                      <div style={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        fontWeight: '500',
                        backgroundColor: case_.status === 'active' ? '#dcfce7' : 
                                       case_.status === 'completed' ? '#e0f2fe' : '#f3f4f6',
                        color: case_.status === 'active' ? '#166534' : 
                               case_.status === 'completed' ? '#0e7490' : '#4b5563'
                      }}>
                        {case_.status.charAt(0).toUpperCase() + case_.status.slice(1)}
                      </div>

                      {/* Priority Badge */}
                      <div style={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        fontWeight: '500',
                        backgroundColor: case_.priority === 'high' ? '#fee2e2' : 
                                       case_.priority === 'medium' ? '#fef3c7' : '#f0f9ff',
                        color: case_.priority === 'high' ? '#991b1b' : 
                               case_.priority === 'medium' ? '#92400e' : '#1e40af'
                      }}>
                        {case_.priority.charAt(0).toUpperCase() + case_.priority.slice(1)}
                      </div>
                    </div>

                    <p style={{ 
                      margin: '0 0 8px 0', 
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      lineHeight: '1.4'
                    }}>
                      {case_.description}
                    </p>

                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#9ca3af',
                      display: 'flex',
                      gap: '16px'
                    }}>
                      <span>Created: {new Date(case_.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(case_.updatedAt).toLocaleDateString()}</span>
                      {case_.documents && (
                        <span>Documents: {case_.documents.length}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <AccessibleButton
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCase(case_);
                      }}
                      ariaLabel={`Edit case ${case_.title}`}
                    >
                      Edit
                    </AccessibleButton>
                    
                    <AccessibleButton
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCaseClick(case_);
                      }}
                      ariaLabel={`Open case ${case_.title}`}
                    >
                      Open →
                    </AccessibleButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCase(undefined);
        }}
        title={editingCase ? 'Edit Case' : 'New Case'}
        size="lg"
      >
        <CaseForm
          initialCase={editingCase}
          onSave={handleSaveCase}
          onCancel={() => {
            setShowForm(false);
            setEditingCase(undefined);
          }}
        />
      </Modal>
    </div>
  );
};

export default CasesSection;