# Arize AI Capability Demonstration Guide

## Overview
This guide shows how to generate authentic telemetry data from OriginLedger to demonstrate Arize Phoenix's observability capabilities for supply chain blockchain operations.

## Data Collection Methods

### 1. Blockchain Validation Telemetry
Generate real blockchain integrity data:

```bash
# Test blockchain validation with tracing
curl -X POST http://localhost:5000/api/chain/validate

# Expected traces:
- Blockchain.Validation spans with chain length, validation time
- Hash verification performance metrics
- Corruption detection events (if any)
```

### 2. Supply Chain Event Correlation
Create authentic asset tracking events:

```bash
# Login as manufacturer to generate auth traces
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manufacturer1","password":"demo123"}'

# Create new asset (requires manufacturer auth)
curl -X POST http://localhost:5000/api/assets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assetId":"PHX-2025-001","name":"Arize Demo Product","category":"electronics"}'

# Generate supply chain events
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assetId":"asset_id","participantId":"participant_id","action":"shipped","location":"Phoenix, AZ"}'
```

### 3. Performance Monitoring Data
Generate API performance telemetry:

```bash
# High-frequency asset searches (generates performance data)
for i in {1..10}; do
  curl -s "http://localhost:5000/api/assets?search=demo&page=$i" > /dev/null
done

# Concurrent participant lookups
curl -s "http://localhost:5000/api/participants" &
curl -s "http://localhost:5000/api/dashboard-stats" &
curl -s "http://localhost:5000/api/recent-activities" &
wait
```

## Phoenix Configuration for Demo

### Environment Setup
Set these environment variables to connect to Phoenix:

```bash
# For local Phoenix instance
export PHOENIX_OTEL_ENDPOINT="http://localhost:6006/v1/traces"

# For Phoenix Cloud (requires API key from Arize)
export PHOENIX_OTEL_ENDPOINT="https://app.phoenix.arize.com/v1/traces"
export PHOENIX_API_KEY="your_arize_cloud_api_key"
```

### Demo Script for Authentic Data Generation

```bash
#!/bin/bash
echo "Generating authentic OriginLedger telemetry for Arize Phoenix..."

# 1. Blockchain operations
echo "Testing blockchain validation..."
curl -s -X POST http://localhost:5000/api/chain/validate | jq '.isValid'

# 2. Authentication flows
echo "Testing authentication telemetry..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manufacturer1","password":"demo123"}' | jq -r '.token')

# 3. Asset operations with tracing
echo "Creating traced asset operations..."
curl -s -X POST http://localhost:5000/api/assets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assetId":"DEMO-2025-001","name":"Phoenix Demo Asset","category":"electronics"}'

# 4. Supply chain events
echo "Generating supply chain event traces..."
curl -s -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assetId":"existing_asset_id","action":"quality_check","location":"Phoenix Lab"}'

# 5. Observability demo endpoint
echo "Running comprehensive observability demo..."
curl -s -X POST http://localhost:5000/api/observability/demo | jq '.phoenixIntegration'

echo "Telemetry generation complete. Check Phoenix dashboard for traces."
```

## Key Metrics to Showcase

### 1. Blockchain Integrity Monitoring
- **Hash validation performance**: Time to verify each block
- **Chain corruption detection**: Automated anomaly identification
- **Consensus validation**: Multi-node verification tracking

### 2. Supply Chain Transparency
- **Asset lifecycle tracking**: Manufacturing → Shipping → Delivery
- **Participant interaction patterns**: Cross-role activity correlation
- **Event temporal analysis**: Supply chain timing optimization

### 3. Security & Compliance
- **Authentication success/failure rates**: Security monitoring
- **Role-based access patterns**: Compliance verification
- **API usage by subscription tier**: Business intelligence

### 4. Performance Analytics
- **API response times**: System performance monitoring
- **Database query optimization**: Backend performance insights
- **User interaction patterns**: Frontend usage analytics

## Demonstrable Use Cases

### Manufacturing Quality Control
```javascript
// Trace pattern for quality issues
Span: "Asset.QualityCheck"
Attributes: {
  assetId: "BATCH-2025-001",
  defectRate: 0.02,
  inspectorId: "QC-001",
  location: "Phoenix Facility",
  batchSize: 1000
}
```

### Supply Chain Fraud Detection
```javascript
// Anomaly detection pattern
Span: "Participant.Authentication"
Attributes: {
  participantId: "suspicious_actor",
  loginAttempts: 15,
  geolocation: "unusual_location",
  timeOfDay: "off_hours",
  riskScore: 0.85
}
```

### Regulatory Compliance Reporting
```javascript
// Audit trail pattern
Span: "Compliance.AuditExport"
Attributes: {
  auditPeriod: "2025-Q1",
  recordCount: 50000,
  complianceScore: 0.98,
  regulatoryFramework: "FDA_CFR_Part_11"
}
```

## Expected Phoenix Dashboard Views

### 1. Service Map
- OriginLedger-SupplyChain service with connected components
- Blockchain validation service dependencies
- Database interaction patterns

### 2. Trace Analysis
- End-to-end supply chain event flows
- Performance bottleneck identification
- Error rate monitoring across operations

### 3. Business Metrics
- Asset creation/transfer rates
- Participant engagement levels
- Subscription tier usage patterns

## Data Quality Indicators

### High-Value Traces
✓ **Blockchain validation**: Real hash verification with timing
✓ **Asset lifecycle**: Authentic manufacturing-to-delivery flows
✓ **Security events**: Actual authentication and authorization
✓ **Performance data**: Real API response times under load

### Metrics That Prove ROI
- **Mean Time to Detection (MTTD)**: Fraud/anomaly identification speed
- **Supply Chain Visibility**: End-to-end tracking accuracy
- **Compliance Automation**: Audit report generation efficiency
- **Operational Intelligence**: Predictive analytics effectiveness

## Partnership Value Proposition

This authentic telemetry demonstrates:

1. **Real-world applicability**: Actual supply chain blockchain data
2. **Enterprise readiness**: Production-grade monitoring capabilities
3. **Business impact**: Measurable improvements in transparency and efficiency
4. **Technical sophistication**: Advanced observability integration

## Next Steps for API Access

1. **Contact Arize AI**: Share this demo data and use cases
2. **Request Phoenix Cloud API key**: Enable cloud-based monitoring
3. **Schedule technical review**: Demonstrate live integration
4. **Pilot program**: Propose joint customer engagement