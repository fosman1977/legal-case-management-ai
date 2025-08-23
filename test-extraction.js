// Test script to verify entity extraction without LocalAI
import { enhancedAIClient } from './src/utils/enhancedAIClient.js';
import { multiEngineProcessor } from './src/utils/multiEngineProcessor.js';

const testText = `
Case: R v Davies [2024] UKSC 25
Date: 15 March 2024
Judge: Lord Justice Smith
Claimant: Mr. John Davies
Defendant: The Crown
Issues: breach of contract, negligence, damages assessment
Amount claimed: £250,000
`;

async function testExtraction() {
  console.log('🔍 Testing entity extraction without LocalAI...\n');
  
  try {
    // Test with enhanced AI client
    console.log('1. Testing Enhanced AI Client:');
    const enhancedResult = await enhancedAIClient.extractEntitiesIntelligent(
      testText, 
      'legal', 
      'balanced'
    );
    
    console.log('Persons found:', enhancedResult.persons.length);
    console.log('Issues found:', enhancedResult.issues.length);
    console.log('Authorities found:', enhancedResult.authorities.length);
    console.log('Processing mode:', enhancedResult.processingMode);
    console.log('Engines used:', enhancedResult.enginesUsed);
    console.log('\nDetailed results:', JSON.stringify(enhancedResult, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExtraction();