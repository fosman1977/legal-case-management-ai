import React, { useState, useEffect } from 'react';
import { CaseDocument } from '../types';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';
import { aiAnalyzer } from '../utils/aiAnalysis';
import { unifiedAIClient } from '../utils/unifiedAIClient';
// Helper function to get AI preferences
const getAIPreferences = (caseId: string) => {
  const savedPrefs = localStorage.getItem(`ai_prefs_${caseId}`);
  if (savedPrefs) {
    return JSON.parse(savedPrefs);
  }
  return { selectedModel: 'gpt-3.5-turbo' };
};
import { AIStatusIndicator } from './AIStatusIndicator';

interface AutoGeneratorProps {
  caseId: string;
  documents?: CaseDocument[];
}

interface GenerationStats {
  chronologyEvents: number;
  persons: number;
  issues: number;
  keyPoints: number;
  authorities: number;
  processingTime: number;
  confidence: number;
}

export const AutoGenerator: React.FC<AutoGeneratorProps> = ({ caseId, documents: propDocuments }) => {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [lastGenerationStats, setLastGenerationStats] = useState<GenerationStats | null>(null);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2:3b');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use prop documents if provided, otherwise load from storage
    if (propDocuments && propDocuments.length > 0) {
      console.log(`📄 AutoGenerator: Using ${propDocuments.length} documents from props`);
      setDocuments(propDocuments);
    } else {
      loadDocuments();
    }
  }, [caseId, propDocuments]);

  const loadDocuments = async () => {
    try {
      // Merge all document sources like DocumentManager does
      const allDocs: CaseDocument[] = [];

      // 1. Load scanned documents from localStorage
      const storageKey = `scanned_documents_${caseId}`;
      const savedScannedDocs = localStorage.getItem(storageKey);
      if (savedScannedDocs) {
        try {
          const scannedDocuments = JSON.parse(savedScannedDocs);
          allDocs.push(...scannedDocuments);
          console.log(`📦 AutoGenerator: Loaded ${scannedDocuments.length} scanned documents`);
        } catch (error) {
          console.error('Failed to parse saved scanned documents:', error);
        }
      }

      // 2. Load IndexedDB documents
      const indexedDBDocs = await indexedDBManager.getDocuments(caseId);
      allDocs.push(...indexedDBDocs);

      // 3. Fallback to localStorage documents
      if (allDocs.length === 0) {
        const localStorageDocs = storage.getDocuments(caseId);
        allDocs.push(...localStorageDocs);
      }

      // Remove duplicates (prioritize scanned documents)
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.fileName === doc.fileName || d.id === doc.id)
      );

      console.log(`📄 AutoGenerator: Total ${uniqueDocs.length} documents available`);
      setDocuments(uniqueDocs);
    } catch (error) {
      console.error('Failed to load documents for AutoGenerator:', error);
      setDocuments(storage.getDocuments(caseId));
    }
  };

  const runComprehensiveGeneration = async () => {
    if (documents.length === 0) {
      setError('No documents available for analysis. Please upload documents first.');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStage('Initializing...');
    setError(null);
    const startTime = Date.now();

    try {
      // Get security preferences
      const aiPrefs = getAIPreferences(caseId);
      
      setCurrentStage('Analyzing documents with AI...');
      setGenerationProgress(20);

      // Configure progress callback
      const progressCallback = (stage: string, progress: number) => {
        setCurrentStage(stage);
        setGenerationProgress(20 + (progress * 0.2)); // 20-40% for analysis
      };

      // Use RAG-based entity extraction (much faster and more reliable)
      setCurrentStage('Extracting entities with RAG...');
      // Extract from all available documents
      const combinedText = documents.map((doc: any) => doc.fileContent || doc.content || '').join('\n\n');
      const result = await unifiedAIClient.extractEntities(combinedText);
      
      setCurrentStage('Processing chronology events...');
      setGenerationProgress(40);

      // Save chronology events
      let savedChronology = 0;
      for (const event of result.chronologyEvents) {
        const chronologyEvent = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          caseId,
          date: event.date,
          description: event.event, // Map 'event' to 'description'
          significance: `Confidence: ${Math.round(event.confidence * 100)}%`, // Add significance based on confidence
          documentRef: undefined
        };
        storage.saveChronologyEvent(chronologyEvent);
        savedChronology++;
      }

      setCurrentStage('Processing dramatis personae...');
      setGenerationProgress(55);

      // Save persons
      let savedPersons = 0;
      const existingPersons = localStorage.getItem(`dramatis_personae_${caseId}`);
      const currentPersons = existingPersons ? JSON.parse(existingPersons) : [];
      
      for (const person of result.persons) {
        const newPerson = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          caseId,
          name: person.name,
          role: person.role as 'claimant' | 'defendant' | 'witness' | 'expert' | 'lawyer' | 'judge' | 'other',
          description: `Role: ${person.role}`, // Add description based on role
          relevance: `Confidence: ${Math.round(person.confidence * 100)}%`, // Add relevance based on confidence
          documentRefs: [] // Initialize empty array since RAG result doesn't include documentRefs
        };
        
        // Check for duplicates by name
        const existing = currentPersons.find((p: any) => 
          p.name.toLowerCase() === newPerson.name.toLowerCase()
        );
        
        if (existing) {
          // Merge document references
          existing.documentRefs = [...new Set([...existing.documentRefs, ...newPerson.documentRefs])];
        } else {
          currentPersons.push(newPerson);
          savedPersons++;
        }
      }
      
      localStorage.setItem(`dramatis_personae_${caseId}`, JSON.stringify(currentPersons));

      setCurrentStage('Processing issues...');
      setGenerationProgress(70);

      // Save issues
      let savedIssues = 0;
      const existingIssues = localStorage.getItem(`issues_${caseId}`);
      const currentIssues = existingIssues ? JSON.parse(existingIssues) : [];
      
      for (const issue of result.issues) {
        const newIssue = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          caseId,
          title: issue.issue, // Map 'issue' to 'title'
          description: `Type: ${issue.type}`, // Use type as description
          category: issue.type === 'legal' ? 'legal' as const : 'factual' as const, // Map type to category
          priority: 'medium' as const, // Default priority
          status: 'unresolved' as const, // Default status
          documentRefs: [], // Initialize empty array
          relatedIssues: [] // Initialize empty array
        };
        currentIssues.push(newIssue);
        savedIssues++;
      }
      
      localStorage.setItem(`issues_${caseId}`, JSON.stringify(currentIssues));

      setCurrentStage('Processing key points...');
      setGenerationProgress(85);

      // Save key points - RAG doesn't return keyPoints, so we'll extract from issues
      let savedKeyPoints = 0;
      for (const issue of result.issues) {
        const newKeyPoint = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          caseId,
          category: 'legal_argument' as const, // Default category
          point: issue.issue, // Use issue text as key point
          supportingDocs: [], // Initialize empty array
          order: savedKeyPoints + 1
        };
        storage.saveKeyPoint(newKeyPoint);
        savedKeyPoints++;
      }

      setCurrentStage('Processing legal authorities...');
      setGenerationProgress(95);

      // Save authorities
      let savedAuthorities = 0;
      for (const authority of result.authorities) {
        const newAuthority = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          caseId,
          citation: authority.citation,
          principle: authority.relevance, // Map 'relevance' to 'principle'
          relevance: `Confidence: ${Math.round(authority.confidence * 100)}%` // Add relevance based on confidence
        };
        storage.saveAuthority(newAuthority);
        savedAuthorities++;
      }

      setCurrentStage('Finalizing...');
      setGenerationProgress(100);

      // Set final stats
      const processingTime = Date.now() - startTime;
      const averageConfidence = [
        ...result.chronologyEvents.map(e => e.confidence),
        ...result.persons.map(p => p.confidence),
        ...result.issues.map(i => i.confidence),
        ...result.authorities.map(a => a.confidence)
      ].reduce((sum, conf) => sum + conf, 0) / (
        result.chronologyEvents.length + result.persons.length + result.issues.length + result.authorities.length
      ) || 0;

      const stats: GenerationStats = {
        chronologyEvents: savedChronology,
        persons: savedPersons,
        issues: savedIssues,
        keyPoints: savedKeyPoints,
        authorities: savedAuthorities,
        processingTime: processingTime,
        confidence: averageConfidence
      };
      
      setLastGenerationStats(stats);

      // Success message
      const totalGenerated = savedChronology + savedPersons + savedIssues + savedKeyPoints + savedAuthorities;
      alert(
        `🎉 Auto-generation complete!\n\n` +
        `Generated ${totalGenerated} items:\n` +
        `• ${savedChronology} chronology events\n` +
        `• ${savedPersons} new persons\n` +
        `• ${savedIssues} issues\n` +
        `• ${savedKeyPoints} key points\n` +
        `• ${savedAuthorities} legal authorities\n\n` +
        `Processing time: ${Math.round(processingTime / 1000)}s\n` +
        `Confidence: ${Math.round(averageConfidence * 100)}%`
      );

    } catch (error) {
      console.error('Auto-generation failed:', error);
      alert('Auto-generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentStage('');
    }
  };

  const clearAllGeneratedData = async () => {
    if (!window.confirm(
      'Are you sure you want to clear ALL generated data?\n\n' +
      'This will remove:\n' +
      '• All chronology events\n' +
      '• All dramatis personae\n' +
      '• All issues\n' +
      '• All key points\n' +
      '• All legal authorities\n\n' +
      'This action cannot be undone.'
    )) {
      return;
    }

    try {
      // Clear chronology
      const chronologyEvents = storage.getChronology(caseId);
      chronologyEvents.forEach(event => storage.deleteChronologyEvent(event.id));

      // Clear persons
      localStorage.removeItem(`dramatis_personae_${caseId}`);

      // Clear issues
      localStorage.removeItem(`issues_${caseId}`);

      // Clear key points
      const keyPoints = storage.getKeyPoints(caseId);
      keyPoints.forEach(point => storage.deleteKeyPoint(point.id));

      // Clear authorities
      const authorities = storage.getAuthorities(caseId);
      authorities.forEach(auth => storage.deleteAuthority(auth.id));

      setLastGenerationStats(null);
      alert('All generated data has been cleared.');
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear some data. Please try again.');
    }
  };

  return (
    <div className="auto-generator">
      <div className="generator-header">
        <h3>🚀 Auto-Generate Case Elements</h3>
        <p className="generator-description">
          Automatically extract and organize chronology, persons, issues, key points, 
          and legal authorities from your uploaded documents using AI analysis.
        </p>
      </div>

      <div className="generator-stats">
        <div className="stat-card">
          <h4>📄 Documents Ready</h4>
          <span className="stat-number">{documents.length}</span>
          <p>Documents available for analysis</p>
          {documents.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
              Sources: {documents.filter(d => d.id.startsWith('scan_')).length} scanned, {documents.filter(d => !d.id.startsWith('scan_')).length} other
            </p>
          )}
        </div>
        
        {lastGenerationStats && (
          <>
            <div className="stat-card">
              <h4>⏱️ Last Processing</h4>
              <span className="stat-number">{Math.round(lastGenerationStats.processingTime / 1000)}s</span>
              <p>Processing time</p>
            </div>
            
            <div className="stat-card">
              <h4>🎯 Confidence</h4>
              <span className="stat-number">{Math.round(lastGenerationStats.confidence * 100)}%</span>
              <p>AI confidence level</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="error-message" style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {isGenerating && (
        <div className="generation-progress">
          <div className="progress-info">
            <span>{currentStage}</span>
            <span>{generationProgress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
          <p className="progress-note">
            Please wait while AI analyzes your documents and generates case elements...
          </p>
        </div>
      )}

      {lastGenerationStats && !isGenerating && (
        <div className="generation-results">
          <h4>📊 Last Generation Results</h4>
          <div className="results-grid">
            <div className="result-item">
              <span className="result-label">📅 Chronology Events:</span>
              <span className="result-value">{lastGenerationStats.chronologyEvents}</span>
            </div>
            <div className="result-item">
              <span className="result-label">👥 Persons:</span>
              <span className="result-value">{lastGenerationStats.persons}</span>
            </div>
            <div className="result-item">
              <span className="result-label">⚖️ Issues:</span>
              <span className="result-value">{lastGenerationStats.issues}</span>
            </div>
            <div className="result-item">
              <span className="result-label">🔑 Key Points:</span>
              <span className="result-value">{lastGenerationStats.keyPoints}</span>
            </div>
            <div className="result-item">
              <span className="result-label">📚 Authorities:</span>
              <span className="result-value">{lastGenerationStats.authorities}</span>
            </div>
          </div>
        </div>
      )}

      <div className="generator-actions">
        <button 
          className="btn btn-primary btn-large"
          onClick={runComprehensiveGeneration}
          disabled={isGenerating || documents.length === 0}
        >
          {isGenerating ? 'Generating...' : '🤖 Generate All Case Elements'}
        </button>

        {lastGenerationStats && (
          <button 
            className="btn btn-danger"
            onClick={clearAllGeneratedData}
            disabled={isGenerating}
          >
            🗑️ Clear All Generated Data
          </button>
        )}
      </div>

      <div className="generator-info">
        <h4>What Will Be Generated:</h4>
        <div className="info-grid">
          <div className="info-item">
            <h5>📅 Chronology</h5>
            <p>Timeline of events extracted from documents with dates and significance</p>
          </div>
          <div className="info-item">
            <h5>👥 Dramatis Personae</h5>
            <p>People mentioned in documents with roles and relevance</p>
          </div>
          <div className="info-item">
            <h5>⚖️ Issues</h5>
            <p>Legal and factual disputes identified in the case</p>
          </div>
          <div className="info-item">
            <h5>🔑 Key Points</h5>
            <p>Important arguments and evidence for examination and closing</p>
          </div>
          <div className="info-item">
            <h5>📚 Authorities</h5>
            <p>Case law and statutory references with legal principles</p>
          </div>
        </div>
      </div>
    </div>
  );
};