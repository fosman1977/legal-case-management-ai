/**
 * Test suite for entity extraction engines
 * Tests the 8-engine system's ability to extract names, dates, and issues
 */

import { multiEngineProcessor } from './src/utils/multiEngineProcessor';
import { enhancedAIClient } from './src/utils/enhancedAIClient';

// Test documents with various name, date, and issue formats
const testDocuments = {
  legalLetter: `
    Dear Mr. Smith,
    
    Re: Johnson v. Thompson Construction Ltd - Case No. 2024-CV-1234
    
    I am writing on behalf of my client, Sarah Johnson, regarding the breach of contract 
    that occurred on 15th March 2024. Ms. Johnson entered into an agreement with 
    Thompson Construction Ltd on January 10, 2024, for renovation work at her property.
    
    The main issues are:
    1. Whether Thompson Construction breached the contract by failing to complete work by the deadline
    2. The extent of damages suffered by Ms. Johnson due to the delay
    3. If the force majeure clause applies to this situation
    
    Dr. Michael Roberts, an expert witness in construction disputes, examined the property 
    on April 3rd, 2024. His report, dated April 10, 2024, confirms significant delays.
    
    A meeting was held on 25/03/2024 between Mr. James Thompson (Director of Thompson Construction), 
    Ms. Johnson, and myself. During this meeting, Mr. Thompson admitted the delays but disputed liability.
    
    The deadline for response is May 15, 2024. Please ensure your client's position is 
    communicated by this date.
    
    Yours sincerely,
    Robert Williams
    Solicitor
    Williams & Associates LLP
  `,
  
  witnessStatement: `
    WITNESS STATEMENT OF DAVID CHEN
    
    I, David Chen, of 42 Oak Street, London, will say as follows:
    
    1. I am employed as a Project Manager at BuildRight Solutions since June 2020.
    
    2. On Tuesday, February 20, 2024, I was present at the construction site when 
    Mr. John Anderson, the site supervisor, instructed the workers to stop work.
    
    3. Mrs. Patricia Kumar, the safety inspector, arrived at approximately 10:30 AM 
    on February 21st, 2024. She conducted a thorough inspection lasting two hours.
    
    4. The following issues were identified:
       - Safety equipment was not properly maintained
       - Workers were not following proper procedures
       - Documentation was incomplete
    
    5. Professor Elizabeth Turner from the University of Construction Sciences visited 
    the site on 28/02/2024 to provide an independent assessment.
    
    6. A formal complaint was filed by Mr. Anderson on March 1, 2024, disputing 
    the inspector's findings.
    
    7. The hearing is scheduled for June 15, 2024 at the County Court.
    
    Statement of Truth: I believe the facts stated in this witness statement are true.
    
    Signed: David Chen
    Date: March 10, 2024
  `,
  
  contractDispute: `
    IN THE HIGH COURT OF JUSTICE
    QUEEN'S BENCH DIVISION
    
    BETWEEN:
    TECHNICAL INNOVATIONS LIMITED (Claimant)
    and
    GLOBAL SYSTEMS CORPORATION (Defendant)
    
    PARTICULARS OF CLAIM
    
    1. The Claimant, represented by Ms. Rachel Green of Green & Partners Solicitors, 
    entered into a software development agreement with the Defendant on 01/12/2023.
    
    2. Mr. Alexander Petrov, CEO of the Defendant company, personally guaranteed 
    performance under the agreement in a meeting on December 5, 2023.
    
    3. Dr. Lisa Chang, Chief Technology Officer, approved the technical specifications 
    on 15 December 2023.
    
    4. The key issues in dispute are:
       a) Whether the software delivered met the agreed specifications
       b) If the delays were caused by the Defendant's negligence
       c) The quantum of damages arising from lost business opportunities
    
    5. Between January 2024 and March 2024, multiple meetings were held:
       - January 15, 2024: Progress review with Mr. Petrov and Ms. Jennifer Walsh
       - February 10, 2024: Technical review led by Dr. Chang
       - March 20, 2024: Emergency meeting called by the Claimant
    
    6. Mr. Thomas Mitchell, an independent software consultant, provided an expert 
    report dated April 5, 2024, confirming the software deficiencies.
    
    7. The Claimant seeks damages of £250,000 plus costs.
    
    8. The trial is listed for hearing on September 10-12, 2024.
    
    Dated this 15th day of April 2024
    
    Statement of Truth signed by: Mark Davidson, Director
  `
};

