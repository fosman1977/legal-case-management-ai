import React, { useState, useEffect } from 'react';
import { ProcessingTask, getProcessingQueue } from '../utils/documentProcessingQueue';

interface RealTimeProgressTrackerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const RealTimeProgressTracker: React.FC<RealTimeProgressTrackerProps> = ({
  isVisible,
  onClose
}) => {
  const [tasks, setTasks] = useState<ProcessingTask[]>([]);
  const [queueStats, setQueueStats] = useState({ size: 0, pending: 0, isPaused: false });

  useEffect(() => {
    if (!isVisible) return;

    const processingQueue = getProcessingQueue();

    // Set up global progress tracking
    const handleGlobalProgress = (updatedTasks: ProcessingTask[]) => {
      setTasks([...updatedTasks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setQueueStats(processingQueue.getQueueStats());
    };

    processingQueue.setGlobalProgressCallback(handleGlobalProgress);

    // Update queue stats periodically
    const statsInterval = setInterval(() => {
      setQueueStats(processingQueue.getQueueStats());
    }, 1000);

    // Initial load
    setTasks(processingQueue.getAllTasks());
    setQueueStats(processingQueue.getQueueStats());

    return () => {
      clearInterval(statsInterval);
    };
  }, [isVisible]);

  const getStatusColor = (status: ProcessingTask['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-600';
      case 'processing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: ProcessingTask['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const getTypeIcon = (type: ProcessingTask['type']) => {
    switch (type) {
      case 'extraction': return '📄';
      case 'ocr': return '🔍';
      case 'analysis': return '🧠';
      case 'upload': return '📤';
      default: return '📋';
    }
  };

  const formatDuration = (task: ProcessingTask) => {
    const endTime = task.completedAt || new Date();
    const duration = endTime.getTime() - task.createdAt.getTime();
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const activeTasks = tasks.filter(t => t.status === 'processing');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="card-header flex-between">
          <h2 className="heading-2">📊 Document Processing Progress</h2>
          <button className="btn btn-ghost" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div className="card-content">
          {/* Queue Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{activeTasks.length}</div>
              <div className="text-sm text-blue-600">Processing</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{queueStats.pending}</div>
              <div className="text-sm text-yellow-600">Queued</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failedTasks.length}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
          </div>

          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">⚙️ Currently Processing</h3>
              <div className="space-y-3">
                {activeTasks.map(task => (
                  <div key={task.id} className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span>{getTypeIcon(task.type)}</span>
                        <span className="font-medium">{task.title}</span>
                      </div>
                      <span className={`text-sm ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)} {task.status}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-blue-600 mt-1">{Math.round(task.progress)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task History */}
          <div>
            <h3 className="text-lg font-semibold mb-3">📋 Task History</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {tasks.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No processing tasks yet
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className={`rounded-lg p-3 border ${
                    task.status === 'completed' ? 'bg-green-50 border-green-200' :
                    task.status === 'failed' ? 'bg-red-50 border-red-200' :
                    task.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{getTypeIcon(task.type)}</span>
                        <span className="text-sm font-medium">{task.title}</span>
                        <span className="text-xs text-gray-500">({task.type})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                        </span>
                        {task.completedAt && (
                          <span className="text-xs text-gray-500">
                            {formatDuration(task)}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.status === 'processing' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {task.error && (
                      <div className="mt-2 text-xs text-red-600">
                        Error: {task.error.message}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Queue Controls */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Queue Status: {queueStats.isPaused ? '⏸️ Paused' : '▶️ Running'}
            </div>
            <div className="space-x-2">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => getProcessingQueue().pause()}
                disabled={queueStats.isPaused}
              >
                ⏸️ Pause
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => getProcessingQueue().start()}
                disabled={!queueStats.isPaused}
              >
                ▶️ Resume
              </button>
              <button 
                className="btn btn-danger btn-sm"
                onClick={() => getProcessingQueue().clear()}
              >
                🧹 Clear History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};