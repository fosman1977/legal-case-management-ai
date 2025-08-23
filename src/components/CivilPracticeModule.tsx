/**
 * Civil Practice Module
 * Specialized workflows and intelligence for civil and commercial law practice
 */

import React, { useState, useEffect } from 'react';

interface CivilClaim {
  id: string;
  type: 'contract' | 'tort' | 'property' | 'commercial' | 'professional_negligence' | 'personal_injury' | 'debt_recovery';
  title: string;
  value: number;
  track: 'small_claims' | 'fast_track' | 'multi_track';
  elements: string[];
  defences: string[];
  remedies: CivilRemedy[];
  jurisdiction: 'county_court' | 'high_court' | 'commercial_court' | 'technology_court';
  limitationPeriod: string;
  keyPrecedents: string[];
}

interface CivilRemedy {
  id: string;
  type: 'damages' | 'injunction' | 'specific_performance' | 'rectification' | 'rescission' | 'declaration';
  description: string;
  availability: 'primary' | 'alternative' | 'discretionary';
  requirements: string[];
  quantification?: {
    method: 'expectation' | 'reliance' | 'restitution' | 'account_of_profits';
    factors: string[];
    precedents: string[];
  };
}

interface CommercialIntelligence {
  id: string;
  category: 'market_analysis' | 'industry_standards' | 'contract_precedents' | 'valuation_methods' | 'expert_witnesses';
  title: string;
  description: string;
  relevance: number; // 0-1
  sources: string[];
  lastUpdated: Date;
  insights: string[];
}

interface CivilProcedure {
  id: string;
  stage: 'pre_action' | 'issue_proceedings' | 'statements_of_case' | 'case_management' | 'disclosure' | 'witness_evidence' | 'expert_evidence' | 'trial' | 'judgment' | 'enforcement';
  title: string;
  description: string;
  cprReferences: string[];
  timeframes: string[];
  requirements: string[];
  costs: {
    courtFees?: number;
    estimatedCosts?: number;
    riskFactors?: string[];
  };
  strategicConsiderations: string[];
}

interface Part36Offer {
  id: string;
  type: 'claimant' | 'defendant';
  amount: number;
  terms: string[];
  relevantPeriod: number; // days
  consequences: {
    acceptance: string[];
    rejection: string[];
    betterAtTrial: string[];
    worseAtTrial: string[];
  };
  strategicValue: number; // 0-1
}

interface CostsAnalysis {
  id: string;
  stage: string;
  estimated: {
    solicitorCosts: number;
    counselFees: number;
    courtFees: number;
    expertFees: number;
    other: number;
  };
  budget: {
    agreed?: number;
    incurred: number;
    estimated: number;
  };
  riskFactors: string[];
  mitigationStrategies: string[];
}

interface CivilPracticeModuleProps {
  caseId: string;
  caseData: {
    claims: CivilClaim[];
    claimValue: number;
    caseType: string;
    casePhase: string;
    parties: any[];
    jurisdiction: string;
  };
  onStrategyUpdate?: (strategy: any) => void;
  onProcedureComplete?: (procedure: CivilProcedure) => void;
}

