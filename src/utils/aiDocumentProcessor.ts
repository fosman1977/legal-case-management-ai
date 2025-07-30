import { OllamaClient } from './ollamaClient';

export interface DocumentSummary {
  executiveSummary: string;
  keyFacts: string[];
  legalIssues: string[];
  importantDates: string[];
  parties: string[];
  documentType: string;
  relevance: string;
  keyQuotes: string[];
  actionItems: string[];
}

export interface ProcessedDocument {
  summary: DocumentSummary;
  structuredContent: string;
  metadata: {
    wordCount: number;
    pageCount?: number;
    confidence: number;
    processingTime: number;
  };
}

class AIDocumentProcessor {
  private ollamaClient: OllamaClient;

  constructor() {
    this.ollamaClient = new OllamaClient();
  }

  /**
   * Process raw extracted text into structured, summarized content
   */
  async processDocument(
    rawText: string, 
    fileName: string, 
    documentType?: string,
    onProgress?: (progress: number) => void,
    customPrompt?: string
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();
    
    try {
      onProgress?.(10);
      
      // Clean and prepare the raw text
      const cleanedText = this.cleanRawText(rawText);
      const wordCount = cleanedText.split(/\s+/).length;
      
      onProgress?.(20);
      
      // Create structured prompt for AI analysis
      const analysisPrompt = customPrompt || this.buildAnalysisPrompt(cleanedText, fileName, documentType);
      onProgress?.(30);
      
      // Get AI analysis
      const aiResponse = await this.getAIAnalysis(analysisPrompt, onProgress);
      onProgress?.(80);
      
      // Parse and structure the response
      const summary = this.parseAIResponse(aiResponse);
      onProgress?.(90);
      
      // Generate structured content
      const structuredContent = this.generateStructuredContent(summary);
      onProgress?.(95);
      
      const processingTime = Date.now() - startTime;
      onProgress?.(100);
      
      return {
        summary,
        structuredContent,
        metadata: {
          wordCount,
          confidence: this.calculateConfidence(aiResponse, wordCount),
          processingTime
        }
      };
      
    } catch (error) {
      console.error('Document processing failed:', error);
      
      // Fallback to basic processing
      return this.createFallbackSummary(rawText, fileName);
    }
  }

