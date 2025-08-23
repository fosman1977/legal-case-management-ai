/**
 * Test utility to verify entity extraction is working
 */

import { enhancedAIClient } from './enhancedAIClient';

export async function testEntityExtraction() {
  const testText = `
    Case: R v Davies [2024] UKSC 25
    Date: 15 March 2024
    Judge: Lord Justice Smith
    Claimant: Mr. John Davies
    Defendant: The Crown
    Solicitor: Sarah Williams of Williams & Co
    Barrister: David Thompson QC
    Issues: breach of contract, negligence, damages assessment
    Amount claimed: £250,000
    Reference: Smith v Jones [2023] EWCA Civ 123
  `;

  console.log('🔍 Testing entity extraction without LocalAI...\n');
  
  try {
    const result = await enhancedAIClient.extractEntitiesIntelligent(
      testText, 
      'legal', 
      'balanced'
    );
    
    console.log('✅ Extraction successful!');
    console.log('📊 Results:');
    console.log(`  • Persons found: ${result.persons.length}`);
    console.log(`  • Issues found: ${result.issues.length}`);
    console.log(`  • Authorities found: ${result.authorities.length}`);
    console.log(`  • Chronology events: ${result.chronologyEvents.length}`);
    console.log(`  • Processing mode: ${result.processingMode}`);
    console.log(`  • Confidence: ${result.consensusConfidence}%`);
    console.log(`  • Engines used: ${result.enginesUsed}`);
    
    if (result.persons.length > 0) {
      console.log('\n👥 Persons detected:');
      result.persons.forEach(p => console.log(`  - ${p.name} (${p.role})`));
    }
    
    if (result.issues.length > 0) {
      console.log('\n⚖️ Issues detected:');
      result.issues.forEach(i => console.log(`  - ${i.issue} (${i.type})`));
    }
    
    if (result.authorities.length > 0) {
      console.log('\n📚 Authorities detected:');
      result.authorities.forEach(a => console.log(`  - ${a.citation}`));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    throw error;
  }
}

// Export to window for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testEntityExtraction = testEntityExtraction;
}