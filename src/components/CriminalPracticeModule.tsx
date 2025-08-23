/**
 * Criminal Practice Module
 * Specialized workflows and intelligence for criminal law practice
 */

import React, { useState, useEffect } from 'react';

interface CriminalCharge {
  id: string;
  offence: string;
  statute: string;
  section: string;
  category: 'indictable' | 'summary' | 'either_way';
  maxSentence: string;
  elements: string[];
  defences: string[];
  evidenceRequirements: string[];
  sentencingFactors: {
    aggravating: string[];
    mitigating: string[];
  };
}

interface CriminalEvidence {
  id: string;
  type: 'confession' | 'identification' | 'expert' | 'character' | 'similar_fact' | 'hearsay' | 'bad_character';
  description: string;
  admissibility: 'admissible' | 'inadmissible' | 'discretionary';
  legalBasis: string;
  challenges: string[];
  strategicValue: number; // 0-1
}

interface DefenceStrategy {
  id: string;
  type: 'alibi' | 'self_defence' | 'diminished_responsibility' | 'duress' | 'necessity' | 'mistake' | 'factual_dispute';
  description: string;
  evidenceRequired: string[];
  legalTests: string[];
  precedents: string[];
  successRate: number;
  risks: string[];
  timeline: string[];
}

interface SentencingGuideline {
  id: string;
  offence: string;
  category: 'A' | 'B' | 'C';
  culpability: 'high' | 'medium' | 'low';
  harm: 'high' | 'medium' | 'low';
  startingPoint: string;
  range: string;
  factors: {
    aggravating: string[];
    mitigating: string[];
  };
}

interface CriminalWorkflow {
  id: string;
  stage: 'police_interview' | 'first_hearing' | 'plea_hearing' | 'trial_preparation' | 'trial' | 'sentencing' | 'appeal';
  title: string;
  description: string;
  keyTasks: string[];
  deadlines: string[];
  documents: string[];
  considerations: string[];
  nextStages: string[];
}

interface CriminalPracticeModuleProps {
  caseId: string;
  caseData: {
    charges: CriminalCharge[];
    evidence: CriminalEvidence[];
    defendantProfile: any;
    casePhase: string;
  };
  onStrategyUpdate?: (strategy: DefenceStrategy) => void;
  onWorkflowProgress?: (workflow: CriminalWorkflow, completed: boolean) => void;
}

