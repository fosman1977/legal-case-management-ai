import React, { useState, useEffect } from 'react';
import { parallelAIService, ResearchTask, ResearchQueue, ResearchResult } from '../services/parallelAIService';

interface ParallelAIResearchDashboardProps {
  onTaskComplete?: (task: ResearchTask) => void;
  documentId?: string;
  caseId?: string;
}

export const ParallelAIResearchDashboard: React.FC<ParallelAIResearchDashboardProps> = ({
  onTaskComplete,
  documentId,
  caseId
}) => {
  const [queue, setQueue] = useState<ResearchQueue>({ pending: [], running: [], completed: [], failed: [] });
  const [selectedTask, setSelectedTask] = useState<ResearchTask | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Initialize service and load queue
    const savedApiKey = localStorage.getItem('parallelai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      parallelAIService.initialize(savedApiKey);
      setIsConfigured(true);
    }

    setQueue(parallelAIService.getQueue());

    // Subscribe to queue changes
    const unsubscribeQueue = parallelAIService.onQueueChange(setQueue);
    const unsubscribeStatus = parallelAIService.onStatusChange((task) => {
      if (task.status === 'completed' && onTaskComplete) {
        onTaskComplete(task);
      }
    });

    return () => {
      unsubscribeQueue();
      unsubscribeStatus();
    };
  }, [onTaskComplete]);

  const handleConfigurePArallelAI = () => {
    if (apiKey.trim()) {
      localStorage.setItem('parallelai_api_key', apiKey.trim());
      parallelAIService.initialize(apiKey.trim());
      setIsConfigured(true);
    }
  };

  const handleCreateTask = async (formData: {
    title: string;
    description: string;
    researchType: 'case-law' | 'statutes' | 'precedents' | 'authorities' | 'background' | 'custom';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
  }) => {
    try {
      const task = await parallelAIService.createResearchTask({
        title: formData.title,
        description: formData.description,
        researchType: formData.researchType,
        priority: formData.priority,
        tags: formData.tags,
        documentId,
        caseId
      });
      setShowCreateForm(false);
      console.log('Research task created:', task.id);
    } catch (error) {
      console.error('Failed to create research task:', error);
    }
  };

  if (!isConfigured) {
    return (
      <div className="parallel-ai-config">
        <h3>🔍 Configure Parallel AI Research</h3>
        <p>Enter your Parallel AI API key to enable automated legal research:</p>
        <div className="config-form">
          <input
            type="password"
            placeholder="Parallel AI API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleConfigurePArallelAI()}
          />
          <button onClick={handleConfigurePArallelAI} disabled={!apiKey.trim()}>
            Configure
          </button>
        </div>
        <div className="help-text">
          <p>Don't have an API key? <a href="https://parallel.ai/api" target="_blank" rel="noopener noreferrer">Get one here</a></p>
          <p>Parallel AI provides deep legal research capabilities for case law, statutes, and precedents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parallel-ai-dashboard">
      <div className="dashboard-header">
        <h2>🔍 Legal Research Queue</h2>
        <div className="header-actions">
          <button 
            className="create-task-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + New Research Task
          </button>
          <QueueStats queue={queue} />
        </div>
      </div>

      {showCreateForm && (
        <CreateTaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="queue-sections">
        <QueueSection
          title="Running"
          tasks={queue.running}
          onTaskSelect={setSelectedTask}
          showProgress={true}
        />
        <QueueSection
          title="Pending"
          tasks={queue.pending}
          onTaskSelect={setSelectedTask}
          showActions={true}
        />
        <QueueSection
          title="Completed"
          tasks={queue.completed}
          onTaskSelect={setSelectedTask}
          showResults={true}
        />
        {queue.failed.length > 0 && (
          <QueueSection
            title="Failed"
            tasks={queue.failed}
            onTaskSelect={setSelectedTask}
            showRetry={true}
          />
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

const QueueStats: React.FC<{ queue: ResearchQueue }> = ({ queue }) => {
  const stats = parallelAIService.getStats();
  
  return (
    <div className="queue-stats">
      <div className="stat">
        <span className="stat-value">{queue.running.length}</span>
        <span className="stat-label">Running</span>
      </div>
      <div className="stat">
        <span className="stat-value">{queue.pending.length}</span>
        <span className="stat-label">Pending</span>
      </div>
      <div className="stat">
        <span className="stat-value">{stats.completedTasks}</span>
        <span className="stat-label">Completed</span>
      </div>
      <div className="stat">
        <span className="stat-value">{Math.round(stats.successRate * 100)}%</span>
        <span className="stat-label">Success</span>
      </div>
    </div>
  );
};

interface CreateTaskFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    researchType: 'case-law' | 'statutes' | 'precedents' | 'authorities' | 'background' | 'custom';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
  }) => void;
  onCancel: () => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    researchType: 'case-law' as const,
    priority: 'medium' as const,
    tags: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.description.trim()) {
      onSubmit(formData);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const researchTypeDescriptions = {
    'case-law': 'Research relevant case precedents and judicial decisions',
    'statutes': 'Find applicable statutes, regulations, and legislative history',
    'precedents': 'Identify binding and persuasive precedents for your case',
    'authorities': 'Locate authoritative legal sources and verify current validity',
    'background': 'Comprehensive background research with historical context',
    'custom': 'Custom research according to your specific requirements'
  };

  return (
    <div className="create-task-modal">
      <div className="modal-content">
        <h3>Create Research Task</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Research Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Contract termination precedents in UK employment law"
              required
            />
          </div>

          <div className="form-group">
            <label>Research Type</label>
            <select
              value={formData.researchType}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                researchType: e.target.value as any 
              }))}
            >
              {Object.entries(researchTypeDescriptions).map(([type, description]) => (
                <option key={type} value={type}>
                  {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} - {description}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description & Instructions</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide detailed research requirements, specific questions, jurisdictions, time periods, or any other relevant context..."
              rows={4}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  priority: e.target.value as any 
                }))}
              >
                <option value="low">Low - When convenient</option>
                <option value="medium">Medium - Normal priority</option>
                <option value="high">High - Important</option>
                <option value="urgent">Urgent - Drop everything</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tag-input">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags..."
              />
              <button type="button" onClick={addTag} disabled={!tagInput.trim()}>
                Add
              </button>
            </div>
            <div className="tags">
              {formData.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="submit" disabled={!formData.title.trim() || !formData.description.trim()}>
              Create Research Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface QueueSectionProps {
  title: string;
  tasks: ResearchTask[];
  onTaskSelect: (task: ResearchTask) => void;
  showProgress?: boolean;
  showActions?: boolean;
  showResults?: boolean;
  showRetry?: boolean;
}

const QueueSection: React.FC<QueueSectionProps> = ({
  title,
  tasks,
  onTaskSelect,
  showProgress,
  showActions,
  showResults,
  showRetry
}) => {
  if (tasks.length === 0) return null;

  return (
    <div className="queue-section">
      <h3>{title} ({tasks.length})</h3>
      <div className="task-list">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onSelect={() => onTaskSelect(task)}
            showProgress={showProgress}
            showActions={showActions}
            showResults={showResults}
            showRetry={showRetry}
          />
        ))}
      </div>
    </div>
  );
};

