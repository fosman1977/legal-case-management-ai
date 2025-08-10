import { useEffect, useState, useCallback } from 'react';

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
   * Publish AI processing results for other components to sync
   * TODO: Replace with LocalAI event system
   */
  const publishAIResults = useCallback(async (
    sourceDocument: string,
    data: any,
    confidence: number
  ) => {
    try {
      setIsProcessing(true);
      console.log(`🔄 [${componentName}] AI Results would be published:`, { sourceDocument, data, confidence });
      // TODO: Implement LocalAI event system
    } catch (error) {
      console.error(`[${componentName}] Failed to publish AI results:`, error);
    } finally {
      setIsProcessing(false);
    }
  }, [caseId, componentName]);

  return {
    insights,
    isProcessing,
    publishAIResults
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