import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { Case } from '../types';

interface GlobalDeadline {
  id: string;
  caseId: string;
  caseName: string;
  caseReference: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'upcoming' | 'due-soon' | 'overdue' | 'completed';
  category: 'filing' | 'disclosure' | 'hearing' | 'service' | 'compliance' | 'other';
  daysUntilDue: number;
  relatedOrderId: string;
}

interface GlobalProceduralCalendarProps {
  onClose: () => void;
}

export const GlobalProceduralCalendar: React.FC<GlobalProceduralCalendarProps> = ({ onClose }) => {
  const [allDeadlines, setAllDeadlines] = useState<GlobalDeadline[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'list'>('list');
  const [filterCase, setFilterCase] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'case' | 'priority'>('date');

  useEffect(() => {
    loadAllDeadlines();
  }, []);

  const loadAllDeadlines = async () => {
    try {
      // Load all cases
      const allCases = await storage.getCases();
      setCases(allCases);

      // Aggregate deadlines from all cases
      const aggregatedDeadlines: GlobalDeadline[] = [];
      
      for (const caseData of allCases) {
        // Load deadlines for this case
        const deadlinesKey = `deadlines_${caseData.id}`;
        const deadlinesData = localStorage.getItem(deadlinesKey);
        
        if (deadlinesData) {
          const caseDeadlines = JSON.parse(deadlinesData);
          
          // Add case information to each deadline
          const enrichedDeadlines = caseDeadlines.map((deadline: any) => {
            const dueDate = new Date(deadline.dueDate);
            const today = new Date();
            const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            let status: GlobalDeadline['status'] = 'upcoming';
            if (deadline.status === 'completed') {
              status = 'completed';
            } else if (daysUntil < 0) {
              status = 'overdue';
            } else if (daysUntil <= 7) {
              status = 'due-soon';
            }
            
            return {
              ...deadline,
              caseId: caseData.id,
              caseName: caseData.title,
              caseReference: caseData.courtReference,
              daysUntilDue: daysUntil,
              status
            };
          });
          
          aggregatedDeadlines.push(...enrichedDeadlines);
        }
      }
      
      // Sort by date initially
      aggregatedDeadlines.sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
      
      setAllDeadlines(aggregatedDeadlines);
      
    } catch (error) {
      console.error('Failed to load deadlines:', error);
    }
  };

  const getFilteredDeadlines = () => {
    let filtered = [...allDeadlines];
    
    // Apply filters
    if (filterCase !== 'all') {
      filtered = filtered.filter(d => d.caseId === filterCase);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(d => d.priority === filterPriority);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => 
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        break;
      case 'case':
        filtered.sort((a, b) => 
          a.caseName.localeCompare(b.caseName)
        );
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        filtered.sort((a, b) => 
          priorityOrder[a.priority] - priorityOrder[b.priority]
        );
        break;
    }
    
    return filtered;
  };

  const getStatusColor = (status: GlobalDeadline['status']) => {
    switch (status) {
      case 'overdue': return '#f44336';
      case 'due-soon': return '#ff9800';
      case 'upcoming': return '#4caf50';
      case 'completed': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: GlobalDeadline['status']) => {
    switch (status) {
      case 'overdue': return '⚠️';
      case 'due-soon': return '⏰';
      case 'upcoming': return '📅';
      case 'completed': return '✅';
      default: return '📋';
    }
  };

  const getPriorityIcon = (priority: GlobalDeadline['priority']) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const renderListView = () => {
    const deadlines = getFilteredDeadlines();
    const upcomingDeadlines = deadlines.filter(d => d.status !== 'completed');
    const completedDeadlines = deadlines.filter(d => d.status === 'completed');
    
    return (
      <div className="calendar-list-view">
        {/* Summary Cards */}
        <div className="deadline-summary-cards">
          <div className="summary-card overdue">
            <h3>{deadlines.filter(d => d.status === 'overdue').length}</h3>
            <p>Overdue</p>
          </div>
          <div className="summary-card due-soon">
            <h3>{deadlines.filter(d => d.status === 'due-soon').length}</h3>
            <p>Due Soon</p>
          </div>
          <div className="summary-card upcoming">
            <h3>{deadlines.filter(d => d.status === 'upcoming').length}</h3>
            <p>Upcoming</p>
          </div>
          <div className="summary-card completed">
            <h3>{deadlines.filter(d => d.status === 'completed').length}</h3>
            <p>Completed</p>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="deadline-section">
          <h3>📋 Active Deadlines ({upcomingDeadlines.length})</h3>
          {upcomingDeadlines.length === 0 ? (
            <div className="empty-state">
              <p>No active deadlines found.</p>
            </div>
          ) : (
            <div className="deadline-cards">
              {upcomingDeadlines.map(deadline => (
                <div key={deadline.id} className={`global-deadline-card ${deadline.status}`}>
                  <div className="deadline-header">
                    <div className="deadline-case-info">
                      <span className="case-name">{deadline.caseName}</span>
                      <span className="case-ref">{deadline.caseReference}</span>
                    </div>
                    <div className="deadline-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(deadline.status) }}
                      >
                        {getStatusIcon(deadline.status)} {deadline.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="deadline-body">
                    <h4>{deadline.title}</h4>
                    <p>{deadline.description}</p>
                    
                    <div className="deadline-details">
                      <div className="detail-item">
                        <span className="detail-label">Due Date:</span>
                        <span className="detail-value">
                          {new Date(deadline.dueDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="detail-label">Days Until Due:</span>
                        <span className="detail-value">
                          {deadline.daysUntilDue === 0 ? 'Due Today' :
                           deadline.daysUntilDue < 0 ? `${Math.abs(deadline.daysUntilDue)} days overdue` :
                           `${deadline.daysUntilDue} days`}
                        </span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="detail-label">Category:</span>
                        <span className="detail-value category-badge">{deadline.category}</span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="detail-label">Priority:</span>
                        <span className="detail-value">
                          {getPriorityIcon(deadline.priority)} {deadline.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Deadlines */}
        {completedDeadlines.length > 0 && (
          <div className="deadline-section completed-section">
            <h3>✅ Completed Deadlines ({completedDeadlines.length})</h3>
            <div className="deadline-cards">
              {completedDeadlines.map(deadline => (
                <div key={deadline.id} className="global-deadline-card completed">
                  <div className="deadline-header">
                    <div className="deadline-case-info">
                      <span className="case-name">{deadline.caseName}</span>
                      <span className="case-ref">{deadline.caseReference}</span>
                    </div>
                    <div className="deadline-status">
                      <span className="status-badge completed">
                        ✅ COMPLETED
                      </span>
                    </div>
                  </div>
                  
                  <div className="deadline-body">
                    <h4>{deadline.title}</h4>
                    <p className="completed-text">
                      Was due: {new Date(deadline.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    // TODO: Implement calendar month view
    return (
      <div className="calendar-month-view">
        <div className="coming-soon">
          <h3>📅 Month View Coming Soon</h3>
          <p>The calendar month view is under development. Please use the list view for now.</p>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    // TODO: Implement calendar week view
    return (
      <div className="calendar-week-view">
        <div className="coming-soon">
          <h3>📅 Week View Coming Soon</h3>
          <p>The calendar week view is under development. Please use the list view for now.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="global-procedural-calendar">
      <div className="calendar-header">
        <div className="header-content">
          <h2>📅 Global Procedural Calendar</h2>
          <p>All deadlines across all your cases in one place</p>
        </div>
        <button className="btn btn-secondary close-btn" onClick={onClose}>
          ✕ Close
        </button>
      </div>

      {/* Controls Bar */}
      <div className="calendar-controls">
        <div className="view-switcher">
          <button 
            className={`view-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            📋 List View
          </button>
          <button 
            className={`view-btn ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            📅 Week View
          </button>
          <button 
            className={`view-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            📆 Month View
          </button>
        </div>

        <div className="filters">
          <select 
            value={filterCase} 
            onChange={(e) => setFilterCase(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Cases</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.courtReference})
              </option>
            ))}
          </select>

          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="high">🔴 High Priority</option>
            <option value="medium">🟡 Medium Priority</option>
            <option value="low">🟢 Low Priority</option>
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="overdue">⚠️ Overdue</option>
            <option value="due-soon">⏰ Due Soon</option>
            <option value="upcoming">📅 Upcoming</option>
            <option value="completed">✅ Completed</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="filter-select"
          >
            <option value="date">Sort by Date</option>
            <option value="case">Sort by Case</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="calendar-content">
        {view === 'list' && renderListView()}
        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
      </div>
    </div>
  );
};