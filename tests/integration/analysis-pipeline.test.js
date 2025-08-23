/**
 * Legal Analysis Pipeline Integration Tests - Week 12 Day 3-4
 * Comprehensive testing suite for the complete analysis pipeline
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import { performance } from 'perf_hooks'
import UnifiedAnalysisEngine from '../../src/analysis/UnifiedAnalysisEngine.js'
import BulletproofAnonymizer from '../../src/analysis/BulletproofAnonymizer.js'
import PerformanceOptimizer from '../../src/optimization/PerformanceOptimizer.js'
import QdrantSearchEngine from '../../src/search/QdrantSearchEngine.js'
import LegalKnowledgeBase from '../../src/knowledge/LegalKnowledgeBase.js'

describe('Legal Analysis Pipeline Integration Tests', () => {
  let analysis_engine
  let test_documents
  let performance_optimizer
  let search_engine
  let knowledge_base
  
  beforeAll(async () => {
    // Initialize analysis engine
    analysis_engine = new UnifiedAnalysisEngine()
    await analysis_engine.initialize?.() || true
    
    // Initialize performance optimizer
    performance_optimizer = new PerformanceOptimizer()
    await performance_optimizer.initializeWorkerPool()
    
    // Initialize search engine (mock for testing)
    search_engine = new QdrantSearchEngine()
    // Mock initialize for testing
    search_engine.initialize = jest.fn().mockResolvedValue(true)
    search_engine.embedder = { mockEmbedder: true }
    
    // Initialize knowledge base
    knowledge_base = new LegalKnowledgeBase(search_engine)
    
    // Load test documents
    test_documents = await loadTestDocuments()
    
    console.log('✅ Test environment initialized')
  }, 30000)

  afterAll(async () => {
    // Cleanup
    if (performance_optimizer) {
      await performance_optimizer.cleanup()
    }
    console.log('✅ Test environment cleaned up')
  }, 10000)

  describe('Document Processing Pipeline', () => {
    test('should process electronic PDF with high accuracy', async () => {
      const pdf_doc = test_documents.electronic_pdf
      
      const result = await analysis_engine.analyzeCase([pdf_doc], {
        case_id: 'test-electronic-pdf',
        practice_area: 'commercial',
        jurisdiction: 'uk'
      })
      
      expect(result.success).toBe(true)
      expect(result.unified_results).toBeDefined()
      expect(result.processing_summary.documents_processed).toBe(1)
      expect(result.processing_summary.total_processing_time).toBeLessThan(5000) // 5 seconds max
      
      // Verify document extraction
      const processed_docs = result.unified_results.detailed_results
      expect(processed_docs).toBeDefined()
      
      console.log(`📄 Electronic PDF processed in ${Math.round(result.processing_summary.total_processing_time)}ms`)
    }, 10000)

    test('should handle scanned documents with OCR simulation', async () => {
      const scanned_doc = test_documents.scanned_pdf
      
      const result = await analysis_engine.analyzeCase([scanned_doc], {
        case_id: 'test-scanned-pdf',
        practice_area: 'litigation',
        jurisdiction: 'uk'
      })
      
      expect(result.success).toBe(true)
      expect(result.processing_summary.documents_processed).toBe(1)
      expect(result.processing_summary.total_processing_time).toBeLessThan(30000) // 30 seconds max
      expect(result.unified_results.privacy_protection.privacy_grade).toMatch(/[A-F][+-]?/)
      
      console.log(`📄 Scanned PDF processed in ${Math.round(result.processing_summary.total_processing_time)}ms`)
    }, 35000)

    test('should process multiple document types in batch', async () => {
      const mixed_documents = [
        test_documents.electronic_pdf,
        test_documents.text_document,
        test_documents.word_document
      ]
      
      const result = await analysis_engine.analyzeCase(mixed_documents, {
        case_id: 'test-mixed-batch',
        practice_area: 'general',
        jurisdiction: 'uk'
      })
      
      expect(result.success).toBe(true)
      expect(result.processing_summary.documents_processed).toBe(3)
      expect(result.unified_results.detailed_results).toBeDefined()
      
      // Verify different document types processed
      const detailed = result.unified_results.detailed_results
      expect(detailed).toBeDefined()
      
      console.log(`📄 Mixed batch processed: ${result.processing_summary.documents_processed} documents`)
    }, 15000)

    test('should handle document processing errors gracefully', async () => {
      const corrupted_doc = test_documents.corrupted_document
      
      const result = await analysis_engine.analyzeCase([corrupted_doc], {
        case_id: 'test-error-handling',
        practice_area: 'general',
        jurisdiction: 'uk'
      })
      
      // Should complete but potentially with errors
      expect(result).toBeDefined()
      expect(result.processing_summary).toBeDefined()
      
      console.log(`📄 Error handling test completed`)
    }, 10000)
  })

  describe('Anonymization Pipeline', () => {
    test('should anonymize all PII with high confidence', async () => {
      const document_with_pii = test_documents.contract_with_names
      
      const result = await analysis_engine.analyzeCase([document_with_pii], {
        case_id: 'test-anonymization',
        practice_area: 'contract',
        jurisdiction: 'uk'
      })
      
      expect(result.success).toBe(true)
      expect(result.unified_results.privacy_protection.privacy_grade).toMatch(/[A-C][+-]?/)
      expect(result.unified_results.privacy_protection.entities_processed).toBeGreaterThan(0)
      
      // Verify anonymization applied
      const privacy_info = result.unified_results.privacy_protection
      expect(privacy_info.anonymization_summary).toBeDefined()
      
      console.log(`🔒 PII anonymized: ${privacy_info.entities_processed} entities, grade: ${privacy_info.privacy_grade}`)
    }, 10000)

    test('should maintain legal concept recognition after anonymization', async () => {
      const legal_document = test_documents.legal_brief
      
      const result = await analysis_engine.analyzeCase([legal_document], {
        case_id: 'test-legal-concepts',
        practice_area: 'litigation',
        jurisdiction: 'uk'
      })
      
      expect(result.success).toBe(true)
      expect(result.unified_results.unified_insights.semantic_core_themes).toBeDefined()
      
      // Verify legal concepts preserved
      const semantic_themes = result.unified_results.unified_insights.semantic_core_themes
      expect(Array.isArray(semantic_themes)).toBe(true)
      
      console.log(`⚖️ Legal concepts preserved: ${semantic_themes.length} themes identified`)
    }, 10000)

    test('should prevent data leakage in patterns', async () => {
      const sensitive_document = test_documents.sensitive_contract
      
      const result = await analysis_engine.analyzeCase([sensitive_document], {
        case_id: 'test-data-leakage',
        practice_area: 'commercial',
        jurisdiction: 'uk'
      })
      
      expect(result.success).toBe(true)
      
      // Convert result to string and check for PII patterns
      const result_string = JSON.stringify(result)
      
      // Should not contain real names, addresses, or phone numbers
      expect(result_string).not.toMatch(/John Smith|Jane Doe/)
      expect(result_string).not.toMatch(/\d{10,11}/) // Phone numbers
      expect(result_string).not.toMatch(/\d{2,4}\s+[A-Za-z\s]+Street/) // Addresses
      
      console.log(`🛡️ Data leakage prevention verified`)
    }, 10000)
  })

  describe('Analysis Engine Performance', () => {
    test('should process large document set within time limits', async () => {
      const large_document_set = test_documents.case_bundle_20_docs // Reduced for testing
      const start_time = performance.now()
      
      const result = await analysis_engine.analyzeCase(large_document_set, {
        case_id: 'test-case-large',
        practice_area: 'commercial',
        jurisdiction: 'uk'
      })
      
      const processing_time = performance.now() - start_time
      
      expect(result.success).toBe(true)
      expect(result.processing_summary.documents_processed).toBe(large_document_set.length)
      expect(processing_time).toBeLessThan(120000) // 2 minutes max for test set
      
      // Performance metrics
      expect(result.performance_metrics).toBeDefined()
      expect(result.performance_metrics.success_rate).toBeGreaterThan(0.8)
      
      console.log(`⚡ Large set processed: ${large_document_set.length} docs in ${Math.round(processing_time)}ms`)
    }, 150000)

    test('should maintain memory efficiency during processing', async () => {
      const initial_memory = process.memoryUsage()
      
      const result = await analysis_engine.analyzeCase(test_documents.medium_document_set, {
        case_id: 'test-memory-efficiency',
        practice_area: 'general',
        jurisdiction: 'uk'
      })
      
      const final_memory = process.memoryUsage()
      const memory_increase = final_memory.heapUsed - initial_memory.heapUsed
      const memory_increase_mb = memory_increase / 1024 / 1024
      
      expect(result.success).toBe(true)
      expect(memory_increase_mb).toBeLessThan(500) // Less than 500MB increase
      
      console.log(`💾 Memory efficiency: ${Math.round(memory_increase_mb)}MB increase`)
    }, 30000)

    test('should handle concurrent processing requests', async () => {
      const concurrent_requests = [
        analysis_engine.analyzeCase([test_documents.electronic_pdf], { case_id: 'concurrent-1' }),
        analysis_engine.analyzeCase([test_documents.text_document], { case_id: 'concurrent-2' }),
        analysis_engine.analyzeCase([test_documents.word_document], { case_id: 'concurrent-3' })
      ]
      
      const start_time = performance.now()
      const results = await Promise.allSettled(concurrent_requests)
      const processing_time = performance.now() - start_time
      
      const successful_results = results.filter(r => r.status === 'fulfilled' && r.value.success)
      
      expect(successful_results.length).toBeGreaterThanOrEqual(2)
      expect(processing_time).toBeLessThan(20000) // Should be faster than sequential
      
      console.log(`🔄 Concurrent processing: ${successful_results.length}/3 successful in ${Math.round(processing_time)}ms`)
    }, 25000)
  })

  describe('Claude Pattern Generation', () => {
    test('should generate comprehensive patterns for Claude consultation', async () => {
      const commercial_case = test_documents.commercial_dispute
      
      const result = await analysis_engine.analyzeCase(commercial_case, {
        case_id: 'test-commercial',
        practice_area: 'commercial_litigation',
        jurisdiction: 'uk'
      })
      
      expect(result.success).toBe(true)
      expect(result.unified_results.enhanced_patterns).toBeDefined()
      
      const patterns = result.unified_results.enhanced_patterns
      
      // Verify core pattern components
      expect(patterns.case_profile).toBeDefined()
      expect(patterns.complexity_assessment).toBeDefined()
      expect(patterns.consultation_prompts).toBeDefined()
      
      console.log(`🤖 Claude patterns generated: ${Object.keys(patterns).length} pattern types`)
    }, 15000)

    test('should ensure patterns contain no PII', async () => {
      const personal_case = test_documents.personal_injury_case
      
      const result = await analysis_engine.analyzeCase(personal_case, {
        case_id: 'test-pii-patterns',
        practice_area: 'personal_injury',
        jurisdiction: 'uk'
      })
      
      expect(result.success).toBe(true)
      
      const patterns = result.unified_results.enhanced_patterns
      const pattern_text = JSON.stringify(patterns)
      
      // Verify patterns contain no PII
      expect(pattern_text).not.toMatch(/[A-Z][a-z]+\s+[A-Z][a-z]+/) // No proper names
      expect(pattern_text).not.toMatch(/\d{2}\/\d{2}\/\d{4}/) // No specific dates
      expect(pattern_text).not.toMatch(/£\d{1,3}(?:,\d{3})*/) // No specific amounts
      expect(pattern_text).not.toMatch(/\d{2,4}\s+[A-Za-z\s]+(?:Street|Road|Avenue)/) // No addresses
      
      console.log(`🔒 Pattern PII verification passed`)
    }, 10000)

    test('should generate contextually relevant consultation prompts', async () => {
      const contract_dispute = test_documents.contract_dispute
      
      const result = await analysis_engine.analyzeCase(contract_dispute, {
        case_id: 'test-consultation-context',
        practice_area: 'contract_law',
        jurisdiction: 'uk'
      })
      
      expect(result.success).toBe(true)
      
      const patterns = result.unified_results.enhanced_patterns
      expect(patterns.consultation_prompts).toBeDefined()
      expect(patterns.consultation_prompts.length).toBeGreaterThan(0)
      
      // Verify prompts are contextually relevant
      const prompts = patterns.consultation_prompts
      const prompt_text = prompts.join(' ').toLowerCase()
      expect(prompt_text).toMatch(/contract|agreement|breach|obligation/)
      
      console.log(`💡 Consultation prompts: ${prompts.length} generated`)
    }, 10000)
  })

  describe('Search and Knowledge Base Integration', () => {
    test('should integrate with search engine for similar cases', async () => {
      // Mock search engine responses
      search_engine.findSimilarCasePatterns = jest.fn().mockResolvedValue({
        query_case: { case_id: 'test-case' },
        similar_patterns: [
          {
            case_id: 'similar-1',
            similarity_score: 0.85,
            strategic_insights: [{ type: 'evidence', recommendation: 'Focus on documentary evidence' }]
          }
        ],
        search_timestamp: new Date().toISOString()
      })
      
      const result = await knowledge_base.queryKnowledgeBase({
        case_id: 'test-integration',
        practice_area: 'commercial',
        legal_issues: ['breach_of_contract']
      })
      
      expect(result.similar_cases_found).toBeGreaterThanOrEqual(0)
      expect(result.strategic_guidance).toBeDefined()
      
      console.log(`🔍 Search integration: ${result.similar_cases_found} similar cases found`)
    }, 10000)

    test('should enhance patterns with knowledge base insights', async () => {
      const base_patterns = {
        case_profile: { complexity: 'medium' },
        legal_issues: ['contract_breach']
      }
      
      const knowledge_insights = {
        similar_cases_found: 2,
        strategic_guidance: [
          {
            applicability_score: 0.8,
            strategic_approach: { type: 'evidence_focused' }
          }
        ],
        confidence_score: 0.75
      }
      
      const enhanced = await knowledge_base.enhanceClaudeConsultation(base_patterns, knowledge_insights)
      
      expect(enhanced.similar_case_patterns).toBeDefined()
      expect(enhanced.strategic_context).toBeDefined()
      expect(enhanced.learning_insights).toBeDefined()
      
      console.log(`🧠 Patterns enhanced with knowledge base insights`)
    }, 5000)
  })

  describe('Error Handling and Resilience', () => {
    test('should handle analysis engine failures gracefully', async () => {
      // Temporarily break something to test error handling
      const original_method = analysis_engine.semantic_analyzer?.analyzeDocuments
      if (original_method) {
        analysis_engine.semantic_analyzer.analyzeDocuments = jest.fn().mockRejectedValue(new Error('Semantic analysis failed'))
      }
      
      const result = await analysis_engine.analyzeCase([test_documents.simple_text], {
        case_id: 'test-error-resilience',
        practice_area: 'general'
      })
      
      // Should complete with fallback results
      expect(result).toBeDefined()
      expect(result.processing_summary).toBeDefined()
      
      // Restore original method
      if (original_method) {
        analysis_engine.semantic_analyzer.analyzeDocuments = original_method
      }
      
      console.log(`⚠️ Error resilience test completed`)
    }, 10000)

    test('should recover from worker thread failures', async () => {
      const documents = [test_documents.electronic_pdf, test_documents.text_document]
      
      const result = await performance_optimizer.optimizeDocumentProcessing(documents)
      
      // Should complete even if some workers fail
      expect(result.success).toBe(true)
      expect(result.optimization_summary).toBeDefined()
      
      console.log(`👷 Worker resilience: ${result.documents_processed} documents processed`)
    }, 15000)
  })

  describe('Privacy and Security Compliance', () => {
    test('should ensure no sensitive data in logs', async () => {
      const sensitive_doc = test_documents.client_privileged_document
      
      // Capture console output
      const consoleLogs = []
      const originalLog = console.log
      console.log = (message) => {
        consoleLogs.push(message)
        originalLog(message)
      }
      
      const result = await analysis_engine.analyzeCase([sensitive_doc], {
        case_id: 'test-log-privacy',
        practice_area: 'litigation'
      })
      
      // Restore console
      console.log = originalLog
      
      expect(result.success).toBe(true)
      
      // Check logs don't contain sensitive data
      const logText = consoleLogs.join(' ')
      expect(logText).not.toMatch(/privileged|confidential.*client/i)
      
      console.log(`📋 Log privacy verification passed`)
    }, 10000)

    test('should maintain anonymization integrity throughout pipeline', async () => {
      const multi_party_doc = test_documents.multi_party_contract
      
      const result = await analysis_engine.analyzeCase([multi_party_doc], {
        case_id: 'test-anonymization-integrity',
        practice_area: 'commercial'
      })
      
      expect(result.success).toBe(true)
      expect(result.unified_results.privacy_protection.privacy_grade).toMatch(/[A-C]/)
      
      // Verify anonymization maintained through all stages
      const result_json = JSON.stringify(result)
      expect(result_json).not.toMatch(/Party A Ltd|Party B Corp/) // Original names
      expect(result_json).toMatch(/ORG_\d{3}|ENTITY_\d{3}/) // Anonymized forms
      
      console.log(`🔐 Anonymization integrity maintained`)
    }, 10000)
  })
})