export const CriminalPracticeModule: React.FC<CriminalPracticeModuleProps> = ({
  caseId,
  caseData,
  onStrategyUpdate,
  onWorkflowProgress
}) => {
  const [charges, setCharges] = useState<CriminalCharge[]>([]);
  const [evidence, setEvidence] = useState<CriminalEvidence[]>([]);
  const [defenceStrategies, setDefenceStrategies] = useState<DefenceStrategy[]>([]);
  const [sentencingGuidelines, setSentencingGuidelines] = useState<SentencingGuideline[]>([]);
  const [workflows, setWorkflows] = useState<CriminalWorkflow[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'charges' | 'evidence' | 'strategy' | 'workflow' | 'sentencing'>('overview');
  const [selectedCharge, setSelectedCharge] = useState<CriminalCharge | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    initializeCriminalModule();
  }, [caseId, caseData]);

  const initializeCriminalModule = async (): Promise<void> => {
    setIsAnalyzing(true);
    
    try {
      // Simulate criminal case analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analyzedCharges = analyzeCharges(caseData.charges || []);
      const assessedEvidence = assessEvidence(caseData.evidence || []);
      const generatedStrategies = generateDefenceStrategies(analyzedCharges, assessedEvidence);
      const relevantGuidelines = getSentencingGuidelines(analyzedCharges);
      const caseWorkflows = getCriminalWorkflows(caseData.casePhase);
      
      setCharges(analyzedCharges);
      setEvidence(assessedEvidence);
      setDefenceStrategies(generatedStrategies);
      setSentencingGuidelines(relevantGuidelines);
      setWorkflows(caseWorkflows);
      
    } catch (error) {
      console.error('Criminal module initialization failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeCharges = (chargeData: any[]): CriminalCharge[] => {
    // Simulate comprehensive charge analysis
    const sampleCharges: CriminalCharge[] = [
      {
        id: 'charge_fraud_1',
        offence: 'Fraud by Misrepresentation',
        statute: 'Fraud Act 2006',
        section: 'Section 2',
        category: 'either_way',
        maxSentence: '10 years imprisonment',
        elements: [
          'Made a false representation',
          'Knew the representation was untrue or misleading',
          'Intended to make a gain or cause loss',
          'The representation was made dishonestly'
        ],
        defences: [
          'No false representation made',
          'Belief in truth of representation',
          'No dishonesty',
          'No intention to make gain or cause loss'
        ],
        evidenceRequirements: [
          'Documentary evidence of false statements',
          'Evidence of defendant\'s knowledge',
          'Evidence of financial gain or loss',
          'Proof of dishonest intent'
        ],
        sentencingFactors: {
          aggravating: [
            'Sophisticated planning',
            'Large financial loss',
            'Vulnerable victims',
            'Abuse of position of trust'
          ],
          mitigating: [
            'First offence',
            'Early guilty plea',
            'Genuine remorse',
            'Cooperation with authorities'
          ]
        }
      },
      {
        id: 'charge_money_laundering',
        offence: 'Money Laundering',
        statute: 'Proceeds of Crime Act 2002',
        section: 'Section 327',
        category: 'indictable',
        maxSentence: '14 years imprisonment',
        elements: [
          'Concealed, disguised, converted, transferred or removed criminal property',
          'Knew or suspected the property was criminal property',
          'Property constituted benefit from criminal conduct'
        ],
        defences: [
          'No knowledge or suspicion of criminal origin',
          'Authorised disclosure defence',
          'Adequate consideration defence'
        ],
        evidenceRequirements: [
          'Evidence of handling criminal property',
          'Evidence of knowledge or suspicion',
          'Proof of criminal origin of property'
        ],
        sentencingFactors: {
          aggravating: [
            'Large amounts involved',
            'Professional money laundering operation',
            'International dimension'
          ],
          mitigating: [
            'Limited role',
            'Cooperation with authorities',
            'Financial hardship'
          ]
        }
      }
    ];
    
    return sampleCharges;
  };

  const assessEvidence = (evidenceData: any[]): CriminalEvidence[] => {
    const sampleEvidence: CriminalEvidence[] = [
      {
        id: 'evidence_confession',
        type: 'confession',
        description: 'Defendant\'s admissions made during police interview under caution',
        admissibility: 'discretionary',
        legalBasis: 'PACE Code C - confession may be excluded under s76 or s78 PACE',
        challenges: [
          'Challenge admissibility under s76 PACE (oppression/unreliability)',
          'Challenge under s78 PACE (adverse effect on fairness)',
          'Breach of PACE Codes of Practice',
          'No appropriate adult present (if applicable)'
        ],
        strategicValue: 0.8
      },
      {
        id: 'evidence_identification',
        type: 'identification',
        description: 'Witness identification of defendant at scene',
        admissibility: 'admissible',
        legalBasis: 'Turnbull guidelines apply - quality of identification evidence',
        challenges: [
          'Poor lighting conditions',
          'Brief observation period',
          'Distance from incident',
          'No formal identification procedure',
          'Turnbull warning required'
        ],
        strategicValue: 0.6
      },
      {
        id: 'evidence_expert_financial',
        type: 'expert',
        description: 'Expert accountant evidence regarding financial transactions',
        admissibility: 'admissible',
        legalBasis: 'Expert evidence under s30 Criminal Justice Act 1988',
        challenges: [
          'Challenge expert\'s qualifications',
          'Challenge methodology used',
          'Instruct own expert',
          'Cross-examine on assumptions made'
        ],
        strategicValue: 0.9
      },
      {
        id: 'evidence_bad_character',
        type: 'bad_character',
        description: 'Defendant\'s previous convictions for dishonesty offences',
        admissibility: 'discretionary',
        legalBasis: 'Criminal Justice Act 2003 s101 - gateways for bad character evidence',
        challenges: [
          'Challenge admissibility under s101 gateways',
          'Apply for exclusion under s101(3)',
          'Argue prejudicial effect outweighs probative value',
          'Challenge relevance to current charges'
        ],
        strategicValue: 0.7
      }
    ];
    
    return sampleEvidence;
  };

  const generateDefenceStrategies = (charges: CriminalCharge[], evidence: CriminalEvidence[]): DefenceStrategy[] => {
    const strategies: DefenceStrategy[] = [
      {
        id: 'strategy_factual_dispute',
        type: 'factual_dispute',
        description: 'Challenge prosecution case on factual basis - deny making false representations',
        evidenceRequired: [
          'Alibi evidence for relevant times',
          'Documentary evidence of true position',
          'Character evidence for honesty',
          'Expert evidence on financial records'
        ],
        legalTests: [
          'Burden of proof on prosecution',
          'Standard of proof beyond reasonable doubt',
          'Sufficiency of prosecution evidence'
        ],
        precedents: [
          'R v Ghosh [1982] QB 1053 (dishonesty test)',
          'R v Barton [2020] EWCA Crim 575 (false representation)',
          'Ivey v Genting Casinos [2017] UKSC 67 (dishonesty test updated)'
        ],
        successRate: 0.65,
        risks: [
          'Defendant may need to give evidence',
          'Risk of adverse inferences if silent',
          'Character evidence may backfire'
        ],
        timeline: [
          'Serve defence statement',
          'Gather alibi evidence',
          'Prepare defendant for cross-examination',
          'Consider expert evidence'
        ]
      },
      {
        id: 'strategy_no_dishonesty',
        type: 'mistake',
        description: 'Argue defendant genuinely believed representations were true - no dishonesty',
        evidenceRequired: [
          'Evidence of defendant\'s belief system',
          'Contemporary documents showing belief',
          'Character evidence for honesty',
          'Expert evidence on business practices'
        ],
        legalTests: [
          'Ivey v Genting test for dishonesty',
          'Objective test - what would ordinary person think',
          'Defendant\'s actual knowledge and belief'
        ],
        precedents: [
          'Ivey v Genting Casinos [2017] UKSC 67',
          'R v Barton [2020] EWCA Crim 575',
          'R v Booth [2020] EWCA Crim 575'
        ],
        successRate: 0.55,
        risks: [
          'High threshold for dishonesty defence',
          'Defendant must give credible evidence',
          'Inconsistent with other evidence'
        ],
        timeline: [
          'Detailed defendant statement',
          'Character witness preparation',
          'Expert evidence on industry standards',
          'Comprehensive cross-examination plan'
        ]
      }
    ];
    
    return strategies;
  };

  const getSentencingGuidelines = (charges: CriminalCharge[]): SentencingGuideline[] => {
    const guidelines: SentencingGuideline[] = [
      {
        id: 'guideline_fraud',
        offence: 'Fraud',
        category: 'B',
        culpability: 'medium',
        harm: 'medium',
        startingPoint: '18 months custody',
        range: '36 weeks - 3 years custody',
        factors: {
          aggravating: [
            'Steps taken to prevent victims reporting or obtaining assistance',
            'Offence committed over sustained period',
            'Use of false or assumed identity',
            'Deliberately targeting vulnerable victims'
          ],
          mitigating: [
            'No previous convictions',
            'Remorse',
            'Character and/or exemplary conduct',
            'Serious medical conditions requiring treatment'
          ]
        }
      }
    ];
    
    return guidelines;
  };

  const getCriminalWorkflows = (casePhase: string): CriminalWorkflow[] => {
    const allWorkflows: CriminalWorkflow[] = [
      {
        id: 'workflow_police_interview',
        stage: 'police_interview',
        title: 'Police Interview Strategy',
        description: 'Prepare client for police interview and provide legal advice',
        keyTasks: [
          'Review disclosure provided by police',
          'Advise client on options (answer questions/no comment)',
          'Prepare for significant statement if appropriate',
          'Consider pre-interview disclosure'
        ],
        deadlines: ['Before interview'],
        documents: ['Interview record', 'Custody record', 'Initial disclosure'],
        considerations: [
          'Strength of evidence',
          'Client\'s mental state and capacity',
          'Potential for adverse inferences',
          'Co-defendants and joint enterprise'
        ],
        nextStages: ['first_hearing']
      },
      {
        id: 'workflow_first_hearing',
        stage: 'first_hearing',
        title: 'First Hearing Preparation',
        description: 'Prepare for first court appearance and plea indication',
        keyTasks: [
          'Review initial evidence',
          'Advise on plea options',
          'Consider jurisdiction and venue',
          'Prepare bail application if needed'
        ],
        deadlines: ['Day of first hearing'],
        documents: ['Charge sheet', 'Initial details of prosecution case', 'Previous convictions'],
        considerations: [
          'Strength of prosecution case',
          'Client instructions on plea',
          'Venue for trial',
          'Bail considerations'
        ],
        nextStages: ['plea_hearing', 'trial_preparation']
      },
      {
        id: 'workflow_trial_preparation',
        stage: 'trial_preparation',
        title: 'Trial Preparation',
        description: 'Comprehensive preparation for criminal trial',
        keyTasks: [
          'Analyze prosecution evidence',
          'Prepare defence case statement',
          'Identify and interview witnesses',
          'Prepare cross-examination plan',
          'Consider expert evidence',
          'Prepare opening and closing speeches'
        ],
        deadlines: [
          'Defence statement (28 days after prosecution serve evidence)',
          'Witness requirements (28 days before trial)',
          'Skeleton arguments (if required)'
        ],
        documents: [
          'Prosecution evidence bundle',
          'Defence statement',
          'Witness statements',
          'Expert reports',
          'Skeleton argument'
        ],
        considerations: [
          'Disclosure applications',
          'Admissibility challenges',
          'Witness availability',
          'Case management directions'
        ],
        nextStages: ['trial']
      }
    ];
    
    return allWorkflows.filter(w => 
      w.stage === casePhase || 
      w.nextStages.includes(casePhase)
    );
  };

  const renderChargesAnalysis = (): JSX.Element => (
    <div className="charges-analysis">
      <h3>📋 Charges Analysis</h3>
      <div className="charges-grid">
        {charges.map(charge => (
          <div 
            key={charge.id} 
            className={`charge-card ${charge.category}`}
            onClick={() => setSelectedCharge(charge)}
          >
            <div className="charge-header">
              <h4>{charge.offence}</h4>
              <span className={`charge-category ${charge.category}`}>
                {charge.category.replace('_', ' ')}
              </span>
            </div>
            <div className="charge-statute">
              {charge.statute} {charge.section}
            </div>
            <div className="charge-sentence">
              Max: {charge.maxSentence}
            </div>
            <div className="charge-elements">
              <h5>Key Elements ({charge.elements.length}):</h5>
              <ul>
                {charge.elements.slice(0, 2).map(element => (
                  <li key={element}>{element}</li>
                ))}
                {charge.elements.length > 2 && (
                  <li>+{charge.elements.length - 2} more...</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
      
      {selectedCharge && (
        <div className="charge-detail-modal">
          <div className="charge-detail">
            <h4>{selectedCharge.offence}</h4>
            <button 
              className="close-btn" 
              onClick={() => setSelectedCharge(null)}
            >
              ×
            </button>
            
            <div className="charge-detail-sections">
              <div className="section">
                <h5>Elements to Prove:</h5>
                <ul>
                  {selectedCharge.elements.map(element => (
                    <li key={element}>{element}</li>
                  ))}
                </ul>
              </div>
              
              <div className="section">
                <h5>Potential Defences:</h5>
                <ul>
                  {selectedCharge.defences.map(defence => (
                    <li key={defence}>{defence}</li>
                  ))}
                </ul>
              </div>
              
              <div className="section">
                <h5>Evidence Required:</h5>
                <ul>
                  {selectedCharge.evidenceRequirements.map(req => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEvidenceAssessment = (): JSX.Element => (
    <div className="evidence-assessment">
      <h3>🔍 Evidence Assessment</h3>
      <div className="evidence-summary">
        <div className="evidence-stats">
          <div className="stat">
            <span className="stat-value">{evidence.length}</span>
            <span className="stat-label">Evidence Items</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {evidence.filter(e => e.admissibility === 'admissible').length}
            </span>
            <span className="stat-label">Admissible</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {evidence.filter(e => e.admissibility === 'discretionary').length}
            </span>
            <span className="stat-label">Challengeable</span>
          </div>
        </div>
      </div>
      
      <div className="evidence-list">
        {evidence.map(item => (
          <div key={item.id} className={`evidence-item ${item.type} ${item.admissibility}`}>
            <div className="evidence-header">
              <h4>{item.type.replace('_', ' ')}</h4>
              <div className="evidence-badges">
                <span className={`admissibility-badge ${item.admissibility}`}>
                  {item.admissibility}
                </span>
                <span className="strategic-value">
                  {Math.round(item.strategicValue * 100)}% strategic value
                </span>
              </div>
            </div>
            
            <p className="evidence-description">{item.description}</p>
            
            <div className="legal-basis">
              <strong>Legal Basis:</strong> {item.legalBasis}
            </div>
            
            <div className="evidence-challenges">
              <h5>Potential Challenges:</h5>
              <ul>
                {item.challenges.slice(0, 3).map(challenge => (
                  <li key={challenge}>{challenge}</li>
                ))}
                {item.challenges.length > 3 && (
                  <li>+{item.challenges.length - 3} more challenges</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDefenceStrategy = (): JSX.Element => (
    <div className="defence-strategy">
      <h3>⚔️ Defence Strategy</h3>
      <div className="strategy-overview">
        <p>AI-powered analysis of defence options based on charges and evidence</p>
      </div>
      
      <div className="strategies-list">
        {defenceStrategies.map(strategy => (
          <div key={strategy.id} className={`strategy-card ${strategy.type}`}>
            <div className="strategy-header">
              <h4>{strategy.description}</h4>
              <div className="strategy-metrics">
                <span className="success-rate">
                  {Math.round(strategy.successRate * 100)}% success rate
                </span>
              </div>
            </div>
            
            <div className="strategy-sections">
              <div className="strategy-section">
                <h5>Evidence Required:</h5>
                <ul>
                  {strategy.evidenceRequired.slice(0, 3).map(evidence => (
                    <li key={evidence}>{evidence}</li>
                  ))}
                </ul>
              </div>
              
              <div className="strategy-section">
                <h5>Key Precedents:</h5>
                <ul>
                  {strategy.precedents.slice(0, 2).map(precedent => (
                    <li key={precedent}>{precedent}</li>
                  ))}
                </ul>
              </div>
              
              <div className="strategy-section">
                <h5>Risks:</h5>
                <ul>
                  {strategy.risks.slice(0, 2).map(risk => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <button 
              className="adopt-strategy-btn"
              onClick={() => onStrategyUpdate?.(strategy)}
            >
              Adopt This Strategy
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorkflowManager = (): JSX.Element => (
    <div className="workflow-manager">
      <h3>📋 Criminal Workflow</h3>
      <div className="current-phase">
        <span className="phase-label">Current Phase:</span>
        <span className="phase-value">{caseData.casePhase?.replace('_', ' ') || 'Not Set'}</span>
      </div>
      
      <div className="workflows-list">
        {workflows.map(workflow => (
          <div key={workflow.id} className={`workflow-card ${workflow.stage}`}>
            <div className="workflow-header">
              <h4>{workflow.title}</h4>
              <span className="workflow-stage">{workflow.stage.replace('_', ' ')}</span>
            </div>
            
            <p className="workflow-description">{workflow.description}</p>
            
            <div className="workflow-sections">
              <div className="workflow-section">
                <h5>Key Tasks:</h5>
                <ul>
                  {workflow.keyTasks.map(task => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </div>
              
              <div className="workflow-section">
                <h5>Deadlines:</h5>
                <ul>
                  {workflow.deadlines.map(deadline => (
                    <li key={deadline} className="deadline-item">{deadline}</li>
                  ))}
                </ul>
              </div>
              
              <div className="workflow-section">
                <h5>Key Considerations:</h5>
                <ul>
                  {workflow.considerations.slice(0, 3).map(consideration => (
                    <li key={consideration}>{consideration}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <button 
              className="complete-workflow-btn"
              onClick={() => onWorkflowProgress?.(workflow, true)}
            >
              Mark as Complete
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="criminal-practice-module">
      {isAnalyzing && (
        <div className="analysis-indicator">
          <span className="spinner">⚖️</span>
          <span>Analyzing criminal case...</span>
        </div>
      )}
      
      <div className="module-header">
        <h2>⚖️ Criminal Practice Module</h2>
        <p>Specialized workflows and intelligence for criminal law practice</p>
      </div>
      
      <div className="module-tabs">
        {([
          ['overview', '📊 Overview'],
          ['charges', '📋 Charges'],
          ['evidence', '🔍 Evidence'],
          ['strategy', '⚔️ Strategy'],
          ['workflow', '📋 Workflow'],
          ['sentencing', '⚖️ Sentencing']
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
                <h4>📋 Charges Summary</h4>
                <div className="overview-stat">{charges.length} charges</div>
                <p>Analysis of criminal charges and elements</p>
              </div>
              
              <div className="overview-card">
                <h4>🔍 Evidence Status</h4>
                <div className="overview-stat">
                  {evidence.filter(e => e.admissibility === 'discretionary').length} challengeable
                </div>
                <p>Evidence admissibility assessment</p>
              </div>
              
              <div className="overview-card">
                <h4>⚔️ Defence Options</h4>
                <div className="overview-stat">{defenceStrategies.length} strategies</div>
                <p>AI-generated defence strategies</p>
              </div>
              
              <div className="overview-card">
                <h4>📋 Workflow Progress</h4>
                <div className="overview-stat">{workflows.length} active</div>
                <p>Criminal procedure workflows</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'charges' && renderChargesAnalysis()}
        {activeTab === 'evidence' && renderEvidenceAssessment()}
        {activeTab === 'strategy' && renderDefenceStrategy()}
        {activeTab === 'workflow' && renderWorkflowManager()}
        
        {activeTab === 'sentencing' && (
          <div className="sentencing-panel">
            <h3>⚖️ Sentencing Guidelines</h3>
            <div className="guidelines-list">
              {sentencingGuidelines.map(guideline => (
                <div key={guideline.id} className="guideline-card">
                  <h4>{guideline.offence} - Category {guideline.category}</h4>
                  <div className="guideline-details">
                    <div className="guideline-range">
                      <strong>Starting Point:</strong> {guideline.startingPoint}
                    </div>
                    <div className="guideline-range">
                      <strong>Range:</strong> {guideline.range}
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

export default CriminalPracticeModule;