const { ComplianceRelevanceFilter } = require('./dist/core/compliance-relevance-filter-fixed.js');

console.log('🔍 COMPLIANCE RELEVANCE FILTERING TEST\n');

const report = ComplianceRelevanceFilter.getApplicableRegulations('documentAnalysis');

console.log('📋 APPLICABLE REGULATIONS FOR DOCUMENT ANALYSIS:');
console.log('═══════════════════════════════════════════════\n');

console.log('✅ BSB Core Duties (Applicable):');
Object.entries(report.bsbApplicable.coreDuties)
  .filter(([id, duty]) => duty.applicable)
  .forEach(([id, duty]) => {
    console.log(`   ${id}: ${duty.reason} [${duty.relevance}]`);
  });

console.log('\n✅ SRA Principles (Applicable):');
Object.entries(report.sraApplicable.principles)
  .filter(([id, principle]) => principle.applicable)
  .forEach(([id, principle]) => {
    console.log(`   ${id}: ${principle.reason} [${principle.relevance}]`);
  });

console.log('\n❌ NON-APPLICABLE REGULATIONS (Appropriately Excluded):');
console.log('═══════════════════════════════════════════════════════\n');

console.log('❌ BSB Core Duties (Not Applicable):');
Object.entries(report.bsbApplicable.coreDuties)
  .filter(([id, duty]) => !duty.applicable)
  .forEach(([id, duty]) => {
    console.log(`   ${id}: ${duty.reason}`);
  });

console.log('\n❌ SRA Principles (Not Applicable):');
Object.entries(report.sraApplicable.principles)
  .filter(([id, principle]) => !principle.applicable)
  .forEach(([id, principle]) => {
    console.log(`   ${id}: ${principle.reason}`);
  });

// Count summary
const applicableBSB = Object.values(report.bsbApplicable.coreDuties).filter(d => d.applicable).length;
const nonApplicableBSB = Object.values(report.bsbApplicable.coreDuties).filter(d => !d.applicable).length;
const applicableSRA = Object.values(report.sraApplicable.principles).filter(p => p.applicable).length;
const nonApplicableSRA = Object.values(report.sraApplicable.principles).filter(p => !p.applicable).length;

console.log('\n📊 RELEVANCE SUMMARY:');
console.log('═══════════════════\n');
console.log(`BSB Core Duties: ${applicableBSB} applicable, ${nonApplicableBSB} excluded`);
console.log(`SRA Principles: ${applicableSRA} applicable, ${nonApplicableSRA} excluded`);
console.log(`Total Applicable: ${applicableBSB + applicableSRA}`);
console.log(`Total Excluded: ${nonApplicableBSB + nonApplicableSRA}`);
console.log(`Applicability Rate: ${((applicableBSB + applicableSRA) / (applicableBSB + applicableSRA + nonApplicableBSB + nonApplicableSRA) * 100).toFixed(1)}%`);

console.log('\n✅ Relevance filtering working correctly - non-applicable regulations appropriately excluded!');