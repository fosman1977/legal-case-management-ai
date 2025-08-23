/**
 * POCA Module
 * Specialized workflows for Proceeds of Crime Act confiscation proceedings
 */

import React, { useState, useEffect } from 'react';

interface POCABenefit {
  id: string;
  description: string;
  amount: number;
  category: 'general_criminal_conduct' | 'particular_criminal_conduct' | 'lifestyle_assumption';
  evidenceBasis: string[];
  disputed: boolean;
  courtFindings?: {
    accepted: boolean;
    reasonsForDecision: string[];
    adjustments: number;
  };
}

interface POCAAsset {
  id: string;
  type: 'property' | 'cash' | 'bank_account' | 'investment' | 'vehicle' | 'business_interest' | 'other';
  description: string;
  estimatedValue: number;
  ownership: 'sole' | 'joint' | 'beneficial' | 'disputed';
  restraintStatus: 'restrained' | 'unrestrained' | 'exempt';
  realisationPotential: number; // 0-1 scale
  thirdPartyInterests: POCAThirdPartyInterest[];
  valuationEvidence: string[];
}

interface POCAThirdPartyInterest {
  id: string;
  party: string;
  interestType: 'mortgage' | 'charge' | 'beneficial_interest' | 'proprietary_claim' | 'other';
  amount: number;
  priority: number;
  evidence: string[];
  validity: 'valid' | 'disputed' | 'invalid';
}

interface LifestyleAssessment {
  id: string;
  offences: string[];
  timeframe: {
    start: Date;
    end: Date;
  };
  assumptions: {
    propertyObtained: boolean;
    expenditureMetFromCriminalConduct: boolean;
    minimumBenefit: number;
  };
  challenges: string[];
  evidenceRequired: string[];
  prospects: 'strong' | 'reasonable' | 'weak';
}

interface AvailableAmountCalculation {
  id: string;
  totalAssets: number;
  exemptAssets: number;
  thirdPartyInterests: number;
  realisationCosts: number;
  availableAmount: number;
  methodology: string[];
  assumptions: string[];
  sensitivityAnalysis: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
}

interface POCATimeline {
  id: string;
  stage: 'conviction' | 'postponement' | 'timetabling' | 'prosecution_case' | 'defence_case' | 'determination_hearing' | 'confiscation_order' | 'enforcement';
  title: string;
  description: string;
  timeframe: string;
  requirements: string[];
  keyConsiderations: string[];
  precedents: string[];
  riskFactors: string[];
}

interface RealisationStrategy {
  id: string;
  assets: string[];
  method: 'public_auction' | 'private_sale' | 'management_receiver' | 'enforcement_receiver' | 'insolvency';
  estimatedTimeframe: string;
  estimatedCosts: number;
  expectedRecovery: number;
  risks: string[];
  advantages: string[];
}

interface POCAModuleProps {
  caseId: string;
  caseData: {
    convictionDetails: any;
    charges: any[];
    defendantProfile: any;
    casePhase: string;
  };
  onBenefitCalculation?: (benefit: number) => void;
  onAvailableAmountUpdate?: (amount: number) => void;
}