export const CivilPracticeModule: React.FC<CivilPracticeModuleProps> = ({
  caseId,
  caseData,
  onStrategyUpdate,
  onProcedureComplete
}) => {
  const [claims, setClaims] = useState<CivilClaim[]>([]);
  const [procedures, setProcedures] = useState<CivilProcedure[]>([]);
  const [commercialIntel, setCommercialIntel] = useState<CommercialIntelligence[]>([]);
  const [part36Offers, setPart36Offers] = useState<Part36Offer[]>([]);
  const [costsAnalysis, setCostsAnalysis] = useState<CostsAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'claims' | 'procedure' | 'commercial' | 'part36' | 'costs'>('overview');
  const [selectedClaim, setSelectedClaim] = useState<CivilClaim | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    initializeCivilModule();
  }, [caseId, caseData]);

  const initializeCivilModule = async (): Promise<void> => {
    setIsAnalyzing(true);
    
    try {
      // Simulate civil case analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analyzedClaims = analyzeClaims(caseData.claims || []);
      const relevantProcedures = getCivilProcedures(caseData.casePhase);
      const commercialData = getCommercialIntelligence(caseData.caseType);
      const offerAnalysis = analyzePart36Opportunities(analyzedClaims);
      const costsData = generateCostsAnalysis(caseData.claimValue, caseData.casePhase);
      
      setClaims(analyzedClaims);
      setProcedures(relevantProcedures);
      setCommercialIntel(commercialData);
      setPart36Offers(offerAnalysis);
      setCostsAnalysis(costsData);
      
    } catch (error) {
      console.error('Civil module initialization failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeClaims = (claimData: any[]): CivilClaim[] => {
    const sampleClaims: CivilClaim[] = [
      {
        id: 'claim_breach_contract',
        type: 'contract',
        title: 'Breach of Commercial Supply Agreement',
        value: 250000,
        track: 'multi_track',
        elements: [
          'Existence of valid contract',
          'Breach of contractual terms',
          'Causation of loss',
          'Quantifiable damage'
        ],
        defences: [
          'No valid contract formed',
          'Performance in accordance with terms',
          'Frustration of contract',
          'Set-off and counterclaim',
          'Limitation defence'
        ],
        remedies: [
          {
            id: 'damages_expectation',
            type: 'damages',
            description: 'Expectation damages for lost profits and wasted costs',
            availability: 'primary',
            requirements: [
              'Proof of financial loss',
              'Causation established',
              'Loss not too remote',
              'Mitigation of loss'
            ],
            quantification: {
              method: 'expectation',
              factors: ['Lost profits', 'Wasted expenditure', 'Alternative arrangements costs'],
              precedents: ['Robinson v Harman (1848)', 'Hadley v Baxendale (1854)']
            }
          },
          {
            id: 'injunction_performance',
            type: 'injunction',
            description: 'Mandatory injunction requiring performance',
            availability: 'discretionary',
            requirements: [
              'Damages inadequate remedy',
              'Balance of convenience favours claimant',
              'No delay in seeking relief'
            ]
          }
        ],
        jurisdiction: 'commercial_court',
        limitationPeriod: '6 years from breach',
        keyPrecedents: [
          'Hadley v Baxendale (1854) - remoteness of damage',
          'Victoria Laundry v Newman [1949] - consequential loss',
          'Transfield Shipping v Mercator [2008] - mitigation'
        ]
      },
      {
        id: 'claim_professional_negligence',
        type: 'professional_negligence',
        title: 'Professional Negligence Against Solicitors',
        value: 150000,
        track: 'multi_track',
        elements: [
          'Duty of care owed',
          'Breach of duty (falling below reasonable standard)',
          'Causation (factual and legal)',
          'Quantifiable loss'
        ],
        defences: [
          'No duty of care',
          'Standard of care met',
          'No causation',
          'Loss would have occurred anyway',
          'Contributory negligence'
        ],
        remedies: [
          {
            id: 'damages_negligence',
            type: 'damages',
            description: 'Damages for financial loss caused by negligent advice',
            availability: 'primary',
            requirements: [
              'Proof of negligent act/omission',
              'Factual and legal causation',
              'Loss within scope of duty',
              'No intervening cause'
            ],
            quantification: {
              method: 'expectation',
              factors: ['Loss of opportunity', 'Additional costs incurred', 'Lost investment returns'],
              precedents: ['Bolam v Friern Hospital [1957]', 'South Australia Asset Management v York Montague [1997]']
            }
          }
        ],
        jurisdiction: 'high_court',
        limitationPeriod: '6 years from breach or 3 years from knowledge',
        keyPrecedents: [
          'Bolam v Friern Hospital [1957] - standard of care',
          'SAAMCO v York Montague [1997] - scope of duty',
          'Perry v Raleys [2019] - burden of proof'
        ]
      }
    ];
    
    return sampleClaims;
  };

  const getCivilProcedures = (casePhase: string): CivilProcedure[] => {
    const allProcedures: CivilProcedure[] = [
      {
        id: 'procedure_pre_action',
        stage: 'pre_action',
        title: 'Pre-Action Protocol Compliance',
        description: 'Follow relevant pre-action protocol to encourage settlement and narrow issues',
        cprReferences: ['Pre-Action Protocol for Construction and Engineering Disputes', 'Practice Direction - Pre-Action Conduct'],
        timeframes: [
          'Letter of claim: reasonable period for response',
          'Response: within reasonable time (usually 3 months)',
          'Stocktake: 3 months from response'
        ],
        requirements: [
          'Letter of claim with sufficient detail',
          'Reasonable opportunity to respond',
          'Exchange of key documents',
          'Consider ADR and settlement'
        ],
        costs: {
          courtFees: 0,
          estimatedCosts: 15000,
          riskFactors: ['Failure to comply may result in costs sanctions']
        },
        strategicConsiderations: [
          'Early settlement opportunities',
          'Costs protection benefits',
          'Evidence preservation',
          'Expert evidence planning'
        ]
      },
      {
        id: 'procedure_case_management',
        stage: 'case_management',
        title: 'Case Management Conference',
        description: 'Court directions for case management and trial preparation',
        cprReferences: ['CPR Part 29', 'CPR Part 26'],
        timeframes: [
          'Allocation questionnaire: within time specified',
          'Case management conference: as directed',
          'Trial window: to be set by court'
        ],
        requirements: [
          'Completed allocation questionnaire',
          'Agreed or disputed directions',
          'Costs budget (multi-track)',
          'Trial time estimate'
        ],
        costs: {
          courtFees: 770, // Multi-track case management fee
          estimatedCosts: 25000,
          riskFactors: ['Costs budget approval', 'Failure to comply with directions']
        },
        strategicConsiderations: [
          'Disclosure scope and format',
          'Expert evidence requirements',
          'Trial preparation timeline',
          'Settlement opportunities'
        ]
      },
      {
        id: 'procedure_disclosure',
        stage: 'disclosure',
        title: 'Standard Disclosure',
        description: 'Exchange of documents that support or adversely affect each party\'s case',
        cprReferences: ['CPR Part 31', 'Practice Direction 31A'],
        timeframes: [
          'Standard disclosure: 4 weeks from case management order',
          'Inspection: 7 days after disclosure',
          'Specific disclosure applications: as needed'
        ],
        requirements: [
          'Reasonable and proportionate search',
          'List of documents in prescribed form',
          'Disclosure statement with statement of truth',
          'Privilege claims properly made'
        ],
        costs: {
          estimatedCosts: 35000,
          riskFactors: ['Electronic disclosure costs', 'Privilege disputes', 'Specific disclosure applications']
        },
        strategicConsiderations: [
          'Document preservation obligations',
          'Privilege and confidentiality',
          'Electronic disclosure strategy',
          'Specific disclosure tactics'
        ]
      }
    ];
    
    return allProcedures.filter(p => 
      p.stage === casePhase || 
      ['pre_action', 'case_management'].includes(p.stage)
    );
  };

  const getCommercialIntelligence = (caseType: string): CommercialIntelligence[] => {
    const intelligence: CommercialIntelligence[] = [
      {
        id: 'intel_contract_trends',
        category: 'contract_precedents',
        title: 'Commercial Contract Interpretation Trends',
        description: 'Recent judicial approaches to commercial contract interpretation and implied terms',
        relevance: 0.9,
        sources: ['Court of Appeal judgments 2023', 'Commercial Court decisions', 'Legal commentary'],
        lastUpdated: new Date('2023-10-01'),
        insights: [
          'Courts increasingly favor commercial common sense over literal interpretation',
          'Implied terms threshold remains high following Marks & Spencer',
          'Force majeure clauses receiving stricter construction post-COVID'
        ]
      },
      {
        id: 'intel_damages_quantum',
        category: 'valuation_methods',
        title: 'Damages Quantification in Commercial Disputes',
        description: 'Current approaches to quantifying commercial losses and lost profits',
        relevance: 0.85,
        sources: ['Expert witness reports', 'Quantum specialist decisions', 'Forensic accounting studies'],
        lastUpdated: new Date('2023-09-15'),
        insights: [
          'Courts applying stricter scrutiny to lost profits claims',
          'DCF methodology preferred for long-term contract losses',
          'Mitigation obligations actively enforced in commercial context'
        ]
      },
      {
        id: 'intel_expert_witnesses',
        category: 'expert_witnesses',
        title: 'Leading Commercial Expert Witnesses',
        description: 'Database of specialist experts for commercial and professional negligence claims',
        relevance: 0.75,
        sources: ['Expert directories', 'Recent case involvement', 'Peer recommendations'],
        lastUpdated: new Date('2023-10-10'),
        insights: [
          'Quantum experts with Big 4 background preferred for large claims',
          'Industry-specific experts crucial for technical contract disputes',
          'Joint expert appointments increasingly common in appropriate cases'
        ]
      }
    ];
    
    return intelligence;
  };

  const analyzePart36Opportunities = (claims: CivilClaim[]): Part36Offer[] => {
    const offers: Part36Offer[] = [
      {
        id: 'offer_strategic_early',
        type: 'defendant',
        amount: 180000,
        terms: [
          'Payment within 14 days of acceptance',
          'Each party to bear own costs to date',
          'No admission of liability'
        ],
        relevantPeriod: 21,
        consequences: {
          acceptance: [
            'Case concluded without admission',
            'Costs protection for both parties',
            'No risk of adverse costs order'
          ],
          rejection: [
            'Claimant at risk of costs if fails to beat offer at trial',
            'Enhanced interest and costs consequences',
            'Defendant protected from some costs exposure'
          ],
          betterAtTrial: [
            'Claimant entitled to enhanced interest',
            'Claimant entitled to indemnity costs from end of relevant period',
            'Additional amount up to 10% of damages awarded'
          ],
          worseAtTrial: [
            'Claimant pays defendant\'s costs from end of relevant period',
            'Forfeits interest on damages',
            'May face indemnity costs order'
          ]
        },
        strategicValue: 0.8
      }
    ];
    
    return offers;
  };

  const generateCostsAnalysis = (claimValue: number, casePhase: string): CostsAnalysis => {
    const baseMultiplier = claimValue > 200000 ? 0.15 : claimValue > 100000 ? 0.20 : 0.25;
    
    return {
      id: 'costs_analysis_main',
      stage: casePhase,
      estimated: {
        solicitorCosts: claimValue * baseMultiplier * 0.6,
        counselFees: claimValue * baseMultiplier * 0.25,
        courtFees: claimValue > 200000 ? 10000 : claimValue > 100000 ? 5000 : 2500,
        expertFees: claimValue * baseMultiplier * 0.10,
        other: claimValue * baseMultiplier * 0.05
      },
      budget: {
        incurred: claimValue * baseMultiplier * 0.3,
        estimated: claimValue * baseMultiplier * 0.7
      },
      riskFactors: [
        'Complex disclosure may increase costs significantly',
        'Multiple experts required for technical issues',
        'Potential for interlocutory applications',
        'Part 36 offer consequences on costs'
      ],
      mitigationStrategies: [
        'Early case management and planning',
        'Proportionate disclosure strategy',
        'Consider single joint experts where appropriate',
        'Strategic use of Part 36 offers'
      ]
    };
  };

  const renderClaimsAnalysis = (): JSX.Element => (
    <div className="claims-analysis">
      <h3>📋 Claims Analysis</h3>
      <div className="claims-grid">
        {claims.map(claim => (
          <div 
            key={claim.id} 
            className={`claim-card ${claim.type} ${claim.track}`}
            onClick={() => setSelectedClaim(claim)}
          >
            <div className="claim-header">
              <h4>{claim.title}</h4>
              <div className="claim-badges">
                <span className={`claim-track ${claim.track}`}>
                  {claim.track.replace('_', ' ')}
                </span>
                <span className="claim-value">
                  £{claim.value.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="claim-type">
              {claim.type.replace('_', ' ')} • {claim.jurisdiction.replace('_', ' ')}
            </div>
            
            <div className="limitation-period">
              <strong>Limitation:</strong> {claim.limitationPeriod}
            </div>
            
            <div className="claim-elements">
              <h5>Key Elements ({claim.elements.length}):</h5>
              <ul>
                {claim.elements.slice(0, 2).map(element => (
                  <li key={element}>{element}</li>
                ))}
                {claim.elements.length > 2 && (
                  <li>+{claim.elements.length - 2} more...</li>
                )}
              </ul>
            </div>
            
            <div className="remedies-preview">
              <h5>Available Remedies:</h5>
              <div className="remedy-tags">
                {claim.remedies.slice(0, 2).map(remedy => (
                  <span key={remedy.id} className={`remedy-tag ${remedy.type}`}>
                    {remedy.type}
                  </span>
                ))}
                {claim.remedies.length > 2 && (
                  <span className="remedy-tag more">+{claim.remedies.length - 2}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedClaim && (
        <div className="claim-detail-modal">
          <div className="claim-detail">
            <h4>{selectedClaim.title}</h4>
            <button 
              className="close-btn" 
              onClick={() => setSelectedClaim(null)}
            >
              ×
            </button>
            
            <div className="claim-detail-tabs">
              <div className="detail-section">
                <h5>Elements to Prove:</h5>
                <ul>
                  {selectedClaim.elements.map(element => (
                    <li key={element}>{element}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-section">
                <h5>Potential Defences:</h5>
                <ul>
                  {selectedClaim.defences.map(defence => (
                    <li key={defence}>{defence}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-section">
                <h5>Available Remedies:</h5>
                {selectedClaim.remedies.map(remedy => (
                  <div key={remedy.id} className="remedy-detail">
                    <h6>{remedy.type} ({remedy.availability})</h6>
                    <p>{remedy.description}</p>
                    <div className="remedy-requirements">
                      <strong>Requirements:</strong>
                      <ul>
                        {remedy.requirements.map(req => (
                          <li key={req}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="detail-section">
                <h5>Key Precedents:</h5>
                <ul>
                  {selectedClaim.keyPrecedents.map(precedent => (
                    <li key={precedent}>{precedent}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProcedureManager = (): JSX.Element => (
    <div className="procedure-manager">
      <h3>📋 Civil Procedure</h3>
      <div className="procedures-list">
        {procedures.map(procedure => (
          <div key={procedure.id} className={`procedure-card ${procedure.stage}`}>
            <div className="procedure-header">
              <h4>{procedure.title}</h4>
              <span className="procedure-stage">{procedure.stage.replace('_', ' ')}</span>
            </div>
            
            <p className="procedure-description">{procedure.description}</p>
            
            <div className="procedure-details">
              <div className="detail-section">
                <h5>CPR References:</h5>
                <ul>
                  {procedure.cprReferences.map(ref => (
                    <li key={ref}>{ref}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-section">
                <h5>Key Timeframes:</h5>
                <ul>
                  {procedure.timeframes.map(timeframe => (
                    <li key={timeframe} className="timeframe-item">{timeframe}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-section">
                <h5>Requirements:</h5>
                <ul>
                  {procedure.requirements.slice(0, 3).map(req => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-section">
                <h5>Costs Information:</h5>
                <div className="costs-info">
                  {procedure.costs.courtFees && (
                    <div>Court Fees: £{procedure.costs.courtFees.toLocaleString()}</div>
                  )}
                  {procedure.costs.estimatedCosts && (
                    <div>Estimated Costs: £{procedure.costs.estimatedCosts.toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>
            
            <button 
              className="complete-procedure-btn"
              onClick={() => onProcedureComplete?.(procedure)}
            >
              Complete Stage
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCommercialIntelligence = (): JSX.Element => (
    <div className="commercial-intelligence">
      <h3>💼 Commercial Intelligence</h3>
      <div className="intelligence-grid">
        {commercialIntel.map(intel => (
          <div key={intel.id} className={`intelligence-card ${intel.category}`}>
            <div className="intel-header">
              <h4>{intel.title}</h4>
              <div className="intel-metrics">
                <span className="relevance-score">
                  {Math.round(intel.relevance * 100)}% relevant
                </span>
                <span className="last-updated">
                  Updated: {intel.lastUpdated.toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <p className="intel-description">{intel.description}</p>
            
            <div className="intel-sources">
              <h5>Sources:</h5>
              <ul>
                {intel.sources.slice(0, 2).map(source => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </div>
            
            <div className="intel-insights">
              <h5>Key Insights:</h5>
              <ul>
                {intel.insights.map(insight => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPart36Analysis = (): JSX.Element => (
    <div className="part36-analysis">
      <h3>💡 Part 36 Offers</h3>
      <div className="part36-intro">
        <p>Strategic analysis of Part 36 offer opportunities and consequences</p>
      </div>
      
      <div className="offers-list">
        {part36Offers.map(offer => (
          <div key={offer.id} className={`offer-card ${offer.type}`}>
            <div className="offer-header">
              <h4>{offer.type} Offer</h4>
              <div className="offer-amount">
                £{offer.amount.toLocaleString()}
              </div>
            </div>
            
            <div className="offer-terms">
              <h5>Terms:</h5>
              <ul>
                {offer.terms.map(term => (
                  <li key={term}>{term}</li>
                ))}
              </ul>
            </div>
            
            <div className="offer-period">
              <strong>Relevant Period:</strong> {offer.relevantPeriod} days
            </div>
            
            <div className="consequences-grid">
              <div className="consequence-section acceptance">
                <h5>If Accepted:</h5>
                <ul>
                  {offer.consequences.acceptance.map(consequence => (
                    <li key={consequence}>{consequence}</li>
                  ))}
                </ul>
              </div>
              
              <div className="consequence-section rejection">
                <h5>If Rejected:</h5>
                <ul>
                  {offer.consequences.rejection.map(consequence => (
                    <li key={consequence}>{consequence}</li>
                  ))}
                </ul>
              </div>
              
              <div className="consequence-section better">
                <h5>If Claimant Beats Offer:</h5>
                <ul>
                  {offer.consequences.betterAtTrial.map(consequence => (
                    <li key={consequence}>{consequence}</li>
                  ))}
                </ul>
              </div>
              
              <div className="consequence-section worse">
                <h5>If Claimant Fails to Beat Offer:</h5>
                <ul>
                  {offer.consequences.worseAtTrial.map(consequence => (
                    <li key={consequence}>{consequence}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="strategic-value">
              Strategic Value: {Math.round(offer.strategicValue * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCostsAnalysis = (): JSX.Element => (
    <div className="costs-analysis">
      <h3>💰 Costs Analysis</h3>
      {costsAnalysis && (
        <div className="costs-breakdown">
          <div className="costs-summary">
            <h4>Estimated Costs Breakdown</h4>
            <div className="costs-grid">
              <div className="cost-item">
                <span className="cost-label">Solicitor Costs:</span>
                <span className="cost-value">£{costsAnalysis.estimated.solicitorCosts.toLocaleString()}</span>
              </div>
              <div className="cost-item">
                <span className="cost-label">Counsel Fees:</span>
                <span className="cost-value">£{costsAnalysis.estimated.counselFees.toLocaleString()}</span>
              </div>
              <div className="cost-item">
                <span className="cost-label">Court Fees:</span>
                <span className="cost-value">£{costsAnalysis.estimated.courtFees.toLocaleString()}</span>
              </div>
              <div className="cost-item">
                <span className="cost-label">Expert Fees:</span>
                <span className="cost-value">£{costsAnalysis.estimated.expertFees.toLocaleString()}</span>
              </div>
              <div className="cost-item total">
                <span className="cost-label">Total Estimated:</span>
                <span className="cost-value">
                  £{Object.values(costsAnalysis.estimated).reduce((a, b) => a + b, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="costs-budget">
            <h4>Costs Budget</h4>
            <div className="budget-bars">
              <div className="budget-item">
                <span className="budget-label">Incurred:</span>
                <div className="budget-bar">
                  <div 
                    className="budget-fill incurred" 
                    style={{ width: '40%' }}
                  />
                </div>
                <span className="budget-value">£{costsAnalysis.budget.incurred.toLocaleString()}</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Estimated:</span>
                <div className="budget-bar">
                  <div 
                    className="budget-fill estimated" 
                    style={{ width: '60%' }}
                  />
                </div>
                <span className="budget-value">£{costsAnalysis.budget.estimated.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="risk-mitigation">
            <div className="risk-section">
              <h5>Risk Factors:</h5>
              <ul>
                {costsAnalysis.riskFactors.map(risk => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
            
            <div className="mitigation-section">
              <h5>Mitigation Strategies:</h5>
              <ul>
                {costsAnalysis.mitigationStrategies.map(strategy => (
                  <li key={strategy}>{strategy}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="civil-practice-module">
      {isAnalyzing && (
        <div className="analysis-indicator">
          <span className="spinner">💼</span>
          <span>Analyzing civil case...</span>
        </div>
      )}
      
      <div className="module-header">
        <h2>💼 Civil Practice Module</h2>
        <p>Specialized workflows and intelligence for civil and commercial law practice</p>
      </div>
      
      <div className="module-tabs">
        {([
          ['overview', '📊 Overview'],
          ['claims', '📋 Claims'],
          ['procedure', '⚖️ Procedure'],
          ['commercial', '💼 Intelligence'],
          ['part36', '💡 Part 36'],
          ['costs', '💰 Costs']
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            className={`module-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>
      
      <div className="module-content">
        {activeTab === 'overview' && (
          <div className="overview-panel">
            <div className="overview-grid">
              <div className="overview-card">
                <h4>📋 Claims</h4>
                <div className="overview-stat">{claims.length}</div>
                <p>Civil claims and remedies analysis</p>
              </div>
              
              <div className="overview-card">
                <h4>⚖️ Procedures</h4>
                <div className="overview-stat">{procedures.length}</div>
                <p>Active procedural requirements</p>
              </div>
              
              <div className="overview-card">
                <h4>💼 Intelligence</h4>
                <div className="overview-stat">{commercialIntel.length}</div>
                <p>Commercial intelligence insights</p>
              </div>
              
              <div className="overview-card">
                <h4>💰 Estimated Costs</h4>
                <div className="overview-stat">
                  £{costsAnalysis ? 
                    Object.values(costsAnalysis.estimated).reduce((a, b) => a + b, 0).toLocaleString() : 
                    '0'
                  }
                </div>
                <p>Total estimated case costs</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'claims' && renderClaimsAnalysis()}
        {activeTab === 'procedure' && renderProcedureManager()}
        {activeTab === 'commercial' && renderCommercialIntelligence()}
        {activeTab === 'part36' && renderPart36Analysis()}
        {activeTab === 'costs' && renderCostsAnalysis()}
      </div>
    </div>
  );
};

export default CivilPracticeModule;