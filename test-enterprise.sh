#!/bin/bash

# ENTERPRISE INTEGRATION TEST RUNNER
# Executes comprehensive integration tests for Week 1 enterprise components

echo "🧪 Enterprise Integration Test Suite"
echo "===================================="
echo ""
echo "This will test:"
echo "  ✓ Component initialization"
echo "  ✓ Document processing pipeline"
echo "  ✓ Memory management (2GB limit)"
echo "  ✓ Worker pool scaling"
echo "  ✓ Priority queue processing"
echo "  ✓ Incremental processing"
echo "  ✓ Error recovery"
echo "  ✓ Large folder processing (100+ docs)"
echo "  ✓ Legal intelligence hooks"
echo "  ✓ Performance benchmarks"
echo ""
echo "Starting tests..."
echo ""

# Check if TypeScript is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Compile TypeScript files
echo "📦 Compiling TypeScript..."
npx tsc src/tests/enterprise-integration-test.ts --outDir dist/tests --esModuleInterop --skipLibCheck 2>/dev/null

if [ $? -ne 0 ]; then
    echo "⚠️ TypeScript compilation warnings (continuing...)"
fi

# Run the integration tests
echo ""
echo "🚀 Running integration tests..."
echo ""

# Execute with Node.js
node dist/tests/enterprise-integration-test.js

TEST_RESULT=$?

echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ All enterprise integration tests PASSED!"
    echo ""
    echo "Next steps:"
    echo "1. Review test report above for performance metrics"
    echo "2. Proceed to Week 2: Distributed Processing implementation"
    echo "3. Run: ./start-week-2.sh to continue"
else
    echo "❌ Some tests FAILED. Please review the errors above."
    echo ""
    echo "Common issues:"
    echo "1. Memory usage exceeding 2GB limit"
    echo "2. Processing speed below targets"
    echo "3. Component initialization failures"
    echo ""
    echo "Fix the issues and run this test again."
fi

exit $TEST_RESULT