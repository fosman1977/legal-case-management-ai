import React, { useState, useEffect } from 'react';
import { LNATModelTester, TestConfiguration, TestSession, LNATLeaderboard } from '../utils/lnatModelTester';
import { ModelLNATResult } from '../utils/lnatEvaluationFramework';
import { UnifiedAIClient } from '../utils/unifiedAIClient';

interface LNATDashboardProps {
  caseId?: string;
}

export const LNATDashboard: React.FC<LNATDashboardProps> = ({ caseId }) => {
  const [tester] = useState(() => new LNATModelTester());
  const [leaderboard, setLeaderboard] = useState<LNATLeaderboard | null>(null);
  const [activeSessions, setActiveSessions] = useState<TestSession[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [testConfig, setTestConfig] = useState<Partial<TestConfiguration>>({
    includeEssay: false,
    timeLimit: 95,
    debugMode: false,
    saveResults: true,
    runInParallel: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'test' | 'leaderboard' | 'results'>('leaderboard');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Load leaderboard
      const currentLeaderboard = tester.getLeaderboard();
      setLeaderboard(currentLeaderboard);

      // Load active sessions
      const sessions = tester.getActiveSessions();
      setActiveSessions(sessions);

      // Load available models
      if (availableModels.length === 0) {
        await loadAvailableModels();
      }
    } catch (error) {
      console.error('Failed to load LNAT dashboard data:', error);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const aiClient = new UnifiedAIClient();
      const models = await aiClient.getModels();
      
      // Add common models for testing
      const allModels = [...new Set([
        ...models,
        'gpt-4',
        'gpt-3.5-turbo',
        'llama-2-7b-chat',
        'llama-2-13b-chat',
        'mistral-7b-instruct'
      ])];
      
      setAvailableModels(allModels);
    } catch (error) {
      console.error('Failed to load available models:', error);
      // Fallback to common models
      setAvailableModels([
        'gpt-4',
        'gpt-3.5-turbo',
        'llama-2-7b-chat',
        'mistral-7b-instruct'
      ]);
    }
  };

  const handleStartTest = async () => {
    if (selectedModels.length === 0) {
      alert('Please select at least one model to test');
      return;
    }

    setIsLoading(true);
    try {
      const config: TestConfiguration = {
        models: selectedModels,
        includeEssay: testConfig.includeEssay || false,
        timeLimit: testConfig.timeLimit || 95,
        debugMode: testConfig.debugMode || false,
        saveResults: testConfig.saveResults || true,
        runInParallel: testConfig.runInParallel || false
      };

      await tester.startTestSession(config);
      setActiveTab('results');
    } catch (error) {
      console.error('Failed to start test:', error);
      alert('Failed to start test. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTest = async (modelId: string) => {
    setIsLoading(true);
    try {
      const result = await tester.quickTest(modelId);
      console.log('Quick test result:', result);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Quick test failed:', error);
      alert(`Quick test failed for ${modelId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    if (score >= 40) return '#fd7e14';
    return '#dc3545';
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const renderLeaderboard = () => (
    <div className="lnat-leaderboard">
      <div className="leaderboard-header">
        <h3>LNAT Performance Leaderboard</h3>
        <p className="last-updated">
          Last updated: {leaderboard?.lastUpdated ? new Date(leaderboard.lastUpdated).toLocaleString() : 'Never'}
        </p>
      </div>

      {leaderboard && leaderboard.rankings.length > 0 ? (
        <div className="rankings-table">
          <div className="ranking-header">
            <span>Rank</span>
            <span>Model</span>
            <span>Overall Score</span>
            <span>Reading</span>
            <span>Essay</span>
            <span>Grade</span>
            <span>Strengths</span>
            <span>Actions</span>
          </div>
          
          {leaderboard.rankings.map((ranking) => (
            <div key={ranking.modelId} className="ranking-row">
              <span className="rank">#{ranking.rank}</span>
              <span className="model-name">{ranking.modelId}</span>
              <span className="score" style={{ color: getScoreColor(ranking.overallScore) }}>
                {ranking.overallScore.toFixed(1)}
              </span>
              <span className="section-score">{ranking.sectionAScore.toFixed(1)}%</span>
              <span className="section-score">{ranking.sectionBScore}/10</span>
              <span className="grade" style={{ color: getScoreColor(ranking.overallScore) }}>
                {getScoreGrade(ranking.overallScore)}
              </span>
              <span className="strengths">
                {ranking.strengths.slice(0, 2).join(', ')}
              </span>
              <span className="actions">
                <button
                  className="quick-test-btn"
                  onClick={() => handleQuickTest(ranking.modelId)}
                  disabled={isLoading}
                >
                  Retest
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No LNAT test results yet. Run some tests to see the leaderboard!</p>
          <button 
            className="start-testing-btn"
            onClick={() => setActiveTab('test')}
          >
            Start Testing
          </button>
        </div>
      )}
    </div>
  );

  const renderTestConfiguration = () => (
    <div className="test-configuration">
      <h3>Configure LNAT Test</h3>
      
      <div className="model-selection">
        <h4>Select Models to Test</h4>
        <div className="model-grid">
          {availableModels.map((model) => (
            <label key={model} className="model-checkbox">
              <input
                type="checkbox"
                checked={selectedModels.includes(model)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedModels([...selectedModels, model]);
                  } else {
                    setSelectedModels(selectedModels.filter(m => m !== model));
                  }
                }}
              />
              <span>{model}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="test-options">
        <h4>Test Options</h4>
        
        <label className="option-checkbox">
          <input
            type="checkbox"
            checked={testConfig.includeEssay}
            onChange={(e) => setTestConfig({
              ...testConfig,
              includeEssay: e.target.checked
            })}
          />
          <span>Include Essay Section (Section B)</span>
        </label>

        <label className="option-checkbox">
          <input
            type="checkbox"
            checked={testConfig.runInParallel}
            onChange={(e) => setTestConfig({
              ...testConfig,
              runInParallel: e.target.checked
            })}
          />
          <span>Run tests in parallel (faster but uses more resources)</span>
        </label>

        <label className="option-checkbox">
          <input
            type="checkbox"
            checked={testConfig.debugMode}
            onChange={(e) => setTestConfig({
              ...testConfig,
              debugMode: e.target.checked
            })}
          />
          <span>Debug mode (detailed logging)</span>
        </label>

        <div className="time-limit">
          <label>
            Time Limit (minutes):
            <input
              type="number"
              min="30"
              max="180"
              value={testConfig.timeLimit}
              onChange={(e) => setTestConfig({
                ...testConfig,
                timeLimit: parseInt(e.target.value)
              })}
            />
          </label>
        </div>
      </div>

      <div className="test-actions">
        <button
          className="start-test-btn"
          onClick={handleStartTest}
          disabled={isLoading || selectedModels.length === 0}
        >
          {isLoading ? 'Starting Test...' : 'Start LNAT Test'}
        </button>
        
        <div className="quick-actions">
          <h5>Quick Actions</h5>
          <button
            className="benchmark-btn"
            onClick={() => {
              setSelectedModels(['gpt-4', 'gpt-3.5-turbo', 'llama-2-7b-chat', 'mistral-7b-instruct']);
              setTestConfig({
                ...testConfig,
                includeEssay: true,
                runInParallel: false
              });
            }}
          >
            Setup Benchmark Test
          </button>
        </div>
      </div>
    </div>
  );

  const renderActiveTests = () => (
    <div className="active-tests">
      <h3>Test Results & Active Sessions</h3>
      
      {activeSessions.length > 0 ? (
        <div className="sessions-list">
          {activeSessions.map((session) => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <span className="session-id">Session: {session.id.split('-').pop()}</span>
                <span className={`session-status ${session.status}`}>{session.status}</span>
              </div>
              
              <div className="session-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${session.progress}%` }}
                  />
                </div>
                <span>{session.progress.toFixed(1)}%</span>
              </div>
              
              <div className="session-details">
                <p>Models: {session.configuration.models.join(', ')}</p>
                <p>Started: {new Date(session.startTime).toLocaleString()}</p>
                {session.endTime && (
                  <p>Completed: {new Date(session.endTime).toLocaleString()}</p>
                )}
              </div>

              {session.results.length > 0 && (
                <div className="session-results">
                  <h5>Results:</h5>
                  {session.results.map((result) => (
                    <div key={result.modelId} className="result-summary">
                      <span className="result-model">{result.modelId}</span>
                      <span className="result-score" style={{ color: getScoreColor(result.overallScore) }}>
                        {result.overallScore}/100
                      </span>
                      <span className="result-grade">{getScoreGrade(result.overallScore)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-sessions">
          <p>No active test sessions. Start a test to see results here.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="lnat-dashboard">
      <div className="dashboard-header">
        <h2>LNAT Model Evaluation Dashboard</h2>
        <p>Law National Aptitude Test - AI Model Performance Analysis</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          📊 Leaderboard
        </button>
        <button
          className={`tab ${activeTab === 'test' ? 'active' : ''}`}
          onClick={() => setActiveTab('test')}
        >
          🧪 Run Tests
        </button>
        <button
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          📈 Results
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'leaderboard' && renderLeaderboard()}
        {activeTab === 'test' && renderTestConfiguration()}
        {activeTab === 'results' && renderActiveTests()}
      </div>

      <div className="dashboard-info">
        <div className="info-card">
          <h4>About LNAT Testing</h4>
          <p>
            The LNAT evaluation framework tests AI models on legal aptitude using questions 
            similar to the Law National Aptitude Test. This includes critical reading, 
            logical reasoning, and argument analysis skills essential for legal practice.
          </p>
        </div>
        
        <div className="scoring-guide">
          <h4>Scoring Guide</h4>
          <div className="score-ranges">
            <div className="score-range">
              <span className="range">90-100</span>
              <span className="grade" style={{ color: getScoreColor(95) }}>A+</span>
              <span>Exceptional legal reasoning</span>
            </div>
            <div className="score-range">
              <span className="range">80-89</span>
              <span className="grade" style={{ color: getScoreColor(85) }}>A</span>
              <span>Strong legal aptitude</span>
            </div>
            <div className="score-range">
              <span className="range">70-79</span>
              <span className="grade" style={{ color: getScoreColor(75) }}>B</span>
              <span>Good reasoning skills</span>
            </div>
            <div className="score-range">
              <span className="range">60-69</span>
              <span className="grade" style={{ color: getScoreColor(65) }}>C</span>
              <span>Adequate performance</span>
            </div>
            <div className="score-range">
              <span className="range">Below 60</span>
              <span className="grade" style={{ color: getScoreColor(50) }}>D/F</span>
              <span>Needs improvement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LNATDashboard;