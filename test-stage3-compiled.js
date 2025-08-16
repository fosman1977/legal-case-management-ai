
const { stage3EnglishIntegration } = require('./dist/core/stage3-english-integration.js');

async function testStage3() {
  const mockEnhancedAnalysis = {
    lawyerGradeConfidence: 0.875,
    timestamp: Date.now()
  };
  
  const mockPhase2 = {
    finalLawyerGradeConfidence: 0.875
  };
  
  const mockUncertainty = {
    overallUncertainty: 0.125
  };
  
  const result = await stage3EnglishIntegration.performStage3Analysis(
    mockEnhancedAnalysis, 
    mockPhase2, 
    mockUncertainty
  );
  
  console.log('🎯 Stage 3 Test Results:');
  console.log(`   Final Confidence: ${(result.finalJudicialConfidence * 100).toFixed(1)}%`);
  console.log(`   Court Readiness: ${(result.courtReadiness.overallReadiness * 100).toFixed(1)}%`);
  console.log(`   Professional Cert: ${result.professionalCertification.overallCertification}`);
  console.log(`   Deployment Ready: ${result.deploymentReadiness.ready ? 'Yes' : 'No'}`);
  
  return result;
}

testStage3().then(() => {
  console.log('✅ Stage 3 system test completed successfully!');
}).catch(error => {
  console.error('❌ Stage 3 test failed:', error.message);
});
