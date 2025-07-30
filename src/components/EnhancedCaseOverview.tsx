import React, { useState, useEffect } from 'react';
import { Case, CaseDocument, Issue, Person } from '../types';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';

interface EnhancedCaseOverviewProps {
  caseData: Case;
  documents: CaseDocument[];
}

interface CaseStats {
  documentCount: number;
  documentsByCategory: Record<string, number>;
  issuesCount: number;
  issuesByStatus: Record<string, number>;
  personsCount: number;
  personsByRole: Record<string, number>;
  daysUntilHearing: number;
  preparationScore: number;
}

interface AICaseSummary {
  executiveSummary: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  criticalIssues: string[];
  recommendedActions: string[];
  riskAssessment: string;
  confidenceScore: number;
}

export const EnhancedCaseOverview: React.FC<EnhancedCaseOverviewProps> = ({ 
  caseData, 
  documents 
}) => {
  const [stats, setStats] = useState<CaseStats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [aiSummary, setAiSummary] = useState<AICaseSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadCaseData();
  }, [caseData.id, documents]);

  const loadCaseData = async () => {
    try {
      // Load issues
      const issuesData = localStorage.getItem(`issues_${caseData.id}`);
      const loadedIssues = issuesData ? JSON.parse(issuesData) : [];
      setIssues(loadedIssues);

      // Load persons
      const personsData = localStorage.getItem(`dramatis_personae_${caseData.id}`);
      const loadedPersons = personsData ? JSON.parse(personsData) : [];
      setPersons(loadedPersons);

      // Calculate stats
      const caseStats = calculateCaseStats(documents, loadedIssues, loadedPersons);
      setStats(caseStats);

      // Load recent activity
      const activity = generateRecentActivity(documents, loadedIssues, loadedPersons);
      setRecentActivity(activity);

    } catch (error) {
      console.error('Failed to load case data:', error);
    }
  };

  const calculateCaseStats = (docs: CaseDocument[], issues: Issue[], persons: Person[]): CaseStats => {
    // Calculate days until hearing
    const hearing = new Date(caseData.hearingDate);
    const today = new Date();
    const daysUntilHearing = Math.ceil((hearing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Document stats
    const documentsByCategory = docs.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Issues stats
    const issuesByStatus = issues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Persons stats
    const personsByRole = persons.reduce((acc, person) => {
      acc[person.role] = (acc[person.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate preparation score
    const preparationScore = calculatePreparationScore(docs, issues, persons, daysUntilHearing);

    return {
      documentCount: docs.length,
      documentsByCategory,
      issuesCount: issues.length,
      issuesByStatus,
      personsCount: persons.length,
      personsByRole,
      daysUntilHearing,
      preparationScore
    };
  };

  const calculatePreparationScore = (docs: CaseDocument[], issues: Issue[], persons: Person[], daysLeft: number): number => {
    let score = 0;
    const maxScore = 100;

    // Documents score (30 points)
    if (docs.length > 0) score += 10;
    if (docs.length >= 5) score += 10;
    if (docs.some(d => d.category === 'pleadings')) score += 5;
    if (docs.some(d => d.type === 'witness_statement')) score += 5;

    // Issues score (25 points)  
    if (issues.length > 0) score += 10;
    if (issues.some(i => i.status === 'resolved')) score += 10;
    if (issues.filter(i => i.status === 'unresolved').length <= issues.length * 0.3) score += 5;

    // Persons score (20 points)
    if (persons.length > 0) score += 10;
    if (persons.some(p => p.role === 'witness')) score += 5;
    if (persons.some(p => p.role === 'expert')) score += 5;

    // Time factor (25 points)
    if (daysLeft > 30) score += 25;
    else if (daysLeft > 14) score += 20;
    else if (daysLeft > 7) score += 15;
    else if (daysLeft > 3) score += 10;
    else if (daysLeft > 0) score += 5;

    return Math.min(score, maxScore);
  };

  const generateRecentActivity = (docs: CaseDocument[], issues: Issue[], persons: Person[]) => {
    const activities: Array<{type: string, icon: string, title: string, time: string, color: string}> = [];

    // Recent documents (last 7 days)
    const recentDocs = docs
      .filter(d => d.createdAt && new Date(d.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 3);

    recentDocs.forEach(doc => {
      activities.push({
        type: 'document',
        icon: '📄',
        title: `Added document: ${doc.title}`,
        time: new Date(doc.createdAt!).toLocaleDateString(),
        color: 'blue'
      });
    });

    // Recent issues
    const recentIssues = issues
      .filter(i => i.updatedAt && new Date(i.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, 2);

    recentIssues.forEach(issue => {
      activities.push({
        type: 'issue',
        icon: '⚖️',
        title: `Updated issue: ${issue.title}`,
        time: new Date(issue.updatedAt!).toLocaleDateString(),
        color: 'orange'
      });
    });

    return activities.slice(0, 5);
  };

  const generateAISummary = async () => {
    setIsGeneratingSummary(true);
    
    try {
      // Mock AI summary - replace with actual AI when available
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      const mockSummary: AICaseSummary = {
        executiveSummary: `This is a ${getComplexityLevel()} case involving ${caseData.client} and ${caseData.opponent}. Based on analysis of ${documents.length} documents and ${issues.length} identified issues, the case appears to center around ${getMainIssueType()}.`,
        keyStrengths: [
          'Strong documentary evidence base',
          'Clear contractual obligations',
          'Favorable precedent cases identified'
        ],
        keyWeaknesses: [
          'Limited witness testimony',
          'Some gaps in evidence chain',
          'Opponent may have strong counterclaims'
        ],
        criticalIssues: issues.filter(i => i.priority === 'high').map(i => i.title).slice(0, 3),
        recommendedActions: [
          'Gather additional witness statements',
          'Review opponent\'s expert reports',
          'Prepare settlement position analysis',
          'Finalize hearing bundle preparation'
        ],
        riskAssessment: stats && stats.preparationScore > 70 ? 'Low to moderate risk' : 'Moderate to high risk',
        confidenceScore: 0.75
      };
      
      setAiSummary(mockSummary);
    } catch (error) {
      console.error('AI summary generation failed:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const getComplexityLevel = () => {
    const score = issues.length + documents.length + persons.length;
    if (score > 50) return 'highly complex';
    if (score > 25) return 'moderately complex';
    return 'straightforward';
  };

  const getMainIssueType = () => {
    if (issues.length === 0) return 'contractual matters';
    const categories = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mainCategory = Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b);
    return `${mainCategory} matters`;
  };

  const getPreparationColor = (score: number) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getDaysColor = (days: number) => {
    if (days <= 0) return '#f44336';
    if (days <= 7) return '#ff5722';
    if (days <= 30) return '#ff9800';
    return '#4caf50';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!stats) {
    return <div className="loading">Loading case overview...</div>;
  }

  return (
    <div className="enhanced-case-overview">
      {/* Header Section */}
      <div className="overview-header">
        <div className="case-info">
          <h2>{caseData.title}</h2>
          <p className="case-reference">{caseData.courtReference}</p>
          <div className="parties">
            <span className="client">{caseData.client}</span>
            <span className="vs"> v </span>
            <span className="opponent">{caseData.opponent}</span>
          </div>
        </div>
        <div className="hearing-countdown">
          <div className="countdown-number" style={{ color: getDaysColor(stats.daysUntilHearing) }}>
            {Math.abs(stats.daysUntilHearing)}
          </div>
          <div className="countdown-label">
            {stats.daysUntilHearing > 0 ? 'days until hearing' : 'days since hearing'}
          </div>
          <div className="hearing-date">📅 {formatDate(caseData.hearingDate)}</div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-value">{stats.documentCount}</div>
          <div className="stat-label">Documents</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-value">{stats.issuesCount}</div>
          <div className="stat-label">Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.personsCount}</div>
          <div className="stat-label">Persons</div>
        </div>
        <div className="stat-card preparation-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value" style={{ color: getPreparationColor(stats.preparationScore) }}>
            {stats.preparationScore}%
          </div>
          <div className="stat-label">Preparation</div>
        </div>
      </div>

      <div className="overview-content">
        {/* Basic Case Info */}
        <div className="info-section">
          <h3>Case Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Court:</label>
              <p>{caseData.court}</p>
            </div>
            <div className="info-item">
              <label>Judge:</label>
              <p>{caseData.judge || 'Not assigned'}</p>
            </div>
            <div className="info-item">
              <label>Status:</label>
              <p className={`status-${caseData.status}`}>
                {caseData.status.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* AI Case Summary */}
        <div className="ai-summary-section">
          <div className="section-header">
            <h3>🤖 AI Case Summary</h3>
            {!aiSummary && !isGeneratingSummary && (
              <button className="btn btn-ai" onClick={generateAISummary}>
                Generate Summary
              </button>
            )}
          </div>
          
          {isGeneratingSummary && (
            <div className="ai-loading">
              <div className="loading-animation">🤖</div>
              <p>AI is analyzing your case...</p>
            </div>
          )}
          
          {aiSummary && (
            <div className="ai-summary-content">
              <div className="executive-summary">
                <h4>Executive Summary</h4>
                <p>{aiSummary.executiveSummary}</p>
              </div>
              
              <div className="summary-grid">
                <div className="summary-card strengths">
                  <h4>💪 Key Strengths</h4>
                  <ul>
                    {aiSummary.keyStrengths.map((strength, i) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="summary-card weaknesses">
                  <h4>⚠️ Key Weaknesses</h4>
                  <ul>
                    {aiSummary.keyWeaknesses.map((weakness, i) => (
                      <li key={i}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {aiSummary.criticalIssues.length > 0 && (
                <div className="critical-issues">
                  <h4>🚨 Critical Issues</h4>
                  <ul>
                    {aiSummary.criticalIssues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="recommended-actions">
                <h4>📋 Recommended Next Actions</h4>
                <ul>
                  {aiSummary.recommendedActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
              
              <div className="risk-assessment">
                <strong>Risk Assessment:</strong> {aiSummary.riskAssessment}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="recent-activity-section">
            <h3>📈 Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.map((activity, i) => (
                <div key={i} className="activity-item">
                  <span className="activity-icon">{activity.icon}</span>
                  <div className="activity-content">
                    <p>{activity.title}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Case Breakdown */}
        <div className="breakdown-section">
          <h3>📊 Case Breakdown</h3>
          <div className="breakdown-grid">
            {Object.entries(stats.documentsByCategory).length > 0 && (
              <div className="breakdown-card">
                <h4>Documents by Category</h4>
                {Object.entries(stats.documentsByCategory).map(([category, count]) => (
                  <div key={category} className="breakdown-item">
                    <span className="category-name">{category}</span>
                    <span className="category-count">{count}</span>
                  </div>
                ))}
              </div>
            )}
            
            {Object.entries(stats.issuesByStatus).length > 0 && (
              <div className="breakdown-card">
                <h4>Issues by Status</h4>
                {Object.entries(stats.issuesByStatus).map(([status, count]) => (
                  <div key={status} className="breakdown-item">
                    <span className="status-name">{status}</span>
                    <span className="status-count">{count}</span>
                  </div>
                ))}
              </div>
            )}
            
            {Object.entries(stats.personsByRole).length > 0 && (
              <div className="breakdown-card">
                <h4>Persons by Role</h4>
                {Object.entries(stats.personsByRole).map(([role, count]) => (
                  <div key={role} className="breakdown-item">
                    <span className="role-name">{role}</span>
                    <span className="role-count">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .enhanced-case-overview {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .overview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
        }

        .case-info h2 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .case-reference {
          margin: 0 0 12px 0;
          opacity: 0.9;
          font-size: 16px;
        }

        .parties {
          font-size: 18px;
          font-weight: 500;
        }

        .vs {
          margin: 0 12px;
          opacity: 0.8;
        }

        .hearing-countdown {
          text-align: center;
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }

        .countdown-number {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .countdown-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 8px;
        }

        .hearing-date {
          font-size: 14px;
          opacity: 0.8;
        }

        .stats-dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          text-align: center;
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
        }

        .stat-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .stat-value {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #333;
        }

        .stat-label {
          color: #666;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .preparation-card .stat-value {
          font-size: 32px;
        }

        .overview-content {
          display: grid;
          gap: 24px;
        }

        .info-section,
        .ai-summary-section,
        .recent-activity-section,
        .breakdown-section {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h3 {
          margin: 0;
          color: #333;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .info-item label {
          display: block;
          font-weight: 600;
          color: #666;
          margin-bottom: 4px;
        }

        .info-item p {
          margin: 0;
          color: #333;
          font-size: 16px;
        }

        .ai-loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .loading-animation {
          font-size: 48px;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        .ai-summary-content {
          display: grid;
          gap: 20px;
        }

        .executive-summary {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          border-left: 4px solid #007bff;
        }

        .executive-summary h4 {
          margin: 0 0 12px 0;
          color: #007bff;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .summary-card {
          padding: 20px;
          border-radius: 12px;
        }

        .strengths {
          background: #f0f9f0;
          border-left: 4px solid #4caf50;
        }

        .weaknesses {
          background: #fff3f3;
          border-left: 4px solid #f44336;
        }

        .summary-card h4 {
          margin: 0 0 12px 0;
        }

        .strengths h4 {
          color: #4caf50;
        }

        .weaknesses h4 {
          color: #f44336;
        }

        .summary-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .summary-card li {
          padding: 4px 0;
          color: #555;
        }

        .critical-issues {
          padding: 20px;
          background: #fff8f0;
          border-radius: 12px;
          border-left: 4px solid #ff9800;
        }

        .critical-issues h4 {
          margin: 0 0 12px 0;
          color: #ff9800;
        }

        .recommended-actions {
          padding: 20px;
          background: #f0f8ff;
          border-radius: 12px;
          border-left: 4px solid #2196f3;
        }

        .recommended-actions h4 {
          margin: 0 0 12px 0;
          color: #2196f3;
        }

        .risk-assessment {
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
          font-size: 16px;
          color: #555;
        }

        .activity-list {
          display: grid;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .activity-icon {
          font-size: 20px;
        }

        .activity-content {
          flex: 1;
        }

        .activity-content p {
          margin: 0 0 4px 0;
          color: #333;
        }

        .activity-time {
          font-size: 12px;
          color: #666;
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .breakdown-card {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .breakdown-card h4 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .breakdown-item:last-child {
          border-bottom: none;
        }

        .category-name,
        .status-name,
        .role-name {
          color: #555;
          text-transform: capitalize;
        }

        .category-count,
        .status-count,
        .role-count {
          font-weight: 600;
          color: #333;
        }

        .btn-ai {
          background: #4caf50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-ai:hover {
          background: #45a049;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        @media (max-width: 768px) {
          .overview-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
          
          .stats-dashboard {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .summary-grid {
            grid-template-columns: 1fr;
          }
          
          .breakdown-grid {
            grid-template-columns: 1fr;
          }
        }

        .status-preparation { color: #f57c00; }
        .status-ready { color: #4caf50; }
        .status-concluded { color: #666; }
      `}</style>
    </div>
  );
};