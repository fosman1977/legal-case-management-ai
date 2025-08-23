/**
 * Test Documents and Fixtures - Week 12 Day 3-4
 * Comprehensive test data for all testing scenarios
 */

export const TEST_DOCUMENTS = {
  // Basic document types for unit testing
  SIMPLE_TEXT: {
    id: 'simple-text-1',
    name: 'Simple Text Document.txt',
    type: 'txt',
    size: 1024,
    content: 'This is a simple text document for basic testing purposes.',
    estimated_complexity: 0.1
  },

  ELECTRONIC_PDF: {
    id: 'electronic-pdf-1',
    name: 'Commercial Agreement.pdf',
    type: 'pdf',
    size: 1024000,
    content: `COMMERCIAL SERVICE AGREEMENT

This Agreement is entered into between the parties for the provision of professional services.

The service provider shall deliver all services in accordance with industry standards.

Payment terms: Net 30 days from invoice date.

Governing law: English law shall apply to this agreement.

Signed this day in London, England.`,
    requires_ocr: false,
    estimated_complexity: 0.5
  },

  SCANNED_PDF: {
    id: 'scanned-pdf-1', 
    name: 'Scanned Legal Document.pdf',
    type: 'pdf',
    size: 3072000,
    content: `[This document appears to be scanned and may require OCR processing]

LEGAL NOTICE

TO: All interested parties
FROM: Legal Department

Re: Important legal matter requiring attention

The undersigned hereby gives notice of legal proceedings...

[Document continues with legal text that would typically be harder to extract from scanned images]`,
    requires_ocr: true,
    estimated_complexity: 0.8
  },

  // PII-containing documents for anonymization testing
  DOCUMENT_WITH_PII: {
    id: 'pii-doc-1',
    name: 'Contract with Personal Information.pdf',
    type: 'pdf',
    content: `EMPLOYMENT CONTRACT

BETWEEN:
(1) John Smith of 123 Oakwood Drive, London SW1A 1AA ("Employee")
(2) ABC Corporation Limited (Company No. 12345678) ("Company")

Contact Details:
Employee: john.smith@email.com, Mobile: 07700-123456
Company: info@abc-corp.co.uk, Tel: 020-7946-0958

The Employee's National Insurance Number is AB123456C.
Bank Details: Sort Code 12-34-56, Account Number 12345678.

Salary: £45,000.00 per annum
Start Date: 1st January 2024
Contract signed: 15th December 2023

Witnesses:
Jane Doe (jane.doe@abc-corp.co.uk)
Robert Johnson (robert.johnson@legal.co.uk)`,
    estimated_complexity: 0.6
  },

  UK_LEGAL_DOCUMENT: {
    id: 'uk-legal-1',
    name: 'UK Legal Agreement.pdf', 
    type: 'pdf',
    content: `PARTICULARS OF CLAIM

BETWEEN:
CLAIMANT: David Wilson of 456 High Street, Manchester M1 2AB
DEFENDANT: XYZ Services Ltd (Company Registration No. 87654321)

The Claimant claims:
1. Damages for breach of contract
2. Interest pursuant to s.35A Senior Courts Act 1981
3. Costs

STATEMENT OF CASE:
1. By a written agreement dated 15th March 2023 ("the Agreement"), the Defendant agreed to provide maintenance services.

2. The Agreement provided for monthly payments of £2,500.00.

3. In breach of the Agreement, the Defendant failed to provide the services as specified.

PARTICULARS OF LOSS:
- Lost profits: £15,000.00
- Additional costs incurred: £3,500.00
- Total: £18,500.00

Court Fee: £455.00
Solicitor: Brown & Associates, 789 Legal Lane, London WC1A 1BB
Reference: BRW/2023/001`,
    estimated_complexity: 0.7
  },

  // Complex multi-party document
  MULTI_PARTY_AGREEMENT: {
    id: 'multi-party-1',
    name: 'Three Party Joint Venture.pdf',
    type: 'pdf', 
    content: `JOINT VENTURE AGREEMENT

THIS AGREEMENT is made between:

FIRST PARTY: TechStart Limited (Company No. 11111111)
Registered Office: 100 Innovation Street, London E1 6AN
Director: Sarah Chen (sarah.chen@techstart.co.uk)
Phone: 020-7123-4567

SECOND PARTY: Capital Ventures PLC (Company No. 22222222) 
Registered Office: 200 Finance Road, Edinburgh EH1 2CD
Managing Partner: Michael O'Connor (m.oconnor@capitalventures.co.uk)
Phone: 0131-456-7890

THIRD PARTY: Legal Advisory Services LLP (Company No. 33333333)
Registered Office: 300 Law Court, Cardiff CF1 3EF
Senior Partner: Emma Thompson (e.thompson@legaladvisory.co.uk)
Phone: 029-2034-5678

PROJECT DETAILS:
- Project Name: "NextGen Legal Tech Platform"
- Total Investment: £500,000.00
- TechStart contribution: Technology and IP (£300,000 equivalent)
- Capital Ventures contribution: Funding (£150,000 cash)
- Legal Advisory contribution: Legal services (£50,000 equivalent)

Key Dates:
- Agreement Date: 1st April 2023
- Project Launch: 1st July 2023  
- First Milestone: 1st October 2023
- Completion Target: 31st March 2024

INTELLECTUAL PROPERTY:
All IP developed shall be owned jointly by the parties in the following proportions:
- TechStart: 60%
- Capital Ventures: 30%
- Legal Advisory: 10%`,
    estimated_complexity: 0.9
  },

  // Document with sensitive/privileged content
  PRIVILEGED_DOCUMENT: {
    id: 'privileged-1',
    name: 'Attorney Client Privileged Communication.pdf',
    type: 'pdf',
    content: `PRIVILEGED AND CONFIDENTIAL
ATTORNEY-CLIENT COMMUNICATION

TO: Client (Name withheld - privileged)
FROM: Senior Partner, Legal Firm
DATE: 15th November 2023
RE: Litigation Strategy - Confidential Matter

This communication is subject to legal professional privilege and contains confidential information.

STRATEGY RECOMMENDATIONS:
The proposed approach involves three phases of litigation strategy that should not be disclosed to opposing counsel.

Our assessment indicates strong prospects of success based on confidential client information and trade secrets provided.

The proprietary methodology disclosed by the client provides a significant advantage in the proceedings.

RISK ASSESSMENT:
Classified information suggests potential exposure if certain documents are disclosed during discovery.

NEXT STEPS:
1. Prepare confidential brief
2. Engage expert witness (details privileged)  
3. Review restricted documents
4. Develop proprietary defense strategy

This communication contains work product and is strictly confidential.`,
    estimated_complexity: 0.5
  },

  // Financial/commercial document
  FINANCIAL_DOCUMENT: {
    id: 'financial-1',
    name: 'Commercial Invoice and Agreement.pdf',
    type: 'pdf',
    content: `COMMERCIAL INVOICE

Invoice No: INV-2023-001
Date: 30th September 2023

SUPPLIER:
Global Services International Ltd
Company Registration: 98765432
VAT Number: GB123456789
Address: 500 Business Park, London W1A 0AA
Contact: finance@globalservices.co.uk
Phone: 020-8765-4321

CUSTOMER: 
Regional Manufacturing Corp
Address: 600 Industrial Estate, Birmingham B1 2CD
Contact: accounts@regional-mfg.co.uk
Account Number: CUST-456789

SERVICES PROVIDED:
1. Consultancy Services (March-September 2023): £75,000.00
2. Implementation Support: £25,000.00  
3. Training and Documentation: £15,000.00
4. Ongoing Support (6 months): £12,000.00

Subtotal: £127,000.00
VAT (20%): £25,400.00
TOTAL: £152,400.00

Payment Terms: 30 days net
Bank Details: 
Sort Code: 12-34-56
Account: 87654321
IBAN: GB29NWBK12345687654321

Reference: Project Alpha Implementation Q3-2023`,
    estimated_complexity: 0.6
  },

  // Document with tables and complex formatting
  COMPLEX_FORMATTED_DOCUMENT: {
    id: 'complex-format-1',
    name: 'Legal Analysis with Tables.pdf',
    type: 'pdf',
    content: `LEGAL PRECEDENT ANALYSIS

Case Reference: Smith v Jones & Others [2023] EWHC 1234 (QB)

PARTIES ANALYSIS:
╔════════════════════╦═══════════════════╦═══════════════════╗
║ Party Name         ║ Legal Status      ║ Representation    ║
╠════════════════════╬═══════════════════╬═══════════════════╣
║ John Smith         ║ Claimant          ║ Barristers' Chambers║
║ Mary Jones         ║ First Defendant   ║ City Law Firm     ║
║ ABC Corp Ltd       ║ Second Defendant  ║ Commercial Legal  ║
║ Insurance Co PLC   ║ Third Party       ║ Insurance Lawyers ║
╚════════════════════╩═══════════════════╩═══════════════════╝

CHRONOLOGY OF EVENTS:
1. 15/01/2023 - Initial contract signed between Smith and Jones
2. 28/02/2023 - First breach alleged by Smith  
3. 15/03/2023 - Jones involves ABC Corp as sub-contractor
4. 30/04/2023 - Insurance claim filed by Jones
5. 15/06/2023 - Proceedings issued by Smith
6. 30/07/2023 - Defence filed by all defendants
7. 15/09/2023 - Case management conference
8. 30/11/2023 - Trial date set for March 2024

FINANCIAL BREAKDOWN:
Original Contract Value: £100,000.00
Disputed Amount: £25,000.00
Legal Costs (estimated): £45,000.00
Insurance Excess: £5,000.00

LEGAL ISSUES:
- Breach of contract (primary claim)
- Negligent misstatement (alternative claim)  
- Third party contribution rights
- Insurance coverage disputes
- Limitation periods
- Jurisdiction challenges`,
    estimated_complexity: 0.8
  }
}

