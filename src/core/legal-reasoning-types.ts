/**
 * LEGAL REASONING TYPES
 * 
 * Comprehensive type definitions for advanced legal reasoning engine
 * Supports professional-grade legal analysis and validation
 */

// Core legal analysis types
export type PracticeArea = 
  | 'contract_law' | 'tort_law' | 'constitutional_law' | 'employment_law'
  | 'intellectual_property' | 'civil_procedure' | 'evidence' | 'criminal_law'
  | 'corporate_law' | 'securities_law' | 'antitrust_law' | 'tax_law'
  | 'environmental_law' | 'healthcare_law' | 'real_estate_law' | 'family_law'
  | 'immigration_law' | 'bankruptcy_law' | 'administrative_law' | 'general';

export type AuthorityLevel = 
  | 'primary_binding' | 'primary_persuasive' | 'secondary' | 'tertiary';

export type DocumentType = 
  | 'constitution' | 'statute' | 'regulation' | 'case_law' | 'secondary'
  | 'contract' | 'correspondence' | 'pleading' | 'motion' | 'brief'
  | 'deposition' | 'expert_report' | 'discovery' | 'exhibit';

// Doctrinal and procedural types
export interface DoctrinalBasis {
  source: 'constitutional' | 'statutory' | 'common_law' | 'regulatory' | 'contractual';
  principles: string[];
}

export interface ProceduralAspect {
  aspect: string;
  requirements: string[];
  deadlines: Date[];
  standards: string[];
}

// Sub-issue and fact analysis
export interface SubIssue {
  issue: string;
  relationship: 'prerequisite' | 'component' | 'alternative' | 'consequence';
  importance: 'critical' | 'significant' | 'supporting';
}

export interface RelevantFact {
  fact: string;
  type: 'operative' | 'background' | 'contextual' | 'disputed';
  importance: 'critical' | 'significant' | 'supporting' | 'minor';
  source: string;
  reliability: 'high' | 'medium' | 'low' | 'disputed';
}

// Rule analysis and interpretation
export interface ApplicabilityAnalysis {
  directlyApplicable: boolean;
  analogicalApplication: boolean;
  modifications: string[];
  limitations: string[];
}

export interface LegalElement {
  element: string;
  required: boolean;
  standard: 'preponderance' | 'clear_and_convincing' | 'beyond_reasonable_doubt' | 'substantial_evidence';
  analysis: string;
}

export interface LegalException {
  exception: string;
  conditions: string[];
  effect: string;
  applicability: 'likely' | 'possible' | 'unlikely';
}

// Fact pattern analysis
export interface FactPattern {
  id: string;
  description: string;
  keyFacts: KeyFact[];
  chronology: ChronologyEvent[];
  parties: PartyInfo[];
  evidence: EvidenceRef[];
  disputes: FactualDispute[];
}

export interface FactualDispute {
  id: string;
  fact: string;
  disputeType: 'material' | 'credibility' | 'interpretation' | 'causation';
  positions: FactualPosition[];
  evidence: EvidenceItem[];
  resolution?: FactualResolution;
}

export interface KeyFact {
  fact: string;
  type: 'temporal' | 'financial' | 'contractual' | 'behavioral' | 'circumstantial';
  importance: 'critical' | 'high' | 'medium' | 'low';
  support: 'documentary' | 'testimonial' | 'physical' | 'circumstantial';
  disputed: boolean;
  documentId: string;
}

export interface ChronologyEvent {
  date: Date;
  event: string;
  type: 'action' | 'communication' | 'legal' | 'financial' | 'documentary';
  importance: 'critical' | 'significant' | 'routine';
  documentId?: string;
}

export interface PartyInfo {
  name: string;
  type: 'individual' | 'entity' | 'government' | 'other';
  role: string;
  significance: 'primary' | 'secondary' | 'witness' | 'third_party' | 'high' | 'medium' | 'low';
}

export interface EvidenceRef {
  id: string;
  type: 'documentary' | 'testimonial' | 'physical' | 'expert' | 'demonstrative';
  description: string;
  reliability: 'high' | 'medium' | 'low' | 'disputed';
  authenticity: 'authenticated' | 'presumed_authentic' | 'disputed' | 'unknown';
  weight: 'significant' | 'moderate' | 'limited' | 'minimal';
}

// Legal application analysis
export interface LegalApplication {
  ruleId: string;
  elementAnalysis: ElementAnalysis[];
  overallSatisfaction: boolean;
  analysis: string;
  confidence: number;
}

export interface ElementAnalysis {
  element: string;
  satisfied: boolean | null;
  evidence: string[];
  analysis: string;
  confidence: number;
}

// Analogical reasoning
export interface Similarity {
  aspect: string;
  description: string;
  strength: number;
}

export interface Distinction {
  aspect: string;
  description: string;
  significance: 'material' | 'immaterial' | 'unclear';
}

export interface DistinguishingFactor {
  factor: string;
  type: 'factual' | 'legal' | 'procedural' | 'policy';
  significance: 'critical' | 'significant' | 'moderate' | 'minor';
  impact: string;
}

// Outcome analysis
export interface OutcomeAnalysis {
  likelihood: 'certain' | 'likely' | 'possible' | 'unlikely' | 'remote';
  confidence: number;
  reasoning: string;
  alternatives: string[];
  risks: string[];
}

// Synthesis and balancing
export interface CompetingConsideration {
  consideration: string;
  weight: number;
  analysis: string;
  resolution: string;
}

export interface BalancingTest {
  factors: string[];
  weights: number[];
  outcome: string;
  confidence: number;
}

export interface PolicyConsideration {
  policy: string;
  relevance: string;
  impact: string;
  weight: number;
}

export interface PracticalImplication {
  implication: string;
  description: string;
  likelihood: number;
  impact: 'minimal' | 'moderate' | 'significant' | 'severe';
  mitigation: string;
}

// Conclusions and alternatives
export interface Weakness {
  weakness: string;
  severity: 'minor' | 'moderate' | 'significant' | 'critical';
  impact: string;
  mitigation: string;
}

export interface AlternativeOutcome {
  outcome: string;
  likelihood: number;
  reasoning: string;
  impact: string;
}

export interface PracticalImpact {
  immediateImpact: string;
  longTermImpact: string;
  strategicImplications: string[];
  clientCounseling: string;
}

export interface AlternativeArgument {
  argument: string;
  strength: number;
  support: string[];
  weaknesses: string[];
  likelihood: number;
}

// Professional validation types
export interface AuthorityValidation {
  ruleId: string;
  authorityType: string;
  citation: string;
  currentStatus: 'current' | 'superseded' | 'modified' | 'overruled';
  hierarchyCorrect: boolean;
  jurisdictionApplicable: boolean;
  validationScore: number;
  issues: string[];
}

export interface CitationValidation {
  citation: string;
  format: 'correct' | 'incorrect' | 'incomplete';
  accuracy: 'verified' | 'questionable' | 'incorrect';
  currentness: 'current' | 'outdated' | 'superseded';
  validationScore: number;
  suggestions: string[];
}

export interface MethodologyValidation {
  frameworkCorrect: boolean;
  stepCompleteness: number;
  logicalFlow: number;
  professionalStandard: number;
  validationScore: number;
  recommendations: string[];
}

export interface QualityAssurance {
  completeness: number;
  accuracy: number;
  clarity: number;
  professionalism: number;
  overallQuality: number;
  improvements: string[];
}

export interface PeerReviewIndicators {
  reviewability: number;
  defensibility: number;
  thoroughness: number;
  professionalAcceptance: number;
  overallScore: number;
}

// Confidence and uncertainty
export interface UncertaintyFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
}

// Jurisdictional analysis
export interface ConflictOfLaw {
  issue: string;
  applicableLaws: string[];
  analysis: string;
  resolution: string;
}

export interface ChoiceOfLaw {
  analysis: string;
  conclusion: string;
  confidence: number;
}

// Novelty assessment
export interface NoveltyAssessment {
  isNovelIssue: boolean;
  similarIssues: string[];
  gapAnalysis: string;
}

// Factual positions and resolution
export interface FactualPosition {
  party: string;
  position: string;
  support: string[];
  credibility: number;
}

export interface FactualResolution {
  method: 'stipulation' | 'summary_judgment' | 'trial' | 'settlement';
  likelihood: 'certain' | 'likely' | 'disputed' | 'uncertain';
  impact: 'determinative' | 'significant' | 'moderate' | 'minimal';
}

export interface EvidenceItem {
  description: string;
  type: 'documentary' | 'testimonial' | 'physical' | 'expert';
  strength: number;
  admissibility: 'admissible' | 'questionable' | 'inadmissible';
}

console.log('📋 Legal Reasoning Types module loaded');