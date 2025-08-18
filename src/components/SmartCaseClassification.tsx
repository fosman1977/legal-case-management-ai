/**
 * Smart Case Classification System
 * AI-powered case type detection with English legal practice specificity
 */

import React, { useState, useEffect } from 'react';
import './SmartCaseClassification.css';

interface ClassificationResult {
  primaryType: 'criminal' | 'civil' | 'poca' | 'mixed';
  confidence: number;
  subCategories: string[];
  reasoning: string[];
  suggestedFeatures: string[];
  relatedProceedings: string[];
  riskFactors: string[];
  estimatedComplexity: 'low' | 'medium' | 'high' | 'very_high';
  estimatedDuration: string;
  fundingOptions: string[];
}

interface LegalCategory {
  id: string;
  name: string;
  description: string;
  practiceArea: 'criminal' | 'civil' | 'poca' | 'mixed';
  complexity: 'low' | 'medium' | 'high';
  commonWith: string[];
  features: string[];
}

interface SmartCaseClassificationProps {
  caseName: string;
  initialDocuments?: File[];
  onClassificationComplete: (result: ClassificationResult) => void;
  onClose?: () => void;
}

export const SmartCaseClassification: React.FC<SmartCaseClassificationProps> = ({
  caseName,
  initialDocuments = [],
  onClassificationComplete,
  onClose
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [selectedPrimaryType, setSelectedPrimaryType] = useState<'criminal' | 'civil' | 'poca' | 'mixed' | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedRelated, setSelectedRelated] = useState<Set<string>>(new Set());
  const [manualOverride, setManualOverride] = useState(false);

  const legalCategories: LegalCategory[] = [
    // Criminal Categories
    {
      id: 'fraud-financial',
      name: 'Fraud/Financial Crime',
      description: 'Dishonesty offences, false representation, financial deception',
      practiceArea: 'criminal',
      complexity: 'high',
      commonWith: ['money-laundering', 'confiscation'],
      features: ['SFO referral risk', 'Complex disclosure', 'Expert witnesses']
    },
    {
      id: 'money-laundering',
      name: 'Money Laundering',
      description: 'POCA s327-329 offences, suspicious transactions',
      practiceArea: 'criminal',
      complexity: 'high',
      commonWith: ['fraud-financial', 'confiscation'],
      features: ['SAR analysis', 'Banking evidence', 'Lifestyle evidence']
    },
    {
      id: 'drugs-supply',
      name: 'Drug Supply/Trafficking',
      description: 'Controlled drugs offences, supply chains, importation',
      practiceArea: 'criminal',
      complexity: 'high',
      commonWith: ['confiscation', 'conspiracy'],
      features: ['Phone evidence', 'Surveillance', 'Conspiracy analysis']
    },
    {
      id: 'violence-serious',
      name: 'Serious Violence/GBH',
      description: 'Section 18/20 offences, serious assault, weapons',
      practiceArea: 'criminal',
      complexity: 'medium',
      commonWith: ['self-defense', 'psychiatric'],
      features: ['Medical evidence', 'CCTV analysis', 'Self-defence']
    },
    {
      id: 'sexual-offences',
      name: 'Sexual Offences',
      description: 'Sexual assault, rape, historic allegations',
      practiceArea: 'criminal',
      complexity: 'high',
      commonWith: ['vulnerable-witness', 'historic'],
      features: ['Special measures', 'ABE interviews', 'Character evidence']
    },
    {
      id: 'regulatory-enforcement',
      name: 'Regulatory Enforcement',
      description: 'Health & safety, environmental, trading standards',
      practiceArea: 'criminal',
      complexity: 'medium',
      commonWith: ['corporate-liability', 'regulatory-civil'],
      features: ['Corporate liability', 'Due diligence', 'Regulatory guidance']
    },

    // Civil Categories
    {
      id: 'commercial-contract',
      name: 'Commercial Contract Disputes',
      description: 'Breach of contract, commercial agreements, B2B disputes',
      practiceArea: 'civil',
      complexity: 'medium',
      commonWith: ['costs-litigation', 'part36'],
      features: ['CPR compliance', 'Costs budgeting', 'Part 36 offers']
    },
    {
      id: 'professional-negligence',
      name: 'Professional Negligence',
      description: 'Solicitor negligence, medical negligence, expert liability',
      practiceArea: 'civil',
      complexity: 'high',
      commonWith: ['expert-witnesses', 'limitation'],
      features: ['Expert evidence', 'Limitation issues', 'Causation analysis']
    },
    {
      id: 'property-disputes',
      name: 'Property/Land Disputes',
      description: 'Boundary disputes, easements, possession claims',
      practiceArea: 'civil',
      complexity: 'medium',
      commonWith: ['family-property', 'trusts'],
      features: ['Land registry', 'Survey evidence', 'Adverse possession']
    },
    {
      id: 'employment-tribunal',
      name: 'Employment Disputes',
      description: 'Unfair dismissal, discrimination, whistleblowing',
      practiceArea: 'civil',
      complexity: 'medium',
      commonWith: ['human-rights', 'costs-protection'],
      features: ['ACAS procedures', 'Protected disclosures', 'Discrimination law']
    },
    {
      id: 'personal-injury',
      name: 'Personal Injury',
      description: 'RTA, workplace accidents, clinical negligence',
      practiceArea: 'civil',
      complexity: 'medium',
      commonWith: ['costs-litigation', 'medical-experts'],
      features: ['Portal process', 'Rehabilitation', 'Future loss calculations']
    },
    {
      id: 'insolvency-company',
      name: 'Insolvency/Company Law',
      description: 'Winding up, administration, director disqualification',
      practiceArea: 'civil',
      complexity: 'high',
      commonWith: ['fraud-civil', 'asset-recovery'],
      features: ['Insolvency rules', 'Director duties', 'Asset tracing']
    },

    // POCA/Asset Recovery Categories
    {
      id: 'confiscation-proceedings',
      name: 'Confiscation Proceedings',
      description: 'POCA Part 2, benefit calculations, available amount',
      practiceArea: 'poca',
      complexity: 'high',
      commonWith: ['criminal-lifestyle', 'third-party'],
      features: ['Benefit calculation', 'Available amount', 'Time to pay']
    },
    {
      id: 'restraint-orders',
      name: 'Restraint Orders',
      description: 'Asset freezing, management receivers, variation applications',
      practiceArea: 'poca',
      complexity: 'high',
      commonWith: ['third-party', 'urgent-applications'],
      features: ['Urgent applications', 'Management receivers', 'Living expenses']
    },
    {
      id: 'civil-recovery',
      name: 'Civil Recovery',
      description: 'POCA Part 5, unlawful conduct recovery, settlement',
      practiceArea: 'poca',
      complexity: 'high',
      commonWith: ['asset-tracing', 'property-freezing'],
      features: ['Property freezing orders', 'Interim receiving orders', 'Settlement']
    },
    {
      id: 'unexplained-wealth',
      name: 'Unexplained Wealth Orders',
      description: 'UWO applications, disclosure requirements, enforcement',
      practiceArea: 'poca',
      complexity: 'very_high',
      commonWith: ['asset-tracing', 'offshore'],
      features: ['High-value assets', 'Offshore structures', 'Disclosure obligations']
    },
    {
      id: 'account-freezing',
      name: 'Account Freezing Orders',
      description: 'AFO applications, listed assets, forfeiture proceedings',
      practiceArea: 'poca',
      complexity: 'medium',
      commonWith: ['cash-forfeiture', 'listed-assets'],
      features: ['Listed assets', 'Minimum amount', 'Forfeiture proceedings']
    },
    {
      id: 'cash-forfeiture',
      name: 'Cash Forfeiture',
      description: 'Cash seizure, detention, forfeiture applications',
      practiceArea: 'poca',
      complexity: 'medium',
      commonWith: ['account-freezing', 'criminal-property'],
      features: ['Detention periods', 'Interest of justice', 'Compensation']
    },

    // Mixed/Cross-over Categories
    {
      id: 'regulatory-civil',
      name: 'Regulatory (Civil Recovery)',
      description: 'SRA, FCA, other regulatory civil recovery actions',
      practiceArea: 'mixed',
      complexity: 'high',
      commonWith: ['professional-negligence', 'costs-protection'],
      features: ['Regulatory rules', 'Professional conduct', 'Costs protection']
    },
    {
      id: 'fraud-civil',
      name: 'Civil Fraud',
      description: 'Freezing injunctions, search orders, civil fraud claims',
      practiceArea: 'mixed',
      complexity: 'high',
      commonWith: ['asset-tracing', 'urgent-applications'],
      features: ['Freezing orders', 'Search orders', 'Without notice applications']
    },
    {
      id: 'tax-investigation',
      name: 'Tax Investigations',
      description: 'HMRC investigations, Hansard procedures, prosecution risk',
      practiceArea: 'mixed',
      complexity: 'high',
      commonWith: ['fraud-financial', 'confiscation'],
      features: ['Hansard procedures', 'Disclosure facilities', 'Criminal referral risk']
    }
  ];

  const relatedProceedings = [
    { id: 'family-financial', name: 'Family/Financial Remedy', description: 'Matrimonial assets, divorce proceedings' },
    { id: 'insolvency-bankruptcy', name: 'Insolvency/Bankruptcy', description: 'Corporate or personal insolvency' },
    { id: 'regulatory-disciplinary', name: 'Regulatory/Disciplinary', description: 'Professional body proceedings' },
    { id: 'employment-related', name: 'Employment Related', description: 'Workplace disputes or investigations' },
    { id: 'civil-partnership', name: 'Civil Partnership Disputes', description: 'Property and financial disputes' },
    { id: 'trust-estate', name: 'Trust/Estate Disputes', description: 'Probate and trust matters' },
    { id: 'director-disqualification', name: 'Director Disqualification', description: 'Company director proceedings' }
  ];

  useEffect(() => {
    if (caseName.trim()) {
      performAIClassification();
    }
  }, [caseName, initialDocuments]);

  const performAIClassification = async (): Promise<void> => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = analyzeCase(caseName, initialDocuments);
      setClassificationResult(result);
      setSelectedPrimaryType(result.primaryType);
      setSelectedCategories(new Set(result.subCategories));
      
    } catch (error) {
      console.error('Classification failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeCase = (name: string, documents: File[]): ClassificationResult => {
    const nameLower = name.toLowerCase();
    const documentNames = documents.map(d => d.name.toLowerCase()).join(' ');
    const combinedText = `${nameLower} ${documentNames}`;

    // AI Classification Logic
    let primaryType: 'criminal' | 'civil' | 'poca' | 'mixed' = 'civil';
    let confidence = 0.7;
    let subCategories: string[] = [];
    let reasoning: string[] = [];
    let suggestedFeatures: string[] = [];
    let relatedProceedings: string[] = [];
    let riskFactors: string[] = [];

    // Criminal indicators
    const criminalIndicators = [
      'r v', 'regina v', 'crown v', 'cps v', 'prosecution',
      'fraud', 'theft', 'assault', 'gbh', 'abh', 'drugs', 'possession',
      'sexual', 'rape', 'indecent', 'violence', 'conspiracy',
      'money laundering', 'proceeds', 'criminal', 'offence'
    ];

    // POCA indicators
    const pocaIndicators = [
      'poca', 'confiscation', 'restraint', 'benefit', 'available amount',
      'criminal lifestyle', 'proceeds of crime', 'asset recovery',
      'freezing', 'unexplained wealth', 'uwo', 'cash forfeiture',
      'enforcement receiver', 'management receiver'
    ];

    // Civil indicators
    const civilIndicators = [
      'ltd', 'plc', 'contract', 'breach', 'negligence', 'tort',
      'damages', 'claim', 'claimant', 'defendant', 'commercial',
      'property', 'employment', 'discrimination', 'personal injury'
    ];

    const criminalScore = criminalIndicators.filter(indicator => 
      combinedText.includes(indicator)
    ).length;

    const pocaScore = pocaIndicators.filter(indicator => 
      combinedText.includes(indicator)
    ).length;

    const civilScore = civilIndicators.filter(indicator => 
      combinedText.includes(indicator)
    ).length;

    // Determine primary type
    if (pocaScore > 0) {
      primaryType = 'poca';
      confidence = Math.min(0.85 + (pocaScore * 0.05), 0.98);
      reasoning.push('POCA terminology detected in case name/documents');
      
      if (combinedText.includes('confiscation')) {
        subCategories.push('confiscation-proceedings');
        suggestedFeatures.push('Benefit calculation', 'Criminal lifestyle assessment');
      }
      if (combinedText.includes('restraint')) {
        subCategories.push('restraint-orders');
        suggestedFeatures.push('Asset freezing management', 'Living expenses applications');
      }
      if (combinedText.includes('civil recovery')) {
        subCategories.push('civil-recovery');
        suggestedFeatures.push('Property freezing orders', 'Settlement negotiations');
      }
      
    } else if (criminalScore > civilScore) {
      primaryType = 'criminal';
      confidence = Math.min(0.75 + (criminalScore * 0.05), 0.95);
      reasoning.push('Criminal case nomenclature detected (R v format)');
      
      if (combinedText.includes('fraud')) {
        subCategories.push('fraud-financial');
        relatedProceedings.push('tax-investigation');
        riskFactors.push('SFO referral risk', 'Complex disclosure requirements');
      }
      if (combinedText.includes('drugs')) {
        subCategories.push('drugs-supply');
        relatedProceedings.push('confiscation-proceedings');
        suggestedFeatures.push('Phone evidence analysis', 'Lifestyle evidence');
      }
      if (combinedText.includes('violence') || combinedText.includes('gbh')) {
        subCategories.push('violence-serious');
        suggestedFeatures.push('Medical evidence', 'Self-defence analysis');
      }
      
    } else {
      primaryType = 'civil';
      confidence = Math.min(0.70 + (civilScore * 0.04), 0.90);
      reasoning.push('Civil case characteristics identified');
      
      if (combinedText.includes('contract') || combinedText.includes('breach')) {
        subCategories.push('commercial-contract');
        suggestedFeatures.push('CPR compliance', 'Part 36 strategy');
      }
      if (combinedText.includes('negligence')) {
        subCategories.push('professional-negligence');
        suggestedFeatures.push('Expert evidence', 'Limitation analysis');
      }
      if (combinedText.includes('employment')) {
        subCategories.push('employment-tribunal');
        suggestedFeatures.push('ACAS procedures', 'Discrimination law');
      }
    }

    // Mixed case detection
    if (criminalScore > 0 && (pocaScore > 0 || civilScore > 0)) {
      if (primaryType !== 'poca') {
        primaryType = 'mixed';
        reasoning.push('Multiple practice area indicators detected');
        confidence = Math.min(confidence + 0.1, 0.95);
      }
    }

    // Default categories if none detected
    if (subCategories.length === 0) {
      switch (primaryType) {
        case 'criminal':
          subCategories.push('fraud-financial');
          break;
        case 'civil':
          subCategories.push('commercial-contract');
          break;
        case 'poca':
          subCategories.push('confiscation-proceedings');
          break;
        case 'mixed':
          subCategories.push('fraud-financial', 'confiscation-proceedings');
          break;
      }
    }

    // Complexity and duration estimation
    let estimatedComplexity: 'low' | 'medium' | 'high' | 'very_high' = 'medium';
    let estimatedDuration = '6-12 months';
    let fundingOptions: string[] = [];

    if (primaryType === 'poca' || subCategories.includes('unexplained-wealth')) {
      estimatedComplexity = 'very_high';
      estimatedDuration = '18-36 months';
      fundingOptions.push('Legal aid (interests of justice)', 'Private funding', 'ATE insurance');
    } else if (primaryType === 'criminal') {
      estimatedComplexity = 'high';
      estimatedDuration = '12-18 months';
      fundingOptions.push('Legal aid', 'Private funding');
    } else {
      estimatedComplexity = 'medium';
      estimatedDuration = '6-12 months';
      fundingOptions.push('CFA/ATE', 'Private funding', 'LEI/BTE');
    }

    return {
      primaryType,
      confidence,
      subCategories,
      reasoning,
      suggestedFeatures,
      relatedProceedings,
      riskFactors,
      estimatedComplexity,
      estimatedDuration,
      fundingOptions
    };
  };

  const handleCategoryToggle = (categoryId: string): void => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const handleRelatedToggle = (relatedId: string): void => {
    const newSelected = new Set(selectedRelated);
    if (newSelected.has(relatedId)) {
      newSelected.delete(relatedId);
    } else {
      newSelected.add(relatedId);
    }
    setSelectedRelated(newSelected);
  };

  const handleComplete = (): void => {
    if (!classificationResult) return;

    const finalResult: ClassificationResult = {
      ...classificationResult,
      primaryType: selectedPrimaryType || classificationResult.primaryType,
      subCategories: Array.from(selectedCategories),
      relatedProceedings: Array.from(selectedRelated)
    };

    onClassificationComplete(finalResult);
  };

  const getFilteredCategories = (): LegalCategory[] => {
    if (!selectedPrimaryType) return legalCategories;
    
    return legalCategories.filter(cat => 
      cat.practiceArea === selectedPrimaryType || 
      cat.practiceArea === 'mixed' ||
      selectedPrimaryType === 'mixed'
    );
  };

  const renderConfidenceBar = (confidence: number): JSX.Element => (
    <div className="confidence-display">
      <div className="confidence-label">AI Confidence:</div>
      <div className="confidence-bar">
        <div 
          className="confidence-fill" 
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <div className="confidence-percentage">{Math.round(confidence * 100)}%</div>
    </div>
  );

  return (
    <div className="smart-classification-container">
      <div className="classification-header">
        <h2>🤖 Smart Case Classification</h2>
        {onClose && (
          <button onClick={onClose} className="close-btn">✕</button>
        )}
      </div>

      <div className="case-input-section">
        <label>Case Name:</label>
        <div className="case-name-display">{caseName}</div>
      </div>

      {isAnalyzing ? (
        <div className="analyzing-state">
          <div className="ai-analyzing">
            <div className="analysis-icon">🧠</div>
            <h3>AI Analysis in Progress</h3>
            <div className="analysis-steps">
              <div className="step">🔍 Analyzing case name patterns...</div>
              <div className="step">📄 Processing document indicators...</div>
              <div className="step">⚖️ Applying English legal categorization...</div>
              <div className="step">🎯 Generating recommendations...</div>
            </div>
          </div>
        </div>
      ) : classificationResult ? (
        <div className="classification-results">
          <div className="ai-detection-result">
            <div className="detection-header">
              <span className="detection-icon">🎯</span>
              <span className="detection-text">
                AI Classification: {classificationResult.primaryType.toUpperCase()}
              </span>
            </div>
            {renderConfidenceBar(classificationResult.confidence)}
            
            {classificationResult.reasoning.length > 0 && (
              <div className="reasoning-section">
                <h4>💡 Analysis Reasoning:</h4>
                <ul>
                  {classificationResult.reasoning.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="manual-override-section">
            <label className="override-checkbox">
              <input
                type="checkbox"
                checked={manualOverride}
                onChange={(e) => setManualOverride(e.target.checked)}
              />
              Manual override (adjust AI classification)
            </label>
          </div>

          <div className="practice-area-selection">
            <h3>⚖️ Primary Practice Area:</h3>
            <div className="practice-buttons">
              {(['criminal', 'civil', 'poca', 'mixed'] as const).map(type => (
                <button
                  key={type}
                  className={`practice-btn ${selectedPrimaryType === type ? 'active' : ''} ${!manualOverride && classificationResult.primaryType !== type ? 'ai-suggestion' : ''}`}
                  onClick={() => manualOverride && setSelectedPrimaryType(type)}
                  disabled={!manualOverride}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  {!manualOverride && classificationResult.primaryType === type && (
                    <span className="ai-badge">AI</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="category-selection">
            <h3>📋 Specific Categories:</h3>
            <div className="category-grid">
              {getFilteredCategories().map(category => (
                <label key={category.id} className="category-item">
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                  />
                  <div className="category-content">
                    <div className="category-name">{category.name}</div>
                    <div className="category-description">{category.description}</div>
                    {category.features.length > 0 && (
                      <div className="category-features">
                        Features: {category.features.join(', ')}
                      </div>
                    )}
                  </div>
                  {classificationResult.subCategories.includes(category.id) && (
                    <span className="ai-recommended">AI ✓</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {relatedProceedings.length > 0 && (
            <div className="related-proceedings">
              <h3>🔗 Related Proceedings:</h3>
              <div className="related-grid">
                {relatedProceedings.map(related => (
                  <label key={related.id} className="related-item">
                    <input
                      type="checkbox"
                      checked={selectedRelated.has(related.id)}
                      onChange={() => handleRelatedToggle(related.id)}
                    />
                    <div className="related-content">
                      <div className="related-name">{related.name}</div>
                      <div className="related-description">{related.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="features-activated">
            <h3>💡 Features Activated:</h3>
            <div className="feature-grid">
              {classificationResult.suggestedFeatures.map((feature, index) => (
                <div key={index} className="feature-item">
                  ✓ {feature}
                </div>
              ))}
              {classificationResult.fundingOptions.length > 0 && (
                <div className="feature-item">
                  💰 Funding: {classificationResult.fundingOptions.join(', ')}
                </div>
              )}
              <div className="feature-item">
                ⏱️ Est. Duration: {classificationResult.estimatedDuration}
              </div>
              <div className="feature-item">
                📊 Complexity: {classificationResult.estimatedComplexity.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>

          {classificationResult.riskFactors.length > 0 && (
            <div className="risk-factors">
              <h3>⚠️ Risk Factors Identified:</h3>
              <div className="risk-list">
                {classificationResult.riskFactors.map((risk, index) => (
                  <div key={index} className="risk-item">
                    🔺 {risk}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="classification-actions">
            <button onClick={handleComplete} className="btn btn-primary">
              📁 Create Case with Classification
            </button>
            <button onClick={performAIClassification} className="btn btn-secondary">
              🔄 Re-analyze
            </button>
            {onClose && (
              <button onClick={onClose} className="btn btn-tertiary">
                ❌ Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="no-analysis">
          <p>Enter a case name to begin AI classification</p>
        </div>
      )}
    </div>
  );
};

export default SmartCaseClassification;