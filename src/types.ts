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
  type: 'witness_statement' | 'expert_report' | 'exhibit' | 'authority' | 'skeleton_argument' | 'other';
  content: string;
  pageReferences?: string;
  notes?: string;
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