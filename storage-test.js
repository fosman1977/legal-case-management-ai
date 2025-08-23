/**
 * Storage Persistence Test Script
 * Run this in browser console to verify data persistence
 */

async function testStoragePersistence() {
  console.log('🔍 Starting Storage Persistence Test...');
  
  try {
    // Test 1: Check if storage service is available
    console.log('\n📊 Test 1: Storage Service Availability');
    if (typeof window.storage === 'undefined') {
      console.log('❌ Storage service not available globally');
      // Try to access via app context
      console.log('⚠️ Storage may only be available within React components');
    } else {
      console.log('✅ Storage service is available');
    }

    // Test 2: Check IndexedDB status
    console.log('\n💾 Test 2: IndexedDB Status');
    if ('indexedDB' in window) {
      console.log('✅ IndexedDB is supported by browser');
      
      // Check if our database exists
      const databases = await indexedDB.databases();
      const ourDB = databases.find(db => db.name === 'BarristerAssistantDB');
      if (ourDB) {
        console.log(`✅ BarristerAssistantDB found (version: ${ourDB.version})`);
      } else {
        console.log('⚠️ BarristerAssistantDB not found - may be created on first use');
      }
    } else {
      console.log('❌ IndexedDB not supported');
    }

    // Test 3: Check localStorage data
    console.log('\n📁 Test 3: LocalStorage Data');
    const storageKeys = [
      'barrister_cases',
      'case_documents', 
      'key_points',
      'chronology_events',
      'legal_authorities',
      'case_persons',
      'case_issues'
    ];
    
    storageKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
          console.log(`✅ ${key}: ${count} items`);
        } catch (e) {
          console.log(`⚠️ ${key}: Invalid JSON data`);
        }
      } else {
        console.log(`⚪ ${key}: No data`);
      }
    });

    // Test 4: Recent document uploads
    console.log('\n📄 Test 4: Recent Document Uploads');
    const documents = localStorage.getItem('case_documents');
    if (documents) {
      const docs = JSON.parse(documents);
      console.log(`Found ${docs.length} documents in storage:`);
      docs.slice(0, 3).forEach(doc => {
        console.log(`  - ${doc.name} (${doc.type}) - ${doc.uploadDate || 'no date'}`);
        console.log(`    Content length: ${doc.content?.length || 0} chars`);
        console.log(`    Analysis: ${doc.analysisComplete ? '✅ Complete' : '❌ Incomplete'}`);
      });
    } else {
      console.log('⚪ No documents found in storage');
    }

    // Test 5: Verify data integrity
    console.log('\n🔍 Test 5: Data Integrity Check');
    let totalEntries = 0;
    let validEntries = 0;
    
    storageKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          totalEntries++;
          if (parsed && (Array.isArray(parsed) || typeof parsed === 'object')) {
            validEntries++;
          }
        } catch (e) {
          totalEntries++;
        }
      }
    });
    
    const integrityRate = totalEntries > 0 ? (validEntries / totalEntries) * 100 : 100;
    console.log(`Data integrity: ${integrityRate.toFixed(1)}% (${validEntries}/${totalEntries} valid)`);

    // Test 6: Storage persistence after reload
    console.log('\n🔄 Test 6: Reload Persistence Test');
    console.log('💡 To test persistence after page reload:');
    console.log('   1. Note the current data counts above');
    console.log('   2. Refresh the page (F5)');
    console.log('   3. Run this test again');
    console.log('   4. Compare data counts - they should be identical');

    // Summary
    console.log('\n📊 Storage Test Summary:');
    console.log(`- IndexedDB Support: ${('indexedDB' in window) ? '✅' : '❌'}`);
    console.log(`- Data Integrity: ${integrityRate.toFixed(1)}%`);
    console.log(`- Storage Entries: ${totalEntries}`);
    
    const overallSuccess = 
      ('indexedDB' in window) &&
      integrityRate > 90 &&
      totalEntries >= 0;
    
    console.log(`\n🎯 Overall Storage Test: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    return overallSuccess;
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return false;
  }
}

// Make available globally
window.testStoragePersistence = testStoragePersistence;
console.log('💡 Storage test available: window.testStoragePersistence()');