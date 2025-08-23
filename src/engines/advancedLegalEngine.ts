/**
 * Advanced Legal NLP Engine
 * Privacy-safe, permissively-licensed legal intelligence system
 * Inspired by Legal Text Analytics research, built with Apache 2.0 libraries
 */

export interface LegalEntity {
  id: string;
  type: 'person' | 'organization' | 'court' | 'legislation' | 'case_citation' | 'financial' | 'obligation' | 'date_legal';
  text: string;
  startOffset: number;
  endOffset: number;
  confidence: number;
  context: string;
  metadata: Record<string, any>;
}

export interface LegalPerson extends LegalEntity {
  type: 'person';
  metadata: {
    role: 'claimant' | 'defendant' | 'witness' | 'expert' | 'judge' | 'barrister' | 'solicitor' | 'unknown';
    title?: string;
    firm?: string;
    relationship?: string;
    importance: 'high' | 'medium' | 'low';
  };
}

export interface LegalOrganization extends LegalEntity {
  type: 'organization';
  metadata: {
    orgType: 'law_firm' | 'company' | 'court' | 'government' | 'ngo' | 'unknown';
    role: 'party' | 'representative' | 'third_party' | 'authority';
    jurisdiction?: string;
  };
}

export interface LegalCitation extends LegalEntity {
  type: 'case_citation';
  metadata: {
    caseName: string;
    year: number;
    court: string;
    neutralCitation?: string;
    jurisdiction: string;
    precedentialValue: 'binding' | 'persuasive' | 'unknown';
    legalPrinciple?: string;
    relevance: 'high' | 'medium' | 'low';
  };
}

export interface FinancialEntity extends LegalEntity {
  type: 'financial';
  metadata: {
    amount: number;
    currency: string;
    financialType: 'damages' | 'costs' | 'fee' | 'penalty' | 'settlement' | 'payment' | 'unknown';
    frequency?: 'one-time' | 'monthly' | 'annually' | 'quarterly';
    context: string;
  };
}

export interface LegalObligation extends LegalEntity {
  type: 'obligation';
  metadata: {
    obligationType: 'payment' | 'performance' | 'delivery' | 'confidentiality' | 'non_compete' | 'other';
    obligor: string;
    obligee: string;
    deadline?: string;
    consequences?: string;
    priority: 'critical' | 'important' | 'normal';
  };
}

export interface LegalDate extends LegalEntity {
  type: 'date_legal';
  metadata: {
    parsedDate: string; // ISO format
    dateType: 'hearing' | 'deadline' | 'filing' | 'contract_date' | 'breach_date' | 'settlement_date' | 'other';
    significance: 'critical' | 'important' | 'normal';
    timeContext?: 'past' | 'future' | 'ongoing';
    relatedEvent?: string;
  };
}

export interface LegalArgument {
  id: string;
  claim: string;
  evidence: string[];
  legalBasis: string[];
  counterArguments: string[];
  strength: number; // 0-1
  argumentType: 'liability' | 'causation' | 'quantum' | 'procedural' | 'other';
  supportingCitations: string[];
  context: string;
}

export interface ContractClause {
  id: string;
  type: 'payment' | 'termination' | 'confidentiality' | 'liability' | 'force_majeure' | 'dispute_resolution' | 'other';
  text: string;
  importance: 'critical' | 'important' | 'normal';
  riskLevel: 'high' | 'medium' | 'low';
  analysis: string;
  relatedClauses: string[];
}

export interface LegalAnalysisResult {
  entities: LegalEntity[];
  arguments: LegalArgument[];
  contractClauses: ContractClause[];
  riskAssessment: {
    overallRisk: 'high' | 'medium' | 'low';
    riskFactors: string[];
    mitigationSuggestions: string[];
    timelineRisks: string[];
  };
  documentClassification: {
    primaryType: string;
    secondaryTypes: string[];
    jurisdiction: string;
    legalDomain: string[];
    complexity: 'high' | 'medium' | 'low';
  };
  processingMetadata: {
    processingTime: number;
    confidence: number;
    enginesUsed: string[];
    version: string;
  };
}

/**
 * Advanced Legal Engine - Core processing class
 */
export class AdvancedLegalEngine {
  private version = '1.0.0';

  constructor() {
    console.log('🚀 Initializing Advanced Legal Intelligence Engine v' + this.version);
  }

