/**
 * Basic Processing Test
 * Test core functionality without advanced features
 */

// Simple test document
const testDocument = `
Contract for Legal Services

This agreement is made between John Smith (the Client) and Sarah Jones (the Solicitor) 
of Manchester Legal Services Ltd.

The Client agrees to pay £500 per hour for legal representation in the case of 
Smith v Wilson [2023] EWHC 123 (QB).

Important dates:
- Initial consultation: 15th January 2024
- Court hearing: 3rd March 2024
- Filing deadline: 28th February 2024

Legal issues include:
- Breach of contract claim
- Damages assessment
- Negligence allegations

This contract is governed by English law and any disputes will be heard in the 
High Court of Justice.
`;

console.log('🧪 Basic Processing Test');
console.log('Document length:', testDocument.length);
console.log('Expected entities:');
console.log('- Persons: John Smith, Sarah Jones');
console.log('- Organizations: Manchester Legal Services Ltd, High Court of Justice');
console.log('- Dates: 15th January 2024, 3rd March 2024, 28th February 2024');
console.log('- Citations: Smith v Wilson [2023] EWHC 123 (QB)');
console.log('- Issues: Breach of contract claim, Damages assessment, Negligence allegations');
console.log('- Financial: £500 per hour');

// Test would go here - this is just a reference document