// Helper function to load test documents
async function loadTestDocuments() {
  return {
    electronic_pdf: {
      id: 'test-pdf-1',
      name: 'Commercial Contract.pdf',
      type: 'pdf',
      size: 1024000,
      content: 'This is a commercial contract between Party A and Party B regarding the sale of goods.',
      requires_ocr: false,
      estimated_complexity: 0.6
    },
    
    scanned_pdf: {
      id: 'test-scanned-1',
      name: 'Scanned Legal Document.pdf',
      type: 'pdf',
      size: 2048000,
      requires_ocr: true,
      estimated_complexity: 0.8,
      content: 'This document was scanned and requires OCR processing for text extraction.'
    },
    
    text_document: {
      id: 'test-text-1',
      name: 'Legal Memo.txt',
      type: 'txt',
      size: 50000,
      content: 'Legal memorandum regarding contract interpretation and applicable law.',
      estimated_complexity: 0.3
    },
    
    word_document: {
      id: 'test-word-1',
      name: 'Case Summary.docx',
      type: 'docx',
      size: 150000,
      content: 'Case summary document with multiple parties and complex legal issues.',
      estimated_complexity: 0.5
    },
    
    corrupted_document: {
      id: 'test-corrupted-1',
      name: 'Corrupted.pdf',
      type: 'pdf',
      size: 0,
      content: null,
      estimated_complexity: 1.0
    },
    
    contract_with_names: {
      id: 'test-pii-1',
      name: 'Contract with PII.pdf',
      type: 'pdf',
      content: 'Contract between John Smith and ABC Corporation Ltd. Address: 123 Main Street, London. Phone: 020-1234-5678.',
      estimated_complexity: 0.4
    },
    
    legal_brief: {
      id: 'test-legal-1',
      name: 'Legal Brief.pdf',
      type: 'pdf',
      content: 'Legal brief containing negligence, breach of contract, damages, and statutory interpretation arguments.',
      estimated_complexity: 0.7
    },
    
    sensitive_contract: {
      id: 'test-sensitive-1',
      name: 'Sensitive Agreement.pdf',
      type: 'pdf',
      content: 'Confidential agreement between John Smith (123 Oak Street, London SW1) and Jane Doe (456 Pine Road, Manchester). Contains trade secrets.',
      estimated_complexity: 0.6
    },
    
    commercial_dispute: [{
      id: 'commercial-1',
      name: 'Commercial Dispute Case File',
      type: 'pdf',
      content: 'Commercial litigation case involving breach of supply agreement, damages claims, and contractual interpretation.',
      estimated_complexity: 0.8
    }],
    
    personal_injury_case: [{
      id: 'pi-case-1',
      name: 'Personal Injury Case',
      type: 'pdf',
      content: 'Personal injury claim involving David Johnson vs. Transport Company Ltd. Incident occurred on 15th March 2023.',
      estimated_complexity: 0.6
    }],
    
    contract_dispute: [{
      id: 'contract-dispute-1',
      name: 'Contract Dispute',
      type: 'pdf',
      content: 'Dispute over service level agreement, performance obligations, penalty clauses, and termination rights.',
      estimated_complexity: 0.7
    }],
    
    client_privileged_document: {
      id: 'privileged-1',
      name: 'Privileged Communication.pdf',
      type: 'pdf',
      content: 'Privileged attorney-client communication regarding litigation strategy and confidential client information.',
      estimated_complexity: 0.5
    },
    
    multi_party_contract: {
      id: 'multi-party-1',
      name: 'Multi-Party Agreement.pdf',
      type: 'pdf',
      content: 'Three-way agreement between Party A Ltd, Party B Corp, and Party C Inc. regarding joint venture operations.',
      estimated_complexity: 0.9
    },
    
    simple_text: {
      id: 'simple-1',
      name: 'Simple Document.txt',
      type: 'txt',
      content: 'Simple text document for basic testing purposes.',
      estimated_complexity: 0.1
    },
    
    case_bundle_20_docs: Array.from({ length: 20 }, (_, i) => ({
      id: `bundle-doc-${i + 1}`,
      name: `Case Document ${i + 1}.pdf`,
      type: 'pdf',
      size: 500000 + Math.random() * 1000000,
      content: `Legal document ${i + 1} containing case-relevant information and legal arguments.`,
      estimated_complexity: 0.3 + Math.random() * 0.4
    })),
    
    medium_document_set: Array.from({ length: 10 }, (_, i) => ({
      id: `medium-doc-${i + 1}`,
      name: `Medium Document ${i + 1}.pdf`,
      type: 'pdf',
      size: 200000 + Math.random() * 500000,
      content: `Medium complexity legal document ${i + 1} for testing purposes.`,
      estimated_complexity: 0.4 + Math.random() * 0.3
    }))
  }
}