// Document sets for different testing scenarios
export const DOCUMENT_SETS = {
  BASIC_PROCESSING: [
    TEST_DOCUMENTS.SIMPLE_TEXT,
    TEST_DOCUMENTS.ELECTRONIC_PDF
  ],

  ANONYMIZATION_TESTING: [
    TEST_DOCUMENTS.DOCUMENT_WITH_PII,
    TEST_DOCUMENTS.UK_LEGAL_DOCUMENT,
    TEST_DOCUMENTS.MULTI_PARTY_AGREEMENT
  ],

  COMPLEX_ANALYSIS: [
    TEST_DOCUMENTS.MULTI_PARTY_AGREEMENT,
    TEST_DOCUMENTS.FINANCIAL_DOCUMENT,
    TEST_DOCUMENTS.COMPLEX_FORMATTED_DOCUMENT
  ],

  PRIVACY_COMPLIANCE: [
    TEST_DOCUMENTS.PRIVILEGED_DOCUMENT,
    TEST_DOCUMENTS.DOCUMENT_WITH_PII,
    TEST_DOCUMENTS.FINANCIAL_DOCUMENT
  ],

  MIXED_COMPLEXITY: [
    TEST_DOCUMENTS.SIMPLE_TEXT,
    TEST_DOCUMENTS.DOCUMENT_WITH_PII,
    TEST_DOCUMENTS.MULTI_PARTY_AGREEMENT,
    TEST_DOCUMENTS.SCANNED_PDF,
    TEST_DOCUMENTS.COMPLEX_FORMATTED_DOCUMENT
  ],

  LARGE_CASE_SIMULATION: Array.from({ length: 25 }, (_, i) => ({
    id: `case-doc-${i + 1}`,
    name: `Case Document ${i + 1}.pdf`,
    type: 'pdf',
    size: 200000 + Math.random() * 800000,
    content: i % 5 === 0 ? 
      TEST_DOCUMENTS.MULTI_PARTY_AGREEMENT.content : 
      i % 3 === 0 ?
        TEST_DOCUMENTS.FINANCIAL_DOCUMENT.content :
        TEST_DOCUMENTS.UK_LEGAL_DOCUMENT.content,
    estimated_complexity: 0.3 + Math.random() * 0.5
  }))
}

