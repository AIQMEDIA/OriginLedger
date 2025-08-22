import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Blockchain block schema
export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  index: integer("index").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  data: json("data").notNull(),
  prevHash: text("prev_hash").notNull(),
  hash: text("hash").notNull(),
});

// Participants schema
export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  role: text("role").notNull(), // manufacturer, shipper, retailer, etc.
  email: text("email"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Assets schema
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: text("asset_id").notNull().unique(), // PRD-2024-001
  name: text("name").notNull(),
  category: text("category"),
  currentStatus: text("current_status").notNull().default("manufactured"), // manufactured, shipped, delivered, etc.
  currentLocation: text("current_location"),
  batch: text("batch"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Supply chain events schema  
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockId: varchar("block_id").references(() => blocks.id),
  participantId: varchar("participant_id").references(() => participants.id),
  assetId: varchar("asset_id").references(() => assets.id),
  action: text("action").notNull(), // manufactured, shipped, received, etc.
  location: text("location"),
  metadata: json("metadata"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schemas
export const insertBlockSchema = createInsertSchema(blocks).omit({
  id: true,
  timestamp: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  timestamp: true,
});

// Types
export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Additional types for blockchain operations
export type BlockchainData = {
  user: string;
  role: string;
  action: string;
  asset_id: string;
  meta: Record<string, any>;
};

export type ParticipantStats = {
  manufacturers: number;
  shippers: number;
  retailers: number;
  total: number;
};

export type DashboardStats = {
  totalAssets: number;
  totalEvents: number;
  activeParticipants: number;
  chainIntegrity: number;
};

// Security Canary System Schema
export const securityCanaries = pgTable("security_canaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  eventType: text("event_type").notNull(),           // general, probe, api_probe, copyright, etc.
  ip: text("ip"),                                    // IP address (IPv4/IPv6)
  userAgent: text("user_agent"),                     // User-Agent header
  endpoint: text("endpoint").notNull(),              // Probed endpoint path
  method: text("method").notNull(),                  // HTTP method
  severity: text("severity").notNull(),              // High/medium/low
  context: json("context"),                          // Arbitrary context (headers, body, stacktrace, etc.)
  fakeResponse: text("fake_response"),               // e.g., "HTTP 503"
  alertTraceId: text("alert_trace_id"),              // For Arize Phoenix/integrations
});

// Security Audit Log Schema
export const securityAuditLog = pgTable("security_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  userId: varchar("user_id").references(() => participants.id),
  action: text("action").notNull(),                  // login, logout, asset_access, blockchain_write
  resource: text("resource"),                        // asset_id, endpoint, etc.
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: integer("success").notNull(),             // 1 for success, 0 for failure
  riskScore: integer("risk_score").default(0),      // 0-100 risk assessment
  metadata: json("metadata"),
});

// API Rate Limiting Schema
export const apiRateLimits = pgTable("api_rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(),          // IP or user ID
  endpoint: text("endpoint").notNull(),
  requestCount: integer("request_count").notNull().default(0),
  windowStart: timestamp("window_start").notNull().defaultNow(),
  blocked: integer("blocked").notNull().default(0), // 1 if blocked
  lastRequest: timestamp("last_request").notNull().defaultNow(),
});

// Security Canary Types
export type SecurityCanaryEvent = {
  eventType: 'general' | 'api_probe' | 'copyright' | 'competitive' | string;
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  severity: 'low' | 'medium' | 'high';
  context: Record<string, any>;
  fakeResponse: string;
  alertTraceId?: string;
  timestamp: Date;
};

export type SecurityAuditEntry = typeof securityAuditLog.$inferSelect;
export type InsertSecurityAuditEntry = z.infer<typeof insertSecurityAuditSchema>;

export type ApiRateLimit = typeof apiRateLimits.$inferSelect;

// Insert schemas for security tables
export const insertSecurityCanarySchema = createInsertSchema(securityCanaries).omit({
  id: true,
  timestamp: true,
});

export const insertSecurityAuditSchema = createInsertSchema(securityAuditLog).omit({
  id: true,
  timestamp: true,
});

export const insertApiRateLimitSchema = createInsertSchema(apiRateLimits).omit({
  id: true,
  windowStart: true,
  lastRequest: true,
});

// ========================
// DETROIT CIVIC BLOCKCHAIN SCHEMA
// ========================

// Property Registry for Detroit Municipal Services
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: text("property_id").notNull().unique(),             // City-assigned unique identifier
  address: text("address").notNull(),                             // Street address
  ownerId: varchar("owner_id").references(() => participants.id), // Current owner (resident/gov/etc.)
  assessedValue: integer("assessed_value"),                       // Latest city-assessed value (USD/cents)
  status: text("status").notNull().default("active"),             // active, in_transfer, foreclosed, etc.
  taxOwed: integer("tax_owed").notNull().default(0),              // Unpaid taxes in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  metadata: json("metadata")                                      // Parcel info, deeds, archives, etc.
});

// Crypto Payment Events for Municipal Services
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").references(() => properties.id),
  payerId: varchar("payer_id").references(() => participants.id),
  txHash: text("tx_hash"),                        // Crypto transaction hash (if on-chain)
  paymentMethod: text("payment_method").notNull(),// "usdc", "eth", "fiat"
  amount: integer("amount").notNull(),            // In cents for fiat, or smallest unit of crypto
  status: text("status").notNull().default("pending"), // pending, completed, failed
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  context: json("context")                        // Any gateway metadata, receipts, etc.
});

// Ownership Transfer with NFT/Fractional Support
export const ownerships = pgTable("ownerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").references(() => properties.id),
  ownerId: varchar("owner_id").references(() => participants.id),
  fraction: numeric("fraction").notNull().default("1.0"),   // 1.0 = full, 0.33 = 33% (fractionalization)
  acquiredAt: timestamp("acquired_at").notNull().defaultNow(),
  transferTx: text("transfer_tx"),                     // Blockchain/transaction hash
  metadata: json("metadata"),                          // Sale details, docs, proof
});

// Detroit Civic Types
export type Property = typeof properties.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Ownership = typeof ownerships.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertOwnership = z.infer<typeof insertOwnershipSchema>;

// Detroit Civic Insert Schemas
export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  timestamp: true,
});

export const insertOwnershipSchema = createInsertSchema(ownerships).omit({
  id: true,
  acquiredAt: true,
} as const);
