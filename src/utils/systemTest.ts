/**
 * System Test Utility
 * Basic functionality verification
 */

import { multiEngineProcessor } from './multiEngineProcessor';
import { enhancedAIClient } from './enhancedAIClient';

export async function runBasicSystemTest(): Promise<boolean> {
  console.log('🧪 Starting Basic System Test...');
  
  const testDocument = `
    COMPLEX LEGAL SERVICES CONTRACT
    
    This comprehensive agreement is made between John Smith (the Client) and Sarah Jones (the Solicitor) 
    of Manchester Legal Services Ltd, pursuant to the Legal Services Act 2007.
    
    WHEREAS the Client requires legal representation, and WHEREAS the Solicitor is duly qualified,
    NOW THEREFORE the parties agree as follows:
    
    Section 1: Financial Terms
    The Client agrees to pay £500 per hour for legal representation in the case of 
    Smith v Wilson [2023] EWHC 123 (QB), notwithstanding any additional costs.
    
    Section 2: Important Dates and Obligations
    - Initial consultation: 15th January 2024
    - Court hearing: 3rd March 2024  
    - Filing deadline: 28th February 2024
    - Discovery completion: 20th February 2024
    
    Section 3: Legal Issues and Claims
    The matter involves complex legal issues including:
    - Breach of contract claim with damages assessment
    - Negligence allegations pursuant to Donoghue v Stevenson [1932] AC 562
    - Contractual interpretation issues regarding force majeure clauses
    - Risk assessment of potential counter-claims
    
    Section 4: Termination and Dispute Resolution
    This agreement may be terminated by either party giving 30 days written notice.
    Any disputes shall be resolved through arbitration in accordance with the Arbitration Act 1996.
  `;

  try {
    // Test 1: Engine Status
    console.log('📊 Test 1: Engine Status');
    const engineStatus = multiEngineProcessor.getEngineStatus();
    console.log(`Engines available: ${engineStatus.length}`);
    engineStatus.forEach(engine => {
      console.log(`- ${engine.name}: ${engine.health}`);
    });
    
    // Test 2: Enhanced Entity Extraction with Forced Advanced Analysis
    console.log('\n🎯 Test 2: Enhanced Entity Extraction with Advanced Analysis');
    const result = await enhancedAIClient.extractEntities(
      testDocument,
      'legal',
      {
        requiredAccuracy: 'near-perfect',
        includeAdvancedAnalysis: true,  // Force advanced analysis
        includeArgumentMining: true,
        includeRiskAssessment: true,
        includeContractAnalysis: true,
        complexityHint: 'complex'  // Force complex classification
      }
    );
    
    console.log('Results:');
    console.log(`- Persons: ${result.persons.length}`);
    console.log(`- Issues: ${result.issues.length}`);
    console.log(`- Chronology: ${result.chronologyEvents.length}`);
    console.log(`- Authorities: ${result.authorities.length}`);
    console.log(`- Consensus Confidence: ${Math.round(result.consensusConfidence * 100)}%`);
    console.log(`- Processing Mode: ${result.processingMode}`);
    console.log(`- Engines Used: ${result.enginesUsed.join(', ')}`);

    // Test 3: Entity Details
    console.log('\n📋 Test 3: Entity Details');
    if (result.persons.length > 0) {
      console.log('Persons found:');
      result.persons.forEach(person => {
        console.log(`  - ${person.name} (${person.role}) - ${Math.round(person.confidence * 100)}%`);
      });
    }
    
    if (result.issues.length > 0) {
      console.log('Issues found:');
      result.issues.forEach(issue => {
        console.log(`  - ${issue.issue} (${issue.type || 'general'}) - ${Math.round(issue.confidence * 100)}%`);
      });
    }

    if (result.authorities.length > 0) {
      console.log('Authorities found:');
      result.authorities.forEach(auth => {
        console.log(`  - ${auth.citation} (${(auth as any).court || 'Unknown'})`);
      });
    }

    // Test 3.5: Advanced Analysis Features
    if ((result as any).advancedAnalysis) {
      console.log('\n🚀 Advanced Analysis Results:');
      const advanced = (result as any).advancedAnalysis;
      if (advanced.arguments && advanced.arguments.length > 0) {
        console.log(`Legal Arguments: ${advanced.arguments.length}`);
        advanced.arguments.slice(0, 2).forEach((arg: any) => {
          console.log(`  - ${arg.claim} (${arg.type})`);
        });
      }
      if (advanced.contractClauses && advanced.contractClauses.length > 0) {
        console.log(`Contract Clauses: ${advanced.contractClauses.length}`);
      }
      if (advanced.riskAssessment) {
        console.log(`Risk Assessment: ${advanced.riskAssessment.overallRisk} risk`);
      }
    } else {
      console.log('\n⚠️ Advanced analysis not included in results');
    }

    // Test 4: Success Criteria
    console.log('\n✅ Test 4: Success Criteria');
    const success = {
      hasPersons: result.persons.length >= 2, // Should find John Smith, Sarah Jones
      hasIssues: result.issues.length >= 1,   // Should find breach of contract
      hasConfidence: result.consensusConfidence > 0.5,
      hasEngines: result.enginesUsed.length >= 3,
      hasAdvancedAnalysis: !!(result as any).advancedAnalysis // Advanced features enabled
    };
    
    console.log(`- Found persons: ${success.hasPersons ? '✅' : '❌'} (${result.persons.length}/2+)`);
    console.log(`- Found issues: ${success.hasIssues ? '✅' : '❌'} (${result.issues.length}/1+)`);
    console.log(`- Good confidence: ${success.hasConfidence ? '✅' : '❌'} (${Math.round(result.consensusConfidence * 100)}%/50%+)`);
    console.log(`- Multiple engines: ${success.hasEngines ? '✅' : '❌'} (${result.enginesUsed.length}/3+)`);
    console.log(`- Advanced analysis: ${success.hasAdvancedAnalysis ? '✅' : '❌'} (${success.hasAdvancedAnalysis ? 'enabled' : 'disabled'})`);
    
    const allTestsPassed = Object.values(success).every(test => test);
    console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ System test failed:', error);
    return false;
  }
}

// Export for manual testing
export const systemTest = {
  run: runBasicSystemTest,
  testDocument: `Contract for Legal Services between John Smith and Sarah Jones of Manchester Legal Services Ltd.`
};