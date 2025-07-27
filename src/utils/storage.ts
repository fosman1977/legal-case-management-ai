import { Case, CaseDocument, KeyPoint, ChronologyEvent, LegalAuthority } from '../types';

const STORAGE_KEYS = {
  CASES: 'barrister_cases',
  DOCUMENTS: 'case_documents',
  KEY_POINTS: 'key_points',
  CHRONOLOGY: 'chronology_events',
  AUTHORITIES: 'legal_authorities'
};

export const storage = {
  getCases: (): Case[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CASES);
    return data ? JSON.parse(data) : [];
  },

  saveCase: (caseData: Case): void => {
    const cases = storage.getCases();
    const index = cases.findIndex(c => c.id === caseData.id);
    if (index !== -1) {
      cases[index] = caseData;
    } else {
      cases.push(caseData);
    }
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
  },

  deleteCase: (caseId: string): void => {
    const cases = storage.getCases().filter(c => c.id !== caseId);
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    
    storage.getDocuments(caseId).forEach(doc => 
      storage.deleteDocument(doc.id)
    );
    storage.getKeyPoints(caseId).forEach(point => 
      storage.deleteKeyPoint(point.id)
    );
    storage.getChronology(caseId).forEach(event => 
      storage.deleteChronologyEvent(event.id)
    );
    storage.getAuthorities(caseId).forEach(auth => 
      storage.deleteAuthority(auth.id)
    );
  },

  getDocuments: (caseId?: string): CaseDocument[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    const docs = data ? JSON.parse(data) : [];
    return caseId ? docs.filter((d: CaseDocument) => d.caseId === caseId) : docs;
  },

  saveDocument: (doc: CaseDocument): void => {
    const docs = storage.getDocuments();
    const index = docs.findIndex(d => d.id === doc.id);
    if (index !== -1) {
      docs[index] = doc;
    } else {
      docs.push(doc);
    }
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  },

  deleteDocument: (docId: string): void => {
    const docs = storage.getDocuments().filter(d => d.id !== docId);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  },

  getKeyPoints: (caseId?: string): KeyPoint[] => {
    const data = localStorage.getItem(STORAGE_KEYS.KEY_POINTS);
    const points = data ? JSON.parse(data) : [];
    return caseId ? points.filter((p: KeyPoint) => p.caseId === caseId) : points;
  },

  saveKeyPoint: (point: KeyPoint): void => {
    const points = storage.getKeyPoints();
    const index = points.findIndex(p => p.id === point.id);
    if (index !== -1) {
      points[index] = point;
    } else {
      points.push(point);
    }
    localStorage.setItem(STORAGE_KEYS.KEY_POINTS, JSON.stringify(points));
  },

  deleteKeyPoint: (pointId: string): void => {
    const points = storage.getKeyPoints().filter(p => p.id !== pointId);
    localStorage.setItem(STORAGE_KEYS.KEY_POINTS, JSON.stringify(points));
  },

  getChronology: (caseId?: string): ChronologyEvent[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CHRONOLOGY);
    const events = data ? JSON.parse(data) : [];
    return caseId ? events.filter((e: ChronologyEvent) => e.caseId === caseId) : events;
  },

  saveChronologyEvent: (event: ChronologyEvent): void => {
    const events = storage.getChronology();
    const index = events.findIndex(e => e.id === event.id);
    if (index !== -1) {
      events[index] = event;
    } else {
      events.push(event);
    }
    localStorage.setItem(STORAGE_KEYS.CHRONOLOGY, JSON.stringify(events));
  },

  deleteChronologyEvent: (eventId: string): void => {
    const events = storage.getChronology().filter(e => e.id !== eventId);
    localStorage.setItem(STORAGE_KEYS.CHRONOLOGY, JSON.stringify(events));
  },

  getAuthorities: (caseId?: string): LegalAuthority[] => {
    const data = localStorage.getItem(STORAGE_KEYS.AUTHORITIES);
    const authorities = data ? JSON.parse(data) : [];
    return caseId ? authorities.filter((a: LegalAuthority) => a.caseId === caseId) : authorities;
  },

  saveAuthority: (authority: LegalAuthority): void => {
    const authorities = storage.getAuthorities();
    const index = authorities.findIndex(a => a.id === authority.id);
    if (index !== -1) {
      authorities[index] = authority;
    } else {
      authorities.push(authority);
    }
    localStorage.setItem(STORAGE_KEYS.AUTHORITIES, JSON.stringify(authorities));
  },

  deleteAuthority: (authorityId: string): void => {
    const authorities = storage.getAuthorities().filter(a => a.id !== authorityId);
    localStorage.setItem(STORAGE_KEYS.AUTHORITIES, JSON.stringify(authorities));
  }
};