// Test case contexts
export const TEST_CASE_CONTEXTS = {
  COMMERCIAL_LITIGATION: {
    case_id: 'test-commercial-001',
    practice_area: 'commercial_litigation',
    jurisdiction: 'england_wales',
    case_type: 'breach_of_contract',
    court: 'high_court_qbd',
    urgency: 'medium'
  },

  EMPLOYMENT_DISPUTE: {
    case_id: 'test-employment-001', 
    practice_area: 'employment_law',
    jurisdiction: 'england_wales',
    case_type: 'unfair_dismissal',
    tribunal: 'employment_tribunal',
    urgency: 'high'
  },

  CORPORATE_TRANSACTION: {
    case_id: 'test-corporate-001',
    practice_area: 'corporate_law',
    jurisdiction: 'england_wales', 
    case_type: 'merger_acquisition',
    transaction_value: 'high_value',
    urgency: 'high'
  },

  PROPERTY_DISPUTE: {
    case_id: 'test-property-001',
    practice_area: 'property_law',
    jurisdiction: 'england_wales',
    case_type: 'boundary_dispute', 
    court: 'county_court',
    urgency: 'low'
  },

  PERSONAL_INJURY: {
    case_id: 'test-pi-001',
    practice_area: 'personal_injury',
    jurisdiction: 'england_wales',
    case_type: 'road_traffic_accident',
    court: 'county_court',
    urgency: 'medium'
  }
}

