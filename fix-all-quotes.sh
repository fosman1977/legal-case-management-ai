#!/bin/bash

echo "🔧 Comprehensive character encoding fix for TypeScript/React files..."

# Function to fix a single file
fix_file() {
    local file="$1"
    echo "  Fixing: $(basename "$file")"
    
    # Fix curly quotes
    sed -i 's/"/"/g' "$file"
    sed -i 's/"/"/g' "$file"
    sed -i "s/'/'/g" "$file"
    sed -i "s/'/'/g" "$file"
    
    # Fix broken className attributes (className=\something\ -> className="something")
    sed -i 's/className=\\([^\\>]*\\)>/className="\1">/g' "$file"
    
    # Fix broken target and rel attributes
    sed -i 's/target=\\_blank\\/target="_blank"/g' "$file"
    sed -i 's/rel=\\noopener noreferrer\\/rel="noopener noreferrer"/g' "$file"
    
    # Fix any other common broken attributes
    sed -i 's/=\\([a-zA-Z0-9-_ ]*\\)/="\1"/g' "$file"
    
    # Fix template literal issues
    sed -i 's/className="{`/className={`/g' "$file"
    sed -i 's/`}"/`}/g' "$file"
}

# Count files with issues before fixing
BEFORE_COUNT=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l '[""'']' 2>/dev/null | wc -l)
echo "📁 Found $BEFORE_COUNT files with character encoding issues"

# Process all TypeScript and React files
find src -name "*.tsx" -o -name "*.ts" | while read -r file; do
    if grep -q '[""'']' "$file" 2>/dev/null; then
        fix_file "$file"
    fi
done

# Also fix any remaining syntax issues
echo "🔄 Fixing remaining syntax issues..."
find src -name "*.tsx" -o -name "*.ts" | while read -r file; do
    # Fix any remaining broken className patterns
    if grep -q 'className=\\' "$file" 2>/dev/null; then
        fix_file "$file"
    fi
done

# Count files with issues after fixing
AFTER_COUNT=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l '[""'']' 2>/dev/null | wc -l)

echo "✅ Character encoding fix complete!"
echo "📊 Files fixed: $(($BEFORE_COUNT - $AFTER_COUNT))"
echo "📊 Remaining issues: $AFTER_COUNT"

if [ $AFTER_COUNT -eq 0 ]; then
    echo "🎉 All character encoding issues resolved!"
else
    echo "⚠️  Some files may still have issues:"
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -l '[""'']' 2>/dev/null | head -5
fi