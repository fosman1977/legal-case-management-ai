/**
 * STRICT TYPE INTERFACES
 * 
 * Replaces any[] usage with precise, type-safe interfaces
 * Improves code quality and reduces runtime errors
 * 
 * Status: Phase 1 - Type Safety Enhancement
 * Purpose: Eliminate loose typing across legal AI system
 */

// Entity and extraction types
export interface LegalEntity {
  id: string;
  type: 'person' | 'organization' | 'date' | 'location' | 'amount' | 'contract' | 'legal_citation' | 'court' | 'case_number';
  value: string;
  confidence: number;
  context: string;
  contextBefore?: string;
  contextAfter?: string;
  documentSource: string;
  pageNumber?: number;
  boundingBox?: BoundingBox;
  validationStatus: 'validated' | 'pending' | 'rejected';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LegalTable {
  id: string;
  type: 'financial' | 'timeline' | 'parties' | 'evidence' | 'citation' | 'general';
  title?: string;
  headers: string[];
  rows: TableRow[];
  pageNumber: number;
  markdown: string;
  confidence: number;
  extractionMethod: 'text_analysis' | 'ocr' | 'structured_data';
}

export interface TableRow {
  cells: TableCell[];
  isHeader: boolean;
}

export interface TableCell {
  value: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  confidence: number;
  colspan?: number;
  rowspan?: number;
}

// Document metadata types
export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  pageCount: number;
  createdDate?: Date;
  modifiedDate?: Date;
  author?: string;
  title?: string;
  subject?: string;
  keywords: string[];
  language?: string;
  extractionDate: Date;
  extractionMethod: string;
  processingTime: number;
}

// AI Analysis result types
export interface AnalysisConfidence {
  overall: number;
  factual: number;
  legal: number;
  procedural: number;
  breakdown: ConfidenceBreakdown[];
}

export interface ConfidenceBreakdown {
  component: string;
  score: number;
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  factor: string;
  impact: number; // -1 to 1
  weight: number; // 0 to 1
  description: string;
}

// Legal reasoning types
export interface LegalIssueAnalysis {
  id: string;
  issue: string;
  type: 'legal' | 'factual' | 'procedural' | 'evidentiary';
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  status: 'identified' | 'analyzed' | 'resolved' | 'disputed';
  relatedEntities: string[]; // Entity IDs
  supportingEvidence: EvidenceReference[];
  legalAuthorities: LegalAuthorityReference[];
  confidence: number;
}

export interface EvidenceReference {
  documentId: string;
  pageNumber?: number;
  excerpt: string;
  evidenceType: 'documentary' | 'testimonial' | 'expert' | 'circumstantial';
  relevance: number; // 0 to 1
  reliability: number; // 0 to 1
}

export interface LegalAuthorityReference {
  id: string;
  type: 'statute' | 'case_law' | 'regulation' | 'constitutional' | 'secondary';
  citation: string;
  title: string;
  jurisdiction: string;
  year?: number;
  relevance: number; // 0 to 1
  precedentialValue: 'binding' | 'persuasive' | 'informational';
}

// Person analysis types
export interface PersonAnalysis {
  id: string;
  name: string;
  role: 'plaintiff' | 'defendant' | 'witness' | 'expert' | 'attorney' | 'judge' | 'third_party';
  description: string;
  relevance: number; // 0 to 1
  relationshipMap: PersonRelationship[];
  credibilityFactors: CredibilityFactor[];
  documentReferences: DocumentReference[];
  timeline: PersonTimelineEvent[];
}

export interface PersonRelationship {
  personId: string;
  relationshipType: 'family' | 'business' | 'legal' | 'professional' | 'adversarial' | 'neutral';
  description: string;
  strength: number; // 0 to 1
  timeframe?: TimeFrame;
}

export interface CredibilityFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0 to 1
  description: string;
  source: string;
}

export interface DocumentReference {
  documentId: string;
  pageNumbers: number[];
  relevantSections: string[];
  mentionType: 'primary_subject' | 'mentioned' | 'related' | 'background';
}

export interface PersonTimelineEvent {
  date: Date;
  event: string;
  significance: 'critical' | 'important' | 'relevant' | 'background';
  source: DocumentReference[];
}

export interface TimeFrame {
  startDate?: Date;
  endDate?: Date;
  description: string;
}

// Chronology types
export interface ChronologyAnalysis {
  events: ChronologyEventDetailed[];
  timeline: TimelineSegment[];
  criticalPeriods: CriticalPeriod[];
  gaps: TemporalGap[];
  confidence: number;
}

export interface ChronologyEventDetailed {
  id: string;
  date: Date;
  dateConfidence: number;
  event: string;
  category: 'legal_action' | 'business_transaction' | 'communication' | 'deadline' | 'meeting' | 'other';
  participants: string[]; // Person IDs
  location?: string;
  significance: 'critical' | 'high' | 'medium' | 'low';
  sources: DocumentReference[];
  relatedEvents: string[]; // Event IDs
  legalImplications: string[];
}

export interface TimelineSegment {
  startDate: Date;
  endDate: Date;
  phase: string;
  description: string;
  keyEvents: string[]; // Event IDs
  significance: 'critical' | 'important' | 'relevant';
}

export interface CriticalPeriod {
  startDate: Date;
  endDate: Date;
  description: string;
  importance: string;
  events: string[]; // Event IDs
  legalSignificance: string;
}

export interface TemporalGap {
  startDate: Date;
  endDate: Date;
  description: string;
  potentialImpact: 'high' | 'medium' | 'low';
  recommendations: string[];
}

