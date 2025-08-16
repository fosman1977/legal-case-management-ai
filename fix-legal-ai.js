// Quick fix for legal-ai.js syntax error
const fs = require('fs');

const content = fs.readFileSync('dist/legal-ai.js', 'utf8');

// Fix the escaped newline issue
const fixed = content.replace(
  "const { EnhancedDocumentParser } = require('./services/enhanced-document-parser.js');\\n    const { ComplianceUpdateChecker } = require('./core/compliance-update-checker.js');",
  "const { EnhancedDocumentParser } = require('./services/enhanced-document-parser.js');\n    const { ComplianceUpdateChecker } = require('./core/compliance-update-checker.js');"
);

fs.writeFileSync('dist/legal-ai.js', fixed);
console.log('✅ Fixed syntax error in legal-ai.js');