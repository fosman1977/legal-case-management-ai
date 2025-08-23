/**
 * System Test Button - Quick test for basic functionality
 */

import React, { useState } from 'react';
import { runBasicSystemTest } from '../utils/systemTest';

export const SystemTestButton: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleRunTest = async () => {
    setIsRunning(true);
    setShowDetails(true);
    
    try {
      console.log('🧪 Starting system test from UI...');
      const result = await runBasicSystemTest();
      setLastResult(result);
      console.log(`🎯 Test result: ${result ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.error('❌ Test failed with error:', error);
      setLastResult(false);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="system-test-button">
      <button 
        onClick={handleRunTest}
        disabled={isRunning}
        className={`test-btn ${lastResult === true ? 'success' : lastResult === false ? 'failure' : ''}`}
      >
        {isRunning ? '🔄 Testing...' : '🧪 Test System'}
      </button>
      
      {lastResult !== null && (
        <div className={`test-result ${lastResult ? 'success' : 'failure'}`}>
          {lastResult ? '✅ PASS' : '❌ FAIL'}
        </div>
      )}
      
      {showDetails && (
        <div className="test-details">
          <small>Check browser console for detailed results</small>
          <button onClick={() => setShowDetails(false)}>×</button>
        </div>
      )}

      <style>{`
        .system-test-button {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .test-btn {
          padding: 8px 16px;
          border: 2px solid #3b82f6;
          border-radius: 6px;
          background: white;
          color: #3b82f6;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .test-btn:hover:not(:disabled) {
          background: #3b82f6;
          color: white;
        }

        .test-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .test-btn.success {
          border-color: #10b981;
          color: #10b981;
        }

        .test-btn.success:hover {
          background: #10b981;
          color: white;
        }

        .test-btn.failure {
          border-color: #ef4444;
          color: #ef4444;
        }

        .test-btn.failure:hover {
          background: #ef4444;
          color: white;
        }

        .test-result {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }

        .test-result.success {
          background: #d1fae5;
          color: #065f46;
        }

        .test-result.failure {
          background: #fee2e2;
          color: #991b1b;
        }

        .test-details {
          background: #f3f4f6;
          padding: 8px;
          border-radius: 4px;
          font-size: 11px;
          color: #6b7280;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .test-details button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};