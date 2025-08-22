# Detroit Civic Blockchain API Documentation

## **🚀 Complete API Reference**

This documentation provides comprehensive details for all Detroit Civic Blockchain endpoints, enabling seamless integration with municipal systems and third-party applications.

## **🔐 Authentication**

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### **Authentication Endpoints**

#### **POST /api/auth/login**
Authenticate resident or city official
```json
{
  "username": "justin_owenu",
  "password": "demo123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "justin_owenu",
    "role": "resident"
  }
}
```

## **🏠 Property Registry API**

### **GET /api/detroit/properties**
Retrieve all properties in Detroit registry

**Response:**
```json
{
  "message": "Detroit property registry retrieved",
  "properties": [
    {
      "id": "uuid",
      "propertyId": "DET-0012345",
      "address": "1234 Woodward Ave, Detroit, MI 48201",
      "ownerId": "uuid",
      "assessedValue": 25000000,
      "assessedValueFormatted": "$250,000",
      "taxOwed": 180000,
      "taxOwedFormatted": "$1,800",
      "status": "active",
      "metadata": {
        "neighborhood": "Downtown Detroit",
        "propertyType": "Residential",
        "squareFootage": 1800,
        "year": 2025
      },
      "createdAt": "2025-08-22T02:48:35.207Z",
      "updatedAt": "2025-08-22T02:48:35.207Z"
    }
  ],
  "total": 2
}
```

### **GET /api/detroit/properties/:id**
Get specific property details

**Response:**
```json
{
  "property": {
    "id": "uuid",
    "propertyId": "DET-0012345",
    "address": "1234 Woodward Ave, Detroit, MI 48201",
    "assessedValueFormatted": "$250,000",
    "taxOwedFormatted": "$1,800"
  },
  "owners": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "ownerId": "uuid",
      "fraction": "1.0",
      "acquiredAt": "2025-08-22T02:48:35.207Z",
      "transferTx": "0xDEF456ABC123789"
    }
  ],
  "payments": [
    {
      "id": "uuid",
      "amount": 90000,
      "amountFormatted": "$900",
      "paymentMethod": "usdc",
      "status": "completed",
      "txHash": "0xABC123DEF456789",
      "timestamp": "2025-08-22T02:48:35.207Z"
    }
  ]
}
```

### **POST /api/detroit/properties**
Register new property (Government role required)

**Request:**
```json
{
  "propertyId": "DET-0012347",
  "address": "9999 Main St, Detroit, MI 48201",
  "ownerId": "uuid",
  "assessedValue": 30000000,
  "status": "active",
  "taxOwed": 0,
  "metadata": {
    "neighborhood": "Midtown",
    "propertyType": "Commercial",
    "squareFootage": 2500
  }
}
```

**Response:**
```json
{
  "message": "Property registered successfully",
  "property": {
    "id": "uuid",
    "propertyId": "DET-0012347",
    "assessedValueFormatted": "$300,000",
    "taxOwedFormatted": "$0"
  }
}
```

### **GET /api/properties/search**
Advanced property search with filters

**Query Parameters:**
- `address` - Search by address
- `neighborhood` - Filter by neighborhood
- `propertyType` - Filter by property type
- `minValue` - Minimum assessed value (dollars)
- `maxValue` - Maximum assessed value (dollars)

**Example:** `/api/properties/search?neighborhood=Downtown&minValue=200000&maxValue=500000`

**Response:**
```json
{
  "message": "Property search completed",
  "properties": [...],
  "total": 15,
  "neighborhoodStats": [
    {
      "neighborhood": "Downtown Detroit",
      "propertyCount": 8,
      "averageValue": "$275,000",
      "totalValue": "$2,200,000"
    }
  ]
}
```

## **💰 Payment Processing API**

### **POST /api/payments/property/:propertyId**
Process property tax payment

**Request:**
```json
{
  "amount": 90000,
  "paymentMethod": "usdc",
  "txHash": "0xABC123DEF456789"
}
```

