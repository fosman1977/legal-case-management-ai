/**
 * TYPE PATCHES FOR COMPILATION ISSUES
 * 
 * Quick fixes for TypeScript compilation errors
 * These should be properly refactored in production
 */

// Define missing ApplicabilityAnalysis interface
export interface ApplicabilityAnalysis {
  applicable: boolean;
  reasoning: string;
  limitations: string[];
  confidence: number;
  directlyApplicable?: boolean;
  issueId?: string;
  outcome?: string;
}

// Export missing type alias
export type ApplicationAnalysis = ApplicabilityAnalysis;

// Fix for professional-defensibility-framework types
export interface ReliabilityAssessment {
  reliable: boolean;
  factors: string[];
  score: number;
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
}

export interface FoundationRequirement {
  requirement: string;
  satisfied: boolean;
  evidence: string[];
}

export interface CompetenceStandardsAnalysis {
  competent: boolean;
  areas: string[];
  deficiencies: string[];
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

// Fix for english-precedent-statute-engine
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

// Export additional options type
export interface LegalReasoningOptions {
  includeAlternatives?: boolean;
  depth?: 'shallow' | 'standard' | 'deep';
  precedentAnalysis?: boolean;
  policyConsiderations?: boolean;
}