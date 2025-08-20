# OriginLedger - Complete Code Schema & Architecture

## Overview
OriginLedger is an enterprise-grade supply chain blockchain platform built with TypeScript, React, and Express. This document provides a comprehensive code-based schema for reconstructing or integrating with the platform.

## Core Data Models

### 1. Blockchain Schema (`shared/schema.ts`)

```typescript
// Blockchain Block Structure
export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey(),
  index: integer("index").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  data: json("data").notNull(), // BlockchainData
  prevHash: text("prev_hash").notNull(),
  hash: text("hash").notNull(),
});

// Supply Chain Participants
export const participants = pgTable("participants", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  role: text("role").notNull(), // "manufacturer" | "shipper" | "retailer" | "other"
  email: text("email"),
  status: text("status").notNull().default("active"),
  passwordHash: text("password_hash"), // bcrypt hashed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Trackable Assets
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey(),
  assetId: text("asset_id").notNull().unique(), // Human-readable ID like "PRD-2024-001"
  name: text("name").notNull(),
  category: text("category"), // "electronics", "food", "textiles", etc.
  currentStatus: text("current_status").notNull().default("manufactured"),
  currentLocation: text("current_location"),
  batch: text("batch"), // Batch/lot number for grouping
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Supply Chain Events (recorded on blockchain)
export const events = pgTable("events", {
  id: varchar("id").primaryKey(),
  blockId: varchar("block_id").references(() => blocks.id),
  participantId: varchar("participant_id").references(() => participants.id),
  assetId: varchar("asset_id").references(() => assets.id),
  action: text("action").notNull(), // "manufactured", "shipped", "received", "quality_check"
  location: text("location"),
  metadata: json("metadata"), // Flexible additional data
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Core Types
export type BlockchainData = {
  user: string;
  role: string;
  action: string;
  asset_id: string;
  meta: Record<string, any>;
};

export type Participant = {
  id: string;
  username: string;
  role: "manufacturer" | "shipper" | "retailer" | "other";
  email?: string;
  status: "active" | "inactive";
  createdAt: Date;
};

export type Asset = {
  id: string;
  assetId: string;
  name: string;
  category?: string;
  currentStatus: string;
  currentLocation?: string;
  batch?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

### 2. Subscription & Billing Schema (`shared/pricing-schema.ts`)

```typescript
// Subscription Plans (Free, Business, Enterprise, Custom)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(), // "free", "business", "enterprise", "custom"
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  pricePerUserMonth: decimal("price_per_user_month", { precision: 10, scale: 2 }),
  pricePerAssetMonth: decimal("price_per_asset_month", { precision: 10, scale: 2 }),
  customPricing: boolean("custom_pricing").default(false),
  maxUsers: integer("max_users"), // null = unlimited
  maxAssets: integer("max_assets"), // null = unlimited
  features: jsonb("features").$type<string[]>().default([]),
  trialDays: integer("trial_days").default(14),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
});

// Organization Subscriptions
export const organizationSubscriptions = pgTable("organization_subscriptions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  planId: text("plan_id").references(() => subscriptionPlans.id),
  status: text("status", { enum: ["trial", "active", "cancelled", "expired", "suspended"] }),
  billingCycle: text("billing_cycle", { enum: ["monthly", "annual"] }).default("monthly"),
  userCount: integer("user_count").default(1),
  assetCount: integer("asset_count").default(0),
  setupFee: decimal("setup_fee", { precision: 10, scale: 2 }).default("0"),
  annualDiscount: decimal("annual_discount", { precision: 3, scale: 2 }).default("0.15"),
});

// Billing & Usage Tracking
export const billingHistory = pgTable("billing_history", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").references(() => organizationSubscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  billingDate: timestamp("billing_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: text("status", { enum: ["pending", "paid", "failed", "refunded"] }),
});

