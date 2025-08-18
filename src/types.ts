export interface Case {
  id: string;
  title: string;
  description?: string;
  courtReference?: string;
  client?: string;
  opponent?: string;
  court?: string;
  hearingDate?: string;
  judge?: string;
  status: 'active' | 'preparation' | 'ready' | 'concluded';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date | string;
  updatedAt: Date | string;
  tags?: string[];
  documents?: CaseDocument[];
  timeline?: ChronologyEvent[];
  metadata?: {
    classification?: any;
    practiceArea?: 'criminal' | 'civil' | 'poca' | 'mixed';
    aiConfidence?: number;
    suggestedFeatures?: string[];
    estimatedDuration?: string;
    fundingOptions?: string[];
    [key: string]: any;
  };
}

export interface CaseDocument {
  id: string;
  caseId: string;
  title: string;
  category: 'claimant' | 'defendant' | 'pleadings' | 'hearing_bundle' | 'authorities' | 'orders_judgments';
  type: 'witness_statement' | 'exhibit' | 'skeleton_argument' | 'particulars' | 'defence' | 'reply' | 'hearing_bundle' | 'authorities' | 'order' | 'judgment' | 'letter' | 'ruling' | 'memo';
  content: string;
  pageReferences?: string;
  notes?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileContent?: string;
  fileId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
}

export interface KeyPoint {
  id: string;
  caseId: string;
  category: 'opening' | 'examination' | 'cross_examination' | 'closing' | 'legal_argument';
  point: string;
  supportingDocs: string[];
  order: number;
}

export interface ChronologyEvent {
  id: string;
  caseId: string;
  date: string;
  description: string;
  significance: string;
  documentRef?: string;
}

export interface LegalAuthority {
  id: string;
  caseId: string;
  citation: string;
  principle: string;
  relevance: string;
  paragraph?: string;
  // File attachment support
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileId?: string;
  fileContent?: string;
  // Folder linking support
  folderPath?: string;
  isLinkedFromFolder?: boolean;
  // Additional metadata
  court?: string;
  judges?: string;
  year?: string;
  jurisdiction?: 'UK' | 'EU' | 'US' | 'Commonwealth' | 'Other';
  authorityType?: 'case' | 'statute' | 'regulation' | 'directive' | 'treaty' | 'other';
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Cross-references
  relatedAuthorities?: string[];
  citedInDocuments?: string[];
}

export interface PersonRelationship {
  targetPersonId: string;
  type: 'represents' | 'opposing_counsel' | 'witness_for' | 'expert_for' | 'employed_by' | 'related_to' | 'reports_to' | 'colleague_of' | 'adverse_to' | 'other';
  description?: string;
}

export interface Person {
  id: string;
  caseId: string;
  name: string;
  role: 'claimant' | 'defendant' | 'witness' | 'expert' | 'lawyer' | 'judge' | 'other';
  description: string;
  relevance: string;
  contactInfo?: string;
  organization?: string;
  email?: string;
  phone?: string;
  documentRefs: string[];
  relationships?: PersonRelationship[];
  firstMentionDate?: string;
  keyQuotes?: string[];
  tags?: string[];
  updatedAt?: string;
  createdAt?: string;
}

export interface IssueRelationship {
  targetIssueId: string;
  type: 'depends_on' | 'blocks' | 'related_to' | 'contradicts' | 'supports' | 'sub_issue_of' | 'parent_of';
  description?: string;
}

export interface Issue {
  id: string;
  caseId: string;
  title: string;
  description: string;
  category: 'factual' | 'legal' | 'quantum' | 'procedural';
  priority: 'high' | 'medium' | 'low';
  status: 'unresolved' | 'disputed' | 'agreed' | 'resolved';
  claimantPosition?: string;
  defendantPosition?: string;
  documentRefs: string[];
  relatedIssues: string[];
  relationships?: IssueRelationship[];
  tags?: string[];
  assignedTo?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  evidenceNeeded?: string[];
  legalAuthorities?: string[];
}

export interface AIAnalysisResult {
  chronologyEvents: Omit<ChronologyEvent, 'id' | 'caseId'>[];
  persons: Omit<Person, 'id' | 'caseId'>[];
  issues: Omit<Issue, 'id' | 'caseId'>[];
  keyPoints: Omit<KeyPoint, 'id' | 'caseId'>[];
  authorities: Omit<LegalAuthority, 'id' | 'caseId'>[];
  confidence: number;
  processingTime: number;
  summary?: string;
  metadata?: {
    analysisDate?: string;
    version?: string;
    modelUsed?: string;
    enhancedExtraction?: boolean;
    extractionQuality?: any;
    processingStats?: any;
    [key: string]: any;
  };
}