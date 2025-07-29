export interface Case {
  id: string;
  title: string;
  courtReference: string;
  client: string;
  opponent: string;
  court: string;
  hearingDate: string;
  judge?: string;
  createdAt: string;
  updatedAt: string;
  status: 'preparation' | 'ready' | 'concluded';
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
}

export interface Person {
  id: string;
  caseId: string;
  name: string;
  role: 'claimant' | 'defendant' | 'witness' | 'expert' | 'lawyer' | 'judge' | 'other';
  description: string;
  relevance: string;
  contactInfo?: string;
  documentRefs: string[];
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
}

export interface AIAnalysisResult {
  chronologyEvents: Omit<ChronologyEvent, 'id' | 'caseId'>[];
  persons: Omit<Person, 'id' | 'caseId'>[];
  issues: Omit<Issue, 'id' | 'caseId'>[];
  keyPoints: Omit<KeyPoint, 'id' | 'caseId'>[];
  authorities: Omit<LegalAuthority, 'id' | 'caseId'>[];
  confidence: number;
  processingTime: number;
}