// Expected results for validation
export const EXPECTED_RESULTS = {
  ANONYMIZATION: {
    PII_PATTERNS_REMOVED: [
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/, // Full names
      /\b\d{2}\/\d{2}\/\d{4}\b/, // Dates  
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
      /\b(?:\+44|0)\d{10,11}\b/, // UK phone numbers
      /\b\d{2}-\d{2}-\d{2}\b/, // Sort codes
      /\b\d{8}\b/, // Account numbers
      /\b[A-Z]{2}\d{6}[A-D]\b/ // NI numbers
    ],

    ANONYMIZED_PATTERNS: [
      /PERSON_\d{3}/,
      /ORG_\d{3}/,
      /DATE_REF_\d{3}/,
      /CONTACT_\d{3}/,
      /ID_\d{3}/,
      /LOCATION_\d{3}/,
      /AMOUNT_\w+_\d{3}/
    ]
  },

  PERFORMANCE: {
    SINGLE_DOCUMENT_MAX_TIME: 5000, // 5 seconds
    BATCH_PROCESSING_MIN_THROUGHPUT: 0.1, // docs per second
    MEMORY_INCREASE_LIMIT: 500, // MB
    CACHE_HIT_RATE_MIN: 0.5, // 50%
    WORKER_EFFICIENCY_MIN: 0.3, // 30%
    CONCURRENT_SUCCESS_RATE_MIN: 0.8 // 80%
  },

  PRIVACY: {
    MIN_PRIVACY_GRADE: 'C',
    MAX_RISK_SCORE: 5,
    REQUIRED_REDACTIONS: [
      'CONFIDENTIAL',
      'PRIVILEGED', 
      'ATTORNEY-CLIENT',
      'TRADE SECRET',
      'PROPRIETARY'
    ]
  }
}

// Mock data generators
export function generateMockDocuments(count, complexity = 'medium') {
  const complexityMap = {
    simple: { content: TEST_DOCUMENTS.SIMPLE_TEXT.content, complexity: 0.2 },
    medium: { content: TEST_DOCUMENTS.UK_LEGAL_DOCUMENT.content, complexity: 0.5 },
    complex: { content: TEST_DOCUMENTS.MULTI_PARTY_AGREEMENT.content, complexity: 0.8 }
  }

  const template = complexityMap[complexity]

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-doc-${i + 1}`,
    name: `Mock Document ${i + 1}.pdf`,
    type: 'pdf',
    size: 100000 + Math.random() * 900000,
    content: `${template.content} Document ${i + 1}.`,
    estimated_complexity: template.complexity + (Math.random() - 0.5) * 0.2
  }))
}

export function generateMockCaseContext(practiceArea = 'general') {
  return {
    case_id: `mock-case-${Date.now()}`,
    practice_area: practiceArea,
    jurisdiction: 'england_wales',
    case_type: 'general_civil',
    urgency: 'medium',
    created_at: new Date().toISOString()
  }
}

export function createCorruptedDocument() {
  return {
    id: 'corrupted-doc',
    name: 'Corrupted Document.pdf',
    type: 'pdf',
    size: 0,
    content: null,
    estimated_complexity: 1.0,
    error_simulation: true
  }
}

export function createLargeDocument(sizeMB = 10) {
  const contentSize = sizeMB * 1024 * 1024
  const content = 'Large document content '.repeat(Math.floor(contentSize / 21))

  return {
    id: `large-doc-${sizeMB}mb`,
    name: `Large Document ${sizeMB}MB.pdf`,
    type: 'pdf',
    size: contentSize,
    content: content,
    estimated_complexity: 0.7
  }
}

// Validation helpers
export function validateAnonymization(originalContent, anonymizedContent) {
  const issues = []

  // Check for remaining PII patterns
  EXPECTED_RESULTS.ANONYMIZATION.PII_PATTERNS_REMOVED.forEach((pattern, index) => {
    if (pattern.test(anonymizedContent)) {
      issues.push(`PII pattern ${index} still present in anonymized content`)
    }
  })

  // Check for presence of anonymized patterns
  EXPECTED_RESULTS.ANONYMIZATION.ANONYMIZED_PATTERNS.forEach((pattern, index) => {
    if (!pattern.test(anonymizedContent)) {
      issues.push(`Expected anonymized pattern ${index} not found`)
    }
  })

  return {
    isValid: issues.length === 0,
    issues: issues
  }
}

export function validatePerformance(metrics) {
  const issues = []

  if (metrics.processingTime > EXPECTED_RESULTS.PERFORMANCE.SINGLE_DOCUMENT_MAX_TIME) {
    issues.push(`Processing time ${metrics.processingTime}ms exceeds limit`)
  }

  if (metrics.throughput < EXPECTED_RESULTS.PERFORMANCE.BATCH_PROCESSING_MIN_THROUGHPUT) {
    issues.push(`Throughput ${metrics.throughput} below minimum`)
  }

  return {
    isValid: issues.length === 0,
    issues: issues
  }
}

export default {
  TEST_DOCUMENTS,
  DOCUMENT_SETS,
  TEST_CASE_CONTEXTS,
  EXPECTED_RESULTS,
  generateMockDocuments,
  generateMockCaseContext,
  createCorruptedDocument,
  createLargeDocument,
  validateAnonymization,
  validatePerformance
}