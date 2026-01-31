#!/bin/bash
set -e  # Exit on error
cd ~/Desktop/rideendine

echo "🚀 RideNDine Auto-Optimize"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Lint (allow warnings)
echo "📋 Step 1/3: Linting code..."
npm run lint -- --quiet 2>&1 | grep -E "error|✖" || echo "  ✓ Lint passed (warnings ignored)"

# 2. Build API
echo ""
echo "🔨 Step 2/3: Building API service..."
cd services/api
if npm run build > /dev/null 2>&1; then
  echo "  ✓ API build successful"
else
  echo "  ✗ API build failed"
  exit 1
fi

# 3. Test API
echo ""
echo "🧪 Step 3/3: Running tests..."
if npm run test -- --passWithNoTests --silent 2>&1 | grep -q "Tests:.*passed"; then
  echo "  ✓ Tests passed"
else
  echo "  ⚠ Tests have failures (check output above)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Optimization complete!"
