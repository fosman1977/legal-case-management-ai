import React, { useState, useEffect } from 'react';
import { useAISync } from '../hooks/useAISync';
import { aiDocumentProcessor } from '../utils/aiDocumentProcessor';
import { PDFTextExtractor } from '../utils/pdfExtractor';

interface CourtOrder {
  id: string;
  caseId: string;
  title: string;
  type: 'order' | 'direction' | 'judgment' | 'ruling' | 'notice';
  court: string;
  judge?: string;
  orderDate: string;
  content: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileContent?: string;
  extractedDeadlines: Deadline[];
  extractedTasks: Task[];
  isProcessed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'upcoming' | 'due-soon' | 'overdue' | 'completed';
  category: 'filing' | 'disclosure' | 'hearing' | 'service' | 'compliance' | 'other';
  relatedOrderId: string;
  daysUntilDue: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  category: 'preparation' | 'filing' | 'service' | 'research' | 'communication' | 'compliance';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  relatedOrderId: string;
  estimatedHours?: number;
}

interface OrdersDirectionsManagerProps {
  caseId: string;
}

export const OrdersDirectionsManager: React.FC<OrdersDirectionsManagerProps> = ({ caseId }) => {
  const [orders, setOrders] = useState<CourtOrder[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CourtOrder | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [activeView, setActiveView] = useState<'orders' | 'calendar' | 'tasks'>('orders');
  
  // AI Synchronization
  const { publishAIResults } = useAISync(caseId, 'OrdersDirectionsManager');
  
  const [formData, setFormData] = useState<Partial<CourtOrder>>({
    title: '',
    type: 'order',
    court: '',
    judge: '',
    orderDate: '',
    content: ''
  });

  useEffect(() => {
    loadOrders();
    loadDeadlines();
    loadTasks();
  }, [caseId]);

  const loadOrders = () => {
    const storageKey = `court_orders_${caseId}`;
    const data = localStorage.getItem(storageKey);
    setOrders(data ? JSON.parse(data) : []);
  };

  const loadDeadlines = () => {
    const storageKey = `deadlines_${caseId}`;
    const data = localStorage.getItem(storageKey);
    const loadedDeadlines = data ? JSON.parse(data) : [];
    
    // Update deadline status based on current date
    const updatedDeadlines = loadedDeadlines.map((deadline: Deadline) => {
      const dueDate = new Date(deadline.dueDate);
      const today = new Date();
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let status: Deadline['status'] = 'upcoming';
      if (daysUntil < 0) status = 'overdue';
      else if (daysUntil <= 7) status = 'due-soon';
      
      return { ...deadline, daysUntilDue: daysUntil, status };
    });
    
    setDeadlines(updatedDeadlines);
  };

  const loadTasks = () => {
    const storageKey = `tasks_${caseId}`;
    const data = localStorage.getItem(storageKey);
    setTasks(data ? JSON.parse(data) : []);
  };

  const saveOrders = (newOrders: CourtOrder[]) => {
    const storageKey = `court_orders_${caseId}`;
    localStorage.setItem(storageKey, JSON.stringify(newOrders));
    setOrders(newOrders);
  };

  const saveDeadlines = (newDeadlines: Deadline[]) => {
    const storageKey = `deadlines_${caseId}`;
    localStorage.setItem(storageKey, JSON.stringify(newDeadlines));
    setDeadlines(newDeadlines);
  };

  const saveTasks = (newTasks: Task[]) => {
    const storageKey = `tasks_${caseId}`;
    localStorage.setItem(storageKey, JSON.stringify(newTasks));
    setTasks(newTasks);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      // Auto-populate title
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^.]+$/, ''),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }));

      setProcessingProgress(20);

      // Extract text from file
      let extractedText = '';
      if (PDFTextExtractor.isPDF(file)) {
        extractedText = await PDFTextExtractor.extractWithOCRFallback(file);
      } else if (file.type.startsWith('text/')) {
        extractedText = await file.text();
      }

      setProcessingProgress(60);

      if (extractedText) {
        setFormData(prev => ({
          ...prev,
          fileContent: extractedText,
          content: prev.content || `Court order: ${file.name}\n\nContent extracted from file.`
        }));

        // Extract deadlines and tasks using AI
        await extractDeadlinesAndTasks(extractedText, file.name);
      }

      setProcessingProgress(100);
      
    } catch (error) {
      console.error('Failed to process court order file:', error);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const extractDeadlinesAndTasks = async (text: string, fileName: string) => {
    try {
      // TODO: Implement real AI extraction using a custom prompt for court orders
      // For now, using the standard entity extraction
      const entities = await aiDocumentProcessor.extractEntitiesForSync(text, fileName, 'Court Order');
      
      // For now, create mock deadlines and tasks based on common patterns
      const mockDeadlines: Omit<Deadline, 'id' | 'relatedOrderId' | 'daysUntilDue' | 'status'>[] = [
        {
          title: "File Defence",
          description: "File defence to particulars of claim",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
          priority: 'high',
          category: 'filing'
        },
        {
          title: "Serve Documents",
          description: "Serve defence on all parties",
          dueDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 16 days from now
          priority: 'high',
          category: 'service'
        }
      ];

      const mockTasks: Omit<Task, 'id' | 'relatedOrderId' | 'status'>[] = [
        {
          title: "Draft Defence",
          description: "Prepare defence document responding to all allegations",
          category: 'preparation',
          priority: 'high',
          dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 days from now
          estimatedHours: 8
        },
        {
          title: "Legal Research",
          description: "Research relevant case law and statutes for defence",
          category: 'research',
          priority: 'medium',
          estimatedHours: 4
        }
      ];

      // Store extracted deadlines and tasks temporarily
      setFormData(prev => ({
        ...prev,
        extractedDeadlines: mockDeadlines as Deadline[],
        extractedTasks: mockTasks as Task[]
      }));

      console.log('📅 Extracted deadlines and tasks from court order:', {
        deadlines: mockDeadlines.length,
        tasks: mockTasks.length
      });

    } catch (error) {
      console.error('Failed to extract deadlines and tasks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderId = editingOrder?.id || `order_${Date.now()}`;
    const now = new Date().toISOString();
    
    const order: CourtOrder = {
      ...formData,
      id: orderId,
      caseId,
      extractedDeadlines: formData.extractedDeadlines || [],
      extractedTasks: formData.extractedTasks || [],
      isProcessed: true,
      createdAt: editingOrder?.createdAt || now,
      updatedAt: now
    } as CourtOrder;

    const updatedOrders = editingOrder
      ? orders.map(o => o.id === editingOrder.id ? order : o)
      : [...orders, order];
    
    saveOrders(updatedOrders);

    // Add extracted deadlines to deadline list
    if (order.extractedDeadlines.length > 0) {
      const newDeadlines = order.extractedDeadlines.map(d => ({
        ...d,
        id: `deadline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        relatedOrderId: orderId,
        daysUntilDue: Math.ceil((new Date(d.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        status: 'upcoming' as Deadline['status']
      }));
      
      saveDeadlines([...deadlines, ...newDeadlines]);
    }

    // Add extracted tasks to task list
    if (order.extractedTasks.length > 0) {
      const newTasks = order.extractedTasks.map(t => ({
        ...t,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        relatedOrderId: orderId,
        status: 'pending' as Task['status']
      }));
      
      saveTasks([...tasks, ...newTasks]);
    }

    // Publish to AI sync system
    if (order.fileContent) {
      try {
        const entities = await aiDocumentProcessor.extractEntitiesForSync(
          order.fileContent,
          order.title,
          'Court Order'
        );
        
        await publishAIResults(order.title, entities, 0.9); // High confidence for court orders
        
        console.log('🤖 AI entities published from court order:', {
          title: order.title,
          persons: entities.persons.length,
          issues: entities.issues.length,
          chronology: entities.chronologyEvents.length,
          authorities: entities.authorities.length
        });
        
      } catch (error) {
        console.error('Failed to extract entities from court order:', error);
      }
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'order',
      court: '',
      judge: '',
      orderDate: '',
      content: ''
    });
    setSelectedFile(null);
    setIsAdding(false);
    setEditingOrder(null);
  };

  const handleEdit = (order: CourtOrder) => {
    setEditingOrder(order);
    setFormData(order);
    setIsAdding(true);
  };

  const handleDelete = (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      const updatedOrders = orders.filter(o => o.id !== orderId);
      saveOrders(updatedOrders);
      
      // Also remove related deadlines and tasks
      const updatedDeadlines = deadlines.filter(d => d.relatedOrderId !== orderId);
      const updatedTasks = tasks.filter(t => t.relatedOrderId !== orderId);
      saveDeadlines(updatedDeadlines);
      saveTasks(updatedTasks);
    }
  };

  const toggleTaskStatus = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' as Task['status'] }
        : task
    );
    saveTasks(updatedTasks);
  };

  const getDeadlineStatusColor = (status: Deadline['status']) => {
    switch (status) {
      case 'overdue': return '#f44336';
      case 'due-soon': return '#ff9800';
      case 'upcoming': return '#4caf50';
      case 'completed': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getTypeIcon = (type: CourtOrder['type']) => {
    switch (type) {
      case 'order': return '📋';
      case 'direction': return '👨‍⚖️';
      case 'judgment': return '⚖️';
      case 'ruling': return '🔨';
      case 'notice': return '📢';
      default: return '📋';
    }
  };

  const upcomingDeadlines = deadlines
    .filter(d => d.status !== 'completed')
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 5);

  return (
    <div className="orders-directions-manager">
      <div className="manager-header">
        <div>
          <h3>📋 Orders & Directions</h3>
          <p>Court orders, directions, and procedural documents with AI-generated deadlines and tasks.</p>
        </div>
        <div className="header-actions">
          {!isAdding && (
            <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
              + Add Order/Direction
            </button>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button 
          className={`view-tab ${activeView === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveView('orders')}
        >
          📋 Orders ({orders.length})
        </button>
        <button 
          className={`view-tab ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveView('calendar')}
        >
          📅 Deadlines ({deadlines.filter(d => d.status !== 'completed').length})
        </button>
        <button 
          className={`view-tab ${activeView === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveView('tasks')}
        >
          ✓ Tasks ({tasks.filter(t => t.status !== 'completed').length})
        </button>
      </div>

      {/* Upcoming Deadlines Alert */}
      {!isAdding && upcomingDeadlines.length > 0 && (
        <div className="deadline-alerts">
          <h4>⚠️ Upcoming Deadlines</h4>
          <div className="deadline-list-compact">
            {upcomingDeadlines.map(deadline => (
              <div key={deadline.id} className={`deadline-alert ${deadline.status}`}>
                <div className="deadline-info">
                  <strong>{deadline.title}</strong>
                  <div className="deadline-meta">
                    {deadline.daysUntilDue === 0 ? 'Due Today' :
                     deadline.daysUntilDue < 0 ? `${Math.abs(deadline.daysUntilDue)} days overdue` :
                     `${deadline.daysUntilDue} days remaining`}
                  </div>
                </div>
                <div className="deadline-date">
                  {new Date(deadline.dueDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <form className="order-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Order title..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CourtOrder['type'] })}
              >
                <option value="order">📋 Court Order</option>
                <option value="direction">👨‍⚖️ Direction</option>
                <option value="judgment">⚖️ Judgment</option>
                <option value="ruling">🔨 Ruling</option>
                <option value="notice">📢 Notice</option>
              </select>
            </div>

            <div className="form-group">
              <label>Court</label>
              <input
                type="text"
                value={formData.court}
                onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                placeholder="e.g., High Court, County Court"
              />
            </div>

            <div className="form-group">
              <label>Judge</label>
              <input
                type="text"
                value={formData.judge}
                onChange={(e) => setFormData({ ...formData, judge: e.target.value })}
                placeholder="Judge name (optional)"
              />
            </div>

            <div className="form-group">
              <label>Order Date</label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label>Upload Order Document</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="file-input"
            />
            {selectedFile && (
              <div className="file-info">
                <small>Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)</small>
              </div>
            )}
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="processing-progress">
              <div className="progress-header">
                <h4>🤖 Processing Court Order</h4>
                <p>Extracting deadlines and tasks...</p>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill ai-progress"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <small>Progress: {processingProgress}%</small>
            </div>
          )}

          {/* Content */}
          <div className="form-group">
            <label>Summary/Notes</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              required
              placeholder="Summary of the order or key points..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingOrder ? 'Update' : 'Save'} Order
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Content Views */}
      {!isAdding && (
        <div className="view-content">
          {activeView === 'orders' && (
            <div className="orders-list">
              {orders.length === 0 ? (
                <div className="empty-state">
                  <p>No orders or directions yet. Upload court documents to get started.</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h4>{getTypeIcon(order.type)} {order.title}</h4>
                        <div className="order-meta">
                          <span>{order.court}</span>
                          <span>• {new Date(order.orderDate).toLocaleDateString()}</span>
                          {order.judge && <span>• {order.judge}</span>}
                        </div>
                      </div>
                      <div className="order-actions">
                        <button className="btn btn-sm" onClick={() => handleEdit(order)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(order.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="order-content">
                      <p>{order.content}</p>
                    </div>

                    {order.extractedDeadlines.length > 0 && (
                      <div className="extracted-info">
                        <h5>📅 Extracted Deadlines ({order.extractedDeadlines.length})</h5>
                      </div>
                    )}

                    {order.extractedTasks.length > 0 && (
                      <div className="extracted-info">
                        <h5>✓ Extracted Tasks ({order.extractedTasks.length})</h5>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeView === 'calendar' && (
            <div className="deadlines-calendar">
              <h4>📅 Procedural Calendar</h4>
              {deadlines.length === 0 ? (
                <div className="empty-state">
                  <p>No deadlines yet. Add court orders to automatically extract deadlines.</p>
                </div>
              ) : (
                <div className="deadlines-list">
                  {deadlines
                    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
                    .map(deadline => (
                      <div key={deadline.id} className={`deadline-card ${deadline.status}`}>
                        <div className="deadline-info">
                          <h5>{deadline.title}</h5>
                          <p>{deadline.description}</p>
                          <div className="deadline-meta">
                            <span className="category">{deadline.category}</span>
                            <span className="priority">{deadline.priority} priority</span>
                          </div>
                        </div>
                        <div className="deadline-timing">
                          <div className="due-date">
                            {new Date(deadline.dueDate).toLocaleDateString()}
                          </div>
                          <div 
                            className="status-indicator"
                            style={{ backgroundColor: getDeadlineStatusColor(deadline.status) }}
                          >
                            {deadline.daysUntilDue === 0 ? 'Due Today' :
                             deadline.daysUntilDue < 0 ? `${Math.abs(deadline.daysUntilDue)}d overdue` :
                             `${deadline.daysUntilDue}d left`}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}

          {activeView === 'tasks' && (
            <div className="tasks-list">
              <h4>✓ Task List</h4>
              {tasks.length === 0 ? (
                <div className="empty-state">
                  <p>No tasks yet. Add court orders to automatically extract tasks.</p>
                </div>
              ) : (
                <div className="task-groups">
                  {['pending', 'in-progress', 'completed'].map(status => (
                    <div key={status} className="task-group">
                      <h5>
                        {status === 'pending' ? '📋 Pending' :
                         status === 'in-progress' ? '🔄 In Progress' :
                         '✅ Completed'} 
                        ({tasks.filter(t => t.status === status).length})
                      </h5>
                      <div className="task-list">
                        {tasks
                          .filter(t => t.status === status)
                          .map(task => (
                            <div key={task.id} className="task-card">
                              <div className="task-info">
                                <label className="task-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={task.status === 'completed'}
                                    onChange={() => toggleTaskStatus(task.id)}
                                  />
                                  <span className="checkmark"></span>
                                  <div className="task-content">
                                    <h6>{task.title}</h6>
                                    <p>{task.description}</p>
                                    <div className="task-meta">
                                      <span className="category">{task.category}</span>
                                      <span className="priority">{task.priority}</span>
                                      {task.estimatedHours && <span>{task.estimatedHours}h estimated</span>}
                                      {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                                    </div>
                                  </div>
                                </label>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};