**Response:**
```json
{
  "message": "Property tax payment processed successfully",
  "payment": {
    "id": "uuid",
    "amount": 90000,
    "amountFormatted": "$900",
    "paymentMethod": "usdc",
    "status": "completed",
    "txHash": "0xABC123DEF456789",
    "timestamp": "2025-08-22T02:48:35.207Z"
  },
  "updatedTaxBalance": "$900"
}
```

### **GET /api/detroit/properties/:id/payments**
Get payment history for property

**Response:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "amount": 90000,
      "amountFormatted": "$900",
      "paymentMethod": "usdc",
      "status": "completed",
      "txHash": "0xABC123DEF456789",
      "timestamp": "2025-08-22T02:48:35.207Z",
      "context": {
        "reason": "Property Tax Payment",
        "blockchainNetwork": "Ethereum"
      }
    }
  ],
  "total": 1
}
```

## **📊 Ownership Management API**

### **POST /api/ownership/transfer**
Transfer fractional property ownership

**Request:**
```json
{
  "propertyId": "uuid",
  "toOwnerId": "uuid",
  "fraction": 0.5,
  "transferTx": "0xABC123DEF456789",
  "salePrice": 12500000
}
```

**Response:**
```json
{
  "message": "Ownership transfer completed successfully",
  "ownership": {
    "id": "uuid",
    "propertyId": "uuid",
    "ownerId": "uuid",
    "fraction": "0.5",
    "acquiredAt": "2025-08-22T02:48:35.207Z",
    "transferTx": "0xABC123DEF456789",
    "metadata": {
      "transferType": "sale",
      "fromOwnerId": "uuid",
      "salePrice": 12500000,
      "nftReady": true,
      "blockchainVerified": true
    }
  },
  "nftCompatible": true,
  "blockchainVerified": true
}
```

### **GET /api/detroit/properties/:id/owners**
Get ownership records for property

**Response:**
```json
{
  "owners": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "ownerId": "uuid",
      "fraction": "0.5",
      "acquiredAt": "2025-08-22T02:48:35.207Z",
      "transferTx": "0xABC123DEF456789"
    }
  ],
  "total": 2
}
```

## **👤 Resident Profile API**

### **GET /api/participants/:id/properties**
Get all properties owned by resident

**Response:**
```json
{
  "message": "Resident properties retrieved",
  "properties": [
    {
      "id": "uuid",
      "propertyId": "DET-0012345",
      "address": "1234 Woodward Ave, Detroit, MI 48201",
      "assessedValueFormatted": "$250,000",
      "taxOwedFormatted": "$1,800",
      "metadata": {
        "neighborhood": "Downtown Detroit",
        "propertyType": "Residential"
      }
    }
  ],
  "ownerships": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "fraction": "1.0",
      "acquiredAt": "2025-08-22T02:48:35.207Z"
    }
  ],
  "totalProperties": 1,
  "totalOwnerships": 1
}
```

## **🔍 Transparency & Audit API**

### **GET /api/audit/properties/:propertyId**
Get comprehensive audit trail for property

**Response:**
```json
{
  "message": "Property audit trail retrieved",
  "audit": {
    "property": {
      "id": "uuid",
      "propertyId": "DET-0012345",
      "address": "1234 Woodward Ave, Detroit, MI 48201",
      "assessedValueFormatted": "$250,000",
      "taxOwedFormatted": "$1,800"
    },
    "totalPayments": 2,
    "totalPaymentAmount": 180000,
    "totalPaymentAmountFormatted": "$1,800",
    "ownershipHistory": [
      {
        "id": "uuid",
        "ownerId": "uuid",
        "fraction": "1.0",
        "fractionPercent": "100.0%",
        "acquiredAt": "2025-08-22T02:48:35.207Z",
        "transferTx": "0xDEF456ABC123789"
      }
    ],
    "recentPayments": [
      {
        "id": "uuid",
        "amount": 90000,
        "amountFormatted": "$900",
        "paymentMethod": "usdc",
        "status": "completed",
        "txHash": "0xABC123DEF456789",
        "timestamp": "2025-08-22T02:48:35.207Z"
      }
    ],
    "transparency": {
      "publicRecord": true,
      "blockchainVerified": true,
      "auditCompliant": true,
      "lastUpdated": "2025-08-22T02:48:35.207Z"
    }
  }
}
```

## **🏛️ Municipal Dashboard API**

### **GET /api/detroit/dashboard**
Get Detroit civic blockchain dashboard data

**Response:**
```json
{
  "title": "Detroit Civic Blockchain Dashboard",
  "stats": {
    "totalProperties": 2,
    "totalAssessedValue": "$700,000",
    "totalTaxOwed": "$1,800",
    "governmentProperties": 1,
    "activeResidents": 1,
    "blockchainTransactions": 2
  },
  "recentProperties": [
    {
      "id": "uuid",
      "propertyId": "DET-0012345",
      "address": "1234 Woodward Ave, Detroit, MI 48201",
      "assessedValueFormatted": "$250,000",
      "taxOwedFormatted": "$1,800",
      "metadata": {
        "neighborhood": "Downtown Detroit",
        "propertyType": "Residential"
      }
    }
  ],
  "municipalFeatures": [
    "Property tax blockchain payments",
    "Fractional ownership support",
    "Real-time property registry",
    "Crypto payment integration",
    "Municipal transparency",
    "Audit trail compliance"
  ]
}
```

## **🔒 Security & Monitoring API**

### **GET /api/security/status**
Get security system status

**Response:**
```json
{
  "timestamp": "2025-08-22T01:48:48.248Z",
  "environment": "development",
  "protocol": "http",
  "host": "localhost:5000",
  "advancedSecurity": {
    "canarySystem": "active",
    "rateLimiting": "enabled",
    "auditLogging": "comprehensive",
    "intrusionDetection": "real-time",
    "canaryEndpoints": 21,
    "securityFeatures": [
      "Security canary honeypots",
      "API rate limiting",
      "Comprehensive audit logging",
      "Real-time intrusion detection",
      "Risk-based authentication monitoring"
    ]
  }
}
```

### **GET /api/security/dashboard**
Get security monitoring dashboard (Admin only)

**Response:**
```json
{
  "timestamp": "2025-08-22T01:47:41.277Z",
  "securityPosture": "enterprise-grade",
  "activeDefenses": {
    "canaryEndpoints": 21,
    "rateLimitingRules": 5,
    "auditLogging": "enabled",
    "intrusionDetection": "active"
  },
  "threatIntelligence": {
    "canaryTriggersToday": 0,
    "suspiciousIPs": 0,
    "blockedRequests": 0,
    "riskScore": "low"
  },
  "complianceStatus": {
    "auditTrail": "complete",
    "dataProtection": "encrypted",
    "accessControl": "role-based",
    "incidentResponse": "automated"
  }
}
```

## **⚠️ Error Handling**

All API endpoints use consistent error response format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": ["Additional error details array"],
  "timestamp": "2025-08-22T01:48:48.248Z"
}
```

### **Common Error Codes**
- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - Authentication token missing/invalid
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `PROPERTY_NOT_FOUND` - Property does not exist
- `PAYMENT_PROCESSING_ERROR` - Payment failed to process
- `OWNERSHIP_TRANSFER_ERROR` - Ownership transfer failed

## **📈 Rate Limiting**

API endpoints have the following rate limits:

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|---------|
| Authentication | 5 requests | 15 minutes |
| Property Registry | 100 requests | 1 minute |
| Payment Processing | 20 requests | 1 minute |
| Ownership Transfers | 10 requests | 1 minute |
| Public Search | 200 requests | 1 minute |

## **🔗 Integration Examples**

### **JavaScript/TypeScript**
```typescript
const response = await fetch('/api/detroit/properties', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const properties = await response.json();
```

### **Python**
```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get('/api/detroit/properties', headers=headers)
properties = response.json()
```

### **cURL**
```bash
curl -X GET \
  'http://localhost:5000/api/detroit/properties' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json'
```

This comprehensive API documentation enables developers to integrate with Detroit's civic blockchain platform, providing all necessary endpoints for property management, payment processing, ownership transfers, and transparency features.