import React, { useState, useEffect } from 'react';
import { LNATModelTester } from '../utils/lnatModelTester';
import { WatsonGlaserModelTester } from '../utils/watsonGlaserTester';
import { LEGAL_MODEL_BENCHMARKS } from '../utils/legalBenchIntegration';
import { UnifiedAIClient } from '../utils/unifiedAIClient';
import './ComprehensiveLegalTestingDashboard.css';

interface ComprehensiveDashboardProps {
  caseId?: string;
}

interface CombinedTestResult {
  modelId: string;
  legalBench: number;
  lnat: number;
  watsonGlaser: number;
  composite: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  lastTested: string;
}

export const ComprehensiveLegalTestingDashboard: React.FC<ComprehensiveDashboardProps> = ({ caseId }) => {
  const [lnatTester] = useState(() => new LNATModelTester());
  const [watsonGlaserTester] = useState(() => new WatsonGlaserModelTester());
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [combinedResults, setCombinedResults] = useState<CombinedTestResult[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'lnat' | 'watson-glaser' | 'compare'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load available models
      const aiClient = new UnifiedAIClient();
      const models = await aiClient.getModels();
      
      const allModels = [...new Set([
        ...models,
        'gpt-4',
        'gpt-3.5-turbo', 
        'llama-2-7b-chat',
        'llama-2-13b-chat',
        'mistral-7b-instruct'
      ])];
      
      setAvailableModels(allModels);
      
      // Load existing results and calculate combined scores
      loadCombinedResults();
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const loadCombinedResults = () => {
    const results: CombinedTestResult[] = [];
    
    // Get all unique models from various sources
    const allTestedModels = new Set([
      ...lnatTester.getAllResults().map(r => r.modelId),
      ...watsonGlaserTester.getAllResults().map(r => r.modelId),
      ...Object.keys(LEGAL_MODEL_BENCHMARKS)
    ]);

    allTestedModels.forEach(modelId => {
      const legalBenchData = LEGAL_MODEL_BENCHMARKS[modelId];
      const lnatResults = lnatTester.getModelResults(modelId);
      const watsonGlaserResults = watsonGlaserTester.getModelResults(modelId);
      
      // Get latest scores
      const legalBenchScore = legalBenchData?.legalBenchScore.overall || 0;
      const lnatScore = lnatResults.length > 0 ? lnatResults[lnatResults.length - 1].overallScore : (legalBenchData?.lnatScore?.overall || 0);
      const watsonGlaserScore = watsonGlaserResults.length > 0 ? (watsonGlaserResults[watsonGlaserResults.length - 1].overallScore / 40) * 100 : (legalBenchData?.watsonGlaserScore ? (legalBenchData.watsonGlaserScore.overall / 40) * 100 : 0);
      
      // Calculate composite score (weighted average)
      const composite = (legalBenchScore * 0.4 + lnatScore * 0.3 + watsonGlaserScore * 0.3);
      
      // Determine grade
      const grade = getCompositeGrade(composite);
      
      // Combine strengths and weaknesses
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      if (legalBenchScore >= 70) strengths.push('Strong legal domain knowledge');
      if (lnatScore >= 75) strengths.push('Excellent legal aptitude');
      if (watsonGlaserScore >= 80) strengths.push('Superior critical thinking');
      
      if (legalBenchScore <= 40) weaknesses.push('Limited legal reasoning');
      if (lnatScore <= 50) weaknesses.push('Weak legal aptitude');
      if (watsonGlaserScore <= 50) weaknesses.push('Poor critical thinking');
      
      // Get most recent test date
      const lastTested = Math.max(
        lnatResults.length > 0 ? new Date(lnatResults[lnatResults.length - 1].evaluationDate).getTime() : 0,
        watsonGlaserResults.length > 0 ? new Date(watsonGlaserResults[watsonGlaserResults.length - 1].evaluationDate).getTime() : 0,
        legalBenchData ? new Date(legalBenchData.lastEvaluated).getTime() : 0
      );
      
      results.push({
        modelId,
        legalBench: legalBenchScore,
        lnat: lnatScore,
        watsonGlaser: watsonGlaserScore,
        composite,
        grade,
        strengths,
        weaknesses,
        lastTested: lastTested > 0 ? new Date(lastTested).toISOString() : 'Never'
      });
    });

    // Sort by composite score
    results.sort((a, b) => b.composite - a.composite);
    setCombinedResults(results);
  };

  const getCompositeGrade = (score: number): string => {
    if (score >= 85) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#28a745';
    if (score >= 70) return '#ffc107';
    if (score >= 60) return '#fd7e14';
    return '#dc3545';
  };

  const runComprehensiveTest = async () => {
    if (selectedModels.length === 0) {
      alert('Please select at least one model to test');
      return;
    }

    setIsRunningTests(true);
    setTestProgress(0);

    try {
      const totalSteps = selectedModels.length * 2; // LNAT + Watson Glaser for each model
      let completedSteps = 0;

      for (const modelId of selectedModels) {
        try {
          // Run LNAT test
          console.log(`Running LNAT test for ${modelId}`);
          await lnatTester.quickTest(modelId);
          completedSteps++;
          setTestProgress((completedSteps / totalSteps) * 100);

          // Run Watson Glaser test
          console.log(`Running Watson Glaser test for ${modelId}`);
          await watsonGlaserTester.quickTest(modelId);
          completedSteps++;
          setTestProgress((completedSteps / totalSteps) * 100);

        } catch (error) {
          console.error(`Failed to test ${modelId}:`, error);
          completedSteps += 2; // Skip both tests for this model
          setTestProgress((completedSteps / totalSteps) * 100);
        }
      }

      // Reload combined results
      loadCombinedResults();

    } catch (error) {
      console.error('Comprehensive test failed:', error);
      alert('Test failed. Please try again.');
    } finally {
      setIsRunningTests(false);
      setTestProgress(0);
    }
  };

  const renderOverviewTab = () => (
    <div className="overview-tab">
      <div className="test-summary">
        <h3>Legal AI Model Performance Overview</h3>
        <p>Comprehensive evaluation combining LegalBench, LNAT, and Watson-Glaser Critical Thinking assessments</p>
      </div>

      <div className="combined-leaderboard">
        <h4>Composite Performance Rankings</h4>
        
        {combinedResults.length > 0 ? (
          <div className="rankings-table">
            <div className="ranking-header">
              <span>Rank</span>
              <span>Model</span>
              <span>Composite</span>
              <span>LegalBench</span>
              <span>LNAT</span>
              <span>W-G Critical</span>
              <span>Grade</span>
              <span>Key Strengths</span>
            </div>
            
            {combinedResults.map((result, index) => (
              <div key={result.modelId} className="ranking-row">
                <span className="rank">#{index + 1}</span>
                <span className="model-name">{result.modelId}</span>
                <span className="composite-score" style={{ color: getScoreColor(result.composite) }}>
                  {result.composite.toFixed(1)}
                </span>
                <span className="section-score">{result.legalBench.toFixed(1)}</span>
                <span className="section-score">{result.lnat.toFixed(1)}</span>
                <span className="section-score">{result.watsonGlaser.toFixed(1)}</span>
                <span className="grade" style={{ color: getScoreColor(result.composite) }}>
                  {result.grade}
                </span>
                <span className="strengths">
                  {result.strengths.slice(0, 2).join(', ') || 'None identified'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>No comprehensive test results available yet.</p>
            <button className="start-testing-btn" onClick={() => setActiveTab('compare')}>
              Start Testing
            </button>
          </div>
        )}
      </div>

      <div className="testing-methodology">
        <h4>Testing Methodology</h4>
        <div className="methodology-grid">
          <div className="method-card">
            <h5>LegalBench (40%)</h5>
            <p>Domain-specific legal reasoning across contract analysis, evidence evaluation, and legal entailment tasks.</p>
          </div>
          <div className="method-card">
            <h5>LNAT (30%)</h5>
            <p>Law National Aptitude Test format evaluating critical reading, logical reasoning, and argumentative writing.</p>
          </div>
          <div className="method-card">
            <h5>Watson-Glaser (30%)</h5>
            <p>Critical thinking assessment covering inference, assumptions, deduction, interpretation, and argument evaluation.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTestingTab = () => (
    <div className="testing-tab">
      <h3>Run Comprehensive Testing</h3>
      
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
                disabled={isRunningTests}
              />
              <span>{model}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="test-actions">
        <button
          className="comprehensive-test-btn"
          onClick={runComprehensiveTest}
          disabled={isRunningTests || selectedModels.length === 0}
        >
          {isRunningTests ? `Testing... ${testProgress.toFixed(0)}%` : 'Run Comprehensive Test'}
        </button>
        
        {isRunningTests && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${testProgress}%` }} />
          </div>
        )}
      </div>

      <div className="test-info">
        <h4>What This Test Includes</h4>
        <ul>
          <li><strong>LNAT Evaluation:</strong> Legal aptitude assessment with critical reading and reasoning</li>
          <li><strong>Watson-Glaser Test:</strong> Critical thinking evaluation across 5 core areas</li>
          <li><strong>Composite Scoring:</strong> Weighted combination with existing LegalBench data</li>
          <li><strong>Performance Profiling:</strong> Detailed analysis of strengths and weaknesses</li>
        </ul>
        
        <p><strong>Estimated Time:</strong> 5-10 minutes per model depending on complexity</p>
      </div>
    </div>
  );

  return (
    <div className="comprehensive-legal-testing-dashboard">
      <div className="dashboard-header">
        <h2>Comprehensive Legal AI Testing Dashboard</h2>
        <p>Multi-dimensional evaluation of AI model performance for legal applications</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === 'lnat' ? 'active' : ''}`}
          onClick={() => setActiveTab('lnat')}
        >
          🎓 LNAT Testing
        </button>
        <button
          className={`tab ${activeTab === 'watson-glaser' ? 'active' : ''}`}
          onClick={() => setActiveTab('watson-glaser')}
        >
          🧠 Watson-Glaser
        </button>
        <button
          className={`tab ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          🧪 Run Tests
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'lnat' && (
          <div className="redirect-message">
            <p>For detailed LNAT testing, please use the dedicated LNAT Testing tab in the main interface.</p>
            <button onClick={() => window.location.hash = '#lnat-testing'}>Go to LNAT Dashboard</button>
          </div>
        )}
        {activeTab === 'watson-glaser' && (
          <div className="watson-glaser-summary">
            <h3>Watson-Glaser Critical Thinking Results</h3>
            <div className="wg-leaderboard">
              {watsonGlaserTester.getLeaderboard().rankings.map((ranking, index) => (
                <div key={ranking.modelId} className="wg-result-row">
                  <span>#{index + 1}</span>
                  <span>{ranking.modelId}</span>
                  <span>{ranking.overallScore}/40</span>
                  <span>{ranking.grade}</span>
                  <span>{ranking.accuracy.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'compare' && renderTestingTab()}
      </div>

      <div className="dashboard-footer">
        <div className="scoring-explanation">
          <h4>Composite Scoring Formula</h4>
          <p><strong>Composite Score = </strong>(LegalBench × 0.4) + (LNAT × 0.3) + (Watson-Glaser × 0.3)</p>
          <div className="grade-scale">
            <span>A+ (85-100)</span>
            <span>A (80-84)</span>
            <span>B+ (75-79)</span>
            <span>B (70-74)</span>
            <span>C+ (65-69)</span>
            <span>C (60-64)</span>
            <span>D (50-59)</span>
            <span>F (&lt;50)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveLegalTestingDashboard;