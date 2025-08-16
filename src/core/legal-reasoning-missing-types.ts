/**
 * MISSING TYPE DEFINITIONS FOR LEGAL REASONING
 * 
 * Provides missing types referenced in advanced-legal-reasoning.ts
 */

export type PracticeArea = 
  | 'commercial'
  | 'civil' 
  | 'criminal'
  | 'family'
  | 'administrative'
  | 'constitutional'
  | 'employment'
  | 'intellectual_property'
  | 'real_estate'
  | 'tax';

export interface DoctrinalBasis {
  doctrine: string;
  application: string;
  confidence: number;
}

export interface ProceduralAspect {
  procedure: string;
  requirement: string;
  satisfied: boolean;
}

export interface AlternativeArgument {
  argument: string;
  support: string[];
  weaknesses: string[];
  strength: number;
}

export interface SubIssue {
  issue: string;
  analysis: string;
  resolution: string;
  confidence: number;
}

export interface RelevantFact {
  fact: string;
  significance: string;
  disputed: boolean;
  evidence: string[];
}

export type AuthorityLevel = 
  | 'binding'
  | 'persuasive'
  | 'secondary'
  | 'foreign'
  | 'historical';

export interface ApplicabilityAnalysis {
  applicable: boolean;
  reasoning: string;
  limitations: string[];
  confidence: number;
}

// Alias for compatibility
export type ApplicationAnalysis = ApplicabilityAnalysis;

export interface LegalElement {
  element: string;
  definition: string;
  satisfied: boolean;
  analysis: string;
}

export interface LegalException {
  exception: string;
  applies: boolean;
  reasoning: string;
}

export interface FactPattern {
  facts: string[];
  pattern: string;
  significance: string;
}

export interface LegalApplication {
  rule: string;
  application: string;
  result: string;
  confidence: number;
}

export interface DistinguishingFactor {
  factor: string;
  significance: string;
  impact: string;
}

export interface OutcomeAnalysis {
  outcome: string;
  probability: number;
  reasoning: string;
  alternatives: string[];
}

export interface CompetingConsideration {
  consideration: string;
  weight: number;
  support: string[];
}

export interface BalancingTest {
  test: string;
  factors: string[];
  result: string;
  analysis: string;
}

export interface PolicyConsideration {
  policy: string;
  relevance: string;
  weight: number;
  impact: string;
}

export interface PracticalImplication {
  implication: string;
  likelihood: number;
  impact: string;
  mitigation: string[];
}

export interface Weakness {
  weakness: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  impact: string;
  mitigation: string;
}

export interface AlternativeOutcome {
  outcome: string;
  probability: number;
  conditions: string[];
  implications: string[];
}

export interface PracticalImpact {
  area: string;
  impact: string;
  magnitude: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface AuthorityValidation {
  authority: string;
  valid: boolean;
  current: boolean;
  relevance: number;
}

export interface CitationValidation {
  citation: string;
  format: 'valid' | 'invalid' | 'partial';
  verified: boolean;
  source: string;
}

export interface MethodologyValidation {
  methodology: string;
  sound: boolean;
  issues: string[];
  confidence: number;
}

export interface QualityAssurance {
  checked: boolean;
  reviewer: string;
  issues: string[];
  approved: boolean;
}

export interface PeerReviewIndicators {
  reviewed: boolean;
  reviewers: number;
  consensus: number;
  dissent: string[];
}

export interface UncertaintyFactor {
  factor: string;
  impact: number;
  mitigation: string;
  residualRisk: number;
}

export interface ConflictOfLaw {
  conflict: string;
  jurisdictions: string[];
  resolution: string;
}

export interface ChoiceOfLaw {
  applicable: string;
  reasoning: string;
  alternatives: string[];
}

export interface NoveltyAssessment {
  novel: boolean;
  aspects: string[];
  precedents: string[];
  approach: string;
}

export interface FactualPosition {
  position: string;
  support: string[];
  challenges: string[];
  strength: number;
}

export interface EvidenceItem {
  evidence: string;
  type: string;
  weight: number;
  admissible: boolean;
}

export interface FactualResolution {
  disputed: string;
  resolution: string;
  basis: string;
  confidence: number;
}

export interface Similarity {
  aspect: string;
  degree: number;
  significance: string;
}

export interface Distinction {
  aspect: string;
  significance: string;
  impact: string;
}

export interface KeyFact {
  fact: string;
  significance: string;
  disputed: boolean;
}

export interface ChronologyEvent {
  date: Date;
  event: string;
  significance: string;
}

export interface PartyInfo {
  name: string;
  role: string;
  representation: string;
}

export interface EvidenceRef {
  id: string;
  description: string;
  relevance: string;
}

export interface ElementAnalysis {
  element: LegalElement;
  satisfied: boolean;
  analysis: string;
  evidence: string[];
}

export interface FactualDispute {
  dispute: string;
  positions: string[];
  resolution: string;
  impact: string;
}