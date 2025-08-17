/**
 * Legal Benchmark Dashboard
 * Comprehensive display of LegalBench, LNAT, and Watson-Glaser assessment results
 */

import React, { useState, useEffect } from 'react';
import { legalBenchmarkService } from '../services/legalBenchmarkService';

interface BenchmarkDashboardProps {
  caseId?: string;
}

export const LegalBenchmarkDashboard: React.FC<BenchmarkDashboardProps> = ({ caseId }) => {
  const [performances, setPerformances] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'comparison' | 'history'>('overview');
  const [selectedEngines, setSelectedEngines] = useState<string[]>([]);
  const [benchmark, setBenchmark] = useState<'all' | 'legalbench' | 'lnat' | 'watson-glaser'>('all');

  useEffect(() => {
    loadBenchmarkData();
  }, []);

  const loadBenchmarkData = () => {
    const allPerformances = legalBenchmarkService.getAllPerformances();
    setPerformances(allPerformances);
    
    if (allPerformances.length > 0) {
      setLastRun(allPerformances[0].lastTested);
    }
  };

  const runBenchmarks = async () => {
    setIsRunning(true);
    try {
      console.log('🧪 Starting comprehensive legal benchmark suite...');
      const results = await legalBenchmarkService.runAllBenchmarks();
      
      setPerformances(Array.from(results.values()));
      setLastRun(new Date());
      
      console.log('✅ All benchmarks completed successfully');
    } catch (error) {
      console.error('❌ Benchmark execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'; // Excellent - Green
    if (score >= 80) return '#f59e0b'; // Good - Amber  
    if (score >= 70) return '#3b82f6'; // Fair - Blue
    if (score >= 60) return '#f97316'; // Poor - Orange
    return '#ef4444'; // Failing - Red
  };

  const getGradeFromScore = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const handleEngineSelection = (engineName: string) => {
    setSelectedEngines(prev => 
      prev.includes(engineName) 
        ? prev.filter(e => e !== engineName)
        : [...prev, engineName]
    );
  };

  const getEngineComparison = () => {
    if (selectedEngines.length < 2) return null;
    return legalBenchmarkService.compareEngines(selectedEngines);
  };

  const exportResults = () => {
    const results = legalBenchmarkService.exportResults('json');
    const blob = new Blob([results], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-benchmark-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="legal-benchmark-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h2>⚖️ Legal Benchmark Assessment</h2>
          <div className="status-overview">
            <div className="status-item">
              <span className="status-label">Engines Tested:</span>
              <span className="status-value">{performances.length}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Last Run:</span>
              <span className="status-value">
                {lastRun ? lastRun.toLocaleDateString() : 'Never'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Status:</span>
              <span className="status-value">
                {isRunning ? '🔄 Running...' : '✅ Ready'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={runBenchmarks} 
            disabled={isRunning}
            className="btn btn-primary"
          >
            {isRunning ? '🔄 Running Benchmarks...' : '🧪 Run Benchmarks'}
          </button>
          <button onClick={exportResults} className="btn btn-secondary">
            📥 Export Results
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'detailed' ? 'active' : ''}`}
          onClick={() => setActiveTab('detailed')}
        >
          🔍 Detailed Results
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          ⚖️ Engine Comparison
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📈 Performance History
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-panel">
            <h3>📊 Benchmark Performance Overview</h3>
            
            {performances.length === 0 ? (
              <div className="no-data">
                <div className="no-data-icon">🧪</div>
                <h4>No Benchmark Data Available</h4>
                <p>Run the comprehensive benchmark suite to evaluate engine performance.</p>
                <button onClick={runBenchmarks} className="btn btn-primary">
                  🚀 Start Benchmarking
                </button>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="summary-cards">
                  <div className="summary-card">
                    <h4>🎯 Average Performance</h4>
                    <div className="summary-score">
                      {Math.round(performances.reduce((sum, p) => sum + p.overallScore, 0) / performances.length)}%
                    </div>
                    <div className="summary-label">Overall Score</div>
                  </div>
                  
                  <div className="summary-card">
                    <h4>🏆 Top Performer</h4>
                    <div className="summary-score">
                      {performances.sort((a, b) => b.overallScore - a.overallScore)[0]?.engineName || 'N/A'}
                    </div>
                    <div className="summary-label">
                      {performances.sort((a, b) => b.overallScore - a.overallScore)[0]?.overallScore || 0}% Score
                    </div>
                  </div>
                  
                  <div className="summary-card">
                    <h4>⚖️ Legal Reasoning</h4>
                    <div className="summary-score">
                      {Math.round(performances.reduce((sum, p) => sum + p.legalBenchScore, 0) / performances.length)}%
                    </div>
                    <div className="summary-label">LegalBench Average</div>
                  </div>
                  
                  <div className="summary-card">
                    <h4>🧠 Critical Thinking</h4>
                    <div className="summary-score">
                      {Math.round(performances.reduce((sum, p) => sum + p.watsonGlaserScore, 0) / performances.length)}%
                    </div>
                    <div className="summary-label">Watson-Glaser Average</div>
                  </div>
                </div>

                {/* Engine Performance Grid */}
                <div className="performance-grid">
                  <h4>🔧 Engine Performance Matrix</h4>
                  <div className="performance-table">
                    <div className="table-header">
                      <div className="header-cell">Engine</div>
                      <div className="header-cell">LegalBench</div>
                      <div className="header-cell">LNAT</div>
                      <div className="header-cell">Watson-Glaser</div>
                      <div className="header-cell">Overall</div>
                      <div className="header-cell">Grade</div>
                      <div className="header-cell">Recommendation</div>
                    </div>
                    
                    {performances
                      .sort((a, b) => b.overallScore - a.overallScore)
                      .map((perf, index) => (
                        <div key={perf.engineName} className="table-row">
                          <div className="table-cell engine-name">
                            <span className="rank">#{index + 1}</span>
                            {perf.engineName}
                          </div>
                          <div className="table-cell score-cell">
                            <span 
                              className="score"
                              style={{ color: getScoreColor(perf.legalBenchScore) }}
                            >
                              {perf.legalBenchScore}%
                            </span>
                          </div>
                          <div className="table-cell score-cell">
                            <span 
                              className="score"
                              style={{ color: getScoreColor(perf.lnatScore) }}
                            >
                              {perf.lnatScore}%
                            </span>
                          </div>
                          <div className="table-cell score-cell">
                            <span 
                              className="score"
                              style={{ color: getScoreColor(perf.watsonGlaserScore) }}
                            >
                              {perf.watsonGlaserScore}%
                            </span>
                          </div>
                          <div className="table-cell score-cell">
                            <span 
                              className="overall-score"
                              style={{ 
                                color: getScoreColor(perf.overallScore),
                                fontWeight: 'bold',
                                fontSize: '16px'
                              }}
                            >
                              {perf.overallScore}%
                            </span>
                          </div>
                          <div className="table-cell grade-cell">
                            <span 
                              className="grade"
                              style={{ color: getScoreColor(perf.overallScore) }}
                            >
                              {getGradeFromScore(perf.overallScore)}
                            </span>
                          </div>
                          <div className="table-cell recommendation-cell">
                            {perf.recommendation}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'detailed' && (
          <div className="detailed-panel">
            <h3>🔍 Detailed Performance Analysis</h3>
            
            {performances.map(perf => (
              <div key={perf.engineName} className="engine-detail-card">
                <div className="detail-header">
                  <h4>{perf.engineName}</h4>
                  <div className="overall-score-badge">
                    <span 
                      style={{ color: getScoreColor(perf.overallScore) }}
                    >
                      {perf.overallScore}% Overall
                    </span>
                  </div>
                </div>
                
                <div className="detail-content">
                  <div className="score-breakdown">
                    <div className="score-item">
                      <div className="score-label">⚖️ LegalBench</div>
                      <div className="score-bar">
                        <div 
                          className="score-fill"
                          style={{ 
                            width: `${perf.legalBenchScore}%`,
                            backgroundColor: getScoreColor(perf.legalBenchScore)
                          }}
                        ></div>
                        <span className="score-text">{perf.legalBenchScore}%</span>
                      </div>
                    </div>
                    
                    <div className="score-item">
                      <div className="score-label">🧠 LNAT</div>
                      <div className="score-bar">
                        <div 
                          className="score-fill"
                          style={{ 
                            width: `${perf.lnatScore}%`,
                            backgroundColor: getScoreColor(perf.lnatScore)
                          }}
                        ></div>
                        <span className="score-text">{perf.lnatScore}%</span>
                      </div>
                    </div>
                    
                    <div className="score-item">
                      <div className="score-label">💭 Watson-Glaser</div>
                      <div className="score-bar">
                        <div 
                          className="score-fill"
                          style={{ 
                            width: `${perf.watsonGlaserScore}%`,
                            backgroundColor: getScoreColor(perf.watsonGlaserScore)
                          }}
                        ></div>
                        <span className="score-text">{perf.watsonGlaserScore}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="strengths-weaknesses">
                    <div className="strengths">
                      <h5>💪 Strengths</h5>
                      <ul>
                        {perf.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="weaknesses">
                      <h5>⚠️ Areas for Improvement</h5>
                      <ul>
                        {perf.weaknesses.map((weakness: string, index: number) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="recommendation">
                    <h5>📋 Recommendation</h5>
                    <p>{perf.recommendation}</p>
                  </div>
                  
                  <div className="last-tested">
                    <small>Last tested: {perf.lastTested.toLocaleString()}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="comparison-panel">
            <h3>⚖️ Engine Comparison</h3>
            
            <div className="engine-selector">
              <h4>Select engines to compare:</h4>
              <div className="engine-checkboxes">
                {performances.map(perf => (
                  <label key={perf.engineName} className="engine-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedEngines.includes(perf.engineName)}
                      onChange={() => handleEngineSelection(perf.engineName)}
                    />
                    <span>{perf.engineName}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {(() => {
              const comparison = getEngineComparison();
              return comparison ? (
                <div className="comparison-results">
                  <div className="comparison-summary">
                    <h4>🏆 Overall Winner: {comparison.overallWinner}</h4>
                  </div>
                  
                  <div className="comparison-table">
                    <div className="comparison-header">
                      <div className="metric-header">Metric</div>
                      {selectedEngines.map(engine => (
                        <div key={engine} className="engine-header">{engine}</div>
                      ))}
                      <div className="winner-header">Winner</div>
                    </div>
                    
                    {comparison.comparison.map((comp, index) => (
                      <div key={index} className="comparison-row">
                        <div className="metric-cell">{comp.metric}</div>
                        {selectedEngines.map(engine => (
                          <div 
                            key={engine} 
                            className={`score-cell ${comp.winner === engine ? 'winner' : ''}`}
                          >
                            {comp.scores[engine]}%
                          </div>
                        ))}
                        <div className="winner-cell">
                          🏆 {comp.winner}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-comparison">
                  <p>Select at least 2 engines to see comparison results.</p>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-panel">
            <h3>📈 Performance History & Trends</h3>
            
            <div className="benchmark-info">
              <h4>📚 Benchmark Suite Information</h4>
              
              <div className="suite-cards">
                <div className="suite-card">
                  <h5>⚖️ LegalBench</h5>
                  <p>Stanford-inspired legal reasoning benchmark covering:</p>
                  <ul>
                    <li>Precedent application and case law analysis</li>
                    <li>Statutory interpretation techniques</li>
                    <li>Contract formation and document analysis</li>
                    <li>Causation analysis and tort law</li>
                    <li>Judicial review and administrative law</li>
                  </ul>
                  <div className="suite-stats">
                    <span>5 Tests</span> • <span>75% Pass Rate</span>
                  </div>
                </div>
                
                <div className="suite-card">
                  <h5>🧠 LNAT (Law National Aptitude Test)</h5>
                  <p>Logical reasoning and argument analysis:</p>
                  <ul>
                    <li>Argument structure identification</li>
                    <li>Inference from legal facts</li>
                    <li>Evidence evaluation and strengthening</li>
                    <li>Logical fallacy detection</li>
                  </ul>
                  <div className="suite-stats">
                    <span>4 Tests</span> • <span>70% Pass Rate</span>
                  </div>
                </div>
                
                <div className="suite-card">
                  <h5>💭 Watson-Glaser Critical Thinking</h5>
                  <p>Critical thinking skills for legal analysis:</p>
                  <ul>
                    <li>Assumption recognition and analysis</li>
                    <li>Deductive and inductive reasoning</li>
                    <li>Legal interpretation and principles</li>
                    <li>Argument evaluation and inference</li>
                  </ul>
                  <div className="suite-stats">
                    <span>5 Tests</span> • <span>72% Pass Rate</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="performance-standards">
              <h4>📊 Performance Standards</h4>
              <div className="standards-grid">
                <div className="standard-item">
                  <div className="standard-grade" style={{ color: '#10b981' }}>A+ (90-100%)</div>
                  <div className="standard-desc">Excellent - Ready for critical legal analysis</div>
                </div>
                <div className="standard-item">
                  <div className="standard-grade" style={{ color: '#f59e0b' }}>B+ (80-89%)</div>
                  <div className="standard-desc">Good - Suitable for most legal tasks</div>
                </div>
                <div className="standard-item">
                  <div className="standard-grade" style={{ color: '#3b82f6' }}>C+ (70-79%)</div>
                  <div className="standard-desc">Fair - Adequate with validation</div>
                </div>
                <div className="standard-item">
                  <div className="standard-grade" style={{ color: '#f97316' }}>D (60-69%)</div>
                  <div className="standard-desc">Poor - Limited use recommended</div>
                </div>
                <div className="standard-item">
                  <div className="standard-grade" style={{ color: '#ef4444' }}>F (<60%)</div>
                  <div className="standard-desc">Failing - Additional training required</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isRunning && (
        <div className="benchmark-progress">
          <div className="progress-indicator">
            <div className="progress-spinner"></div>
            <div className="progress-text">
              <h4>🧪 Running Legal Benchmark Suite...</h4>
              <p>Testing all engines across LegalBench, LNAT, and Watson-Glaser assessments.</p>
              <p>This comprehensive evaluation may take several minutes to complete.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};