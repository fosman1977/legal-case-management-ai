import React, { useState, useEffect } from 'react';
import { useAIUpdates } from '../hooks/useAISync';

interface AISyncNotificationProps {
  caseId: string;
}

export const AISyncNotification: React.FC<AISyncNotificationProps> = ({ caseId }) => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'person' | 'issue' | 'chronology' | 'authority' | 'cross_reference';
    timestamp: number;
  }>>([]);

  const { updateCount, lastUpdate } = useAIUpdates(caseId);

  useEffect(() => {
    if (lastUpdate && updateCount > 0) {
      const eventType = lastUpdate.source || 'AI';
      let message = '';
      let type: 'person' | 'issue' | 'chronology' | 'authority' | 'cross_reference' = 'person';

      if ('addedCount' in lastUpdate) {
        if ('ai-persons-updated' in lastUpdate) {
          type = 'person';
          message = `👥 ${lastUpdate.addedCount} persons added${lastUpdate.mergedCount ? `, ${lastUpdate.mergedCount} merged` : ''} from ${eventType}`;
        } else if ('ai-issues-updated' in lastUpdate) {
          type = 'issue';
          message = `⚖️ ${lastUpdate.addedCount} issues added${lastUpdate.mergedCount ? `, ${lastUpdate.mergedCount} merged` : ''} from ${eventType}`;
        } else if ('ai-chronology-updated' in lastUpdate) {
          type = 'chronology';
          message = `📅 ${lastUpdate.addedCount} chronology events added from ${eventType}`;
        } else if ('ai-authorities-updated' in lastUpdate) {
          type = 'authority';
          message = `📚 ${lastUpdate.addedCount} authorities added from ${eventType}`;
        }
      } else if ('crossRefs' in lastUpdate) {
        type = 'cross_reference';
        message = `🔗 Cross-references identified from ${eventType}`;
      }

      if (message) {
        const notification = {
          id: `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          message,
          type,
          timestamp: Date.now()
        };

        setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5

        // Auto-remove after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
      }
    }
  }, [updateCount, lastUpdate]);

  if (notifications.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'person': return '👥';
      case 'issue': return '⚖️';
      case 'chronology': return '📅';
      case 'authority': return '📚';
      case 'cross_reference': return '🔗';
      default: return '🤖';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'person': return '#2196f3';
      case 'issue': return '#9c27b0';
      case 'chronology': return '#ff9800';
      case 'authority': return '#4caf50';
      case 'cross_reference': return '#f44336';
      default: return '#666';
    }
  };

  return (
    <div className="ai-sync-notifications">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className="notification-item"
          style={{ 
            borderLeft: `4px solid ${getColor(notification.type)}`,
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="notification-icon">
            {getIcon(notification.type)}
          </div>
          <div className="notification-content">
            <div className="notification-message">{notification.message}</div>
            <div className="notification-time">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}

      <style>{`
        .ai-sync-notifications {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 400px;
        }

        .notification-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideInRight 0.3s ease-out;
        }

        .notification-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-message {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 2px;
        }

        .notification-time {
          font-size: 12px;
          color: #666;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .ai-sync-notifications {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};