// Test function to run extraction on all documents
export async function testEntityExtraction() {
  console.log('🧪 Starting Entity Extraction Test Suite');
  console.log('=' .repeat(50));
  
  const results: any = {};
  
  for (const [docName, docText] of Object.entries(testDocuments)) {
    console.log(`\n📄 Testing: ${docName}`);
    console.log('-'.repeat(40));
    
    try {
      // Test with enhanced AI client (which uses multi-engine processor)
      const extractionResult = await enhancedAIClient.extractEntitiesIntelligent(
        docText,
        'legal',
        'accuracy'
      );
      
      // Compile results
      results[docName] = {
        persons: extractionResult.persons.length,
        personNames: extractionResult.persons.map(p => `${p.name} (${p.role})`),
        dates: extractionResult.chronologyEvents.length,
        datesList: extractionResult.chronologyEvents.map(e => `${e.date}: ${e.event}`),
        issues: extractionResult.issues.length,
        issuesList: extractionResult.issues.map(i => `${i.issue} [${i.type}]`),
        authorities: extractionResult.authorities.length,
        confidence: extractionResult.consensusConfidence,
        enginesUsed: extractionResult.enginesUsed
      };
      
      // Print summary
      console.log(`✅ Extraction Complete:`);
      console.log(`   - Persons: ${results[docName].persons} found`);
      console.log(`   - Dates/Events: ${results[docName].dates} found`);
      console.log(`   - Issues: ${results[docName].issues} found`);
      console.log(`   - Authorities: ${results[docName].authorities} found`);
      console.log(`   - Confidence: ${(results[docName].confidence * 100).toFixed(1)}%`);
      console.log(`   - Engines Used: ${results[docName].enginesUsed.length}`);
      
      // Print detailed extractions
      if (results[docName].persons > 0) {
        console.log(`\n   🧑 Persons Found:`);
        results[docName].personNames.slice(0, 5).forEach((p: string) => 
          console.log(`      • ${p}`)
        );
        if (results[docName].persons > 5) {
          console.log(`      ... and ${results[docName].persons - 5} more`);
        }
      }
      
      if (results[docName].dates > 0) {
        console.log(`\n   📅 Dates/Events Found:`);
        results[docName].datesList.slice(0, 5).forEach((d: string) => 
          console.log(`      • ${d}`)
        );
        if (results[docName].dates > 5) {
          console.log(`      ... and ${results[docName].dates - 5} more`);
        }
      }
      
      if (results[docName].issues > 0) {
        console.log(`\n   ⚖️ Issues Found:`);
        results[docName].issuesList.slice(0, 3).forEach((i: string) => 
          console.log(`      • ${i.substring(0, 80)}${i.length > 80 ? '...' : ''}`)
        );
        if (results[docName].issues > 3) {
          console.log(`      ... and ${results[docName].issues - 3} more`);
        }
      }
      
    } catch (error: any) {
      console.error(`❌ Error testing ${docName}:`, error);
      results[docName] = { error: error.message };
    }
  }
  
  // Print overall summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 OVERALL TEST RESULTS');
  console.log('='.repeat(50));
  
  let totalPersons = 0;
  let totalDates = 0;
  let totalIssues = 0;
  
  for (const [docName, result] of Object.entries(results)) {
    if (!(result as any).error) {
      totalPersons += (result as any).persons;
      totalDates += (result as any).dates;
      totalIssues += (result as any).issues;
    }
  }
  
  console.log(`\n📈 Extraction Totals Across All Documents:`);
  console.log(`   • Total Persons Extracted: ${totalPersons}`);
  console.log(`   • Total Dates/Events Extracted: ${totalDates}`);
  console.log(`   • Total Issues Extracted: ${totalIssues}`);
  
  // Expected counts for validation
  const expected = {
    persons: 25, // Approximate expected persons across all docs
    dates: 20,   // Approximate expected dates
    issues: 15   // Approximate expected issues
  };
  
  console.log(`\n🎯 Performance Assessment:`);
  console.log(`   • Person Extraction: ${totalPersons}/${expected.persons} (${(totalPersons/expected.persons * 100).toFixed(0)}%)`);
  console.log(`   • Date Extraction: ${totalDates}/${expected.dates} (${(totalDates/expected.dates * 100).toFixed(0)}%)`);
  console.log(`   • Issue Extraction: ${totalIssues}/${expected.issues} (${(totalIssues/expected.issues * 100).toFixed(0)}%)`);
  
  const overallScore = ((totalPersons/expected.persons + totalDates/expected.dates + totalIssues/expected.issues) / 3 * 100).toFixed(0);
  console.log(`\n⭐ Overall Extraction Performance: ${overallScore}%`);
  
  if (parseInt(overallScore) < 70) {
    console.log('\n⚠️ Recommendation: Consider adding specialized Name & Date extraction engine');
  } else if (parseInt(overallScore) < 85) {
    console.log('\n📝 Recommendation: Current system is adequate but could be improved');
  } else {
    console.log('\n✅ Recommendation: Current 8-engine system is performing well');
  }
  
  return results;
}

// Run test
testEntityExtraction().then(() => {
  console.log('\n✅ Test suite completed');
}).catch(error => {
  console.error('❌ Test suite failed:', error);
});