/**
 * LEGAL AI JSON API INTEGRATION DEMO
 * 
 * Demonstrates how external systems can integrate with the English Legal AI system
 * Shows JSON parsing, data extraction, and practical usage scenarios
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 ENGLISH LEGAL AI - JSON API INTEGRATION DEMO');
console.log('='.repeat(60));
console.log();

async function demonstrateAPIIntegration() {
  console.log('📋 SCENARIO: Legal Software Integration');
  console.log('   Simulating how a legal practice management system');
  console.log('   would integrate with our English Legal AI API');
  console.log();

  try {
    // Step 1: Call the Legal AI system with JSON output
    console.log('🔄 Step 1: Calling Legal AI API...');
    const command = 'node dist/legal-ai.js analyze sample-contract.txt --json';
    
    // Capture both stdout and stderr, but only parse JSON from stdout
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Extract JSON from the output (it's at the end after the console logs)
    const lines = result.split('\n');
    let jsonStartIndex = -1;
    
    // Find where JSON starts (look for the opening brace)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '{') {
        jsonStartIndex = i;
        break;
      }
    }
    
    if (jsonStartIndex === -1) {
      throw new Error('JSON output not found in response');
    }
    
    // Extract and parse JSON
    const jsonLines = lines.slice(jsonStartIndex);
    const jsonString = jsonLines.join('\n');
    const analysisResult = JSON.parse(jsonString);
    
    console.log('✅ Legal AI API call successful!');
    console.log();

    // Step 2: Extract key information for business logic
    console.log('📊 Step 2: Extracting Key Business Data...');
    
    const keyData = {
      confidence: analysisResult.analysis.legalAnalysis.finalJudicialConfidence,
      practiceArea: analysisResult.analysis.legalAnalysis.practiceArea,
      riskLevel: analysisResult.analysis.riskAssessment.overallRisk,
      courtReadiness: analysisResult.analysis.courtReadiness.overallReadiness,
      bsbCompliance: analysisResult.analysis.professionalStandards.bsbCompliance,
      sraCompliance: analysisResult.analysis.professionalStandards.sraCompliance,
      recommendations: analysisResult.analysis.recommendations,
      keyIssues: analysisResult.analysis.legalAnalysis.keyLegalIssues
    };
    
    console.log(`   📈 Confidence Level: ${(keyData.confidence * 100).toFixed(1)}%`);
    console.log(`   ⚖️ Practice Area: ${keyData.practiceArea}`);
    console.log(`   ⚠️ Risk Level: ${keyData.riskLevel}`);
    console.log(`   🏛️ Court Readiness: ${(keyData.courtReadiness * 100).toFixed(1)}%`);
    console.log(`   📜 BSB Compliance: ${(keyData.bsbCompliance * 100).toFixed(1)}%`);
    console.log(`   📜 SRA Compliance: ${(keyData.sraCompliance * 100).toFixed(1)}%`);
    console.log();

    // Step 3: Business Logic Integration Examples
    console.log('🧠 Step 3: Business Logic Integration Examples...');
    console.log();

    // Example 1: Risk-based pricing
    console.log('💰 Example 1: Risk-Based Pricing Logic');
    const basePrice = 1000;
    let riskMultiplier = 1.0;
    
    switch(keyData.riskLevel) {
      case 'Low': riskMultiplier = 1.0; break;
      case 'Medium': riskMultiplier = 1.25; break;
      case 'High': riskMultiplier = 1.5; break;
    }
    
    const adjustedPrice = basePrice * riskMultiplier;
    console.log(`   Base Price: £${basePrice}`);
    console.log(`   Risk Multiplier: ${riskMultiplier}x (${keyData.riskLevel} risk)`);
    console.log(`   Adjusted Price: £${adjustedPrice}`);
    console.log();

    // Example 2: Workflow automation
    console.log('⚡ Example 2: Automated Workflow Decisions');
    
    if (keyData.confidence >= 0.95 && keyData.riskLevel === 'Low') {
      console.log('   ✅ DECISION: Auto-approve for standard processing');
      console.log('   📋 WORKFLOW: Route to junior associate');
    } else if (keyData.confidence >= 0.85) {
      console.log('   ⚠️ DECISION: Requires senior review');
      console.log('   📋 WORKFLOW: Route to senior partner');
    } else {
      console.log('   🔴 DECISION: Requires specialist consultation');
      console.log('   📋 WORKFLOW: Route to external counsel');
    }
    console.log();

    // Example 3: Compliance reporting
    console.log('📊 Example 3: Compliance Reporting Dashboard');
    console.log('   Professional Standards Summary:');
    console.log(`   • BSB Compliance: ${keyData.bsbCompliance >= 0.9 ? '✅ PASS' : '❌ REVIEW REQUIRED'} (${(keyData.bsbCompliance * 100).toFixed(1)}%)`);
    console.log(`   • SRA Compliance: ${keyData.sraCompliance >= 0.9 ? '✅ PASS' : '❌ REVIEW REQUIRED'} (${(keyData.sraCompliance * 100).toFixed(1)}%)`);
    console.log(`   • Court Readiness: ${keyData.courtReadiness >= 0.85 ? '✅ READY' : '❌ NOT READY'} (${(keyData.courtReadiness * 100).toFixed(1)}%)`);
    console.log();

    // Example 4: Client reporting
    console.log('📄 Example 4: Client Report Generation');
    console.log('   Auto-generated client summary:');
    console.log(`   "Your ${keyData.practiceArea.toLowerCase()} matter has been analyzed with`);
    console.log(`   ${(keyData.confidence * 100).toFixed(1)}% confidence by our English Legal AI system.`);
    console.log(`   Risk assessment: ${keyData.riskLevel}. The matter is ${keyData.courtReadiness >= 0.9 ? 'court-ready' : 'requires additional preparation'}."`);
    console.log();

    // Example 5: Integration with external systems
    console.log('🔗 Example 5: External System Integration');
    console.log('   Webhook payload for case management system:');
    
    const webhookPayload = {
      caseId: 'CASE-2024-001',
      analysisId: analysisResult.analysis.resultId,
      status: 'analysis_complete',
      confidence: keyData.confidence,
      riskLevel: keyData.riskLevel,
      actionRequired: keyData.confidence < 0.9 ? 'senior_review' : 'standard_processing',
      estimatedHours: keyData.riskLevel === 'High' ? 15 : keyData.riskLevel === 'Medium' ? 8 : 5,
      urgentFlags: keyData.recommendations.filter(r => r.priority === 'High').map(r => r.action),
      complianceStatus: {
        bsb: keyData.bsbCompliance >= 0.9,
        sra: keyData.sraCompliance >= 0.9,
        courtReady: keyData.courtReadiness >= 0.85
      }
    };
    
    console.log('   JSON Webhook:');
    console.log(JSON.stringify(webhookPayload, null, 2));
    console.log();

    // Step 4: Performance metrics
    console.log('⚡ Step 4: Integration Performance Metrics');
    console.log(`   • API Response: Successful`);
    console.log(`   • Data Extraction: ${Object.keys(keyData).length} key fields extracted`);
    console.log(`   • Processing Time: ${analysisResult.analysis.documentAnalysis.extractionTime}ms (document) + ~1000ms (analysis)`);
    console.log(`   • System Mode: ${analysisResult.analysis.systemMode || 'simulation'}`);
    console.log(`   • API Compatible: ${analysisResult.metadata.apiCompatible ? 'Yes' : 'No'}`);
    console.log();

    console.log('✅ JSON API INTEGRATION DEMO COMPLETE!');
    console.log();
    console.log('💡 Integration Benefits Demonstrated:');
    console.log('   ✅ Structured JSON output for easy parsing');
    console.log('   ✅ Risk-based business logic integration');
    console.log('   ✅ Automated workflow decisions');
    console.log('   ✅ Compliance monitoring and reporting');
    console.log('   ✅ Client communication automation');
    console.log('   ✅ External system integration via webhooks');
    console.log('   ✅ Performance metrics for monitoring');
    console.log();
    console.log('🚀 The Legal AI system is ready for production integration!');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.log();
    console.log('💡 This might happen if:');
    console.log('   • The legal AI system is not properly set up');
    console.log('   • The sample contract file is missing');
    console.log('   • There are permission issues');
  }
}

// Run the demonstration
demonstrateAPIIntegration();