/**
 * PROFESSIONAL DEFENSIBILITY TYPES
 * 
 * Type definitions for professional defensibility framework
 * Supporting court admissibility and professional liability standards
 */

// Court admissibility types
export interface ReliabilityAssessment {
  methodologyReliability: number;
  dataReliability: number;
  outputConsistency: number;
  validationReliability: number;
  overallReliability: number;
  reliabilityFactors: string[];
  limitations: string[];
}

export interface RelevanceAnalysis {
  directRelevance: number;
  legalSignificance: number;
  probativeValue: number;
  relevanceScore: number;
  relevanceFactors: string[];
  limitations: string[];
}

export interface PrejudiceEvaluation {
  unfairPrejudice: number;
  confusionRisk: number;
  misleadingPotential: number;
  timeConsumption: number;
  overallPrejudice: number;
  mitigationMeasures: string[];
  acceptabilityThreshold: number;
}

export interface FoundationRequirement {
  requirement: string;
  description: string;
  necessity: 'required' | 'recommended' | 'optional';
  qualifications: string[];
}

// Professional standards types
export interface CompetenceStandardsAnalysis {
  legalKnowledge: number;
  technicalSkill: number;
  thoroughness: number;
  preparation: number;
  currentness: number;
  competenceScore: number;
  competenceAreas: string[];
  developmentNeeds: string[];
}

export interface ConfidentialityAnalysis {
  protectionScore: number;
  protectionMeasures: string[];
  risks: string[];
  mitigations: string[];
}

export interface ConflictAnalysis {
  conflictScore: number;
  potentialConflicts: string[];
  screeningProcedures: string[];
  resolutionMethods: string[];
}

export interface ProfessionalLiabilityAnalysis {
  liabilityScore: number;
  liabilityRisks: string[];
  protectionMeasures: string[];
  insuranceConsiderations: string[];
}

export interface BarStandardsCompliance {
  complianceScore: number;
  applicableRules: string[];
  complianceAreas: string[];
  deficiencies: string[];
}

// Liability risk types
export interface LiabilityMitigation {
  measure: string;
  effectiveness: number;
  implementation: string;
  cost: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface InsuranceCoverageAnalysis {
  covered: boolean;
  coverage: string;
  limitations: string[];
  recommendations: string[];
}

export interface ClientDisclosureRequirements {
  required: boolean;
  elements: string[];
  timing: string;
  documentation: string;
}

// Uncertainty quantification types
export interface SensitivityAnalysis {
  parameterSensitivity: ParameterSensitivity[];
  robustnessAnalysis: RobustnessAnalysis;
  uncertaintyImpact: string;
}

export interface ParameterSensitivity {
  parameter: string;
  sensitivity: number;
  impact: 'low' | 'moderate' | 'high';
}

export interface RobustnessAnalysis {
  worstCaseScenario: number;
  bestCaseScenario: number;
  expectedRange: [number, number];
  robustnessScore: number;
}

// Audit trail types
export interface DecisionPoint {
  id: string;
  decision: string;
  reasoning: string;
  alternatives: string[];
  confidence: number;
  timestamp: Date;
}

export interface AuthorityReference {
  id: string;
  citation: string;
  relevance: string;
  weight: number;
  verification: string;
}

export interface MethodologyStep {
  step: string;
  description: string;
  inputs: string[];
  outputs: string[];
  validation: string;
}

export interface QualityCheck {
  check: string;
  result: 'passed' | 'failed' | 'warning';
  details: string;
  timestamp: Date;
}

export interface ValidationStep {
  step: string;
  method: string;
  result: number;
  threshold: number;
  passed: boolean;
}

export interface ReviewableElement {
  element: string;
  type: 'decision' | 'analysis' | 'conclusion' | 'recommendation';
  reviewability: number;
  documentation: string;
}

// Error type for Daubert analysis
export interface ErrorType {
  type: string;
  frequency: number;
  severity: 'minor' | 'moderate' | 'significant' | 'severe';
}

console.log('📋 Professional Defensibility Types module loaded');