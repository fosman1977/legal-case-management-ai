/**
 * COMPREHENSIVE TYPE FIX FOR STAGE 3
 * 
 * Resolves all TypeScript compilation errors
 */

// Fix for advanced-legal-reasoning.ts - remove duplicate imports
export interface FactualDispute {
  dispute: string;
  positions: string[];
  resolution: string;
  impact: string;
  fact?: string; // Add missing property
}

// Fix ApplicationAnalysis to match ApplicabilityAnalysis
export interface ApplicationAnalysis {
  applicable: boolean;
  reasoning: string;
  limitations: string[];
  confidence: number;
  directlyApplicable?: boolean; // Optional property
  issueId?: string; // Optional property
  outcome?: string; // Add missing property
}

// Fix missing HighCourtPrecedentSystem
export interface HighCourtPrecedentSystem {
  queensBenchDivision: HighCourtDivisionPrecedents;
  chanceryDivision: HighCourtDivisionPrecedents;
  familyDivision: HighCourtDivisionPrecedents;
  administrativeCourt: HighCourtDivisionPrecedents;
  effectiveness: number;
}

export interface HighCourtDivisionPrecedents {
  coverage: number;
  accuracy: number;
  persuasiveAuthority: number;
  specialistKnowledge: number;
  effectiveness: number;
}

// Fix for professional-defensibility-framework types
export interface ReliabilityAssessment {
  reliable: boolean;
  factors: string[];
  score: number;
  overallReliability?: number;
}

export interface RelevanceAnalysis {
  relevant: boolean;
  directRelevance: number;
  probativeValue: number;
}

export interface PrejudiceEvaluation {
  prejudicial: boolean;
  unfairPrejudice: number;
  probativeVsPrejudice: number;
  confusionRisk?: number;
  misleadingPotential?: number;
  timeConsumption?: number;
  overallPrejudice?: number;
  mitigationMeasures?: string[];
  acceptabilityThreshold?: number;
}

export interface FoundationRequirement {
  requirement: string;
  satisfied: boolean;
  evidence: string[];
  description?: string;
  necessity?: string;
  qualifications?: string[];
}

export interface CompetenceStandardsAnalysis {
  competent: boolean;
  areas: string[];
  deficiencies: string[];
  competenceScore?: number;
  legalKnowledge?: any;
  technicalSkill?: number;
  thoroughness?: number;
  preparation?: number;
  currentness?: number;
  competenceAreas?: string[];
  developmentNeeds?: string[];
}

export interface ConfidentialityAnalysis {
  privileged: boolean;
  type: string;
  waived: boolean;
}

export interface ConflictAnalysis {
  hasConflict: boolean;
  parties: string[];
  waivable: boolean;
}

export interface ProfessionalLiabilityAnalysis {
  exposure: number;
  risks: string[];
  mitigation: string[];
}

export interface BarStandardsCompliance {
  compliant: boolean;
  standards: string[];
  issues: string[];
}

export interface LiabilityMitigation {
  strategy: string;
  effectiveness: number;
  implementation: string[];
}

export interface InsuranceCoverageAnalysis {
  covered: boolean;
  exclusions: string[];
  limits: number;
}

export interface ClientDisclosureRequirements {
  required: string[];
  provided: string[];
  pending: string[];
}

export interface SensitivityAnalysis {
  sensitive: boolean;
  factors: string[];
  impact: number;
  parameterSensitivity?: any;
  robustnessAnalysis?: any;
  uncertaintyImpact?: number;
}

export interface DecisionPoint {
  point: string;
  options: string[];
  selected: string;
  rationale: string;
}

export interface AuthorityReference {
  authority: string;
  citation: string;
  weight: number;
  applicable: boolean;
}

export interface MethodologyStep {
  step: string;
  completed: boolean;
  result: string;
}

export interface QualityCheck {
  check: string;
  passed: boolean;
  issues: string[];
}

export interface ValidationStep {
  validation: string;
  result: boolean;
  confidence: number;
}

export interface ReviewableElement {
  element: string;
  reviewed: boolean;
  reviewer: string;
  comments: string[];
}

export type ErrorType = 
  | 'factual'
  | 'legal'
  | 'procedural'
  | 'analytical'
  | 'citation'
  | 'other';

// Export LegalReasoningOptions
export interface LegalReasoningOptions {
  includeAlternatives?: boolean;
  depth?: 'shallow' | 'standard' | 'deep';
  precedentAnalysis?: boolean;
  policyConsiderations?: boolean;
}