  /**
   * Clean raw extracted text
   */
  private cleanRawText(rawText: string): string {
    return rawText
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers patterns
      .replace(/Page \d+ of \d+/gi, '')
      .replace(/^\d+\s*$/gm, '')
      // Remove OCR artifacts
      .replace(/[^\w\s.,;:()[\]{}"-]/g, ' ')
      // Clean up spacing
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(text: string, fileName: string, documentType?: string): string {
    return `You are an expert legal assistant analyzing a document. Please analyze the following legal document and provide a structured summary.

Document: ${fileName}
${documentType ? `Document Type: ${documentType}` : ''}

TEXT TO ANALYZE:
${text.substring(0, 8000)} ${text.length > 8000 ? '...[truncated]' : ''}

Please provide your analysis in the following JSON format:
{
  "executiveSummary": "A concise 2-3 sentence summary of the document's main purpose and content",
  "keyFacts": ["List of 3-7 key factual points from the document"],
  "legalIssues": ["List of 2-5 legal issues or questions raised"],
  "importantDates": ["List of significant dates mentioned (format: YYYY-MM-DD or description)"],
  "parties": ["List of people, companies, or entities mentioned"],
  "documentType": "Category of legal document (e.g., 'Contract', 'Witness Statement', 'Court Order')",
  "relevance": "Brief explanation of why this document is important to the case",
  "keyQuotes": ["2-4 most important direct quotes from the document"],
  "actionItems": ["Any actions, deadlines, or requirements mentioned"]
}

Focus on legal significance rather than copying raw text. Summarize and interpret the content professionally.`;
  }

  /**
   * Get AI analysis with progress tracking
   */
  private async getAIAnalysis(prompt: string, onProgress?: (progress: number) => void): Promise<string> {
    try {
      // Check if AI is available
      const response = await this.ollamaClient.generate('llama3.2:1b', prompt, {
        temperature: 0.1,
        max_tokens: 2000,
        system: "You are a professional legal assistant. Provide accurate, structured analysis of legal documents. Always respond in valid JSON format."
      });
      
      onProgress?.(70);
      return response;
      
    } catch (error) {
      console.warn('AI analysis not available, using structured fallback');
      
      // Fallback analysis when AI isn't available
      return this.createFallbackAnalysis(prompt);
    }
  }

  /**
   * Parse AI response into structured summary
   */
  private parseAIResponse(aiResponse: string): DocumentSummary {
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        return {
          executiveSummary: parsed.executiveSummary || 'Document summary not available',
          keyFacts: Array.isArray(parsed.keyFacts) ? parsed.keyFacts : [],
          legalIssues: Array.isArray(parsed.legalIssues) ? parsed.legalIssues : [],
          importantDates: Array.isArray(parsed.importantDates) ? parsed.importantDates : [],
          parties: Array.isArray(parsed.parties) ? parsed.parties : [],
          documentType: parsed.documentType || 'Unknown',
          relevance: parsed.relevance || 'Relevance to be determined',
          keyQuotes: Array.isArray(parsed.keyQuotes) ? parsed.keyQuotes : [],
          actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : []
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }
    
    // Fallback parsing
    return this.extractBasicSummary(aiResponse);
  }

  /**
   * Generate structured content for display
   */
  private generateStructuredContent(summary: DocumentSummary): string {
    const sections = [];
    
    sections.push(`**Executive Summary**\n${summary.executiveSummary}\n`);
    
    if (summary.keyFacts.length > 0) {
      sections.push(`**Key Facts**\n${summary.keyFacts.map(fact => `• ${fact}`).join('\n')}\n`);
    }
    
    if (summary.legalIssues.length > 0) {
      sections.push(`**Legal Issues**\n${summary.legalIssues.map(issue => `• ${issue}`).join('\n')}\n`);
    }
    
    if (summary.parties.length > 0) {
      sections.push(`**Parties Mentioned**\n${summary.parties.map(party => `• ${party}`).join('\n')}\n`);
    }
    
    if (summary.importantDates.length > 0) {
      sections.push(`**Important Dates**\n${summary.importantDates.map(date => `• ${date}`).join('\n')}\n`);
    }
    
    if (summary.keyQuotes.length > 0) {
      sections.push(`**Key Quotes**\n${summary.keyQuotes.map(quote => `"${quote}"`).join('\n\n')}\n`);
    }
    
    if (summary.actionItems.length > 0) {
      sections.push(`**Action Items**\n${summary.actionItems.map(item => `• ${item}`).join('\n')}\n`);
    }
    
    sections.push(`**Document Relevance**\n${summary.relevance}`);
    
    return sections.join('\n');
  }

  /**
   * Calculate confidence score based on response quality
   */
  private calculateConfidence(response: string, wordCount: number): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence if response contains structured data
    if (response.includes('{') && response.includes('}')) confidence += 0.2;
    if (response.includes('executiveSummary')) confidence += 0.1;
    if (response.includes('keyFacts')) confidence += 0.1;
    if (response.includes('legalIssues')) confidence += 0.1;
    
    // Adjust based on document length
    if (wordCount > 100) confidence += 0.1;
    if (wordCount > 500) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Create fallback analysis when AI is not available
   */
  private createFallbackAnalysis(prompt: string): string {
    // Extract text from prompt
    const textMatch = prompt.match(/TEXT TO ANALYZE:\s*([\s\S]*?)(?=\n\nPlease provide)/);
    const text = textMatch ? textMatch[1].trim() : '';
    
    // Basic text analysis
    const words = text.split(/\s+/).filter(w => w.length > 3);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Simple keyword extraction
    const legalKeywords = words.filter(word => 
      /contract|agreement|clause|liability|damages|breach|claim|court|judge|evidence|witness|defendant|claimant/i.test(word)
    );
    
    const dates = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g) || [];
    
    // Create structured fallback response
    return JSON.stringify({
      executiveSummary: `Document contains ${sentences.length} main sections with ${legalKeywords.length} legal terms identified.`,
      keyFacts: sentences.slice(0, 3).map(s => s.trim()),
      legalIssues: legalKeywords.slice(0, 3),
      importantDates: dates.slice(0, 3),
      parties: [],
      documentType: 'Legal Document',
      relevance: 'Document requires manual review for detailed analysis.',
      keyQuotes: [],
      actionItems: []
    });
  }

  /**
   * Extract basic summary from unstructured AI response
   */
  private extractBasicSummary(response: string): DocumentSummary {
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      executiveSummary: lines[0] || 'Document summary not available',
      keyFacts: lines.slice(1, 4),
      legalIssues: [],
      importantDates: [],
      parties: [],
      documentType: 'Legal Document',
      relevance: 'Document requires further analysis',
      keyQuotes: [],
      actionItems: []
    };
  }

  /**
   * Create basic fallback summary when all else fails
   */
  private createFallbackSummary(rawText: string, fileName: string): ProcessedDocument {
    const wordCount = rawText.split(/\s+/).length;
    const previewText = rawText.substring(0, 500);
    
    return {
      summary: {
        executiveSummary: `Document "${fileName}" contains ${wordCount} words. AI analysis not available.`,
        keyFacts: [`Document size: ${wordCount} words`],
        legalIssues: [],
        importantDates: [],
        parties: [],
        documentType: 'Unknown',
        relevance: 'Manual review required',
        keyQuotes: [],
        actionItems: []
      },
      structuredContent: `**Document Preview**\n${previewText}${rawText.length > 500 ? '...' : ''}`,
      metadata: {
        wordCount,
        confidence: 0.1,
        processingTime: 0
      }
    };
  }

  /**
   * Extract entities for AI sync system with improved fallback
   */
  async extractEntitiesForSync(
    rawText: string,
    fileName: string,
    documentType?: string
  ): Promise<{
    persons: any[];
    issues: any[];
    chronologyEvents: any[];
    authorities: any[];
  }> {
    console.log(`🤖 Starting entity extraction for: ${fileName}`);
    
    try {
      const cleanedText = this.cleanRawText(rawText);
      
      // Try AI extraction first
      const aiResult = await this.tryAIEntityExtraction(cleanedText, fileName, documentType);
      if (aiResult) {
        console.log(`✅ AI extraction successful:`, {
          persons: aiResult.persons.length,
          issues: aiResult.issues.length,
          chronologyEvents: aiResult.chronologyEvents.length,
          authorities: aiResult.authorities.length
        });
        return aiResult;
      }
      
      // If AI fails, use enhanced fallback
      console.log(`🔄 AI extraction failed, using enhanced fallback for: ${fileName}`);
      return this.extractEntitiesEnhancedFallback(cleanedText, fileName);
      
    } catch (error) {
      console.error('Entity extraction failed:', error);
      // Always return enhanced fallback, never empty
      return this.extractEntitiesEnhancedFallback(rawText, fileName);
    }
  }

  /**
   * Try AI extraction with multiple model fallbacks
   */
  private async tryAIEntityExtraction(
    cleanedText: string,
    fileName: string,
    documentType?: string
  ): Promise<{
    persons: any[];
    issues: any[];
    chronologyEvents: any[];
    authorities: any[];
  } | null> {
    const entityPrompt = `You are an expert legal analyst. Extract structured entities from this legal document for case management.

Document: ${fileName}
${documentType ? `Type: ${documentType}` : ''}

TEXT:
${cleanedText.substring(0, 6000)}

Extract the following entities in JSON format:
{
  "persons": [
    {
      "name": "Full name",
      "role": "claimant|defendant|witness|expert|lawyer|judge|other",
      "description": "Brief description of their role/relevance",
      "relevance": "How they relate to the case",
      "organization": "Company/firm if applicable",
      "documentRefs": ["${fileName}"],
      "keyQuotes": ["Relevant quotes about this person"]
    }
  ],
  "issues": [
    {
      "title": "Brief issue title",
      "description": "Detailed description",
      "category": "factual|legal|quantum|procedural",
      "priority": "high|medium|low",
      "status": "unresolved|disputed|agreed|resolved",
      "claimantPosition": "Position if stated",
      "defendantPosition": "Position if stated",
      "documentRefs": ["${fileName}"]
    }
  ],
  "chronologyEvents": [
    {
      "date": "YYYY-MM-DD or best estimate",
      "description": "What happened",
      "significance": "Why this event matters",
      "documentRef": "${fileName}"
    }
  ],
  "authorities": [
    {
      "citation": "Case name or statute reference",
      "principle": "Legal principle established",
      "relevance": "How it applies to this case",
      "court": "Court if applicable",
      "year": "Year if available"
    }
  ]
}

Focus on extracting clear, distinct entities. Avoid duplicates.`;

    try {
      const response = await this.getAIAnalysis(entityPrompt);
      
      // Try to parse the AI response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate the response has the expected structure
        if (parsed && typeof parsed === 'object') {
          return {
            persons: Array.isArray(parsed.persons) ? parsed.persons : [],
            issues: Array.isArray(parsed.issues) ? parsed.issues : [],
            chronologyEvents: Array.isArray(parsed.chronologyEvents) ? parsed.chronologyEvents : [],
            authorities: Array.isArray(parsed.authorities) ? parsed.authorities : []
          };
        }
      }
    } catch (error) {
      console.warn('AI entity extraction failed:', error);
    }
    
    return null;
  }

