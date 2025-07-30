import { useEffect, useState, useCallback } from 'react';
import { aiEventSystem, AIInsight, AIEventData, AIEntityManager } from '../utils/aiEventSystem';
import { Issue, Person, ChronologyEvent, LegalAuthority } from '../types';

/**
 * Hook for components to subscribe to AI insights and auto-update their data
 */
export const useAISync = (caseId: string, componentName: string) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Subscribe to AI events for this case
    const unsubscribe = aiEventSystem.subscribe(caseId, (insight) => {
      setInsights(prev => [...prev, insight]);
      
      // Auto-process insights that aren't from this component
      if (insight.sourceComponent !== componentName) {
        handleAIInsight(insight);
      }
    });

    // Load existing insights
    const existingInsights = aiEventSystem.getInsights(caseId);
    setInsights(existingInsights);

    return unsubscribe;
  }, [caseId, componentName]);

  /**
   * Publish AI results from this component
   */
  const publishAIResults = useCallback(async (
    sourceDocument: string,
    results: AIEventData,
    confidence: number = 0.8
  ) => {
    setIsProcessing(true);
    try {
      await aiEventSystem.processAIResults(
        caseId,
        componentName,
        sourceDocument,
        results,
        confidence
      );
    } finally {
      setIsProcessing(false);
    }
  }, [caseId, componentName]);

  /**
   * Handle incoming AI insights from other components
   */
  const handleAIInsight = useCallback((insight: AIInsight) => {
    console.log(`📥 ${componentName} received AI insight:`, insight.type, 'from', insight.sourceComponent);
    
    switch (insight.type) {
      case 'person':
        handlePersonInsights(insight);
        break;
      case 'issue':
        handleIssueInsights(insight);
        break;
      case 'chronology':
        handleChronologyInsights(insight);
        break;
      case 'authority':
        handleAuthorityInsights(insight);
        break;
      case 'cross_reference':
        handleCrossReferenceInsights(insight);
        break;
    }
  }, [caseId, componentName]);

  /**
   * Handle person insights - add to Persons tab if applicable
   */
  const handlePersonInsights = useCallback((insight: AIInsight) => {
    if (componentName === 'EnhancedDramatisPersonae' || componentName === 'DramatisPersonae') {
      const newPersons: Omit<Person, 'id' | 'caseId'>[] = insight.data;
      
      // Load existing persons
      const existingData = localStorage.getItem(`dramatis_personae_${caseId}`);
      const existingPersons: Person[] = existingData ? JSON.parse(existingData) : [];
      
      let addedCount = 0;
      let mergedCount = 0;
      
      for (const personData of newPersons) {
        const similarPerson = AIEntityManager.findSimilarPerson(personData, existingPersons);
        
        if (similarPerson) {
          // Merge with existing person
          const mergedPerson = AIEntityManager.mergePerson(similarPerson, personData);
          const index = existingPersons.findIndex(p => p.id === similarPerson.id);
          existingPersons[index] = mergedPerson;
          mergedCount++;
        } else {
          // Add new person
          const newPerson: Person = {
            ...personData,
            id: `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            caseId,
            tags: [...(personData.tags || []), `ai-extracted`, `from-${insight.sourceComponent}`],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          existingPersons.push(newPerson);
          addedCount++;
        }
      }
      
      // Save updated persons
      localStorage.setItem(`dramatis_personae_${caseId}`, JSON.stringify(existingPersons));
      
      // Trigger component refresh
      window.dispatchEvent(new CustomEvent('ai-persons-updated', { 
        detail: { caseId, addedCount, mergedCount, source: insight.sourceComponent }
      }));
      
      console.log(`👥 Persons updated: ${addedCount} added, ${mergedCount} merged`);
    }
  }, [caseId, componentName]);

  /**
   * Handle issue insights - add to Issues tab if applicable
   */
  const handleIssueInsights = useCallback((insight: AIInsight) => {
    if (componentName === 'EnhancedIssuesBuilder' || componentName === 'IssuesBuilder') {
      const newIssues: Omit<Issue, 'id' | 'caseId'>[] = insight.data;
      
      // Load existing issues
      const existingData = localStorage.getItem(`issues_${caseId}`);
      const existingIssues: Issue[] = existingData ? JSON.parse(existingData) : [];
      
      let addedCount = 0;
      let mergedCount = 0;
      
      for (const issueData of newIssues) {
        const similarIssue = AIEntityManager.findSimilarIssue(issueData, existingIssues);
        
        if (similarIssue) {
          // Merge with existing issue
          const mergedIssue = AIEntityManager.mergeIssue(similarIssue, issueData);
          const index = existingIssues.findIndex(i => i.id === similarIssue.id);
          existingIssues[index] = mergedIssue;
          mergedCount++;
        } else {
          // Add new issue
          const newIssue: Issue = {
            ...issueData,
            id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            caseId,
            tags: [...(issueData.tags || []), `ai-extracted`, `from-${insight.sourceComponent}`],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          existingIssues.push(newIssue);
          addedCount++;
        }
      }
      
      // Save updated issues
      localStorage.setItem(`issues_${caseId}`, JSON.stringify(existingIssues));
      
      // Trigger component refresh
      window.dispatchEvent(new CustomEvent('ai-issues-updated', { 
        detail: { caseId, addedCount, mergedCount, source: insight.sourceComponent }
      }));
      
      console.log(`⚖️ Issues updated: ${addedCount} added, ${mergedCount} merged`);
    }
  }, [caseId, componentName]);

  /**
   * Handle chronology insights
   */
  const handleChronologyInsights = useCallback((insight: AIInsight) => {
    if (componentName === 'EnhancedChronologyBuilder' || componentName === 'ChronologyBuilder') {
      const newEvents: Omit<ChronologyEvent, 'id' | 'caseId'>[] = insight.data;
      
      // Load existing chronology
      const existingData = localStorage.getItem(`chronology_${caseId}`);
      const existingEvents: ChronologyEvent[] = existingData ? JSON.parse(existingData) : [];
      
      let addedCount = 0;
      
      for (const eventData of newEvents) {
        // Check for duplicate events by date and description similarity
        const isDuplicate = existingEvents.some(existing => 
          existing.date === eventData.date &&
          AIEntityManager['calculateStringSimilarity'](
            existing.description.toLowerCase(),
            eventData.description.toLowerCase()
          ) > 0.7
        );
        
        if (!isDuplicate) {
          const newEvent: ChronologyEvent = {
            ...eventData,
            id: `chronology_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            caseId,
            documentRef: insight.sourceDocument
          };
          existingEvents.push(newEvent);
          addedCount++;
        }
      }
      
      // Sort by date
      existingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Save updated chronology
      localStorage.setItem(`chronology_${caseId}`, JSON.stringify(existingEvents));
      
      // Trigger component refresh
      window.dispatchEvent(new CustomEvent('ai-chronology-updated', { 
        detail: { caseId, addedCount, source: insight.sourceComponent }
      }));
      
      console.log(`📅 Chronology updated: ${addedCount} events added`);
    }
  }, [caseId, componentName]);

  /**
   * Handle authority insights
   */
  const handleAuthorityInsights = useCallback((insight: AIInsight) => {
    if (componentName === 'EnhancedAuthoritiesManager' || componentName === 'AuthoritiesManager') {
      const newAuthorities: Omit<LegalAuthority, 'id' | 'caseId'>[] = insight.data;
      
      // Load existing authorities
      const existingData = localStorage.getItem(`authorities_${caseId}`);
      const existingAuthorities: LegalAuthority[] = existingData ? JSON.parse(existingData) : [];
      
      let addedCount = 0;
      
      for (const authorityData of newAuthorities) {
        // Check for duplicate by citation
        const isDuplicate = existingAuthorities.some(existing => 
          existing.citation.toLowerCase() === authorityData.citation.toLowerCase()
        );
        
        if (!isDuplicate) {
          const newAuthority: LegalAuthority = {
            ...authorityData,
            id: `authority_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            caseId,
            tags: [...(authorityData.tags || []), `ai-extracted`, `from-${insight.sourceComponent}`],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          existingAuthorities.push(newAuthority);
          addedCount++;
        }
      }
      
      // Save updated authorities
      localStorage.setItem(`authorities_${caseId}`, JSON.stringify(existingAuthorities));
      
      // Trigger component refresh
      window.dispatchEvent(new CustomEvent('ai-authorities-updated', { 
        detail: { caseId, addedCount, source: insight.sourceComponent }
      }));
      
      console.log(`📚 Authorities updated: ${addedCount} added`);
    }
  }, [caseId, componentName]);

  /**
   * Handle cross-reference insights
   */
  const handleCrossReferenceInsights = useCallback((insight: AIInsight) => {
    console.log(`🔗 Cross-references identified from ${insight.sourceComponent}:`, insight.data);
    
    // Trigger global cross-reference update
    window.dispatchEvent(new CustomEvent('ai-cross-references-updated', { 
      detail: { caseId, crossRefs: insight.data, source: insight.sourceComponent }
    }));
  }, [caseId]);

  /**
   * Get insights by type
   */
  const getInsightsByType = useCallback((type: AIInsight['type']) => {
    return insights.filter(insight => insight.type === type);
  }, [insights]);

  /**
   * Get insights from specific component
   */
  const getInsightsFromComponent = useCallback((sourceComponent: string) => {
    return insights.filter(insight => insight.sourceComponent === sourceComponent);
  }, [insights]);

  return {
    insights,
    isProcessing,
    publishAIResults,
    getInsightsByType,
    getInsightsFromComponent,
    handleAIInsight
  };
};

/**
 * Hook for components to listen to real-time updates
 */
export const useAIUpdates = (caseId: string, eventTypes: string[]) => {
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<any>(null);

  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail.caseId === caseId) {
        setUpdateCount(prev => prev + 1);
        setLastUpdate(event.detail);
      }
    };

    // Subscribe to specified event types
    eventTypes.forEach(eventType => {
      window.addEventListener(eventType, handleUpdate as EventListener);
    });

    return () => {
      eventTypes.forEach(eventType => {
        window.removeEventListener(eventType, handleUpdate as EventListener);
      });
    };
  }, [caseId, eventTypes]);

  return { updateCount, lastUpdate };
};