// Key points and insights
export interface KeyPointAnalysis {
  id: string;
  title: string;
  description: string;
  category: 'legal_principle' | 'factual_finding' | 'procedural_matter' | 'strategic_consideration' | 'risk_factor';
  importance: 'critical' | 'high' | 'medium' | 'low';
  supportingEvidence: EvidenceReference[];
  relatedIssues: string[]; // Issue IDs
  actionItems: ActionItem[];
  confidence: number;
}

export interface ActionItem {
  action: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  deadline?: Date;
  responsible?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
}

// Processing and quality metrics
export interface ProcessingStatistics {
  documentsProcessed: number;
  pagesAnalyzed: number;
  entitiesExtracted: number;
  tablesProcessed: number;
  issuesIdentified: number;
  personsAnalyzed: number;
  eventsChronologized: number;
  aiTokensUsed: number;
  processingTimeMs: number;
  memoryUsedBytes: number;
  cacheHitRate: number;
}

export interface QualityMetrics {
  overall: number;
  textQuality: number;
  structureQuality: number;
  aiConfidence: number;
  extractionCompleteness: number;
  dataConsistency: number;
  validationScore: number;
  errorRate: number;
  warningCount: number;
  recommendations: QualityRecommendation[];
}

export interface QualityRecommendation {
  type: 'error' | 'warning' | 'improvement' | 'optimization';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  component: string;
  actionRequired: boolean;
  autoFixAvailable: boolean;
}

// Search and indexing types
export interface SearchIndex {
  documentId: string;
  terms: IndexTerm[];
  entities: LegalEntity[];
  concepts: ConceptReference[];
  relationships: RelationshipIndex[];
  lastUpdated: Date;
}

export interface IndexTerm {
  term: string;
  frequency: number;
  positions: TermPosition[];
  importance: number;
  category: 'legal' | 'factual' | 'procedural' | 'general';
}

export interface TermPosition {
  pageNumber: number;
  paragraphIndex: number;
  sentenceIndex: number;
  wordIndex: number;
}

export interface ConceptReference {
  concept: string;
  type: 'legal_concept' | 'business_concept' | 'procedural_concept';
  relevance: number;
  instances: DocumentReference[];
}

export interface RelationshipIndex {
  subjectId: string;
  objectId: string;
  relationshipType: string;
  strength: number;
  evidence: DocumentReference[];
}

// Configuration and options
export interface AnalysisConfiguration {
  enableIRAC: boolean;
  enableEntityExtraction: boolean;
  enableTableExtraction: boolean;
  enableChronologyAnalysis: boolean;
  enablePersonAnalysis: boolean;
  enableUncertaintyQuantification: boolean;
  targetConfidence: number;
  jurisdiction: string;
  practiceArea: string;
  analysisDepth: 'quick' | 'standard' | 'comprehensive' | 'expert';
  qualityThreshold: number;
  maxProcessingTime: number;
  memoryLimit: number;
}

export interface ProcessingOptions {
  enableOCR: boolean;
  enableParallelProcessing: boolean;
  enableCaching: boolean;
  enableProgressCallbacks: boolean;
  enableValidation: boolean;
  retryAttempts: number;
  timeoutMs: number;
  abortSignal?: AbortSignal;
}

// Progress and status
export interface AnalysisProgress {
  stage: 'initializing' | 'extracting' | 'analyzing' | 'validating' | 'finalizing' | 'complete';
  percentage: number;
  currentTask: string;
  estimatedTimeRemaining: number;
  processingRate: number;
  statistics: Partial<ProcessingStatistics>;
  warnings: string[];
  errors: string[];
}

// Result aggregation
export interface StructuredAnalysisData {
  documents: ProcessedDocument[];
  globalEntities: LegalEntity[];
  globalTables: LegalTable[];
  globalIssues: LegalIssueAnalysis[];
  globalPersons: PersonAnalysis[];
  globalChronology: ChronologyAnalysis;
  globalKeyPoints: KeyPointAnalysis[];
  qualityMetrics: QualityMetrics;
  processingStats: ProcessingStatistics;
  configuration: AnalysisConfiguration;
}

export interface ProcessedDocument {
  id: string;
  title: string;
  content: string;
  entities: LegalEntity[];
  tables: LegalTable[];
  metadata: DocumentMetadata;
  quality: QualityMetrics;
  extractionResult: ExtractionResult;
}

export interface ExtractionResult {
  text: string;
  sections: DocumentSection[];
  tables: LegalTable[];
  entities: LegalEntity[];
  metadata: DocumentMetadata;
  structure: DocumentStructure;
  quality: QualityMetrics;
  method: string;
  processingTime: number;
}

export interface DocumentSection {
  title: string;
  content: string;
  level: number;
  pageStart: number;
  pageEnd: number;
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'footer' | 'header';
}

export interface DocumentStructure {
  headings: string[];
  paragraphs: number;
  pageBreaks: number[];
  sections: number;
  hasTableOfContents: boolean;
  hasIndex: boolean;
  hasFootnotes: boolean;
}

// Export utility type for array replacements
export type StrictArray<T> = T[];
export type LegalEntityArray = StrictArray<LegalEntity>;
export type LegalTableArray = StrictArray<LegalTable>;
export type LegalIssueArray = StrictArray<LegalIssueAnalysis>;
export type PersonAnalysisArray = StrictArray<PersonAnalysis>;
export type ChronologyEventArray = StrictArray<ChronologyEventDetailed>;
export type KeyPointArray = StrictArray<KeyPointAnalysis>;
export type DocumentArray = StrictArray<ProcessedDocument>;
export type MetadataArray = StrictArray<DocumentMetadata>;