  /**
   * Enhanced fallback entity extraction using advanced text analysis
   */
  private extractEntitiesEnhancedFallback(text: string, fileName: string): {
    persons: any[];
    issues: any[];
    chronologyEvents: any[];
    authorities: any[];
  } {
    console.log(`🔍 Using enhanced fallback extraction for: ${fileName}`);
    const lowerText = text.toLowerCase();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Enhanced person extraction with better patterns and role detection
    const persons: any[] = [];
    const personPatterns = [
      // Full names with titles
      /\b(Mr|Mrs|Ms|Dr|Judge|Justice|Professor|Sir|Dame)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi,
      // Full names (First Last)
      /\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b/g,
      // Legal roles with names
      /\b(claimant|defendant|plaintiff|applicant|respondent)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      // Witness statements
      /\bwitness\s+statement\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      // Legal representation
      /\b(counsel|solicitor|barrister)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi
    ];
    
    personPatterns.forEach((pattern, index) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        const title = match[1];
        const name = match[2] || match[1];
        
        if (name && name.length > 3 && !persons.find(p => p.name.toLowerCase() === name.toLowerCase())) {
          let role = 'other';
          let description = `Person mentioned in ${fileName}`;
          
          // Determine role based on context
          if (/claimant|plaintiff|applicant/i.test(title)) {
            role = 'claimant';
            description = 'Party bringing the claim';
          } else if (/defendant|respondent/i.test(title)) {
            role = 'defendant';
            description = 'Party defending the claim';
          } else if (/witness/i.test(title)) {
            role = 'witness';
            description = 'Witness in the case';
          } else if (/judge|justice/i.test(title)) {
            role = 'judge';
            description = 'Presiding judge';
          } else if (/counsel|barrister|solicitor/i.test(title)) {
            role = 'lawyer';
            description = 'Legal representative';
          } else if (/expert|professor|dr/i.test(title)) {
            role = 'expert';
            description = 'Expert witness or consultant';
          }
          
          persons.push({
            name: name.trim(),
            role,
            description,
            relevance: 'Mentioned in document',
            organization: '',
            documentRefs: [fileName],
            keyQuotes: []
          });
        }
      }
    });

    // Enhanced date extraction with context analysis
    const chronologyEvents: any[] = [];
    const datePatterns = [
      // Various date formats
      /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/g,
      /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/g,
      // Written dates
      /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi,
      /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})\b/gi
    ];
    
    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const date = match[1];
        const startContext = Math.max(0, match.index - 150);
        const endContext = Math.min(text.length, match.index + 150);
        const context = text.substring(startContext, endContext);
        
        // Extract meaningful description from context
        let description = `Event on ${date}`;
        let significance = 'Date mentioned in document';
        
        // Look for action words near the date
        const actionWords = /\b(signed|executed|delivered|received|sent|filed|issued|ordered|decided|agreed|terminated|breached|completed|started|began|ended|concluded)\b/gi;
        const actionMatch = actionWords.exec(context);
        if (actionMatch) {
          description = `Document ${actionMatch[1]} on ${date}`;
          significance = 'Significant legal action or event';
        }
        
        // Look for contract/agreement terms
        if (/contract|agreement|deed|document/i.test(context)) {
          description = `Contract or agreement event on ${date}`;
          significance = 'Contractual milestone';
        }
        
        chronologyEvents.push({
          date,
          description,
          significance,
          documentRef: fileName
        });
      }
    });

    // Enhanced legal issues extraction using keywords and patterns
    const issues: any[] = [];
    const issueKeywords = [
      'breach', 'damages', 'liability', 'negligence', 'contract', 'agreement',
      'dispute', 'claim', 'defence', 'counterclaim', 'injunction', 'remedy',
      'compensation', 'penalty', 'termination', 'warranty', 'guarantee'
    ];
    
    sentences.forEach((sentence, index) => {
      const lowerSentence = sentence.toLowerCase();
      let issueScore = 0;
      let matchedKeywords: string[] = [];
      
      issueKeywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) {
          issueScore++;
          matchedKeywords.push(keyword);
        }
      });
      
      // If sentence has multiple legal keywords, it's likely an issue
      if (issueScore >= 2 && sentence.length > 50) {
        const title = sentence.substring(0, 80).trim() + (sentence.length > 80 ? '...' : '');
        
        let category = 'factual';
        let priority = 'medium';
        
        if (matchedKeywords.some(k => ['breach', 'liability', 'negligence', 'damages'].includes(k))) {
          category = 'legal';
          priority = 'high';
        }
        
        issues.push({
          title,
          description: sentence.trim(),
          category,
          priority,
          status: 'unresolved',
          claimantPosition: '',
          defendantPosition: '',
          documentRefs: [fileName]
        });
      }
    });

    // Legal authorities extraction using citation patterns
    const authorities: any[] = [];
    const citationPatterns = [
      // Case citations: Name v Name [Year] Court Reference
      /\b([A-Z][a-z\s&]+)\s+v\.?\s+([A-Z][a-z\s&]+)\s*\[(\d{4})\]\s*([A-Z]{2,10}\s*\d+)/gi,
      // Statute citations
      /\b([A-Z][a-z\s]+(Act|Code|Regulation))\s*(\d{4})/gi,
      // Court references
      /\b(CA|HC|EWHC|EWCA|UKSC|UKHL)\s*(\d+)/gi
    ];
    
    citationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let citation = match[0];
        let principle = 'Legal authority cited';
        let relevance = 'Referenced in document';
        
        if (pattern.source.includes('v\\.?')) {
          // Case law
          citation = `${match[1]} v ${match[2]} [${match[3]}] ${match[4]}`;
          principle = 'Case law precedent';
          relevance = 'Legal precedent applicable to case';
        } else if (pattern.source.includes('Act|Code')) {
          // Statute
          principle = 'Statutory provision';
          relevance = 'Relevant statutory authority';
        }
        
        authorities.push({
          citation: citation.trim(),
          principle,
          relevance,
          court: match[4] || '',
          year: match[3] || ''
        });
      }
    });

    const result = {
      persons: persons.slice(0, 10), // Increased limit for better extraction
      issues: issues.slice(0, 5),
      chronologyEvents: chronologyEvents.slice(0, 15),
      authorities: authorities.slice(0, 8)
    };
    
    console.log(`🔍 Enhanced fallback extracted:`, {
      persons: result.persons.length,
      issues: result.issues.length,
      chronologyEvents: result.chronologyEvents.length,
      authorities: result.authorities.length
    });
    
    return result;
  }

  /**
   * Quick document type detection
   */
  detectDocumentType(text: string, fileName: string): string {
    const lowerText = text.toLowerCase();
    const lowerFileName = fileName.toLowerCase();
    
    if (lowerText.includes('witness statement') || lowerFileName.includes('witness')) {
      return 'Witness Statement';
    }
    if (lowerText.includes('contract') || lowerText.includes('agreement')) {
      return 'Contract';
    }
    if (lowerText.includes('court order') || lowerText.includes('judgment')) {
      return 'Court Order';
    }
    if (lowerText.includes('expert report') || lowerFileName.includes('expert')) {
      return 'Expert Report';
    }
    if (lowerText.includes('skeleton argument') || lowerText.includes('submission')) {
      return 'Legal Submission';
    }
    
    return 'Legal Document';
  }
}

export const aiDocumentProcessor = new AIDocumentProcessor();