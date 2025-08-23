/**
 * Direct Test - Test engines directly without UI
 */

import { multiEngineProcessor } from './multiEngineProcessor';
import { enhancedAIClient } from './enhancedAIClient';

export async function runDirectTest() {
  const testDoc = `
    EMPLOYMENT CONTRACT
    
    This Employment Agreement is entered into on 15th January 2024 between:
    
    EMPLOYER: TechCorp Solutions Ltd, a company registered in England and Wales
    EMPLOYEE: Dr. Michael Johnson, residing at 42 Oak Street, Manchester
    
    POSITION: Senior Legal Advisor
    SALARY: £85,000 per annum
    
    KEY RESPONSIBILITIES:
    1. Providing legal advice on employment law matters
    2. Reviewing and drafting commercial contracts
    3. Managing litigation and dispute resolution
    
    REPORTING TO: Sarah Williams, Head of Legal Department
    
    SIGNED:
    John Patterson, HR Director, TechCorp Solutions Ltd
    Dr. Michael Johnson, Employee
    
    WITNESS: Emma Thompson, Legal Secretary
  `;

  console.log('🎯 Starting Direct Engine Test');
  console.log('📄 Document length:', testDoc.length, 'characters');
  
  try {
    // Test 1: Check engines
    console.log('\n📊 Test 1: Engine Status');
    const engines = multiEngineProcessor.getEngineStatus();
    console.log('Total engines:', engines.length);
    engines.forEach(e => console.log(`  - ${e.name}: ${e.health}`));
    
    // Test 2: Process document
    console.log('\n🔧 Test 2: Processing Document');
    const result = await multiEngineProcessor.processDocument(testDoc, {
      requiredAccuracy: 'high',
      maxProcessingTime: 30000,
      documentType: 'legal',
      includeAdvancedAnalysis: false
    });
    
    console.log('\n📈 Results Summary:');
    console.log(`- Persons found: ${result.persons.length}`);
    console.log(`- Issues found: ${result.issues.length}`);
    console.log(`- Chronology events: ${result.chronologyEvents.length}`);
    console.log(`- Authorities: ${result.authorities.length}`);
    console.log(`- Consensus confidence: ${Math.round(result.consensusConfidence * 100)}%`);
    console.log(`- Engines used: ${result.enginesUsed.join(', ')}`);
    
    // Test 3: Show extracted entities
    console.log('\n👥 Persons Extracted:');
    result.persons.forEach(p => {
      console.log(`  - ${p.name} (${p.role}) - ${Math.round((p.confidence || 0.5) * 100)}%`);
    });
    
    if (result.issues.length > 0) {
      console.log('\n⚖️ Issues Extracted:');
      result.issues.forEach(i => {
        console.log(`  - ${i.issue} (${i.type || 'general'})`);
      });
    }
    
    if (result.chronologyEvents.length > 0) {
      console.log('\n📅 Chronology Events:');
      result.chronologyEvents.forEach(e => {
        console.log(`  - ${e.date}: ${e.event}`);
      });
    }
    
    // Test 4: Validation
    console.log('\n✅ Validation:');
    const expectedPersons = ['Dr. Michael Johnson', 'Sarah Williams', 'John Patterson', 'Emma Thompson'];
    const foundPersonNames = result.persons.map(p => p.name);
    
    let foundCount = 0;
    expectedPersons.forEach(expected => {
      const found = foundPersonNames.some(name => 
        name.toLowerCase().includes((expected.toLowerCase().split(' ').pop() || ''))
      );
      console.log(`  - ${expected}: ${found ? '✅' : '❌'}`);
      if (found) foundCount++;
    });
    
    const successRate = (foundCount / expectedPersons.length) * 100;
    console.log(`\n🎯 Success Rate: ${successRate}% (${foundCount}/${expectedPersons.length} expected persons)`);
    
    const overallSuccess = 
      result.persons.length >= 2 &&
      result.consensusConfidence > 0.5 &&
      result.enginesUsed.length >= 3;
    
    console.log(`\n🏆 Overall Test: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    return overallSuccess;
    
  } catch (error) {
    console.error('❌ Direct test failed:', error);
    return false;
  }
}

// Make available globally
(window as any).directTest = runDirectTest;
console.log('💡 Direct test available: window.directTest()');