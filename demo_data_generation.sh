#!/bin/bash
echo "🔍 Generating Authentic Telemetry for Arize Phoenix Demo"
echo "=================================================="

# Base URL
BASE_URL="http://localhost:5000"

# 1. Test observability status
echo "1. Checking Phoenix integration status..."
curl -s "$BASE_URL/api/observability/status" | jq -r '.integrationStatus'

# 2. Generate blockchain validation traces
echo "2. Generating blockchain validation telemetry..."
VALIDATION_RESULT=$(curl -s -X POST "$BASE_URL/api/chain/validate")
echo "Blockchain validation: $(echo $VALIDATION_RESULT | jq -r '.isValid')"
echo "Total blocks validated: $(echo $VALIDATION_RESULT | jq -r '.totalBlocks')"

# 3. Authentication telemetry
echo "3. Generating authentication traces..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"manufacturer1","password":"demo123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Authentication successful: $(echo $LOGIN_RESPONSE | jq -r '.message')"

# 4. Asset operation traces
echo "4. Generating asset tracking telemetry..."
ASSET_ID="PHX-$(date +%Y)-$(printf "%03d" $RANDOM)"
ASSET_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"assetId\":\"$ASSET_ID\",\"name\":\"Phoenix Demo Asset\",\"category\":\"electronics\",\"batch\":\"DEMO-BATCH-001\"}")

if echo $ASSET_RESPONSE | jq -e '.asset' > /dev/null; then
  echo "Asset created: $ASSET_ID"
else
  echo "Asset creation failed, using existing asset for events"
  ASSET_ID="PRD-2024-001"  # Use existing demo asset
fi

# 5. Supply chain event traces
echo "5. Generating supply chain event telemetry..."
EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"assetId\":\"$ASSET_ID\",\"action\":\"phoenix_demo\",\"location\":\"Phoenix Demo Lab\",\"metadata\":{\"demo\":true,\"timestamp\":\"$(date -Iseconds)\"}}")

echo "Event created: $(echo $EVENT_RESPONSE | jq -r '.message')"

# 6. Performance stress testing
echo "6. Generating API performance telemetry..."
for i in {1..5}; do
  curl -s "$BASE_URL/api/assets?search=demo&page=$i" > /dev/null &
  curl -s "$BASE_URL/api/participants" > /dev/null &
  curl -s "$BASE_URL/api/dashboard-stats" > /dev/null &
done
wait
echo "Performance testing completed (15 concurrent requests)"

# 7. Comprehensive observability demo
echo "7. Running Phoenix observability demonstration..."
DEMO_RESPONSE=$(curl -s -X POST "$BASE_URL/api/observability/demo")
echo "Demo status: $(echo $DEMO_RESPONSE | jq -r '.message')"
echo "Traced operations: $(echo $DEMO_RESPONSE | jq -r '.tracedOperations | length')"

# 8. Health check with observability status
echo "8. Final health check with observability metrics..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")
echo "System status: $(echo $HEALTH_RESPONSE | jq -r '.status')"
echo "Phoenix tracing: $(echo $HEALTH_RESPONSE | jq -r '.observability.tracingActive')"

echo ""
echo "=================================================="
echo "✅ Telemetry Generation Complete"
echo "=================================================="
echo "Generated data includes:"
echo "• Blockchain validation traces with integrity checks"
echo "• Authentication and authorization events"
echo "• Asset lifecycle tracking telemetry"
echo "• Supply chain event correlation data"
echo "• API performance metrics under load"
echo "• System health monitoring traces"
echo ""
echo "Next steps:"
echo "1. Configure PHOENIX_OTEL_ENDPOINT environment variable"
echo "2. Set PHOENIX_API_KEY for cloud integration"
echo "3. View traces in Phoenix dashboard"
echo "4. Share results with Arize AI team"
