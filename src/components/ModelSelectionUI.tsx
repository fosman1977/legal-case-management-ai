import React, { useState, useEffect } from 'react';
import { UnifiedAIClient } from '../utils/unifiedAIClient';
// import { intelligentModelRouter } from '../utils/intelligentModelRouter';
import { AIModelMigration } from '../utils/aiModelMigration';
import './ModelSelectionUI.css';

interface ModelInfo {
  id: string;
  name: string;
  recommended: boolean;
  capabilities: string[];
  status: 'available' | 'unavailable' | 'checking';
}

interface ModelSelectionUIProps {
  caseId: string;
  onModelChange?: (model: string) => void;
}

export const ModelSelectionUI: React.FC<ModelSelectionUIProps> = ({ caseId, onModelChange }) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
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
        return {
          id: modelId,
          name: modelId,
          recommended: modelId === bestModel,
          capabilities: modelCapabilities[baseName] || ['General purpose'],
          status: 'available' as const
        };
      });

      // Add common models if not in LocalAI list
      const commonModels = ['gpt-4', 'gpt-3.5-turbo'];
      commonModels.forEach(model => {
        if (!modelInfos.find(m => m.id === model)) {
          modelInfos.push({
            id: model,
            name: model,
            recommended: false,
            capabilities: modelCapabilities[model] || ['General purpose'],
            status: 'unavailable' as const
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
      // Model suggestion based on task - simplified for now
      const suggestion = {
        model: selectedModel || 'gpt-4'
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
    return null;
  };

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
            <>🤖 Auto-selection is enabled. The best model will be chosen based on your task.</>
          ) : (
            <>🎯 Manual selection mode. You have full control over model choice.</>
          )}
        </p>
      </div>
    </div>
  );
};