  /**
   * Main analysis function - processes legal text with advanced NLP
   */
  async analyze(text: string, options: {
    includeArguments?: boolean;
    includeRiskAssessment?: boolean;
    includeContractAnalysis?: boolean;
    confidenceThreshold?: number;
  } = {}): Promise<LegalAnalysisResult> {
    const startTime = Date.now();
    
    console.log('🔍 Starting advanced legal analysis...');
    
    // Set defaults
    const config = {
      includeArguments: true,
      includeRiskAssessment: true,
      includeContractAnalysis: true,
      confidenceThreshold: 0.7,
      ...options
    };

    try {
      // Parallel processing for performance
      const [
        entities,
        legalArguments,
        contractClauses,
        riskAssessment,
        documentClassification
      ] = await Promise.all([
        this.extractAdvancedEntities(text, config.confidenceThreshold),
        config.includeArguments ? this.extractArguments(text) : Promise.resolve([]),
        config.includeContractAnalysis ? this.analyzeContractClauses(text) : Promise.resolve([]),
        config.includeRiskAssessment ? this.assessRisk(text) : Promise.resolve(this.getDefaultRiskAssessment()),
        this.classifyDocument(text)
      ]);

      const processingTime = Date.now() - startTime;

      console.log(`✅ Advanced legal analysis complete in ${processingTime}ms`);
      console.log(`📊 Extracted: ${entities.length} entities, ${legalArguments.length} arguments, ${contractClauses.length} clauses`);

      return {
        entities,
        arguments: legalArguments,
        contractClauses,
        riskAssessment,
        documentClassification,
        processingMetadata: {
          processingTime,
          confidence: this.calculateOverallConfidence(entities, legalArguments),
          enginesUsed: ['advanced-legal-nlp', 'financial-extractor', 'citation-parser', 'argument-miner'],
          version: this.version
        }
      };

    } catch (error) {
      console.error('❌ Advanced legal analysis failed:', error);
      throw new Error(`Legal analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract sophisticated legal entities with context and relationships
   */
  private async extractAdvancedEntities(text: string, threshold: number): Promise<LegalEntity[]> {
    const entities: LegalEntity[] = [];

    // Run multiple specialized extractors in parallel
    const [
      persons,
      organizations,
      citations,
      financialData,
      obligations,
      legalDates
    ] = await Promise.all([
      this.extractLegalPersons(text),
      this.extractLegalOrganizations(text),
      this.extractLegalCitations(text),
      this.extractFinancialData(text),
      this.extractLegalObligations(text),
      this.extractLegalDates(text)
    ]);

    entities.push(...persons, ...organizations, ...citations, ...financialData, ...obligations, ...legalDates);

    // Filter by confidence threshold
    return entities.filter(entity => entity.confidence >= threshold);
  }

  /**
   * Extract legal persons with roles and relationships
   */
  private async extractLegalPersons(text: string): Promise<LegalPerson[]> {
    const persons: LegalPerson[] = [];
    
    // Enhanced person patterns with legal context
    const patterns = [
      // Formal legal representations
      /(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?|Sir|Lord|Lady|Hon\.?|Rt\.?\s+Hon\.?)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s*(?:KC|QC|MP|CBE|OBE|MBE)?/g,
      // Barristers and advocates
      /([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+(?:KC|QC|Esq\.?)/g,
      // Judicial titles
      /(?:Judge|Justice|Magistrate|Sheriff|Lord Chief Justice|Master)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/g,
      // Solicitors and legal professionals
      /([A-Z][a-z]+(?: [A-Z][a-z]+)*),?\s+(?:Solicitor|Barrister|Advocate|Attorney)/g,
      // Witness statements
      /(?:witness|deponent|affiant|declarant):?\s*([A-Z][a-z]+(?: [A-Z][a-z]+)*)/gi,
      // Party references
      /(?:claimant|plaintiff|defendant|respondent|appellant|applicant):?\s*([A-Z][a-z]+(?: [A-Z][a-z]+)*)/gi
    ];

    let matchId = 0;
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1];
        const fullMatch = match[0];
        const context = this.getContextWindow(text, match.index, 100);
        
        persons.push({
          id: `person_${++matchId}`,
          type: 'person',
          text: name,
          startOffset: match.index,
          endOffset: match.index + fullMatch.length,
          confidence: this.calculatePersonConfidence(fullMatch, context),
          context,
          metadata: {
            role: this.inferPersonRole(fullMatch, context),
            title: this.extractTitle(fullMatch),
            firm: this.extractFirm(context),
            relationship: this.inferRelationship(context),
            importance: this.assessPersonImportance(fullMatch, context)
          }
        });
      }
    }

    return this.deduplicatePersons(persons);
  }

  /**
   * Extract legal organizations with classification
   */
  private async extractLegalOrganizations(text: string): Promise<LegalOrganization[]> {
    const organizations: LegalOrganization[] = [];
    
    const patterns = [
      // Law firms
      /([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+(?:& Associates|LLP|Solicitors|Barristers|Chambers|Law)/g,
      // Companies
      /([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+(?:Ltd|Limited|PLC|Inc|Corporation|Corp|Company)/g,
      // Courts
      /([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+(?:Court|Tribunal|Commission)/g,
      // Government bodies
      /(?:Department of|Ministry of|Her Majesty's|HM)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/g
    ];

    let matchId = 0;
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const orgName = match[1] || match[0];
        const context = this.getContextWindow(text, match.index, 100);
        
        organizations.push({
          id: `org_${++matchId}`,
          type: 'organization',
          text: orgName,
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          confidence: this.calculateOrgConfidence(match[0], context),
          context,
          metadata: {
            orgType: this.classifyOrganization(match[0]),
            role: this.inferOrgRole(context),
            jurisdiction: this.inferJurisdiction(context)
          }
        });
      }
    }

    return organizations;
  }

  /**
   * Extract and parse legal citations with metadata
   */
  private async extractLegalCitations(text: string): Promise<LegalCitation[]> {
    const citations: LegalCitation[] = [];
    
    // Comprehensive UK legal citation patterns
    const patterns = [
      // Neutral citations
      /\[(\d{4})\]\s+(EWCA|EWHC|UKSC|UKPC|EWCOP)\s+(Civ|Crim|Admin|Ch|QB|Fam|Pat|IPEC|TCC|Comm)\s+(\d+)/g,
      // Traditional citations
      /\[(\d{4})\]\s+(\d+)\s+(WLR|All ER|AC|Ch|QB|WLR|Lloyd's Rep)/g,
      // Case names with citations
      /([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+v\.?\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+\[(\d{4})\]/g
    ];

    let matchId = 0;
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullCitation = match[0];
        const context = this.getContextWindow(text, match.index, 150);
        
        citations.push({
          id: `citation_${++matchId}`,
          type: 'case_citation',
          text: fullCitation,
          startOffset: match.index,
          endOffset: match.index + fullCitation.length,
          confidence: 0.95, // Citations are highly structured
          context,
          metadata: {
            caseName: this.extractCaseName(fullCitation),
            year: parseInt(match[1]) || new Date().getFullYear(),
            court: this.mapCourtFromCitation(fullCitation),
            neutralCitation: fullCitation,
            jurisdiction: 'England and Wales',
            precedentialValue: this.assessPrecedentialValue(fullCitation, context),
            legalPrinciple: this.inferLegalPrinciple(context),
            relevance: this.assessCitationRelevance(context)
          }
        });
      }
    }

    return citations;
  }

  /**
   * Extract financial data with sophisticated parsing
   */
  private async extractFinancialData(text: string): Promise<FinancialEntity[]> {
    const financialEntities: FinancialEntity[] = [];
    
    // Enhanced financial patterns
    const patterns = [
      // Currency amounts with symbols
      /£([\d,]+(?:\.\d{2})?)|€([\d,]+(?:\.\d{2})?)|US?\$([\d,]+(?:\.\d{2})?)/g,
      // Written amounts
      /(?:sum of|amount of|damages of|costs of|fee of|penalty of)\s+£?([\d,]+(?:\.\d{2})?)/gi,
      // Percentage rates
      /([\d.]+)%\s*(?:per annum|interest|rate|APR)/gi
    ];

    let matchId = 0;
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const amount = this.parseAmount(fullMatch);
        const currency = this.extractCurrency(fullMatch);
        const context = this.getContextWindow(text, match.index, 100);
        
        if (amount > 0) {
          financialEntities.push({
            id: `financial_${++matchId}`,
            type: 'financial',
            text: fullMatch,
            startOffset: match.index,
            endOffset: match.index + fullMatch.length,
            confidence: 0.9,
            context,
            metadata: {
              amount,
              currency,
              financialType: this.classifyFinancialType(context),
              frequency: this.extractFrequency(context),
              context: context.substring(0, 200)
            }
          });
        }
      }
    }

    return financialEntities;
  }

  /**
   * Extract legal obligations and duties
   */
  private async extractLegalObligations(text: string): Promise<LegalObligation[]> {
    const obligations: LegalObligation[] = [];
    
    // Obligation indicators
    const patterns = [
      /(?:shall|must|required to|obliged to|duty to)\s+([^.]{10,100})/gi,
      /(?:agrees to|undertakes to|covenants to)\s+([^.]{10,100})/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:shall|must)\s+([^.]{10,100})/g
    ];

    let matchId = 0;
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const obligationText = match[1] || match[2];
        const context = this.getContextWindow(text, match.index, 150);
        
        obligations.push({
          id: `obligation_${++matchId}`,
          type: 'obligation',
          text: obligationText,
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          confidence: 0.8,
          context,
          metadata: {
            obligationType: this.classifyObligation(obligationText),
            obligor: this.extractObligor(match[0], context),
            obligee: this.extractObligee(context),
            deadline: this.extractDeadline(context),
            consequences: this.extractConsequences(context),
            priority: this.assessObligationPriority(obligationText, context)
          }
        });
      }
    }

    return obligations;
  }

  /**
   * Extract legal dates with significance analysis
   */
  private async extractLegalDates(text: string): Promise<LegalDate[]> {
    const legalDates: LegalDate[] = [];
    
    // Enhanced date patterns with legal context
    const patterns = [
      // Court dates
      /(?:hearing|trial|judgment)\s+(?:on|date|of)?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
      // Deadlines
      /(?:deadline|due|expire[sd]?|within)\s+(?:by|on)?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
      // Contract dates
      /(?:dated|executed|signed)\s+(?:on)?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
      // Filing dates
      /(?:filed|served|lodged)\s+(?:on)?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi
    ];

    let matchId = 0;
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const dateStr = match[1];
        const parsedDate = this.parseDate(dateStr);
        const context = this.getContextWindow(text, match.index, 100);
        
        if (parsedDate) {
          legalDates.push({
            id: `date_${++matchId}`,
            type: 'date_legal',
            text: dateStr,
            startOffset: match.index,
            endOffset: match.index + match[0].length,
            confidence: 0.85,
            context,
            metadata: {
              parsedDate: parsedDate.toISOString(),
              dateType: this.classifyDateType(context),
              significance: this.assessDateSignificance(context),
              timeContext: this.assessTimeContext(parsedDate),
              relatedEvent: this.extractRelatedEvent(context)
            }
          });
        }
      }
    }

    return legalDates;
  }

  /**
   * Extract legal arguments and reasoning chains
   */
  private async extractArguments(text: string): Promise<LegalArgument[]> {
    const legalArguments: LegalArgument[] = [];
    
    // Argument indicators
    const argumentPatterns = [
      /(?:contend[s]?|argue[s]?|submit[s]?|assert[s]?)\s+that\s+([^.]{20,200})/gi,
      /(?:on the basis|ground[s]?)\s+that\s+([^.]{20,200})/gi,
      /(?:therefore|consequently|accordingly|thus)\s+([^.]{20,200})/gi
    ];

    let argId = 0;
    for (const pattern of argumentPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const claim = match[1].trim();
        const context = this.getContextWindow(text, match.index, 300);
        
        legalArguments.push({
          id: `arg_${++argId}`,
          claim,
          evidence: this.extractEvidence(context),
          legalBasis: this.extractLegalBasis(context),
          counterArguments: this.extractCounterArguments(text, claim),
          strength: this.assessArgumentStrength(claim, context),
          argumentType: this.classifyArgumentType(claim, context),
          supportingCitations: this.extractSupportingCitations(context),
          context
        });
      }
    }

    return legalArguments;
  }

  /**
   * Analyze contract clauses for risks and importance
   */
  private async analyzeContractClauses(text: string): Promise<ContractClause[]> {
    const clauses: ContractClause[] = [];
    
    // Common contract clause patterns
    const clausePatterns = [
      // Payment clauses
      /(?:payment|invoice|billing)\s+(?:terms?|conditions?)[:\.]?\s*([^.]{20,300})/gi,
      // Termination clauses
      /(?:termination|terminate|end)\s+(?:of|this|agreement)[:\.]?\s*([^.]{20,300})/gi,
      // Liability clauses
      /(?:liability|liable|damages|loss)[:\.]?\s*([^.]{20,300})/gi,
      // Confidentiality clauses
      /(?:confidential|non-disclosure|proprietary)[:\.]?\s*([^.]{20,300})/gi
    ];

    let clauseId = 0;
    for (const pattern of clausePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const clauseText = match[1].trim();
        const context = this.getContextWindow(text, match.index, 200);
        
        clauses.push({
          id: `clause_${++clauseId}`,
          type: this.classifyClauseType(match[0]),
          text: clauseText,
          importance: this.assessClauseImportance(clauseText),
          riskLevel: this.assessClauseRisk(clauseText),
          analysis: this.analyzeClause(clauseText),
          relatedClauses: []
        });
      }
    }

    return clauses;
  }

  /**
   * Assess overall document risk
   */
  private async assessRisk(text: string): Promise<LegalAnalysisResult['riskAssessment']> {
    const riskFactors: string[] = [];
    const mitigationSuggestions: string[] = [];
    const timelineRisks: string[] = [];
    
    // Risk indicators
    if (text.toLowerCase().includes('breach')) {
      riskFactors.push('Breach of contract allegations present');
      mitigationSuggestions.push('Review contract terms and performance obligations');
    }
    
    if (text.toLowerCase().includes('deadline') || text.toLowerCase().includes('time is of the essence')) {
      timelineRisks.push('Strict deadline requirements identified');
      mitigationSuggestions.push('Implement deadline tracking system');
    }
    
    if (text.toLowerCase().includes('damages') || text.toLowerCase().includes('penalty')) {
      riskFactors.push('Financial exposure identified');
      mitigationSuggestions.push('Consider insurance coverage and financial provisions');
    }

    const overallRisk = riskFactors.length > 2 ? 'high' : riskFactors.length > 0 ? 'medium' : 'low';

    return {
      overallRisk,
      riskFactors,
      mitigationSuggestions,
      timelineRisks
    };
  }

  /**
   * Classify document type and complexity
   */
  private async classifyDocument(text: string): Promise<LegalAnalysisResult['documentClassification']> {
    const legalDomains: string[] = [];
    let primaryType = 'legal_document';
    
    // Document type classification
    if (text.toLowerCase().includes('witness statement')) {
      primaryType = 'witness_statement';
      legalDomains.push('evidence');
    }
    
    if (text.toLowerCase().includes('contract') || text.toLowerCase().includes('agreement')) {
      primaryType = 'contract';
      legalDomains.push('contract_law');
    }
    
    if (text.toLowerCase().includes('judgment') || text.toLowerCase().includes('ruling')) {
      primaryType = 'judgment';
      legalDomains.push('case_law');
    }

    // Legal domain detection
    if (text.toLowerCase().includes('employment') || text.toLowerCase().includes('dismiss')) {
      legalDomains.push('employment_law');
    }
    
    if (text.toLowerCase().includes('tort') || text.toLowerCase().includes('negligence')) {
      legalDomains.push('tort_law');
    }

    const complexity = text.length > 10000 ? 'high' : text.length > 3000 ? 'medium' : 'low';

    return {
      primaryType,
      secondaryTypes: [],
      jurisdiction: 'England and Wales', // Default, could be enhanced
      legalDomain: legalDomains,
      complexity
    };
  }

  // Helper methods for entity extraction and analysis
  private getContextWindow(text: string, position: number, windowSize: number): string {
    const start = Math.max(0, position - windowSize);
    const end = Math.min(text.length, position + windowSize);
    return text.substring(start, end);
  }

  private calculatePersonConfidence(match: string, context: string): number {
    let confidence = 0.7;
    
    // Boost confidence for formal titles
    if (/(?:Mr|Mrs|Ms|Dr|Prof|Sir|Lord|Lady|Hon|Judge|Justice)/.test(match)) {
      confidence += 0.15;
    }
    
    // Boost for legal qualifications
    if (/(?:KC|QC|Esq|Solicitor|Barrister)/.test(match)) {
      confidence += 0.1;
    }
    
    return Math.min(0.98, confidence);
  }

  private inferPersonRole(match: string, context: string): LegalPerson['metadata']['role'] {
    const lowerMatch = match.toLowerCase();
    const lowerContext = context.toLowerCase();
    
    if (lowerMatch.includes('judge') || lowerMatch.includes('justice')) return 'judge';
    if (lowerMatch.includes('barrister') || lowerMatch.includes('counsel')) return 'barrister';
    if (lowerMatch.includes('solicitor')) return 'solicitor';
    if (lowerContext.includes('witness') || lowerContext.includes('deponent')) return 'witness';
    if (lowerContext.includes('expert')) return 'expert';
    if (lowerContext.includes('claimant') || lowerContext.includes('plaintiff')) return 'claimant';
    if (lowerContext.includes('defendant')) return 'defendant';
    
    return 'unknown';
  }

  private extractTitle(match: string): string | undefined {
    const titleMatch = match.match(/(?:Mr|Mrs|Ms|Dr|Prof|Sir|Lord|Lady|Hon|Rt\.?\s+Hon)\.?/);
    return titleMatch ? titleMatch[0] : undefined;
  }

  private extractFirm(context: string): string | undefined {
    const firmMatch = context.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:& Associates|LLP|Solicitors|Barristers|Chambers)/);
    return firmMatch ? firmMatch[1] : undefined;
  }

  private inferRelationship(context: string): string | undefined {
    if (context.toLowerCase().includes('representing')) return 'representative';
    if (context.toLowerCase().includes('instructed')) return 'instructed_counsel';
    return undefined;
  }

  private assessPersonImportance(match: string, context: string): LegalPerson['metadata']['importance'] {
    if (match.toLowerCase().includes('judge') || match.toLowerCase().includes('justice')) return 'high';
    if (context.toLowerCase().includes('leading counsel') || context.toLowerCase().includes('senior partner')) return 'high';
    if (match.includes('KC') || match.includes('QC')) return 'high';
    return 'medium';
  }

  private deduplicatePersons(persons: LegalPerson[]): LegalPerson[] {
    const seen = new Set<string>();
    return persons.filter(person => {
      const key = person.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateOrgConfidence(match: string, context: string): number {
    let confidence = 0.8;
    
    // Boost for clear organizational indicators
    if (/(?:Ltd|Limited|PLC|LLP|Court|Tribunal)/.test(match)) {
      confidence += 0.15;
    }
    
    return Math.min(0.95, confidence);
  }

  private classifyOrganization(match: string): LegalOrganization['metadata']['orgType'] {
    const lower = match.toLowerCase();
    
    if (lower.includes('court') || lower.includes('tribunal')) return 'court';
    if (lower.includes('solicitor') || lower.includes('barrister') || lower.includes('chambers')) return 'law_firm';
    if (lower.includes('department') || lower.includes('ministry') || lower.includes('hm ')) return 'government';
    if (lower.includes('ltd') || lower.includes('plc') || lower.includes('inc')) return 'company';
    
    return 'unknown';
  }

  private inferOrgRole(context: string): LegalOrganization['metadata']['role'] {
    const lower = context.toLowerCase();
    
    if (lower.includes('represent') || lower.includes('instruct')) return 'representative';
    if (lower.includes('claimant') || lower.includes('defendant')) return 'party';
    if (lower.includes('court') || lower.includes('tribunal')) return 'authority';
    
    return 'third_party';
  }

  private inferJurisdiction(context: string): string | undefined {
    if (context.includes('EWHC') || context.includes('EWCA')) return 'England and Wales';
    if (context.includes('UKSC')) return 'United Kingdom';
    return undefined;
  }

  private extractCaseName(citation: string): string {
    const caseMatch = citation.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+v\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return caseMatch ? `${caseMatch[1]} v ${caseMatch[2]}` : 'Unknown Case';
  }

  private mapCourtFromCitation(citation: string): string {
    if (citation.includes('EWCA')) return 'Court of Appeal';
    if (citation.includes('EWHC')) return 'High Court';
    if (citation.includes('UKSC')) return 'Supreme Court';
    if (citation.includes('UKPC')) return 'Privy Council';
    return 'Unknown Court';
  }

  private assessPrecedentialValue(citation: string, context: string): LegalCitation['metadata']['precedentialValue'] {
    if (citation.includes('UKSC') || citation.includes('UKPC')) return 'binding';
    if (citation.includes('EWCA')) return 'binding';
    return 'persuasive';
  }

  private inferLegalPrinciple(context: string): string | undefined {
    const lower = context.toLowerCase();
    
    if (lower.includes('contract')) return 'contract_interpretation';
    if (lower.includes('negligence')) return 'negligence';
    if (lower.includes('breach')) return 'breach_of_contract';
    if (lower.includes('damages')) return 'damages_assessment';
    
    return undefined;
  }

  private assessCitationRelevance(context: string): LegalCitation['metadata']['relevance'] {
    if (context.toLowerCase().includes('distinguish') || context.toLowerCase().includes('not applicable')) return 'low';
    if (context.toLowerCase().includes('directly applicable') || context.toLowerCase().includes('on point')) return 'high';
    return 'medium';
  }

  private parseAmount(text: string): number {
    const amountMatch = text.match(/([\d,]+(?:\.\d{2})?)/);
    if (!amountMatch) return 0;
    
    return parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  private extractCurrency(text: string): string {
    if (text.includes('£')) return 'GBP';
    if (text.includes('€')) return 'EUR';
    if (text.includes('$')) return 'USD';
    return 'GBP'; // Default
  }

  private classifyFinancialType(context: string): FinancialEntity['metadata']['financialType'] {
    const lower = context.toLowerCase();
    
    if (lower.includes('damages') || lower.includes('compensation')) return 'damages';
    if (lower.includes('costs') || lower.includes('legal costs')) return 'costs';
    if (lower.includes('fee') || lower.includes('payment')) return 'fee';
    if (lower.includes('penalty') || lower.includes('fine')) return 'penalty';
    if (lower.includes('settlement')) return 'settlement';
    
    return 'unknown';
  }

  private extractFrequency(context: string): FinancialEntity['metadata']['frequency'] | undefined {
    const lower = context.toLowerCase();
    
    if (lower.includes('monthly') || lower.includes('per month')) return 'monthly';
    if (lower.includes('annually') || lower.includes('per annum') || lower.includes('yearly')) return 'annually';
    if (lower.includes('quarterly')) return 'quarterly';
    
    return 'one-time';
  }

  private classifyObligation(text: string): LegalObligation['metadata']['obligationType'] {
    const lower = text.toLowerCase();
    
    if (lower.includes('pay') || lower.includes('payment')) return 'payment';
    if (lower.includes('deliver') || lower.includes('provide')) return 'delivery';
    if (lower.includes('perform') || lower.includes('complete')) return 'performance';
    if (lower.includes('confidential') || lower.includes('disclose')) return 'confidentiality';
    if (lower.includes('compete') || lower.includes('solicit')) return 'non_compete';
    
    return 'other';
  }

  private extractObligor(match: string, context: string): string {
    // Try to extract who has the obligation
    const obligorMatch = match.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:shall|must)/);
    return obligorMatch ? obligorMatch[1] : 'Unknown';
  }

  private extractObligee(context: string): string {
    // Try to extract who benefits from the obligation
    return 'Unknown'; // Would need more sophisticated parsing
  }

  private extractDeadline(context: string): string | undefined {
    const deadlineMatch = context.match(/(?:by|within|before)\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d+\s+days?)/);
    return deadlineMatch ? deadlineMatch[1] : undefined;
  }

  private extractConsequences(context: string): string | undefined {
    if (context.toLowerCase().includes('breach') || context.toLowerCase().includes('default')) {
      return 'Breach/default consequences apply';
    }
    return undefined;
  }

  private assessObligationPriority(text: string, context: string): LegalObligation['metadata']['priority'] {
    if (context.toLowerCase().includes('material') || context.toLowerCase().includes('fundamental')) return 'critical';
    if (context.toLowerCase().includes('important') || context.toLowerCase().includes('significant')) return 'important';
    return 'normal';
  }

  private parseDate(dateStr: string): Date | null {
    try {
      // Handle various date formats
      const cleaned = dateStr.replace(/[\/\-\.]/g, '/');
      const date = new Date(cleaned);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  private classifyDateType(context: string): LegalDate['metadata']['dateType'] {
    const lower = context.toLowerCase();
    
    if (lower.includes('hearing') || lower.includes('trial')) return 'hearing';
    if (lower.includes('deadline') || lower.includes('due')) return 'deadline';
    if (lower.includes('filed') || lower.includes('lodged')) return 'filing';
    if (lower.includes('contract') || lower.includes('agreement')) return 'contract_date';
    if (lower.includes('breach')) return 'breach_date';
    if (lower.includes('settlement')) return 'settlement_date';
    
    return 'other';
  }

  private assessDateSignificance(context: string): LegalDate['metadata']['significance'] {
    const lower = context.toLowerCase();
    
    if (lower.includes('judgment') || lower.includes('trial') || lower.includes('deadline')) return 'critical';
    if (lower.includes('hearing') || lower.includes('filing')) return 'important';
    
    return 'normal';
  }

  private assessTimeContext(date: Date): LegalDate['metadata']['timeContext'] {
    const now = new Date();
    
    if (date < now) return 'past';
    if (date > now) return 'future';
    
    return 'ongoing';
  }

  private extractRelatedEvent(context: string): string | undefined {
    // Extract what event the date relates to
    const eventMatch = context.match(/(?:hearing|trial|deadline|filing|contract|breach|settlement)/i);
    return eventMatch ? eventMatch[0] : undefined;
  }

  private extractEvidence(context: string): string[] {
    const evidence: string[] = [];
    
    // Look for evidence indicators
    if (context.toLowerCase().includes('exhibit')) {
      evidence.push('Documentary evidence referenced');
    }
    
    if (context.toLowerCase().includes('witness') || context.toLowerCase().includes('testimony')) {
      evidence.push('Witness testimony available');
    }
    
    return evidence;
  }

  private extractLegalBasis(context: string): string[] {
    const basis: string[] = [];
    
    // Look for legal basis indicators
    const statuteMatch = context.match(/(?:section|s\.)\s*(\d+)/gi);
    if (statuteMatch) {
      basis.push(`Statutory provision: ${statuteMatch[0]}`);
    }
    
    if (context.toLowerCase().includes('common law')) {
      basis.push('Common law principle');
    }
    
    return basis;
  }

  private extractCounterArguments(text: string, claim: string): string[] {
    // This would need sophisticated argument mining
    // For now, return basic patterns
    if (text.toLowerCase().includes('however') || text.toLowerCase().includes('but')) {
      return ['Counter-argument present in text'];
    }
    
    return [];
  }

  private assessArgumentStrength(claim: string, context: string): number {
    let strength = 0.5;
    
    // Boost for evidence
    if (context.toLowerCase().includes('evidence') || context.toLowerCase().includes('exhibit')) {
      strength += 0.2;
    }
    
    // Boost for legal citations
    if (context.includes('[') && context.includes(']')) {
      strength += 0.15;
    }
    
    return Math.min(0.95, strength);
  }

  private classifyArgumentType(claim: string, context: string): LegalArgument['argumentType'] {
    const lower = claim.toLowerCase() + ' ' + context.toLowerCase();
    
    if (lower.includes('liable') || lower.includes('breach')) return 'liability';
    if (lower.includes('caused') || lower.includes('result')) return 'causation';
    if (lower.includes('damages') || lower.includes('loss')) return 'quantum';
    if (lower.includes('procedure') || lower.includes('jurisdiction')) return 'procedural';
    
    return 'other';
  }

  private extractSupportingCitations(context: string): string[] {
    const citations: string[] = [];
    
    // Extract any citations in the context
    const citationPattern = /\[(\d{4})\]\s+\w+/g;
    let match;
    
    while ((match = citationPattern.exec(context)) !== null) {
      citations.push(match[0]);
    }
    
    return citations;
  }

  private classifyClauseType(text: string): ContractClause['type'] {
    const lower = text.toLowerCase();
    
    if (lower.includes('payment') || lower.includes('invoice')) return 'payment';
    if (lower.includes('termination') || lower.includes('terminate')) return 'termination';
    if (lower.includes('confidential') || lower.includes('non-disclosure')) return 'confidentiality';
    if (lower.includes('liability') || lower.includes('liable')) return 'liability';
    if (lower.includes('force majeure')) return 'force_majeure';
    if (lower.includes('dispute') || lower.includes('arbitration')) return 'dispute_resolution';
    
    return 'other';
  }

  private assessClauseImportance(text: string): ContractClause['importance'] {
    if (text.toLowerCase().includes('material') || text.toLowerCase().includes('fundamental')) return 'critical';
    if (text.toLowerCase().includes('significant') || text.toLowerCase().includes('important')) return 'important';
    return 'normal';
  }

  private assessClauseRisk(text: string): ContractClause['riskLevel'] {
    const lower = text.toLowerCase();
    
    if (lower.includes('unlimited') || lower.includes('penalty') || lower.includes('terminate immediately')) return 'high';
    if (lower.includes('damages') || lower.includes('breach')) return 'medium';
    
    return 'low';
  }

  private analyzeClause(text: string): string {
    // Basic clause analysis - could be much more sophisticated
    const lower = text.toLowerCase();
    
    if (lower.includes('payment')) {
      return 'Payment obligation clause - review terms and deadlines carefully';
    }
    
    if (lower.includes('liability')) {
      return 'Liability clause - assess risk exposure and consider insurance';
    }
    
    return 'Standard contractual provision';
  }

  private getDefaultRiskAssessment(): LegalAnalysisResult['riskAssessment'] {
    return {
      overallRisk: 'low',
      riskFactors: [],
      mitigationSuggestions: [],
      timelineRisks: []
    };
  }

  private calculateOverallConfidence(entities: LegalEntity[], legalArguments: LegalArgument[]): number {
    if (entities.length === 0) return 0.5;
    
    const avgEntityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
    const argConfidence = legalArguments.length > 0 
      ? legalArguments.reduce((sum, a) => sum + a.strength, 0) / legalArguments.length
      : 0.7;
    
    return (avgEntityConfidence + argConfidence) / 2;
  }
}

// Export singleton instance
export const advancedLegalEngine = new AdvancedLegalEngine();