export const POCAModule: React.FC<POCAModuleProps> = ({
  caseId,
  caseData,
  onBenefitCalculation,
  onAvailableAmountUpdate
}) => {
  const [benefits, setBenefits] = useState<POCABenefit[]>([]);
  const [assets, setAssets] = useState<POCAAsset[]>([]);
  const [lifestyleAssessment, setLifestyleAssessment] = useState<LifestyleAssessment | null>(null);
  const [availableAmount, setAvailableAmount] = useState<AvailableAmountCalculation | null>(null);
  const [timeline, setTimeline] = useState<POCATimeline[]>([]);
  const [realisationStrategies, setRealisationStrategies] = useState<RealisationStrategy[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'benefits' | 'assets' | 'lifestyle' | 'available' | 'timeline' | 'realisation'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    initializePOCAModule();
  }, [caseId, caseData]);

  const initializePOCAModule = async (): Promise<void> => {
    setIsAnalyzing(true);
    
    try {
      // Simulate POCA analysis
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const benefitAnalysis = analyzeBenefits(caseData);
      const assetAnalysis = analyzeAssets(caseData);
      const lifestyleAnalysis = assessLifestyle(caseData);
      const availableAnalysis = calculateAvailableAmount(assetAnalysis);
      const pocaTimeline = getPOCATimeline(caseData.casePhase);
      const strategies = generateRealisationStrategies(assetAnalysis);
      
      setBenefits(benefitAnalysis);
      setAssets(assetAnalysis);
      setLifestyleAssessment(lifestyleAnalysis);
      setAvailableAmount(availableAnalysis);
      setTimeline(pocaTimeline);
      setRealisationStrategies(strategies);
      
      // Notify parent components
      const totalBenefit = benefitAnalysis.reduce((sum, b) => sum + b.amount, 0);
      onBenefitCalculation?.(totalBenefit);
      onAvailableAmountUpdate?.(availableAnalysis.availableAmount);
      
    } catch (error) {
      console.error('POCA module initialization failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeBenefits = (caseInfo: any): POCABenefit[] => {
    const sampleBenefits: POCABenefit[] = [
      {
        id: 'benefit_drug_trafficking',
        description: 'Benefit from drug trafficking operations (Class A substances)',
        amount: 450000,
        category: 'particular_criminal_conduct',
        evidenceBasis: [
          'Seizure of 2kg cocaine with street value £200k',
          'Surveillance evidence of drug transactions',
          'Cash seizures totaling £75k',
          'Expert evidence on drug prices and purity'
        ],
        disputed: true,
        courtFindings: {
          accepted: false,
          reasonsForDecision: [
            'Disputed quantity of drugs attributable to defendant',
            'Challenge to expert evidence on street values',
            'Argument for wholesale rather than retail prices'
          ],
          adjustments: -150000
        }
      },
      {
        id: 'benefit_money_laundering',
        description: 'Benefit from money laundering through business accounts',
        amount: 320000,
        category: 'particular_criminal_conduct',
        evidenceBasis: [
          'Bank account analysis showing suspicious transactions',
          'Forensic accounting evidence',
          'Business records showing inflated turnover',
          'Defendant\'s admissions during interview'
        ],
        disputed: false,
        courtFindings: {
          accepted: true,
          reasonsForDecision: [
            'Clear documentary evidence of financial flows',
            'Defendant\'s partial admissions',
            'Expert forensic accounting evidence accepted'
          ],
          adjustments: 0
        }
      },
      {
        id: 'benefit_lifestyle_assumption',
        description: 'Lifestyle assumptions - property and expenditure',
        amount: 180000,
        category: 'lifestyle_assumption',
        evidenceBasis: [
          'Property acquisitions during relevant period',
          'Lifestyle evidence (vehicles, jewelry, holidays)',
          'Bank account analysis showing unexplained credits',
          'Absence of legitimate income explanation'
        ],
        disputed: true,
        courtFindings: {
          accepted: true,
          reasonsForDecision: [
            'Defendant failed to rebut lifestyle assumptions',
            'Clear evidence of property obtained during relevant period',
            'Inadequate explanation for source of funds'
          ],
          adjustments: -50000
        }
      }
    ];
    
    return sampleBenefits;
  };

  const analyzeAssets = (caseInfo: any): POCAAsset[] => {
    const sampleAssets: POCAAsset[] = [
      {
        id: 'asset_main_residence',
        type: 'property',
        description: '123 Oak Avenue, Manchester - 4 bedroom detached house',
        estimatedValue: 485000,
        ownership: 'joint',
        restraintStatus: 'restrained',
        realisationPotential: 0.85,
        thirdPartyInterests: [
          {
            id: 'mortgage_santander',
            party: 'Santander Bank',
            interestType: 'mortgage',
            amount: 220000,
            priority: 1,
            evidence: ['Mortgage deed', 'Payment records', 'Redemption statement'],
            validity: 'valid'
          },
          {
            id: 'spouse_interest',
            party: 'Sarah Johnson (spouse)',
            interestType: 'beneficial_interest',
            amount: 132500, // 50% of equity after mortgage
            priority: 2,
            evidence: ['Joint tenancy deed', 'Financial contributions evidence'],
            validity: 'disputed'
          }
        ],
        valuationEvidence: [
          'RICS valuation dated March 2023',
          'Comparable sales in area',
          'Estate agent market appraisal'
        ]
      },
      {
        id: 'asset_business_interest',
        type: 'business_interest',
        description: 'JD Motors Ltd - 25% shareholding in car dealership',
        estimatedValue: 85000,
        ownership: 'beneficial',
        restraintStatus: 'restrained',
        realisationPotential: 0.6,
        thirdPartyInterests: [
          {
            id: 'other_shareholders',
            party: 'Remaining shareholders',
            interestType: 'proprietary_claim',
            amount: 255000, // 75% of business value
            priority: 1,
            evidence: ['Articles of association', 'Share register', 'Shareholder agreements'],
            validity: 'valid'
          }
        ],
        valuationEvidence: [
          'Accountant\'s valuation report',
          'Company accounts for last 3 years',
          'Industry comparable analysis'
        ]
      },
      {
        id: 'asset_luxury_vehicles',
        type: 'vehicle',
        description: '2022 BMW X5 M Competition',
        estimatedValue: 95000,
        ownership: 'sole',
        restraintStatus: 'restrained',
        realisationPotential: 0.9,
        thirdPartyInterests: [
          {
            id: 'hire_purchase',
            party: 'BMW Financial Services',
            interestType: 'charge',
            amount: 35000,
            priority: 1,
            evidence: ['HP agreement', 'Payment schedule', 'Settlement figure'],
            validity: 'valid'
          }
        ],
        valuationEvidence: [
          'Auto Trader valuation',
          'Dealer trade price guide',
          'Condition assessment report'
        ]
      },
      {
        id: 'asset_offshore_account',
        type: 'bank_account',
        description: 'Cayman Islands bank account - suspected hidden funds',
        estimatedValue: 150000,
        ownership: 'beneficial',
        restraintStatus: 'unrestrained',
        realisationPotential: 0.3,
        thirdPartyInterests: [],
        valuationEvidence: [
          'Partial bank statements',
          'Mutual legal assistance evidence',
          'Financial investigation findings'
        ]
      }
    ];
    
    return sampleAssets;
  };

  const assessLifestyle = (caseInfo: any): LifestyleAssessment => {
    return {
      id: 'lifestyle_assessment_main',
      offences: [
        'Money laundering (POCA s327)',
        'Drug trafficking (MDA s4)',
        'Fraud (Fraud Act s2)'
      ],
      timeframe: {
        start: new Date('2019-01-01'),
        end: new Date('2023-03-15')
      },
      assumptions: {
        propertyObtained: true,
        expenditureMetFromCriminalConduct: true,
        minimumBenefit: 350000
      },
      challenges: [
        'Defendant claims legitimate business income',
        'Spouse\'s financial contributions to joint assets',
        'Timing of property acquisitions relative to offending',
        'Alternative sources of funding claimed'
      ],
      evidenceRequired: [
        'Complete financial history for relevant period',
        'Evidence of all legitimate income sources',
        'Lifestyle evidence (expenditure, acquisitions)',
        'Third party financial contributions evidence'
      ],
      prospects: 'reasonable'
    };
  };

  const calculateAvailableAmount = (assetData: POCAAsset[]): AvailableAmountCalculation => {
    const totalAssetValue = assetData.reduce((sum, asset) => sum + asset.estimatedValue, 0);
    const thirdPartyInterests = assetData.reduce((sum, asset) => 
      sum + asset.thirdPartyInterests.reduce((intSum, interest) => intSum + interest.amount, 0), 0
    );
    const realisationCosts = totalAssetValue * 0.15; // Estimated 15% realisation costs
    const availableAmount = Math.max(0, totalAssetValue - thirdPartyInterests - realisationCosts);
    
    return {
      id: 'available_amount_calc',
      totalAssets: totalAssetValue,
      exemptAssets: 0,
      thirdPartyInterests,
      realisationCosts,
      availableAmount,
      methodology: [
        'Asset valuations based on professional appraisals',
        'Third party interests verified through documentary evidence',
        'Realisation costs estimated at 15% of gross asset value',
        'No exempt assets identified'
      ],
      assumptions: [
        'Asset values remain stable until realisation',
        'Third party interests are valid and enforceable',
        'Standard realisation costs apply',
        'No hidden assets or liabilities discovered'
      ],
      sensitivityAnalysis: {
        optimistic: availableAmount * 1.2,
        realistic: availableAmount,
        pessimistic: availableAmount * 0.7
      }
    };
  };

  const getPOCATimeline = (casePhase: string): POCATimeline[] => {
    const allTimelines: POCATimeline[] = [
      {
        id: 'timeline_timetabling',
        stage: 'timetabling',
        title: 'Timetabling Hearing',
        description: 'Court sets timetable for confiscation proceedings',
        timeframe: 'Within 2 years of conviction (extendable)',
        requirements: [
          'Application for timetabling directions',
          'Estimate of time required for proceedings',
          'Identification of key issues in dispute',
          'Consideration of expert evidence requirements'
        ],
        keyConsiderations: [
          'Time needed for financial investigation',
          'Complexity of asset tracing required',
          'Third party interest investigations',
          'International cooperation requirements'
        ],
        precedents: [
          'R v Waya [2012] UKSC 51 - proportionality',
          'R v Ahmad [2014] UKSC 36 - joint defendants',
          'R v Harvey [2015] UKSC 73 - timetabling extensions'
        ],
        riskFactors: [
          'Failure to meet court deadlines',
          'Inadequate preparation time',
          'Complex third party issues'
        ]
      },
      {
        id: 'timeline_prosecution_case',
        stage: 'prosecution_case',
        title: 'Prosecution Case Preparation',
        description: 'Prosecution serves benefit and available amount evidence',
        timeframe: 'As directed by court (typically 12-18 months)',
        requirements: [
          'Statement of information under s16 POCA',
          'Financial investigation evidence',
          'Asset valuation evidence',
          'Expert evidence on benefit calculation'
        ],
        keyConsiderations: [
          'Sufficiency of financial investigation',
          'Quality of asset valuations',
          'Lifestyle evidence gathering',
          'International cooperation evidence'
        ],
        precedents: [
          'R v Briggs-Price [2009] UKHL 19 - benefit calculation',
          'R v Green [2008] UKHL 30 - criminal lifestyle',
          'R v May [2008] UKHL 28 - available amount'
        ],
        riskFactors: [
          'Incomplete financial investigation',
          'Challenged asset valuations',
          'Missing lifestyle evidence'
        ]
      },
      {
        id: 'timeline_defence_case',
        stage: 'defence_case',
        title: 'Defence Response',
        description: 'Defence challenges prosecution case and presents alternative evidence',
        timeframe: 'As directed by court (typically 3-6 months after prosecution case)',
        requirements: [
          'Response to s16 statement',
          'Challenge to benefit calculation',
          'Challenge to available amount calculation',
          'Third party interest evidence'
        ],
        keyConsiderations: [
          'Strength of challenges to prosecution case',
          'Alternative benefit calculations',
          'Third party interest claims',
          'Hidden asset disclosure obligations'
        ],
        precedents: [
          'R v Jawad [2013] EWCA Crim 644 - hidden assets',
          'R v McDowell [2015] EWCA Crim 173 - third parties',
          'R v Shabir [2008] EWCA Crim 1809 - lifestyle'
        ],
        riskFactors: [
          'Weak challenges to prosecution evidence',
          'Failure to discharge hidden asset obligations',
          'Invalid third party claims'
        ]
      }
    ];
    
    return allTimelines.filter(t => 
      t.stage === casePhase || 
      ['timetabling', 'prosecution_case'].includes(t.stage)
    );
  };

  const generateRealisationStrategies = (assetData: POCAAsset[]): RealisationStrategy[] => {
    const strategies: RealisationStrategy[] = [
      {
        id: 'strategy_property_sale',
        assets: assetData.filter(a => a.type === 'property').map(a => a.id),
        method: 'public_auction',
        estimatedTimeframe: '6-9 months',
        estimatedCosts: 45000,
        expectedRecovery: 420000,
        risks: [
          'Market conditions affecting sale price',
          'Third party interest disputes',
          'Structural issues discovered on survey'
        ],
        advantages: [
          'Transparent public process',
          'Quick completion',
          'Market value achieved'
        ]
      },
      {
        id: 'strategy_business_receiver',
        assets: assetData.filter(a => a.type === 'business_interest').map(a => a.id),
        method: 'management_receiver',
        estimatedTimeframe: '12-18 months',
        estimatedCosts: 25000,
        expectedRecovery: 65000,
        risks: [
          'Business deterioration under receivership',
          'Other shareholders\' opposition',
          'Market conditions affecting valuation'
        ],
        advantages: [
          'Preserve business value',
          'Professional management',
          'Orderly disposal process'
        ]
      }
    ];
    
    return strategies;
  };

  const renderBenefitsAnalysis = (): JSX.Element => (
    <div className="benefits-analysis">
      <h3>💰 Benefit Analysis</h3>
      <div className="benefits-summary">
        <div className="total-benefit">
          <span className="benefit-label">Total Benefit:</span>
          <span className="benefit-amount">
            £{benefits.reduce((sum, b) => sum + (b.courtFindings ? b.amount + b.courtFindings.adjustments : b.amount), 0).toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="benefits-list">
        {benefits.map(benefit => (
          <div key={benefit.id} className={`benefit-card ${benefit.category} ${benefit.disputed ? 'disputed' : ''}`}>
            <div className="benefit-header">
              <h4>{benefit.description}</h4>
              <div className="benefit-badges">
                <span className={`category-badge ${benefit.category}`}>
                  {benefit.category.replace('_', ' ')}
                </span>
                {benefit.disputed && (
                  <span className="disputed-badge">Disputed</span>
                )}
              </div>
            </div>
            
            <div className="benefit-amount-section">
              <div className="original-amount">
                Claimed: £{benefit.amount.toLocaleString()}
              </div>
              {benefit.courtFindings && (
                <div className="court-findings">
                  <div className={`final-amount ${benefit.courtFindings.accepted ? 'accepted' : 'adjusted'}`}>
                    Final: £{(benefit.amount + benefit.courtFindings.adjustments).toLocaleString()}
                  </div>
                  {benefit.courtFindings.adjustments !== 0 && (
                    <div className="adjustment">
                      Adjustment: £{benefit.courtFindings.adjustments.toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="evidence-basis">
              <h5>Evidence Basis:</h5>
              <ul>
                {benefit.evidenceBasis.map(evidence => (
                  <li key={evidence}>{evidence}</li>
                ))}
              </ul>
            </div>
            
            {benefit.courtFindings && (
              <div className="court-findings-detail">
                <h5>Court Findings:</h5>
                <ul>
                  {benefit.courtFindings.reasonsForDecision.map(reason => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAssetsAnalysis = (): JSX.Element => (
    <div className="assets-analysis">
      <h3>🏠 Assets Analysis</h3>
      <div className="assets-summary">
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">£{assets.reduce((sum, a) => sum + a.estimatedValue, 0).toLocaleString()}</span>
            <span className="stat-label">Total Asset Value</span>
          </div>
          <div className="stat">
            <span className="stat-value">{assets.filter(a => a.restraintStatus === 'restrained').length}</span>
            <span className="stat-label">Restrained Assets</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {Math.round(assets.reduce((sum, a) => sum + a.realisationPotential, 0) / assets.length * 100)}%
            </span>
            <span className="stat-label">Avg Realisation Potential</span>
          </div>
        </div>
      </div>
      
      <div className="assets-list">
        {assets.map(asset => (
          <div key={asset.id} className={`asset-card ${asset.type} ${asset.restraintStatus}`}>
            <div className="asset-header">
              <h4>{asset.description}</h4>
              <div className="asset-badges">
                <span className={`type-badge ${asset.type}`}>
                  {asset.type.replace('_', ' ')}
                </span>
                <span className={`restraint-badge ${asset.restraintStatus}`}>
                  {asset.restraintStatus}
                </span>
              </div>
            </div>
            
            <div className="asset-value-section">
              <div className="estimated-value">
                Value: £{asset.estimatedValue.toLocaleString()}
              </div>
              <div className="ownership">
                Ownership: {asset.ownership}
              </div>
              <div className="realisation-potential">
                Realisation Potential: {Math.round(asset.realisationPotential * 100)}%
              </div>
            </div>
            
            {asset.thirdPartyInterests.length > 0 && (
              <div className="third-party-interests">
                <h5>Third Party Interests:</h5>
                {asset.thirdPartyInterests.map(interest => (
                  <div key={interest.id} className={`interest-item ${interest.validity}`}>
                    <div className="interest-party">{interest.party}</div>
                    <div className="interest-details">
                      {interest.interestType.replace('_', ' ')} - £{interest.amount.toLocaleString()}
                      <span className={`validity-badge ${interest.validity}`}>
                        {interest.validity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="valuation-evidence">
              <h5>Valuation Evidence:</h5>
              <ul>
                {asset.valuationEvidence.slice(0, 2).map(evidence => (
                  <li key={evidence}>{evidence}</li>
                ))}
                {asset.valuationEvidence.length > 2 && (
                  <li>+{asset.valuationEvidence.length - 2} more...</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLifestyleAssessment = (): JSX.Element => (
    <div className="lifestyle-assessment">
      <h3>👑 Criminal Lifestyle Assessment</h3>
      {lifestyleAssessment && (
        <div className="lifestyle-content">
          <div className="lifestyle-overview">
            <div className="timeframe">
              <strong>Relevant Period:</strong> {lifestyleAssessment.timeframe.start.toLocaleDateString()} - {lifestyleAssessment.timeframe.end.toLocaleDateString()}
            </div>
            <div className="prospects">
              <strong>Prospects:</strong> 
              <span className={`prospects-badge ${lifestyleAssessment.prospects}`}>
                {lifestyleAssessment.prospects}
              </span>
            </div>
          </div>
          
          <div className="lifestyle-sections">
            <div className="lifestyle-section">
              <h4>Qualifying Offences:</h4>
              <ul>
                {lifestyleAssessment.offences.map(offence => (
                  <li key={offence}>{offence}</li>
                ))}
              </ul>
            </div>
            
            <div className="lifestyle-section">
              <h4>Lifestyle Assumptions:</h4>
              <div className="assumptions-grid">
                <div className={`assumption-item ${lifestyleAssessment.assumptions.propertyObtained ? 'met' : 'not-met'}`}>
                  <span className="assumption-label">Property Obtained:</span>
                  <span className="assumption-status">
                    {lifestyleAssessment.assumptions.propertyObtained ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className={`assumption-item ${lifestyleAssessment.assumptions.expenditureMetFromCriminalConduct ? 'met' : 'not-met'}`}>
                  <span className="assumption-label">Expenditure from Crime:</span>
                  <span className="assumption-status">
                    {lifestyleAssessment.assumptions.expenditureMetFromCriminalConduct ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="assumption-item">
                  <span className="assumption-label">Minimum Benefit:</span>
                  <span className="assumption-value">
                    £{lifestyleAssessment.assumptions.minimumBenefit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="lifestyle-section">
              <h4>Key Challenges:</h4>
              <ul>
                {lifestyleAssessment.challenges.map(challenge => (
                  <li key={challenge}>{challenge}</li>
                ))}
              </ul>
            </div>
            
            <div className="lifestyle-section">
              <h4>Evidence Required:</h4>
              <ul>
                {lifestyleAssessment.evidenceRequired.map(evidence => (
                  <li key={evidence}>{evidence}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAvailableAmount = (): JSX.Element => (
    <div className="available-amount">
      <h3>💵 Available Amount Calculation</h3>
      {availableAmount && (
        <div className="available-content">
          <div className="calculation-summary">
            <div className="calculation-grid">
              <div className="calc-item total">
                <span className="calc-label">Total Assets:</span>
                <span className="calc-value">£{availableAmount.totalAssets.toLocaleString()}</span>
              </div>
              <div className="calc-item deduction">
                <span className="calc-label">Third Party Interests:</span>
                <span className="calc-value">-£{availableAmount.thirdPartyInterests.toLocaleString()}</span>
              </div>
              <div className="calc-item deduction">
                <span className="calc-label">Realisation Costs:</span>
                <span className="calc-value">-£{availableAmount.realisationCosts.toLocaleString()}</span>
              </div>
              <div className="calc-item available">
                <span className="calc-label">Available Amount:</span>
                <span className="calc-value">£{availableAmount.availableAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="sensitivity-analysis">
            <h4>Sensitivity Analysis:</h4>
            <div className="sensitivity-grid">
              <div className="sensitivity-item optimistic">
                <span className="scenario-label">Optimistic:</span>
                <span className="scenario-value">£{availableAmount.sensitivityAnalysis.optimistic.toLocaleString()}</span>
              </div>
              <div className="sensitivity-item realistic">
                <span className="scenario-label">Realistic:</span>
                <span className="scenario-value">£{availableAmount.sensitivityAnalysis.realistic.toLocaleString()}</span>
              </div>
              <div className="sensitivity-item pessimistic">
                <span className="scenario-label">Pessimistic:</span>
                <span className="scenario-value">£{availableAmount.sensitivityAnalysis.pessimistic.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="methodology-section">
            <h4>Methodology:</h4>
            <ul>
              {availableAmount.methodology.map(method => (
                <li key={method}>{method}</li>
              ))}
            </ul>
          </div>
          
          <div className="assumptions-section">
            <h4>Key Assumptions:</h4>
            <ul>
              {availableAmount.assumptions.map(assumption => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderPOCATimeline = (): JSX.Element => (
    <div className="poca-timeline">
      <h3>⏱️ POCA Timeline</h3>
      <div className="timeline-list">
        {timeline.map(stage => (
          <div key={stage.id} className={`timeline-card ${stage.stage}`}>
            <div className="timeline-header">
              <h4>{stage.title}</h4>
              <span className="timeline-stage">{stage.stage.replace('_', ' ')}</span>
            </div>
            
            <p className="timeline-description">{stage.description}</p>
            
            <div className="timeline-timeframe">
              <strong>Timeframe:</strong> {stage.timeframe}
            </div>
            
            <div className="timeline-sections">
              <div className="timeline-section">
                <h5>Requirements:</h5>
                <ul>
                  {stage.requirements.map(requirement => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </div>
              
              <div className="timeline-section">
                <h5>Key Considerations:</h5>
                <ul>
                  {stage.keyConsiderations.slice(0, 3).map(consideration => (
                    <li key={consideration}>{consideration}</li>
                  ))}
                </ul>
              </div>
              
              <div className="timeline-section">
                <h5>Risk Factors:</h5>
                <ul>
                  {stage.riskFactors.map(risk => (
                    <li key={risk} className="risk-item">{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="poca-module">
      {isAnalyzing && (
        <div className="analysis-indicator">
          <span className="spinner">💰</span>
          <span>Analyzing POCA case...</span>
        </div>
      )}
      
      <div className="module-header">
        <h2>💰 POCA Module</h2>
        <p>Specialized workflows for Proceeds of Crime Act confiscation proceedings</p>
      </div>
      
      <div className="module-tabs">
        {([
          ['overview', '📊 Overview'],
          ['benefits', '💰 Benefits'],
          ['assets', '🏠 Assets'],
          ['lifestyle', '👑 Lifestyle'],
          ['available', '💵 Available Amount'],
          ['timeline', '⏱️ Timeline'],
          ['realisation', '🏷️ Realisation']
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
                <h4>💰 Total Benefit</h4>
                <div className="overview-stat">
                  £{benefits.reduce((sum, b) => sum + (b.courtFindings ? b.amount + b.courtFindings.adjustments : b.amount), 0).toLocaleString()}
                </div>
                <p>Criminal benefit calculation</p>
              </div>
              
              <div className="overview-card">
                <h4>💵 Available Amount</h4>
                <div className="overview-stat">
                  £{availableAmount ? availableAmount.availableAmount.toLocaleString() : '0'}
                </div>
                <p>Realisable asset value</p>
              </div>
              
              <div className="overview-card">
                <h4>🏠 Total Assets</h4>
                <div className="overview-stat">
                  £{assets.reduce((sum, a) => sum + a.estimatedValue, 0).toLocaleString()}
                </div>
                <p>Gross asset valuation</p>
              </div>
              
              <div className="overview-card">
                <h4>👑 Lifestyle Case</h4>
                <div className="overview-stat">
                  {lifestyleAssessment ? lifestyleAssessment.prospects.toUpperCase() : 'N/A'}
                </div>
                <p>Criminal lifestyle prospects</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'benefits' && renderBenefitsAnalysis()}
        {activeTab === 'assets' && renderAssetsAnalysis()}
        {activeTab === 'lifestyle' && renderLifestyleAssessment()}
        {activeTab === 'available' && renderAvailableAmount()}
        {activeTab === 'timeline' && renderPOCATimeline()}
        
        {activeTab === 'realisation' && (
          <div className="realisation-panel">
            <h3>🏷️ Realisation Strategies</h3>
            <div className="strategies-list">
              {realisationStrategies.map(strategy => (
                <div key={strategy.id} className="strategy-card">
                  <h4>{strategy.method.replace('_', ' ')} Strategy</h4>
                  <div className="strategy-details">
                    <div className="strategy-metric">
                      <strong>Timeframe:</strong> {strategy.estimatedTimeframe}
                    </div>
                    <div className="strategy-metric">
                      <strong>Expected Recovery:</strong> £{strategy.expectedRecovery.toLocaleString()}
                    </div>
                    <div className="strategy-metric">
                      <strong>Estimated Costs:</strong> £{strategy.estimatedCosts.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="strategy-sections">
                    <div className="strategy-section">
                      <h5>Advantages:</h5>
                      <ul>
                        {strategy.advantages.map(advantage => (
                          <li key={advantage}>{advantage}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="strategy-section">
                      <h5>Risks:</h5>
                      <ul>
                        {strategy.risks.map(risk => (
                          <li key={risk}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POCAModule;