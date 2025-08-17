import React, { useState, useEffect } from 'react';
import { UnifiedAIClient } from '../utils/unifiedAIClient';
// import { intelligentModelRouter } from '../utils/intelligentModelRouter';
import { AIModelMigration } from '../utils/aiModelMigration';
import { LegalBenchEvaluator, LEGAL_MODEL_BENCHMARKS, LegalBenchScore, LNATScore, WatsonGlaserScore } from '../utils/legalBenchIntegration';
import { LNATModelTester } from '../utils/lnatModelTester';
import { WatsonGlaserModelTester } from '../utils/watsonGlaserTester';
import './ModelSelectionUI.css';

interface ModelInfo {
  id: string;
  name: string;
  recommended: boolean;
  capabilities: string[];
  status: 'available' | 'unavailable' | 'checking';
  legalScore?: LegalBenchScore;
  lnatScore?: LNATScore;
  watsonGlaserScore?: WatsonGlaserScore;
  riskLevel?: 'low' | 'medium' | 'high';
  legalTasks?: string[];
}

interface ModelSelectionUIProps {
  caseId: string;
  caseType?: 'contract' | 'litigation' | 'regulatory';
  caseData?: { title: string; courtReference: string };
  onModelChange?: (model: string) => void;
}

export const ModelSelectionUI: React.FC<ModelSelectionUIProps> = ({ caseId, caseType, caseData, onModelChange }) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [lnatTester] = useState(() => new LNATModelTester());
  const [watsonGlaserTester] = useState(() => new WatsonGlaserModelTester());
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [autoSelect, setAutoSelect] = useState(true);
  const [lastTask, setLastTask] = useState<string>('');

  useEffect(() => {
    loadModels();
    loadPreferences();
  }, [caseId]);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const aiClient = new UnifiedAIClient();
      const availableModels = await aiClient.getModels();
      const bestModel = await AIModelMigration.getBestModel();
      
      // Define model capabilities
      const modelCapabilities: Record<string, string[]> = {
        'llama': ['General text', 'Code generation', 'Analysis'],
        'mistral': ['Fast inference', 'General purpose', 'Multilingual'],
        'codellama': ['Code generation', 'Technical docs', 'Debugging'],
        'phi': ['Lightweight', 'Fast response', 'Efficient'],
        'gpt-4': ['Advanced reasoning', 'Complex tasks', 'High quality'],
        'gpt-3.5-turbo': ['Balanced', 'Cost-effective', 'Versatile']
      };

      const modelInfos: ModelInfo[] = availableModels.map((modelId: string) => {
        const baseName = modelId.split('-')[0].toLowerCase();
        const legalCapabilities = LEGAL_MODEL_BENCHMARKS[modelId];
        return {
          id: modelId,
          name: modelId,
          recommended: modelId === bestModel,
          capabilities: modelCapabilities[baseName] || ['General purpose'],
          status: 'available' as const,
          legalScore: legalCapabilities?.legalBenchScore,
          lnatScore: legalCapabilities?.lnatScore,
          watsonGlaserScore: legalCapabilities?.watsonGlaserScore,
          riskLevel: LegalBenchEvaluator.getLegalRiskAssessment(modelId),
          legalTasks: legalCapabilities?.recommendedTasks
        };
      });

      // Add common models if not in LocalAI list
      const commonModels = ['gpt-4', 'gpt-3.5-turbo', 'llama-2-7b-chat', 'llama-2-13b-chat', 'mistral-7b-instruct'];
      commonModels.forEach(model => {
        if (!modelInfos.find(m => m.id === model)) {
          const legalCapabilities = LEGAL_MODEL_BENCHMARKS[model];
          modelInfos.push({
            id: model,
            name: model,
            recommended: false,
            capabilities: modelCapabilities[model] || ['General purpose'],
            status: 'unavailable' as const,
            legalScore: legalCapabilities?.legalBenchScore,
            lnatScore: legalCapabilities?.lnatScore,
            watsonGlaserScore: legalCapabilities?.watsonGlaserScore,
            riskLevel: LegalBenchEvaluator.getLegalRiskAssessment(model),
            legalTasks: legalCapabilities?.recommendedTasks
          });
        }
      });

      setModels(modelInfos);
      
      // Set selected model
      const currentModel = localStorage.getItem(`selected_model_${caseId}`) || bestModel;
      setSelectedModel(currentModel);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreferences = () => {
    const prefs = localStorage.getItem(`model_preferences_${caseId}`);
    if (prefs) {
      const parsed = JSON.parse(prefs);
      setAutoSelect(parsed.autoSelect !== false);
    }
  };

  const handleModelSelect = async (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem(`selected_model_${caseId}`, modelId);
    
    // Save preference
    const prefs = {
      autoSelect,
      manualSelection: modelId,
      timestamp: Date.now()
    };
    localStorage.setItem(`model_preferences_${caseId}`, JSON.stringify(prefs));
    
    if (onModelChange) {
      onModelChange(modelId);
    }
  };

  const handleAutoSelectChange = (checked: boolean) => {
    setAutoSelect(checked);
    const prefs = {
      autoSelect: checked,
      manualSelection: selectedModel,
      timestamp: Date.now()
    };
    localStorage.setItem(`model_preferences_${caseId}`, JSON.stringify(prefs));
    
    if (checked) {
      // Get best model for current task
      suggestModelForTask(lastTask || 'general');
    }
  };

  const suggestModelForTask = async (taskDescription: string) => {
    setLastTask(taskDescription);
    if (!autoSelect) return;
    
    try {
      // Get recommendations based on case type
      const recommendations = LegalBenchEvaluator.getRecommendationsForCaseType(actualCaseType);
      const bestModel = recommendations.find(model => 
        models.find(m => m.id === model && m.status === 'available')
      );
      
      const suggestion = {
        model: bestModel || selectedModel || 'gpt-4'
      };
      
      if (suggestion.model !== selectedModel) {
        setSelectedModel(suggestion.model);
        if (onModelChange) {
          onModelChange(suggestion.model);
        }
      }
    } catch (error) {
      console.error('Failed to get model suggestion:', error);
    }
  };

  const getModelBadge = (model: ModelInfo) => {
    if (model.recommended) {
      return <span className="model-badge recommended">Recommended</span>;
    }
    if (model.status === 'unavailable') {
      return <span className="model-badge unavailable">Offline</span>;
    }
    if (model.riskLevel === 'low') {
      return <span className="model-badge low-risk">Legal Ready</span>;
    }
    return null;
  };

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  const inferCaseType = (caseTitle: string, courtRef: string): 'contract' | 'litigation' | 'regulatory' => {
    const title = caseTitle.toLowerCase();
    const ref = courtRef.toLowerCase();
    
    // Check for contract-related keywords
    if (title.includes('contract') || title.includes('breach') || title.includes('agreement') ||
        title.includes('sale') || title.includes('purchase') || title.includes('supply')) {
      return 'contract';
    }
    
    // Check for regulatory keywords
    if (title.includes('regulation') || title.includes('compliance') || title.includes('regulatory') ||
        title.includes('licensing') || title.includes('permission') || ref.includes('admin')) {
      return 'regulatory';
    }
    
    // Default to litigation for other cases
    return 'litigation';
  };

  const actualCaseType = caseType || inferCaseType(caseData?.title || '', caseData?.courtReference || '');

  if (isLoading) {
    return (
      <div className="model-selection-ui">
        <div className="loading">Loading available models...</div>
      </div>
    );
  }

  return (
    <div className="model-selection-ui">
      <div className="model-header">
        <h4>AI Model Selection</h4>
        <div className="auto-select-toggle">
          <label>
            <input
              type="checkbox"
              checked={autoSelect}
              onChange={(e) => handleAutoSelectChange(e.target.checked)}
            />
            <span>Auto-select best model for task</span>
          </label>
        </div>
      </div>

      <div className="model-grid">
        {models.map(model => (
          <div
            key={model.id}
            className={`model-card ${selectedModel === model.id ? 'selected' : ''} ${model.status === 'unavailable' ? 'unavailable' : ''}`}
            onClick={() => model.status === 'available' && handleModelSelect(model.id)}
          >
            <div className="model-card-header">
              <span className="model-name">{model.name}</span>
              {getModelBadge(model)}
            </div>
            <div className="model-capabilities">
              {model.capabilities.map((cap, idx) => (
                <span key={idx} className="capability-tag">{cap}</span>
              ))}
            </div>
            {(model.legalScore || model.lnatScore || model.watsonGlaserScore) && (
              <div className="legal-assessment">
                {model.legalScore && (
                  <div className="legal-score">
                    <span className="score-label">LegalBench:</span>
                    <span className="score-value">{model.legalScore.overall.toFixed(1)}/100</span>
                    <span className="risk-indicator">{getRiskIcon(model.riskLevel)}</span>
                  </div>
                )}
                {model.lnatScore && (
                  <div className="lnat-score">
                    <span className="score-label">LNAT:</span>
                    <span className="score-value">{model.lnatScore.overall.toFixed(1)}/100</span>
                    <span className="lnat-grade">({model.lnatScore.grade})</span>
                  </div>
                )}
                {model.watsonGlaserScore && (
                  <div className="watson-glaser-score">
                    <span className="score-label">Watson-Glaser:</span>
                    <span className="score-value">{model.watsonGlaserScore.overall}/40</span>
                    <span className="watson-grade">({model.watsonGlaserScore.grade})</span>
                  </div>
                )}
                {model.legalTasks && model.legalTasks.length > 0 && (
                  <div className="legal-tasks">
                    <span className="tasks-label">Best for:</span>
                    <span className="tasks-value">{model.legalTasks.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
            )}
            {selectedModel === model.id && (
              <div className="model-selected-indicator">
                <span>✓ Active</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="model-info">
        <p className="info-text">
          {autoSelect ? (
            <>🤖 Auto-selection is enabled. The best model will be chosen based on your {actualCaseType} case type.</>
          ) : (
            <>🎯 Manual selection mode. You have full control over model choice.</>
          )}
        </p>
        {caseType && (
          <div className="case-type-recommendations">
            <h5>Recommended for {actualCaseType} cases:</h5>
            <div className="recommendations">
              {LegalBenchEvaluator.getRecommendationsForCaseType(actualCaseType).slice(0, 3).map((modelId, idx) => {
                const model = models.find(m => m.id === modelId);
                const capabilities = LEGAL_MODEL_BENCHMARKS[modelId];
                return (
                  <div key={modelId} className="recommendation-item">
                    <span className="rank">#{idx + 1}</span>
                    <span className="model-name">{capabilities?.modelName || modelId}</span>
                    <span className="score">{capabilities?.legalBenchScore.overall.toFixed(1)}/100</span>
                    {model?.status === 'available' && <span className="available-badge">Available</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};