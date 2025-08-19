// Core application types
export interface Case {
  id: string;
  title: string;
  client: string;
  status: 'active' | 'concluded' | 'pending';
  createdAt: string;
  updatedAt: string;
  description?: string;
  timeline?: TimelineEvent[];
  documents?: Document[];
  parties?: Party[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'deadline' | 'hearing' | 'filing' | 'meeting' | 'other';
}

export interface Document {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  uploadedAt: string;
  processedAt?: string;
  extractedText?: string;
  metadata?: DocumentMetadata;
}

export interface DocumentMetadata {
  pageCount?: number;
  wordCount?: number;
  language?: string;
  entities?: ExtractedEntity[];
  keyPoints?: string[];
}

export interface ExtractedEntity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'legal_reference';
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface Party {
  id: string;
  name: string;
  role: 'claimant' | 'defendant' | 'witness' | 'expert' | 'other';
  type: 'individual' | 'organization';
  contactInfo?: ContactInfo;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// AI and consultation types
export interface AIConfig {
  claudeApiKey?: string;
  consultationEnabled: boolean;
  fallbackMode: 'local-only' | 'error' | 'retry';
  rateLimits: {
    maxConsultationsPerHour: number;
    maxConcurrentConsultations: number;
  };
  transparency: {
    logAllConsultations: boolean;
    showRealTimeStatus: boolean;
    requireUserConsent: boolean;
  };
}

// User interface types
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  aiConfig: AIConfig;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  deadlineReminders: boolean;
  aiConsultationAlerts: boolean;
  systemUpdates: boolean;
  emailNotifications: boolean;
}

// Search and filtering types
export interface SearchFilters {
  status?: Case['status'][];
  dateRange?: {
    start: string;
    end: string;
  };
  client?: string;
  hasDocuments?: boolean;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  type: 'case' | 'document' | 'party';
  title: string;
  description: string;
  relevance: number;
  highlights: string[];
}