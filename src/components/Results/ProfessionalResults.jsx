/**
 * Professional Results Interface - Week 6 Day 1-2 Implementation
 * Professional display of analysis results and Claude insights
 */

import React, { useState } from 'react';
import ResultsHeader from './ResultsHeader';
import TabContainer from './TabContainer';
import Tab from './Tab';
import ExecutiveSummary from './ExecutiveSummary';
import DocumentAnalysisView from './DocumentAnalysisView';
import TimelineVisualization from './TimelineVisualization';
import StrategicInsightsView from './StrategicInsightsView';
import ExportOptions from './ExportOptions';
import './ProfessionalResults.css';

const ProfessionalResults = ({ analysisResults, claudeInsights, caseContext }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="professional-results">
      <ResultsHeader case={caseContext} />
      
      <TabContainer>
        <Tab 
          id="overview" 
          label="Executive Summary" 
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        >
          <ExecutiveSummary 
            analysis={analysisResults}
            insights={claudeInsights}
          />
        </Tab>

        <Tab 
          id="documents" 
          label="Document Analysis"
          active={activeTab === 'documents'}
          onClick={() => setActiveTab('documents')}
        >
          <DocumentAnalysisView analysis={analysisResults} />
        </Tab>

        <Tab 
          id="timeline" 
          label="Timeline"
          active={activeTab === 'timeline'}
          onClick={() => setActiveTab('timeline')}
        >
          <TimelineVisualization events={analysisResults.timeline} />
        </Tab>

        <Tab 
          id="insights" 
          label="Strategic Insights"
          active={activeTab === 'insights'}
          onClick={() => setActiveTab('insights')}
        >
          <StrategicInsightsView insights={claudeInsights} />
        </Tab>

        <Tab 
          id="export" 
          label="Export"
          active={activeTab === 'export'}
          onClick={() => setActiveTab('export')}
        >
          <ExportOptions 
            analysis={analysisResults}
            insights={claudeInsights}
            case={caseContext}
          />
        </Tab>
      </TabContainer>
    </div>
  );
};

export default ProfessionalResults;