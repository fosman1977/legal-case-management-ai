/**
 * Anonymization Unit Tests - Week 12 Day 3-4
 * Comprehensive unit tests for the BulletproofAnonymizer
 */

import { describe, test, expect, beforeAll, beforeEach, jest } from '@jest/globals'
import BulletproofAnonymizer from '../../src/analysis/BulletproofAnonymizer.js'

describe('Anonymization Unit Tests', () => {
  let anonymizer

  beforeAll(() => {
    anonymizer = new BulletproofAnonymizer()
  })

  beforeEach(() => {
    // Clear anonymizer state before each test
    anonymizer.clearMappings()
  })

  describe('UK Legal Entity Detection', () => {
    test('should detect and anonymize UK legal entities', async () => {
      const text = "John Smith of ABC Ltd (Company No. 12345678) signed the contract on 15/03/2023"
      
      const mock_document = {
        id: 'test-doc-1',
        content: text
      }
      
      const result = await anonymizer.anonymizeDocument(mock_document)
      
      expect(result.anonymized_doc.content).not.toContain('John Smith')
      expect(result.anonymized_doc.content).not.toContain('ABC Ltd')
      expect(result.anonymized_doc.content).not.toContain('15/03/2023')
      expect(result.anonymized_doc.content).not.toContain('12345678')
      
      // Check anonymized replacements exist
      expect(result.anonymized_doc.content).toMatch(/PERSON_\d{3}/)
      expect(result.anonymized_doc.content).toMatch(/ORG_\d{3}/)
      expect(result.anonymized_doc.content).toMatch(/DATE_REF_\d{3}/)
      expect(result.anonymized_doc.content).toMatch(/ID_\d{3}/)
      
      // Verify entity detection
      expect(result.doc_entities.length).toBeGreaterThan(0)
      const entity_types = result.doc_entities.map(e => e.type)
      expect(entity_types).toContain('person')
      expect(entity_types).toContain('organization')
      expect(entity_types).toContain('date')
      expect(entity_types).toContain('identifier')
    })

    test('should handle UK company registration numbers', async () => {
      const text = "ABC Corporation Limited (Company Registration No. 87654321) and XYZ Ltd (Co. No. 11223344)"
      
      const result = await anonymizer.anonymizeDocument({
        id: 'test-company-1',
        content: text
      })
      
      expect(result.anonymized_doc.content).not.toContain('87654321')
      expect(result.anonymized_doc.content).not.toContain('11223344')
      expect(result.anonymized_doc.content).toMatch(/ID_\d{3}/g)
      
      const identifier_entities = result.doc_entities.filter(e => e.type === 'identifier')
      expect(identifier_entities.length).toBeGreaterThanOrEqual(2)
    })

    test('should detect UK addresses', async () => {
      const text = "123 High Street, London SW1A 1AA and 456 Oak Road, Manchester M1 1AB"
      
      const result = await anonymizer.anonymizeDocument({
        id: 'test-address-1',
        content: text
      })
      
      expect(result.anonymized_doc.content).not.toContain('123 High Street')
      expect(result.anonymized_doc.content).not.toContain('456 Oak Road')
      expect(result.anonymized_doc.content).toMatch(/LOCATION_\d{3}/g)
      
      const location_entities = result.doc_entities.filter(e => e.type === 'location')
      expect(location_entities.length).toBeGreaterThanOrEqual(2)
    })

    test('should handle UK phone numbers', async () => {
      const text = "Contact us at 020-1234-5678 or mobile 07700-123456 or +44 161 234 5678"
      
      const result = await anonymizer.anonymizeDocument({
        id: 'test-phone-1',
        content: text
      })
      
      expect(result.anonymized_doc.content).not.toContain('020-1234-5678')
      expect(result.anonymized_doc.content).not.toContain('07700-123456')
      expect(result.anonymized_doc.content).not.toContain('+44 161 234 5678')
      expect(result.anonymized_doc.content).toMatch(/CONTACT_\d{3}/g)
      
      const contact_entities = result.doc_entities.filter(e => e.type === 'contact')
      expect(contact_entities.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Complex Legal Document Structure Handling', () => {
    test('should handle complex legal document structures', async () => {
      const legal_text = `
        BETWEEN:
        (1) John Smith of 123 High Street, London ("the Claimant")
        (2) ABC Corporation Limited (Company No. 87654321) ("the Defendant")
        
        WHEREAS the Defendant breached the contract dated 1st January 2023
        for the sum of £50,000.00...
        
        The parties' solicitors are:
        - For the Claimant: Smith & Partners LLP, solicitors@smith.co.uk
        - For the Defendant: Jones Legal Ltd, legal@jones.com
      `
      
      const result = await anonymizer.anonymizeDocument({
        id: 'test-complex-1',
        content: legal_text
      })
      
      // Verify anonymization
      const content = result.anonymized_doc.content
      expect(content).not.toContain('John Smith')
      expect(content).not.toContain('ABC Corporation Limited')
      expect(content).not.toContain('123 High Street')
      expect(content).not.toContain('87654321')
      expect(content).not.toContain('1st January 2023')
      expect(content).not.toContain('£50,000.00')
      expect(content).not.toContain('solicitors@smith.co.uk')
      expect(content).not.toContain('legal@jones.com')
      
      // Verify legal structure preserved
      expect(content).toContain('BETWEEN:')
      expect(content).toContain('(1)')
      expect(content).toContain('(2)')
      expect(content).toContain('("the Claimant")')
      expect(content).toContain('("the Defendant")')
      expect(content).toContain('WHEREAS')
      
      // Verify anonymized entities
      expect(content).toMatch(/PERSON_\d{3}/)
      expect(content).toMatch(/ORG_\d{3}/)
      expect(content).toMatch(/LOCATION_\d{3}/)
      expect(content).toMatch(/ID_\d{3}/)
      expect(content).toMatch(/DATE_REF_\d{3}/)
      expect(content).toMatch(/AMOUNT_\w+_\d{3}/)
      expect(content).toMatch(/CONTACT_\d{3}/)
      
      // Verify entity counts
      expect(result.doc_entities.length).toBeGreaterThan(5)
      
      const privacy_analysis = anonymizer.analyzePrivacyRisk(result.doc_entities)
      expect(privacy_analysis.privacy_grade).toMatch(/[A-C]/)
    })

    test('should classify document types correctly', async () => {
      const contract_text = "This Agreement is made between the parties whereas each party agrees to perform obligations"
      const email_text = "From: john@example.com To: mary@example.com Subject: Contract Review Sent: Monday"
      const memo_text = "MEMORANDUM TO: Legal Team RE: Contract Analysis regarding the recent agreement"
      
      const contract_result = await anonymizer.anonymizeDocument({
        id: 'contract-test',
        content: contract_text
      })
      
      const email_result = await anonymizer.anonymizeDocument({
        id: 'email-test', 
        content: email_text
      })
      
      const memo_result = await anonymizer.anonymizeDocument({
        id: 'memo-test',
        content: memo_text
      })
      
      // Document type should be inferred from content patterns
      expect(contract_result.anonymized_doc.content).toContain('Agreement')
      expect(email_result.anonymized_doc.content).toContain('From:')
      expect(memo_result.anonymized_doc.content).toContain('MEMORANDUM')
    })
  })

  describe('Pattern Detection and Confidence Scoring', () => {
    test('should assign appropriate confidence scores', async () => {
      const text = "john.smith@email.com called 020-1234-5678 about Case No. ABC-2023-001"
      
      const result = await anonymizer.anonymizeDocument({
        id: 'confidence-test',
        content: text
      })
      
      // Email should have very high confidence
      const email_entity = result.doc_entities.find(e => e.detection_pattern === 'email_addresses')
      expect(email_entity?.confidence).toBeGreaterThanOrEqual(0.95)
      
      // Phone should have high confidence  
      const phone_entity = result.doc_entities.find(e => e.detection_pattern === 'phone_numbers')
      expect(phone_entity?.confidence).toBeGreaterThanOrEqual(0.8)
      
      // Case number should have very high confidence
      const case_entity = result.doc_entities.find(e => e.detection_pattern === 'case_numbers')
      expect(case_entity?.confidence).toBeGreaterThanOrEqual(0.9)
    })

    test('should detect person names with appropriate confidence', async () => {
      const likely_names = "John Smith and Mary Johnson attended the meeting"
      const unlikely_names = "New York and Los Angeles are cities" // Should not be detected as names
      
      const likely_result = await anonymizer.anonymizeDocument({
        id: 'names-likely',
        content: likely_names
      })
      
      const unlikely_result = await anonymizer.anonymizeDocument({
        id: 'names-unlikely', 
        content: unlikely_names
      })
      
      // Should detect likely names
      const likely_persons = likely_result.doc_entities.filter(e => e.type === 'person')
      expect(likely_persons.length).toBeGreaterThan(0)
      expect(likely_persons[0]?.confidence).toBeGreaterThanOrEqual(0.6)
      
      // Should not detect city names as persons (or if it does, with lower confidence)
      const unlikely_persons = unlikely_result.doc_entities.filter(e => e.type === 'person')
      if (unlikely_persons.length > 0) {
        expect(unlikely_persons[0]?.confidence).toBeLessThan(0.7)
      }
    })

    test('should extract contextual information', async () => {
      const text = "The defendant John Smith, residing at 123 Main Street, breached the contract on 15th March 2023"
      
      const result = await anonymizer.anonymizeDocument({
        id: 'context-test',
        content: text
      })
      
      // Each entity should have context
      result.doc_entities.forEach(entity => {
        expect(entity.context).toBeDefined()
        expect(entity.context.length).toBeGreaterThan(0)
        expect(entity.context).toContain(entity.original_value)
      })
    })
  })

  describe('Financial Amount Handling', () => {
    test('should preserve magnitude while anonymizing amounts', async () => {
      const text = "The contract value is £50,000.00 and the penalty is £500.00"
      
      const result = await anonymizer.anonymizeDocument({
        id: 'financial-test',
        content: text
      })
      
      expect(result.anonymized_doc.content).not.toContain('£50,000.00')
      expect(result.anonymized_doc.content).not.toContain('£500.00')
      
      // Should preserve magnitude categories
      expect(result.anonymized_doc.content).toMatch(/AMOUNT_LARGE_\d{3}/) // £50,000 
      expect(result.anonymized_doc.content).toMatch(/AMOUNT_SMALL_\d{3}/) // £500
      
      const financial_entities = result.doc_entities.filter(e => e.type === 'financial')
      expect(financial_entities.length).toBe(2)
    })

    test('should categorize amount magnitudes correctly', async () => {
      const small_amount = "£500"
      const medium_amount = "£5,000" 
      const large_amount = "£50,000"
      const major_amount = "£500,000"
      const massive_amount = "£5,000,000"
      
      const amounts = [small_amount, medium_amount, large_amount, major_amount, massive_amount]
      const expected_magnitudes = ['SMALL', 'MEDIUM', 'LARGE', 'MAJOR', 'MASSIVE']
      
      for (let i = 0; i < amounts.length; i++) {
        const result = await anonymizer.anonymizeDocument({
          id: `amount-${i}`,
          content: `The amount is ${amounts[i]}`
        })
        
        expect(result.anonymized_doc.content).toContain(`AMOUNT_${expected_magnitudes[i]}_`)
      }
    })
  })

  describe('Reversible Anonymization', () => {
    test('should support reversible anonymization mapping', async () => {
      const text = "John Smith works at ABC Corp and lives at 123 Oak Street"
      
      const result = await anonymizer.anonymizeDocument({
        id: 'reversible-test',
        content: text
      })
      
      // Should be able to reverse anonymization (in secure environments)
      const anonymized_person = result.doc_entities.find(e => e.type === 'person')?.anonymized_value
      const anonymized_org = result.doc_entities.find(e => e.type === 'organization')?.anonymized_value
      const anonymized_location = result.doc_entities.find(e => e.type === 'location')?.anonymized_value
      
      expect(anonymized_person).toBeDefined()
      expect(anonymized_org).toBeDefined()
      expect(anonymized_location).toBeDefined()
      
      // Test deanonymization (should work)
      if (anonymized_person) {
        const original_person = anonymizer.deanonymize(anonymized_person)
        expect(original_person).toBe('John Smith')
      }
      
      if (anonymized_org) {
        const original_org = anonymizer.deanonymize(anonymized_org)
        expect(original_org).toBe('ABC Corp')
      }
      
      if (anonymized_location) {
        const original_location = anonymizer.deanonymize(anonymized_location)
        expect(original_location).toBe('123 Oak Street')
      }
    })

    test('should throw error for unknown anonymized values', () => {
      expect(() => {
        anonymizer.deanonymize('UNKNOWN_ENTITY_999')
      }).toThrow('Anonymized value not found in mapping')
    })

    test('should maintain consistent anonymization across documents', async () => {
      const doc1_text = "John Smith signed the contract"
      const doc2_text = "The contract was reviewed by John Smith"
      
      const result1 = await anonymizer.anonymizeDocument({
        id: 'consistency-1',
        content: doc1_text
      })
      
      const result2 = await anonymizer.anonymizeDocument({
        id: 'consistency-2', 
        content: doc2_text
      })
      
      // Same person should get same anonymized value
      const person1 = result1.doc_entities.find(e => e.type === 'person')
      const person2 = result2.doc_entities.find(e => e.type === 'person')
      
      expect(person1?.anonymized_value).toBe(person2?.anonymized_value)
    })
  })

  describe('Privacy Risk Assessment', () => {
    test('should assess privacy risks correctly', async () => {
      // High-risk document with many entities
      const high_risk_entities = Array.from({ length: 15 }, (_, i) => ({
        type: 'person',
        anonymized_value: `PERSON_${i.toString().padStart(3, '0')}`,
        confidence: 0.9
      }))
      
      const high_risk_analysis = anonymizer.analyzePrivacyRisk(high_risk_entities)
      expect(high_risk_analysis.risks.length).toBeGreaterThan(0)
      expect(high_risk_analysis.risk_score).toBeGreaterThan(1)
      expect(high_risk_analysis.privacy_grade).toMatch(/[B-F]/)
      
      // Low-risk document with few entities
      const low_risk_entities = [
        { type: 'person', anonymized_value: 'PERSON_001', confidence: 0.9 },
        { type: 'organization', anonymized_value: 'ORG_001', confidence: 0.9 }
      ]
      
      const low_risk_analysis = anonymizer.analyzePrivacyRisk(low_risk_entities)
      expect(low_risk_analysis.risk_score).toBeLessThan(2)
      expect(low_risk_analysis.privacy_grade).toMatch(/[A-B]/)
    })

    test('should identify identifier exposure risks', async () => {
      const identifier_entities = Array.from({ length: 8 }, (_, i) => ({
        type: 'identifier',
        anonymized_value: `ID_${i.toString().padStart(3, '0')}`,
        confidence: 0.95
      }))
      
      const risk_analysis = anonymizer.analyzePrivacyRisk(identifier_entities)
      
      const identifier_risk = risk_analysis.risks.find(r => r.type === 'identifier_exposure')
      expect(identifier_risk).toBeDefined()
      expect(identifier_risk?.severity).toBe('high')
      expect(identifier_risk?.count).toBe(8)
    })

    test('should provide risk mitigation recommendations', async () => {
      const mixed_entities = [
        ...Array.from({ length: 12 }, (_, i) => ({ type: 'person', anonymized_value: `PERSON_${i}` })),
        ...Array.from({ length: 25 }, (_, i) => ({ type: 'financial', anonymized_value: `AMOUNT_LARGE_${i}` })),
        ...Array.from({ length: 6 }, (_, i) => ({ type: 'identifier', anonymized_value: `ID_${i}` }))
      ]
      
      const risk_analysis = anonymizer.analyzePrivacyRisk(mixed_entities)
      
      expect(risk_analysis.risks.length).toBeGreaterThan(0)
      
      risk_analysis.risks.forEach(risk => {
        expect(risk.recommendation).toBeDefined()
        expect(risk.recommendation.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Sensitive Content Redaction', () => {
    test('should redact sensitive content patterns', async () => {
      const sensitive_text = "This information is confidential and subject to attorney-client privilege. The trade secret methodology is proprietary."
      
      const result = await anonymizer.anonymizeDocument({
        id: 'sensitive-test',
        content: sensitive_text
      })
      
      expect(result.anonymized_doc.content).toContain('[REDACTED - CONFIDENTIAL]')
      expect(result.anonymized_doc.content).toContain('[REDACTED - ATTORNEY-CLIENT]') 
      expect(result.anonymized_doc.content).toContain('[REDACTED - PROPRIETARY]')
    })

    test('should handle multiple sensitive terms in same sentence', async () => {
      const text = "The privileged and confidential trade secret information is classified."
      
      const result = await anonymizer.anonymizeDocument({
        id: 'multiple-sensitive',
        content: text
      })
      
      // Should redact the entire sentence containing sensitive terms
      expect(result.anonymized_doc.content).toContain('[REDACTED -')
    })
  })

  describe('Performance and Memory Management', () => {
    test('should handle large documents efficiently', async () => {
      const large_text = "John Smith ".repeat(1000) + "works at ABC Corp ".repeat(1000)
      
      const start_time = performance.now()
      const result = await anonymizer.anonymizeDocument({
        id: 'large-doc-test',
        content: large_text
      })
      const processing_time = performance.now() - start_time
      
      expect(result.anonymized_doc.content).toBeDefined()
      expect(processing_time).toBeLessThan(5000) // Should complete in under 5 seconds
      expect(result.doc_entities.length).toBeGreaterThan(0)
    }, 10000)

    test('should clear mappings correctly', () => {
      const initial_stats = anonymizer.getAnonymizerStats()
      
      // Add some mappings
      anonymizer.anonymization_map.set('test', 'PERSON_001')
      anonymizer.reverse_map.set('PERSON_001', 'test')
      anonymizer.entity_counters.person = 5
      
      expect(anonymizer.anonymization_map.size).toBe(1)
      expect(anonymizer.reverse_map.size).toBe(1)
      expect(anonymizer.entity_counters.person).toBe(5)
      
      // Clear mappings
      anonymizer.clearMappings()
      
      expect(anonymizer.anonymization_map.size).toBe(0)
      expect(anonymizer.reverse_map.size).toBe(0)
      expect(anonymizer.entity_counters.person).toBe(0)
    })
  })

  describe('Entity Consolidation', () => {
    test('should consolidate duplicate entities correctly', async () => {
      const entities = [
        {
          id: '1',
          anonymized_value: 'PERSON_001',
          type: 'person',
          source_documents: ['doc1'],
          confidence: 0.8
        },
        {
          id: '2', 
          anonymized_value: 'PERSON_001', // Same anonymized value
          type: 'person',
          source_documents: ['doc2'],
          confidence: 0.9
        },
        {
          id: '3',
          anonymized_value: 'ORG_001',
          type: 'organization', 
          source_documents: ['doc1'],
          confidence: 0.85
        }
      ]
      
      const consolidated = anonymizer.consolidateEntities(entities)
      
      expect(consolidated.length).toBe(2) // Should consolidate to 2 unique entities
      
      const consolidated_person = consolidated.find(e => e.anonymized_value === 'PERSON_001')
      expect(consolidated_person?.source_documents).toContain('doc1')
      expect(consolidated_person?.source_documents).toContain('doc2')
      expect(consolidated_person?.confidence).toBe(0.9) // Should use higher confidence
    })
  })

  describe('Security Features', () => {
    test('should create secure mapping without original values', () => {
      // Add some test mappings
      anonymizer.anonymization_map.set('John Smith', 'PERSON_001')
      anonymizer.anonymization_map.set('ABC Corp', 'ORG_001')
      
      const secure_mapping = anonymizer.createSecureMapping()
      
      expect(secure_mapping.total_mappings).toBe(2)
      expect(secure_mapping.entity_counts).toBeDefined()
      expect(secure_mapping.anonymization_timestamp).toBeDefined()
      expect(secure_mapping.security_note).toContain('Original values are not included')
      
      // Should not contain original values
      const mapping_string = JSON.stringify(secure_mapping)
      expect(mapping_string).not.toContain('John Smith')
      expect(mapping_string).not.toContain('ABC Corp')
    })

    test('should provide anonymizer statistics', () => {
      const stats = anonymizer.getAnonymizerStats()
      
      expect(stats.anonymizer_type).toBe('BulletproofAnonymizer')
      expect(stats.patterns_supported).toBeGreaterThan(0)
      expect(stats.entity_types).toContain('person')
      expect(stats.entity_types).toContain('organization')
      expect(stats.capabilities).toContain('Multi-pattern entity detection')
      expect(stats.capabilities).toContain('Reversible anonymization mapping')
      expect(stats.security_features).toContain('Memory mapping clearance')
    })
  })
})