export const usageMetrics = pgTable("usage_metrics", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").references(() => organizationSubscriptions.id),
  metricType: text("metric_type", { enum: ["users", "assets", "events", "api_calls", "storage"] }),
  value: integer("value").notNull(),
  period: text("period").notNull(), // "YYYY-MM" format
});
```

## API Endpoints Architecture

### 1. Authentication System (`/api/auth/*`)

```typescript
// JWT-based authentication with bcrypt password hashing
POST /api/auth/login
Body: { username: string, password: string }
Response: { token: string, user: { id, username, role } }

POST /api/auth/register  
Body: { username: string, password: string, role: string, email?: string }
Response: { message: string, user: Participant }

GET /api/auth/profile (requires JWT)
Response: { user: Participant }

PATCH /api/auth/profile (requires JWT)
Body: { email?: string, currentPassword?: string, newPassword?: string }
Response: { message: string, user: Participant }
```

### 2. Core Blockchain API (`/api/*`)

```typescript
// Participants Management
GET /api/participants
Query: { role?, status?, search?, page?, limit? }
Response: { participants: Participant[], total: number, pagination: {...} }

POST /api/participants (requires auth: manufacturer/other)
Body: InsertParticipant
Response: { participant: Participant }

// Assets Management  
GET /api/assets
Query: { search?, category?, status?, batch?, participantId?, sort?, page?, limit? }
Response: { assets: Asset[], total: number, filters: {...}, pagination: {...} }

POST /api/assets (requires auth: manufacturer)
Body: InsertAsset
Response: { asset: Asset }

// Events & Blockchain
GET /api/events
Query: { participantId?, assetId?, action?, startDate?, endDate?, page?, limit? }
Response: { events: Event[], total: number, pagination: {...} }

POST /api/events (requires auth: manufacturer/shipper/retailer)
Body: InsertEvent
Response: { event: Event, block: Block, message: string }

// Blockchain Operations
GET /api/blockchain
Response: { blockchain: Block[], stats: {...} }

POST /api/chain/validate
Response: { 
  isValid: boolean, 
  errors: string[], 
  totalBlocks: number,
  corruptedBlocks: number[] 
}

// Dashboard & Analytics
GET /api/dashboard-stats
Response: { 
  totalAssets: number, 
  totalEvents: number, 
  activeParticipants: number,
  activeBlockchain: boolean 
}

GET /api/recent-activities
Query: { limit? }
Response: { activities: ActivityRecord[] }

// Audit & Compliance
GET /api/audit-log
Query: { startDate?, endDate?, participantId?, assetId?, format? }
Response: CSV export or { auditEntries: AuditEntry[], summary: {...} }

// Health Monitoring
GET /api/health
Response: { 
  status: "healthy" | "unhealthy",
  blockchain: { totalBlocks, valid, lastBlockHash },
  participants: number,
  uptime: number 
}
```

### 3. Subscription System (`/api/subscription/*`)

```typescript
// Plan Management
GET /api/subscription/plans
Response: SubscriptionPlan[]

GET /api/subscription/plans/:id
Query: { users?, assets?, billing? }
Response: { plan: SubscriptionPlan, pricing: {...}, breakdown: {...} }

// Subscription Management (requires auth)
GET /api/subscription/subscription
Response: { subscription: OrganizationSubscription, plan: SubscriptionPlan }

PATCH /api/subscription/subscription
Body: { planId: string, billingCycle?: string, userCount?, assetCount? }
Response: { subscription: OrganizationSubscription, pricing: {...} }

POST /api/subscription/trial
Body: { planId: string, userCount: number, assetCount: number }
Response: { subscription: OrganizationSubscription, message: string }

// Billing & Usage
GET /api/subscription/billing
Query: { limit?, status? }
Response: { billingHistory: BillingHistory[] }

POST /api/subscription/usage
Body: { metricType: string, value: number, period: string }
Response: { usage: UsageMetrics }

GET /api/subscription/usage/:subscriptionId
Query: { period?, metricType? }
Response: { usage: UsageMetrics[] }
```

## Frontend Architecture

### 1. Component Structure

```typescript
// Core Layout Components
<MainNavigation /> // Role-based navigation with auth state
<AuthModal /> // Login/signup modal with form validation
<RoleGuard> // Access control wrapper component

// Page Components
<Dashboard /> // Landing page for unauthenticated, dashboard for authenticated
<Assets /> // Asset search, filtering, and management
<Participants /> // User management and registration
<Events /> // Event creation and tracking
<Blockchain /> // Blockchain explorer and validation
<Subscription /> // Plan selection and billing management
<Profile /> // User profile and password management
<Audit /> // Compliance reporting and CSV export

// Feature Components
<StatsCards /> // Dashboard statistics display
<AssetSearch /> // Advanced filtering interface
<EventForm /> // Supply chain event creation
<PricingCalculator /> // Subscription cost calculator
```

### 2. Authentication Context

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  user: Participant | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileData) => Promise<void>;
}

// Role-based access control
type UserRole = "manufacturer" | "shipper" | "retailer" | "other";

// Role permissions matrix:
// - manufacturer: Full access (assets, events, participants, audit)
// - shipper: Event creation, asset viewing, basic tracking
// - retailer: Event creation, asset viewing, basic tracking  
// - other: Audit access, testing, blockchain validation
```

### 3. State Management

```typescript
// TanStack Query for server state
const { data: assets } = useQuery({
  queryKey: ['/api/assets', filters],
  queryFn: () => api.getAssets(filters)
});

// Mutations with optimistic updates
const createAssetMutation = useMutation({
  mutationFn: api.createAsset,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    toast.success('Asset created successfully');
  }
});
```

## Security Implementation

### 1. Authentication & Authorization

```typescript
// JWT middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based access control
const requireRole = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Password hashing with bcrypt
const hashPassword = (password: string): string => {
  return bcrypt.hashSync(password, 10);
};
```

### 2. Input Validation

```typescript
// Express-validator schemas
const createAssetValidation = [
  body('assetId').notEmpty().matches(/^[A-Z]{3}-\d{4}-\d{3}$/).withMessage('Invalid asset ID format'),
  body('name').isLength({ min: 1, max: 100 }).withMessage('Name required (1-100 chars)'),
  body('category').optional().isIn(['electronics', 'food', 'textiles', 'automotive']),
  body('batch').optional().isAlphanumeric()
];

// Zod schemas for type safety
const insertAssetSchema = z.object({
  assetId: z.string().regex(/^[A-Z]{3}-\d{4}-\d{3}$/),
  name: z.string().min(1).max(100),
  category: z.enum(['electronics', 'food', 'textiles', 'automotive']).optional(),
  batch: z.string().optional()
});
```

## Blockchain Implementation

### 1. Block Structure

```typescript
interface Block {
  id: string;
  index: number;
  timestamp: Date;
  data: BlockchainData;
  prevHash: string;
  hash: string;
}

// Hash calculation
const calculateBlockHash = (block: Partial<Block>): string => {
  const { index, timestamp, data, prevHash } = block;
  const content = `${index}${timestamp}${JSON.stringify(data)}${prevHash}`;
  return crypto.createHash("sha256").update(content).digest("hex");
};

// Chain validation
const validateBlockchain = (chain: Block[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (let i = 1; i < chain.length; i++) {
    const currentBlock = chain[i];
    const previousBlock = chain[i - 1];
    
    // Verify hash integrity
    const expectedHash = calculateBlockHash(currentBlock);
    if (currentBlock.hash !== expectedHash) {
      errors.push(`Block ${i}: Hash mismatch`);
    }
    
    // Verify chain linkage
    if (currentBlock.prevHash !== previousBlock.hash) {
      errors.push(`Block ${i}: Previous hash mismatch`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
};
```

### 2. Event Recording

```typescript
// Creating blockchain entries for supply chain events
const recordSupplyChainEvent = async (eventData: InsertEvent): Promise<{ event: Event; block: Block }> => {
  // Create event record
  const event = await storage.createEvent(eventData);
  
  // Create blockchain entry
  const blockchain = await storage.getBlockchain();
  const lastBlock = blockchain[blockchain.length - 1];
  
  const blockData: BlockchainData = {
    user: event.participantId,
    role: 'manufacturer', // from participant lookup
    action: event.action,
    asset_id: event.assetId,
    meta: event.metadata || {}
  };
  
  const newBlock: Block = {
    id: randomUUID(),
    index: blockchain.length,
    timestamp: new Date(),
    data: blockData,
    prevHash: lastBlock?.hash || '0',
    hash: '' // calculated after
  };
  
  newBlock.hash = calculateBlockHash(newBlock);
  
  const savedBlock = await storage.createBlock(newBlock);
  return { event, block: savedBlock };
};
```

## Deployment Configuration

### 1. Environment Variables

```bash
# Required for production
NODE_ENV=production
JWT_SECRET=your-256-bit-secret
DATABASE_URL=postgresql://user:password@host:port/database

# Optional
PORT=5000
BCRYPT_ROUNDS=10
```

### 2. Build Configuration

```json
// package.json scripts
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "tsc && vite build",
    "start": "NODE_ENV=production node dist/server/index.js",
    "test": "jest"
  }
}
```

## Integration Points

### 1. Database Migration

```typescript
// Drizzle migrations for PostgreSQL
export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  }
};
```

### 2. External API Integration

```typescript
// Extensible for external integrations
interface ExternalProvider {
  validateAsset(assetId: string): Promise<boolean>;
  trackShipment(shipmentId: string): Promise<ShipmentStatus>;
  sendNotification(event: Event): Promise<void>;
}
```

## Demo Data & Testing

### 1. Sample Organizations

```typescript
const demoOrganizations = [
  {
    id: "acme-corp",
    name: "AcmeCorp Manufacturing",
    planId: "enterprise",
    userCount: 25,
    assetCount: 150
  },
  {
    id: "global-logistics", 
    name: "Global Logistics Solutions",
    planId: "business",
    userCount: 12,
    assetCount: 75
  }
];
```

### 2. Test Users

```typescript
const testUsers = [
  { username: "manufacturer1", password: "demo123", role: "manufacturer" },
  { username: "shipper1", password: "demo123", role: "shipper" },
  { username: "retailer1", password: "demo123", role: "retailer" }
];
```

## Key Features Summary

1. **Enterprise Authentication**: JWT tokens, bcrypt hashing, role-based access
2. **Blockchain Integrity**: SHA-256 hashing, chain validation, tamper detection  
3. **Advanced Search**: Multi-field filtering, pagination, sorting
4. **Subscription Billing**: 4-tier pricing, usage tracking, trial management
5. **Audit Compliance**: CSV exports, detailed logging, regulatory reporting
6. **Professional UI**: React components, responsive design, dark mode support
7. **API Documentation**: Comprehensive endpoints with validation
8. **Real-time Updates**: Live dashboard, health monitoring, statistics

This schema provides a complete foundation for rebuilding or integrating with the OriginLedger platform.