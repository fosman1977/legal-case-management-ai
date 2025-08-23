/**
 * Processing Indicator - Exact implementation from roadmap
 * Week 2: Day 3-4 Real-time Processing Feedback
 */

import React from 'react';

const ProcessingIndicator = ({ files, status }) => {
  return (
    <div className="processing-indicator">
      {files.map(file => (
        <ProcessingFile key={file.id}>
          <FileIcon type={file.type} />
          <div className="file-info">
            <span className="filename">{file.name}</span>
            <ProgressBar value={file.progress} />
            <span className="status">{file.status}</span>
          </div>
          <div className="processing-steps">
            <Step completed={file.steps.extraction} label="Text extraction" />
            <Step completed={file.steps.entities} label="Entity recognition" />
            <Step completed={file.steps.patterns} label="Pattern analysis" />
            <Step active={file.steps.anonymization} label="Anonymization" />
          </div>
        </ProcessingFile>
      ))}
    </div>
  );
};

const ProcessingFile = ({ children }) => (
  <div className="processing-file">
    {children}
  </div>
);

const FileIcon = ({ type }) => {
  const getIcon = () => {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('text')) return '📃';
    return '📄';
  };
  
  return <span className="file-icon">{getIcon()}</span>;
};

const ProgressBar = ({ value }) => (
  <div className="progress-bar">
    <div 
      className="progress-fill" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
    <span className="progress-text">{Math.round(value)}%</span>
  </div>
);

const Step = ({ completed, active, label }) => (
  <div className={`processing-step ${completed ? 'completed' : ''} ${active ? 'active' : ''}`}>
    <div className="step-indicator">
      {completed ? '✅' : active ? '⏳' : '⭕'}
    </div>
    <span className="step-label">{label}</span>
  </div>
);

export default ProcessingIndicator;

// CSS for ProcessingIndicator (to be added to components.css)
const styles = `
.processing-indicator {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.processing-file {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.processing-file:last-child {
  border-bottom: none;
}

.file-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.filename {
  display: block;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
  word-break: break-all;
}

.progress-bar {
  position: relative;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #6b7280;
}

.processing-steps {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 180px;
}

.processing-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.step-indicator {
  font-size: 1rem;
}

.step-label {
  color: #6b7280;
}

.processing-step.completed .step-label {
  color: #059669;
}

.processing-step.active .step-label {
  color: #3b82f6;
  font-weight: 600;
}

@media (max-width: 768px) {
  .processing-file {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .processing-steps {
    min-width: auto;
  }
}
`;