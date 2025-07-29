import { Case, CaseDocument, KeyPoint, ChronologyEvent, LegalAuthority, Person, Issue } from '../types';
import { indexedDBManager } from './indexedDB';

const STORAGE_KEYS = {
  CASES: 'barrister_cases',
  DOCUMENTS: 'case_documents',
  KEY_POINTS: 'key_points',
  CHRONOLOGY: 'chronology_events',
  AUTHORITIES: 'legal_authorities',
  PERSONS: 'case_persons',
  ISSUES: 'case_issues'
};

export const storage = {
  getCases: async (): Promise<Case[]> => {
    try {
      const cases = await indexedDBManager.getCases();
      if (cases.length > 0) return cases;
      
      // Fallback to localStorage for migration
      const data = localStorage.getItem(STORAGE_KEYS.CASES);
      const localCases = data ? JSON.parse(data) : [];
      
      // Migrate to IndexedDB
      if (localCases.length > 0) {
        for (const caseData of localCases) {
          await indexedDBManager.storeCase(caseData);
        }
        localStorage.removeItem(STORAGE_KEYS.CASES); // Clean up
      }
      
      return localCases;
    } catch (error) {
      console.error('Failed to get cases from IndexedDB, falling back to localStorage:', error);
      const data = localStorage.getItem(STORAGE_KEYS.CASES);
      return data ? JSON.parse(data) : [];
    }
  },

  getCasesSync: (): Case[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CASES);
    return data ? JSON.parse(data) : [];
  },

  saveCase: async (caseData: Case): Promise<void> => {
    try {
      await indexedDBManager.storeCase(caseData);
    } catch (error) {
      console.error('Failed to save case to IndexedDB, falling back to localStorage:', error);
      const cases = storage.getCasesSync();
      const index = cases.findIndex(c => c.id === caseData.id);
      if (index !== -1) {
        cases[index] = caseData;
      } else {
        cases.push(caseData);
      }
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    }
  },

  deleteCase: async (caseId: string): Promise<void> => {
    try {
      await indexedDBManager.deleteCase(caseId);
    } catch (error) {
      console.error('Failed to delete case from IndexedDB, falling back to localStorage:', error);
      const cases = storage.getCasesSync().filter(c => c.id !== caseId);
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
    }
  },

  getDocuments: (caseId?: string): CaseDocument[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    const docs = data ? JSON.parse(data) : [];
    return caseId ? docs.filter((d: CaseDocument) => d.caseId === caseId) : docs;
  },

  getDocumentsAsync: async (caseId: string): Promise<CaseDocument[]> => {
    try {
      // Try IndexedDB first
      const docs = await indexedDBManager.getDocuments(caseId);
      console.log(`📄 IndexedDB returned ${docs.length} documents for case ${caseId}`);
      if (docs.length > 0) return docs;
      
      // Fallback to localStorage
      const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      const localDocs = data ? JSON.parse(data) : [];
      const filteredDocs = localDocs.filter((d: CaseDocument) => d.caseId === caseId);
      console.log(`📄 localStorage returned ${filteredDocs.length} documents for case ${caseId}`);
      return filteredDocs;
    } catch (error) {
      console.error('Failed to get documents from IndexedDB, falling back to localStorage:', error);
      const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      const docs = data ? JSON.parse(data) : [];
      return docs.filter((d: CaseDocument) => d.caseId === caseId);
    }
  },

  // Alias for compatibility with EnhancedDocumentManager
  getCaseDocuments: async (caseId: string): Promise<CaseDocument[]> => {
    return storage.getDocumentsAsync(caseId);
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
  },

  getPersons: (caseId?: string): Person[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PERSONS);
    const persons = data ? JSON.parse(data) : [];
    return caseId ? persons.filter((p: Person) => p.caseId === caseId) : persons;
  },

  savePerson: (person: Person): void => {
    const persons = storage.getPersons();
    const index = persons.findIndex(p => p.id === person.id);
    if (index !== -1) {
      persons[index] = person;
    } else {
      persons.push(person);
    }
    localStorage.setItem(STORAGE_KEYS.PERSONS, JSON.stringify(persons));
  },

  deletePerson: (personId: string): void => {
    const persons = storage.getPersons().filter(p => p.id !== personId);
    localStorage.setItem(STORAGE_KEYS.PERSONS, JSON.stringify(persons));
  },

  getIssues: (caseId?: string): Issue[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ISSUES);
    const issues = data ? JSON.parse(data) : [];
    return caseId ? issues.filter((i: Issue) => i.caseId === caseId) : issues;
  },

  saveIssue: (issue: Issue): void => {
    const issues = storage.getIssues();
    const index = issues.findIndex(i => i.id === issue.id);
    if (index !== -1) {
      issues[index] = issue;
    } else {
      issues.push(issue);
    }
    localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));
  },

  deleteIssue: (issueId: string): void => {
    const issues = storage.getIssues().filter(i => i.id !== issueId);
    localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));
  }
};