interface TaskCardProps {
  task: ResearchTask;
  onSelect: () => void;
  showProgress?: boolean;
  showActions?: boolean;
  showResults?: boolean;
  showRetry?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelect,
  showProgress,
  showActions,
  showResults,
  showRetry
}) => {
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    parallelAIService.cancelTask(task.id);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    parallelAIService.retryFailedTask(task.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#0088ff';
      case 'low': return '#888888';
      default: return '#0088ff';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  return (
    <div className="task-card" onClick={onSelect}>
      <div className="task-header">
        <h4>{task.title}</h4>
        <div className="task-meta">
          <span className="priority" style={{ color: getPriorityColor(task.priority) }}>
            {task.priority.toUpperCase()}
          </span>
          <span className="research-type">{task.metadata.researchType}</span>
        </div>
      </div>

      <p className="task-description">{task.description}</p>

      <div className="task-footer">
        <div className="task-info">
          <span className="created-time">
            Created: {task.createdAt.toLocaleString()}
          </span>
          {task.actualDuration && (
            <span className="duration">
              Duration: {formatDuration(task.actualDuration)}
            </span>
          )}
        </div>

        {showProgress && task.progress !== undefined && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${task.progress}%` }}
            />
            <span className="progress-text">{task.progress}%</span>
          </div>
        )}

        {showResults && task.results && (
          <div className="results-preview">
            <span className="results-count">
              {task.results.keyFindings.length} findings, {task.results.sources.length} sources
            </span>
            <span className="quality-score">
              Quality: {Math.round(task.results.processingMetadata.qualityScore * 100)}%
            </span>
          </div>
        )}

        <div className="task-actions">
          {showActions && (
            <button className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          )}
          {showRetry && (
            <button className="retry-btn" onClick={handleRetry}>
              Retry
            </button>
          )}
        </div>
      </div>

      {task.metadata.tags.length > 0 && (
        <div className="task-tags">
          {task.metadata.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

interface TaskDetailModalProps {
  task: ResearchTask;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose }) => {
  return (
    <div className="task-detail-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{task.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="task-details">
          <div className="detail-section">
            <h3>Task Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Status:</label>
                <span className={`status status-${task.status}`}>{task.status}</span>
              </div>
              <div className="detail-item">
                <label>Priority:</label>
                <span>{task.priority}</span>
              </div>
              <div className="detail-item">
                <label>Research Type:</label>
                <span>{task.metadata.researchType}</span>
              </div>
              <div className="detail-item">
                <label>Created:</label>
                <span>{task.createdAt.toLocaleString()}</span>
              </div>
              {task.completedAt && (
                <div className="detail-item">
                  <label>Completed:</label>
                  <span>{task.completedAt.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>Description</h3>
            <p>{task.description}</p>
          </div>

          {task.metadata.tags.length > 0 && (
            <div className="detail-section">
              <h3>Tags</h3>
              <div className="tags">
                {task.metadata.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {task.results && <TaskResults results={task.results} />}
        </div>
      </div>
    </div>
  );
};

interface TaskResultsProps {
  results: ResearchResult;
}

const TaskResults: React.FC<TaskResultsProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div className="task-results">
      <h3>Research Results</h3>
      
      <div className="results-tabs">
        <button 
          className={activeTab === 'summary' ? 'active' : ''}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button 
          className={activeTab === 'findings' ? 'active' : ''}
          onClick={() => setActiveTab('findings')}
        >
          Key Findings ({results.keyFindings.length})
        </button>
        <button 
          className={activeTab === 'sources' ? 'active' : ''}
          onClick={() => setActiveTab('sources')}
        >
          Sources ({results.sources.length})
        </button>
        <button 
          className={activeTab === 'cases' ? 'active' : ''}
          onClick={() => setActiveTab('cases')}
        >
          Related Cases ({results.relatedCases.length})
        </button>
        <button 
          className={activeTab === 'insights' ? 'active' : ''}
          onClick={() => setActiveTab('insights')}
        >
          Insights ({results.actionableInsights.length})
        </button>
      </div>

      <div className="results-content">
        {activeTab === 'summary' && (
          <div className="summary-content">
            <p>{results.summary}</p>
            <div className="metadata">
              <span>Quality Score: {Math.round(results.processingMetadata.qualityScore * 100)}%</span>
              <span>Processing Time: {(results.processingMetadata.processingTime / 1000).toFixed(1)}s</span>
              <span>Tokens Used: {results.processingMetadata.tokensUsed}</span>
            </div>
          </div>
        )}

        {activeTab === 'findings' && (
          <div className="findings-content">
            {results.keyFindings.map((finding, index) => (
              <div key={index} className="finding-item">
                <h4>{finding.title}</h4>
                <p>{finding.content}</p>
                <div className="finding-meta">
                  <span>Relevance: {Math.round(finding.relevance * 100)}%</span>
                  <span>Confidence: {Math.round(finding.confidence * 100)}%</span>
                  {finding.sources.length > 0 && (
                    <span>Sources: {finding.sources.length}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="sources-content">
            {results.sources.map((source, index) => (
              <div key={index} className="source-item">
                <h4>{source.title}</h4>
                <div className="source-meta">
                  <span className="source-type">{source.type}</span>
                  <span className="jurisdiction">{source.jurisdiction}</span>
                  <span className="date">{source.date}</span>
                  <span className="relevance">Relevance: {Math.round(source.relevance * 100)}%</span>
                </div>
                {source.url && (
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    View Source
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="cases-content">
            {results.relatedCases.map((case_, index) => (
              <div key={index} className="case-item">
                <h4>{case_.title}</h4>
                <p className="citation">{case_.citation}</p>
                <p>{case_.summary}</p>
                <div className="case-meta">
                  <span>Relevance: {Math.round(case_.relevance * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="insights-content">
            {results.actionableInsights.map((insight, index) => (
              <div key={index} className={`insight-item insight-${insight.priority}`}>
                <div className="insight-header">
                  <span className="category">{insight.category}</span>
                  <span className="priority">{insight.priority}</span>
                </div>
                <p>{insight.insight}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParallelAIResearchDashboard;