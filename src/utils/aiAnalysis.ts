import { CaseDocument, AIAnalysisResult, ChronologyEvent, Person, Issue, KeyPoint, LegalAuthority } from '../types';
import { dataAnonymizer, AnonymizationMapping } from './dataAnonymizer';
import { indexedDBManager } from './indexedDB';
import { PDFTextExtractor } from './pdfExtractor';
import { unifiedAIClient } from './unifiedAIClient';

class AIDocumentAnalyzer {
  // private apiEndpoint = '/api/analyze'; // Reserved for future AI service endpoint
  private globalMapping: AnonymizationMapping | null = null;
  private useOllama: boolean = true; // Set to false to use pattern matching
  private ollamaModel: string = 'llama3.2:1b';
  private analysisCache = new Map<string, any>(); // Cache for document analysis results
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes cache for better performance
  private fastMode: boolean = true; // Enable fast mode by default for better performance

  /**
   * Configure AI analysis settings
   */
  setOllamaSettings(useOllama: boolean, model: string = 'llama3.2:1b', fastMode: boolean = false) {
    this.useOllama = useOllama;
    this.ollamaModel = model;
    this.fastMode = fastMode;
    console.log(`🤖 AI analysis configured: ${useOllama ? 'Ollama' : 'Pattern matching'}, Model: ${model}, Fast mode: ${fastMode}`);
  }
  

  /**
   * Get available Ollama models
   */
  async getAvailableModels() {
    try {
      return await unifiedAIClient.getModels();
    } catch (error) {
      console.error('Failed to get Ollama models:', error);
      return [];
    }
  }

  async analyzeDocuments(
    documents: CaseDocument[], 
    useAnonymization: boolean = true,
    progressCallback?: (stage: string, progress: number) => void
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔒 Starting ${useAnonymization ? 'secure' : 'direct'} AI analysis of ${documents.length} documents...`);
      
      let processedDocuments = documents;
      let combinedMapping: AnonymizationMapping | null = null;

      if (useAnonymization) {
        // Anonymize all document content
        const anonymizationResults = this.anonymizeDocuments(documents);
        processedDocuments = anonymizationResults.documents;
        combinedMapping = anonymizationResults.mapping;
        
        const stats = dataAnonymizer.getAnonymizationStats(combinedMapping);
        console.log('🎭 Anonymization complete:', stats);
      }

      // Perform AI analysis on anonymized data
      const result = this.useOllama 
        ? await this.ollamaAIAnalysis(processedDocuments, progressCallback)
        : await this.simulateAIAnalysis(processedDocuments);
      
      if (useAnonymization && combinedMapping) {
        // De-anonymize the results
        result.chronologyEvents = this.deanonymizeChronologyEvents(result.chronologyEvents, combinedMapping);
        result.persons = this.deanonymizePersons(result.persons, combinedMapping);
        result.issues = this.deanonymizeIssues(result.issues, combinedMapping);
        result.keyPoints = this.deanonymizeKeyPoints(result.keyPoints, combinedMapping);
        result.authorities = this.deanonymizeAuthorities(result.authorities, combinedMapping);
        
        console.log('🔓 De-anonymization complete');
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...result,
        processingTime,
        confidence: 0.85 // Simulated confidence score
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error('Failed to analyze documents with AI');
    }
  }

  private anonymizeDocuments(documents: CaseDocument[]): { 
    documents: CaseDocument[], 
    mapping: AnonymizationMapping 
  } {
    // Combine all document content for consistent anonymization
    const allContent = documents.map(doc => doc.content + (doc.fileContent || '')).join('\n\n');
    
    // Perform anonymization on combined content
    const { anonymizedText, mapping } = dataAnonymizer.anonymize(allContent);
    
    // Split back into individual documents and apply anonymization
    const anonymizedDocuments = documents.map(doc => {
      const originalContent = doc.content + (doc.fileContent || '');
      const { anonymizedText: docAnonymized } = dataAnonymizer.anonymize(originalContent);
      
      return {
        ...doc,
        content: docAnonymized.substring(0, doc.content.length),
        fileContent: doc.fileContent ? docAnonymized.substring(doc.content.length) : undefined,
        title: this.anonymizeTitle(doc.title, mapping)
      };
    });

    // Store mapping for later use
    this.globalMapping = mapping;
    
    return {
      documents: anonymizedDocuments,
      mapping
    };
  }

  private anonymizeTitle(title: string, mapping: AnonymizationMapping): string {
    const { anonymizedText } = dataAnonymizer.anonymize(title);
    return anonymizedText;
  }

  private async readFileAsText(file: File): Promise<string> {
    // Handle PDF files with PDF.js extraction
    if (PDFTextExtractor.isPDF(file)) {
      console.log(`🔍 Detected PDF file: ${file.name}, extracting text...`);
      return await PDFTextExtractor.extractText(file);
    }
    
    // Handle text files
    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const result = event.target?.result as string;
          resolve(result || '');
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
      });
    }
    
    // Handle Word documents (basic attempt)
    if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      // For now, return placeholder - could add docx parsing later
      return `[Word Document: ${file.name}, Size: ${Math.round(file.size / 1024)}KB - Word document text extraction not yet implemented]`;
    }
    
    // For other file types, return metadata
    return `[File: ${file.name}, Type: ${file.type}, Size: ${Math.round(file.size / 1024)}KB - Binary file, text extraction not supported]`;
  }

  private async ollamaAIAnalysis(
    documents: CaseDocument[],
    progressCallback?: (stage: string, progress: number) => void
  ): Promise<Omit<AIAnalysisResult, 'confidence' | 'processingTime'>> {
    console.log('🤖 Starting Ollama AI analysis...');

    // Check if AI is available
    const isAIAvailable = await unifiedAIClient.isAvailable();
    if (!isAIAvailable) {
      console.warn('⚠️ AI not available, falling back to pattern matching');
      return this.simulateAIAnalysis(documents);
    }

    console.log(`✅ AI is available, using model: ${this.ollamaModel}`);

    // Ensure model is available
    try {
      await unifiedAIClient.ensureModel(this.ollamaModel);
    } catch (error) {
      console.warn('Model check failed, continuing anyway:', error);
    }

    const chronologyEvents: Omit<ChronologyEvent, 'id' | 'caseId'>[] = [];
    const persons: Omit<Person, 'id' | 'caseId'>[] = [];
    const issues: Omit<Issue, 'id' | 'caseId'>[] = [];
    const keyPoints: Omit<KeyPoint, 'id' | 'caseId'>[] = [];
    const authorities: Omit<LegalAuthority, 'id' | 'caseId'>[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      let content = doc.content || '';
      
      // Update progress
      if (progressCallback) {
        const docProgress = ((i + 1) / documents.length) * 100;
        progressCallback(`Analyzing document ${i + 1}/${documents.length}: ${doc.title}`, docProgress);
      }
      
      // Add file content if available in the document
      if (doc.fileContent) {
        content += '\n\n' + doc.fileContent;
        console.log(`📄 Added fileContent from ${doc.title}: ${doc.fileContent.length} characters (${doc.id.startsWith('scan_') ? 'scanned' : 'other'})`);
      }
      
      // If there's a fileId, try to read the actual file from IndexedDB
      if (doc.fileId) {
        try {
          const file = await indexedDBManager.getFile(doc.fileId);
          if (file) {
            const fileText = await this.readFileAsText(file);
            content += '\n\n' + fileText;
            console.log(`📄 Read file content from ${file.name}: ${fileText.length} characters`);
          }
        } catch (error) {
          console.warn(`Failed to read file for document ${doc.id}:`, error);
        }
      }
      
      console.log(`🤖 Analyzing document ${i + 1}/${documents.length}: "${doc.title}" (${content.length} characters)`);
      
      if (content.trim().length === 0) {
        console.warn(`⚠️ Document "${doc.title}" has no content to analyze`);
        continue;
      }

      // Optimize content size for Ollama (models have context limits)
      const maxContentLength = this.fastMode ? 4000 : 8000; // Smaller chunks in fast mode
      if (content.length > maxContentLength) {
        content = this.optimizeContentForAI(content, maxContentLength);
        console.log(`📊 Content optimized to ${maxContentLength} characters for Ollama processing`);
      }

      try {
        // Check cache first
        const cacheKey = `${doc.id}_${content.length}_${this.ollamaModel}`;
        const cachedResult = this.analysisCache.get(cacheKey);
        
        let extractedData;
        if (cachedResult && (Date.now() - cachedResult.timestamp) < this.cacheTimeout) {
          console.log('📦 Using cached analysis result');
          extractedData = cachedResult.data;
        } else {
          // Try combined extraction first with speed-optimized settings
          console.log('🚀 Attempting combined extraction...');
          
          const startExtraction = Date.now();
          
          // Use speed-optimized options for faster processing
          const speedOptions = this.fastMode ? ollamaClient.getSpeedOptimizedOptions() : {
            temperature: 0.1,
            max_tokens: 1200
          };
          
          // Use unified AI client for entity extraction
          const entityResult = await unifiedAIClient.extractEntities(content, 'legal');
          
          // Transform to match expected format
          extractedData = {
            chronologyEvents: entityResult.chronologyEvents,
            persons: entityResult.persons,
            issues: entityResult.issues,
            keyPoints: [], // Will be extracted separately if needed
            authorities: entityResult.authorities
          };
          const extractionTime = Date.now() - startExtraction;
          console.log(`✅ Combined extraction completed in ${extractionTime}ms`);
          
          // Check if extraction returned meaningful results
          const totalItems = extractedData.chronologyEvents.length + 
                           extractedData.persons.length + 
                           extractedData.issues.length + 
                           extractedData.keyPoints.length + 
                           extractedData.authorities.length;
          
          // If combined extraction failed or returned no results, fall back to individual calls
          if (totalItems === 0 && content.length > 100) {
            console.log('⚠️ Combined extraction returned no results, trying individual extraction...');
            
            const [
              ollamaEvents,
              ollamaPersons,
              ollamaIssues,
              ollamaKeyPoints,
              ollamaAuthorities
            ] = await Promise.all([
              ollamaClient.extractChronologyEvents(content, this.ollamaModel).catch(() => []),
              ollamaClient.extractPersons(content, this.ollamaModel).catch(() => []),
              ollamaClient.extractIssues(content, this.ollamaModel).catch(() => []),
              ollamaClient.extractKeyPoints(content, this.ollamaModel).catch(() => []),
              ollamaClient.extractAuthorities(content, this.ollamaModel).catch(() => [])
            ]);
            
            extractedData = {
              chronologyEvents: ollamaEvents,
              persons: ollamaPersons,
              issues: ollamaIssues,
              keyPoints: ollamaKeyPoints,
              authorities: ollamaAuthorities
            };
            
            console.log(`🔄 Individual extraction completed - found ${ollamaEvents.length + ollamaPersons.length + ollamaIssues.length + ollamaKeyPoints.length + ollamaAuthorities.length} total items`);
          }
          
          // Cache the result
          this.analysisCache.set(cacheKey, {
            data: extractedData,
            timestamp: Date.now()
          });
        }
        
        const {
          chronologyEvents: ollamaEvents,
          persons: ollamaPersons,
          issues: ollamaIssues,
          keyPoints: ollamaKeyPoints,
          authorities: ollamaAuthorities
        } = extractedData;

        // Process chronology events
        console.log(`✅ Found ${ollamaEvents.length} chronology events`);
        for (const event of ollamaEvents) {
          chronologyEvents.push({
            date: event.date,
            description: event.description,
            significance: event.significance,
            documentRef: doc.id
          });
        }

        // Process persons
        console.log(`✅ Found ${ollamaPersons.length} persons`);
        for (const person of ollamaPersons) {
          persons.push({
            name: person.name,
            role: person.role,
            description: person.description,
            relevance: person.relevance,
            documentRefs: [doc.id]
          });
        }

        // Process issues
        console.log(`✅ Found ${ollamaIssues.length} issues`);
        for (const issue of ollamaIssues) {
          issues.push({
            title: issue.title,
            description: issue.description,
            category: issue.category,
            priority: issue.priority,
            status: issue.status,
            documentRefs: [doc.id],
            relatedIssues: []
          });
        }

        // Process key points
        console.log(`✅ Found ${ollamaKeyPoints.length} key points`);
        for (const keyPoint of ollamaKeyPoints) {
          keyPoints.push({
            category: keyPoint.category,
            point: keyPoint.point,
            supportingDocs: [doc.id],
            order: keyPoint.order
          });
        }

        // Process authorities
        console.log(`✅ Found ${ollamaAuthorities.length} authorities`);
        for (const authority of ollamaAuthorities) {
          authorities.push({
            citation: authority.citation,
            principle: authority.principle,
            relevance: authority.relevance,
            paragraph: authority.paragraph
          });
        }
        console.log(`✅ Found ${ollamaAuthorities.length} authorities`);

      } catch (error) {
        console.error(`❌ Ollama analysis failed for document "${doc.title}":`, error);
        console.log('🔄 Falling back to pattern matching for this document...');
        
        // Fallback to pattern matching for this document
        const fallbackEvents = this.extractChronologyEvents(content, doc.id);
        chronologyEvents.push(...fallbackEvents);
        
        const fallbackPersons = this.extractPersons(content, doc.id);
        persons.push(...fallbackPersons);
        
        const fallbackIssues = this.extractIssues(content, doc.id, doc.category);
        issues.push(...fallbackIssues);
        
        const fallbackKeyPoints = this.extractKeyPoints(content, doc.id, doc.category);
        keyPoints.push(...fallbackKeyPoints);
        
        const fallbackAuthorities = this.extractAuthorities(content, doc.id);
        authorities.push(...fallbackAuthorities);
      }

      // Minimal delay between documents in fast mode
      if (i < documents.length - 1 && !this.fastMode) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Only delay in non-fast mode
      }
    }

    console.log('🎉 Ollama analysis complete!');
    console.log(`📊 Results: ${chronologyEvents.length} events, ${persons.length} persons, ${issues.length} issues, ${keyPoints.length} key points, ${authorities.length} authorities`);

    return {
      chronologyEvents: this.deduplicateEvents(chronologyEvents),
      persons: this.deduplicatePersons(persons),
      issues: this.deduplicateIssues(issues),
      keyPoints: this.deduplicateKeyPoints(keyPoints),
      authorities: this.deduplicateAuthorities(authorities)
    };
  }

  private async simulateAIAnalysis(documents: CaseDocument[]): Promise<Omit<AIAnalysisResult, 'confidence' | 'processingTime'>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const chronologyEvents: Omit<ChronologyEvent, 'id' | 'caseId'>[] = [];
    const persons: Omit<Person, 'id' | 'caseId'>[] = [];
    const issues: Omit<Issue, 'id' | 'caseId'>[] = [];
    const keyPoints: Omit<KeyPoint, 'id' | 'caseId'>[] = [];
    const authorities: Omit<LegalAuthority, 'id' | 'caseId'>[] = [];
    
    for (const doc of documents) {
      let content = doc.content || '';
      
      // Add file content if available in the document
      if (doc.fileContent) {
        content += '\n\n' + doc.fileContent;
      }
      
      // If there's a fileId, try to read the actual file from IndexedDB
      if (doc.fileId) {
        try {
          const file = await indexedDBManager.getFile(doc.fileId);
          if (file) {
            const fileText = await this.readFileAsText(file);
            content += '\n\n' + fileText;
            console.log(`📄 Read file content from ${file.name}: ${fileText.length} characters`);
          }
        } catch (error) {
          console.warn(`Failed to read file for document ${doc.id}:`, error);
        }
      }
      
      console.log(`📋 Analyzing document "${doc.title}": ${content.length} characters total`);
      
      if (content.trim().length === 0) {
        console.warn(`⚠️  Document "${doc.title}" has no content to analyze`);
        continue;
      }
      
      // Extract chronology events
      const events = this.extractChronologyEvents(content, doc.id);
      console.log(`📅 Found ${events.length} chronology events in "${doc.title}"`);
      chronologyEvents.push(...events);
      
      // Extract persons
      const people = this.extractPersons(content, doc.id);
      console.log(`👥 Found ${people.length} persons in "${doc.title}"`);
      persons.push(...people);
      
      // Extract issues
      const docIssues = this.extractIssues(content, doc.id, doc.category);
      console.log(`⚖️ Found ${docIssues.length} issues in "${doc.title}"`);
      issues.push(...docIssues);
      
      // Extract key points
      const docKeyPoints = this.extractKeyPoints(content, doc.id, doc.category);
      console.log(`🔑 Found ${docKeyPoints.length} key points in "${doc.title}"`);
      keyPoints.push(...docKeyPoints);
      
      // Extract legal authorities
      const docAuthorities = this.extractAuthorities(content, doc.id);
      console.log(`📚 Found ${docAuthorities.length} authorities in "${doc.title}"`);
      authorities.push(...docAuthorities);
    }
    
    return {
      chronologyEvents: this.deduplicateEvents(chronologyEvents),
      persons: this.deduplicatePersons(persons),
      issues: this.deduplicateIssues(issues),
      keyPoints: this.deduplicateKeyPoints(keyPoints),
      authorities: this.deduplicateAuthorities(authorities)
    };
  }

  private extractChronologyEvents(content: string, documentRef: string): Omit<ChronologyEvent, 'id' | 'caseId'>[] {
    const events: Omit<ChronologyEvent, 'id' | 'caseId'>[] = [];
    
    // Look for date patterns and associated events
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{1,2}-\d{1,2}-\d{4})/g,
      /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
      /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/gi
    ];
    
    const sentences = content.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      for (const pattern of datePatterns) {
        const matches = sentence.match(pattern);
        if (matches) {
          for (const match of matches) {
            const description = sentence.trim();
            if (description.length > 20 && description.length < 500) {
              events.push({
                date: this.normalizeDate(match),
                description: description,
                significance: this.assessSignificance(description),
                documentRef
              });
            }
          }
        }
      }
    }
    
    return events;
  }

  private deanonymizeChronologyEvents(
    events: Omit<ChronologyEvent, 'id' | 'caseId'>[], 
    mapping: AnonymizationMapping
  ): Omit<ChronologyEvent, 'id' | 'caseId'>[] {
    return events.map(event => ({
      ...event,
      description: dataAnonymizer.deanonymize(event.description, mapping),
      significance: dataAnonymizer.deanonymize(event.significance, mapping)
    }));
  }

  private deanonymizePersons(
    persons: Omit<Person, 'id' | 'caseId'>[], 
    mapping: AnonymizationMapping
  ): Omit<Person, 'id' | 'caseId'>[] {
    return persons.map(person => ({
      ...person,
      name: dataAnonymizer.deanonymize(person.name, mapping),
      description: dataAnonymizer.deanonymize(person.description, mapping),
      relevance: dataAnonymizer.deanonymize(person.relevance, mapping),
      contactInfo: person.contactInfo ? dataAnonymizer.deanonymize(person.contactInfo, mapping) : undefined
    }));
  }

  private deanonymizeIssues(
    issues: Omit<Issue, 'id' | 'caseId'>[], 
    mapping: AnonymizationMapping
  ): Omit<Issue, 'id' | 'caseId'>[] {
    return issues.map(issue => ({
      ...issue,
      title: dataAnonymizer.deanonymize(issue.title, mapping),
      description: dataAnonymizer.deanonymize(issue.description, mapping),
      claimantPosition: issue.claimantPosition ? dataAnonymizer.deanonymize(issue.claimantPosition, mapping) : undefined,
      defendantPosition: issue.defendantPosition ? dataAnonymizer.deanonymize(issue.defendantPosition, mapping) : undefined
    }));
  }

  private deanonymizeKeyPoints(
    keyPoints: Omit<KeyPoint, 'id' | 'caseId'>[], 
    mapping: AnonymizationMapping
  ): Omit<KeyPoint, 'id' | 'caseId'>[] {
    return keyPoints.map(keyPoint => ({
      ...keyPoint,
      point: dataAnonymizer.deanonymize(keyPoint.point, mapping)
    }));
  }

  private deanonymizeAuthorities(
    authorities: Omit<LegalAuthority, 'id' | 'caseId'>[], 
    mapping: AnonymizationMapping
  ): Omit<LegalAuthority, 'id' | 'caseId'>[] {
    return authorities.map(authority => ({
      ...authority,
      citation: dataAnonymizer.deanonymize(authority.citation, mapping),
      principle: dataAnonymizer.deanonymize(authority.principle, mapping),
      relevance: dataAnonymizer.deanonymize(authority.relevance, mapping),
      paragraph: authority.paragraph ? dataAnonymizer.deanonymize(authority.paragraph, mapping) : undefined
    }));
  }

  private extractPersons(content: string, documentRef: string): Omit<Person, 'id' | 'caseId'>[] {
    const persons: Omit<Person, 'id' | 'caseId'>[] = [];
    
    // Look for name patterns
    const namePatterns = [
      /Mr\.?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
      /Mrs\.?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
      /Ms\.?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
      /Dr\.?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+(?:testified|stated|claimed|argued|said))/g
    ];
    
    const foundNames = new Set<string>();
    
    for (const pattern of namePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1] || match[0].replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/, '');
        if (!foundNames.has(name)) {
          foundNames.add(name);
          
          persons.push({
            name: name,
            role: this.inferRole(content, name),
            description: this.extractPersonDescription(content, name),
            relevance: this.assessPersonRelevance(content, name),
            documentRefs: [documentRef]
          });
        }
      }
    }
    
    return persons;
  }

  private extractIssues(content: string, documentRef: string, category: string): Omit<Issue, 'id' | 'caseId'>[] {
    const issues: Omit<Issue, 'id' | 'caseId'>[] = [];
    
    // Look for issue indicators
    const issuePatterns = [
      /(?:dispute|disagreement|contention|issue|question)(?:\s+(?:about|regarding|concerning|over))?\s+([^.!?]+)/gi,
      /(?:whether|if)\s+([^.!?]+)/gi,
      /(?:alleged|allegation)(?:\s+that)?\s+([^.!?]+)/gi,
      /(?:breach|violation)\s+(?:of\s+)?([^.!?]+)/gi,
      /(?:claim|damages)\s+(?:for|regarding)\s+([^.!?]+)/gi
    ];
    
    for (const pattern of issuePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const issueText = match[1];
        if (issueText && issueText.length > 10 && issueText.length < 300) {
          issues.push({
            title: this.generateIssueTitle(issueText),
            description: issueText.trim(),
            category: this.categorizeIssue(issueText, category),
            priority: this.assessIssuePriority(issueText),
            status: 'unresolved',
            documentRefs: [documentRef],
            relatedIssues: []
          });
        }
      }
    }
    
    return issues;
  }

  private normalizeDate(dateStr: string): string {
    // Convert various date formats to YYYY-MM-DD
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Fallback for manual parsing
    }
    
    return dateStr; // Return original if parsing fails
  }

  private assessSignificance(description: string): string {
    const keywords = ['contract', 'agreement', 'breach', 'payment', 'delivery', 'termination', 'dispute', 'claim'];
    const foundKeywords = keywords.filter(keyword => 
      description.toLowerCase().includes(keyword)
    );
    
    if (foundKeywords.length > 0) {
      return `Key event involving: ${foundKeywords.join(', ')}`;
    }
    
    return 'General event requiring review';
  }

  private inferRole(content: string, name: string): Person['role'] {
    const context = this.getNameContext(content, name);
    
    if (context.includes('claimant') || context.includes('plaintiff')) return 'claimant';
    if (context.includes('defendant')) return 'defendant';
    if (context.includes('witness') || context.includes('testified')) return 'witness';
    if (context.includes('expert') || context.includes('doctor') || context.includes('professor')) return 'expert';
    if (context.includes('solicitor') || context.includes('barrister') || context.includes('counsel')) return 'lawyer';
    if (context.includes('judge') || context.includes('honour')) return 'judge';
    
    return 'other';
  }

  private getNameContext(content: string, name: string): string {
    const nameIndex = content.toLowerCase().indexOf(name.toLowerCase());
    if (nameIndex === -1) return '';
    
    const start = Math.max(0, nameIndex - 100);
    const end = Math.min(content.length, nameIndex + name.length + 100);
    
    return content.substring(start, end).toLowerCase();
  }

  private extractPersonDescription(content: string, name: string): string {
    const context = this.getNameContext(content, name);
    const sentences = context.split(/[.!?]+/);
    
    // Find the sentence containing the name
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(name.toLowerCase())) {
        return sentence.trim().substring(0, 200);
      }
    }
    
    return `Person mentioned in document`;
  }

  private assessPersonRelevance(content: string, name: string): string {
    const mentions = (content.match(new RegExp(name, 'gi')) || []).length;
    
    if (mentions > 5) return 'Central figure in the case';
    if (mentions > 2) return 'Important witness or party';
    return 'Mentioned in documents';
  }

  private generateIssueTitle(issueText: string): string {
    const words = issueText.split(' ').slice(0, 8);
    return words.join(' ').replace(/[^\w\s]/g, '') + '...';
  }

  private categorizeIssue(issueText: string, documentCategory: string): Issue['category'] {
    const legalKeywords = ['law', 'statute', 'regulation', 'legal', 'jurisdiction'];
    const quantumKeywords = ['damages', 'compensation', 'amount', 'sum', 'payment', 'cost'];
    const proceduralKeywords = ['procedure', 'filing', 'deadline', 'court', 'hearing'];
    
    const text = issueText.toLowerCase();
    
    if (legalKeywords.some(keyword => text.includes(keyword))) return 'legal';
    if (quantumKeywords.some(keyword => text.includes(keyword))) return 'quantum';
    if (proceduralKeywords.some(keyword => text.includes(keyword))) return 'procedural';
    
    return 'factual';
  }

  private assessIssuePriority(issueText: string): Issue['priority'] {
    const highPriorityKeywords = ['breach', 'fundamental', 'material', 'significant', 'major'];
    const text = issueText.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => text.includes(keyword))) return 'high';
    if (text.length > 100) return 'medium';
    
    return 'low';
  }

  private deduplicateEvents(events: Omit<ChronologyEvent, 'id' | 'caseId'>[]): Omit<ChronologyEvent, 'id' | 'caseId'>[] {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = `${event.date}-${event.description.substring(0, 50)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicatePersons(persons: Omit<Person, 'id' | 'caseId'>[]): Omit<Person, 'id' | 'caseId'>[] {
    const personMap = new Map<string, Omit<Person, 'id' | 'caseId'>>();
    
    for (const person of persons) {
      const existing = personMap.get(person.name);
      if (existing) {
        // Merge document references
        existing.documentRefs = [...new Set([...existing.documentRefs, ...person.documentRefs])];
      } else {
        personMap.set(person.name, person);
      }
    }
    
    return Array.from(personMap.values());
  }

  private deduplicateIssues(issues: Omit<Issue, 'id' | 'caseId'>[]): Omit<Issue, 'id' | 'caseId'>[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
      const key = issue.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private extractKeyPoints(content: string, documentRef: string, category: string): Omit<KeyPoint, 'id' | 'caseId'>[] {
    const keyPoints: Omit<KeyPoint, 'id' | 'caseId'>[] = [];
    
    // Key point patterns
    const keyPointPatterns = [
      // Explicit key points
      /(?:key\s+point|important|crucial|significant|critical):\s*([^.!?]+)/gi,
      // Numbered points
      /\b(?:\d+\.|[a-z]\))\s+([^.!?]{20,200})/gi,
      // Strong statements
      /(?:it\s+is\s+(?:clear|evident|obvious|established)\s+that|the\s+evidence\s+shows\s+that|it\s+follows\s+that)\s+([^.!?]+)/gi,
      // Legal conclusions
      /(?:therefore|accordingly|consequently|in\s+conclusion)\s*,?\s*([^.!?]+)/gi
    ];

    for (const pattern of keyPointPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const point = match[1]?.trim();
        if (point && point.length > 10 && point.length < 500) {
          keyPoints.push({
            category: this.categorizeKeyPoint(point, category),
            point: point,
            supportingDocs: [documentRef],
            order: keyPoints.length + 1
          });
        }
      }
    }

    return keyPoints;
  }

  private extractAuthorities(content: string, documentRef: string): Omit<LegalAuthority, 'id' | 'caseId'>[] {
    const authorities: Omit<LegalAuthority, 'id' | 'caseId'>[] = [];
    
    // Legal authority patterns
    const authorityPatterns = [
      // Case citations - UK format
      /\b([A-Z][a-z]+(?:\s+v\.?\s+[A-Z][a-z]+)*)\s*(?:\[|\()?(\d{4})\]?\s*(?:EWCA|EWHC|UKSC|UKHL|QB|Ch|WLR|AC|All\s+ER)[\s\d\[\]]*\)?/gi,
      // Statute references
      /\b([A-Z][A-Za-z\s]+(?:Act|Regulations?))\s+(\d{4})/gi,
      // European cases
      /\b(C-\d+\/\d+)\s+([A-Z][a-z]+(?:\s+v\.?\s+[A-Z][a-z]+)*)/gi,
      // Paragraph references in cases
      /(?:at\s+)?(?:paragraph|para\.?|§)\s*(\d+)/gi
    ];

    for (let i = 0; i < authorityPatterns.length - 1; i++) {
      const pattern = authorityPatterns[i];
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const caseName = match[1]?.trim();
        const year = match[2]?.trim();
        
        if (caseName && year) {
          // Extract surrounding context for principle
          const matchIndex = match.index;
          const contextStart = Math.max(0, matchIndex - 200);
          const contextEnd = Math.min(content.length, matchIndex + match[0].length + 200);
          const context = content.substring(contextStart, contextEnd);
          
          authorities.push({
            citation: `${caseName} [${year}]`,
            principle: this.extractPrinciple(context, caseName),
            relevance: this.assessAuthorityRelevance(context, caseName),
            paragraph: this.extractParagraphRef(context)
          });
        }
      }
    }

    return this.deduplicateAuthorities(authorities);
  }

  private categorizeKeyPoint(point: string, documentCategory: string): KeyPoint['category'] {
    const text = point.toLowerCase();
    
    if (text.includes('examination') || text.includes('cross') || text.includes('question')) {
      return 'examination';
    }
    if (text.includes('opening') || text.includes('introduction') || text.includes('overview')) {
      return 'opening';
    }
    if (text.includes('closing') || text.includes('conclusion') || text.includes('summary')) {
      return 'closing';
    }
    if (text.includes('law') || text.includes('legal') || text.includes('statute') || text.includes('case')) {
      return 'legal_argument';
    }
    
    // Default based on document category
    if (documentCategory === 'pleadings') return 'legal_argument';
    return 'examination';
  }

  private extractPrinciple(context: string, caseName: string): string {
    // Look for sentences containing legal principles around the case mention
    const sentences = context.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(caseName.toLowerCase())) {
        // Look for principle indicators
        if (sentence.match(/(?:held|established|decided|ruled)\s+that/i)) {
          return sentence.trim().substring(0, 200);
        }
      }
    }
    
    return `Principle from ${caseName} - requires review`;
  }

  private assessAuthorityRelevance(context: string, caseName: string): string {
    const text = context.toLowerCase();
    
    if (text.includes('directly') || text.includes('precisely') || text.includes('exactly')) {
      return 'Directly on point';
    }
    if (text.includes('similar') || text.includes('analogous') || text.includes('comparable')) {
      return 'Similar factual situation';
    }
    if (text.includes('principle') || text.includes('legal test') || text.includes('approach')) {
      return 'Establishes relevant legal principle';
    }
    
    return 'Supporting authority';
  }

  private extractParagraphRef(context: string): string | undefined {
    const paraMatch = context.match(/(?:paragraph|para\.?|§)\s*(\d+)/i);
    return paraMatch ? paraMatch[1] : undefined;
  }

  private deduplicateKeyPoints(keyPoints: Omit<KeyPoint, 'id' | 'caseId'>[]): Omit<KeyPoint, 'id' | 'caseId'>[] {
    const seen = new Set<string>();
    return keyPoints.filter(keyPoint => {
      const key = keyPoint.point.substring(0, 50).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateAuthorities(authorities: Omit<LegalAuthority, 'id' | 'caseId'>[]): Omit<LegalAuthority, 'id' | 'caseId'>[] {
    const seen = new Set<string>();
    return authorities.filter(authority => {
      const key = authority.citation.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private optimizeContentForAI(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Smart content sampling: take beginning, middle, and end
    const chunkSize = Math.floor(maxLength / 3);
    const beginning = content.substring(0, chunkSize);
    const middle = content.substring(
      Math.floor(content.length / 2) - Math.floor(chunkSize / 2),
      Math.floor(content.length / 2) + Math.floor(chunkSize / 2)
    );
    const end = content.substring(content.length - chunkSize);
    
    return `${beginning}\n\n[... CONTENT TRUNCATED FOR AI PROCESSING ...]\n\n${middle}\n\n[... CONTENT TRUNCATED FOR AI PROCESSING ...]\n\n${end}`;
  }
}

export const aiAnalyzer = new AIDocumentAnalyzer();

// Make it globally accessible for settings
(window as any).aiAnalyzer = aiAnalyzer;