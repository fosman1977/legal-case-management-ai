import { useEffect, useState, useCallback } from 'react';
import { storage } from '../utils/storage';
import { Person, Issue } from '../types';
import { LegalAnalysisResult, LegalArgument, ContractClause } from '../engines/advancedLegalEngine';

// Temporary types until LocalAI event system is implemented
interface AIInsight {
  id: string;
  type: string;
  sourceComponent: string;
  sourceDocument: string;
  data: any;
  confidence: number;
  timestamp: string;
}

/**
 * Hook for components to subscribe to AI insights and auto-update their data
 * TODO: Replace with LocalAI event system
 */
export const useAISync = (caseId: string, componentName: string) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Subscribe to AI insights for this case
  useEffect(() => {
    // TODO: Replace with LocalAI event system
    console.log(`🔄 [${componentName}] AI Sync disabled until LocalAI event system is implemented`);
  }, [caseId, componentName]);

  /**
   * Publish AI processing results including advanced legal analysis
   */
  const publishAIResults = useCallback(async (
    sourceDocument: string,
    data: any,
    confidence: number,
    advancedAnalysis?: LegalAnalysisResult
  ) => {
    try {
      setIsProcessing(true);
      console.log(`💾 [${componentName}] Saving extracted entities:`, { sourceDocument, data, confidence });
      
      // Save persons to storage
      if (data.persons && Array.isArray(data.persons)) {
        data.persons.forEach((person: any) => {
          const newPerson: Person = {
            id: `person_${caseId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            caseId: caseId,
            name: person.name || 'Unknown',
            role: person.role || 'Unknown Role',
            description: person.description || '',
            notes: `Extracted from: ${sourceDocument}\nConfidence: ${(person.confidence * 100).toFixed(1)}%`,
            side: person.role?.toLowerCase().includes('claimant') ? 'claimant' : 
                  person.role?.toLowerCase().includes('defendant') ? 'defendant' : 'neutral'
          };
          storage.savePerson(newPerson);
        });
        console.log(`✅ Saved ${data.persons.length} persons`);
      }
      
      // Save issues to storage
      if (data.issues && Array.isArray(data.issues)) {
        data.issues.forEach((issue: any) => {
          const newIssue: Issue = {
            id: `issue_${caseId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            caseId: caseId,
            title: issue.issue || 'Unknown Issue',
            description: issue.description || '',
            status: 'active',
            priority: issue.type === 'primary' ? 'high' : 'medium',
            notes: `Extracted from: ${sourceDocument}\nType: ${issue.type}\nConfidence: ${(issue.confidence * 100).toFixed(1)}%`
          };
          storage.saveIssue(newIssue);
        });
        console.log(`✅ Saved ${data.issues.length} issues`);
      }
      
      // Save authorities to storage (as documents or references)
      if (data.authorities && Array.isArray(data.authorities)) {
        // Authorities could be saved as documents or in a separate authorities storage
        console.log(`📚 Found ${data.authorities.length} authorities:`, data.authorities.map((a: any) => a.citation));
      }
      
      // Save chronology events
      if (data.chronologyEvents && Array.isArray(data.chronologyEvents)) {
        console.log(`📅 Found ${data.chronologyEvents.length} chronology events`);
        // Could save to a timeline/chronology storage
      }
      
      // Handle advanced legal analysis if provided
      if (advancedAnalysis) {
        console.log(`🚀 [${componentName}] Processing advanced legal analysis:`, {
          entities: advancedAnalysis.entities.length,
          arguments: advancedAnalysis.arguments.length,
          clauses: advancedAnalysis.contractClauses.length,
          riskLevel: advancedAnalysis.riskAssessment.overallRisk
        });
        
        // Save advanced legal analysis data
        await saveAdvancedAnalysis(caseId, sourceDocument, advancedAnalysis);
      }
      
    } catch (error) {
      console.error(`[${componentName}] Failed to save AI results:`, error);
    } finally {
      setIsProcessing(false);
    }
  }, [caseId, componentName]);

  /**
   * Save advanced legal analysis data to appropriate storage
   */
  const saveAdvancedAnalysis = async (
    caseId: string, 
    sourceDocument: string, 
    analysis: LegalAnalysisResult
  ) => {
    try {
      // Save legal arguments
      if (analysis.arguments.length > 0) {
        const argumentsKey = `legal_arguments_${caseId}`;
        const existingArguments = JSON.parse(localStorage.getItem(argumentsKey) || '[]');
        
        const newArguments = analysis.arguments.map(arg => ({
          ...arg,
          sourceDocument,
          caseId,
          timestamp: new Date().toISOString()
        }));
        
        existingArguments.push(...newArguments);
        localStorage.setItem(argumentsKey, JSON.stringify(existingArguments));
        console.log(`💼 Saved ${newArguments.length} legal arguments`);
      }
      
      // Save contract clauses
      if (analysis.contractClauses.length > 0) {
        const clausesKey = `contract_clauses_${caseId}`;
        const existingClauses = JSON.parse(localStorage.getItem(clausesKey) || '[]');
        
        const newClauses = analysis.contractClauses.map(clause => ({
          ...clause,
          sourceDocument,
          caseId,
          timestamp: new Date().toISOString()
        }));
        
        existingClauses.push(...newClauses);
        localStorage.setItem(clausesKey, JSON.stringify(existingClauses));
        console.log(`📋 Saved ${newClauses.length} contract clauses`);
      }
      
      // Save risk assessment
      if (analysis.riskAssessment) {
        const riskKey = `risk_assessment_${caseId}`;
        const existingRisks = JSON.parse(localStorage.getItem(riskKey) || '[]');
        
        const riskEntry = {
          id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceDocument,
          caseId,
          ...analysis.riskAssessment,
          timestamp: new Date().toISOString()
        };
        
        existingRisks.push(riskEntry);
        localStorage.setItem(riskKey, JSON.stringify(existingRisks));
        console.log(`⚠️ Saved risk assessment: ${analysis.riskAssessment.overallRisk} risk`);
      }
      
      // Save document classification
      if (analysis.documentClassification) {
        const classificationKey = `document_classification_${caseId}`;
        const existingClassifications = JSON.parse(localStorage.getItem(classificationKey) || '[]');
        
        const classificationEntry = {
          id: `classification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceDocument,
          caseId,
          ...analysis.documentClassification,
          timestamp: new Date().toISOString()
        };
        
        existingClassifications.push(classificationEntry);
        localStorage.setItem(classificationKey, JSON.stringify(existingClassifications));
        console.log(`📂 Saved document classification: ${analysis.documentClassification.primaryType}`);
      }
      
      // Save advanced entities with full metadata
      const advancedEntitiesKey = `advanced_entities_${caseId}`;
      const existingAdvancedEntities = JSON.parse(localStorage.getItem(advancedEntitiesKey) || '[]');
      
      const newAdvancedEntities = analysis.entities.map(entity => ({
        ...entity,
        sourceDocument,
        caseId,
        timestamp: new Date().toISOString()
      }));
      
      existingAdvancedEntities.push(...newAdvancedEntities);
      localStorage.setItem(advancedEntitiesKey, JSON.stringify(existingAdvancedEntities));
      console.log(`🎯 Saved ${newAdvancedEntities.length} advanced entities`);
      
    } catch (error) {
      console.error('Failed to save advanced analysis:', error);
    }
  };

  return {
    insights,
    isProcessing,
    publishAIResults,
    saveAdvancedAnalysis
  };
};

// Temporary types for AI updates
interface AIUpdate {
  source?: string;
  addedCount?: number;
  mergedCount?: number;
  crossRefs?: any[];
  [key: string]: any;
}

// TODO: Replace with LocalAI equivalent
export const useAIUpdates = (caseId: string, componentName?: string) => {
  return {
    updateCount: 0,
    lastUpdate: null as AIUpdate | null,
    updates: [] as AIUpdate[]
  };
};